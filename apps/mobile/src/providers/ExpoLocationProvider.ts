import * as ExpoLocation from 'expo-location';
import type { GeolocationMode, LocationError, LocationState } from '@take-a-break/types';
import {
  type LocateRequest,
  type LocationProvider,
  LocationProviderError
} from '@take-a-break/map';

const MODE_ACCURACY: Record<GeolocationMode, ExpoLocation.LocationAccuracy> = {
  highAccuracy: ExpoLocation.LocationAccuracy.Highest,
  batterySaving: ExpoLocation.LocationAccuracy.Balanced
};

type PermissionStatus = ExpoLocation.PermissionStatus | null;
type LocationOptionsWithTimeout = ExpoLocation.LocationOptions & { timeout?: number };

export class ExpoLocationProvider implements LocationProvider {
  readonly id = 'expo-location-provider';
  private permissionStatus: PermissionStatus = null;

  supports(mode: GeolocationMode): boolean {
    return mode === 'highAccuracy' || mode === 'batterySaving';
  }

  async locate(request: LocateRequest): Promise<LocationState> {
    await this.ensurePermissions();
    await this.ensureServicesEnabled();

    try {
      const options: LocationOptionsWithTimeout = {
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
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  private async ensurePermissions() {
    if (this.permissionStatus === 'granted') {
      return;
    }

    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    this.permissionStatus = status;

    if (status !== 'granted') {
      throw new LocationProviderError(
        'Location permission was denied',
        'PERMISSION_DENIED'
      );
    }
  }

  private async ensureServicesEnabled() {
    const servicesEnabled = await ExpoLocation.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      throw new LocationProviderError(
        'Location services are disabled on this device',
        'PROVIDER_OFF'
      );
    }
  }

  private normalizeError(error: unknown): LocationProviderError {
    if (error instanceof LocationProviderError) {
      return error;
    }

    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = String((error as { code?: string }).code);
      if (code === 'E_TIMEOUT') {
        return new LocationProviderError('Location request timed out', 'TIMEOUT');
      }
    }

    return new LocationProviderError(
      error instanceof Error ? error.message : 'Unknown location failure',
      'UNKNOWN'
    );
  }
}
