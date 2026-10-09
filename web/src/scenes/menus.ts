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
// Original (scene 0x4414a0, FUN_00403560..00403d80, spec/minigames/data/main_menu.json): one row of 6 buttons at
// y = H-50, x = OX+80+95·i; menu.spr frame0 glow eases (div 4) to the hovered button, labels = frames 2..7, frame1 on top
// of the glow; bg.spr frame0 (老夫子) at (W/2, W/2+80), frame2 bar at (W/2, H-50), frame1 logo at (W/2, H/4+100).
// Layout below is the exe's 800x600 mode. 30 s without mouse movement → opening (attract).
interface Coin { x: number; y: number; vy: number; vx: number; t: number; k: number; rot: number }
const MM_ITEMS = [
  { id: 'opt', label: 2, name: '系統設定' }, { id: 'album', label: 3, name: '相簿' }, { id: 'mini', label: 4, name: '小遊戲' },
  { id: 'new', label: 5, name: '新遊戲' }, { id: 'load', label: 6, name: '載入進度' }, { id: 'exit', label: 7, name: '離開遊戲' },
];
let mmLast = 3;
export class MainMenuScene implements Scene {
  coins: Coin[] = [];
  confirmExit = false; exitT = -1; albumMsg = false; albumT = -1;
  sel = mmLast; glowX = 0; idle = 0; lastMx = -1; lastMy = -1;
  enter() {
    music('audiotrack03.mp3'); setup.mode = 'game';
    this.glowX = this.bx(this.sel);
    if (AUTO) setTimeout(() => go('selectyear'), 50);
  }
  bx(i: number) { return 80 + 80 + 95 * i; }
  update(dt: number) {
    if (Math.random() < dt / 260) this.coins.push({ x: Math.random() * 800, y: -60, vy: 40 + Math.random() * 60, vx: (Math.random() - 0.5) * 30, t: Math.random() * 1000, k: Math.random() < 0.5 ? 1 : 2, rot: 0 });
    for (const c of this.coins) { c.y += c.vy * dt / 1000; c.x += c.vx * dt / 1000 + Math.sin(c.t / 300) * 0.3; c.t += dt; }
    this.coins = this.coins.filter(c => c.y < 700);
    // glow eases toward the selected button (div 4 per 25 ms tick)
    const k = 1 - Math.pow(1 - 0.25, dt / 25); this.glowX += (this.bx(this.sel) - this.glowX) * k;
    if (app.mx !== this.lastMx || app.my !== this.lastMy || this.confirmExit || this.albumMsg) { this.idle = 0; this.lastMx = app.mx; this.lastMy = app.my; }
    else if ((this.idle += dt) > 30000 && !AUTO && !(navigator as any).webdriver) go('title');
  }
  activate(i: number) {
    mmLast = i; this.sel = i;
    const id = MM_ITEMS[i].id;
    if (id === 'opt') go('options');
    else if (id === 'album') this.albumMsg = true;
    else if (id === 'mini') { setup.mode = 'mini'; go('selectactor'); }
    else if (id === 'new') go('selectyear');
    else if (id === 'load') go('load');
    else this.confirmExit = true;
  }
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    patternBg(ctx, w, h);
    const st = stage(w, h);
    applyStage(ctx, st);
    drawFrame(ctx, 'mainmenu/bg', 0, 400, 480);
    for (const c of this.coins) drawFrame(ctx, c.k === 1 ? 'mainmenu/money01' : 'mainmenu/money02', Math.floor(c.t / 120) % 5, c.x, c.y);
    drawFrame(ctx, 'mainmenu/bg', 2, 400, 550);
    drawFrame(ctx, 'mainmenu/bg', 1, 400, 250 + Math.sin(app.time / 600) * 3);
    // button row; enlarged around the centre on small screens so the labels stay tappable
    const rk = Math.max(1, Math.min(1.33, 0.75 / st.s));
    const rx = (x: number) => 400 + (x - 400) * rk, ry = 550 - (rk - 1) * 24;
    drawFrame(ctx, 'mainmenu/menu', 0, rx(this.glowX), ry, rk);
    MM_ITEMS.forEach((it, i) => {
      const x = rx(this.bx(i)), id = 'mm' + it.id, stt = app.state(id);
      if (stt && this.sel !== i && !this.confirmExit && !this.albumMsg) { this.sel = i; void sfx('mainmenu/button'); }
      drawFrame(ctx, 'mainmenu/menu', it.label, x, ry + (stt === 2 ? 1 : 0), rk, it.id === 'album' ? 0.5 : 1);
      app.hit(id, sr(st, { x: x - 47 * rk, y: ry - 22 * rk, w: 94 * rk, h: 44 * rk }), () => { void sfx('mainmenu/click'); this.activate(i); });
    });
    drawFrame(ctx, 'mainmenu/menu', 1, rx(this.glowX), ry, rk);
    text(ctx, 'Ver 1.05H', 790, 586, { size: 12, align: 'right', color: '#fff', stroke: '#000', strokeWidth: 3, weight: 'normal' });
    resetT(ctx);
    if (this.confirmExit) {
      if (this.exitT < 0) this.exitT = app.time;
      drawMsgBox(ctx, w, h, { text: msg('Misc', 'ExitGame'), t: app.time - this.exitT, yes: () => { this.confirmExit = false; go('title'); }, no: () => { this.confirmExit = false; } }, 'ex');
    } else this.exitT = -1;
    if (this.albumMsg) {
      if (this.albumT < 0) this.albumT = app.time;
      drawMsgBox(ctx, w, h, { text: '相簿（機會卡 / 四字真言）的圖片收錄於原版第二張光碟的 album.dat，網頁版暫時沒有這些內容。', t: app.time - this.albumT, yes: () => { this.albumMsg = false; } }, 'al');
    } else this.albumT = -1;
  }
  onKey(k: string) {
    if (this.confirmExit || this.albumMsg) { if (k === 'Escape' || k === 'Enter') { this.confirmExit = false; this.albumMsg = false; } return; }
    if (k === 'ArrowLeft') { this.sel = (this.sel + 5) % 6; void sfx('mainmenu/button'); }
    if (k === 'ArrowRight') { this.sel = (this.sel + 1) % 6; void sfx('mainmenu/button'); }
    if (k === 'Enter' || k === ' ') this.activate(this.sel);
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
  enter() {
    if (setup.mode === 'game') prewarmGame(setup.map, setup.seats.filter(s => s.on).map(s => s.char));
    if (AUTO) { setup.seats.forEach(s => (s.ai = true)); setTimeout(() => this.start(), 50); }
  }
  back() { go(setup.mode === 'mini' ? 'mainmenu' : 'selectmap'); }
  cycleChar(i: number, d = 1) {
    const used = new Set(setup.seats.filter((s, j) => j !== i && s.on).map(s => s.char));
    let c = setup.seats[i].char;
    for (let k = 0; k < 6; k++) { c = ((c - 1 + d + 6) % 6) + 1; if (!used.has(c)) break; }
    setup.seats[i].char = c;
    if (setup.mode === 'game') prewarmGame(setup.map, [c]);
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
  start() {
    const n = setup.seats.filter(s => s.on).length;
    if (setup.mode === 'mini') { if (n >= 1) go('selectmini'); return; }
    if (n >= 2) go('game', { new: true });
  }
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    patternBg(ctx, w, h);
    const st = stage(w, h); applyStage(ctx, st);
    text(ctx, setup.mode === 'mini' ? '小遊戲 · 選擇角色' : '選擇角色', 400, 46, { size: 30, align: 'center', color: '#ffe36a', stroke: '#4a0a00', strokeWidth: 6 });
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
    const minN = setup.mode === 'mini' ? 1 : 2;
    text(ctx, n < minN ? '最少需要兩位玩家' : '點擊頭像換角色 · 點擊右方圖示切換 玩家 / 電腦 / 關閉', 400, 520, { size: 14, align: 'center', color: '#fff7c2', stroke: '#1b2b5a', strokeWidth: 3 });
    sbtn(ctx, st, 'aok', 'selectactor/button', [3, 4, 5], 440, 340, () => this.start(), { disabled: n < minN });
    sbtn(ctx, st, 'aback', 'selectactor/button', [0, 1, 2], 380, 340, () => this.back());
    resetT(ctx);
  }
  onKey(k: string) { if (k === 'Enter') this.start(); if (k === 'Escape') this.back(); }
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
