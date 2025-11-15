# GLM-4-Voice Real-time Chat

Real-time voice conversation with GLM-4-Voice using streaming audio and server-side VAD.

## Features

- 🎤 Real-time voice chat with instant responses
- 🔊 Streaming audio playback
- 📝 Auto-transcription with OpenAI Whisper
- 🔄 Multi-turn conversations with context
- 🎯 Server-side speech detection (no "send" button)

## Quick Start

### Option 1: Using Scripts (Recommended)

**Terminal 1** (Backend):
```bash
cd web_agent/web_agent
./start_backend.sh
```

**Terminal 2** (Frontend - if needed):
```bash
cd web_agent/web_agent
./start_frontend.sh
```

### Option 2: Manual Setup

#### 1. Backend Setup

```bash
cd web_agent/web_agent

# Create virtual environment (if not exists)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure API key
cp env.example .env
# Edit .env: GLM_API_KEY=your_key_here

# Start backend
cd backend
export PYTHONPATH="$(pwd):${PYTHONPATH}"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level info
```

The backend will be available at: `http://0.0.0.0:8000` (or `http://localhost:8000`)
- Health check: `http://localhost:8000/health`
- WebSocket endpoint: `ws://localhost:8000/ws/voice`

#### 2. Frontend Setup (Optional - for web demo)

```bash
# New terminal
cd web_agent/web_agent/frontend
npm install
npm run dev
```

#### 3. Use the App

1. Open http://localhost:5173 (for web demo)
2. Or connect from mobile app (configured separately)
3. Click **Start Chat** and speak
4. Get real-time voice responses
5. Click **End Chat** when done

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
web_agent/web_agent/
├── backend/
│   ├── main.py              # WebSocket server & audio handler
│   ├── glm_voice_client.py  # GLM API client
│   ├── audio_utils.py       # Audio processing utilities
│   ├── vad.py               # Voice Activity Detection (VAD)
│   ├── session_manager.py   # Session state management
│   └── config.py            # VAD and audio settings
├── frontend/                # Web demo (optional)
│   └── src/
│       ├── App.tsx          # Main UI
│       ├── audio/           # Recorder & player
│       └── api/             # WebSocket client
├── start_backend.sh         # Backend startup script
├── start_frontend.sh        # Frontend startup script
├── setup.sh                 # Initial setup script
├── requirements.txt         # Python dependencies
├── env.example              # Environment variables template
└── venv/                    # Python virtual environment
```

## Backend API

### WebSocket Endpoint
- **URL**: `ws://localhost:8000/ws/voice`
- **Protocol**: JSON messages over WebSocket
- **Messages**:
  - **Client → Server**: `{ type: "audio_chunk", data: "<base64_encoded_pcm16>" }`
  - **Server → Client**: 
    - `{ type: "info", message: "..." }`
    - `{ type: "speech_started", message: "Listening..." }`
    - `{ type: "asr_start", message: "Transcribing..." }`
    - `{ type: "asr_complete", text: "..." }`
    - `{ type: "glm_start", message: "Thinking..." }`
    - `{ type: "glm_complete", text: "..." }`
    - `{ type: "reply_audio_chunk", data: "<base64>", isLast: bool }`
    - `{ type: "error", message: "..." }`

### REST Endpoints
- `GET /health` - Health check endpoint

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
