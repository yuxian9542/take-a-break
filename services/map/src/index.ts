// Location services
export { LocationService, LocationServiceError } from './location/location-service';
export { LocationProviderError } from './providers/location-provider';
export type { LocateRequest, LocationProvider } from './providers/location-provider';

// Places repositories
export { InMemoryPlacesRepository } from './repositories/places-repository';
export { GooglePlacesRepository } from './providers/google-places-provider';
export type { PlacesRepository } from './repositories/places-repository';
export type { GooglePlacesConfig } from './providers/google-places-provider';

// Routing services
export { RoutingService, RoutingServiceError } from './routing/routing-service';
export { RouteEngineError } from './routing/route-engine';
export { HeuristicRouteEngine } from './routing/engines/heuristic-engine';
export { GoogleDirectionsEngine } from './routing/engines/google-directions-engine';
export type { RouteEngine, RouteInput, RouteMode } from './routing/route-engine';
export type { RoutingServiceOptions } from './routing/routing-service';
export type { GoogleDirectionsConfig } from './routing/engines/google-directions-engine';
