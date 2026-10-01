# Motion Graphics Studio — সম্পূর্ণ আর্কিটেকচার গাইড

> এই ডকুমেন্টটা এই রিপোর **একমাত্র প্যাটার্ন** বোঝায়: একটা Vite + React অ্যাপ,
> যেটা কোনো ভিডিও-এডিটিং সফটওয়্যার ছাড়াই — শুধু `<canvas>`-এ কোড দিয়ে আঁকা
> ফ্রেমগুলো — থেকে পুরো একটা motion-graphics ভিডিও (MP4) বানায়।
>
> এই আর্কিটেকচার নিজে থেকে **CST Portal** নিয়ে বানানো, কিন্তু প্যাটার্নটা
> জেনেরিক। শুধু `src/promo/scenes.js` আর প্যালেট/অ্যাসেট বদলালেই তুমি
> **যেকোনো motion graphics** — প্রোডাক্ট প্রোমো, কোর্স ভিডিও, রিলস, ইউটিউব
> ইন্ট্রো, ডেটা-ভিজুয়ালাইজেশন — একই ইঞ্জিনে বানাতে পারবে।

---

## ০. এক নজরে ধারণা (Mental model)

ভিডিও = **সময়ের একটা ফাংশন**। অর্থাৎ, যেকোনো মুহূর্ত `T`-এর জন্য যদি তুমি
"এই মুহূর্তে পর্দায় কী থাকবে" বলে দিতে পারো, তাহলে ভিডিও বানানো শেষ।

এই রিপোতে ঠিক সেটাই আছে:

```
T (সেকেন্ড)  ──►  renderFrame(ctx, W, H, T, assets)  ──►  পর্দার এক ফ্রেম
```

- **প্রিভিউ**: `requestAnimationFrame` দিয়ে প্রতি vsync-এ `T` বাড়িয়ে আঁকা হয়।
- **এক্সপোর্ট (real-time)**: ক্যানভাস থেকে `MediaRecorder` স্ট্রিম ক্যাপচার।
- **এক্সপোর্ট (deterministic)**: প্রতি `1/fps` সেকেন্ডে `T` ঠিক ঠিক বসিয়ে
  এক-একটা ফ্রেম আঁকা হয় → `WebCodecs` + `mp4-muxer` → MP4।

তিনটাই **একই** `renderFrame` কল করে। এটাই পুরো ডিজাইনের মূল শক্তি — প্রিভিউ
আর এক্সপোর্ট কখনো আলাদা হয় না, তাই "প্রিভিউতে যা দেখছি, ফাইলে ঠিক তাই থাকবে"।

```
                       ┌───────────────────────────┐
        T ───────────► │      renderFrame(...)      │ ──► ফ্রেম (canvas)
                       └───────────────────────────┘
                          ▲          ▲          ▲
              requestAnimationFrame  │   fixed 1/fps loop
                                     │
                          (MediaRecorder / WebCodecs)
```

---

## ১. ফোল্ডার স্ট্রাকচার

```
.
├─ index.html                 # #root + main.jsx
├─ vite.config.js             # Vite + React প্লাগিন (সাদামাটা)
├─ package.json               # deps: react, mp4-muxer
├─ public/                    # স্ট্যাটিক অ্যাসেট (URL দিয়ে serve হয়)
│  ├─ fonts/                  # ওয়েবফন্ট (TTF + লাইসেন্স readme)
│  ├─ screens/                # অ্যাপের স্ক্রিনশট PNG (scene.shot এর নামে)
│  ├─ audio/                  # ঐচ্ছিক SFX স্যাম্পল (থাকলে সিন্থ বাদ দিয়ে এগুলো বাজে)
│  ├─ voiceover.mp3           # ভয়েস-ওভার
│  └─ app_icon.png            # অ্যাপ আইকন
└─ src/
   ├─ main.jsx                # React mount
   ├─ App.jsx                 # স্টুডিও শেল: ট্রান্সপোর্ট + এক্সপোর্ট প্যানেল + লুপ
   ├─ styles.css              # অ্যাপ/স্টুডিওর CSS (ভিডিওর কিছু না)
   └─ promo/                  # ◄── পুরো ভিডিও ইঞ্জিন এখানে
      ├─ core.js              # ড্রয়িং প্রিমিটিভ, easing, ফন্ট, টেক্সট
      ├─ icons.js             # SVG-পাথ আইকন রেজিস্ট্রি
      ├─ background.js        # ব্যাকড্রপ (terrain/grid/rays...) জেনারেটর
      ├─ scenes.js            # ◄► SCENES স্ক্রিপ্ট + প্রতি scene-এর painter
      ├─ transitions.js       # প্রতি scene-এর কাট + compositor
      ├─ renderer.js          # টাইমলাইন রেজলভার + renderFrame
      ├─ audio.js             # সব সাউন্ড (synth + স্যাম্পল + ducking)
      ├─ exporter.js          # real-time MediaRecorder এক্সপোর্ট
      └─ offline-export.js    # deterministic WebCodecs এক্সপোর্ট
```

