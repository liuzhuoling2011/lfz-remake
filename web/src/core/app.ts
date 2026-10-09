// Canvas app: HiDPI canvas, scene stack, immediate-mode hit regions, main loop.
export interface Rect { x: number; y: number; w: number; h: number }
export interface Scene {
  enter?(): void;
  exit?(): void;
  update?(dt: number): void;
  render(ctx: CanvasRenderingContext2D, w: number, h: number): void;
  onPointer?(e: PtrEvent): boolean | void; // return true if consumed
  onWheel?(dx: number, dy: number, x: number, y: number): void;
  onKey?(key: string): void;
}
export interface PtrEvent { type: 'down' | 'move' | 'up' | 'cancel'; x: number; y: number; id: number; button: number }

interface Hit { id: string; r: Rect; cb: () => void; cursor: boolean }

class App {
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  dpr = 1; w = 0; h = 0;
  scene: Scene | null = null;
  time = 0; // ms since start
  frame = 0;
  private hits: Hit[] = [];
  private prevHits: Hit[] = [];
  mx = -1; my = -1; down = false; pressedId: string | null = null;
  hoverId: string | null = null;
  private last = 0;
  private listeners: ((dt: number) => void)[] = [];

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    const resize = () => this.resize();
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    this.resize();
    canvas.addEventListener('pointerdown', e => this.ptr('down', e));
    window.addEventListener('pointermove', e => this.ptr('move', e));
    window.addEventListener('pointerup', e => this.ptr('up', e));
    window.addEventListener('pointercancel', e => this.ptr('cancel', e));
    canvas.addEventListener('wheel', e => { e.preventDefault(); this.scene?.onWheel?.(e.deltaX, e.deltaY, e.offsetX, e.offsetY); }, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', e => { this.scene?.onKey?.(e.key); });
    requestAnimationFrame(t => this.loop(t));
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = window.innerWidth, h = window.innerHeight;
    this.dpr = dpr; this.w = w; this.h = h;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
  }

  setScene(s: Scene) {
    this.scene?.exit?.();
    this.scene = s;
    this.pressedId = null;
    s.enter?.();
  }

  onTick(fn: (dt: number) => void) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter(f => f !== fn); }; }

  private loop(t: number) {
    const dt = this.last ? Math.min(100, t - this.last) : 16;
    this.last = t; this.time += dt; this.frame++;
    { const ls = this.listeners, n = ls.length; for (let i = 0; i < n; i++) ls[i](dt); } // off() swaps in a new array → no per-frame copy
    this.scene?.update?.(dt);
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    this.prevHits = this.hits; this.hits = [];
    this.scene?.render(ctx, this.w, this.h);
    // hover resolution for next frame
    let hov: string | null = null;
    for (let i = this.hits.length - 1; i >= 0; i--) { const h = this.hits[i]; if (inRect(this.mx, this.my, h.r)) { hov = h.id; break; } }
    this.hoverId = hov;
    this.canvas.style.cursor = hov && this.hits.find(h => h.id === hov)?.cursor ? 'pointer' : 'default';
    requestAnimationFrame(tt => this.loop(tt));
  }

  /** Register a clickable region for this frame. Later registrations are on top. */
  hit(id: string, r: Rect, cb: () => void, cursor = true) { this.hits.push({ id, r, cb, cursor }); }
  /** Block everything below (modal). */
  block(r: Rect = { x: 0, y: 0, w: 1e5, h: 1e5 }) { this.hits.push({ id: '__block' + this.hits.length, r, cb: () => {}, cursor: false }); }
  isHover(id: string) { return this.hoverId === id; }
  isPressed(id: string) { return this.pressedId === id && this.down; }
  state(id: string): 0 | 1 | 2 { return this.isPressed(id) ? 2 : this.isHover(id) ? 1 : 0; }

  private topHit(x: number, y: number): Hit | null {
    const hs = this.prevHits.length >= this.hits.length ? this.prevHits : this.hits;
    for (let i = hs.length - 1; i >= 0; i--) if (inRect(x, y, hs[i].r)) return hs[i];
    return null;
  }

  private ptr(type: PtrEvent['type'], e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (type !== 'move' || e.pointerType === 'mouse') { this.mx = x; this.my = y; }
    if (type === 'move' && e.pointerType !== 'mouse' && this.down) { this.mx = x; this.my = y; }
    const pe: PtrEvent = { type, x, y, id: e.pointerId, button: e.button };
    if (type === 'down') {
      this.down = true; this.mx = x; this.my = y;
      const h = this.topHit(x, y);
      this.pressedId = h ? h.id : null;
      if (h) { e.preventDefault(); return; }
    }
    if (type === 'up' || type === 'cancel') {
      this.down = false;
      const pid = this.pressedId; this.pressedId = null;
      if (pid) {
        const h = this.topHit(x, y);
        if (type === 'up' && h && h.id === pid) h.cb();
        if (e.pointerType !== 'mouse') { this.mx = -1; this.my = -1; }
        return;
      }
      if (e.pointerType !== 'mouse') { /* keep for scene */ }
    }
    if (this.pressedId) return;
    this.scene?.onPointer?.(pe);
    if ((type === 'up' || type === 'cancel') && e.pointerType !== 'mouse') { this.mx = -1; this.my = -1; }
  }
}

export function inRect(x: number, y: number, r: Rect) { return x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h; }

export const app = new App();

// ---------------- timing helpers ----------------
const params = new URLSearchParams(location.search);
export const TURBO = params.has('turbo');
export const AUTO = params.has('auto');
export const speedMul = { v: 1 };
export function setSpeedIndex(i: number) { speedMul.v = [1.6, 1, 0.55][i] ?? 1; }

/** Wait (scaled by game speed). In turbo mode returns on next macrotask. */
export function wait(ms: number): Promise<void> {
  const d = TURBO ? 0 : ms * speedMul.v;
  if (d <= 0) return new Promise(res => setTimeout(res, 0));
  // frame-clock based (rAF delta time), so game pacing stays in lock-step with the animations
  return new Promise(res => { let el = 0; const off = app.onTick(dt => { el += dt; if (el >= d) { off(); res(); } }); });
}

/** Tween over ms (scaled), calling fn(t in 0..1) every frame. */
export function tween(ms: number, fn: (t: number) => void, scaled = true): Promise<void> {
  const dur = TURBO ? 0 : ms * (scaled ? speedMul.v : 1);
  if (dur <= 0) { fn(1); return new Promise(r => setTimeout(r, 0)); }
  return new Promise(res => {
    let el = 0;
    const off = app.onTick(dt => {
      el += dt;
      const t = Math.min(1, el / dur);
      fn(t);
      if (t >= 1) { off(); res(); }
    });
  });
}

export const ease = {
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inQuad: (t: number) => t * t,
  outBounce: (t: number) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
  outBack: (t: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
