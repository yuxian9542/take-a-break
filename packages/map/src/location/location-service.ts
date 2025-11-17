import type {
  GeolocationMode,
  LocationError,
  LocationRequestParams,
  LocationState
} from '@take-a-break/types';
import type { LocateRequest, LocationProvider } from '../providers/location-provider';
import { LocationProviderError } from '../providers/location-provider';

export interface LocationServiceOptions {
  defaultMode?: GeolocationMode;
  defaultTimeoutMs?: number;
  staleToleranceMs?: number;
  allowModeFallback?: boolean;
  clock?: () => number;
}

type ProviderAttempt = {
  provider: LocationProvider;
  mode: GeolocationMode;
};

type LastKnownLocation = {
  state: LocationState;
  capturedAt: number;
};

export class LocationServiceError extends Error {
  constructor(message: string, public readonly errors: LocationError[]) {
    super(message);
    this.name = 'LocationServiceError';
  }
}

export class LocationService {
  private readonly providers: LocationProvider[];
  private readonly defaultTimeoutMs: number;
  private readonly staleToleranceMs: number;
  private readonly allowModeFallback: boolean;
  private readonly clock: () => number;
  private currentMode: GeolocationMode;
  private lastKnown?: LastKnownLocation;

  constructor(providers: LocationProvider[], options?: LocationServiceOptions) {
    if (providers.length === 0) {
      throw new Error('LocationService requires at least one provider');
    }

    this.providers = providers;
    this.currentMode = options?.defaultMode ?? 'batterySaving';
    this.defaultTimeoutMs = options?.defaultTimeoutMs ?? 5000;
    this.staleToleranceMs = options?.staleToleranceMs ?? 2 * 60 * 1000; // 2 minutes
    this.allowModeFallback = options?.allowModeFallback ?? true;
    this.clock = options?.clock ?? (() => Date.now());
  }

  getMode(): GeolocationMode {
    return this.currentMode;
  }

  setMode(mode: GeolocationMode) {
    this.currentMode = mode;
  }

  getLastKnownLocation(): LocationState | undefined {
    return this.lastKnown?.state;
  }

  async getCurrentLocation(request?: LocationRequestParams): Promise<LocationState> {
    const desiredMode = request?.mode ?? this.currentMode;
    const timeoutMs = request?.timeoutMs ?? this.defaultTimeoutMs;
    const allowModeFallback = request?.allowModeFallback ?? this.allowModeFallback;
    const errors: LocationError[] = [];

    for (const attempt of this.buildAttemptChain(desiredMode, allowModeFallback)) {
      try {
        const location = await attempt.provider.locate(this.buildLocateRequest(attempt.mode, timeoutMs));
        return this.recordLocation(location, attempt.mode);
      } catch (error) {
        errors.push(this.normalizeError(error));
      }
    }

    if (request?.allowStale !== false) {
      const stale = this.getStaleLocation();
      if (stale) {
        const isStale = this.isStale(stale.capturedAt);
        return {
          ...stale.state,
          isStale
        };
      }
    }

    throw new LocationServiceError('Unable to acquire location', errors);
  }

  private recordLocation(location: LocationState, mode: GeolocationMode): LocationState {
    const normalized = this.normalizeLocation(location, mode);
    this.lastKnown = {
      state: normalized,
      capturedAt: this.clock()
    };
    this.currentMode = mode;
    return normalized;
  }

  private normalizeLocation(location: LocationState, mode: GeolocationMode): LocationState {
    const timestamp = location.updatedAt ?? new Date(this.clock()).toISOString();
    return {
      ...location,
      mode,
      updatedAt: timestamp,
      isStale: false
    };
  }

  private buildLocateRequest(mode: GeolocationMode, timeoutMs: number): LocateRequest {
    return {
      mode,
      timeoutMs
    };
  }

  private buildAttemptChain(
    desiredMode: GeolocationMode,
    allowModeFallback: boolean
  ): ProviderAttempt[] {
    const attempts: ProviderAttempt[] = this.collectProviders(desiredMode);

    if (allowModeFallback) {
      const fallbackMode = this.getFallbackMode(desiredMode);
      if (fallbackMode) {
        attempts.push(...this.collectProviders(fallbackMode));
      }
    }

    return attempts;
  }

  private collectProviders(mode: GeolocationMode): ProviderAttempt[] {
    return this.providers
      .filter((provider) => provider.supports(mode))
      .map((provider) => ({ provider, mode }));
  }

  private getFallbackMode(mode: GeolocationMode): GeolocationMode | undefined {
    return mode === 'highAccuracy' ? 'batterySaving' : mode === 'batterySaving' ? 'highAccuracy' : undefined;
  }

  private normalizeError(error: unknown): LocationError {
    if (error instanceof LocationProviderError) {
      return {
        code: error.reason,
        message: error.message
      };
    }

    return {
      code: 'UNKNOWN',
      message: error instanceof Error ? error.message : 'Unknown location error'
    };
  }

  private getStaleLocation(): LastKnownLocation | undefined {
    if (!this.lastKnown) {
      return undefined;
    }

    return this.lastKnown;
  }

  private isStale(capturedAt: number): boolean {
    return this.clock() - capturedAt > this.staleToleranceMs;
  }
}
