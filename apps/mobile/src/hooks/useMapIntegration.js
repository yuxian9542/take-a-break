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
export function useMapIntegration() {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [currentRoute, setCurrentRoute] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchCurrentLocation = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const location = await mapService.getCurrentLocation();
            setCurrentLocation(location);
        }
        catch (err) {
            setError(err);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    const fetchNearbyPlaces = useCallback(async (lat, lng, options) => {
        setIsLoading(true);
        setError(null);
        try {
            const places = await mapService.getNearbyPlaces(lat, lng, options);
            setNearbyPlaces(places);
        }
        catch (err) {
            setError(err);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    const getRoute = useCallback(async (origin, destinationId) => {
        setIsLoading(true);
        setError(null);
        try {
            const route = await mapService.getRoute(origin, destinationId);
            setCurrentRoute(route);
        }
        catch (err) {
            setError(err);
        }
        finally {
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
//# sourceMappingURL=useMapIntegration.js.map