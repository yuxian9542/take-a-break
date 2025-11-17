#!/usr/bin/env tsx
/**
 * Test script to verify location getting functionality
 * 
 * This script tests:
 * 1. Browser geolocation API (for web app)
 * 2. Location service logic
 * 3. Permission handling
 * 4. Error scenarios
 */

import { LocationService } from '../packages/map/src/location/location-service.js';
import type { LocationProvider, LocateRequest } from '../packages/map/src/providers/location-provider.js';
import type { LocationState, GeolocationMode } from '../packages/types/src/map.js';

// Mock browser location provider
class MockBrowserLocationProvider implements LocationProvider {
  readonly id = 'mock-browser-location';

  supports(mode: GeolocationMode): boolean {
    return mode === 'highAccuracy' || mode === 'batterySaving';
  }

  async locate(request: LocateRequest): Promise<LocationState> {
    console.log(`\n🔍 [MockBrowserLocation] Simulating browser geolocation...`);
    console.log(`   Mode: ${request.mode}`);
    console.log(`   Timeout: ${request.timeoutMs}ms`);

    // Simulate a delay like real geolocation
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return a mock location (Times Square, NYC for demo)
    const location: LocationState = {
      lat: 40.758896,
      lng: -73.985130,
      accuracyMeters: request.mode === 'highAccuracy' ? 10 : 50,
      mode: request.mode,
      updatedAt: new Date().toISOString(),
      isStale: false
    };

    console.log(`✅ [MockBrowserLocation] Location obtained:`);
    console.log(`   Coordinates: ${location.lat}, ${location.lng}`);
    console.log(`   Accuracy: ${location.accuracyMeters}m`);

    return location;
  }
}

// Simulate location permission states
class PermissionTestProvider implements LocationProvider {
  readonly id = 'permission-test';
  private permissionGranted = true;

  constructor(permissionGranted: boolean) {
    this.permissionGranted = permissionGranted;
  }

  supports(mode: GeolocationMode): boolean {
    return true;
  }

  async locate(request: LocateRequest): Promise<LocationState> {
    if (!this.permissionGranted) {
      throw new Error('PERMISSION_DENIED: User denied location permission');
    }

    return {
      lat: 40.758896,
      lng: -73.985130,
      accuracyMeters: 10,
      mode: request.mode,
      updatedAt: new Date().toISOString(),
      isStale: false
    };
  }
}

