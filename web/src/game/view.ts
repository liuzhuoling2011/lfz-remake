// Isometric map view: baked ground chunks + live animated layers, y-sorted objects, players, buildings, effects, camera.
// Everything animates from the rAF delta time (no setTimeout stepping); the render path avoids per-frame allocations.
import { app, ease, TURBO, speedMul } from '../core/app';
import { fetchJSON, loadSheets, sheet, drawFrame, groupInfo, type Sheet } from '../core/assets';
import { text, fmtMoney } from '../core/text';
import type { Board } from './board';
import { dirGroup } from './board';
import type { GameState } from './state';
import { PLAYER_COLORS } from './config';

interface MapObj {
  s: number; f: number; x: number; y: number; a: number; anim: boolean; seasonal: boolean; icon: boolean;
  /** world-space bounding box of the drawn frame */ x0: number; y0: number; x1: number; y1: number;
}
interface MapData { key: string; sprites: string[]; layers: { name: string; flag: number; o: [number, number, number, number, number][] }[] }

const ANIM = new Set(['sea', 'smallsea', 'bigsea01', 'bigsea02', 'big_sea', 'sea2', 'sea_side1', 'sea_side2', 'sea_side3', 'sea_bird', 'dolphin', 'fishman', 'stone1', 'stone2',
  'smallship', 'hk_ship', 'kln_ship', 'oldship', 'ufo', 'taiping_hill', 'hill4', 'pier', 'sea_fllower_0102', 'chance', 'money_add', 'money_des', 'big_hill']);
const SEASONAL = new Set(['tree_change1', 'tree_change2']);
const LIVE_GROUND = new Set(['big_sea', 'icon']);
const isIcon = (nm: string) => nm === 'chance' || nm === 'money_add' || nm === 'money_des' || nm.endsWith('_icon') || nm.startsWith('icon_');

export interface Actor {
  seat: number; char: number; x: number; y: number; dir: number; anim: 'stand' | 'walk' | 'use' | 'hit'; t: number;
  hidden?: boolean; tint?: string; z?: number; walkDist?: number;
}
interface Effect { sheet: string; x: number; y: number; t: number; fps: number; loop: number; res?: () => void; scale: number; alpha: number; n: number }
interface Floater { text: string; x: number; y: number; t: number; color: string }
/** Building construction / demolition animation (scaffold sprite + building rise/sink). */
interface Construct { plot: number; sheet: string; down: boolean; t: number; dur: number; n: number; swapAt: number; swapped: boolean; onSwap?: () => void; res: () => void; dustT: number }
const enum DK { Obj, Plot, Actor }
interface DynItem { y: number; x: number; k: DK; i: number }

const CHUNK = 512;
/** world px per second for walking (≈ one tile per 22 ticks at the default speed, like the original) */
const WALK_SPEED = 128;
/** distance (px) covered by one 15-frame walk cycle → feet stay in sync with the ground at any speed */
const STRIDE = 64;

export class MapView {
  board!: Board;
  data!: MapData;
  sheets: (Sheet | null)[] = [];
  ancient = false;
  chunks: { x: number; y: number; c: CanvasImageSource }[] = [];
  liveGround: MapObj[] = [];
  icons: MapObj[] = [];
  objects: MapObj[] = [];
  bounds = { x0: 0, y0: 0, x1: 1000, y1: 1000 };
  cx = 0; cy = 0; zoom = 1; userZoom = 1;
  private vx = 0; private vy = 0; // camera velocity (smooth-damp)
  follow: { x: number; y: number } | null = null;
  actors: Actor[] = [];
  effects: Effect[] = [];
  floaters: Floater[] = [];
  constructs: Construct[] = [];
  game: GameState | null = null;
  season = 0;
  current = -1;
  private drag: { x: number; y: number; cx: number; cy: number; moved: boolean; id: number } | null = null;
  private pinch = new Map<number, { x: number; y: number }>();
  private pinchD = 0;
  lastManualPan = -1e9;
  private dyn: DynItem[] = [];      // reusable y-sort buffer for buildings + actors
  private dynN = 0;

