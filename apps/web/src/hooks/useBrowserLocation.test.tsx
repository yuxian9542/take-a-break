import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBrowserLocation } from './useBrowserLocation';

describe('useBrowserLocation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports an error when geolocation is unavailable', async () => {
    const originalGeolocation = navigator.geolocation;
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      configurable: true
    });

    const { result } = renderHook(() => useBrowserLocation());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.error).toContain('Geolocation is not supported');

    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeolocation,
      configurable: true
    });
  });

  it('resolves with coordinates when permission is granted', async () => {
    const mockGeo = {
      getCurrentPosition: vi.fn((success: PositionCallback) => {
        success({
          coords: {
            latitude: 40.71,
            longitude: -74.01,
            accuracy: 12
          } as GeolocationCoordinates,
          timestamp: 123456
        } as GeolocationPosition);
      })
    } as Geolocation;

    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeo,
      configurable: true
    });

    const { result } = renderHook(() => useBrowserLocation());

    await waitFor(() => {
      expect(result.current.status).toBe('granted');
    });

    expect(result.current.location).toMatchObject({
      lat: 40.71,
      lng: -74.01,
      accuracyMeters: 12
    });
  });
});
