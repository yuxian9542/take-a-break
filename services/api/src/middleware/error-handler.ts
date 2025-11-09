import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { ErrorResponse } from '@take-a-break/types/error.js';

/**
 * Generate trace ID for error tracking
 */
function generateTraceId(): string {
  // TODO: Generate UUID for trace ID
  // - Use crypto.randomUUID() or uuid library
  return '';
}

/**
 * Format validation error details
 */
function formatValidationErrors(error: any): Array<{ field: string; issue: string }> {
  // TODO: Extract validation errors from Fastify validation error
  // - Parse error.validation array
  // - Format as ErrorDetail[]
  return [];
}

/**
 * Global error handler
 */
async function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const traceId = generateTraceId();

  // TODO: Log error with trace ID
  // - Include request details
  // - Include error stack
  // - Use structured logging

  // Handle validation errors
  if (error.validation) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Request validation failed',
        details: formatValidationErrors(error),
        timestamp: new Date().toISOString(),
        trace_id: traceId
      }
    };
    reply.code(400).send(errorResponse);
    return;
  }

  // Handle authentication errors
  if (error.statusCode === 401) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.message || 'Authentication required',
        details: [],
        timestamp: new Date().toISOString(),
        trace_id: traceId
      }
    };
    reply.code(401).send(errorResponse);
    return;
  }

  // Handle not found errors
  if (error.statusCode === 404) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message || 'Resource not found',
        details: [],
        timestamp: new Date().toISOString(),
        trace_id: traceId
      }
    };
    reply.code(404).send(errorResponse);
    return;
  }

  // Handle rate limit errors
  if (error.statusCode === 429) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please try again later.',
        details: [],
        timestamp: new Date().toISOString(),
        trace_id: traceId
      }
    };
    reply.code(429).send(errorResponse);
    return;
  }

  // Handle internal server errors
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal server error occurred',
      details: [],
      timestamp: new Date().toISOString(),
      trace_id: traceId
    }
  };
  reply.code(500).send(errorResponse);
}

/**
 * Register error handler
 */
async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler(errorHandler);
}

export default fp(errorHandlerPlugin, {
  name: 'error-handler'
});

export { errorHandler, generateTraceId, formatValidationErrors };

