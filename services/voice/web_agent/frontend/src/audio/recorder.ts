type RecorderCallbacks = {
  onChunk: (base64Chunk: string) => void;
  onError?: (error: unknown) => void;
};

const TARGET_SAMPLE_RATE = 16000;

export class MicRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private readonly callbacks: RecorderCallbacks;

  constructor(callbacks: RecorderCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
      const ctx = this.audioContext;

      this.sourceNode = ctx.createMediaStreamSource(this.stream);
      this.processorNode = ctx.createScriptProcessor(4096, 1, 1);

      this.processorNode.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        const pcm16 = this.floatToPcm16(input, ctx.sampleRate, TARGET_SAMPLE_RATE);
        const base64 = this.pcm16ToBase64(pcm16);
        this.callbacks.onChunk(base64);
      };

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(ctx.destination);
    } catch (err) {
      console.error("Failed to start microphone", err);
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  stop() {
    this.processorNode?.disconnect();
    this.sourceNode?.disconnect();
    this.audioContext?.close().catch((err) => {
      console.warn("Failed to close AudioContext", err);
    });

    this.processorNode = null;
    this.sourceNode = null;
    this.audioContext = null;

    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  private floatToPcm16(
    input: Float32Array,
    inputSampleRate: number,
    targetSampleRate: number
  ): Int16Array {
    if (inputSampleRate === targetSampleRate) {
      return this.float32ToInt16(input);
    }

    const ratio = inputSampleRate / targetSampleRate;
    const newLength = Math.round(input.length / ratio);
    const result = new Int16Array(newLength);

    for (let i = 0; i < newLength; i += 1) {
      const idx = Math.floor(i * ratio);
      const sample = input[idx] ?? 0;
      result[i] = Math.max(-1, Math.min(1, sample)) * 0x7fff;
    }
    return result;
  }

  private float32ToInt16(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, input[i]));
      output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return output;
  }

  private pcm16ToBase64(pcm: Int16Array): string {
    const buffer = new ArrayBuffer(pcm.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < pcm.length; i += 1) {
      view.setInt16(i * 2, pcm[i], true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }
}

