# Environment Configuration

This document describes the environment variables needed for the web application.

## Configuration Variables

Copy `.env.example` to `.env.local` in `apps/web/` and set the following variables:

### API Configuration
```bash
VITE_API_BASE_URL=http://localhost:3333
```

### Google Maps API Key
```bash
# Get your API key from: https://console.cloud.google.com/
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Voice Backend WebSocket URL
```bash
# Default: ws://localhost:8000/ws/voice
# The voice backend must be running for voice chat to work
VITE_VOICE_WS_URL=ws://localhost:8000/ws/voice
```

## Voice Backend Setup

The voice chat feature requires the Python backend to be running.

### One-Time Setup

1. Navigate to the voice backend directory:
   ```bash
   cd services/voice/web_agent/
   ```

2. Run the setup script:
   ```bash
   ./setup.sh
   ```

3. Copy `.env.example` to `.env.local` in `services/voice/web_agent/` and set your GLM API key:
   ```bash
   GLM_API_KEY=your_glm_api_key_here
   ```
   Get your API key from: https://open.bigmodel.cn/

### Running the Application

#### Option 1: Run Everything Together
From the project root:
```bash
pnpm install  # Install concurrently if needed
pnpm dev:all
```

This will start both the web frontend and voice backend simultaneously.

#### Option 2: Run Separately
In separate terminals:

**Terminal 1** (Web frontend):
```bash
pnpm dev:web
```

**Terminal 2** (Voice backend):
```bash
pnpm dev:voice-backend
```

Or directly:
```bash
cd services/voice/web_agent
./start_backend.sh
```

## Notes

- The web app will run on http://localhost:5173
- The voice backend will run on http://localhost:8000
- If the voice backend is not running, the voice chat interface will show a connection error but the rest of the app will work normally


