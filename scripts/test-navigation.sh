#!/bin/bash
# Test Navigation Feature
# This script helps test the walking navigation functionality

set -e

echo "🧪 Testing Navigation Feature"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}This script will help you test the walking navigation feature.${NC}"
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

# Ask which platform to test
echo ""
echo "Which platform would you like to test?"
echo "1) iOS (Simulator/Device)"
echo "2) Android (Emulator/Device)"
echo "3) Both"
read -p "Enter your choice (1-3): " platform_choice

case $platform_choice in
    1)
        PLATFORM="ios"
        ;;
    2)
        PLATFORM="android"
        ;;
    3)
        PLATFORM="both"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Navigate to mobile app directory
cd "$(dirname "$0")/../apps/mobile"

echo ""
echo -e "${YELLOW}📝 Pre-test Checklist:${NC}"
echo "1. Ensure you have location permissions enabled"
echo "2. Make sure you have a maps app installed:"
echo "   - iOS: Apple Maps (pre-installed)"
echo "   - Android: Google Maps"
echo "3. Enable location services on your device"
echo "4. Have internet connection available"
echo ""
read -p "Press Enter to continue..."

# Function to run iOS tests
test_ios() {
    echo ""
    echo -e "${BLUE}🍎 Starting iOS app...${NC}"
    echo ""
    
    if command_exists xcrun; then
        # List available simulators
        echo "Available iOS Simulators:"
        xcrun simctl list devices | grep -v "unavailable"
        echo ""
    fi
    
    echo "Starting app with Expo..."
    pnpm ios
}

# Function to run Android tests
test_android() {
    echo ""
    echo -e "${BLUE}🤖 Starting Android app...${NC}"
    echo ""
    
    if command_exists adb; then
        # Check for connected devices
        echo "Checking for connected Android devices..."
        adb devices
        echo ""
        
        # Check if Google Maps is installed
        echo "Checking if Google Maps is installed..."
        if adb shell pm list packages | grep -q "com.google.android.apps.maps"; then
            echo -e "${GREEN}✅ Google Maps is installed${NC}"
        else
            echo -e "${YELLOW}⚠️  Google Maps not found. Navigation may not work.${NC}"
            echo "Install from: https://play.google.com/store/apps/details?id=com.google.android.apps.maps"
        fi
        echo ""
    fi
    
    echo "Starting app with Expo..."
    pnpm android
}

# Function to show test instructions
show_test_instructions() {
    echo ""
    echo -e "${YELLOW}📋 Testing Steps:${NC}"
    echo ""
    echo "1. Wait for the app to load"
    echo "2. Go to the 'Break' tab"
    echo "3. Select your feeling status (e.g., 'tired')"
    echo "4. Select available time (e.g., '15 mins')"
    echo "5. Tap the 'Start' button"
    echo "6. Review the generated break plan"
    echo "7. Find a 'Walk' step and tap 'Navigate'"
    echo "8. In the map modal:"
    echo "   - Verify your current location is shown"
    echo "   - Browse nearby destinations (horizontal scroll)"
    echo "   - Select a destination"
    echo "   - Wait for route calculation"
    echo "   - Tap the 'Navigate' button"
    echo "9. The maps app should open with walking directions"
    echo ""
    echo -e "${GREEN}Expected Results:${NC}"
    echo "✅ Native maps app opens"
    echo "✅ Walking route is displayed"
    echo "✅ Navigation starts from current location"
    echo "✅ Destination matches selected place"
    echo ""
    echo -e "${YELLOW}Common Issues:${NC}"
    echo "❌ No response → Check if maps app is installed"
    echo "❌ Wrong location → Check location permissions"
    echo "❌ No route → Check internet connection"
    echo ""
}

# Show test instructions
show_test_instructions

# Run tests based on platform choice
case $PLATFORM in
    "ios")
        test_ios
        ;;
    "android")
        test_android
        ;;
    "both")
        echo "Choose which platform to start first:"
        echo "1) iOS"
        echo "2) Android"
        read -p "Enter your choice: " first_platform
        
        if [ "$first_platform" = "1" ]; then
            test_ios
        else
            test_android
        fi
        
        echo ""
        read -p "Press Enter to test the other platform..."
        
        if [ "$first_platform" = "1" ]; then
            test_android
        else
            test_ios
        fi
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Testing session completed!${NC}"
echo ""
echo "Please report any issues you encountered."
echo "Check the console logs for detailed error messages."
echo ""

