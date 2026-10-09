// The four original mini-games (omasterq.exe 1.05H, static RE: spec/minigames/MINIGAMES.md §4–7, data/*.json, re/*.c).
import { drawFrame, sheet, frameCount } from '../core/assets';
import { type Game, type Runner, type Part, type Key, type VPtr, rnd, numText, numWidth, drawShadow, drawSized, pixelHit, PCOL, type LoopHandle } from './core';
import PATTERNS from './mg02_patterns.json';

const stepToward = (c: number, t: number) => (c < t ? c + 1 : c > t ? c - 1 : c);

// ================================================================ MG01 畫展 portrait puzzle  [V 0x419400–0x41a610]
interface Board01 { slot: number; bx: number; by: number; layers: [number, number][][]; state: number[]; cx: number; cy: number;
  aiWait: number; tr: number; tc: number; // AI target row/col (-1 none)
  mt: { c: number; r: number } | null; mq: boolean; mTick: number; touch: boolean }
export class MG01 implements Game {
  id = 0; timer = true; resultKind = 'card' as const; pad = { dirs: 4 as const, buttons: 1 as const };
  sheets = ['minigame/01/bg', 'minigame/01/cursor', ...[1, 2, 3, 4, 5, 6].map(i => `minigame/01/character0${i}`)];
  sounds = ['minigame/drip'];
  boards = new Map<number, Board01>();
  portraits: number[] = [];
  init(R: Runner) {
    const tblX = [27, 372, 27, 372], tblY = [84, 84, 288, 288];
    // 4 portraits = the slots' characters (absent slots: other characters), then 6 random swaps
    const chars = [0, 1, 2, 3].map(s => R.part(s)?.char ?? 0);
    const free = [1, 2, 3, 4, 5, 6].filter(c => !chars.includes(c));
    for (let s = 0; s < 4; s++) if (!chars[s]) chars[s] = free.splice(rnd(free.length), 1)[0];
    for (let i = 0; i < 6; i++) { const a = rnd(4), b = rnd(4); [chars[a], chars[b]] = [chars[b], chars[a]]; }
    this.portraits = chars;
    for (const p of R.parts) {
      const s = p.slot;
      const layers: [number, number][][] = [];
      for (let c = 0; c < 48; c++) {
        const other = () => { let i; do i = rnd(4); while (i === s); return chars[i]; };
        layers.push([[chars[s], c], [other(), rnd(48)], [other(), rnd(48)]]);
      }
      const state = new Array(48).fill(0);
      for (let r = 0; r < 6; r++) state[r * 8 + rnd(8)] = rnd(2) + 1;
      this.boards.set(s, { slot: s, bx: tblX[s] - 320 + R.cx, by: tblY[s] - 240 + R.cy, layers, state, cx: 3, cy: 2, aiWait: rnd(10) + 10, tr: -1, tc: -1, mt: null, mq: false, mTick: 0, touch: false });
    }
  }
  readyPos(_R: Runner, p: Part): [number, number] { const b = this.boards.get(p.slot)!; return [b.bx + 120, b.by + 120]; }
  private cycle(R: Runner, b: Board01) {
    const i = b.cy * 8 + b.cx; b.state[i] = (b.state[i] + 1) % 3; R.snd('minigame/drip', 0.25);
    if (b.state.every(v => v === 0)) R.end(b.slot);
  }
  key(R: Runner, p: Part, k: Key, down: boolean) {
    if (down) return; // all actions on key-UP (FUN_00419d00)
    const b = this.boards.get(p.slot)!;
    if (k === 2) b.cx = (b.cx + 7) % 8; else if (k === 3) b.cx = (b.cx + 1) % 8;
    else if (k === 4) b.cy = (b.cy + 5) % 6; else if (k === 5) b.cy = (b.cy + 1) % 6;
    else { this.cycle(R, b); return; }
    R.snd('minigame/drip', 0.25);
  }
  /** mouse (FUN_00419bc0): every 15 ticks the cursor steps one cell toward the cell under the pointer; releasing a button on it cycles.
   *  Web: a click/tap before the cursor arrives is remembered and fires on arrival (touch convenience). */
  ptr(R: Runner, p: Part | null, e: VPtr) {
    if (!p) return;
    const b = [...this.boards.values()].find(b => e.vx >= b.bx && e.vy >= b.by && e.vx < b.bx + 240 && e.vy < b.by + 180);
    const own = this.boards.get(p.slot)!;
    if (b !== own) { if (e.type === 'down' && !e.mouse) own.mt = null; return; }
    const cell = { c: Math.floor((e.vx - b.bx) / 30), r: Math.floor((e.vy - b.by) / 30) };
    if (e.mouse && (e.type === 'move' || e.type === 'down')) { b.mt = cell; b.touch = false; }
    if (!e.mouse && e.type === 'down') { b.mt = cell; b.touch = true; }
    if (e.type === 'up') { b.mt = cell; b.mq = true; this.mouseStep(R, b, true); }
  }
  private mouseStep(R: Runner, b: Board01, immediate = false) {
    if (!b.mt) return;
    if (b.cx === b.mt.c && b.cy === b.mt.r) { if (b.mq) { b.mq = false; this.cycle(R, b); if (b.touch) b.mt = null; } return; }
    if (immediate) return;
    if (b.cx !== b.mt.c) b.cx = stepToward(b.cx, b.mt.c); else b.cy = stepToward(b.cy, b.mt.r);
    R.snd('minigame/drip', 0.25);
    if (b.cx === b.mt.c && b.cy === b.mt.r && b.mq) { b.mq = false; this.cycle(R, b); if (b.touch) b.mt = null; }
  }
  tick(R: Runner) {
    for (const p of R.parts) {
      if (R.phase !== 'play') return;
      const b = this.boards.get(p.slot)!;
      if (p.human) { if (++b.mTick >= 15) { b.mTick = 0; this.mouseStep(R, b); } continue; }
      // AI (FUN_004199f0/00419b20): act every rand%10+10 ticks
      if (--b.aiWait > 0) continue;
      b.aiWait = rnd(10) + 10;
      if (b.tr >= 0 && b.cx === b.tc && b.cy === b.tr) { this.cycle(R, b); if (b.state[b.tr * 8 + b.tc] === 0) b.tr = b.tc = -1; continue; }
      if (b.tr < 0) {
        for (let i = 0; i < 5 && b.tr < 0; i++) { const r = rnd(6); if (b.state.slice(r * 8, r * 8 + 8).some(v => v)) b.tr = r; }
        if (b.tr >= 0) { b.tc = -1; for (let i = 0; i < 5 && b.tc < 0; i++) { const c = rnd(8); if (b.state[b.tr * 8 + c]) b.tc = c; } if (b.tc < 0) b.tr = -1; }
      }
      if (b.tr >= 0) { if (b.cx !== b.tc) b.cx = stepToward(b.cx, b.tc); else b.cy = stepToward(b.cy, b.tr); R.snd('minigame/drip', 0.25); }
    }
  }
  draw(ctx: CanvasRenderingContext2D, R: Runner) {
    const t = sheet('minigame/01/bg');
    if (t?.img) { const s = t.sf[1]; const p = ctx.createPattern(tileCanvas(t, 1), 'repeat'); if (p) { ctx.fillStyle = p; ctx.fillRect(0, 0, R.W, R.H); } void s; }
    drawFrame(ctx, 'minigame/01/bg', 0, R.cx, R.cy);
    R.drawTimer(ctx);
    for (const b of this.boards.values()) {
      for (let i = 0; i < 48; i++) { const [ch, f] = b.layers[i][b.state[i]]; drawFrame(ctx, `minigame/01/character0${ch}`, f, b.bx + (i % 8) * 30, b.by + Math.floor(i / 8) * 30); }
      if (R.phase === 'play' || R.phase === 'end' || R.phase === 'start') drawFrame(ctx, 'minigame/01/cursor', b.slot, b.bx + b.cx * 30, b.by + b.cy * 30);
    }
  }
  scores() { return [null, null, null, null]; }
}
const tiles = new WeakMap<object, HTMLCanvasElement>();
/** one frame cut into its own canvas (pattern fill of the 80×80 background tile) */
export function tileCanvas(sh: NonNullable<ReturnType<typeof sheet>>, fi: number) {
  const key = sh.img as object; let c = tiles.get(key);
  if (!c) { const f = sh.f[fi], s = sh.sf[fi]; c = document.createElement('canvas'); c.width = f[2]; c.height = f[3]; c.getContext('2d')!.drawImage(sh.img!, s[0], s[1], s[2], s[3], 0, 0, f[2], f[3]); tiles.set(key, c); }
  return c;
}

