import React, { createContext, useContext } from 'react';

interface MapRuntimeValue {
  map: google.maps.Map | null;
}

export const MapRuntimeContext = createContext<MapRuntimeValue>({
  map: null
});

export function useMapRuntime() {
  return useContext(MapRuntimeContext);
}
