"""Helpers for manipulating audio payloads."""

from __future__ import annotations

import base64
import io
import wave
from typing import Iterable, List

from config import CHANNELS, SAMPLE_RATE, SAMPLE_WIDTH


def b64_to_bytes(b64_str: str) -> bytes:
    return base64.b64decode(b64_str)


def bytes_to_b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def pcm16_to_wav_bytes(pcm_bytes: bytes) -> bytes:
    """Wrap raw PCM16 (mono @ 16 kHz) inside a WAV container."""
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm_bytes)
    return buffer.getvalue()


def wav_bytes_to_pcm16(wav_bytes: bytes) -> bytes:
    """Extract the PCM16 payload from WAV bytes."""
    with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
        if wf.getnchannels() != CHANNELS or wf.getsampwidth() != SAMPLE_WIDTH:
            raise ValueError(
                "Unexpected WAV format: "
                f"{wf.getnchannels()} channels, {wf.getsampwidth()}-byte samples"
            )
        frames = wf.readframes(wf.getnframes())
    return frames


def concat_pcm16(chunks: Iterable[bytes]) -> bytes:
    return b"".join(chunks)


def chunk_pcm16(pcm_bytes: bytes, chunk_duration_ms: int) -> List[bytes]:
    """Split PCM16 audio into fixed-duration chunks."""
    if chunk_duration_ms <= 0:
        raise ValueError("chunk_duration_ms must be positive")
    frame_size = int(SAMPLE_RATE * SAMPLE_WIDTH * chunk_duration_ms / 1000)
    if frame_size == 0:
        frame_size = SAMPLE_WIDTH

    return [pcm_bytes[i : i + frame_size] for i in range(0, len(pcm_bytes), frame_size)]

