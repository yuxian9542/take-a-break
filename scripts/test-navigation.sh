#!/bin/bash
# Test Navigation Feature
# This script helps test the walking navigation functionality

set -e

echo "🧪 Testing Navigation Feature (Web)"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}This script will help you test the walking navigation experience in the web app.${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo "Checking required tools..."
if ! command_exists pnpm; then
    echo -e "${RED}❌ pnpm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ pnpm found${NC}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_DIR="$SCRIPT_DIR/../apps/web"

if [ ! -d "$WEB_DIR" ]; then
    echo -e "${RED}❌ Web app directory not found: $WEB_DIR${NC}"
    exit 1
fi

PORT=${PORT:-5173}
LOCAL_URL="http://localhost:$PORT"

echo ""
echo "📂 Web app directory: $WEB_DIR"
echo "🌐 Expected local URL: $LOCAL_URL"

echo ""
echo -e "${YELLOW}📝 Pre-test Checklist:${NC}"
echo "1. Ensure location services are enabled in your browser/device"
echo "2. Start the API server if you need live routing data:"
echo "   cd services/api && HOST=0.0.0.0 PORT=3333 pnpm run dev"
echo "3. Start the web app in a separate terminal:"
echo "   cd apps/web && pnpm dev -- --host --port $PORT"
echo "4. Open the app at $LOCAL_URL"
echo "5. Optional: Share the URL to your phone using the LAN IP for cross-device testing"
echo ""
read -p "Press Enter after the development server is running..."

cd "$WEB_DIR"

show_test_instructions() {
    echo ""
    echo -e "${YELLOW}📋 Testing Steps:${NC}"
    echo ""
    echo "1. From the home screen, navigate to the Break Planner flow"
    echo "2. Select how you're feeling (e.g., 'tired')"
    echo "3. Choose an availability window (e.g., '15 mins')"
    echo "4. Generate a break plan and review the itinerary"
    echo "5. Locate a step that suggests going for a walk"
    echo "6. Click the navigation action to open the map experience"
    echo "7. In the map view:"
    echo "   - Confirm your current location loads without errors"
    echo "   - Inspect the list of suggested destinations"
    echo "   - Select one destination to preview the route"
    echo "   - Verify the polyline and distance/time estimates display"
    echo "   - Use the external navigation link (Google Maps) to open directions"
    echo ""
    echo -e "${GREEN}Expected Results:${NC}"
    echo "✅ Location status transitions from 'Getting location...' to 'Live location active'"
    echo "✅ Map centers near your current coordinates or fallback location"
    echo "✅ Route summary updates when selecting different destinations"
    echo "✅ External navigation link opens in a new browser tab"
    echo "✅ Returning to the planner keeps the state intact"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "❌ Location denied → Reset browser permissions and reload"
    echo "❌ No destinations → Ensure API server is running or mock data enabled"
    echo "❌ Directions link blocked → Allow pop-ups for $LOCAL_URL"
    echo ""
}

show_test_instructions

echo ""
echo -e "${BLUE}Optional Follow-ups:${NC}"
echo "- Test responsive layout by resizing the browser window"
echo "- Repeat the flow on a mobile browser via the LAN URL"
echo "- Capture console logs for any geolocation errors"
echo ""

echo ""
echo -e "${GREEN}🎉 Testing session completed!${NC}"
echo ""
echo "Please report any issues you encountered."
echo "Check the browser console and network logs for detailed error messages."
echo ""

