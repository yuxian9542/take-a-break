/**
 * Voice Service Types
 * 
 * Type definitions for voice chat service integration
 */

export type VoiceConnectionState = 'disconnected' | 'connecting' | 'connected';

/**
 * Client-to-server message types
 */
export interface VoiceClientMessage {
  type: 'audio_chunk' | 'control';
  data?: string; // base64 encoded PCM audio for audio_chunk
  action?: string; // for control messages
  language?: string; // for control messages (zh, en, null)
}

/**
 * Server-to-client message types
 */
export interface VoiceServerMessage {
  type:
    | 'info'
    | 'error'
    | 'speech_started'
    | 'asr_start'
    | 'asr_complete'
    | 'glm_start'
    | 'glm_complete'
    | 'reply_audio_chunk';
  message?: string;
  text?: string;
  data?: string; // base64 encoded audio for reply_audio_chunk
  isLast?: boolean;
}

