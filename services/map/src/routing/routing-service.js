import { RouteEngineError } from './route-engine';
import { HeuristicRouteEngine } from './engines/heuristic-engine';
export class RoutingServiceError extends Error {
    causes;
    constructor(message, causes) {
        super(message);
        this.causes = causes;
        this.name = 'RoutingServiceError';
    }
}
export class RoutingService {
    placesRepository;
    engines;
    mode;
    constructor(placesRepository, options) {
        this.placesRepository = placesRepository;
        const primaryEngines = options?.engines ?? [];
        const hasHeuristic = primaryEngines.some((engine) => engine instanceof HeuristicRouteEngine);
        this.engines = hasHeuristic ? primaryEngines : [...primaryEngines, new HeuristicRouteEngine()];
        this.mode = options?.defaultMode ?? 'walking';
    }
    async getWalkingRoute(request) {
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
            mode: this.mode
        };
        const errors = [];
        for (const engine of engines) {
            try {
                return await engine.computeRoute(input);
            }
            catch (error) {
                errors.push(error instanceof Error
                    ? error
                    : new RouteEngineError('Unknown routing engine failure'));
            }
        }
        throw new RoutingServiceError('All routing engines failed', errors);
    }
}
function validateLatLng(point) {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
        throw new RoutingServiceError('Origin coordinates are invalid', []);
    }
    return point;
}
//# sourceMappingURL=routing-service.js.map