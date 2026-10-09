// Mini-game (小遊戲) framework — reconstructed from omasterq.exe 1.05H (static analysis, see spec/minigames/MINIGAMES.md).
// Everything runs on the original 40 fps logic clock (25 ms ticks) in the original screen space: W×H with the 640×480
// play band at (OX,OY). Coordinates/hotspots are the original SD units; HD sheets are sampled transparently.
import { app, type PtrEvent, TURBO } from '../core/app';
import { drawFrame, sheet, loadSheets, fetchJSON, loadImage, BASE, type Sheet } from '../core/assets';
import { sfx, sfxEx, sfxLoop, music, type LoopHandle } from '../core/audio';
export type { LoopHandle };

export const TICK_MS = 25;
export const rnd = (n: number) => Math.floor(Math.random() * n);
/** FUN_0040e970: (target-cur)/div toward 0, but at least ±1 when not equal */
export function easeStep(cur: number, target: number, div: number) {
  const d = target - cur; if (!d) return 0;
  const s = Math.trunc(d / div); return s !== 0 ? s : d > 0 ? 1 : -1;
}
/** player colours @0x443608 */
export const PCOL = ['rgb(92,203,255)', 'rgb(255,149,0)', 'rgb(74,209,9)', 'rgb(152,71,223)'];

export interface Part { slot: number; char: number; human: boolean; name: string; k: number; x: number; ready: boolean }
export type Key = 0 | 1 | 2 | 3 | 4 | 5; // 0,1 buttons · 2 ← · 3 → · 4 ↑ · 5 ↓
export interface VPtr { type: PtrEvent['type']; vx: number; vy: number; id: number; button: number; mouse: boolean }

export interface MGResult { game: number; winner: number | null; cardId: number | null; scores: (number | null)[]; timeout: boolean; standalone: boolean }

export interface Game {
  id: number; sheets: string[]; sounds: string[]; timer: boolean;
  /** 'card' → 01/04 winner spins the word-card reel; 'rank' → 02/03 result2 ranking */
  resultKind: 'card' | 'rank';
  init(R: Runner): void;
  readyPos(R: Runner, p: Part): [number, number];
  onReady?(R: Runner, p: Part): void;
  /** play-phase logic tick */
  tick(R: Runner): void;
  /** every tick in every phase after the zoom (cosmetic animation) */
  anim?(R: Runner): void;
  key(R: Runner, p: Part, k: Key, down: boolean): void;
  ptr?(R: Runner, p: Part | null, e: VPtr): void;
  draw(ctx: CanvasRenderingContext2D, R: Runner): void;
  scores(R: Runner): (number | null)[];
  /** touch pad layout for this game */
  pad: { dirs: 0 | 2 | 4; buttons: 1 | 2 };
  stop?(): void;
}

// ---------------------------------------------------------------- number.fnt (2x supersampled 1bpp glyphs)
let numFont: { img: CanvasImageSource; g: Record<string, number[]> } | null = null;
const tinted = new Map<string, HTMLCanvasElement>();
export async function loadNumFont() {
  if (numFont) return;
  const [j, im] = await Promise.all([fetchJSON('fonts/minigame/01/number.json'), loadImage(BASE + 'fonts/minigame/01/number.png')]);
  numFont = { img: im, g: j.glyphs };
}
function tint(color: string) {
  let c = tinted.get(color);
  if (!c && numFont) {
    const im = numFont.img as HTMLImageElement;
    c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d')!; x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    tinted.set(color, c);
  }
  return c;
}
export function numWidth(s: string) { if (!numFont) return s.length * 13; let w = 0; for (const ch of s) w += (numFont.g[ch]?.[2] ?? 24) / 2; return w; }
/** draw text top-left at (x,y) in the original 13×26 digit font */
export function numText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color = '#fff', outline: string | null = null) {
  const c = tint(color); if (!c || !numFont) return;
  if (outline) { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) numText(ctx, s, x + dx, y + dy, outline); }
  for (const ch of s) { const g = numFont.g[ch]; if (!g) { x += 12; continue; } ctx.drawImage(c, g[0], g[1], g[2], g[3], x, y, g[2] / 2, g[3] / 2); x += g[2] / 2; }
}

