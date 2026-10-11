// MARSWAY - Astronaut EVA Realistic Acoustic Engine
// Synthesizes Martian atmospheric acoustics, spacesuit life support ambiance, and EVA tool sounds
// Based on NASA Perseverance SuperCam acoustic microphone data (0.01 atm density acoustic attenuation)

class MarsEvaAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isRunning: boolean = false;

  // Audio nodes
  private masterGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private suitFanGain: GainNode | null = null;
  private breathingGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Animation / interval IDs
  private breathInterval: any = null;
  private geigerInterval: any = null;

  private init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Start continuous ambient soundscape
      this.createMartianWind();
      this.createSuitLifeSupportAmbiance();
      this.startBreathingCycle();
      this.startGeigerClicks();
      this.isRunning = true;
    } catch (e) {
      console.warn('Mars EVA Audio Engine initialization failed:', e);
    }
  }

  private createMartianWind() {
    if (!this.ctx || !this.masterGain) return;

    // Buffer of pink noise for thin Martian wind buffeting
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.08; // scale down
      b6 = white * 0.115926;
    }

    const whiteNoiseSource = this.ctx.createBufferSource();
    whiteNoiseSource.buffer = noiseBuffer;
    whiteNoiseSource.loop = true;

    // Mars atmosphere is ~95% CO2 at 6 mbar: High frequencies attenuate drastically (Perseverance SuperCam finding)
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.setValueAtTime(320, this.ctx.currentTime); // Low frequency rumble & whistle
    this.windFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    whiteNoiseSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    whiteNoiseSource.start(0);

    // Subtle LFO to simulate gusts
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime); // 0.18 Hz slow gust
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(80, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.windFilter.frequency);
    lfo.start(0);
  }

  private createSuitLifeSupportAmbiance() {
    if (!this.ctx || !this.masterGain) return;

    // xEMU Portable Life Support System (PLSS) fan hum (quiet, sealed inside helmet)
    const humOsc = this.ctx.createOscillator();
    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(118, this.ctx.currentTime); // 118 Hz gentle fan hum

    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(220, this.ctx.currentTime);

    this.suitFanGain = this.ctx.createGain();
    this.suitFanGain.gain.setValueAtTime(0.045, this.ctx.currentTime); // subtle

    humOsc.connect(humFilter);
    humFilter.connect(this.suitFanGain);
    this.suitFanGain.connect(this.masterGain);

    humOsc.start(0);
  }

  private startBreathingCycle() {
    if (this.breathInterval) clearInterval(this.breathInterval);
    // Astronaut steady resting breath: every ~4.5 seconds
    this.breathInterval = setInterval(() => {
      if (!this.ctx || this.isMuted || !this.masterGain) return;
      this.playBreathSound();
    }, 4800);
  }

  private playBreathSound() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      // Inhale noise
      const bufferSize = Math.floor(this.ctx.sampleRate * 1.6);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.03;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, this.ctx.currentTime);
      filter.Q.setValueAtTime(3, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.025, now + 0.6);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + 1.6);
    } catch {}
  }

  private startGeigerClicks() {
    if (this.geigerInterval) clearInterval(this.geigerInterval);
    // Cosmic ray tick every 2-6 seconds
    const scheduleNextTick = () => {
      const delay = 2000 + Math.random() * 4000;
      this.geigerInterval = setTimeout(() => {
        if (!this.isMuted && this.ctx && this.masterGain) {
          this.playGeigerClick();
        }
        scheduleNextTick();
      }, delay);
    };
    scheduleNextTick();
  }

  public playGeigerClick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.012);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.014);
    } catch {}
  }

  // Astronaut boots stepping in Martian regolith
  public playFootstep() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      // Low frequency thump for boot heel impact in 0.38g
      const thump = this.ctx.createOscillator();
      thump.frequency.setValueAtTime(80, now);
      thump.frequency.exponentialRampToValueAtTime(40, now + 0.12);
      const thumpGain = this.ctx.createGain();
      thumpGain.gain.setValueAtTime(0.25, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      thump.connect(thumpGain);
      thumpGain.connect(this.masterGain);

      noise.start(now);
      thump.start(now);
      noise.stop(now + 0.18);
      thump.stop(now + 0.18);
    } catch {}
  }

  // Laser LIBS / Raman spectrometer chirp
  public playLaserScan() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // High frequency laser beam pulse
      for (let i = 0; i < 3; i++) {
        const pulseTime = now + i * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2400 + i * 400, pulseTime);
        osc.frequency.exponentialRampToValueAtTime(800, pulseTime + 0.05);

        gain.gain.setValueAtTime(0.15, pulseTime);
        gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(pulseTime);
        osc.stop(pulseTime + 0.06);
      }

      // Success readout tone
      const tone = this.ctx.createOscillator();
      const toneGain = this.ctx.createGain();
      tone.type = 'sine';
      tone.frequency.setValueAtTime(880, now + 0.3);
      tone.frequency.setValueAtTime(1320, now + 0.42);

      toneGain.gain.setValueAtTime(0.12, now + 0.3);
      toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      tone.connect(toneGain);
      toneGain.connect(this.masterGain);
      tone.start(now + 0.3);
      tone.stop(now + 0.68);
    } catch {}
  }

  // Sample tube sealed confirmation chime
  public playSampleCollected() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      [587.33, 880, 1174.66].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.18, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.36);
      });
    } catch {}
  }

  // Radio communication click / static burst
  public playRadioClick() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.045);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.12;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(2.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + 0.045);
    } catch {}
  }

  // Start engine upon user interaction
  public start() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Toggle mute
  public toggleMute(): boolean {
    this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public stop() {
    if (this.breathInterval) clearInterval(this.breathInterval);
    if (this.geigerInterval) clearTimeout(this.geigerInterval);
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.suspend();
      } catch {}
    }
    this.isRunning = false;
  }
}

export const marsEvaAudio = new MarsEvaAudioEngine();
