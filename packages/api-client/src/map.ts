import type {
  GeolocationMode,
  LatLng,
  LocationError,
  LocationRequestParams,
  LocationState,
  NearbyParams,
  NearbyPlace,
  NearbyResponse,
  RoutePoint,
  RouteRequest,
  RouteResponse,
  RouteSummary
} from '@take-a-break/types';
import { HttpClient } from './http-client';
import type { HttpClientConfig } from './http-client';

export type {
  LatLng,
  GeolocationMode,
  LocationState,
  LocationError,
  NearbyParams,
  NearbyPlace,
  NearbyResponse,
  RouteRequest,
  RoutePoint,
  RouteSummary,
  RouteResponse,
  LocationRequestParams
} from '@take-a-break/types';

export interface MapApiClientConfig extends HttpClientConfig {}

export class MapApiClient {
  private readonly http: HttpClient;

  constructor(config: MapApiClientConfig | HttpClient) {
    this.http = config instanceof HttpClient ? config : new HttpClient(config);
  }

  static from(config: MapApiClientConfig): MapApiClient {
    return new MapApiClient(config);
  }

  async getNearbyPlaces(params: NearbyParams): Promise<NearbyResponse> {
    validateLatLng(params);
    const query = buildNearbyQuery(params);
    return this.http.get<NearbyResponse>('/map/nearby', { query });
  }

  async getCurrentLocation(
    params?: LocationRequestParams & Partial<LatLng> & { accuracyMeters?: number }
  ): Promise<LocationState> {
    const query = buildLocationQuery(params);
    return this.http.get<LocationState>('/map/location', { query });
  }

  async getWalkingRoute(request: RouteRequest): Promise<RouteResponse> {
    validateLatLng(request.origin);
    return this.http.post<RouteResponse>('/map/route', {
      body: request
    });
  }
}

function buildNearbyQuery(params: NearbyParams): Record<string, string | number> {
  const query: Record<string, string | number> = {
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

function buildLocationQuery(
  params?: LocationRequestParams & Partial<LatLng> & { accuracyMeters?: number }
): Record<string, string | number | boolean> | undefined {
  if (!params) {
    return undefined;
  }

  const query: Record<string, string | number | boolean> = {};

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

function validateLatLng(point: LatLng) {
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
    throw new Error('Latitude and longitude must be finite numbers');
  }
}

function formatCoordinate(value: number): string {
  return value.toFixed(6);
}
