# GLM-4-Voice Real-time Chat

Real-time voice conversation with GLM-4-Voice using streaming audio and server-side VAD.

## Features

- 🎤 Real-time voice chat with instant responses
- 🔊 Streaming audio playback
- 📝 Auto-transcription with OpenAI Whisper
- 🔄 Multi-turn conversations with context
- 🎯 Server-side speech detection (no "send" button)

## Quick Start

### 1. Backend Setup

```bash
cd simple
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure API key
cp env.example .env
# Edit .env: GLM_API_KEY=your_key_here

# Start backend
cd backend
python -m uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
# New terminal
cd simple/frontend
npm install
npm run dev
```

### 3. Use the App

1. Open http://localhost:5173
2. Click **Start Chat** and speak
3. Get real-time voice responses
4. Click **End Chat** when done

## Configuration

Edit `backend/config.py` for VAD and audio settings:

```python
# Adjust speech detection sensitivity
SILENCE_THRESHOLD = 0.01
MAX_SILENCE_MS = 700

# Change Whisper model (tiny/base/small/medium/large)
# Trade-off: speed vs accuracy
```

## Project Structure

```
simple/
├── backend/
│   ├── main.py              # WebSocket server
│   ├── glm_voice_client.py  # GLM API client
│   ├── audio_utils.py       # Audio processing
│   ├── vad.py              # Speech detection
│   └── config.py           # Settings
├── frontend/
│   └── src/
│       ├── App.tsx         # Main UI
│       ├── audio/          # Recorder & player
│       └── api/            # WebSocket client
└── requirements.txt
```

## Troubleshooting

**Microphone not working**
- Use HTTPS or localhost
- Check browser permissions

**High latency**
- Switch to faster Whisper model: `whisper_model_name = "base"` in `config.py`

**Backend errors**
- Check logs for detailed messages
- Verify GLM API key is valid

## Requirements

- Python 3.8+
- Node.js 16+
- GLM API key from [open.bigmodel.cn](https://open.bigmodel.cn/)
