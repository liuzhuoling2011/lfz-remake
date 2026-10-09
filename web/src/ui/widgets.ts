import { app, type Rect } from '../core/app';
import { drawFrame, frameRect, sheet } from '../core/assets';
import { text, roundRect, FONT } from '../core/text';
import { sfx } from '../core/audio';

export interface Stage { s: number; ox: number; oy: number; W: number; H: number }
export function stage(w: number, h: number, W = 800, H = 600): Stage {
  const s = Math.min(w / W, h / H);
  return { s, ox: (w - W * s) / 2, oy: (h - H * s) / 2, W, H };
}
export function applyStage(ctx: CanvasRenderingContext2D, st: Stage) {
  ctx.setTransform(app.dpr * st.s, 0, 0, app.dpr * st.s, app.dpr * st.ox, app.dpr * st.oy);
}
export function resetT(ctx: CanvasRenderingContext2D) { ctx.setTransform(app.dpr, 0, 0, app.dpr, 0, 0); }
export function sr(st: Stage, r: Rect): Rect { return { x: st.ox + r.x * st.s, y: st.oy + r.y * st.s, w: r.w * st.s, h: r.h * st.s }; }

let patternCache: CanvasPattern | null = null;
export function patternBg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#2a63b8'; ctx.fillRect(0, 0, w, h);
  const sh = sheet('misc/pattern');
  if (sh?.img) {
    if (!patternCache) {
      const f = sh.f[0]; const c = document.createElement('canvas'); c.width = f[2]; c.height = f[3];
      c.getContext('2d')!.drawImage(sh.img, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
      patternCache = ctx.createPattern(c, 'repeat');
    }
    if (patternCache) { ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = patternCache; ctx.translate((app.time / 40) % 91, (app.time / 60) % 93); ctx.fillRect(-100, -100, w + 200, h + 200); ctx.restore(); }
  }
  const gr = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,10,40,0.55)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
}

/** Sprite button in stage coords. frames = [normal, hover, pressed] (pressed optional). */
export function sbtn(ctx: CanvasRenderingContext2D, st: Stage, id: string, sh: string, frames: number[], ax: number, ay: number, onClick: () => void, opts: { disabled?: boolean; selected?: boolean; scale?: number } = {}) {
  const sc = opts.scale ?? 1;
  const state = opts.disabled ? 0 : app.state(id);
  const fi = opts.selected ? frames[frames.length > 2 ? 2 : 1] : frames[Math.min(state, frames.length - 1)];
  if (opts.disabled) { ctx.save(); ctx.globalAlpha = 0.45; }
  drawFrame(ctx, sh, fi, ax, ay, sc);
  if (opts.disabled) ctx.restore();
  const r = frameRect(sh, frames[0], ax, ay, sc);
  if (!opts.disabled) app.hit(id, sr(st, r), () => { void sfx('mainmenu/click'); onClick(); });
  return r;
}

export interface BtnOpts { disabled?: boolean; primary?: boolean; danger?: boolean; size?: number; selected?: boolean; icon?: () => void; sound?: string | null }
/** Modern button in the original's orange/black style (screen coords unless ctx transformed & rect mapped by caller). */
export function button(ctx: CanvasRenderingContext2D, id: string, r: Rect, label: string, onClick: () => void, o: BtnOpts = {}, hitRect?: Rect) {
  const st = o.disabled ? 0 : app.state(id);
  const press = st === 2 ? 2 : 0;
  ctx.save();
  ctx.translate(0, press);
  const rad = Math.min(12, r.h * 0.3);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(ctx, r.x + 2, r.y + 4 - press, r.w, r.h, rad); ctx.fill();
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  if (o.disabled) { g.addColorStop(0, '#9a9a9a'); g.addColorStop(1, '#6c6c6c'); }
  else if (o.danger) { g.addColorStop(0, st ? '#ff8b8b' : '#f25b5b'); g.addColorStop(1, '#a51c1c'); }
  else if (o.selected) { g.addColorStop(0, '#fff3a0'); g.addColorStop(1, '#f2b01e'); }
  else if (o.primary) { g.addColorStop(0, st ? '#ffc070' : '#ffa53a'); g.addColorStop(0.5, st ? '#ff9a2a' : '#ff7a0a'); g.addColorStop(1, '#c84a00'); }
  else { g.addColorStop(0, st ? '#5c6f9a' : '#46587f'); g.addColorStop(1, '#232c44'); }
  ctx.fillStyle = g; roundRect(ctx, r.x, r.y, r.w, r.h, rad); ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = o.primary || o.selected ? '#5a1d00' : '#0d1220'; ctx.stroke();
  ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff'; roundRect(ctx, r.x + 3, r.y + 3, r.w - 6, r.h * 0.38, rad * 0.7); ctx.fill(); ctx.globalAlpha = 1;
  const size = o.size ?? Math.min(22, r.h * 0.42);
  text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + size * 0.36, { size, align: 'center', color: o.disabled ? '#ddd' : o.selected ? '#4a2000' : '#fff', stroke: o.selected ? undefined : 'rgba(0,0,0,0.55)', strokeWidth: 3, maxWidth: r.w - 10 });
  ctx.restore();
  if (!o.disabled) app.hit(id, hitRect ?? r, () => { if (o.sound !== null) void sfx(o.sound ?? 'interface/click'); onClick(); });
}

