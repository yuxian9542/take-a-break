/**
 * WebSocket connection parameters for /voice/session
 */
export interface VoiceSessionRequest {
  sessionId?: string; // Optional session ID for reconnection
}

/**
 * Voice message types for WebSocket communication
 */
export type VoiceMessageType = 'audio' | 'text' | 'status' | 'error';

/**
 * Base voice message structure
 */
export interface VoiceMessage {
  type: VoiceMessageType;
  timestamp: string; // ISO 8601
  sessionId: string;
}

/**
 * Audio message payload
 */
export interface AudioMessage extends VoiceMessage {
  type: 'audio';
  data: string; // Base64 encoded audio data
  format: string; // e.g., 'pcm', 'wav', 'mp3'
}

/**
 * Text message payload (transcription or LLM response)
 */
export interface TextMessage extends VoiceMessage {
  type: 'text';
  content: string;
  role?: 'user' | 'assistant';
}

/**
 * Status message (connection, processing, etc.)
 */
export interface StatusMessage extends VoiceMessage {
  type: 'status';
  status: 'connected' | 'processing' | 'idle' | 'disconnected';
  message?: string;
}

/**
 * Error message
 */
export interface ErrorMessage extends VoiceMessage {
  type: 'error';
  code: string;
  message: string;
}

/**
 * Union type for all voice messages
 */
export type VoiceMessagePayload = AudioMessage | TextMessage | StatusMessage | ErrorMessage;

