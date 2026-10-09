import { app, type Scene, type PtrEvent, wait, tween, ease, TURBO, AUTO, speedMul } from '../core/app';
import { drawFrame, drawFrameFit, sheet, image, loadSheets, frameRect, frameCount, preloadImage } from '../core/assets';
import { music, sfx, voice, preloadAudio } from '../core/audio';
import { text, textBlock, wrap, fmtMoney, roundRect } from '../core/text';
import { button, panel, dim, stage, applyStage, resetT, sr } from '../ui/widgets';
import { Board } from '../game/board';
import { MapView } from '../game/view';
import { Engine, type GameUI, type ChoiceOpt, type UIOpts, type TurnAction, type ToastOpts } from '../game/engine';
import { newGame, saveSlot, loadSlot, type GameState, type Player } from '../game/state';
import { RULES, MAPS, PLAYER_COLORS, PLAYER_COLORS_DARK, SEASONS, SFX, plotTypeName, PLOT } from '../game/config';
import { D, charName, msg } from '../game/data';
import { netWorth, ownedPlots, season, yearOf, plotValue } from '../game/rules';
import { setup } from './setup';
import { LoadSaveWin, drawMsgBox } from '../ui/origdlg';
import { winBegin, winEnd, wbtn, wr, centredWin, sysScale, type Win } from '../ui/origwin';
import { settings, saveSettings, applyVolumes, toggleFullscreen, isFullscreen } from '../core/audio';
import { setQuality, hdActive, hdAvailable } from '../core/assets';
import { setSpeedIndex } from '../core/app';
import { startMiniGame } from '../mini/host';
import type { Runner } from '../mini/core';

let go: (name: string, arg?: any) => void = () => {};

/** interface sheets the game scene needs before its first frame */
export const GAME_UI_SHEETS = ['interface/chance', 'interface/card', 'interface/step', 'interface/messagebox', 'interface/smessagebox', 'interface/gameover', 'interface/luckydraw',
  'interface/face01', 'interface/face02', 'interface/face03', 'interface/face04', 'interface/face05', 'interface/face06',
  ...[1, 2, 3, 4, 5, 6].flatMap(i => [`dice/dice_${i}`, `dice/dice_${i}a`]), 'interface/walk', 'interface/game_menu', 'misc/balloon',
  'interface/detailinfo', 'interface/system', 'interface/option', 'interface/info', 'interface/round', 'interface/loadsave',
  'interface/calculater', 'interface/calcnumber1', 'interface/calcnumber2', 'interface/home'];