> **ফাইল-বাই-ফাইল দায়িত্ব**: `core` = নিচের স্তর (শুধু আঁকার হাতিয়ার),
> `background`/`scenes`/`transitions` = কনটেন্ট,
> `renderer` = অর্কেস্ট্রেশন, `audio` = শব্দ, `exporter`/`offline-export` = আউটপুট,
> `App.jsx` = সবাইকে চালানো UI।

---

## ২. এক-এক ফাইল ঘুরে দেখা

### ২.১ `core.js` — ড্রয়িং প্রিমিটিভ

সব scene এখানকার হেল্পার ব্যবহার করে। কখনো `ctx.font = ...` হাতে লিখবে না —
`setFont`/`drawText` ব্যবহার করো, যাতে ফন্ট সব জায়গায় এক থাকে।

| Export | কাজ |
| --- | --- |
| `TAU, clamp, clamp01, lerp` | গণিত |
| `easeOutCubic, easeOutQuart, easeOutQuint, easeOutExpo, easeInOutCubic, easeInOutSine, easeOutBack, easeOutElastic` | সব easing এক জায়গায় |
| `seq(t,i,gap,dur,start)`, `seqE(...)` | স্ট্যাগার্ড (একটার পর একটা) অ্যানিমেশনের প্রগ্রেস |
| `hexA(hex, alpha)` | হেক্স রঙকে `rgba()`-তে |
| `roundRectPath`, `fillRound` | গোল-কোণা বাক্স |
| `toBn(n)` | ইংরেজি সংখ্যা → বাংলা সংখ্যা (`০১২৩...`) |
| `FONT_FAMILY`, `FONT`, `setFont`, `drawText`, `measure`, `wrapText` | টেক্সট |
| `drawCover(ctx,img,x,y,w,h)` | ছবি crop করে (stretch নয়) বাক্স ভরা |
| `drawPhone(ctx,{x,y,w,h,img,...})` | ডিভাইস ফ্রেম + ভেতরে স্ক্রিনশট + glow + fallback |

`drawText`-এর অপশন: `x,y,size,weight,color,align,baseline,alpha,gradient,maxWidth,letterSpacing`।
`gradient` দিলে গ্রেডিয়েন্ট ফিল হয় — টাইটেলের চকচকে লুক এভাবেই আসে।

**`FONT` স্ট্রিংটাই থিম-বদলের চাবি**: এখানে নিজের ওয়েবফন্টের নাম বসালেই পুরো
ভিডিও নতুন ফন্ট পায়। দ্বিতীয়/তৃতীয় নামগুলো fallback (ফন্ট লোড না হলে
`Noto Sans Bengali` → সিস্টেম ফন্টে নেমে যায়)।

### ২.২ `background.js` — ব্যাকড্রপ লেয়ার

প্রতি ফ্রেমে ব্যাকগ্রাউন্ড আলাদা করে আঁকা হয়, তাই এটা অ্যানিমেট হয়।

```js
createBackdrop(seed)          // একবার বানাও, বারবার re-use করো (দামি)
drawBackground(ctx, W, H, bd, { t, accent, accent2, mode, sceneId })
```

- `createBackdrop(seed)` রেজোলিউশন-নিরপেক্ষ ডেটা বানায়: কণা (particles),
  রঙিন orb, আর একটা ৬৪×৬৪ হাইটফিল্ড (value-noise, `hash2/vnoise/noise2`)।
  এটা deterministic — একই seed = একই ব্যাকড্রপ, তাই এক্সপোর্টে ফ্রেম বদলায় না।
- `drawBackground`-এর `mode` দিয়ে লুক বাছো:
  **`terrain`** (টপোগ্রাফিক কনট্যুর, marching squares + erosion river),
  `grid`, `cells`, `sections`, `rays`, `beams`, `arcs`, `dots`।
- `SCENE_STYLE` টেবিলে প্রতি scene-এর ঘনত্ব/উজ্জ্বলতা টিউন করা
  (`step, line, major, river, orb`)। নতুন scene যোগ করলে চাইলে একটা লাইন
  যোগ করো, না করলে `DEFAULT_STYLE` ব্যবহৃত হবে।

