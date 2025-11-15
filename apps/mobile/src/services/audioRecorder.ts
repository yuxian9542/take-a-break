/**
 * Audio Recorder Service for React Native
 * 
 * Handles audio recording for voice chat.
 * 
 * ARCHITECTURE:
 * ============
 * 
 * Input Flow:
 * 1. Client sends continuous PCM16 audio chunks (~20ms each) via WebSocket
 * 2. Backend buffers chunks in state.pcm_buffer
 * 3. VAD (Voice Activity Detection) analyzes each chunk:
 *    - Detects when speech starts
 *    - Detects when speech ends (500ms silence)
 * 4. When VAD detects end of utterance:
 *    - Backend concatenates ALL buffered chunks into ONE complete utterance
 *    - Sends complete utterance as SINGLE request to GLM (GLM only accepts single input)
 *    - Backend signals 'asr_start' to stop client from sending more chunks
 *    - Clears buffer for next utterance
 * 
 * Output Flow:
 * - GLM streams response back in chunks (GLM supports stream output)
 * - Backend forwards audio chunks to client via WebSocket
 * 
 * Key Point: The "streaming input" is actually buffering on the backend.
 * Client continuously sends chunks, but GLM receives ONE complete utterance.
 * 
 * PRODUCTION READINESS:
 * ====================
 * 
 * Current Implementation: TEST MODE (Expo Go compatible)
 * - Uses generated test audio (sine wave) to test WebSocket/VAD/playback flow
 * - Works in Expo Go without native modules
 * - NOT using real voice input
 * 
 * For Production: REAL RECORDING MODE
 * - Requires development build (not Expo Go) to use native modules
 * - Options:
 *   1. Use react-native-audio-recorder-player with onProgress callback for real-time PCM
 *   2. Use custom native module wrapping AVAudioRecorder (iOS) / AudioRecord (Android)
 *   3. Periodically read M4A file and convert to PCM16 (adds ~100-200ms latency)
 * 
 * To switch to production mode:
 * 1. Install: npm install react-native-audio-recorder-player
 * 2. Replace TestPcmGenerator with RealPcmGenerator (see implementation below)
 * 3. Build development build: eas build --profile development --platform ios
 * 
 * React Native Limitation:
 * - expo-av doesn't provide real-time PCM access (records to file only)
 * - Native iOS/Android apps can use AVAudioRecorder/AudioRecord for real-time PCM
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const SAMPLE_RATE = 16000;
const CHANNELS = 1;
const SAMPLE_WIDTH = 2; // 16-bit PCM = 2 bytes per sample
const CHUNK_DURATION_MS = 20; // Match backend expectation (~20ms chunks)
const FRAME_SIZE = Math.floor((SAMPLE_RATE * CHUNK_DURATION_MS) / 1000) * SAMPLE_WIDTH; // Bytes per chunk

export interface AudioRecorderCallbacks {
  onChunk: (base64Chunk: string) => void;
  onError?: (error: Error) => void;
}

/**
 * PCM Generator Interface
 * 
 * Abstract interface for generating PCM16 audio chunks.
 * 
 * Current implementation: TestPcmGenerator (test mode, Expo Go compatible)
 * File mode: FileBasedPcmGenerator (real audio from file, Expo Go compatible)
 * Production implementation: RealPcmGenerator (requires native module, development build)
 */
interface PcmGenerator {
  start(): void | Promise<void>;
  stop(): void;
  isActive(): boolean;
}

/**
 * TEST MODE: Test PCM Generator
 * 
 * Generates test audio (sine wave) for testing WebSocket/VAD/playback flow.
 * Works in Expo Go without native modules.
 * 
 * PRODUCTION NOTE: Replace this with RealPcmGenerator when ready for production.
 */
