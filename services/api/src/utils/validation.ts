import type { CreateBreakPlanRequest } from '@take-a-break/types/break.js';
import type { RouteRequest, NearbyRequest } from '@take-a-break/types/map.js';

/**
 * Validate break plan request
 */
export function validateBreakPlanRequest(request: CreateBreakPlanRequest): {
  valid: boolean;
  errors: Array<{ field: string; issue: string }>;
} {
  const errors: Array<{ field: string; issue: string }> = [];

  // TODO: Validate duration
  // - Must be positive number
  // - Must be reasonable (e.g., 1-120 minutes)

  // TODO: Validate location coordinates
  // - lat: -90 to 90
  // - lng: -180 to 180

  // TODO: Validate feeling
  // - Must be non-empty string
  // - Optional: check against allowed values

  // TODO: Validate request_time
  // - Must be valid ISO 8601 timestamp
  // - Should be recent (not too far in past/future)

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate route request
 */
export function validateRouteRequest(request: RouteRequest): {
  valid: boolean;
  errors: Array<{ field: string; issue: string }>;
} {
  const errors: Array<{ field: string; issue: string }> = [];

  // TODO: Validate start coordinates
  // - lat: -90 to 90
  // - lng: -180 to 180

  // TODO: Validate end coordinates
  // - lat: -90 to 90
  // - lng: -180 to 180

  // TODO: Validate waypoints (if provided)
  // - Array of valid coordinates
  // - Each waypoint: lat -90 to 90, lng -180 to 180

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate nearby request
 */
export function validateNearbyRequest(request: NearbyRequest): {
  valid: boolean;
  errors: Array<{ field: string; issue: string }>;
} {
  const errors: Array<{ field: string; issue: string }> = [];

  // TODO: Validate coordinates
  // - lat: -90 to 90
  // - lng: -180 to 180

  // TODO: Validate radius
  // - Must be positive number
  // - Must be reasonable (e.g., 1-50000 meters)

  // TODO: Validate category (if provided)
  // - Must be non-empty string
  // - Optional: check against allowed categories

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  // TODO: Validate UUID format
  // - Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  // - Use regex or UUID library

  return false;
}

/**
 * Validate ISO 8601 timestamp
 */
export function isValidISO8601(timestamp: string): boolean {
  // TODO: Validate ISO 8601 timestamp format
  // - Format: YYYY-MM-DDTHH:mm:ss.sssZ
  // - Use Date.parse() or regex

  return false;
}