// ---------------------------------------------------------------- sprite helpers
const sil = new WeakMap<object, HTMLCanvasElement>();
/** FUN_00421ef0: black silhouette of a frame squashed to (dw,dh) at the frame's anchor, alpha a (0..255) */
export function drawShadow(ctx: CanvasRenderingContext2D, name: string, fi: number, x: number, y: number, dw: number, dh: number, a: number) {
  const sh = sheet(name); if (!sh?.img) return;
  let c = sil.get(sh.img as object);
  if (!c) {
    const im = sh.img as any; c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d')!; g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
    sil.set(sh.img as object, c);
  }
  const f = sh.f[fi], s = sh.sf[fi]; if (!f) return;
  const ga = ctx.globalAlpha; ctx.globalAlpha = ga * a / 256;
  ctx.drawImage(c, s[0], s[1], s[2], s[3], x - f[4] * dw / f[2], y - f[5] * dh / f[3], dw, dh);
  ctx.globalAlpha = ga;
}
/** draw a frame resized to (dw,dh) with its hotspot scaled accordingly (FUN_00422740) */
export function drawSized(ctx: CanvasRenderingContext2D, name: string, fi: number, x: number, y: number, dw: number, dh: number) {
  const sh = sheet(name); if (!sh?.img) return;
  const f = sh.f[fi], s = sh.sf[fi]; if (!f) return;
  ctx.drawImage(sh.img, s[0], s[1], s[2], s[3], x - f[4] * dw / f[2], y - f[5] * dh / f[3], dw, dh);
}
const masks = new WeakMap<object, ImageData>();
/** FUN_00420fd0: is the pixel (px,py) of frame fi drawn at (x,y) opaque? */
export function pixelHit(sh: Sheet | null, fi: number, x: number, y: number, px: number, py: number) {
  if (!sh?.img) return false;
  const f = sh.f[fi], s = sh.sf[fi]; if (!f) return false;
  const lx = px - x + f[4], ly = py - y + f[5];
  if (lx < 0 || ly < 0 || lx >= f[2] || ly >= f[3]) return false;
  let m = masks.get(sh.img as object);
  if (!m) {
    const im = sh.img as any; const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d', { willReadFrequently: true })!; g.drawImage(im, 0, 0); m = g.getImageData(0, 0, c.width, c.height); masks.set(sh.img as object, m);
  }
  const k = sh.hs; const sx = Math.floor(s[0] + lx * k), sy = Math.floor(s[1] + ly * k);
  return m.data[(sy * m.width + sx) * 4 + 3] > 0;
}

// ---------------------------------------------------------------- input devices
// Original devices (input_devices.json): KEYBOARD01 PageDown,Delete,←,→,↑,↓ · KEYBOARD02 E,Q,A,D,W,S · KEYBOARD03 O,U,J,L,I,K
// + MOUSE. Web: the first human also gets Space/Enter/Z (button 0) and X/Backspace (button 1), the mouse and the touch pad.
const KB: Record<string, Key>[] = [
  { PageDown: 0, Delete: 1, ArrowLeft: 2, ArrowRight: 3, ArrowUp: 4, ArrowDown: 5, Space: 0, Enter: 0, NumpadEnter: 0, KeyZ: 0, KeyX: 1, Backspace: 1 },
  { KeyE: 0, KeyQ: 1, KeyA: 2, KeyD: 3, KeyW: 4, KeyS: 5 },
  { KeyO: 0, KeyU: 1, KeyJ: 2, KeyL: 3, KeyI: 4, KeyK: 5 },
];

