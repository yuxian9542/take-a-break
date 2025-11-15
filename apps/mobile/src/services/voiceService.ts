/**
 * Voice Service
 * 
 * Provides voice chat functionality for the mobile app.
 * Connects to FastAPI backend via WebSocket for real-time voice interaction.
 */

// Voice WebSocket message types
export interface VoiceClientMessage {
  type: 'audio_chunk' | 'control';
  data?: string; // base64 encoded PCM audio for audio_chunk
  action?: string; // for control messages
  language?: string; // for control messages
}

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

export type VoiceConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface VoiceServiceCallbacks {
  onConnectionChange?: (state: VoiceConnectionState) => void;
  onMessage?: (message: VoiceServerMessage) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_SAMPLE_RATE = 16000; // Hz
const DEFAULT_VOICE_PORT = 8000;

class VoiceService {
  private ws: WebSocket | null = null;
  private connectionState: VoiceConnectionState = 'disconnected';
  private callbacks: VoiceServiceCallbacks = {};
  private voiceApiUrl: string;

  constructor(callbacks?: VoiceServiceCallbacks) {
    this.callbacks = callbacks || {};
    this.voiceApiUrl = this.resolveVoiceApiUrl();
  }

  /**
   * Connect to voice WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
        // Wait for connection
        this.ws.addEventListener('open', () => resolve(), { once: true });
        this.ws.addEventListener('error', (e) => reject(e), { once: true });
        return;
      }

      this.setConnectionState('connecting');
      
      // Convert HTTP/HTTPS URL to WS/WSS for WebSocket
      // Use URL constructor to properly handle path construction
      const baseUrl = new URL(this.voiceApiUrl);
      const wsProtocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      // Construct WebSocket URL properly
      const wsUrlString = `${wsProtocol}//${baseUrl.hostname}:${baseUrl.port || (wsProtocol === 'wss:' ? '443' : '80')}/ws/voice`;
      
      console.log('[VoiceService] Connecting to:', wsUrlString);
      console.log('[VoiceService] Voice API base URL:', this.voiceApiUrl);
      
      try {
        this.ws = new WebSocket(wsUrlString);

        this.ws.addEventListener('open', () => {
          console.log('[VoiceService] Connected');
          this.setConnectionState('connected');
          resolve();
        });

        this.ws.addEventListener('close', (event) => {
          console.log('[VoiceService] WebSocket closed - code:', event.code, 'reason:', event.reason || 'none', 'wasClean:', event.wasClean);
          this.setConnectionState('disconnected');
          this.ws = null;
          // Only trigger error callback if it was an unexpected close (not normal closure)
          if (event.code !== 1000 && event.code !== 1001) {
            // 1000 = Normal Closure, 1001 = Going Away (normal)
            // Other codes indicate errors
            console.warn('[VoiceService] Unexpected WebSocket close:', event.code, event.reason);
            const error = new Error(`WebSocket closed unexpectedly: ${event.code} ${event.reason || ''}`);
            this.callbacks.onError?.(error);
          } else {
            console.log('[VoiceService] WebSocket closed normally');
          }
        });

        this.ws.addEventListener('error', (event) => {
          console.error('[VoiceService] WebSocket error:', event);
          const error = new Error('WebSocket connection failed');
          this.callbacks.onError?.(error);
          this.setConnectionState('disconnected');
          reject(error);
        });

        this.ws.addEventListener('message', (event) => {
          try {
            const message = JSON.parse(event.data) as VoiceServerMessage;
            console.log('[VoiceService] Received message:', message.type);
            this.callbacks.onMessage?.(message);
          } catch (error) {
            console.error('[VoiceService] Failed to parse message:', error);
            this.callbacks.onError?.(error as Error);
          }
        });
      } catch (error) {
        this.setConnectionState('disconnected');
        reject(error);
      }
    });
  }

  /**
   * Disconnect from voice WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionState('disconnected');
  }

  /**
   * Send audio chunk to server
   */
  sendAudioChunk(base64Audio: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[VoiceService] Cannot send audio: WebSocket not connected');
      return;
    }

    const message: VoiceClientMessage = {
      type: 'audio_chunk',
      data: base64Audio
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[VoiceService] Failed to send audio chunk:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Send control message (e.g., set language)
   */
  sendControl(action: string, params?: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[VoiceService] Cannot send control: WebSocket not connected');
      return;
    }

    const message: VoiceClientMessage = {
      type: 'control',
      action,
      ...params
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[VoiceService] Failed to send control message:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Set language for the voice session
   */
  setLanguage(language: 'zh' | 'en' | null): void {
    this.sendControl('set_language', { language });
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): VoiceConnectionState {
    return this.connectionState;
  }

  /**
   * Update connection state and notify callbacks
   */
  private setConnectionState(state: VoiceConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.callbacks.onConnectionChange?.(state);
    }
  }

  /**
   * Resolve voice API base URL
   * Defaults to same host as main API but different port (8000)
   * 
   * Note: Voice backend is a separate FastAPI server running on port 8000
   * Main API server (Fastify) runs on port 3333
   */
  private resolveVoiceApiUrl(): string {
    // Try to get from environment variable first
    const explicit = process.env.EXPO_PUBLIC_VOICE_API_BASE_URL;
    if (explicit) {
      console.log('[VoiceService] Using explicit voice API URL:', explicit);
      // Remove trailing slash and any double slashes
      return explicit.replace(/\/+$/, '').replace(/([^:]\/)\/+/g, '$1');
    }

    // Fallback to same host as main API but port 8000 (voice backend port)
    const mainApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.4.98:3333';
    const url = new URL(mainApiUrl);
    url.port = String(DEFAULT_VOICE_PORT); // Port 8000 for FastAPI voice backend
    
    // Ensure no trailing slash
    const baseUrl = url.toString().replace(/\/+$/, '');
    console.log('[VoiceService] Resolved voice API URL:', baseUrl);
    return baseUrl;
  }
}

// Export singleton instance
export const voiceService = new VoiceService();

// Export factory function for creating instances with callbacks
export function createVoiceService(callbacks?: VoiceServiceCallbacks): VoiceService {
  return new VoiceService(callbacks);
}

