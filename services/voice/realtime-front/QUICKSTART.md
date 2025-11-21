# Take a Break - Quick Start Guide

A voice assistant application for providing relaxing, restorative breaks through natural voice conversations.

## Features

- **Voice-only interaction** - Simple audio conversation interface
- **Bilingual support** - Communicates in both English and Chinese
- **Web search integration** - Automatically searches for current information when needed
- **Smart detection** - Server-side voice activity detection for natural conversation flow
- **Audio output** - Natural voice responses with multiple voice options

## Prerequisites

- Node.js >= 20.19.4
- pnpm (recommended) or npm
- A GLM API key (stored in `.env` file)

## Quick Start

### 1. Install Dependencies

```bash
cd services/voice/realtime-front
pnpm install
```

### 2. Configure API Key

Create a `.env` file in the `services/voice/realtime-front` directory:

```bash
VITE_GLM_API_KEY=your_api_key_here
```

**Note:** The API key is loaded from the `.env` file and is not visible in the UI for security.

### 3. Run the Development Server

```bash
pnpm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

### 4. Start Using

1. **Connect** - Click the connect button in the toolbar to establish a connection
2. **Start speaking** - Click the microphone button to start recording
3. **Have a conversation** - The assistant will respond naturally and help you relax during your break

## Configuration

### Environment Variables

- `VITE_GLM_API_KEY` - Your GLM API key (required)
- `VITE_APP_DOMAIN` - API domain (configured in vite.config.js)
- `VITE_APP_PROXY_PATH` - API proxy path (configured in vite.config.js)

### Model Settings

- **Model**: GLM-Realtime-Flash (default) or GLM-Realtime-Air
- **Voice**: Multiple voice options available (Female Voice, Male Voice, etc.)
- **Input Type**: Smart detection (server_vad) - automatically detects when you're speaking
- **Output Format**: Audio only
- **Web Search**: Always enabled

## Project Structure

```
realtime-front/
├── src/
│   ├── views/
│   │   └── AudioVideoCall/    # Main voice call interface
│   ├── components/             # Reusable components
│   ├── constants/              # Constants and configurations
│   └── utils/                  # Utility functions
├── .env                        # Environment variables (create this)
└── package.json
```

## Troubleshooting

### Connection Issues

- Ensure your API key is correctly set in the `.env` file
- Check that the API key has proper permissions
- Verify network connectivity

### Audio Issues

- Grant microphone permissions in your browser
- Check browser console for any errors
- Ensure you're using a supported browser (Chrome, Firefox, Safari, Edge)

### Node Version Issues

If you see Node version errors (e.g., `ERR_PNPM_UNSUPPORTED_ENGINE`), ensure you're using Node >= 20.19.4:

**Using nvm (Node Version Manager):**

```bash
# Check current Node version
node --version

# If version is too old, install and use Node 20.19.5
nvm install 20.19.5
nvm use 20.19.5

# Verify the version
node --version  # Should show v20.19.5

# The project includes a .nvmrc file, so you can also just run:
cd services/voice/realtime-front
nvm use  # This will automatically use the version specified in .nvmrc
```

**Common Error Messages:**

- `ERR_PNPM_UNSUPPORTED_ENGINE - Your Node version is incompatible`
  - **Solution**: Switch to Node >= 20.19.4 using nvm
  
- `Expected version: >=20.19.4, Got: v18.5.0`
  - **Solution**: Your current Node version is too old. Use `nvm use 20.19.5` to switch

**If nvm is not installed:**

```bash
# Install nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Or on macOS with Homebrew
brew install nvm

# After installation, restart your terminal or run:
source ~/.nvm/nvm.sh
```

**Persistent Node Version:**

To ensure the correct Node version is used automatically in this directory:

```bash
# The project includes .nvmrc file with version 20.19.5
# When you cd into the directory, run:
nvm use

# Or add this to your shell profile to auto-switch:
# Add to ~/.zshrc or ~/.bashrc:
autoload -U add-zsh-hook
load-nvmrc() {
  if [[ -f .nvmrc && -r .nvmrc ]]; then
    nvm use
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

## Development

### Build for Production

```bash
pnpm run build:prod
```

### Preview Production Build

```bash
pnpm run preview
```

## Notes

- The application starts in a **disconnected** state - you must click the connect button to begin
- Web search is automatically enabled and will be used when current information is needed
- The system prompt is pre-configured for a relaxing, supportive conversation experience
- All UI text is in English

## Support

For issues or questions, please refer to the main project documentation or contact the development team.

