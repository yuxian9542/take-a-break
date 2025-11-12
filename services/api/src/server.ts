import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySwagger from '@fastify/swagger';
import publicRoutes from './routes/public.js';
import mapRoutes from './routes/map.js';
import { loadConfig } from '@take-a-break/config';
import { ensureFirebaseApp } from '@take-a-break/firebase';

export async function buildServer() {
  const config = loadConfig();

  const fastify = Fastify({
    logger: true
  });

  await fastify.register(fastifyCors, {
    origin: true
  });

  await fastify.register(fastifyHelmet);

  if (config.ENABLE_SWAGGER) {
    await fastify.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'Take a Break API',
          description: 'Public endpoints for health checks and metadata',
          version: '0.1.0'
        }
      }
    });
  }

  await fastify.register(publicRoutes);
  await fastify.register(mapRoutes);

  ensureFirebaseApp();

  return fastify;
}

async function start() {
  const server = await buildServer();
  const config = loadConfig();
  const port = Number(config.PORT ?? 3333);
  const address = await server.listen({ port, host: '0.0.0.0' });
  server.log.info(`API listening on ${address}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
