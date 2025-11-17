import type { NearbyParams, NearbyPlace } from '@take-a-break/types';
import type { PlacesRepository } from '../repositories/places-repository';

export interface GooglePlacesConfig {
  apiKey: string;
  language?: string;
}

interface GooglePlace {
  place_id: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  vicinity?: string;
  formatted_address?: string;
  types: string[];
  rating?: number;
  opening_hours?: {
    open_now?: boolean;
  };
}

interface GooglePlacesResponse {
  results: GooglePlace[];
  status: string;
  error_message?: string;
}

/**
 * Google Places API Provider
 * 
 * Uses Google Places API Nearby Search to find real places
 * https://developers.google.com/maps/documentation/places/web-service/search-nearby
 */
export class GooglePlacesRepository implements PlacesRepository {
  private readonly apiKey: string;
  private readonly language: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor(config: GooglePlacesConfig) {
    if (!config.apiKey) {
      throw new Error('Google Places API key is required');
    }
    this.apiKey = config.apiKey;
    this.language = config.language ?? 'en';
  }

  async findById(id: string): Promise<NearbyPlace | null> {
    try {
      const url = new URL(`${this.baseUrl}/details/json`);
      url.searchParams.set('place_id', id);
      url.searchParams.set('key', this.apiKey);
      url.searchParams.set('fields', 'place_id,name,geometry,vicinity,types,rating,opening_hours');

      const response = await fetch(url.toString());
      const data = (await response.json()) as { status: string; result?: GooglePlace; error_message?: string };

      if (data.status !== 'OK' || !data.result) {
        console.error('[GooglePlaces] Place details error:', data.status, data.error_message);
        return null;
      }

      return this.transformPlace(data.result);
    } catch (error) {
      console.error('[GooglePlaces] Error fetching place details:', error);
      return null;
    }
  }

  async findNearby(params: NearbyParams): Promise<NearbyPlace[]> {
    try {
      const url = new URL(`${this.baseUrl}/nearbysearch/json`);
      
      // Required parameters
      url.searchParams.set('location', `${params.lat},${params.lng}`);
      url.searchParams.set('radius', String(params.radius ?? 1000));
      url.searchParams.set('key', this.apiKey);
      url.searchParams.set('language', this.language);

      // Map our types to Google Places types
      if (params.types) {
        const googleTypes = this.mapToGoogleTypes(params.types);
        if (googleTypes.length > 0) {
          url.searchParams.set('type', googleTypes[0]); // Google only accepts one type
        }
      }

      // Add keyword for better results
      url.searchParams.set('keyword', 'relax|quiet|peaceful|park|cafe|meditation');

      const response = await fetch(url.toString());
      const data = (await response.json()) as GooglePlacesResponse;

      if (data.status !== 'OK') {
        if (data.status === 'ZERO_RESULTS') {
          return [];
        }
        console.error('[GooglePlaces] API error:', data.status, data.error_message);
        throw new Error(`Google Places API error: ${data.status}`);
      }

      const places = data.results
        .map((place) => this.transformPlace(place))
        .slice(0, params.limit ?? 20);

      // Calculate distances
      return places.map((place) => ({
        ...place,
        distanceMeters: this.calculateDistance(
          { lat: params.lat, lng: params.lng },
          { lat: place.lat, lng: place.lng }
        )
      }));
    } catch (error) {
      console.error('[GooglePlaces] Error fetching nearby places:', error);
      throw error;
    }
  }

  private transformPlace(place: GooglePlace): NearbyPlace {
    return {
      id: place.place_id,
      name: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      address: place.vicinity ?? place.formatted_address ?? 'Address not available',
      distanceMeters: 0, // Will be calculated by caller
      types: this.normalizeTypes(place.types),
      rating: place.rating,
      isOpenNow: place.opening_hours?.open_now
    };
  }

  private mapToGoogleTypes(types: string): string[] {
    // Map our custom types to Google Places types
    const typeMap: Record<string, string> = {
      park: 'park',
      cafe: 'cafe',
      waterfront: 'park',
      quiet_space: 'library',
      indoor: 'library',
      nature: 'park'
    };

    return types
      .split(',')
      .map((t) => t.trim())
      .map((t) => typeMap[t] ?? t)
      .filter((t) => t);
  }

  private normalizeTypes(googleTypes: string[]): string[] {
    // Keep types that are relevant for relaxation
    const relevantTypes = new Set([
      'park',
      'cafe',
      'library',
      'museum',
      'art_gallery',
      'spa',
      'natural_feature',
      'point_of_interest'
    ]);

    return googleTypes.filter((t) => relevantTypes.has(t));
  }

  private calculateDistance(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
  ): number {
    // Haversine formula for accurate distance calculation
    const R = 6371000; // Earth radius in meters
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const deltaLat = ((b.lat - a.lat) * Math.PI) / 180;
    const deltaLng = ((b.lng - a.lng) * Math.PI) / 180;

    const x =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

    return Math.round(R * c);
  }
}

