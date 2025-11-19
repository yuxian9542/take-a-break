/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_VOICE_WS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
