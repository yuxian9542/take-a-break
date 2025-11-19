import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import {
  LocationService,
  RoutingService,
  InMemoryPlacesRepository,
  GooglePlacesRepository,
  GoogleDirectionsEngine,
  LocationProviderError
} from '@take-a-break/map';
import { loadConfig } from '@take-a-break/config';
import type {
  GeolocationMode,
  LocationState,
  NearbyParams,
  NearbyPlace,
  NearbyResponse,
  RouteRequest,
  RouteResponse
} from '@take-a-break/types';
import type { LocateRequest, LocationProvider, PlacesRepository } from '@take-a-break/map';

// Mock location provider for development
// TODO: Replace with real device location provider
class MockLocationProvider implements LocationProvider {
  readonly id = 'mock-provider';

  supports(_mode: GeolocationMode): boolean {
    return true;
  }

  async locate(request: LocateRequest): Promise<LocationState> {
    // Mock location - New York Long Island (fallback for development)
    // Note: This should only be used when device location is unavailable
    return {
      lat: 40.7829,
      lng: -73.9654,
      accuracyMeters: 10,
      mode: request.mode,
      updatedAt: new Date().toISOString(),
      isStale: false
    };
  }
}

class ForwardedLocationProvider implements LocationProvider {
  readonly id = 'forwarded-location';

  constructor(
    private readonly coords: {
      lat: number;
      lng: number;
      accuracyMeters?: number;
    }
  ) {}

  supports(_mode: GeolocationMode): boolean {
    return Number.isFinite(this.coords.lat) && Number.isFinite(this.coords.lng);
  }

  async locate(request: LocateRequest): Promise<LocationState> {
    if (!this.supports(request.mode)) {
      throw new LocationProviderError('Forwarded coordinates are invalid', 'UNKNOWN');
    }

    return {
      lat: this.coords.lat,
      lng: this.coords.lng,
      accuracyMeters: this.coords.accuracyMeters,
      mode: request.mode,
      updatedAt: new Date().toISOString(),
      isStale: false
    };
  }
}

