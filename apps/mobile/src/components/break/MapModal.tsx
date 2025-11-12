import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Navigation,
  MessageCircle,
  Clock,
  MapPin,
  Mic,
  MicOff,
  Volume2,
  Pause,
  Play,
  Square
} from 'lucide-react-native';
import { mapService } from '../../services/mapService';
import type { LocationState, NearbyPlace, RouteResponse } from '../../services/mapService';
import { startNavigation } from '../../utils/navigation';
import { useNavigationSession } from '../../hooks/useNavigationSession';

const FALLBACK_REGION: Region = {
  latitude: 40.7829,
  longitude: -73.9654,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02
};

interface Location {
  name: string;
  address: string;
  walkingDistance: number;
  walkingTime: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  id?: string;
}

interface MapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
  onOpenVoice?: () => void;
  showVoiceModal?: boolean;
  onCloseVoice?: () => void;
  voiceCompanionActive?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
  onListeningChange?: (isListening: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export function MapModal({
  open,
  onOpenChange,
  location,
  onOpenVoice,
  showVoiceModal = false,
  onCloseVoice,
  voiceCompanionActive = false,
  isListening = false,
  isSpeaking = false,
  onListeningChange
}: MapModalProps) {
  const [localIsListening, setLocalIsListening] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [routeDestinationId, setRouteDestinationId] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExternalNavigationOpening, setIsExternalNavigationOpening] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const isMountedRef = useRef(false);

  const initialNavigationLocation = useMemo(() => {
    if (!currentLocation) {
      return null;
    }
    return {
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      accuracy: currentLocation.accuracyMeters
    } as const;
  }, [currentLocation?.lat, currentLocation?.lng, currentLocation?.accuracyMeters]);

  const {
    status: inAppNavigationStatus,
    currentPosition: inAppPosition,
    distanceRemaining: inAppDistanceRemaining,
    timeRemainingMinutes: inAppTimeRemaining,
    upcomingStep,
    lastError: inAppNavigationError,
    startNavigation: startInAppNavigation,
    pauseNavigation,
    resumeNavigation,
    endNavigation: endInAppNavigation
  } = useNavigationSession({
    route,
    initialLocation: initialNavigationLocation
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resetMapState = useCallback(() => {
    setCurrentLocation(null);
    setNearbyPlaces([]);
    setSelectedPlaceId(null);
    setRoute(null);
    setRouteDestinationId(null);
    setErrorMessage(null);
    setIsLoadingMap(false);
    setIsLoadingRoute(false);
  }, []);

  useEffect(() => {
    if (!open) {
      setIsExternalNavigationOpening(false);
      endInAppNavigation();
      resetMapState();
    }
  }, [open, resetMapState, endInAppNavigation]);

  useEffect(() => {
    if (!inAppPosition) {
      return;
    }
    setCurrentLocation((prev) => ({
      lat: inAppPosition.latitude,
      lng: inAppPosition.longitude,
      accuracyMeters: inAppPosition.accuracy ?? prev?.accuracyMeters,
      mode: prev?.mode ?? 'highAccuracy',
      updatedAt: new Date(inAppPosition.timestamp ?? Date.now()).toISOString()
    }));
  }, [inAppPosition]);

  const resolveDestination = useCallback(
    (places: NearbyPlace[]): NearbyPlace | null => {
      if (places.length === 0) {
        return null;
      }

      if (location?.id) {
        const matchById = places.find((place) => place.id === location.id);
        if (matchById) {
          return matchById;
        }
      }

      if (location?.name) {
        const normalizedName = location.name.toLowerCase();
        const matchByName = places.find(
          (place) => place.name.toLowerCase() === normalizedName
        );
        if (matchByName) {
          return matchByName;
        }
      }

      if (location?.coordinates) {
        const { lat, lng } = location.coordinates;
        let closest: NearbyPlace | null = null;
        let minDistance = Number.POSITIVE_INFINITY;

        places.forEach((place) => {
          const distance = distanceBetweenMeters({ lat, lng }, { lat: place.lat, lng: place.lng });
          if (distance < minDistance) {
            minDistance = distance;
            closest = place;
          }
        });

        if (closest) {
          return closest;
        }
      }

      return places[0] ?? null;
    },
    [location]
  );

  const loadMapData = useCallback(async () => {
    setIsLoadingMap(true);
    setErrorMessage(null);
    try {
      const current = await mapService.getCurrentLocation({
        mode: 'highAccuracy',
        allowStale: false
      });
      if (!isMountedRef.current) return;
      setCurrentLocation(current);

      const places = await mapService.getNearbyPlaces(current.lat, current.lng, {
        radius: 2000,
        limit: 12,
        types: 'park,cafe,quiet_space,indoor,waterfront'
      });

      if (!isMountedRef.current) return;
      setNearbyPlaces(places);
      const destination = resolveDestination(places);
      setSelectedPlaceId(destination?.id ?? null);
    } catch (error) {
      if (!isMountedRef.current) return;
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to fetch location data'
      );
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMap(false);
      }
    }
  }, [resolveDestination]);

  const loadRoute = useCallback(
    async (destinationId: string) => {
      if (!currentLocation) {
        return;
      }

      setIsLoadingRoute(true);
      try {
        const response = await mapService.getRoute(
          { lat: currentLocation.lat, lng: currentLocation.lng },
          destinationId
        );
        if (!isMountedRef.current) return;
        setRoute(response);
        setRouteDestinationId(destinationId);
      } catch (error) {
        if (!isMountedRef.current) return;
        setRoute(null);
        setRouteDestinationId(null);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to fetch route');
      } finally {
        if (isMountedRef.current) {
          setIsLoadingRoute(false);
        }
      }
    },
    [currentLocation]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    loadMapData();
  }, [open, loadMapData]);

  useEffect(() => {
    if (!open || !currentLocation || !selectedPlaceId) {
      return;
    }

    if (selectedPlaceId === routeDestinationId && route) {
      return;
    }

    loadRoute(selectedPlaceId);
  }, [open, currentLocation, selectedPlaceId, routeDestinationId, route, loadRoute]);

  const selectedPlace = useMemo(
    () => nearbyPlaces.find((place) => place.id === selectedPlaceId) ?? null,
    [nearbyPlaces, selectedPlaceId]
  );

  const polylineCoordinates = useMemo(
    () =>
      route?.polyline?.map((point) => ({
        latitude: point.lat,
        longitude: point.lng
      })) ?? [],
    [route]
  );

  const boundingCoordinates = useMemo(() => {
    if (polylineCoordinates.length > 1) {
      return polylineCoordinates;
    }
    if (currentLocation && selectedPlace) {
      return [
        { latitude: currentLocation.lat, longitude: currentLocation.lng },
        { latitude: selectedPlace.lat, longitude: selectedPlace.lng }
      ];
    }
    return [];
  }, [polylineCoordinates, currentLocation, selectedPlace]);

  useEffect(() => {
    if (!mapRef.current || !boundingCoordinates.length || !open) {
      return;
    }
    mapRef.current.fitToCoordinates(boundingCoordinates, {
      edgePadding: { top: 80, right: 80, bottom: 160, left: 80 },
      animated: true
    });
  }, [boundingCoordinates, open]);

  useEffect(() => {
    if (!currentLocation || !mapRef.current) {
      return;
    }
    mapRef.current.animateCamera(
      {
        center: {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng
        },
        zoom: 15
      },
      { duration: 600 }
    );
  }, [currentLocation]);

  const handleToggleVoiceCompanion = () => {
    onOpenVoice?.();
  };

  const handleToggleMic = () => {
    const newListeningState = !localIsListening;
    setLocalIsListening(newListeningState);
    onListeningChange?.(newListeningState);
  };

  const handleSelectPlace = (placeId: string) => {
    setSelectedPlaceId(placeId);
  };

  const handleOpenExternalNavigation = async () => {
    if (!selectedPlace || !currentLocation) {
      return;
    }

    setIsExternalNavigationOpening(true);

    try {
      const success = await startNavigation(
        {
          latitude: selectedPlace.lat,
          longitude: selectedPlace.lng,
          name: selectedPlace.name,
          address: selectedPlace.address
        },
        {
          mode: 'walking',
          origin: {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng
          }
        }
      );

      if (!success) {
        setIsExternalNavigationOpening(false);
        return;
      }
      setTimeout(() => setIsExternalNavigationOpening(false), 2500);
    } catch (error) {
      console.error('Navigation error:', error);
      setIsExternalNavigationOpening(false);
    }
  };

  const mapRegion = useMemo<Region>(
    () =>
      currentLocation
        ? {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
          }
        : FALLBACK_REGION,
    [currentLocation]
  );

  const walkingDistanceMeters =
    route?.summary.distanceMeters ??
    selectedPlace?.distanceMeters ??
    location?.walkingDistance ??
    0;

  const walkingTimeMinutes =
    route?.summary.durationSeconds
      ? Math.max(1, Math.round(route.summary.durationSeconds / 60))
      : location?.walkingTime ?? estimateWalkingMinutes(walkingDistanceMeters);

  const displayLocationName = selectedPlace?.name ?? location?.name ?? 'Location';
  const displayLocationAddress =
    selectedPlace?.address ?? location?.address ?? 'Address not available';

  const routeReady = polylineCoordinates.length > 1;
  const canNavigate = Boolean(currentLocation && selectedPlaceId);
  const isInAppNavigationActive = inAppNavigationStatus === 'navigating';
  const isInAppNavigationPaused = inAppNavigationStatus === 'paused';
  const hasArrivedInApp = inAppNavigationStatus === 'arrived';
  const showInAppNavigationHud =
    isInAppNavigationActive || isInAppNavigationPaused || hasArrivedInApp;
  const canStartInAppNavigation = Boolean(route && canNavigate && !isLoadingRoute);
  const inAppButtonDisabled =
    (!showInAppNavigationHud && !canStartInAppNavigation) || isLoadingRoute;
  const externalButtonDisabled = !canNavigate || isExternalNavigationOpening;
  const primaryInAppLabel = isInAppNavigationActive
    ? 'Pause'
    : isInAppNavigationPaused
      ? 'Resume'
      : 'Navigate in App';
  const PrimaryInAppIcon = isInAppNavigationActive
    ? Pause
    : isInAppNavigationPaused
      ? Play
      : Navigation;

  const handleInAppNavigationPress = () => {
    if (isInAppNavigationActive) {
      pauseNavigation();
      return;
    }
    if (isInAppNavigationPaused) {
      resumeNavigation();
      return;
    }
    if (!canStartInAppNavigation) {
      return;
    }
    startInAppNavigation();
  };

  const handleEndInAppNavigation = () => {
    endInAppNavigation();
  };

  return (
    <>
      <Modal
        visible={open}
        animationType="slide"
        transparent={true}
        onRequestClose={() => onOpenChange(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.mapArea}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={mapRegion}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                showsUserLocation={Boolean(currentLocation)}
                showsMyLocationButton={false}
              >
                {currentLocation && (
                  <Marker
                    key="user-location"
                    coordinate={{
                      latitude: currentLocation.lat,
                      longitude: currentLocation.lng
                    }}
                    tracksViewChanges={false}
                  >
                    <View style={styles.userMarkerOuter}>
                      <View style={styles.userMarkerInner} />
                    </View>
                  </Marker>
                )}
                {nearbyPlaces.map((place) => (
                  <Marker
                    key={place.id}
                    coordinate={{ latitude: place.lat, longitude: place.lng }}
                    pinColor={selectedPlaceId === place.id ? '#0f766e' : '#22d3ee'}
                    onPress={() => handleSelectPlace(place.id)}
                    title={place.name}
                    description={place.address}
                  />
                ))}
                {routeReady && (
                  <Polyline
                    coordinates={polylineCoordinates}
                    strokeColor="#0ea5e9"
                    strokeWidth={5}
                  />
                )}
              </MapView>

              <LinearGradient
                colors={['rgba(240, 253, 244, 0.95)', 'rgba(240, 253, 244, 0)']}
                style={styles.mapGradient}
                pointerEvents="none"
              />

              <View style={styles.topBar}>
                <View style={styles.badgesRow}>
                  <View style={styles.badge}>
                    <Clock size={14} color="#14b8a6" />
                    <Text style={styles.badgeText}>
                      {walkingTimeMinutes ? `${walkingTimeMinutes} min` : '--'}
                    </Text>
                  </View>
                  <View style={styles.badge}>
                    <MapPin size={14} color="#6b7280" />
                    <Text style={styles.badgeText}>{formatDistance(walkingDistanceMeters)}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => onOpenChange(false)} style={styles.closeButtonTop}>
                  <X size={20} color="#134e4a" />
                </TouchableOpacity>
              </View>

              {errorMessage && (
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>{errorMessage}</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadMapData}
                    disabled={isLoadingMap}
                  >
                    <Text style={styles.retryButtonText}>
                      {isLoadingMap ? 'Loading...' : 'Retry'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {isLoadingMap && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#14b8a6" />
                  <Text style={styles.loadingText}>Fetching your location...</Text>
                </View>
              )}
            </View>

            <View style={styles.bottomCard}>
              <Text style={styles.locationName}>{displayLocationName}</Text>
              <Text style={styles.address}>{displayLocationAddress}</Text>

              {nearbyPlaces.length > 0 && (
                <View style={styles.placesScroller}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {nearbyPlaces.map((place) => (
                      <TouchableOpacity
                        key={place.id}
                        onPress={() => handleSelectPlace(place.id)}
                        style={[
                          styles.placeChip,
                          selectedPlaceId === place.id && styles.placeChipActive
                        ]}
                      >
                        <Text
                          style={[
                            styles.placeChipText,
                            selectedPlaceId === place.id && styles.placeChipTextActive
                          ]}
                        >
                          {place.name}
                        </Text>
                        <Text style={styles.placeChipDistance}>
                          {formatDistance(place.distanceMeters)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {isLoadingRoute && (
                <Text style={styles.statusText}>Calculating the best walking route...</Text>
              )}

              {showInAppNavigationHud && (
                <View style={styles.navigationHud}>
                  <Text style={styles.navHudTitle}>
                    {hasArrivedInApp ? 'You have arrived' : 'In-app navigation active'}
                  </Text>
                  <Text style={styles.navHudInstruction}>
                    {hasArrivedInApp
                      ? `You're within a short distance of ${displayLocationName}`
                      : upcomingStep?.instruction ??
                        `Follow the highlighted route to ${displayLocationName}`}
                  </Text>
                  {!hasArrivedInApp && upcomingStep?.distanceMeters !== undefined && (
                    <Text style={styles.navHudSubtle}>
                      Next instruction in {formatDistance(upcomingStep.distanceMeters)}
                    </Text>
                  )}
                  <View style={styles.navHudMetricsRow}>
                    <View style={styles.navHudMetric}>
                      <Text style={styles.navHudMetricLabel}>Distance</Text>
                      <Text style={styles.navHudMetricValue}>
                        {formatDistance(inAppDistanceRemaining ?? walkingDistanceMeters)}
                      </Text>
                    </View>
                    <View style={styles.navHudMetric}>
                      <Text style={styles.navHudMetricLabel}>Time</Text>
                      <Text style={styles.navHudMetricValue}>
                        {inAppTimeRemaining ?? walkingTimeMinutes ?? '--'} min
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {!showInAppNavigationHud && canNavigate && !isLoadingRoute && (
                <View style={styles.instructionBox}>
                  <Text style={styles.instructionText}>
                    Start in-app navigation to follow this walking route without leaving the app.
                  </Text>
                </View>
              )}

              {isExternalNavigationOpening && (
                <View style={styles.instructionBox}>
                  <Text style={[styles.instructionText, styles.instructionActive]}>
                    Opening navigation in your maps app...
                  </Text>
                </View>
              )}

              {inAppNavigationStatus === 'error' && inAppNavigationError && (
                <Text style={styles.navigationErrorText}>{inAppNavigationError.message}</Text>
              )}

              <View style={styles.actionsRow}>
                <View style={styles.actionContainer}>
                  <TouchableOpacity
                    onPress={handleInAppNavigationPress}
                    disabled={inAppButtonDisabled}
                    style={[
                      styles.actionButton,
                      styles.navButton,
                      (isInAppNavigationActive || isInAppNavigationPaused) && styles.navButtonActive,
                      (inAppButtonDisabled && !showInAppNavigationHud) && styles.actionButtonDisabled
                    ]}
                  >
                    <PrimaryInAppIcon
                      size={24}
                      color={
                        isInAppNavigationActive || isInAppNavigationPaused ? '#fff' : '#134e4a'
                      }
                    />
                  </TouchableOpacity>
                  <Text style={styles.actionLabel}>{primaryInAppLabel}</Text>
                </View>
                {showInAppNavigationHud && (
                  <View style={styles.actionContainer}>
                    <TouchableOpacity
                      onPress={handleEndInAppNavigation}
                      style={[styles.actionButton, styles.stopButton]}
                    >
                      <Square size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.actionLabel}>End</Text>
                  </View>
                )}
                <View style={styles.actionContainer}>
                  <TouchableOpacity
                    onPress={handleToggleVoiceCompanion}
                    style={[
                      styles.actionButton,
                      styles.voiceButton,
                      voiceCompanionActive && styles.voiceButtonActive
                    ]}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {voiceCompanionActive ? (
                      isSpeaking ? (
                        <Volume2 size={24} color="#134e4a" />
                      ) : isListening ? (
                        <Mic size={24} color="#134e4a" />
                      ) : (
                        <MessageCircle size={24} color="#134e4a" />
                      )
                    ) : (
                      <MessageCircle size={24} color="#134e4a" />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.actionLabel}>Voice Chat</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleOpenExternalNavigation}
                disabled={externalButtonDisabled}
                style={[styles.externalNavButton, externalButtonDisabled && styles.externalNavButtonDisabled]}
              >
                <Text style={styles.externalNavText}>
                  {isExternalNavigationOpening ? 'Opening Maps...' : 'Open in Maps'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showVoiceModal && (
            <View style={styles.voiceModalOverlay}>
              <View style={styles.voiceModalContent}>
                <LinearGradient colors={['#f0fdf4', '#ecfdf5']} style={styles.voiceModalGradient}>
                  <View style={styles.voiceModalHeader}>
                    <Text style={styles.voiceModalTitle}>Voice Chat</Text>
                    <TouchableOpacity onPress={() => onCloseVoice?.()}>
                      <X size={20} color="#134e4a" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.voiceModalBody}>
                    <TouchableOpacity
                      onPress={handleToggleMic}
                      style={[
                        styles.voiceModalMicButton,
                        localIsListening && styles.voiceModalMicButtonActive
                      ]}
                      activeOpacity={0.8}
                    >
                      {localIsListening ? (
                        <Mic size={64} color="#134e4a" />
                      ) : (
                        <MicOff size={64} color="#9ca3af" />
                      )}
                    </TouchableOpacity>

                    <View style={styles.voiceModalInstructions}>
                      <Text style={styles.voiceModalInstructionText}>
                        {localIsListening ? "I'm listening..." : 'Tap to speak'}
                      </Text>
                      <Text style={styles.voiceModalSubInstruction}>
                        {localIsListening
                          ? "Share what's on your mind"
                          : "Start talking about how you're feeling"}
                      </Text>
                    </View>

                    <View style={styles.voiceModalConversationBox}>
                      <Text style={styles.voiceModalConversationPlaceholder}>
                        {localIsListening
                          ? 'Listening to your voice...'
                          : 'Your conversation will appear here'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.voiceModalFooter}>
                    <TouchableOpacity
                      onPress={() => {
                        setLocalIsListening(false);
                        onCloseVoice?.();
                      }}
                      style={styles.voiceModalContinueButton}
                    >
                      <Text style={styles.voiceModalContinueButtonText}>Continue</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  content: {
    backgroundColor: '#ecfdf5',
    borderRadius: 32,
    overflow: 'hidden',
    paddingBottom: 24
  },
  mapArea: {
    height: 420,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#d1fae5'
  },
  map: {
    flex: 1
  },
  mapGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140
  },
  topBar: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 10
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.9)'
  },
  badgeText: {
    fontSize: 13,
    color: '#134e4a',
    fontWeight: '500'
  },
  closeButtonTop: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    color: '#134e4a',
    fontSize: 14,
    fontWeight: '500'
  },
  messageBox: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4
  },
  messageText: {
    color: '#134e4a',
    fontSize: 14,
    marginBottom: 8
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#14b8a6'
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13
  },
  userMarkerOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22d3ee',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0f172a'
  },
  bottomCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 10
  },
  locationName: {
    fontSize: 20,
    color: '#134e4a',
    fontWeight: '500',
    marginBottom: 4
  },
  address: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '300',
    marginBottom: 16
  },
  placesScroller: {
    marginBottom: 16
  },
  placeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#f0fdf4',
    marginRight: 10
  },
  placeChipActive: {
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: '#14b8a6'
  },
  placeChipText: {
    color: '#134e4a',
    fontSize: 14,
    fontWeight: '500'
  },
  placeChipTextActive: {
    color: '#0f766e'
  },
  placeChipDistance: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2
  },
  statusText: {
    fontSize: 13,
    color: '#10b981',
    marginBottom: 12
  },
  instructionBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  instructionText: {
    fontSize: 13,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 18
  },
  instructionActive: {
    color: '#0f766e',
    fontWeight: '500'
  },
  navigationHud: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 16
  },
  navHudTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 6
  },
  navHudInstruction: {
    fontSize: 14,
    color: '#134e4a',
    marginBottom: 4
  },
  navHudSubtle: {
    fontSize: 12,
    color: '#3f3f46',
    marginBottom: 12
  },
  navHudMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  navHudMetric: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1fae5'
  },
  navHudMetricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4
  },
  navHudMetricValue: {
    fontSize: 18,
    color: '#065f46',
    fontWeight: '600'
  },
  navigationErrorText: {
    color: '#b91c1c',
    fontSize: 13,
    marginBottom: 12
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 24,
    flexWrap: 'wrap'
  },
  actionContainer: {
    alignItems: 'center',
    gap: 8
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500'
  },
  actionButtonDisabled: {
    opacity: 0.5
  },
  externalNavButton: {
    marginTop: 12,
    alignSelf: 'stretch',
    width: '100%',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#14b8a6'
  },
  externalNavButtonDisabled: {
    borderColor: '#cbd5f5',
    opacity: 0.5
  },
  externalNavText: {
    color: '#0f766e',
    fontWeight: '600'
  },
  navButton: {
    backgroundColor: '#5eead4'
  },
  navButtonActive: {
    backgroundColor: '#0f766e'
  },
  stopButton: {
    backgroundColor: '#ef4444'
  },
  voiceButton: {
    backgroundColor: '#5eead4'
  },
  voiceButtonActive: {
    backgroundColor: '#5eead4',
    shadowColor: '#5eead4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8
  },
  voiceModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  voiceModalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '85%'
  },
  voiceModalGradient: {
    flex: 1,
    paddingBottom: 24
  },
  voiceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(94, 234, 212, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)'
  },
  voiceModalTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#134e4a'
  },
  voiceModalBody: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 20
  },
  voiceModalMicButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center'
  },
  voiceModalMicButtonActive: {
    backgroundColor: '#5eead4',
    shadowColor: '#5eead4',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10
  },
  voiceModalInstructions: {
    alignItems: 'center'
  },
  voiceModalInstructionText: {
    fontSize: 16,
    color: '#134e4a',
    fontWeight: '600'
  },
  voiceModalSubInstruction: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4
  },
  voiceModalConversationBox: {
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.2)',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  voiceModalConversationPlaceholder: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center'
  },
  voiceModalFooter: {
    paddingHorizontal: 20
  },
  voiceModalContinueButton: {
    marginTop: 12,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#134e4a'
  },
  voiceModalContinueButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15
  }
});

function formatDistance(distanceMeters?: number): string {
  if (!distanceMeters || Number.isNaN(distanceMeters)) {
    return '--';
  }
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(distanceMeters)} m`;
}

function estimateWalkingMinutes(distanceMeters?: number): number {
  if (!distanceMeters || Number.isNaN(distanceMeters)) {
    return 0;
  }
  return Math.max(1, Math.round(distanceMeters / 80));
}

function distanceBetweenMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const latDiff = (a.lat - b.lat) * 111000;
  const lngDiff =
    (a.lng - b.lng) * 111000 * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
}