// ---------------------------------------------------------------- banner (ready.spr / timeout.spr / finish.spr)
export class Banner {
  sh: string; ax = 0; bx = 0; alpha = 0; st: 'in' | 'hold' | 'shrink' | 'grow' | 'hold2' | 'done' = 'in'; s = 32; hold = 0; frames: number;
  constructor(R: Runner, public kind: 'ready' | 'timeout' | 'finish') {
    this.sh = 'minigame/' + kind;
    const f = sheet(this.sh)?.f; this.frames = f?.length ?? 3;
    this.ax = -((f?.[0]?.[2] ?? 244) / 2); this.bx = R.W + (f?.[1]?.[2] ?? 320) / 2;
    R.snd('minigame/zoomin', 200 / 255);
  }
  get done() { return this.st === 'done'; }
  tick(R: Runner) {
    switch (this.st) {
      case 'in':
        this.ax += easeStep(this.ax, R.cx, 4); this.bx += easeStep(this.bx, R.cx, 4); this.alpha = Math.min(255, this.alpha + 16);
        if (this.ax === R.cx && this.bx === R.cx) { this.st = 'hold'; this.hold = 0; }
        break;
      case 'hold': if (++this.hold >= 60) this.st = 'shrink'; break;
      case 'shrink': if (--this.s <= 1) { if (this.frames > 3) { this.st = 'grow'; this.s = 1; } else this.st = 'done'; } break;
      case 'grow': this.s = Math.min(32, this.s + 3); if (this.s >= 32) { this.st = 'hold2'; this.hold = 0; } break;
      case 'hold2': if (++this.hold >= 40) this.st = 'done'; break;
    }
  }
  draw(ctx: CanvasRenderingContext2D, R: Runner) {
    const { cx, cy } = R;
    if (this.st === 'in' || this.st === 'hold') {
      drawFrame(ctx, this.sh, 1, this.ax, cy); drawFrame(ctx, this.sh, 0, this.bx, cy);
      drawFrame(ctx, this.sh, 2, cx, cy, 1, this.alpha / 255);
    } else if (this.st === 'shrink') {
      const k = this.s / 32; drawFrame(ctx, this.sh, 1, cx, cy, k); drawFrame(ctx, this.sh, 0, cx, cy, k); drawFrame(ctx, this.sh, 2, cx, cy, k);
    } else if (this.st === 'grow' || this.st === 'hold2') drawFrame(ctx, this.sh, 3, cx, cy, this.s / 32);
  }
}

// ---------------------------------------------------------------- runner
type Phase = 'load' | 'intro' | 'zoom' | 'ready' | 'start' | 'play' | 'end' | 'result' | 'done';
export interface ResultScreen { tick(R: Runner): void; draw(ctx: CanvasRenderingContext2D, R: Runner): void; done: boolean; key?(p: Part, k: Key, down: boolean): void; tap?(): void; stop?(): void }

export interface RunnerOpts {
  game: Game; parts: (Omit<Part, 'k' | 'x' | 'ready'> & { k?: number })[]; standalone: boolean; snapshot?: HTMLCanvasElement | null;
  makeResult: (R: Runner) => ResultScreen | null; onDone: (r: MGResult) => void;
}

export class Runner {
  W = 640; H = 480; OX = 0; OY = 0; cx = 320; cy = 240;
  phase: Phase = 'load'; ticks = 0; t = 0; // t = play-phase ticks (timer)
  parts: Part[]; game: Game; standalone: boolean;
  banner: Banner | null = null; result: ResultScreen | null = null;
  winner: number | null = null; timeout = false; cardId: number | null = null;
  private acc = 0; private q: { slot: number; k: Key; down: boolean }[] = [];
  held: boolean[][] = [0, 1, 2, 3].map(() => [false, false, false, false, false, false]);
  // intro / zoom
  stripX = 0; panelF = 0; panelT = 0; zw = 370; zh = 278;
  bob = 0; bobDir = 1;
  snap: HTMLCanvasElement | null;
  private loops: LoopHandle[] = [];
  /** screen transform of the last render (virtual → css px) */
  s = 1; ox = 0; oy = 0;
  touchUI: boolean; pad: { id: string; x: number; y: number; r: number; k: Key }[] = []; padDown = new Map<number, Key>();
  ptrOwner = new Map<number, number>(); // pointer id → slot
  humans: Part[];
  speed: number;

