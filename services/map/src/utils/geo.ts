import type { LatLng, RoutePoint } from '@take-a-break/types';

const EARTH_RADIUS_METERS = 6371000;
const DEFAULT_INTERPOLATION_STEPS = 6;
const DEFAULT_WALKING_SPEED_MPS = 1.4;

export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h =
    sinLat * sinLat +
    sinLng * sinLng * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.max(0, h)));
}

export function interpolatePoints(
  start: LatLng,
  end: LatLng,
  steps: number = DEFAULT_INTERPOLATION_STEPS
): LatLng[] {
  if (steps < 1) {
    return [start, end];
  }

  const points: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      lat: lerp(start.lat, end.lat, t),
      lng: lerp(start.lng, end.lng, t)
    });
  }
  return points;
}

export function buildRoutePolyline(
  start: LatLng,
  end: LatLng,
  steps: number = DEFAULT_INTERPOLATION_STEPS
): RoutePoint[] {
  return interpolatePoints(start, end, steps).map((point, index) => ({
    ...point,
    sequence: index
  }));
}

export function estimateWalkingDurationSeconds(
  distanceMeters: number,
  walkingSpeedMps: number = DEFAULT_WALKING_SPEED_MPS
): number {
  if (walkingSpeedMps <= 0) {
    throw new Error('Walking speed must be greater than zero');
  }

  const duration = distanceMeters / walkingSpeedMps;
  return Math.max(60, Math.round(duration));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
