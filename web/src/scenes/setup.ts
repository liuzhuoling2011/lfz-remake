import type { SeatSetup } from '../game/state';
export const setup = {
  weeksIdx: 0,
  map: 0,
  seats: [
    { char: 1, ai: false, on: true },
    { char: 2, ai: true, on: true },
    { char: 3, ai: true, on: true },
    { char: 5, ai: true, on: true },
  ] as (SeatSetup & { on: boolean })[],
};
