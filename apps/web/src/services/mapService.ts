import { mockSpots, type RelaxationSpot } from '@take-a-break/break-plans';
import { browserMapService, type NearbyPlace } from './browserMapService';

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

const WALKING_SPEED_METERS_PER_MINUTE = 80;

const CATEGORY_RULES: Array<{
  match: (types: string[]) => boolean;
  category: RelaxationSpot['category'];
}> = [
  {
    match: (types) => types.some((type) => type.includes('park') || type.includes('trail')),
    category: 'park'
  },
  {
    match: (types) => types.some((type) => type.includes('cafe') || type.includes('coffee')),
    category: 'cafe'
  },
  {
    match: (types) => types.some((type) => type.includes('water') || type.includes('river')),
    category: 'waterfront'
  },
  {
    match: (types) => types.some((type) => type.includes('library') || type.includes('quiet')),
    category: 'quiet_space'
  }
];

function deriveCategory(types: string[]): RelaxationSpot['category'] {
  const lowerTypes = types.map((type) => type.toLowerCase());

  const matchedRule = CATEGORY_RULES.find((rule) => rule.match(lowerTypes));
  return matchedRule ? matchedRule.category : 'indoor';
}

function deriveDuration(distanceMeters: number | undefined) {
  const safeDistance = Number.isFinite(distanceMeters) ? (distanceMeters as number) : 400;
  return Math.max(2, Math.round(safeDistance / WALKING_SPEED_METERS_PER_MINUTE));
}

function formatDescription(place: NearbyPlace) {
  const fragments: string[] = [];

  if (place.address) {
    fragments.push(place.address);
  }

  if (place.isOpenNow !== undefined) {
    fragments.push(place.isOpenNow ? 'Currently open' : 'May be closed');
  }

  if (place.rating) {
    fragments.push(`Google rating ${place.rating.toFixed(1)}`);
  }

  return fragments.length > 0 ? fragments.join(' · ') : 'Nearby place suggested by map service.';
}

function normalizeAmenityTags(types: string[] = []) {
  return types
    .map((type) =>
      type
        .split('_')
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .join(' ')
    )
    .filter(Boolean)
    .slice(0, 5);
}

function adaptNearbyPlace(place: NearbyPlace): RelaxationSpot {
  const category = deriveCategory(place.types ?? []);
  const description = formatDescription(place);
  const distanceMeters = Number.isFinite(place.distanceMeters) ? place.distanceMeters : 400;

  return {
    id: place.id,
    name: place.name,
    category,
    description,
    amenityTags: normalizeAmenityTags(place.types ?? []),
    distanceMeters,
    durationMinutes: deriveDuration(distanceMeters),
    coordinates: {
      lat: place.lat,
      lng: place.lng
    }
  };
}

export async function getNearbySpots(position?: UserPosition): Promise<RelaxationSpot[]> {
  let resolvedPosition = position;

  if (!resolvedPosition) {
    resolvedPosition = await getUserPosition();
  }

  try {
    const places = await browserMapService.getNearbyPlaces(resolvedPosition.lat, resolvedPosition.lng);

    if (!places || places.length === 0) {
      return mockSpots;
    }

    return places.map(adaptNearbyPlace);
  } catch (error) {
    console.warn('[mapService] Failed to load nearby places from API, falling back to mock data.', error);
    return mockSpots;
  }
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

