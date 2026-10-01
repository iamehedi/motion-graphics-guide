import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SCENES } from "./promo/scenes.js";
import { TOTAL_SECONDS, resolveTime, renderFrame, toBn } from "./promo/renderer.js";
import { createBackdrop } from "./promo/background.js";
import { audio, SFX_FILES } from "./promo/audio.js";
import { Exporter, detectFormats, downloadBlob } from "./promo/exporter.js";
import { exportOffline, detectOfflineExport } from "./promo/offline-export.js";
import { FONT_FAMILY } from "./promo/core.js";
import "./styles.css";

const FORMATS = {
  "9:16": { w: 1080, h: 1920, label: "৯:১৬ (রিলস)" },
  "16:9": { w: 1920, h: 1080, label: "১৬:৯ (ইউটিউব)" },
};

const BED = [110, 98, 116.54, 87.31, 103.83, 92.5];

const VO_URL = "/voiceover.mp3";

const QUALITY = [
  { label: "সর্বোচ্চ", bitrate: 50_000_000 },
  { label: "উচ্চ", bitrate: 16_000_000 },
  { label: "মাঝারি", bitrate: 10_000_000 },
  { label: "হালকা", bitrate: 5_000_000 },
];

const FPS_OPTIONS = [30, 60, 100];

const fmtClock = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${toBn(m)}:${toBn(String(sec).padStart(2, "0"))}`;
};

const fmtSize = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function App() {
  const canvasRef = useRef(null);
  const timeRef = useRef(0);
  const playingRef = useRef(true);
  const imagesRef = useRef({});
  const backdropRef = useRef(null);
  const cuesRef = useRef({ scene: -1, fired: new Set() });
  const exporterRef = useRef(null);
  const soundRef = useRef(true);
  const overlaysRef = useRef(true);
  const voiceRef = useRef(true);
  const musicRef = useRef(true);
  const drawErrorRef = useRef(false);
  const exportingRef = useRef(false);

  const [format, setFormat] = useState("9:16");
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [overlays, setOverlays] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [voStatus, setVoStatus] = useState("loading");
  const [musicOn, setMusicOn] = useState(true);
  const [sfxStatus, setSfxStatus] = useState("loading");
  const [audioLocked, setAudioLocked] = useState(true);
  const [fps, setFps] = useState(100);
  const [quality, setQuality] = useState(0);
  const [recording, setRecording] = useState(false);
  const [offline, setOffline] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const bare = useMemo(
    () => new URLSearchParams(window.location.search).get("bare") === "1",
    []
  );
  const dims = FORMATS[format];
  const formats = useMemo(() => detectFormats(), []);
  const offlineFormats = useMemo(() => detectOfflineExport(), []);
  const current = resolveTime(time);
  const offlinePct = offlineProgress
    ? Math.round((offlineProgress.done / Math.max(1, offlineProgress.total)) * 100)
    : 0;
  const busy = recording || offline;

  /* ------------------------------------------------ images */
  useEffect(() => {
    const names = [...new Set(SCENES.map((s) => s.shot).filter(Boolean))];
    names.forEach((name) => {
      const img = new Image();
      img.onerror = () => {
        imagesRef.current[name] = null;
      };
      img.src = `/screens/${name}.png`;
      imagesRef.current[name] = img;
    });

    // App logo, drawn wherever the promo shows the app icon.
    const icon = new Image();
    icon.onerror = () => {
      imagesRef.current["app-icon"] = null;
    };
    icon.src = "/app_icon.png";
    imagesRef.current["app-icon"] = icon;
  }, []);

  /* ------------------------------------------------ voice-over */
  useEffect(() => {
    audio.onVoiceReady = () => setVoStatus("ready");
    audio.onVoiceError = () => setVoStatus("error");
    audio.loadVoice(VO_URL)
      .then((buf) => {
        if (buf) setVoStatus("ready");
      })
      .catch(() => setVoStatus("error"));

    const report = () => {
      const n = Object.keys(audio.samples).length;
      setSfxStatus(n === 0 ? "সিন্থ ফলব্যাক" : `${n}/${Object.keys(SFX_FILES).length} স্যাম্পল`);
    };
    audio.onAssetsLoaded = report;
    audio.loadAssets().then(report).catch(report);
  }, []);

  /* ------------------------------------------------ audio unlock */
  // Browsers keep the AudioContext suspended until a user gesture. The promo
  // auto-plays its visuals, so without this any SFX / music / voice-over stays
  // silent until a specific control happens to be clicked.
  useEffect(() => {
    const unlock = () => {
      const ctx = audio.ensure();
      if (!ctx) return;
      ctx
        .resume()
        .then(() => {
          audio.setEnabled(soundRef.current);
          audio.setVoiceEnabled(voiceRef.current);
          audio.setMusicEnabled(musicRef.current);
          if (soundRef.current) {
            audio.startBed(BED[resolveTime(timeRef.current).index % BED.length]);
          }
          // let the current scene's cues fire now that audio is actually live
          cuesRef.current = { scene: -1, fired: new Set() };
          setAudioLocked(false);
        })
        .catch(() => {});
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  /* ------------------------------------------------ url params (frame capture) */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("t");
    if (t !== null) {
      timeRef.current = Math.max(0, Math.min(TOTAL_SECONDS, parseFloat(t) || 0));
      playingRef.current = false;
      setPlaying(false);
      setTime(timeRef.current);
    }
    const f = p.get("format");
    if (f && FORMATS[f]) setFormat(f);
  }, []);

  /* ------------------------------------------------ render + audio loop */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: false });
    let raf = 0;
    let last = performance.now();
    let uiAcc = 0;

    const tickAudio = (T) => {
      const { index, local } = resolveTime(T);
      const st = cuesRef.current;
      if (st.scene !== index) {
        st.scene = index;
        st.fired = new Set();
        if (soundRef.current && audio.ctx) audio.startBed(BED[index % BED.length]);
      }
      const cues = SCENES[index].cues || [];
      for (let i = 0; i < cues.length; i += 1) {
        if (local * 1000 >= cues[i].at && !st.fired.has(i)) {
          st.fired.add(i);
          if (soundRef.current) audio.trigger(cues[i].type);
        }
      }
    };

    const frame = (now) => {
      // While the deterministic export owns the CPU, leave the preview alone.
      if (exportingRef.current) {
        last = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (playingRef.current) {
        timeRef.current += dt;

        if (exporterRef.current && timeRef.current >= TOTAL_SECONDS) {
          timeRef.current = TOTAL_SECONDS;
          playingRef.current = false;
          setPlaying(false);
          const ex = exporterRef.current;
          exporterRef.current = null;
          ex.stop().then((res) => {
            if (!res) return;
            const url = downloadBlob(res.blob, `cst-portal-promo.${res.ext}`);
            setResult({ url, ext: res.ext, size: res.blob.size });
            setRecording(false);
          });
        } else if (!exporterRef.current && timeRef.current >= TOTAL_SECONDS) {
          timeRef.current = 0;
          cuesRef.current = { scene: -1, fired: new Set() };
        }
      }

      const T = Math.max(0, Math.min(timeRef.current, TOTAL_SECONDS));
      if (!backdropRef.current) backdropRef.current = createBackdrop(3);
      audio.syncVoice(T, playingRef.current);
      audio.syncMusic(T, playingRef.current);

      try {
        renderFrame(ctx, canvas.width, canvas.height, T, {
          images: imagesRef.current,
          backdrop: backdropRef.current,
          overlays: overlaysRef.current,
        });
        tickAudio(T);
      } catch (err) {
        // Surface draw failures instead of leaving a silently frozen canvas.
        console.error("render error", err);
        if (!drawErrorRef.current) {
          drawErrorRef.current = true;
          setError(`রেন্ডার ত্রুটি: ${err?.message || err}`);
        }
      }

      uiAcc += dt;
      if (uiAcc > 0.08) {
        uiAcc = 0;
        setTime(T);
      }

      raf = requestAnimationFrame(frame);
    };

    // Wait for the Lipighor webfont so frames/export never bake in a fallback.
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      raf = requestAnimationFrame(frame);
    };
    const stall = setTimeout(start, 2000);
    if (document.fonts?.load) {
      Promise.all(
        [400, 500, 600, 700].map((w) =>
          document.fonts
            .load(`${w} 16px ${FONT_FAMILY}`, "সিএসটি পোর্টাল ০১২৩ CST")
            .catch(() => null)
        )
      ).then(start);
    } else {
      start();
    }

    return () => {
      started = true;
      clearTimeout(stall);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ------------------------------------------------ transport */
  const togglePlay = useCallback(() => {
    const ctx = audio.ensure();
    if (ctx) {
      ctx.resume();
      if (soundRef.current && !audio.bed) audio.startBed(BED[resolveTime(timeRef.current).index % BED.length]);
    }
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  }, []);

  const seek = useCallback((seconds) => {
    timeRef.current = Math.max(0, Math.min(TOTAL_SECONDS, seconds));
    cuesRef.current = { scene: -1, fired: new Set() };
    setTime(timeRef.current);
  }, []);

  const restart = useCallback(() => {
    seek(0);
    playingRef.current = true;
    setPlaying(true);
  }, [seek]);

  const step = useCallback(
    (dir) => {
      const { index } = resolveTime(timeRef.current);
      const target = Math.max(0, Math.min(SCENES.length - 1, index + dir));
      const starts = SCENES.slice(0, target).reduce((a, s) => a + s.duration / 1000, 0);
      seek(starts);
    },
    [seek]
  );

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key.toLowerCase() === "r") restart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, step, restart]);

  /* ------------------------------------------------ export */
  const startRecording = async () => {
    setError(null);
    if (!formats.supported) {
      setError("এই ব্রাউজারে ভিডিও রেকর্ডিং সাপোর্ট করে না। Chrome বা Brave ব্যবহার করুন।");
      return;
    }
    if (document.fonts?.ready) await document.fonts.ready;
    const ctx = audio.ensure();
    if (ctx) await ctx.resume();
    audio.setVoiceEnabled(voiceRef.current);
    audio.setMusicEnabled(musicRef.current);
    await audio.ensureVoice(VO_URL);
    if (soundRef.current && ctx) audio.startBed(BED[0]);

    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    seek(0);
    playingRef.current = true;
    setPlaying(true);
    setRecording(true);

    const exporter = new Exporter(() => canvasRef.current, audio);
    try {
      exporter.start({ fps, bitrate: QUALITY[quality].bitrate });
      exporterRef.current = exporter;
    } catch (err) {
      setRecording(false);
      setError(String(err?.message || err));
    }
  };

  /**
   * Deterministic WebCodecs export: draws every frame once at a fixed 1/fps
   * step, pre-mixes the audio offline, and muxes an MP4 with mp4-muxer. It is
   * not bound to wall-clock time and never drops a frame when the tab loses
   * focus.
   */
  const startOfflineExport = async () => {
    setError(null);
    if (!offlineFormats.supported) {
      setError(
        "এই ব্রাউজারে নির্ভুল এক্সপোর্ট সাপোর্ট করে না — WebCodecs সহ সর্বশেষ Chrome বা Edge ব্যবহার করুন।"
      );
      return;
    }
    if (document.fonts?.ready) await document.fonts.ready;
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);

    // Pause the live transport: the offline renderer draws its own frames.
    playingRef.current = false;
    setPlaying(false);
    exportingRef.current = true;
    setOffline(true);
    setOfflineProgress({ phase: "audio-render", done: 0, total: 1 });

    // Decode the narration up-front so the offline mix can reuse it; if this
    // fails the offline path fetches the track itself.
    try {
      const ctx = audio.ensure();
      if (ctx) await ctx.resume();
      await audio.ensureVoice(VO_URL);
    } catch {
      /* offline renderer re-fetches the voice-over */
    }

    try {
      const res = await exportOffline({
        width: dims.w,
        height: dims.h,
        fps,
        bitrate: QUALITY[quality].bitrate,
        images: imagesRef.current,
        overlays: overlaysRef.current,
        voiceUrl: VO_URL,
        soundEnabled: soundRef.current,
        voiceEnabled: voiceRef.current,
        musicEnabled: musicRef.current,
        bedFreqs: BED,
        existingVoice: audio.voiceBuffer,
        existingMusic: audio.musicBuffer,
        existingSamples: audio.samples,
        existingSampleGain: audio.sampleGain,
        onProgress: (p) => setOfflineProgress(p),
      });
      const url = downloadBlob(res.blob, `cst-portal-promo.${res.ext}`);
      setResult({
        url,
        ext: res.ext,
        size: res.blob.size,
        detail: `${toBn(res.frames)} ফ্রেম · ${res.videoCodec}${res.audioCodec ? ` + ${res.audioCodec}` : " (অডিও নেই)"}`,
      });
    } catch (err) {
      setError(`নির্ভুল এক্সপোর্ট ব্যর্থ: ${err?.message || err}`);
    } finally {
      exportingRef.current = false;
      setOffline(false);
      setOfflineProgress(null);
    }
  };

  const toggleSound = (on) => {
    setSoundOn(on);
    soundRef.current = on;
    if (on) {
      const ctx = audio.ensure();
      if (ctx) {
        ctx.resume();
        audio.setEnabled(true);
        audio.startBed(BED[resolveTime(timeRef.current).index % BED.length]);
      }
    } else {
      audio.setEnabled(false);
    }
  };

  const toggleOverlays = (on) => {
    setOverlays(on);
    overlaysRef.current = on;
  };

  const toggleVoice = (on) => {
    setVoiceOn(on);
    voiceRef.current = on;
    audio.setVoiceEnabled(on);
    if (on) {
      const ctx = audio.ensure();
      if (ctx) ctx.resume();
    }
  };

  const toggleMusic = (on) => {
    setMusicOn(on);
    musicRef.current = on;
    audio.setMusicEnabled(on);
    if (on) {
      const ctx = audio.ensure();
      if (ctx) ctx.resume();
    }
  };

  /* ------------------------------------------------ view */
  return (
    <div className={`app${bare ? " app--bare" : ""}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand__dot" aria-hidden="true" />
          সিএসটি পোর্টাল
          <small>প্রোমো স্টুডিও</small>
        </div>
        <div className="topbar__spacer" />
        <div className="clock">
          {fmtClock(time)} <em>/ {fmtClock(TOTAL_SECONDS)}</em>
        </div>
        <div className="scene-tag">
          {toBn(current.index + 1)} / {toBn(SCENES.length)} · {SCENES[current.index].chip}
        </div>
      </header>

      <main className="stage">
        <canvas
          ref={canvasRef}
          width={dims.w}
          height={dims.h}
          className="screen"
          aria-label="প্রোমো প্রিভিউ"
        />
        {audioLocked && !recording && !offline && (
          <div
            className="rec-badge"
            style={{ background: "rgba(20,20,32,0.94)", boxShadow: "0 0 30px rgba(124,92,255,0.45)" }}
          >
            <span aria-hidden="true">🔊</span> সাউন্ড চালু করতে ট্যাপ করুন
          </div>
        )}
        {recording && (
          <div className="rec-badge">
            <span className="rec-dot" aria-hidden="true" />
            রেকর্ড হচ্ছে…
          </div>
        )}
        {offline && (
          <div
            className="rec-badge"
            style={{ background: "rgba(60,40,140,0.94)", boxShadow: "0 0 30px rgba(124,92,255,0.5)" }}
          >
            <span aria-hidden="true">⚡</span> নির্ভুল এক্সপোর্ট · {toBn(offlinePct)}%
          </div>
        )}
      </main>

      <footer className="deck">
        <div className="row">
          <button type="button" className="btn btn--primary" onClick={togglePlay}>
            {playing ? "❚❚ পজ" : "▶ প্লে"}
          </button>
          <button type="button" className="btn" onClick={() => step(-1)}>
            ⟨ আগের
          </button>
          <button type="button" className="btn" onClick={() => step(1)}>
            পরের ⟩
          </button>
          <button type="button" className="btn" onClick={restart}>
            ↺ শুরু থেকে
          </button>

          <label className="switch">
            <input
              type="checkbox"
              checked={soundOn}
              onChange={(e) => toggleSound(e.target.checked)}
            />
            <span>সাউন্ড</span>
          </label>
          <label className="switch">
            <input
              type="checkbox"
              checked={voiceOn}
              onChange={(e) => toggleVoice(e.target.checked)}
            />
            <span>ভয়েসওভার</span>
          </label>
          <label className="switch">
            <input
              type="checkbox"
              checked={musicOn}
              onChange={(e) => toggleMusic(e.target.checked)}
            />
            <span>মিউজিক</span>
          </label>
          <label className="switch">
            <input
              type="checkbox"
              checked={overlays}
              onChange={(e) => toggleOverlays(e.target.checked)}
            />
            <span>ওভারলে</span>
          </label>

          <div className="seg" role="group" aria-label="ফরম্যাট">
            {Object.entries(FORMATS).map(([key, f]) => (
              <button
                key={key}
                type="button"
                className={`seg__btn${format === key ? " is-on" : ""}`}
                onClick={() => setFormat(key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <input
          className="scrub"
          type="range"
          min={0}
          max={TOTAL_SECONDS}
          step={0.05}
          value={time}
          onChange={(e) => seek(parseFloat(e.target.value))}
          aria-label="টাইমলাইন"
        />

        <div className="scenes">
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`chip${i === current.index ? " is-on" : ""}`}
              style={{ "--chip": s.accent }}
              onClick={() =>
                seek(SCENES.slice(0, i).reduce((a, x) => a + x.duration / 1000, 0))
              }
              title={s.title}
            >
              {toBn(i + 1)} · {s.chip}
            </button>
          ))}
        </div>

        <div className="export">
          <div className="export__head">
            <strong>ভিডিও এক্সপোর্ট</strong>
            <span className="export__fmt">
              {formats.mp4
                ? `MP4 সাপোর্টেড · ${formats.mp4.label}`
                : formats.supported
                  ? "MP4 সাপোর্ট নেই — WebM সেভ হবে"
                  : "রেকর্ডিং সাপোর্ট নেই"}
            </span>
            <span className="export__fmt">
              {voStatus === "ready"
                ? "ভয়েসওভার প্রস্তুত"
                : voStatus === "error"
                  ? "ভয়েসওভার লোড ব্যর্থ"
                  : "ভয়েসওভার লোড হচ্ছে…"}
            </span>
            <span className="export__fmt">
              {sfxStatus === "loading" ? "সাউন্ড লোড হচ্ছে…" : `সাউন্ড: ${sfxStatus}`}
            </span>
          </div>

          <div className="export__body">
            <label className="field">
              <span>ফ্রেম রেট</span>
              <select
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                disabled={busy}
              >
                {FPS_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {toBn(f)} fps
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>কোয়ালিটি</span>
              <select
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                disabled={busy}
              >
                {QUALITY.map((q, i) => (
                  <option key={q.label} value={i}>
                    {q.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn--offline"
              onClick={startOfflineExport}
              disabled={busy || !offlineFormats.supported}
              title={
                offlineFormats.supported
                  ? "প্রতিটি ফ্রেম একবার রেন্ডার — ডুপ্লিকেট বা ড্রপ নেই"
                  : "এই ব্রাউজারে WebCodecs নেই"
              }
            >
              {offline
                ? `⚡ এক্সপোর্ট হচ্ছে… ${toBn(offlinePct)}%`
                : `⚡ নির্ভুল এক্সপোর্ট (${toBn(fps)} fps)`}
            </button>
            <button
              type="button"
              className="btn btn--record"
              onClick={startRecording}
              disabled={busy}
            >
              {recording ? "রেকর্ড হচ্ছে…" : "MP4 রেকর্ড করুন"}
            </button>
            {result && (
              <a className="btn btn--link" href={result.url} download={`cst-portal-promo.${result.ext}`}>
                ⬇ ডাউনলোড {result.ext.toUpperCase()} ({fmtSize(result.size)})
              </a>
            )}
          </div>

          {offline && (
            <div className="export__progress" aria-live="polite">
              <div className="export__bar" style={{ width: `${offlinePct}%` }} />
              <span className="export__pct">
                {offlineProgress?.phase === "audio-render"
                  ? "অডিও মিক্স হচ্ছে…"
                  : `ফ্রেম এনকোড · ${toBn(offlineProgress?.done ?? 0)}/${toBn(offlineProgress?.total ?? 0)}`}
              </span>
            </div>
          )}

          {result?.detail && <p className="export__note">{result.detail}</p>}

          <p className="export__note">
            ⚡ <strong>নির্ভুল এক্সপোর্ট</strong> প্রতিটি ফ্রেম একবার রেন্ডার করে — রিয়েল-টাইমে
            বাঁধা নয়, ফ্রেম ডুপ্লিকেট বা ড্রপ হয় না, ট্যাব বদলালেও থামে না। রেকর্ডিং
            বাটনটি পুরোনো রিয়েল-টাইম মেথড, বিকল্প হিসেবে থাকল।
          </p>
          {!offlineFormats.supported && (
            <p className="export__note" style={{ color: "#fbbf24" }}>
              এই ব্রাউজারে WebCodecs নেই, তাই নির্ভুল এক্সপোর্ট বন্ধ। Chrome/Edge-এ খুলুন।
            </p>
          )}
          {fps >= 100 && offlineFormats.supported && (
            <p className="export__note" style={{ color: "#fbbf24" }}>
              নোট: ১০০ fps-এ আসল (ডুপ্লিকেট-বিহীন) ফ্রেম পেতে ⚡ নির্ভুল এক্সপোর্ট ব্যবহার করুন;
              রেকর্ডিং মেথডে রিফ্রেশ রেটের কারণে ফ্রেম ডুপ্লিকেট হয়।
            </p>
          )}
          {error && <p className="export__error">{error}</p>}
        </div>

        <p className="deck__credit">
          ফন্ট: <a href="https://lipighor.com/" target="_blank" rel="noreferrer">আলিনুর স্বপ্নচারী — Lipighor</a>
        </p>
      </footer>
    </div>
  );
}
