// Result screens: word-card reel (scene 0x442ea0, MG01/04 winners in board mode) and the result2 ranking (MG02/03).
import { drawFrame, sheet, image, loadSheets } from '../core/assets';
import { text } from '../core/text';
import { D, msg, charName } from '../game/data';
import { type Runner, type ResultScreen, type Part, type Key, easeStep, rnd, numText, numWidth, type LoopHandle } from './core';
import { tileCanvas } from './games';

export function resultSheets(slot: number, char: number) {
  return ['minigame/result/bg', `minigame/result/player0${slot + 1}`, `minigame/result/character0${char}`, 'minigame/pressbutton'];
}

/** FUN_00418bf0..00419070 */
export class WordCardResult implements ResultScreen {
  full = true; done = false;
  cards: { i: number; y: number }[] = []; total = 0; ch = 248; cw = 248;
  speed = 40; stopped = false; aiWait = 0; sel = -1; hold = 120; msgText = '';
  drum: LoopHandle; human: boolean;
  constructor(private R: Runner, public slot: number, public char: number) {
    const n = D.words.length || 16;
    for (let i = 0; i < n; i++) { this.cards.push({ i, y: this.total }); this.total += this.ch; void image('images/cards/' + D.words[i]?.jpg); }
    this.aiWait = rnd(80) + 40;
    this.human = !!R.part(slot)?.human;
    this.drum = R.loop('minigame/result/drum_long', 1);
    void loadSheets(resultSheets(slot, char));
  }
  stopReel() {
    if (this.stopped) return;
    this.stopped = true;
    this.R.snd('minigame/drip'); this.drum.stop(); this.R.snd('minigame/result/drum_short');
  }
  key(p: Part, k: Key, down: boolean) { if (this.human && p.slot === this.slot && down && k <= 1) this.stopReel(); }
  tap() { if (this.human) this.stopReel(); }
  tick(R: Runner) {
    const y0 = R.OY + 0xb7;
    if (this.sel >= 0) {
      if (--this.hold === 0) { R.cardId = this.cards[this.sel].i + 1; this.done = true; }
      return;
    }
    if (!this.stopped) { if (!this.human && --this.aiWait === 0) this.stopped = true; }
    else {
      if (this.speed > 0) this.speed--;
      if (this.speed === 0) {
        const c = this.cards.findIndex(c => c.y === y0);
        if (c >= 0) {
          this.sel = c; const w = D.words[this.cards[c].i];
          this.msgText = msg('Misc', 'winnerMsg', charName(this.char), w?.title ?? '');
          return;
        }
        this.speed = 1;
      }
    }
    for (const c of this.cards) { c.y += this.speed; if (c.y >= this.total - this.ch) c.y -= this.total; }
  }
  draw(ctx: CanvasRenderingContext2D, R: Runner) {
    const t = sheet(`minigame/result/player0${this.slot + 1}`);
    if (t?.img) { const p = ctx.createPattern(tileCanvas(t, 1), 'repeat'); if (p) { ctx.fillStyle = p; ctx.fillRect(0, 0, R.W, R.H); } }
    drawFrame(ctx, 'minigame/result/bg', 0, R.cx, R.cy);
    drawFrame(ctx, `minigame/result/player0${this.slot + 1}`, 0, R.cx, R.cy);
    drawFrame(ctx, `minigame/result/character0${this.char}`, 0, R.cx, R.cy);
    const x0 = R.OX + 0xc3, y0 = R.OY + 0xb7;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, this.cw, this.ch); ctx.clip();
    const cx = R.cx - this.cw / 2;
    for (const c of this.cards) {
      if (c.y + this.ch <= y0 || c.y >= y0 + this.ch) continue;
      const im = image('images/cards/' + D.words[c.i]?.jpg);
      if (im) ctx.drawImage(im, cx, c.y, this.cw, this.ch); else { ctx.fillStyle = '#333'; ctx.fillRect(cx, c.y, this.cw, this.ch); }
    }
    ctx.restore();
    if (!this.stopped && this.human) R.drawPress(ctx, Math.floor(R.W * 5 / 6), R.cy + 200);
    if (this.msgText) text(ctx, this.msgText, R.cx, R.cy + 0xdc + 16, { size: 18, align: 'center', color: '#fff', stroke: '#000', strokeWidth: 4 });
  }
  stop() { this.drum.stop(); }
}

/** result2 ranking (FUN_0041e8c0 .. 0041ee10): rows sorted by score, slide in; 320 ticks */
export class RankResult implements ResultScreen {
  done = false; t = 0; by = 0;
  rows: { slot: number; char: number; score: number; y: number; delay: number }[] = [];
  constructor(R: Runner, scores: (number | null)[]) {
    const list = R.parts.map(p => ({ slot: p.slot, char: p.char, score: scores[p.slot] ?? 0 }));
    list.sort((a, b) => b.score - a.score);
    this.rows = list.map((r, k) => ({ ...r, y: R.H + 200, delay: 30 * (k + 1) }));
    R.snd('minigame/result2/dan02');
  }
  tick(R: Runner) {
    this.by += easeStep(this.by, R.cy, 8);
    this.rows.forEach((r, k) => { if (r.delay > 0) r.delay--; else r.y += easeStep(r.y, R.OY + 140 + k * 77, 4); });
    if (++this.t >= 320) this.done = true;
  }
  draw(ctx: CanvasRenderingContext2D, R: Runner) {
    drawFrame(ctx, 'minigame/result2/bg', 0, R.cx, this.by);
    this.rows.forEach((r, k) => {
      const x = R.cx, y = r.y;
      drawFrame(ctx, `minigame/result2/player0${r.slot + 1}`, 0, x, y);
      drawFrame(ctx, 'minigame/result2/face', r.char - 1, x + 5, y);
      drawFrame(ctx, 'minigame/result2/number', k, x - 0x95, y);
      const s = String(r.score); numText(ctx, s, x - numWidth(s) / 2 + 0x9c, y - 10 - 3, '#fff', '#000');
    });
  }
}
