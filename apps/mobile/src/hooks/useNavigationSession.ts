import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as ExpoLocation from 'expo-location';
import type { RouteResponse } from '@take-a-break/api-client';

type SessionStatus = 'idle' | 'loading' | 'navigating' | 'paused' | 'arrived' | 'error';

interface BasicLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface UseNavigationSessionOptions {
  route: RouteResponse | null;
  initialLocation?: BasicLocation | null;
  arrivalDistanceMeters?: number;
  onArrived?: () => void;
  onError?: (error: Error) => void;
}

interface NavigationMetrics {
  distanceRemaining: number | null;
  timeRemainingMinutes: number | null;
  progress: number | null;
}

interface NavigationStepInfo {
  instruction?: string;
  distanceMeters?: number;
}

export function useNavigationSession({
  route,
  initialLocation = null,
  arrivalDistanceMeters = 30,
  onArrived,
  onError
}: UseNavigationSessionOptions) {
  const watcherRef = useRef<ExpoLocation.LocationSubscription | null>(null);
  const routeRef = useRef<RouteResponse | null>(route);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [currentPosition, setCurrentPosition] = useState<BasicLocation | null>(initialLocation);
  const [lastError, setLastError] = useState<Error | null>(null);

  const stopWatcher = useCallback(() => {
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
  }, []);

  useEffect(() => {
    routeRef.current = route;
    if (!route) {
      stopWatcher();
      setStatus('idle');
    }
  }, [route, stopWatcher]);

  useEffect(() => {
    if (!initialLocation) {
      return;
    }
    setCurrentPosition((prev) => {
      if (
        prev &&
        prev.latitude === initialLocation.latitude &&
        prev.longitude === initialLocation.longitude &&
        prev.accuracy === initialLocation.accuracy
      ) {
        return prev;
      }
      return initialLocation;
    });
  }, [initialLocation]);

  useEffect(() => () => stopWatcher(), [stopWatcher]);

  const ensurePermissions = useCallback(async () => {
    const { status: permissionStatus } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (permissionStatus !== 'granted') {
      throw new Error('Location permission is required for in-app navigation');
    }
  }, []);

  const startWatcher = useCallback(async () => {
    await ensurePermissions();
    stopWatcher();
    const subscription = await ExpoLocation.watchPositionAsync(
      {
        accuracy: ExpoLocation.LocationAccuracy.Highest,
        timeInterval: 2000,
        distanceInterval: 5
      },
      (location) => {
        setCurrentPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? undefined,
          timestamp: location.timestamp
        });
      }
    );
    watcherRef.current = subscription;
  }, [ensurePermissions, stopWatcher]);

  const startNavigation = useCallback(async () => {
    if (!routeRef.current) {
      const error = new Error('Route data is not ready');
      setLastError(error);
      setStatus('error');
      onError?.(error);
      return;
    }
    try {
      setLastError(null);
      setStatus('loading');
      await startWatcher();
      setStatus('navigating');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setLastError(err);
      setStatus('error');
      onError?.(err);
    }
  }, [onError, startWatcher]);

  const pauseNavigation = useCallback(() => {
    if (status !== 'navigating') {
      return;
    }
    stopWatcher();
    setStatus('paused');
  }, [status, stopWatcher]);

  const resumeNavigation = useCallback(async () => {
    if (status !== 'paused') {
      return;
    }
    try {
      setStatus('loading');
      await startWatcher();
      setStatus('navigating');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setLastError(err);
      setStatus('error');
      onError?.(err);
    }
  }, [status, onError, startWatcher]);

  const endNavigation = useCallback(() => {
    stopWatcher();
    setStatus('idle');
  }, [stopWatcher]);

  const metrics: NavigationMetrics = useMemo(() => {
    if (!route) {
      return { distanceRemaining: null, timeRemainingMinutes: null, progress: null };
    }

    if (!currentPosition) {
      return {
        distanceRemaining: route.summary.distanceMeters,
        timeRemainingMinutes: Math.round(route.summary.durationSeconds / 60),
        progress: 0
      };
    }

    const distance = distanceBetween(currentPosition, route.destination);
    const ratio = route.summary.distanceMeters > 0
      ? Math.min(1, Math.max(0, 1 - distance / route.summary.distanceMeters))
      : 0;
    const timeRemaining = route.summary.distanceMeters > 0
      ? Math.max(1, Math.round((distance / route.summary.distanceMeters) * (route.summary.durationSeconds / 60)))
      : Math.round(route.summary.durationSeconds / 60);

    return {
      distanceRemaining: Math.max(0, Math.round(distance)),
      timeRemainingMinutes: timeRemaining,
      progress: ratio
    };
  }, [route, currentPosition]);

  const upcomingStep: NavigationStepInfo | null = useMemo(() => {
    if (!route?.steps?.length) {
      return null;
    }
    if (!currentPosition) {
      const first = route.steps[0];
      return {
        instruction: first.instruction,
        distanceMeters: first.distanceMeters
      };
    }

    const sorted = [...route.steps].sort((a, b) => {
      const distA = distanceBetween(currentPosition, a.startLocation);
      const distB = distanceBetween(currentPosition, b.startLocation);
      return distA - distB;
    });
    const next = sorted[0];
    return next
      ? {
          instruction: next.instruction,
          distanceMeters: Math.max(0, Math.round(distanceBetween(currentPosition, next.startLocation)))
        }
      : null;
  }, [currentPosition, route]);

  useEffect(() => {
    if (!route || !currentPosition) {
      return;
    }
    const distance = distanceBetween(currentPosition, route.destination);
    if (distance <= arrivalDistanceMeters && status === 'navigating') {
      stopWatcher();
      setStatus('arrived');
      onArrived?.();
    }
  }, [route, currentPosition, arrivalDistanceMeters, status, stopWatcher, onArrived]);

  return {
    status,
    currentPosition,
    distanceRemaining: metrics.distanceRemaining,
    timeRemainingMinutes: metrics.timeRemainingMinutes,
    progress: metrics.progress,
    upcomingStep,
    lastError,
    startNavigation,
    pauseNavigation,
    resumeNavigation,
    endNavigation
  };
}

function distanceBetween(a: BasicLocation, b: { lat: number; lng: number }): number {
  const R = 6371000; // meters
  const dLat = toRadians(b.lat - a.latitude);
  const dLon = toRadians(b.lng - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const haversine = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return R * angularDistance;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
