from __future__ import annotations

import base64
import logging
import os
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional

from dotenv import load_dotenv
from zhipuai import ZhipuAI
import whisper
import torch


logger = logging.getLogger(__name__)


class GlmVoiceClient:
    """Adapter around the GLM-4-Voice API."""

    def __init__(self, api_key: Optional[str] = None, whisper_model_name: str = "medium") -> None:
        """Initialize the GLM-4-Voice HTTP client and local Whisper model."""
        env_root = Path(__file__).resolve().parents[1]
        env_files = [env_root / ".env.local", env_root / ".env"]
        loaded = False
        for candidate in env_files:
            if candidate.exists():
                load_dotenv(dotenv_path=candidate)
                loaded = True
                break
        if not loaded:
            load_dotenv()
        
        # GLM-4-Voice client
        glm_key = api_key or os.getenv("GLM_API_KEY")
        if not glm_key:
            raise RuntimeError(
                "GLM_API_KEY is not set. Please export it before starting the server."
            )
        self.client = ZhipuAI(api_key=glm_key)
        
        # Thread pool for parallel transcription
        self.executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="whisper-")
        
        # Load local Whisper model for ASR
        # Models: tiny, base, small, medium, large
        # 'medium' provides better accuracy with moderate speed
        logger.info(f"Loading Whisper model: {whisper_model_name}...")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Fix SSL certificate verification issue on macOS
        import ssl
        import urllib.request
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # Temporarily disable SSL verification for model download
        old_opener = urllib.request._opener
        opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=ssl_context))
        urllib.request.install_opener(opener)
        
        try:
            self.whisper_model = whisper.load_model(whisper_model_name, device=device)
            logger.info(f"Whisper model loaded on {device}")
        finally:
            # Restore original opener
            urllib.request.install_opener(old_opener)
            urllib.request._opener = old_opener
        
        logger.info("GlmVoiceClient initialized with GLM-4-Voice and local Whisper.")

    def transcribe_audio(self, audio_b64: str, language: Optional[str] = None) -> Optional[str]:
        """
        Transcribe audio to text using local Whisper model.
        
        Args:
            audio_b64: Base64-encoded WAV audio
            language: Language code ('zh' for Chinese, 'en' for English, None for auto-detect)
        """
        import tempfile
        
        # Decode base64 audio to bytes and save to temp file
        audio_bytes = base64.b64decode(audio_b64)
        
        # Save to a temporary file (Whisper requires a file path)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
            temp_audio.write(audio_bytes)
            temp_path = temp_audio.name
        
        try:
            # Transcribe using local Whisper model
            result = self.whisper_model.transcribe(
                temp_path,
                language=language,  # 'zh', 'en', or None for auto-detect
                fp16=False  # Set to True if using CUDA for faster inference
            )
            
            transcript = result["text"].strip()
            logger.info("Whisper transcription: %s", transcript)
            return transcript or None
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    def chat_stream(
        self,
        audio_b64: str,
        history_text: Optional[str] = None,
        language: Optional[str] = None,
        system_prompt: Optional[str] = None,
    ):
        """
        Send one utterance to GLM-4-Voice and stream the response.
        
        OPTIMIZATION: Transcription happens in parallel with GLM-4-Voice streaming!
        We don't need the current transcript for the current turn - only for the next turn's history.
        
        Args:
            audio_b64: Base64-encoded WAV audio of user's question
            history_text: Conversation history as text (e.g., "User: hello\nAssistant: hi\nUser: ...")
            language: Language code for Whisper ('zh' for Chinese, 'en' for English, None for auto-detect)
        
        Yields:
            Dict with 'type' field:
            - {'type': 'transcript', 'text': str} - User's transcript (async, may come after audio)
            - {'type': 'audio_chunk', 'data': bytes, 'audio_id': str} - Audio chunk
            - {'type': 'text', 'content': str} - Assistant's text response
            - {'type': 'done'} - Stream complete
        """
        if not audio_b64:
            logger.warning("Empty audio payload passed to chat_stream.")
            return

        # Start transcription in parallel (non-blocking)
        lang_name = "Chinese" if language == "zh" else "English" if language == "en" else "auto-detect"
        logger.info(f"\n{'='*60}")
        logger.info(f"⚡ Starting Whisper transcription in background ({lang_name})...")
        logger.info(f"⚡ Starting GLM-4-Voice streaming in parallel...")
        logger.info(f"{'='*60}\n")
        
        # Submit transcription task to thread pool (non-blocking!)
        logger.info("📝 Submitting Whisper transcription to executor...")
        transcript_future = self.executor.submit(self.transcribe_audio, audio_b64, language)
        logger.info("✅ Whisper transcription task submitted!")
        
        # Store the future IMMEDIATELY so backend can access it during streaming
        # Cancel any old transcription that's still running
        logger.info("🔄 Storing _last_transcript_future...")
        if hasattr(self, '_last_transcript_future'):
            old_future = self._last_transcript_future
            if not old_future.done():
                logger.info("Cancelling previous transcription task")
        self._last_transcript_future = transcript_future
        logger.info("✅ _last_transcript_future stored! Now backend can find it.")
        
        # Build messages with system prompt for history
        messages: List[Dict] = []
        
        # Add role-based system prompt if provided
        if system_prompt:
            logger.info("Using role-based system prompt")
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        if history_text:
            # Multi-turn: add system message with conversation history
            logger.info("Adding conversation history to system prompt")
            messages.append({
                "role": "system",
                "content": f"Previous conversation:\n{history_text}"
            })
            
            # Add current user audio message
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "input_audio",
                        "input_audio": {"data": audio_b64, "format": "wav"},
                    }
                ],
            })
        else:
            # First turn: audio only (no transcript needed)
            logger.info("First turn - audio only, no history")
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "input_audio",
                        "input_audio": {"data": audio_b64, "format": "wav"},
                    }
                ],
            })
        logger.info("Sending %d messages to GLM-4-Voice", len(messages))

        import time
        request_start = time.time()
        
        try:
            logger.info("Starting GLM-4-Voice STREAMING request...")
            stream = self.client.chat.completions.create(
                model="glm-4-voice",
                messages=messages,
                stream=True,  # Enable streaming!
                max_tokens=4095,  # Maximum tokens for response
            )
            request_time = time.time() - request_start
            logger.info("Request created in %.2fs", request_time)
        except Exception:
            logger.exception("GLM-4-Voice API request failed.")
            raise

        # Process streaming response
        assistant_text_parts = []
        audio_id = None
        chunk_count = 0
        first_chunk_time = None
        
        logger.debug("Waiting for first chunk from GLM-4-Voice...")
        
        for chunk in stream:
            if first_chunk_time is None:
                first_chunk_time = time.time() - request_start
                logger.info("FIRST CHUNK received in %.2fs (TTFB)", first_chunk_time)
            
            chunk_count += 1
            
            if not chunk.choices:
                continue
                
            delta = chunk.choices[0].delta
            
            # Extract audio chunk
            if hasattr(delta, "audio") and delta.audio:
                audio_payload = delta.audio
                # Access attributes directly (not dict methods)
                audio_data = getattr(audio_payload, "data", None)
                current_audio_id = getattr(audio_payload, "id", None)
                
                if current_audio_id:
                    audio_id = current_audio_id
                
                if audio_data:
                    audio_bytes = base64.b64decode(audio_data)
                    logger.debug("Audio chunk #%d: %d bytes", chunk_count, len(audio_bytes))
                    yield {
                        'type': 'audio_chunk',
                        'data': audio_bytes,
                        'audio_id': audio_id
                    }
            
            # Extract text content
            if hasattr(delta, "content") and delta.content:
                text_part = delta.content
                if isinstance(text_part, str) and text_part.strip():
                    assistant_text_parts.append(text_part)
        
        # Combine all text parts
        assistant_text = "".join(assistant_text_parts).strip() if assistant_text_parts else None
        
        if assistant_text:
            logger.info("Complete assistant reply: %s", assistant_text)
            yield {'type': 'text', 'content': assistant_text}
        
        total_time = time.time() - request_start
        logger.info("Stream complete! Total time: %.2fs, Chunks: %d, TTFB: %.2fs", 
                   total_time, chunk_count, first_chunk_time or 0)
        
        # Signal stream is done - don't wait for transcription!
        yield {'type': 'done'}
        
        # Note: We don't yield the transcript here because:
        # 1. The generator can't yield after the function returns
        # 2. The transcript is only needed for the NEXT turn's history
        # 3. We'll handle it in the backend by storing the future in session state
        
        # Store the transcript future in case we need it
        # (The backend will poll this for the next turn)
        if hasattr(self, '_last_transcript_future'):
            # Cancel any old transcription that's still running
            old_future = self._last_transcript_future
            if not old_future.done():
                logger.info("Cancelling previous transcription task")
        
        self._last_transcript_future = transcript_future
    
    def get_last_transcript(self, timeout: float = 0.1) -> Optional[str]:
        """
        Get the transcript from the last chat_stream call.
        
        Args:
            timeout: Max seconds to wait (default: 0.1 for quick check)
        
        Returns:
            Transcript text or None if not ready/failed
        """
        if not hasattr(self, '_last_transcript_future'):
            return None
        
        future = self._last_transcript_future
        if not future.done():
            # Don't block - just check if it's ready
            try:
                return future.result(timeout=timeout)
            except Exception:
                return None
        
        # Already done - get result
        try:
            transcript = future.result()
            return transcript if transcript else None
        except Exception as e:
            logger.warning(f"Failed to get transcript: {e}")
            return None
    
    def clear_last_transcript(self):
        """Clear the stored transcript future (call when starting a new session)."""
        if hasattr(self, '_last_transcript_future'):
            delattr(self, '_last_transcript_future')
            logger.debug("Cleared stored transcript")
