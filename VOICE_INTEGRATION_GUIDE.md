# Voice Chat Integration Guide

This guide documents the integration of GLM-4-Voice chat functionality into the Take a Break web application.

## Overview

The voice chat feature has been successfully integrated into the VoicePage, creating a split-view interface:
- **Left Panel (40%)**: Live voice chat interface for real-time AI conversations
- **Right Panel (60%)**: Session history with spotlight and recent sessions list

## Architecture

### Components Structure

```
apps/web/src/
├── components/
│   └── voice/
│       ├── VoiceChat.tsx      # Main voice UI component
│       ├── VoiceChat.css      # Voice chat styles
│       ├── wsClient.ts        # WebSocket client
│       ├── recorder.ts        # Audio recording (PCM16, 16kHz)
│       ├── player.ts          # Audio playback
│       └── types.ts           # TypeScript message types
├── pages/
│   ├── VoicePage.tsx          # Split-view page (voice + history)
│   └── VoicePage.css          # Updated for split-view layout
└── config/
    └── env.ts                 # Added voiceWsUrl configuration
```

### Backend Integration

The voice chat connects to the existing Python backend at `services/voice/web_agent/backend/`:
- WebSocket endpoint: `ws://localhost:8000/ws/voice`
- Audio format: PCM16, 16kHz, mono
- Protocol: JSON messages for control and base64-encoded audio chunks

## Setup Instructions

### Prerequisites

1. **Node.js** (>= 18.17.0)
2. **Python 3** with pip
3. **pnpm** (>= 8.15.4)
4. **GLM API Key** from https://open.bigmodel.cn/

### Installation Steps

#### 1. Install Dependencies

From the project root:
```bash
# Install Node dependencies
pnpm install

# Setup voice backend (one-time)
cd services/voice/web_agent
./setup.sh
cd ../../..
```

#### 2. Configure Environment

Copy the sample files and fill in your secrets:
```bash
cp services/voice/web_agent/.env.example services/voice/web_agent/.env.local
cp apps/web/.env.example apps/web/.env.local
```

Then edit the new `.env.local` files:
```bash
# services/voice/web_agent/.env.local
GLM_API_KEY=your_actual_api_key_here
VITE_BACKEND_URL=http://localhost:8000

# apps/web/.env.local (optional override)
VITE_VOICE_WS_URL=ws://localhost:8000/ws/voice
```

#### 3. Run the Application

**Option A: Run everything together** (recommended):
```bash
pnpm dev:all
```

**Option B: Run separately** in different terminals:
```bash
# Terminal 1: Web frontend
pnpm dev:web

# Terminal 2: Voice backend
pnpm dev:voice-backend
```

#### 4. Access the Application

- Open http://localhost:5173
- Navigate to the Voice page
- Click "Start Chat" to begin a voice conversation

## Features

### Voice Chat Interface

- **Real-time Audio**: Streams audio to/from GLM-4-Voice API
- **Live Transcription**: Shows real-time speech-to-text
- **Visual Feedback**: Animated avatar indicates speaking/listening states
- **Message History**: Displays conversation within the session
- **Connection Status**: Shows errors if backend is unavailable

### Session History

- **Spotlight View**: Highlights the most recent or selected session
- **Session List**: Scrollable list of past conversations
- **Session Actions**: Resume, listen back, or view transcripts
- **Statistics**: Shows weekly session count and total listening time

## Technical Details

### WebSocket Protocol

**Client → Server Messages:**
```typescript
// Audio data
{ type: "audio_chunk", chunkId: string, data: string }

// Control messages
{ type: "control", action: "set_language", language: "zh" | "en" | null }
```

**Server → Client Messages:**
```typescript
// Status updates
{ type: "speech_started", message: string }
{ type: "asr_start", message: string }
{ type: "asr_complete", text: string }
{ type: "glm_start", message: string }
{ type: "glm_complete", text: string }

// Audio response
{ type: "reply_audio_chunk", data: string, isLast: boolean }

// Info/errors
{ type: "info" | "error", message: string }
```

### Audio Processing

**Recording:**
- Captures microphone input via Web Audio API
- Converts to PCM16 format at 16kHz sample rate
- Sends 4096-sample chunks to backend
- Automatic voice activity detection on backend

**Playback:**
- Receives base64-encoded PCM16 chunks
- Resamples to browser's audio context rate if needed
- Schedules chunks for gapless playback
- Provides smooth audio streaming experience

## Troubleshooting

### Voice Backend Connection Error

**Error:** "Failed to connect to voice backend..."

**Solution:**
1. Ensure backend is running: `pnpm dev:voice-backend`
2. Check backend logs for errors
3. Verify GLM API key is set in `services/voice/web_agent/.env.local`
4. Confirm WebSocket URL is correct in configuration

### Microphone Permission Error

**Error:** "Failed to access microphone..."

**Solution:**
1. Allow microphone access in browser settings
2. Use HTTPS or localhost (required for microphone access)
3. Check browser console for specific permission errors

### Audio Not Playing

**Solution:**
1. Check browser console for audio context errors
2. Ensure browser supports Web Audio API
3. Try clicking "End Chat" and "Start Chat" again
4. Verify backend is sending audio chunks (check backend logs)

## Development Notes

### Adding New Voice Features

1. **Update Protocol**: Modify `types.ts` with new message types
2. **Backend Changes**: Update `services/voice/web_agent/backend/main.py`
3. **Frontend Logic**: Update `VoiceChat.tsx` message handlers
4. **UI Changes**: Modify `VoiceChat.css` for new UI elements

### Testing

```bash
# Run web tests
pnpm test:web

# Check for linting errors
pnpm --filter @take-a-break/web run lint
```

### Build for Production

```bash
pnpm build:web
```

Note: Production deployment requires hosting the Python backend separately and updating `VITE_VOICE_WS_URL` to point to the production WebSocket endpoint.

## Integration Checklist

- [x] Voice components migrated from standalone app
- [x] WebSocket client adapted for web app
- [x] Audio recorder and player implemented
- [x] TypeScript message types defined
- [x] VoicePage redesigned with split-view layout
- [x] Environment configuration updated
- [x] Backend startup scripts added to package.json
- [x] Documentation created (ENV_SETUP.md)
- [x] No linting errors

## Next Steps

Potential enhancements:
1. **Persistent Sessions**: Store conversations in database
2. **Session Playback**: Play back recorded audio from history
3. **Multi-language Support**: UI controls for language selection
4. **Voice Settings**: Adjust audio quality, volume, etc.
5. **Offline Mode**: Queue messages when backend unavailable

## Support

For issues or questions:
1. Check backend logs in `services/voice/web_agent/backend/`
2. Review browser console for frontend errors
3. Verify environment configuration in ENV_SETUP.md



