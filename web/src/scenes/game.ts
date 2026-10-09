import { app, type Scene, type PtrEvent, wait, tween, ease, TURBO, AUTO, speedMul } from '../core/app';
import { drawFrame, drawFrameFit, sheet, image, loadSheets, frameRect, frameCount, preloadImage } from '../core/assets';
import { music, sfx, voice, preloadAudio } from '../core/audio';
import { text, textBlock, wrap, fmtMoney, roundRect } from '../core/text';
import { button, panel, dim, stage, applyStage, resetT, sr } from '../ui/widgets';
import { Board } from '../game/board';
import { MapView } from '../game/view';
import { Engine, type GameUI, type ChoiceOpt, type UIOpts, type TurnAction, type ToastOpts } from '../game/engine';
import { newGame, saveSlot, loadSlot, type GameState, type Player } from '../game/state';
import { RULES, MAPS, PLAYER_COLORS, PLAYER_COLORS_DARK, SEASONS, SFX } from '../game/config';
import { D, charName, msg } from '../game/data';
import { netWorth, ownedPlots, season, yearOf, plotValue } from '../game/rules';
import { setup } from './setup';
import { drawSlots } from './menus';
import { winBegin, winEnd, wbtn, wr, centredWin, sysScale, type Win } from '../ui/origwin';
import { settings, saveSettings, applyVolumes } from '../core/audio';
import { setQuality, hdActive, hdAvailable } from '../core/assets';
import { setSpeedIndex } from '../core/app';

let go: (name: string, arg?: any) => void = () => {};
export function bindGameNav(fn: typeof go) { go = fn; }

interface DlgBtn { label: string; sub?: string; disabled?: boolean; value: any; primary?: boolean; danger?: boolean }
interface Dlg {
  kind: 'msg' | 'confirm' | 'choose' | 'players' | 'steps' | 'cards';
  title?: string; text?: string; image?: string; badge?: string; style?: UIOpts['kind'];
  buttons: DlgBtn[]; resolve: (v: any) => void; auto?: { ms: number; value: any }; t: number; seat?: number;
  /** AI-turn information: auto-closes, drawn without dimming and never blocks input */
  passive?: boolean; cardId?: number; caption?: string;
  /** card selection window state (selected row / first visible row) */
  sel?: number; scroll?: number;
}
interface Toast { text: string; o: ToastOpts; t: number; ms: number }
/** dice animation state (original dice dialog @0x4089d0: 30 frames, hold, fade) */
interface DiceAnim { d1: number; d2: number; t: number; res: () => void; landed: boolean }
interface Bubble { seat: number; text: string; t: number }

const DICE_LAND = 900, DICE_HOLD = 1500, DICE_END = 1850;

export class GameScene implements Scene {
  board!: Board; view = new MapView(); engine!: Engine; g!: GameState;
  ready = false; progress = 0; loadingText = '載入地圖中…';
  dlgs: Dlg[] = [];
  bubbles: Bubble[] = [];
  bannerText = ''; bannerT = 0; bannerColor = '#ffe36a';
  diceAnim: DiceAnim | null = null;
  toasts: Toast[] = [];
  walkOpen = true; // walk.spr one/two-dice panel open (original: opened from the ring menu's dice button)
  seasonAnim: { s: number; t: number; res: () => void } | null = null;
  turnMenuRes: ((a: TurnAction) => void) | null = null;
  overlay: 'none' | 'system' | 'options' | 'save' | 'load' | 'detail' | 'quitConfirm' = 'none';
  detailSeat = 0;
  tooltip: { plot: number; t: number } | null = null;
  winnerInfo: { seat: number; rank: number[]; t: number; res: () => void } | null = null;
  downPos: { x: number; y: number } | null = null;
  hideHud = false;
  /** time since the overlay last changed (window fade / slide-in like the original's alpha += 0x20 per tick) */
  ovT = 0; private ovPrev = 'none';
  /** original option window: values being edited + snapshot for X (cancel) */
  opt: { q: number; spd: number; sfx: number; mus: number; voice: number; orig: { q: number; spd: number; sfx: number; mus: number; voice: number } } | null = null;

  constructor(private arg: { new?: boolean; load?: GameState }) {}

  async enter() {
    try {
      let g: GameState;
      const mapIdx = this.arg.load ? this.arg.load.map : setup.map;
      this.board = await Board.load(MAPS[mapIdx].key);
      if (this.arg.load) g = this.arg.load;
      else g = newGame(this.board, setup.map, Number(new URLSearchParams(location.search).get('weeks')) || RULES.yearOptionsWeeks[setup.weeksIdx], setup.seats.filter(s => s.on).map(s => ({ char: s.char, ai: s.ai })));
      this.g = g;
      this.view.chars = g.players.map(p => p.char);
      await Promise.all([
        this.view.load(this.board, (d, t) => { this.progress = d / t; }),
        loadSheets(['interface/chance', 'interface/card', 'interface/step', 'interface/messagebox', 'interface/gameover', 'interface/luckydraw', 'interface/face01', 'interface/face02', 'interface/face03', 'interface/face04', 'interface/face05', 'interface/face06',
          ...[1, 2, 3, 4, 5, 6].flatMap(i => [`dice/dice_${i}`, `dice/dice_${i}a`]), 'interface/walk', 'interface/game_menu', 'misc/balloon',
          'interface/detailinfo', 'interface/system', 'interface/option']),
        // season / winner art is big and rarely shown → fetched on demand (seasonChange / winner) instead of up front
      ]);
      // pre-decode card art; pre-load the sounds used every turn + each player's voice lines (no first-play latency)
      void Promise.all(D.words.map(c => preloadImage('images/cards/' + c.jpg).catch(() => null)));
      void preloadAudio(['sfx/dice/dice1.mp3', 'sfx/dice/dice2.mp3', 'sfx/interface/sfx065.mp3', ...SFX.map(x => 'sfx/' + x + '.mp3'),
        ...g.players.flatMap(p => Object.values(D.chars[p.char - 1]?.voice_ids ?? {}).map(v => 'voice/' + String(v).toLowerCase() + '.mp3'))]);
      this.view.actors = g.players.map(p => ({ seat: p.seat, char: p.char, x: 0, y: 0, dir: 0, anim: 'stand' as const, t: Math.random() * 1000, hidden: !p.alive }));
      for (const p of g.players) this.view.placeActor(p.seat, p.tile, p.prev);
      const cp = g.players[g.current];
      this.view.focusOn(this.board.tiles[cp.tile].x, this.board.tiles[cp.tile].y, true);
      this.engine = new Engine(g, this.board, this.view, this.ui);
      (window as any).__lfz = { scene: this, g, engine: this.engine };
      this.ready = true;
      void this.engine.run().then(() => {
        if (this.engine.stopped) return;
        (window as any).__lfz.finished = true;
        if (!AUTO) go('mainmenu');
      }).catch(e => { console.error(e); (window as any).__lfz.error = String(e?.stack || e); });
    } catch (e) { console.error(e); this.loadingText = '載入失敗：' + e; }
  }
  exit() { if (this.engine) this.engine.stopped = true; this.dlgs.forEach(d => d.resolve(d.buttons[0]?.value)); }

  get uis() { return Math.max(0.62, Math.min(1.5, Math.min(app.w / 960, app.h / 640))); }
  isAIturn() { const p = this.g?.players[this.g.current]; return !!p && (p.ai || AUTO); }

