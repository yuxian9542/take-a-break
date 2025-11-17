import { useEffect, useRef } from 'react';
import type { MapPolylineProps } from './types';
import { useMapRuntime } from './MapRuntimeContext';

export function MapPolyline({ coordinates, strokeColor, strokeWidth }: MapPolylineProps) {
  const { map } = useMapRuntime();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || coordinates.length === 0) {
      return;
    }

    const polyline = new google.maps.Polyline({
      map,
      path: coordinates.map((coord) => ({
        lat: coord.latitude,
        lng: coord.longitude
      })),
      strokeColor: strokeColor ?? '#0ea5e9',
      strokeOpacity: 0.9,
      strokeWeight: strokeWidth ?? 4
    });

    polylineRef.current = polyline;

    return () => {
      polyline.setMap(null);
      polylineRef.current = null;
    };
  }, [coordinates, map, strokeColor, strokeWidth]);

  return null;
}
