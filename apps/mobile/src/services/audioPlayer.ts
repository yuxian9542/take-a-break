/**
 * Audio Player Service
 * 
 * Handles audio playback for voice chat responses.
 * Plays PCM16 audio chunks received from the backend.
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const SAMPLE_RATE = 16000;

export interface AudioPlayerCallbacks {
  onError?: (error: Error) => void;
}

class AudioPlayer {
  private sound: Audio.Sound | null = null;
  private callbacks: AudioPlayerCallbacks;
  private audioChunks: string[] = [];
  private isPlaying = false;

  constructor(callbacks?: AudioPlayerCallbacks) {
    this.callbacks = callbacks || {};
  }

  /**
   * Initialize audio player
   */
  async initialize(): Promise<void> {
    try {
      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('[AudioPlayer] Failed to initialize:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Add audio chunk to playback queue
   */
  async addAudioChunk(base64Pcm: string): Promise<void> {
    if (!base64Pcm || base64Pcm.length === 0) {
      console.warn('[AudioPlayer] Received empty audio chunk');
      return;
    }

    console.log('[AudioPlayer] Received audio chunk, length:', base64Pcm.length);
    this.audioChunks.push(base64Pcm);

    // If not currently playing, start playing
    if (!this.isPlaying) {
      console.log('[AudioPlayer] Starting playback of queued chunks');
      this.playChunks();
    }
  }

  /**
   * Play all queued audio chunks
   */
  private async playChunks(): Promise<void> {
    if (this.audioChunks.length === 0 || this.isPlaying) {
      return;
    }

    this.isPlaying = true;

    try {
      // Process chunks one by one
      while (this.audioChunks.length > 0) {
        const chunk = this.audioChunks.shift();
        if (!chunk) {
          continue;
        }

        await this.playChunk(chunk);
      }
    } catch (error) {
      console.error('[AudioPlayer] Error playing chunks:', error);
      this.callbacks.onError?.(error as Error);
    } finally {
      this.isPlaying = false;
    }
  }

  /**
   * Play a single PCM16 chunk
   * Note: This is a simplified implementation
   * In production, you might want to decode PCM16 properly
   */
  private async playChunk(base64Pcm: string): Promise<void> {
    try {
      // Convert base64 to buffer
      // Note: React Native doesn't have built-in atob/btoa, so we'll use
      // a polyfill or convert differently
      const binaryString = this.base64ToBinary(base64Pcm);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 bytes to WAV format
      const wavBytes = this.pcm16ToWav(bytes.buffer);

      // Create a temporary URI for the WAV file
      const uri = await this.saveWavToFile(wavBytes);

      // Load and play
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      // Wait for playback to complete
      await new Promise((resolve, reject) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            resolve(undefined);
          }
        });
        sound.setProgressUpdateIntervalAsync(100);
      });

      // Cleanup
      await sound.unloadAsync();
    } catch (error) {
      console.error('[AudioPlayer] Error playing chunk:', error);
      // Continue with next chunk even if one fails
    }
  }

  /**
   * Convert base64 to binary string
   * React Native compatible implementation
   */
  private base64ToBinary(base64: string): string {
    try {
      // Try atob if available (some React Native environments have it)
      if (typeof atob !== 'undefined') {
        return atob(base64);
      }
      
      // Manual base64 decoding for React Native
      const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let binary = '';
      let i = 0;
      
      // Remove padding
      base64 = base64.replace(/[^A-Za-z0-9+/]/g, '');
      
      while (i < base64.length) {
        const encoded1 = base64Chars.indexOf(base64.charAt(i++));
        const encoded2 = base64Chars.indexOf(base64.charAt(i++));
        const encoded3 = base64Chars.indexOf(base64.charAt(i++));
        const encoded4 = base64Chars.indexOf(base64.charAt(i++));
        
        const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
        
        binary += String.fromCharCode((bitmap >> 16) & 255);
        if (encoded3 !== 64) binary += String.fromCharCode((bitmap >> 8) & 255);
        if (encoded4 !== 64) binary += String.fromCharCode(bitmap & 255);
      }
      
      return binary;
    } catch (error) {
      console.error('[AudioPlayer] Base64 decode error:', error);
      throw new Error('Failed to decode base64 audio');
    }
  }

  /**
   * Convert PCM16 bytes to WAV format
   */
  private pcm16ToWav(pcmBuffer: ArrayBuffer): ArrayBuffer {
    const pcmData = new Int16Array(pcmBuffer);
    const sampleRate = SAMPLE_RATE;
    const numChannels = 1;
    const bitsPerSample = 16;

    const wavHeaderSize = 44;
    const dataSize = pcmData.length * 2; // 2 bytes per sample
    const fileSize = wavHeaderSize + dataSize;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // Write WAV header
    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    this.writeString(view, 8, 'WAVE');

    // Format chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true); // byte rate
    view.setUint16(32, numChannels * bitsPerSample / 8, true); // block align
    view.setUint16(34, bitsPerSample, true);

    // Data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Copy PCM data
    const pcmBytes = new Uint8Array(pcmBuffer);
    const wavBytes = new Uint8Array(buffer);
    wavBytes.set(pcmBytes, wavHeaderSize);

    return buffer;
  }

  /**
   * Write string to DataView
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Save WAV bytes to temporary file
   */
  private async saveWavToFile(wavBytes: ArrayBuffer): Promise<string> {
    const bytes = new Uint8Array(wavBytes);
    const base64 = this.arrayBufferToBase64(bytes);
    
    const fileName = `temp_audio_${Date.now()}.wav`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    
    // Use string encoding - expo-file-system accepts 'base64' as a string value
    // Note: FileSystem.EncodingType.Base64 enum may not be available in all versions
    // so we use the string literal 'base64' directly
    try {
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: 'base64' as any,
      });
    } catch (error) {
      // Fallback: try without explicit encoding (may default to base64)
      await FileSystem.writeAsStringAsync(fileUri, base64);
    }

    return fileUri;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    // For React Native, we might need a polyfill
    // For now, use a simple approach
    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  /**
   * Stop playback and clear queue
   */
  async stop(): Promise<void> {
    this.audioChunks = [];
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
    this.isPlaying = false;
  }

  /**
   * Check if currently playing
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export default AudioPlayer;

