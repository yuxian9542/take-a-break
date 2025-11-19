#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"
REPO_ROOT="$( cd "$SCRIPT_DIR/../../.." && pwd )"

echo "📁 Working directory: $SCRIPT_DIR"

if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run ./setup.sh first"
    exit 1
fi

ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ] && [ -f ".env" ]; then
    ENV_FILE=".env"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file not found. Copy .env.example to .env.local and add your API key"
    exit 1
fi

if ! pnpm --dir "$REPO_ROOT" exec tsx scripts/ensure-voice-env.ts; then
    echo "❌ Voice agent environment validation failed"
    exit 1
fi

echo "🚀 Starting backend server..."
source venv/bin/activate
cd backend
python -m uvicorn main:app --reload --port 8000 --log-level info
