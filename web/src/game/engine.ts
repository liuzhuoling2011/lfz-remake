// Turn engine: async state machine driving rules + view + UI.
import { wait, TURBO } from '../core/app';
import { sfx, voice, music } from '../core/audio';
import { RULES, MAPS, SFX, SFXI, SEASONS, PLOT, plotTypeName } from './config';
import { D, msg, fmt, charName, type ChanceCard, type WordCard } from './data';
import type { Board, Landmark } from './board';
import type { GameState, Player } from './state';
import { saveSlot } from './state';
import { scale, value, buildCost, upgradeCost, plotValue, netWorth, ownedPlots, landPrice, season, rentFee, residenceIncome, investDelta, hasOwnerInvest } from './rules';
import * as AI from './ai';
import type { MapView } from './view';
import type { MGResult } from '../mini/core';

export interface ChoiceOpt { label: string; sub?: string; disabled?: boolean }
export interface UIOpts {
  title?: string; image?: string; voice?: string; ai?: boolean; kind?: 'chance' | 'card' | 'npc' | 'msg'; badge?: string;
  /** word-card id for kind 'card' (renders the original card frame with art, title and description) */
  cardId?: number; caption?: string;
}
export interface ToastOpts { image?: string; color?: string; seat?: number; ms?: number; cardId?: number }
export type TurnAction = 'roll1' | 'roll2' | 'card' | 'quit' | 'load';
export interface GameUI {
  message(text: string, o?: UIOpts): Promise<void>;
  confirm(text: string, o?: UIOpts): Promise<boolean>;
  choose(title: string, opts: ChoiceOpt[], o?: UIOpts & { cancel?: string }): Promise<number>;
  /** dice animation; d2 = 0 → single die */
  dice(d1: number, d2: number): Promise<void>;
  turnMenu(p: Player): Promise<TurnAction>;
  pickCard(p: Player): Promise<number | null>;
  pickPlayer(title: string, cands: number[]): Promise<number>;
  pickSteps(): Promise<number>;
  seasonChange(s: number): Promise<void>;
  banner(text: string, color?: string): void;
  /** non-blocking notification (used for every AI decision) */
  toast(text: string, o?: ToastOpts): void;
  say(seat: number, text: string): void;
  winner(seat: number, ranking: number[]): Promise<void>;
  /** run original mini-game `game` (0..3) with these seats; resolves after its result screen */
  minigame(game: number, seats: number[]): Promise<MGResult>;
}

