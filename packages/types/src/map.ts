// Shared map contracts reused by services and clients.

export type LatLng = {
  lat: number;
  lng: number;
};

// Location ------------------------------------

export type GeolocationMode = 'highAccuracy' | 'batterySaving';

export interface LocationState extends LatLng {
  accuracyMeters?: number;
  mode: GeolocationMode;
  updatedAt: string; // ISO 8601 timestamp
  isStale?: boolean;
}

export interface LocationRequestParams {
  mode?: GeolocationMode;
  timeoutMs?: number;
  allowModeFallback?: boolean;
  allowStale?: boolean;
}

export interface LocationError {
  code: 'PERMISSION_DENIED' | 'PROVIDER_OFF' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}

// Nearby --------------------------------------

export interface NearbyParams extends LatLng {
  radius?: number; // meters, default 1000
  types?: string; // comma separated, e.g. "coffee,park"
  limit?: number; // default 20, max 50
}

export type NearbyPlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  distanceMeters: number;
  types: string[];
  rating?: number;
  isOpenNow?: boolean;
};

export interface NearbyResponse {
  places: NearbyPlace[];
}

// Routing -------------------------------------

export interface RouteRequest {
  origin: LatLng;
  destinationId: string; // ties back to NearbyPlace.id
}

export interface RoutePoint extends LatLng {
  sequence: number; // client uses sequence to plot polyline
}

export interface RouteSummary {
  distanceMeters: number;
  durationSeconds: number;
  mode: 'walking';
}

export interface RouteResponse {
  origin: LatLng;
  destination: LatLng;
  summary: RouteSummary;
  polyline: RoutePoint[];
  steps?: Array<{
    instruction: string;
    distanceMeters: number;
    durationSeconds: number;
    startLocation: LatLng;
    endLocation: LatLng;
  }>;
}

