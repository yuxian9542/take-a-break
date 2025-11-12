/**
 * React Hook for Map Integration
 * 
 * This hook provides an easy way to integrate map functionality
 * into React components.
 * 
 * Usage example:
 * ```typescript
 * import { useMapIntegration } from './hooks/useMapIntegration';
 * 
 * function MyComponent() {
 *   const {
 *     currentLocation,
 *     nearbyPlaces,
 *     isLoading,
 *     error,
 *     fetchNearbyPlaces,
 *     getRoute
 *   } = useMapIntegration();
 * 
 *   // Use the hook data in your component
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { mapService } from '../services/mapService';
import type { LocationState, NearbyPlace, RouteResponse } from '../services/mapService';

interface UseMapIntegrationResult {
  currentLocation: LocationState | null;
  nearbyPlaces: NearbyPlace[];
  currentRoute: RouteResponse | null;
  isLoading: boolean;
  error: Error | null;
  fetchCurrentLocation: () => Promise<void>;
  fetchNearbyPlaces: (lat: number, lng: number, options?: {
    radius?: number;
    types?: string;
    limit?: number;
  }) => Promise<void>;
  getRoute: (origin: { lat: number; lng: number }, destinationId: string) => Promise<void>;
}

export function useMapIntegration(): UseMapIntegrationResult {
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [currentRoute, setCurrentRoute] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const location = await mapService.getCurrentLocation();
      setCurrentLocation(location);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchNearbyPlaces = useCallback(async (
    lat: number,
    lng: number,
    options?: {
      radius?: number;
      types?: string;
      limit?: number;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const places = await mapService.getNearbyPlaces(lat, lng, options);
      setNearbyPlaces(places);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRoute = useCallback(async (
    origin: { lat: number; lng: number },
    destinationId: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const route = await mapService.getRoute(origin, destinationId);
      setCurrentRoute(route);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch location on mount
  useEffect(() => {
    fetchCurrentLocation();
  }, [fetchCurrentLocation]);

  return {
    currentLocation,
    nearbyPlaces,
    currentRoute,
    isLoading,
    error,
    fetchCurrentLocation,
    fetchNearbyPlaces,
    getRoute
  };
}



