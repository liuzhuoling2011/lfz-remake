// AI policy (INFERRED, driven by character attrack permutations from spec/data/ai_rules.json).
import { D } from './data';
import { RULES, PLOT } from './config';
import type { Board } from './board';
import type { GameState, Player } from './state';
import { netWorth, scale, ownedPlots } from './rules';

function attrack(p: Player): number[] {
  return D.ai?.attrack?.['character' + String(p.char).padStart(2, '0')]?.order ?? [1, 2, 0, 3, 4, 5];
}
/** rank (0 best) of an attrack index */
function pref(p: Player, idx: number) { const o = attrack(p); const r = o.indexOf(idx); return r < 0 ? 9 : r; }
export function reserve(g: GameState) { return scale(800, g.week); }
export function aggressive(p: Player) { return pref(p, 3) <= 2; }

/** choose building type 1 shop / 2 restaurant / 3 house given costs; -1 = skip */
export function chooseBuild(g: GameState, p: Player, costs: Record<number, number>): number {
  const opts = [1, 2, 3].filter(t => p.cash - costs[t] >= reserve(g) * 0.5);
  if (!opts.length) return -1;
  const idx: Record<number, number> = { 1: 1, 2: 2, 3: 0 };
  opts.sort((a, b) => pref(p, idx[a]) - pref(p, idx[b]) || costs[b] - costs[a]);
  return opts[0];
}
export function wantUpgrade(g: GameState, p: Player, cost: number) { return p.cash - cost >= reserve(g); }
export function wantHome(g: GameState, p: Player, cost: number) { return p.cash - cost >= 0; }
export function wantJockey(g: GameState, p: Player, ticket: number) {
  const lucky = p.char === 6 ? 0.75 : 0.4;
  return p.cash - ticket > reserve(g) * 2 && Math.random() < lucky;
}
export function wantTemple(g: GameState, p: Player, fee: number) { return p.cards.length < 4 && p.cash - fee > reserve(g) * 1.5; }
export function wantLock(g: GameState, p: Player, fee: number) { return p.locks < 2 && p.home > fee * 5; }
export function wantSmallman(g: GameState, p: Player, fee: number) { return p.cash - fee > reserve(g) * 2 && (aggressive(p) || Math.random() < 0.4); }

export function pickRichestOpponent(g: GameState, b: Board, p: Player, cand: number[]) {
  return [...cand].sort((a, c) => netWorth(g, b, g.players[c]) - netWorth(g, b, g.players[a]))[0];
}

/**
 * AI card pick — VERIFIED gates from exe grey tables @0x44224c/5c/6c + card apply skip when target kind>8.
 * Full binary card-picker algorithm is a HARD WALL (attrack lives in character txt; no clear pick routine in omasterq).
 * Heuristic below: respect usable table, clear 6/7 first, 驅鬼 when god, then attrack-biased offense.
 */
const CARD_ENABLE_GOD = [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0];
const CARD_ENABLE_NORMAL = [1,1,1,1,1,1,1,1,1,1,0,1,1,1,0,0];
const CARD_ENABLE_CLEAR = [1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0];

function cardUsableAI(g: GameState, p: Player, id: number) {
  const i = id - 1; if (i < 0 || i > 15) return false;
  const god = !!(g.mapGod && g.mapGod.attachedTo === p.seat && p.status.kind >= 9 && p.status.kind <= 12);
  const tab = god ? CARD_ENABLE_GOD
    : (p.status.kind === 6 || p.status.kind === 7) ? CARD_ENABLE_CLEAR
    : CARD_ENABLE_NORMAL;
  return tab[i] === 1;
}

/** Decide whether to use a word card before rolling. Returns {card, target} or null. */
export function chooseCard(g: GameState, b: Board, p: Player): { card: number; target: number } | null {
  if (!p.cards.length) return null;
  // Match exe @0x40d530: skip hospital / jail / frozen (status 1/2/5) as well as the bankrupt.
  const opp = g.players.filter(o => o.alive && o.seat !== p.seat && o.status.hospital <= 0 && o.status.jail <= 0 && o.status.frozen <= 0);
  const s = p.status;
  const hand = [...new Set(p.cards)].filter(id => cardUsableAI(g, p, id));
  const has = (id: number) => hand.includes(id);
  // Priority: clear own 神智/得而 with 否極泰來 (only lit in CLEAR table)
  if ((s.kind === 6 || s.kind === 7) && has(15)) return { card: 15, target: p.seat };
  // VERIFIED table @0x44224c: while god attached only 驅鬼捉邪 (11) is usable
  if (s.kind >= 9 && s.kind <= 12) return has(11) ? { card: 11, target: p.seat } : null;
  if (!hand.length) return null;
  // Status-write cards fail on god targets (exe jg skip) — prefer non-god, non-immune
  const statusOk = opp.filter(o => o.status.kind <= 8 && o.status.cardImmune <= 0);
  const targets = statusOk.length ? statusOk : opp;
  if (!targets.length && !hand.some(id => [2, 4, 9, 10, 12, 13, 14].includes(id))) return null;
  const richest = targets.length ? pickRichestOpponent(g, b, p, targets.map(o => o.seat)) : p.seat;
  const R = g.players[richest] ?? p;
  // attrack index 3 = attack bias → higher play chance + prefer freeze/confuse/drop
  const atk = aggressive(p);
  const chance = atk ? 0.72 : 0.38;
  if (Math.random() > chance) return null;
  if (has(5) && R.home > 500) return { card: 5, target: richest };
  if (has(1) && R.home > 800) return { card: 1, target: richest };
  if (has(2)) {
    const pool = targets.length ? targets : opp;
    const avg = (pool.reduce((a, o) => a + o.cash, 0) + p.cash) / (pool.length + 1);
    if (avg > p.cash * 1.4) return { card: 2, target: p.seat };
  }
  // Offensive status: prefer when attrack ranks attack high; order 7→6→8 matches prior + freeze first
  const offense = atk ? [7, 6, 8] : [6, 7, 8];
  for (const c of offense) if (has(c) && targets.length) return { card: c, target: richest };
  if (has(10) && p.cash < reserve(g)) return { card: 10, target: p.seat };
  if (has(12) && opp.some(o => o.cards.length >= 2)) return { card: 12, target: p.seat };
  if (has(13) && s.kind !== 4 && Math.random() < 0.3) return { card: 13, target: p.seat };
  if (has(14) && s.kind !== 8 && Math.random() < 0.2) return { card: 14, target: p.seat };
  if (has(4)) return { card: 4, target: p.seat }; // 步步為營 — self, often useful
  if (has(3) && targets.length && Math.random() < 0.25) return { card: 3, target: richest };
  if (has(9) && p.homePlot !== null && Math.random() < 0.15) return { card: 9, target: p.seat };
  return null;
}

