import { useEffect, useRef } from 'react';
import type { MapMarkerProps } from './types';
import { useMapRuntime } from './MapRuntimeContext';

export function MapMarker({ coordinate, pinColor, onPress, title }: MapMarkerProps) {
  const { map } = useMapRuntime();
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!map) {
      return;
    }

    const marker = new google.maps.Marker({
      map,
      position: {
        lat: coordinate.latitude,
        lng: coordinate.longitude
      },
      title,
      icon: pinColor
        ? {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: pinColor,
            fillOpacity: 1,
            strokeColor: pinColor,
            strokeOpacity: 0.9
          }
        : undefined
    });

    if (onPress) {
      marker.addListener('click', () => onPress(coordinate));
    }

    markerRef.current = marker;

    return () => {
      marker.setMap(null);
      markerRef.current = null;
    };
  }, [coordinate.latitude, coordinate.longitude, map, onPress, pinColor, title]);

  return null;
}