/** Cream paper panel with orange frame (matches original message boxes). */
export function panel(ctx: CanvasRenderingContext2D, r: Rect, o: { title?: string; color?: string } = {}) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; roundRect(ctx, r.x + 4, r.y + 7, r.w, r.h, 18); ctx.fill();
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, '#3fa7e0'); g.addColorStop(1, '#1d5fa8');
  ctx.fillStyle = g; roundRect(ctx, r.x, r.y, r.w, r.h, 18); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#0b2a55'; ctx.stroke();
  const i = 9;
  const g2 = ctx.createLinearGradient(0, r.y + i, 0, r.y + r.h - i);
  g2.addColorStop(0, '#fffaf0'); g2.addColorStop(1, '#f5e6c4');
  ctx.fillStyle = g2; roundRect(ctx, r.x + i, r.y + i, r.w - i * 2, r.h - i * 2, 12); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#c98a2c'; ctx.stroke();
  if (o.title) {
    const tw = Math.min(r.w - 40, Math.max(140, o.title.length * 22 + 40));
    const tr = { x: r.x + r.w / 2 - tw / 2, y: r.y - 16, w: tw, h: 36 };
    const g3 = ctx.createLinearGradient(0, tr.y, 0, tr.y + tr.h); g3.addColorStop(0, '#ffb347'); g3.addColorStop(1, '#e0560b');
    ctx.fillStyle = g3; roundRect(ctx, tr.x, tr.y, tr.w, tr.h, 10); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#5a1d00'; ctx.stroke();
    text(ctx, o.title, tr.x + tr.w / 2, tr.y + 26, { size: 20, align: 'center', color: '#fff', stroke: '#5a1d00', strokeWidth: 4, maxWidth: tw - 16 });
  }
  ctx.restore();
}

export function dim(ctx: CanvasRenderingContext2D, w: number, h: number, a = 0.45) { ctx.fillStyle = `rgba(5,10,25,${a})`; ctx.fillRect(0, 0, w, h); }

export function slider(ctx: CanvasRenderingContext2D, id: string, r: Rect, v: number, onChange: (v: number) => void, hitMap?: (r: Rect) => Rect) {
  ctx.save();
  ctx.fillStyle = '#2b2b3a'; roundRect(ctx, r.x, r.y + r.h / 2 - 6, r.w, 12, 6); ctx.fill();
  const g = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0); g.addColorStop(0, '#ffcf3a'); g.addColorStop(1, '#ff6a00');
  ctx.fillStyle = g; roundRect(ctx, r.x, r.y + r.h / 2 - 6, Math.max(12, r.w * v), 12, 6); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#5a1d00'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(r.x + r.w * v, r.y + r.h / 2, r.h * 0.42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
  // 10 discrete hit zones for touch friendliness
  for (let i = 0; i <= 10; i++) {
    const zr = { x: r.x + (r.w * (i - 0.5)) / 10, y: r.y, w: r.w / 10, h: r.h };
    app.hit(id + i, hitMap ? hitMap(zr) : zr, () => onChange(i / 10));
  }
}
export { FONT };
