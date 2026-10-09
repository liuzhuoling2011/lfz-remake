# 老夫子 大富翁 (omasterq.exe Ver 1.05H) — Mini-games (小遊戲) spec

Source: static Ghidra analysis only (exe never run). Decompiled excerpts: `re/*.c`. Tables: `data/*.json`.
Asset contact sheets: `minigame_{common,result,01,02,03,04}_assets.png` (every frame labelled path#frame, w×h, hotspot).
Confidence: **[V]** = VERIFIED in code (address given), **[I]** = INFERRED.

Notation: `W,H` = screen (640×480 / 800×600 / 1024×768), `OX=(W-640)/2`, `OY=(H-480)/2`, `cx=W/2`, `cy=H/2`.
Sprites are drawn at anchor (x,y) minus frame hotspot (hx,hy) — same as the rest of the remake.
All values in **ticks at 40 fps (25 ms)**.

## 0. Summary table

| idx | asset dir | name (zh) | 1-line rule | players | reward (board mode) | conf |
|---|---|---|---|---|---|---|
| 0 | `minigame/01` | 畫展 (portrait puzzle) | each player fixes their own 8×6 tiled portrait; 6 wrong tiles, each cycles through 3 layers; first fully correct wins; 30 s | all 4 slots, human+AI simultaneously | winner spins word-card reel → gets a 四字真言 card | V (name from comic sign 展画 = I) |
| 1 | `minigame/02` | 機械人打拍子 (robot rhythm) | robot demonstrates a clap rhythm, then everyone repeats it; ≤10 pts per beat by timing; 5 rounds | all | **cash += points** (result2 ranking) | V (name I) |
| 2 | `minigame/03` | 彈叉打賊 (slingshot thief) | thief runs left/right; move your slingshot, pull and release to hit him; 10 pts per hit; 30 s | all | **cash += hits×10** (result2) | V (name I) |
| 3 | `minigame/04` | 吹氣球 (balloon pump) | alternate two buttons to inflate 老夫子's balloon (0→180) against a leak; first to pop wins; 30 s | all | winner gets word card | V (name I) |

SPEC.md §11 used to say "every mini-game awards a word card" (fixed 2026-10-09): only 01 and 04 award a card; 02 and 03 award cash. In standalone 小遊戲 mode no reward is applied (01/04 skip the card reel; 02/03 still show the ranking, cash change is irrelevant). [V: FUN_0041a3f0 / FUN_0041dd60 check `DAT_00448870==0` before pushing 0x442ea0]

## 1. How games are entered

### 1a. Board tile [V FUN_00416ff0 case 5]
Tile type 5 (`minigame` in spec/data/map_*.json: 香港島 14,106,108; 九龍區 20,92,162,165; 古代 88,178,211). When **any** player (human or AI) lands: board BGM stops (FUN_0040edf0), `player+0x48=1`, push scene `0x4433d0` with param `rand()%4 + 100`. No probability gate, no choice. [I: only on landing, not passing — dispatcher is the landing handler]
**All** non-excluded players play, not just the lander (§3).

### 1b. Main menu → 小遊戲 [V FUN_00403d80, 0x406d40]
`小遊戲` → SelectActor (arg 1 = minigame mode; pick characters/devices/AI as in new game) → **SelectMiniGame** screen → param = game index (<100 ⇒ standalone flag `DAT_00448870=1`). After the game ends the SelectMiniGame screen re-inits with a random transition and you can pick again; its exit button returns to main menu.

SelectMiniGame (`dat/SelectMiniGame/bg.spr`, `fg.spr`, `button.wav`, `dan01.wav`):
- bg frames 0..11 = 4 game buttons × (normal, hover, pressed), all drawn at (cx,cy) (the frame hotspots place them). fg frame0+1 at (cx,cy); fg frames 2/3/4 = exit button.
- Button → game mapping table 0x441a78 = `[2,1,3,0]`: btn0 = 03 slingshot, btn1 = 02 robot, btn2 = 04 balloon, btn3 = 01 paintings, btn4 = exit.
- dan01.wav on hover change, button.wav on click; 80-tick delay after click before launch. [V FUN_00406ee0/00406f80]

## 2. Launcher scene 0x4433d0 [V FUN_0041dfe0..0041e3c0]
1. Play `maindata [Music] MiniGame{i+1}` (01,03 → `mus/minigame03.mp3`; 02,04 → `mus/AudioTrack07_1.mp3`), set 40 fps (FUN_004238c0(0x28)).
2. **Comic intro**: snapshot of current screen as backdrop; film strip `minigame/turn/bg` with three 370×278 panels: centre `turn/game{i+1}`, left neighbour `game{((i+1)&3)+1}` at stripX-0x267, right `game{((i+2)&3)+1}` at stripX+0xee, centre at stripX-0xbe; all top at stripY-0x8c, stripY=cy. Strip slides from x=W+bgW/2 to cx (ease div 8), then panels advance frames 0→5 every 31 ticks. `frame.wav` on enter. Then replace with game scene (table 0x4433c0: [0x442fd0, 0x443100, 0x443200, 0x4432f8]).
3. **Zoom-in**: game opens as a centred window growing from 370×278 to W×H (ease div 4 on w and h) over the snapshot. [V]
4. **Ready phase**: each participant shows `minigame/pressbutton` (frame1 base + frame0 button bobbing -10..+2 px, 1 px/tick). Human must **release** (key-up) button 0 or 1 on their own device; AI is ready instantly; drip.wav. [V]
5. **READY → GO banner** (`minigame/ready`, frames 0/1 halves, 2 READY, 3 GO), `zoomin.wav` vol 200: halves fly in from left/right (div 4), text fades in +16 alpha/tick, hold 60, shrink scale 32/32→1/32 one step/tick, then GO grows 1→32 by +3/tick and holds 40. [V FUN_0041e4c0..]
6. Play phase (per game).
7. End banner: `minigame/finish` (FINISH) or `minigame/timeout` (TIME IS UP) — same animation without GO.
8. Result screen (§8) or pop straight back.

**Timer bar** (01,03,04) [V]: 1200 ticks = 30 s. Text `%02d` of `30 - t/40` in `fonts/minigame/01/number` at (cx - textW/2 + 0x112, cy - 0xd9). Bar x0=cx-253, width `t*487/1200`, light row y=cy-195 RGB(154,255,153), body cy-194..cy-175 RGB(3,228,0), bottom row cy-174 RGB(1,91,0). Bar lives in each game's bg timer frame (640×72 band at top).
**Clip**: game area clipped to (0,OY)-(W-1,OY+479); backgrounds of 02/03/04 repeated at x±640 for wide modes.

## 3. Participants & input [V]
- Slots 0..3; excluded if `status ∈ {-1 bankrupt, 1 hospital, 2 jail, 5}` (status 5 = temporary state from 0x416f30/0x416f60, meaning unknown). Slot keeps its colour/number even if others are absent.
- For n participants, k-th participant x = `W/(2n) + k*W/n` (02/03/04).
- Each human uses their own device (player+0x1c). Logical keys: 0,1 = buttons, 2 ←, 3 →, 4 ↑, 5 ↓. Events: key-down / key-up.
  - KEYBOARD01: PageDown, Delete, ←, →, ↑, ↓
  - KEYBOARD02: E, Q, A, D, W, S
  - KEYBOARD03: O, U, J, L, I, K
  - MOUSE: buttons 0/1 (L/R order [I]) + cursor; JOYSTICK: 6 inputs.
- Player colours: P1 (92,203,255), P2 (255,149,0), P3 (74,209,9), P4 (152,71,223).

## 4. MG 01 — 畫展 portrait puzzle [V 0x419400–0x41a610] → `data/mg01_painting_puzzle.json`
Assets: `minigame/01/bg` (f0 640×478 at centre, f1 80×80 tiled under everything), `01/character01..06` (each 48 frames 30×30 = 8 cols × 6 rows of a portrait), `01/cursor` (frame = slot), `drip`. Unused: `01/arrow`, `01/tick`.
- Board for slot s at (tblX[s]-320+cx, tblY[s]-240+cy), tblX=[27,372,27,372], tblY=[84,84,288,288]; 240×180. Absent slots: no board [I: not drawn].
- Portraits = the 4 player characters' sprites, shuffled by 6 random swaps; slot s solves portrait P[s].
- Each cell has 3 layers: correct tile + 2 random tiles from other portraits. One random column per row starts on layer 1 or 2 (6 wrong cells). Displayed tile = layer[state].
- Action on cursor cell: `state=(state+1)%3`. Win: all states 0 → FINISH → (board) word-card result for that slot. Timeout → TIME IS UP, nothing.
- Cursor starts (3,2); keyboard acts on **key-up**: arrows move with wrap (8×6), button 0/1 cycles. Mouse: every 15 ticks the cursor steps one cell toward the cell under the mouse; releasing button 0/1 while on it cycles.
- AI: every rand%10+10 ticks — pick a row then column containing a wrong cell (5 random tries each), step one cell toward it, cycle when on it.
- pressbutton at (boardX+120, boardY+120).

## 5. MG 02 — robot rhythm [V 0x41a660–0x41b940] → `data/mg02_robot_rhythm.json`, `data/mg02_patterns.json`
Assets: `02/bg`, `02/robot` (12 frames), `02/music` (f0 bar, f1 note mark), `02/hand` (cymbal hands), `02/player01..04` (bottom name panels), sfx `computer` (loop), `kk`.
- 5 rounds; round r uses pattern section `rand()%4 + 4r` of `dat/MiniGame/02/data.txt` (20 patterns, 5–12 beats, phrase 120–190 ticks, decoded in mg02_patterns.json: phrase length + beat ticks).
- Demo: robot "thinks" (frames 10,9,8,0 every 6 ticks) + computer.wav loop; then plays each beat as a clap (frames 4,5,6,7,5, kk.wav), marking notes on the music bar at `x0 + beat*422/phrase` (x0=cx-211, bar at (cx, OY+40)).
- Edge case [V]: a beat landing exactly on the phrase end (pattern 13) is never demoed/marked, so it cannot be scored.
- Players' turn: robot listens (frames 8–11 every 11 ticks), a progress fill (black, 0..422 px) runs over the same phrase length. Clap = key0 **down** (hands close, kk.wav panned by x); key-up opens.
- Score per clap: nearest not-yet-used beat with |Δ|<10 ticks gives `10-|Δ|`; else 0 (no penalty). Shown `%02d` black on the player panel (panel at (x, H-h/2-OY), text at (x-w/2+28, y-13)).
- AI: per tick 50% chance: if |cursor-nextBeat| < rand%5+4 → clap; else skip passed beats.
- After 5 rounds: FINISH → result2 ranking → cash += score.

## 6. MG 03 — slingshot thief [V 0x41b990–0x41d050] → `data/mg03_slingshot.json`
Assets: `03/bg` (f0 scenery, f1 ground, f2 cat, f3 timer band), `03/thief_01..05`, `03/hand01..04` (slingshot frames + last frame = score tag), `03/stone`, sfx `barf`, `cat`, `pop`.
- Thief at y=cy+100, starts x=cx, 16 px every 4 ticks; turns randomly (25%/step) in the outer third, always at x<100 or x>W-100; turn sprites 03/04; hit → thief_05 (12 ticks/frame) + barf.wav.
- Slingshot hand at y = OY+490-h, x per layout; moves 6 px/tick within [50, W-50].
- Keyboard/joystick: hold ←/→ to move, key0 down = pull, key0 up = shoot. Mouse: drag down (cursor y > 2H/3) to pull, flick up (y < H/2) to shoot; held mouse buttons move [I].
- Stone flies up 12 px/tick shrinking (scale (3-t/4)/3), shadow below; at tick 13 pixel-tests the thief's frame at 5 points → hit. One stone in flight per player.
- AI: 5/6 of ticks — pulls when |dx|<30, fires when |dx|<5, tracks the thief at 6 px/tick.
- Score tags at top: x = OX+67+(487/n)/2+k*(487/n), y=OY+18, hits in player colour.
- Cat easter egg (1%/tick, cat.wav) decorative [I]. 30 s → TIME IS UP → result2, cash += hits×10.

## 7. MG 04 — 吹氣球 balloon [V 0x41d0a0–0x41df90] → `data/mg04_balloon.json`
Assets: `04/balloon` (18 frames: 5 sizes × 3 wobble + 3 POW), `04/bg`, `04/player01..04` (gauge f0 frame/f1 base), sfx `balloon01` (inflate loop), `balloon02` (deflate loop), `balloon03` (pop).
- Pressure 0..180. Human: key-down of button 0 or 1, must **alternate** (same key twice doesn't count) → +1. Leak: -1 every 6 ticks without a pump. AI: 25%/tick +1.
- Frame = (p/36)*3 + wobble[0,1,0,2]; 180 → POW frames 15–17 + balloon03.
- Figure at (x, cy+10-20*(k&1)); gauge at bottom (x, H-h/2-OY), yellow fill RGB(255,244,53) width p/2 from x-66, 24 px high.
- First to 180 → FINISH → (board) word-card result. Timeout → nothing.

## 8. Result screens [V] → `data/result_screens.json`
**Word-card reel (scene 0x442ea0, 01/04 winners)**: whole screen tiled with `result/player{s+1}` f1 ("WIN"), centre `result/bg`, badge `result/player{s+1}` f0, winner face `result/character0N`. Reel of all 16 word-card images scrolls vertically at 40 px/tick inside window at (OX+195, OY+183) (card size), `drum_long` loop. Human winner presses button 0/1 (key-down) to stop (drip + drum_short); AI stops after rand%80+40 ticks. Decelerates 1 px/tick², creeps 1 px until a card aligns. Shows `%s得到一張「%s」四字真言！` at y=cy+220 for 120 ticks, adds card to hand, returns to board. pressbutton at (5W/6, cy+200).
**Ranking (result2, 02/03)**: `result2/bg` (RESULT) drops from y=0 to cy; rows `result2/player{s+1}` sorted by score desc at y=OY+140+77·rank, sliding up from H+200 with 30·(rank+1) delay; face `result2/face` frame=character id at x+5, `result2/number` rank at x-149, score at x-w/2+156. dan02.wav. After 320 ticks cash += score, return.

## 9. Original main menu vs remake [V scene 0x4414a0, FUN_00403560..00403d80] → `data/main_menu.json`
Original: **one horizontal row of 6 buttons** at y=H-50, x = OX+80+95·i; `menu.spr` frame0 glow eases (div 4) to hovered button, frames 2–7 labels:
0 系統設定 (options) · 1 相簿 (album: 機會卡 / 四字真言 galleries) · 2 小遊戲 · 3 新遊戲 · 4 載入進度 · 5 離開遊戲. 30 s idle → opening/attract loop. "Ver 1.05H" bottom-right.
New-game flow: 新遊戲 → **SelectActor first** → SelectMap (SelectYear position: not re-verified here).
Remake (web/src/scenes/menus.ts MainMenuScene) has only 4 vertical items (new/load/options/exit): **missing 相簿 and 小遊戲**, wrong layout/order, no idle attract. Album art (`album\*.spr`, album.dat) is on Disc 2 and is **not in our extracted assets**.

## 10. Integration notes for remake (implemented in web/src/mini/, see §12)
- `engine.ts minigame(p)` should: stop BGM → run launcher (comic intro, zoom) with game = rand%4 → run game with ALL eligible players (not only p) → apply reward: 01/04 card to winner via reel (or none on timeout), 02/03 cash to every participant → resume BGM and board speed.
- Add `MiniGameSelectScene` (SelectMiniGame) reachable from main menu after actor selection; use standalone flag to skip rewards.
- Use 40 fps fixed timestep for mini-games.

## 11. Open questions
1. Album assets (Disc 2 album.dat) missing — 相簿 cannot be reproduced faithfully.
2. Status 5 meaning (excluded from mini-games).
3. MG03 mouse: which physical button is index 0/1 for moving.
4. Exact SelectYear position in the new-game flow.
5. Official Chinese names of games 02–04 (no strings in exe; names here are descriptive).
6. Whether the MG03 cat has any gameplay effect (no code found → decorative).

## 12. Web remake implementation (2026-10-09)
`web/src/mini/core.ts` (40 fps runner: comic intro, zoom, ready, banners, timer, input devices, touch pad), `games.ts` (MG01–04),
`result.ts` (word-card reel, result2 ranking), `host.ts`, `scenes.ts` (SelectMiniGame + standalone play); board hook
`engine.ts minigame()`; main menu row in `scenes/menus.ts`. Test: `web/tests/minigames.mjs`.
Web-only choices (not from the exe): status 5 is treated as 一曝十寒 (HUD status table @0x442e34); mouse/touch for MG03 = hand
follows the pointer, press = pull, release = shoot; MG04 pointer = left/right of your own gauge (right mouse button = button 1);
MG01 tap = cursor walks there (15 ticks/cell as the exe's mouse) and cycles on arrival; on-screen touch pad for the first human;
extra keys Space/Enter/Z (button 0), X/Backspace (button 1) for the first human; MG03 thief starts with thief_02 (run right)
instead of the exe's thief_04 pose; Esc leaves a standalone game.
