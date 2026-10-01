import {
  TAU,
  clamp01,
  lerp,
  seq,
  easeOutCubic,
  easeOutBack,
  easeOutQuart,
  easeOutElastic,
  easeInOutCubic,
  hexA,
  wrapText,
  measure,
  drawText,
  roundRectPath,
  fillRound,
  drawPhone,
  drawCover,
  toBn,
} from "./core.js";
import { ICONS } from "./icons.js";

/* ==================================================================== */
/*  script                                                              */
/* ==================================================================== */

export const SCENES = [
  {
    id: "splash",
    chip: "স্প্ল্যাশ",
    duration: 7591,
    accent: "#7c5cff",
    accent2: "#22d3ee",
    bg: "terrain",
    motion: "rings",
    title: "সিএসটি পোর্টাল",
    subtitle: "সিএসটি ডিপার্টমেন্টের অফিসিয়াল অ্যাপ",
    chips: ["নোটিশ", "নোট", "রুটিন", "পরীক্ষা"],
    cues: [
      { at: 120, type: "riser" },
      { at: 420, type: "impact" },
      { at: 1500, type: "chime" },
    ],
  },
  {
    id: "upgrade",
    chip: "আপডেট",
    duration: 4867,
    accent: "#7c5cff",
    accent2: "#f472b6",
    bg: "terrain",
    motion: "statement",
    title: "সিএসটি পোর্টালে এলো বড় আপডেট",
    subtitle: "পাঁচটি নতুন ফিচার, নতুন ডিজাইন — সবকিছু আগের মতোই এক জায়গায়।",
    chips: ["৫টি নতুন ফিচার"],
    cues: [
      { at: 80, type: "whoosh" },
      { at: 300, type: "impact" },
    ],
  },
  {
    id: "deadlines",
    chip: "ডেডলাইন",
    duration: 6597,
    accent: "#f97316",
    accent2: "#fbbf24",
    bg: "terrain",
    motion: "countdown",
    isNew: true,
    kicker: "ডেডলাইন",
    title: "আর কখনো ডেডলাইন মিস হবে না",
    bullets: [
      "পরীক্ষা, অ্যাসাইনমেন্ট আর প্র্যাকটিক্যাল — সব ডেডলাইন এক সিস্টেমে",
      "প্রতিটির জন্য লাইভ কাউন্টডাউন — ৩ দিন বাকি, আর চমকে উঠতে হবে না",
      "বিষয়, বিবরণ আর সঠিক তারিখ ডিটেইল স্ক্রিনে",
    ],
    shot: "deadlines",
    cues: [
      { at: 60, type: "whoosh" },
      { at: 700, type: "tick" },
      { at: 1000, type: "tick" },
      { at: 1300, type: "tick" },
      { at: 1700, type: "blip" },
      { at: 2000, type: "blip" },
      { at: 2300, type: "blip" },
    ],
  },
  {
    id: "push",
    chip: "পুশ",
    duration: 6455,
    accent: "#ef4444",
    accent2: "#fb7185",
    bg: "terrain",
    motion: "ping",
    isNew: true,
    kicker: "পুশ নোটিফিকেশন",
    title: "প্রতিটি নোটিশ, প্রকাশের সাথে সাথেই",
    bullets: [
      "ডিপার্টমেন্ট নোটিশ দিলেই সাথে সাথে নোটিফিকেশন",
      "ট্যাপ করলেই নোটিশ সরাসরি অ্যাপে খুলে যাবে",
      "অ্যাটাচমেন্টসহ — গ্রুপ চ্যাটে PDF খোঁজার দরকার নেই",
    ],
    shot: "push-notification",
    cues: [
      { at: 60, type: "whoosh" },
      { at: 620, type: "pop" },
      { at: 980, type: "pop" },
      { at: 1320, type: "ping" },
    ],
  },
  {
    id: "support",
    chip: "সাপোর্ট",
    duration: 5651,
    accent: "#22c55e",
    accent2: "#4ade80",
    bg: "terrain",
    motion: "chat",
    isNew: true,
    kicker: "সাপোর্ট সিস্টেম",
    title: "সাপোর্টের সবকিছু, অ্যাপের ভেতরেই",
    bullets: [
      "স্টুডেন্ট অ্যাপ থেকেই জানাবে — সেটা হয়ে যাবে ট্র্যাক করার মতো টিকিট",
      "সব টিকিট এক কনসোলে — স্ট্যাটাস আর প্রায়োরিটি সহ",
      "রিপ্লাই আর সমাধান, সিএসটি পোর্টাল ছাড়ার দরকার নেই",
    ],
    shot: "support-chat",
    cues: [
      { at: 60, type: "whoosh" },
      { at: 520, type: "pop" },
      { at: 880, type: "pop" },
      { at: 1240, type: "pop" },
      { at: 1650, type: "blip" },
    ],
  },
  {
    id: "redesign",
    chip: "নতুন UI",
    duration: 6601,
    accent: "#8b5cf6",
    accent2: "#22d3ee",
    bg: "terrain",
    motion: "splitUi",
    isNew: true,
    kicker: "নতুন ইন্টারফেস",
    title: "একেবারে নতুন লুক",
    bullets: [
      "নতুন ড্যাশবোর্ড — ডেডলাইন আর কুইক অ্যাক্সেস সবার আগে",
      "নতুন ডার্ক ও লাইট থিম — যেটা ভালো লাগে বেছে নিন",
      "নেভিগেশন নতুন করে সাজানো, সবকিছু এক ট্যাপে",
    ],
    shot: "home",
    cues: [
      { at: 60, type: "whoosh" },
      { at: 600, type: "chime" },
      { at: 1500, type: "blip" },
    ],
  },
  {
    id: "faculty",
    chip: "ফ্যাকাল্টি",
    duration: 5449,
    accent: "#0ea5e9",
    accent2: "#38bdf8",
    bg: "terrain",
    motion: "fan",
    isNew: true,
    kicker: "ফ্যাকাল্টি ডিরেক্টরি",
    title: "ফ্যাকাল্টি, নতুন করে সাজানো",
    bullets: [
      "নতুন ফ্যাকাল্টি ডিরেক্টরি, সাথে সার্চ",
      "পদবি, ডিপার্টমেন্ট, শিফট আর সেমিস্টার প্রতিটি কার্ডে",
      "এক ট্যাপে কল করুন বা পুরো প্রোফাইল দেখুন",
    ],
    shot: "faculty",
    cues: [
      { at: 60, type: "whoosh" },
      { at: 700, type: "blip" },
      { at: 860, type: "blip" },
      { at: 1020, type: "blip" },
    ],
  },
  {
    id: "notices",
    chip: "নোটিশ",
    duration: 5586,
    accent: "#22d3ee",
    accent2: "#60a5fa",
    bg: "terrain",
    motion: "cascade",
    isNew: true,
    kicker: "নোটিশ ডিজাইন",
    title: "নোটিশ, পড়ার জন্য নতুন করে বানানো",
    bullets: [
      "পরিষ্কার নোটিশ ফিড, নতুন সবসময় সবার উপরে",
      "অ্যাটাচমেন্ট খুলে যায় অ্যাপের ভেতরেই",
      "বাংলা আর ইংরেজি নোটিশ, প্রকাশের মতো হুবহু",
    ],
    shot: "notices",
    cues: [
      { at: 60, type: "whoosh" },
      { at: 480, type: "pop" },
      { at: 760, type: "pop" },
      { at: 1040, type: "pop" },
    ],
  },
  {
    id: "notes",
    chip: "নোট",
    duration: 5251,
    accent: "#38bdf8",
    accent2: "#818cf8",
    bg: "terrain",
    motion: "orbit",
    kicker: "নোট",
    title: "সব নোট, বিষয় অনুযায়ী",
    bullets: [
      "বিষয় দিয়ে ফিল্টার, সেমিস্টার ট্যাগ সহ",
      "PDF আর ছবি — সব এক লাইব্রেরিতে",
      "অ্যাপে প্রিভিউ, বা ডাউনলোড করে অফলাইনে পড়ুন",
    ],
    shot: "notes",
    cues: [
      { at: 60, type: "whoosh" },
      { at: 520, type: "blip" },
      { at: 720, type: "blip" },
      { at: 920, type: "blip" },
    ],
  },
  {
    id: "routine",
    chip: "রুটিন",
    duration: 5665,
    accent: "#a78bfa",
    accent2: "#7c5cff",
    bg: "terrain",
    motion: "weekgrid",
    kicker: "ক্লাস রুটিন",
    title: "পুরো সপ্তাহ, এক নজরে",
    bullets: [
      "দিন অনুযায়ী — বিষয়, সময়, রুম আর শিক্ষক",
      "ক্লাস শুরুর আগে রিমাইন্ডার",
      "নোটিশ বোর্ডের ছবি তোলার আর দরকার নেই",
    ],
    shot: "class-routine",
    cues: [
      { at: 60, type: "whoosh" },
      { at: 480, type: "blip" },
      { at: 660, type: "blip" },
      { at: 840, type: "blip" },
      { at: 1020, type: "blip" },
    ],
  },
  {
    id: "exams",
    chip: "পরীক্ষা",
    duration: 5556,
    accent: "#fb7185",
    accent2: "#f43f5e",
    bg: "terrain",
    motion: "sections",
    kicker: "পরীক্ষার রুটিন",
    title: "প্রতিটি পরীক্ষা, নিজের সেকশনে",
    bullets: [
      "মিড, ফাইনাল আর ক্লাস টেস্ট — প্রতিটি আলাদা সেকশনে",
      "প্রতিটি পরীক্ষার তারিখ, সময়, রুম আর বিষয়",
      "প্রতিটির ২৪ ঘণ্টা আগে রিমাইন্ডার",
    ],
    shot: "exam-routine",
    cues: [
      { at: 60, type: "whoosh" },
      { at: 420, type: "impact" },
      { at: 900, type: "blip" },
      { at: 1200, type: "blip" },
    ],
  },
  {
    id: "idcard",
    chip: "আইডি কার্ড",
    duration: 5464,
    accent: "#facc15",
    accent2: "#fbbf24",
    bg: "terrain",
    motion: "scan",
    kicker: "পরিচয়",
    title: "স্টুডেন্ট আইডি আর প্রোফাইল, এক জায়গায়",
    bullets: [
      "অ্যাপেই তৈরি হয় আপনার অফিসিয়াল স্টুডেন্ট আইডি কার্ড",
      "রোল, সেমিস্টার, শিফট আর সেশন — সবসময় হালনাগাদ",
      "একটি প্রোফাইলেই আপনার তথ্য আর অ্যাকাউন্ট সেটিংস",
    ],
    shot: "id-card",
    cues: [
      { at: 60, type: "whoosh" },
      { at: 900, type: "chime" },
      { at: 1400, type: "key" },
    ],
  },
  {
    id: "cta",
    chip: "ইনস্টল",
    duration: 6433,
    accent: "#7c5cff",
    accent2: "#34d399",
    bg: "terrain",
    motion: "converge",
    title: "সিএসটি পোর্টাল নিন",
    subtitle: "সিএসটি ডিপার্টমেন্টের প্রতিটি স্টুডেন্ট আর শিক্ষকের জন্য সম্পূর্ণ ফ্রি।",
    bullets: [
      "ফোনে রিলিজ পেজটি খুলুন",
      "app-arm64-v8a-release.apk ডাউনলোড করুন — ২০১৮-এর পরের প্রায় সব ফোনে চলবে",
      "সোর্স থেকে ইনস্টল অনুমতি দিন, তারপর সাইন আপ করে Student বা Teacher বেছে নিন",
    ],
    shot: "install",
    cues: [
      { at: 60, type: "whoosh" },
      { at: 400, type: "riser" },
      { at: 1700, type: "success" },
    ],
  },
];

