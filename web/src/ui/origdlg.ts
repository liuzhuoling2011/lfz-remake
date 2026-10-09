// Original-style dialogs rebuilt from the exe (static analysis) with the game's own interface/*.spr art:
//   * smessagebox  — generic message box @0x40b850 (create @0x40b8e0, paint @0x40bc90)
//   * loadsave     — save / load carousel @0x40a6b0 (create @0x40a700, update @0x40ab30/@0x40ac10, paint @0x40b0a0)
//   * main-menu 設定 — option/bg + option/setting + option/button dialogs registered @0x404349
// Everything is drawn in original 640x480 pixel units through a Win transform (origwin.ts); HD sheets are picked
// automatically by drawFrame.
import { app } from '../core/app';
import { drawFrame, sheet, hdActive, hdAvailable, setQuality } from '../core/assets';
import { sfx, settings, saveSettings, applyVolumes, toggleFullscreen } from '../core/audio';
import { setSpeedIndex } from '../core/app';
import { text, wrap } from '../core/text';
import { winBegin, winEnd, wbtn, wr, sysScale, type Win } from './origwin';
import { listSlots, type GameState } from '../game/state';
import { D, msg } from '../game/data';

const WHITE = { color: '#fff', stroke: '#000', strokeWidth: 3, baseline: 'top' as CanvasTextBaseline };

// ------------------------------------------------------------------ message box
export interface MsgBox { text: string; t: number; yes: () => void; no?: () => void }
/**
 * smessagebox.spr frame 0 at (W/2, H/2+100); text (20x20 font, white + outline) in the box (x-100, y-58, width 200);
 * widgets: flag 2 → X = frames 4-6 (result 2 / 否), flag 1 → O = frames 1-3 (result 1 / 是); alpha fades in += 0x20 per
 * tick. A box without an X just has O (e.g. LoadErr).
 */
export function drawMsgBox(ctx: CanvasRenderingContext2D, w: number, h: number, m: MsgBox, id = 'mb') {
  const S = sysScale(w, h);
  const W: Win = { sc: S, ax: w / 2, ay: h / 2 + 100 * S };
  app.block();
  const a = Math.min(1, m.t / 130);
  winBegin(ctx, W, a);
  drawFrame(ctx, 'interface/smessagebox', 0, 0, 0);
  const lines = wrap(ctx, m.text, 200, 18);
  lines.slice(0, 5).forEach((l, i) => text(ctx, l, -100, -58 + i * 22, { size: 18, ...WHITE }));
  if (m.no) wbtn(ctx, W, id + '-x', 'interface/smessagebox', [4, 5, 6], m.no, { sound: 'interface/click' });
  wbtn(ctx, W, id + '-o', 'interface/smessagebox', [1, 2, 3], m.yes, { sound: 'interface/click' });
  winEnd(ctx);
}

// ------------------------------------------------------------------ save / load
interface Entry { slot: number; data: { t: number; g: GameState } | null }
/**
 * Save/load carousel. The exe lists the existing omqSaveNN.dat files (NN 0..9) plus, when saving and there is room,
 * one empty entry; one entry is shown at a time: loadsave frame 0 at (W/2, Y) sliding from Y = H+200 to 2H/3 (step
 * = remaining/4 per tick), title frame 2 (Save) / 1 (Load); the entry number in round.spr digits squashed to half
 * height at (X+20, Y-90); each player's face (frame 0, or 1 if bankrupt) at (X-80+50k, Y-30) with "AI" (8x8 font)
 * at (x-8, Y-20); "地區：<map>" at (X-80, Y+10) and "年期：<week>／<limit or ∞>" at (X-80, Y+40) (20x20 font);
 * an empty entry shows frame 15 (EMPTY). Widgets: X 3-5, O 6-8, ► 9-11 (next), ◄ 12-14 (prev). No saves when
 * loading → message box SAVE_LOAD_MESSAGE/LoadErr. Saving over an existing entry asks SaveMsg first.
 * (Web: entry 0 is the remake's per-turn autosave and is only offered for loading.)
 */
