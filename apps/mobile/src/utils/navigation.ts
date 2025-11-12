import { Linking, Platform, Alert } from 'react-native';

/**
 * Navigation utility for opening external map applications
 * Supports both iOS (Apple Maps) and Android (Google Maps)
 */

export interface NavigationDestination {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface NavigationOptions {
  mode?: 'walking' | 'driving' | 'transit' | 'bicycling';
  origin?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Opens the device's native map application for navigation
 * @param destination - The destination coordinates and optional details
 * @param options - Navigation options including mode and origin
 * @returns Promise<boolean> - true if navigation was opened successfully
 */
export async function startNavigation(
  destination: NavigationDestination,
  options: NavigationOptions = {}
): Promise<boolean> {
  const { mode = 'walking', origin } = options;
  
  try {
    const url = buildNavigationUrl(destination, mode, origin);
    const supported = await Linking.canOpenURL(url);
    
    if (!supported) {
      Alert.alert(
        'Navigation Unavailable',
        'Unable to open maps application. Please ensure you have a maps app installed.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error('Error opening navigation:', error);
    Alert.alert(
      'Navigation Error',
      'Failed to open navigation. Please try again.',
      [{ text: 'OK' }]
    );
    return false;
  }
}

/**
 * Builds the appropriate URL for the platform's map application
 */
function buildNavigationUrl(
  destination: NavigationDestination,
  mode: string,
  origin?: { latitude: number; longitude: number }
): string {
  const { latitude, longitude, name, address } = destination;
  
  if (Platform.OS === 'ios') {
    // Apple Maps URL scheme
    // https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html
    const params = new URLSearchParams();
    
    // Destination
    params.append('daddr', `${latitude},${longitude}`);
    
    // Origin (optional)
    if (origin) {
      params.append('saddr', `${origin.latitude},${origin.longitude}`);
    }
    
    // Transport type
    const appleMode = mode === 'walking' ? 'w' : mode === 'driving' ? 'd' : 'r';
    params.append('dirflg', appleMode);
    
    // Destination name (optional)
    if (name) {
      params.append('q', name);
    }
    
    return `maps://?${params.toString()}`;
  } else {
    // Google Maps URL scheme for Android
    // https://developers.google.com/maps/documentation/urls/android-intents
    const params = new URLSearchParams();
    
    // Destination
    if (name || address) {
      params.append('destination', name || address || '');
      params.append('destination_place_id', ''); // Could be enhanced with place ID
    } else {
      params.append('destination', `${latitude},${longitude}`);
    }
    
    // Origin (optional)
    if (origin) {
      params.append('origin', `${origin.latitude},${origin.longitude}`);
    }
    
    // Transport mode
    params.append('travelmode', mode);
    
    // Open in navigation mode
    params.append('dir_action', 'navigate');
    
    return `google.navigation:q=${latitude},${longitude}&mode=${mode}`;
  }
}

/**
 * Opens the map application to show a location (without navigation)
 * @param destination - The location to show
 * @returns Promise<boolean> - true if opened successfully
 */
export async function showLocation(
  destination: NavigationDestination
): Promise<boolean> {
  const { latitude, longitude, name } = destination;
  
  try {
    let url: string;
    
    if (Platform.OS === 'ios') {
      const params = new URLSearchParams();
      params.append('ll', `${latitude},${longitude}`);
      if (name) {
        params.append('q', name);
      }
      url = `maps://?${params.toString()}`;
    } else {
      url = `geo:${latitude},${longitude}?q=${latitude},${longitude}${name ? `(${encodeURIComponent(name)})` : ''}`;
    }
    
    const supported = await Linking.canOpenURL(url);
    
    if (!supported) {
      Alert.alert(
        'Maps Unavailable',
        'Unable to open maps application.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error('Error opening location:', error);
    Alert.alert(
      'Error',
      'Failed to open location. Please try again.',
      [{ text: 'OK' }]
    );
    return false;
  }
}

/**
 * Check if navigation is available on this device
 */
export async function isNavigationAvailable(): Promise<boolean> {
  try {
    const testUrl = Platform.OS === 'ios' ? 'maps://' : 'geo:0,0';
    return await Linking.canOpenURL(testUrl);
  } catch {
    return false;
  }
}

