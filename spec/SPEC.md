# 老夫子大富翁 (Old Master Q Monopoly) — Game Design Spec for Web Remake

**Source:** `omasterq.exe` Ver 1.05H (PE32 VC++6, DirectDraw/DirectSound), static RE only.  
**Data:** `omasterq.dat` pKLs/LZSS archive (Big5 Traditional Chinese texts).  
**Confidence legend:** **VERIFIED** = seen in code or data with citation; **INFERRED** = strong evidence but not fully proven in decompilation.

SoftSENTRY wraps `_stext`/`_rsrc` (license). Game logic lives in readable `.text` (VA `0x401000`–`0x43f000`). Ghidra recovered ~1097 procedures; many gameplay call sites are `not_in_procedure` (incomplete function boundaries), so some rules are cross-checked via data tables + the procedures that *did* decompile cleanly.

---

## 1. Product / flow

### 1.1 Boot & menus — VERIFIED (strings + `maindata.txt`)
1. Logo AVI `logo{640|800|1024}.avi` per `SCREEN_MODE`.
2. Opening AVI `opening%d.avi`.
3. **MainMenu** (`dat\MainMenu\*`): start / options / exit (`ExitGame` confirm).
4. Setup chain (asset folders + strings):
   - **SelectYear** — game length in years; UI label `year.年期`; sentinel `-1` → `∞` (unlimited).
   - **SelectMap** — 3 boards (`MapName0..2`).
   - **SelectActor** — up to **4** players (`INPUT01..04`), each picks a playable character + input device.
   - **SelectMiniGame** — optional; 4 mini-games exist under `dat\MiniGame\01..04`.
5. In-game: dice, cards, chance, load/save `omqSave%02d.dat`, winner/`gameOver` screens.
6. Options: screen region, **GAME_SPEED** (慢/正常/快), SFX/Music volumes (`Omasterq.ini`).

### 1.2 Config (`Omasterq.ini`) — VERIFIED
```
[SYSTEM]
GAME_SPEED=60          # UI 40/60/80; tickMs = 1000/speed → DAT_004437c8 (see §8)
SFX_VOLUME / VOICE_VOLUME / MUSIC_VOLUME = 0..255
SCREEN_MODE = 640x480 | 800x600 | 1024x768

[INPUT DEVICE]
INPUT01..04 = KEYBOARD01|KEYBOARD02|KEYBOARD03|MOUSE|JOYSTICK01..04
```

### 1.3 Players — VERIFIED
- Max **4** simultaneous players (`INPUT%02d`, `player%02d` sprites, face01–06).
- **6 playable** characters + **6 NPC/gods** (names from `[ActorName]` in `maindata.txt` → `data/characters.json`).

| ID | Name | Role |
|----|------|------|
| 01 | 老夫子 | Playable |
| 02 | 大番薯 | Playable |
| 03 | 秦先生 | Playable |
| 04 | 趙先生 | Playable |
| 05 | 陳小姐 | Playable |
| 06 | 小明 | Playable |
| 07 | 小偷 | NPC (theft event) |
| 08 | 惡人 | NPC (assault → hospital) |
| 09 | 機械人 | NPC / mini-game |
| 10 | 財神 | Buff god (free spending) |
| 11 | 工程女神 | Map god |
| 12 | 卡神 | Card god |

---

## 2. Boards / maps — VERIFIED (`.mab` decode → `data/map_*.json` + overlays)

| Index | Display | File | Grid | Tile px | Walk tiles | Lots | Overlay |
|------|---------|------|------|---------|------------|------|---------|
| 0 | 香港島 | `dat/map/hongkong.mab` | 60×30 | 80×40 | 135 | 46 | `spec/overlay_0.png` (`overlay_hongkong.png`) |
| 1 | 九龍區 | `dat/map/kowloon.mab` | 100×100 | 80×40 | 205 | 63 | `spec/overlay_1.png` |
| 2 | 古代 | `dat/map/ancient.mab` | 100×100 | 80×40 | 251 | 78 | `spec/overlay_2.png` |