// ================================================================ MG02 機械人打拍子 robot rhythm  [V 0x41a660–0x41b940]
interface P02 { slot: number; x: number; py: number; score: number; next: number; clap: boolean; frame: number; slide: number; aiClap: boolean }
export class MG02 implements Game {
  id = 1; timer = false; resultKind = 'rank' as const; pad = { dirs: 0 as const, buttons: 1 as const };
  sheets = ['minigame/02/bg', 'minigame/02/robot', 'minigame/02/music', 'minigame/02/hand', ...[1, 2, 3, 4].map(i => `minigame/02/player0${i}`)];
  sounds = ['minigame/02/kk', 'minigame/02/computer'];
  ps = new Map<number, P02>();
  round = 0; pat: { phraseTicks: number; beatTicks: number[] } = PATTERNS[0];
  counter = 0; phase: 'demo' | 'listen' | 'over' = 'demo'; bar = 40; phrase = 40; notes: number[] = [];
  robotState: 0 | 1 | 2 | 3 = 2; robotIdx = 0; robotT = 0; computer: LoopHandle | null = null;
  started = false;
  init(R: Runner) {
    for (const p of R.parts) this.ps.set(p.slot, { slot: p.slot, x: p.x, py: R.H - 22 - R.OY, score: 0, next: 0, clap: false, frame: 0, slide: 157, aiClap: false });
  }
  readyPos(_R: Runner, p: Part): [number, number] { const q = this.ps.get(p.slot)!; return [q.x, q.py - 30]; }
  private newRound() {
    const i = rnd(4) + this.round * 4; this.pat = PATTERNS[i]; this.round++;
    this.bar = 0; this.phrase = this.pat.phraseTicks; this.notes = []; this.counter = 0;
    this.robotState = 2; this.robotIdx = 0; this.robotT = 0; this.phase = 'demo';
  }
  /** FUN_0041af40: nearest unused beat within 10 ticks → 10-|d| */
  private score(q: P02) {
    let best = -1, bd = 10;
    for (let i = q.next; i < this.pat.beatTicks.length; i++) { const d = Math.abs(this.pat.beatTicks[i] - this.bar); if (d < bd) { bd = d; best = i; } }
    if (best < 0) return 0;
    q.next = best + 1; return 10 - bd;
  }
  private clap(R: Runner, q: P02) {
    q.score += this.score(q);
    R.snd('minigame/02/kk', 1, (q.x * 2 / R.W) - 1);
  }
  key(R: Runner, p: Part, k: Key, down: boolean) {
    if (k !== 0) return;
    const q = this.ps.get(p.slot)!;
    if (this.phase !== 'listen') return;
    if (down) { q.clap = true; this.clap(R, q); } else q.clap = false;
  }
  ptr(R: Runner, p: Part | null, e: VPtr) {
    if (!p) return;
    if (e.type === 'down') R.push(p.slot, 0, true); else if (e.type === 'up' || e.type === 'cancel') R.push(p.slot, 0, false);
  }
  tick(R: Runner) {
    if (!this.started) { this.started = true; this.newRound(); }
    if (this.bar < this.phrase) this.bar++;
    if (this.phase === 'demo') {
      this.counter++;
      if (this.counter === this.phrase) { // players' turn
        this.computer?.stop(); this.computer = null;
        this.robotState = 3; this.robotIdx = 0; this.robotT = 0; this.bar = 0; this.phase = 'listen'; this.counter = 0;
        for (const q of this.ps.values()) q.next = 0;
      } else if (this.pat.beatTicks.includes(this.counter)) { this.notes.push(this.bar); this.robotState = 1; this.robotIdx = 0; }
    } else if (this.phase === 'listen') {
      for (const p of R.parts) {
        if (p.human) continue;
        const q = this.ps.get(p.slot)!;
        if (q.aiClap) { q.aiClap = false; q.clap = false; continue; }
        if (Math.random() < 0.5 && q.next < this.pat.beatTicks.length) {
          const d = this.bar - this.pat.beatTicks[q.next];
          if (Math.abs(d) < rnd(5) + 4) { q.aiClap = true; q.clap = true; this.clap(R, q); }
          else if (d > 0) q.next++;
        }
      }
      if (++this.counter === this.phrase) {
        if (this.round === 5) { this.phase = 'over'; for (const q of this.ps.values()) q.clap = false; R.end(null); return; }
        for (const q of this.ps.values()) q.clap = false;
        this.newRound();
      }
    }
    // robot animation (FUN_0041a9d0)
    switch (this.robotState) {
      case 1: { const seq = [4, 5, 6, 7, 5]; this.robotIdx++; if (this.robotIdx === 2) R.snd('minigame/02/kk'); if (this.robotIdx >= seq.length) { this.robotState = 0; this.robotIdx = 0; } break; }
      case 2: if (++this.robotT > 5) { this.robotT = 0; this.robotIdx++; } if (this.robotIdx >= 3) { this.computer?.stop(); this.computer = R.loop('minigame/02/computer', 0.5); this.robotState = 0; this.robotIdx = 0; } break;
      case 3: if (++this.robotT > 10) { this.robotT = 0; if (this.robotIdx < 3) this.robotIdx++; } break;
      default: this.robotIdx = (this.robotIdx + 1) % 4;
    }
  }
  anim(R: Runner) {
    for (const p of R.parts) {
      const q = this.ps.get(p.slot)!;
      if (p.ready) q.slide = Math.max(0, q.slide - 3);
      const n = frameCount('minigame/02/hand');
      if (q.clap) { if (q.frame < 3) q.frame++; } else if (q.frame > 0) { q.frame++; if (q.frame >= n - 1) q.frame = 0; }
    }
  }
  robotFrame() {
    const seqs = [[0, 1, 2, 3], [4, 5, 6, 7, 5], [10, 9, 8, 0], [8, 9, 10, 11]];
    const s = seqs[this.robotState]; return s[Math.min(this.robotIdx, s.length - 1)];
  }
  draw(ctx: CanvasRenderingContext2D, R: Runner) {
    ctx.save(); R.clipBand(ctx);
    drawFrame(ctx, 'minigame/02/bg', 0, R.cx, R.cy);
    if (R.W > 640) { drawFrame(ctx, 'minigame/02/bg', 0, R.cx - 640, R.cy); drawFrame(ctx, 'minigame/02/bg', 0, R.cx + 640, R.cy); }
    // music bar (FUN_0041a870)
    const my = R.OY + 40, x0 = R.cx - 0xd3;
    drawFrame(ctx, 'minigame/02/music', 0, R.cx, my);
    const fw = Math.floor(this.bar * 0x1a6 / Math.max(1, this.phrase));
    ctx.fillStyle = '#000';
    for (let i = 0; i < 5; i++) ctx.fillRect(x0, my - 10 + i * 4, fw, 2);
    for (const n of this.notes) drawFrame(ctx, 'minigame/02/music', 1, Math.floor(n * 0x1a6 / this.phrase) + x0, my);
    drawFrame(ctx, 'minigame/02/robot', this.robotFrame(), R.cx, R.cy + 50);
    for (const p of R.parts) {
      const q = this.ps.get(p.slot)!;
      if (p.ready) drawFrame(ctx, 'minigame/02/hand', q.frame, q.x, q.py + q.slide);
      drawFrame(ctx, `minigame/02/player0${p.slot + 1}`, 0, q.x, q.py);
      const s = String(q.score).padStart(2, '0');
      numText(ctx, s, q.x - numWidth(s) / 2 + 0x1c, q.py - 13, '#000');
    }
    ctx.restore();
  }
  scores(R: Runner) { return [0, 1, 2, 3].map(s => (R.part(s) ? this.ps.get(s)!.score : null)); }
  stop() { this.computer?.stop(); this.computer = null; }
}