  // ------------------------------------------------------------ GameUI
  push(d: Omit<Dlg, 't' | 'resolve'>): Promise<any> {
    return new Promise(res => {
      const dlg: Dlg = { ...d, t: 0, resolve: (v: any) => { this.dlgs = this.dlgs.filter(x => x !== dlg); res(v); } };
      if (TURBO && dlg.auto) { res(dlg.auto.value); return; }
      this.dlgs.push(dlg);
    });
  }
  ui: GameUI = {
    // humans get real dialogs; o.ai marks information shown during an AI turn → passive, auto-closing, never waits for input
    message: (t, o = {}) => this.push({ kind: 'msg', text: t, title: o.title, image: o.image, badge: o.badge, style: o.kind, cardId: o.cardId, caption: o.caption,
      buttons: [{ label: '確定', value: undefined, primary: true }], passive: !!o.ai,
      auto: o.ai || AUTO ? { ms: (o.image ? 1900 : 1300) + t.length * 22, value: undefined } : undefined }).then(() => { if (o.voice && !TURBO) void voice(o.voice, -1, 1); }),
    confirm: (t, o = {}) => this.push({ kind: 'confirm', text: t, title: o.title, image: o.image, buttons: [{ label: '是', value: true, primary: true }, { label: '否', value: false }],
      auto: AUTO ? { ms: 400, value: true } : undefined }),
    choose: (title, opts, o = {}) => this.push({ kind: 'choose', text: title, title: o.title, buttons: [...opts.map((x, i) => ({ label: x.label, sub: x.sub, disabled: x.disabled, value: i, primary: true })), { label: o.cancel ?? '取消', value: -1 }],
      auto: AUTO ? { ms: 400, value: opts.findIndex(x => !x.disabled) } : undefined }),
    dice: (d1, d2) => {
      if (TURBO) return Promise.resolve();
      void sfx('dice/dice1'); // VERIFIED: dice1.wav when the throw starts, dice2.wav on landing
      return new Promise(res => { this.diceAnim = { d1, d2, t: 0, landed: false, res: () => { this.diceAnim = null; res(); } }; });
    },
    turnMenu: p => { this.walkOpen = true; return new Promise(res => { this.turnMenuRes = a => { this.turnMenuRes = null; res(a); }; if (AUTO) this.turnMenuRes('roll2'); }); },
    pickCard: p => {
      if (!p.cards.length) return this.ui.message(msg('Misc', 'NoneCard')).then(() => null);
      return this.push({ kind: 'cards', title: '四字真言', buttons: [...p.cards.map(c => ({ label: D.words[c - 1].title, value: c, primary: true })), { label: '返回', value: null }] });
    },
    pickPlayer: (title, cands) => this.push({ kind: 'players', text: title, title: '選擇對象', buttons: [...cands.map(s => ({ label: charName(this.g.players[s].char), value: s, primary: true })), { label: '取消', value: -1 }],
      auto: AUTO ? { ms: 400, value: cands[0] } : undefined }),
    pickSteps: () => this.push({ kind: 'steps', title: '步步為營', text: '請選擇行走步數', buttons: [1, 2, 3, 4, 5, 6].map(n => ({ label: String(n), value: n, primary: true })),
      auto: AUTO ? { ms: 400, value: 3 } : undefined }),
    seasonChange: s => {
      if (TURBO) return Promise.resolve();
      void sfx('season/paper');
      return loadSheets([`season/season0${s + 1}`]).then(() => new Promise<void>(res => { this.seasonAnim = { s, t: 0, res: () => { this.seasonAnim = null; res(); } }; }));
    },
    banner: (t, c) => { this.bannerText = t; this.bannerT = 0; this.bannerColor = c ?? '#ffe36a'; },
    toast: (t, o = {}) => {
      if (TURBO) return;
      this.toasts.push({ text: t, o, t: 0, ms: (o.ms ?? 1500 + t.length * 30) * speedMul.v });
      if (this.toasts.length > 4) this.toasts.splice(0, this.toasts.length - 4);
      if (o.cardId) void preloadImage('images/cards/' + D.words[o.cardId - 1].jpg).catch(() => null);
    },
    say: (seat, t) => { if (TURBO) return; this.bubbles = this.bubbles.filter(b => b.seat !== seat); this.bubbles.push({ seat, text: t, t: 0 }); void sfx(SFX[22], 0.6); },
    winner: (seat, rank) => loadSheets(['winner/winner', `winner/character0${this.g.players[seat].char}`]).then(() => new Promise<void>(res => {
      music('winner.mp3', false);
      (window as any).__lfz.winner = { seat, char: this.g.players[seat].char, name: charName(this.g.players[seat].char), week: this.g.week, rank };
      this.winnerInfo = { seat, rank, t: 0, res: () => { this.winnerInfo = null; res(); } };
    })),
  };

  // ------------------------------------------------------------ update
  update(dt: number) {
    if (!this.ready) return;
    this.view.update(dt);
    if (this.overlay !== this.ovPrev) { this.ovPrev = this.overlay; this.ovT = 0; }
    this.ovT += dt;
    for (const d of this.dlgs) d.t += dt;
    for (const d of this.dlgs) if (d.auto && d.t >= d.auto.ms * speedMul.v) { d.resolve(d.auto.value); break; }
    { let n = 0; for (const b of this.bubbles) { b.t += dt; if (b.t < 2600) this.bubbles[n++] = b; } this.bubbles.length = n; }
    { let n = 0; for (const t of this.toasts) { t.t += dt; if (t.t < t.ms) this.toasts[n++] = t; } this.toasts.length = n; }
    this.bannerT += dt;
    if (this.diceAnim) {
      const d = this.diceAnim; d.t += dt / speedMul.v;
      if (!d.landed && d.t >= DICE_LAND) { d.landed = true; void sfx('dice/dice2'); }
      if (d.t > DICE_END) d.res();
    }
    if (this.seasonAnim) { this.seasonAnim.t += dt; if (this.seasonAnim.t > 2600) this.seasonAnim.res(); }
    if (this.winnerInfo) this.winnerInfo.t += dt;
    if (this.tooltip) { this.tooltip.t += dt; if (this.tooltip.t > 4000) this.tooltip = null; }
  }

  // ------------------------------------------------------------ input
  onPointer(e: PtrEvent) {
    if (!this.ready) return;
    if (e.type === 'down') this.downPos = { x: e.x, y: e.y };
    this.view.onPointer(e);
    if (e.type === 'up' && this.downPos && Math.hypot(e.x - this.downPos.x, e.y - this.downPos.y) < 8) {
      const w = this.view.toWorld(e.x, e.y);
      let best = -1, bd = 40;
      this.board.plots.forEach((p, i) => { const d = Math.hypot(p.x - w.x, (p.y - w.y) * 2); if (d < bd) { bd = d; best = i; } });
      this.tooltip = best >= 0 ? { plot: best, t: 0 } : null;
    }
    if (e.type === 'up') this.downPos = null;
  }
  onWheel(dx: number, dy: number) { this.view.onWheel(dy); this.view.lastManualPan = app.time; }
  onKey(k: string) {
    const top = this.dlgs[this.dlgs.length - 1];
    if (top && !top.passive && top.kind === 'cards') {
      const n = this.cardEntries(top).length; const sel = top.sel ?? 0;
      if (k === 'ArrowUp' || k === 'ArrowDown') { top.sel = Math.max(0, Math.min(n - 1, sel + (k === 'ArrowUp' ? -1 : 1))); this.fixCardScroll(top, n); return; }
      if (k === 'Enter' || k === ' ') { const e = this.cardEntries(top)[sel]; if (e) top.resolve(e.id); return; }
    }
    if (top && !top.passive && (k === 'Enter' || k === ' ')) { const b = top.buttons.find(b => !b.disabled); if (b && top.kind !== 'cards') top.resolve(b.value); return; }
    if (top && !top.passive && k === 'Escape') { const b = top.buttons[top.buttons.length - 1]; if (top.kind !== 'msg') top.resolve(b.value); return; }
    if (this.turnMenuRes && this.overlay === 'none') {
      if (k === '1') this.turnMenuRes('roll1');
      else if (k === '2' || k === ' ' || k === 'Enter') this.turnMenuRes('roll2');
      else if (k === 'c' || k === 'C') { if (this.g.players[this.g.current].cards.length) this.turnMenuRes('card'); }
    }
    if (k === 'Escape') { if (this.overlay === 'options') this.closeOptions(false); else this.overlay = this.overlay === 'none' ? 'system' : 'none'; }
    if (k === '+' || k === '=') this.view.userZoom = Math.min(3, this.view.userZoom * 1.15);
    if (k === '-') this.view.userZoom = Math.max(0.4, this.view.userZoom / 1.15);
  }