/**
 * Scene durations are timed to the voiceover in `public/voiceover.mp3`: each
 * scene's duration is the gap between its line's start and the next line's
 * start, so every cut lands exactly when its narration begins. Total = 77.166 s.
 */
export const TOTAL_DURATION = SCENES.reduce((s, x) => s + x.duration, 0);

/* ==================================================================== */
/*  layout                                                              */
/* ==================================================================== */

/**
 * `accent` is the gutter column reserved for per-scene graphics, so nothing
 * ever lands on top of the app screenshot.
 */
export function layoutFor(W, H) {
  const wide = W / H > 1.3;
  if (wide) {
    const phoneH = H * 0.84;
    const phoneW = phoneH * (1080 / 2460);
    const textX = W * 0.055;
    const textW = W * 0.44;
    const phoneX = W - W * 0.055 - phoneW;
    const gapX = textX + textW;
    return {
      wide,
      pad: W * 0.058,
      textX,
      textW,
      kickerY: H * 0.235,
      titleTop: H * 0.345,
      titleSize: H * 0.084,
      bulletsY: H * 0.618,
      phone: { x: phoneX, y: (H - phoneH) / 2, w: phoneW, h: phoneH },
      accent: {
        x: gapX + W * 0.012,
        y: H * 0.24,
        w: Math.max(W * 0.12, phoneX - gapX - W * 0.03),
        h: H * 0.52,
      },
    };
  }
  const phoneH = H * 0.5;
  const phoneW = phoneH * (1080 / 2460);
  const phoneX = (W - phoneW) / 2;
  return {
    wide,
    pad: W * 0.075,
    textX: W * 0.075,
    textW: W * 0.85,
    kickerY: H * 0.097,
    titleTop: H * 0.155,
    titleSize: W * 0.089,
    bulletsY: H * 0.8,
    phone: { x: phoneX, y: H * 0.275, w: phoneW, h: phoneH },
    accent: {
      x: W * 0.028,
      y: H * 0.28,
      w: phoneX - W * 0.045,
      h: H * 0.47,
    },
  };
}

/* ==================================================================== */
/*  shared pieces                                                       */
/* ==================================================================== */

function drawKicker(ctx, S, delay = 0.05) {
  const { scene, L, W, t } = S;
  if (!scene.kicker) return;
  const size = Math.max(18, W * 0.022);
  const e = easeOutCubic(seq(t, 0, 0, 0.55, delay));
  if (e <= 0.001) return;

  ctx.save();
  ctx.globalAlpha = e;
  ctx.translate(0, (1 - e) * size * 0.9);
  let x = L.textX;
  const y = L.kickerY;

  if (scene.isNew) {
    const pw = measure(ctx, "নতুন", size, 800) + size * 1.5;
    const ph = size * 1.95;
    ctx.save();
    ctx.shadowColor = hexA(scene.accent, 0.85);
    ctx.shadowBlur = size * 1.1;
    fillRound(ctx, x, y - ph * 0.72, pw, ph, ph / 2, scene.accent);
    ctx.restore();
    drawText(ctx, "নতুন", {
      x: x + pw / 2,
      y: y + size * 0.05,
      size,
      weight: 800,
      color: "#fff",
      align: "center",
    });
    x += pw + size * 0.7;
  }

  drawText(ctx, scene.kicker, {
    x,
    y,
    size,
    weight: 700,
    color: scene.isNew ? "#e9ebf5" : hexA(scene.accent, 0.95),
    letterSpacing: size * 0.05,
  });
  ctx.restore();
}

function titleGradient(ctx, S, x, y, w, size) {
  const g = ctx.createLinearGradient(x, y - size, x + w * 0.85, y + size * 0.2);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.55, "#f2f1ff");
  g.addColorStop(1, hexA(S.scene.accent, 0.92));
  return g;
}

function drawTitle(ctx, S, o = {}) {
  const { scene, L, t } = S;
  const size = o.size ?? L.titleSize;
  const maxW = o.maxWidth ?? L.textW;
  const x = o.x ?? L.textX;
  const y0 = o.y ?? L.titleTop;
  const mode = o.mode ?? "rise";
  const delay = o.delay ?? 0.1;
  const lineH = size * 1.26;
  const lines = wrapText(ctx, scene.title, maxW, size, 700);

  lines.forEach((line, i) => {
    const raw = seq(t, i, 0.11, 0.72, delay);
    if (raw <= 0) return;
    const e = easeOutCubic(raw);
    const y = y0 + i * lineH;
    const grad = titleGradient(ctx, S, x, y, maxW, size);

    if (mode === "word") {
      const words = line.split(" ");
      const gapPx = size * 0.28;
      const widths = words.map((w) => measure(ctx, w, size, 700));
      let wx = x;
      words.forEach((w, wi) => {
        const p = easeOutCubic(seq(t, i * 3 + wi, 0.26, 0.6, delay));
        if (p > 0) {
          ctx.save();
          ctx.globalAlpha = clamp01(p);
          ctx.translate(0, (1 - p) * size * 0.9);
          drawText(ctx, w, { x: wx, y, size, weight: 700, gradient: grad });
          ctx.restore();
        }
        wx += widths[wi] + gapPx;
      });
      return;
    }

    ctx.save();
    let alpha = e;
    if (mode === "wipe") {
      const wpx = measure(ctx, line, size, 700) + size * 0.35;
      ctx.beginPath();
      ctx.rect(x - size * 0.15, y - size * 1.15, wpx * e, size * 1.7);
      ctx.clip();
    } else if (mode === "reveal") {
      const hgt = size * 1.55;
      ctx.beginPath();
      ctx.rect(x - size * 0.15, y - size * 1.05 + hgt * (1 - e), maxW + size, hgt * e + size * 0.4);
      ctx.clip();
    } else if (mode === "blur") {
      ctx.filter = `blur(${(1 - e) * 24}px)`;
      ctx.translate(0, (1 - e) * size * 0.4);
    } else if (mode === "rise") {
      ctx.translate(0, (1 - e) * size * 0.9);
    } else if (mode === "drop") {
      const d = easeOutBack(raw, 1.3);
      alpha = clamp01(raw * 2.4);
      ctx.translate(0, -(1 - d) * size * 2.4);
    } else if (mode === "slideUp") {
      ctx.translate(0, (1 - e) * size * 1.8);
    } else if (mode === "scale") {
      const sc = 0.84 + e * 0.16;
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      ctx.translate(-x, -y);
    } else if (mode === "slideIn") {
      ctx.translate((1 - e) * -size * 3, 0);
    } else if (mode === "tilt") {
      const cy = y + size * 0.15;
      ctx.translate(x, cy);
      ctx.rotate((1 - e) * 0.16);
      ctx.translate(-x, -cy);
    } else if (mode === "flipUp") {
      const cy = y + size * 0.15;
      alpha = clamp01(raw * 1.5);
      ctx.translate(x, cy);
      ctx.scale(1, Math.max(0.05, e));
      ctx.translate(-x, -cy);
    }
    ctx.globalAlpha = clamp01(alpha);
    drawText(ctx, line, { x, y, size, weight: 700, gradient: grad });
    ctx.restore();
  });
}

function drawSubtitle(ctx, S, o = {}) {
  const { scene, L, t } = S;
  if (!scene.subtitle) return;
  const size = o.size ?? Math.max(21, L.titleSize * 0.36);
  const lines = wrapText(ctx, scene.subtitle, o.maxWidth ?? L.textW, size, 500);
  const lineH = size * 1.55;
  lines.forEach((line, i) => {
    const e = easeOutCubic(seq(t, i, 0.08, 0.6, o.delay ?? 0.7));
    if (e <= 0) return;
    drawText(ctx, line, {
      x: o.x ?? L.textX,
      y: (o.y ?? L.titleTop + L.titleSize * 1.95) + i * lineH,
      size,
      weight: 500,
      color: "#c9ccdd",
      alpha: e,
    });
  });
}