class TestPcmGenerator implements PcmGenerator {
  private intervalId: NodeJS.Timeout | null = null;
  private chunkCounter = 0;
  private startTime: number = 0;
  private isSendingSilence = false;
  private silenceChunkCount = 0;
  private readonly MAX_TEST_DURATION_MS = 5000;
  private readonly MIN_SILENCE_CHUNKS = 25;
  private readonly TARGET_SILENCE_CHUNKS = 30;

  constructor(
    private onChunk: (base64Chunk: string) => void,
    private shouldStopCallback: () => boolean
  ) {}

  start(): void {
    this.startTime = Date.now();
    this.chunkCounter = 0;
    this.silenceChunkCount = 0;
    this.isSendingSilence = false;
    
    this.intervalId = setInterval(() => {
      if (this.shouldStopCallback()) {
        return;
      }

      const elapsed = Date.now() - this.startTime;

      // Switch to silence after test duration
      if (!this.isSendingSilence && elapsed > this.MAX_TEST_DURATION_MS) {
        console.log(`[TestPcmGenerator] Test audio duration (${elapsed}ms) exceeded, sending silence to trigger VAD`);
        this.isSendingSilence = true;
        this.silenceChunkCount = 0;
        this.startTime = Date.now();
      }

      if (this.isSendingSilence) {
        // Send silence chunks for VAD
        const samplesPerChunk = Math.floor((SAMPLE_RATE * CHUNK_DURATION_MS) / 1000);
        const silentPcm16 = new Int16Array(samplesPerChunk).fill(0);
        const base64Chunk = this.arrayBufferToBase64(silentPcm16.buffer);
        this.onChunk(base64Chunk);
        this.silenceChunkCount++;

        // Log progress
        if (this.silenceChunkCount % 5 === 0) {
          const silenceDuration = Date.now() - this.startTime;
          console.log(`[TestPcmGenerator] Sent ${this.silenceChunkCount} silence chunks (${silenceDuration}ms)`);
        }

        // Stop after sending enough silence chunks
        if (this.silenceChunkCount >= this.TARGET_SILENCE_CHUNKS) {
          const silenceDuration = Date.now() - this.startTime;
          console.log(`[TestPcmGenerator] Sent ${this.silenceChunkCount} silence chunks (${silenceDuration}ms), stopping`);
          if (this.intervalId) {
            setTimeout(() => {
              if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
              }
            }, 50);
          }
          return;
        }
        return;
      }

      // Send test audio (sine wave)
      const samplesPerChunk = Math.floor((SAMPLE_RATE * CHUNK_DURATION_MS) / 1000);
      const testPcm16 = new Int16Array(samplesPerChunk);
      const frequency = 440; // A4 note
      const amplitude = 1000; // Above VAD threshold (500)
      const phaseIncrement = (2 * Math.PI * frequency) / SAMPLE_RATE;

      for (let i = 0; i < samplesPerChunk; i++) {
        const sample = Math.sin(phaseIncrement * (this.chunkCounter * samplesPerChunk + i)) * amplitude;
        testPcm16[i] = Math.round(sample);
      }

      this.chunkCounter++;
      const base64Chunk = this.arrayBufferToBase64(testPcm16.buffer);
      this.onChunk(base64Chunk);
    }, CHUNK_DURATION_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isActive(): boolean {
    return this.intervalId !== null;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 8192;
    let binary = '';

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }

    if (typeof btoa !== 'undefined') {
      try {
        return btoa(binary);
      } catch (e) {
        // Fallback to manual encoding
      }
    }

    // Manual base64 encoding
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    while (i < binary.length) {
      const a = binary.charCodeAt(i++);
      const b = i < binary.length ? binary.charCodeAt(i++) : 0;
      const c = i < binary.length ? binary.charCodeAt(i++) : 0;

      const bitmap = (a << 16) | (b << 8) | c;

      result += base64Chars.charAt((bitmap >> 18) & 63);
      result += base64Chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < binary.length ? base64Chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < binary.length ? base64Chars.charAt(bitmap & 63) : '=';
    }

    return result;
  }
}

