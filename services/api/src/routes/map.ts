import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type {
  NearbyRequest,
  NearbyResponse,
  RouteRequest,
  RouteResponse
} from '@take-a-break/types/map.js';
import type { SuccessResponse } from '@take-a-break/types/error.js';

interface NearbyQuery {
  lat: number;
  lng: number;
  radius: number;
  category?: string;
}

interface RouteQuery {
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  waypoints?: string; // JSON array string
}

async function mapRoutes(fastify: FastifyInstance) {
  /**
   * GET /map/nearby
   * Find locations near a given point
   */
  fastify.get<{
    Querystring: NearbyQuery;
    Reply: SuccessResponse<NearbyResponse>;
  }>(
    '/map/nearby',
    async (
      request: FastifyRequest<{ Querystring: NearbyQuery }>,
      reply: FastifyReply
    ): Promise<SuccessResponse<NearbyResponse>> => {
      const { lat, lng, radius, category } = request.query;

      // TODO: Validate query parameters
      // - lat: -90 to 90
      // - lng: -180 to 180
      // - radius: positive number (meters)
      // - category: optional string

      // TODO: Call map service (Google Maps, OpenStreetMap, etc.)
      // - Search for nearby locations
      // - Filter by category if provided
      // - Calculate distances
      // - Sort by distance

      const nearbyLocations: NearbyResponse = [];

      return {
        success: true,
        data: nearbyLocations
      };
    }
  );

  /**
   * GET /map/route
   * Calculate route from start to end with optional waypoints (query parameters)
   */
  fastify.get<{
    Querystring: RouteQuery;
    Reply: SuccessResponse<RouteResponse>;
  }>(
    '/map/route',
    async (
      request: FastifyRequest<{ Querystring: RouteQuery }>,
      reply: FastifyReply
    ): Promise<SuccessResponse<RouteResponse>> => {
      const { start_lat, start_lng, end_lat, end_lng, waypoints } = request.query;

      // TODO: Validate query parameters
      // - All coordinates: valid lat/lng ranges
      // - waypoints: parse JSON array if provided

      // TODO: Parse waypoints from JSON string if provided
      const parsedWaypoints = waypoints ? JSON.parse(waypoints) : undefined;

      // TODO: Call route service (Google Maps Directions API, etc.)
      // - Calculate route from start to end
      // - Include waypoints if provided
      // - Get distance (meters)
      // - Get duration (seconds)
      // - Get encoded polyline

      const routeResponse: RouteResponse = {
        distance: 0,
        duration: 0,
        polyline: ''
      };

      return {
        success: true,
        data: routeResponse
      };
    }
  );

  /**
   * POST /map/route
   * Calculate route from start to end with optional waypoints (request body)
   */
  fastify.post<{
    Body: RouteRequest;
    Reply: SuccessResponse<RouteResponse>;
  }>(
    '/map/route',
    async (
      request: FastifyRequest<{ Body: RouteRequest }>,
      reply: FastifyReply
    ): Promise<SuccessResponse<RouteResponse>> => {
      const body = request.body;

      // TODO: Validate request body
      // - start: valid coordinates
      // - end: valid coordinates
      // - waypoints: array of valid coordinates (optional)

      // TODO: Call route service (Google Maps Directions API, etc.)
      // - Calculate route from start to end
      // - Include waypoints if provided
      // - Get distance (meters)
      // - Get duration (seconds)
      // - Get encoded polyline

      const routeResponse: RouteResponse = {
        distance: 0,
        duration: 0,
        polyline: ''
      };

      return {
        success: true,
        data: routeResponse
      };
    }
  );
}

export default fp(mapRoutes, {
  name: 'map-routes'
});

