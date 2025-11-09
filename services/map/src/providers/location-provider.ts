import type { GeolocationMode, LocationError, LocationState } from '@take-a-break/types';

export interface LocateRequest {
  mode: GeolocationMode;
  timeoutMs: number;
}

export class LocationProviderError extends Error {
  constructor(
    message: string,
    public readonly reason: LocationError['code'],
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'LocationProviderError';
  }
}

export interface LocationProvider {
  readonly id: string;
  supports(mode: GeolocationMode): boolean;
  locate(request: LocateRequest): Promise<LocationState>;
}