// Mock places data for development
const mockPlaces: NearbyPlace[] = [
  {
    id: 'spot_001',
    name: 'Riverside Park - Cherry Walk',
    lat: 40.7829,
    lng: -73.9654,
    address: 'Riverside Park, New York, NY',
    distanceMeters: 0,
    types: ['park', 'nature'],
    rating: 4.8,
    isOpenNow: true
  },
  {
    id: 'spot_002',
    name: 'Tranquil Grounds Cafe',
    lat: 40.7825,
    lng: -73.97,
    address: 'Upper West Side, New York, NY',
    distanceMeters: 0,
    types: ['cafe', 'food'],
    rating: 4.6,
    isOpenNow: true
  },
  {
    id: 'spot_003',
    name: 'Hudson River Overlook',
    lat: 40.7835,
    lng: -73.964,
    address: 'Hudson River Park, New York, NY',
    distanceMeters: 0,
    types: ['waterfront', 'park'],
    rating: 4.7,
    isOpenNow: true
  },
  {
    id: 'spot_004',
    name: 'Central Park - Conservatory Garden',
    lat: 40.7945,
    lng: -73.952,
    address: 'Central Park, New York, NY',
    distanceMeters: 0,
    types: ['park'],
    rating: 4.9,
    isOpenNow: true
  },
  {
    id: 'spot_005',
    name: 'Public Library Reading Room',
    lat: 40.7532,
    lng: -73.9822,
    address: '476 5th Ave, New York, NY',
    distanceMeters: 0,
    types: ['indoor', 'quiet_space'],
    rating: 4.5,
    isOpenNow: true
  },
  {
    id: 'spot_006',
    name: 'Meditation Corner - 82nd Street',
    lat: 40.7845,
    lng: -73.971,
    address: '82nd St, New York, NY',
    distanceMeters: 0,
    types: ['quiet_space'],
    rating: 4.2,
    isOpenNow: true
  },
  {
    id: 'spot_007',
    name: 'Riverside Park - Dog Hill',
    lat: 40.789,
    lng: -73.9635,
    address: 'Riverside Park, New York, NY',
    distanceMeters: 0,
    types: ['park'],
    rating: 4.4,
    isOpenNow: true
  },
  {
    id: 'spot_008',
    name: 'Bloom Coffee Roasters',
    lat: 40.7818,
    lng: -73.972,
    address: 'Columbus Ave, New York, NY',
    distanceMeters: 0,
    types: ['cafe', 'food'],
    rating: 4.7,
    isOpenNow: true
  },
  {
    id: 'spot_009',
    name: 'Pier 84 - Hudson River Park',
    lat: 40.765,
    lng: -73.997,
    address: 'Pier 84, New York, NY',
    distanceMeters: 0,
    types: ['waterfront', 'park'],
    rating: 4.6,
    isOpenNow: true
  },
  {
    id: 'spot_010',
    name: 'Museum of Natural History - Quiet Halls',
    lat: 40.7813,
    lng: -73.974,
    address: '200 Central Park W, New York, NY',
    distanceMeters: 0,
    types: ['indoor'],
    rating: 4.8,
    isOpenNow: true
  },
  // San Francisco locations (for iOS Simulator default location)
  {
    id: 'sf_001',
    name: 'Golden Gate Park - Japanese Tea Garden',
    lat: 37.7702,
    lng: -122.4703,
    address: 'Golden Gate Park, San Francisco, CA',
    distanceMeters: 0,
    types: ['park', 'nature'],
    rating: 4.7,
    isOpenNow: true
  },
  {
    id: 'sf_002',
    name: 'Yerba Buena Gardens',
    lat: 37.7849,
    lng: -122.4024,
    address: '750 Howard St, San Francisco, CA',
    distanceMeters: 0,
    types: ['park', 'quiet_space'],
    rating: 4.6,
    isOpenNow: true
  },
  {
    id: 'sf_003',
    name: 'Blue Bottle Coffee - Mint Plaza',
    lat: 37.7815,
    lng: -122.4094,
    address: 'Mint Plaza, San Francisco, CA',
    distanceMeters: 0,
    types: ['cafe', 'food'],
    rating: 4.5,
    isOpenNow: true
  },
  {
    id: 'sf_004',
    name: 'Embarcadero Waterfront',
    lat: 37.7955,
    lng: -122.3937,
    address: 'The Embarcadero, San Francisco, CA',
    distanceMeters: 0,
    types: ['waterfront', 'park'],
    rating: 4.8,
    isOpenNow: true
  },
  {
    id: 'sf_005',
    name: 'Palace of Fine Arts',
    lat: 37.8026,
    lng: -122.4486,
    address: '3601 Lyon St, San Francisco, CA',
    distanceMeters: 0,
    types: ['park', 'scenic'],
    rating: 4.8,
    isOpenNow: true
  },
  {
    id: 'sf_006',
    name: 'San Francisco Public Library - Main',
    lat: 37.7794,
    lng: -122.4160,
    address: '100 Larkin St, San Francisco, CA',
    distanceMeters: 0,
    types: ['indoor', 'quiet_space'],
    rating: 4.4,
    isOpenNow: true
  },
  {
    id: 'sf_007',
    name: 'Crissy Field',
    lat: 37.8024,
    lng: -122.4645,
    address: 'Crissy Field, San Francisco, CA',
    distanceMeters: 0,
    types: ['park', 'waterfront'],
    rating: 4.7,
    isOpenNow: true
  },
  {
    id: 'sf_008',
    name: 'Ritual Coffee Roasters',
    lat: 37.7512,
    lng: -122.4214,
    address: '1026 Valencia St, San Francisco, CA',
    distanceMeters: 0,
    types: ['cafe', 'food'],
    rating: 4.6,
    isOpenNow: true
  }
];

// Initialize repositories and services
const config = loadConfig();
const googleMapsApiKey = config.GOOGLE_MAPS_API_KEY;
const useRealMapApi = config.USE_REAL_MAP_API;

