import dotenvFlow from 'dotenv-flow';
import { configSchema, type AppConfig } from './schema';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { z, type ZodSchema } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = join(__dirname, '../../..');
const loadedEnvDirs = new Set<string>();

export type LoadEnvOptions = {
  envDir?: string;
  nodeEnv?: string;
  silent?: boolean;
};

function ensureEnvLoaded(options?: LoadEnvOptions) {
  const envDir = options?.envDir ?? workspaceRoot;
  const nodeEnv = options?.nodeEnv ?? process.env.NODE_ENV ?? process.env.APP_ENV ?? 'development';
  const cacheKey = `${envDir}:${nodeEnv}`;

  if (loadedEnvDirs.has(cacheKey)) {
    return { envDir, nodeEnv };
  }

  dotenvFlow.config({
    path: envDir,
    node_env: nodeEnv,
    default_node_env: 'development',
    silent: options?.silent ?? true
  });

  loadedEnvDirs.add(cacheKey);
  return { envDir, nodeEnv };
}

export function loadEnvSection<T>(
  schema: ZodSchema<T>,
  options?: LoadEnvOptions & { errorPrefix?: string }
): T {
  const { envDir } = ensureEnvLoaded(options);
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    const prefix = options?.errorPrefix ?? 'environment';
    throw new Error(`Invalid ${prefix} configuration (${envDir}): ${parsed.error.message}`);
  }

  return parsed.data;
}

let cachedConfig: AppConfig | null = null;

export function loadConfig(options?: LoadEnvOptions): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = loadEnvSection(configSchema, {
    ...options,
    envDir: options?.envDir ?? workspaceRoot,
    errorPrefix: 'server'
  });

  return cachedConfig;
}

export function resetConfigForTesting(): void {
  cachedConfig = null;
}

const nonEmpty = (name: string) =>
  z
    .string({ required_error: `${name} is required` })
    .trim()
    .min(1, `${name} is required`);

const webClientEnvSchema = z.object({
  VITE_API_BASE_URL: nonEmpty('VITE_API_BASE_URL'),
  VITE_GOOGLE_MAPS_API_KEY: nonEmpty('VITE_GOOGLE_MAPS_API_KEY'),
  VITE_VOICE_WS_URL: nonEmpty('VITE_VOICE_WS_URL')
});

export type WebClientEnv = z.infer<typeof webClientEnvSchema>;

export function loadWebClientEnv(options?: LoadEnvOptions): WebClientEnv {
  return loadEnvSection(webClientEnvSchema, {
    ...options,
    errorPrefix: 'web client'
  });
}

const voiceAgentBackendEnvSchema = z.object({
  GLM_API_KEY: nonEmpty('GLM_API_KEY'),
  VITE_BACKEND_URL: nonEmpty('VITE_BACKEND_URL')
});

export type VoiceAgentBackendEnv = z.infer<typeof voiceAgentBackendEnvSchema>;

export function loadVoiceAgentBackendEnv(options?: LoadEnvOptions): VoiceAgentBackendEnv {
  return loadEnvSection(voiceAgentBackendEnvSchema, {
    ...options,
    errorPrefix: 'voice agent backend'
  });
}

const voiceAgentFrontendEnvSchema = z.object({
  VITE_BACKEND_URL: nonEmpty('VITE_BACKEND_URL')
});

export type VoiceAgentFrontendEnv = z.infer<typeof voiceAgentFrontendEnvSchema>;

export function loadVoiceAgentFrontendEnv(options?: LoadEnvOptions): VoiceAgentFrontendEnv {
  return loadEnvSection(voiceAgentFrontendEnvSchema, {
    ...options,
    errorPrefix: 'voice agent frontend'
  });
}
