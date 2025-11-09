import type { SuccessResponse } from './error.js';

/**
 * Health check data
 */
export interface HealthData {
  status: 'ok';
  timestamp: string;
  environment: string;
}

/**
 * Health check response using unified format
 */
export type HealthResponse = SuccessResponse<HealthData>;

/**
 * Meta config data
 */
export interface MetaConfigData {
  environment: string;
  features: string[];
  firebase?: {
    projectId?: string;
    storageBucket?: string;
  };
}

/**
 * Meta config response using unified format
 */
export type MetaConfigResponse = SuccessResponse<MetaConfigData>;
