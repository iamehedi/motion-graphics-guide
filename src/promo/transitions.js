import { TAU, clamp01, hexA } from "./core.js";

/**
 * Per-scene transition table: the effect played when cutting INTO a scene.
 * Every scene gets its own motion and visual style so the video never repeats
 * a cut. `splash` is the opening scene and has no incoming transition.
 */
export const TRANSITION_BY_SCENE = {
  upgrade: "wipe", // diagonal sweep + bright edge
  deadlines: "blinds", // slats opening from their centres
  push: "iris", // circular reveal from the focal point
  support: "pushLeft", // both scenes travel sideways together
  redesign: "zoom", // incoming scene scales up through a fade
  faculty: "checker", // staggered block mosaic
  notices: "flip", // horizontal card flip
  notes: "dissolve", // plain cross-fade
  routine: "pushUp", // both scenes travel vertically together
  exams: "split", // opens from the left and right edges inward
  idcard: "curtain", // opens from the top and bottom edges inward
  cta: "shutter", // staggered vertical bars
};

/**
 * Composites the incoming scene over the outgoing one.
 * `drawFull(scene, localTime)` renders one complete scene frame (background +
 * body + bullets) at that scene's local time.
 */
export function drawTransition(ctx, W, H, type, progress, prevScene, prevT, nextScene, drawFull) {
  const e = clamp01(progress);
  ctx.save();
  switch (type) {
    case "blinds":
      blinds(ctx, W, H, e, prevScene, prevT, nextScene, drawFull);
      break;
    case "iris":
      iris(ctx, W, H, e, prevScene, prevT, nextScene, drawFull);
      break;
    case "pushLeft":
      pushLeft(ctx, W, H, e, prevScene, prevT, nextScene, drawFull);
      break;
    case "pushUp":
      pushUp(ctx, W, H, e, prevScene, prevT, nextScene, drawFull);
      break;
    case "zoom":
      zoom(ctx, W, H, e, prevScene, prevT, nextScene, drawFull);
      break;
    case "checker":
      checker(ctx, W, H, e, prevScene, prevT, nextScene, drawFull);
      break;
    case "flip":
      flip(ctx, W, H, e, prevScene, prevT, nextScene, drawFull);
      break;
    case "dissolve":
      dissolve(ctx, W, H, e, prevScene, prevT, nextScene, drawFull);
      break;
    case "split":
      split(ctx, W, H, e, prevScene, prevT, nextScene, drawFull);
      break;
    case "curtain":
      curtain(ctx, W, H, e, prevScene, prevT, nextScene, drawFull);
      break;
    case "shutter":
      shutter(ctx, W, H, e, prevScene, prevT, nextScene, drawFull);
      break;
    default:
      wipe(ctx, W, H, e, prevScene, prevT, nextScene, drawFull);
      break;
  }
  ctx.restore();
}

/* --------------------------------------------------------------- effects */

function wipe(ctx, W, H, e, ps, pt, ns, drawFull) {
  drawFull(ps, pt);
  ctx.save();
  ctx.beginPath();
  const w = W * e;
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w + W * 0.16, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.clip();
  drawFull(ns, 0);
  ctx.restore();

  if (e < 0.999) {
    const edgeX = W * e;
    const lg = ctx.createLinearGradient(edgeX - W * 0.06, 0, edgeX + W * 0.04, H);
    lg.addColorStop(0, hexA(ns.accent, 0));
    lg.addColorStop(0.5, hexA(ns.accent, 0.8));
    lg.addColorStop(1, hexA(ns.accent, 0));
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(edgeX - W * 0.06, 0);
    ctx.lineTo(edgeX + W * 0.04, 0);
    ctx.lineTo(edgeX + W * 0.2, H);
    ctx.lineTo(edgeX + W * 0.1, H);
    ctx.closePath();
    ctx.fill();
  }
}

function blinds(ctx, W, H, e, ps, pt, ns, drawFull) {
  drawFull(ps, pt);
  const k = 11;
  const sh = H / k;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < k; i += 1) {
    const y = i * sh;
    const hh = sh * e;
    ctx.rect(0, y + (sh - hh) / 2, W, hh + 0.5);
  }
  ctx.clip();
  drawFull(ns, 0);
  ctx.restore();
}

