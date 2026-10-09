import { app, type Scene, wait, AUTO } from '../core/app';
import { drawFrame, sheet, frameRect, BASE, setQuality, hdActive, hdAvailable } from '../core/assets';
import { music, sfx, unlockAudio, settings, saveSettings, applyVolumes, voice } from '../core/audio';
import { text, FONT } from '../core/text';
import { stage, applyStage, resetT, patternBg, sbtn, button, panel, sr, dim, slider, type Stage } from '../ui/widgets';
import { RULES, MAPS, CHAR_VOICE_PREFIX } from '../game/config';
import { charName, D } from '../game/data';
import { listSlots, loadSlot } from '../game/state';
import { setup } from './setup';
import { setSpeedIndex } from '../core/app';
import { prewarmGame } from './game';
import { LoadSaveWin, drawMsgBox, drawMenuOptions, OptEdit } from '../ui/origdlg';
import { msg } from '../game/data';

let go: (name: string, arg?: any) => void = () => {};
export function bindNav(fn: typeof go) { go = fn; }

// ---------------------------------------------------------------- Title
export class TitleScene implements Scene {
  video: HTMLVideoElement | null = null;
  phase: 'press' | 'video' = 'press';
  enter() { music(null); if (AUTO) setTimeout(() => go('mainmenu'), 50); }
  exit() { this.video?.pause(); this.video = null; }
  start() {
    unlockAudio();
    const v = document.createElement('video');
    v.playsInline = true; v.muted = false; v.preload = 'auto';
    const canWebm = v.canPlayType('video/webm') !== '';
    v.src = BASE + 'video/' + (canWebm ? 'logo800.webm' : 'logo800.mp4');
    v.onended = () => go('mainmenu');
    v.onerror = () => go('mainmenu');
    void v.play().catch(() => { v.muted = true; void v.play().catch(() => go('mainmenu')); });
    this.video = v; this.phase = 'video';
  }
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (this.phase === 'video' && this.video) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
      const v = this.video;
      if (v.videoWidth) { const s = Math.min(w / v.videoWidth, h / v.videoHeight); const dw = v.videoWidth * s, dh = v.videoHeight * s; ctx.drawImage(v, (w - dw) / 2, (h - dh) / 2, dw, dh); }
      text(ctx, '點擊略過 ▶', w - 16, h - 16, { size: 14, align: 'right', color: 'rgba(255,255,255,0.6)' });
      app.hit('skip', { x: 0, y: 0, w, h }, () => go('mainmenu'), false);
      return;
    }
    patternBg(ctx, w, h);
    const st = stage(w, h);
    applyStage(ctx, st);
    const bob = Math.sin(app.time / 500) * 4;
    drawFrame(ctx, 'logo/bg', 1, 400, 300 + bob, 1.15);
    drawFrame(ctx, 'logo/bg', 2, 400, 300 + bob * 0.3, 1.0);
    const pulse = 1 + Math.sin(app.time / 250) * 0.04;
    sbtn(ctx, st, 'start', 'logo/button', [0, 1, 1], 400, 380, () => this.start(), { scale: 1.2 * pulse });
    text(ctx, '原作：老夫子大富翁 (2002)  ·  支援滑鼠 / 觸控', 400, 580, { size: 13, align: 'center', color: 'rgba(255,255,255,0.8)', stroke: '#1b2b5a', strokeWidth: 3, weight: 'normal' });
    resetT(ctx);
  }
  onKey(k: string) { if (k === 'Enter' || k === ' ') { if (this.phase === 'press') this.start(); else go('mainmenu'); } }
}