// Initialize places repository
let placesRepo: PlacesRepository;
if (useRealMapApi && googleMapsApiKey) {
  console.log('[MapService] Using Google Places API');
  placesRepo = new GooglePlacesRepository({
    apiKey: googleMapsApiKey,
    language: 'en'
  });
} else {
  console.log('[MapService] Using mock places data');
  placesRepo = new InMemoryPlacesRepository(mockPlaces);
}

// Initialize routing service
let routingService: RoutingService;
if (useRealMapApi && googleMapsApiKey) {
  console.log('[MapService] Using Google Directions API');
  const googleDirectionsEngine = new GoogleDirectionsEngine({
    apiKey: googleMapsApiKey,
    language: 'en'
  });
  routingService = new RoutingService(placesRepo, {
    engines: [googleDirectionsEngine]
  });
} else {
  console.log('[MapService] Using heuristic routing');
  routingService = new RoutingService(placesRepo);
}

// Initialize location service
const mockLocationProvider = new MockLocationProvider();
const locationService = new LocationService([mockLocationProvider]);

async function mapRoutes(fastify: FastifyInstance) {
  // GET /map/location
  fastify.get<{
    Querystring: {
      mode?: string;
      timeoutMs?: number;
      allowModeFallback?: boolean;
      allowStale?: boolean;
      lat?: number | string;
      lng?: number | string;
      accuracyMeters?: number | string;
    };
  }>('/map/location', async (request): Promise<LocationState> => {
    const { mode, timeoutMs, allowModeFallback, allowStale, lat, lng, accuracyMeters } =
      request.query;

    const params = {
      mode: mode as 'highAccuracy' | 'batterySaving' | undefined,
      timeoutMs,
      allowModeFallback,
      allowStale
    };

    const forwarded = extractForwardedLocation({ lat, lng, accuracyMeters });
    const service = forwarded
      ? new LocationService(
          [new ForwardedLocationProvider(forwarded), mockLocationProvider],
          {
            allowModeFallback: true
          }
        )
      : locationService;

    const location = await service.getCurrentLocation(params);
    return location;
  });

  // GET /map/nearby
  fastify.get<{
    Querystring: {
      lat: number;
      lng: number;
      radius?: number;
      types?: string;
      limit?: number;
    };
  }>('/map/nearby', async (request): Promise<NearbyResponse> => {
    const { lat, lng, radius, types, limit } = request.query;

    if (!lat || !lng) {
      throw new Error('lat and lng are required parameters');
    }

    const params: NearbyParams = {
      lat: Number(lat),
      lng: Number(lng),
      radius,
      types,
      limit
    };

    const places = await placesRepo.findNearby(params);
    return { places };
  });

  // POST /map/route
  fastify.post<{
    Body: RouteRequest;
  }>('/map/route', async (request): Promise<RouteResponse> => {
    const body = request.body as RouteRequest;
    const { origin, destinationId } = body;

    if (!origin || !destinationId) {
      throw new Error('origin and destinationId are required');
    }

    const route = await routingService.getWalkingRoute({
      origin,
      destinationId
    });

    return route;
  });
}

function extractForwardedLocation(input: {
  lat?: number | string;
  lng?: number | string;
  accuracyMeters?: number | string;
}):
  | {
      lat: number;
      lng: number;
      accuracyMeters?: number;
    }
  | undefined {
  const lat = typeof input.lat === 'number' ? input.lat : input.lat ? Number(input.lat) : null;
  const lng = typeof input.lng === 'number' ? input.lng : input.lng ? Number(input.lng) : null;

  if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return undefined;
  }

  return {
    lat,
    lng,
    accuracyMeters: (() => {
      if (typeof input.accuracyMeters === 'number') {
        return input.accuracyMeters;
      }
      if (typeof input.accuracyMeters === 'string') {
        const parsed = Number(input.accuracyMeters);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    })()
  };
}

export default fp(mapRoutes, {
  name: 'map-routes'
});
