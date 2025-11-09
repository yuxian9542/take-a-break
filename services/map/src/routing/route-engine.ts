import type { LatLng, RouteResponse } from '@take-a-break/types';

export type RouteMode = 'walking';

export interface RouteEngineInput {
  origin: LatLng;
  destination: LatLng;
  mode: RouteMode;
}

export interface RouteEngine {
  readonly id: string;
  supports(mode: RouteMode): boolean;
  computeRoute(input: RouteEngineInput): Promise<RouteResponse>;
}

export class RouteEngineError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RouteEngineError';
  }
}
