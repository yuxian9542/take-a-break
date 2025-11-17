import { describe, expect, it } from 'vitest';
import { RoutingService, RoutingServiceError } from '../src/routing/routing-service.js';
import { InMemoryPlacesRepository } from '../src/repositories/places-repository.js';
import { RouteEngineError } from '../src/routing/route-engine.js';
class FailingEngine {
    id = 'failing-engine';
    supports(mode) {
        return mode === 'walking';
    }
    async computeRoute() {
        throw new RouteEngineError('engine offline');
    }
}
class FixedEngine {
    polyline;
    id = 'fixed-engine';
    constructor(polyline) {
        this.polyline = polyline;
    }
    supports(mode) {
        return mode === 'walking';
    }
    async computeRoute(input) {
        const points = [...this.polyline, input.destination].map((point, index) => ({
            ...point,
            sequence: index
        }));
        return {
            summary: {
                distanceMeters: 42,
                durationSeconds: 60,
                mode: 'walking'
            },
            polyline: points
        };
    }
}
describe('RoutingService', () => {
    const repo = new InMemoryPlacesRepository([
        {
            id: 'cafe',
            name: 'Cafe',
            lat: 1.001,
            lng: 1.002,
            address: 'Somewhere',
            distanceMeters: 0,
            types: ['coffee']
        }
    ]);
    it('returns a heuristic walking route', async () => {
        const service = new RoutingService(repo);
        const route = await service.getWalkingRoute({
            origin: { lat: 1, lng: 1 },
            destinationId: 'cafe'
        });
        expect(route.summary.mode).toBe('walking');
        expect(route.summary.distanceMeters).toBeGreaterThan(0);
        expect(route.polyline.length).toBeGreaterThan(1);
    });
    it('falls back when a primary engine fails', async () => {
        const service = new RoutingService(repo, {
            engines: [new FailingEngine()]
        });
        const route = await service.getWalkingRoute({
            origin: { lat: 1, lng: 1 },
            destinationId: 'cafe'
        });
        expect(route.summary.distanceMeters).toBeGreaterThan(0);
    });
    it('throws when destination cannot be resolved', async () => {
        const service = new RoutingService(repo);
        await expect(service.getWalkingRoute({
            origin: { lat: 1, lng: 1 },
            destinationId: 'missing'
        })).rejects.toBeInstanceOf(RoutingServiceError);
    });
    it('can use a deterministic engine when provided', async () => {
        const engine = new FixedEngine([{ lat: 1, lng: 1 }]);
        const service = new RoutingService(repo, {
            engines: [engine]
        });
        const route = await service.getWalkingRoute({
            origin: { lat: 1, lng: 1 },
            destinationId: 'cafe'
        });
        expect(route.polyline[0].sequence).toBe(0);
        expect(route.summary.durationSeconds).toBe(60);
    });
});
//# sourceMappingURL=routing-service.test.js.map