"""Simplified FastAPI backend for GLM-4-Voice demo.

Run with:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from typing import Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Local imports from same directory
from glm_voice_client import GlmVoiceClient
import audio_utils
from config import FRAME_DURATION_MS, SILENCE_THRESHOLD, SAMPLE_RATE
from session_manager import SessionState
from vad import update_vad_state

# Use uvicorn's logger to ensure console output
logger = logging.getLogger("uvicorn")

app = FastAPI(title="GLM-4-Voice Simple Demo")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

glm_client = GlmVoiceClient()
sessions: Dict[str, SessionState] = {}


@app.get("/health")
async def health_check() -> Dict[str, str]:
    return {"status": "ok"}


async def send_json_safe(websocket: WebSocket, payload: Dict) -> None:
    """Send JSON message to WebSocket, handling disconnections gracefully."""
    if websocket.client_state.name == "CONNECTED":
        await websocket.send_json(payload)


def get_session(session_id: str) -> SessionState:
    if session_id not in sessions:
        sessions[session_id] = SessionState()
    return sessions[session_id]


async def handle_audio_chunk(
    websocket: WebSocket,
    session_id: str,
    state: SessionState,
    message: Dict,
) -> None:
    data_b64 = message.get("data")
    if not data_b64:
        await send_json_safe(websocket, {"type": "error", "message": "Missing audio data"})
        return

    pcm_bytes = audio_utils.b64_to_bytes(data_b64)
    num_samples = len(pcm_bytes) // 2
    actual_duration_ms = (num_samples / SAMPLE_RATE) * 1000
    
    logger.info("session=%s chunk size=%d duration=%.1fms", session_id, len(pcm_bytes), actual_duration_ms)
    
    # Check if speech is starting (transition from not speaking to speaking)
    was_speaking = state.vad_state.in_speech
    
    state.pcm_buffer.append(pcm_bytes)

    utterance_finished = update_vad_state(
        state.vad_state,
        pcm_bytes,
        frame_duration_ms=actual_duration_ms,
        amplitude_threshold=SILENCE_THRESHOLD,
    )
    
    # Send notification when speech starts
    if not was_speaking and state.vad_state.in_speech:
        speech_start_time = time.time()
        logger.info("=" * 80)
        logger.info("⏱️ [SPEECH START] session=%s speech started at %.3fs", session_id, speech_start_time)
        logger.info("=" * 80)
        await send_json_safe(websocket, {
            "type": "speech_started",
            "message": "Listening..."
        })

    if not utterance_finished:
        logger.info("session=%s awaiting more audio (buffer=%d chunks)", session_id, len(state.pcm_buffer))
        return

    if not state.pcm_buffer:
        logger.debug("Utterance finished but buffer empty")
        return
    
    # VAD detected end of utterance - log timing
    vad_complete_time = time.time()
    logger.info("=" * 80)
    logger.info("⏱️ [VAD COMPLETE] session=%s VAD detected utterance end at %.3fs", session_id, vad_complete_time)
    logger.info("=" * 80)
    
    # Process the complete utterance FIRST (before any async operations)
    pcm_payload = audio_utils.concat_pcm16(state.pcm_buffer)
    state.pcm_buffer.clear()
    logger.info("⏱️ session=%s utterance processed, PCM length=%d", session_id, len(pcm_payload))

    # Convert audio for ASR and GLM
    user_wav = audio_utils.pcm16_to_wav_bytes(pcm_payload)
    audio_b64 = audio_utils.bytes_to_b64(user_wav)
    
    # IMMEDIATELY signal ASR start to stop frontend from sending more audio chunks
    # This clears the WebSocket queue so subsequent messages arrive quickly
    await send_json_safe(websocket, {
        "type": "asr_start",
        "message": "Transcribing your question..."
    })
    logger.info("⏱️ [ASR START] session=%s sent asr_start immediately after VAD", session_id)
    
    # Send GLM start message immediately after ASR start
    await send_json_safe(websocket, {
        "type": "glm_start",
        "message": "AI is thinking..."
    })
    logger.info("⏱️ [GLM START] session=%s sent glm_start immediately after asr_start", session_id)
    
    # Launch everything in a background task so audio handler can return immediately
    # This allows new audio chunks to be processed for next utterance while we handle this one
    async def process_utterance_async():
        try:
            # Start background ASR transcription for current question (for UI display and history)
            async def transcribe_current():
                try:
                    loop = asyncio.get_event_loop()
                    transcript = await loop.run_in_executor(
                        None,
                        lambda: glm_client.transcribe_audio(audio_b64, state.language)
                    )
                    if transcript:
                        asr_complete_time = time.time()
                        logger.info("=" * 80)
                        logger.info("⏱️ [ASR COMPLETE] session=%s at %.3fs - Transcript: %s", session_id, asr_complete_time, transcript)
                        logger.info("=" * 80)
                        # Save transcript for history
                        state.pending_user_transcript = transcript
                        # Send to frontend
                        await send_json_safe(websocket, {"type": "asr_complete", "text": transcript})
                except Exception as e:
                    # Log but don't fail the whole process if transcription fails
                    logger.warning("⏱️ [ASR ERROR] session=%s - Transcription failed: %s", session_id, e)
            
            asyncio.create_task(transcribe_current())
            
            # Start GLM processing
            await process_glm_request(websocket, session_id, state, audio_b64)
        except Exception as e:
            # Catch any unexpected errors in the async processing
            error_type = type(e).__name__
            logger.exception("⏱️ [PROCESS ERROR] session=%s - Error in process_utterance_async: %s", session_id, error_type)
    
    # Launch the processing task and return immediately so audio handler doesn't block
    asyncio.create_task(process_utterance_async())

async def process_glm_request(websocket, session_id, state, audio_b64):
    """Process GLM-4-Voice request and stream audio chunks back to client."""
    start_time = time.time()
    logger.info("⏱️ session=%s STARTING GLM-4-Voice request at %.3fs", session_id, start_time)
    
    # Log the current history being sent
    if state.history_text:
        logger.info("=" * 80)
        logger.info("📜 [HISTORY SENT TO GLM] session=%s", session_id)
        logger.info("History content:\n%s", state.history_text)
        logger.info("=" * 80)
    else:
        logger.info("📜 [NO HISTORY] session=%s - First turn", session_id)
    
    assistant_text_parts = []
    chunk_idx = 0
    first_chunk_received = False
    
    try:
        stream_gen = glm_client.chat_stream(
            audio_b64=audio_b64,
            history_text=state.history_text if state.history_text else None,
            language=state.language,
        )
        
        # Iterate through streaming results
        for stream_item in stream_gen:
            # Store the ASR future on first iteration for cleanup on disconnect
            if not state.asr_future and hasattr(glm_client, '_last_transcript_future'):
                state.asr_future = glm_client._last_transcript_future
            
            item_type = stream_item.get('type')
            
            if item_type == 'audio_chunk':
                audio_chunk = stream_item.get('data')
                if audio_chunk:
                    if not first_chunk_received:
                        ttfb = time.time() - start_time
                        logger.info("=" * 80)
                        logger.info("⏱️ [AUDIO FIRST CHUNK] session=%s TTFB: %.3f seconds", session_id, ttfb)
                        logger.info("=" * 80)
                        first_chunk_received = True
                    
                    await send_json_safe(websocket, {
                        "type": "reply_audio_chunk",
                        "data": audio_utils.bytes_to_b64(audio_chunk),
                        "isLast": False,
                    })
                    chunk_idx += 1
            
            elif item_type == 'text':
                assistant_text = stream_item.get('content')
                if assistant_text:
                    assistant_text_parts.append(assistant_text)
                    glm_complete_time = time.time()
                    logger.info("=" * 80)
                    logger.info("⏱️ [GLM COMPLETE] session=%s at %.3fs - Response: %s", session_id, glm_complete_time, assistant_text)
                    logger.info("=" * 80)
                    await send_json_safe(websocket, {"type": "glm_complete", "text": assistant_text})
            
            elif item_type == 'done':
                stream_end_time = time.time()
                logger.info("=" * 80)
                logger.info("⏱️ [AUDIO STREAM END] session=%s at %.3fs - Total chunks: %d", session_id, stream_end_time, chunk_idx)
                logger.info("=" * 80)
                await send_json_safe(websocket, {
                    "type": "reply_audio_chunk",
                    "data": "",
                    "isLast": True,
                })
                state.pending_assistant_text = "".join(assistant_text_parts) if assistant_text_parts else "[audio reply]"
                
                # Update history with user transcript (from Whisper) and assistant response
                # Run in background with timeout - if Whisper not ready in 3s, use placeholder
                async def update_history_async():
                    # Wait up to 3 seconds for Whisper transcript
                    for _ in range(30):  # 30 * 0.1s = 3s
                        if state.pending_user_transcript:
                            break
                        await asyncio.sleep(0.1)
                    
                    # Use transcript if available, otherwise placeholder
                    user_text = state.pending_user_transcript if state.pending_user_transcript else "[audio input]"
                    
                    if state.pending_assistant_text:
                        if state.history_text:
                            state.history_text += f"\nUser: {user_text}\nAssistant: {state.pending_assistant_text}"
                        else:
                            state.history_text = f"User: {user_text}\nAssistant: {state.pending_assistant_text}"
                        logger.info("=" * 80)
                        logger.info("📝 [HISTORY UPDATED] session=%s - %d chars", session_id, len(state.history_text))
                        logger.info("New history:\n%s", state.history_text)
                        logger.info("=" * 80)
                        
                        # Clear pending texts for next turn
                        state.pending_user_transcript = None
                        state.pending_assistant_text = None
                
                # Fire and forget - don't block the stream completion
                asyncio.create_task(update_history_async())
    
    except Exception as e:
        # Handle stream interruptions gracefully (e.g., when user stops chat)
        error_type = type(e).__name__
        if "RemoteProtocolError" in error_type or "ConnectionClosed" in error_type or "IncompleteRead" in error_type:
            logger.info("⏱️ [STREAM INTERRUPTED] session=%s - Connection closed by client: %s", session_id, error_type)
        else:
            logger.exception("⏱️ [STREAM ERROR] session=%s - Unexpected error during streaming", session_id)
        
        # Ensure we mark the stream as done even if interrupted
        try:
            if websocket.client_state.name == "CONNECTED":
                await send_json_safe(websocket, {
                    "type": "reply_audio_chunk",
                    "data": "",
                    "isLast": True,
                })
        except Exception:
            # WebSocket might already be closed, ignore
            pass


async def handle_control_message(
    websocket: WebSocket,
    session_id: str,
    state: SessionState,
    message: Dict,
) -> None:
    action = message.get("action")
    
    if action == "set_language":
        language = message.get("language")
        if language in ["zh", "en", None]:
            state.language = language
            lang_name = "Chinese" if language == "zh" else "English" if language == "en" else "auto-detect"
            logger.info("session=%s language set to: %s", session_id, lang_name)
            await send_json_safe(websocket, {"type": "info", "message": f"Language: {lang_name}"})
        else:
            await send_json_safe(websocket, {"type": "error", "message": f"Invalid language: {language}"})
    else:
        await send_json_safe(websocket, {"type": "error", "message": f"Unknown action: {action}"})


@app.websocket("/ws/voice")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    session_id = str(uuid.uuid4())
    state = get_session(session_id)
    
    # Clear any stored transcript from previous sessions
    glm_client.clear_last_transcript()
    
    await send_json_safe(websocket, {"type": "info", "message": f"Connected: {session_id}"})
    logger.info("Client connected: %s", session_id)

    try:
        while True:
            msg = await websocket.receive()
            if msg["type"] == "websocket.disconnect":
                break
            
            if "text" in msg and msg["text"]:
                raw_payload = msg["text"]
            elif "bytes" in msg and msg["bytes"]:
                raw_payload = msg["bytes"].decode("utf-8")
            else:
                continue

            payload = json.loads(raw_payload)
            msg_type = payload.get("type")
            
            if msg_type == "audio_chunk":
                await handle_audio_chunk(websocket, session_id, state, payload)
            elif msg_type == "control":
                await handle_control_message(websocket, session_id, state, payload)
                
    except WebSocketDisconnect:
        logger.info("Client disconnected: %s", session_id)
    finally:
        logger.info("Cleaning up session: %s", session_id)
        # Cancel any running ASR transcription
        if state.asr_future and not state.asr_future.done():
            state.asr_future.cancel()
        sessions.pop(session_id, None)

