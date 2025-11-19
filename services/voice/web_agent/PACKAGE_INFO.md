# GLM-4-Voice Simple Demo - Standalone Package

This is a **fully standalone** package for the GLM-4-Voice real-time chat demo.

## What's Included

✅ **Complete Backend**
- FastAPI WebSocket server
- GLM-4-Voice API integration
- OpenAI Whisper ASR
- Server-side VAD
- Async transcript processing

✅ **Complete Frontend**
- React + TypeScript UI
- Real-time audio recording
- WebSocket client
- Chat interface with live updates

✅ **Setup & Run Scripts**
- `setup.sh` - One-command setup
- `start_backend.sh` - Start backend server
- `start_frontend.sh` - Start frontend dev server

✅ **Documentation**
- `QUICKSTART.md` - 3-step quick start guide
- `README.md` - Full documentation
- `.env.example` - Environment variable template

✅ **Dependencies**
- `requirements.txt` - Python dependencies
- `package.json` - Node dependencies

## File Structure

```
simple/                          # 👈 Standalone package root
├── setup.sh                     # One-command setup script
├── start_backend.sh             # Quick backend start
├── start_frontend.sh            # Quick frontend start
├── QUICKSTART.md                # 3-step guide
├── README.md                    # Full documentation
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
│
├── backend/                     # Backend code
│   ├── main.py                  # FastAPI server
│   ├── glm_voice_client.py      # GLM API client
│   ├── audio_utils.py           # Audio processing
│   ├── vad.py                   # Voice detection
│   ├── session_manager.py       # State management
│   └── config.py                # Configuration
│
└── frontend/                    # Frontend code
    ├── package.json             # Node dependencies
    ├── src/
    │   ├── App.tsx              # Main component
    │   ├── audio/
    │   │   ├── recorder.ts      # Mic capture
    │   │   └── player.ts        # Audio playback
    │   └── api/
    │       └── wsClient.ts      # WebSocket client
    └── ...
```

## Key Features

🎯 **Zero External Dependencies**
- Self-contained venv for Python
- Local node_modules for frontend
- No shared parent dependencies

🚀 **Quick Setup**
```bash
./setup.sh                    # Setup everything
# Edit .env.local with your API key
./start_backend.sh            # Terminal 1
./start_frontend.sh           # Terminal 2
```

📦 **Portable**
- Copy the `simple/` folder anywhere
- Run setup and you're ready to go
- No need for the parent `voice_call/` directory

## Requirements

- Python 3.8+
- Node.js 16+
- GLM API key from https://open.bigmodel.cn/

## Usage

See `QUICKSTART.md` for the 3-step quick start, or `README.md` for full documentation.

## Distribution

This package can be:
- Zipped and shared
- Pushed to a Git repository
- Deployed to a server
- Used as a template for new projects

All without any external dependencies from the parent directory!
