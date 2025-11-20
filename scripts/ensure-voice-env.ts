import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadVoiceAgentBackendEnv } from '@take-a-break/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const voiceEnvDir = path.resolve(repoRoot, 'services/voice/web_agent');

const localEnv = path.join(voiceEnvDir, '.env.local');
const legacyEnv = path.join(voiceEnvDir, '.env');

const envFile = fs.existsSync(localEnv) ? localEnv : fs.existsSync(legacyEnv) ? legacyEnv : null;

if (!envFile) {
  throw new Error(
    'Voice agent environment file not found. Copy services/voice/web_agent/.env.example to .env.local before starting the backend.'
  );
}

loadVoiceAgentBackendEnv({ envDir: voiceEnvDir, silent: true });

console.log(`✅ Voice agent env loaded from ${path.basename(envFile)}`);
