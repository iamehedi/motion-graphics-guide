import { roundRectPath, TAU } from "./core.js";

/** Every icon draws inside a square box of `s` px anchored at (x, y). */
const box = (ctx, x, y, s, color) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.085);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
};

export function iconBell(ctx, x, y, s, color) {
  box(ctx, x, y, s, color);
  const cx = x + s / 2;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.32, y + s * 0.68);
  ctx.quadraticCurveTo(cx - s * 0.32, y + s * 0.16, cx, y + s * 0.16);
  ctx.quadraticCurveTo(cx + s * 0.32, y + s * 0.16, cx + s * 0.32, y + s * 0.68);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.42, y + s * 0.68);
  ctx.lineTo(cx + s * 0.42, y + s * 0.68);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, y + s * 0.8, s * 0.1, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function iconDoc(ctx, x, y, s, color) {
  box(ctx, x, y, s, color);
  const w = s * 0.62;
  const h = s * 0.8;
  const ox = x + (s - w) / 2;
  const oy = y + (s - h) / 2;
  roundRectPath(ctx, ox, oy, w, h, s * 0.1);
  ctx.stroke();
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(ox + w * 0.2, oy + h * (0.34 + i * 0.2));
    ctx.lineTo(ox + w * (i === 2 ? 0.55 : 0.8), oy + h * (0.34 + i * 0.2));
    ctx.stroke();
  }
  ctx.restore();
}

export function iconCalendar(ctx, x, y, s, color) {
  box(ctx, x, y, s, color);
  const w = s * 0.76;
  const h = s * 0.66;
  const ox = x + (s - w) / 2;
  const oy = y + (s - h) / 2 + s * 0.05;
  roundRectPath(ctx, ox, oy, w, h, s * 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, oy + h * 0.28);
  ctx.lineTo(ox + w, oy + h * 0.28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + w * 0.26, oy - s * 0.1);
  ctx.lineTo(ox + w * 0.26, oy + s * 0.04);
  ctx.moveTo(ox + w * 0.74, oy - s * 0.1);
  ctx.lineTo(ox + w * 0.74, oy + s * 0.04);
  ctx.stroke();
  ctx.restore();
}

export function iconUser(ctx, x, y, s, color) {
  box(ctx, x, y, s, color);
  const cx = x + s / 2;
  ctx.beginPath();
  ctx.arc(cx, y + s * 0.33, s * 0.19, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.33, y + s * 0.86);
  ctx.quadraticCurveTo(cx - s * 0.33, y + s * 0.52, cx, y + s * 0.52);
  ctx.quadraticCurveTo(cx + s * 0.33, y + s * 0.52, cx + s * 0.33, y + s * 0.86);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function iconChat(ctx, x, y, s, color) {
  box(ctx, x, y, s, color);
  const w = s * 0.78;
  const h = s * 0.58;
  const ox = x + (s - w) / 2;
  const oy = y + s * 0.16;
  roundRectPath(ctx, ox, oy, w, h, s * 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + w * 0.26, oy + h);
  ctx.lineTo(ox + w * 0.2, oy + h + s * 0.16);
  ctx.lineTo(ox + w * 0.5, oy + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function iconClipboard(ctx, x, y, s, color) {
  box(ctx, x, y, s, color);
  const w = s * 0.64;
  const h = s * 0.8;
  const ox = x + (s - w) / 2;
  const oy = y + (s - h) / 2;
  roundRectPath(ctx, ox, oy, w, h, s * 0.1);
  ctx.stroke();
  roundRectPath(ctx, ox + w * 0.28, oy - s * 0.07, w * 0.44, s * 0.16, s * 0.05);
  ctx.fill();
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(ox + w * 0.22, oy + h * (0.36 + i * 0.2));
    ctx.lineTo(ox + w * 0.78, oy + h * (0.36 + i * 0.2));
    ctx.stroke();
  }
  ctx.restore();
}

export function iconCap(ctx, x, y, s, color) {
  box(ctx, x, y, s, color);
  const cx = x + s / 2;
  ctx.beginPath();
  ctx.moveTo(cx, y + s * 0.24);
  ctx.lineTo(cx + s * 0.42, y + s * 0.44);
  ctx.lineTo(cx, y + s * 0.64);
  ctx.lineTo(cx - s * 0.42, y + s * 0.44);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.24, y + s * 0.55);
  ctx.lineTo(cx - s * 0.24, y + s * 0.78);
  ctx.quadraticCurveTo(cx, y + s * 0.92, cx + s * 0.24, y + s * 0.78);
  ctx.lineTo(cx + s * 0.24, y + s * 0.55);
  ctx.stroke();
  ctx.restore();
}

export function iconCheck(ctx, x, y, s, color) {
  box(ctx, x, y, s, color);
  ctx.beginPath();
  ctx.moveTo(x + s * 0.22, y + s * 0.52);
  ctx.lineTo(x + s * 0.42, y + s * 0.72);
  ctx.lineTo(x + s * 0.8, y + s * 0.28);
  ctx.stroke();
  ctx.restore();
}

export function iconSearch(ctx, x, y, s, color) {
  box(ctx, x, y, s, color);
  ctx.beginPath();
  ctx.arc(x + s * 0.44, y + s * 0.44, s * 0.26, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + s * 0.64, y + s * 0.64);
  ctx.lineTo(x + s * 0.82, y + s * 0.82);
  ctx.stroke();
  ctx.restore();
}

export const ICONS = {
  bell: iconBell,
  doc: iconDoc,
  calendar: iconCalendar,
  user: iconUser,
  chat: iconChat,
  clipboard: iconClipboard,
  cap: iconCap,
  check: iconCheck,
  search: iconSearch,
};