  constructor(public o: RunnerOpts) {
    this.game = o.game; this.standalone = o.standalone; this.snap = o.snapshot ?? null;
    const a = app.w / Math.max(1, app.h);
    if (a >= 4 / 3) { this.H = 480; this.W = Math.round(Math.min(1280, 480 * a) / 2) * 2; }
    else { this.W = 640; this.H = Math.round(Math.min(1440, 640 / a) / 2) * 2; }
    this.OX = (this.W - 640) / 2; this.OY = (this.H - 480) / 2; this.cx = this.W / 2; this.cy = this.H / 2;
    const n = o.parts.length;
    this.parts = o.parts.map((p, i) => ({ ...p, k: (p.k ?? 0) | 0, x: n >= 4 ? Math.floor(this.W / 4) * p.slot + Math.floor(this.W / 8) : Math.floor(this.W / (2 * n)) + i * Math.floor(this.W / n), ready: false }));
    this.humans = this.parts.filter(p => p.human);
    this.touchUI = matchMedia?.('(pointer: coarse)').matches || false;
    const mq = Number(new URLSearchParams(location.search).get('mgspeed'));
    this.speed = TURBO ? 4000 : mq > 0 ? mq : 1;
    this.stripX = this.W + 773;
    void this.load();
  }

  async load() {
    const common = ['minigame/turn/bg', 'minigame/turn/game01', 'minigame/turn/game02', 'minigame/turn/game03', 'minigame/turn/game04',
      'minigame/ready', 'minigame/finish', 'minigame/timeout', 'minigame/pressbutton',
      'minigame/result2/bg', 'minigame/result2/face', 'minigame/result2/number', ...[1, 2, 3, 4].map(i => `minigame/result2/player0${i}`)];
    await Promise.all([loadSheets([...common, ...this.game.sheets]), loadNumFont().catch(e => console.warn(e))]);
    music(this.game.id === 0 || this.game.id === 2 ? 'minigame03.mp3' : 'AudioTrack07_1.mp3');
    this.game.init(this);
    this.snd('minigame/turn/frame');
    this.phase = 'intro';
  }

  // ---- audio helpers (silent in turbo)
  snd(name: string, vol = 1, pan = 0) { if (!TURBO && this.speed <= 4) void (pan ? sfxEx(name, vol, pan) : vol === 1 ? sfx(name) : sfxEx(name, vol)); }
  loop(name: string, vol = 1): LoopHandle { if (TURBO || this.speed > 4) return { playing: false, stop() {} }; const h = sfxLoop(name, vol); this.loops.push(h); return h; }
  stopSounds() { for (const l of this.loops) l.stop(); this.loops = []; }

  part(slot: number) { return this.parts.find(p => p.slot === slot) ?? null; }

  // ---- timeline
  update(dt: number) {
    if (this.phase === 'load' || this.phase === 'done') return;
    if (this.speed > 4) { for (let i = 0; i < this.speed && (this.phase as Phase) !== 'done'; i++) this.tick(); return; }
    this.acc += dt * this.speed;
    let n = 0;
    while (this.acc >= TICK_MS && n++ < 8 && (this.phase as Phase) !== 'done') { this.acc -= TICK_MS; this.tick(); }
    if (this.acc > TICK_MS * 8) this.acc = 0;
  }

