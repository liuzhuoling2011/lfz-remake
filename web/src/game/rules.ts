import { RULES, PLOT } from './config';
import type { Board } from './board';
import type { GameState, Player, PlotState } from './state';

/** VERIFIED FUN_0040e9a0: +10% per 13 (weeks) */
export function scale(base: number, week: number) {
  let v = base;
  for (let i = 0; i < Math.floor(week / RULES.weeksPerSeason); i++) v = Math.floor(v * RULES.inflationPct / 100);
  return v;
}
/** VERIFIED FUN_0040e9f0 value = ((pct[level]*base)/100 * mult[type])/100 ; type 4 → 0 (house mult) */
export function value(base: number, type: number, level: number) {
  // remake level 0..2 = exe level 1..3 (exe builds at level 1, @0x4174c1); type 4 (屋企) uses mult[0]
  const t = type === PLOT.HOME ? 0 : type;
  const L = Math.min(RULES.levelPct.length - 1, level + 1);
  return Math.floor(Math.floor(RULES.levelPct[L] * base / 100) * RULES.typeMult[t] / 100);
}
export function landPrice(g: GameState, b: Board, plot: number) { return scale(b.plots[plot].base, g.week); }
/** VERIFIED @0x40c33e / @0x4128d2: build cost = value(land, type, exe level 1). 屋企 = land price (= value(land,0,1)). */
export function buildCost(g: GameState, b: Board, plot: number, type: number) {
  const base = landPrice(g, b, plot);
  return type === PLOT.HOME ? base : value(base, type, 0);
}
/** VERIFIED @0x417c92 / @0x410909: upgrade cost = the building's current value(land, type, level). */
export function upgradeCost(g: GameState, b: Board, plot: number) {
  const ps = g.plots[plot]!; const base = landPrice(g, b, plot);
  return value(base, ps.type, ps.level);
}
export function plotValue(g: GameState, b: Board, plot: number) {
  const ps = g.plots[plot]; if (!ps) return 0;
  return value(landPrice(g, b, plot), ps.type, ps.level);
}
export function netWorth(g: GameState, b: Board, p: Player) {
  let w = p.cash + p.home;
  g.plots.forEach((ps, i) => { if (ps && ps.owner === p.seat) w += plotValue(g, b, i); });
  return w;
}
export function ownedPlots(g: GameState, p: Player) {
  const r: number[] = []; g.plots.forEach((ps, i) => { if (ps && ps.owner === p.seat) r.push(i); }); return r;
}
export const season = (g: GameState) => Math.floor(g.week / RULES.weeksPerSeason) % 4;
export const yearOf = (g: GameState) => Math.floor(g.week / 52) + 1;

/**
 * Rent / visit fee when another player lands on an owned plot.
 * VERIFIED FUN_00417b90: type ∈ {1,2,4} collect; type 3 (住宅) pays nothing.
 * - HOME (4): (5..10)% of lander’s cash
 * - SHOP/RESTAURANT (1/2): value/2
 * - RESIDENCE (3): 0
 */
export function rentFee(ps: PlotState, plotVal: number, landerCash: number, visitPct?: number): number {
  if (ps.type === PLOT.RESIDENCE) return 0;
  if (ps.type === PLOT.HOME) {
    const pct = visitPct ?? (RULES.visitPctMin + Math.floor(Math.random() * (RULES.visitPctMax - RULES.visitPctMin + 1)));
    return Math.floor(Math.max(0, landerCash) * pct / 100);
  }
  if (ps.type === PLOT.SHOP || ps.type === PLOT.RESTAURANT) return Math.floor(plotVal / 2);
  return 0;
}

/** Weekly 住宅 → homeMoney income for one plot. INFERRED %. */
export function residenceIncome(plotVal: number) {
  return Math.max(0, Math.floor(plotVal * RULES.residenceIncomePct / 100));
}

/**
 * Random commercial investment delta when owner lands on 士多/食肆.
 * Returns signed amount (positive = gain). Uses investPctMin..investPctMax of plot value.
 */
/**
 * 士多 owner investment — VERIFIED omasterq.exe @0x412912: X = land base price ([ctx+0x44], same base passed to the
 * value fn @0x40e9f0); delta = rand() % (4X) - 2X  → uniform integer in [-2X, 2X-1], every owner landing.
 * If land ctx [+0x14] == 1 (財神 type attached) the -2X is skipped (gain only, [0, 4X-1]); remake passes isWealthGod → `gainOnly`.
 */
export function investDelta(base: number, gainOnly = false, rnd = Math.random): number {
  const x = Math.max(1, Math.floor(base));
  return Math.floor(rnd() * 4 * x) - (gainOnly ? 0 : 2 * x);
}

/** Does this type charge rent to visitors? */
export function chargesRent(type: number) {
  return type === PLOT.SHOP || type === PLOT.RESTAURANT || type === PLOT.HOME;
}

/** Owner landing triggers random investment (士多 / 食肆). */
export function hasOwnerInvest(type: number) {
  return type === PLOT.SHOP; // 食肆：所有者停靠無投資盈虧（只有士多有）
}
