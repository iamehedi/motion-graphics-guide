/**
 * Sound design for the promo. Everything is synthesised at runtime, so there
 * are no audio assets to load, and the exact same graph is fed into the MP4
 * export through a MediaStreamAudioDestinationNode.
 */
/**
 * Real audio assets, loaded from `public/audio/` when present. Any file that
 * is missing simply falls back to the synthesised cue of the same name, so the
 * promo always has sound. Drop royalty-free MP3s in with these exact names.
 */
export const SFX_FILES = {
  whoosh: "/audio/whoosh.mp3",
  impact: "/audio/impact.mp3",
  riser: "/audio/riser.mp3",
  pop: "/audio/pop.mp3",
  ping: "/audio/ping.mp3",
  blip: "/audio/blip.mp3",
  tick: "/audio/tick.mp3",
  chime: "/audio/chime.mp3",
  key: "/audio/key.mp3",
  success: "/audio/success.mp3",
};

/** Looping background music bed. */
export const MUSIC_FILE = "/audio/music.mp3";

/* -------------------------------------------------------------- cue synths */

/**
 * Deterministic white-noise buffer. `rng` is injectable so the offline
 * (WebCodecs) render reproduces the exact same sound as the live preview
 * instead of a fresh random noise on every export.
 */
export function createNoiseBuffer(ctx, rng = Math.random, seconds = 2) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) d[i] = rng() * 2 - 1;
  return buf;
}

/**
 * Builds one synthesised cue on `ctx`, routed into `out`, starting at `t0`.
 * Shared by the live AudioEngine and the offline export so both paths produce
 * byte-identical audio (given the same `rng`).
 */
export function buildSynthCue(ctx, out, type, t0, opts = {}) {
  const { noise = null, rng = Math.random } = opts;

  const noiseSource = (duration) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    src.start(0, rng() * 0.5, duration);
    return src;
  };

  const env = (peak, attack, decay) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    g.connect(out);
    return g;
  };

  const tone = (freq, peak, attack, decay, waveform = "sine", detuneTo = null) => {
    const osc = ctx.createOscillator();
    osc.type = waveform;
    osc.frequency.setValueAtTime(freq, t0);
    if (detuneTo) osc.frequency.exponentialRampToValueAtTime(detuneTo, t0 + attack + decay);
    const g = env(peak, attack, decay);
    osc.connect(g);
    osc.start(t0);
    osc.stop(t0 + attack + decay + 0.05);
    return osc;
  };

  switch (type) {
    case "whoosh": {
      const src = noiseSource(0.7);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 1.1;
      bp.frequency.setValueAtTime(280, t0);
      bp.frequency.exponentialRampToValueAtTime(3400, t0 + 0.32);
      bp.frequency.exponentialRampToValueAtTime(420, t0 + 0.66);
      const g = env(0.32, 0.1, 0.6);
      src.connect(bp).connect(g);
      break;
    }
    case "impact": {
      tone(150, 0.5, 0.006, 0.5, "sine", 44);
      const src = noiseSource(0.3);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(1600, t0);
      lp.frequency.exponentialRampToValueAtTime(220, t0 + 0.28);
      const g = env(0.28, 0.004, 0.28);
      src.connect(lp).connect(g);
      break;
    }
    case "riser": {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, t0);
      osc.frequency.exponentialRampToValueAtTime(1400, t0 + 1.1);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(700, t0);
      lp.frequency.exponentialRampToValueAtTime(5200, t0 + 1.1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.22, t0 + 1.0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.25);
      osc.connect(lp).connect(g).connect(out);
      osc.start(t0);
      osc.stop(t0 + 1.4);
      break;
    }
    case "tick":
      tone(2100, 0.16, 0.002, 0.07, "square");
      break;
    case "pop":
      tone(520, 0.3, 0.004, 0.12, "sine", 1080);
      break;
    case "ping": {
      tone(1560, 0.24, 0.003, 0.5, "sine");
      tone(2340, 0.1, 0.003, 0.34, "sine");
      break;
    }
    case "blip":
      tone(760, 0.18, 0.004, 0.1, "triangle", 1180);
      break;
    case "key":
      tone(1200, 0.1, 0.001, 0.05, "square");
      break;
    case "chime": {
      [784, 988, 1319].forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f;
        const g = env(0.16 / (i + 1), 0.006 + i * 0.01, 0.85 - i * 0.12);
        osc.connect(g);
        osc.start(t0);
        osc.stop(t0 + 1.1);
      });
      break;
    }
    case "success": {
      [523, 659, 784, 1047].forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = f;
        const g = ctx.createGain();
        const st = t0 + i * 0.1;
        g.gain.setValueAtTime(0.0001, st);
        g.gain.linearRampToValueAtTime(0.2, st + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.7);
        osc.connect(g).connect(out);
        osc.start(st);
        osc.stop(st + 0.85);
      });
      break;
    }
    default:
      break;
  }
}

