import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type {
  VoiceMessagePayload,
  AudioMessage,
  TextMessage,
  StatusMessage,
  ErrorMessage
} from '@take-a-break/types/voice.js';

interface WebSocketConnection {
  sessionId: string;
  userId: string;
  send: (message: VoiceMessagePayload) => void;
  close: () => void;
}

async function voiceRoutes(fastify: FastifyInstance) {
  /**
   * WebSocket /voice/session
   * Real-time voice interaction via WebSocket
   */
  fastify.get('/voice/session', { websocket: true }, (connection, request) => {
    // TODO: Extract and validate Firebase JWT token
    // - From query parameter: ?token=<jwt-token>
    // - Or from Authorization header: Bearer <jwt-token>
    const token = '';

    // TODO: Verify Firebase JWT token
    // - Decode and verify token
    // - Extract user_id
    const userId = '';
    const sessionId = '';

    // TODO: Create session in Firestore
    // - Store session metadata
    // - Set status: connected

    /**
     * Send status message to client
     */
    const sendStatus = (status: 'connected' | 'processing' | 'idle' | 'disconnected', message?: string): void => {
      const statusMessage: StatusMessage = {
        type: 'status',
        timestamp: new Date().toISOString(),
        sessionId,
        status,
        message
      };
      connection.socket.send(JSON.stringify(statusMessage));
    };

    /**
     * Send error message to client
     */
    const sendError = (code: string, message: string): void => {
      const errorMessage: ErrorMessage = {
        type: 'error',
        timestamp: new Date().toISOString(),
        sessionId,
        code,
        message
      };
      connection.socket.send(JSON.stringify(errorMessage));
    };

    /**
     * Send text message to client
     */
    const sendText = (content: string, role: 'user' | 'assistant' = 'assistant'): void => {
      const textMessage: TextMessage = {
        type: 'text',
        timestamp: new Date().toISOString(),
        sessionId,
        content,
        role
      };
      connection.socket.send(JSON.stringify(textMessage));
    };

    // Send initial connection status
    sendStatus('connected', 'Session established');

    /**
     * Handle incoming messages from client
     */
    connection.socket.on('message', async (message: Buffer) => {
      try {
        const payload: VoiceMessagePayload = JSON.parse(message.toString());

        switch (payload.type) {
          case 'audio':
            // TODO: Handle audio message
            // - Decode base64 audio data
            // - Process audio (transcription, etc.)
            // - Call LLM agent with transcription
            // - Send text response back to client
            const audioMessage = payload as AudioMessage;
            // TODO: Process audio
            break;

          case 'text':
            // TODO: Handle text message
            // - Process text message
            // - Call LLM agent
            // - Send response back to client
            const textMessage = payload as TextMessage;
            // TODO: Process text
            break;

          case 'status':
            // TODO: Handle status updates from client
            const statusMessage = payload as StatusMessage;
            // TODO: Update session status
            break;

          default:
            sendError('INVALID_MESSAGE_TYPE', `Unknown message type: ${(payload as any).type}`);
        }
      } catch (error: any) {
        sendError('MESSAGE_PROCESSING_ERROR', error.message || 'Failed to process message');
      }
    });

    /**
     * Handle connection close
     */
    connection.socket.on('close', () => {
      // TODO: Update session in Firestore
      // - Set status: disconnected
      // - Update closed_at timestamp
    });

    /**
     * Handle connection errors
     */
    connection.socket.on('error', (error: Error) => {
      sendError('CONNECTION_ERROR', error.message || 'WebSocket connection error');
    });
  });
}

export default fp(voiceRoutes, {
  name: 'voice-routes'
});