### 2.1 `.mab` schema (for remake) — VERIFIED layout / INFERRED path order

Binary (via `tools/mab.py` + asset worker): width/height/tileW/tileH, sprite name table (kind+cstr until `0xFFFFFFFF`), then layers (`walking`, `sale_buy`, `label`, `icon`, `building`, …) each with objects `{a,b,x,y,label}`.

**JSON output** `spec/data/map_<id>.json` / `map_{hongkong,kowloon,ancient}.json`:

```json
{
  "id": 0, "key": "hongkong", "nameZh": "香港島",
  "width": 60, "height": 30, "tileW": 80, "tileH": 40,
  "startTileIds": [0, 71, 111],
  "startTileId": 0,
  "tiles": [{
    "id": 0,
    "x": 1000, "y": 300,
    "gx": 25, "gy": 15,
    "type": "bank|lot|chance|walk|money_add|money_des|minigame|jockey|smallman|tram",
    "basePrice": 500,
    "lotId": 0,
    "next": [1],
    "neighbours": [1, 48],
    "buildingAnchor": {"x": ..., "y": ...},
    "name": "行人路",
    "landmarks": [{"code":"c1(500)","x":...,"y":...,"kind":"special","value":500}]
  }],
  "plots": [...],
  "landmarks": [...],
  "pathComponents": [135],
  "schema": { "...documented in file..." }
}
```

| Field | Meaning | Confidence |
|-------|---------|------------|
| `x,y` | World hotspot from MAB object | VERIFIED |
| `ix,iy` | Pixel on `images/maps/<key>_full.png` = `(x,y) - renderOrigin` | VERIFIED |
| `renderOrigin` | Crop origin from asset render (`assets/_parts/maps.json`) | VERIFIED |
| `type` / `basePrice` / `buildingAnchor` | From walking + sale_buy layers | VERIFIED |
| `next[]` | Ordered successor(s) along greedy Euler-ish cover of the walk graph (loop closes if ends adjacent) | **INFERRED order** (graph edges VERIFIED) |
| `neighbours[]` | All graph adjacencies (forks) | VERIFIED |
| `startTileIds` | All `bank` / walcome tiles | VERIFIED candidates; which seat maps to which bank **INFERRED** (use index 0 or seat%N) |

Overlays draw path polylines + tile indices on `assets/images/maps/*_full.png` using **`ix=x-origin.x, iy=y-origin.y`** (NOT bbox-fit). Earlier misaligned overlays scaled the tile bbox to the PNG; that bug is fixed. Origins: HK `(-39,-20)`, KL `(1,17)`, Ancient `(41,-9)`.

### 2.2 Landmark / facility codes — VERIFIED (map bytes + `FUN_00415890` / `SpBuilding`)

| Code | Meaning | Evidence |
|------|---------|----------|
| `walcome_icon` | 洋行 / bank start | sprite + salary case 2 `FUN_00416ff0` |
| `chance` | 機會格 | `chance.txt` |
| `minigame_icon` | 小遊戲 | case 5 |
| `jacky_club_icon` | 馬會 | `Jclub` |
| `smallman_icon` | 打小人 | `SelectSmallMan` |
| `money_add` / `money_des` | gain / pay | cases 2/3 |
| `te` / `lo` / `ho` / `po` / `of` | 廟/鎖舖/醫院/警局/辦 | type ids 10/9/… |
| `cN(price)` | SpBuilding fee | `FUN_00414ab0` |

SpBuilding messages: `data/sp_buildings.json`. Aggregated specials: `data/maps.json`.

## 3. Turn structure — VERIFIED (handlers) / INFERRED (ordering)

Typical turn (INFERRED order from call graph + UI assets):