  // ------------------------------------------------------------ render
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!this.ready) { this.renderLoading(ctx, w, h); return; }
    this.view.render(ctx, w, h);
    if (this.hideHud) return; // tests (frame-diff flicker proof): map only
    this.renderBubbles(ctx);
    this.renderHUD(ctx, w, h);
    if (this.tooltip && !this.dlgs.length) this.renderTooltip(ctx, w, h);
    this.renderToasts(ctx, w, h);
    if (this.turnMenuRes && !this.dlgs.length && this.overlay === 'none') this.renderTurnMenu(ctx, w, h);
    if (this.diceAnim) this.renderDice(ctx, w, h);
    if (this.seasonAnim) this.renderSeason(ctx, w, h);
    const top = this.dlgs[this.dlgs.length - 1];
    if (top) this.renderDialog(ctx, w, h, top);
    this.renderOverlay(ctx, w, h);
    if (this.winnerInfo) this.renderWinner(ctx, w, h);
  }

  renderLoading(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#0f1a33'; ctx.fillRect(0, 0, w, h);
    const fr = Math.floor(app.time / 200) % 4;
    drawFrame(ctx, 'misc/loading', fr, w / 2, h / 2 - 20);
    const bw = Math.min(360, w - 60);
    ctx.fillStyle = '#333'; roundRect(ctx, w / 2 - bw / 2, h / 2 + 20, bw, 14, 7); ctx.fill();
    ctx.fillStyle = '#ff9a1a'; roundRect(ctx, w / 2 - bw / 2, h / 2 + 20, Math.max(14, bw * this.progress), 14, 7); ctx.fill();
    text(ctx, this.loadingText, w / 2, h / 2 + 64, { size: 16, align: 'center', color: '#ffe8a0' });
  }

  renderBubbles(ctx: CanvasRenderingContext2D) {
    for (const b of this.bubbles) {
      const a = this.view.actor(b.seat); if (!a || a.hidden) continue;
      const s = this.view.toScreen(a.x, a.y - 120);
      const k = Math.min(1, b.t / 150) * Math.min(1, (2600 - b.t) / 300);
      const size = 15 * Math.max(0.85, this.uis);
      const lines = wrap(ctx, b.text, 200, size);
      const tw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 24, th = lines.length * size * 1.35 + 16;
      ctx.save(); ctx.globalAlpha = k; ctx.translate(s.x, s.y);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = PLAYER_COLORS[b.seat]; ctx.lineWidth = 3;
      roundRect(ctx, -tw / 2, -th - 12, tw, th, 12); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, -13.5); ctx.lineTo(0, 0); ctx.lineTo(8, -13.5); ctx.fill(); ctx.stroke();
      ctx.fillRect(-9, -16, 18, 5);
      lines.forEach((l, i) => text(ctx, l, 0, -th - 12 + 8 + size + i * size * 1.35 - size * 0.2, { size, align: 'center', color: '#222' }));
      ctx.restore();
    }
  }

  renderHUD(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const u = this.uis, g = this.g;
    const n = g.players.length;
    const cw = Math.min(230 * u, (w - 16) / Math.min(n, w > 700 ? 4 : 2) - 8), ch = 66 * u;
    const perRow = w > 700 ? 4 : 2;
    g.players.forEach((p, i) => {
      const col = i % perRow, row = Math.floor(i / perRow);
      const x = 8 + col * (cw + 8), y = 8 + row * (ch + 6);
      const cur = i === g.current;
      ctx.save();
      if (!p.alive) ctx.globalAlpha = 0.5;
      const gr = ctx.createLinearGradient(x, y, x, y + ch);
      gr.addColorStop(0, PLAYER_COLORS[i]); gr.addColorStop(1, PLAYER_COLORS_DARK[i]);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(ctx, x + 2, y + 3, cw, ch, 12 * u); ctx.fill();
      ctx.fillStyle = gr; roundRect(ctx, x, y, cw, ch, 12 * u); ctx.fill();
      ctx.lineWidth = cur ? 3.5 : 1.5; ctx.strokeStyle = cur ? '#ffe36a' : 'rgba(0,0,0,0.6)'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x + 32 * u, y + ch / 2, 26 * u, 0, Math.PI * 2); ctx.fill();
      drawFrameFit(ctx, 'interface/face0' + p.char, p.alive ? 0 : 1, x + 8 * u, y + ch / 2 - 25 * u, 48 * u, 50 * u);
      const tx = x + 64 * u;
      text(ctx, charName(p.char) + (p.ai ? ' 🖥' : ''), tx, y + 20 * u, { size: 14 * u, color: '#fff', stroke: 'rgba(0,0,0,0.6)', strokeWidth: 3, maxWidth: cw - 70 * u });
      if (p.alive) {
        text(ctx, '現金 ' + fmtMoney(p.cash), tx, y + 39 * u, { size: 13 * u, color: '#ffef9a', stroke: 'rgba(0,0,0,0.6)', strokeWidth: 3, maxWidth: cw - 70 * u });
        text(ctx, '屋企 ' + fmtMoney(p.home) + '  🂠' + p.cards.length, tx, y + 57 * u, { size: 12 * u, color: '#d9f1ff', stroke: 'rgba(0,0,0,0.6)', strokeWidth: 3, maxWidth: cw - 70 * u });
        const st = p.status; const tags: string[] = [];
        if (st.hospital) tags.push('院'); if (st.jail) tags.push('獄'); if (st.frozen) tags.push('冰'); if (st.confused) tags.push('迷'); if (st.dropMoney) tags.push('漏');
        if (st.badGod) tags.push('衰'); if (st.wealthGod) tags.push('財'); if (st.cardImmune) tags.push('護'); if (p.locks) tags.push('鎖');
        tags.forEach((t, k) => {
          const bx = x + cw - (14 + k * 20) * u, by = y + 14 * u;
          ctx.fillStyle = t === '財' ? '#ffd23a' : t === '護' || t === '鎖' ? '#5fd3ff' : '#ff5a5a';
          ctx.beginPath(); ctx.arc(bx, by, 9 * u, 0, Math.PI * 2); ctx.fill();
          text(ctx, t, bx, by + 4.5 * u, { size: 11 * u, align: 'center', color: '#222', weight: 'bold' });
        });
      } else drawFrame(ctx, 'interface/gameover', 0, x + cw - 50 * u, y + ch / 2, 0.28 * u);
      ctx.restore();
      app.hit('pl' + i, { x, y, w: cw, h: ch }, () => { this.detailSeat = i; this.overlay = 'detail'; });
    });
    // info box (bottom-left)
    const iw = 190 * u, ih = 64 * u, ix = 8, iy = h - ih - 8;
    ctx.fillStyle = 'rgba(10,20,45,0.72)'; roundRect(ctx, ix, iy, iw, ih, 10 * u); ctx.fill();
    ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2; ctx.stroke();
    const wk = g.week % 52 + 1;
    text(ctx, `${MAPS[g.map].name}  第${yearOf(g)}年 第${wk}週 ${SEASONS[season(g)]}`, ix + 10 * u, iy + 22 * u, { size: 13 * u, color: '#fff', maxWidth: iw - 20 * u });
    const left = g.weeksLimit > 0 ? `剩餘 ${Math.max(0, g.weeksLimit - g.week)} 週` : '年期 ∞';
    text(ctx, `${left} · 馬會獎金 ${fmtMoney(g.jackpot)}`, ix + 10 * u, iy + 44 * u, { size: 12 * u, color: '#ffe36a', maxWidth: iw - 20 * u });
    text(ctx, '拖曳移動地圖 · 滾輪/雙指縮放', ix + 10 * u, iy + 58 * u, { size: 9.5 * u, color: 'rgba(255,255,255,0.6)', weight: 'normal', maxWidth: iw - 20 * u });
    // (round 3) no extra corner buttons: system / centre-camera live in the original ring menu (game_menu.spr)
    // banner
    if (this.bannerT < 1600 && this.bannerText) {
      const k = this.bannerT < 250 ? this.bannerT / 250 : this.bannerT > 1300 ? (1600 - this.bannerT) / 300 : 1;
      const by = (perRow === 2 && n > 2 ? 2 : 1) * (ch + 6) + 40 * u;
      ctx.save(); ctx.globalAlpha = k;
      const bw = Math.min(w - 20, 420 * u);
      const gr = ctx.createLinearGradient(w / 2 - bw / 2, 0, w / 2 + bw / 2, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.2, 'rgba(10,15,40,0.8)'); gr.addColorStop(0.8, 'rgba(10,15,40,0.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.fillRect(w / 2 - bw / 2, by - 28 * u, bw, 44 * u);
      text(ctx, this.bannerText, w / 2 + (1 - k) * 40, by + 2 * u, { size: 24 * u, align: 'center', color: this.bannerColor, stroke: '#3a1500', strokeWidth: 5 });
      ctx.restore();
    }
  }

  /** Non-blocking notifications (AI decisions etc.): slide in under the HUD, fade out, never take input. */
  renderToasts(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!this.toasts.length) return;
    const u = this.uis; const n = this.g.players.length; const perRow = w > 700 ? 4 : 2;
    let y = 8 + Math.ceil(n / perRow) * (66 * u + 6) + 8 * u;
    const tw = Math.min(w - 16, 470 * u);
    for (const t of this.toasts) {
      const inK = Math.min(1, t.t / 220), outK = Math.min(1, (t.ms - t.t) / 320);
      const a = Math.min(inK, outK);
      const card = t.o.cardId ? D.words[t.o.cardId - 1] : null;
      const thumb = card ? 54 * u : 0;
      const size = 14.5 * u;
      const lines = wrap(ctx, t.text, tw - 28 * u - (thumb ? thumb + 10 * u : 0), size).slice(0, 3);
      const th = Math.max(thumb + 12 * u, lines.length * size * 1.35 + 16 * u);
      const x = w / 2 - tw / 2, yy = y - (1 - ease.outBack(inK)) * 20 * u;
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(12,18,40,0.86)'; roundRect(ctx, x, yy, tw, th, 10 * u); ctx.fill();
      ctx.strokeStyle = t.o.seat !== undefined ? PLAYER_COLORS[t.o.seat] : (t.o.color ?? '#ffb347'); ctx.lineWidth = 2.5; ctx.stroke();
      if (t.o.seat !== undefined) { ctx.fillStyle = PLAYER_COLORS[t.o.seat]; roundRect(ctx, x + 5 * u, yy + 6 * u, 5 * u, th - 12 * u, 2.5 * u); ctx.fill(); }
      let tx = x + 18 * u;
      if (card) {
        const im = image('images/cards/' + card.jpg);
        ctx.fillStyle = '#7a4a10'; ctx.fillRect(tx - 2, yy + 6 * u - 2, thumb + 4, thumb + 4);
        if (im) ctx.drawImage(im, tx, yy + 6 * u, thumb, thumb);
        tx += thumb + 10 * u;
      }
      lines.forEach((l, i) => text(ctx, l, tx, yy + 8 * u + size + i * size * 1.35 - size * 0.15, { size, color: '#fff3c8', weight: 'bold' }));
      ctx.restore();
      y += (th + 6 * u) * Math.min(1, outK * 1.5);
    }
  }

  renderTooltip(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const pl = this.tooltip!.plot; const p = this.board.plots[pl]; const ps = this.g.plots[pl];
    const s = this.view.toScreen(p.x, p.y - 60);
    const u = this.uis; const tw = 210 * u, th = 92 * u;
    const x = Math.max(6, Math.min(w - tw - 6, s.x - tw / 2)), y = Math.max(6, s.y - th);
    ctx.fillStyle = 'rgba(255,250,235,0.95)'; roundRect(ctx, x, y, tw, th, 10 * u); ctx.fill();
    ctx.strokeStyle = ps ? PLAYER_COLORS[ps.owner] : '#c98a2c'; ctx.lineWidth = 3; ctx.stroke();
    const types = ['', '商業中心', '食肆', '住宅', '屋企'];
    text(ctx, `${p.lotId}號地  地價 ${fmtMoney(Math.floor(p.base * Math.pow(1.1, Math.floor(this.g.week / 13))))}`, x + 10 * u, y + 22 * u, { size: 14 * u, color: '#4a2a00' });
    if (ps) {
      text(ctx, `${charName(this.g.players[ps.owner].char)}的${types[ps.type]}  等級 ${ps.level + 1}`, x + 10 * u, y + 44 * u, { size: 13 * u, color: '#333' });
      const v = plotValue(this.g, this.board, pl);
      text(ctx, `價值 ${fmtMoney(v)}`, x + 10 * u, y + 64 * u, { size: 13 * u, color: '#333' });
      text(ctx, ps.type >= 3 ? '探訪送禮：現金 5–10%' : `消費：${fmtMoney(Math.floor(v / 2))}`, x + 10 * u, y + 83 * u, { size: 13 * u, color: '#b03000' });
    } else text(ctx, '空地 — 停在旁邊即可購買興建', x + 10 * u, y + 50 * u, { size: 13 * u, color: '#333' });
  }

  /** Human turn: original ring menu (game_menu.spr: dice / 四字真言 / info / system) + walk.spr one-or-two dice panel. */
  renderTurnMenu(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const u = this.uis; const p = this.g.players[this.g.current];
    const s = Math.max(0.85, Math.min(1.7, u * 1.25));
    const narrow = w < 700;
    const bottom = narrow ? h - 80 * u - 14 : h - 12;
    const totalW = (150 + (this.walkOpen ? 14 + 99 + 40 : 0)) * s;
    const x0 = w / 2 - totalW / 2, top = bottom - 150 * s;
    const R = { x: x0 - 16 * s, y: top - 8 * s }; // ring anchor (sprite offsets are relative to it)
    // ring + buttons
    drawFrame(ctx, 'interface/game_menu', 12, R.x, R.y, s);
    const ringBtn = (id: string, base: number, cb: () => void, disabled = false) => {
      const st = disabled ? 0 : app.state(id);
      ctx.globalAlpha = disabled ? 0.45 : 1;
      drawFrame(ctx, 'interface/game_menu', base + (st === 2 ? 2 : st === 1 ? 1 : 0), R.x, R.y, s);
      ctx.globalAlpha = 1;
      if (!disabled) app.hit(id, frameRect('interface/game_menu', base, R.x, R.y, s), cb);
    };
    ringBtn('gm-dice', 0, () => { this.walkOpen = !this.walkOpen; });
    ringBtn('gm-card', 3, () => this.turnMenuRes?.('card'), !p.cards.length);
    ringBtn('gm-info', 6, () => { this.detailSeat = p.seat; this.overlay = 'detail'; });
    ringBtn('gm-sys', 9, () => { this.overlay = 'system'; });
    ringBtn('gm-rot', 13, () => { const a = this.view.actor(p.seat); this.view.lastManualPan = -1e9; this.view.focusOn(a.x, a.y); });
    // card count badge on the 四字真言 button
    const cr = frameRect('interface/game_menu', 3, R.x, R.y, s);
    ctx.fillStyle = '#c3121b'; ctx.beginPath(); ctx.arc(cr.x + cr.w - 4 * s, cr.y + 6 * s, 9 * s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    text(ctx, String(p.cards.length), cr.x + cr.w - 4 * s, cr.y + 10 * s, { size: 11 * s, align: 'center', color: '#fff', weight: 'bold' });
    // one / two dice panel (walk.spr — VERIFIED layout @0x4085b0: one die at (35,18), two dice at (21,70), X at (34,109))
    if (this.walkOpen) {
      const W = { x: x0 + 164 * s, y: top };
      drawFrame(ctx, 'interface/walk', 0, W.x, W.y, s);
      const wbtn = (id: string, base: number, cb: () => void) => {
        const st = app.state(id);
        drawFrame(ctx, 'interface/walk', base + st, W.x, W.y, s);
        app.hit(id, frameRect('interface/walk', base, W.x, W.y, s), cb);
      };
      wbtn('walk1', 1, () => this.turnMenuRes?.('roll1'));
      wbtn('walk2', 4, () => this.turnMenuRes?.('roll2'));
      wbtn('walkx', 7, () => { this.walkOpen = false; });
      const lx = W.x + 103 * s, o = { size: 12.5 * s, color: '#fff', stroke: '#5a0d00', strokeWidth: 3.5 };
      text(ctx, '一粒骰', lx, W.y + 30 * s, o); text(ctx, '1–6步 [1]', lx, W.y + 45 * s, { ...o, size: 10 * s, color: '#ffe9a8' });
      text(ctx, '兩粒骰', lx, W.y + 82 * s, o); text(ctx, '2–12步 [2]', lx, W.y + 97 * s, { ...o, size: 10 * s, color: '#ffe9a8' });
      if (p.chooseSteps) text(ctx, '步步為營：自選步數', W.x + 50 * s, W.y - 6 * s, { size: 12 * s, align: 'center', color: '#9fe8ff', stroke: '#000', strokeWidth: 3 });
    }
    text(ctx, `輪到 ${charName(p.char)}`, w / 2, top - 14 * s, { size: 16 * u, align: 'center', color: '#fff', stroke: '#000', strokeWidth: 4 });
  }

  /**
   * Dice: original pre-rendered tumble (dice_N = first die, dice_Na = second-die trajectory), played on the rAF clock with
   * an ease-out time curve, a landing bounce, then hold + fade like the original (hold to tick 40, fade to tick 80).
   */
  renderDice(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const d = this.diceAnim!;
    const two = d.d2 > 0;
    const s = Math.max(0.7, Math.min(1.5, Math.min(w / 380, h / 400)));
    const cx = two ? 365 : 290, cy = two ? 380 : 365; // landing spot(s) of the original trajectories → screen centre
    const k = Math.min(1, d.t / DICE_LAND);
    const fi = Math.min(29, Math.floor(29 * (1 - Math.pow(1 - k, 1.6)) + 0.0001));
    const alpha = d.t < DICE_HOLD ? 1 : Math.max(0, 1 - (d.t - DICE_HOLD) / (DICE_END - DICE_HOLD));
    // landing bounce (two small hops with decaying height) + squash on contact
    let by = 0, sq = 1;
    if (d.t > DICE_LAND) {
      const b = (d.t - DICE_LAND) / 420;
      if (b < 1) { by = -Math.abs(Math.sin(b * Math.PI * 2)) * 16 * (1 - b) * (1 - b); sq = 1 - 0.08 * Math.max(0, Math.cos(b * Math.PI * 4)) * (1 - b); }
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(w / 2, h / 2); ctx.scale(s, s * sq); ctx.translate(-cx, -cy + by);
    // soft contact shadows under the landing spots
    if (d.t > DICE_LAND * 0.75) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(286, 410, 34, 10, 0, 0, Math.PI * 2); ctx.fill();
      if (two) { ctx.beginPath(); ctx.ellipse(443, 440, 36, 11, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    drawFrame(ctx, `dice/dice_${d.d1}`, fi, 0, 0, 1);
    if (two) drawFrame(ctx, `dice/dice_${d.d2}a`, fi, 0, 0, 1);
    ctx.restore();
    if (d.t > DICE_LAND) {
      const kk = Math.min(1, (d.t - DICE_LAND) / 260);
      const total = d.d1 + d.d2;
      const label = two ? `${d.d1} + ${d.d2} = ${total}` : String(total);
      ctx.save(); ctx.globalAlpha = alpha;
      text(ctx, label, w / 2, h / 2 + (two ? 140 : 120) * s, { size: (two ? 40 : 56) * s * (0.5 + 0.5 * ease.outBack(kk)), align: 'center', color: '#ffe36a', stroke: '#5a1d00', strokeWidth: 8 });
      ctx.restore();
    }
  }

  renderSeason(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const a = this.seasonAnim!; const sh = `season/season0${a.s + 1}`;
    const n = sheet(sh)?.f.length ?? 7;
    const k = a.t < 300 ? a.t / 300 : a.t > 2200 ? (2600 - a.t) / 400 : 1;
    dim(ctx, w, h, 0.35 * k);
    const st = stage(w, h, 640, 480); applyStage(ctx, st);
    ctx.globalAlpha = k;
    const fi = Math.min(n - 1, Math.floor(a.t / 160));
    drawFrame(ctx, sh, 0, 320, 240, 1);
    if (fi > 0) drawFrame(ctx, sh, fi, 320, 240, 1);
    ctx.globalAlpha = 1;
    resetT(ctx);
    text(ctx, `${SEASONS[a.s]}季`, w / 2, h * 0.86, { size: 40 * this.uis, align: 'center', color: '#fff', stroke: '#6a2a00', strokeWidth: 7 });
  }

  renderDialog(ctx: CanvasRenderingContext2D, w: number, h: number, d: Dlg) {
    const u = Math.max(0.75, Math.min(1.3, Math.min(w / 700, h / 560)));
    if (!d.passive) { dim(ctx, w, h, 0.35); app.block(); }
    const k = Math.min(1, d.t / 160);
    if (d.style === 'card' && d.cardId) { this.renderCardCast(ctx, w, h, d); return; }
    if (d.kind === 'cards') { this.renderCardSelect(ctx, w, h, d); return; }
    ctx.save();
    const sc = (d.passive ? 0.82 : 0.9) + 0.1 * k; ctx.globalAlpha = k * (d.passive && d.auto ? Math.min(1, (d.auto.ms * speedMul.v - d.t) / 250) : 1);
    ctx.translate(w / 2, h / 2); ctx.scale(sc, sc); ctx.translate(-w / 2, -h / 2);
    if (d.style === 'chance' && d.image) { this.renderChance(ctx, w, h, d, u); ctx.restore(); return; }
    const hasImg = !!d.image;
    const pw = Math.min(w - 20, (hasImg ? 600 : 470) * u);
    const imgS = hasImg ? Math.min(180 * u, pw * 0.36) : 0;
    const textW = pw - 60 * u - (hasImg ? imgS + 20 * u : 0);
    const size = 18 * u;
    const lines = d.text ? wrap(ctx, d.text, textW, size) : [];
    let btnRows = 1, bh = 50 * u;
    const isList = d.kind === 'choose' || d.kind === 'players';
    if (d.kind === 'choose') { btnRows = d.buttons.length; bh = 50 * u; }
    if (d.kind === 'players') btnRows = Math.ceil(d.buttons.length / 2);
    const textH = Math.max(lines.length * size * 1.45, hasImg ? imgS : 0);
    let ph = 60 * u + textH + 24 * u + btnRows * (bh + 10 * u) + 10 * u;
    ph = Math.min(h - 16, ph);
    const r = { x: (w - pw) / 2, y: (h - ph) / 2, w: pw, h: ph };
    panel(ctx, r, { title: d.title ?? (d.kind === 'confirm' ? '請選擇' : '訊息') });
    let y = r.y + 40 * u;
    if (hasImg) {
      const im = image(d.image!);
      const ix = r.x + 26 * u, iy = y;
      ctx.fillStyle = '#7a4a10'; ctx.fillRect(ix - 4, iy - 4, imgS + 8, imgS + 8);
      if (im) ctx.drawImage(im, ix, iy, imgS, imgS); else { ctx.fillStyle = '#ddd'; ctx.fillRect(ix, iy, imgS, imgS); }
    }
    if (d.badge === 'gameover') drawFrame(ctx, 'interface/gameover', 0, r.x + pw - 80 * u, r.y + 70 * u, 0.5 * u);
    const tx = r.x + 30 * u + (hasImg ? imgS + 20 * u : 0);
    lines.forEach((l, i) => text(ctx, l, hasImg ? tx : r.x + pw / 2, y + size + i * size * 1.45, { size, color: '#4a2a00', align: hasImg ? 'left' : 'center' }));
    y += textH + 20 * u;
    const aiPick = d.auto ? d.auto.value : undefined;
    if (d.kind === 'choose') {
      d.buttons.forEach((b, i) => {
        const br = { x: r.x + 30 * u, y: y + i * (bh + 10 * u), w: pw - 60 * u, h: bh };
        const label = b.sub ? `${b.label}　${b.sub}` : b.label;
        button(ctx, 'dlg' + i, br, label, () => d.resolve(b.value), { primary: b.primary && b.value !== -1, disabled: b.disabled || !!d.auto, selected: d.auto && aiPick === b.value && d.t > 500, size: 16 * u });
      });
    } else if (d.kind === 'players') {
      const cols = 2, bw2 = (pw - 70 * u) / cols;
      d.buttons.forEach((b, i) => {
        const br = { x: r.x + 30 * u + (i % cols) * (bw2 + 10 * u), y: y + Math.floor(i / cols) * (bh + 10 * u), w: bw2, h: bh };
        button(ctx, 'dlg' + i, br, b.label, () => d.resolve(b.value), { primary: b.value !== -1, disabled: !!d.auto, selected: d.auto && aiPick === b.value && d.t > 500, size: 17 * u });
        if (b.value >= 0) { const c = PLAYER_COLORS[b.value]; ctx.fillStyle = c; ctx.fillRect(br.x + 8, br.y + 8, 8, br.h - 16); }
      });
    } else if (d.kind === 'steps') {
      const n = 6, bw2 = Math.min(64 * u, (pw - 60 * u - 50 * u) / n);
      d.buttons.forEach((b, i) => {
        const br = { x: r.x + pw / 2 - (n * (bw2 + 8 * u)) / 2 + i * (bw2 + 8 * u), y, w: bw2, h: bw2 };
        const st = d.auto ? (aiPick === b.value && d.t > 500 ? 2 : 0) : app.state('stp' + i);
        drawFrameFit(ctx, 'interface/step', 1 + i * 3 + st, br.x, br.y, br.w, br.h);
        if (!d.auto) app.hit('stp' + i, br, () => d.resolve(b.value));
      });
    } else {
      const nb = d.buttons.length; const bw2 = Math.min(150 * u, (pw - 60 * u - (nb - 1) * 14 * u) / nb);
      d.buttons.forEach((b, i) => {
        const br = { x: r.x + pw / 2 - (nb * bw2 + (nb - 1) * 14 * u) / 2 + i * (bw2 + 14 * u), y: r.y + ph - bh - 26 * u, w: bw2, h: bh };
        button(ctx, 'dlg' + i, br, b.label, () => d.resolve(b.value), { primary: b.primary, selected: d.auto && d.kind === 'confirm' && aiPick === b.value && d.t > 500, size: 18 * u });
      });
      if (d.auto && d.kind === 'msg') { // progress bar for auto close
        const kk = Math.min(1, d.t / (d.auto.ms * speedMul.v));
        ctx.fillStyle = 'rgba(160,90,20,0.5)'; ctx.fillRect(r.x + 20 * u, r.y + ph - 16 * u, (pw - 40 * u) * kk, 3 * u);
      }
    }
    void isList;
    ctx.restore();
  }

  /**
   * Chance card on the original chance.spr frame (262x393, hotspot 129,193). Measured from the sprite:
   * picture window x25–224 / y14–213 (200x200 art), ruled lines at y = 225, 246, 266, 287, 308, 330, 353, x ≈ 12–240.
   * Title sits on the first ruled row, the description on the following rows.
   */
  renderChance(ctx: CanvasRenderingContext2D, w: number, h: number, d: Dlg, u: number) {
    const sc = Math.min((h - 24) / 393, (w - 16) / 262, 1.9 * u);
    const cx = w / 2, cy = h / 2;
    drawFrame(ctx, 'interface/chance', 0, cx, cy, sc);
    const fx = cx - 129 * sc, fy = cy - 193 * sc; // frame origin
    const im = image(d.image!);
    if (im) ctx.drawImage(im, fx + 25 * sc, fy + 14 * sc, 200 * sc, 200 * sc);
    const L = [225, 246, 266, 287, 308, 330, 353];
    text(ctx, d.title ?? '', fx + 126 * sc, fy + (L[1] - 4.5) * sc, { size: 16 * sc, align: 'center', color: '#8a1a00', maxWidth: 220 * sc });
    // description: largest font (≤13) whose wrapped lines fit the 5 remaining rows
    const body = d.text ?? ''; let size = 13, lines: string[] = [];
    for (; size >= 9; size -= 0.5) { lines = wrap(ctx, body, 222 * sc, size * sc); if (lines.length <= 5) break; }
    lines.slice(0, 5).forEach((l, i) => text(ctx, l, fx + 126 * sc, fy + (L[i + 2] - 4.5) * sc, { size: size * sc, align: 'center', color: '#3a1a00' }));
    const fr = { x: fx, y: fy, w: 262 * sc, h: 393 * sc };
    if (!d.passive) app.hit('chanceok', fr, () => d.resolve(undefined));
    if (d.auto) { const kk = Math.min(1, d.t / (d.auto.ms * speedMul.v)); ctx.fillStyle = 'rgba(120,40,0,0.6)'; ctx.fillRect(fx + 20 * sc, fy + 382 * sc, 222 * sc * kk, 3 * sc); }
    else text(ctx, '點擊繼續', cx, fy + 386 * sc, { size: 11 * sc, align: 'center', color: '#fff', stroke: '#5a1d00', strokeWidth: 3 });
  }

  /**
   * 四字真言 cast popup on the original card.spr frame (frame 0: 481x281 drawn at anchor+(7,8)).
   * Measured from the sprite: picture window = red rect x16–266 / y8–258 (248x248 art inside at 17,9);
   * text panel ruled lines at y = 35, 55, 75, 95, 115 between red margins x = 302…453;
   * O / X buttons (frames 4–6 / 1–3) at anchor (386,258) / (362,258) in the gap of the bottom ornament.
   */
  renderCardCast(ctx: CanvasRenderingContext2D, w: number, h: number, d: Dlg) {
    const card = D.words[d.cardId! - 1];
    const capSize = Math.max(13, Math.min(22, w / 40));
    const capH = d.caption ? capSize * 2.4 : 0;
    const sc = Math.min((w - 16) / 488, (h - 16 - capH) / 290, 2.2);
    const k = Math.min(1, d.t / 280);
    const pop = 0.85 + 0.15 * ease.outBack(k);
    const W = 481 * sc, H = 281 * sc;
    // anchor so that the frame (at +7,+8) is centred in the space below the caption
    const fx = Math.round(w / 2 - W / 2), fy = Math.round(capH + (h - capH - H) / 2);
    const ax = fx - 7 * sc, ay = fy - 8 * sc;
    ctx.save(); ctx.globalAlpha = k;
    ctx.translate(w / 2, fy + H / 2); ctx.scale(pop, pop); ctx.translate(-w / 2, -(fy + H / 2));
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(fx + 6 * sc, fy + 8 * sc, W, H);
    drawFrame(ctx, 'interface/card', 0, ax, ay, sc);
    const im = image('images/cards/' + card.jpg);
    if (im) ctx.drawImage(im, fx + 17 * sc, fy + 9 * sc, 248 * sc, 248 * sc);
    const midX = fx + 377.5 * sc, colW = 145 * sc;
    text(ctx, card.title, midX, fy + 31 * sc, { size: 17 * sc, align: 'center', color: '#8a1a00', maxWidth: colW });
    const rows = [55, 75, 95, 115];
    let size = 13.5, lines: string[] = [];
    for (; size >= 9; size -= 0.5) { lines = wrap(ctx, d.text ?? card.text, colW, size * sc); if (lines.length <= rows.length) break; }
    lines.slice(0, rows.length).forEach((l, i) => text(ctx, l, fx + 305 * sc, fy + (rows[i] - 4) * sc, { size: size * sc, color: '#3a1a00' }));
    // O (confirm) button in the bottom ornament gap
    const st = app.state('cardok');
    drawFrame(ctx, 'interface/card', 4 + st, ax, ay, sc);
    ctx.restore();
    if (d.caption) {
      const cy = fy - capH / 2 + capSize * 0.35;
      const tw = Math.min(w - 12, W);
      const gr = ctx.createLinearGradient(w / 2 - tw / 2, 0, w / 2 + tw / 2, 0);
      gr.addColorStop(0, 'rgba(90,10,0,0)'); gr.addColorStop(0.15, 'rgba(120,20,0,0.85)'); gr.addColorStop(0.85, 'rgba(120,20,0,0.85)'); gr.addColorStop(1, 'rgba(90,10,0,0)');
      ctx.globalAlpha = k; ctx.fillStyle = gr; ctx.fillRect(w / 2 - tw / 2, cy - capSize * 1.15, tw, capSize * 1.6); ctx.globalAlpha = 1;
      text(ctx, d.caption, w / 2, cy, { size: capSize, align: 'center', color: '#ffe36a', stroke: '#3a0a00', strokeWidth: 4, maxWidth: w - 24 });
    }
    if (!d.passive) {
      app.hit('cardok', frameRect('interface/card', 4, ax, ay, sc), () => d.resolve(undefined));
      app.hit('cardany', { x: fx, y: fy, w: W, h: H }, () => { if (d.t > 400) d.resolve(undefined); }, false);
    }
  }

  renderOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const close = () => { this.overlay = 'none'; };
    const u = Math.max(0.8, Math.min(1.2, Math.min(w / 700, h / 560)));
    if (this.overlay === 'system' || this.overlay === 'options') this.renderSystemWin(ctx, w, h);
    else if (this.overlay === 'save') drawSlots(ctx, w, h, 'save', slot => { saveSlot(slot, this.g); this.overlay = 'none'; this.ui.banner('已儲存至記錄 ' + slot, '#9fe8ff'); }, close);
    else if (this.overlay === 'load') drawSlots(ctx, w, h, 'load', slot => { const d = loadSlot(slot); if (d) { this.engine.stopped = true; go('game', { load: d.g }); } }, close);
    else if (this.overlay === 'quitConfirm') {
      dim(ctx, w, h, 0.5); app.block({ x: 0, y: 0, w, h });
      const pw = Math.min(420, w - 20), ph = 200; const r = { x: (w - pw) / 2, y: (h - ph) / 2, w: pw, h: ph };
      panel(ctx, r, { title: '返回主選單' });
      text(ctx, D.main.Misc?.ExitGame ?? '你真的想結束遊戲嗎？', w / 2, r.y + 80, { size: 19, align: 'center', color: '#4a2a00' });
      text(ctx, '（每回合開始時會自動存檔）', w / 2, r.y + 106, { size: 13, align: 'center', color: '#7a5a20', weight: 'normal' });
      button(ctx, 'q-y', { x: w / 2 - 130, y: r.y + 125, w: 120, h: 48 }, '是', () => { this.engine.stopped = true; go('mainmenu'); }, { primary: true });
      button(ctx, 'q-n', { x: w / 2 + 10, y: r.y + 125, w: 120, h: 48 }, '否', close);
    } else if (this.overlay === 'detail') this.renderDetailWin(ctx, w, h);
    void u;
  }

  // ================================================================== original-style windows (round 3)
  /**
   * 系統 window — interface/system.spr, exe dialog @0x40dd60: anchored bottom-left at (10, H-300), fades in
   * (alpha += 0x20/tick). Widgets (normal/hover/press frames) from the table @0x442320:
   * 1-3 close · 4-6 options (@0x404be0) · 7-9 exit game (Misc/ExitGame box) · 10-12 save · 13-15 load (@0x40a6b0).
   */
  renderSystemWin(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const S = sysScale(w, h);
    const W: Win = { sc: S, ax: 10 * S, ay: Math.max(4, h - 300 * S) };
    app.block({ x: 0, y: 0, w, h });
    const active = this.overlay === 'system';
    winBegin(ctx, W, active ? Math.min(1, this.ovT / 250) : 1);
    drawFrame(ctx, 'interface/system', 0, 0, 0);
    const canSave = !!this.turnMenuRes;
    const items: [string, [number, number, number], () => void, string, boolean?][] = [
      ['sy-x', [1, 2, 3], () => { this.overlay = 'none'; }, '關閉'],
      ['sy-opt', [4, 5, 6], () => this.openOptions(), '系統設定'],
      ['sy-exit', [7, 8, 9], () => { this.overlay = 'quitConfirm'; }, '結束遊戲'],
      ['sy-save', [10, 11, 12], () => { this.overlay = 'save'; }, canSave ? '儲存進度' : '儲存進度（輪到玩家時）', !canSave],
      ['sy-load', [13, 14, 15], () => { this.overlay = 'load'; }, '載入進度'],
    ];
    let tip: { t: string; r: { x: number; y: number; w: number; h: number } } | null = null;
    for (const [id, fr, cb, label, dis] of items) {
      if (!active) { drawFrame(ctx, 'interface/system', fr[0], 0, 0); continue; }
      const r = wbtn(ctx, W, id, 'interface/system', fr, cb, { disabled: dis });
      if (app.isHover(id) || (dis && app.isHover('sy-dis-' + id))) tip = { t: label, r };
      if (dis) app.hit('sy-dis-' + id, r, () => {}, false);
    }
    winEnd(ctx);
    // unobtrusive hover caption (the original icons carry no text)
    if (tip) {
      const fs = Math.max(12, 13 * S);
      ctx.font = `bold ${fs}px ${'sans-serif'}`;
      text(ctx, tip.t, tip.r.x + tip.r.w / 2, tip.r.y - 4, { size: fs, align: 'center', color: '#fff', stroke: '#5a2a00', strokeWidth: 4 });
    }
    if (this.overlay === 'options') this.renderOptionWin(ctx, w, h, S, W.ay);
  }

  openOptions() {
    const cur = { q: settings.quality, spd: settings.speed, sfx: Math.round(settings.sfx * 3), mus: Math.round(settings.music * 3), voice: settings.voice };
    this.opt = { ...cur, orig: { ...cur } };
    this.overlay = 'options';
  }
  /** apply the edited values live (so volume / speed / 畫質 can be heard and seen); X restores the snapshot */
  private applyOpt() {
    const o = this.opt!;
    settings.speed = o.spd as 0 | 1 | 2; setSpeedIndex(o.spd);
    settings.sfx = o.sfx / 3; settings.music = o.mus / 3;
    // the original has a single 音效 level for effects + voices; keep the separate voice volume in step with it
    settings.voice = o.sfx === o.orig.sfx ? o.orig.voice : o.sfx / 3;
    applyVolumes();
    if (settings.quality !== o.q) { settings.quality = o.q as 0 | 1 | 2; void setQuality(o.q); }
  }
  closeOptions(ok: boolean) {
    if (this.opt && !ok) { const keep = this.opt.orig; this.opt = { ...keep, orig: keep }; this.applyOpt(); }
    saveSettings();
    this.opt = null; this.overlay = 'system';
  }
  /**
   * 設定 window — interface/option.spr, exe dialog @0x404c60 / paint @0x405250: slides in from x = -width to x = 140
   * beside the system window (y = H-300). Rows (widget frames normal/hover from @0x441608): 14/13, 16/15, 18/17, 20/19;
   * labels at (30,33) (30,73) (70,113) (70,153); rows 0-1 value text centred at x=176, rows 2-3 level bars frames 7-9 /
   * 10-12; X = frames 1-3, O = frames 4-6. Row 0 was 螢幕區域 (edge-scroll area, meaningless in a browser) and now
   * holds 畫質 (自動/標準/高清) with the same three-value box.
   */
  renderOptionWin(ctx: CanvasRenderingContext2D, w: number, h: number, S: number, ay: number) {
    if (!this.opt) this.openOptions();
    const o = this.opt!;
    const k = ease.outCubic(Math.min(1, this.ovT / 320));
    const W: Win = { sc: S, ax: (-251 + (140 + 251) * k) * S, ay };
    winBegin(ctx, W);
    drawFrame(ctx, 'interface/option', 0, 0, 0);
    const T = D.main['Option-Title'] ?? {};
    const sp = D.main['Option-Speed'] ?? { 0: '慢速', 1: '正常速度', 2: '快速' };
    const ql = ['自動', '標準', '高清'];
    const lab = { size: 14, color: '#fff', baseline: 'top' as CanvasTextBaseline, stroke: 'rgba(0,40,90,0.55)', strokeWidth: 3 };
    const rows: [string, [number, number, number], () => void][] = [
      ['op-q', [14, 13, 13], () => { o.q = (o.q + 1) % 3; if (o.q === 2 && !hdAvailable()) o.q = 0; this.applyOpt(); }],
      ['op-spd', [16, 15, 15], () => { o.spd = (o.spd + 1) % 3; this.applyOpt(); }],
      ['op-sfx', [18, 17, 17], () => { o.sfx = (o.sfx + 1) % 4; this.applyOpt(); }],
      ['op-mus', [20, 19, 19], () => { o.mus = (o.mus + 1) % 4; this.applyOpt(); }],
    ];
    rows.forEach(([id, fr, cb], i) => {
      wbtn(ctx, W, id, 'interface/option', fr, cb, { sound: 'option/button' });
      if (i === 0) {
        text(ctx, '畫質', 30, 33, lab);
        text(ctx, ql[o.q] + (o.q === 0 ? (hdActive() ? '·高清' : '·標準') : ''), 176, 33, { ...lab, align: 'center' });
      } else if (i === 1) {
        text(ctx, T['1'] ?? '遊戲速度', 30, 73, lab);
        text(ctx, sp[o.spd], 176, 73, { ...lab, align: 'center' });
      } else if (i === 2) {
        text(ctx, T['2'] ?? '音效', 70, 113, lab);
        if (o.sfx > 0) drawFrame(ctx, 'interface/option', 6 + o.sfx, 0, 0);
      } else {
        text(ctx, T['3'] ?? '音樂', 70, 153, lab);
        if (o.mus > 0) drawFrame(ctx, 'interface/option', 9 + o.mus, 0, 0);
      }
    });
    wbtn(ctx, W, 'op-x', 'interface/option', [1, 2, 3], () => this.closeOptions(false));
    wbtn(ctx, W, 'op-o', 'interface/option', [4, 5, 6], () => this.closeOptions(true));
    winEnd(ctx);
  }

  /**
   * 角色資產 window — interface/detailinfo.spr, exe dialog @0x407d70 / paint @0x4081b0. Anchor = ((W-487)/2+10,
   * (H-261)/2-40). Left tabs: each living player's face (frame 0 = selected, 1 = others) at (53, 38/98/159/220).
   * Selected player: 屋企 money "%d" at (170,40), cash at (345,40), net worth (orange 255,135,0) at (170,80);
   * building table: 樓1 / 商業1 / 食市1 frame 0 at (170+120k, 160) scaled 2/3, rows "L%d." at (107, 184+20r),
   * counts at x = 140 / 260 / 380. Close = frames 1-3. (Added: 四字真言 count at (345,80), an empty spot.)
   */
  renderDetailWin(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const g = this.g;
    dim(ctx, w, h, 0.25 * Math.min(1, this.ovT / 250)); app.block({ x: 0, y: 0, w, h });
    const W = centredWin(w, h, 487, 261, [3, 7]);
    winBegin(ctx, W, Math.min(1, this.ovT / 250));
    drawFrame(ctx, 'interface/detailinfo', 0, 0, 0);
    const alive = g.players.filter(p => p.alive);
    if (!g.players[this.detailSeat]?.alive && alive.length) this.detailSeat = alive[0].seat;
    const TABY = [38, 98, 159, 220];
    alive.slice(0, 4).forEach((p, k) => {
      const nm = 'interface/face0' + p.char;
      drawFrame(ctx, nm, p.seat === this.detailSeat ? 0 : 1, 53, TABY[k]);
      // player colour pip (the original identified players by face only; colours are this remake's markers)
      ctx.fillStyle = PLAYER_COLORS[p.seat]; ctx.fillRect(22, TABY[k] - 8 + 14, 4, 26);
      app.hit('di-tab' + k, wr(W, frameRect(nm, 0, 53, TABY[k])), () => { this.detailSeat = p.seat; void sfx('interface/click'); });
    });
    wbtn(ctx, W, 'di-x', 'interface/detailinfo', [1, 2, 3], () => { this.overlay = 'none'; });
    const p = g.players[this.detailSeat];
    const o = { size: 14, color: '#fff', baseline: 'top' as CanvasTextBaseline };
    text(ctx, String(Math.round(p.home)), 170, 40, o);
    text(ctx, String(Math.round(p.cash)), 345, 40, o);
    text(ctx, String(Math.round(netWorth(g, this.board, p))), 170, 80, { ...o, color: 'rgb(255,135,0)' });
    text(ctx, `四字真言 ${p.cards.length}`, 345, 80, { ...o, size: 13, color: '#cfe8ff' });
    text(ctx, charName(p.char), 456, 24, { ...o, size: 12, align: 'right', color: 'rgba(255,255,255,0.8)' });
    const pre = this.board.key === 'ancient' ? 'map/a_' : 'map/';
    [pre + 'house1', pre + 'commcal1', pre + 'eating1'].forEach((nm, k) => drawFrame(ctx, nm, 0, 170 + 120 * k, 160, 2 / 3));
    const cnt = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (const i of ownedPlots(g, p)) {
      const ps = g.plots[i]!; const col = ps.type === 1 ? 1 : ps.type === 2 ? 2 : 0;
      cnt[Math.min(2, ps.level)][col]++;
    }
    for (let r = 0; r < 3; r++) {
      text(ctx, `L${r + 1}.`, 107, 184 + 20 * r, o);
      [140, 260, 380].forEach((x, c) => text(ctx, String(cnt[r][c]), x, 184 + 20 * r, o));
    }
    winEnd(ctx);
  }

  /** hand grouped by card (first-seen order) → one row per card with a count */
  cardEntries(d: Dlg) {
    const m = new Map<number, { id: number; n: number; disabled: boolean }>();
    for (const b of d.buttons) { if (b.value === null) continue; const e = m.get(b.value); if (e) e.n++; else m.set(b.value, { id: b.value, n: 1, disabled: !!b.disabled }); }
    return [...m.values()];
  }
  fixCardScroll(d: Dlg, n: number) {
    const sel = d.sel ?? 0; let sc = d.scroll ?? 0;
    if (sel < sc) sc = sel; if (sel >= sc + 5) sc = sel - 4;
    d.scroll = Math.max(0, Math.min(Math.max(0, n - 5), sc));
  }
  /**
   * 選擇四字真言 window — interface/card.spr, exe dialog @0x40cb10 / paint @0x40d050. Anchor = ((W-481)/2+10,
   * (H-281)/2-40). Picture of the selected card at (24,18); its description (black, 181 px wide) at (293,155);
   * the hand list: 5 rows at y = 30 + 20i centred on x = 383, the selected row on a translucent black band
   * x 309–459 with white text (grey when the card can't be used now). Widgets @0x442220: 1-3 X (cancel),
   * 4-6 O (use), 7-9 / 10-12 the scroll strips above / below the list.
   */
  renderCardSelect(ctx: CanvasRenderingContext2D, w: number, h: number, d: Dlg) {
    const list = this.cardEntries(d);
    if (!list.length) { d.resolve(null); return; }
    d.sel = Math.max(0, Math.min(list.length - 1, d.sel ?? 0)); this.fixCardScroll(d, list.length);
    const W = centredWin(w, h, 481, 281, [7, 8]);
    winBegin(ctx, W, Math.min(1, d.t / 250));
    drawFrame(ctx, 'interface/card', 0, 0, 0);
    const cur = list[d.sel]; const card = D.words[cur.id - 1];
    const im = image('images/cards/' + card.jpg);
    if (im) ctx.drawImage(im, 24, 18, 248, 248);
    // description: largest size ≤14 that fits the panel below the list
    let size = 14, lines: string[] = [];
    for (; size >= 10; size -= 0.5) { lines = wrap(ctx, card.text, 181, size, 'normal'); if (lines.length * size * 1.3 <= 118) break; }
    lines.forEach((l, i) => text(ctx, l, 293, 155 + i * size * 1.3, { size, color: '#000', baseline: 'top', weight: 'normal' }));
    const sc = d.scroll ?? 0;
    for (let i = 0; i < 5; i++) {
      const idx = sc + i; const e = list[idx]; if (!e) break;
      const y = 30 + 20 * i; const sel = idx === d.sel;
      if (sel) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(309, y, 150, 20); }
      const label = D.words[e.id - 1].title + (e.n > 1 ? ` ×${e.n}` : '');
      text(ctx, label, 383, y + 2, { size: 15, align: 'center', baseline: 'top', color: e.disabled ? '#808080' : sel ? '#fff' : '#000' });
      app.hit('cs-row' + i, wr(W, { x: 309, y, w: 150, h: 20 }), () => {
        if (d.sel === idx && !e.disabled) { d.resolve(e.id); return; } // second tap on the highlighted card = use
        d.sel = idx; void sfx('interface/sfx042');
      });
    }
    wbtn(ctx, W, 'cs-up', 'interface/card', [7, 8, 9], () => { d.sel = Math.max(0, d.sel! - 1); this.fixCardScroll(d, list.length); }, { disabled: d.sel === 0, sound: 'interface/sfx042' });
    wbtn(ctx, W, 'cs-dn', 'interface/card', [10, 11, 12], () => { d.sel = Math.min(list.length - 1, d.sel! + 1); this.fixCardScroll(d, list.length); }, { disabled: d.sel >= list.length - 1, sound: 'interface/sfx042' });
    wbtn(ctx, W, 'cs-x', 'interface/card', [1, 2, 3], () => d.resolve(null), { sound: 'interface/sfx040' });
    wbtn(ctx, W, 'cs-o', 'interface/card', [4, 5, 6], () => d.resolve(cur.id), { disabled: cur.disabled });
    // scroll position hint when the hand is longer than the 5 visible rows
    if (list.length > 5) text(ctx, `${d.sel + 1}/${list.length}`, 455, 136, { size: 10, align: 'right', baseline: 'bottom', color: '#8a1a00', weight: 'normal' });
    winEnd(ctx);
  }

  renderWinner(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const W = this.winnerInfo!; const p = this.g.players[W.seat];
    dim(ctx, w, h, Math.min(0.75, W.t / 800));
    app.block({ x: 0, y: 0, w, h });
    const st = stage(w, h, 800, 600); applyStage(ctx, st);
    const k = Math.min(1, W.t / 600);
    const fr = Math.min(frameCount('winner/winner') - 1, Math.floor(W.t / 70)); // drop-in animation, then hold
    drawFrame(ctx, 'winner/winner', fr, 400, 195, 1); // final frame centre sits 100px above the anchor
    const sc = 0.4 + 0.6 * (k < 1 ? 1 - Math.pow(1 - k, 3) : 1);
    drawFrame(ctx, `winner/character0${p.char}`, 0, 400, 180 + (1 - sc) * 90, sc * 1.0);
    text(ctx, `${charName(p.char)} 勝出！`, 400, 405, { size: 34, align: 'center', color: '#ffe36a', stroke: '#5a1d00', strokeWidth: 7 });
    W.rank.forEach((s, i) => {
      const q = this.g.players[s];
      text(ctx, `${i + 1}. ${charName(q.char)}  ${q.alive ? fmtMoney(netWorth(this.g, this.board, q)) : '破產'}`, 400, 440 + i * 26, { size: 18, align: 'center', color: i === 0 ? '#fff' : '#ddd', stroke: '#000', strokeWidth: 4 });
    });
    resetT(ctx);
    if (W.t > 1200) button(ctx, 'winok', { x: w / 2 - 90, y: h - 70, w: 180, h: 52 }, '返回主選單', () => { W.res(); }, { primary: true });
  }
}
void tween; void wait; void sr; void Board;
