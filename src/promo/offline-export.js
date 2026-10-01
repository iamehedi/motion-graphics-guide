/**
 * Deterministic, faster-than-real-time export via WebCodecs + mp4-muxer.
 *
 * Unlike the MediaRecorder path in `exporter.js`, this does not capture a live
 * canvas stream. Instead it draws every frame of the timeline exactly once at a
 * fixed 1/fps step and hands it straight to a `VideoEncoder`, so a 100 fps file
 * really contains 100 unique frames per second — no duplicated frames from
 * `requestAnimationFrame` and no dropped frames when the tab is backgrounded.
 *
 * The audio track is pre-mixed offline (OfflineAudioContext) from the same
 * synth graph the live preview uses, so the exported sound is byte-identical
 * (given the same seed) and never depends on the render loop's timing.
 */
import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { SCENES, TOTAL_DURATION } from "./scenes.js";
import { renderFrame } from "./renderer.js";
import { createBackdrop } from "./background.js";
import { buildSynthCue, buildBed, createNoiseBuffer } from "./audio.js";

export const TOTAL_SECONDS = TOTAL_DURATION / 1000;

/** Scene start offsets in seconds, derived from the scene durations. */
const STARTS = SCENES.reduce((acc, s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SCENES[i - 1].duration / 1000);
  return acc;
}, []);

/* ---------------------------------------------------------------- support */

export function detectOfflineExport() {
  const has = (name) => typeof window !== "undefined" && typeof window[name] !== "undefined";
  return {
    video: has("VideoEncoder"),
    audio: has("AudioEncoder"),
    offlineAudio: has("OfflineAudioContext") || has("webkitOfflineAudioContext"),
    get supported() {
      return this.video && this.offlineAudio;
    },
  };
}

/* ---------------------------------------------------------------- helpers */

/** Small deterministic PRNG so repeated exports sound identical. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

async function drainEncoder(encoder, max) {
  while (encoder.encodeQueueSize > max) await wait(1);
}

/**
 * H.264 profile/level candidates, best quality first. Level 5.1 covers
 * 1080×1920 @ 100 fps; lower levels are the fallback for stricter encoders.
 */
const VIDEO_CODECS = [
  { codec: "avc1.640033", label: "H.264 High 5.1" },
  { codec: "avc1.4d4033", label: "H.264 Main 5.1" },
  { codec: "avc1.420033", label: "H.264 Baseline 5.1" },
  { codec: "avc1.640032", label: "H.264 High 5.0" },
  { codec: "avc1.4d4032", label: "H.264 Main 5.0" },
  { codec: "avc1.640028", label: "H.264 High 4.0" },
  { codec: "avc1.420028", label: "H.264 Baseline 4.0" },
];

async function pickVideoConfig(width, height, fps, bitrate) {
  for (const c of VIDEO_CODECS) {
    const base = { codec: c.codec, width, height, bitrate, framerate: fps };
    try {
      const res = await VideoEncoder.isConfigSupported({ ...base, avc: { format: "avc" } });
      if (res?.supported) return { ...base, avc: { format: "avc" }, label: c.label };
    } catch {
      /* try the next profile */
    }
  }
  return null;
}

const AUDIO_CODECS = [
  { codec: "mp4a.40.2", muxCodec: "aac", label: "AAC-LC 192k" },
  { codec: "opus", muxCodec: "opus", label: "Opus 192k" },
];

async function pickAudioConfig(sampleRate, numberOfChannels) {
  for (const c of AUDIO_CODECS) {
    const config = { codec: c.codec, sampleRate, numberOfChannels, bitrate: 192_000 };
    try {
      const res = await AudioEncoder.isConfigSupported(config);
      if (res?.supported) return { ...config, muxCodec: c.muxCodec, label: c.label };
    } catch {
      /* try the next codec */
    }
  }
  return null;
}

/* ------------------------------------------------------------ offline audio */

async function fetchDecode(ctx, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const ab = await res.arrayBuffer();
  return ctx.decodeAudioData(ab);
}

/**
 * Recreates the live master chain (compressor → master gain) on an
 * OfflineAudioContext and schedules the whole sound design:
 * narration, looping music, the synth pad bed, and every scene cue.
 */