function drawBullets(ctx, S, o = {}) {
  const { scene, L, W, t } = S;
  if (!scene.bullets) return;
  const size = Math.max(18, W * 0.023);
  const lineH = size * 1.46;
  const indent = size * 1.75;
  const maxW = (o.maxWidth ?? L.textW) - indent;
  let y = o.y ?? L.bulletsY;

  scene.bullets.forEach((text, i) => {
    const e = easeOutCubic(seq(t, i, 0.13, 0.6, o.delay ?? 0.6));
    const lines = wrapText(ctx, text, maxW, size, 500);

    ctx.save();
    ctx.globalAlpha = e;
    ctx.translate((1 - e) * size * 0.9, 0);

    ctx.save();
    ctx.shadowColor = hexA(scene.accent, 0.9);
    ctx.shadowBlur = size * 0.8;
    ctx.fillStyle = scene.accent;
    ctx.beginPath();
    ctx.arc(L.textX + size * 0.34, y - size * 0.42, size * 0.28, 0, TAU);
    ctx.fill();
    ctx.restore();

    lines.forEach((line, li) => {
      drawText(ctx, line, {
        x: L.textX + indent,
        y: y + li * lineH,
        size,
        weight: 500,
        color: "#dde0ee",
      });
    });
    ctx.restore();
    y += lines.length * lineH + size * 0.54;
  });
}

function withPhone(ctx, S, o, body) {
  const { L, t } = S;
  const p = L.phone;
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  const raw = seq(t, 0, 0, o.dur ?? 0.9, o.delay ?? 0.18);
  const e = easeOutCubic(raw);
  const mode = o.mode ?? "rise";
  const idleY = Math.sin(t * 1.15 + 1) * p.h * 0.008;
  const idleR = Math.sin(t * 0.7) * 0.005;

  ctx.save();
  let alpha = easeOutCubic(seq(t, 0, 0, 0.45, o.delay ?? 0.18));

  ctx.translate(cx, cy + idleY);
  ctx.rotate(idleR);

  if (mode === "rise") ctx.translate(0, (1 - e) * p.h * 0.34);
  else if (mode === "drop") {
    const d = easeOutBack(raw, 1.2);
    ctx.translate(0, -(1 - d) * p.h * 0.5);
  } else if (mode === "zoom") {
    const z = 0.76 + easeOutBack(raw, 1.4) * 0.24;
    ctx.scale(z, z);
  } else if (mode === "slideL") ctx.translate(-(1 - e) * p.w * 0.85, 0);
  else if (mode === "slideR") ctx.translate((1 - e) * p.w * 0.85, 0);
  else if (mode === "flip") ctx.scale(Math.max(0.001, easeOutBack(raw, 1.1)), 1);
  else if (mode === "flip3d") {
    ctx.scale(Math.max(0.001, easeOutCubic(clamp01(raw * 1.25))), 1);
    alpha *= clamp01(raw * 2.2);
  } else if (mode === "swing") {
    ctx.rotate((1 - easeOutBack(raw, 1.2)) * -0.22);
    ctx.translate(0, (1 - e) * p.h * 0.18);
  } else if (mode === "settle") {
    ctx.translate(0, (1 - e) * p.h * 0.16);
    ctx.rotate((1 - e) * 0.05);
  } else if (mode === "swoop") {
    ctx.rotate((1 - e) * 0.14);
    ctx.translate((1 - e) * p.w * 0.55, (1 - e) * -p.h * 0.3);
  }

  ctx.globalAlpha = clamp01(alpha);
  ctx.translate(-cx, -cy);
  body(ctx, p, e);
  ctx.restore();
}

/**
 * Rounded app-icon tile. Draws the real `app_icon.png` when it has loaded and
 * falls back to the drawn gradient + cap mark otherwise.
 */
function drawAppIcon(ctx, x, y, s, c1, c2, img, glow = true) {
  if (img && img.complete && img.naturalWidth) {
    if (glow) {
      ctx.save();
      ctx.shadowColor = hexA(c1, 0.5);
      ctx.shadowBlur = s * 0.35;
      fillRound(ctx, x, y, s, s, s * 0.27, "rgba(0,0,0,0.9)");
      ctx.restore();
    }
    ctx.save();
    roundRectPath(ctx, x, y, s, s, s * 0.27);
    ctx.clip();
    drawCover(ctx, img, x, y, s, s);
    ctx.restore();
    return;
  }
  const g = ctx.createLinearGradient(x, y, x + s, y + s);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.save();
  if (glow) {
    ctx.shadowColor = hexA(c1, 0.5);
    ctx.shadowBlur = s * 0.35;
  }
  fillRound(ctx, x, y, s, s, s * 0.27, g);
  ctx.restore();
  ICONS.cap(ctx, x + s * 0.22, y + s * 0.22, s * 0.56, "#ffffff");
}

/** Android status-bar glyphs (signal · wi-fi · battery), right-aligned at `right`. */
function drawStatusIcons(ctx, right, cy, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // battery
  const bw = s * 2.0;
  const bh = s * 0.96;
  const bx = right - bw;
  ctx.lineWidth = Math.max(1.2, s * 0.085);
  roundRectPath(ctx, bx, cy - bh / 2, bw - s * 0.26, bh, bh * 0.3);
  ctx.stroke();
  fillRound(ctx, bx + bh * 0.24, cy - bh * 0.26, (bw - s * 0.26) * 0.66, bh * 0.52, bh * 0.16, color);
  roundRectPath(ctx, bx + bw - s * 0.2, cy - bh * 0.16, s * 0.15, bh * 0.32, s * 0.06);
  ctx.fill();

  // wi-fi arcs
  const wc = bx - s * 1.7;
  ctx.lineWidth = Math.max(1.2, s * 0.12);
  for (let i = 1; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.arc(wc, cy + s * 0.36, i * s * 0.3, Math.PI * 1.18, Math.PI * 1.82);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(wc, cy + s * 0.36, s * 0.1, 0, TAU);
  ctx.fill();

  // signal bars (tallest on the right)
  for (let i = 0; i < 4; i += 1) {
    const hgt = s * (0.9 - i * 0.2);
    fillRound(ctx, wc - s * 1.05 - i * s * 0.3 - s * 0.18, cy + s * 0.42 - hgt, s * 0.18, hgt, s * 0.05, color);
  }
  ctx.restore();
}

/**
 * Simulated Android notification shade (Material You, dark). Used until a real
 * capture lands in `public/screens/push-notification.png`.
 */
function drawNoticeShade(ctx, x, y, w, h, scene, t, img) {
  const accent = scene.accent;
  const accent2 = scene.accent2 || scene.accent;

  // dimmed wallpaper behind the shade
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, "#0d0e13");
  bg.addColorStop(0.55, "#0a0a10");
  bg.addColorStop(1, "#050508");
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  // ---- status bar
  const sbH = h * 0.05;
  drawText(ctx, "9:41", {
    x: x + w * 0.062,
    y: y + sbH * 0.66,
    size: w * 0.05,
    weight: 600,
    color: "#e8eaf2",
  });
  drawStatusIcons(ctx, x + w * 0.94, y + sbH * 0.5, w * 0.048, "#e8eaf2");

  const pad = w * 0.055;
  const cardX = x + pad;
  const cardW = w - pad * 2;

  // ---- header row
  const headY = y + sbH + h * 0.03;
  drawText(ctx, "নোটিফিকেশন", {
    x: cardX + pad * 0.4,
    y: headY,
    size: w * 0.045,
    weight: 700,
    color: "#f2f3f8",
  });
  drawText(ctx, "সব মুছুন", {
    x: cardX + cardW - pad * 0.4,
    y: headY,
    size: w * 0.036,
    weight: 700,
    color: accent,
    align: "right",
  });

  const cards = [
    { title: "নতুন নোটিশ প্রকাশিত", body: "সেমিস্টার ৪-এর পরীক্ষার রুটিন প্রকাশিত হয়েছে।", when: "এখন" },
    { title: "নতুন নোট আপলোড", body: "ডেটা স্ট্রাকচার — ইউনিট ৪", when: "২ মিনিট" },
    { title: "ডেডলাইন রিমাইন্ডার", body: "অ্যাসাইনমেন্ট জমা দেওয়ার শেষ সময় ঘনিয়ে এসেছে।", when: "১ ঘণ্টা" },
  ];

  const icon = w * 0.125;
  const p2 = w * 0.05;
  const gapX = w * 0.042;
  const textX = cardX + p2 + icon + gapX;
  const textW = cardX + cardW - p2 - textX;
  const appSize = w * 0.035;
  const titleSize = w * 0.052;
  const bodySize = w * 0.043;
  const bodyLh = bodySize * 1.45;
  let cursor = headY + h * 0.035;

  cards.forEach((c, i) => {
    const e = easeOutBack(seq(t, i, 0.16, 0.72, 0.3), 1.05);
    if (e <= 0.01) return;
    const lines = wrapText(ctx, c.body, textW, bodySize, 500);
    const cardH = p2 * 2 + appSize * 1.15 + titleSize * 1.5 + lines.length * bodyLh;
    const cy = cursor;

    ctx.save();
    ctx.globalAlpha = clamp01(e * 1.35);
    ctx.translate(0, (1 - e) * -h * 0.04);

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = w * 0.06;
    ctx.shadowOffsetY = w * 0.012;
    fillRound(ctx, cardX, cy, cardW, cardH, w * 0.055, "#1b1c22");
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.lineWidth = Math.max(1, w * 0.0025);
    roundRectPath(ctx, cardX, cy, cardW, cardH, w * 0.055);
    ctx.stroke();

    drawAppIcon(ctx, cardX + p2, cy + p2, icon, accent, accent2, img);

    const appY = cy + p2 + appSize * 0.95;
    drawText(ctx, "CST Portal", { x: textX, y: appY, size: appSize, weight: 600, color: "#c8ccda" });
    const nmW = measure(ctx, "CST Portal", appSize, 600);
    drawText(ctx, "·", { x: textX + nmW + appSize * 0.35, y: appY, size: appSize, weight: 600, color: "#7d8395" });
    drawText(ctx, c.when, { x: textX + nmW + appSize * 0.9, y: appY, size: appSize, weight: 500, color: "#7d8395" });

    const titleY = cy + p2 + appSize * 1.15 + titleSize * 1.05;
    drawText(ctx, c.title, {
      x: textX,
      y: titleY,
      size: titleSize,
      weight: 700,
      color: "#f4f5f9",
      maxWidth: textW,
    });

    lines.forEach((line, li) => {
      drawText(ctx, line, {
        x: textX,
        y: titleY + bodySize * 1.35 + li * bodyLh,
        size: bodySize,
        weight: 500,
        color: "#aab0c0",
      });
    });

    // expand chevron
    const chevX = cardX + cardW - p2 - w * 0.005;
    const chevY = cy + p2 + appSize * 0.45;
    ctx.strokeStyle = "rgba(255,255,255,0.38)";
    ctx.lineWidth = Math.max(1.2, w * 0.0035);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(chevX - w * 0.022, chevY);
    ctx.lineTo(chevX, chevY + w * 0.018);
    ctx.lineTo(chevX + w * 0.022, chevY);
    ctx.stroke();

    ctx.restore();
    cursor += cardH + h * 0.016;
  });
}

