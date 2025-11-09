import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { ErrorResponse } from '@take-a-break/types/error.js';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory rate limit store (TODO: Replace with Redis in production)
const rateLimitStore: RateLimitStore = {};

/**
 * Generate rate limit key from user ID and endpoint
 */
function generateRateLimitKey(userId: string, endpoint: string): string {
  return `${userId}:${endpoint}`;
}

/**
 * Check if request exceeds rate limit
 */
function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitStore[key];

  if (!record || now > record.resetTime) {
    // Create new record or reset expired record
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + windowMs
    };
    return false; // Not exceeded
  }

  if (record.count >= limit) {
    return true; // Exceeded
  }

  // Increment count
  record.count++;
  return false; // Not exceeded
}

/**
 * Get rate limit headers
 */
function getRateLimitHeaders(key: string, limit: number, windowMs: number): {
  'X-RateLimit-Limit': number;
  'X-RateLimit-Remaining': number;
  'X-RateLimit-Reset': number;
} {
  const record = rateLimitStore[key];
  const remaining = record ? Math.max(0, limit - record.count) : limit;
  const reset = record ? record.resetTime : Date.now() + windowMs;

  return {
    'X-RateLimit-Limit': limit,
    'X-RateLimit-Remaining': remaining,
    'X-RateLimit-Reset': reset
  };
}

/**
 * Rate limiting middleware
 */
async function rateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  limit: number,
  windowMs: number
): Promise<void> {
  // TODO: Extract user ID from authenticated request
  const userId = (request as any).user?.uid || request.ip;

  // TODO: Get endpoint path
  const endpoint = request.url;

  const key = generateRateLimitKey(userId, endpoint);

  if (checkRateLimit(key, limit, windowMs)) {
    const headers = getRateLimitHeaders(key, limit, windowMs);
    Object.entries(headers).forEach(([name, value]) => {
      reply.header(name, value.toString());
    });

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please try again later.',
        details: [],
        timestamp: new Date().toISOString(),
        trace_id: request.id || ''
      }
    };
    reply.code(429).send(errorResponse);
    return;
  }

  // Add rate limit headers to response
  const headers = getRateLimitHeaders(key, limit, windowMs);
  Object.entries(headers).forEach(([name, value]) => {
    reply.header(name, value.toString());
  });
}

/**
 * Rate limit configuration for different endpoints
 */
const rateLimitConfig: Record<string, { limit: number; windowMs: number }> = {
  '/break/plans': {
    limit: 10, // 10 requests
    windowMs: 60 * 60 * 1000 // per hour
  },
  '/history': {
    limit: 100, // 100 requests
    windowMs: 60 * 1000 // per minute
  },
  '/map/nearby': {
    limit: 60, // 60 requests
    windowMs: 60 * 1000 // per minute
  },
  '/map/route': {
    limit: 60, // 60 requests
    windowMs: 60 * 1000 // per minute
  }
};

/**
 * Register rate limiting
 */
async function rateLimitPlugin(fastify: FastifyInstance) {
  // TODO: Register rate limiting middleware
  // - Apply to specific routes based on rateLimitConfig
  // - Use fastify.addHook('preHandler', ...) or route-specific hooks
}

export default fp(rateLimitPlugin, {
  name: 'rate-limit'
});

export { rateLimitMiddleware, rateLimitConfig, checkRateLimit, getRateLimitHeaders };

