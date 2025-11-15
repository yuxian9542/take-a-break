"""Session state helpers for the realtime voice demo."""

from __future__ import annotations

import asyncio
from collections import deque
from concurrent.futures import Future
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set

from vad import VadState


@dataclass
class SessionState:
    pcm_buffer: List[bytes] = field(default_factory=list)
    vad_state: VadState = field(default_factory=VadState)
    # Text-based conversation history for multi-turn
    # Format: "User: hello\nAssistant: hi\nUser: how are you?\nAssistant: ..."
    history_text: str = ""
    # Language for Whisper ASR: 'zh' (Chinese), 'en' (English), or None (auto-detect)
    language: Optional[str] = None
    # Pending user transcript from current turn (from Whisper ASR)
    pending_user_transcript: Optional[str] = None
    # Pending assistant text from the current turn (for next turn's history)
    pending_assistant_text: Optional[str] = None
    # Active ASR transcription future (for cleanup on disconnect)
    asr_future: Optional[Future] = None
    # Active background tasks (for cancellation on disconnect)
    background_tasks: Set[asyncio.Task] = field(default_factory=set)
    # WebSocket closed flag to prevent sending messages after disconnect
    is_closed: bool = False
    # Adaptive threshold detection using 2-second sliding window
    background_noise_window: deque = field(default_factory=deque)  # 2-second sliding window of amplitude values for noise detection
    background_noise_level: Optional[float] = None  # Raw background noise level (average amplitude over 2-second window)
    noise_detection_complete: bool = False  # Whether we've finished collecting background noise (2-second window filled)