  private tick() {
    this.ticks++;
    const evs = this.q; this.q = [];
    // pressbutton bob: -10..+2 px, 1 px per tick
    this.bob += this.bobDir; if (this.bob < -10) this.bobDir = 1; if (this.bob > 2) this.bobDir = -1;
    switch (this.phase) {
      case 'intro': {
        if (this.stripX !== this.cx) { this.stripX += easeStep(this.stripX, this.cx, 8); break; }
        if (++this.panelT > 30) { this.panelT = 0; if (++this.panelF > 5) { this.panelF = 5; this.phase = 'zoom'; } }
        break;
      }
      case 'zoom': {
        const sw = easeStep(this.zw, this.W, 4), sh = easeStep(this.zh, this.H, 4);
        this.zw += sw; this.zh += sh;
        if (Math.abs(sw) < 2 && Math.abs(sh) < 2) { this.zw = this.W; this.zh = this.H; this.phase = 'ready'; }
        break;
      }
      case 'ready': {
        for (const p of this.parts) if (!p.human && !p.ready) this.setReady(p);
        for (const e of evs) { const p = this.part(e.slot); if (p && !p.ready && !e.down && e.k <= 1) this.setReady(p); }
        if (this.parts.every(p => p.ready)) { this.banner = new Banner(this, 'ready'); this.phase = 'start'; }
        break;
      }
      case 'start':
        this.banner!.tick(this);
        if (this.banner!.done) { this.banner = null; this.phase = 'play'; this.t = 0; }
        break;
      case 'play': {
        for (const e of evs) { const p = this.part(e.slot); if (p?.human) this.game.key(this, p, e.k, e.down); }
        this.game.tick(this);
        if (this.phase !== 'play') break;
        if (this.game.timer) { this.t++; if (Math.floor(this.t / 40) >= 30) this.end(null, true); }
        break;
      }
      case 'end':
        this.banner!.tick(this);
        if (this.banner!.done) {
          this.banner = null; this.game.stop?.();
          this.result = this.o.makeResult(this);
          if (this.result) this.phase = 'result'; else this.finishAll();
        }
        break;
      case 'result':
        for (const e of evs) { const p = this.part(e.slot); if (p && this.result!.key) this.result!.key(p, e.k, e.down); }
        this.result!.tick(this);
        if (this.result!.done) this.finishAll();
        break;
    }
    const ph = this.phase as Phase; if (ph !== 'intro' && ph !== 'result' && ph !== 'done') this.game.anim?.(this);
  }
  setReady(p: Part) { p.ready = true; this.snd('minigame/drip', 0.5); this.game.onReady?.(this, p); }
  /** game over: winner slot (01/04) or null; timeout = TIME IS UP */
  end(winner: number | null, timeout = false) {
    if (this.phase !== 'play') return;
    this.winner = winner; this.timeout = timeout;
    this.banner = new Banner(this, timeout ? 'timeout' : 'finish');
    this.phase = 'end';
  }
  private finishAll() {
    this.phase = 'done'; this.stopSounds(); this.game.stop?.(); this.result?.stop?.();
    const scores = this.game.scores(this);
    this.o.onDone({ game: this.game.id, winner: this.winner, cardId: this.cardId, scores, timeout: this.timeout, standalone: this.standalone });
  }
  abort() { if (this.phase !== 'done') { this.phase = 'done'; this.stopSounds(); this.game.stop?.(); this.result?.stop?.(); } }

  // ---- timer (FUN_00419f90 / 0041c860 / 0041d8a0)
  drawTimer(ctx: CanvasRenderingContext2D) {
    const { cx, cy } = this;
    const t = Math.min(1200, this.t);
    const w = Math.floor(t * 487 / 1200), x0 = cx - 253;
    if (w > 0) {
      ctx.fillStyle = 'rgb(154,255,153)'; ctx.fillRect(x0, cy - 195, w, 1);
      ctx.fillStyle = 'rgb(3,228,0)'; ctx.fillRect(x0, cy - 194, w, 20);
      ctx.fillStyle = 'rgb(1,91,0)'; ctx.fillRect(x0, cy - 174, w, 1); ctx.fillRect(x0 + w - 1, cy - 194, 1, 20);
    }
    const s = String(Math.max(0, 30 - Math.floor(t / 40))).padStart(2, '0');
    numText(ctx, s, cx - numWidth(s) / 2 + 0x112, cy - 0xd9, '#fff', '#000');
  }
  /** pressbutton.spr: frame1 base + frame0 bobbing */
  drawPress(ctx: CanvasRenderingContext2D, x: number, y: number) {
    drawFrame(ctx, 'minigame/pressbutton', 1, x, y); drawFrame(ctx, 'minigame/pressbutton', 0, x, y + this.bob);
  }
  /** play band clip (0,OY)-(W-1,OY+479) */
  clipBand(ctx: CanvasRenderingContext2D) { ctx.beginPath(); ctx.rect(0, this.OY, this.W, 480); ctx.clip(); }

