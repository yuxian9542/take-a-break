import 'tsx/esm';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const { loadVoiceAgentFrontendEnv } = await import('@take-a-break/config');

loadVoiceAgentFrontendEnv({ envDir: process.cwd() });

export default defineConfig({
  plugins: [react()]
});
