import * as ExpoLocation from 'expo-location';
import { LocationProviderError } from '@take-a-break/map';
const MODE_ACCURACY = {
    highAccuracy: ExpoLocation.LocationAccuracy.Highest,
    batterySaving: ExpoLocation.LocationAccuracy.Balanced
};
export class ExpoLocationProvider {
    id = 'expo-location-provider';
    permissionStatus = null;
    supports(mode) {
        return mode === 'highAccuracy' || mode === 'batterySaving';
    }
    async locate(request) {
        await this.ensurePermissions();
        await this.ensureServicesEnabled();
        try {
            const options = {
                accuracy: MODE_ACCURACY[request.mode] ?? ExpoLocation.LocationAccuracy.Balanced,
                timeInterval: 0,
                distanceInterval: 0
            };
            if (typeof request.timeoutMs === 'number') {
                options.timeout = request.timeoutMs;
            }
            const position = await ExpoLocation.getCurrentPositionAsync(options);
            return {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracyMeters: position.coords.accuracy ?? undefined,
                mode: request.mode,
                updatedAt: new Date(position.timestamp).toISOString(),
                isStale: false
            };
        }
        catch (error) {
            throw this.normalizeError(error);
        }
    }
    async ensurePermissions() {
        if (this.permissionStatus === 'granted') {
            return;
        }
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        this.permissionStatus = status;
        if (status !== 'granted') {
            throw new LocationProviderError('Location permission was denied', 'PERMISSION_DENIED');
        }
    }
    async ensureServicesEnabled() {
        const servicesEnabled = await ExpoLocation.hasServicesEnabledAsync();
        if (!servicesEnabled) {
            throw new LocationProviderError('Location services are disabled on this device', 'PROVIDER_OFF');
        }
    }
    normalizeError(error) {
        if (error instanceof LocationProviderError) {
            return error;
        }
        if (typeof error === 'object' && error !== null && 'code' in error) {
            const code = String(error.code);
            if (code === 'E_TIMEOUT') {
                return new LocationProviderError('Location request timed out', 'TIMEOUT');
            }
        }
        return new LocationProviderError(error instanceof Error ? error.message : 'Unknown location failure', 'UNKNOWN');
    }
}
//# sourceMappingURL=ExpoLocationProvider.js.map