export class LoadSaveWin {
  t = 0; idx = 0; entries: Entry[] = []; box: MsgBox | null = null;
  constructor(public mode: 'load' | 'save', private onPick: (slot: number) => void, private onClose: () => void) {
    const all = listSlots();
    if (mode === 'load') this.entries = all.filter(e => e.data);
    else {
      this.entries = all.filter(e => e.slot > 0 && e.data);
      const empty = all.find(e => e.slot > 0 && !e.data);
      if (empty) this.entries.push(empty);
    }
    if (!this.entries.length) this.box = { text: msg('SAVE_LOAD_MESSAGE', 'LoadErr'), t: 0, yes: () => this.onClose() };
  }
  update(dt: number) { this.t += dt; if (this.box) this.box.t += dt; }
  private ok() {
    const e = this.entries[this.idx]; if (!e) return;
    if (this.mode === 'save' && e.data) this.box = { text: msg('SAVE_LOAD_MESSAGE', 'SaveMsg'), t: 0, yes: () => { this.box = null; this.onPick(e.slot); }, no: () => { this.box = null; } };
    else this.onPick(e.slot);
  }
  private step(d: number) { const n = this.idx + d; if (n >= 0 && n < this.entries.length) { this.idx = n; void sfx('interface/highlight'); } }
  key(k: string) {
    if (this.box) { if (k === 'Enter' || k === ' ') this.box.yes(); else if (k === 'Escape') (this.box.no ?? this.box.yes)(); return; }
    if (k === 'ArrowRight') this.step(1); else if (k === 'ArrowLeft') this.step(-1);
    else if (k === 'Enter' || k === ' ') this.ok(); else if (k === 'Escape') this.onClose();
  }
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    app.block();
    if (this.box && !this.entries.length) { drawMsgBox(ctx, w, h, this.box, 'ls-mb'); return; }
    const S = sysScale(w, h);
    const target = h / 2 + 80 * S, start = h + 200 * S;
    const y = target + (start - target) * Math.pow(0.75, this.t / 16.7);
    const W: Win = { sc: S, ax: w / 2, ay: y };
    winBegin(ctx, W);
    drawFrame(ctx, 'interface/loadsave', 0, 0, 0);
    drawFrame(ctx, 'interface/loadsave', this.mode === 'save' ? 2 : 1, 0, 0);
    const e = this.entries[this.idx];
    if (e) {
      // entry number on the tab: round.spr digit at half height
      ctx.save(); ctx.translate(20, -90); ctx.scale(1, 0.5); drawFrame(ctx, 'interface/round', e.slot % 10, 0, 0); ctx.restore();
      if (e.data) {
        const g = e.data.g;
        g.players.slice(0, 4).forEach((p, k) => {
          const x = -80 + 50 * k;
          drawFrame(ctx, 'interface/face0' + p.char, p.alive ? 0 : 1, x, -30);
          if (p.ai) text(ctx, 'AI', x - 8, -20, { size: 9, ...WHITE, strokeWidth: 2.5 });
        });
        if (e.slot === 0) text(ctx, '自動存檔', 96, -58, { size: 10, ...WHITE, align: 'right', strokeWidth: 2.5, color: '#ffe36a' });
        const L = D.main.SAVE_LOAD_MESSAGE ?? {};
        text(ctx, `${L.map ?? '地區'}：${L['MapName' + g.map] ?? ''}`, -80, 10, { size: 18, ...WHITE });
        const lim = g.weeksLimit > 0 ? String(g.weeksLimit) : (L['-1'] ?? '∞');
        text(ctx, `${L.year ?? '年期'}：${g.week + 1}／${lim}`, -80, 40, { size: 18, ...WHITE });
      } else drawFrame(ctx, 'interface/loadsave', 15, 0, 0);
    }
    wbtn(ctx, W, 'ls-x', 'interface/loadsave', [3, 4, 5], () => this.onClose());
    wbtn(ctx, W, 'ls-o', 'interface/loadsave', [6, 7, 8], () => this.ok(), { disabled: !e });
    wbtn(ctx, W, 'ls-next', 'interface/loadsave', [9, 10, 11], () => this.step(1), { disabled: this.idx >= this.entries.length - 1, sound: null });
    wbtn(ctx, W, 'ls-prev', 'interface/loadsave', [12, 13, 14], () => this.step(-1), { disabled: this.idx <= 0, sound: null });
    winEnd(ctx);
    if (this.box) drawMsgBox(ctx, w, h, this.box, 'ls-mb');
  }
}

