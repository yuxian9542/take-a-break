/**
 * Geographic coordinates
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Nearby location response item
 */
export interface NearbyLocation {
  name: string;
  address: string;
  coordinates: Coordinates;
  distance: number; // meters
  category: string;
}

/**
 * Query parameters for GET /map/nearby
 */
export interface NearbyRequest {
  lat: number;
  lng: number;
  radius: number; // meters
  category?: string;
}

/**
 * Response for GET /map/nearby
 */
export type NearbyResponse = NearbyLocation[];

/**
 * Route waypoint coordinates
 */
export interface RouteWaypoint {
  lat: number;
  lng: number;
}

/**
 * Request body for GET/POST /map/route
 */
export interface RouteRequest {
  start: Coordinates;
  end: Coordinates;
  waypoints?: RouteWaypoint[];
}

/**
 * Response for GET/POST /map/route
 */
export interface RouteResponse {
  distance: number; // meters
  duration: number; // seconds
  polyline: string; // encoded polyline string for map rendering
}


