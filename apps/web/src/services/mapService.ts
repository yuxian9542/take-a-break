import { mockSpots } from '@take-a-break/break-plans';

export type UserPosition = {
  lat: number;
  lng: number;
  accuracyMeters?: number;
};

export type RoutePolyline = Array<{ lat: number; lng: number }>;

export async function getUserPosition(): Promise<UserPosition> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return fallbackPosition();
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 120000
      });
    });

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracyMeters: position.coords.accuracy ?? undefined
    };
  } catch (error) {
    console.warn('[mapService] Failed to read browser location, falling back to mock data.', error);
    return fallbackPosition();
  }
}

export async function getNearbySpots() {
  return mockSpots;
}

export function getMockRoute(origin: UserPosition, destination: { lat: number; lng: number }): RoutePolyline {
  // Simple two-point polyline with slight curvature so the map can render a line.
  const midLat = (origin.lat + destination.lat) / 2 + 0.001;
  const midLng = (origin.lng + destination.lng) / 2 - 0.001;

  return [
    { lat: origin.lat, lng: origin.lng },
    { lat: midLat, lng: midLng },
    { lat: destination.lat, lng: destination.lng }
  ];
}

function fallbackPosition(): UserPosition {
  const firstSpot = mockSpots[0];
  return {
    lat: firstSpot.coordinates.lat - 0.002,
    lng: firstSpot.coordinates.lng + 0.002
  };
}

