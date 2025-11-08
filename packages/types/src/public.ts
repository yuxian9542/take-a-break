export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  environment: string;
}

export interface MetaConfigResponse {
  environment: string;
  features: string[];
  firebase?: {
    projectId?: string;
    storageBucket?: string;
  };
}
