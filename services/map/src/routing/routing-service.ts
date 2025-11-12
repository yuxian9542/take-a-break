import type { LatLng, RouteRequest, RouteResponse } from '@take-a-break/types';
import type { PlacesRepository } from '../repositories/places-repository';
import type { RouteEngine, RouteMode } from './route-engine';
import { RouteEngineError } from './route-engine';
import { HeuristicRouteEngine } from './engines/heuristic-engine';

export interface RoutingServiceOptions {
  engines?: RouteEngine[];
  defaultMode?: RouteMode;
}

export class RoutingServiceError extends Error {
  constructor(message: string, public readonly causes: Error[]) {
    super(message);
    this.name = 'RoutingServiceError';
  }
}

export class RoutingService {
  private readonly engines: RouteEngine[];
  private readonly mode: RouteMode;
  constructor(private readonly placesRepository: PlacesRepository, options?: RoutingServiceOptions) {
    const primaryEngines = options?.engines ?? [];
    const hasHeuristic = primaryEngines.some((engine) => engine instanceof HeuristicRouteEngine);
    this.engines = hasHeuristic ? primaryEngines : [...primaryEngines, new HeuristicRouteEngine()];
    this.mode = options?.defaultMode ?? 'walking';
  }

  async getWalkingRoute(request: RouteRequest): Promise<RouteResponse> {
    const destination = await this.placesRepository.findById(request.destinationId);
    if (!destination) {
      throw new RoutingServiceError(`Unknown destination ${request.destinationId}`, []);
    }

    const engines = this.engines.filter((engine) => engine.supports(this.mode));
    if (engines.length === 0) {
      throw new RoutingServiceError('No routing engines support walking mode', []);
    }

    const input = {
      origin: validateLatLng(request.origin),
      destination: { lat: destination.lat, lng: destination.lng },
      mode: this.mode as RouteMode
    };

    const errors: Error[] = [];

    for (const engine of engines) {
      try {
        return await engine.computeRoute(input);
      } catch (error) {
        errors.push(
          error instanceof Error
            ? error
            : new RouteEngineError('Unknown routing engine failure')
        );
      }
    }

    throw new RoutingServiceError('All routing engines failed', errors);
  }
}

function validateLatLng(point: LatLng): LatLng {
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
    throw new RoutingServiceError('Origin coordinates are invalid', []);
  }
  return point;
}
