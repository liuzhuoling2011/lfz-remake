// Helpers for windows rebuilt from the original game's own UI sprites (interface/*.spr) with the exe's layout.
// A window is drawn in its *original 640x480 pixel space*: (0,0) = the dialog anchor the exe passes to its blitter
// (sprite hotspots carry the per-widget offsets), scaled by `sc` and placed at screen (ax, ay). HD sheets are picked
// up transparently by drawFrame, and text is vector (crisp at any scale).
import { app, type Rect } from '../core/app';
import { drawFrame, frameRect } from '../core/assets';
import { sfx } from '../core/audio';

export interface Win { sc: number; ax: number; ay: number }

export function winBegin(ctx: CanvasRenderingContext2D, w: Win, alpha = 1) {
  ctx.save();
  ctx.setTransform(app.dpr * w.sc, 0, 0, app.dpr * w.sc, app.dpr * w.ax, app.dpr * w.ay);
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
}
export function winEnd(ctx: CanvasRenderingContext2D) { ctx.restore(); }
/** window-local rect → screen rect (for hit testing) */
export function wr(w: Win, r: Rect): Rect { return { x: w.ax + r.x * w.sc, y: w.ay + r.y * w.sc, w: r.w * w.sc, h: r.h * w.sc }; }

/**
 * Original widget: three frames (normal, highlight, pressed) of one sheet, all drawn at the window anchor like the exe's
 * widget list (struct {x, y, sprite, cur, normal, hover, press}). Returns the screen hit rect.
 */
export function wbtn(ctx: CanvasRenderingContext2D, w: Win, id: string, sheet: string, frames: [number, number, number], onClick: () => void,
  o: { disabled?: boolean; active?: boolean; sound?: string | null } = {}) {
  const st = o.disabled ? 0 : app.state(id);
  const fi = o.active ? frames[1] : frames[st];
  if (o.disabled) { const a = ctx.globalAlpha; ctx.globalAlpha = a * 0.45; drawFrame(ctx, sheet, frames[0], 0, 0); ctx.globalAlpha = a; }
  else drawFrame(ctx, sheet, fi, 0, 0);
  const r = wr(w, frameRect(sheet, frames[0], 0, 0));
  if (!o.disabled) app.hit(id, r, () => { if (o.sound !== null) void sfx(o.sound ?? 'interface/click'); onClick(); });
  return r;
}

/** Centred dialog placement used by the exe for detailinfo/card: x = (W - fw)/2 + 10, y = (H - fh)/2 - 40 (640x480). */
export function centredWin(w: number, h: number, fw: number, fh: number, hot: [number, number] /* frame offset from anchor */, cap = 2.2): Win {
  const sc = Math.max(0.5, Math.min((w - 12) / (fw + 14), (h - 12) / (fh + 14), cap));
  // exact exe formula (anchor, frame drawn at anchor + hot)
  let ax = (w - fw * sc) / 2 + 10 * sc;
  let ay = (h - fh * sc) / 2 - 40 * sc;
  // keep the frame on screen when there is no room for the original's off-centre nudge
  ax = Math.max(6 - hot[0] * sc, Math.min(w - 6 - (fw + hot[0]) * sc, ax));
  ay = Math.max(6 - hot[1] * sc, Math.min(h - 6 - (fh + hot[1]) * sc, ay));
  return { sc, ax, ay };
}
/** Bottom-left system/option placement: original x = 10 / 140, y = H - 300 (640x480). */
export function sysScale(w: number, h: number) { return Math.max(0.75, Math.min(2.2, Math.min(w / 640, h / 480))); }
