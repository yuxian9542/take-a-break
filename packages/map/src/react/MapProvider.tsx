import React, { createContext, useContext, useMemo } from 'react';
import type { MapProviderProps, LatLng } from './types';

interface MapEnvironmentValue {
  apiKey?: string;
  libraries: string[];
  defaultCenter?: LatLng;
}

const MapEnvironmentContext = createContext<MapEnvironmentValue>({
  libraries: ['places']
});

type ProcessEnv = Record<string, string | undefined>;

function resolveProcessEnv(): ProcessEnv | undefined {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }

  const candidate = (globalThis as unknown as {
    process?: { env?: ProcessEnv };
  }).process?.env;

  if (!candidate) {
    return undefined;
  }

  return candidate;
}

function resolveApiKey(explicit?: string) {
  if (explicit && explicit.length > 0) {
    return explicit;
  }

  const env = resolveProcessEnv();

  if (env) {
    return (
      env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
      env.VITE_GOOGLE_MAPS_API_KEY ??
      env.GOOGLE_MAPS_API_KEY ??
      undefined
    );
  }

  return undefined;
}

export function MapProvider({ children, apiKey, libraries, defaultCenter }: MapProviderProps) {
  const value = useMemo<MapEnvironmentValue>(() => {
    const resolvedKey = resolveApiKey(apiKey);
    return {
      apiKey: resolvedKey,
      libraries: libraries?.length ? libraries : ['places'],
      defaultCenter
    };
  }, [apiKey, libraries, defaultCenter]);

  return (
    <MapEnvironmentContext.Provider value={value}>
      {children}
    </MapEnvironmentContext.Provider>
  );
}

export function useMapEnvironment() {
  return useContext(MapEnvironmentContext);
}