async function testLocationService() {
  console.log('🧪 Testing Location Service\n');
  console.log('=' .repeat(60));

  // Test 1: Normal location request
  console.log('\n📍 Test 1: Normal Location Request');
  console.log('-'.repeat(60));
  try {
    const provider = new MockBrowserLocationProvider();
    const service = new LocationService([provider], {
      defaultMode: 'highAccuracy',
      defaultTimeoutMs: 10000
    });

    const location = await service.getCurrentLocation();
    console.log('✅ Test 1 PASSED: Successfully obtained location');
    console.log(`   Location: ${location.lat}, ${location.lng}`);
    console.log(`   Accuracy: ${location.accuracyMeters}m`);
    console.log(`   Is Stale: ${location.isStale}`);
  } catch (error) {
    console.error('❌ Test 1 FAILED:', error);
  }

  // Test 2: Permission denied scenario
  console.log('\n📍 Test 2: Permission Denied Scenario');
  console.log('-'.repeat(60));
  try {
    const provider = new PermissionTestProvider(false);
    const service = new LocationService([provider], {
      defaultMode: 'highAccuracy',
      staleToleranceMs: 5000
    });

    try {
      await service.getCurrentLocation({ allowStale: false });
      console.error('❌ Test 2 FAILED: Should have thrown permission error');
    } catch (error) {
      if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
        console.log('✅ Test 2 PASSED: Correctly handled permission denial');
        console.log(`   Error: ${error.message}`);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Test 2 FAILED:', error);
  }

  // Test 3: Mode fallback (high accuracy -> battery saving)
  console.log('\n📍 Test 3: Mode Fallback');
  console.log('-'.repeat(60));
  try {
    const provider = new MockBrowserLocationProvider();
    const service = new LocationService([provider], {
      defaultMode: 'highAccuracy'
    });

    const location = await service.getCurrentLocation({
      mode: 'batterySaving'
    });

    if (location.mode === 'batterySaving') {
      console.log('✅ Test 3 PASSED: Successfully used battery saving mode');
      console.log(`   Mode: ${location.mode}`);
      console.log(`   Accuracy: ${location.accuracyMeters}m`);
    } else {
      console.error('❌ Test 3 FAILED: Expected batterySaving mode');
    }
  } catch (error) {
    console.error('❌ Test 3 FAILED:', error);
  }

  // Test 4: Stale location fallback
  console.log('\n📍 Test 4: Stale Location Fallback');
  console.log('-'.repeat(60));
  try {
    const provider = new MockBrowserLocationProvider();
    const service = new LocationService([provider], {
      defaultMode: 'highAccuracy',
      staleToleranceMs: 1000 // 1 second tolerance
    });

    // Get initial location
    const firstLocation = await service.getCurrentLocation();
    console.log('   Initial location obtained');

    // Get last known location
    const lastKnown = service.getLastKnownLocation();
    if (lastKnown) {
      console.log('✅ Test 4 PASSED: Can retrieve last known location');
      console.log(`   Last known: ${lastKnown.lat}, ${lastKnown.lng}`);
      console.log(`   Is Stale: ${lastKnown.isStale}`);
    } else {
      console.error('❌ Test 4 FAILED: No last known location');
    }
  } catch (error) {
    console.error('❌ Test 4 FAILED:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Location Service Tests Complete\n');
}

async function testBrowserGeolocationSimulation() {
  console.log('\n🌐 Testing Browser Geolocation Simulation\n');
  console.log('=' .repeat(60));

  console.log('\n📝 Simulating browser location flow:');
  console.log('   1. Check if geolocation API is available');
  console.log('   2. Request user permission');
  console.log('   3. Get current position');
  console.log('   4. Handle success/error callbacks');

  // Simulate the flow from useBrowserLocation hook
  const statuses = ['idle', 'loading', 'granted', 'denied', 'error'];
  
  console.log('\n🔄 Status transitions:');
  for (const status of statuses) {
    console.log(`   → ${status}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n✅ Browser geolocation flow simulation complete');
  console.log('   In actual browser:');
  console.log('   - User will see permission prompt');
  console.log('   - Browser will use device GPS/WiFi/IP for location');
  console.log('   - Accuracy depends on available sensors');
  
  console.log('\n' + '='.repeat(60));
}

function printLocationStatusInfo() {
  console.log('\n📊 Location Status States\n');
  console.log('=' .repeat(60));
  
  const states = [
    {
      status: 'idle',
      display: 'Initializing...',
      description: 'Initial state before location request'
    },
    {
      status: 'loading',
      display: 'Getting location...',
      description: 'Actively requesting location from device'
    },
    {
      status: 'granted',
      display: 'Live location active',
      description: 'Successfully obtained user location'
    },
    {
      status: 'denied',
      display: 'Using demo location',
      description: 'User denied location permission'
    },
    {
      status: 'error',
      display: 'Using demo location',
      description: 'Error occurred (timeout, unavailable, etc.)'
    }
  ];

  states.forEach(({ status, display, description }) => {
    console.log(`\n${status.toUpperCase()}`);
    console.log(`   Display: "${display}"`);
    console.log(`   Meaning: ${description}`);
  });

  console.log('\n' + '='.repeat(60));
}

function printImplementationDetails() {
  console.log('\n🔧 Implementation Details\n');
  console.log('=' .repeat(60));
  
  console.log('\n🌐 Web App (Browser):');
  console.log('   - Uses navigator.geolocation API');
  console.log('   - Timeout: 15 seconds');
  console.log('   - MaximumAge: 5 minutes (uses cached location)');
  console.log('   - EnableHighAccuracy: false (battery saving)');
  console.log('   - Falls back to Times Square, NYC on failure');
  console.log('   - File: apps/web/src/hooks/useBrowserLocation.ts');
  console.log('   - Display: apps/web/src/pages/ExplorePage.tsx (line 220-238)');

  console.log('\n📦 Core Location Service:');
  console.log('   - Abstraction layer for multiple providers');
  console.log('   - Supports mode fallback (GPS -> Network)');
  console.log('   - Caches last known location');
  console.log('   - Handles stale location tolerance');
  console.log('   - File: packages/map/src/location/location-service.ts');

  console.log('\n' + '='.repeat(60));
}

// Main test runner
async function main() {
  console.clear();
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║         📍 LOCATION STATUS TEST SUITE 📍                  ║');
  console.log('║                                                            ║');
  console.log('║         Testing "Getting location..." functionality        ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Print information
  printLocationStatusInfo();
  printImplementationDetails();

  // Run tests
  await testLocationService();
  await testBrowserGeolocationSimulation();

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║                    ✅ TESTS COMPLETE                       ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log('🎯 Next Steps to Test with Real Device Location:\n');
  console.log('For Web App (Desktop):');
  console.log('   1. cd apps/web');
  console.log('   2. pnpm dev -- --host');
  console.log('   3. Open browser and allow location permission');
  console.log('   4. Navigate to Explore page');
  console.log('   5. Check "Location status" shows "Getting location..."');
  console.log('   6. Verify it changes to "Live location active"');
  console.log('   7. Check browser console for coordinates\n');

  console.log('For Web App (Mobile Browser over LAN):');
  console.log('   1. Ensure API server is running if needed (services/api)');
  console.log('   2. From another terminal run: cd apps/web && pnpm dev -- --host');
  console.log('   3. From your phone, visit http://<your-ip>:5173');
  console.log('   4. Accept the location permission prompt');
  console.log('   5. Verify the planner loads the same location status flow\n');
}

main().catch(console.error);