  async load(board: Board, onProgress?: (d: number, t: number) => void) {
    this.board = board;
    this.ancient = board.key === 'ancient';
    this.data = await fetchJSON(`maps/${board.key}.json`);
    const pre = this.ancient ? 'a_' : '';
    const extra = ['map/shadow', 'map/getmoney', 'map/lostmoney', 'map/cardhit', 'map/usecard', 'map/havemoney', 'map/nomoney', 'map/godin', 'map/godout', 'map/money',
      'map/playermark01', 'map/playermark02', 'map/playermark03', 'map/playermark04', 'map/downhouse', 'map/buildhouse1', 'map/buildhouse2', 'map/buildhouse3',
      'map/a_buildhouse1', 'map/a_buildhouse2', 'map/a_buildhouse3', 'map/a_downhouse', 'map/a_money', 'map/a_getmoney'];
    for (const k of ['house', 'commcal', 'eating', 'home']) for (const l of [1, 2, 3]) extra.push(`map/${pre}${k}${l}`);
    for (let c = 1; c <= 6; c++) for (const s of ['01', '02', '04', '05']) extra.push(`map/character/character${String(c).padStart(2, '0')}_${s}`);
    extra.push('map/character/character08_02', 'map/character/character13_02', 'map/character/character10_02', 'map/character/character07_02', 'map/character/character12_02');
    await loadSheets([...this.data.sprites.map(s => 'map/' + s), ...extra], onProgress);
    this.sheets = this.data.sprites.map(s => sheet('map/' + s));
    await this.bake();
    this.bounds = this.computeBounds();
    const bb = board.bounds();
    this.cx = (bb.x0 + bb.x1) / 2; this.cy = (bb.y0 + bb.y1) / 2;
  }

