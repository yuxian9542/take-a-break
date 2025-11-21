import { ref, onMounted } from "vue";

const STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  GRANTED: "granted",
  DENIED: "denied",
  ERROR: "error",
};

export function useBrowserLocation() {
  const location = ref(null);
  const status = ref(STATUS.IDLE);
  const error = ref(null);

  const requestLocation = () => {
    const geo = typeof navigator !== "undefined" ? navigator.geolocation : undefined;
    if (!geo || typeof geo.getCurrentPosition !== "function") {
      error.value = "Geolocation is not supported in this browser.";
      status.value = STATUS.ERROR;
      return;
    }

    status.value = STATUS.LOADING;
    error.value = null;

    geo.getCurrentPosition(
      (position) => {
        location.value = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: position.coords.accuracy ?? undefined,
          timestamp: position.timestamp,
        };
        status.value = STATUS.GRANTED;
        error.value = null;
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          status.value = STATUS.DENIED;
          error.value = "Location permission denied. Using fallback location.";
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          status.value = STATUS.ERROR;
          error.value = "GPS unavailable on this device. Using fallback location.";
        } else if (geoError.code === geoError.TIMEOUT) {
          status.value = STATUS.ERROR;
          error.value = "Location request timed out. Using fallback location.";
        } else {
          status.value = STATUS.ERROR;
          error.value = "Unable to determine your location. Using fallback location.";
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      },
    );
  };

  onMounted(() => {
    requestLocation();
  });

  return {
    location,
    status,
    error,
    refresh: requestLocation,
  };
}

export const BrowserLocationStatus = STATUS;
