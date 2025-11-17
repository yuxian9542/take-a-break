import { useCallback, useEffect, useState } from 'react';

export type BrowserLocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'error';

export interface BrowserLocationState {
  lat: number;
  lng: number;
  accuracyMeters?: number;
  timestamp: number;
}

interface BrowserLocationResult {
  location: BrowserLocationState | null;
  status: BrowserLocationStatus;
  error: string | null;
  refresh: () => void;
}

export function useBrowserLocation(): BrowserLocationResult {
  const [location, setLocation] = useState<BrowserLocationState | null>(null);
  const [status, setStatus] = useState<BrowserLocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;

    if (!geo || typeof geo.getCurrentPosition !== 'function') {
      setError('Geolocation is not supported in this browser.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);

    geo.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: position.coords.accuracy ?? undefined,
          timestamp: position.timestamp
        });
        setStatus('granted');
        setError(null);
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setStatus('denied');
          setError('Location permission denied. Using fallback location.');
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          setStatus('error');
          setError('GPS unavailable on this device. Using fallback location.');
        } else if (geoError.code === geoError.TIMEOUT) {
          setStatus('error');
          setError('Location request timed out. Using fallback location.');
        } else {
          setStatus('error');
          setError('Unable to determine your location. Using fallback location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    location,
    status,
    error,
    refresh: requestLocation
  };
}
