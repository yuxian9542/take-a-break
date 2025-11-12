const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Custom Expo config plugin to add Google Maps API key to AndroidManifest.xml
 * This is needed for react-native-maps to work on Android
 */
const withGoogleMapsApiKey = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      manifest.application = [{}];
    }

    const application = manifest.application[0];
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    // Get API key from app.json config
    const apiKey = config.android?.config?.googleMaps?.apiKey || 'YOUR_GOOGLE_MAPS_API_KEY';

    // Check if meta-data already exists
    const existingMetaData = application['meta-data'].find(
      (meta) => meta.$['android:name'] === 'com.google.android.geo.API_KEY'
    );

    if (existingMetaData) {
      existingMetaData.$['android:value'] = apiKey;
    } else {
      application['meta-data'].push({
        $: {
          'android:name': 'com.google.android.geo.API_KEY',
          'android:value': apiKey,
        },
      });
    }

    return config;
  });
};

module.exports = withGoogleMapsApiKey;



