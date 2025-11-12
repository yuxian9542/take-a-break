import type { LatLng, RouteResponse } from '@take-a-break/types';
import type { RouteEngine, RouteInput, RouteMode } from '../route-engine';
import { RouteEngineError } from '../route-engine';

export interface GoogleDirectionsConfig {
  apiKey: string;
  language?: string;
}

interface GoogleDirectionsResponse {
  status: string;
  error_message?: string;
  routes: Array<{
    legs: Array<{
      distance: { value: number; text: string };
      duration: { value: number; text: string };
      steps: Array<{
        distance: { value: number };
        duration: { value: number };
        html_instructions: string;
        travel_mode: string;
        start_location: { lat: number; lng: number };
        end_location: { lat: number; lng: number };
      }>;
    }>;
    overview_polyline: {
      points: string;
    };
  }>;
}

/**
 * Google Directions API Engine
 * 
 * Uses Google Directions API to compute real walking routes
 * https://developers.google.com/maps/documentation/directions/overview
 */
export class GoogleDirectionsEngine implements RouteEngine {
  readonly id = 'google-directions';
  private readonly apiKey: string;
  private readonly language: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';

  constructor(config: GoogleDirectionsConfig) {
    if (!config.apiKey) {
      throw new RouteEngineError('Google Directions API key is required');
    }
    this.apiKey = config.apiKey;
    this.language = config.language ?? 'en';
  }

  supports(mode: RouteMode): boolean {
    // Google Directions supports walking, driving, bicycling, and transit
    return mode === 'walking' || mode === 'driving' || mode === 'bicycling';
  }

  async computeRoute(input: RouteInput): Promise<RouteResponse> {
    try {
      const url = new URL(this.baseUrl);
      
      // Set parameters
      url.searchParams.set('origin', `${input.origin.lat},${input.origin.lng}`);
      url.searchParams.set('destination', `${input.destination.lat},${input.destination.lng}`);
      url.searchParams.set('mode', this.mapMode(input.mode));
      url.searchParams.set('key', this.apiKey);
      url.searchParams.set('language', this.language);
      url.searchParams.set('alternatives', 'false'); // We only need one route

      const response = await fetch(url.toString());
      const data = (await response.json()) as GoogleDirectionsResponse;

      if (data.status !== 'OK') {
        if (data.status === 'ZERO_RESULTS') {
          throw new RouteEngineError('No route found between origin and destination');
        }
        throw new RouteEngineError(
          `Google Directions API error: ${data.status}${data.error_message ? ` - ${data.error_message}` : ''}`
        );
      }

      if (!data.routes || data.routes.length === 0) {
        throw new RouteEngineError('No routes returned from Google Directions API');
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      if (!leg) {
        throw new RouteEngineError('Route has no legs');
      }

      // Decode polyline to get route coordinates and add sequence numbers
      const decodedPolyline = this.decodePolyline(route.overview_polyline.points);
      const polyline = decodedPolyline.map((point, index) => ({
        ...point,
        sequence: index
      }));

      return {
        origin: input.origin,
        destination: input.destination,
        polyline,
        summary: {
          distanceMeters: leg.distance.value,
          durationSeconds: leg.duration.value,
          mode: 'walking' as const
        },
        steps: leg.steps.map((step) => ({
          instruction: this.stripHtml(step.html_instructions),
          distanceMeters: step.distance.value,
          durationSeconds: step.duration.value,
          startLocation: step.start_location,
          endLocation: step.end_location
        }))
      };
    } catch (error) {
      if (error instanceof RouteEngineError) {
        throw error;
      }
      throw new RouteEngineError(
        error instanceof Error ? error.message : 'Unknown error computing route'
      );
    }
  }

  private mapMode(mode: RouteMode): string {
    const modeMap: Record<RouteMode, string> = {
      walking: 'walking',
      driving: 'driving',
      bicycling: 'bicycling'
    };
    return modeMap[mode] ?? 'walking';
  }

  /**
   * Decode Google's polyline format
   * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
   */
  private decodePolyline(encoded: string): LatLng[] {
    const coordinates: LatLng[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;

      // Decode latitude
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      // Decode longitude
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      coordinates.push({
        lat: lat / 1e5,
        lng: lng / 1e5
      });
    }

    return coordinates;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}