/**
 * Sustained synth pad. Used by both the live engine and the offline render so
 * the exported bed matches the preview.
 */
export function buildBed(ctx, bus, freq, opts = {}) {
  const { tremolo = true, base = 0.12 } = opts;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 520;
  filter.Q.value = 0.6;

  const bed = [1, 1.5].map((mult) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * mult;
    const g = ctx.createGain();
    g.gain.value = mult === 1 ? 0.5 : 0.18;
    osc.connect(g).connect(filter);
    osc.start();
    return osc;
  });

  let tail = filter;
  if (tremolo) {
    const trem = ctx.createGain();
    trem.gain.value = 1;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.12;
    lfo.connect(lfoGain).connect(trem.gain);
    lfo.start();
    filter.connect(trem);
    tail = trem;
  }
  tail.connect(bus);
  bus.gain.value = base;
  return { bed, filter, tail };
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.bedBus = null;
    this.streamDest = null;
    this.bed = null;
    this.noise = null;
    this.enabled = true;

    // Voice-over (loaded from a single mixed narration track).
    this.voiceBus = null;
    this.voiceBuffer = null;
    this.voiceSource = null;
    this.voiceEnabled = true;
    this.onVoiceReady = null;
    this.onVoiceError = null;
    this._voicePending = null;
    this._voiceDecode = null;
    this._voiceTl = null;
    this._voiceCtxStart = null;

    // One-shot samples + looping music (optional real assets)
    this.samples = {};
    this.sampleGain = {};
    this._pending = [];
    this.assetTotal = 0;
    this.assetDone = 0;
    this.onAssetsLoaded = null;
    this.musicBuffer = null;
    this.musicSource = null;
    this.musicBus = null;
    this.musicEnabled = true;
    this._musicTl = null;
    this._musicCtxStart = null;

    // Synth pad bed is gated by the same switch as the music track.
    this.bedEnabled = true;
    this.bedFreq = 110;
    this.bedTrem = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      this._decodePendingVoice();
      this._ingestPending();
      return this.ctx;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    this.ctx = ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;

    this.master = ctx.createGain();
    this.master.gain.value = 0.9;

    this.streamDest = ctx.createMediaStreamDestination();

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 1;

    this.bedBus = ctx.createGain();
    this.bedBus.gain.value = 0;

    this.voiceBus = ctx.createGain();
    this.voiceBus.gain.value = 1;

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0;

    this.sfxBus.connect(comp);
    this.bedBus.connect(comp);
    this.voiceBus.connect(comp);
    this.musicBus.connect(comp);
    comp.connect(this.master);
    this.master.connect(ctx.destination);
    this.master.connect(this.streamDest);

    // reusable noise buffer
    const len = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    this._decodePendingVoice();
    this._ingestPending();
    return ctx;
  }

  /* ----------------------------------------------------- real audio assets */

  /**
   * Fetches the SFX manifest + music bed. Missing files are ignored (synth
   * fallback), so calling this on a fresh project is always safe.
   */
  async loadAssets(sfx = SFX_FILES, music = MUSIC_FILE) {
    const jobs = Object.entries(sfx).map(([type, url]) => this._loadOne("sfx", type, url));
    if (music) jobs.push(this._loadOne("music", null, music));
    this.assetTotal = jobs.length;
    await Promise.all(jobs);
    this.duckForVoice();
    return { loaded: Object.keys(this.samples).length, music: Boolean(this.musicBuffer) };
  }

  async _loadOne(kind, type, url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const buf = await res.arrayBuffer();
      if (this.ctx) {
        const decoded = await this.ctx.decodeAudioData(buf);
        this._store(kind, type, decoded);
      } else {
        this._pending.push({ kind, type, buf });
      }
    } catch {
      /* absent asset — the synth cue stays in charge */
    } finally {
      this.assetDone += 1;
      this.onAssetsLoaded?.();
    }
  }

  _ingestPending() {
    if (!this.ctx || !this._pending.length) return;
    const items = this._pending;
    this._pending = [];
    items.forEach(({ kind, type, buf }) => {
      this.ctx
        .decodeAudioData(buf)
        .then((decoded) => this._store(kind, type, decoded))
        .catch(() => {});
    });
  }

  _store(kind, type, decoded) {
    if (kind === "music") {
      this.musicBuffer = decoded;
    } else {
      this.samples[type] = decoded;
      this.sampleGain[type] = this._normGain(decoded);
    }
    this.onAssetsLoaded?.();
  }

  /** Peak-normalises a sample so mixed real SFX sit at a consistent level. */
  _normGain(buffer) {
    let peak = 0;
    for (let c = 0; c < buffer.numberOfChannels; c += 1) {
      const d = buffer.getChannelData(c);
      for (let i = 0; i < d.length; i += 1) {
        const a = d[i] < 0 ? -d[i] : d[i];
        if (a > peak) peak = a;
      }
    }
    if (peak < 0.001) return 0.8;
    return Math.min(1.6, 0.9 / peak);
  }

  /** Gates both the looping music track and the synth pad bed. */
  setMusicEnabled(on) {
    this.musicEnabled = on;
    this.bedEnabled = on;
    if (!on) {
      this.stopMusicSource();
      this.stopBed();
    } else if (this.ctx) {
      this.startBed(this.bedFreq);
    }
    this.duckForVoice();
  }

  stopMusicSource() {
    if (this.musicSource) {
      const src = this.musicSource;
      this.musicSource = null;
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
      try {
        src.disconnect();
      } catch {
        /* already disconnected */
      }
    }
    this._musicTl = null;
    this._musicCtxStart = null;
  }

  /** Looping music bed, kept in step with the transport like the voice-over. */
  syncMusic(t, playing) {
    if (!this.ctx || !this.musicBuffer || !this.enabled || !this.musicEnabled) {
      if (this.musicSource) this.stopMusicSource();
      return;
    }
    if (!playing || this.ctx.state !== "running") {
      if (this.musicSource) this.stopMusicSource();
      return;
    }
    const now = this.ctx.currentTime;
    if (this.musicSource && this._musicTl != null) {
      const expected = this._musicTl + (now - this._musicCtxStart);
      if (Math.abs(expected - t) <= 0.25 && t >= this._musicTl - 0.001) return;
      this.stopMusicSource();
    }
    const dur = this.musicBuffer.duration;
    const src = this.ctx.createBufferSource();
    src.buffer = this.musicBuffer;
    src.loop = true;
    src.connect(this.musicBus);
    src.start(0, dur > 0 ? t % dur : 0);
    this.musicSource = src;
    this._musicTl = t;
    this._musicCtxStart = now;
  }

  /** True once the context is actually capable of making sound. */
  get ready() {
    return Boolean(this.ctx && this.ctx.state === "running");
  }

  get voiceReady() {
    return Boolean(this.voiceBuffer);
  }

  /**
   * Fetches the narration track. If the AudioContext already exists the track
   * is decoded immediately; otherwise the raw bytes are held until `ensure()`
   * runs (i.e. until the first user gesture unlocks audio).
   */
  async loadVoice(url) {
    if (this.voiceBuffer) return this.voiceBuffer;
    if (this._voiceDecode) return this._voiceDecode;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`voiceover ${res.status}`);
    const ab = await res.arrayBuffer();
    if (this.ctx) {
      this.voiceBuffer = await this.ctx.decodeAudioData(ab);
      this.onVoiceReady?.(this.voiceBuffer);
      this.duckForVoice();
      return this.voiceBuffer;
    }
    this._voicePending = ab;
    return null;
  }

  /** Resolves once the narration buffer is decoded (loading it first if needed). */
  async ensureVoice(url) {
    if (this.voiceBuffer) return this.voiceBuffer;
    if (url) await this.loadVoice(url);
    this.ensure();
    return this._voiceDecode || this.voiceBuffer;
  }

  _decodePendingVoice() {
    if (!this.ctx || this.voiceBuffer || this._voiceDecode || !this._voicePending) return;
    const ab = this._voicePending;
    this._voicePending = null;
    this._voiceDecode = this.ctx
      .decodeAudioData(ab)
      .then((decoded) => {
        this.voiceBuffer = decoded;
        this._voiceDecode = null;
        this.onVoiceReady?.(decoded);
        this.duckForVoice();
        return decoded;
      })
      .catch((err) => {
        this._voiceDecode = null;
        this.onVoiceError?.(err);
        return null;
      });
  }

  setVoiceEnabled(on) {
    this.voiceEnabled = on;
    if (!on) this.stopVoiceSource();
    this.duckForVoice();
  }

  stopVoiceSource() {
    if (this.voiceSource) {
      const src = this.voiceSource;
      this.voiceSource = null;
      try {
        src.onended = null;
        src.stop();
      } catch {
        /* already stopped */
      }
      try {
        src.disconnect();
      } catch {
        /* already disconnected */
      }
    }
    this._voiceTl = null;
    this._voiceCtxStart = null;
  }

  /**
   * Keeps the narration in lock-step with the timeline. Called every frame:
   * starts the buffer at `t`, pauses with the transport, and re-seeks (rather
   * than drifting) when the scrubber jumps.
   */
  syncVoice(t, playing) {
    if (!this.ctx || !this.voiceBuffer || !this.enabled || !this.voiceEnabled) {
      if (this.voiceSource) this.stopVoiceSource();
      return;
    }
    if (!playing || this.ctx.state !== "running") {
      if (this.voiceSource) this.stopVoiceSource();
      return;
    }
    const now = this.ctx.currentTime;
    if (this.voiceSource && this._voiceTl != null) {
      const expected = this._voiceTl + (now - this._voiceCtxStart);
      if (Math.abs(expected - t) <= 0.25 && t >= this._voiceTl - 0.001) return;
      this.stopVoiceSource();
    }
    const dur = this.voiceBuffer.duration;
    if (t >= dur) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.voiceBuffer;
    src.connect(this.voiceBus);
    src.start(0, Math.max(0, Math.min(t, dur - 0.02)));
    this.voiceSource = src;
    this._voiceTl = t;
    this._voiceCtxStart = now;
    src.onended = () => {
      if (this.voiceSource === src) this.voiceSource = null;
    };
  }