  private computeBounds() {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const L of this.data.layers) for (const o of L.o) { x0 = Math.min(x0, o[2]); y0 = Math.min(y0, o[3]); x1 = Math.max(x1, o[2]); y1 = Math.max(y1, o[3]); }
    return { x0, y0, x1, y1 };
  }

  /**
   * Static layer cache: ground AND the static y-sorted scenery (trees, buildings, hills) are rendered once into
   * 512px offscreen chunks (→ ImageBitmap). Per frame only animated sprites, owned buildings, actors and the few static
   * objects that stand in front of them ("occluders", found by bounding-box tests) are drawn on top.
   * Seasonal trees are part of the bake, so the cache is rebuilt (async) when the season changes.
   */
  private baked: MapObj[] = [];
  private bakedSeason = -1;
  private baking = false;
  private plotOcc: number[][] = [];
  private iconOcc: number[][] = [];
  private alwaysObj: number[] = [];
  private stamp = new Uint32Array(0);
  private stampId = 1;
  private maxObjH = 0;
  private async bake() {
    this.baked = []; this.liveGround = []; this.objects = []; this.icons = [];
    for (const L of this.data.layers) {
      for (const [s, f, x, y, a] of L.o) {
        const nm = this.data.sprites[s];
        const o: MapObj = { s, f, x, y, a, anim: ANIM.has(nm), seasonal: SEASONAL.has(nm), icon: isIcon(nm), x0: x, y0: y, x1: x, y1: y };
        const sh0 = this.sheets[s];
        if (sh0) { const fr = sh0.f[Math.min(f, sh0.f.length - 1)]; o.x0 = x - fr[4]; o.y0 = y - fr[5]; o.x1 = o.x0 + fr[2]; o.y1 = o.y0 + fr[3]; }
        if (L.flag === 1) { this.objects.push(o); continue; }
        if (LIVE_GROUND.has(L.name) || o.anim) { (o.icon ? this.icons : this.liveGround).push(o); continue; }
        if (sh0) this.baked.push(o);
      }
    }
    this.objects.sort((a, b) => a.y - b.y || a.x - b.x);
    this.stamp = new Uint32Array(this.objects.length);
    this.alwaysObj = []; this.maxObjH = 0;
    this.objects.forEach((o, i) => { if (o.anim) this.alwaysObj.push(i); else this.maxObjH = Math.max(this.maxObjH, o.y - o.y0); });
    // occluders of each plot's building footprint and of each road icon (static → precomputed once)
    const occ = (x0: number, y0: number, x1: number, y1: number, y: number, x: number) => {
      const r: number[] = [];
      this.objects.forEach((o, i) => { if (!o.anim && (o.y > y || (o.y === y && o.x > x)) && o.x0 < x1 && o.x1 > x0 && o.y0 < y1 && o.y1 > y0) r.push(i); });
      return r;
    };
    // animated scenery is drawn live, so whatever static scenery stands in front of it must be redrawn too
    const always = new Set(this.alwaysObj);
    for (const i of this.alwaysObj) { const o = this.objects[i]; for (const k of occ(o.x0, o.y0, o.x1, o.y1, o.y, o.x)) always.add(k); }
    this.alwaysObj = [...always];
    this.plotOcc = this.board.plots.map(p => occ(p.x - 95, p.y - 240, p.x + 95, p.y + 26, p.y + 1, p.x));
    this.iconOcc = this.icons.map(o => occ(o.x0, o.y0, o.x1, o.y1, o.y, o.x));
    await this.bakeChunks(this.season);
  }
  private async bakeChunks(season: number) {
    this.baking = true;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const list: MapObj[] = [...this.baked, ...this.objects.filter(o => !o.anim)];
    for (const o of list) { x0 = Math.min(x0, o.x0); y0 = Math.min(y0, o.y0); x1 = Math.max(x1, o.x1); y1 = Math.max(y1, o.y1); }
    const canv: { x: number; y: number; c: HTMLCanvasElement; g: CanvasRenderingContext2D }[] = [];
    const cx0 = Math.floor(x0 / CHUNK), cy0 = Math.floor(y0 / CHUNK), cx1 = Math.floor(x1 / CHUNK), cy1 = Math.floor(y1 / CHUNK);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const c = document.createElement('canvas'); c.width = CHUNK; c.height = CHUNK;
      canv.push({ x: cx * CHUNK, y: cy * CHUNK, c, g: c.getContext('2d')! });
    }
    const grid = (cx: number, cy: number) => canv[(cy - cy0) * (cx1 - cx0 + 1) + (cx - cx0)];
    for (const o of list) {
      const sh = this.sheets[o.s]; if (!sh?.img) continue;
      const fi = o.seasonal ? season % sh.f.length : Math.min(o.f, sh.f.length - 1);
      const fr = sh.f[fi];
      const ox = o.x - fr[4], oy = o.y - fr[5];
      for (let cy = Math.floor(oy / CHUNK); cy <= Math.floor((oy + fr[3]) / CHUNK); cy++)
        for (let cx = Math.floor(ox / CHUNK); cx <= Math.floor((ox + fr[2]) / CHUNK); cx++) {
          const ch = grid(cx, cy); if (!ch) continue;
          ch.g.drawImage(sh.img, fr[0], fr[1], fr[2], fr[3], ox - ch.x, oy - ch.y, fr[2], fr[3]);
        }
    }
    const chunks = await Promise.all(canv.map(async ch => {
      let img: CanvasImageSource = ch.c;
      if (typeof createImageBitmap === 'function') { try { img = await createImageBitmap(ch.c); } catch { /* keep canvas */ } }
      return { x: ch.x, y: ch.y, c: img };
    }));
    for (const old of this.chunks) (old.c as ImageBitmap).close?.();
    this.chunks = chunks; this.bakedSeason = season; this.baking = false;
  }

  // ---------------- camera ----------------
  baseZoom(w: number, h: number) { return Math.max(0.55, Math.min(2.4, Math.min(w, h) / 560)); }
  toScreen(wx: number, wy: number) { return { x: (wx - this.cx) * this.zoom + app.w / 2, y: (wy - this.cy) * this.zoom + app.h / 2 }; }
  toWorld(sx: number, sy: number) { return { x: (sx - app.w / 2) / this.zoom + this.cx, y: (sy - app.h / 2) / this.zoom + this.cy }; }
  focusOn(x: number, y: number, instant = false) {
    if (this.follow) { this.follow.x = x; this.follow.y = y; } else this.follow = { x, y };
    if (instant || TURBO) { this.cx = x; this.cy = y - 30; this.vx = this.vy = 0; }
  }
  clampCam() {
    // keep the viewport inside the map art (with a little slack for the HUD); centre if the map is smaller than the view
    const b = this.bounds; const m = 60;
    const hw = app.w / 2 / this.zoom, hh = app.h / 2 / this.zoom;
    const ax = (lo: number, hi: number, half: number, v: number) => hi - lo <= 2 * half - 2 * m ? (lo + hi) / 2 : Math.max(lo + half - m, Math.min(hi - half + m, v));
    this.cx = ax(b.x0, b.x1, hw, this.cx);
    this.cy = ax(b.y0, b.y1, hh, this.cy);
  }

  update(dt: number) {
    this.zoom = this.baseZoom(app.w, app.h) * this.userZoom;
    if (this.bakedSeason >= 0 && this.season !== this.bakedSeason && !this.baking) void this.bakeChunks(this.season);
    if (this.follow && app.time - this.lastManualPan > 2500) {
      // critically-damped smooth-damp (no overshoot, no jitter at low/high frame rates)
      const smooth = 0.28, s = dt / 1000, om = 2 / smooth, x = om * s, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
      const step = (c: number, tgt: number, v: number): [number, number] => { const ch = c - tgt; const tmp = (v + om * ch) * s; return [tgt + (ch + tmp) * e, (v - om * tmp) * e]; };
      [this.cx, this.vx] = step(this.cx, this.follow.x, this.vx);
      [this.cy, this.vy] = step(this.cy, this.follow.y - 30, this.vy);
    }
    this.clampCam();
    for (const a of this.actors) a.t += dt;
    let n = 0;
    for (const e of this.effects) { e.t += dt; if (e.t * e.fps / 1000 >= e.n * e.loop) e.res?.(); else this.effects[n++] = e; }
    this.effects.length = n;
    n = 0;
    for (const f of this.floaters) { f.t += dt; if (f.t < 1600) this.floaters[n++] = f; }
    this.floaters.length = n;
    n = 0;
    for (const c of this.constructs) {
      c.t += dt / speedMul.v;
      if (!c.swapped && c.t >= c.swapAt) { c.swapped = true; c.onSwap?.(); }
      if (c.t >= c.dur) c.res(); else this.constructs[n++] = c;
    }
    this.constructs.length = n;
  }

  // ---------------- input ----------------
  onPointer(e: { type: string; x: number; y: number; id: number }) {
    if (e.type === 'down') {
      this.pinch.set(e.id, { x: e.x, y: e.y });
      if (this.pinch.size === 2) { const [a, b] = [...this.pinch.values()]; this.pinchD = Math.hypot(a.x - b.x, a.y - b.y); this.drag = null; }
      else this.drag = { x: e.x, y: e.y, cx: this.cx, cy: this.cy, moved: false, id: e.id };
    } else if (e.type === 'move') {
      if (this.pinch.has(e.id)) this.pinch.set(e.id, { x: e.x, y: e.y });
      if (this.pinch.size === 2) {
        const [a, b] = [...this.pinch.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.pinchD > 0) { this.userZoom = Math.max(0.4, Math.min(3, this.userZoom * d / this.pinchD)); }
        this.pinchD = d; this.lastManualPan = app.time;
      } else if (this.drag && this.drag.id === e.id) {
        const dx = e.x - this.drag.x, dy = e.y - this.drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) this.drag.moved = true;
        if (this.drag.moved) { this.cx = this.drag.cx - dx / this.zoom; this.cy = this.drag.cy - dy / this.zoom; this.vx = this.vy = 0; this.lastManualPan = app.time; }
      }
    } else {
      this.pinch.delete(e.id);
      if (this.pinch.size < 2) this.pinchD = 0;
      this.drag = null;
    }
  }
  onWheel(dy: number) { this.userZoom = Math.max(0.4, Math.min(3, this.userZoom * Math.pow(0.999, dy))); }

  // ---------------- actors/effects API ----------------
  actor(seat: number) { return this.actors.find(a => a.seat === seat)!; }
  placeActor(seat: number, tile: number, prevTile: number) {
    const a = this.actor(seat); const t = this.board.tiles[tile]; const p = this.board.tiles[prevTile];
    a.x = t.x; a.y = t.y; a.dir = dirGroup(Math.sign(t.gx - p.gx), Math.sign(t.gy - p.gy));
  }
  /**
   * Walk continuously along `path` (tile ids, starting next to `from`) at constant speed, driven by rAF delta time.
   * onTile(i, tile) fires synchronously the moment the actor reaches each tile centre.
   */
  walkPath(seat: number, from: number, path: number[], onTile: (i: number, tile: number) => void): Promise<void> {
    const a = this.actor(seat);
    const T = this.board.tiles;
    if (!path.length) return Promise.resolve();
    if (TURBO) {
      path.forEach((t, i) => onTile(i, t));
      const last = T[path[path.length - 1]], pv = T[path.length > 1 ? path[path.length - 2] : from];
      a.x = last.x; a.y = last.y; a.dir = dirGroup(Math.sign(last.gx - pv.gx), Math.sign(last.gy - pv.gy));
      return new Promise(r => setTimeout(r, 0));
    }
    const pts = [from, ...path];
    let seg = 0, d = 0;
    a.anim = 'walk'; a.walkDist = a.walkDist ?? 0;
    const setDir = () => { const A = T[pts[seg]], B = T[pts[seg + 1]]; a.dir = dirGroup(Math.sign(B.gx - A.gx), Math.sign(B.gy - A.gy)); };
    setDir();
    return new Promise(res => {
      const off = app.onTick(dt => {
        let move = WALK_SPEED * (dt / 1000) / speedMul.v;
        while (move > 0 && seg < path.length) {
          const A = T[pts[seg]], B = T[pts[seg + 1]];
          const len = Math.hypot(B.x - A.x, B.y - A.y) || 1;
          const rem = len - d;
          if (move >= rem) {
            move -= rem; a.walkDist! += rem; d = 0; seg++;
            onTile(seg - 1, path[seg - 1]);
            if (seg < path.length) setDir();
          } else { d += move; a.walkDist! += move; move = 0; }
        }
        if (seg < path.length) {
          const A = T[pts[seg]], B = T[pts[seg + 1]];
          const len = Math.hypot(B.x - A.x, B.y - A.y) || 1, k = d / len;
          a.x = A.x + (B.x - A.x) * k; a.y = A.y + (B.y - A.y) * k;
        } else { const E = T[pts[pts.length - 1]]; a.x = E.x; a.y = E.y; }
        if (this.follow) { this.follow.x = a.x; this.follow.y = a.y; } else this.follow = { x: a.x, y: a.y };
        if (seg >= path.length) { off(); a.anim = 'stand'; res(); }
      });
    });
  }
  async teleport(seat: number, to: number) {
    const a = this.actor(seat); const B = this.board.tiles[to];
    void this.fx('map/godout', a.x, a.y, 30);
    await this.anim(400, t => { a.z = -ease.inOutQuad(t) * 200; });
    a.x = B.x; a.y = B.y; this.focusOn(B.x, B.y, true);
    await this.anim(400, t => { a.z = -(1 - ease.outCubic(t)) * 200; });
    a.z = 0;
  }
  /** delta-time tween on the app ticker, scaled by game speed */
  anim(ms: number, fn: (t: number) => void): Promise<void> {
    const dur = TURBO ? 0 : ms * speedMul.v;
    if (dur <= 0) { fn(1); return Promise.resolve(); }
    return new Promise(res => { let el = 0; const off = app.onTick(dt => { el += dt; const t = Math.min(1, el / dur); fn(t); if (t >= 1) { off(); res(); } }); });
  }
  fx(name: string, x: number, y: number, fps = 20, loop = 1, scale = 1, alpha = 1): Promise<void> {
    const sh = sheet(name);
    if (!sh) return Promise.resolve();
    return new Promise(res => { this.effects.push({ sheet: name, x, y, t: 0, fps, loop, res, scale, alpha, n: sh.f.length }); if (TURBO) res(); });
  }
  float(text: string, x: number, y: number, color = '#ffe14a') { if (!TURBO) this.floaters.push({ text, x, y, t: 0, color }); }
  money(seat: number, delta: number) {
    const a = this.actor(seat); if (!a || delta === 0) return;
    this.float((delta > 0 ? '+' : '') + fmtMoney(delta), a.x, a.y - 110, delta > 0 ? '#ffe14a' : '#ff6b5b');
    void this.fx(delta > 0 ? (this.ancient ? 'map/a_getmoney' : 'map/getmoney') : 'map/lostmoney', a.x, a.y - 100, 24);
  }
  /**
   * Construction (bamboo scaffold assembles → building materialises with a rise/settle → scaffold is dismantled, dust puff)
   * or demolition (building shakes and sinks into a dust cloud). onSwap applies the state change at the visual swap point.
   */
  construct(plot: number, down = false, onSwap?: () => void): Promise<void> {
    const pre = this.ancient ? 'map/a_' : 'map/';
    const name = down ? pre + 'downhouse' : pre + 'buildhouse' + (1 + Math.floor(Math.random() * 3));
    const sh = sheet(name);
    if (TURBO || !sh) { onSwap?.(); return Promise.resolve(); }
    const fps = down ? 20 : 24; const n = sh.f.length; const dur = n / fps * 1000;
    const p = this.board.plots[plot]; this.focusOn(p.x, p.y);
    return new Promise(res => this.constructs.push({ plot, sheet: name, down, t: 0, dur, n, swapAt: dur * (down ? 0.45 : 0.44), swapped: false, onSwap, res, dustT: -1 }));
  }

  // ---------------- rendering ----------------
  private drawObj(ctx: CanvasRenderingContext2D, o: MapObj, tick: number) {
    const sh = this.sheets[o.s]; if (!sh || !sh.img) return;
    let fi = o.f;
    if (o.anim) {
      const gi = groupInfo(sh.name); const g = Math.min(o.a, gi.g.length - 1);
      const st = gi.start[g], n = gi.g[g];
      if (n > 1) fi = st + ((o.f - st + tick + ((o.x * 7 + o.y * 3) % n)) % n);
    } else if (o.seasonal) fi = this.season % sh.f.length;
    drawFrame(ctx, sh, fi, o.x, o.y);
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const z = this.zoom, dpr = app.dpr;
    ctx.fillStyle = '#1b4f9c'; ctx.fillRect(0, 0, w, h);
    ctx.save();
    // snap the camera to device pixels so baked chunks don't shimmer while scrolling
    const ox = Math.round(dpr * (w / 2 - this.cx * z)) , oy = Math.round(dpr * (h / 2 - this.cy * z));
    ctx.setTransform(dpr * z, 0, 0, dpr * z, ox, oy);
    ctx.imageSmoothingEnabled = dpr * z < 1.5;
    ctx.imageSmoothingQuality = dpr * z >= 1 ? 'low' : 'medium'; // bilinear when magnifying (bicubic is very costly on CPU canvases)
    const vx0 = this.cx - w / 2 / z - 260, vx1 = this.cx + w / 2 / z + 260, vy0 = this.cy - h / 2 / z - 260, vy1 = this.cy + h / 2 / z + 260;
    const tick = Math.floor(app.time / 140);
    for (const o of this.liveGround) {
      if (o.x < vx0 || o.x > vx1 || o.y < vy0 || o.y > vy1) continue;
      this.drawObj(ctx, o, tick);
    }
    for (const c of this.chunks) {
      if (c.x > vx1 || c.x + CHUNK < vx0 || c.y > vy1 || c.y + CHUNK < vy0) continue;
      ctx.drawImage(c.c, c.x, c.y);
    }
    // plot ownership overlays
    const g = this.game;
    if (g) {
      for (let i = 0; i < g.plots.length; i++) { const ps = g.plots[i]; if (!ps) continue; const p = this.board.plots[i]; this.diamond(ctx, p.x, p.y, PLAYER_COLORS[ps.owner], 0.45); }
      for (const rm of g.roadMoney) { const t = this.board.tiles[rm.tile]; drawFrame(ctx, this.ancient ? 'map/a_money' : 'map/money', tick % 8, t.x, t.y); }
    }
    // occluder marking: static objects in front of something drawn live this frame get redrawn in y-order
    const sid = ++this.stampId, st = this.stamp, objs = this.objects;
    const mark = (l: number[]) => { for (let k = 0; k < l.length; k++) st[l[k]] = sid; };
    mark(this.alwaysObj);
    for (let i = 0; i < this.icons.length; i++) { const o = this.icons[i]; if (o.x < vx0 || o.x > vx1 || o.y < vy0 || o.y > vy1) continue; this.drawObj(ctx, o, tick); mark(this.iconOcc[i]); }
    // dynamic items (buildings with state or construction, actors) → reusable buffer, small sort, merged with the pre-sorted static objects
    this.dynN = 0;
    const push = (y: number, x: number, k: DK, i: number) => {
      let it = this.dyn[this.dynN]; if (!it) { it = { y, x, k, i }; this.dyn[this.dynN] = it; } else { it.y = y; it.x = x; it.k = k; it.i = i; }
      this.dynN++;
    };
    if (g) {
      for (let i = 0; i < g.plots.length; i++) {
        const p = this.board.plots[i];
        if (p.x < vx0 || p.x > vx1 || p.y < vy0 || p.y > vy1) continue;
        if (g.plots[i] || this.hasConstruct(i)) { push(p.y + 1, p.x, DK.Plot, i); mark(this.plotOcc[i]); }
      }
    }
    for (let i = 0; i < this.actors.length; i++) {
      const a = this.actors[i]; if (a.hidden) continue;
      push(a.y + 2, a.x, DK.Actor, i);
      // actor box vs objects whose base is in front of the actor (objects are y-sorted → binary search the start)
      const ay = a.y + 2, ax0 = a.x - 45, ax1 = a.x + 45, ay0 = a.y - 160 + (a.z ?? 0), ay1 = a.y + 16;
      let lo = 0, hi = objs.length; while (lo < hi) { const m = (lo + hi) >> 1; if (objs[m].y <= ay) lo = m + 1; else hi = m; }
      for (let k = lo; k < objs.length; k++) { const o = objs[k]; if (o.y - this.maxObjH > ay1) break; if (o.x0 < ax1 && o.x1 > ax0 && o.y0 < ay1 && o.y1 > ay0) st[k] = sid; }
    }
    const dyn = this.dyn, dn = this.dynN;
    // insertion sort (n ≲ 90, nearly sorted frame to frame)
    for (let i = 1; i < dn; i++) { const it = dyn[i]; let j = i - 1; while (j >= 0 && (dyn[j].y > it.y || (dyn[j].y === it.y && dyn[j].x > it.x))) { dyn[j + 1] = dyn[j]; j--; } dyn[j + 1] = it; }
    let di = 0;
    for (let oi = 0; oi <= objs.length; oi++) {
      const o = objs[oi];
      if (o && st[oi] !== sid) continue; // baked into the static layer and not in front of anything live
      while (di < dn && (!o || dyn[di].y < o.y || (dyn[di].y === o.y && dyn[di].x <= o.x))) { this.drawDyn(ctx, dyn[di]); di++; }
      if (!o) break;
      if (o.x1 < vx0 || o.x0 > vx1 || o.y1 < vy0 || o.y0 > vy1) continue;
      this.drawObj(ctx, o, tick);
    }
    // effects
    for (const e of this.effects) drawFrame(ctx, e.sheet, Math.floor(e.t * e.fps / 1000) % e.n, e.x, e.y, e.scale, e.alpha);
    // floaters
    for (const f of this.floaters) {
      const k = f.t / 1600; const yy = f.y - 50 * ease.outCubic(Math.min(1, k * 1.5));
      ctx.globalAlpha = Math.min(1, (1 - k) * 2.5);
      text(ctx, f.text, f.x, yy, { size: 22, color: f.color, align: 'center', stroke: '#2a1200', strokeWidth: 5 });
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  private hasConstruct(i: number) { for (const c of this.constructs) if (c.plot === i) return true; return false; }
  private drawDyn(ctx: CanvasRenderingContext2D, it: DynItem) {
    if (it.k === DK.Actor) { this.drawActor(ctx, this.actors[it.i]); return; }
    const g = this.game!; const i = it.i; const p = this.board.plots[i]; const ps = g.plots[i];
    let c: Construct | null = null;
    for (const cc of this.constructs) if (cc.plot === i) { c = cc; break; }
    const pre = this.ancient ? 'map/a_' : 'map/';
    if (ps) {
      const kind = ps.type === 1 ? 'commcal' : ps.type === 2 ? 'eating' : ps.type === 4 ? 'home' : 'house';
      const name = `${pre}${kind}${[1, 2, 3, 3][ps.level]}`;
      if (c && !c.down && c.swapped) {
        // rise: grows up from the ground with an overshoot, fading in through the scaffold glow
        const k = Math.min(1, (c.t - c.swapAt) / (c.dur * 0.22));
        const sy = 0.35 + 0.65 * ease.outBack(k);
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, sy); ctx.translate(-p.x, -p.y);
        drawFrame(ctx, name, p.dir, p.x, p.y, 1, Math.min(1, k * 1.6));
        ctx.restore();
      } else if (c && c.down && !c.swapped) {
        // demolition: shake and sink before the dust hides it
        const k = c.t / c.swapAt; const sh = Math.sin(c.t / 18) * 2.5 * (1 - k * 0.3);
        ctx.save(); ctx.beginPath(); ctx.rect(p.x - 80, p.y - 220, 160, 220 + 22); ctx.clip();
        drawFrame(ctx, name, p.dir, p.x + sh, p.y + 70 * ease.inOutQuad(k), 1, 1 - k * 0.4);
        ctx.restore();
      } else {
        drawFrame(ctx, name, p.dir, p.x, p.y);
        if (ps.level >= 3) drawFrame(ctx, 'map/havemoney', Math.floor(app.time / 60) % 32, p.x, p.y - 40, 0.6, 0.8);
        if (ps.type === 4) this.flag(ctx, p.x, p.y - 70, PLAYER_COLORS[ps.owner]);
      }
    }
    if (c) {
      const fi = Math.min(c.n - 1, Math.floor(c.t / c.dur * c.n));
      drawFrame(ctx, c.sheet, fi, p.x, p.y + (c.down ? 10 : 20));
      // dust puff as the building settles (reuses the original dust cloud frames, small and faded)
      if (!c.down) {
        const k = (c.t - c.swapAt) / (c.dur * 0.35);
        if (k > 0 && k < 1) drawFrame(ctx, this.ancient ? 'map/a_downhouse' : 'map/downhouse', 10 + Math.floor(k * 16), p.x, p.y + 14, 0.5, 0.55 * (1 - k));
      }
    }
  }

  private diamond(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, alpha: number) {
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 19); ctx.lineTo(x + 38, y); ctx.lineTo(x, y + 19); ctx.lineTo(x - 38, y); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = Math.min(1, alpha + 0.4); ctx.stroke(); ctx.globalAlpha = 1;
  }
  private flag(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    const wv = Math.sin(app.time / 200) * 2;
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 20, y); ctx.lineTo(x + 20, y - 34); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + 21, y - 34); ctx.lineTo(x + 40, y - 28 + wv); ctx.lineTo(x + 21, y - 21); ctx.closePath(); ctx.fill();
  }

  drawActor(ctx: CanvasRenderingContext2D, a: Actor) {
    const c = a.char < 10 ? '0' + a.char : String(a.char);
    const suffix = a.anim === 'walk' ? '02' : a.anim === 'use' ? '04' : a.anim === 'hit' ? '05' : '01';
    const name = `map/character/character${c}_${suffix}`;
    const gi = groupInfo(name); const g = Math.min(a.dir, gi.g.length - 1);
    const n = gi.g[g];
    // walk cycle is driven by distance travelled (feet never slide); idle/use/hit by time
    const fi = gi.start[g] + (a.anim === 'walk' ? Math.floor((a.walkDist ?? 0) / STRIDE * n) % n : Math.floor(a.t * 12 / 1000) % n);
    ctx.globalAlpha = 0.85; ctx.strokeStyle = PLAYER_COLORS[a.seat]; ctx.lineWidth = a.seat === this.current ? 4 : 2.5;
    ctx.beginPath(); ctx.ellipse(a.x, a.y, 24, 11, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    drawFrame(ctx, 'map/shadow', 0, a.x, a.y, 0.8, 0.6);
    const z = a.z ?? 0;
    if (a.tint) { ctx.save(); ctx.filter = a.tint; drawFrame(ctx, name, fi, a.x, a.y + z); ctx.restore(); }
    else drawFrame(ctx, name, fi, a.x, a.y + z);
    if (a.seat === this.current) {
      const mk = `map/playermark0${a.seat + 1}`; const sh = sheet(mk);
      const top = (sheet(name)?.f[fi]?.[5] ?? 100);
      drawFrame(ctx, mk, Math.floor(app.time / 90) % (sh?.f.length ?? 1), a.x, a.y + z - top - 14 + Math.sin(app.time / 200) * 3);
    }
  }
}
