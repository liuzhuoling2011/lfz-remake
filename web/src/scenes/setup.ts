import type { SeatSetup } from '../game/state';
/**
 * device = selectactor/device.spr frame (exe player+0x18):
 *   0 mouse · 5/6/7 KEYBOARD01..03 · 8 AI (also used when seat is off).
 * Joystick frames 1–4 exist in the sheet but have no web input → omitted from the cycle.
 */
export type Seat = SeatSetup & { on: boolean; device: number };
export const setup = {
  /** 'game' = 新遊戲 flow, 'mini' = 小遊戲 flow (SelectActor arg 1 → SelectMiniGame) */
  mode: 'game' as 'game' | 'mini',
  weeksIdx: 0,
  map: 0,
  seats: [
    { char: 1, ai: false, on: true, device: 0 },
    { char: 2, ai: true, on: true, device: 8 },
    { char: 3, ai: true, on: true, device: 8 },
    { char: 5, ai: true, on: true, device: 8 },
  ] as Seat[],
};