/**
 * EXPO GO MODE: File-based PCM Generator
 * 
 * Records audio using expo-av (M4A format) and extracts PCM16 chunks by:
 * 1. Recording continuously to file
 * 2. Periodically reading the file
 * 3. Extracting new audio data
 * 4. Converting M4A → PCM16 (or sending M4A to backend for conversion)
 * 
 * Note: M4A decoding in JavaScript is complex. This implementation uses a
 * segment-based approach: record in short segments, read each segment.
 * 
 * Limitations:
 * - Adds ~100-200ms latency due to file I/O
 * - Requires periodic file reading and processing
 * - May have audio gaps between segments
 * 
 * TODO: Implement proper M4A → PCM16 decoder, or modify backend to accept M4A chunks
 */
class FileBasedPcmGenerator implements PcmGenerator {
  private intervalId: NodeJS.Timeout | null = null;
  private _isActive = false; // Renamed to avoid conflict with isActive() method
  private lastFileSize = 0;
  private segmentCounter = 0;
  private readonly SEGMENT_DURATION_MS = 200; // Read file every 200ms

  constructor(
    private onChunk: (base64Chunk: string) => void,
    private shouldStopCallback: () => boolean,
    private recordingRef: () => Audio.Recording | null // Function to get current recording
  ) {}

  async start(): Promise<void> {
    this._isActive = true;
    this.lastFileSize = 0;
    this.segmentCounter = 0;

    // Wait a bit for recording to start and file to be created
    await new Promise(resolve => setTimeout(resolve, 300));

    // Periodically read file and extract chunks
    this.intervalId = setInterval(async () => {
      // Check if we should stop - exit immediately
      if (!this._isActive || this.shouldStopCallback()) {
        // If we're not active, clear the interval
        if (!this._isActive && this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
        return;
      }

      try {
        await this.processRecordingFile();
      } catch (error) {
        console.error('[FileBasedPcmGenerator] Error processing file:', error);
      }
    }, this.SEGMENT_DURATION_MS);
  }

  stop(): void {
    console.log('[FileBasedPcmGenerator] Stopping...');
    this._isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[FileBasedPcmGenerator] Interval cleared');
    }
    // Reset state
    this.lastFileSize = 0;
    this.segmentCounter = 0;
  }

  isActive(): boolean {
    return this._isActive && this.intervalId !== null;
  }

