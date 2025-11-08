import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { loadConfig } from '@take-a-break/config';
import type { HealthResponse, MetaConfigResponse } from '@take-a-break/types/public.js';

async function publicRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (): Promise<HealthResponse> => {
    const config = loadConfig();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.APP_ENV
    };
  });

  fastify.get('/meta/config', async (): Promise<MetaConfigResponse> => {
    const config = loadConfig();

    return {
      environment: config.APP_ENV,
      features: config.PUBLIC_FEATURES,
      firebase: {
        projectId: config.FIREBASE_PROJECT_ID,
        storageBucket: config.FIREBASE_STORAGE_BUCKET
      }
    };
  });
}

export default fp(publicRoutes, {
  name: 'public-routes'
});
