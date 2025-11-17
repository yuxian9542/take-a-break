const loaderCache = new Map<string, Promise<typeof google>>();

export function loadGoogleMaps(apiKey: string, libraries: string[]) {
  const normalizedLibraries = libraries.length ? libraries.join(',') : 'places';
  const cacheKey = `${apiKey}:${normalizedLibraries}`;

  if (loaderCache.has(cacheKey)) {
    return loaderCache.get(cacheKey)!;
  }

  const loaderPromise = new Promise<typeof google>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Maps can only load in a browser environment.'));
      return;
    }

    if ((window as typeof window & { google?: typeof google }).google?.maps) {
      resolve((window as typeof window & { google: typeof google }).google);
      return;
    }

    if (!apiKey) {
      reject(new Error('Google Maps API key is missing.'));
      return;
    }

    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: apiKey,
      libraries: normalizedLibraries
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps JavaScript API'));
    };

    script.onload = () => {
      const googleGlobal = (window as typeof window & { google?: typeof google }).google;
      if (googleGlobal?.maps) {
        resolve(googleGlobal);
      } else {
        reject(new Error('Google Maps API loaded without maps namespace'));
      }
    };

    document.head.appendChild(script);
  });

  loaderCache.set(cacheKey, loaderPromise);
  return loaderPromise;
}