/** At a junction prefer the branch with more buyable/own lots in the next few tiles (lookahead). */
export function pickDirection(g: GameState, b: Board, p: Player, opts: number[]): number {
  let best = opts[0], bestScore = -1e9;
  for (const o of opts) {
    let score = Math.random() * 2, prev = p.tile, cur = o;
    for (let i = 0; i < 6; i++) {
      for (const pl of b.tiles[cur].plots) {
        const ps = g.plots[pl];
        if (!ps) score += 2; else if (ps.owner === p.seat) score += ps.level < 3 ? 1.5 : 0.5; else score -= 1 + ps.level;
      }
      if (b.tiles[cur].event === 'bank' || b.tiles[cur].event === 'gain') score += 1;
      if (b.tiles[cur].event === 'lose') score -= 0.5;
      const nx = b.options(cur, prev); prev = cur; cur = nx[0];
    }
    if (score > bestScore) { bestScore = score; best = o; }
  }
  return best;
}
export function pickSteps(g: GameState, b: Board, p: Player): number {
  let best = 1, bestS = -1e9;
  for (let s = 1; s <= 6; s++) {
    let cur = p.tile, prev = p.prev;
    for (let i = 0; i < s; i++) { const nx = b.options(cur, prev); prev = cur; cur = nx[0]; }
    let score = 0;
    for (const pl of b.tiles[cur].plots) { const ps = g.plots[pl]; score += !ps ? 3 : ps.owner === p.seat ? 2 : -3 - ps.level * 2; }
    const ev = b.tiles[cur].event; if (ev === 'bank') score += 3; if (ev === 'gain') score += 1; if (ev === 'lose') score -= 1; if (ev === 'chance') score += 0.5;
    if (score > bestS) { bestS = score; best = s; }
  }
  return best;
}
/** Desirability of ending a move on tile t (used by the dice policy). */
function tileScore(g: GameState, b: Board, p: Player, t: number) {
  const tile = b.tiles[t]; let s = 0;
  for (const pl of tile.plots) {
    const ps = g.plots[pl];
    if (!ps) s += p.cash > reserve(g) ? 3 : 0.5;
    else if (ps.owner === p.seat) s += ps.level < RULES.maxLevel ? 2 : 0.3;
    else if (ps.type === PLOT.RESIDENCE) s += 0.2; // 住宅不收租
    else { // rent / visit risk relative to cash
      const v = Math.floor(RULES.levelPct[ps.level + 1] * b.plots[pl].base / 100);
      s -= 1.5 + 4 * Math.min(1.5, v / Math.max(300, p.cash));
    }
  }
  const ev = tile.event;
  if (ev === 'bank') s += 3; else if (ev === 'gain') s += 1.2; else if (ev === 'lose') s -= 1.2; else if (ev === 'chance') s += 0.4;
  return s;
}
/**
 * One die or two? (original AI: second die = rand()%7, i.e. one die 1/7 of the time — VERIFIED @0x412356).
 * Remake policy: Monte-Carlo the landing tiles for 1d6 vs 2d6 along random fork choices and pick the better
 * expectation; mild bias to two dice (faster laps → more salary) like the original's 6:1 ratio.
 */
export function pickDice(g: GameState, b: Board, p: Player): 1 | 2 {
  const land = (steps: number) => {
    let cur = p.tile, prev = p.prev;
    for (let i = 0; i < steps; i++) { const o = b.options(cur, prev); const nx = o[Math.floor(Math.random() * o.length)]; prev = cur; cur = nx; }
    return tileScore(g, b, p, cur);
  };
  let one = 0, two = 0; const N = 3;
  for (let d = 1; d <= 6; d++) for (let k = 0; k < N; k++) one += land(d) / (6 * N);
  for (let d1 = 1; d1 <= 6; d1++) for (let d2 = 1; d2 <= 6; d2++) two += land(d1 + d2) / 36;
  if (Math.random() < 1 / 7) return Math.random() < 0.5 ? 1 : 2; // keep some of the original randomness
  return one > two + 0.6 ? 1 : 2;
}
export { ownedPlots, RULES };
