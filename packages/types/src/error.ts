/**
 * Field-level error detail
 */
export interface ErrorDetail {
  field: string;
  issue: string;
}

/**
 * Standardized error response structure
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: ErrorDetail[];
    timestamp: string;
    trace_id: string;
  };
}

/**
 * Standardized success response structure
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    cursor?: string;
    hasMore?: boolean;
  };
}


