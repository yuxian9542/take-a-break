"""Simplified FastAPI backend for GLM-4-Voice demo.

Run with:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import array
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
from config import (
    FRAME_DURATION_MS, 
    SILENCE_THRESHOLD, 
    SAMPLE_RATE,
    NOISE_THRESHOLD_MULTIPLIER,
    NOISE_DETECTION_THRESHOLD
)
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
    
    # Calculate amplitude for debugging
    samples = array.array("h")
    samples.frombytes(pcm_bytes)
    avg_amp = sum(abs(sample) for sample in samples) / max(1, len(samples))
    max_amp = max(abs(sample) for sample in samples) if samples else 0
    
    # Background noise detection using unified 2-second sliding window
    # Calculate window size (number of chunks for 2-second window)
    NOISE_WINDOW_DURATION_MS = 2000  # 2 seconds, same as VAD window
    noise_window_size = int(NOISE_WINDOW_DURATION_MS / FRAME_DURATION_MS)  # 2000ms / 20ms = 100 chunks
    
    # Add current amplitude to background noise window
    state.background_noise_window.append(avg_amp)
    
    # Keep window size limited to 2 seconds
    while len(state.background_noise_window) > noise_window_size:
        state.background_noise_window.popleft()
    
    # Calculate background noise level from 2-second window average
    # Only use this if window is full and we haven't detected speech yet
    if not state.noise_detection_complete:
        if len(state.background_noise_window) >= noise_window_size:
            # Window is full - calculate background noise level
            state.background_noise_level = sum(state.background_noise_window) / len(state.background_noise_window)
            state.noise_detection_complete = True
            logger.info("🎯 [BACKGROUND NOISE] session=%s background_noise=%.1f (2-second window, %d chunks)", 
                       session_id, state.background_noise_level, len(state.background_noise_window))
        else:
            # Window not full yet - check if we should stop collecting due to speech
            # Use conservative threshold to detect speech early
            if avg_amp >= NOISE_DETECTION_THRESHOLD:
                # Speech detected during noise collection - use what we have
                if len(state.background_noise_window) >= 10:  # At least 200ms of samples
                    state.background_noise_level = sum(state.background_noise_window) / len(state.background_noise_window)
                    state.noise_detection_complete = True
                    logger.debug("🎯 [BACKGROUND NOISE] session=%s early speech detected, using %d chunks: background_noise=%.1f", 
                               session_id, len(state.background_noise_window), state.background_noise_level)
                else:
                    # Not enough samples yet - use fallback estimate
                    state.background_noise_level = SILENCE_THRESHOLD / NOISE_THRESHOLD_MULTIPLIER
                    state.noise_detection_complete = True
                    logger.debug("🎯 [BACKGROUND NOISE] session=%s early speech detected but only %d chunks, using fallback: background_noise=%.1f", 
                               session_id, len(state.background_noise_window), state.background_noise_level)
    
    # Update background noise level continuously from the 2-second window (if complete)
    if state.noise_detection_complete and len(state.background_noise_window) >= noise_window_size:
        # Recalculate from current window (continuously updated)
        state.background_noise_level = sum(state.background_noise_window) / len(state.background_noise_window)
    
    # Get background noise level for VAD (use estimated if not yet calculated)
    background_noise_level = state.background_noise_level
    if background_noise_level is None:
        # Estimate from fallback threshold (threshold = noise * multiplier, so noise = threshold / multiplier)
        background_noise_level = SILENCE_THRESHOLD / NOISE_THRESHOLD_MULTIPLIER
    
    # Calculate silence threshold for logging (1.5x background noise level)
    silence_threshold_for_logging = background_noise_level * 1.5
    logger.debug(
        "session=%s chunk size=%d duration=%.1fms avg_amp=%.1f max_amp=%d background_noise=%.1f silence_threshold=%.1f (1.5x)", 
        session_id, len(pcm_bytes), actual_duration_ms, avg_amp, max_amp,
        background_noise_level, silence_threshold_for_logging
    )
    
    # Check if speech is starting (transition from not speaking to speaking)
    was_speaking = state.vad_state.in_speech
    
    # Capture VAD state before update (so we can log final values if utterance finishes)
    speech_ms_before = state.vad_state.speech_ms
    silence_ms_before = state.vad_state.silence_ms
    
    state.pcm_buffer.append(pcm_bytes)

    utterance_finished = update_vad_state(
        state.vad_state,
        pcm_bytes,
        frame_duration_ms=actual_duration_ms,
        background_noise_level=background_noise_level,
    )
    
    # Log VAD state for debugging
    logger.debug(
        "session=%s VAD: in_speech=%s speech_ms=%.1f silence_ms=%.1f utterance_finished=%s",
        session_id, state.vad_state.in_speech, state.vad_state.speech_ms, 
        state.vad_state.silence_ms, utterance_finished
    )
    
    # Send notification when speech starts
    if not was_speaking and state.vad_state.in_speech:
        speech_start_time = time.time()
        logger.info("⏱️ [SPEECH START] session=%s speech started at %.3fs", session_id, speech_start_time)
        await send_json_safe(websocket, {
            "type": "speech_started",
            "message": "Listening..."
        })

    if not utterance_finished:
        logger.debug("session=%s awaiting more audio (buffer=%d chunks)", session_id, len(state.pcm_buffer))
        return

    if not state.pcm_buffer:
        logger.debug("Utterance finished but buffer empty")
        return
    
    # VAD detected end of utterance - log timing
    vad_complete_time = time.time()
    logger.info("⏱️ [VAD COMPLETE] session=%s VAD detected utterance end at %.3fs (speech_ms=%.1f, silence_ms=%.1f)", 
                session_id, vad_complete_time, speech_ms_before, silence_ms_before)
    
    # Process the complete utterance FIRST (before any async operations)
    pcm_payload = audio_utils.concat_pcm16(state.pcm_buffer)
    state.pcm_buffer.clear()
    logger.debug("⏱️ session=%s utterance processed, PCM length=%d", session_id, len(pcm_payload))

    # Check minimum audio length (at least 200ms) before attempting transcription
    # PCM16: 2 bytes per sample, 16kHz sample rate
    num_samples = len(pcm_payload) // 2
    audio_duration_ms = (num_samples / SAMPLE_RATE) * 1000
    MIN_AUDIO_DURATION_MS = 200  # 200ms minimum
    
    if audio_duration_ms < MIN_AUDIO_DURATION_MS:
        logger.warning(
            "session=%s audio too short (%.1fms < %dms), skipping transcription",
            session_id, audio_duration_ms, MIN_AUDIO_DURATION_MS
        )
        await send_json_safe(websocket, {
            "type": "error",
            "message": "Audio too short. Please speak longer."
        })
        return

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
        
        # Start background ASR transcription for current question (for UI display and history)
        async def transcribe_current():
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
        
        asyncio.create_task(transcribe_current())
        
        # Start GLM processing
        await process_glm_request(websocket, session_id, state, audio_b64)
    
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
    # Accept WebSocket connection from any origin
    # CORS middleware doesn't apply to WebSocket, so we need to accept explicitly
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

