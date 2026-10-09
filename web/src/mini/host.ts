// Glue: build a Runner for a game + participants, with the original result screen choice.
import { app } from '../core/app';
import { loadSheets } from '../core/assets';
import { Runner, type MGResult } from './core';
import { makeGame } from './games';
import { RankResult, WordCardResult, resultSheets } from './result';
import { charName } from '../game/data';

export interface MiniSeat { slot: number; char: number; human: boolean }
export function snapshotCanvas(): HTMLCanvasElement | null {
  try { const c = app.canvas; if (!c || !c.width) return null; const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; k.getContext('2d')!.drawImage(c, 0, 0); return k; }
  catch { return null; }
}
export function startMiniGame(game: number, seats: MiniSeat[], standalone: boolean, onDone: (r: MGResult) => void): Runner {
  const g = makeGame(game);
  if (g.resultKind === 'card') void loadSheets(seats.flatMap(s => resultSheets(s.slot, s.char)));
  const R = new Runner({
    game: g, standalone, snapshot: snapshotCanvas(),
    parts: seats.map(s => ({ slot: s.slot, char: s.char, human: s.human, name: charName(s.char) })),
    makeResult: R => {
      if (g.resultKind === 'rank') return new RankResult(R, g.scores(R));
      if (R.winner !== null && !R.standalone) return new WordCardResult(R, R.winner, R.part(R.winner)!.char);
      return null;
    },
    onDone,
  });
  (window as any).__lfzMini = R;
  return R;
}
