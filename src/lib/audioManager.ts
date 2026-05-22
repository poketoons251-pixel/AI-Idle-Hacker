class AudioManager {
  private static instance: AudioManager | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private initialized = false;
  private droneOsc: OscillatorNode | null = null;
  private dronePlaying = false;
  private chirpTimeout: ReturnType<typeof setTimeout> | null = null;

  private _masterVolume = 0.7;
  private _sfxVolume = 0.8;
  private _ambienceEnabled = true;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._masterVolume;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this._sfxVolume;
    this.sfxGain.connect(this.masterGain);

    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.value = 0.03;
    this.ambienceGain.connect(this.masterGain);

    this.initialized = true;
  }

  private ensureInit(): boolean {
    if (!this.initialized || !this.ctx || !this.sfxGain) {
      this.init();
      return this.initialized;
    }
    return true;
  }

  // ── Sound Generators ──

  playHackComplete(): void {
    if (!this.ensureInit() || !this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playUpgradePurchase(): void {
    if (!this.ensureInit() || !this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playAchievementUnlock(): void {
    if (!this.ensureInit() || !this.ctx || !this.sfxGain) return;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.1);
      g.gain.setValueAtTime(0, this.ctx!.currentTime + i * 0.1);
      g.gain.linearRampToValueAtTime(0.25, this.ctx!.currentTime + i * 0.1 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + i * 0.1 + 0.25);
      o.connect(g);
      g.connect(this.sfxGain!);
      o.start(this.ctx!.currentTime + i * 0.1);
      o.stop(this.ctx!.currentTime + i * 0.1 + 0.25);
    });
  }

  playUIClick(): void {
    if (!this.ensureInit() || !this.ctx || !this.sfxGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.02);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);
    source.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
  }

  playAIDecision(): void {
    if (!this.ensureInit() || !this.ctx || !this.sfxGain) return;
    [0, 0.1].forEach((offset) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(660, this.ctx!.currentTime + offset);
      g.gain.setValueAtTime(0.15, this.ctx!.currentTime + offset);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + offset + 0.05);
      o.connect(g);
      g.connect(this.sfxGain!);
      o.start(this.ctx!.currentTime + offset);
      o.stop(this.ctx!.currentTime + offset + 0.05);
    });
  }

  playTerminalGlitch(): void {
    if (!this.ensureInit() || !this.ctx || !this.sfxGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    source.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
  }

  playNewTarget(): void {
    if (!this.ensureInit() || !this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // ── Settings ──
  setMasterVolume(v: number): void {
    this._masterVolume = v;
    if (this.masterGain) this.masterGain.gain.value = v;
  }
  setSfxVolume(v: number): void {
    this._sfxVolume = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }
  get masterVolume(): number { return this._masterVolume; }
  get sfxVolume(): number { return this._sfxVolume; }
  get ambienceEnabled(): boolean { return this._ambienceEnabled; }
  get isInitialized(): boolean { return this.initialized; }
}

export default AudioManager;
