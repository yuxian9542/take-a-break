const EARTH_RADIUS_METERS = 6371000;
const DEFAULT_INTERPOLATION_STEPS = 6;
const DEFAULT_WALKING_SPEED_MPS = 1.4;
export function haversineDistanceMeters(a, b) {
    const dLat = toRadians(b.lat - a.lat);
    const dLng = toRadians(b.lng - a.lng);
    const lat1 = toRadians(a.lat);
    const lat2 = toRadians(b.lat);
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const h = sinLat * sinLat +
        sinLng * sinLng * Math.cos(lat1) * Math.cos(lat2);
    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.max(0, h)));
}
export function interpolatePoints(start, end, steps = DEFAULT_INTERPOLATION_STEPS) {
    if (steps < 1) {
        return [start, end];
    }
    const points = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        points.push({
            lat: lerp(start.lat, end.lat, t),
            lng: lerp(start.lng, end.lng, t)
        });
    }
    return points;
}
export function buildRoutePolyline(start, end, steps = DEFAULT_INTERPOLATION_STEPS) {
    return interpolatePoints(start, end, steps).map((point, index) => ({
        ...point,
        sequence: index
    }));
}
export function estimateWalkingDurationSeconds(distanceMeters, walkingSpeedMps = DEFAULT_WALKING_SPEED_MPS) {
    if (walkingSpeedMps <= 0) {
        throw new Error('Walking speed must be greater than zero');
    }
    const duration = distanceMeters / walkingSpeedMps;
    return Math.max(60, Math.round(duration));
}
function toRadians(value) {
    return (value * Math.PI) / 180;
}
function lerp(start, end, t) {
    return start + (end - start) * t;
}
//# sourceMappingURL=geo.js.map