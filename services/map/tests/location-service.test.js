import { describe, expect, it } from 'vitest';
import { LocationService, LocationServiceError } from '../src/location/location-service.js';
import { LocationProviderError } from '../src/providers/location-provider.js';
class ToggleProvider {
    id;
    supportedModes;
    coordinate;
    accuracyMeters;
    shouldFail = false;
    failureReason = 'UNKNOWN';
    constructor(id, supportedModes, coordinate, accuracyMeters) {
        this.id = id;
        this.supportedModes = supportedModes;
        this.coordinate = coordinate;
        this.accuracyMeters = accuracyMeters;
    }
    supports(mode) {
        return this.supportedModes.includes(mode);
    }
    fail(reason) {
        this.shouldFail = true;
        this.failureReason = reason;
    }
    recover() {
        this.shouldFail = false;
    }
    async locate(request) {
        if (this.shouldFail) {
            throw new LocationProviderError(`${this.id} failure`, this.failureReason);
        }
        return {
            lat: this.coordinate.lat,
            lng: this.coordinate.lng,
            accuracyMeters: this.accuracyMeters,
            mode: request.mode,
            updatedAt: new Date().toISOString(),
            isStale: false
        };
    }
}
describe('LocationService', () => {
    it('prefers providers matching the current mode', async () => {
        const gps = new ToggleProvider('gps', ['highAccuracy'], { lat: 1, lng: 1 }, 5);
        const network = new ToggleProvider('network', ['batterySaving'], { lat: 2, lng: 2 }, 50);
        const service = new LocationService([gps, network], { defaultMode: 'highAccuracy' });
        const location = await service.getCurrentLocation();
        expect(location.mode).toBe('highAccuracy');
        expect(location.lat).toBeCloseTo(1);
        expect(location.isStale).toBe(false);
    });
    it('falls back to the alternate mode when preferred providers fail', async () => {
        const gps = new ToggleProvider('gps', ['highAccuracy'], { lat: 1, lng: 1 }, 5);
        gps.fail('PROVIDER_OFF');
        const network = new ToggleProvider('network', ['batterySaving'], { lat: 2, lng: 2 }, 50);
        const service = new LocationService([gps, network], { defaultMode: 'highAccuracy' });
        const location = await service.getCurrentLocation();
        expect(location.mode).toBe('batterySaving');
        expect(location.lat).toBeCloseTo(2);
    });
    it('returns a stale location snapshot when all providers fail', async () => {
        let now = Date.now();
        const clock = () => now;
        const gps = new ToggleProvider('gps', ['highAccuracy'], { lat: 1, lng: 1 }, 5);
        const network = new ToggleProvider('network', ['batterySaving'], { lat: 2, lng: 2 }, 50);
        const service = new LocationService([gps, network], {
            defaultMode: 'highAccuracy',
            staleToleranceMs: 1000,
            clock
        });
        const first = await service.getCurrentLocation();
        expect(first.isStale).toBe(false);
        gps.fail('TIMEOUT');
        network.fail('TIMEOUT');
        now += 5000;
        const fallback = await service.getCurrentLocation();
        expect(fallback.isStale).toBe(true);
        expect(fallback.lat).toBeCloseTo(1);
    });
    it('throws a LocationServiceError when stale fallback is disabled', async () => {
        const gps = new ToggleProvider('gps', ['highAccuracy'], { lat: 1, lng: 1 }, 5);
        gps.fail('PERMISSION_DENIED');
        const network = new ToggleProvider('network', ['batterySaving'], { lat: 2, lng: 2 }, 50);
        network.fail('TIMEOUT');
        const service = new LocationService([gps, network], { defaultMode: 'highAccuracy' });
        await expect(service.getCurrentLocation({
            allowStale: false
        })).rejects.toBeInstanceOf(LocationServiceError);
    });
});
//# sourceMappingURL=location-service.test.js.map