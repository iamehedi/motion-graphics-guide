/* Core drawing primitives for the canvas promo renderer. */

export const TAU = Math.PI * 2;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const clamp01 = (v) => clamp(v, 0, 1);
export const lerp = (a, b, t) => a + (b - a) * t;

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
export const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

export const easeOutBack = (t, s = 1.7) =>
  1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);

export const easeOutElastic = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1;
};

/** Progress of item `i` in a staggered sequence starting at `start`. */
export const seq = (t, i, gap = 0.1, dur = 0.6, start = 0.12) =>
  clamp01((t - start - i * gap) / dur);

/** Applies an easing to a staggered sequence. */
export const seqE = (t, i, gap, dur, start, ease = easeOutCubic) =>
  ease(seq(t, i, gap, dur, start));

export function hexA(hex, alpha) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ---------------------------------------------------------------- paths */

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function fillRound(ctx, x, y, w, h, r, fill) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

/* ---------------------------------------------------------------- text */

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
/** Converts ASCII digits to Bengali numerals. */
export const toBn = (n) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

export const FONT_FAMILY = '"Li Alinur Showpnocari"';
/** আলিনুর স্বপ্নচারী (Lipighor) shapes Bangla; fallbacks cover Latin/numerals. */
export const FONT = `${FONT_FAMILY}, "Noto Sans Bengali", "Noto Sans", "FreeSans", system-ui, sans-serif`;

export function setFont(ctx, size, weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
}

export function drawText(ctx, text, opts = {}) {
  const {
    x = 0,
    y = 0,
    size = 48,
    weight = 700,
    color = "#ffffff",
    align = "left",
    baseline = "alphabetic",
    alpha = 1,
    gradient = null,
    maxWidth = null,
    letterSpacing = null,
  } = opts;

  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= clamp01(alpha);
  setFont(ctx, size, weight);
  if (letterSpacing !== null && "letterSpacing" in ctx) {
    ctx.letterSpacing = `${letterSpacing}px`;
  }
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = gradient || color;
  ctx.fillText(text, x, y, maxWidth || undefined);
  ctx.restore();
}

export function measure(ctx, text, size, weight = 700) {
  ctx.save();
  setFont(ctx, size, weight);
  const w = ctx.measureText(text).width;
  ctx.restore();
  return w;
}

export function wrapText(ctx, text, maxWidth, size, weight = 700) {
  ctx.save();
  setFont(ctx, size, weight);
  const words = String(text).split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  ctx.restore();
  return lines;
}

/* ---------------------------------------------------------- phone frame */

export function drawCover(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/**
 * Draws a device frame with a screenshot inside (cover-fitted, never stretched).
 * `glow` bleeds an accent shadow behind the device.
 */
export function drawPhone(ctx, opts) {
  const { x, y, w, h, img, accent = "#7c5cff", radius = null, glow = 1, fallback = null } = opts;
  const r = radius ?? w * 0.115;
  const pad = Math.max(5, w * 0.021);

  if (glow > 0) {
    ctx.save();
    ctx.shadowColor = hexA(accent, 0.5 * glow);
    ctx.shadowBlur = w * 0.5;
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.62)";
  ctx.shadowBlur = w * 0.34;
  ctx.shadowOffsetY = w * 0.13;
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = "#191924";
  ctx.fill();
  ctx.restore();

  const sx = x + pad;
  const sy = y + pad;
  const sw = w - pad * 2;
  const sh = h - pad * 2;

  ctx.save();
  roundRectPath(ctx, sx, sy, sw, sh, r - pad);
  ctx.clip();
  if (img && img.complete && img.naturalWidth) {
    drawCover(ctx, img, sx, sy, sw, sh);
  } else if (fallback) {
    ctx.save();
    fallback(ctx, sx, sy, sw, sh);
    ctx.restore();
  } else {
    ctx.fillStyle = "#0b0b13";
    ctx.fillRect(sx, sy, sw, sh);
  }
  ctx.restore();

  // bezel edge + inner hairline
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.strokeStyle = "rgba(255,255,255,0.20)";
  ctx.lineWidth = Math.max(1.5, w * 0.006);
  ctx.stroke();
  roundRectPath(ctx, sx, sy, sw, sh, r - pad);
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = Math.max(1, w * 0.004);
  ctx.stroke();
  ctx.restore();
}