1. Start-of-turn status (hospital/jail/freeze/card effects tick **by week**).
2. Optional: use **四字真言** card (`usecard` / `bycard` voice keys).
3. Roll **dice** (`dat\dice\dice_%d.spr`, `dice1/2.wav`) — faces 1–6 ⇒ **one d6** VERIFIED by assets; doubles behavior INFERRED unused (single die sprites).
4. Walk N steps along path (`walk.spr`, `step.spr`); direction can reverse (`回頭是岸` card / bad chance).
5. Land resolution (`FUN_00417b90` property / `FUN_00416ff0` special).
6. End turn; season/music may advance (`spring/summer/autumn/winter`, `Map%02d_%d` music).

**Week:** many effects last 「N 個星期」= N turns for that player (VERIFIED by card/chance text).

---

## 4. Economy — VERIFIED (`FUN_0040e9a0`, `FUN_0040e9f0`, `FUN_00417b90`)

### 4.1 Price inflation — `FUN_0040e9a0(base, weekCounter)` @ `0x40e9a0` — VERIFIED
Second arg is **`game+0x0c` week counter** (not calendar year). Season math uses `week % 52` / 13 (`0x402e80`).
```
for i in range(weekCounter // 13):
    base = base * 110 // 100
```
Prices/fees scale **+10% every 13 weeks** (~one season). Over a 3-year game (156 weeks) ≈ 12 steps → ~3.1×.

### 4.2 Building value — `FUN_0040e9f0(base, type, level)` @ `0x40e9f0`
Tables @ `0x442408` / `0x442418` (`data/economy.json`):

| level | pct |
|------|-----|
| 0 | 41 |
| 1 | 100 |
| 2 | 200 |
| 3 | 400 |

| type | mult | UI name (maindata) |
|------|------|---------------------|
| 0 | 100 | (empty / house path; type 4 mapped→0) |
| 1 | 300 | 商業中心 `building2` / shop → `GiveMoney2` |
| 2 | 200 | 食肆 `building3` → `GiveMoney1` |
| 3 | 100 | 住宅 `building1` (visit path uses type 4) |
| 4 | (→0) | 探訪/送禮 square → special %-of-cash |

```
value = ((level_pct[level] * base) / 100 * type_mult[type]) / 100
```

### 4.3 Landing on owned property — `FUN_00417b90` @ `0x417b90`
Property record (INFERRED field layout from uses): `[1]=type`, `[2]=ownerIndex`, `[3]=level`.

Player struct snippets: `+0x28` cash (**start 5000** VERIFIED `0x404065`); `+0x2c` homeMoney (start 0); `+0x34` status (`-1`=eliminated, `1`=hospital, `2`=jail, …); `+0x3c` human/AI flag; see `data/rules_core.json`.

**Pay rules:**
1. Unowned → buy prompt if `price <= cash` and status≠6 (`0x1d` voice); else fail voice `0x19`.
2. Own tile → upgrade UI (`uplevelBuilding`) unless status=6.
3. Other’s tile, if `param_2` allows collection:
   - If lander has **財神** (`param_1[5]==1`): pay **0**, show `GiveMoney0`.
   - If owner status hospital(1)/jail(2): pay **0**, `GiveMoney4` / `GiveMoney5`.
   - Else if type ∈ {1,2,4}:
     - type **4**: fee = `((rand%6)+5) * cash / 100`  → **5–10% of lander’s cash**; `GiveMoney3`.
     - else: fee = `value / 2`; type1→`GiveMoney2`, type2→`GiveMoney1`.

### 4.4 Build costs — VERIFIED (UI strings)
`SelectBuilding`: choose 住宅 / 商業中心 / 食肆 with `%d` costs (numbers come from map base × year scale — exact base table still in `.mab` object payloads, **partial**).  
`homeText` / `uplevelBuilding`: build home / upgrade level.

### 4.5 Bank / 洋行 / jackpot — VERIFIED fragments (`FUN_00416ff0` case 2)
Landing salary tile (`money_add` / walcome):
```
gain = scale(50, year)   # FUN_0040e9a0(0x32, year)
cash += gain             # ×2 if 財神
jackpot += gain/2        # (×1 if 財神)  at DAT bank +0x1c
```
`income` string: `派發薪酬%d元！`  
馬會 `Jclub`: buy ticket into cumulative jackpot.