// ================================================================ MG03 彈叉打賊 slingshot thief  [V 0x41b990–0x41d050]
interface P03 { slot: number; x: number; y: number; tagX: number; tagY: number; frame: number; pulled: boolean; fire: boolean; slide: number; hits: number;
  stone: { x: number; y: number; t: number } | null; tx: number | null }
export class MG03 implements Game {
  id = 2; timer = true; resultKind = 'rank' as const; pad = { dirs: 2 as const, buttons: 1 as const };
  sheets = ['minigame/03/bg', 'minigame/03/stone', ...[1, 2, 3, 4, 5].map(i => `minigame/03/thief_0${i}`), ...[1, 2, 3, 4].map(i => `minigame/03/hand0${i}`)];
  sounds = ['minigame/03/barf', 'minigame/03/cat', 'minigame/03/pop'];
  ps = new Map<number, P03>();
  // thief: dir 0 = right (thief_02), 1 = left (thief_01); turn sprites 03 (→right) / 04 (→left); 05 hit
  th = { x: 0, y: 0, dir: 0, spr: 2, f: 0, c: 0, mode: 'run' as 'run' | 'turn' | 'hit', dizzy: false };
  cat = { on: false, t: 0, x: 0 };
  init(R: Runner) {
    this.th.x = R.cx; this.th.y = R.cy + 100;
    const n = R.parts.length, seg = Math.floor(487 / n);
    for (const p of R.parts) {
      const h = sheet(`minigame/03/hand0${p.slot + 1}`)?.f[0]?.[3] ?? 118;
      this.ps.set(p.slot, { slot: p.slot, x: p.x, y: R.OY + 490 - h, tagX: R.OX + 67 + Math.floor(seg / 2) + p.k * seg, tagY: R.OY + 18, frame: 0, pulled: false, fire: false, slide: h, hits: 0, stone: null, tx: null });
    }
  }
  readyPos(_R: Runner, p: Part): [number, number] { const q = this.ps.get(p.slot)!; return [q.x, q.y + 50]; }
  private thiefSheet() { return `minigame/03/thief_0${this.th.spr}`; }
  private setSpr(i: number) { this.th.spr = i; this.th.f = 0; }
  private thiefTick(R: Runner) {
    const t = this.th;
    if (++t.c < 4 && t.mode !== 'hit') return;
    if (t.mode === 'hit') { if (t.c < 12) return; t.c = 0; t.dizzy = false; t.mode = 'run'; this.setSpr(t.dir === 0 ? 2 : 1); return; }
    t.c = 0;
    if (t.mode === 'turn') { t.mode = 'run'; this.setSpr(t.dir === 0 ? 2 : 1); return; }
    if (t.dir === 0) {
      if (t.x > R.W - Math.floor(R.W / 3) && rnd(4) === 0) { t.dir = 1; t.mode = 'turn'; this.setSpr(4); return; }
      t.x += 16; if (t.x > R.W - 100) { t.dir = 1; t.mode = 'turn'; this.setSpr(4); return; }
    } else {
      if (t.x < Math.floor(R.W / 3) && rnd(4) === 0) { t.dir = 0; t.mode = 'turn'; this.setSpr(3); return; }
      t.x -= 16; if (t.x < 100) { t.dir = 0; t.mode = 'turn'; this.setSpr(3); return; }
    }
    t.f = (t.f + 1) % Math.max(1, frameCount(this.thiefSheet()));
  }
  key(_R: Runner, p: Part, k: Key, down: boolean) {
    const q = this.ps.get(p.slot)!;
    if (q.stone) return; // input ignored while the own stone flies
    if (k === 0) { if (down) { q.pulled = true; q.frame = 1; } else if (q.pulled) q.fire = true; }
  }
  /** Web pointer control: the hand follows the pointer's x; press = pull, release = shoot (original mouse: drag down / flick up). */
  ptr(R: Runner, p: Part | null, e: VPtr) {
    if (!p) return;
    const q = this.ps.get(p.slot)!;
    if (e.type === 'down') { q.tx = e.vx; if (!q.stone) { q.pulled = true; q.frame = 1; } }
    else if (e.type === 'move') { if (!e.mouse || R.held[p.slot][0] || q.pulled) q.tx = e.vx; else q.tx = e.vx; }
    else if (e.type === 'up') { if (q.pulled && !q.stone) q.fire = true; if (!e.mouse) q.tx = null; }
  }
  tick(R: Runner) {
    this.thiefTick(R);
    // cat easter egg (decorative)
    if (!this.cat.on && Math.random() < 0.01) { this.cat = { on: true, t: 0, x: rnd(400) + 150 + R.OX }; R.snd('minigame/03/cat', 0.25); }
    if (this.cat.on && ++this.cat.t > 40) this.cat.on = false;
    const t = this.th;
    for (const p of R.parts) {
      const q = this.ps.get(p.slot)!;
      const n = frameCount(`minigame/03/hand0${p.slot + 1}`);
      if (q.fire) { q.frame++; if (q.frame >= n - 1) { q.fire = false; q.pulled = false; q.frame = 0; q.stone = { x: q.x, y: q.y, t: 0 }; R.snd('minigame/03/pop', 0.25); } }
      if (!p.human) {
        // AI (FUN_0041c530): 5/6 of ticks
        if (rnd(6) !== 0) {
          if (!q.stone) { const d = Math.abs(t.x - q.x); if (d < 5 && q.pulled) q.fire = true; if (!q.fire && d < 30) { q.pulled = true; if (q.frame === 0) q.frame = 1; } }
          if (q.x < t.x) { if (t.dir === 0) q.x += 6; } else if (t.dir === 1) q.x -= 6;
        }
      } else {
        const hl = R.held[p.slot];
        if (hl[2] && q.x > 50) q.x -= 6;
        if (hl[3] && q.x < R.W - 50) q.x += 6;
        if (q.tx !== null && !hl[2] && !hl[3]) { if (q.tx < q.x - 3 && q.x > 50) q.x -= 6; else if (q.tx > q.x + 3 && q.x < R.W - 50) q.x += 6; }
      }
      q.x = Math.max(50, Math.min(R.W - 50, q.x));
      // stone (FUN_0041c2b0)
      const s = q.stone;
      if (s) {
        s.y -= 12; s.t++;
        if (s.t === 13) {
          const sh = sheet(this.thiefSheet());
          const hit = [[0, 0], [-5, 0], [5, 0], [0, -5], [0, 5]].some(([dx, dy]) => pixelHit(sh, t.f, t.x, t.y, s.x + dx, s.y + dy));
          if (hit) {
            q.hits++; q.stone = null;
            if (!t.dizzy) { t.dizzy = true; R.snd('minigame/03/barf'); }
            t.mode = 'hit'; t.c = 0; this.setSpr(5);
          }
        }
        if (q.stone && s.t >= 15) q.stone = null;
      }
    }
  }
  anim(R: Runner) { for (const p of R.parts) { const q = this.ps.get(p.slot)!; if (p.ready) q.slide = Math.max(0, q.slide - 5); } }
  draw(ctx: CanvasRenderingContext2D, R: Runner) {
    ctx.save(); R.clipBand(ctx);
    for (const dx of R.W > 640 ? [-640, 0, 640] : [0]) drawFrame(ctx, 'minigame/03/bg', 0, R.cx + dx, R.cy);
    if (this.cat.on) { const up = Math.min(20, this.cat.t, 40 - this.cat.t) * 2; drawFrame(ctx, 'minigame/03/bg', 2, this.cat.x, R.cy + 30 - up); }
    for (const dx of R.W > 640 ? [-640, 0, 640] : [0]) drawFrame(ctx, 'minigame/03/bg', 1, R.cx + dx, R.cy);
    drawFrame(ctx, 'minigame/03/bg', 3, R.cx, R.cy);
    R.drawTimer(ctx);
    const t = this.th, ts = this.thiefSheet(), f = sheet(ts)?.f[t.f];
    if (f) drawShadow(ctx, ts, t.f, t.x, t.y, f[2], Math.floor(f[3] / 5), 100);
    drawFrame(ctx, ts, t.f, t.x, t.y);
    for (const q of this.ps.values()) {
      const s = q.stone; if (!s) continue;
      const k = Math.max(1, 3 - Math.floor(s.t / 4)); const sf = sheet('minigame/03/stone')?.f[0]; if (!sf) continue;
      const w = Math.floor(sf[2] * k / 3), h = Math.floor(sf[3] * k / 3);
      drawShadow(ctx, 'minigame/03/stone', 0, s.x, s.y + 100, Math.floor(w / 2), Math.floor(h / 3), 0x40);
      drawSized(ctx, 'minigame/03/stone', 0, s.x, s.y, w, h);
    }
    for (const p of R.parts) {
      const q = this.ps.get(p.slot)!, hs = `minigame/03/hand0${p.slot + 1}`, n = frameCount(hs);
      if (p.ready) drawFrame(ctx, hs, q.frame, q.x, q.y + q.slide);
      drawFrame(ctx, hs, n - 1, q.tagX, q.tagY);
      const s = String(q.hits); numText(ctx, s, q.tagX - numWidth(s) / 2 + 0x1a, q.tagY - 0xc, PCOL[p.slot], '#000');
    }
    ctx.restore();
  }
  scores(R: Runner) { return [0, 1, 2, 3].map(s => (R.part(s) ? this.ps.get(s)!.hits * 10 : null)); }
}

