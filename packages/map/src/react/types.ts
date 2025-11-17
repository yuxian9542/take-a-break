import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Region extends LatLng {
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface EdgePadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface FitToCoordinatesOptions {
  edgePadding?: EdgePadding;
  animated?: boolean;
}

export interface MapCamera {
  center: LatLng;
  zoom?: number;
}

export interface MapAnimationOptions {
  duration?: number;
}

export interface MapViewHandle {
  fitToCoordinates?: (coordinates: LatLng[], options?: FitToCoordinatesOptions) => void;
  animateCamera?: (camera: MapCamera, options?: MapAnimationOptions) => void;
}

export interface MapViewProps {
  initialRegion: Region;
  style?: StyleProp<ViewStyle>;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  children?: ReactNode;
  provider?: 'google' | 'default';
  apiKey?: string;
}

export interface MapMarkerProps {
  coordinate: LatLng;
  pinColor?: string;
  onPress?: (coordinate: LatLng) => void;
  title?: string;
  description?: string;
  children?: ReactNode;
}

export interface MapPolylineProps {
  coordinates: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
}

export interface MapProviderProps {
  children: ReactNode;
  apiKey?: string;
  libraries?: string[];
  defaultCenter?: LatLng;
}