  /**
   * Process recording file and extract new audio chunks
   */
  private async processRecordingFile(): Promise<void> {
    // Early exit if not active or should stop
    if (!this._isActive || this.shouldStopCallback()) {
      return;
    }

    const recording = this.recordingRef();
    if (!recording) {
      return;
    }

    try {
      // Get recording status to check if still recording
      const status = await recording.getStatusAsync();
      if (!status.isRecording) {
        return;
      }

      // Get file URI
      const uri = recording.getURI();
      if (!uri) {
        return;
      }

      // Read file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || fileInfo.size === null) {
        return;
      }

      // Check if file has grown (new audio recorded)
      if (fileInfo.size <= this.lastFileSize) {
        return; // No new audio
      }

      // Read file content (only the new portion to avoid reading entire file each time)
      // Note: FileSystem.readAsStringAsync doesn't support reading from offset,
      // so we read the whole file and extract new portion
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });

      // Decode base64 to bytes
      const allBytes = this.base64ToBytes(fileContent);
      
      // Determine file format from URI
      const isWav = uri.endsWith('.wav');
      
      if (isWav) {
        // WAV format (iOS LINEARPCM): Extract PCM16 data
        // WAV header is 44 bytes, PCM16 data starts at offset 44
        const WAV_HEADER_SIZE = 44;
        
        // Ensure we have at least the header
        if (allBytes.length < WAV_HEADER_SIZE) {
          return;
        }
        
        // Initialize lastFileSize to WAV_HEADER_SIZE if this is the first read
        if (this.lastFileSize === 0) {
          this.lastFileSize = WAV_HEADER_SIZE;
          console.log(`[FileBasedPcmGenerator] First read: Initialized lastFileSize to WAV header size (${WAV_HEADER_SIZE})`);
          return; // Don't process on first read, wait for actual PCM data
        }
        
        // Calculate previous and new PCM sizes (excluding header)
        const previousPcmBytes = this.lastFileSize - WAV_HEADER_SIZE;
        const newPcmBytes = allBytes.length - WAV_HEADER_SIZE;
        
        // Calculate how many new PCM bytes we have
        const newPcm16DataSize = newPcmBytes - previousPcmBytes;
        
        if (newPcm16DataSize > 0) {
          // Extract new PCM16 data (skip WAV header, start from where we left off)
          const startOffset = WAV_HEADER_SIZE + previousPcmBytes;
          const endOffset = WAV_HEADER_SIZE + newPcmBytes;
          const newPcm16Data = allBytes.slice(startOffset, endOffset);
          
          console.log(`[FileBasedPcmGenerator] WAV: file=${fileInfo.size}B last=${this.lastFileSize}B new=${newPcm16DataSize}B chunks=${Math.floor(newPcm16Data.length / 640)}`);
          
          // Split into 20ms chunks and send
          const chunkSize = Math.floor((SAMPLE_RATE * CHUNK_DURATION_MS) / 1000) * 2; // 2 bytes per sample = 640 bytes for 20ms at 16kHz
          
          let chunksSent = 0;
          let silenceSkipped = 0;
          for (let offset = 0; offset < newPcm16Data.length; offset += chunkSize) {
            if (offset + chunkSize > newPcm16Data.length) {
              // Last chunk might be incomplete, skip it
              break;
            }
            
            const chunk = newPcm16Data.slice(offset, offset + chunkSize);
            
            // Convert bytes to Int16Array to check if it's actual audio (not silence)
            // Note: We need to create a proper buffer for Int16Array
            const int16View = new Int16Array(chunk.length / 2);
            for (let i = 0; i < int16View.length; i++) {
              // Little-endian: lower byte first, then upper byte
              int16View[i] = chunk[i * 2] | (chunk[i * 2 + 1] << 8);
            }
            
            // Calculate max amplitude to check if this is silence or real audio
            const maxAmplitude = Math.max(...Array.from(int16View).map(Math.abs));
            
            // Only send chunks with actual audio data (above noise floor)
            // VAD threshold is 500, so we use a lower threshold (100) to filter out pure silence
            // Also check if we should stop sending (backend processing utterance or stopped)
            if (maxAmplitude > 100 && !this.shouldStopCallback() && this._isActive) {
              // Double-check before sending (race condition protection)
              if (!this._isActive || this.shouldStopCallback()) {
                return; // Exit immediately if stopped
              }
              // Has actual audio data above noise floor
              const base64Chunk = this.bytesToBase64(chunk);
              this.onChunk(base64Chunk);
              chunksSent++;
            } else {
              // Skip silence chunks or chunks when we should stop sending
              if (maxAmplitude <= 100) {
                silenceSkipped++;
                if (silenceSkipped % 10 === 0) {
                  console.log(`[FileBasedPcmGenerator] Skipped ${silenceSkipped} silence chunks (max_amp=${maxAmplitude})`);
                }
              }
              // If shouldStopCallback is true, we're not sending (backend processing)
            }
          }
          
          if (chunksSent > 0) {
            console.log(`[FileBasedPcmGenerator] Sent ${chunksSent} audio chunks`);
          }
        } else {
          console.log(`[FileBasedPcmGenerator] No new PCM data: previous=${previousPcmBytes} new=${newPcmBytes}`);
        }
      } else {
        // M4A format (Android): More complex, needs decoding
        // For now, DO NOT send placeholder chunks - they cause backend to process silence as speech
        // TODO: Implement M4A → PCM16 decoder or modify backend to accept M4A
        console.warn('[FileBasedPcmGenerator] M4A format detected. Decoding not yet implemented.');
        console.warn('[FileBasedPcmGenerator] Skipping M4A chunks - no decoder available.');
        // Do NOT send placeholder chunks - this causes the "Thanks for watching!" issue
        // The backend processes silence as speech when it receives these placeholder chunks
      }
      
      this.lastFileSize = fileInfo.size;
      this.segmentCounter++;

    } catch (error) {
      console.error('[FileBasedPcmGenerator] Error processing file:', error);
    }
  }

  /**
   * Convert base64 string to Uint8Array bytes
   */
  private base64ToBytes(base64: string): Uint8Array {
    const binary = this.base64ToBinary(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Convert base64 to binary string
   */
  private base64ToBinary(base64: string): string {
    try {
      if (typeof atob !== 'undefined') {
        return atob(base64);
      }
    } catch (e) {
      // Fallback
    }

    // Manual base64 decoding
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let binary = '';
    let i = 0;
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
  }

  /**
   * Convert bytes to base64
   */
  private bytesToBase64(bytes: Uint8Array): string {
    return this.arrayBufferToBase64(bytes.buffer);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 8192;
    let binary = '';

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }

    if (typeof btoa !== 'undefined') {
      try {
        return btoa(binary);
      } catch (e) {
        // Fallback
      }
    }

    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    while (i < binary.length) {
      const a = binary.charCodeAt(i++);
      const b = i < binary.length ? binary.charCodeAt(i++) : 0;
      const c = i < binary.length ? binary.charCodeAt(i++) : 0;
      const bitmap = (a << 16) | (b << 8) | c;
      result += base64Chars.charAt((bitmap >> 18) & 63);
      result += base64Chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < binary.length ? base64Chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < binary.length ? base64Chars.charAt(bitmap & 63) : '=';
    }
    return result;
  }
}

