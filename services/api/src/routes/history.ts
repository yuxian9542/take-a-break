import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { HistoryResponse } from '@take-a-break/types/break.js';
import type { SuccessResponse } from '@take-a-break/types/error.js';

interface HistoryQuery {
  cursor?: string;
  limit?: number;
}

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    uid: string;
    email?: string;
  };
}

async function historyRoutes(fastify: FastifyInstance) {
  /**
   * GET /history
   * Get paginated list of past break sessions (filtered by chosen: true)
   */
  fastify.get<{
    Querystring: HistoryQuery;
    Reply: SuccessResponse<HistoryResponse>;
  }>(
    '/history',
    async (
      request: FastifyRequest<{ Querystring: HistoryQuery }>,
      reply: FastifyReply
    ): Promise<SuccessResponse<HistoryResponse>> => {
      const { cursor, limit = 7 } = request.query;

      // TODO: Extract user_id from authenticated request
      const userId = '';

      // TODO: Validate query parameters
      // - limit: 1-50 (default: 7)
      // - cursor: ISO 8601 timestamp or UUID (optional)

      // TODO: Fetch history from Firestore
      // - Filter by user_id
      // - Filter by chosen: true
      // - Order by time descending
      // - Apply cursor-based pagination
      // - Limit results

      // TODO: Determine if more results exist
      const hasMore = false;

      // TODO: Generate next cursor (timestamp or UUID of last item)

      const historyResponse: HistoryResponse = {
        items: [],
        cursor: undefined,
        hasMore
      };

      return {
        success: true,
        data: historyResponse,
        meta: {
          cursor: historyResponse.cursor,
          hasMore
        }
      };
    }
  );
}

export default fp(historyRoutes, {
  name: 'history-routes'
});

