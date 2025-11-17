import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { MapViewHandle, MapViewProps } from './types';
import { useMapEnvironment } from './MapProvider';
import { loadGoogleMaps } from './mapLoader';
import { MapRuntimeContext } from './MapRuntimeContext';

export const MapView = forwardRef<MapViewHandle, MapViewProps>(
  ({ initialRegion, children, style, apiKey, showsMyLocationButton }, ref) => {
    const environment = useMapEnvironment();
    const resolvedApiKey = apiKey ?? environment.apiKey ?? '';
    const libraries = environment.libraries;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useImperativeHandle(
      ref,
      () => ({
        fitToCoordinates: (coordinates, options) => {
          if (!map || coordinates.length === 0) {
            return;
          }
          const bounds = new google.maps.LatLngBounds();
          coordinates.forEach((coordinate) =>
            bounds.extend(
              new google.maps.LatLng(coordinate.latitude, coordinate.longitude)
            )
          );
          if (options?.edgePadding) {
            map.fitBounds(bounds, options.edgePadding as google.maps.Padding);
          } else {
            map.fitBounds(bounds);
          }
        },
        animateCamera: (camera) => {
          if (!map) {
            return;
          }
          map.panTo({
            lat: camera.center.latitude,
            lng: camera.center.longitude
          });
          if (typeof camera.zoom === 'number') {
            map.setZoom(camera.zoom);
          }
        }
      }),
      [map]
    );

    useEffect(() => {
      let isMounted = true;
      setIsLoading(true);
      setError(null);

      loadGoogleMaps(resolvedApiKey, libraries)
        .then((googleNamespace) => {
          if (!isMounted || !containerRef.current) {
            return;
          }
          const mapInstance = new googleNamespace.maps.Map(containerRef.current, {
            center: {
              lat: initialRegion.latitude,
              lng: initialRegion.longitude
            },
            zoom: regionToZoom(initialRegion.latitudeDelta),
            disableDefaultUI: !showsMyLocationButton,
            clickableIcons: true,
            zoomControl: true
          });
          setMap(mapInstance);
          setIsLoading(false);
        })
        .catch((loaderError) => {
          if (!isMounted) {
            return;
          }
          setError(loaderError instanceof Error ? loaderError.message : String(loaderError));
          setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }, [
      initialRegion.latitude,
      initialRegion.longitude,
      initialRegion.latitudeDelta,
      libraries,
      resolvedApiKey,
      showsMyLocationButton
    ]);

    if (!resolvedApiKey) {
      return (
        <View style={[styles.fallback, style]}>
          <Text style={styles.fallbackText}>
            Set VITE_GOOGLE_MAPS_API_KEY to enable the map.
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.container, style]}>
        <div ref={containerRef} style={styles.mapSurface} />
        {(isLoading || error) && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>
              {error ? `Unable to load Google Maps (${error})` : 'Loading map…'}
            </Text>
          </View>
        )}
        <MapRuntimeContext.Provider value={{ map }}>
          {map && children}
        </MapRuntimeContext.Provider>
      </View>
    );
  }
);

function regionToZoom(latitudeDelta: number) {
  if (latitudeDelta <= 0) {
    return 14;
  }
  const zoom = Math.round(14 - Math.log(latitudeDelta) / Math.log(2));
  return Math.max(3, Math.min(20, zoom));
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative'
  },
  mapSurface: {
    width: '100%',
    height: '100%'
  } as React.CSSProperties,
  fallback: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 24
  },
  fallbackText: {
    color: '#475569',
    textAlign: 'center'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    zIndex: 1000
  },
  overlayText: {
    color: '#475569',
    textAlign: 'center'
  }
});