async function renderOfflineAudio({
  totalSeconds,
  sampleRate,
  voiceUrl,
  voiceEnabled,
  musicEnabled,
  bedFreqs,
  seed,
  existingVoice,
  existingMusic,
  existingSamples,
  existingSampleGain,
}) {
  const Ctor = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const frames = Math.ceil(totalSeconds * sampleRate);
  const ctx = new Ctor(2, frames, sampleRate);
  const rng = mulberry32(seed);

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 6;
  comp.attack.value = 0.004;
  comp.release.value = 0.22;

  const master = ctx.createGain();
  master.gain.value = 0.9;

  const sfxBus = ctx.createGain();
  sfxBus.gain.value = 1;
  const voiceBus = ctx.createGain();
  voiceBus.gain.value = 1;
  const bedBus = ctx.createGain();
  bedBus.gain.value = 0;
  const musicBus = ctx.createGain();
  musicBus.gain.value = 0;

  sfxBus.connect(comp);
  voiceBus.connect(comp);
  bedBus.connect(comp);
  musicBus.connect(comp);
  comp.connect(master);
  master.connect(ctx.destination);

  const noise = createNoiseBuffer(ctx, rng);

  // --- narration
  let voice = existingVoice && existingVoice.sampleRate === sampleRate ? existingVoice : null;
  if (!voice && voiceUrl) {
    try {
      voice = await fetchDecode(ctx, voiceUrl);
    } catch {
      voice = null;
    }
  }
  const ducked = Boolean(voice && voiceEnabled);
  if (voice && voiceEnabled) {
    const src = ctx.createBufferSource();
    src.buffer = voice;
    src.connect(voiceBus);
    src.start(0);
  }

  // --- looping music file (absent in this project → synth bed carries it)
  let music = existingMusic && existingMusic.sampleRate === sampleRate ? existingMusic : null;
  if (!music && musicEnabled) {
    try {
      music = await fetchDecode(ctx, "/audio/music.mp3");
    } catch {
      music = null;
    }
  }
  if (music && musicEnabled) {
    const src = ctx.createBufferSource();
    src.buffer = music;
    src.loop = true;
    src.connect(musicBus);
    musicBus.gain.value = ducked ? 0.055 : 0.14;
    src.start(0);
  }

  // --- synth pad bed, retuning at every scene boundary like the preview
  if (musicEnabled) {
    const base = ducked ? 0.05 : 0.12;
    const { bed } = buildBed(ctx, bedBus, bedFreqs[0], { base });
    STARTS.forEach((start, i) => {
      const f = bedFreqs[i % bedFreqs.length];
      bed.forEach((osc, k) => {
        osc.frequency.setTargetAtTime(f * (k === 1 ? 1.5 : 1), start, 0.6);
      });
    });
  }

  // --- one-shot cues
  SCENES.forEach((scene, i) => {
    const start = STARTS[i];
    (scene.cues || []).forEach((cue) => {
      const at = start + cue.at / 1000;
      if (at >= totalSeconds) return;
      const sample = existingSamples?.[cue.type];
      if (sample) {
        const src = ctx.createBufferSource();
        src.buffer = sample;
        const g = ctx.createGain();
        g.gain.value = existingSampleGain?.[cue.type] ?? 0.8;
        src.connect(g).connect(sfxBus);
        src.start(at);
        return;
      }
      buildSynthCue(ctx, sfxBus, cue.type, at, { noise, rng });
    });
  });

  return ctx.startRendering();
}

/* ------------------------------------------------------------- video encode */

async function encodeVideo({
  width,
  height,
  fps,
  bitrate,
  images,
  overlays,
  onProgress,
  muxer,
  signal,
}) {
  const config = await pickVideoConfig(width, height, fps, bitrate);
  if (!config) throw new Error("এই ব্রাউজারে H.264 WebCodecs এনকোডার পাওয়া যায়নি।");

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  const backdrop = createBackdrop(3);

  let encodeError = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (err) => {
      encodeError = err;
    },
  });
  encoder.configure(config);

  const totalFrames = Math.max(1, Math.round(TOTAL_SECONDS * fps));
  const keyInterval = Math.max(1, Math.round(fps * 2));
  const frameDuration = Math.round(1e6 / fps);

  for (let i = 0; i < totalFrames; i += 1) {
    if (signal?.aborted) throw new DOMException("export aborted", "AbortError");
    const t = Math.min(i / fps, TOTAL_SECONDS);
    renderFrame(ctx, width, height, t, { images, backdrop, overlays });
    const frame = new VideoFrame(canvas, {
      timestamp: Math.round((i * 1e6) / fps),
      duration: frameDuration,
    });
    encoder.encode(frame, { keyFrame: i % keyInterval === 0 });
    frame.close();

    if (encoder.encodeQueueSize > 8) await drainEncoder(encoder, 8);
    if (i % 5 === 0) {
      onProgress?.({ phase: "video", done: i + 1, total: totalFrames });
      await wait(0); // keep the UI responsive
    }
  }

  await encoder.flush();
  encoder.close();
  if (encodeError) throw encodeError;
  onProgress?.({ phase: "video", done: totalFrames, total: totalFrames });
  return { codec: config.label, frames: totalFrames };
}

/* ------------------------------------------------------------- audio encode */