/**
   * Ducks the synth bed ~8 dB and the music bed further while narration is on
   * top of them, then restores. Keeps the voice-over the loudest element.
   */
  duckForVoice() {
    if (!this.ctx) return;
    const voiceOn = this.voiceEnabled && this.voiceBuffer;
    const now = this.ctx.currentTime;
    if (this.bedBus) this.bedBus.gain.setTargetAtTime(voiceOn ? 0.05 : 0.12, now, 0.3);
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(voiceOn ? 0.055 : 0.14, now, 0.45);
  }

  get stream() {
    return this.streamDest ? this.streamDest.stream : null;
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master) {
      this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05);
    }
    if (!on && this.bedBus) {
      this.bedBus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
  }

  /** Fire a one-shot effect. */
  trigger(type, at = 0) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + at;
    const out = this.sfxBus;

    // Real sample takes priority; the synth cue below is the fallback.
    const sample = this.samples[type];
    if (sample) {
      const src = ctx.createBufferSource();
      src.buffer = sample;
      src.playbackRate.value = 0.97 + Math.random() * 0.06;
      const g = ctx.createGain();
      g.gain.value = this.sampleGain[type] ?? 0.8;
      src.connect(g).connect(out);
      src.start(t0);
      return;
    }

    buildSynthCue(ctx, out, type, t0, { noise: this.noise });
  }

  /** Sustained pad; retunes smoothly between scenes. */
  startBed(freq = 110) {
    if (!this.ctx || !this.bedEnabled) return;
    this.bedFreq = freq;
    if (this.bed) {
      this.bed.forEach((osc, i) => {
        osc.frequency.setTargetAtTime(freq * (i === 1 ? 1.5 : 1), this.ctx.currentTime, 0.6);
      });
      const base = this.voiceEnabled && this.voiceBuffer ? 0.05 : 0.12;
      this.bedBus.gain.setTargetAtTime(base, this.ctx.currentTime, 0.6);
      return;
    }
    const ctx = this.ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 520;
    filter.Q.value = 0.6;

    const bed = [1, 1.5].map((mult) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.value = mult === 1 ? 0.5 : 0.18;
      osc.connect(g).connect(filter);
      osc.start();
      return osc;
    });

    // Slow amplitude breathing, applied to a gain stage in the signal path
    // (never to bedBus.gain directly) so the level can't swing negative and
    // flip phase — that was the source of the weird pulsing drone.
    const trem = ctx.createGain();
    trem.gain.value = 1;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.12;
    lfo.connect(lfoGain).connect(trem.gain);
    lfo.start();

    filter.connect(trem).connect(this.bedBus);
    this.bed = bed;
    this.bedTrem = trem;
    const base = this.voiceEnabled && this.voiceBuffer ? 0.05 : 0.12;
    this.bedBus.gain.setTargetAtTime(base, ctx.currentTime, 1.2);
  }

  stopBed() {
    if (this.bedBus && this.ctx) {
      this.bedBus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
    }
  }
}

export const audio = new AudioEngine();
