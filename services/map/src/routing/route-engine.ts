import type { LatLng, RouteResponse } from '@take-a-break/types';

export type RouteMode = 'walking' | 'driving' | 'bicycling';

export interface RouteEngineInput {
  origin: LatLng;
  destination: LatLng;
  mode: RouteMode;
}

// Re-export as RouteInput for backward compatibility
export type RouteInput = RouteEngineInput;

export interface RouteEngine {
  readonly id: string;
  supports(mode: RouteMode): boolean;
  computeRoute(input: RouteEngineInput): Promise<RouteResponse>;
}

export class RouteEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RouteEngineError';
  }
}
