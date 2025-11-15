/**
 * Voice Service Package
 * 
 * This package provides voice chat functionality following the map service pattern.
 * 
 * Architecture:
 * - FastAPI backend runs on port 8000 (separate from Fastify API on port 3333)
 * - Mobile app connects directly to FastAPI backend via WebSocket for real-time communication
 * - FastAPI backend handles:
 *   - WebSocket connections (/ws/voice)
 *   - Audio chunk buffering
 *   - VAD (Voice Activity Detection)
 *   - GLM-4-Voice API integration
 *   - Response audio streaming
 * 
 * Note: The voice backend is Python/FastAPI, not TypeScript like the map service.
 * This package serves as documentation and configuration for voice service integration.
 */

// Re-export types for voice service
export type {
  VoiceConnectionState,
  VoiceServerMessage,
  VoiceClientMessage
} from '../types';

/**
 * Voice service configuration
 */
export interface VoiceServiceConfig {
  /**
   * Base URL for voice API backend (FastAPI server)
   * Default: http://localhost:8000
   */
  baseUrl?: string;
  
  /**
   * WebSocket endpoint path
   * Default: /ws/voice
   */
  wsPath?: string;
}

/**
 * Get default voice service configuration
 */
export function getDefaultVoiceConfig(): VoiceServiceConfig {
  return {
    baseUrl: process.env.VOICE_API_BASE_URL || 'http://localhost:8000',
    wsPath: '/ws/voice'
  };
}

/**
 * Voice service health check endpoint
 * GET /health
 */
export const VOICE_HEALTH_ENDPOINT = '/health';

/**
 * Voice WebSocket endpoint
 * WS /ws/voice
 */
export const VOICE_WS_ENDPOINT = '/ws/voice';