// ------------------------------------------------------------------ option values (shared by both 設定 windows)
export interface OptVals { q: number; spd: number; sfx: number; mus: number; voice: number; fs: boolean }
export class OptEdit {
  v: OptVals; orig: OptVals;
  /** exact settings at open (levels are quantised to 0-3 in the window; cancel must not round the user's values) */
  raw = { quality: settings.quality, speed: settings.speed, sfx: settings.sfx, music: settings.music, voice: settings.voice, fullscreen: settings.fullscreen };
  constructor() {
    const cur = { q: settings.quality, spd: settings.speed, sfx: Math.round(settings.sfx * 3), mus: Math.round(settings.music * 3), voice: settings.voice, fs: settings.fullscreen };
    this.v = { ...cur }; this.orig = { ...cur };
  }
  /** apply live (volume / speed / 畫質 are heard and seen at once); cancel() restores the snapshot */
  apply() {
    const o = this.v;
    settings.speed = o.spd as 0 | 1 | 2; setSpeedIndex(o.spd);
    settings.sfx = o.sfx / 3; settings.music = o.mus / 3;
    settings.voice = o.sfx === this.orig.sfx ? this.orig.voice : o.sfx / 3;
    applyVolumes();
    if (settings.quality !== o.q) { settings.quality = o.q as 0 | 1 | 2; void setQuality(o.q); }
    if (settings.fullscreen !== o.fs) { settings.fullscreen = o.fs; void toggleFullscreen(o.fs); }
  }
  cycle(k: 'q' | 'spd' | 'sfx' | 'mus' | 'fs') {
    const o = this.v;
    if (k === 'q') { o.q = (o.q + 1) % 3; if (o.q === 2 && !hdAvailable()) o.q = 0; }
    else if (k === 'spd') o.spd = (o.spd + 1) % 3;
    else if (k === 'fs') o.fs = !o.fs;
    else o[k] = (o[k] + 1) % 4;
    this.apply();
  }
  finish(ok: boolean) {
    if (!ok) {
      const r = this.raw; const qChanged = settings.quality !== r.quality;
      const fsChanged = settings.fullscreen !== r.fullscreen;
      Object.assign(settings, r); setSpeedIndex(r.speed); applyVolumes();
      if (qChanged) void setQuality(r.quality);
      if (fsChanged) void toggleFullscreen(r.fullscreen);
      this.v = { ...this.orig };
    }
    saveSettings();
  }
  qLabel() { return ['自動', '標準', '高清'][this.v.q] + (this.v.q === 0 ? (hdActive() ? '·高清' : '·標準') : ''); }
}

const colCache = new Map<string, HTMLCanvasElement>();
/** 1-px-wide column = per-row median of the given frame columns (SD frame pixels, rows y0..y1), HD aware */
function medianColumn(name: string, fi: number, xs: number[], y0: number, y1: number): HTMLCanvasElement | null {
  const s = sheet(name); if (!s?.img) return null;
  const f = s.f[fi], r = s.sf[fi]; const k = r[2] / f[2];
  const key = `${name}|${fi}|${r[0]},${r[1]},${r[2]}|${xs.join(',')}|${y0},${y1}`;
  let c = colCache.get(key);
  if (c) return c;
  const H = Math.max(1, Math.round((y1 - y0) * k));
  const tmp = document.createElement('canvas'); tmp.width = xs.length; tmp.height = H;
  const tg = tmp.getContext('2d', { willReadFrequently: true })!;
  xs.forEach((x, i) => tg.drawImage(s.img!, r[0] + (x + 0.5) * k - 0.5, r[1] + y0 * k, 1, H, i, 0, 1, H));
  const src = tg.getImageData(0, 0, xs.length, H).data;
  c = document.createElement('canvas'); c.width = 1; c.height = H;
  const cg = c.getContext('2d')!; const out = cg.createImageData(1, H);
  for (let y = 0; y < H; y++) for (let ch = 0; ch < 4; ch++) {
    const v = xs.map((_, i) => src[(y * xs.length + i) * 4 + ch]).sort((a, b) => a - b);
    out.data[y * 4 + ch] = v[v.length >> 1];
  }
  cg.putImageData(out, 0, 0);
  colCache.set(key, c);
  return c;
}

