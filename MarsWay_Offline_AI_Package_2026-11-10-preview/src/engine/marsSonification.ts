// MarsWay Experimental Terrain Sonification Engine
// Synthesizes audio frequencies from Martian topography:
// Elevation maps to pitch (Hz), slope and roughness map to harmonic timbre.
// Grounded in MGS MOLA elevation datum (0m reference).
// Disclaimer: Experimental acoustic representation of topographic GIS data, NOT actual atmospheric sound.

class MarsSonificationEngine {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isEnabled: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    if (this.isEnabled) {
      this.initContext();
      this.playPulse(0, 'sine', 0.15, 0.1);
    } else {
      this.stop();
    }
    return this.isEnabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      this.initContext();
    } else {
      this.stop();
    }
  }

  /**
   * Convert Martian elevation (-8,200m Hellas Basin to +21,229m Olympus Mons)
   * into an audible frequency between 110 Hz and 880 Hz (A2 to A5).
   */
  public elevationToFrequency(elevationM: number): number {
    // Clamped elevation range: -8200 to 22000
    const minElev = -8200;
    const maxElev = 22000;
    const normalized = Math.max(0, Math.min(1, (elevationM - minElev) / (maxElev - minElev)));
    // Logarithmic pitch scaling (A2 ~ 110Hz to A5 ~ 880Hz)
    const minFreq = 110;
    const maxFreq = 880;
    return minFreq * Math.pow(maxFreq / minFreq, normalized);
  }

  /**
   * Play a brief sonification ping for a discrete point or feature.
   */
  public sonifyLocation(elevationM: number, slopeDeg: number = 0) {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const freq = this.elevationToFrequency(elevationM);
      const now = this.ctx.currentTime;

      // Primary tone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Timbre adjusts with slope: flat = pure sine, steep = triangle/sawtooth
      osc.type = slopeDeg > 12 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch {
      // AudioContext policy catch
    }
  }

  /**
   * Play a pulse with specific frequency
   */
  public playPulse(freq: number = 440, type: OscillatorType = 'sine', durationSec: number = 0.2, volume: number = 0.1) {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq || 440, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + durationSec + 0.05);
    } catch {}
  }

  public stop() {
    if (this.osc) {
      try {
        this.osc.stop();
        this.osc.disconnect();
      } catch {}
      this.osc = null;
    }
  }
}

export const marsSonification = new MarsSonificationEngine();
