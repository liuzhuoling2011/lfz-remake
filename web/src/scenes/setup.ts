import type { SeatSetup } from '../game/state';
export const setup = {
  /** 'game' = 新遊戲 flow, 'mini' = 小遊戲 flow (SelectActor arg 1 → SelectMiniGame) */
  mode: 'game' as 'game' | 'mini',
  weeksIdx: 0,
  map: 0,
  seats: [
    { char: 1, ai: false, on: true },
    { char: 2, ai: true, on: true },
    { char: 3, ai: true, on: true },
    { char: 5, ai: true, on: true },
  ] as (SeatSetup & { on: boolean })[],
};
