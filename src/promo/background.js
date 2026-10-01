import { TAU, hexA, clamp01, lerp } from "./core.js";

const rand = (seed) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

/* --- deterministic value noise, shared by the topographic terrain layer --- */
function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}
function vnoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function noise2(x, y) {
  return 0.65 * vnoise(x, y) + 0.35 * vnoise(x * 2.1 + 19.7, y * 2.1 + 7.3);
}

/** Nodes of the erosion river trail kept in the carve brush. */
const TRAIL = 12;
/** Normalized position of the carving river at path-parameter `tt`. */
function riverPoint(tt) {
  const a = tt * 0.22;
  const x = 0.5 + 0.36 * Math.sin(a) + 0.08 * Math.sin(a * 2.7 + 1.3);
  const y = 0.5 + 0.3 * Math.sin(a * 0.7 + 2.1) + 0.1 * Math.cos(a * 1.9);
  return [x, y];
}

function makeGrain(size = 160) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  const data = g.createImageData(size, size);
  const r = rand(7);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 120 + r() * 135;
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 22 + r() * 40;
  }
  g.putImageData(data, 0, 0);
  return c;
}

/**
 * Per-scene backdrop style. Keeps one topographic language across the video
 * while giving every screen a distinct density / weight / colour treatment.
 *   step  — contour spacing multiplier (>1 sparser, <1 denser)
 *   line  — minor hairline alpha
 *   major — every 5th isoline alpha
 *   river — draw the traveling erosion channel + waterline
 *   orb   — colour-orb intensity multiplier
 */
const SCENE_STYLE = {
  splash: { step: 1.45, line: 0.09, major: 0.24, river: false, orb: 1.2 },
  upgrade: { step: 1.15, line: 0.11, major: 0.28, river: true, orb: 1.05 },
  deadlines: { step: 0.78, line: 0.14, major: 0.36, river: true, orb: 0.9 },
  push: { step: 1.0, line: 0.12, major: 0.32, river: true, orb: 0.85 },
  support: { step: 0.7, line: 0.15, major: 0.34, river: false, orb: 0.8 },
  redesign: { step: 1.3, line: 0.1, major: 0.3, river: true, orb: 1.15 },
  faculty: { step: 0.88, line: 0.13, major: 0.35, river: true, orb: 0.9 },
  notices: { step: 1.12, line: 0.11, major: 0.28, river: false, orb: 1.0 },
  notes: { step: 0.74, line: 0.15, major: 0.33, river: true, orb: 0.85 },
  routine: { step: 1.35, line: 0.1, major: 0.27, river: true, orb: 1.1 },
  exams: { step: 0.82, line: 0.14, major: 0.36, river: false, orb: 0.9 },
  idcard: { step: 1.22, line: 0.11, major: 0.32, river: true, orb: 1.05 },
  cta: { step: 0.95, line: 0.13, major: 0.34, river: true, orb: 1.2 },
};
const DEFAULT_STYLE = { step: 1, line: 0.13, major: 0.3, river: true, orb: 1 };

/** Precomputed, resolution independent backdrop state. */
export function createBackdrop(seed = 1) {
  const r = rand(seed * 977 + 13);
  const particles = Array.from({ length: 64 }, () => ({
    x: r(),
    y: r(),
    rad: 0.8 + r() * 2.6,
    speed: 0.008 + r() * 0.03,
    drift: (r() - 0.5) * 0.05,
    phase: r() * TAU,
    alpha: 0.12 + r() * 0.5,
  }));
  const orbs = Array.from({ length: 4 }, (_, i) => ({
    bx: 0.18 + r() * 0.64,
    by: 0.16 + r() * 0.66,
    rad: 0.28 + r() * 0.3,
    amp: 0.05 + r() * 0.08,
    speed: 0.18 + r() * 0.24,
    phase: r() * TAU,
    use: i % 2 === 0 ? "accent" : "accent2",
  }));
  // --- topographic terrain heightfield (base noise + drift phase), built once
  const N = 64;
  const NN = N * N;
  const contourStep = 0.085;
  const freq = 3.4 / (N - 1);
  const driftFreq = 0.9 / (N - 1);
  const base = new Float32Array(NN);
  const driftPhase = new Float32Array(NN);
  for (let gy = 0; gy < N; gy += 1) {
    for (let gx = 0; gx < N; gx += 1) {
      base[gy * N + gx] = noise2(gx * freq + 11.8, gy * freq + 5.2);
      driftPhase[gy * N + gx] = noise2(gx * driftFreq + 41.3, gy * driftFreq + 27.6) * TAU;
    }
  }
  const terrain = {
    N,
    contourStep,
    base,
    driftPhase,
    ambientAmp: contourStep * 0.42,
    driftSpeed: TAU / 10,
    field: new Float32Array(NN),
    carve: new Float32Array(NN),
    tx: new Float32Array(TRAIL),
    ty: new Float32Array(TRAIL),
  };

  return { particles, orbs, grain: makeGrain(), terrain };
}

