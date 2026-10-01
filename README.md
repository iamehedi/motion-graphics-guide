# Motion Graphics Studio (Vite + React + Canvas)

A tiny **motion-graphics video studio that draws every frame procedurally on a
`<canvas>`** and exports it as MP4 — no After Effects, no video editor, no
frame images on disk. The whole video is a function of time:

```js
renderFrame(ctx, W, H, T, { images, backdrop, overlays });  // T = seconds
```

The preview loop, the real-time `MediaRecorder` export and the deterministic
WebCodecs export all call this **same** function, so what you preview is
exactly what lands in the file.

This repo ships a promo built for one app, but the engine is generic — swap the
script/palette/assets and you can build **any** motion graphic with it.

> 📘 **Read the full architecture guide: [`docs/MOTION-GRAPHICS-GUIDE.md`](docs/MOTION-GRAPHICS-GUIDE.md)**
> (in Bengali — covers every file, the timeline math, and a step-by-step recipe
> for building a brand-new video from scratch.)

---

## Quick start

```bash
npm install
npm run dev        # dev server: preview + studio controls
npm run build      # production build into dist/
npm run preview    # preview the build (port 4173)
```

Open the dev URL. You get a live canvas preview plus:

- **Format** — 9:16 (1080×1920, Reels) or 16:9 (1920×1080, YouTube)
- **FPS** — 30 / 60 / 100
- **Quality** — 50 / 16 / 10 / 5 Mbps
- **🔴 Record** — real-time `MediaRecorder` capture (works in most browsers;
  Firefox exports WebM)
- **⚡ Deterministic export** — fixed-step WebCodecs render, faster than real
  time, no dropped frames (requires **Chrome/Edge**)

Transport: `Space` play/pause, `←`/`→` step scenes, `r` restart.
URL params: `?t=31.161` freeze at a time, `?format=16:9`, `?bare=1` canvas only.

---

## How it works (30-second version)

```
src/promo/
  core.js            drawing primitives, easings, fonts, text helpers
  background.js      animated backdrop (topographic terrain, grid, rays, …)
  scenes.js          ◄ THE SCRIPT: SCENES[] + one painter per scene
  transitions.js     per-scene cut effects + compositor
  renderer.js        timeline math (STARTS/DUR) + renderFrame()
  audio.js           synthesised SFX, ambient bed, voice-over bus, ducking
  exporter.js        real-time MediaRecorder export
  offline-export.js  deterministic WebCodecs + mp4-muxer export
src/App.jsx          studio shell: transport, render loop, export panel
```

Scene durations are timed to the voice-over lines: each scene runs exactly from
one narration line to the next, so every cut lands on the beat.

See the guide for the full breakdown, the timeline formulas
(`STARTS[i] = STARTS[i-1] + DUR[i-1]`, cue time `STARTS[i] + cue.at/1000`) and a
recipe for adding scenes or starting a new project.

---

## Assets are optional (this repo is content-less)

The engine is written to run with **no private media at all**, so the repo stays
free of copyrighted content:

| Missing asset | What happens |
| --- | --- |
| `public/screens/*.png` | device frame renders empty (graceful fallback) |
| `public/app_icon.png` | icon draw is skipped |
| `public/fonts/*.ttf` | falls back to `Noto Sans Bengali` / system font |
| `public/audio/*.mp3` | synthesised SFX play instead (always available) |
| `public/voiceover.mp3` | voice-over is silent, visuals + SFX still work |

`.gitignore` excludes the private media (`voiceover.mp3`, the TTF fonts, app
screenshots, `images/`, `audio-pack/`, the root ElevenLabs mp3). Clone the repo,
drop in your own files with the same names under `public/`, and everything comes
back. See §7 of the guide for the full asset/licensing checklist.

---

## Browser support

| Path | Chrome / Edge | Safari | Firefox |
| --- | --- | --- | --- |
| Live preview + SFX | ✅ | ✅ | ✅ |
| 🔴 Real-time MP4 export | ✅ 111+ | ✅ | WebM only |
| ⚡ Deterministic export | ✅ | ❌ | ❌ |

---

## Tech

Vite 5 · React 18 · plain JavaScript (no TypeScript, no Tailwind) ·
[`mp4-muxer`](https://www.npmjs.com/package/mp4-muxer) for MP4 muxing ·
WebCodecs + `OfflineAudioContext` for deterministic export.
