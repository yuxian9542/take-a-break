"""Extremely simple server-side VAD utilities.

TODO: Replace with a more robust solution (e.g. webrtcvad, Silero VAD).
"""

from __future__ import annotations

import array
from dataclasses import dataclass

from config import MAX_SILENCE_MS, MIN_SPEECH_MS


@dataclass
class VadState:
    silence_ms: float = 0.0
    speech_ms: float = 0.0  # Track how long we've been hearing speech
    in_speech: bool = False


def is_silence(pcm_bytes: bytes, amplitude_threshold: int) -> bool:
    """Return True if the average absolute amplitude is below the threshold."""
    if not pcm_bytes:
        return True

    samples = array.array("h")
    samples.frombytes(pcm_bytes)
    avg_amp = sum(abs(sample) for sample in samples) / max(1, len(samples))
    return avg_amp < amplitude_threshold


def update_vad_state(
    state: VadState,
    pcm_bytes: bytes,
    frame_duration_ms: float,
    amplitude_threshold: int,
) -> bool:
    """
    Update VAD state with a chunk and return True if the utterance has ended.
    
    Now tracks both speech duration and silence duration to avoid:
    - Triggering on very short noises (must have MIN_SPEECH_MS of speech)
    - Waiting too long after speech ends (MAX_SILENCE_MS of silence)
    """
    silence = is_silence(pcm_bytes, amplitude_threshold)

    if silence:
        state.silence_ms += frame_duration_ms
    else:
        state.silence_ms = 0.0
        state.speech_ms += frame_duration_ms
        state.in_speech = True

    # Only trigger end-of-speech if:
    # 1. We've heard enough speech (MIN_SPEECH_MS)
    # 2. Followed by enough silence (MAX_SILENCE_MS)
    if state.in_speech and state.speech_ms >= MIN_SPEECH_MS and state.silence_ms >= MAX_SILENCE_MS:
        state.silence_ms = 0.0
        state.speech_ms = 0.0
        state.in_speech = False
        return True

    return False

