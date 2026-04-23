// ============================================================
// AUDIO — Web Audio API wrapper (SNES 16-bit style)
// ============================================================
const Audio = {
  ready: false,
  muted: false,
  ctx: null,
  initPromise: null,
  musicGain: null,
  sfxGain: null,
  musicVol: 1,
  sfxVol: 1,
  loopTimer: null,
  loopBeat: 0,
  currentTrack: null,

  // Note name → frequency
  noteFreq: {
    'C2':65.41,'D2':73.42,'E2':82.41,'F2':87.31,'G2':98.00,'A2':110.00,'B2':123.47,
    'C3':130.81,'D3':146.83,'E3':164.81,'F3':174.61,'G3':196.00,'A3':220.00,'B3':246.94,
    'C4':261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392.00,'A4':440.00,'B4':493.88,
    'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99,'A5':880.00,'B5':987.77,
    'C6':1046.50,'D6':1174.66,'E6':1318.51,'F6':1396.91,'G6':1567.98,'A6':1760.00,'B6':1975.53,
    'C7':2093.00,'D7':2349.32,'E7':2637.02,'G7':3135.96
  },

  async init() {
    if (this.ready) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        await this.ctx.resume();
        this.musicGain = this.ctx.createGain();
        this.musicGain.connect(this.ctx.destination);
        this.musicGain.gain.value = this.musicVol;
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.ctx.destination);
        this.sfxGain.gain.value = this.sfxVol;
        this.ready = true;
        console.log('[audio] Web Audio context ready');
      } catch (e) {
        console.warn('[audio] Web Audio init failed:', e);
      } finally {
        this.initPromise = null;
      }
    })();
    return this.initPromise;
  },

  async ensure() {
    if (this.initPromise) await this.initPromise;
    if (!this.ready) await this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('[audio] resume failed:', e);
      }
    }
    return this.canPlay();
  },

  canPlay() {
    return !!(this.ready && this.ctx && this.ctx.state === 'running');
  },

  // Play a single note: oscillator + envelope
  playNote(freq, type, startTime, duration, vol, gainNode) {
    if (!freq || !this.canPlay()) return null;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(env);
    env.connect(gainNode || this.sfxGain);

    const now = startTime || this.ctx.currentTime;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(vol, now + 0.005);
    env.gain.linearRampToValueAtTime(vol * 0.5, now + 0.03);
    env.gain.linearRampToValueAtTime(0, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.05);
    return osc;
  },

  playChord(notes, type, startTime, duration, vol, gainNode) {
    notes.forEach((note, idx) => {
      const freq = this.noteFreq[note];
      if (freq) this.playNote(freq, type, startTime + (idx * 0.004), duration, vol, gainNode);
    });
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.musicGain) this.musicGain.gain.value = this.muted ? 0 : this.musicVol;
    if (this.sfxGain) this.sfxGain.gain.value = this.muted ? 0 : this.sfxVol;
    return this.muted;
  },

  setMusicVol(fraction) {
    this.musicVol = fraction;
    if (this.musicGain && !this.muted) this.musicGain.gain.value = fraction;
  },

  setSfxVol(fraction) {
    this.sfxVol = fraction;
    if (this.sfxGain && !this.muted) this.sfxGain.gain.value = fraction;
  },

  stopMusic() {
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    this.loopBeat = 0;
    this.currentTrack = null;
  },

  // ——— Music Tracks ———
  playTrack(name) {
    if (!this.canPlay() || this.muted) return;
    const track = this.tracks[name];
    if (track) track.call(this);
  },

  tracks: {
    start() {
      if (this.currentTrack === 'start') return; // Already playing, don't restart
      this.stopMusic();
      this.currentTrack = 'start';
      const t = this.ctx.currentTime;
      // Short 2-bar intro jingle (no loop)
      const lead = [
        ['E5', 0.00, 0.12], ['G5', 0.12, 0.12], ['A5', 0.24, 0.12], ['B5', 0.36, 0.24],
        ['A5', 0.60, 0.12], ['G5', 0.72, 0.12], ['E5', 0.84, 0.24],
        ['D5', 1.08, 0.12], ['E5', 1.20, 0.12], ['G5', 1.32, 0.24], ['A5', 1.56, 0.16],
        ['B5', 1.72, 0.12], ['D6', 1.84, 0.36]
      ];
      lead.forEach(([note, offset, dur]) => {
        this.playNote(this.noteFreq[note], 'square', t + offset, dur, 0.20, this.musicGain);
      });
      // Bass line
      this.playNote(this.noteFreq['E2'], 'triangle', t + 0.00, 0.48, 0.22, this.musicGain);
      this.playNote(this.noteFreq['C3'], 'triangle', t + 0.60, 0.48, 0.20, this.musicGain);
      this.playNote(this.noteFreq['D3'], 'triangle', t + 1.08, 0.48, 0.20, this.musicGain);
      this.playNote(this.noteFreq['E3'], 'triangle', t + 1.56, 0.64, 0.22, this.musicGain);
      // Chord stabs
      this.playChord(['E4', 'B4'], 'sine', t + 0.00, 0.36, 0.08, this.musicGain);
      this.playChord(['C4', 'G4'], 'sine', t + 0.60, 0.36, 0.08, this.musicGain);
      this.playChord(['D4', 'A4'], 'sine', t + 1.08, 0.36, 0.08, this.musicGain);
      this.playChord(['E4', 'B4', 'D5'], 'sine', t + 1.56, 0.64, 0.09, this.musicGain);
      // Clean up after jingle finishes
      setTimeout(() => { if (this.currentTrack === 'start') this.stopMusic(); }, 2500);
    },

    victory() {
      this.stopMusic();
      this.currentTrack = 'victory';
      const t = this.ctx.currentTime;
      const lead = [
        ['E5', 0.00, 0.10], ['G5', 0.10, 0.10], ['B5', 0.20, 0.10], ['E6', 0.30, 0.16],
        ['G6', 0.46, 0.10], ['B6', 0.56, 0.10], ['E7', 0.66, 0.28],
        ['D7', 1.00, 0.10], ['E7', 1.10, 0.40]
      ];
      lead.forEach(([note, offset, dur]) => {
        this.playNote(this.noteFreq[note], 'square', t + offset, dur, 0.17, this.musicGain);
      });
      this.playChord(['E4', 'B4'], 'sine', t + 0.00, 0.44, 0.10, this.musicGain);
      this.playChord(['C5', 'G5'], 'sine', t + 0.46, 0.36, 0.09, this.musicGain);
      this.playChord(['E5', 'B5'], 'sine', t + 1.00, 0.52, 0.10, this.musicGain);
      this.playNote(this.noteFreq['E2'], 'triangle', t + 0.00, 0.36, 0.18, this.musicGain);
      this.playNote(this.noteFreq['C3'], 'triangle', t + 0.46, 0.30, 0.16, this.musicGain);
      this.playNote(this.noteFreq['E3'], 'triangle', t + 1.00, 0.48, 0.18, this.musicGain);
    },

    gameover() {
      this.stopMusic();
      this.currentTrack = 'gameover';
      const t = this.ctx.currentTime;
      const lead = [
        ['E5', 0.00, 0.18], ['D5', 0.18, 0.18], ['C5', 0.36, 0.18], ['B4', 0.54, 0.18],
        ['A4', 0.72, 0.18], ['G4', 0.92, 0.20], ['E4', 1.18, 0.52]
      ];
      lead.forEach(([note, offset, dur]) => {
        this.playNote(this.noteFreq[note], 'square', t + offset, dur, 0.16, this.musicGain);
      });
      this.playChord(['E3', 'B3'], 'sine', t + 0.00, 0.50, 0.08, this.musicGain);
      this.playChord(['C3', 'G3'], 'sine', t + 0.36, 0.42, 0.08, this.musicGain);
      this.playChord(['A2', 'E3'], 'sine', t + 0.72, 0.44, 0.08, this.musicGain);
      this.playNote(this.noteFreq['E2'], 'triangle', t + 0.00, 0.44, 0.20, this.musicGain);
      this.playNote(this.noteFreq['C2'], 'triangle', t + 0.36, 0.34, 0.18, this.musicGain);
      this.playNote(this.noteFreq['A2'], 'triangle', t + 0.72, 0.42, 0.18, this.musicGain);
      this.playNote(this.noteFreq['E2'], 'triangle', t + 1.18, 0.70, 0.20, this.musicGain);
    }
  },

  // ——— SFX ———
  sfx(name, param) {
    if (!this.canPlay() || this.muted) return;
    const fn = this.sfxFns[name];
    if (fn) fn.call(this, param);
  },

  sfxFns: {
    correct() {
      const t = this.ctx.currentTime;
      this.playNote(this.noteFreq['E5'],'square',t,0.06,0.22,this.sfxGain);
      this.playNote(this.noteFreq['G5'],'square',t+0.05,0.06,0.22,this.sfxGain);
      this.playNote(this.noteFreq['B5'],'square',t+0.10,0.07,0.22,this.sfxGain);
      this.playNote(this.noteFreq['E6'],'square',t+0.16,0.16,0.24,this.sfxGain);
      this.playNote(this.noteFreq['E4'],'triangle',t,0.18,0.12,this.sfxGain);
    },

    wrong() {
      const t = this.ctx.currentTime;
      this.playNote(this.noteFreq['A3'],'sawtooth',t,0.08,0.22,this.sfxGain);
      this.playNote(this.noteFreq['F3'],'sawtooth',t+0.07,0.08,0.24,this.sfxGain);
      this.playNote(this.noteFreq['D3'],'sawtooth',t+0.14,0.16,0.24,this.sfxGain);
      this.playNote(this.noteFreq['A2'],'triangle',t+0.02,0.24,0.14,this.sfxGain);
    },

    heartLoss() {
      this.playNote(80,'sawtooth',null,0.2,0.3,this.sfxGain);
    },

    streak(level) {
      const t = this.ctx.currentTime;
      const streakNotes = ['E6', 'G6', 'A6', 'B6', 'D7'];
      const top = streakNotes[Math.min(level - 1, streakNotes.length - 1)];
      this.playNote(this.noteFreq['E6'],'square',t,0.04,0.12,this.sfxGain);
      this.playNote(this.noteFreq[top],'square',t+0.04,0.08,0.18,this.sfxGain);
    },

    click() {
      const t = this.ctx.currentTime;
      this.playNote(this.noteFreq['C6'],'square',t,0.03,0.10,this.sfxGain);
      this.playNote(this.noteFreq['G6'],'square',t+0.02,0.04,0.08,this.sfxGain);
    },

    deckClear() {
      const t = this.ctx.currentTime;
      ['E5', 'G5', 'B5', 'E6', 'G6', 'B6', 'E7'].forEach((note, idx) => {
        this.playNote(this.noteFreq[note], 'square', t + (idx * 0.07), idx === 6 ? 0.28 : 0.08, 0.18, this.sfxGain);
      });
      this.playNote(this.noteFreq['E3'], 'triangle', t, 0.54, 0.12, this.sfxGain);
    },

    review() {
      const t = this.ctx.currentTime;
      this.playNote(this.noteFreq['C5'],'square',t,0.07,0.14,this.sfxGain);
      this.playNote(this.noteFreq['E5'],'square',t+0.07,0.07,0.14,this.sfxGain);
      this.playNote(this.noteFreq['G5'],'square',t+0.14,0.10,0.14,this.sfxGain);
      this.playNote(this.noteFreq['E5'],'square',t+0.24,0.14,0.12,this.sfxGain);
    }
  }
};