> এই লেয়ারটাই ভিডিওকে "প্রিমিয়াম" ফিল দেয়। তাড়াহুড়ায় দৃশ্য ফ্ল্যাট লাগলে
> এখানেই হাত দাও।

### ২.৩ `scenes.js` — স্ক্রিপ্ট (সবচেয়ে গুরুত্বপূর্ণ ফাইল)

এই একটা ফাইলেই পুরো ভিডিওর **কনটেন্ট**। দুইটা অংশ:

**(ক) `SCENES` অ্যারে** — প্রতি এন্ট্রি একটা শট:

```js
{
  id: "deadlines",          // ইউনিক; অডিও/transition টেবিলের কী
  chip: "ডেডলাইন",          // ওভারলে চ্যাপ্টার লেবেল
  duration: 6597,           // মিলিসেকেন্ড (দৈর্ঘ্য)
  accent: "#f97316",        // প্রাইমারি রঙ
  accent2: "#fbbf24",       // সেকেন্ডারি রঙ (গ্রেডিয়েন্ট)
  bg: "terrain",            // ব্যাকড্রপ mode
  motion: "countdown",      // কোন painter আঁকবে
  isNew: true,              // "নতুন" ব্যাজ
  kicker: "ডেডলাইন",        // ছোট উপরের লাইন
  title: "আর কখনো ডেডলাইন মিস হবে না",
  subtitle: "…",            // ঐচ্ছিক
  bullets: ["…", "…", "…"], // ঐচ্ছিক বুলেট
  chips: ["…"],             // ঐচ্ছিক
  shot: "deadlines",        // /screens/deadlines.png (ঐচ্ছিক)
  cues: [                   // অডিও ইভেন্ট (মিলিসেকেন্ড, scene-লোকাল)
    { at: 60, type: "whoosh" },
    { at: 700, type: "tick" },
  ],
}
```

- `TOTAL_DURATION = SCENES.reduce((s,x)=>s+x.duration,0)` — মোট দৈর্ঘ্য এখান থেকেই।
- **তৈরি করা duration-গুলো ভয়েস-ওভারের সাথে সিঙ্ক করা**: প্রতি scene-এর
  duration = তার narration লাইনের শুরু থেকে পরের লাইনের শুরুর ব্যবধান। তাই
  কাটগুলো ঠিক যখন বক্তা নতুন লাইনে যান তখনই পড়ে। বিস্তারিত: `VOICEOVER-ELEVENLABS.md`।

**(খ) Painter-ফাংশন** — `PAINTERS` ম্যাপে `motion` নাম → ফাংশন:

```js
const PAINTERS = {
  rings: paintSplash, statement: paintStatement, countdown: paintCountdown,
  ping: paintPing, chat: paintChat, splitUi: paintSplitUi, fan: paintFan,
  cascade: paintCascade, orbit: paintOrbit, weekgrid: paintWeekgrid,
  sections: paintSections, scan: paintScan, converge: paintConverge,
};
```

প্রতি painter-এর সিগনেচার একটাই: `paintX(ctx, S)` যেখানে

```js
S = { ctx, W, H, t, scene, L, images }
//  t     = এই scene-এ লোকাল সময় (সেকেন্ড, 0 থেকে শুরু)
//  L     = layoutFor(W,H) এর আউটপুট (নিচে দেখ)
//  images= { deadlines: <Image>, "app-icon": <Image>, … }
```

> **নিয়ম**: painter ভেতরে `state`/`window` কিছুই রাখে না — শুধু `t` আর `S`
> দেখে ছবি আঁকে। এটাই deterministic রেন্ডারের শর্ত (একই `t` = একই ফ্রেম)।

`drawSceneBody(ctx, S)` = device + kicker + title + subtitle + painter,
`drawSceneBullets(ctx, S)` = বুলেট। `renderer.js` এই দুটো কল করে।

**`layoutFor(W, H)`** প্রতি রেজোলিউশনে text আর phone-এর বসার জায়গা দেয়
(`textX, textW, titleSize, phone:{x,y,w,h}, accent:{...}`), আর `wide` বলে
দেয় ওরিয়েন্টেশন ১৬:৯ কি না। নতুন element যোগ করলে এখানে ইনসেট আনো — ম্যাজিক
নাম্বার ছড়িও না।

**`PHONE_MOTION` / `TITLE_MOTION`** — প্রতি scene-এর এন্ট্রান্স স্টাইল
(`rise, drop, slideL, flip, zoom, swirl…`)। নতুন scene-এ একই মোশন বারবার
এলে দর্শকের একঘেয়ে লাগে, তাই টেবিলে ঘুরিয়ে ফিরিয়ে ব্যবহার করো।

