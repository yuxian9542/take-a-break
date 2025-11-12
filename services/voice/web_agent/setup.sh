#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 Setting up GLM-4-Voice Real-time Chat Demo..."
echo "📁 Working directory: $SCRIPT_DIR"
echo ""

# Check if we're in the correct directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found in script directory"
    exit 1
fi

# Setup backend
echo "📦 Setting up backend..."
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt

# Setup .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️  Creating .env file..."
    cp env.example .env
    echo "⚠️  IMPORTANT: Edit .env and add your GLM_API_KEY"
    echo ""
fi

# Setup frontend
echo ""
echo "📦 Setting up frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
else
    echo "Node dependencies already installed"
fi
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your GLM_API_KEY"
echo "2. Start backend: cd backend && ../venv/bin/python -m uvicorn main:app --reload --port 8000"
echo "3. Start frontend (new terminal): cd frontend && npm run dev"
echo "4. Open http://localhost:5173 in your browser"
echo ""

