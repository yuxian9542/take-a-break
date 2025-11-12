import { RouteEngineError } from '../route-engine';
import { buildRoutePolyline, estimateWalkingDurationSeconds, haversineDistanceMeters } from '../../utils/geo';
export class HeuristicRouteEngine {
    id = 'heuristic';
    interpolationSteps;
    walkingSpeedMps;
    constructor(options) {
        this.interpolationSteps = options?.interpolationSteps ?? 6;
        this.walkingSpeedMps = options?.walkingSpeedMps ?? 1.4;
    }
    supports(mode) {
        return mode === 'walking';
    }
    async computeRoute(input) {
        if (!this.supports(input.mode)) {
            throw new RouteEngineError(`Mode ${input.mode} is not supported by heuristic engine`);
        }
        const distanceMeters = Math.round(haversineDistanceMeters(input.origin, input.destination));
        const durationSeconds = estimateWalkingDurationSeconds(distanceMeters, this.walkingSpeedMps);
        const polyline = buildRoutePolyline(input.origin, input.destination, this.interpolationSteps);
        return {
            origin: input.origin,
            destination: input.destination,
            summary: {
                distanceMeters,
                durationSeconds,
                mode: 'walking'
            },
            polyline
        };
    }
}
//# sourceMappingURL=heuristic-engine.js.map