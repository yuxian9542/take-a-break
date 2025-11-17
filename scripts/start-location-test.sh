#!/bin/bash

# Start Location Test Server
# This script starts a local HTTP server for testing location functionality

echo "🌐 Starting Location Test Server..."
echo ""
echo "📍 Test page will open at: http://localhost:8000/test-browser-location.html"
echo ""
echo "💡 Tips:"
echo "   - Using localhost is more reliable than file:// protocol"
echo "   - Make sure to allow location permission when prompted"
echo "   - Check macOS System Settings > Privacy & Security > Location Services"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Navigate to scripts directory
cd "$(dirname "$0")"

# Open browser after a short delay
(sleep 2 && open "http://localhost:8000/test-browser-location.html") &

# Start Python HTTP server
python3 -m http.server 8000


