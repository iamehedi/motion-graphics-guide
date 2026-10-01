import {
  SCENES,
  TOTAL_DURATION,
  layoutFor,
  drawSceneBody,
  drawSceneBullets,
} from "./scenes.js";
import { drawBackground } from "./background.js";
import { TRANSITION_BY_SCENE, drawTransition } from "./transitions.js";
import { clamp01, easeInOutCubic, hexA, drawText, toBn } from "./core.js";

export const TRANS = 0.5;
export const TOTAL_SECONDS = TOTAL_DURATION / 1000;

export { toBn };

const DUR = SCENES.map((s) => s.duration / 1000);
const STARTS = DUR.reduce((acc, d, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + DUR[i - 1]);
  return acc;
}, []);

/** Which scene is on screen at time `T`, plus any in-flight transition. */
export function resolveTime(T) {
  const time = Math.max(0, Math.min(T, TOTAL_SECONDS));
  let i = 0;
  while (i < SCENES.length - 1 && time >= STARTS[i] + DUR[i]) i += 1;
  const local = time - STARTS[i];
  const tail = DUR[i] - local < TRANS && i < SCENES.length - 1;
  return {
    index: i,
    local,
    next: tail ? i + 1 : null,
    progress: tail ? clamp01((local - (DUR[i] - TRANS)) / TRANS) : 0,
  };
}

function drawOverlays(ctx, W, H, T, index) {
  const scene = SCENES[index];
  const total = TOTAL_SECONDS;
  const p = clamp01(T / total);

  // top progress rail
  const railH = Math.max(4, W * 0.0045);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fillRect(0, 0, W, railH);
  const g = ctx.createLinearGradient(0, 0, W * p, 0);
  g.addColorStop(0, scene.accent);
  g.addColorStop(1, scene.accent2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W * p, railH);

  // chapter label
  const size = Math.max(15, W * 0.018);
  const label = `${toBn(index + 1)} / ${toBn(SCENES.length)} · ${scene.chip}`;
  ctx.globalAlpha = 0.7;
  drawText(ctx, label, {
    x: W * 0.075,
    y: H - W * 0.032,
    size,
    weight: 600,
    color: "#8c92a8",
  });
  ctx.globalAlpha = 1;

  // brand mark
  const brandSize = Math.max(15, W * 0.018);
  drawText(ctx, "CST Portal", {
    x: W * 0.925,
    y: H - W * 0.032,
    size: brandSize,
    weight: 700,
    color: hexA(scene.accent, 0.75),
    align: "right",
  });

  // scene ticks along the progress rail
  const segW = W * 0.62;
  const x0 = (W - segW) / 2;
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  for (let i = 1; i < SCENES.length; i += 1) {
    const sx = x0 + (segW * (STARTS[i] / total));
    ctx.fillRect(sx, H - W * 0.06, Math.max(1.2, W * 0.0015), W * 0.012);
  }
  ctx.fillStyle = hexA(scene.accent, 0.9);
  const cx = x0 + segW * p;
  ctx.beginPath();
  ctx.arc(cx, H - W * 0.054, W * 0.0042, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Renders one full frame of the promo at time `T` (seconds).
 * assets = { images, backdrop, overlays }
 */
export function renderFrame(ctx, W, H, T, assets) {
  const { images, backdrop, overlays = true } = assets;
  const L = layoutFor(W, H);
  const { index, local, next, progress } = resolveTime(T);

  const drawFull = (scene, t) => {
    const S = { ctx, W, H, t, scene, L, images };
    drawBackground(ctx, W, H, backdrop, {
      t: T,
      accent: scene.accent,
      accent2: scene.accent2,
      mode: scene.bg,
      sceneId: scene.id,
    });
    drawSceneBody(ctx, S);
    drawSceneBullets(ctx, S);
  };

  ctx.clearRect(0, 0, W, H);

  if (next === null) {
    drawFull(SCENES[index], local);
  } else {
    // Every scene carries its own cut: motion + compositing style.
    const e = easeInOutCubic(progress);
    const type = TRANSITION_BY_SCENE[SCENES[next].id] || "wipe";
    drawTransition(ctx, W, H, type, e, SCENES[index], local, SCENES[next], drawFull);
  }

  if (overlays) drawOverlays(ctx, W, H, T, index);
}

/** Mini hairline caption used by the export panel preview strip. */
export function sceneAt(T) {
  return SCENES[resolveTime(T).index];
}

export { SCENES, STARTS, DUR };