function iris(ctx, W, H, e, ps, pt, ns, drawFull) {
  drawFull(ps, pt);
  const R = Math.hypot(W, H) * 0.62 * e;
  ctx.save();
  ctx.beginPath();
  ctx.arc(W * 0.5, H * 0.46, R, 0, TAU);
  ctx.clip();
  drawFull(ns, 0);
  ctx.restore();
}

function pushLeft(ctx, W, H, e, ps, pt, ns, drawFull) {
  ctx.save();
  ctx.translate(-W * e, 0);
  drawFull(ps, pt);
  ctx.restore();
  ctx.save();
  ctx.translate(W * (1 - e), 0);
  drawFull(ns, 0);
  ctx.restore();
}

function pushUp(ctx, W, H, e, ps, pt, ns, drawFull) {
  ctx.save();
  ctx.translate(0, -H * e);
  drawFull(ps, pt);
  ctx.restore();
  ctx.save();
  ctx.translate(0, H * (1 - e));
  drawFull(ns, 0);
  ctx.restore();
}

function zoom(ctx, W, H, e, ps, pt, ns, drawFull) {
  ctx.save();
  const s1 = 1 + e * 0.18;
  ctx.globalAlpha = 1 - e * 0.85;
  ctx.translate(W / 2, H / 2);
  ctx.scale(s1, s1);
  ctx.translate(-W / 2, -H / 2);
  drawFull(ps, pt);
  ctx.restore();

  ctx.save();
  const s2 = 0.72 + e * 0.28;
  ctx.globalAlpha = clamp01(e * 1.6);
  ctx.translate(W / 2, H / 2);
  ctx.scale(s2, s2);
  ctx.translate(-W / 2, -H / 2);
  drawFull(ns, 0);
  ctx.restore();
}

function checker(ctx, W, H, e, ps, pt, ns, drawFull) {
  drawFull(ps, pt);
  const cols = 9;
  const rows = 15;
  const cw = W / cols;
  const ch = H / rows;
  ctx.save();
  ctx.beginPath();
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cc = r % 2 ? cols - 1 - c : c;
      const order = (r + cc) / (cols + rows);
      const tE = clamp01(e * 1.55 - order * 0.55);
      if (tE <= 0) continue;
      ctx.rect(c * cw, r * ch, cw * tE + 0.5, ch + 0.5);
    }
  }
  ctx.clip();
  drawFull(ns, 0);
  ctx.restore();
}

function flip(ctx, W, H, e, ps, pt, ns, drawFull) {
  drawFull(ps, pt);
  ctx.save();
  ctx.translate(W / 2, 0);
  ctx.scale(Math.max(0.001, e), 1);
  ctx.translate(-W / 2, 0);
  drawFull(ns, 0);
  ctx.restore();
}

function dissolve(ctx, W, H, e, ps, pt, ns, drawFull) {
  drawFull(ps, pt);
  ctx.save();
  ctx.globalAlpha = e;
  drawFull(ns, 0);
  ctx.restore();
}

function split(ctx, W, H, e, ps, pt, ns, drawFull) {
  drawFull(ps, pt);
  const half = W / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, half * e, H);
  ctx.rect(W - half * e, 0, half * e, H);
  ctx.clip();
  drawFull(ns, 0);
  ctx.restore();
}

function curtain(ctx, W, H, e, ps, pt, ns, drawFull) {
  drawFull(ps, pt);
  const half = H / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, half * e);
  ctx.rect(0, H - half * e, W, half * e);
  ctx.clip();
  drawFull(ns, 0);
  ctx.restore();
}

function shutter(ctx, W, H, e, ps, pt, ns, drawFull) {
  drawFull(ps, pt);
  const k = 13;
  const sw = W / k;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < k; i += 1) {
    const tE = clamp01(e * 1.55 - (i / k) * 0.55);
    if (tE <= 0) continue;
    ctx.rect(i * sw, 0, sw * tE + 0.5, H);
  }
  ctx.clip();
  drawFull(ns, 0);
  ctx.restore();
}