/** Warm the caches while the player is still on the select screens so 開始遊戲 is (near) instant. */
export function prewarmGame(mapIdx: number, chars: number[]) {
  void loadSheets(GAME_UI_SHEETS);
  void MapView.prefetch(MAPS[mapIdx].key, chars);
}
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
/** Original calculater UI for 屋企存/取 */
interface HomeBankDlg {
  mode: 'in' | 'out'; amount: number; cash: number; home: number; t: number;
  resolve: (v: { mode: 'in' | 'out'; amount: number } | null) => void;
}

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
  /** Testing-only translucent Debug panel (BR, left of 全螢幕). */
  debugOn = false;
  debugPanel = false;
  dbgD1 = 6; dbgD2 = 0; // 0 = one die
  dbgTile = 0;
  /** Armed map-click teleport (Debug 傳送). */
  dbgTpArmed = false;
  homeBankDlg: HomeBankDlg | null = null;
  /** original console command ShowDetailInfo: extra lines under each HUD panel (key I) */
  showDetail = false;
  private optRaw: { quality: 0 | 1 | 2; speed: 0 | 1 | 2; sfx: number; music: number; voice: number; fullscreen: boolean } | null = null;
  /** original save/load carousel while overlay is 'save' / 'load' */
  lsWin: LoadSaveWin | null = null;
  /** time since the overlay last changed (window fade / slide-in like the original's alpha += 0x20 per tick) */
  ovT = 0; private ovPrev = 'none';
  /** original option window: values being edited + snapshot for X (cancel) */
  opt: { q: number; spd: number; sfx: number; mus: number; voice: number; fs: boolean; orig: { q: number; spd: number; sfx: number; mus: number; voice: number; fs: boolean } } | null = null;

  /** last frame of the previous screen (the original loading dialog @0x401d10 darkens what was on screen) */
  private snap: HTMLCanvasElement | null = null;
  /** active mini-game (takes over update / render / input while running) */
  mini: Runner | null = null;
  constructor(private arg: { new?: boolean; load?: GameState }) {
    try {
      const c = app.canvas; if (c && c.width > 0) { const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; k.getContext('2d')!.drawImage(c, 0, 0); this.snap = k; }
    } catch { this.snap = null; }
  }

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
        loadSheets(GAME_UI_SHEETS),
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
      if (new URLSearchParams(location.search).has('debug')) { this.debugOn = true; this.debugPanel = true; }
      void this.engine.run().then(() => {
        if (this.engine.stopped) return;
        (window as any).__lfz.finished = true;
        if (!AUTO) go('mainmenu');
      }).catch(e => { console.error(e); (window as any).__lfz.error = String(e?.stack || e); });
    } catch (e) { console.error(e); this.loadingText = '載入失敗：' + e; }
  }
  exit() { this.mini?.abort(); this.mini = null; if (this.engine) this.engine.stopped = true; this.dlgs.forEach(d => d.resolve(d.buttons[0]?.value)); }

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
    homeBank: (cash, home) => {
      if (AUTO || TURBO) {
        // AI path never calls this; turbo humans auto-deposit half if possible
        if (cash > 0) return Promise.resolve({ mode: 'in' as const, amount: Math.floor(cash * 0.5) || cash });
        if (home > 0) return Promise.resolve({ mode: 'out' as const, amount: Math.floor(home * 0.5) || home });
        return Promise.resolve(null);
      }
      void loadSheets(['interface/calculater', 'interface/calcnumber1', 'interface/calcnumber2', 'interface/home']);
      return new Promise(res => {
        const mode: 'in' | 'out' = cash > 0 ? 'in' : 'out';
        const max = mode === 'in' ? cash : home;
        this.homeBankDlg = { mode, amount: Math.min(max, Math.floor(max * RULES.homeDepositPct / 100) || max), cash, home, t: 0,
          resolve: v => { this.homeBankDlg = null; res(v); } };
      });
    },
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
    minigame: (game, seats) => new Promise(res => {
      this.mini = startMiniGame(game, seats.map(seat => { const p = this.g.players[seat]; return { slot: seat, char: p.char, human: !p.ai && !AUTO }; }), false, r => {
        this.mini = null; (window as any).__lfz.minigames = ((window as any).__lfz.minigames ?? 0) + 1; (window as any).__lfz.lastMini = r; res(r);
      });
    }),
    winner: (seat, rank) => loadSheets(['winner/winner', `winner/character0${this.g.players[seat].char}`]).then(() => new Promise<void>(res => {
      music('winner.mp3', false);
      (window as any).__lfz.winner = { seat, char: this.g.players[seat].char, name: charName(this.g.players[seat].char), week: this.g.week, rank };
      this.winnerInfo = { seat, rank, t: 0, res: () => { this.winnerInfo = null; res(); } };
    })),
  };

  // ------------------------------------------------------------ update
  update(dt: number) {
    if (!this.ready) return;
    if (this.mini) { this.mini.update(dt); return; }
    this.view.update(dt);
    if (this.overlay !== this.ovPrev) { this.ovPrev = this.overlay; this.ovT = 0; if (this.overlay !== 'save' && this.overlay !== 'load') this.lsWin = null; }
    this.lsWin?.update(dt);
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
    if (this.homeBankDlg) this.homeBankDlg.t += dt;
  }

  // ------------------------------------------------------------ input
  onPointer(e: PtrEvent) {
    if (!this.ready) return;
    if (this.mini) { this.mini.pointer(e); return; }
    if (e.type === 'down') this.downPos = { x: e.x, y: e.y };
    this.view.onPointer(e);
    if (e.type === 'up' && this.downPos && Math.hypot(e.x - this.downPos.x, e.y - this.downPos.y) < 8) {
      const wpos = this.view.toWorld(e.x, e.y);
      if (this.dbgTpArmed && !this.homeBankDlg && !this.dlgs.length) {
        // Next map click completes armed Debug teleport
        let best = 0, bd = 1e9;
        this.board.tiles.forEach((tt, i) => { const d = Math.hypot(tt.x - wpos.x, (tt.y - wpos.y) * 2); if (d < bd) { bd = d; best = i; } });
        this.dbgTile = best;
        this.dbgTpArmed = false;
        void this.debugTeleportTo(best);
      } else {
        let best = -1, bd = 40;
        this.board.plots.forEach((pp, i) => { const d = Math.hypot(pp.x - wpos.x, (pp.y - wpos.y) * 2); if (d < bd) { bd = d; best = i; } });
        this.tooltip = best >= 0 ? { plot: best, t: 0 } : null;
      }
    }
    if (e.type === 'up') this.downPos = null;
  }
  onWheel(dx: number, dy: number) { if (this.mini) return; this.view.onWheel(dy); this.view.lastManualPan = app.time; }
  onKeyEv(e: KeyboardEvent, down: boolean) { return this.mini ? this.mini.keyEv(e, down) : false; }
  onKey(k: string) {
    if (this.mini) return;
    if (this.lsWin && (this.overlay === 'save' || this.overlay === 'load')) { this.lsWin.key(k); return; }
    if (this.overlay === 'quitConfirm') { if (k === 'Enter' || k === ' ') { this.engine.stopped = true; go('mainmenu'); } else if (k === 'Escape') this.overlay = 'none'; return; }
    if (this.homeBankDlg && k === 'Escape') { this.homeBankDlg.resolve(null); return; }
    if (this.dbgTpArmed && k === 'Escape') { this.dbgTpArmed = false; this.ui.toast('已取消傳送', { color: '#ffb347' }); return; }
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
    if (k === 'i' || k === 'I') this.showDetail = !this.showDetail;
    if (k === '+' || k === '=') this.view.userZoom = Math.min(3, this.view.userZoom * 1.15);
    if (k === '-') this.view.userZoom = Math.max(0.4, this.view.userZoom / 1.15);
  }

  // ------------------------------------------------------------ render
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!this.ready) { this.renderLoading(ctx, w, h); return; }
    if (this.mini) { this.mini.render(ctx, w, h); return; }
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
    if (this.homeBankDlg) this.renderHomeBank(ctx, w, h);
    this.renderOverlay(ctx, w, h);
    // 全螢幕 + Debug floating controls — drawn last so they sit above the 設定 modal block
    if (!this.winnerInfo) {
      this.drawFullscreenToggle(ctx, w, h, this.uis);
      this.drawDebugControls(ctx, w, h, this.uis);
    }
    if (this.winnerInfo) this.renderWinner(ctx, w, h);
  }

  /**
   * Original loading dialog (create @0x401d10 / paint @0x402260): the previous screen is kept and darkened with 50% black
   * (one 0x80-alpha black line per row), then misc/loading.spr frame <phase> ('LOADING', 'LOADING .', '..', '...') is
   * drawn at (50, H-70); the phase steps every 20 ticks while the loader runs its stages.
   */
  renderLoading(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    if (this.snap) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.snap, 0, 0); ctx.restore(); }
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, w, h);
    const S = sysScale(w, h);
    const phase = Math.floor(app.time / 333) % 4; // 20 ticks @ 60 fps
    drawFrame(ctx, 'misc/loading', phase, 50 * S, h - 70 * S, S);
    if (this.loadingText.startsWith('載入失敗')) text(ctx, this.loadingText, w / 2, h / 2, { size: 16, align: 'center', color: '#ffe8a0', stroke: '#000', strokeWidth: 3 });
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

  /**
   * Original HUD layout (exe HUD dialog @0x4027f0, paint @0x402860 → round @0x402880 + players @0x402940), in 640x480 space:
   * player i panel = info.spr frame 2i (current player, bright) / 2i+1 at (20+130i, 12); face = faceNN frame expr*2(+1) at
   * (17+130i, 25); name (14px font) at (43+130i, 8); cash (8px font) right-aligned to x 108+130i, y 24; status icon =
   * info frame status+7 at (98+130i, 12) with its remaining weeks at (108+130i, 8); ROUND plate (round.spr frame 10) at
   * (W-65, 30) with week+1 in round digits 0–9 (step 14). Narrow (portrait) screens use a 2×2 arrangement so the
   * panels stay at ≥1× original size.
   */
  hudLayout(w: number, h: number) {
    const cols = w / 660 >= 1 ? 4 : 2;
    const sc = cols === 4 ? Math.max(1, Math.min(2.2, w / 660, h / 300)) : Math.max(1, Math.min(1.8, (w - 4) / 266));
    const rows = cols === 4 ? 1 : Math.ceil(this.g.players.length / 2);
    const rowH = 54 + (this.showDetail ? 62 : 0);
    // round counter: top-right like the original; below the 2×2 grid on narrow screens
    const round = cols === 4 ? { x: w / sc - 65, y: 30, k: 1 } : { x: w / sc - 60, y: 12 + rows * rowH + 6, k: 0.8 };
    const bottom = (cols === 4 ? Math.max(12 + rowH, 52) : round.y + 26) * sc;
    return { sc, cols, rowH, round, bottom, pos: (i: number) => ({ x: 130 * (i % cols), y: rowH * Math.floor(i / cols) }) };
  }
  /** player status → info.spr icon frame (exe: frame = status + 7; status ids from the word-card handlers @0x442e34:
   *  1 hospital, 2 jail, 3 金鋼護體, 4 催吉避凶, 5 一曝十寒, 6 神智不清, 7 得而復失, 8 魔高一丈; 9–12 god/other states = best guess) */
  statusIcons(p: Player): { f: number; n: number }[] {
    const s = p.status; const out: { f: number; n: number }[] = [];
    const add = (v: number, f: number) => { if (v > 0) out.push({ f, n: v }); };
    add(s.hospital, 8); add(s.jail, 9); add(s.badGod, 16); add(s.wealthGod, 17); add(s.frozen, 12); add(s.confused, 13); add(s.dropMoney, 14);
    add(s.skip, 18); add(s.stay, 18); add(s.cardImmune, 10); add(s.badGodImmune, 11); add(s.smallmanImmune, 15); add(p.locks, 19);
    return out;
  }
  renderHUD(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const u = this.uis, g = this.g;
    const L = this.hudLayout(w, h); const W: Win = { sc: L.sc, ax: 0, ay: 0 };
    winBegin(ctx, W);
    g.players.forEach((p, i) => {
      if (!p.alive) return; // exe skips eliminated players (status == -1) but keeps the slot positions
      const o = L.pos(i); const cur = i === g.current;
      const px = 20 + o.x, py = 12 + o.y;
      drawFrame(ctx, 'interface/info', cur ? 2 * i : 2 * i + 1, px, py);
      // face expression (player+0x14): 0 normal, 1 laughing, 2 crying
      const st = p.status;
      const expr = st.hospital || st.jail || st.badGod || p.cash < 0 ? 2 : st.wealthGod ? 1 : 0;
      drawFrame(ctx, 'interface/face0' + p.char, expr * 2 + (cur ? 0 : 1), 17 + o.x, 25 + o.y);
      text(ctx, charName(p.char), 43 + o.x, 8 + o.y, { size: 13, baseline: 'top', color: '#fff', stroke: '#000', strokeWidth: 3, maxWidth: 52 });
      text(ctx, String(p.cash), 108 + o.x, 25 + o.y, { size: 11, baseline: 'top', align: 'right', color: cur ? '#ffef7a' : '#e8e0b0', stroke: '#000', strokeWidth: 2.5, maxWidth: 62 });
      if (p.ai) text(ctx, 'AI', 44 + o.x, 37 + o.y, { size: 8, baseline: 'top', color: '#9fd8ff', weight: 'normal' });
      const icons = this.statusIcons(p);
      if (icons.length) {
        // the original shows the single status; the remake can stack several → cycle through them
        const ic = icons[Math.floor(app.time / 1400) % icons.length];
        drawFrame(ctx, 'interface/info', ic.f, 98 + o.x, 12 + o.y);
        text(ctx, String(ic.n), 108 + o.x, 8 + o.y, { size: 9, baseline: 'top', color: '#fff', stroke: '#000', strokeWidth: 2.5 });
      }
      if (this.showDetail) { // console command ShowDetailInfo (@0x403470 toggles 0x4480de): four lines under the panel
        const lines: [string, number][] = [['屋企 ', p.home], ['總資產 ', netWorth(g, this.board, p)], ['卡數 ', p.cards.length], ['樓宇 ', ownedPlots(g, p).length]];
        lines.forEach(([k, v], r) => text(ctx, k + v, 10 + o.x, 52 + 15 * r + o.y, { size: 12, baseline: 'top', color: '#fff', stroke: '#000', strokeWidth: 3 }));
      }
      app.hit('pl' + i, wr(W, { x: o.x, y: 4 + o.y, w: 112, h: 48 }), () => { this.detailSeat = i; this.overlay = 'detail'; });
    });
    // ROUND plate + week number (round.spr digits, centred, step 14)
    {
      const R = L.round; ctx.save(); ctx.translate(R.x, R.y); ctx.scale(R.k, R.k);
      drawFrame(ctx, 'interface/round', 10, 0, 0);
      const ds = String(g.week + 1); let x = -(ds.length * 14 - 14) / 2;
      for (const c of ds) { drawFrame(ctx, 'interface/round', Number(c), x, 0); x += 14; }
      ctx.restore();
    }
    winEnd(ctx);
    // info box (bottom-right — round 6: ring menu owns the bottom-left corner like the original)
    const iw = 190 * u, ih = 52 * u, ix = w - iw - 8, iy = h - ih - 8;
    ctx.fillStyle = 'rgba(10,20,45,0.72)'; roundRect(ctx, ix, iy, iw, ih, 10 * u); ctx.fill();
    ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2; ctx.stroke();
    const wk = g.week % 52 + 1;
    text(ctx, `${MAPS[g.map].name}  第${yearOf(g)}年 第${wk}週 ${SEASONS[season(g)]}`, ix + 10 * u, iy + 22 * u, { size: 13 * u, color: '#fff', maxWidth: iw - 20 * u });
    const left = g.weeksLimit > 0 ? `剩餘 ${Math.max(0, g.weeksLimit - g.week)} 週` : '年期 ∞';
    text(ctx, `${left} · 馬會獎金 ${fmtMoney(g.jackpot)}`, ix + 10 * u, iy + 44 * u, { size: 12 * u, color: '#ffe36a', maxWidth: iw - 20 * u });
    // (round 6) bottom-left help legend removed; the original ring menu sits here instead
    // banner
    if (this.bannerT < 1600 && this.bannerText) {
      const k = this.bannerT < 250 ? this.bannerT / 250 : this.bannerT > 1300 ? (1600 - this.bannerT) / 300 : 1;
      const by = L.bottom + 40 * u;
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
    const u = this.uis;
    let y = this.hudLayout(w, h).bottom + 8 * u;
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
    const ancient = MAPS[this.g.map].ancient;
    text(ctx, `${p.lotId}號地  地價 ${fmtMoney(Math.floor(p.base * Math.pow(1.1, Math.floor(this.g.week / 13))))}`, x + 10 * u, y + 22 * u, { size: 14 * u, color: '#4a2a00' });
    if (ps) {
      text(ctx, `${charName(this.g.players[ps.owner].char)}的${plotTypeName(ps.type, ancient)}  等級 ${ps.level + 1}`, x + 10 * u, y + 44 * u, { size: 13 * u, color: '#333' });
      const v = plotValue(this.g, this.board, pl);
      text(ctx, `價值 ${fmtMoney(v)}`, x + 10 * u, y + 64 * u, { size: 13 * u, color: '#333' });
      let feeLine = '無租金';
      if (ps.type === PLOT.HOME) feeLine = '探訪送禮：現金 5–10%';
      else if (ps.type === PLOT.SHOP || ps.type === PLOT.RESTAURANT) feeLine = `消費：${fmtMoney(Math.floor(v / 2))}`;
      else if (ps.type === PLOT.RESIDENCE) feeLine = '住宅：訪客免租金';
      text(ctx, feeLine, x + 10 * u, y + 83 * u, { size: 13 * u, color: '#b03000' });
    } else text(ctx, '空地 — 停在旁邊即可購買興建', x + 10 * u, y + 50 * u, { size: 13 * u, color: '#333' });
  }

  /**
   * Human turn: original ring menu (game_menu.spr) + walk.spr one/two-dice panel.
   * Exe @0x408cb0 anchors the ring at (0, H-0x96); walk @0x4085b0 at (0x1e, H-200). Bottom-left like the original
   * (round 6: was centred; the remake's bottom-left help legend is gone so the menu owns that corner).
   */
  renderTurnMenu(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const u = this.uis; const p = this.g.players[this.g.current];
    const s = Math.max(0.85, Math.min(1.7, u * 1.25));
    // exe @0x408cb0: ring at (0, H-0x96); keep a small margin so it clears the screen edge
    const R = { x: 4 * s, y: Math.max(4, h - 150 * s - 8) };
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
    const cr = frameRect('interface/game_menu', 3, R.x, R.y, s);
    ctx.fillStyle = '#c3121b'; ctx.beginPath(); ctx.arc(cr.x + cr.w - 4 * s, cr.y + 6 * s, 9 * s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    text(ctx, String(p.cards.length), cr.x + cr.w - 4 * s, cr.y + 10 * s, { size: 11 * s, align: 'center', color: '#fff', weight: 'bold' });
    // walk panel to the right of the ring (exe x=30 ≈ ring width)
    if (this.walkOpen) {
      const W = { x: R.x + 160 * s, y: R.y - 10 * s };
      // keep on-screen on narrow phones: if it would clip, drop it above the ring
      if (W.x + 120 * s > w - 4) { W.x = R.x; W.y = R.y - 160 * s; }
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
    text(ctx, `輪到 ${charName(p.char)}`, R.x + 75 * s, R.y - 8 * s, { size: 14 * u, align: 'center', color: '#fff', stroke: '#000', strokeWidth: 4 });
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
    // Soft drop shadow behind the frame (offset, not painted over the white frame line art)
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(fx + 10 * sc, fy + 12 * sc, W, H);
    drawFrame(ctx, 'interface/card', 0, ax, ay, sc);
    const im = image('images/cards/' + card.jpg);
    if (im) ctx.drawImage(im, fx + 17 * sc, fy + 9 * sc, 248 * sc, 248 * sc);
    // Title in the gap above the first rule (sprite y=35 → centre ≈25); body inset in the desc panel.
    const midX = fx + 377.5 * sc, colW = 138 * sc;
    text(ctx, card.title, midX, fy + 25 * sc, { size: 14 * sc, align: 'center', baseline: 'middle', color: '#8a1a00', maxWidth: colW });
    let size = 12.5, lines: string[] = [];
    for (; size >= 9; size -= 0.5) { lines = wrap(ctx, d.text ?? card.text, colW, size * sc); if (lines.length * size * 1.3 <= 90) break; }
    lines.slice(0, 6).forEach((l, i) => text(ctx, l, fx + 310 * sc, fy + (160 + i * size * 1.3) * sc, { size: size * sc, color: '#3a1a00', baseline: 'top' }));
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
    else if (this.overlay === 'save' || this.overlay === 'load') {
      if (!this.lsWin || this.lsWin.mode !== this.overlay) this.lsWin = this.overlay === 'save'
        ? new LoadSaveWin('save', slot => { saveSlot(slot, this.g); this.overlay = 'none'; this.ui.banner('已儲存至記錄 ' + slot, '#9fe8ff'); }, close)
        : new LoadSaveWin('load', slot => { const d = loadSlot(slot); if (d) { this.engine.stopped = true; go('game', { load: d.g }); } }, close);
      this.lsWin.render(ctx, w, h);
    } else if (this.overlay === 'quitConfirm') {
      // system window 結束遊戲 → message box Misc/ExitGame with O + X (flags 3, call @0x403830)
      drawMsgBox(ctx, w, h, { text: msg('Misc', 'ExitGame'), t: this.ovT, yes: () => { this.engine.stopped = true; go('mainmenu'); }, no: close }, 'q');
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
    const cur = { q: settings.quality, spd: settings.speed, sfx: Math.round(settings.sfx * 3), mus: Math.round(settings.music * 3), voice: settings.voice, fs: settings.fullscreen };
    this.opt = { ...cur, orig: { ...cur } };
    this.optRaw = { quality: settings.quality, speed: settings.speed, sfx: settings.sfx, music: settings.music, voice: settings.voice, fullscreen: settings.fullscreen };
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
    if (settings.fullscreen !== o.fs) { settings.fullscreen = o.fs; void toggleFullscreen(o.fs); }
  }
  closeOptions(ok: boolean) {
    if (this.opt && !ok) {
      const r = this.optRaw!; const qChanged = settings.quality !== r.quality;
      const fsChanged = settings.fullscreen !== r.fullscreen;
      Object.assign(settings, r); setSpeedIndex(r.speed); applyVolumes();
      if (qChanged) void setQuality(r.quality);
      if (fsChanged) void toggleFullscreen(r.fullscreen);
    }
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

  /** Small translucent 全螢幕 control at bottom-right (above the week/jackpot info box). */
  drawFullscreenToggle(ctx: CanvasRenderingContext2D, w: number, h: number, u = 1) {
    const bw = Math.round(92 * u), bh = Math.round(28 * u);
    const ix = w - bw - 10, iy = h - Math.round(52 * u) - 8 - bh - 8;
    const on = settings.fullscreen || isFullscreen();
    const st = app.state('fs-toggle');
    ctx.save();
    ctx.globalAlpha = st ? 0.95 : 0.72;
    ctx.fillStyle = on ? 'rgba(20,80,140,0.75)' : 'rgba(10,20,40,0.55)';
    roundRect(ctx, ix, iy, bw, bh, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(200,230,255,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    text(ctx, '⛶ 全螢幕', ix + bw / 2 - 6 * u, iy + bh / 2, {
      size: Math.round(13 * u), align: 'center', baseline: 'middle', color: on ? '#9fe8ff' : '#e8f0ff',
      stroke: 'rgba(0,20,50,0.7)', strokeWidth: 3,
    });
    text(ctx, on ? '開' : '關', ix + bw - 14 * u, iy + bh / 2, {
      size: Math.round(10 * u), align: 'center', baseline: 'middle', color: on ? '#9fe8ff' : 'rgba(255,255,255,0.55)',
    });
    app.hit('fs-toggle', { x: ix, y: iy, w: bw, h: bh }, () => {
      const next = !isFullscreen();
      settings.fullscreen = next; saveSettings();
      void toggleFullscreen(next);
      void sfx('option/button');
    });
  }


  /** Translucent Debug toggle left of 全螢幕; panel stacks above both when open. */
  drawDebugControls(ctx: CanvasRenderingContext2D, w: number, h: number, u = 1) {
    if (!this.ready || !this.g) return;
    const bw = Math.round(92 * u), bh = Math.round(28 * u);
    const fsX = w - bw - 10;
    const iy = h - Math.round(52 * u) - 8 - bh - 8;
    const ix = fsX - bw - 8;
    const st = app.state('dbg-toggle');
    ctx.save();
    ctx.globalAlpha = st ? 0.95 : 0.68;
    ctx.fillStyle = this.debugOn ? 'rgba(120,60,10,0.78)' : 'rgba(10,20,40,0.5)';
    roundRect(ctx, ix, iy, bw, bh, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,210,140,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    text(ctx, this.dbgTpArmed ? '⏳ 點地圖' : '🛠 Debug', ix + bw / 2, iy + bh / 2, {
      size: Math.round(13 * u), align: 'center', baseline: 'middle', color: this.dbgTpArmed ? '#ffd46a' : (this.debugOn ? '#ffe36a' : '#e8f0ff'),
      stroke: 'rgba(40,20,0,0.7)', strokeWidth: 3,
    });
    app.hit('dbg-toggle', { x: ix, y: iy, w: bw, h: bh }, () => {
      if (this.dbgTpArmed) {
        this.dbgTpArmed = false;
        this.ui.toast('已取消傳送', { color: '#ffb347' });
        void sfx('option/button');
        return;
      }
      this.debugOn = !this.debugOn;
      this.debugPanel = this.debugOn;
      if (this.debugOn) {
        const hp = this.g.players.find(pp => pp.alive && !pp.ai) ?? this.g.players[this.g.current];
        this.dbgTile = hp?.tile ?? 0;
      } else {
        this.dbgTpArmed = false;
      }
      void sfx('option/button');
    });
    if (this.debugOn && this.debugPanel) this.drawDebugPanel(ctx, w, h, u, ix, iy);
  }

  private humanPlayer() {
    return this.g.players.find(pp => pp.alive && !pp.ai) ?? null;
  }

  drawDebugPanel(ctx: CanvasRenderingContext2D, w: number, h: number, u: number, anchorX: number, anchorY: number) {
    const pw = Math.round(268 * u), ph = Math.round(168 * u);
    const px = Math.min(anchorX, w - pw - 10);
    const py = anchorY - ph - 8;
    const hp = this.humanPlayer();
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(12,18,36,0.88)';
    roundRect(ctx, px, py, pw, ph, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,100,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    const lab = { size: Math.round(12 * u), color: '#ffe8a0', stroke: 'rgba(0,0,0,0.6)', strokeWidth: 2.5 };
    text(ctx, 'DEBUG（測試用）', px + 10 * u, py + 16 * u, { ...lab, size: Math.round(13 * u), weight: 'bold' });
    text(ctx, hp ? `${charName(hp.char)} 現金 $${Math.round(hp.cash)}` : '無人類玩家', px + 10 * u, py + 34 * u, lab);

    const btn = (id: string, x: number, y: number, bw: number, bh: number, label: string, fn: () => void, dis = false) => {
      const st = app.state(id);
      ctx.save();
      ctx.globalAlpha = dis ? 0.35 : st ? 0.95 : 0.75;
      ctx.fillStyle = 'rgba(40,70,120,0.85)';
      roundRect(ctx, x, y, bw, bh, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(180,210,255,0.4)'; ctx.stroke();
      ctx.restore();
      text(ctx, label, x + bw / 2, y + bh / 2, { size: Math.round(11 * u), align: 'center', baseline: 'middle', color: '#fff', stroke: 'rgba(0,0,0,0.5)', strokeWidth: 2 });
      if (!dis) app.hit(id, { x, y, w: bw, h: bh }, () => { fn(); void sfx('interface/click'); });
    };

    const rowY = py + 48 * u;
    btn('dbg-c-1k', px + 10 * u, rowY, 58 * u, 24 * u, '現金-1k', () => this.debugCash(-1000), !hp);
    btn('dbg-c-5', px + 72 * u, rowY, 50 * u, 24 * u, '-500', () => this.debugCash(-500), !hp);
    btn('dbg-c+5', px + 126 * u, rowY, 50 * u, 24 * u, '+500', () => this.debugCash(500), !hp);
    btn('dbg-c+1k', px + 180 * u, rowY, 58 * u, 24 * u, '+1k', () => this.debugCash(1000), !hp);

    text(ctx, `骰子  d1=${this.dbgD1}  d2=${this.dbgD2 || '—'}（0=一顆）`, px + 10 * u, py + 90 * u, lab);
    const dy = py + 100 * u;
    btn('dbg-d1-', px + 10 * u, dy, 36 * u, 22 * u, 'd1−', () => { this.dbgD1 = this.dbgD1 <= 1 ? 6 : this.dbgD1 - 1; });
    btn('dbg-d1+', px + 50 * u, dy, 36 * u, 22 * u, 'd1+', () => { this.dbgD1 = this.dbgD1 >= 6 ? 1 : this.dbgD1 + 1; });
    btn('dbg-d2-', px + 94 * u, dy, 36 * u, 22 * u, 'd2−', () => { this.dbgD2 = this.dbgD2 <= 0 ? 6 : this.dbgD2 - 1; });
    btn('dbg-d2+', px + 134 * u, dy, 36 * u, 22 * u, 'd2+', () => { this.dbgD2 = this.dbgD2 >= 6 ? 0 : this.dbgD2 + 1; });
    btn('dbg-dice', px + 178 * u, dy, 70 * u, 22 * u, '下次用此', () => {
      if (!this.engine) return;
      this.engine.forceDice = { d1: this.dbgD1, d2: this.dbgD2 };
      this.ui.toast(this.dbgD2 ? `下次擲骰：${this.dbgD1}+${this.dbgD2}` : `下次擲骰：${this.dbgD1}（一顆）`, { color: '#ffe36a' });
    }, !hp);

    const nTiles = this.board.tiles.length;
    text(ctx, this.dbgTpArmed ? '點地圖傳送…' : `傳送 tile ${this.dbgTile}/${nTiles - 1}`, px + 10 * u, py + 138 * u, lab);
    const ty = py + 140 * u;
    btn('dbg-t-', px + 130 * u, ty, 28 * u, 22 * u, '−', () => { this.dbgTile = (this.dbgTile - 1 + nTiles) % nTiles; this.focusDbgTile(); }, this.dbgTpArmed);
    btn('dbg-t+', px + 162 * u, ty, 28 * u, 22 * u, '+', () => { this.dbgTile = (this.dbgTile + 1) % nTiles; this.focusDbgTile(); }, this.dbgTpArmed);
    // Armed state: button reads 裝填中 / loading
    {
      const id = 'dbg-tp'; const bw2 = 52 * u, bh2 = 22 * u; const x = px + 196 * u, y = ty;
      const st2 = app.state(id);
      ctx.save();
      ctx.globalAlpha = !hp ? 0.35 : st2 ? 0.95 : 0.8;
      ctx.fillStyle = this.dbgTpArmed ? 'rgba(180,100,20,0.95)' : 'rgba(40,70,120,0.85)';
      roundRect(ctx, x, y, bw2, bh2, 6); ctx.fill();
      ctx.strokeStyle = this.dbgTpArmed ? 'rgba(255,200,80,0.8)' : 'rgba(180,210,255,0.4)'; ctx.stroke();
      ctx.restore();
      text(ctx, this.dbgTpArmed ? '裝填中' : '傳送', x + bw2 / 2, y + bh2 / 2, { size: Math.round(11 * u), align: 'center', baseline: 'middle', color: '#fff', stroke: 'rgba(0,0,0,0.5)', strokeWidth: 2 });
      if (hp) app.hit(id, { x, y, w: bw2, h: bh2 }, () => {
        this.dbgTpArmed = !this.dbgTpArmed;
        this.ui.toast(this.dbgTpArmed ? '點地圖完成傳送（Esc/Debug 取消）' : '已取消傳送', { color: '#ffe36a' });
        void sfx('interface/click');
      });
    }
  }

  private focusDbgTile() {
    const tt = this.board.tiles[this.dbgTile]; if (!tt) return;
    this.view.focusOn(tt.x, tt.y);
  }

  debugCash(delta: number) {
    const pp = this.humanPlayer(); if (!pp) return;
    pp.cash = Math.max(0, Math.round(pp.cash + delta));
    this.view.money(pp.seat, delta);
    this.engine?.onChange();
    this.ui.toast(`${charName(pp.char)} 現金 ${delta >= 0 ? '+' : ''}${delta} → $${pp.cash}`, { seat: pp.seat, color: '#ffe36a' });
  }

  async debugTeleportTo(tile: number) {
    const pp = this.humanPlayer(); if (!pp || !this.engine) return;
    if (this.diceAnim) { this.ui.toast('擲骰中，稍後再傳送', { color: '#ff8a6a' }); return; }
    tile = Math.max(0, Math.min(this.board.tiles.length - 1, tile | 0));
    this.dbgTile = tile;
    await this.engine.teleportTo(pp, tile);
    await this.engine.land(pp, { skipTransport: true });
    this.engine.onChange();
    this.ui.toast(`${charName(pp.char)} → tile ${tile}`, { seat: pp.seat, color: '#9fe8ff' });
  }

  /**
   * Original 屋企 calculator (interface/calculater.spr + calcnumber2 digits).
   * Left icons = 存錢/取錢 mode; LCD amount; O/X/C + arrows from calculater sheet.
   */
  renderHomeBank(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const d = this.homeBankDlg!; const u = Math.max(0.85, this.uis);
    dim(ctx, w, h, 0.4 * Math.min(1, d.t / 200));
    app.block({ x: 0, y: 0, w, h });
    const panelW = 306, panelH = 152;
    const ax = Math.round((w - (panelW + 56) * u) / 2);
    const ay = Math.round((h - (panelH + 40) * u) / 2);
    drawFrame(ctx, 'interface/calculater', 0, ax, ay, u);

    // Mode hit zones over left cash / house icons on the panel
    const modeIn = d.mode === 'in';
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = modeIn ? '#3aa0ff' : '#000';
    ctx.fillRect(ax + 10 * u, ay + 16 * u, 52 * u, 44 * u);
    ctx.fillStyle = !modeIn ? '#3aa0ff' : '#000';
    ctx.fillRect(ax + 10 * u, ay + 86 * u, 52 * u, 44 * u);
    ctx.restore();
    text(ctx, '存', ax + 36 * u, ay + 38 * u, { size: 14 * u, align: 'center', baseline: 'middle', color: '#fff', stroke: '#024', strokeWidth: 3 });
    text(ctx, '取', ax + 36 * u, ay + 108 * u, { size: 14 * u, align: 'center', baseline: 'middle', color: '#fff', stroke: '#024', strokeWidth: 3 });
    app.hit('hb-in', { x: ax + 10 * u, y: ay + 16 * u, w: 52 * u, h: 44 * u }, () => {
      if (d.cash <= 0) return;
      d.mode = 'in';
      d.amount = Math.min(d.cash, Math.max(0, Math.floor(d.cash * RULES.homeDepositPct / 100)) || d.cash);
      void sfx('interface/click');
    });
    app.hit('hb-out', { x: ax + 10 * u, y: ay + 86 * u, w: 52 * u, h: 44 * u }, () => {
      if (d.home <= 0) return;
      d.mode = 'out';
      d.amount = Math.min(d.home, Math.max(0, Math.floor(d.home / 2)) || d.home);
      void sfx('interface/click');
    });

    const maxAmt = d.mode === 'in' ? d.cash : d.home;
    d.amount = Math.max(0, Math.min(maxAmt, Math.floor(d.amount)));
    const digits = String(Math.floor(d.amount));
    const step = 18 * u;
    const slotCX = ax + 178 * u, slotCY = ay + 74 * u;
    const startX = slotCX - (digits.length * step) / 2;
    for (let i = 0; i < digits.length; i++) {
      const di = digits.charCodeAt(i) - 48;
      if (di >= 0 && di <= 9) drawFrame(ctx, 'interface/calcnumber2', di, startX + i * step + step / 2, slotCY, u * 0.8);
    }
    text(ctx, modeIn ? '存入屋企' : '從屋企取出', ax + 178 * u, ay + 30 * u, { size: 12 * u, align: 'center', color: '#4a2a00', weight: 'bold' });
    text(ctx, `手上 $${d.cash}　屋企 $${d.home}`, ax + 178 * u, ay + 122 * u, { size: 11 * u, align: 'center', color: '#4a2a00' });

    // Widget frames share the panel anchor (SPR hx/hy place O/X/C/arrows)
    const calcBtn = (id: string, frames: number[], fn: () => void) => {
      const st = app.state(id);
      const fi = frames[Math.min(frames.length - 1, st ? 1 : 0)];
      drawFrame(ctx, 'interface/calculater', fi, ax, ay, u);
      app.hit(id, frameRect('interface/calculater', fi, ax, ay, u), () => { fn(); void sfx('interface/click'); });
    };
    calcBtn('hb-o', [1, 2, 3], () => { if (d.amount > 0) d.resolve({ mode: d.mode, amount: d.amount }); });
    calcBtn('hb-x', [4, 5, 6], () => d.resolve(null));
    calcBtn('hb-c', [7, 8, 9], () => { d.amount = 0; });
    calcBtn('hb-dn', [10, 10, 10], () => { d.amount = Math.max(0, d.amount - 100); });
    calcBtn('hb-up', [11, 11, 11], () => { d.amount = Math.min(maxAmt, d.amount + 100); });

    const chipY = ay + (panelH + 12) * u;
    const chips: [string, string, () => void][] = [
      ['hb-half', '一半', () => { d.amount = Math.floor(maxAmt / 2); }],
      ['hb-all', '全部', () => { d.amount = maxAmt; }],
      ['hb-p500', '+500', () => { d.amount = Math.min(maxAmt, d.amount + 500); }],
      ['hb-m500', '-500', () => { d.amount = Math.max(0, d.amount - 500); }],
    ];
    chips.forEach(([id, lab, fn], i) => {
      const cw = 64 * u, ch = 26 * u;
      const cx = ax + i * (cw + 8 * u);
      const st = app.state(id);
      ctx.save(); ctx.globalAlpha = st ? 0.95 : 0.8;
      ctx.fillStyle = 'rgba(20,60,120,0.88)'; roundRect(ctx, cx, chipY, cw, ch, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(160,200,255,0.5)'; ctx.stroke(); ctx.restore();
      text(ctx, lab, cx + cw / 2, chipY + ch / 2, { size: 12 * u, align: 'center', baseline: 'middle', color: '#fff' });
      app.hit(id, { x: cx, y: chipY, w: cw, h: ch }, () => { fn(); void sfx('interface/click'); });
    });
  }


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
    // Original four rows only — 全螢幕 lives on the floating BR toggle outside this panel.
    const rows: [string, [number, number, number], () => void][] = [
      ['op-q', [14, 13, 13], () => { o.q = (o.q + 1) % 3; if (o.q === 2 && !hdAvailable()) o.q = 0; this.applyOpt(); }],
      ['op-spd', [16, 15, 15], () => { o.spd = (o.spd + 1) % 3; this.applyOpt(); }],
      ['op-sfx', [18, 17, 17], () => { o.sfx = (o.sfx + 1) % 4; this.applyOpt(); }],
      ['op-mus', [20, 19, 19], () => { o.mus = (o.mus + 1) % 4; this.applyOpt(); }],
    ];
    const Y = [30, 70, 110, 150];
    rows.forEach(([id, fr, cb], i) => {
      wbtn(ctx, W, id, 'interface/option', fr, cb, { sound: 'option/button' });
      if (i === 0) {
        text(ctx, '畫質', 30, Y[i] + 3, lab);
        text(ctx, ql[o.q] + (o.q === 0 ? (hdActive() ? '·高清' : '·標準') : ''), 176, Y[i] + 3, { ...lab, align: 'center' });
      } else if (i === 1) {
        text(ctx, T['1'] ?? '遊戲速度', 30, Y[i] + 3, lab);
        text(ctx, sp[o.spd], 176, Y[i] + 3, { ...lab, align: 'center' });
      } else if (i === 2) {
        text(ctx, T['2'] ?? '音效', 70, Y[i] + 3, lab);
        if (o.sfx > 0) drawFrame(ctx, 'interface/option', 6 + o.sfx, 0, 0);
      } else {
        text(ctx, T['3'] ?? '音樂', 70, Y[i] + 3, lab);
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
    // Description panel (sprite y≥155 → window y = 8+155 = 163; red margins sprite 302..453 → window 309..460).
    // Keep text inset so it never paints over the white/cream frame line art.
    const descX = 314, descW = 140, descY = 168;
    let size = 13, lines: string[] = [];
    for (; size >= 9; size -= 0.5) { lines = wrap(ctx, card.text, descW, size, 'normal'); if (lines.length * size * 1.3 <= 100) break; }
    lines.forEach((l, i) => text(ctx, l, descX, descY + i * size * 1.3, { size, color: '#000', baseline: 'top', weight: 'normal' }));
    // List: sprite rules at y=35+20i → window y=43+20i (frame at +7,+8). Five gaps:
    // above 1st rule (mid 33) then between consecutive rules (53,73,93,113). Size-13 glyphs stay
    // clear of the line art; selection mask fills only the gap interior inside red margins 309..460.
    const sc = d.scroll ?? 0;
    for (let i = 0; i < 5; i++) {
      const idx = sc + i; const e = list[idx]; if (!e) break;
      const ruleBot = 43 + 20 * i;         // rule below this row
      const mid = ruleBot - 12;            // 31+20i — slightly above gap centre so glyphs clear the lower rule
      const gapTop = ruleBot - 19;         // 24+20i
      const sel = idx === d.sel;
      if (sel) {
        ctx.fillStyle = 'rgba(80,10,0,0.45)';
        // inset 2px from rules and 3px from red verticals (309 / 460)
        ctx.fillRect(313, gapTop + 2, 143, 14);
      }
      const label = D.words[e.id - 1].title + (e.n > 1 ? ` ×${e.n}` : '');
      text(ctx, label, 384, mid, { size: 11, align: 'center', baseline: 'middle', color: e.disabled ? '#808080' : sel ? '#fff' : '#000' });
      app.hit('cs-row' + i, wr(W, { x: 313, y: gapTop + 2, w: 143, h: 14 }), () => {
        if (d.sel === idx && !e.disabled) { d.resolve(e.id); return; }
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