/** draw part of a frame (rect in SD frame pixels) — HD aware */
function framePart(ctx: CanvasRenderingContext2D, name: string, fi: number, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw = sw, dh = sh) {
  const s = sheet(name); if (!s?.img) return;
  const f = s.f[fi], r = s.sf[fi]; const k = r[2] / f[2];
  ctx.drawImage(s.img, r[0] + sx * k, r[1] + sy * k, sw * k, sh * k, dx, dy, dw, dh);
}

/**
 * Main-menu 設定 screen: option/bg frame 0 (TV-room art) at the screen centre; option/setting rows at the centre
 * (hotspots carry the layout): 螢幕區域 0/1, 遊戲速度 2/3, 音效 4/5, 音樂 9/10 (normal/pressed); level bars =
 * frame base+1+level (音效 6-8, 音樂 11-13); value text (20x20, white + outline) centred at (500,30) for row 0 and
 * (210,150) for 遊戲速度, in 640x480 coordinates centred on the screen. option/button: O = 0-2 (apply), X = 3-5
 * (cancel). Row 0 (screen resolution 640x480/800x600/1024x768 — meaningless on the web) now selects 畫質; its baked-in
 * label is covered with the row's own background (a clean column of the same frame, stretched) and relabelled.
 */
export function drawMenuOptions(ctx: CanvasRenderingContext2D, w: number, h: number, ed: OptEdit, close: (ok: boolean) => void) {
  const S = Math.max(0.5, Math.min(2.2, Math.min(w / 640, h / 480), (w - 8) / 610));
  const W: Win = { sc: S, ax: w / 2, ay: h / 2 };
  winBegin(ctx, W);
  drawFrame(ctx, 'option/bg', 0, 0, 0);
  const sp = D.main['Option-Speed'] ?? { 0: '慢速', 1: '正常速度', 2: '快速' };
  const val = { size: 18, ...WHITE, align: 'center' as CanvasTextAlign };
  const rows: [string, [number, number, number], 'q' | 'spd' | 'sfx' | 'mus'][] = [
    ['mo-q', [0, 1, 1], 'q'], ['mo-spd', [2, 3, 3], 'spd'], ['mo-sfx', [4, 5, 5], 'sfx'], ['mo-mus', [9, 10, 10], 'mus']];
  for (const [id, fr, k] of rows) {
    wbtn(ctx, W, id, 'option/setting', fr, () => ed.cycle(k), { sound: 'option/button' });
    if (k === 'q') {
      // frame 0 spans x 317..595, y 4..78 (hotspot 3,236); cover the baked label with the row's own background
      const fx = -3, fy = -236; const st = app.state(id) ? 1 : 0;
      // the gaps between the baked glyphs are clean background → per-row median of them, stretched over the label
      const col = medianColumn('option/setting', st, [36, 63, 90, 117, 120], 13, 54);
      if (col) ctx.drawImage(col, fx + 10, fy + 13, 111, 41);
      text(ctx, '畫質', fx + 22, fy + 37, { size: 27, color: '#000', baseline: 'middle', weight: 'normal' });
      text(ctx, ed.qLabel(), 500 - 320, 30 - 240, val);
    } else if (k === 'spd') text(ctx, sp[ed.v.spd], 210 - 320, 150 - 240, val);
    else if (k === 'sfx') { if (ed.v.sfx > 0) drawFrame(ctx, 'option/setting', 5 + ed.v.sfx, 0, 0); }
    else if (ed.v.mus > 0) drawFrame(ctx, 'option/setting', 10 + ed.v.mus, 0, 0);
  }
  // 全螢幕 (remake): clickable label under the TV-room rows
  {
    const on = ed.v.fs;
    text(ctx, '全螢幕　' + (on ? '開' : '關'), 0, 210, { size: 18, ...WHITE, align: 'center', color: on ? '#9fe8ff' : '#fff' });
    app.hit('mo-fs', wr(W, { x: -120, y: 190, w: 240, h: 36 }), () => ed.cycle('fs'));
  }
  wbtn(ctx, W, 'mo-o', 'option/button', [0, 1, 2], () => close(true));
  wbtn(ctx, W, 'mo-x', 'option/button', [3, 4, 5], () => close(false));
  winEnd(ctx);
}