/**
 * Draws the full-bleed background. `mode` switches the structural layer so each
 * scene reads differently while sharing one visual language.
 */
export function drawBackground(ctx, W, H, bd, opts) {
  const {
    t = 0,
    accent = "#7c5cff",
    accent2 = "#22d3ee",
    mode = "aurora",
    intensity = 1,
    sceneId = null,
  } = opts;
  const style = SCENE_STYLE[sceneId] || DEFAULT_STYLE;
  const orbIntensity = intensity * (style.orb ?? 1);

  // --- base vertical wash
  const base = ctx.createLinearGradient(0, 0, W * 0.35, H);
  base.addColorStop(0, "#0a0a15");
  base.addColorStop(0.55, "#080810");
  base.addColorStop(1, "#05050b");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // --- drifting colour orbs
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const orb of bd.orbs) {
    const px = (orb.bx + Math.cos(t * orb.speed + orb.phase) * orb.amp) * W;
    const py = (orb.by + Math.sin(t * orb.speed * 0.8 + orb.phase) * orb.amp) * H;
    const rad = orb.rad * Math.max(W, H);
    const col = orb.use === "accent" ? accent : accent2;
    const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
    g.addColorStop(0, hexA(col, 0.26 * orbIntensity));
    g.addColorStop(0.45, hexA(col, 0.08 * orbIntensity));
    g.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();

  // --- structural layer
  if (mode === "grid" || mode === "cells" || mode === "sections") {
    drawGrid(ctx, W, H, t, accent);
  } else if (mode === "rays") {
    drawRays(ctx, W, H, t, accent, accent2);
  } else if (mode === "beams") {
    drawBeams(ctx, W, H, t, accent);
  } else if (mode === "arcs") {
    drawArcs(ctx, W, H, t, accent);
  } else if (mode === "dots") {
    drawDotField(ctx, W, H, t, accent, accent2);
  } else if (mode === "terrain" && bd.terrain) {
    drawTerrain(ctx, W, H, bd.terrain, t, accent, accent2, style);
  }

  // --- particles
  ctx.save();
  for (const p of bd.particles) {
    const yy = ((p.y + t * p.speed) % 1.15) - 0.075;
    const xx = p.x + Math.sin(t * 0.35 + p.phase) * p.drift;
    const a = p.alpha * (1 - Math.abs(yy - 0.5) * 1.1);
    if (a <= 0.01) continue;
    ctx.globalAlpha = clamp01(a);
    ctx.fillStyle = hexA(accent2, 0.9);
    ctx.beginPath();
    ctx.arc(xx * W, yy * H, p.rad * (W / 1080) * 1.6, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // --- vignette
  const vig = ctx.createRadialGradient(
    W * 0.5,
    H * 0.5,
    Math.min(W, H) * 0.28,
    W * 0.5,
    H * 0.5,
    Math.max(W, H) * 0.78
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // --- film grain
  ctx.save();
  ctx.globalAlpha = 0.5;
  const gx = -Math.floor((t * 90) % 160);
  const gy = -Math.floor((t * 140) % 160);
  for (let x = gx; x < W; x += 160) {
    for (let y = gy; y < H; y += 160) {
      ctx.drawImage(bd.grain, x, y);
    }
  }
  ctx.restore();
}

/* ------------------------------------------------------------- layers */

function drawGrid(ctx, W, H, t, accent) {
  const cell = Math.max(W, H) * 0.062;
  const off = (t * 14) % cell;
  ctx.save();
  ctx.strokeStyle = hexA(accent, 0.09);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = -cell + off; x < W + cell; x += cell) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = -cell + off; y < H + cell; y += cell) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawRays(ctx, W, H, t, accent, accent2) {
  const cx = W * 0.5;
  const cy = H * 0.42;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.06);
  const n = 22;
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * TAU;
    const len = Math.max(W, H) * 0.95;
    const grd = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
    grd.addColorStop(0, hexA(i % 2 ? accent : accent2, 0.13));
    grd.addColorStop(1, hexA(accent, 0));
    ctx.strokeStyle = grd;
    ctx.lineWidth = W * 0.012;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBeams(ctx, W, H, t, accent) {
  ctx.save();
  for (let i = 0; i < 5; i += 1) {
    const p = ((t * 0.16 + i * 0.21) % 1);
    const x = lerp(-W * 0.4, W * 1.2, p);
    const grd = ctx.createLinearGradient(x - W * 0.18, 0, x + W * 0.18, H);
    grd.addColorStop(0, hexA(accent, 0));
    grd.addColorStop(0.5, hexA(accent, 0.1));
    grd.addColorStop(1, hexA(accent, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(x - W * 0.06, 0);
    ctx.lineTo(x + W * 0.06, 0);
    ctx.lineTo(x + W * 0.3, H);
    ctx.lineTo(x + W * 0.14, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawArcs(ctx, W, H, t, accent) {
  const cx = W * 0.5;
  const cy = H * 0.46;
  ctx.save();
  ctx.lineWidth = Math.max(1.5, W * 0.0025);
  for (let i = 0; i < 7; i += 1) {
    const r = ((t * 0.12 + i / 7) % 1) * Math.max(W, H) * 0.8;
    const a = 0.16 * (1 - ((t * 0.12 + i / 7) % 1));
    ctx.strokeStyle = hexA(accent, a);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Topographic erosion layer: a value-noise heightfield rendered as marching-
 * squares isolines (minor hairlines, every 5th brighter), with slow ambient
 * drift ripples and a river that carves a channel and shows a waterline. All
 * per-frame state lives in the preallocated arrays on `terr`.
 */
function drawTerrain(ctx, W, H, terr, t, accent, accent2, style) {
  const st = style || DEFAULT_STYLE;
  const { N, base, driftPhase, contourStep, ambientAmp, driftSpeed, field, carve, tx, ty } = terr;
  const NN = N * N;
  const cellW = W / (N - 1);
  const cellH = H / (N - 1);
  const river = st.river !== false;
  let gx0 = 0;
  let gx1 = N - 1;
  let gy0 = 0;
  let gy1 = N - 1;

  // --- river trail + carve delta (only for scenes that show the river)
  carve.fill(0);
  if (river) {
    const trailStep = 0.14;
    for (let i = 0; i < TRAIL; i += 1) {
      const [nx, ny] = riverPoint(t - i * trailStep);
      tx[i] = nx * W;
      ty[i] = ny * H;
    }

    const sigma = Math.max(W, H) * 0.032;
    const inv2s2 = 1 / (2 * sigma * sigma);
    const reach = sigma * 3;
    let bx0 = Infinity;
    let bx1 = -Infinity;
    let by0 = Infinity;
    let by1 = -Infinity;
    for (let i = 0; i < TRAIL; i += 1) {
      if (tx[i] < bx0) bx0 = tx[i];
      if (tx[i] > bx1) bx1 = tx[i];
      if (ty[i] < by0) by0 = ty[i];
      if (ty[i] > by1) by1 = ty[i];
    }
    gx0 = Math.max(0, Math.floor((bx0 - reach) / cellW));
    gx1 = Math.min(N - 1, Math.ceil((bx1 + reach) / cellW));
    gy0 = Math.max(0, Math.floor((by0 - reach) / cellH));
    gy1 = Math.min(N - 1, Math.ceil((by1 + reach) / cellH));
    for (let gy = gy0; gy <= gy1; gy += 1) {
      const py = gy * cellH;
      const row = gy * N;
      for (let gx = gx0; gx <= gx1; gx += 1) {
        const px = gx * cellW;
        let sum = 0;
        for (let i = 0; i < TRAIL; i += 1) {
          const dx = px - tx[i];
          const dy = py - ty[i];
          const wgt = Math.exp(-(dx * dx + dy * dy) * inv2s2);
          if (wgt > 0.01) sum += wgt;
        }
        if (sum > 0) carve[row + gx] = sum > 1 ? 1 : sum * 0.55;
      }
    }
  }

  // --- heightfield + bounds
  let minH = Infinity;
  let maxH = -Infinity;
  for (let i = 0; i < NN; i += 1) {
    const v = base[i] + ambientAmp * Math.sin(driftPhase[i] - t * driftSpeed) - carve[i];
    field[i] = v;
    if (v < minH) minH = v;
    if (v > maxH) maxH = v;
  }

  // --- waterline: only the carved channel, the single earned accent
  if (river) {
    ctx.save();
    ctx.fillStyle = hexA(accent2, 0.24);
    for (let gy = gy0; gy <= gy1; gy += 1) {
      const py = gy * cellH;
      const row = gy * N;
      for (let gx = gx0; gx <= gx1; gx += 1) {
        if (carve[row + gx] <= 0.12) continue;
        ctx.fillRect(gx * cellW - cellW / 2, py - cellH / 2, cellW + 1, cellH + 1);
      }
    }
    ctx.restore();
  }

  // --- marching squares isolines, batched into minor/major paths
  const minor = new Path2D();
  const major = new Path2D();
  const step = contourStep * (st.step || 1);
  const kMin = Math.ceil(minH / step);
  const kMax = Math.floor(maxH / step);
  for (let k = kMin; k <= kMax; k += 1) {
    const th = k * step;
    const path = k % 5 === 0 ? major : minor;
    for (let gy = 0; gy < N - 1; gy += 1) {
      const rowA = gy * N;
      const rowB = rowA + N;
      const y0 = gy * cellH;
      const y1 = y0 + cellH;
      for (let gx = 0; gx < N - 1; gx += 1) {
        const a = field[rowA + gx];
        const b = field[rowA + gx + 1];
        const c = field[rowB + gx + 1];
        const d = field[rowB + gx];
        const code =
          (a > th ? 8 : 0) | (b > th ? 4 : 0) | (c > th ? 2 : 0) | (d > th ? 1 : 0);
        if (code === 0 || code === 15) continue;
        const x0 = gx * cellW;
        const x1 = x0 + cellW;
        const topX = x0 + (cellW * (th - a)) / (b - a);
        const rightY = y0 + (cellH * (th - b)) / (c - b);
        const botX = x0 + (cellW * (th - d)) / (c - d);
        const leftY = y0 + (cellH * (th - a)) / (d - a);
        switch (code) {
          case 1:
          case 14:
            path.moveTo(x0, leftY);
            path.lineTo(botX, y1);
            break;
          case 2:
          case 13:
            path.moveTo(botX, y1);
            path.lineTo(x1, rightY);
            break;
          case 3:
          case 12:
            path.moveTo(x0, leftY);
            path.lineTo(x1, rightY);
            break;
          case 4:
          case 11:
            path.moveTo(topX, y0);
            path.lineTo(x1, rightY);
            break;
          case 5:
            path.moveTo(topX, y0);
            path.lineTo(x1, rightY);
            path.moveTo(x0, leftY);
            path.lineTo(botX, y1);
            break;
          case 6:
          case 9:
            path.moveTo(topX, y0);
            path.lineTo(botX, y1);
            break;
          case 7:
          case 8:
            path.moveTo(topX, y0);
            path.lineTo(x0, leftY);
            break;
          case 10:
            path.moveTo(topX, y0);
            path.lineTo(x0, leftY);
            path.moveTo(botX, y1);
            path.lineTo(x1, rightY);
            break;
          default:
            break;
        }
      }
    }
  }
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = hexA(accent2, st.line ?? 0.13);
  ctx.lineWidth = Math.max(1, W * 0.0011);
  ctx.stroke(minor);
  ctx.strokeStyle = hexA(accent, st.major ?? 0.3);
  ctx.lineWidth = Math.max(1.2, W * 0.0016);
  ctx.stroke(major);
  ctx.restore();
}

function drawDotField(ctx, W, H, t, accent, accent2) {
  const step = Math.max(W, H) * 0.055;
  ctx.save();
  for (let x = step / 2; x < W; x += step) {
    for (let y = step / 2; y < H; y += step) {
      const d = Math.hypot(x - W * 0.5, y - H * 0.45) / Math.max(W, H);
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 - d * 8);
      const a = clamp01(0.1 + pulse * 0.16 * (1 - d));
      ctx.fillStyle = hexA(d > 0.5 ? accent2 : accent, a);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.2, W * 0.0018 + pulse * W * 0.0022), 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}
