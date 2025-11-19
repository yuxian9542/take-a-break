"""Session state helpers for the realtime voice demo."""

from __future__ import annotations

import asyncio
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
    # System prompt derived from client context (e.g., location snapshot)
    system_prompt: Optional[str] = None
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