/**
 * PRODUCTION MODE: Real PCM Generator (Placeholder)
 * 
 * For development builds with native modules, use:
 * - react-native-audio-recorder-player
 * - Custom native module wrapping AVAudioRecorder
 * - Provides real-time PCM16 callbacks
 * 
 * See comments in TestPcmGenerator above for implementation examples.
 */

class AudioRecorder {
  private recording: Audio.Recording | null = null;
  private callbacks: AudioRecorderCallbacks;
  private shouldStopSending = false;
  private isActive = false;
  private isStarting = false; // Prevent concurrent start() calls
  
  // PCM Generator: Abstract interface for PCM chunk generation
  // TEST MODE: Uses TestPcmGenerator (test audio, Expo Go compatible)
  // FILE MODE: Uses FileBasedPcmGenerator (real audio from file, Expo Go compatible, iOS WAV works)
  // PRODUCTION: Replace with RealPcmGenerator (real-time PCM, requires native module)
  private pcmGenerator: PcmGenerator;
  private useFileBasedMode: boolean;

  constructor(callbacks: AudioRecorderCallbacks, useFileBased: boolean = false) {
    this.callbacks = callbacks;
    this.useFileBasedMode = useFileBased;
    
    if (useFileBased) {
      // FILE MODE: Read audio from file (works in Expo Go)
      // iOS: WAV format (PCM16) - direct extraction
      // Android: M4A format - needs decoder (not yet implemented)
      this.pcmGenerator = new FileBasedPcmGenerator(
        (base64Chunk) => callbacks.onChunk(base64Chunk),
        () => this.shouldStopSending,
        () => this.recording // Function to get current recording
      );
    } else {
      // TEST MODE: Generate test audio (works in Expo Go, good for testing)
      this.pcmGenerator = new TestPcmGenerator(
        (base64Chunk) => callbacks.onChunk(base64Chunk),
        () => this.shouldStopSending
      );
    }
  }