### 4.6 Loans / stocks
**No** loan/stock systems found in strings/data. **INFERRED absent.**

---

## 5. Special tile dispatcher — VERIFIED `FUN_00416ff0` @ `0x416ff0`

`FUN_00415890(x,y)` maps tile name → type id:

| case | Behavior |
|------|----------|
| 0 | Buy/build flow (`FUN_00413060` pick card? actually used with building select — also chance draw entry via `FUN_00413060`/`13110` when from chance) |
| 1 | Warp / reset move state (`FUN_004155f0`/`154a0`) + map SFX |
| 2 | Salary / money_add (see §4.5) |
| 3 | Pay fee `scale(50)` unless 財神 |
| 4 | Voice line 0x13 only |
| 5 | Mini-game: `rand%4 + 100` → `MiniGame%d` |
| 6 | Require fee `scale(20)` |
| 7 | **SpBuilding** `c1..c9`: parse fee, call handler table `DAT_00442c10[code]`, show `SpBuilding` text |
| 9 | `lo` lock shop — fee `scale(100)`, needs item/state |
| 10 | `te` temple — fee `scale(100)` |
| -1 | No special |

Chance draw helper `FUN_00413110`: reads `result` from `chance.txt`; `CardRandom` → random word-card; numeric → year-scaled money; `Default` → -1 (scripted side effect in card id).

---

## 6. Cards

### 6.1 機會 Chance — VERIFIED text + structured ops `data/chance_effects.json` (26)
Lucky 01–12, Bad 13–26. Raw: `data/chance_cards.json`.  
`FUN_00413110` interprets `result`: `CardRandom` → random word-card; numeric → year-scaled cash via `FUN_0040e9a0`; `Default`/`Deafult` → id-specific side effect.

| id | title | effects (opcodes) |
|----|-------|-------------------|
| 1 | 大獲全勝 | `add_cash +100` scaled |
| 2 | 步步高昇 | `upgrade_owned_property +1` |
| 3 | 誠心求拜 | `gain_word_card random` |
| 4 | 鋤強扶弱 | `take_percent_cash_from richest 10%` |
| 5 | 經營副業 | `add_cash +500` scaled |
| 6 | 耐人尋味 | `move_steps +1` |
| 7 | 仁心仁術 | `gain_word_card random` |
| 8 | 生意興隆 | `add_cash +1000` scaled |
| 9 | 梅開二度 | `roll_again` |
| 10 | 一帆風順 | `teleport home` |
| 11 | 捷足先登 | `gain_free_property` |
| 12 | 奉公守法 | `add_cash +1000` scaled |
| 13–17,25 | 醫院/監獄 series | `set_status hospital/jail N weeks` + `add_cash -500` scaled |
| 18 | 鼠輩橫行 | `lose_home_money_percent 10%` |
| 19 | 劫富濟貧 | `give_percent_cash_to poorest 10%` |
| 20 | 山泥傾瀉 | `upgrade_owned_property -1` |
| 21 | 無心之失 | `lose_word_card random` |
| 22 | 前無去路 | `reverse_direction` |
| 23 | 裹足不前 | `skip_turn 1` |
| 24 | 因小失大 | `add_cash -500` scaled |
| 26 | 阿公收地 | `lose_property random_owned` |

Property pick rules for 2/11/20/26: **INFERRED** random among eligible.

### 6.2 四字真言 — VERIFIED text + `data/word_card_effects.json` (16)
`selectPlayer`: `0` self, `1` opponent, `2` either, `-1` passive. Structured opcodes in JSON (steal 20%, statuses 3 weeks, teleports, immunities, etc.).