async function encodeAudio({ audioBuffer, config, onProgress, muxer }) {
  const channels = Math.min(2, audioBuffer.numberOfChannels);
  const sampleRate = audioBuffer.sampleRate;
  const inputs = [];
  for (let c = 0; c < channels; c += 1) inputs.push(audioBuffer.getChannelData(c));

  let encodeError = null;
  const encoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (err) => {
      encodeError = err;
    },
  });
  encoder.configure({ ...config, numberOfChannels: channels });

  const total = audioBuffer.length;
  const BLOCK = 1024;
  for (let offset = 0; offset < total; offset += BLOCK) {
    const n = Math.min(BLOCK, total - offset);
    const data = new Float32Array(n * channels);
    for (let c = 0; c < channels; c += 1) data.set(inputs[c].subarray(offset, offset + n), c * n);
    const ad = new AudioData({
      format: "f32-planar",
      sampleRate,
      numberOfFrames: n,
      numberOfChannels: channels,
      timestamp: Math.round((offset / sampleRate) * 1e6),
      data,
    });
    encoder.encode(ad);
    ad.close();
    if (encoder.encodeQueueSize > 32) await drainEncoder(encoder, 32);
  }

  await encoder.flush();
  encoder.close();
  if (encodeError) throw encodeError;
  onProgress?.({ phase: "audio", done: total, total });
}

/* ------------------------------------------------------------------ public */

/**
 * Renders the promo deterministically and returns a finished MP4.
 *
 * @returns {Promise<{blob: Blob, ext: string, frames: number, videoCodec: string, audioCodec: string|null}>}
 */
export async function exportOffline({
  width,
  height,
  fps = 100,
  bitrate = 50_000_000,
  images = {},
  overlays = true,
  voiceUrl = null,
  soundEnabled = true,
  voiceEnabled = true,
  musicEnabled = true,
  bedFreqs = [110],
  seed = 0x5eed,
  existingVoice = null,
  existingMusic = null,
  existingSamples = null,
  existingSampleGain = null,
  onProgress,
  signal,
} = {}) {
  const support = detectOfflineExport();
  if (!support.video) {
    throw new Error("এই ব্রাউজারে WebCodecs ভিডিও এনকোডার নেই — সর্বশেষ Chrome/Edge ব্যবহার করুন।");
  }

  // 1) deterministic offline audio mix ---------------------------------------
  let audioBuffer = null;
  let audioConfig = null;
  if (support.offlineAudio && soundEnabled) {
    onProgress?.({ phase: "audio-render", done: 0, total: 1 });
    const sampleRate = existingVoice?.sampleRate || 48_000;
    try {
      audioBuffer = await renderOfflineAudio({
        totalSeconds: TOTAL_SECONDS,
        sampleRate,
        voiceUrl: voiceEnabled ? voiceUrl : null,
        voiceEnabled,
        musicEnabled,
        bedFreqs,
        seed,
        existingVoice,
        existingMusic,
        existingSamples,
        existingSampleGain,
      });
      if (audioBuffer && support.audio) {
        audioConfig = await pickAudioConfig(
          audioBuffer.sampleRate,
          Math.min(2, audioBuffer.numberOfChannels)
        );
      }
    } catch (err) {
      console.warn("offline audio render skipped:", err);
      audioBuffer = null;
      audioConfig = null;
    }
    onProgress?.({ phase: "audio-render", done: 1, total: 1 });
  }

  // 2) muxer ------------------------------------------------------------------
  // Fast Start keeps the moov atom first (better streaming playback) but needs
  // a second full copy of the file in memory. At 50 Mbps that is ~500 MB, so we
  // only enable it for small exports and otherwise write metadata at the end.
  const estBytes = (bitrate / 8) * TOTAL_SECONDS;
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: "avc", width, height, frameRate: fps },
    audio: audioConfig
      ? {
          codec: audioConfig.muxCodec,
          numberOfChannels: Math.min(2, audioBuffer.numberOfChannels),
          sampleRate: audioBuffer.sampleRate,
        }
      : undefined,
    fastStart: estBytes > 200_000_000 ? false : "in-memory",
    firstTimestampBehavior: "cross-track-offset",
  });

  // 3) video ------------------------------------------------------------------
  const { codec, frames } = await encodeVideo({
    width,
    height,
    fps,
    bitrate,
    images,
    overlays,
    onProgress,
    muxer,
    signal,
  });

  // 4) audio ------------------------------------------------------------------
  if (audioConfig) {
    await encodeAudio({ audioBuffer, config: audioConfig, onProgress, muxer });
  }

  // 5) finalize ---------------------------------------------------------------
  muxer.finalize();
  const blob = new Blob([target.buffer], { type: "video/mp4" });
  return {
    blob,
    ext: "mp4",
    frames,
    videoCodec: codec,
    audioCodec: audioConfig ? audioConfig.label : null,
  };
}
