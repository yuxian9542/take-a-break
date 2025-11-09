import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import publicRoutes from './routes/public.js';
import breakRoutes from './routes/break.js';
import historyRoutes from './routes/history.js';
import mapRoutes from './routes/map.js';
import voiceRoutes from './routes/voice.js';
import validationPlugin from './plugins/validation.js';
import errorHandler from './middleware/error-handler.js';
import authMiddleware from './middleware/auth.js';
import rateLimit from './middleware/rate-limit.js';
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

  // Register validation plugin (includes Swagger/Swagger UI)
  await fastify.register(validationPlugin);

  // Register error handler
  await fastify.register(errorHandler);

  // Register authentication middleware
  // TODO: Apply to protected routes only
  await fastify.register(authMiddleware);

  // Register rate limiting
  // TODO: Apply to specific routes based on configuration
  await fastify.register(rateLimit);

  // Register public routes (no authentication required)
  await fastify.register(publicRoutes);

  // Register protected routes (authentication required)
  // TODO: Apply authentication middleware to these routes
  await fastify.register(breakRoutes);
  await fastify.register(historyRoutes);
  await fastify.register(mapRoutes);
  await fastify.register(voiceRoutes);

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