`TEXT_HERO = new Set(["rings","statement","converge"])` — যে scenes কোনো
ডিভাইস আঁকে না (শুধু টাইপোগ্রাফি)।

### ২.৪ `transitions.js` — কাট/কম্পোজিটর

`TRANSITION_BY_SCENE` টেবিল বলে **কোন scene-এ ঢোকার সময়** কী effect বাজবে
(`wipe, blinds, iris, pushLeft, pushUp, zoom, checker, flip, dissolve, split,
curtain, shutter`)। চাবিটা **ঢোকার** scene-এর id।

```js
drawTransition(ctx, W, H, type, progress, prevScene, prevT, nextScene, drawFull)
```

`drawFull(scene, localT)` একটা পূর্ণ scene (background+body+bullets) আঁকে।
`renderer.js` শেষ `TRANS = 0.5` সেকেন্ডে `progress` 0→1 তুলে দেয়, আর
`easeInOutCubic` মসৃণ করে।

নতুন transition যোগ করতে: `TRANSITION_BY_SCENE`-এ একটা নাম দাও, `switch`-এ
`case` যোগ করো, নিচে একটা `function myEffect(...)` লেখো।

### ২.৫ `renderer.js` — টাইমলাইন অর্কেস্ট্রেশন

পুরো ভিডিওর অবস্থান-গণিত এখানে:

```js
const DUR    = SCENES.map(s => s.duration/1000);
const STARTS = DUR.reduce((acc,d,i) => {
  acc.push(i === 0 ? 0 : acc[i-1] + DUR[i-1]);  // আগেরগুলো যোগফল
  return acc;
}, []);
```

অর্থাৎ **`STARTS[i] = STARTS[i-1] + DUR[i-1]`** — কোন scene কখন শুরু, তার
একমাত্র উৎস।

`resolveTime(T)` বলে দেয়: `{ index, local, next, progress }`
— এখন কোন scene (`index`), তার ভেতরে কত দূর (`local`), আর যদি শেষ ০.৫s-এ
থাকি তাহলে `next` scene এবং transition `progress`।

`renderFrame(ctx, W, H, T, { images, backdrop, overlays })`:
1. `resolveTime(T)`;
2. transition না থাকলে → সরাসরি `drawFull(current)`;
3. থাকলে → `drawTransition(...)`;
4. `overlays` সত্যি হলে `drawOverlays` (উপরে প্রগ্রেস রেল, নিচে চ্যাপ্টার
   লেবেল + ব্র্যান্ড + scene ticks)।

`App.jsx` প্রতি ফ্রেমে ঠিক এই একটা কল করে (লাইভ আর এক্সপোর্ট, দুই জায়গাতেই)।

### ২.৬ `audio.js` — সম্পূর্ণ সাউন্ড (অ্যাসেট ছাড়াই চলে)

তিনটা অংশ:

1. **Synth cues** — `buildSynthCue(ctx, out, type, t0, { noise, rng })`।
   ১০টা cue: `whoosh, impact, riser, pop, ping, blip, tick, chime, key, success`।
   প্রতিটা ওয়েভফর্ম/ফিল্টার/এনভেলপ দিয়ে বানানো — কোনো mp3 লাগে না।
2. **`createNoiseBuffer(ctx, rng, seconds)`** — white noise (whoosh/impact-এর
   জন্য)। `rng` ইনজেক্টেবল, তাই deterministic এক্সপোর্টে ঠিক একই noise আসে।
3. **`buildBed(ctx, bus, freq, {tremolo, base})`** — ব্যাকগ্রাউন্ড প্যাড/ড্রোন:
   چند oscillator + lowpass + LFO tremolo। scene বদলালে `BED` অ্যারের নতুন
   ফ্রিকোয়েন্সিতে retune হয়।
4. **`AudioEngine`** — বাস স্ট্রাকচার:
   `sfxBus / bedBus / voiceBus / musicBus → compressor → master → destination`
   (+ `streamDest` → MediaRecorder-এর জন্য অডিও ট্র্যাক).
   ভয়েস বাজলে বাকিগুলো **duck** (আস্তে) হয়ে যায় — সিনেমাটিক ফিল।
5. **ঐচ্ছিক স্যাম্পল**: `SFX_FILES` ম্যাপে `/audio/*.mp3` থাকলে সেটা বাজে,
   না থাকলে ওই একই নামের সিন্থ cue-তে fallback। তাই সাউন্ড **কখনো হারায় না**।
   Want real hits? `audio-pack/*.mp3` → `public/audio/` এ নামিয়ে দাও।

### ২.৭ এক্সপোর্ট ১ — `exporter.js` (real-time, `MediaRecorder`)

