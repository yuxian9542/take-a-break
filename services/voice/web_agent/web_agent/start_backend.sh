#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📁 Working directory: $SCRIPT_DIR"

if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run ./setup.sh first"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Copy env.example to .env and add your API key"
    exit 1
fi

echo "🚀 Starting backend server..."
source venv/bin/activate
cd backend
export PYTHONPATH="${SCRIPT_DIR}/backend:${PYTHONPATH}"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level info

