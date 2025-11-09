import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { ErrorResponse } from '@take-a-break/types/error.js';

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    uid: string;
    email?: string;
  };
}

/**
 * Extract Firebase JWT token from request
 */
function extractToken(request: FastifyRequest): string | null {
  // TODO: Extract token from Authorization header
  // Format: "Bearer <token>"
  const authHeader = request.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // TODO: Extract token from query parameter
  // Format: ?token=<token>
  const query = request.query as { token?: string };
  if (query?.token) {
    return query.token;
  }

  return null;
}

/**
 * Verify Firebase JWT token
 */
async function verifyToken(token: string): Promise<{ uid: string; email?: string } | null> {
  // TODO: Verify Firebase JWT token
  // - Use Firebase Admin SDK
  // - Verify token signature
  // - Check token expiration
  // - Extract user ID and email
  // - Return user info or null if invalid

  return null;
}

/**
 * Authentication middleware
 * Verifies Firebase JWT token and attaches user info to request
 */
async function authMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  const token = extractToken(request);

  if (!token) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please provide a valid Firebase JWT token.',
        details: [],
        timestamp: new Date().toISOString(),
        trace_id: request.id || ''
      }
    };
    reply.code(401).send(errorResponse);
    return;
  }

  const user = await verifyToken(token);

  if (!user) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired authentication token.',
        details: [],
        timestamp: new Date().toISOString(),
        trace_id: request.id || ''
      }
    };
    reply.code(401).send(errorResponse);
    return;
  }

  // Attach user info to request
  request.user = user;
}

/**
 * Register authentication middleware
 */
async function authPlugin(fastify: FastifyInstance) {
  // TODO: Register as preHandler for protected routes
  // - Apply to all routes except public routes
  // - Use fastify.addHook('preHandler', authMiddleware)
}

export default fp(authPlugin, {
  name: 'auth-middleware'
});

export { authMiddleware, extractToken, verifyToken };