// ---------------------------------------------------------------- Main menu
interface Coin { x: number; y: number; vy: number; vx: number; t: number; k: number; rot: number }
export class MainMenuScene implements Scene {
  coins: Coin[] = [];
  confirmExit = false; exitT = -1;
  enter() { music('audiotrack03.mp3'); if (AUTO) setTimeout(() => go('selectyear'), 50); }
  update(dt: number) {
    if (Math.random() < dt / 260) this.coins.push({ x: Math.random() * 800, y: -60, vy: 40 + Math.random() * 60, vx: (Math.random() - 0.5) * 30, t: Math.random() * 1000, k: Math.random() < 0.5 ? 1 : 2, rot: 0 });
    for (const c of this.coins) { c.y += c.vy * dt / 1000; c.x += c.vx * dt / 1000 + Math.sin(c.t / 300) * 0.3; c.t += dt; }
    this.coins = this.coins.filter(c => c.y < 700);
  }
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    patternBg(ctx, w, h);
    const st = stage(w, h);
    applyStage(ctx, st);
    for (const c of this.coins) if (c.k === 2) drawFrame(ctx, 'mainmenu/money02', Math.floor(c.t / 120) % 5, c.x, c.y);
    drawFrame(ctx, 'mainmenu/bg', 2, 400, 560, 0.8);
    drawFrame(ctx, 'mainmenu/bg', 0, 255, 300, 0.92);
    drawFrame(ctx, 'mainmenu/bg', 1, 560, 180 + Math.sin(app.time / 600) * 3, 0.82);
    for (const c of this.coins) if (c.k === 1) drawFrame(ctx, 'mainmenu/money01', Math.floor(c.t / 120) % 5, c.x, c.y);
    const items: [number, string, () => void][] = [
      [5, 'new', () => go('selectyear')],
      [6, 'load', () => go('load')],
      [2, 'opt', () => go('options')],
      [7, 'exit', () => { this.confirmExit = true; }],
    ];
    items.forEach(([lab, id, cb], i) => {
      const x = 575, y = 330 + i * 58;
      const hov = app.state('mm' + id);
      drawFrame(ctx, 'mainmenu/menu', 0, x, y, 2.3);
      if (hov) drawFrame(ctx, 'mainmenu/menu', 1, x, y, 2.05);
      drawFrame(ctx, 'mainmenu/menu', lab, x, y + (hov === 2 ? 2 : 0), 1.7);
      const r = frameRect('mainmenu/menu', 0, x, y, 2.3);
      app.hit('mm' + id, sr(st, r), () => { void sfx('mainmenu/button'); cb(); });
    });
    text(ctx, 'Ver 1.05H · Web', 790, 592, { size: 11, align: 'right', color: 'rgba(255,255,255,0.6)', weight: 'normal' });
    resetT(ctx);
    if (this.confirmExit) {
      if (this.exitT < 0) this.exitT = app.time;
      drawMsgBox(ctx, w, h, { text: msg('Misc', 'ExitGame'), t: app.time - this.exitT, yes: () => { this.confirmExit = false; go('title'); }, no: () => { this.confirmExit = false; } }, 'ex');
    } else this.exitT = -1;
  }
}

// ---------------------------------------------------------------- Select year
export class SelectYearScene implements Scene {
  enter() { music('audiotrack03.mp3'); if (AUTO) setTimeout(() => go('selectmap'), 50); }
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    patternBg(ctx, w, h);
    const st = stage(w, h); applyStage(ctx, st);
    const A = { x: 400, y: 300 };
    drawFrame(ctx, 'selectyear/fg', 0, A.x, A.y + 12 + Math.sin(app.time / 400) * 2);
    drawFrame(ctx, 'selectyear/bg', 0, A.x, A.y);
    text(ctx, '請選擇遊戲年期', A.x, A.y + 18, { size: 18, align: 'center', color: '#fff', stroke: '#06394a', strokeWidth: 4 });
    for (let i = 0; i < 4; i++) {
      const sel = setup.weeksIdx === i;
      sbtn(ctx, st, 'yr' + i, 'selectyear/buttons', [i * 2, i * 2 + 1], A.x, A.y, () => { setup.weeksIdx = i; void sfx('selectyear/uo06'); }, { selected: sel });
    }
    const wk = RULES.yearOptionsWeeks[setup.weeksIdx];
    text(ctx, wk < 0 ? '無限期：直至只剩一位玩家' : `${wk / 52} 年（${wk} 個星期）`, A.x, A.y + 150, { size: 15, align: 'center', color: '#fff7c2', stroke: '#06394a', strokeWidth: 3 });
    sbtn(ctx, st, 'ystart', 'selectyear/buttons', [8, 9, 10], A.x, A.y + 30, () => go('selectmap'));
    sbtn(ctx, st, 'yback', 'selectyear/buttons', [11, 12, 13], A.x, A.y + 30, () => go('mainmenu'));
    resetT(ctx);
  }
  onKey(k: string) { if (k === 'Enter') go('selectmap'); if (k === 'Escape') go('mainmenu'); }
}

