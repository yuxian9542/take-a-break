#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📁 Working directory: $SCRIPT_DIR"

if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Node modules not found. Run ./setup.sh first"
    exit 1
fi

echo "🚀 Starting frontend server..."
cd frontend
npm run dev

