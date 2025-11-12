import { config } from 'dotenv';
import { configSchema, type AppConfig } from './schema';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from workspace root
// This ensures we load from project root regardless of where the service runs
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = join(__dirname, '../../..');

config({ path: join(workspaceRoot, '.env') });

let cachedConfig: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = configSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }

  cachedConfig = parsed.data;
  return cachedConfig;
}

export function resetConfigForTesting(): void {
  cachedConfig = null;
}