/** Install / end-card screen for the CTA scene. */
function drawInstallScreen(ctx, x, y, w, h, accent, t, img) {
  ctx.fillStyle = "#0b0b13";
  ctx.fillRect(x, y, w, h);
  const pulse = 1 + Math.sin(t * 3) * 0.03;
  const size = w * 0.34 * pulse;
  const ix = x + w / 2 - size / 2;
  const iy = y + h * 0.3;
  drawAppIcon(ctx, ix, iy, size, accent, accent, img);
  drawText(ctx, "CST Portal", {
    x: x + w / 2,
    y: iy + size + h * 0.07,
    size: w * 0.085,
    weight: 700,
    color: "#fff",
    align: "center",
  });
  drawText(ctx, "CST Department", {
    x: x + w / 2,
    y: iy + size + h * 0.115,
    size: w * 0.06,
    weight: 500,
    color: "#8b8fa3",
    align: "center",
  });
  fillRound(ctx, x + w * 0.24, iy + size + h * 0.17, w * 0.52, h * 0.052, h * 0.026, accent);
  drawText(ctx, "Install", {
    x: x + w / 2,
    y: iy + size + h * 0.205,
    size: w * 0.062,
    weight: 700,
    color: "#fff",
    align: "center",
  });
}

/** Neutral placeholder for any other scene whose screenshot has not landed yet. */
function drawPlaceholder(ctx, x, y, w, h, scene, t, img) {
  ctx.fillStyle = "#0a0a12";
  ctx.fillRect(x, y, w, h);
  const s = w * 0.24;
  const ix = x + w / 2 - s / 2;
  const iy = y + h * 0.36;
  drawAppIcon(ctx, ix, iy, s, scene.accent, scene.accent2 || scene.accent, img);
  drawText(ctx, scene.kicker || scene.title, {
    x: x + w / 2,
    y: iy + s + h * 0.07,
    size: w * 0.055,
    weight: 700,
    color: "#d8dbe9",
    align: "center",
    maxWidth: w * 0.8,
  });
  const sw = w * 0.5;
  const sx = x + w * 0.25;
  const sy = y + h * 0.72;
  fillRound(ctx, sx, sy, sw, w * 0.028, w * 0.014, "rgba(255,255,255,0.08)");
  const p = (t * 0.5) % 1;
  ctx.save();
  roundRectPath(ctx, sx, sy, sw, w * 0.028, w * 0.014);
  ctx.clip();
  fillRound(ctx, sx + sw * p - sw * 0.3, sy, sw * 0.4, w * 0.028, w * 0.014, hexA(scene.accent, 0.7));
  ctx.restore();
}

function screenFallback(S) {
  return (fctx, sx, sy, sw, sh) => {
    const icon = S.images?.["app-icon"];
    if (S.scene.id === "push") drawNoticeShade(fctx, sx, sy, sw, sh, S.scene, S.t, icon);
    else if (S.scene.id === "cta") drawInstallScreen(fctx, sx, sy, sw, sh, S.scene.accent, S.t, icon);
    else drawPlaceholder(fctx, sx, sy, sw, sh, S.scene, S.t, icon);
  };
}

function drawDevice(ctx, S, o) {
  withPhone(ctx, S, o, (c, p) => {
    drawPhone(c, {
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h,
      img: S.images?.[S.scene.shot] || null,
      accent: S.scene.accent,
      fallback: screenFallback(S),
    });
  });
}

/* ==================================================================== */
/*  reusable graphics                                                   */
/* ==================================================================== */

function chip(ctx, x, y, text, size, accent, alpha = 1) {
  const w = measure(ctx, text, size, 700) + size * 1.9;
  const h = size * 2.05;
  ctx.save();
  ctx.globalAlpha = alpha;
  fillRound(ctx, x, y - h * 0.68, w, h, h / 2, hexA(accent, 0.18));
  ctx.strokeStyle = hexA(accent, 0.6);
  ctx.lineWidth = Math.max(1.4, size * 0.075);
  roundRectPath(ctx, x, y - h * 0.68, w, h, h / 2);
  ctx.stroke();
  drawText(ctx, text, {
    x: x + w / 2,
    y: y + size * 0.02,
    size,
    weight: 700,
    color: accent,
    align: "center",
  });
  ctx.restore();
  return w;
}

function ring(ctx, cx, cy, r, thickness, from, to, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, from, to);
  ctx.stroke();
  ctx.restore();
}

/** Draws a QR-like block with proper finder squares; `p` is the assemble progress. */
function drawQr(ctx, x, y, size, p, ink = "#0b0b13", paper = "rgba(255,255,255,0.96)") {
  const cells = 9;
  const cell = size / cells;
  fillRound(ctx, x - size * 0.09, y - size * 0.09, size * 1.18, size * 1.18, size * 0.12, paper);
  ctx.save();
  ctx.translate(x, y);
  const finders = [
    [0, 0],
    [0, cells - 3],
    [cells - 3, 0],
  ];
  ctx.fillStyle = ink;
  for (let r = 0; r < cells; r += 1) {
    for (let c = 0; c < cells; c += 1) {
      const inFinder = finders.some(
        ([fr, fc]) => r >= fr && r < fr + 3 && c >= fc && c < fc + 3
      );
      if (inFinder) continue;
      if ((r * 5 + c * 3) % 3 === 1) continue;
      const ci = r * cells + c;
      const ce = clamp01((p * cells * cells - ci) / 8);
      if (ce <= 0) continue;
      ctx.globalAlpha = ce;
      ctx.fillRect(c * cell, r * cell, cell * 0.78, cell * 0.78);
    }
  }
  ctx.globalAlpha = clamp01(p);
  ctx.fillStyle = ink;
  finders.forEach(([fr, fc]) => {
    ctx.fillRect(fc * cell, fr * cell, cell * 3 * 0.94, cell * 3 * 0.94);
  });
  ctx.fillStyle = paper;
  finders.forEach(([fr, fc]) => {
    ctx.fillRect((fc + 0.9) * cell, (fr + 0.9) * cell, cell * 1.2, cell * 1.2);
  });
  ctx.restore();
}

/* ==================================================================== */
/*  scenes                                                              */
/* ==================================================================== */

