import { RULES } from './config';
import type { Board } from './board';

export interface Status {
  hospital: number; jail: number; frozen: number; confused: number; dropMoney: number;
  cardImmune: number; badGodImmune: number; smallmanImmune: number; skip: number; badGod: number; wealthGod: number; stay: number;
}
export interface Player {
  seat: number; char: number; ai: boolean; alive: boolean;
  cash: number; home: number; tile: number; prev: number;
  status: Status; cards: number[]; homePlot: number | null; locks: number; chooseSteps: boolean;
}
export interface PlotState { owner: number; type: number; level: number } // type 1 shop,2 restaurant,3 house,4 home
export interface RoadMoney { tile: number; amount: number }
export interface GameState {
  v: 1; map: number; weeksLimit: number; week: number; current: number;
  players: Player[]; plots: (PlotState | null)[]; jackpot: number; roadMoney: RoadMoney[];
  winner: number | null; rngSeed: number; turnCount: number;
}

export function emptyStatus(): Status {
  return { hospital: 0, jail: 0, frozen: 0, confused: 0, dropMoney: 0, cardImmune: 0, badGodImmune: 0, smallmanImmune: 0, skip: 0, badGod: 0, wealthGod: 0, stay: 0 };
}

/** Every player starts with one of each of the 16 四字真言 cards. */
export function startHand() { return Array.from({ length: 16 }, (_, i) => i + 1); }

export interface SeatSetup { char: number; ai: boolean }

export function newGame(board: Board, map: number, weeksLimit: number, seats: SeatSetup[]): GameState {
  const players: Player[] = seats.map((s, i) => {
    const tile = board.bankTiles[i % board.bankTiles.length];
    return {
      seat: i, char: s.char, ai: s.ai, alive: true, cash: RULES.startCash, home: RULES.startHome,
      tile, prev: board.defaultPrev(tile), status: emptyStatus(), cards: startHand(), homePlot: null, locks: 0, chooseSteps: false,
    };
  });
  return {
    v: 1, map, weeksLimit, week: 0, current: 0, players, plots: board.plots.map(() => null),
    jackpot: RULES.jackpotInit, roadMoney: [], winner: null, rngSeed: (Math.random() * 1e9) | 0, turnCount: 0,
  };
}

const SAVE_PREFIX = 'lfz.save.';
export function saveSlot(slot: number, g: GameState) {
  localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify({ t: Date.now(), g }));
}
export function loadSlot(slot: number): { t: number; g: GameState } | null {
  try { const s = localStorage.getItem(SAVE_PREFIX + slot); return s ? JSON.parse(s) : null; } catch { return null; }
}
export const SLOT_COUNT = 10;
export function listSlots() { return Array.from({ length: SLOT_COUNT }, (_, i) => i).map(i => ({ slot: i, data: loadSlot(i) })); }
