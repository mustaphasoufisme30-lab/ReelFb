// Web Audio synthesizer for Sound FX (Whoosh, Ding, Pop, Impact)
// and dynamic background beat for Facebook Reels.

class AudioEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private isBgmPlaying = false;
  private bgmInterval: any = null;
  private isMuted = false;

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.55;
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.18;
      this.bgmGain.connect(this.masterGain);

      this.destinationNode = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.connect(this.destinationNode);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMediaStream(): MediaStream | null {
    this.init();
    return this.destinationNode ? this.destinationNode.stream : null;
  }

  public setMuted(muted: boolean) {
    this.init();
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1.0, this.ctx.currentTime, 0.05);
    }
  }

  public setBgmVolume(volume: number) {
    this.init();
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
    }
  }

  // Sound FX: Whoosh
  public playWhoosh() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.0;
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + 0.18);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.6, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.36);
  }

  // Sound FX: Ding (Chime)
  public playDing() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1400, t);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2800, t);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.65);
    osc2.stop(t + 0.65);
  }

  // Sound FX: Pop
  public playPop() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Sound FX: Impact / Sub Thump
  public playImpact() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.4);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.52);
  }

  public playSoundEffect(type: string) {
    switch (type) {
      case 'whoosh':
        this.playWhoosh();
        break;
      case 'ding':
        this.playDing();
        break;
      case 'pop':
        this.playPop();
        break;
      case 'impact':
        this.playImpact();
        break;
      default:
        break;
    }
  }

  // Built-in Synth BGM loop (120 BPM upbeat electronic pulse for modern Facebook Reels)
  public startBgmLoop(mood: 'energetic' | 'dramatic' | 'lofi' | 'hype' | 'minimal' = 'energetic') {
    this.init();
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;

    let step = 0;
    const bpm = mood === 'hype' ? 128 : mood === 'lofi' ? 84 : 120;
    const stepInterval = (60 / bpm / 2) * 1000; // 16th notes / 8th notes

    // Chord progressions in minor key for high retention
    const chords = [
      [220, 261.63, 329.63], // Am
      [174.61, 220, 261.63], // F
      [196, 246.94, 293.66], // G
      [164.81, 196, 246.94], // Em
    ];

    this.bgmInterval = setInterval(() => {
      if (!this.isBgmPlaying || !this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      const chordIndex = Math.floor((step % 16) / 4);
      const chord = chords[chordIndex];

      // Subtle synth chord pulse
      if (step % 4 === 0) {
        chord.forEach((freq) => {
          if (!this.ctx || !this.bgmGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = mood === 'lofi' ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

          osc.connect(gain);
          gain.connect(this.bgmGain);

          osc.start(t);
          osc.stop(t + 0.3);
        });
      }

      // Kick / Pulse beat on steps 0, 4, 8, 12
      if (step % 4 === 0 && mood !== 'minimal') {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(110, t);
        kickOsc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

        kickGain.gain.setValueAtTime(0.3, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

        kickOsc.connect(kickGain);
        if (this.bgmGain) kickGain.connect(this.bgmGain);

        kickOsc.start(t);
        kickOsc.stop(t + 0.14);
      }

      // Snare / Click on step 2 and 6
      if ((step % 8 === 4) && mood !== 'minimal') {
        const snap = this.ctx.createOscillator();
        const snapGain = this.ctx.createGain();
        snap.type = 'square';
        snap.frequency.setValueAtTime(350, t);
        snapGain.gain.setValueAtTime(0.04, t);
        snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        snap.connect(snapGain);
        if (this.bgmGain) snapGain.connect(this.bgmGain);
        snap.start(t);
        snap.stop(t + 0.06);
      }

      step = (step + 1) % 16;
    }, stepInterval);
  }

  public stopBgmLoop() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  // Browser Web Speech API preview helper (optional)
  public speakFallback(
    text: string,
    lang = 'fr-FR',
    onEnd?: () => void,
    sceneDuration?: number
  ) {
    if (!('speechSynthesis' in window) || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Detect Arabic script
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    if (hasArabic) {
      utterance.lang = 'ar-SA';
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(
        (v) => v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic')
      );
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }
    } else {
      utterance.lang = lang;
    }

    // Calibrate speech rate to match scene duration closely
    if (sceneDuration && sceneDuration > 0) {
      const wordCount = text.trim().split(/\s+/).length;
      const estimatedRate = wordCount / (sceneDuration * 2.5);
      utterance.rate = Math.max(0.95, Math.min(1.4, estimatedRate));
    } else {
      utterance.rate = 1.15;
    }
    utterance.pitch = 1.02;
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  }

  public stopAll() {
    this.stopBgmLoop();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioEngine = new AudioEngine();
