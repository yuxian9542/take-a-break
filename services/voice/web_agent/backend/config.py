"""Static configuration for the realtime voice demo backend."""

SAMPLE_RATE: int = 16_000  # Hz
CHANNELS: int = 1  # mono
SAMPLE_WIDTH: int = 2  # bytes per sample (16-bit PCM)

FRAME_DURATION_MS: int = 20  # assumed chunk duration from client
SILENCE_THRESHOLD: int = 500  # naive amplitude threshold for VAD
MAX_SILENCE_MS: int = 500  # silence duration that marks end of utterance (500ms = 0.5s)
MIN_SPEECH_MS: int = 0  # minimum speech duration (0 = disabled, original behavior)

# Size of reply chunks we stream back to the client (in milliseconds).
REPLY_CHUNK_MS: int = 100