## 7. NPCs / random world events — VERIFIED (maindata `[NPC]`)
- 惡人: injure → hospital **3 weeks** (`PK1/PK2`).
- 猛虎: same (`PK3`) — ending/tiger assets.
- 小偷: steal `%d` from 屋企 (`ThiefMsg`); mitigated by locks (`LockMsg`).

Gods on map: `god01..04`, `GodIn`/`GodOut` sprites (財神 etc.).

---

## 8. Timing / GAME_SPEED — VERIFIED values

| UI | INI value | `1000/speed` → `DAT_004437c8` |
|----|-----------|------------------------------|
| 慢速 | 40 | 25 ms |
| 正常速度 | 60 (default) | 16 ms |
| 快速 | 80 | 12 ms |

- Clamp **[40,80]**; convert `FUN_004238c0` @ `0x4238c0`.
- Tick unit queued into multimedia-timer style countdown (`0x4238d0`).
- **Movement step timing:** INFERRED — walk animation advances on same tick unit; remake should use `stepDurationMs = tickUnitMs * k` with `k≈2..4` tuned to `walk.spr` frame count (`data/rules_core.json`).

Week advances when `game.phase (+0x10) == 7` then `inc game.week (+0x0c)` (`0x402e1b`).

## 9. Win / lose / bankruptcy — VERIFIED (`FUN_00403200` / `00418050` / `004180c0`)

**Note:** `0x40e330` is the **Winner UI constructor only** (loads `dat\winner\*.spr`, plays `Winner` music). Predicate is elsewhere.

### 9.1 End-of-game predicate — `FUN_00403200` @ `0x403200`
Returns true if either:
1. **`game.weekCounter == game.maxWeeks`** (year limit; table `0x441568` → 156 / 260 / 520 / **-1**=∞), or
2. **Exactly one** player remains with `status != -1`.

Then `FUN_004031a0` picks winner = max **net worth** among non-eliminated.

### 9.2 Net worth — `FUN_00418050` @ `0x418050`
`cash + homeMoney + Σ yearScaled(buildingValue)`.

### 9.3 Bankruptcy / eliminate
When a payment path finds `netWorth < 0` (call sites `0x40fdf4`, `0x41229c`), state machine leads to `FUN_004180c0` → **`player.status = -1`**. UI asset `dat\map\nomoney.spr`. Forced sell-before-eliminate details **PARTIAL**.

### 9.4 Starting cash — VERIFIED
All players: **cash=5000**, homeMoney=0 (`0x404065`). Bank jackpot init **5000** (`game+0x1c` @ `0x404031`).

Full machine-readable: `data/rules_core.json`.

## 10. AI — PARTIAL (`data/ai_rules.json`)

Each `character0N.txt`:
```
[AI]
attrack.a,b,c,d,e
lucky = 100   # character06 only
```

| Char | attrack order |
|------|---------------|
| 01 老夫子 | 3,5,2,1,4 |
| 02 大番薯 | 5,3,2,4,0 |
| 03 秦先生 | 4,3,5,0,1 |
| 04 趙先生 | 0,1,2,4,5 |
| 05 陳小姐 | 5,1,3,0,2 |
| 06 小明 | 1,2,4,0,3 (+lucky 100) |

**INFERRED policy:** treat list as preference over build/action classes 0..5 (住宅/商業/食肆/攻擊卡/特殊/保守); buy if affordable; upgrade if level < 3; offensive cards when attack ranks high; `lucky` biases risk. String `attrack` **not** in exe — ExtText-only; consumer not located.

Mini-game 02 weights: `data/minigame02_weights.json`.

## 11. Mini-games — VERIFIED (assets)
| ID | Folder hints | Notes |
|----|--------------|-------|
| 01 | number.fnt, characters | timing / pick |
| 02 | robot, hand, data.txt | rhythm/weights |
| 03 | thief, cat, stone | catch thief |
| 04 | balloon | balloon pop |

Triggered from board type 5 or SelectMiniGame. Awards word-card via `winnerMsg`.

---

