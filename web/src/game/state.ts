import { RULES } from './config';
import type { Board } from './board';

/**
 * Remake keeps per-effect counters for call sites, but exe uses a SINGLE pair:
 * player+0x34 = status kind, player+0x30 = weeks (VERIFIED card apply @0x418940.. / GodIn @0x410c14).
 * `kind`/`weeks` are the source of truth; helpers sync the counters.
 * Kinds: 0 none, 1 hospital, 2 jail, 3 金鋼, 4 催吉, 5 一曝, 6 神智, 7 得而, 8 魔高, 9..12 gods (type+9).
 */
export interface Status {
  kind: number; weeks: number;
  hospital: number; jail: number; frozen: number; confused: number; dropMoney: number;
  cardImmune: number; badGodImmune: number; smallmanImmune: number; skip: number; badGod: number; wealthGod: number; stay: number;
}
export interface Player {
  seat: number; char: number; ai: boolean; alive: boolean;
  cash: number; home: number; tile: number; prev: number;
  status: Status; cards: number[]; homePlot: number | null; locks: number; chooseSteps: boolean;
  /** pending 洋行 salary: += scale(50) every week (exe game+0x20+4·seat), paid on stepping on the 'of' tile */
  salary?: number;
}
export interface PlotState { owner: number; type: number; level: number } // type: PLOT.SHOP=1 士多, RESTAURANT=2 食肆, RESIDENCE=3 住宅, HOME=4 家
export interface RoadMoney { tile: number; amount: number }
export interface GameState {
  v: 1; map: number; weeksLimit: number; week: number; current: number;
  players: Player[]; plots: (PlotState | null)[]; jackpot: number; roadMoney: RoadMoney[];
  /** Walkers: exe slots 4=小偷 char07, 5=惡人/猛虎 char08/13 (@0x4040b0..4480bc). */
  thief?: { tile: number; prev: number };
  thug?: { tile: number; prev: number };
  /**
   * Map god (not a walker): teleports to a random tile each week when unattached (@0x4140c3).
   * type 0..3 → 機械人/財神/工程女神/衰神 (chars 9..12). attachedTo = seat while buff active.
   */
  mapGod?: { tile: number; type: number; attachedTo: number | null };
  winner: number | null; rngSeed: number; turnCount: number;
}

export function emptyStatus(): Status {
  return { kind: 0, weeks: 0, hospital: 0, jail: 0, frozen: 0, confused: 0, dropMoney: 0, cardImmune: 0, badGodImmune: 0, smallmanImmune: 0, skip: 0, badGod: 0, wealthGod: 0, stay: 0 };
}

/** Sync convenience counters from kind/weeks (only one exclusive status is non-zero). skip/stay/badGod are separate. */
export function syncStatusFlags(st: Status) {
  const w = st.weeks, k = st.kind;
  st.hospital = k === 1 ? w : 0;
  st.jail = k === 2 ? w : 0;
  st.cardImmune = k === 3 ? w : 0;
  st.badGodImmune = k === 4 ? w : 0;
  st.frozen = k === 5 ? w : 0;
  st.confused = k === 6 ? w : 0;
  st.dropMoney = k === 7 ? w : 0;
  st.smallmanImmune = k === 8 ? w : 0;
  st.wealthGod = k >= 9 && k <= 12 ? w : 0;
}

/**
 * Apply exe status write. Card applies skip when current kind > 8 (god) — VERIFIED `cmp [+0x34],8; jg skip`.
 * Hospital/jail/god attach use force=true (overwrite gods). Clears prior exclusive status.
 */
export function setStatus(st: Status, kind: number, weeks: number, opts: { force?: boolean } = {}): boolean {
  if (!opts.force && st.kind > 8 && kind <= 8) return false;
  st.kind = kind;
  st.weeks = weeks;
  syncStatusFlags(st);
  return true;
}

/** Tick exclusive status weeks (exe +0x30); clear kind when expired. Returns whether a god just expired. */
export function tickExclusiveStatus(st: Status): { godExpired: boolean } {
  const wasGod = st.kind >= 9 && st.kind <= 12;
  if (st.weeks > 0) st.weeks--;
  if (st.weeks <= 0 && st.kind !== 0) { st.kind = 0; st.weeks = 0; }
  syncStatusFlags(st);
  return { godExpired: wasGod && st.kind === 0 };
}

/** Migrate multi-flag saves / test fixtures → kind/weeks, then sync mirrors. */
export function normalizeStatus(st: Status) {
  if (typeof st.kind !== 'number') (st as Status).kind = 0;
  if (typeof st.weeks !== 'number') (st as Status).weeks = 0;
  if (st.kind === 0 && st.weeks === 0) {
    const order: [keyof Status, number][] = [
      ['hospital', 1], ['jail', 2], ['cardImmune', 3], ['badGodImmune', 4],
      ['frozen', 5], ['confused', 6], ['dropMoney', 7], ['smallmanImmune', 8],
    ];
    for (const [f, k] of order) {
      const v = st[f] as number;
      if (v > 0) { st.kind = k; st.weeks = v; break; }
    }
    if (st.kind === 0 && st.wealthGod > 0) { st.kind = 10; st.weeks = st.wealthGod; } // unknown god type → 財神 slot
  }
  syncStatusFlags(st);
}


/** VERIFIED @0x40407f: new-game loop pushes card ids 0..15 (16 unique) into player+0x20; remake uses 1..16. */
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
    jackpot: RULES.jackpotInit, roadMoney: [],
    thief: (() => { const t = Math.floor(Math.random() * board.tiles.length); return { tile: t, prev: board.defaultPrev(t) }; })(),
    thug: (() => { const t = Math.floor(Math.random() * board.tiles.length); return { tile: t, prev: board.defaultPrev(t) }; })(),
    mapGod: (() => { const t = Math.floor(Math.random() * board.tiles.length); return { tile: t, type: Math.floor(Math.random() * 4), attachedTo: null }; })(),
    winner: null, rngSeed: (Math.random() * 1e9) | 0, turnCount: 0,
  };
}

const SAVE_PREFIX = 'lfz.save.';
export function saveSlot(slot: number, g: GameState) {
  localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify({ t: Date.now(), g }));
}
export function loadSlot(slot: number): { t: number; g: GameState } | null {
  try {
    const raw = localStorage.getItem(SAVE_PREFIX + slot); if (!raw) return null;
    const data = JSON.parse(raw) as { t: number; g: GameState };
    if (data?.g?.players) for (const p of data.g.players) normalizeStatus(p.status);
    return data;
  } catch { return null; }
}
export const SLOT_COUNT = 10;
export function listSlots() { return Array.from({ length: SLOT_COUNT }, (_, i) => i).map(i => ({ slot: i, data: loadSlot(i) })); }
