# Voice Service

The voice service will orchestrate the speech-to-speech pipeline and WebSocket handling for `/voice/session`. It currently exists as a placeholder while the foundational backend application is prepared.

## Status

### ✅ Web Agent (Standalone Web Version)
**Location:** `web_agent/`

The web version is **ready for production**! 

Features:
- Real-time voice chat with GLM-4-Voice
- Server-side VAD (Voice Activity Detection)
- Whisper ASR transcription (auto-detect language)
- Multi-turn conversations with context
- Streaming audio playback
- Modern React UI

See `web_agent/README.md` for setup and usage.

### 🚧 App Integration (Work in Progress)
**Location:** TBD

The mobile/app integration with the main Take-a-Break application is still under development. This will integrate the voice service into the full application architecture with:
- User authentication
- Session management
- API integration with main backend
- Cross-platform support