সবচেয়ে সরল পথ: `canvas.captureStream(fps)` → অডিও ট্র্যাক যোগ →
`MediaRecorder` → ব্লব ডাউনলোড।

- `detectFormats()` ব্রাউজারে কোন mime চলে বলে দেয় (MP4→WebM অর্ডারে চেষ্টা)।
- সীমা: **ভিডিও যে সময়ে দেখো, ঠিক তত সময় লাগে** (৭৭s = ৭৭s), ট্যাব
  ব্যাকগ্রাউন্ডে গেলে ফ্রেম ড্রপ করে, আর আউটপুট fps আসলে স্ক্রিন রিফ্রেশের
  উপর নির্ভর।
- দুর্বল ব্রাউজারে (Firefox) এটাই একমাত্র পথ।

### ২.৮ এক্সপোর্ট ২ — `offline-export.js` (deterministic, WebCodecs)

"নির্ভুল" পথ: ভিডিওর গতি বাড়াও, ব্যাকগ্রাউন্ডে গেলেও ফ্রেম হারায় না।

```
detectOfflineExport()  →  { video, audio, offlineAudio, supported }
exportOffline({ width,height,fps,bitrate,images,overlays,voiceUrl,
                soundEnabled,voiceEnabled,musicEnabled,bedFreqs,seed,
                existingVoice,existingMusic,existingSamples,existingSampleGain,
                onProgress, signal })  →  { blob, ext:"mp4", frames, codecs }
```

পাইপলাইন (৪ ধাপ):

1. **`renderOfflineAudio()`** — একটা `OfflineAudioContext`-এ লাইভ মিক্সারের
   হুবহু কপি বানিয়ে (একই compressor/gain/bus) পুরো সাউন্ড আগেই বেক করা হয়।
   `mulberry32(seed)` দিয়ে deterministic noise, প্রতি scene-এর `cues` ঠিক
   `STARTS[i] + cue.at/1000` সময়ে শিডিউল করা।
2. **Muxer** (`mp4-muxer`) — `video:{codec:"avc",...}` + অডিও কোডেক
   (`mp4a.40.2`/AAC, না হলে Opus), `fastStart` >200MB হলে off।
3. **`encodeVideo()`** — `i = 0…frames-1` ধরে `t = i/fps`; অফস্ক্রিন ক্যানভাসে
   `renderFrame(...)`; `new VideoFrame(canvas,{timestamp:...})` → `VideoEncoder`;
   প্রতি ২ সেকেন্ডে একটা keyframe; `encodeQueueSize` বেশি হলে অপেক্ষা;
   `onProgress` রিপোর্ট।
4. **`encodeAudio()`** — বেক করা বাফার 1024-ফ্রেম ব্লকে `AudioData` করে পাঠানো;
5. `muxer.finalize()` → `Blob([target.buffer],{type:"video/mp4"})`।

Video কোডেক ক্যান্ডিডেট: `avc1.640033` (High 5.1) → … → `avc1.420028`
(Baseline 4.0); প্রতিটা `VideoEncoder.isConfigSupported` দিয়ে যাচাই।
টাইমস্ট্যাম্প integer microsecond, তাই ১০০fps-এও ফ্রেম ডুপ্লিকেট হয় না।

> ⚠️ WebCodecs (এই deterministic পথ) শুধু **Chrome/Edge**-এ চলে। Firefox/
> Safari-তে বাটন বন্ধ থাকে (`offlineFormats.supported` false) — তখন real-time
> রেকর্ড বাটন ব্যবহার করো।

### ২.৯ `App.jsx` — স্টুডিও শেল

এটা ভিডিওর অংশ **না**; এটা UI-শেল:

- `imagesRef`: প্রতি `scene.shot` নামে `/screens/<name>.png` লোড (onerror →
  `null` → fallback), প্লাস `app_icon.png`।
- render+audio লুপ: `raf` দিয়ে `timeRef.current += dt`; প্রতি ফ্রেমে
  `renderFrame(...)` + `audio.syncVoice/syncMusic` + `tickAudio(T)`
  (এই scene-এ কোন cue কখন বাজবে, ট্র্যাক করে)।
- `backdropRef` একবার `createBackdrop(3)`; প্রতি ফ্রেম সেটাই পাস করা হয়।
- **audio unlock**: ব্রাউজার প্রথম ক্লিক/কী প্রেস পর্যন্ত AudioContext
  সাসপেন্ড রাখে; তাই `pointerdown/keydown`-এ `ctx.resume()` — তারপরই melody।
- ট্রান্সপোর্ট: play/pause,seek,step,restart + কীবোর্ড (`Space`, `←`/`→`, `r`)।
- **URL প্যারাম**: `?t=12.5` → ওই সময়ে ফ্রিজ (ফ্রেম ক্যাপচারের জন্য),
  `?format=16:9`, `?bare=1` (শুধু ক্যানভাস)।