## 12. Audio triggers — VERIFIED `data/audio.json` + voice tables
- BGM: per map × season `Map0N_S`, MainMenu, MiniGame1–4, Winner/loser.
- SFX indices `00..22` → `dat/sfx/SFX*.wav`.
- Character speech: `voice/{MQ|BP|MC|MH|PG|SM}NN` (+ greet `*25a..e`); chance `tool_01..26.mp3`.
- Action keys: `bycard`, `usecard`, `timeout`, `walk`, `stand`, `%s_*` variants.

---

## 13. Input / UI layout — VERIFIED (assets + ini)
- Devices: 3 keyboard schemes, mouse, 4 joysticks (`joyGet*` imports).
- HUD: `info`, `detailinfo` (HomeMoney / total / cardCount / houseCount), `calculater`, faces, round, card panel, chance panel, message boxes.
- Cursor `dat\interface\cursor.spr`.

Exact pixel hit-boxes: **not** extracted (resolution-dependent sprites).

---

## 14. Remake implementation priorities

1. Load `data/map_<id>.json` walk graph (`next`/`neighbours`) + eyeball against `overlay_*.png`.  
2. Turn loop + d6 movement; tick pacing from §8.  
3. Buy / upgrade / rent using §4; start cash 5000.  
4. Apply `chance_effects.json` / `word_card_effects.json` opcodes.  
5. Win/bankruptcy from §9 (`rules_core.json`).  
6. SpBuilding / temple / lock / hospital / jail.  
7. AI heuristics from `ai_rules.json`.  
8. Mini-games optional stretch.

## 15. Verified vs inferred (gap closure status)

| Item | Status |
|------|--------|
| All 3 `.mab` → JSON + overlay PNG | **VERIFIED** world `(x,y)` + image `(ix,iy)=(x,y)-origin`; types/prices/edges; path `next[]` cover **INFERRED**. Fixed prior bbox-fit overlay bug. |
| Starting cash 5000 / jackpot 5000 | **VERIFIED** |
| Year options 156/260/520/-1 weeks | **VERIFIED** |
| Win predicate (year limit \| last standing) + richest wins | **VERIFIED** `0x403200`/`0x4031a0` |
| Bankruptcy → status=-1 when netWorth < 0 | **VERIFIED**; sell-order **PARTIAL** |
| `0x40e330` | **VERIFIED** Winner UI only (not predicate) |
| Chance/word effect opcodes JSON | **VERIFIED** from ExtText; property-pick **INFERRED** |
| GAME_SPEED → ms via `1000/speed` | **VERIFIED**; walk frames/step **INFERRED** |
| AI attrack table | **VERIFIED** data; decision policy **INFERRED** |

## 16. File index

| Path | Contents |
|------|----------|
| `spec/SPEC.md` | This document |
| `spec/data/map_{0,1,2}.json` / `map_{hongkong,kowloon,ancient}.json` | Full board graphs |
| `spec/overlay_{0,1,2}.png` (+ name aliases) | Path/index eyeball overlays (full res) |
| `spec/overlay_*_preview.jpg` | Downscaled previews |
| `spec/data/chance_cards.json` / `chance_effects.json` | 26 chance + opcodes |
| `spec/data/word_cards.json` / `word_card_effects.json` | 16 word cards + opcodes |
| `spec/data/rules_core.json` | Cash / years / win / speed |
| `spec/data/ai_rules.json` | attrack + inferred policy |
| `spec/data/economy.json` | Rent/inflation tables |
| `spec/data/characters.json` | 12 characters |
| `spec/data/maps.json` / `sp_buildings.json` | Specials / c1–c9 |
| `spec/data/audio.json` / `meta.json` / `minigame02_weights.json` | Audio / enums / MG02 |

**Binary cited:** `/workspace/lfzdfw-analysis/extract/omasterq.exe` (also under `lfzdfw-clean/`).  
**Raw data/assets (read-only):** `/workspace/lfz-remake/raw/omasterq/`, `/workspace/lfz-remake/assets/`.
