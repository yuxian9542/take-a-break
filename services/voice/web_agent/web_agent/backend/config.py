"""Static configuration for the realtime voice demo backend."""

SAMPLE_RATE: int = 16_000  # Hz
CHANNELS: int = 1  # mono
SAMPLE_WIDTH: int = 2  # bytes per sample (16-bit PCM)

FRAME_DURATION_MS: int = 20  # assumed chunk duration from client
SILENCE_THRESHOLD: int = 500  # fallback amplitude threshold for VAD (used if adaptive threshold not available)
MAX_SILENCE_MS: int = 600  # silence duration that marks end of utterance (600ms = 0.6s, faster completion while still allowing brief pauses)
MIN_SPEECH_MS: int = 0  # minimum speech duration (0 = disabled, original behavior)

# Adaptive threshold detection
BACKGROUND_NOISE_SAMPLES: int = 50  # number of chunks to collect for background noise detection (50 * 20ms = 1 second)
MIN_NOISE_SAMPLES: int = 10  # minimum samples needed for reliable noise estimation (10 * 20ms = 200ms)
NOISE_THRESHOLD_MULTIPLIER: float = 5.0  # threshold = background_noise * multiplier
NOISE_DETECTION_THRESHOLD: int = 500  # initial threshold to detect speech during noise collection (prevent speech from being included in noise samples)

# Size of reply chunks we stream back to the client (in milliseconds).
REPLY_CHUNK_MS: int = 100

