import type { RouteResponse } from '@take-a-break/types';
import type { RouteEngine, RouteEngineInput, RouteMode } from '../route-engine.js';
import { RouteEngineError } from '../route-engine.js';
import {
  buildRoutePolyline,
  estimateWalkingDurationSeconds,
  haversineDistanceMeters
} from '../../utils/geo.js';

export interface HeuristicEngineOptions {
  interpolationSteps?: number;
  walkingSpeedMps?: number;
}

export class HeuristicRouteEngine implements RouteEngine {
  readonly id = 'heuristic';
  private readonly interpolationSteps: number;
  private readonly walkingSpeedMps: number;

  constructor(options?: HeuristicEngineOptions) {
    this.interpolationSteps = options?.interpolationSteps ?? 6;
    this.walkingSpeedMps = options?.walkingSpeedMps ?? 1.4;
  }

  supports(mode: RouteMode): boolean {
    return mode === 'walking';
  }

  async computeRoute(input: RouteEngineInput): Promise<RouteResponse> {
    if (!this.supports(input.mode)) {
      throw new RouteEngineError(`Mode ${input.mode} is not supported by heuristic engine`);
    }

    const distanceMeters = Math.round(haversineDistanceMeters(input.origin, input.destination));
    const durationSeconds = estimateWalkingDurationSeconds(distanceMeters, this.walkingSpeedMps);
    const polyline = buildRoutePolyline(input.origin, input.destination, this.interpolationSteps);

    return {
      summary: {
        distanceMeters,
        durationSeconds,
        mode: 'walking'
      },
      polyline
    };
  }
}
