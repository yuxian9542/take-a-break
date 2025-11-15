# Quick Start (3 steps)

## 1. Setup (one-time)
```bash
cd web_agent/web_agent
./setup.sh
```

Or manually:
```bash
cd web_agent/web_agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 2. Configure API Key
Copy the example file and edit `.env`:
```bash
cd web_agent/web_agent
cp env.example .env
# Edit .env and add: GLM_API_KEY=your_actual_api_key_here
```

Get your API key from: https://open.bigmodel.cn/

## 3. Run Backend
**Terminal 1** (Backend):
```bash
cd web_agent/web_agent
./start_backend.sh
```

The backend will start at: `http://0.0.0.0:8000`
- Health check: `http://localhost:8000/health`
- WebSocket: `ws://localhost:8000/ws/voice`

**Terminal 2** (Frontend - optional, for web demo):
```bash
cd web_agent/web_agent
./start_frontend.sh
```

Open http://localhost:5173 and click "Start Chat"! 🎤

---

**For Mobile App Integration:**
- Configure `EXPO_PUBLIC_VOICE_API_BASE_URL=http://YOUR_COMPUTER_IP:8000` in mobile app
- Ensure backend is running with `--host 0.0.0.0` (already configured in `start_backend.sh`)

See [README.md](README.md) for full documentation.