/* 1 — splash: expanding signal rings + word-by-word wordmark */
function paintSplash(ctx, S) {
  const { W, H, t, scene } = S;
  const cx = W / 2;
  const cy = H * 0.4;

  for (let i = 0; i < 4; i += 1) {
    const p = clamp01((t - 0.35 - i * 0.32) / 2.6);
    if (p <= 0 || p >= 1) continue;
    const r = lerp(W * 0.1, W * 0.62, easeOutQuart(p));
    ring(ctx, cx, cy, r, W * 0.006, 0, TAU, hexA(scene.accent, 0.45 * (1 - p)));
    ring(ctx, cx, cy, r * 0.86, W * 0.003, 0, TAU, hexA(scene.accent2, 0.3 * (1 - p)));
  }

  const pop = easeOutBack(seq(t, 0, 0, 0.9, 0.12), 1.5);
  const size = W * 0.25 * pop;
  const ix = cx - size / 2;
  const iy = cy - size / 2;
  if (pop > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp01(pop * 1.4);
    drawAppIcon(ctx, ix, iy, size, scene.accent, scene.accent2, S.images?.["app-icon"]);
    ctx.restore();
  }

  const titleSize = W * 0.122;
  const words = scene.title.split(" ");
  const gapPx = titleSize * 0.3;
  const widths = words.map((w) => measure(ctx, w, titleSize, 800));
  const total = widths.reduce((a, b) => a + b, 0) + gapPx * (words.length - 1);
  let wx = cx - total / 2;
  const ty = cy + H * 0.155;
  const grad = titleGradient(ctx, S, wx, ty, total, titleSize);

  words.forEach((w, i) => {
    const p = easeOutCubic(seq(t, i, 0.2, 0.7, 0.55));
    if (p > 0) {
      ctx.save();
      ctx.globalAlpha = p;
      ctx.translate(0, (1 - p) * titleSize * 0.7);
      drawText(ctx, w, { x: wx, y: ty, size: titleSize, weight: 800, gradient: grad });
      ctx.restore();
    }
    wx += widths[i] + gapPx;
  });

  const ul = easeInOutCubic(clamp01((t - 1.05) / 0.6));
  if (ul > 0) {
    const uw = W * 0.3 * ul;
    const g = ctx.createLinearGradient(cx - uw / 2, 0, cx + uw / 2, 0);
    g.addColorStop(0, hexA(scene.accent, 0));
    g.addColorStop(0.5, scene.accent);
    g.addColorStop(1, hexA(scene.accent2, 0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - uw / 2, ty + titleSize * 0.5, uw, W * 0.005);
  }

  drawText(ctx, scene.subtitle, {
    x: cx,
    y: ty + titleSize * 0.98,
    size: W * 0.041,
    weight: 500,
    color: "#a8adc4",
    align: "center",
    alpha: easeOutCubic(seq(t, 0, 0, 0.7, 1.2)),
  });

  const chipSize = W * 0.03;
  const chipY = ty + titleSize * 1.55;
  const totalChipW =
    scene.chips.reduce((a, c) => a + measure(ctx, c, chipSize, 700) + chipSize * 1.9 + W * 0.014, 0) -
    W * 0.014;
  let chipX = cx - totalChipW / 2;
  scene.chips.forEach((c, i) => {
    const p = easeOutBack(seq(t, i, 0.1, 0.6, 1.5), 1.3);
    if (p > 0.01) chipX += chip(ctx, chipX, chipY, c, chipSize, scene.accent, clamp01(p)) + W * 0.014;
  });
}

/* 2 — upgrade: statement revealed by a sweeping wipe */
function paintStatement(ctx, S) {
  const { W, H, t, scene, L } = S;
  const size = L.wide ? L.titleSize * 1.28 : W * 0.096;
  const lines = wrapText(ctx, scene.title, L.textW, size, 800);
  const lineH = size * 1.32;
  const blockH = lines.length * lineH;
  const y0 = H * 0.46 - blockH / 2 + size;

  const flash = clamp01(1 - t / 0.55);
  if (flash > 0) {
    ctx.fillStyle = hexA(scene.accent, flash * 0.16);
    ctx.fillRect(0, 0, W, H);
  }

  const wipeStart = 0.25;
  lines.forEach((line, i) => {
    const y = y0 + i * lineH;
    const grad = titleGradient(ctx, S, L.textX, y, L.textW, size);
    const lw = easeInOutCubic(clamp01((t - wipeStart - i * 0.14) / 0.85));
    if (lw <= 0) return;
    ctx.save();
    const wpx = L.textW + size;
    ctx.beginPath();
    ctx.rect(L.textX - size * 0.1, y - size * 1.12, wpx * lw, size * 1.6);
    ctx.clip();
    drawText(ctx, line, { x: L.textX, y, size, weight: 800, gradient: grad });
    ctx.restore();

    if (lw < 0.999) {
      const bx = L.textX - size * 0.1 + wpx * lw;
      const g2 = ctx.createLinearGradient(bx - size * 0.5, 0, bx + size * 0.3, 0);
      g2.addColorStop(0, hexA(scene.accent, 0));
      g2.addColorStop(1, hexA("#ffffff", 0.85));
      ctx.fillStyle = g2;
      ctx.fillRect(bx - size * 0.5, y - size * 1.12, size * 0.8, size * 1.6);
    }
  });

  const e2 = easeOutCubic(seq(t, 0, 0, 0.8, 1.15));
  const subSize = Math.max(21, size * 0.36);
  wrapText(ctx, scene.subtitle, L.textW * 0.92, subSize, 500).forEach((line, i) => {
    drawText(ctx, line, {
      x: L.textX,
      y: y0 + blockH + size * 0.5 + i * subSize * 1.6,
      size: subSize,
      weight: 500,
      color: "#b6bbd0",
      alpha: e2,
    });
  });

  scene.chips.forEach((c, i) => {
    const p = easeOutBack(seq(t, i, 0.12, 0.65, 1.5), 1.3);
    if (p > 0.01) {
      chip(ctx, L.textX, y0 + blockH + size * 2.3, c, Math.max(19, W * 0.023), scene.accent, clamp01(p));
    }
  });
}

/* 3 — deadlines: countdown ring + connected gutters */
function paintCountdown(ctx, S) {
  const { W, t, scene, L } = S;
  const p = L.phone;
  const a = L.accent;

  const spineX = p.x - W * 0.014;
  const spineP = easeOutCubic(clamp01((t - 0.45) / 1.1));
  if (spineP > 0) {
    const top = p.y + p.h * 0.08;
    const bottom = p.y + p.h * 0.92;
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, hexA(scene.accent, 0));
    g.addColorStop(0.5, hexA(scene.accent, 0.85));
    g.addColorStop(1, hexA(scene.accent, 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = W * 0.003;
    ctx.beginPath();
    ctx.moveTo(spineX, top);
    ctx.lineTo(spineX, top + (bottom - top) * spineP);
    ctx.stroke();
  }

  const size = Math.max(15, W * 0.0185);
  ["পরীক্ষা", "অ্যাসাইনমেন্ট", "প্র্যাকটিক্যাল"].forEach((label, i) => {
    const e = easeOutBack(seq(t, i, 0.22, 0.7, 1.0), 1.25);
    if (e <= 0.01) return;
    const y = p.y + p.h * (0.3 + i * 0.24);
    const cw = measure(ctx, label, size, 700) + size * 1.9;
    const cx = p.x - cw - W * 0.03;
    ctx.save();
    ctx.globalAlpha = clamp01(e);
    ctx.translate((1 - e) * W * 0.1, 0);
    chip(ctx, cx, y, label, size, i === 1 ? scene.accent : scene.accent2);
    ctx.strokeStyle = hexA(scene.accent, 0.45);
    ctx.lineWidth = W * 0.002;
    ctx.beginPath();
    ctx.moveTo(cx + cw, y - size * 0.1);
    ctx.lineTo(spineX, y - size * 0.1);
    ctx.stroke();
    ctx.restore();
  });

  const rcx = a.x + a.w * 0.5;
  const rcy = p.y + p.h * 0.07;
  const R = Math.min(a.w * 0.36, W * 0.085);
  const rp = easeOutQuart(clamp01((t - 1.55) / 1.5));
  ring(ctx, rcx, rcy, R, W * 0.008, 0, TAU, "rgba(255,255,255,0.12)");
  ring(ctx, rcx, rcy, R, W * 0.008, -Math.PI / 2, -Math.PI / 2 + TAU * rp, scene.accent);
  ctx.save();
  ctx.shadowColor = hexA(scene.accent, 0.8);
  ctx.shadowBlur = W * 0.05;
  const days = Math.max(1, 4 - Math.floor(rp * 3.2));
  drawText(ctx, toBn(String(days).padStart(2, "0")), {
    x: rcx,
    y: rcy + R * 0.18,
    size: R * 0.78,
    weight: 800,
    color: "#fff",
    align: "center",
  });
  ctx.restore();
  drawText(ctx, "দিন", {
    x: rcx,
    y: rcy + R * 0.72,
    size: R * 0.34,
    weight: 700,
    color: hexA(scene.accent, 0.95),
    align: "center",
  });
}

/* 4 — push: notifications land in the gutter with ping ripples */
function paintPing(ctx, S) {
  const { W, t, scene, L } = S;
  const p = L.phone;
  const a = L.accent;
  const size = Math.max(14, W * 0.0165);

  const cards = [
    { title: "নতুন নোটিশ প্রকাশিত", when: "এখন", delay: 0.85 },
    { title: "পরীক্ষার রুটিন প্রকাশিত", when: "১২ মিনিট", delay: 1.15 },
  ];

  const widest = cards.reduce((m, c) => Math.max(m, measure(ctx, c.title, size, 700)), 0);
  const cw = Math.min(a.w * 1.14, widest + size * 6.4);
  const ch = size * 3.5;
  const cx = p.x - cw - W * 0.022;
  const cy0 = p.y + p.h * 0.56;

  [
    { at: 1.35, mul: 1.5 },
    { at: 1.8, mul: 2.2 },
  ].forEach((rg) => {
    const e = clamp01((t - rg.at) / 1.4);
    if (e <= 0 || e >= 1) return;
    ring(
      ctx,
      cx + ch * 0.5,
      cy0 + ch * 0.5,
      ch * rg.mul * easeOutQuart(e),
      W * 0.0035,
      0,
      TAU,
      hexA(scene.accent, 0.45 * (1 - e))
    );
  });

  cards.forEach((c, i) => {
    const e = easeOutBack(seq(t, i, 0.3, 0.8, c.delay), 1.2);
    if (e <= 0.01) return;
    const y = cy0 + i * (ch + size * 1.1);
    const iconS = ch * 0.52;
    const tx = cx + ch * 0.24 + iconS + size * 0.5;
    ctx.save();
    ctx.globalAlpha = clamp01(e);
    ctx.translate(0, (1 - e) * -W * 0.05);
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = W * 0.03;
    fillRound(ctx, cx, y, cw, ch, ch * 0.26, "rgba(20,20,32,0.96)");
    ctx.shadowBlur = 0;
    ctx.strokeStyle = hexA(scene.accent, 0.5);
    ctx.lineWidth = W * 0.0016;
    roundRectPath(ctx, cx, y, cw, ch, ch * 0.26);
    ctx.stroke();

    drawAppIcon(ctx, cx + ch * 0.24, y + (ch - iconS) / 2, iconS, scene.accent, scene.accent2, S.images?.["app-icon"]);

    drawText(ctx, "CST Portal", {
      x: tx,
      y: y + ch * 0.36,
      size: size * 0.72,
      weight: 600,
      color: "#9aa0b4",
    });
    drawText(ctx, c.when, {
      x: cx + cw - size * 0.7,
      y: y + ch * 0.36,
      size: size * 0.72,
      weight: 500,
      color: "#7d8395",
      align: "right",
    });
    drawText(ctx, c.title, {
      x: tx,
      y: y + ch * 0.7,
      size,
      weight: 700,
      color: "#fff",
      maxWidth: cw - (tx - cx) - size * 0.7,
    });
    ctx.restore();
  });
}

/* 5 — support: conversation panel in the gutter */
function paintChat(ctx, S) {
  const { W, t, scene, L } = S;
  const p = L.phone;
  const a = L.accent;
  const size = Math.max(13, W * 0.0155);
  const bw = a.w * 0.96;
  let y = p.y + p.h * 0.1;

  const bubbles = [
    { text: "নোটিশ পাচ্ছি না কেন?", me: true },
    { text: "আপনার অ্যাকাউন্ট এখনো approve হয়নি।", me: false },
    { text: "ধন্যবাদ! এখন ঠিক আছে ✅", me: true },
  ];

  bubbles.forEach((b, i) => {
    const e = easeOutBack(seq(t, i, 0.32, 0.7, 0.7), 1.15);
    if (e <= 0.01) return;
    const lines = wrapText(ctx, b.text, bw - size * 2.2, size, 600);
    const bh = lines.length * size * 1.5 + size * 1.1;
    const bx = b.me ? a.x + bw * 0.22 : a.x;
    ctx.save();
    ctx.globalAlpha = clamp01(e);
    ctx.translate((1 - e) * (b.me ? W * 0.05 : -W * 0.05), 0);
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = W * 0.02;
    fillRound(ctx, bx, y, bw, bh, bw * 0.14, b.me ? scene.accent : "rgba(24,24,38,0.96)");
    ctx.shadowBlur = 0;
    if (!b.me) {
      ctx.strokeStyle = hexA(scene.accent, 0.35);
      ctx.lineWidth = W * 0.0016;
      roundRectPath(ctx, bx, y, bw, bh, bw * 0.14);
      ctx.stroke();
    }
    lines.forEach((line, li) => {
      drawText(ctx, line, {
        x: bx + size * 1.1,
        y: y + size * 1.3 + li * size * 1.5,
        size,
        weight: 600,
        color: b.me ? "#05240f" : "#e6e8f3",
      });
    });
    ctx.restore();
    y += bh + size * 0.85;
  });

  const te = clamp01((t - 2.05) / 0.4);
  if (te > 0) {
    const th = size * 2.6;
    const tx = a.x;
    ctx.save();
    ctx.globalAlpha = te;
    fillRound(ctx, tx, y, size * 5.6, th, size * 0.9, "rgba(24,24,38,0.96)");
    for (let i = 0; i < 3; i += 1) {
      const bounce = Math.sin(t * 6 - i * 0.7) * size * 0.26;
      ctx.fillStyle = "#9aa0b4";
      ctx.beginPath();
      ctx.arc(tx + size * 1.5 + i * size * 1.2, y + th / 2 - bounce, size * 0.28, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

/* 6 — redesign: dark → light scan across the device, floating tiles beside it */
function paintSplitUi(ctx, S) {
  const { W, t, scene, L } = S;
  const p = L.phone;
  const a = L.accent;

  const reveal = easeInOutCubic(clamp01((t - 0.75) / 1.25));
  if (reveal > 0.001 && reveal < 0.999) {
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, p.x, p.y, p.w, p.h, p.w * 0.115);
    ctx.clip();
    const splitY = p.y + p.h * reveal;
    const g = ctx.createLinearGradient(0, splitY - W * 0.05, 0, splitY + W * 0.05);
    g.addColorStop(0, hexA("#f5f6fb", 0));
    g.addColorStop(0.5, hexA("#f5f6fb", 0.7));
    g.addColorStop(1, hexA("#f5f6fb", 0));
    ctx.fillStyle = g;
    ctx.fillRect(p.x, splitY - W * 0.05, p.w, W * 0.1);
    ctx.fillStyle = hexA("#ffffff", 0.9);
    ctx.fillRect(p.x, splitY - W * 0.0015, p.w, W * 0.003);
    ctx.restore();
  }

  const tiles = [
    { icon: "bell", label: "নোটিশ", delay: 1.1 },
    { icon: "doc", label: "নোট", delay: 1.3 },
    { icon: "calendar", label: "রুটিন", delay: 1.5 },
  ];
  const ts = Math.min(a.w * 0.62, W * 0.12);
  tiles.forEach((tl, i) => {
    const e = easeOutBack(seq(t, i, 0.24, 0.8, tl.delay), 1.2);
    if (e <= 0.01) return;
    const cx = a.x + a.w * (i % 2 === 0 ? 0.38 : 0.66);
    const cy = a.y + a.h * (0.26 + i * 0.28);
    ctx.save();
    ctx.globalAlpha = clamp01(e * 0.96);
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(t * 0.8 + i) * 0.05);
    ctx.scale(e, e);
    ctx.shadowColor = hexA(scene.accent, 0.6);
    ctx.shadowBlur = W * 0.05;
    fillRound(ctx, -ts / 2, -ts / 2, ts, ts, ts * 0.28, "rgba(20,20,32,0.96)");
    ctx.shadowBlur = 0;
    ctx.strokeStyle = hexA(scene.accent, 0.5);
    ctx.lineWidth = W * 0.0016;
    roundRectPath(ctx, -ts / 2, -ts / 2, ts, ts, ts * 0.28);
    ctx.stroke();
    ICONS[tl.icon](ctx, -ts * 0.3, -ts * 0.4, ts * 0.6, "#fff");
    drawText(ctx, tl.label, {
      x: 0,
      y: ts * 0.44,
      size: ts * 0.19,
      weight: 700,
      color: hexA(scene.accent, 1),
      align: "center",
    });
    ctx.restore();
  });
}

/* 7 — faculty: a fanned card stack standing in the gutter */
function paintFan(ctx, S) {
  const { W, t, scene, L } = S;
  const p = L.phone;
  const a = L.accent;
  const cw = a.w * 1.05;
  const ch = cw * 0.42;
  const cxBase = a.x + cw * 0.44;
  const cyBase = p.y + p.h * 0.4;

  for (let i = 3; i >= 1; i -= 1) {
    const e = easeOutBack(seq(t, 3 - i, 0.2, 0.85, 0.55), 1.15);
    if (e <= 0.01) continue;
    const ang = (i - 2) * 0.12 * e;
    ctx.save();
    ctx.globalAlpha = clamp01(e * 0.88);
    ctx.translate(cxBase + (i - 2) * W * 0.022 * e, cyBase - (i - 1) * ch * 0.55);
    ctx.rotate(ang);
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = W * 0.03;
    fillRound(ctx, -cw / 2, -ch / 2, cw, ch, cw * 0.09, "rgba(20,20,32,0.95)");
    ctx.shadowBlur = 0;
    ctx.strokeStyle = hexA(scene.accent, 0.4);
    ctx.lineWidth = W * 0.0015;
    roundRectPath(ctx, -cw / 2, -ch / 2, cw, ch, cw * 0.09);
    ctx.stroke();
    const av = ch * 0.62;
    fillRound(ctx, -cw / 2 + ch * 0.24, -av / 2, av, av, av * 0.5, hexA(scene.accent, 0.32));
    ICONS.user(ctx, -cw / 2 + ch * 0.24, -av / 2, av, scene.accent);
    for (let k = 0; k < 3; k += 1) {
      fillRound(
        ctx,
        -cw / 2 + ch * 1.05,
        -ch * 0.24 + k * ch * 0.22,
        cw * (0.52 - k * 0.13),
        ch * 0.1,
        ch * 0.05,
        "rgba(255,255,255,0.16)"
      );
    }
    ctx.restore();
  }

  const se = easeOutCubic(seq(t, 0, 0, 0.7, 1.35));
  if (se > 0) {
    const sw = a.w * 0.98;
    const sx = a.x + (a.w - sw) / 2;
    const sy = p.y + p.h * 0.76;
    const sh = W * 0.062;
    ctx.save();
    ctx.globalAlpha = se;
    fillRound(ctx, sx, sy, sw, sh, sh / 2, "rgba(18,18,28,0.95)");
    ctx.strokeStyle = hexA(scene.accent, 0.45);
    ctx.lineWidth = W * 0.0018;
    roundRectPath(ctx, sx, sy, sw, sh, sh / 2);
    ctx.stroke();
    ICONS.search(ctx, sx + W * 0.016, sy + W * 0.012, W * 0.036, "#9aa0b4");
    const typed = Math.floor(clamp01((t - 1.6) / 0.5) * 2);
    if (typed > 0) {
      const word = "মিস";
      drawText(ctx, word, {
        x: sx + W * 0.064,
        y: sy + sh * 0.66,
        size: W * 0.023,
        weight: 500,
        color: "#c9ccdd",
      });
      if (Math.floor(t * 2) % 2 === 0) {
        const tw = measure(ctx, word, W * 0.023, 500);
        ctx.fillStyle = scene.accent;
        ctx.fillRect(sx + W * 0.064 + tw + W * 0.006, sy + sh * 0.24, W * 0.003, sh * 0.5);
      }
    }
    ctx.restore();
  }
}

/* 8 — notices: feed cards stacking in the gutter */
function paintCascade(ctx, S) {
  const { W, t, scene, L } = S;
  const p = L.phone;
  const a = L.accent;
  const cw = a.w * 1.02;
  const ch = cw * 0.44;
  const x = a.x;

  for (let i = 0; i < 4; i += 1) {
    const e = easeOutBack(seq(t, i, 0.19, 0.75, 0.45), 1.1);
    if (e <= 0.01) continue;
    const y = p.y + p.h * (0.12 + i * 0.2);
    ctx.save();
    ctx.globalAlpha = clamp01(e * (i === 1 ? 1 : 0.82));
    ctx.translate((1 - e) * -W * 0.06, 0);
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = W * 0.028;
    fillRound(ctx, x, y, cw, ch, cw * 0.1, "rgba(20,20,32,0.95)");
    ctx.shadowBlur = 0;
    ctx.strokeStyle = hexA(i === 1 ? scene.accent : "#ffffff", i === 1 ? 0.6 : 0.12);
    ctx.lineWidth = W * 0.0016;
    roundRectPath(ctx, x, y, cw, ch, cw * 0.1);
    ctx.stroke();
    const ic = ch * 0.56;
    fillRound(ctx, x + ch * 0.24, y + ch * 0.22, ic, ic, ic * 0.3, hexA(scene.accent, 0.28));
    ICONS.bell(ctx, x + ch * 0.24, y + ch * 0.22, ic, scene.accent);
    fillRound(ctx, x + ch * 1.0, y + ch * 0.28, cw * 0.52, ch * 0.17, ch * 0.085, "rgba(255,255,255,0.2)");
    fillRound(ctx, x + ch * 1.0, y + ch * 0.58, cw * 0.32, ch * 0.13, ch * 0.065, "rgba(255,255,255,0.1)");
    ctx.restore();
  }

  const be = easeOutElastic(clamp01((t - 1.5) / 0.9));
  if (be > 0.02) {
    const bs = Math.max(17, W * 0.02);
    const bw = measure(ctx, "নতুন", bs, 800) + bs * 1.7;
    const bh = bs * 2.05;
    const bx = p.x - bw - W * 0.03;
    const by = p.y + p.h * 0.06;
    ctx.save();
    ctx.translate(bx + bw / 2, by);
    ctx.scale(be, be);
    ctx.translate(-(bx + bw / 2), -by);
    ctx.shadowColor = hexA(scene.accent, 0.9);
    ctx.shadowBlur = W * 0.05;
    fillRound(ctx, bx, by - bh * 0.68, bw, bh, bh / 2, scene.accent);
    ctx.restore();
    drawText(ctx, "নতুন", {
      x: bx + bw / 2,
      y: by + bs * 0.05,
      size: bs,
      weight: 800,
      color: "#04222a",
      align: "center",
      alpha: be,
    });
  }
}

/* 9 — notes: material chips orbiting the gutter */
function paintOrbit(ctx, S) {
  const { W, t, scene, L } = S;
  const p = L.phone;
  const a = L.accent;
  const cx = a.x + a.w * 0.5;
  const cy = p.y + p.h * 0.46;
  const labels = ["PDF", "ছবি", "নোট", "সাজেশন", "প্রশ্ন"];
  const size = Math.max(13, W * 0.0155);

  labels.forEach((label, i) => {
    const e = easeOutCubic(seq(t, i, 0.13, 0.95, 0.5));
    if (e <= 0.01) return;
    const angle = -Math.PI / 2 + (i / labels.length) * TAU + t * 0.32;
    const rx = a.w * 0.52;
    const ry = a.h * 0.36;
    const x = cx + Math.cos(angle) * rx;
    const y = cy + Math.sin(angle) * ry;
    const wpx = measure(ctx, label, size, 700) + size * 2.4;
    const hpx = size * 2.1;
    ctx.save();
    ctx.globalAlpha = clamp01(e * 0.95);
    ctx.shadowColor = hexA(scene.accent, 0.45);
    ctx.shadowBlur = W * 0.025;
    fillRound(ctx, x - wpx / 2, y - hpx / 2, wpx, hpx, hpx / 2, "rgba(20,20,32,0.95)");
    ctx.shadowBlur = 0;
    ctx.strokeStyle = hexA(scene.accent, 0.5);
    ctx.lineWidth = W * 0.0016;
    roundRectPath(ctx, x - wpx / 2, y - hpx / 2, wpx, hpx, hpx / 2);
    ctx.stroke();
    drawText(ctx, label, {
      x,
      y: y + size * 0.36,
      size,
      weight: 700,
      color: "#e6e8f3",
      align: "center",
    });
    ctx.restore();
  });

  const se = easeOutBack(seq(t, 0, 0, 0.8, 2.0), 1.15);
  if (se > 0.01) {
    const bw = a.w * 0.92;
    const bh = W * 0.062;
    const bx = a.x + (a.w - bw) / 2;
    const by = p.y + p.h * 0.9;
    ctx.save();
    ctx.globalAlpha = clamp01(se);
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.scale(se, se);
    ctx.translate(-(bx + bw / 2), -(by + bh / 2));
    fillRound(ctx, bx, by, bw, bh, bh / 2, hexA(scene.accent, 0.92));
    drawText(ctx, "৫টি বিষয়", {
      x: bx + bw / 2,
      y: by + bh * 0.68,
      size: W * 0.024,
      weight: 700,
      color: "#04202a",
      align: "center",
    });
    ctx.restore();
  }
}

/* 10 — routine: week grid drawing in the gutter + sweeping "now" line */
function paintWeekgrid(ctx, S) {
  const { W, t, scene, L } = S;
  const p = L.phone;
  const a = L.accent;
  const cols = 5;
  const rows = 4;
  const gw = a.w * 0.98;
  const gh = a.h * 0.52;
  const gx = a.x + (a.w - gw) / 2;
  const gy = p.y + p.h * 0.3;

  const drawP = easeOutCubic(clamp01((t - 0.5) / 1.0));
  const cellW = gw / cols;
  const cellH = gh / rows;
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      const idx = c * rows + r;
      const e = clamp01((drawP * cols * rows - idx) / 2.2);
      if (e <= 0) continue;
      const x = gx + c * cellW;
      const y = gy + r * cellH;
      ctx.save();
      ctx.globalAlpha = 0.92 * e;
      fillRound(ctx, x + 2, y + 2, cellW - 5, cellH - 5, cellW * 0.18, hexA(scene.accent, 0.1 + 0.06 * ((c + r) % 3)));
      ctx.strokeStyle = hexA(scene.accent, 0.35);
      ctx.lineWidth = 1.5;
      roundRectPath(ctx, x + 2, y + 2, cellW - 5, cellH - 5, cellW * 0.18);
      ctx.stroke();
      ctx.restore();
    }
  }

  const nowP = clamp01((t - 1.6) / 2.2);
  if (nowP > 0 && nowP < 1) {
    const ny = gy + gh * nowP;
    const g = ctx.createLinearGradient(gx, 0, gx + gw, 0);
    g.addColorStop(0, hexA(scene.accent, 0));
    g.addColorStop(0.5, hexA(scene.accent, 0.95));
    g.addColorStop(1, hexA(scene.accent2, 0));
    ctx.fillStyle = g;
    ctx.fillRect(gx, ny - W * 0.0025, gw, W * 0.005);
    ctx.save();
    ctx.shadowColor = hexA(scene.accent, 0.9);
    ctx.shadowBlur = W * 0.04;
    ctx.fillStyle = scene.accent;
    ctx.beginPath();
    ctx.arc(gx + gw, ny, W * 0.008, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  const days = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ"];
  for (let c = 0; c < cols; c += 1) {
    const e = easeOutCubic(seq(t, c, 0.09, 0.6, 0.7));
    if (e <= 0) continue;
    drawText(ctx, days[c], {
      x: gx + c * cellW + cellW / 2,
      y: gy - W * 0.014,
      size: W * 0.017,
      weight: 700,
      color: hexA(scene.accent2, 0.9),
      align: "center",
      alpha: e,
    });
  }
}

/* 11 — exams: three section headers with rolling counters in the gutter */
function paintSections(ctx, S) {
  const { W, t, scene, L } = S;
  const p = L.phone;
  const a = L.accent;
  const sections = [
    { label: "মিড", count: 1, color: scene.accent },
    { label: "ফাইনাল", count: 0, color: scene.accent2 },
    { label: "ক্লাস টেস্ট", count: 0, color: "#facc15" },
  ];
  const wpx = a.w * 0.98;
  const x = a.x + (a.w - wpx) / 2;
  const h = Math.max(W * 0.062, wpx * 0.19);

  sections.forEach((sec, i) => {
    const e = easeOutBack(seq(t, i, 0.28, 0.75, 0.65), 1.2);
    if (e <= 0.01) return;
    const y = p.y + p.h * (0.2 + i * 0.24);
    ctx.save();
    ctx.globalAlpha = clamp01(e);
    ctx.translate(-(1 - e) * W * 0.08, 0);
    fillRound(ctx, x, y, wpx, h, h * 0.28, hexA(sec.color, 0.16));
    ctx.strokeStyle = hexA(sec.color, 0.6);
    ctx.lineWidth = W * 0.002;
    roundRectPath(ctx, x, y, wpx, h, h * 0.28);
    ctx.stroke();
    const ic = h * 0.62;
    ICONS.calendar(ctx, x + h * 0.24, y + h * 0.19, ic, sec.color);
    drawText(ctx, sec.label, {
      x: x + h * 0.24 + ic + h * 0.2,
      y: y + h * 0.66,
      size: Math.min(h * 0.42, W * 0.024),
      weight: 700,
      color: "#fff",
    });

    const badge = h * 0.56;
    fillRound(ctx, x + wpx - badge - h * 0.22, y + h * 0.22, badge, badge, badge * 0.34, hexA(sec.color, 0.9));
    const cp = easeOutQuart(clamp01((t - 1.0 - i * 0.28) / 0.8));
    const shown = sec.count === 0 ? 0 : Math.max(1, Math.round(cp * sec.count));
    drawText(ctx, toBn(shown), {
      x: x + wpx - badge / 2 - h * 0.22,
      y: y + h * 0.22 + badge * 0.72,
      size: badge * 0.6,
      weight: 800,
      color: "#0b0b13",
      align: "center",
    });
    ctx.restore();
  });
}

/* 12 — id card: verification scan across the device + QR in the gutter */
function paintScan(ctx, S) {
  const { W, t, scene, L } = S;
  const p = L.phone;
  const a = L.accent;

  const sp = clamp01((t - 0.85) / 1.9);
  if (sp > 0 && sp < 1) {
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, p.x, p.y, p.w, p.h, p.w * 0.115);
    ctx.clip();
    const sy = p.y + p.h * sp;
    const g = ctx.createLinearGradient(0, sy - p.h * 0.13, 0, sy + p.h * 0.13);
    g.addColorStop(0, hexA(scene.accent, 0));
    g.addColorStop(0.5, hexA(scene.accent, 0.5));
    g.addColorStop(1, hexA(scene.accent, 0));
    ctx.fillStyle = g;
    ctx.fillRect(p.x, sy - p.h * 0.13, p.w, p.h * 0.26);
    ctx.fillStyle = hexA(scene.accent, 0.95);
    ctx.fillRect(p.x, sy - W * 0.001, p.w, W * 0.002);
    ctx.restore();
  }

  const qs = Math.min(a.w * 0.66, W * 0.16);
  const qx = a.x + (a.w - qs) / 2;
  const qy = p.y + p.h * 0.08;
  const qp = clamp01((t - 0.75) / 0.95);
  const rise = easeOutBack(clamp01((t - 0.65) / 0.8), 1.15);
  if (rise > 0.01 && qp > 0) {
    ctx.save();
    ctx.globalAlpha = clamp01(rise);
    ctx.translate(qx + qs / 2, qy + qs / 2);
    ctx.scale(rise, rise);
    ctx.translate(-(qx + qs / 2), -(qy + qs / 2));
    ctx.shadowColor = hexA(scene.accent, 0.5);
    ctx.shadowBlur = W * 0.06;
    drawQr(ctx, qx, qy, qs, qp);
    ctx.restore();
  }

  const ve = easeOutBack(seq(t, 0, 0, 0.7, 1.9), 1.2);
  if (ve > 0.01) {
    const vs = Math.max(15, W * 0.0185);
    const vw = measure(ctx, "যাচাই করা হয়েছে", vs, 700) + vs * 4.2;
    const vh = vs * 2.5;
    const vx = a.x + (a.w - vw) / 2;
    const vy = qy + qs * 1.35;
    ctx.save();
    ctx.globalAlpha = clamp01(ve);
    ctx.translate(vx + vw / 2, vy + vh / 2);
    ctx.scale(ve, ve);
    ctx.translate(-(vx + vw / 2), -(vy + vh / 2));
    ctx.shadowColor = hexA(scene.accent2, 0.7);
    ctx.shadowBlur = W * 0.05;
    fillRound(ctx, vx, vy, vw, vh, vh / 2, scene.accent2);
    ctx.shadowBlur = 0;
    ICONS.check(ctx, vx + vs * 0.5, vy + vs * 0.6, vs * 1.3, "#123005");
    drawText(ctx, "যাচাই করা হয়েছে", {
      x: vx + vs * 2.3,
      y: vy + vh * 0.64,
      size: vs,
      weight: 700,
      color: "#123005",
    });
    ctx.restore();
  }
}

/* 13 — cta: end card, particles converge into a QR + install button */
function paintConverge(ctx, S) {
  const { W, H, t, scene } = S;
  const cx = W * 0.5;
  const cy = H * 0.575;

  const conv = easeOutCubic(clamp01((t - 0.25) / 1.4));
  ctx.save();
  for (let i = 0; i < 54; i += 1) {
    const ang = (i / 54) * TAU + i * 0.63;
    const startR = Math.max(W, H) * 0.6;
    const r = startR * (1 - conv) + W * 0.03;
    ctx.globalAlpha = clamp01(conv * 0.9) * (1 - conv * 0.35);
    ctx.fillStyle = i % 3 === 0 ? scene.accent2 : scene.accent;
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos(ang + t * 0.4) * r,
      cy + Math.sin(ang + t * 0.4) * r * 0.9,
      W * 0.0034 * (1 + (i % 4) * 0.45),
      0,
      TAU
    );
    ctx.fill();
  }
  ctx.restore();

  const qs = Math.min(W * 0.3, H * 0.17);
  const qx = cx - qs / 2;
  const qy = cy - qs / 2;
  const rise = easeOutBack(clamp01((t - 1.0) / 0.8), 1.15);
  const qp = clamp01((t - 1.35) / 0.95);

  if (rise > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp01(rise);
    ctx.translate(cx, cy);
    ctx.scale(rise, rise);
    ctx.translate(-cx, -cy);
    ctx.shadowColor = hexA(scene.accent, 0.5);
    ctx.shadowBlur = W * 0.09;
    drawQr(ctx, qx, qy, qs, qp);
    ctx.restore();

    const scanP = clamp01((t - 2.3) / 1.5);
    if (scanP > 0 && scanP < 1) {
      const sy = qy - qs * 0.2 + qs * 1.4 * scanP;
      const sg = ctx.createLinearGradient(0, sy - qs * 0.16, 0, sy + qs * 0.16);
      sg.addColorStop(0, hexA(scene.accent, 0));
      sg.addColorStop(0.5, hexA(scene.accent, 0.9));
      sg.addColorStop(1, hexA(scene.accent, 0));
      ctx.fillStyle = sg;
      ctx.fillRect(qx - qs * 0.12, sy - qs * 0.16, qs * 1.24, qs * 0.32);
    }
  }

  const capE = easeOutCubic(seq(t, 0, 0, 0.7, 1.9));
  if (capE > 0) {
    drawText(ctx, "রিলিজ পেজ · QR স্ক্যান করুন", {
      x: cx,
      y: qy + qs * 1.28,
      size: W * 0.024,
      weight: 600,
      color: "#9aa0b4",
      align: "center",
      alpha: capE,
    });
  }

  const pe = easeOutBack(seq(t, 0, 0, 0.75, 2.6), 1.2);
  if (pe > 0.01) {
    const bw = W * 0.42;
    const bh = W * 0.086;
    const bx = cx - bw / 2;
    const by = qy + qs * 1.5;
    const pulse = 1 + Math.sin(t * 3.2) * 0.022;
    ctx.save();
    ctx.globalAlpha = clamp01(pe);
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.scale(pe * pulse, pe * pulse);
    ctx.translate(-(bx + bw / 2), -(by + bh / 2));
    ctx.shadowColor = hexA(scene.accent2, 0.85);
    ctx.shadowBlur = W * 0.08;
    fillRound(ctx, bx, by, bw, bh, bh / 2, scene.accent2);
    ctx.shadowBlur = 0;
    ICONS.check(ctx, bx + bh * 0.34, by + bh * 0.24, bh * 0.52, "#04281a");
    drawText(ctx, "ফ্রি ইনস্টল করুন", {
      x: bx + bw * 0.6,
      y: by + bh * 0.67,
      size: bh * 0.44,
      weight: 800,
      color: "#04281a",
      align: "center",
    });
    ctx.restore();
  }
}

/* ==================================================================== */

const PAINTERS = {
  rings: paintSplash,
  statement: paintStatement,
  countdown: paintCountdown,
  ping: paintPing,
  chat: paintChat,
  splitUi: paintSplitUi,
  fan: paintFan,
  cascade: paintCascade,
  orbit: paintOrbit,
  weekgrid: paintWeekgrid,
  sections: paintSections,
  scan: paintScan,
  converge: paintConverge,
};

/** Scenes that are pure typography and therefore draw no device. */
const TEXT_HERO = new Set(["rings", "statement", "converge"]);

/**
 * Device entrance mode per scene (keyed by scene id) so no two screens reveal
 * the phone the same way. Modes are implemented in `withPhone`.
 */
export const PHONE_MOTION = {
  deadlines: "rise",
  push: "drop",
  support: "slideL",
  redesign: "flip",
  faculty: "zoom",
  notices: "settle",
  notes: "slideR",
  routine: "swing",
  exams: "flip3d",
  idcard: "swoop",
};

/** Headline entrance mode per scene (scene id → drawTitle mode). */
export const TITLE_MOTION = {
  deadlines: "rise",
  push: "blur",
  support: "slideUp",
  redesign: "scale",
  faculty: "drop",
  notices: "reveal",
  notes: "word",
  routine: "wipe",
  exams: "slideIn",
  idcard: "tilt",
  cta: "flipUp",
};

export function drawSceneBody(ctx, S) {
  const painter = PAINTERS[S.scene.motion] || paintStatement;

  if (!TEXT_HERO.has(S.scene.motion)) {
    drawDevice(ctx, S, { mode: PHONE_MOTION[S.scene.id] || "rise", delay: 0.2 });
  }

  drawKicker(ctx, S);

  if (S.scene.motion !== "rings" && S.scene.motion !== "statement") {
    drawTitle(ctx, S, { mode: TITLE_MOTION[S.scene.id] || "rise", size: S.L.titleSize });
    drawSubtitle(ctx, S, { delay: 1.0, maxWidth: S.L.textW * 0.92 });
  }

  painter(ctx, S);
}

export function drawSceneBullets(ctx, S) {
  if (!S.scene.bullets) return;
  drawBullets(ctx, S, { delay: 0.62 });
}
