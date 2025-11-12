#!/bin/bash

# 设置 iOS 模拟器位置
# Usage: ./scripts/set-simulator-location.sh [city]
# Available cities: nyc, sf, default

CITY="${1:-nyc}"

case "$CITY" in
  nyc|newyork)
    LAT="40.7829"
    LNG="-73.9654"
    CITY_NAME="New York (Long Island)"
    ;;
  sf|sanfrancisco)
    LAT="37.785834"
    LNG="-122.406417"
    CITY_NAME="San Francisco"
    ;;
  *)
    echo "❌ Unknown city: $CITY"
    echo "Available cities: nyc, sf"
    exit 1
    ;;
esac

echo "📍 Setting iOS Simulator location to $CITY_NAME"
echo "   Coordinates: $LAT, $LNG"

# 检查是否有运行中的模拟器
BOOTED_DEVICES=$(xcrun simctl list devices | grep "Booted" | wc -l | tr -d ' ')

if [ "$BOOTED_DEVICES" -eq 0 ]; then
  echo "⚠️  No booted simulators found. Please start a simulator first."
  exit 1
fi

# 设置位置
xcrun simctl location booted set "$LAT" "$LNG"

if [ $? -eq 0 ]; then
  echo "✅ Location set successfully!"
  echo ""
  echo "💡 Tip: Restart your app to apply the new location"
else
  echo "❌ Failed to set location"
  exit 1
fi