  /**
   * Start recording audio and sending chunks continuously
   * 
   * Note: This implementation records continuously and attempts to extract chunks.
   * For proper real-time PCM access, a native module would be needed.
   */
  async start(): Promise<void> {
    // Prevent concurrent start() calls
    if (this.isStarting) {
      console.warn('[AudioRecorder] Already starting, ignoring duplicate start() call');
      return;
    }

    if (this.isActive && this.recording) {
      console.warn('[AudioRecorder] Already recording, ignoring start() call');
      return;
    }

    this.isStarting = true;

    try {
      // Clean up any existing recording first
      if (this.recording) {
        try {
          console.log('[AudioRecorder] Cleaning up existing recording...');
          const status = await this.recording.getStatusAsync();
          if (status.isRecording) {
            console.log('[AudioRecorder] Stopping active recording...');
            await this.recording.stopAndUnloadAsync();
          } else {
            console.log('[AudioRecorder] Unloading prepared recording...');
            await this.recording.unloadAsync();
          }
          console.log('[AudioRecorder] Existing recording cleaned up');
        } catch (e) {
          console.warn('[AudioRecorder] Error cleaning up existing recording:', e);
          // Try multiple cleanup strategies
          try {
            // Try stopAndUnload first (handles both recording and prepared states)
            await this.recording.stopAndUnloadAsync();
          } catch (e2) {
            try {
              // Fallback to just unload
              await this.recording.unloadAsync();
            } catch (e3) {
              // Last resort: just reset the reference
              console.warn('[AudioRecorder] Could not unload recording, resetting reference:', e3);
            }
          }
        }
        this.recording = null;
        // Wait a bit longer to ensure expo-av has fully released the recording
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Stop PCM generator if it's running
      if (this.pcmGenerator.isActive()) {
        this.pcmGenerator.stop();
      }

      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio recording permission denied');
      }

      // Configure audio mode for recording BEFORE creating recording
      // NOTE: Input source selection (AirPods/headphones) is handled automatically by the OS:
      // - iOS: Automatically uses AirPods/Bluetooth headphones when connected
      // - Android: System defaults apply
      // For more control (requires native build):
      // - iOS: Use AVAudioSession to configure preferred input port
      // - Android: Use AudioRecord with AudioDeviceInfo API
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false, // Use speaker/headphones, not earpiece
      });

      this.shouldStopSending = false;
      this.isActive = false; // Set to true only after recording is successfully created

