import { z } from 'zod';

export const configSchema = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_DATABASE_URL: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  PUBLIC_FEATURES: z
    .string()
    .default('break-planner,map,voice')
    .transform((value) =>
      value
        .split(',')
        .map((feature) => feature.trim())
        .filter(Boolean)
    ),
  ENABLE_SWAGGER: z
    .string()
    .optional()
    .transform((value) => (value ?? 'true').toLowerCase() === 'true')
});

export type RawConfig = z.input<typeof configSchema>;
export type AppConfig = z.output<typeof configSchema>;
