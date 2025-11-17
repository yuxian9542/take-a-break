import { MapApiClient } from '@take-a-break/api-client';
import type { NearbyPlace, RouteResponse } from '@take-a-break/api-client';
import { webEnvironment } from '../config/env';

const apiClient = new MapApiClient({
  baseUrl: webEnvironment.apiBaseUrl,
  defaultHeaders: {
    'Content-Type': 'application/json'
  }
});

class BrowserMapService {
  async getNearbyPlaces(lat: number, lng: number) {
    const response = await apiClient.getNearbyPlaces({
      lat,
      lng,
      limit: 10,
      radius: 1200,
      types: 'park,coffee,library'
    });
    return response.places;
  }

  async getRoute(
    origin: { lat: number; lng: number },
    destinationId: string
  ): Promise<RouteResponse> {
    return apiClient.getWalkingRoute({
      origin,
      destinationId
    });
  }
}

export const browserMapService = new BrowserMapService();
export type { NearbyPlace, RouteResponse };