// character line numbers (characterNN.txt [word]); call sites verified against omasterq.exe speak(player,line) @0x416770
export const L = {
  curse: 2, sigh: 3, attack: 5, defended: 6, hitByCard: 7, salaryNo: 9, win: 10, rich: 11, beg: 12, home: 13, lock: 14,
  robbed: 15, assaulted: 16, buy: 17, salary: 18, jockey: 19, jackpotWin: 20, jackpotLose: 21, hospital: 22, jail: 23, eerie: 24,
  badLuck: 25, goodLuck: 26, blocked: 27, myTurn: 28, choose: 29,
};
/** random good / bad reaction tables (VERIFIED: 0x442c34 = {1,4,8}, 0x442c40 = {2,3,9}) */
const GOOD = [1, 4, 8], BAD = [2, 3, 9];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export class Engine {
  stopped = false;
  private extraRoll = false;
  private depth = 0;
  onChange: () => void = () => {};
  constructor(public g: GameState, public b: Board, public view: MapView, public ui: GameUI) {}

  get cur() { return this.g.players[this.g.current]; }
  name(p: Player | number) { return charName(typeof p === 'number' ? this.g.players[p].char : p.char); }
  alive() { return this.g.players.filter(p => p.alive); }

  // ---------------- voice / sfx ----------------
  /** Character speaks a [word] line: speech bubble + voice (one channel per player, no overlapping spam). */
  speak(p: Player, line: number | number[], prio = 2) {
    const n = Array.isArray(line) ? pick(line) : line;
    const ch = D.chars[p.char - 1]; if (!ch) return;
    const t = ch.lines[String(n)];
    let v = ch.voice_ids[String(n)];
    // data quirk: [voice] maps line 27 to xx29 (= line 28's file); xx28 exists for all but 大番薯
    if (n === 27 && v && p.char !== 2) v = v.replace(/29$/, '28');
    if (t) this.ui.say(p.seat, t);
    if (v && !TURBO) { void voice(v.toLowerCase() + '.mp3', p.seat, prio); }
  }
  greet(p: Player, other: Player) {
    const ch = D.chars[p.char - 1]; const key = 'character' + String(other.char).padStart(2, '0');
    const t = (ch as any)?.greetings?.[key]; const v = ch?.voice_greetings?.[key];
    if (t) this.ui.say(p.seat, t);
    if (v && !TURBO) void voice(v.toLowerCase() + '.mp3', p.seat, 1);
  }
  sfxi(i: number, vol = 1) { if (!TURBO) void sfx(SFX[i], vol); }

  // ---------------- AI-aware UI helpers ----------------
  /** Information: dialog for humans; non-blocking toast for AI turns. */
  async info(text: string, o: UIOpts = {}, actor: Player = this.cur) {
    if (actor.ai) {
      this.ui.toast(text, { image: o.image, cardId: o.cardId });
      if (o.voice && !TURBO) void voice(o.voice, -1, 1);
      await wait(o.image ? 1100 : 650 + Math.min(900, text.length * 12));
      return;
    }
    await this.ui.message(text, o);
  }
  async ask(p: Player, text: string, o: UIOpts, aiAnswer: boolean, aiToast?: string): Promise<boolean> {
    if (p.ai) { if (aiAnswer && aiToast) this.ui.toast(aiToast, { seat: p.seat }); return aiAnswer; }
    return this.ui.confirm(text, o);
  }

  // ---------------- main loop ----------------
  async run() {
    this.view.game = this.g;
    music(MAPS[this.g.map].music[season(this.g)]);
    this.view.season = season(this.g);
    while (!this.stopped && this.g.winner === null) {
      const p = this.cur;
      if (p.alive) {
        saveSlot(0, this.g); // autosave at turn start (slot 0 = 自動存檔)
        const r = await this.turn(p);
        if (r === 'quit' || this.stopped) return;
      }
      if (this.checkEnd()) break;
      await this.next();
      this.onChange();
    }
    if (this.g.winner !== null && !this.stopped) {
      const rank = [...this.g.players].sort((a, c) => (c.alive ? 1 : 0) - (a.alive ? 1 : 0) || netWorth(this.g, this.b, c) - netWorth(this.g, this.b, a)).map(p => p.seat);
      // VERIFIED (@0x4030ff/0x403177): winner says line 11 (富貴), losers line 12 (貧窮)
      this.speak(this.g.players[this.g.winner], L.rich, 3);
      await this.ui.winner(this.g.winner, rank);
    }
  }

  checkEnd() {
    const al = this.alive();
    const timeUp = this.g.weeksLimit > 0 && this.g.week >= this.g.weeksLimit;
    if (al.length <= 1 || timeUp) {
      const w = [...al].sort((a, c) => netWorth(this.g, this.b, c) - netWorth(this.g, this.b, a))[0] ?? this.g.players[0];
      this.g.winner = w.seat;
      return true;
    }
    return false;
  }

  async next() {
    const n = this.g.players.length;
    let i = this.g.current;
    for (let k = 0; k < n; k++) {
      i = (i + 1) % n;
      if (i === 0) await this.newWeek();
      if (this.g.players[i].alive) break;
    }
    this.g.current = i; this.g.turnCount++;
  }

  async newWeek() {
    const s0 = season(this.g);
    this.g.week++;
    // 住宅 → 屋企存款：每週按物業價值抽成（INFERRED；邏輯按 type id=3，與地圖顯示名無關）
    for (const p of this.alive()) {
      let gained = 0;
      for (const i of ownedPlots(this.g, p)) {
        const ps = this.g.plots[i]!;
        if (ps.type !== PLOT.RESIDENCE) continue;
        const amt = residenceIncome(plotValue(this.g, this.b, i));
        if (amt > 0) { p.home += amt; gained += amt; }
      }
      if (gained > 0) {
        const a = this.view.actor(p.seat);
        this.view.float(`住宅收租 +${gained}`, a.x, a.y - 120, '#9fe8ff');
        this.onChange();
      }
    }
    const s1 = season(this.g);
    if (s1 !== s0) {
      this.view.season = s1;
      await this.ui.seasonChange(s1);
      music(MAPS[this.g.map].music[s1]);
    }
  }

  // ---------------- turn ----------------
  async turn(p: Player): Promise<string | void> {
    const v = this.view; v.current = p.seat;
    const a = v.actor(p.seat); v.focusOn(a.x, a.y);
    this.onChange();
    this.ui.banner(this.name(p) + (p.ai ? '（電腦）' : '') + ' 的回合', undefined);
    await wait(350);
    const st = p.status;
    const block = async (key: keyof typeof st, text: string) => {
      if (st[key] > 0) { st[key]--; this.tickStatuses(p); await this.info(text, {}, p); return true; }
      return false;
    };
    if (await block('hospital', `${this.name(p)}住院中，還要休養 ${st.hospital} 個星期！`)) return;
    if (await block('jail', `${this.name(p)}坐牢中，還要坐 ${st.jail} 個星期！`)) return;
    if (await block('frozen', `${this.name(p)}被「一曝十寒」冰封中，停留原地！`)) return;
    if (await block('stay', `${this.name(p)}停留一回合！`)) return;
    if (await block('skip', `${this.name(p)}罰原地停留一次！`)) return;

    this.speak(p, L.myTurn, 1); // VERIFIED: line 28 at turn start (@0x417ad0 / 0x417b64)
    let rolls = 1;
    while (rolls-- > 0 && p.alive && !this.stopped) {
      this.extraRoll = false;
      let nDice: 1 | 2 = 2;
      // pre-roll: cards / menu
      if (p.ai) {
        const c = AI.chooseCard(this.g, this.b, p);
        if (c) await this.useCard(p, c.card, c.target);
        nDice = AI.pickDice(this.g, this.b, p);
      } else {
        for (;;) {
          const act = await this.ui.turnMenu(p);
          if (act === 'quit' || act === 'load') { this.stopped = true; return 'quit'; }
          if (act === 'roll1' || act === 'roll2') { nDice = act === 'roll1' ? 1 : 2; break; }
          if (act === 'card') {
            const id = await this.ui.pickCard(p);
            if (id !== null) await this.useCardInteractive(p, id);
            if (!p.alive || this.stopped) return;
          }
        }
      }
      if (!p.alive || this.stopped) return;
      let steps: number;
      if (p.chooseSteps) {
        p.chooseSteps = false;
        if (p.ai) { steps = AI.pickSteps(this.g, this.b, p); this.ui.toast(`${this.name(p)}「步步為營」：行 ${steps} 步`, { seat: p.seat, cardId: 4 }); await wait(600); }
        else steps = await this.ui.pickSteps();
      } else {
        // VERIFIED (@0x410d00): button 0 = one die (rand%6+1), button 1 = two dice; steps = d1 + d2; no doubles rule.
        const d1 = 1 + Math.floor(Math.random() * 6);
        const d2 = nDice === 2 ? 1 + Math.floor(Math.random() * 6) : 0;
        steps = d1 + d2;
        await this.ui.dice(d1, d2);
      }
      await this.move(p, steps);
      if (!p.alive) return;
      await this.land(p);
      if (this.extraRoll && p.alive && p.status.hospital + p.status.jail === 0) rolls++;
    }
    if (p.alive) await this.npcEvent(p);
    this.tickStatuses(p);
    this.view.actor(p.seat).anim = 'stand';
  }

  tickStatuses(p: Player) {
    const s = p.status;
    for (const k of ['confused', 'dropMoney', 'cardImmune', 'badGodImmune', 'smallmanImmune', 'badGod', 'wealthGod'] as const) if (s[k] > 0) s[k]--;
  }

  // ---------------- movement ----------------
  /** Pre-compute the route: at forks the direction is chosen at random (for everyone). */
  route(p: Player, steps: number) {
    const path: number[] = [];
    let cur = p.tile, prev = p.prev;
    for (let i = 0; i < steps; i++) {
      const opts = this.b.options(cur, prev);
      const nx = opts.length > 1 ? opts[Math.floor(Math.random() * opts.length)] : opts[0];
      path.push(nx); prev = cur; cur = nx;
    }
    return path;
  }

  async move(p: Player, steps: number) {
    const v = this.view;
    const path = this.route(p, steps);
    let dropped = false;
    await v.walkPath(p.seat, p.tile, path, (i, tile) => {
      p.prev = i === 0 ? p.tile : path[i - 1]; p.tile = tile;
      if (!TURBO) void sfx('interface/sfx065', 0.35); // footstep
      this.passTile(p);
      if (p.status.dropMoney > 0 && !dropped) {
        dropped = true;
        const amt = Math.floor(p.cash * RULES.dropMoneyPct / 100);
        if (amt > 0) { p.cash -= amt; v.money(p.seat, -amt); this.g.roadMoney.push({ tile: p.prev, amount: amt }); }
      }
      this.onChange();
    });
    p.tile = path[path.length - 1] ?? p.tile; p.prev = path.length > 1 ? path[path.length - 2] : p.prev;
    v.actor(p.seat).anim = 'stand';
    // greet another character standing on the same tile (voice 25a–e)
    const other = this.alive().find(o => o.seat !== p.seat && o.tile === p.tile);
    if (other && Math.random() < 0.7) this.greet(p, other);
  }

  passTile(p: Player) {
    // road money pickup
    let amt = 0;
    for (const r of this.g.roadMoney) if (r.tile === p.tile) amt += r.amount;
    if (amt > 0) {
      this.g.roadMoney = this.g.roadMoney.filter(r => r.tile !== p.tile);
      this.gain(p, amt); this.speak(p, GOOD, 1);
    }
    // (家存取改為停在自有屋企時的對話，見 homeBank；路過不再自動存入)
  }

  async teleportTo(p: Player, tile: number) {
    this.sfxi(SFXI.godOut);
    await this.view.teleport(p.seat, tile);
    p.prev = this.b.defaultPrev(tile); p.tile = tile;
    this.view.placeActor(p.seat, tile, p.prev);
  }

  // ---------------- money ----------------
  gain(p: Player, amt: number) { if (amt <= 0) return; p.cash += amt; this.view.money(p.seat, amt); this.sfxi(SFXI.gain, 0.8); this.onChange(); }
  /** Pay amount; optionally to another player. Handles home withdrawal, forced sale and bankruptcy. */
  async pay(p: Player, amt: number, to?: Player) {
    amt = Math.max(0, Math.floor(amt)); if (!amt) return;
    p.cash -= amt; this.view.money(p.seat, -amt);
    if (to) { to.cash += amt; this.view.money(to.seat, amt); }
    this.sfxi(SFXI.lose, 0.8);
    await this.settle(p);
    this.onChange();
  }
  async settle(p: Player) {
    if (p.cash >= 0) return;
    if (p.home > 0) { const t = Math.min(p.home, -p.cash); p.home -= t; p.cash += t; }
    while (p.cash < 0) {
      const owned = ownedPlots(this.g, p).sort((a, c) => plotValue(this.g, this.b, a) - plotValue(this.g, this.b, c));
      if (!owned.length) break;
      const pl = owned[0]; const val = plotValue(this.g, this.b, pl);
      await this.view.construct(pl, true);
      this.g.plots[pl] = null; if (p.homePlot === pl) p.homePlot = null;
      p.cash += val;
      this.speak(p, L.hitByCard);
      await this.info(`${this.name(p)}現金不足，被迫變賣物業（${this.b.plots[pl].lotId}號地）得 ${val} 元！`, {}, p);
    }
    if (p.cash < 0 && netWorth(this.g, this.b, p) < 0) await this.bankrupt(p);
  }
  async bankrupt(p: Player) {
    p.alive = false; p.cash = 0; p.home = 0;
    for (const pl of ownedPlots(this.g, p)) this.g.plots[pl] = null;
    p.homePlot = null;
    this.speak(p, L.beg, 3);
    this.view.actor(p.seat).hidden = true;
    music('loser.mp3', false);
    await this.info(`${this.name(p)}破產了！`, { badge: 'gameover' }, p.ai ? p : this.cur);
    music(MAPS[this.g.map].music[season(this.g)]);
  }

  // ---------------- landing ----------------
  async land(p: Player, opts: { skipTransport?: boolean } = {}) {
    if (++this.depth > 4) { this.depth--; return; }
    try {
      const t = this.b.tiles[p.tile];
      for (const pl of t.plots) { if (!p.alive) return; await this.property(p, pl); }
      if (!p.alive) return;
      switch (t.event) {
        case 'chance': await this.chance(p); break;
        case 'bank': await this.salary(p); break;
        case 'gain': { const amt = scale(RULES.moneyAddBase, this.g.week); this.gain(p, amt); this.speak(p, GOOD); await this.info(`拾到 ${amt} 元！`, {}, p); break; }
        case 'lose': {
          if (p.status.wealthGod > 0) { this.speak(p, GOOD); await this.info(msg('Misc', 'GiveMoney0'), {}, p); break; }
          const amt = scale(RULES.moneyDesBase, this.g.week); await this.pay(p, amt); this.speak(p, BAD); await this.info(`失去 ${amt} 元！`, {}, p); break;
        }
        case 'minigame': await this.minigame(p); break;
        case 'jockey': await this.jockey(p); break;
        // Arrival after ferry/tram/cart must not re-prompt the paired pier (九龍渡海 / 古代馬車 loop)
        case 'transport': if (!opts.skipTransport) await this.transport(p); break;
        case 'smallman': await this.smallman(p); break;
      }
      for (const lm of t.landmarks) { if (!p.alive) return; await this.landmark(p, lm); }
    } finally { this.depth--; }
  }

  async salary(p: Player) {
    let amt = scale(RULES.salaryBase, this.g.week);
    if (p.status.wealthGod > 0) amt *= 2;
    this.g.jackpot += Math.floor(amt / 2);
    this.gain(p, amt);
    this.speak(p, L.salary); // VERIFIED: line 18 next to MISC/income
    await this.info('洋行：' + msg('Misc', 'income', amt), {}, p);
  }

  async property(p: Player, pl: number) {
    const ps = this.g.plots[pl];
    const plot = this.b.plots[pl];
    const ancient = MAPS[this.g.map].ancient;
    if (!ps) {
      if (p.status.confused > 0) { this.speak(p, L.badLuck); await this.info(`${this.name(p)}神智不清，不能購買物業！`, {}, p); return; }
      if (p.homePlot === null) {
        const cost = buildCost(this.g, this.b, pl, PLOT.HOME);
        if (p.cash < cost) return;
        if (!p.ai) this.speak(p, L.choose, 1);
        const ok = await this.ask(p, msg('SelectBuilding', 'homeTitle') + '\n' + msg('SelectBuilding', 'homeText', cost), { title: `${plot.lotId}號地` },
          AI.wantHome(this.g, p, cost), `${this.name(p)}購入 ${plot.lotId}號地 興建${plotTypeName(PLOT.HOME, ancient)}（$${cost}）`);
        if (!ok) return;
        await this.pay(p, cost);
        this.sfxi(SFXI.build);
        this.speak(p, L.home);
        await this.view.construct(pl, false, () => { this.g.plots[pl] = { owner: p.seat, type: PLOT.HOME, level: 0 }; });
        this.g.plots[pl] = { owner: p.seat, type: PLOT.HOME, level: 0 }; p.homePlot = pl;
        return;
      }
      // Build options by type id: 3 住宅 / 1 士多 / 2 食肆 (labels follow map family; costs from ExtText)
      const costs: Record<number, number> = {
        [PLOT.SHOP]: buildCost(this.g, this.b, pl, PLOT.SHOP),
        [PLOT.RESTAURANT]: buildCost(this.g, this.b, pl, PLOT.RESTAURANT),
        [PLOT.RESIDENCE]: buildCost(this.g, this.b, pl, PLOT.RESIDENCE),
      };
      const order = [PLOT.RESIDENCE, PLOT.SHOP, PLOT.RESTAURANT]; // UI order matches original SelectBuilding rows
      const costKeys = ['building1', 'building2', 'building3'] as const; // ExtText still says 住宅/商業中心/食肆
      const opts: ChoiceOpt[] = order.map((ty, i) => ({
        label: plotTypeName(ty, ancient),
        sub: msg('SelectBuilding', costKeys[i], costs[ty]),
        disabled: p.cash < costs[ty],
      }));
      if (opts.every(o => o.disabled)) return;
      let type: number;
      if (p.ai) {
        type = AI.chooseBuild(this.g, p, costs);
        if (type < 0) return;
      } else {
        this.speak(p, L.choose, 1); // VERIFIED: line 29 when the building-type selector opens (@0x417c40)
        const pick = await this.ui.choose(msg('SelectBuilding', 'title'), opts, { title: `${plot.lotId}號地  地價 ${landPrice(this.g, this.b, pl)}`, cancel: msg('SelectBuilding', 'exit') });
        if (pick < 0) return;
        type = order[pick];
      }
      const tname = plotTypeName(type, ancient);
      if (p.ai) this.ui.toast(`${this.name(p)}在 ${plot.lotId}號地 興建${tname}（$${costs[type]}）`, { seat: p.seat });
      await this.pay(p, costs[type]);
      this.sfxi(SFXI.build);
      this.speak(p, L.buy);
      await this.view.construct(pl, false, () => { this.g.plots[pl] = { owner: p.seat, type, level: 0 }; });
      this.g.plots[pl] = { owner: p.seat, type, level: 0 };
      return;
    }
    if (ps.owner === p.seat) {
      // Own tile: type-specific actions, then optional upgrade (max level 3)
      if (ps.type === PLOT.HOME) await this.homeBank(p);
      else if (hasOwnerInvest(ps.type)) await this.ownerInvest(p, pl);
      if (ps.level >= RULES.maxLevel || p.status.confused > 0) return;
      const cost = upgradeCost(this.g, this.b, pl);
      if (p.cash < cost) return;
      const ok = await this.ask(p, msg('SelectBuilding', 'uplevelBuilding', cost), { title: `${plot.lotId}號地  等級 ${ps.level + 1} → ${ps.level + 2}` },
        AI.wantUpgrade(this.g, p, cost), `${this.name(p)}將 ${plot.lotId}號地 升至 ${ps.level + 2} 級（$${cost}）`);
      if (!ok) return;
      await this.pay(p, cost);
      this.sfxi(SFXI.build);
      this.speak(p, GOOD);
      await this.view.construct(pl, false, () => { ps.level++; });
      return;
    }
    // Opponent's property — VERIFIED FUN_00417b90: type 3 (住宅) never charges; 1/2 rent value/2; 4 visit %
    const owner = this.g.players[ps.owner];
    if (!owner.alive) return;
    if (p.status.wealthGod > 0) { this.speak(p, GOOD); await this.info(msg('Misc', 'GiveMoney0'), {}, p); return; }
    if (owner.status.hospital > 0) { await this.info(msg('Misc', 'GiveMoney4', this.name(owner)), {}, p); return; }
    if (owner.status.jail > 0) { await this.info(msg('Misc', 'GiveMoney5', this.name(owner)), {}, p); return; }
    if (ps.type === PLOT.RESIDENCE) return; // 住宅：訪客不付錢
    const fee = rentFee(ps, plotValue(this.g, this.b, pl), p.cash);
    if (fee <= 0) return;
    let text: string;
    if (ps.type === PLOT.HOME) text = msg('Misc', 'GiveMoney3', this.name(owner), fee);
    else text = msg('Misc', ps.type === PLOT.SHOP ? 'GiveMoney2' : 'GiveMoney1', this.name(owner), fee);
    await this.pay(p, fee, owner);
    // VERIFIED (@0x417da0 / 0x417e9f): payer reacts BAD, owner reacts GOOD
    this.speak(p, BAD);
    setTimeout(() => this.speak(owner, GOOD, 1), 900);
    await this.info(text, {}, p);
  }

  /** 家：到家可存錢 / 取錢（INFERRED UI；金額預設一半或全部）. */
  async homeBank(p: Player) {
    const ancient = MAPS[this.g.map].ancient;
    const title = plotTypeName(PLOT.HOME, ancient);
    if (p.ai) {
      // keep a cash reserve; park surplus at home; withdraw when broke
      if (p.cash > AI.reserve(this.g) * 2) {
        const dep = Math.floor(p.cash * RULES.homeDepositPct / 100);
        if (dep > 0) {
          p.cash -= dep; p.home += dep;
          this.view.float(`存入${title} ${dep}`, this.view.actor(p.seat).x, this.view.actor(p.seat).y - 130, '#9fe8ff');
          if (!TURBO) void sfx('season/drip');
          this.speak(p, L.home, 1);
          this.ui.toast(`${this.name(p)}存入${title} $${dep}`, { seat: p.seat });
          this.onChange();
        }
      } else if (p.cash < AI.reserve(this.g) && p.home > 0) {
        const w = Math.min(p.home, AI.reserve(this.g) - p.cash);
        p.home -= w; p.cash += w;
        this.view.float(`取出 ${w}`, this.view.actor(p.seat).x, this.view.actor(p.seat).y - 130, '#ffe36a');
        this.ui.toast(`${this.name(p)}從${title}取出 $${w}`, { seat: p.seat });
        this.onChange();
      }
      return;
    }
    const opts: ChoiceOpt[] = [
      { label: '存錢', sub: `手上現金 $${p.cash}`, disabled: p.cash <= 0 },
      { label: '取錢', sub: `${title}存款 $${p.home}`, disabled: p.home <= 0 },
    ];
    if (opts.every(o => o.disabled)) return;
    this.speak(p, L.home, 1);
    const pick = await this.ui.choose(`回到${title}，要存錢或取錢嗎？`, opts, { title, cancel: '不用了' });
    if (pick < 0) return;
    if (pick === 0) {
      const half = Math.floor(p.cash * RULES.homeDepositPct / 100);
      const amtOpts: ChoiceOpt[] = [
        { label: `存入一半（$${half}）`, disabled: half <= 0 },
        { label: `全部存入（$${p.cash}）`, disabled: p.cash <= 0 },
      ];
      const a = await this.ui.choose('存多少？', amtOpts, { title, cancel: '取消' });
      if (a < 0) return;
      const dep = a === 0 ? half : p.cash;
      if (dep <= 0) return;
      p.cash -= dep; p.home += dep;
      this.view.float(`存入${title} ${dep}`, this.view.actor(p.seat).x, this.view.actor(p.seat).y - 130, '#9fe8ff');
      if (!TURBO) void sfx('season/drip');
    } else {
      const half = Math.floor(p.home / 2);
      const amtOpts: ChoiceOpt[] = [
        { label: `取出一半（$${half}）`, disabled: half <= 0 },
        { label: `全部取出（$${p.home}）`, disabled: p.home <= 0 },
      ];
      const a = await this.ui.choose('取多少？', amtOpts, { title, cancel: '取消' });
      if (a < 0) return;
      const w = a === 0 ? half : p.home;
      if (w <= 0) return;
      p.home -= w; p.cash += w;
      this.view.float(`取出 ${w}`, this.view.actor(p.seat).x, this.view.actor(p.seat).y - 130, '#ffe36a');
      this.sfxi(SFXI.gain, 0.7);
    }
    this.onChange();
  }

  /** 士多 / 食肆：所有者停靠時隨機投資盈虧（ExtText type1_1 / type1_2）. */
  async ownerInvest(p: Player, pl: number) {
    const pv = plotValue(this.g, this.b, pl);
    const delta = investDelta(pv);
    if (delta === 0) return;
    const amt = Math.abs(delta);
    if (delta > 0) {
      this.gain(p, amt); this.speak(p, GOOD);
      await this.info(msg('Misc', 'type1_1', amt), {}, p);
    } else {
      await this.pay(p, amt); this.speak(p, BAD);
      await this.info(msg('Misc', 'type1_2', amt), {}, p);
    }
  }

  // ---------------- chance ----------------
  drawCardId() { return 1 + Math.floor(Math.random() * D.words.length); }
  giveCard(p: Player, id: number) { if (p.cards.length < RULES.cardMax) p.cards.push(id); this.onChange(); }

  async chance(p: Player) {
    let pool = D.chance;
    if (p.status.badGod > 0) pool = pool.filter(c => c.kind === 'bad');
    const card: ChanceCard = pool[Math.floor(Math.random() * pool.length)];
    let amount = 0; let gotCard = 0;
    const e0 = card.effects.find(e => e.op === 'add_cash');
    if (e0) amount = scale(Math.abs(e0.amount), this.g.week);
    if (card.effects.some(e => e.op === 'gain_word_card')) gotCard = this.drawCardId();
    const text = fmt(card.text, card.text.includes('%s') ? D.words[gotCard - 1]?.title ?? '' : amount);
    this.sfxi(card.kind === 'lucky' ? SFXI.lucky : SFXI.bad);
    this.speak(p, card.kind === 'lucky' ? L.goodLuck : L.badLuck); // VERIFIED line 26 for lucky (@0x41753a)
    // chance cards are informational: they auto-close on AI turns (never wait for input)
    await this.ui.message(text, { title: card.title, image: 'images/cards/' + card.jpg, voice: card.voice, ai: p.ai, kind: 'chance' });
    for (const e of card.effects) {
      if (!p.alive) return;
      await this.applyChance(p, e, amount, gotCard);
    }
  }

  async applyChance(p: Player, e: any, amount: number, gotCard: number) {
    const g = this.g, b = this.b;
    const opp = this.alive().filter(o => o.seat !== p.seat);
    switch (e.op) {
      case 'add_cash': if (e.amount >= 0) this.gain(p, amount); else await this.pay(p, amount); break;
      case 'upgrade_owned_property': case 'upgrade_random_property': {
        const own = ownedPlots(g, p).filter(i => e.delta > 0 ? g.plots[i]!.level < RULES.maxLevel : g.plots[i]!.level > 0);
        if (!own.length) break;
        const pl = own[Math.floor(Math.random() * own.length)];
        const pv = this.b.plots[pl]; this.view.focusOn(pv.x, pv.y);
        if (e.delta > 0) this.sfxi(SFXI.build);
        await this.view.construct(pl, e.delta < 0, () => { g.plots[pl]!.level += e.delta; });
        break;
      }
      case 'gain_word_card': if (gotCard) this.giveCard(p, gotCard); break;
      case 'lose_word_card': if (p.cards.length) { p.cards.splice(Math.floor(Math.random() * p.cards.length), 1); this.speak(p, L.jackpotLose); } break;
      case 'take_percent_cash_from': case 'take_percent_cash_from_richest': {
        if (!opp.length) break;
        const r = opp.sort((a, c) => netWorth(g, b, c) - netWorth(g, b, a))[0];
        await this.pay(r, Math.floor(Math.max(0, r.cash) * e.percent / 100), p); break;
      }
      case 'give_percent_cash_to': case 'give_percent_cash_to_poorest': {
        if (!opp.length) break;
        const r = opp.sort((a, c) => netWorth(g, b, a) - netWorth(g, b, c))[0];
        await this.pay(p, Math.floor(Math.max(0, p.cash) * e.percent / 100), r); break;
      }
      case 'move_steps': await this.move(p, e.steps ?? 1); await this.land(p); break;
      case 'roll_again': this.extraRoll = true; break;
      case 'teleport': await this.teleportTo(p, e.target === 'home' && p.homePlot !== null ? b.plots[p.homePlot].tiles[0] : this.nearestBank(p)); break;
      case 'gain_free_property': {
        const free = g.plots.map((ps, i) => (ps ? -1 : i)).filter(i => i >= 0);
        if (!free.length) break;
        const pl = free[Math.floor(Math.random() * free.length)];
        const pv = b.plots[pl]; this.view.focusOn(pv.x, pv.y);
        this.sfxi(SFXI.build);
        const st = p.homePlot === null ? { owner: p.seat, type: PLOT.HOME, level: 0 } : { owner: p.seat, type: PLOT.SHOP + Math.floor(Math.random() * 3), level: 0 };
        await this.view.construct(pl, false, () => { g.plots[pl] = st; });
        g.plots[pl] = st; if (st.type === PLOT.HOME) p.homePlot = pl;
        break;
      }
      case 'set_status': await this.sendTo(p, e.status === 'jail' ? 'jail' : 'hospital', e.weeks ?? 1); break;
      case 'hospital': await this.sendTo(p, 'hospital', e.weeks); break;
      case 'jail': await this.sendTo(p, 'jail', e.weeks); break;
      case 'lose_home_money_percent': {
        if (p.locks > 0) { p.locks--; this.speak(p, L.lock); await this.info('幸好門窗已鎖好，小偷無功而還！', {}, p); break; }
        const amt = Math.floor(p.home * e.percent / 100); p.home -= amt; this.speak(p, L.robbed);
        if (amt) this.view.float('-' + amt + '（屋企）', this.view.actor(p.seat).x, this.view.actor(p.seat).y - 120, '#ff6b5b'); break;
      }
      case 'reverse_direction': this.reverse(p); break;
      case 'skip_turn': p.status.skip += e.turns ?? 1; break;
      case 'lose_property': case 'lose_random_property': {
        const own = ownedPlots(g, p).filter(i => i !== p.homePlot);
        const list = own.length ? own : ownedPlots(g, p);
        if (!list.length) break;
        const pl = list[Math.floor(Math.random() * list.length)];
        const pv = b.plots[pl]; this.view.focusOn(pv.x, pv.y);
        await this.view.construct(pl, true, () => { g.plots[pl] = null; });
        g.plots[pl] = null; if (p.homePlot === pl) p.homePlot = null;
        this.speak(p, L.hitByCard); break;
      }
    }
    this.onChange();
  }

  nearestBank(p: Player) {
    const t = this.b.tiles[p.tile];
    return [...this.b.bankTiles].sort((a, c) => Math.hypot(this.b.tiles[a].x - t.x, this.b.tiles[a].y - t.y) - Math.hypot(this.b.tiles[c].x - t.x, this.b.tiles[c].y - t.y))[0];
  }
  reverse(p: Player) { const fwd = this.b.options(p.tile, p.prev); p.prev = fwd[0]; this.view.placeActor(p.seat, p.tile, p.prev); }
  async sendTo(p: Player, where: 'hospital' | 'jail', weeks: number) {
    await this.teleportTo(p, where === 'hospital' ? this.b.hospitalTile : this.b.jailTile);
    // VERIFIED: hospital → line 22, jail → line 23 (calls next to 'ho' / 'po')
    if (where === 'hospital') { p.status.hospital = weeks; this.speak(p, L.hospital); }
    else { p.status.jail = weeks; this.speak(p, L.jail); }
    this.view.actor(p.seat).anim = 'hit';
    await wait(600);
    this.view.actor(p.seat).anim = 'stand';
  }

  // ---------------- word cards ----------------
  async useCardInteractive(p: Player, id: number) {
    const c = D.words[id - 1];
    let target = p.seat;
    const opp = this.alive().filter(o => o.seat !== p.seat).map(o => o.seat);
    if (c.selectPlayer === -1) { await this.ui.message(`「${c.title}」會在被攻擊時自動生效。`); return; }
    if (c.selectPlayer === 1 || c.selectPlayer === 2) {
      const cands = c.selectPlayer === 2 ? [p.seat, ...opp] : opp;
      if (!cands.length) { await this.ui.message(msg('Misc', 'SelectCardError')); return; }
      const t = await this.ui.pickPlayer(msg('Misc', 'SelectCardTager'), cands);
      if (t < 0) return;
      target = t;
    }
    await this.useCard(p, id, target);
  }

  async useCard(p: Player, id: number, targetSeat: number) {
    const c: WordCard = D.words[id - 1];
    const i = p.cards.indexOf(id); if (i < 0) return;
    p.cards.splice(i, 1);
    const T = this.g.players[targetSeat];
    const va = this.view.actor(p.seat);
    va.anim = 'use'; this.speak(p, L.attack); this.sfxi(SFXI.useCard); // VERIFIED line 5 + SFX 12 (用卡)
    void this.view.fx('map/usecard', va.x, va.y - 50, 26);
    const caption = `${this.name(p)}使用四字真言「${c.title}」${T.seat !== p.seat ? '對' + this.name(T) : ''}！`;
    if (p.ai) {
      // AI casts never block: brief toast with the card art + the cast/hit animations
      this.ui.toast(caption, { cardId: id, seat: p.seat, ms: 2600 });
      await wait(900);
    } else {
      await this.ui.message(c.text, { title: c.title, image: 'images/cards/' + c.jpg, kind: 'card', cardId: id, caption });
    }
    va.anim = 'stand';
    if (T.seat !== p.seat) {
      if (T.status.cardImmune > 0) { this.speak(T, L.defended); this.speak(p, L.blocked, 1); await this.info(msg('Misc', 'CantAttack2'), {}, p); return; }
      const k = T.cards.indexOf(16);
      if (k >= 0) { T.cards.splice(k, 1); this.speak(T, L.defended); await this.info(msg('Misc', 'CantAttack1', D.words[15].title), {}, p); return; }
      const ta = this.view.actor(T.seat); ta.anim = 'hit'; void this.view.fx('map/cardhit', ta.x, ta.y - 60, 24);
      this.sfxi(SFXI.cardHit); this.speak(T, L.hitByCard); // VERIFIED line 7 + SFX 17 (被用卡)
      await wait(700); ta.anim = 'stand';
    }
    const W = RULES.statusWeeks;
    switch (id) {
      case 1: { // 人棄我取: half of target home money dumped outside their home
        const amt = Math.floor(T.home / 2); T.home -= amt;
        const tile = T.homePlot !== null ? this.b.plots[T.homePlot].tiles[0] : T.tile;
        if (amt > 0) this.g.roadMoney.push({ tile, amount: amt });
        await this.info(`${this.name(T)}的屋企有 ${amt} 元被棄置在門外！`, {}, p); break;
      }
      case 2: { // 一視同仁
        const al = this.alive(); const tot = al.reduce((a, o) => a + Math.max(0, o.cash), 0); const each = Math.floor(tot / al.length);
        for (const o of al) { const d = each - Math.max(0, o.cash); o.cash = each; this.view.money(o.seat, d); }
        break;
      }
      case 3: this.reverse(T); break;
      case 4: p.chooseSteps = true; break;
      case 5: { const amt = Math.floor(T.home * Number(c.rawResult || 20) / 100); T.home -= amt; this.gain(p, amt); break; }
      case 6: T.status.confused = W; break;
      case 7: T.status.frozen = W; this.view.actor(T.seat).tint = 'hue-rotate(180deg) saturate(0.6) brightness(1.2)'; setTimeout(() => { this.view.actor(T.seat).tint = undefined; }, 1500); break;
      case 8: T.status.dropMoney = W; break;
      case 9: if (p.homePlot !== null) await this.teleportTo(p, this.b.plots[p.homePlot].tiles[0]); break;
      case 10: await this.teleportTo(p, this.nearestBank(p)); await this.salary(p); break;
      case 11: p.status.badGod = 0; break;
      case 12: p.status.cardImmune = W; break;
      case 13: p.status.badGodImmune = W; p.status.badGod = 0; break;
      case 14: p.status.smallmanImmune = W; break;
      case 15: Object.assign(p.status, { confused: 0, frozen: 0, dropMoney: 0, badGod: 0 }); break;
    }
    this.onChange();
  }

  // ---------------- specials ----------------
  /**
   * 小遊戲 tile (FUN_00416ff0 case 5): board BGM stops, a random game (rand()%4) starts with EVERY eligible player —
   * not bankrupt, not in hospital / jail, not under status 5 (一曝十寒 in the HUD status table). Rewards (VERIFIED):
   * 01 畫展 / 04 吹氣球 → the winner spins the word-card reel (nothing on TIME IS UP); 02 / 03 → each player's cash
   * += score (02: rhythm points, 03: hits×10).
   */
  async minigame(p: Player) {
    const parts = this.g.players.filter(q => q.alive && q.status.hospital <= 0 && q.status.jail <= 0 && q.status.frozen <= 0);
    if (!parts.length) return;
    const force = (globalThis as any).__forceMini; // tests
    const game = typeof force === 'number' ? force : Math.floor(Math.random() * 4);
    music(null);
    const r = await this.ui.minigame(game, parts.map(q => q.seat));
    if (this.stopped) return;
    music(MAPS[this.g.map].music[season(this.g)]);
    if (r.winner !== null && r.cardId) {
      const w = this.g.players[r.winner];
      this.giveCard(w, r.cardId); this.speak(w, L.win);
      this.ui.toast(msg('Misc', 'winnerMsg', this.name(w), D.words[r.cardId - 1]?.title ?? ''), { cardId: r.cardId, seat: w.seat });
    } else if (game === 0 || game === 3) this.ui.toast('時間到！沒有人勝出');
    r.scores.forEach((sc, seat) => { if (sc && sc > 0) this.gain(this.g.players[seat], sc); });
    void p;
  }

  async jockey(p: Player) {
    const ticket = scale(RULES.jockeyTicket, this.g.week);
    if (p.cash < ticket) return;
    this.speak(p, L.jockey); // VERIFIED line 19 (@0x417210)
    const ok = await this.ask(p, msg('Misc', 'Jclub', this.g.jackpot) + `\n（馬票每張 ${ticket} 元）`, { title: '馬會' }, AI.wantJockey(this.g, p, ticket), `${this.name(p)}購買馬票（$${ticket}）`);
    if (!ok) return;
    await this.pay(p, ticket);
    const win = Math.random() < RULES.jockeyWinChance * (p.char === 6 ? 1.5 : 1);
    if (win) {
      const amt = this.g.jackpot; this.g.jackpot = RULES.jackpotInit;
      this.gain(p, amt); this.speak(p, L.jackpotWin, 3); // VERIFIED pair 20/21 (@0x4109ce / 0x4109b4)
      await this.info(`恭喜！${this.name(p)}中了頭獎，獨得 ${amt} 元！`, { title: '馬會', badge: 'luckydraw' }, p);
    } else {
      this.g.jackpot += ticket;
      this.speak(p, L.jackpotLose);
      await this.info('今期沒有中獎，下次再試吧！', { title: '馬會' }, p);
    }
  }

  async transport(p: Player) {
    const kind = this.b.tiles[p.tile].transport;
    const others = this.b.tiles.filter(t => t.transport === kind && t.id !== p.tile).map(t => t.id);
    const label = kind === 'ferry_transport' ? '渡海小輪' : kind === 'horse_cart_transport' ? '馬車' : '電車';
    const dest = others.length ? others[Math.floor(Math.random() * others.length)] : this.b.bankTiles[Math.floor(Math.random() * this.b.bankTiles.length)];
    const ok = await this.ask(p, `要乘搭${label}嗎？`, { title: label }, Math.random() < 0.6, `${this.name(p)}乘搭${label}`);
    if (!ok) return;
    await this.teleportTo(p, dest);
    // Resolve destination tile effects, but never re-open transport (pairs on 九龍/古代 would loop A↔B)
    await this.land(p, { skipTransport: true });
  }

  async smallman(p: Player) {
    const fee = scale(RULES.smallmanFee, this.g.week);
    const opp = this.alive().filter(o => o.seat !== p.seat).map(o => o.seat);
    if (!opp.length || p.cash < fee) return;
    let t: number;
    if (p.ai) {
      if (!AI.wantSmallman(this.g, p, fee)) return;
      t = AI.pickRichestOpponent(this.g, this.b, p, opp);
      this.ui.toast(`${this.name(p)}打${this.name(t)}的小人（$${fee}）`, { seat: p.seat });
    } else {
      const ok = await this.ui.confirm(msg('Misc', 'SelectSmallMan', fee), { title: '打小人' });
      if (!ok) return;
      t = await this.ui.pickPlayer('你要打誰的小人？', opp);
      if (t < 0) return;
    }
    await this.pay(p, fee);
    const T = this.g.players[t];
    if (T.status.smallmanImmune > 0 || T.status.badGodImmune > 0) {
      this.speak(T, L.defended);
      await this.info(`${this.name(T)}有四字真言護身，打小人失效！`, {}, p); return;
    }
    T.status.badGod = RULES.badGodWeeks;
    this.speak(T, L.eerie); // line 24 (有股陰風吹過…)
    await this.info(`${this.name(T)}被打小人，衰神附身 ${RULES.badGodWeeks} 個星期！`, {}, p);
  }

  async landmark(p: Player, lm: Landmark) {
    const wk = this.g.week;
    if (lm.kind === 'sp' && lm.sp) {
      const txt = D.main.SpBuilding?.['c' + lm.sp] ?? '';
      const fee = lm.value ? scale(lm.value, wk) : 0;
      if (p.status.wealthGod > 0 && txt.includes('%d')) { this.speak(p, GOOD); await this.info(msg('Misc', 'GiveMoney0'), {}, p); return; }
      if (txt.includes('%d') && fee) this.speak(p, BAD);
      await this.info(fmt(txt, fee), { title: '特別建築' }, p);
      if (txt.includes('%d') && fee) await this.pay(p, fee);
      const stay = RULES.spStay[lm.sp]; if (stay) p.status.stay = Math.max(p.status.stay, stay);
    } else if (lm.kind === 'te') {
      const fee = scale(RULES.templeFee, wk); if (p.cash < fee) return;
      const ok = await this.ask(p, msg('Misc', 'TeMsg1', fee), { title: '廟' }, AI.wantTemple(this.g, p, fee), `${this.name(p)}到廟上香（$${fee}）`);
      if (!ok) return;
      await this.pay(p, fee);
      const id = this.drawCardId(); this.giveCard(p, id);
      this.speak(p, GOOD);
      await this.info(msg('Misc', 'TeMsg2', D.words[id - 1].title), { title: '廟', image: 'images/cards/' + D.words[id - 1].jpg, kind: 'card', cardId: id }, p);
    } else if (lm.kind === 'lo') {
      const fee = scale(RULES.lockFee, wk); if (p.cash < fee) return;
      const ok = await this.ask(p, msg('Misc', 'LockMsg', fee), { title: '鎖匠店' }, AI.wantLock(this.g, p, fee), `${this.name(p)}在鎖匠店加裝門鎖（$${fee}）`);
      if (!ok) return;
      await this.pay(p, fee); p.locks++; this.speak(p, L.lock);
    }
  }

  async npcEvent(p: Player) {
    if (Math.random() >= RULES.npcEventChance) return;
    const r = Math.random();
    const a = this.view.actor(p.seat);
    if (r < 0.3) { // thief
      if (p.home <= 0) return;
      if (p.locks > 0) { p.locks--; this.speak(p, L.lock); await this.info('小偷想光顧' + this.name(p) + '的家，但門窗已鎖好！', { title: charName(7) }, p); return; }
      const amt = Math.floor(p.home * (0.1 + Math.random() * 0.2)); p.home -= amt;
      this.speak(p, L.robbed); // VERIFIED line 15 next to NPC/ThiefMsg
      await this.info(msg('NPC', 'ThiefMsg', this.name(p), amt), { title: charName(7), kind: 'npc' }, p);
    } else if (r < 0.5) { // thug / tiger
      const tiger = this.b.key === 'ancient';
      if (p.status.cardImmune > 0) return;
      await this.info(msg('NPC', tiger ? 'PK3' : 'PK1', this.name(p)), { title: tiger ? '猛虎' : charName(8), image: 'images/cards/' + (tiger ? 'tiger_attack.jpg' : 'character08_attack.jpg'), kind: 'npc' }, p);
      await this.sendTo(p, 'hospital', 3);
      this.speak(p, L.assaulted); // VERIFIED line 16 next to 'ho'
    } else if (r < 0.75) { // god of wealth
      this.sfxi(SFXI.godIn);
      void this.view.fx('map/godin', a.x, a.y, 24);
      p.status.wealthGod = RULES.wealthGodWeeks; this.speak(p, GOOD);
      await this.info(`${charName(10)}降臨！` + msg('Misc', 'GiveMoney0'), { title: charName(10), kind: 'npc' }, p);
    } else { // card god
      const id = this.drawCardId(); this.giveCard(p, id);
      this.sfxi(SFXI.godIn);
      void this.view.fx('map/godin', a.x, a.y, 24);
      this.speak(p, GOOD); // VERIFIED GOOD table next to CardGodMsg
      await this.info(msg('Misc', 'CardGodMsg', charName(12), D.words[id - 1].title, this.name(p)), { title: charName(12), image: 'images/cards/' + D.words[id - 1].jpg, kind: 'card', cardId: id }, p);
    }
  }
}

export { SEASONS, value };