- এক্সপোর্ট প্যানেল: ফরম্যাট (৯:১৬ 1080×1920 / ১৬:৯ 1920×1080), fps
  (30/60/100), কোয়ালিটি (50/16/10/5 Mbps), আর দুইটা বাটন —
  🔴 real-time রেকর্ড আর ⚡ deterministic এক্সপোর্ট।

---

## ৩. টাইমলাইনের গণিত (মুখস্থ করার মতো)

```
DUR[i]    = SCENES[i].duration / 1000            // সেকেন্ড
STARTS[0] = 0
STARTS[i] = STARTS[i-1] + DUR[i-1]               // আগের সব duration-এর যোগফল
TOTAL     = Σ DUR[i]
```

- Scene লোকাল সময়: `local = T - STARTS[index]`।
- Transition: `DUR[i] - local < 0.5` হলে `progress = (local-(DUR[i]-0.5))/0.5`।
- **cue সময় (লাইভ)**: কোনো scene-এ ঢুকলে ওই scene-এর `cues` রিসেট হয়,
  তারপর `local*1000 >= cue.at` হলে বাজে।
- **cue সময় (এক্সপোর্ট)**: exact গ্লোবাল সময় = `STARTS[i] + cue.at/1000`।

এই একটা ফর্মুলা জানলেই তুমি যেকোনো দৈর্ঘ্যের ভিডিও কেটে-ছেঁটে বানাতে পারবে।

---

## ৪. অডিও-ভিজ্যুয়াল সিঙ্ক করার নিয়ম

1. আগে **ভয়েস-ওভার** বানাও (ElevenLabs/রেকর্ডিং), তার লাইনগুলো ডাউনলোড করে ধরো।
2. প্রতি লাইনের শুরু-সময় লিখে রাখো (sek)। `VOICEOVER-ELEVENLABS.md` দেখো।
3. `SCENES[i].duration` = `lineStart[i+1] - lineStart[i]` (মিলিসেকেন্ডে)।
   শেষ scene = `total - lineStart[last]`।
4. এরপর `cues` বসাও — important শব্দ/আপিলের ঠিক আগে `whoosh`/`impact`,
   UI-তে ঢোকার সময় `pop`/`blip`।
5. এখন প্রতি scene-এর painter-এ `t` ধরে অ্যানিমেশনের ধাপ মিলাও (যেমন ভয়েস
   "প্রতিটি নোটিশ" বলার সময় কার্ড ঢোকা)।

ভয়েস-ওভার না থাকলে: মোট দৈর্ঘ্য তুমিই ঠিক করো, শুধু `duration` গুলো সুন্দর
ছন্দে ভাগ করো (সাধারণত প্রতি scene ৪–৮ সেকেন্ড ভালো লাগে)।

---

## ৫. নতুন motion graphics বানানোর রেসিপি (ধাপে ধাপে)

> নিচে "যেকোনো ভিডিও" বানানোর জেনেরিক রেসিপি। ধরো তুমি "কফি শপের প্রোমো"
> বানাবে।

**ধাপ ১ — কনসেপ্ট + স্ক্রিপ্ট।** ৮–১৩টা beat লিখো: হুক → সমস্যা → সমাধান →
ফিচার ×৪ → প্রুফ → CTA। প্রতি beat-এর জন্য ভয়েস লাইন।

**ধাপ ২ — ফর্ম্যাট।** রিলস? `FORMATS["9:16"]` (1080×1920)। ইউটিউব?
`FORMATS["16:9"]`। (চাইলে এখানে ১:১, ৪:৫ যোগ করো — `layoutFor` এমনিতেই
`wide` ধরে সামঞ্জস্য করে।)

**ধাপ ৩ — প্যালেট।** একটা accent + accent2 প্রতি scene-এ। `#7c5cff`/`#22d3ee`
মতো জোড়া নাও, বা `SCENE_STYLE`-এর মান বদলে ব্যাকড্রপ ঘনত্ব ঠিক করো।
রঙের ফিলিং ভালো লাগলে একটাই বেস hue ঘুরিয়ে ব্যবহার করো।

**ধাপ ৪ — `scenes.js` এর `SCENES` নতুন করে লেখো।** প্রতি beat = এক entry
(উপরের ২.৩-এ ফিল্ড তালিকা)। `motion` দিয়ে painter বাছো, `shot` দিয়ে স্ক্রিনশট,
`cues` দিয়ে সাউন্ড।

