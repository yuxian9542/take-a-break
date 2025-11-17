type ProcessEnv = Record<string, string | undefined>;

const processEnv: ProcessEnv | undefined =
  typeof globalThis !== 'undefined' && 'process' in globalThis
    ? (globalThis as unknown as { process?: { env?: ProcessEnv } }).process?.env
    : undefined;

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  processEnv?.EXPO_PUBLIC_API_BASE_URL ??
  'http://localhost:3333';

const voiceWsUrl =
  import.meta.env.VITE_VOICE_WS_URL ??
  processEnv?.EXPO_PUBLIC_VOICE_WS_URL ??
  'ws://localhost:8000/ws/voice';

export const webEnvironment = {
  apiBaseUrl,
  googleMapsApiKey:
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ??
    processEnv?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
    '',
  voiceWsUrl
};
