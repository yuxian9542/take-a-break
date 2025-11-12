import { HttpClient } from './http-client';
export class MapApiClient {
    http;
    constructor(config) {
        this.http = config instanceof HttpClient ? config : new HttpClient(config);
    }
    static from(config) {
        return new MapApiClient(config);
    }
    async getNearbyPlaces(params) {
        validateLatLng(params);
        const query = buildNearbyQuery(params);
        return this.http.get('/map/nearby', { query });
    }
    async getCurrentLocation(params) {
        const query = buildLocationQuery(params);
        return this.http.get('/map/location', { query });
    }
    async getWalkingRoute(request) {
        validateLatLng(request.origin);
        return this.http.post('/map/route', {
            body: request
        });
    }
}
function buildNearbyQuery(params) {
    const query = {
        lat: formatCoordinate(params.lat),
        lng: formatCoordinate(params.lng)
    };
    if (typeof params.radius === 'number') {
        query.radius = params.radius;
    }
    if (typeof params.limit === 'number') {
        query.limit = params.limit;
    }
    if (params.types) {
        query.types = params.types;
    }
    return query;
}
function buildLocationQuery(params) {
    if (!params) {
        return undefined;
    }
    const query = {};
    if (params.mode) {
        query.mode = params.mode;
    }
    if (typeof params.timeoutMs === 'number') {
        query.timeoutMs = params.timeoutMs;
    }
    if (typeof params.allowModeFallback === 'boolean') {
        query.allowModeFallback = params.allowModeFallback;
    }
    if (typeof params.allowStale === 'boolean') {
        query.allowStale = params.allowStale;
    }
    if (typeof params.lat === 'number') {
        query.lat = formatCoordinate(params.lat);
    }
    if (typeof params.lng === 'number') {
        query.lng = formatCoordinate(params.lng);
    }
    if (typeof params.accuracyMeters === 'number') {
        query.accuracyMeters = Math.round(params.accuracyMeters);
    }
    return query;
}
function validateLatLng(point) {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
        throw new Error('Latitude and longitude must be finite numbers');
    }
}
function formatCoordinate(value) {
    return value.toFixed(6);
}
//# sourceMappingURL=map.js.map