**ধাপ ৫ — দরকার হলে নতুন painter লেখো।** পুরোনোদের কপি করে বদলাও:

```js
function paintMyThing(ctx, S) {
  const { t, L, scene } = S;
  const p = easeOutCubic(clamp01(t / 0.8));   // ০.৮s এন্ট্রান্স
  // … এখানে যা খুশি আঁকো, শুধু t-এর ফাংশন রেখো …
}
const PAINTERS = { /* … */ myThing: paintMyThing };
```

**ধাপ ৬ — ট্রানজিশন।** `TRANSITION_BY_SCENE`-এ প্রতি নতুন id-র জন্য একটা
effect বাছো (বা নতুন effect লেখো)।

**ধাপ ৭ — অ্যাসেট বদলাও।** `public/screens/`-এর PNG গুলো `scene.shot`-এর
নামে রাখো (1080×2460 portrait ideal)। `public/app_icon.png` বদলাও। ভয়েস-ওভার
`public/voiceover.mp3` রিপ্লেস করো।

**ধাপ ৮ — ফন্ট (ঐচ্ছিক)।** নিজের ফন্ট `public/fonts/`-এ রেখে
`index.html`-এ `@font-face` যোগ করো, তারপর `core.js`-এর `FONT_FAMILY`
আপডেট করো।

**ধাপ ৯ — টিউন।** `?t=` দিয়ে নির্দিষ্ট ফ্রেমে থামিয়ে চেক করো; তারপর
প্রিভিউ চালিয়ে সাউন্ড/টাইমিং ঠিক করো।

**ধাপ ১০ — এক্সপোর্ট।** ⚡ deterministic বাটন (Chrome/Edge) — সেকেন্ডে শেষ।

### নতুন scene যোগ করার সংক্ষিপ্ত রেসিপি

1. `SCENES`-এ একটা entry কপি করে নতুন `id`/`duration`/টেক্সট দাও।
2. `PHONE_MOTION[id]` আর `TITLE_MOTION[id]`-এ একটা স্টাইল দাও।
3. `TRANSITION_BY_SCENE[id]`-এ একটা effect দাও।
4. `shot` দিলে `public/screens/<shot>.png` রেখে দাও (না দিলে painter শুধু
   টাইপোগ্রাফি/গ্রাফিক্স আঁকবে)।
5. দরকার হলে `SCENE_STYLE[id]` আর একটা painter।
6. `npm run build` চালাও — কোনো error নেই তা নিশ্চিত করো।

---

## ৬. সব "নব" এক জায়গায় (Cheat-sheet)

| কী বদলাবে | কোথায় |
| --- | --- |
| স্ক্রিপ্ট / দৈর্ঘ্য / রঙ / টেক্সট / cue | `src/promo/scenes.js` → `SCENES` |
| কোন beat-এ কী আঁকা | `scenes.js` → `PAINTERS` ও painter ফাংশন |
| মোশন-স্টাইল | `PHONE_MOTION`, `TITLE_MOTION` (scenes.js) |
| ব্যাকড্রপ লুক/ঘনত্ব | `background.js` → `SCENE_STYLE`, `mode` |
| কাট/effect | `transitions.js` → `TRANSITION_BY_SCENE` |
| ফন্ট | `core.js` → `FONT_FAMILY`, `index.html` @font-face |
| সাউন্ড cue কোথায় | `scenes.js` → `cues` (type গুলো `audio.js`-এ) |
| বেড ফ্রিকোয়েন্সি | `App.jsx` → `BED` |
| ফর্ম্যাট/fps/কোয়ালিটি | `App.jsx` → `FORMATS`, `FPS_OPTIONS`, `QUALITY` |
| ট্রানজিশনের দৈর্ঘ্য | `renderer.js` → `TRANS` |
| VP/ভয়েস ফাইল | `App.jsx` → `VO_URL`, `public/voiceover.mp3` |

---

## ৭. কনটেন্ট-ফ্রি (contentless) GitHub রিপো: কোনটা বাদ দেবে

এই ইঞ্জিনটা ইচ্ছাকৃতভাবে এমনভাবে লেখা যে **প্রাইভেট/কপিরাইটেড অ্যাসেট ছাড়াও
চলে**। তাই পাবলিক রিপোতে শুধু কোড রাখলেই যথেষ্ট।

**কী কী বাদ দিতে হবে (অথবা `.gitignore`-এ রাখতে হবে):**

