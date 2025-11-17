import { useEffect, useMemo, useState } from 'react';
import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
  type Libraries
} from '@react-google-maps/api';
import { getMockRoute, getNearbySpots, getUserPosition } from '@/services/mapService';
import type { RelaxationSpot } from '@take-a-break/break-plans';
import './MapExperience.css';

type MapState = {
  center: google.maps.LatLngLiteral;
  polyline: google.maps.LatLngLiteral[];
  selectedSpot: RelaxationSpot | null;
};

const MAP_LIBRARIES: Libraries = ['places'];

export function MapExperience() {
  const [spots, setSpots] = useState<RelaxationSpot[]>([]);
  const [mapState, setMapState] = useState<MapState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded } = useJsApiLoader({
    id: 'take-a-break-map',
    googleMapsApiKey: apiKey || 'invalid-key',
    libraries: MAP_LIBRARIES
  });

  useEffect(() => {
    async function bootstrap() {
      try {
        const [position, nearby] = await Promise.all([getUserPosition(), getNearbySpots()]);
        setSpots(nearby);
        if (nearby.length > 0) {
          const firstSpot = nearby[0];
          setMapState({
            center: position,
            selectedSpot: firstSpot,
            polyline: getMockRoute(position, firstSpot.coordinates)
          });
        } else {
          setMapState({
            center: position,
            selectedSpot: null,
            polyline: []
          });
        }
      } catch (error) {
        console.error(error);
        setLoadError('无法加载附近地点，请稍后再试。');
      }
    }

    bootstrap().catch((error) => {
      console.error(error);
      setLoadError('地图初始化失败。');
    });
  }, []);

  const googleMapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      clickableIcons: false
    }),
    []
  );

  if (!apiKey) {
    return (
      <div className="map-placeholder">
        <h3>缺少 Google Maps API Key</h3>
        <p>在 `.env` 中设置 `VITE_GOOGLE_MAPS_API_KEY` 后即可加载地图。</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="map-placeholder">
        <h3>地图加载失败</h3>
        <p>{loadError}</p>
      </div>
    );
  }

  if (!isLoaded || !mapState) {
    return (
      <div className="map-placeholder">
        <p>正在加载地图...</p>
      </div>
    );
  }

  return (
    <div className="map-wrapper">
      <GoogleMap mapContainerClassName="map-canvas" center={mapState.center} zoom={14} options={googleMapOptions}>
        <Marker position={mapState.center} label="你" />
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={spot.coordinates}
            label={spot.name}
            onClick={() =>
              setMapState((prev) =>
                prev
                  ? {
                      ...prev,
                      selectedSpot: spot,
                      polyline: getMockRoute(prev.center, spot.coordinates)
                    }
                  : prev
              )
            }
          />
        ))}
        {mapState.polyline.length > 1 && (
          <Polyline path={mapState.polyline} options={{ strokeColor: '#14b8a6', strokeWeight: 4 }} />
        )}
      </GoogleMap>

      <aside className="map-panel">
        <h3>附近推荐地点</h3>
        <ul>
          {spots.map((spot) => (
            <li key={spot.id} className={mapState.selectedSpot?.id === spot.id ? 'is-active' : ''}>
              <button
                type="button"
                onClick={() =>
                  setMapState((prev) =>
                    prev
                      ? {
                          ...prev,
                          selectedSpot: spot,
                          polyline: getMockRoute(prev.center, spot.coordinates)
                        }
                      : prev
                  )
                }
              >
                <span className="spot-name">{spot.name}</span>
                <span className="spot-meta">
                  {spot.category} · {(spot.distanceMeters / 1000).toFixed(1)} km · {spot.durationMinutes} 分钟路程
                </span>
                <span className="spot-desc">{spot.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

