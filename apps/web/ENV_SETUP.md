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

### Firebase Configuration
```bash
# Get these values from Firebase Console: https://console.firebase.google.com/
# Project Settings > General > Your apps > Web app config
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id  # Optional, for Analytics
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

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
3. Enable Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see Firebase Console)
4. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click on the web app icon (</>) or create a new web app
   - Copy the config values to your `.env` file

## Notes

- The web app will run on http://localhost:5173
- The voice backend will run on http://localhost:8000
- If the voice backend is not running, the voice chat interface will show a connection error but the rest of the app will work normally
- Firebase authentication is required to use voice chat features
- Conversation history is stored in Firestore and requires proper Firebase configuration


