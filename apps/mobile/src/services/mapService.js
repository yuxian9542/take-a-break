import { MapApiClient } from '@take-a-break/api-client';
import * as ExpoLocation from 'expo-location';
import { NativeModules, Platform } from 'react-native';
// API endpoint configuration
// TODO: Move to environment configuration
const API_BASE_URL = resolveApiBaseUrl();
// Create API client instance
const apiClient = new MapApiClient({
    baseUrl: API_BASE_URL,
    defaultHeaders: {
        'Content-Type': 'application/json'
    }
});
/**
 * Map Service
 *
 * Provides location and mapping functionality for the mobile app.
 * Integrates device location with backend API.
 */
class MapService {
    /**
     * Get current device location
     *
     * This method:
     * 1. Requests location permissions if needed
     * 2. Gets device GPS coordinates
     * 3. Forwards coordinates to backend API for processing
     */
    async getCurrentLocation(params) {
        try {
            console.log('[MapService] Getting current location with API URL:', API_BASE_URL);
            // Request location permissions
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Location permission denied, using API fallback');
                // Fall back to API's mock location
                return apiClient.getCurrentLocation(params);
            }
            // Check if location services are enabled
            const servicesEnabled = await ExpoLocation.hasServicesEnabledAsync();
            if (!servicesEnabled) {
                console.warn('Location services disabled, using API fallback');
                return apiClient.getCurrentLocation(params);
            }
            // Get device location
            const locationAccuracy = params?.mode === 'highAccuracy'
                ? ExpoLocation.LocationAccuracy.Highest
                : ExpoLocation.LocationAccuracy.Balanced;
            const locationPromise = ExpoLocation.getCurrentPositionAsync({
                accuracy: locationAccuracy
            });
            const location = params?.timeoutMs
                ? await this.resolveWithTimeout(locationPromise, params.timeoutMs)
                : await locationPromise;
            console.log('[MapService] Device location obtained:', {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
                accuracy: location.coords.accuracy
            });
            // Forward device coordinates to API
            return apiClient.getCurrentLocation({
                ...params,
                lat: location.coords.latitude,
                lng: location.coords.longitude,
                accuracyMeters: location.coords.accuracy ?? undefined
            });
        }
        catch (error) {
            console.error('[MapService] Error getting current location:', error);
            if (error instanceof Error) {
                console.error('[MapService] Error details:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack
                });
            }
            // Fall back to API's mock location
            return apiClient.getCurrentLocation(params);
        }
    }
    async resolveWithTimeout(promise, timeoutMs) {
        let timeoutId;
        try {
            return await Promise.race([
                promise,
                new Promise((_, reject) => {
                    timeoutId = setTimeout(() => {
                        reject(new Error('Location request timed out'));
                    }, timeoutMs);
                })
            ]);
        }
        finally {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
        }
    }
    /**
     * Get nearby places
     */
    async getNearbyPlaces(lat, lng, options) {
        try {
            console.log('[MapService] Fetching nearby places:', { lat, lng, options });
            const response = await apiClient.getNearbyPlaces({
                lat,
                lng,
                ...options
            });
            console.log('[MapService] Found', response.places.length, 'nearby places');
            return response.places;
        }
        catch (error) {
            console.error('[MapService] Error fetching nearby places:', error);
            if (error instanceof Error) {
                console.error('[MapService] Error details:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack
                });
            }
            throw error;
        }
    }
    /**
     * Get walking route to destination
     */
    async getRoute(origin, destinationId) {
        try {
            console.log('[MapService] Fetching route:', { origin, destinationId });
            const response = await apiClient.getWalkingRoute({
                origin,
                destinationId
            });
            console.log('[MapService] Route fetched successfully');
            return response;
        }
        catch (error) {
            console.error('[MapService] Error fetching route:', error);
            if (error instanceof Error) {
                console.error('[MapService] Error details:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack
                });
            }
            throw error;
        }
    }
}
// Export singleton instance
export const mapService = new MapService();
function resolveApiBaseUrl() {
    const explicit = getExplicitBaseUrl();
    if (explicit) {
        console.log('[MapService] Using explicit API base URL:', explicit);
        return explicit;
    }
    if (__DEV__) {
        const port = getDevApiPort();
        const host = getDevServerHost() ?? getPlatformFallbackHost();
        const url = `http://${host}:${port}`;
        console.log('[MapService] Resolved API base URL:', url);
        return url;
    }
    const prodUrl = 'https://108.21.91.47:3333';
    console.log('[MapService] Using production API base URL:', prodUrl);
    return prodUrl;
}
function getExplicitBaseUrl() {
    const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL ??
        process.env.API_BASE_URL ??
        getGlobalString('TAKE_A_BREAK_API_BASE_URL');
    if (typeof fromEnv === 'string' && fromEnv.length > 0) {
        return normalizeUrl(fromEnv);
    }
    return undefined;
}
function getDevApiPort() {
    const fromEnv = process.env.EXPO_PUBLIC_API_PORT ?? process.env.API_PORT;
    const parsed = fromEnv ? Number(fromEnv) : NaN;
    // Changed default port to 3333 to match API server default
    return Number.isFinite(parsed) ? parsed : 3333;
}
function getDevServerHost() {
    const scriptURL = (NativeModules?.SourceCode?.scriptURL ?? null);
    if (typeof scriptURL === 'string') {
        try {
            const { hostname } = new URL(scriptURL);
            if (hostname) {
                return mapHostForPlatform(hostname);
            }
        }
        catch (error) {
            console.warn('Unable to parse Metro script URL for API host resolution:', error);
        }
    }
    const globalHost = getGlobalString('TAKE_A_BREAK_DEV_SERVER_HOST');
    if (typeof globalHost === 'string' && globalHost.length > 0) {
        return mapHostForPlatform(globalHost);
    }
    return undefined;
}
function getGlobalString(key) {
    if (typeof globalThis !== 'object' || globalThis === null) {
        return undefined;
    }
    const value = globalThis[key];
    return typeof value === 'string' ? value : undefined;
}
function mapHostForPlatform(host) {
    if (Platform.OS === 'android') {
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
            return '10.0.2.2';
        }
    }
    if (host === '::1') {
        return '127.0.0.1';
    }
    return host;
}
function getPlatformFallbackHost() {
    return Platform.select({
        android: '10.0.2.2',
        ios: 'localhost',
        default: 'localhost'
    });
}
function normalizeUrl(url) {
    return url.replace(/\/+$/, '');
}
//# sourceMappingURL=mapService.js.map