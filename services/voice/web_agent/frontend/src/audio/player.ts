export class PcmPlayer {
  private readonly audioContext: AudioContext;
  private readonly inputSampleRate: number;
  private lastScheduledTime?: number;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor(sampleRate = 16000) {
    this.audioContext = new AudioContext();
    this.inputSampleRate = sampleRate;
  }

  async playBase64Pcm(chunkBase64: string) {
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    const pcmBytes = this.base64ToArrayBuffer(chunkBase64);
    const int16 = new Int16Array(pcmBytes);
    
    // Skip very small chunks (silence or padding)
    if (int16.length <= 2) {
      return;
    }
    
    const float32 = new Float32Array(int16.length);
    
    // Convert Int16 to Float32 (-1.0 to 1.0)
    for (let i = 0; i < int16.length; i += 1) {
      float32[i] = int16[i] / 32768;
    }

    const outputRate = this.audioContext.sampleRate;
    let outputData = float32;
    let actualDuration = int16.length / this.inputSampleRate;

    // Resample if necessary
    if (outputRate !== this.inputSampleRate && float32.length > 0) {
      const ratio = outputRate / this.inputSampleRate;
      const newLength = Math.round(float32.length * ratio);
      const resampled = new Float32Array(newLength);

      for (let i = 0; i < newLength; i += 1) {
        const sourceIndex = i / ratio;
        const lower = Math.floor(sourceIndex);
        const upper = Math.min(float32.length - 1, lower + 1);
        const weight = sourceIndex - lower;
        resampled[i] = float32[lower] * (1 - weight) + float32[upper] * weight;
      }
      outputData = resampled;
      actualDuration = outputData.length / outputRate;
    }

    const buffer = this.audioContext.createBuffer(1, outputData.length, outputRate);
    buffer.copyToChannel(outputData, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    
    // Track active sources for cleanup
    this.activeSources.push(source);
    source.onended = () => {
      const index = this.activeSources.indexOf(source);
      if (index > -1) {
        this.activeSources.splice(index, 1);
      }
    };
    
    const now = this.audioContext.currentTime;
    
    // For the first chunk, start immediately with minimal delay
    // For subsequent chunks, schedule right after the previous one
    if (this.lastScheduledTime === undefined || this.lastScheduledTime < now) {
      // First chunk or catch-up needed - start immediately
      console.log(`[PcmPlayer] Starting first chunk at ${now.toFixed(3)}s (duration: ${actualDuration.toFixed(3)}s)`);
      this.lastScheduledTime = now;
    } else {
      console.log(`[PcmPlayer] Scheduling chunk at ${this.lastScheduledTime.toFixed(3)}s (duration: ${actualDuration.toFixed(3)}s, now: ${now.toFixed(3)}s)`);
    }
    
    source.start(this.lastScheduledTime);
    this.lastScheduledTime += actualDuration;
  }

  dispose() {
    this.stopAll();
    void this.audioContext.close();
  }

  resetSchedule() {
    this.stopAll();
    this.lastScheduledTime = undefined;
  }

  private stopAll() {
    // Stop all currently scheduled/playing audio sources
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch (e) {
        // Source may have already ended
      }
    }
    this.activeSources = [];
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

