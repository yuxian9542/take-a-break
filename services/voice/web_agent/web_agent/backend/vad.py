"""Extremely simple server-side VAD utilities.

TODO: Replace with a more robust solution (e.g. webrtcvad, Silero VAD).
"""

from __future__ import annotations

import array
from collections import deque
from dataclasses import dataclass, field

from config import MAX_SILENCE_MS, MIN_SPEECH_MS, FRAME_DURATION_MS


@dataclass
class VadState:
    silence_ms: float = 0.0
    speech_ms: float = 0.0  # Track how long we've been hearing speech
    in_speech: bool = False
    amplitude_window: deque = field(default_factory=deque)  # 2-second sliding window for silence detection (completion)
    activation_window: deque = field(default_factory=deque)  # Short sliding window for speech activation (initiation)


def calculate_amplitude(pcm_bytes: bytes) -> float:
    """Calculate average absolute amplitude of PCM samples."""
    if not pcm_bytes:
        return 0.0

    samples = array.array("h")
    samples.frombytes(pcm_bytes)
    avg_amp = sum(abs(sample) for sample in samples) / max(1, len(samples))
    return avg_amp


def is_silence_using_window_average(
    current_amplitude: float,
    amplitude_window: deque,
    activation_window: deque,
    background_noise_level: float,
    frame_duration_ms: float,
    in_speech: bool,
    activation_window_ms: int = 250,  # 250ms for activation (short window for fast response)
    completion_window_ms: int = 2000,  # 2 seconds for completion (long window to smooth noise)
) -> bool:
    """
    Determine if current chunk is silence using different window strategies:
    
    - For speech initiation (when not in speech): Uses a short sliding window (250ms)
      for fast, responsive activation while rejecting brief noise spikes
    - For silence detection (when in speech): Uses a longer sliding window (2 seconds)
      to smooth out noise spikes and detect true silence for completion
    """
    # Threshold is 1.5x background noise level
    threshold = background_noise_level * 1.5
    
    # For speech initiation (not in speech yet), use short activation window
    if not in_speech:
        # Calculate activation window size (250ms = ~12-13 chunks at 20ms per chunk)
        activation_window_size = int(activation_window_ms / frame_duration_ms)
        
        # Add current amplitude to activation window
        activation_window.append(current_amplitude)
        
        # Keep window size limited
        while len(activation_window) > activation_window_size:
            activation_window.popleft()
        
        # Also add to main amplitude window for when we transition to speech
        amplitude_window.append(current_amplitude)
        completion_window_size = int(completion_window_ms / frame_duration_ms)
        while len(amplitude_window) > completion_window_size:
            amplitude_window.popleft()
        
        # Use short window average for activation (needs at least 100ms of data)
        min_activation_window_size = int(100 / frame_duration_ms)  # 100ms = 5 chunks
        
        if len(activation_window) < min_activation_window_size:
            # Window not full enough yet - use current chunk
            return current_amplitude < threshold
        
        # Calculate average amplitude over the short activation window
        activation_avg = sum(activation_window) / len(activation_window)
        
        # If average amplitude in short window is below threshold, it's silence
        return activation_avg < threshold
    
    # For silence detection (already in speech), use long completion window
    # Calculate completion window size (2 seconds = 100 chunks at 20ms per chunk)
    completion_window_size = int(completion_window_ms / frame_duration_ms)
    
    # Add current amplitude to completion window
    amplitude_window.append(current_amplitude)
    
    # Keep window size limited
    while len(amplitude_window) > completion_window_size:
        amplitude_window.popleft()
    
    # Only use window average if window is full enough (at least 500ms of data)
    min_window_size = int(500 / frame_duration_ms)  # 500ms = 25 chunks
    
    if len(amplitude_window) < min_window_size:
        # Window not full enough yet - use current chunk
        return current_amplitude < threshold
    
    # Calculate average amplitude over the 2-second sliding window
    window_avg = sum(amplitude_window) / len(amplitude_window)
    
    # If average amplitude in window is below threshold, it's silence
    return window_avg < threshold


def update_vad_state(
    state: VadState,
    pcm_bytes: bytes,
    frame_duration_ms: float,
    background_noise_level: float,
) -> bool:
    """
    Update VAD state with a chunk and return True if the utterance has ended.
    
    Uses different window strategies for activation vs completion:
    - Speech activation: 250ms short window for fast, responsive detection
    - Silence detection: 2-second long window to smooth out noise spikes
    
    Compares average amplitude to 1.5x background noise level.
    
    Tracks both speech duration and silence duration to avoid:
    - Triggering on very short noises (must have MIN_SPEECH_MS of speech)
    - Waiting too long after speech ends (MAX_SILENCE_MS of silence)
    """
    # Calculate current chunk amplitude
    current_amplitude = calculate_amplitude(pcm_bytes)
    
    # Use different window strategies for activation vs completion:
    # - For speech initiation: Uses short window (250ms) for fast, responsive activation
    # - For silence detection: Uses long window (2 seconds) to smooth noise spikes
    silence = is_silence_using_window_average(
        current_amplitude,
        state.amplitude_window,
        state.activation_window,
        background_noise_level,
        frame_duration_ms,
        state.in_speech,  # Pass current speech state for different detection logic
        activation_window_ms=250,  # 250ms short window for activation
        completion_window_ms=2000,  # 2-second window for completion
    )

    if silence:
        state.silence_ms += frame_duration_ms
    else:
        # Non-silence detected - this is real speech
        # Reset silence tracking and continue accumulating speech
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
        state.amplitude_window.clear()  # Clear completion window for next utterance
        state.activation_window.clear()  # Clear activation window for next utterance
        return True

    return False