| ফাইল/ফোল্ডার | কেন |
| --- | --- |
| `public/voiceover.mp3` | ElevenLabs দিয়ে বানানো (তোমার ভয়েস/লাইসেন্স) |
| `<root>`-এর `ElevenLabs_*.mp3` | সোর্স TTS ফাইল |
| `public/fonts/*.ttf` | Lipighor "আলিনুর স্বপ্নচারী" — ব্যবহারের অনুমতি লাগে (admin@lipighor.com) |
| `public/screens/*.png` | আপনার অ্যাপের স্ক্রিনশট |
| `public/app_icon.png`, `app_icon.png`, `images/`, `audio-pack/` | প্রাইভেট মিডিয়া |
| `node_modules/`, `dist/` | বিল্ড আর্টিফ্যাক্ট |

**কেন বাদ দিলেও অ্যাপ চলে (fallback আছে):**

- স্ক্রিনশট নেই → `drawPhone` fallback (খালি ডিভাইস ফ্রেম)।
- `app_icon.png` নেই → `images["app-icon"] = null`, guarded draw।
- ওয়েবফন্ট নেই → `FONT` স্ট্রিং `Noto Sans Bengali`/`system-ui`-তে নামে।
- `public/audio/*.mp3` নেই → `buildSynthCue` সিন্থ path বাজে (সবসময় সাউন্ড আছে)।
- `voiceover.mp3` নেই → VO চুপ, কিন্তু ভিজ্যুয়াল+SFX ঠিক চলবে।

রিপোতে এই ডকুমেন্টের পাশে `.gitignore` দিয়ে ওই ফাইলগুলো বাদ দেওয়া আছে;
নতুন ক্লোনার নিজের অ্যাসেট ফেলে দিলেই সব ফিরে আসে (README-তে লেখা আছে)।

**যদি font/voice রেখেই পাবলিক করতে চাও**: Lipighor থেকে লিখিত অনুমতি নাও,
আর নিজের রেকর্ড করা/লাইসেন্সড ভয়েস ব্যবহার করো — অথবা বাদ দিয়ে fallback
সাউন্ডে চলো।

---

## ৮. ট্রাবলশুটিং

| লক্ষণ | কারণ / সমাধান |
| --- | --- |
| প্রথমে সাউন্ড শোনা যায় না | ব্রাউজার AudioContext সাসপেন্ড — একবার ক্লিক/কী প্রেস করলেই unlock হয় |
| ⚡ বাটন disabled | WebCodecs নেই (Firefox/Safari) → real-time 🔴 বাটন ব্যবহার করো |
| এক্সপোর্ট ধীর/লাগি | real-time path ৭৭s নেয়; ⚡ path ব্যবহার করো (অনেক দ্রুত) |
| ফন্ট বদলাতে `.ttf` নেই | `core.js`-এর `FONT_FAMILY` ফাঁকা/ভুল নাম → fallback ফন্ট |
| নির্দিষ্ট ফ্রেমে ঠেকাতে | URL-এ `?t=সেকেন্ড` (যেমন `?t=31.161`) |
| ১৬:৯-এ লেআউট গোলমাল | `layoutFor`-এর wide শাখায় inset ঠিক করো |
| বিল্ড fail | `npm run build` চালিয়ে error পড়ো (সাধারণত import/typo) |

---

## ৯. পরিচালনার কমান্ড

```bash
npm install        # ডিপেন্ডেন্সি (react, react-dom, mp4-muxer, vite)
npm run dev        # ডেভ সার্ভার (প্রিভিউ + স্টুডিও)
npm run build      # dist/ বানাও
npm run preview    # বিল্ড প্রিভিউ (port 4173)
```

ব্রাউজার সাপোর্ট: real-time MP4/H.264 → Chrome/Edge 111+/Safari;
deterministic ⚡ → Chrome/Edge (WebCodecs); Firefox → শুধু WebM।

---

## ১০. একনজরে রেফারেন্স

- **easing**: `easeOutCubic, easeOutQuart, easeOutQuint, easeOutExpo,
  easeInOutCubic, easeInOutSine, easeOutBack, easeOutElastic`
- **cue types**: `whoosh, impact, riser, pop, ping, blip, tick, chime, key, success`
- **bg modes**: `terrain, grid, cells, sections, rays, beams, arcs, dots`
- **transitions**: `wipe, blinds, iris, pushLeft, pushUp, zoom, checker, flip,
  dissolve, split, curtain, shutter`
- **formats**: `9:16` (1080×1920), `16:9` (1920×1080)
- **fps**: `30, 60, 100` · **quality**: `50, 16, 10, 5` Mbps

এটাই পুরো আর্কিটেকচার। `SCENES` + painter-এর عادات মানলেই তুমি যেকোনো
motion graphics একই ইঞ্জিনে বানাতে পারবে — শুধু একটা ফাংশন লিখো যা সময় `T`
নিলে পর্দা এঁকে দেয়। 🎬