// ---------------------------------------------------------------- Select map
export class SelectMapScene implements Scene {
  t = 0;
  enter() { if (AUTO) { const m = Number(new URLSearchParams(location.search).get('map')); if (m >= 0 && m < 3) setup.map = m; setTimeout(() => go('selectactor'), 50); } }
  change(d: number) { setup.map = (setup.map + d + 3) % 3; this.t = 0; void sfx(d > 0 ? 'selectmap/mapup' : 'selectmap/mapdown'); }
  update(dt: number) { this.t += dt; }
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    patternBg(ctx, w, h);
    const st = stage(w, h); applyStage(ctx, st);
    const A = { x: 400, y: 245 };
    drawFrame(ctx, 'selectmap/bg', 0, A.x + 40, A.y + 10);
    const k = Math.min(1, this.t / 300);
    drawFrame(ctx, 'selectmap/map', setup.map, A.x + 40, A.y + 10 - (1 - k) * 30, 1, k);
    drawFrame(ctx, 'selectmap/fg', 0, A.x - 10, A.y + 30);
    // name plate
    drawFrame(ctx, 'selectmap/fg', 1, A.x + 40, A.y - 20);
    text(ctx, MAPS[setup.map].name, A.x + 40, A.y + 185, { size: 30, align: 'center', color: '#ffe36a', stroke: '#4a0a00', strokeWidth: 6 });
    sbtn(ctx, st, 'mprev', 'selectmap/buttons', [0, 1, 2], A.x - 150, A.y + 50, () => this.change(-1));
    sbtn(ctx, st, 'mnext', 'selectmap/buttons', [0, 1, 2], A.x + 230, A.y + 50, () => this.change(1));
    text(ctx, '◀', A.x - 150 + 8, A.y + 50 + 135, { size: 22, align: 'center', color: '#fff', stroke: '#000', strokeWidth: 4 });
    text(ctx, '▶', A.x + 230 + 8, A.y + 50 + 135, { size: 22, align: 'center', color: '#fff', stroke: '#000', strokeWidth: 4 });
    sbtn(ctx, st, 'mok', 'selectmap/buttons', [3, 4, 5], A.x + 50, A.y + 60, () => go('selectactor'));
    sbtn(ctx, st, 'mback', 'selectmap/buttons', [6, 7, 8], A.x + 30, A.y + 60, () => go('selectyear'));
    resetT(ctx);
  }
  onKey(k: string) { if (k === 'ArrowLeft') this.change(-1); if (k === 'ArrowRight') this.change(1); if (k === 'Enter') go('selectactor'); if (k === 'Escape') go('selectyear'); }
}

