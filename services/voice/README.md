# Voice Service

Voice chat functionality for the Take a Break app.

## Architecture

The voice service consists of:

1. **FastAPI Backend** (`web_agent/web_agent/backend/`)
   - Runs on port 8000 (separate from Fastify API on port 3333)
   - Handles WebSocket connections at `/ws/voice`
   - Implements VAD (Voice Activity Detection)
   - Integrates with GLM-4-Voice API
   - Streams audio responses back to clients

2. **Mobile App Integration** (`apps/mobile/src/services/`)
   - `voiceService.ts` - WebSocket client for voice chat
   - `audioRecorder.ts` - Audio recording service
   - `audioPlayer.ts` - Audio playback service

## How It Works

### Input Flow (Client → Backend → GLM)

1. **Client sends continuous PCM16 chunks** (~20ms each) via WebSocket
2. **Backend buffers chunks** in `state.pcm_buffer`
3. **VAD analyzes each chunk** to detect:
   - Speech start
   - Speech end (500ms silence)
4. **When VAD detects end of utterance**:
   - Backend concatenates all buffered chunks into ONE complete utterance
   - Sends complete utterance as **SINGLE** request to GLM (GLM only accepts single input)
   - Signals `asr_start` to stop client from sending more chunks
   - Clears buffer for next utterance

### Output Flow (GLM → Backend → Client)

1. **GLM streams response** in audio chunks (GLM supports stream output)
2. **Backend forwards chunks** to client via WebSocket
3. **Client plays chunks** in real-time

## Setup

### 1. Start Voice Backend

**Option 1: Use the start script (recommended)**
```bash
cd services/voice/web_agent/web_agent
./start_backend.sh
```

**Option 2: Manual start**
```bash
cd services/voice/web_agent/web_agent
source venv/bin/activate
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Note:** Make sure you have a `.env` file with `GLM_API_KEY` set in the `web_agent/web_agent` directory.

### 2. Configure Mobile App

The mobile app automatically connects to the voice backend using:
- Same host as main API (`EXPO_PUBLIC_API_BASE_URL`)
- Port 8000 for voice backend
- Or explicitly set `EXPO_PUBLIC_VOICE_API_BASE_URL`

### 3. Usage

The voice chat is integrated in `VoiceChatModal` component:
- Opens when user taps voice chat button
- Connects to WebSocket automatically
- Handles recording, playback, and message display

## Key Points

- **Backend runs separately** on port 8000 (FastAPI)
- **Mobile app connects directly** to FastAPI backend via WebSocket
- **Input is buffered** then sent as single request to GLM
- **Output is streamed** from GLM back to client
- **VAD handles** speech detection automatically (no "send" button needed)
