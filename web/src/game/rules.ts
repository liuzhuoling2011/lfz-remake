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
  const t = type === PLOT.HOME ? 0 : type;
  return Math.floor(Math.floor(RULES.levelPct[level] * base / 100) * RULES.typeMult[t] / 100);
}
export function landPrice(g: GameState, b: Board, plot: number) { return scale(b.plots[plot].base, g.week); }
/** Cost to build type at level 0 on an empty plot (INFERRED: pay the building's value). Home costs the land price. */
export function buildCost(g: GameState, b: Board, plot: number, type: number) {
  const base = landPrice(g, b, plot);
  return type === PLOT.HOME ? base : value(base, type, 0);
}
/** Upgrade cost from level L to L+1 = value difference (INFERRED). */
export function upgradeCost(g: GameState, b: Board, plot: number) {
  const ps = g.plots[plot]!; const base = landPrice(g, b, plot);
  return value(base, ps.type, ps.level + 1) - value(base, ps.type, ps.level);
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
export function investDelta(plotVal: number, pct?: number): number {
  const lo = RULES.investPctMin, hi = RULES.investPctMax;
  const p = pct ?? (lo + Math.floor(Math.random() * (hi - lo + 1)));
  return Math.floor(plotVal * p / 100);
}

/** Does this type charge rent to visitors? */
export function chargesRent(type: number) {
  return type === PLOT.SHOP || type === PLOT.RESTAURANT || type === PLOT.HOME;
}

/** Owner landing triggers random investment (士多 / 食肆). */
export function hasOwnerInvest(type: number) {
  return type === PLOT.SHOP || type === PLOT.RESTAURANT;
}