      // Create recording configuration
      // EXPO GO: Use LINEARPCM on iOS (easier to decode to PCM16)
      // Android: Use AAC/M4A (may need backend conversion)
      // Note: LINEARPCM on iOS gives us raw PCM16, which we can read directly
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: SAMPLE_RATE,
          numberOfChannels: CHANNELS,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: SAMPLE_RATE, // Try 16kHz - iOS may support it with LINEARPCM
          numberOfChannels: CHANNELS,
          linearPCMBitDepth: 16, // 16-bit PCM
          linearPCMIsBigEndian: false, // Little endian
          linearPCMIsFloat: false, // Integer PCM (not float)
        },
      };

      // Add a delay to ensure audio mode is fully set and any previous recording is fully released
      await new Promise(resolve => setTimeout(resolve, 300));

      // Start a single continuous recording
      // Note: createAsync both prepares and starts the recording
      // For now, we don't use the status callback as it might cause issues
      // and expo-av doesn't provide real-time PCM access anyway
      const { recording } = await Audio.Recording.createAsync(
        recordingOptions
      );

      // Verify recording was created successfully
      if (!recording) {
        throw new Error('Failed to create recording instance');
      }

      this.recording = recording;
      this.isActive = true;
      this.shouldStopSending = false;

      console.log('[AudioRecorder] Started continuous recording');
      
      if (this.useFileBasedMode) {
        console.log('[AudioRecorder] FILE MODE: Using FileBasedPcmGenerator (real audio from file)');
        console.log('[AudioRecorder] iOS: WAV format - PCM16 extraction supported');
        console.log('[AudioRecorder] Android: M4A format - decoder not yet implemented (sends placeholder)');
      } else {
        console.warn('[AudioRecorder] TEST MODE: Using TestPcmGenerator (test audio, not real voice)');
      }
      
      // Start PCM generator
      // FileBasedPcmGenerator.start() is async, TestPcmGenerator.start() is sync
      if (this.pcmGenerator instanceof FileBasedPcmGenerator) {
        await (this.pcmGenerator as FileBasedPcmGenerator).start();
      } else {
        this.pcmGenerator.start();
      }
      
    } catch (error) {
      console.error('[AudioRecorder] Failed to start recording:', error);
      this.isActive = false;
      this.recording = null;
      this.isStarting = false; // Reset flag on error
      this.callbacks.onError?.(error as Error);
      throw error;
    } finally {
      // Always reset isStarting flag
      this.isStarting = false;
    }
  }

  /**
   * Stop sending audio chunks (called when backend signals ASR start)
   * 
   * This tells the backend "I'm done sending chunks for this utterance"
   * Backend will then process the buffered chunks as one complete utterance.
   */
  stopSending(): void {
    this.shouldStopSending = true;
    // PCM generator will check shouldStopCallback and stop accordingly
    console.log('[AudioRecorder] Stopped sending chunks (backend processing utterance)');
  }

  /**
   * Resume sending audio chunks (called after GLM response completes)
   * 
   * Ready for next utterance - start sending chunks again.
   */
  resumeSending(): void {
    this.shouldStopSending = false;
    console.log('[AudioRecorder] Resumed sending chunks (ready for next utterance)');
    // Restart PCM generator if it was stopped and we're still active
    if (!this.pcmGenerator.isActive() && this.isActive) {
      this.pcmGenerator.start();
    }
  }

  /**
   * Stop recording completely
   */
  async stop(): Promise<string | null> {
    // Prevent concurrent operations
    if (this.isStarting) {
      console.warn('[AudioRecorder] Cannot stop while starting, waiting...');
      // Wait a bit for start to complete or fail
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Set stop flags first to prevent any new chunks from being sent
    this.shouldStopSending = true;
    this.isActive = false;
    this.isStarting = false; // Reset starting flag
    
    // Stop PCM generator - this will clear the interval
    if (this.pcmGenerator.isActive()) {
      console.log('[AudioRecorder] Stopping PCM generator...');
      this.pcmGenerator.stop();
    }

    if (!this.recording) {
      console.log('[AudioRecorder] No recording to stop');
      return null;
    }

    try {
      console.log('[AudioRecorder] Stopping recording...');
      const uri = this.recording.getURI();
      
      try {
        const status = await this.recording.getStatusAsync();
        
        if (status.isRecording) {
          await this.recording.stopAndUnloadAsync();
        } else {
          // Recording was already stopped, just unload
          await this.recording.unloadAsync();
        }
      } catch (e) {
        console.warn('[AudioRecorder] Error during stop/unload, trying fallback cleanup:', e);
        // Try multiple cleanup strategies
        try {
          await this.recording.stopAndUnloadAsync();
        } catch (e2) {
          try {
            await this.recording.unloadAsync();
          } catch (e3) {
            console.warn('[AudioRecorder] Could not unload recording:', e3);
          }
        }
      }
      
      this.recording = null;
      
      // Wait a bit to ensure expo-av has fully released the recording
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });

      console.log('[AudioRecorder] Stopped recording successfully');
      return uri || null;
    } catch (error) {
      console.error('[AudioRecorder] Error stopping recording:', error);
      // Try to clean up anyway
      try {
        if (this.recording) {
          await this.recording.unloadAsync();
        }
      } catch (e2) {
        // Ignore cleanup errors
      }
      this.recording = null;
      this.callbacks.onError?.(error as Error);
      return null;
    }
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.isActive && this.recording !== null;
  }
}

export default AudioRecorder;