// ================================================================ MG04 吹氣球 balloon  [V 0x41d0a0–0x41df90]
interface P04 { slot: number; x: number; y: number; gy: number; p: number; last: number; leak: number; phase: number; pop: number; snd: 0 | 1 | -1 }
export class MG04 implements Game {
  id = 3; timer = true; resultKind = 'card' as const; pad = { dirs: 0 as const, buttons: 2 as const };
  sheets = ['minigame/04/bg', 'minigame/04/balloon', ...[1, 2, 3, 4].map(i => `minigame/04/player0${i}`)];
  sounds = ['minigame/04/balloon01', 'minigame/04/balloon02', 'minigame/04/balloon03'];
  ps = new Map<number, P04>();
  up: LoopHandle | null = null; down: LoopHandle | null = null;
  init(R: Runner) {
    for (const p of R.parts) {
      const gh = sheet(`minigame/04/player0${p.slot + 1}`)?.f[1]?.[3] ?? 27;
      this.ps.set(p.slot, { slot: p.slot, x: p.x, y: R.cy + 10 - 20 * (p.k & 1), gy: R.H - Math.floor(gh / 2) - R.OY, p: 0, last: -1, leak: 0, phase: 0, pop: -1, snd: 0 });
    }
  }
  readyPos(_R: Runner, p: Part): [number, number] { const q = this.ps.get(p.slot)!; return [q.x, q.gy - 20]; }
  private pump(R: Runner, q: P04) {
    q.p++; q.leak = 0;
    if (q.p >= 180) { q.p = 180; q.pop = 0; R.snd('minigame/04/balloon03'); R.end(q.slot); }
  }
  key(R: Runner, p: Part, k: Key, down: boolean) {
    if (!down || k > 1) return;
    const q = this.ps.get(p.slot)!;
    if (k === q.last) return; // must alternate
    q.last = k; this.pump(R, q);
  }
  /** Web pointer: left / right of your gauge = button 0 / 1 (right mouse button = 1) */
  ptr(R: Runner, p: Part | null, e: VPtr) {
    if (!p) return;
    const q = this.ps.get(p.slot)!;
    const k: Key = e.button === 2 ? 1 : e.vx < q.x ? 0 : 1;
    if (e.type === 'down') R.push(p.slot, k, true);
    else if (e.type === 'up' || e.type === 'cancel') { R.push(p.slot, 0, false); R.push(p.slot, 1, false); }
  }
  tick(R: Runner) {
    let rising = false, falling = false;
    for (const p of R.parts) {
      const q = this.ps.get(p.slot)!;
      const before = q.p;
      if (!p.human && Math.random() < 0.25) this.pump(R, q);
      if (R.phase !== 'play') return;
      if (++q.leak > 5) { q.leak = 0; if (q.p > 0) q.p--; }
      if (q.p > before) rising = true; else if (q.p < before) falling = true;
    }
    // inflate / deflate loops (shared channel like the exe's single sound objects)
    if (rising) { if (!this.up?.playing) this.up = R.loop('minigame/04/balloon01', 0.25); } else if (this.up && !rising) { this.up.stop(); this.up = null; }
    if (falling && !rising) { if (!this.down?.playing) this.down = R.loop('minigame/04/balloon02', 0.25); } else if (this.down) { this.down.stop(); this.down = null; }
  }
  anim(R: Runner) {
    for (const q of this.ps.values()) { q.phase = (q.phase + 1) & 3; if (q.pop >= 0 && q.pop < 2) q.pop++; }
    void R;
  }
  draw(ctx: CanvasRenderingContext2D, R: Runner) {
    ctx.save(); R.clipBand(ctx);
    for (const dx of R.W > 640 ? [-640, 0, 640] : [0]) drawFrame(ctx, 'minigame/04/bg', 0, R.cx + dx, R.cy);
    drawFrame(ctx, 'minigame/04/bg', 1, R.cx, R.cy);
    R.drawTimer(ctx);
    const wob = [0, 1, 0, 2];
    for (const p of R.parts) {
      const q = this.ps.get(p.slot)!;
      const fi = q.pop >= 0 ? 15 + q.pop : Math.min(4, Math.floor(q.p / 36)) * 3 + wob[q.phase];
      drawFrame(ctx, 'minigame/04/balloon', fi, q.x, q.y);
      const g = `minigame/04/player0${p.slot + 1}`;
      drawFrame(ctx, g, 1, q.x, q.gy);
      ctx.fillStyle = 'rgb(255,244,53)'; ctx.fillRect(q.x - 66, q.gy - 11, Math.floor(q.p / 2), 24);
      drawFrame(ctx, g, 0, q.x, q.gy);
    }
    ctx.restore();
  }
  scores() { return [null, null, null, null]; }
  stop() { this.up?.stop(); this.down?.stop(); this.up = this.down = null; }
}

export function makeGame(i: number): Game { return [new MG01(), new MG02(), new MG03(), new MG04()][i]; }
export const GAME_NAMES = ['畫展', '機械人打拍子', '彈叉打賊', '吹氣球'];
