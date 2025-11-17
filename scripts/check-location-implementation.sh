#!/bin/bash
# Quick check script to verify location implementation

echo "🔍 Checking Location Implementation..."
echo "======================================="
echo ""

# Check Web implementation
echo "🌐 Web App Implementation:"
echo "--------------------------"

if grep -q "status === 'loading' && 'Getting location...'" apps/web/src/pages/ExplorePage.tsx; then
    echo "✅ ExplorePage shows 'Getting location...' status"
else
    echo "❌ ExplorePage missing 'Getting location...' status"
fi

if grep -q "setStatus('loading')" apps/web/src/hooks/useBrowserLocation.ts; then
    echo "✅ useBrowserLocation sets loading status"
else
    echo "❌ useBrowserLocation missing loading status"
fi

if grep -q "navigator.geolocation.getCurrentPosition" apps/web/src/hooks/useBrowserLocation.ts; then
    echo "✅ useBrowserLocation uses browser geolocation API"
else
    echo "❌ useBrowserLocation missing geolocation API call"
fi

echo ""
echo "🧪 Tests:"
echo "--------"

if [ -f "packages/map/tests/location-service.test.ts" ]; then
    echo "✅ Location service tests exist"
    cd packages/map
    if pnpm test location-service.test.ts 2>&1 | grep -q "4 passed"; then
        echo "✅ All location service tests pass"
    else
        echo "⚠️  Some tests may have failed"
    fi
    cd ../..
else
    echo "❌ Location service tests missing"
fi

echo ""
echo "📄 Test Tools:"
echo "-------------"

if [ -f "scripts/test-browser-location.html" ]; then
    echo "✅ Browser test page exists"
else
    echo "❌ Browser test page missing"
fi

if [ -f "LOCATION_STATUS_TEST_REPORT.md" ]; then
    echo "✅ Test report exists"
else
    echo "❌ Test report missing"
fi

echo ""
echo "======================================="
echo "✅ Location Implementation Check Complete"
echo ""
echo "📋 To test manually:"
echo "  Web:  cd apps/web && pnpm dev -- --host"
echo "  Test: open scripts/test-browser-location.html"
echo ""

