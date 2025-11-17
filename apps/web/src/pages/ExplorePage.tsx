import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MapProvider,
  MapView,
  MapMarker,
  MapPolyline,
  type MapViewHandle
} from '@take-a-break/map/react';
import { LocateFixed, RefreshCcw, Navigation } from 'lucide-react';
import { browserMapService, type NearbyPlace, type RouteResponse } from '../services/browserMapService';
import { useBrowserLocation } from '../hooks/useBrowserLocation';
import { webEnvironment } from '../config/env';
import './ExplorePage.css';

const FALLBACK_CENTER = { lat: 40.758, lng: -73.9855 };

export function ExplorePage() {
  const { location, status, error: locationError, refresh } = useBrowserLocation();
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [mapOrigin, setMapOrigin] = useState(FALLBACK_CENTER);
  const [hasLoadedFallback, setHasLoadedFallback] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightParam = searchParams.get('highlight');
  const mapRef = useRef<MapViewHandle | null>(null);

  const loadPlaces = useCallback(async (origin: { lat: number; lng: number }) => {
    setLoadingPlaces(true);
    setPlaceError(null);
    try {
      const nextPlaces = await browserMapService.getNearbyPlaces(origin.lat, origin.lng);
      setPlaces(nextPlaces);
      if (nextPlaces.length > 0) {
        setActivePlaceId((current) => {
          if (current && nextPlaces.some((place) => place.id === current)) {
            return current;
          }
          return nextPlaces[0]?.id ?? null;
        });
      } else {
        setActivePlaceId(null);
      }
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : 'Unable to load nearby places');
      setPlaces([]);
    } finally {
      setLoadingPlaces(false);
    }
  }, []);

  useEffect(() => {
    if (!location) {
      return;
    }
    setMapOrigin(location);
    loadPlaces(location);
  }, [location, loadPlaces]);

  useEffect(() => {
    if (location || hasLoadedFallback) {
      return;
    }
    if (status === 'denied' || status === 'error') {
      setHasLoadedFallback(true);
      setMapOrigin(FALLBACK_CENTER);
      loadPlaces(FALLBACK_CENTER);
    }
  }, [status, location, hasLoadedFallback, loadPlaces]);

  useEffect(() => {
    if (!places.length) {
      return;
    }
    if (highlightParam && places.some((place) => place.id === highlightParam)) {
      setActivePlaceId(highlightParam);
      return;
    }
    setActivePlaceId((current) => {
      if (current && places.some((place) => place.id === current)) {
        return current;
      }
      return places[0]?.id ?? null;
    });
  }, [places, highlightParam]);

  useEffect(() => {
    if (!activePlaceId) {
      setRoute(null);
      return;
    }
    setRouteLoading(true);
    setRouteError(null);
    browserMapService
      .getRoute(mapOrigin, activePlaceId)
      .then((result) => {
        setRoute(result);
      })
      .catch((err) => {
        setRoute(null);
        setRouteError(err instanceof Error ? err.message : 'Unable to load walking route');
      })
      .finally(() => {
        setRouteLoading(false);
      });
  }, [activePlaceId, mapOrigin.lat, mapOrigin.lng]);

  const routeCoordinates = useMemo(() => {
    if (!route?.polyline?.length) {
      return [];
    }
    return route.polyline.map((point) => ({
      latitude: point.lat,
      longitude: point.lng
    }));
  }, [route?.polyline]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }
    if (routeCoordinates.length > 0) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }
      });
      return;
    }
    const selectedPlace = places.find((place) => place.id === activePlaceId);
    if (selectedPlace) {
      mapRef.current.animateCamera({
        center: { latitude: selectedPlace.lat, longitude: selectedPlace.lng },
        zoom: 15
      });
    }
  }, [routeCoordinates, places, activePlaceId]);

  const activePlace = activePlaceId ? places.find((place) => place.id === activePlaceId) : null;

  const handleSelectPlace = (placeId: string) => {
    setActivePlaceId(placeId);
    if (placeId) {
      setSearchParams({ highlight: placeId });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="explore-page">
      <section className="explore-hero">
        <div>
          <p className="tagline">Explore</p>
          <h1>Live restorative map</h1>
          <p className="subtitle">
            Pulls the same AI-curated places and walking routes as the mobile Break tab. Grant location or fall back
            to Times Square demo data.
          </p>
        </div>
        <div className="status-pill">
          <LocateFixed size={16} />
          {status === 'granted' ? 'Browser location live' : 'Waiting for precise location'}
        </div>
      </section>

      <div className="explore-layout">
        <div className="map-column">
          <div className="map-card">
            <MapProvider apiKey={webEnvironment.googleMapsApiKey}>
              <MapView
                key={`${mapOrigin.lat.toFixed(3)}-${mapOrigin.lng.toFixed(3)}`}
                ref={(instance) => {
                  mapRef.current = instance;
                }}
                initialRegion={{
                  latitude: mapOrigin.lat,
                  longitude: mapOrigin.lng,
                  latitudeDelta: 0.04,
                  longitudeDelta: 0.04
                }}
                showsMyLocationButton
                style={{ height: 420 }}
              >
                <MapMarker
                  title={location ? 'You' : 'Fallback origin'}
                  pinColor="#0ea5e9"
                  coordinate={{
                    latitude: mapOrigin.lat,
                    longitude: mapOrigin.lng
                  }}
                />
                {places.map((place) => (
                  <MapMarker
                    key={place.id}
                    title={place.name}
                    coordinate={{
                      latitude: place.lat,
                      longitude: place.lng
                    }}
                    pinColor={place.id === activePlaceId ? '#0f766e' : '#94a3b8'}
                    onPress={() => handleSelectPlace(place.id)}
                  />
                ))}
                {routeCoordinates.length > 0 && (
                  <MapPolyline coordinates={routeCoordinates} strokeColor="#0f766e" strokeWidth={5} />
                )}
              </MapView>
            </MapProvider>
          </div>
          <div className="location-status">
            <div>
              <p className="title">Location status</p>
              <p className="status-value">
                {status === 'granted' && 'Live location active'}
                {status === 'loading' && 'Getting location...'}
                {(status === 'denied' || status === 'error') && 'Using demo location (Times Square, NYC)'}
                {status === 'idle' && 'Initializing...'}
              </p>
              {locationError && (status === 'denied' || status === 'error') && (
                <p className="status-info">ℹ️ {locationError}</p>
              )}
              {placeError && <p className="status-error">{placeError}</p>}
            </div>
            <button type="button" onClick={refresh}>
              <RefreshCcw size={16} />
              Retry location
            </button>
          </div>
        </div>
        <div className="places-column">
          <section className="places-panel">
            <header>
              <div>
                <p className="tagline">Nearby spots</p>
                <h2>AI-curated locations</h2>
              </div>
              <div className="panel-meta">
                {loadingPlaces ? 'Loading places…' : `${places.length} results`}
              </div>
            </header>
            <div className="place-list">
              {places.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className={`place-card ${place.id === activePlaceId ? 'place-card--active' : ''}`}
                  onClick={() => handleSelectPlace(place.id)}
                >
                  <div className="place-card__header">
                    <h3>{place.name}</h3>
                    {typeof place.rating === 'number' && (
                      <span className="rating">★ {place.rating.toFixed(1)}</span>
                    )}
                  </div>
                  <p className="place-address">{place.address}</p>
                  <div className="place-meta">
                    <span>{formatDistance(place.distanceMeters)} away</span>
                    {place.isOpenNow !== undefined && (
                      <span className={`open-pill ${place.isOpenNow ? 'open-pill--active' : ''}`}>
                        {place.isOpenNow ? 'Open now' : 'Closed'}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {!places.length && !loadingPlaces && (
                <div className="empty-state">No places returned. Try refreshing your location.</div>
              )}
            </div>
          </section>

          <section className="route-panel">
            <div className="route-header">
              <div>
                <p className="tagline">Route preview</p>
                <h3>{activePlace?.name ?? 'Select a location'}</h3>
              </div>
              <Navigation size={18} />
            </div>
            {routeLoading && <p className="muted">Calculating walking route…</p>}
            {routeError && <p className="status-error">{routeError}</p>}
            {route && (
              <>
                <div className="route-summary">
                  <div>
                    <span className="summary-label">Distance</span>
                    <p className="summary-value">{formatDistance(route.summary.distanceMeters)}</p>
                  </div>
                  <div>
                    <span className="summary-label">Duration</span>
                    <p className="summary-value">{formatDuration(route.summary.durationSeconds)}</p>
                  </div>
                </div>
                <ul className="route-steps">
                  {(route.steps ?? []).slice(0, 4).map((step, index) => (
                    <li key={`${step.instruction}-${index}`}>
                      <p>{step.instruction}</p>
                      <span>
                        {formatDistance(step.distanceMeters)} · {formatDuration(step.durationSeconds)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {!route && !routeLoading && !routeError && (
              <p className="muted">Select a place to preview the walking route.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function formatDistance(meters?: number) {
  if (!meters || !Number.isFinite(meters)) {
    return '—';
  }
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) {
    return '—';
  }
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}
