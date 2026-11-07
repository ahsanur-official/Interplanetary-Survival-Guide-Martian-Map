// MarsWay Gemini Live Audio Pipeline (gemini-3.8-live)
// Handles:
// 1. Microphone capture at 16kHz -> 16-bit PCM little-endian Base64 chunks for Gemini Live API
// 2. Playback of 24kHz raw PCM little-endian Base64 audio returned by gemini-3.8-live
// 3. Gapless playback scheduling with jitter buffering and instant interruption clearing
// 4. Real-time audio level and frequency spectrum analysis for visualization

export interface AudioVisualizerData {
  inputLevel: number;    // 0.0 to 1.0 (microphone RMS)
  outputLevel: number;   // 0.0 to 1.0 (model playback RMS)
  inputWaveform: number[];
  outputWaveform: number[];
}

export class MarsLiveAudioController {
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;

  private nextStartTime: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private isCapturing: boolean = false;
  private isMuted: boolean = false;

  private onAudioChunkCallback?: (base64Chunk: string) => void;
  private onLevelUpdateCallback?: (data: AudioVisualizerData) => void;
  private animationFrameId: number | null = null;

  constructor() {
    // Lazy initialized on user gesture
  }

  // Initialize both 16kHz input context and 24kHz output context
  public async initialize(
    onAudioChunk: (base64Chunk: string) => void,
    onLevelUpdate?: (data: AudioVisualizerData) => void
  ): Promise<void> {
    this.onAudioChunkCallback = onAudioChunk;
    this.onLevelUpdateCallback = onLevelUpdate;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported in this browser.');
    }

    // Input context at 16000 Hz for Gemini Live mic input
    this.inputAudioCtx = new AudioContextClass({ sampleRate: 16000 });
    // Output context at 24000 Hz for Gemini Live response playback
    this.outputAudioCtx = new AudioContextClass({ sampleRate: 24000 });

    if (this.inputAudioCtx.state === 'suspended') {
      await this.inputAudioCtx.resume();
    }
    if (this.outputAudioCtx.state === 'suspended') {
      await this.outputAudioCtx.resume();
    }

    this.nextStartTime = this.outputAudioCtx.currentTime;

    // Output analyser
    this.outputAnalyser = this.outputAudioCtx.createAnalyser();
    this.outputAnalyser.fftSize = 64;
    this.outputAnalyser.connect(this.outputAudioCtx.destination);

    // Start visualizer loop
    this.startVisualizerLoop();
  }

  // Start microphone streaming
  public async startMicrophone(): Promise<void> {
    if (!this.inputAudioCtx) {
      throw new Error('Live Audio Controller must be initialized before starting microphone.');
    }

    if (this.inputAudioCtx.state === 'suspended') {
      await this.inputAudioCtx.resume();
    }

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.micSource = this.inputAudioCtx.createMediaStreamSource(this.micStream);

    // Analyser for user speech
    this.inputAnalyser = this.inputAudioCtx.createAnalyser();
    this.inputAnalyser.fftSize = 64;
    this.micSource.connect(this.inputAnalyser);

    // ScriptProcessor to read raw PCM audio
    const bufferSize = 2048;
    this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(bufferSize, 1, 1);

    this.scriptProcessor.onaudioprocess = (event) => {
      if (!this.isCapturing || this.isMuted) return;

      const inputData = event.inputBuffer.getChannelData(0);
      const base64Pcm = this.float32ToPcm16Base64(inputData);
      if (base64Pcm && this.onAudioChunkCallback) {
        this.onAudioChunkCallback(base64Pcm);
      }
    };

    this.micSource.connect(this.scriptProcessor);
    // Connect to destination to keep ScriptProcessor running (silent gain if needed)
    this.scriptProcessor.connect(this.inputAudioCtx.destination);

    this.isCapturing = true;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsCapturing(): boolean {
    return this.isCapturing;
  }

  // Play incoming 24kHz raw PCM little-endian audio chunk from gemini-3.8-live
  public playAudioChunk(base64Pcm16: string): void {
    if (!this.outputAudioCtx || !this.outputAnalyser) return;

    if (this.outputAudioCtx.state === 'suspended') {
      this.outputAudioCtx.resume();
    }

    const float32Data = this.pcm16Base64ToFloat32(base64Pcm16);
    if (!float32Data || float32Data.length === 0) return;

    const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = this.outputAudioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAnalyser);

    const currentTime = this.outputAudioCtx.currentTime;
    // Schedule gaplessly: start at next scheduled time or immediately if pipeline fell behind
    const scheduledStartTime = Math.max(this.nextStartTime, currentTime);
    source.start(scheduledStartTime);
    this.nextStartTime = scheduledStartTime + audioBuffer.duration;

    this.activeSources.add(source);
    source.onended = () => {
      this.activeSources.delete(source);
    };
  }

  // Handle interruption: instantly cut off active playback and reset scheduler
  public handleInterruption(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Source might have ended
      }
    }
    this.activeSources.clear();
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
  }

  // Converts Float32Array [-1.0, 1.0] to 16-bit PCM little-endian Base64
  private float32ToPcm16Base64(floats: Float32Array): string {
    const pcm16 = new Int16Array(floats.length);
    for (let i = 0; i < floats.length; i++) {
      const s = Math.max(-1, Math.min(1, floats[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    const uint8 = new Uint8Array(pcm16.buffer);
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }

  // Converts 16-bit PCM little-endian Base64 to Float32Array [-1.0, 1.0]
  private pcm16Base64ToFloat32(base64: string): Float32Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32[i] = int16Array[i] / 32768.0;
    }
    return float32;
  }

  // Animation frame loop computing real-time levels and waveforms
  private startVisualizerLoop() {
    const inputBuf = new Uint8Array(32);
    const outputBuf = new Uint8Array(32);

    const tick = () => {
      let inputLevel = 0;
      let outputLevel = 0;
      const inputWaveform: number[] = [];
      const outputWaveform: number[] = [];

      if (this.inputAnalyser && this.isCapturing && !this.isMuted) {
        this.inputAnalyser.getByteFrequencyData(inputBuf);
        let sum = 0;
        for (let i = 0; i < inputBuf.length; i++) {
          sum += inputBuf[i];
          inputWaveform.push(inputBuf[i] / 255);
        }
        inputLevel = Math.min(1, (sum / inputBuf.length) / 128);
      } else {
        for (let i = 0; i < 16; i++) inputWaveform.push(0);
      }

      if (this.outputAnalyser && this.activeSources.size > 0) {
        this.outputAnalyser.getByteFrequencyData(outputBuf);
        let sum = 0;
        for (let i = 0; i < outputBuf.length; i++) {
          sum += outputBuf[i];
          outputWaveform.push(outputBuf[i] / 255);
        }
        outputLevel = Math.min(1, (sum / outputBuf.length) / 128);
      } else {
        for (let i = 0; i < 16; i++) outputWaveform.push(0);
      }

      if (this.onLevelUpdateCallback) {
        this.onLevelUpdateCallback({
          inputLevel,
          outputLevel,
          inputWaveform: inputWaveform.slice(0, 16),
          outputWaveform: outputWaveform.slice(0, 16),
        });
      }

      this.animationFrameId = requestAnimationFrame(tick);
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  // Cleanup all audio resources
  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.handleInterruption();

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    if (this.inputAudioCtx) {
      this.inputAudioCtx.close().catch(() => {});
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx) {
      this.outputAudioCtx.close().catch(() => {});
      this.outputAudioCtx = null;
    }

    this.isCapturing = false;
  }
}