// ---------------------------------------------------------------- Select actor
export class SelectActorScene implements Scene {
  enter() { prewarmGame(setup.map, setup.seats.filter(s => s.on).map(s => s.char)); if (AUTO) { setup.seats.forEach(s => (s.ai = true)); setTimeout(() => this.start(), 50); } }
  cycleChar(i: number, d = 1) {
    const used = new Set(setup.seats.filter((s, j) => j !== i && s.on).map(s => s.char));
    let c = setup.seats[i].char;
    for (let k = 0; k < 6; k++) { c = ((c - 1 + d + 6) % 6) + 1; if (!used.has(c)) break; }
    setup.seats[i].char = c;
    prewarmGame(setup.map, [c]);
    const pre = CHAR_VOICE_PREFIX[c];
    void voice(pre + '28.mp3');
  }
  cycleDev(i: number) {
    const s = setup.seats[i];
    if (!s.on) { s.on = true; s.ai = false; }
    else if (!s.ai) s.ai = true;
    else if (i >= 2 || setup.seats.filter(x => x.on).length > 2) s.on = false;
    else s.ai = false;
    if (s.on) { const used = new Set(setup.seats.filter((x, j) => j !== i && x.on).map(x => x.char)); if (used.has(s.char)) this.cycleChar(i); }
    void sfx('selectactor/button1');
  }
  start() { if (setup.seats.filter(s => s.on).length >= 2) go('game', { new: true }); }
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    patternBg(ctx, w, h);
    const st = stage(w, h); applyStage(ctx, st);
    text(ctx, '選擇角色', 400, 46, { size: 30, align: 'center', color: '#ffe36a', stroke: '#4a0a00', strokeWidth: 6 });
    const pos = [[205, 175], [595, 175], [205, 395], [595, 395]];
    setup.seats.forEach((s, i) => {
      const [cx, cy] = pos[i];
      const sh = `selectactor/player0${i + 1}`;
      ctx.save(); if (!s.on) ctx.globalAlpha = 0.4;
      drawFrame(ctx, sh, 0, cx, cy, 1.15);
      ctx.restore();
      const f0 = frameRect(sh, 0, cx, cy, 1.15);
      // portrait in the center circle of the banknote
      if (s.on) {
        const fr = sheet('map/character/character0' + s.char + '_01');
        drawFrame(ctx, 'interface/face0' + s.char, 0, cx - 38, cy + 18, 1.5);
        text(ctx, charName(s.char), cx - 38, cy + 72, { size: 18, align: 'center', color: '#fff', stroke: '#000', strokeWidth: 4 });
        void fr;
      } else text(ctx, '（空位）', cx - 38, cy + 30, { size: 18, align: 'center', color: '#fff', stroke: '#000', strokeWidth: 4 });
      // device toggle
      const devFrame = !s.on ? -1 : s.ai ? 8 : 0;
      const dx = cx + 75, dy = cy + 20;
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(dx, dy, 34, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();
      if (devFrame >= 0) drawFrame(ctx, 'selectactor/device', devFrame, dx, dy - 4, devFrame === 8 ? 0.8 : 0.9);
      text(ctx, !s.on ? '關閉' : s.ai ? '電腦' : '玩家', dx, dy + 50, { size: 15, align: 'center', color: '#fff', stroke: '#000', strokeWidth: 4 });
      app.hit('dev' + i, sr(st, { x: dx - 36, y: dy - 36, w: 72, h: 100 }), () => this.cycleDev(i));
      if (s.on) {
        app.hit('chr' + i, sr(st, { x: cx - 110, y: cy - 50, w: 140, h: 140 }), () => this.cycleChar(i));
        button(ctx, 'cl' + i, { x: cx - 130, y: cy + 82, w: 40, h: 34 }, '◀', () => this.cycleChar(i, -1), { size: 16 }, sr(st, { x: cx - 130, y: cy + 82, w: 40, h: 34 }));
        button(ctx, 'cr' + i, { x: cx + 14, y: cy + 82, w: 40, h: 34 }, '▶', () => this.cycleChar(i, 1), { size: 16 }, sr(st, { x: cx + 14, y: cy + 82, w: 40, h: 34 }));
      }
      void f0;
    });
    const n = setup.seats.filter(s => s.on).length;
    text(ctx, n < 2 ? '最少需要兩位玩家' : '點擊頭像換角色 · 點擊右方圖示切換 玩家 / 電腦 / 關閉', 400, 520, { size: 14, align: 'center', color: '#fff7c2', stroke: '#1b2b5a', strokeWidth: 3 });
    sbtn(ctx, st, 'aok', 'selectactor/button', [3, 4, 5], 440, 340, () => this.start(), { disabled: n < 2 });
    sbtn(ctx, st, 'aback', 'selectactor/button', [0, 1, 2], 380, 340, () => go('selectmap'));
    resetT(ctx);
  }
  onKey(k: string) { if (k === 'Enter') this.start(); if (k === 'Escape') go('selectmap'); }
}

// ---------------------------------------------------------------- Options (also used in-game as overlay)
export class OptionsScene implements Scene {
  ed = new OptEdit();
  close(ok: boolean) { this.ed.finish(ok); go('mainmenu'); }
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    patternBg(ctx, w, h);
    drawMenuOptions(ctx, w, h, this.ed, ok => this.close(ok));
  }
  onKey(k: string) { if (k === 'Escape') this.close(false); if (k === 'Enter') this.close(true); }
}

// ---------------------------------------------------------------- Load
/** main menu 讀取進度: the original loadsave carousel (origdlg.ts) over the main-menu backdrop */
export class LoadScene implements Scene {
  win = new LoadSaveWin('load', slot => { const d = loadSlot(slot); if (d) go('game', { load: d.g }); }, () => go('mainmenu'));
  update(dt: number) { this.win.update(dt); }
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    patternBg(ctx, w, h);
    const st = stage(w, h); applyStage(ctx, st);
    drawFrame(ctx, 'mainmenu/bg', 2, 400, 560, 0.8);
    drawFrame(ctx, 'mainmenu/bg', 0, 255, 300, 0.92);
    drawFrame(ctx, 'mainmenu/bg', 1, 560, 180, 0.82);
    resetT(ctx);
    this.win.render(ctx, w, h);
  }
  onKey(k: string) { this.win.key(k); }
}
void wait; void FONT;