  // ---- render
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const dpr = app.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const s = Math.min(w / this.W, h / this.H); this.s = s; this.ox = (w - this.W * s) / 2; this.oy = (h - this.H * s) / 2;
    const backdrop = () => {
      if (this.snap) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.snap, 0, 0, ctx.canvas.width, ctx.canvas.height); }
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * this.ox, dpr * this.oy);
    };
    ctx.imageSmoothingEnabled = true;
    if (this.phase === 'load') { backdrop(); return; }
    if (this.phase === 'intro') {
      backdrop();
      const i = this.game.id, sx = this.stripX, sy = this.cy;
      const g = (n: number) => `minigame/turn/game0${n}`;
      drawFrame(ctx, g(((i + 1) & 3) + 1), this.panelF, sx - 0x267, sy - 0x8c);
      drawFrame(ctx, g(i + 1), this.panelF, sx - 0xbe, sy - 0x8c);
      drawFrame(ctx, g(((i + 2) & 3) + 1), this.panelF, sx + 0xee, sy - 0x8c);
      drawFrame(ctx, 'minigame/turn/bg', 0, sx, sy);
      return;
    }
    if (this.phase === 'zoom') {
      backdrop();
      const zx = this.cx - this.zw / 2, zy = this.cy - this.zh / 2;
      ctx.save(); ctx.beginPath(); ctx.rect(zx, zy, this.zw, this.zh); ctx.clip();
      ctx.translate(zx, zy); ctx.scale(this.zw / this.W, this.zh / this.H);
      this.drawGame(ctx); ctx.restore();
      return;
    }
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * this.ox, dpr * this.oy);
    if (this.result && this.phase === 'result' && (this.result as any).full) { this.result.draw(ctx, this); }
    else {
      this.drawGame(ctx);
      if (this.banner) this.banner.draw(ctx, this);
      if (this.result && this.phase === 'result') this.result.draw(ctx, this);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawPad(ctx, w, h);
  }
  private drawGame(ctx: CanvasRenderingContext2D) {
    ctx.save(); this.game.draw(ctx, this); ctx.restore();
    if (this.phase === 'ready' || this.phase === 'zoom') {
      for (const p of this.parts) if (!p.ready) { const [x, y] = this.game.readyPos(this, p); this.drawPress(ctx, x, y); }
    }
  }

  // ---- touch pad (web addition: on-screen device for the first human on touch screens)
  private drawPad(ctx: CanvasRenderingContext2D, w: number, h: number) {
    this.pad = [];
    const hu = this.humans[0];
    if (!this.touchUI || !hu || this.phase === 'intro' || this.phase === 'zoom' || this.phase === 'done' || this.phase === 'load') return;
    const cfg = this.game.pad;
    const r = Math.max(26, Math.min(46, Math.min(w, h) * 0.075));
    const spare = h - (this.oy + (this.OY + 480) * this.s);
    const by = spare > r * 5 ? h - spare / 2 : h - r * 2.6;
    const add = (id: string, x: number, y: number, k: Key) => this.pad.push({ id, x, y, r, k });
    if (cfg.dirs === 4) { const c = r * 3.1; add('l', c - r * 1.6, by, 2); add('r', c + r * 1.6, by, 3); add('u', c, by - r * 1.6, 4); add('d', c, by + r * 1.6, 5); }
    else if (cfg.dirs === 2) { add('l', r * 1.8, by, 2); add('r', r * 4.4, by, 3); }
    if (cfg.buttons === 2) { add('A', w - r * 4.4, by, 0); add('B', w - r * 1.8, by, 1); }
    else add('A', w - r * 2.2, by, 0);
    const lab: Record<string, string> = { l: '◀', r: '▶', u: '▲', d: '▼', A: 'A', B: 'B' };
    for (const b of this.pad) {
      const down = [...this.padDown.values()].includes(b.k);
      ctx.globalAlpha = down ? 0.85 : 0.55;
      ctx.fillStyle = b.k <= 1 ? (b.k === 0 ? '#ff7a0a' : '#2a8ad8') : '#334';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(b.r * 0.8)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lab[b.id], b.x, b.y + 1);
    }
    ctx.textBaseline = 'alphabetic';
  }

  // ---- input
  push(slot: number, k: Key, down: boolean) {
    if (this.held[slot][k] === down) return; // key repeat / duplicate
    this.held[slot][k] = down; this.q.push({ slot, k, down });
  }
  keyEv(e: KeyboardEvent, down: boolean): boolean {
    if (!this.humans.length) return false;
    const code = e.code || e.key;
    // Prefer the seat whose SelectActor device picked this keyboard scheme (Part.k = 0..2).
    // Fallback: single human → any matching scheme; multi-human → scheme index = human order.
    for (let d = 0; d < KB.length; d++) {
      const k = KB[d][code]; if (k === undefined) continue;
      let hu = this.humans.find(p => (p.k | 0) === d);
      if (!hu) hu = this.humans.length === 1 ? this.humans[0] : this.humans[d];
      if (!hu) continue;
      if (down && e.repeat) return true;
      this.push(hu.slot, k, down);
      return true;
    }
    return false;
  }
  toV(x: number, y: number) { return { vx: (x - this.ox) / this.s, vy: (y - this.oy) / this.s }; }
  pointer(e: PtrEvent) {
    if (e.ptype === 'touch' || e.ptype === 'pen') this.touchUI = true;
    // touch pad
    if (e.type === 'down') { const b = this.pad.find(b => Math.hypot(e.x - b.x, e.y - b.y) <= b.r * 1.15); if (b && this.humans[0]) { this.padDown.set(e.id, b.k); this.push(this.humans[0].slot, b.k, true); return; } }
    if ((e.type === 'up' || e.type === 'cancel') && this.padDown.has(e.id)) { const k = this.padDown.get(e.id)!; this.padDown.delete(e.id); if (this.humans[0]) this.push(this.humans[0].slot, k, false); return; }
    if (this.padDown.has(e.id)) return;
    if (!this.humans.length) return;
    const { vx, vy } = this.toV(e.x, e.y);
    const vp: VPtr = { type: e.type, vx, vy, id: e.id, button: e.button, mouse: e.ptype === 'mouse' };
    if (this.phase === 'ready') {
      if (e.type === 'up') {
        // nearest not-ready human pressbutton
        let best: Part | null = null, bd = 1e9;
        for (const p of this.humans) { if (p.ready) continue; const [x, y] = this.game.readyPos(this, p); const d = Math.hypot(x - vx, y - vy); if (d < bd) { bd = d; best = p; } }
        if (best) { this.q.push({ slot: best.slot, k: 0, down: false }); }
      }
      return;
    }
    if (this.phase === 'result') { if (e.type === 'down') this.result?.tap?.(); return; }
    if (this.phase !== 'play' || !this.game.ptr) return;
    let owner = this.ptrOwner.get(e.id);
    if (e.type === 'down' || (owner === undefined && vp.mouse)) owner = undefined;
    let p: Part | null = owner !== undefined ? this.part(owner) : null;
    if (!p) { p = this.routePtr(vx, vy); if (p && e.type === 'down') this.ptrOwner.set(e.id, p.slot); }
    this.game.ptr(this, p, vp);
    if (e.type === 'up' || e.type === 'cancel') this.ptrOwner.delete(e.id);
  }
  /** which human a play-area pointer belongs to: single human → them; else nearest by game layout */
  routePtr(vx: number, vy: number): Part | null {
    if (this.humans.length === 1) return this.humans[0];
    let best: Part | null = null, bd = 1e9;
    for (const p of this.humans) { const [x, y] = this.game.readyPos(this, p); const d = Math.abs(x - vx) + Math.abs(y - vy) * 0.3; if (d < bd) { bd = d; best = p; } }
    return best;
  }
}
