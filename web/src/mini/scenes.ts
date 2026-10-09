// 小遊戲 menu flow: SelectActor (minigame mode) → SelectMiniGame (dat\SelectMiniGame, FUN_00406d40..00407140) → game.
import { app, type Scene, type PtrEvent, AUTO } from '../core/app';
import { drawFrame, frameRect, loadSheets } from '../core/assets';
import { music, sfx } from '../core/audio';
import { text } from '../core/text';
import { stage, applyStage, resetT, patternBg, sr } from '../ui/widgets';
import { setup } from '../scenes/setup';
import { startMiniGame } from './host';
import type { Runner } from './core';
import { GAME_NAMES } from './games';

let go: (name: string, arg?: any) => void = () => {};
export function bindMiniNav(fn: typeof go) { go = fn; }

/** button → game index table @0x441a78 */
const MAP = [2, 1, 3, 0];

export class SelectMiniGameScene implements Scene {
  hover = -1; launch = -1; delay = 0; t = 0;
  enter() {
    music('audiotrack03.mp3');
    void loadSheets(['selectminigame/bg', 'selectminigame/fg']);
    const q = new URLSearchParams(location.search).get('mg');
    if (AUTO && q !== null) setTimeout(() => this.pick(MAP.indexOf(Number(q))), 50);
  }
  pick(b: number) {
    if (this.launch >= 0 || b < 0) return;
    void sfx('selectminigame/button');
    this.launch = b; this.delay = 0;
  }
  update(dt: number) {
    this.t += dt;
    if (this.launch >= 0) { this.delay += dt; if (this.delay >= 80 * 25 || new URLSearchParams(location.search).has('mgspeed')) { const g = MAP[this.launch]; this.launch = -1; go('miniplay', g); } }
  }
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    patternBg(ctx, w, h);
    const st = stage(w, h); applyStage(ctx, st);
    const C = { x: 400, y: 300 };
    drawFrame(ctx, 'selectminigame/fg', 0, C.x, C.y);
    drawFrame(ctx, 'selectminigame/fg', 1, C.x, C.y);
    let hov = -1;
    for (let b = 0; b < 4; b++) {
      const id = 'smg' + b, s = this.launch === b ? 2 : app.state(id);
      if (s) hov = b;
      drawFrame(ctx, 'selectminigame/bg', b * 3 + s, C.x, C.y);
      const r = frameRect('selectminigame/bg', b * 3, C.x, C.y);
      app.hit(id, sr(st, r), () => this.pick(b));
    }
    // labels after all thumbnails: button 0's caption sits under the overlapping 吹氣球 frame
    for (let b = 0; b < 4; b++) {
      const r = frameRect('selectminigame/bg', b * 3, C.x, C.y);
      text(ctx, GAME_NAMES[MAP[b]], r.x + r.w / 2, r.y + r.h + 18, { size: 15, align: 'center', color: '#fff', stroke: '#1b2b5a', strokeWidth: 4 });
    }
    const xs = app.state('smgx');
    drawFrame(ctx, 'selectminigame/fg', 2 + xs, C.x, C.y);
    app.hit('smgx', sr(st, frameRect('selectminigame/fg', 2, C.x, C.y)), () => { void sfx('selectminigame/button'); go('mainmenu'); });
    if (app.isHover('smgx')) hov = 4;
    if (hov !== this.hover) { if (hov >= 0) void sfx('selectminigame/dan01'); this.hover = hov; }
    const n = setup.seats.filter(s => s.on).length;
    text(ctx, `小遊戲 · ${n} 位玩家（不會獲得任何獎勵）`, 400, 586, { size: 13, align: 'center', color: 'rgba(255,255,255,0.85)', stroke: '#1b2b5a', strokeWidth: 3, weight: 'normal' });
    resetT(ctx);
  }
  onKey(k: string) {
    if (k === 'Escape') go('mainmenu');
    const n = Number(k); if (n >= 1 && n <= 4) this.pick(n - 1);
  }
}

/** standalone play of one game with the seats chosen on SelectActor (standalone flag DAT_00448870 = 1: no rewards) */
export class MiniPlayScene implements Scene {
  R: Runner;
  constructor(game: number) {
    const seats = setup.seats.map((s, slot) => ({ ...s, slot })).filter(s => s.on).map(s => ({ slot: s.slot, char: s.char, human: !s.ai && !AUTO }));
    this.R = startMiniGame(game, seats, true, r => { (window as any).__lfzMiniLast = r; setTimeout(() => go('selectmini'), 0); });
  }
  exit() { this.R.abort(); }
  update(dt: number) { this.R.update(dt); }
  render(ctx: CanvasRenderingContext2D, w: number, h: number) { this.R.render(ctx, w, h); }
  onPointer(e: PtrEvent) { this.R.pointer(e); return true; }
  onKeyEv(e: KeyboardEvent, down: boolean) {
    if (down && e.key === 'Escape') { this.R.abort(); go('selectmini'); return true; }
    return this.R.keyEv(e, down);
  }
}
