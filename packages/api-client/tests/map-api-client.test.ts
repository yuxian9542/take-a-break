import { describe, expect, it, vi } from 'vitest';
import { MapApiClient, ApiClientError } from '../src/index.js';
import type {
  LocationState,
  NearbyResponse,
  RouteResponse
} from '../src/map.js';

const jsonResponse = <T>(payload: T, init?: ResponseInit) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init
  });

describe('MapApiClient', () => {
  it('serializes query params for getNearbyPlaces', async () => {
    const payload: NearbyResponse = {
      places: [
        {
          id: 'cafe',
          name: 'Cafe',
          lat: 1,
          lng: 2,
          address: 'Somewhere',
          distanceMeters: 42,
          types: ['coffee']
        }
      ]
    };

    const fetchMock = vi.fn(async () => jsonResponse(payload));
    const client = MapApiClient.from({
      baseUrl: 'https://api.test',
      fetchFn: fetchMock
    });

    const result = await client.getNearbyPlaces({
      lat: 37.4219999,
      lng: -122.0840575,
      radius: 500,
      limit: 10,
      types: 'coffee,park'
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as unknown as [string, RequestInit?];
    expect(url).toBe(
      'https://api.test/map/nearby?lat=37.422000&lng=-122.084058&radius=500&limit=10&types=coffee%2Cpark'
    );
    expect(result).toEqual(payload);
  });

  it('builds query for location requests and parses typed response', async () => {
    const payload: LocationState = {
      lat: 1.23,
      lng: 4.56,
      mode: 'highAccuracy',
      updatedAt: new Date().toISOString(),
      accuracyMeters: 5
    };

    const fetchMock = vi.fn(async () => jsonResponse(payload));
    const client = MapApiClient.from({
      baseUrl: 'https://api.test',
      fetchFn: fetchMock
    });

    const result = await client.getCurrentLocation({
      mode: 'highAccuracy',
      timeoutMs: 3000,
      allowModeFallback: false,
      allowStale: false,
      lat: 40.7128,
      lng: -74.006,
      accuracyMeters: 8.5
    });

    const [url] = fetchMock.mock.calls[0] as unknown as [string, RequestInit?];
    expect(url).toContain('/map/location');
    expect(url).toContain('mode=highAccuracy');
    expect(url).toContain('timeoutMs=3000');
    expect(url).toContain('allowModeFallback=false');
    expect(url).toContain('allowStale=false');
    expect(url).toContain('lat=40.712800');
    expect(url).toContain('lng=-74.006000');
    expect(url).toContain('accuracyMeters=9');
    expect(result.mode).toBe('highAccuracy');
  });

  it('issues POST for walking routes', async () => {
    const payload: RouteResponse = {
      summary: {
        mode: 'walking',
        distanceMeters: 1000,
        durationSeconds: 800
      },
      polyline: [
        { lat: 1, lng: 2, sequence: 0 },
        { lat: 3, lng: 4, sequence: 1 }
      ]
    };

    const fetchMock = vi.fn(async (_url, init) => {
      expect(init?.method).toBe('POST');
      expect(init?.body).toBeTruthy();
      return jsonResponse(payload);
    });

    const client = MapApiClient.from({
      baseUrl: 'https://api.test',
      fetchFn: fetchMock
    });

    const result = await client.getWalkingRoute({
      origin: { lat: 1, lng: 2 },
      destinationId: 'cafe'
    });

    expect(result.summary.distanceMeters).toBe(1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('raises ApiClientError when backend responds with error', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: 'boom' }), {
          status: 500,
          headers: { 'content-type': 'application/json', 'x-request-id': 'req-1' }
        })
    );

    const client = MapApiClient.from({
      baseUrl: 'https://api.test',
      fetchFn: fetchMock
    });

    await expect(
      client.getNearbyPlaces({ lat: 0, lng: 0 })
    ).rejects.toMatchObject({
      status: 500,
      requestId: 'req-1'
    } satisfies Partial<ApiClientError>);
  });
});
