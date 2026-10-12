## Round 14 — exe economy audit, original message boxes, ring-menu rotate button (2026-10-12 Asia/Shanghai)

- Ring centre button (game_menu 13): exe @0x40ff3f → FUN_00414810 rotates the map 90° (global 0x448704 = (r+1)&3). MapView.rotate(): (x,y)→(−2y, x/2), (gx,gy)→(−gy,gx), 4-group SPR sheets advance one direction group; test tests/round14_rotate.mjs.
- Economy fixed to exe: build cost value(land,type,exe L1) (@0x40c33e/0x4128d2), new buildings at exe level 1, max exe 3 (remake 0..2); upgrade cost = current value (@0x417c92); 財神 builds/upgrades free (@0x4128c2/0x410900) and 士多 invest gain-only; gain tile +scale(50) (財神 ×2, jackpot +X or X/2); lose tile −scale(50); 打小人 scale(20); salary accrues scale(50)/week, paid stepping on 洋行 'of' (+jackpot half), start tile no effect; 住宅 value/20 weekly to homeMoney only with a 屋企 and not in hospital/jail, jackpot +half; 得而復失 per step 1/4 chance (1–2)%.
- Plain messages / yes-no prompts now use smessagebox (@0x40b850, flags 0/1/3).
- tests: property_rules (updated), round13, round14_rotate, round14_popups, autoplay maps 0–2.

## Round 13 — unified owner marker, 食肆 no invest, original build popups, exe 士多 invest (2026-10-12 Asia/Shanghai)

- Owner marker on houses now uses the head marker sprite `map/playermark0N` at the same scale/bob (was `playermark0N_2`). Flashes only while the plot is visited this turn (`flashPlots`), static frame 0 after `clearFlash()` at turn end.
- 食肆 owner landing: no investment. Only 士多 (exe @0x412908 checks plot type == 1).
- 士多 invest VERIFIED @0x412912: X = land base (scaled land price); delta = rand() % 4X − 2X (uniform [−2X, 2X−1]) on every owner landing; ctx flag [+0x14]==1 skips −2X (gain-only, flag meaning unknown, not wired). Messages ExtText type1_1/type1_2.
- Empty lot: original SelectBuilding window @0x40c1a0 — messagebox.spr at (W/2, H/2+40), level-1 樓1/商業1/食市1 previews clickable at (−100+100i, +20), X = frames 4-6. First lot: 屋企 window @0x40c440 (Hometitle/homeText, O/X). Own house upgrade: smessagebox @0x40b850 flags 3 with uplevelBuilding (call @0x410877).
- tests/round13.mjs; screenshots/round13/.


## Round 12 — home calculator digit alignment (2026-10-10 Asia/Shanghai)

- Fixed 屋企 存/取 LCD: digits now right-align onto the 9 baked shadow-8 slots in `calculater.spr` (centers 74+20·i).
- Account for panel SPR hx/hy (−12,−11) via panel-local origin; use `calcnumber2` at full scale (draw at scx−10, y=53).
- Screenshot: `screenshots/r12_home_calculater_aligned.png`, `screenshots/r12_panel_exact_2x.png`.

## Round 11 — marker flash, home calculater, debug map-teleport (2026-10-10 Asia/Shanghai)

- Owner markers: animate (`flashPlots`) only while a plot is being visited this turn; `clearFlash()` at turn end → static frame 0 afterwards.
- 家 存/取: original `interface/calculater` + `calcnumber2` LCD UI (存/取 modes, O/X/C, ±100, 一半/全部).
- Debug 傳送: arms button (裝填中); next map click teleports human; Esc or Debug toggle cancels.


## Round 10 — property rules + ferry loop (2026-10-10 Asia/Shanghai)

- Owner markers: seat-coloured `playermark0N_2` bob above every owned building (not only 家).
- Four types by **id** (`PLOT.SHOP/RESTAURANT/RESIDENCE/HOME`); display names via `plotTypeName(ancient)` (士多/食肆/住宅/屋企 vs 商舖/酒樓/民宅/府邸). Buy cost lines still ExtText.
- Rent: VERIFIED FUN_00417b90 — 住宅(type3) charges **0**; 士多/食肆 value/2; 家 visit 5–10% cash. Fixed remake bug that billed 住宅 as visit gift.
- 家 landing: 存錢/取錢 dialog (half/all); AI parks surplus / withdraws when low. Pass-by auto-deposit removed.
- 住宅: weekly `residenceIncomePct` of plot value → `homeMoney` (float toast).
- 士多/食肆: owner landing → random `investDelta` + ExtText type1_1/type1_2 (seasonal shop sweep removed).
- Upgrade still max level 3 when owner lands.
- Ferry/tram/cart: `land(p, { skipTransport: true })` after teleport so 九龍渡海 / 古代馬車 pairs cannot A↔B loop. HK single tram unchanged.
- Tests: `tests/property_rules.mjs`, `tests/ferry_loop.mjs`, `tests/property_shot.mjs`; autoplay 26w map0 winner, 0 errors. Shots: `screenshots/property_markers_*.png`.
- Debug: translucent **Debug** button left of 全螢幕; panel for ±cash, force next dice (1–2), teleport tile. `?debug` opens it. Testing only.

# 老夫子大富翁 Web Remake — Progress

- 2026-10-09 01:13 (Asia/Shanghai) — Web worker started: read SPEC/MANIFEST, inspected boards/maps/sprites; scaffolding Vite+TS project in web/.
- 2026-10-09 01:38 (Asia/Shanghai) — Engine/UI complete; tsc clean. Title/menu/setup scenes render with original sprites; dev server verified headless, 0 console errors.
- 2026-10-09 01:38 (Asia/Shanghai) — Board adapter switched to fixed spec/data/map_*.json (neighbours[] graph, next[] default facing, plots.adjacentWalk, landmarks); legacy assets/data/boards available via ?legacyboard.
- 2026-10-09 01:38 (Asia/Shanghai) — AI-only autoplay (?auto&turbo&mute&weeks=26) reached winner screen, 104 turns, 0 errors. Fixed chance/word-card data unwrapping ({cards:[]}), winner sprite anchor, camera clamping.
- 2026-10-09 01:38 (Asia/Shanghai) — Screenshots saved in screenshots/ (title, mainmenu, setup_year/map/characters, ingame_hongkong/kowloon/ancient, popup_chance, popup_card, mobile_*). Production build web/dist (60 MB incl. assets; JS 88.6 kB / 31.6 kB gz), verified from a subfolder.
- 2026-10-09 01:39 (Asia/Shanghai) — Final: winner overlay drop-in animation fixed; 52-week AI game (208 turns) and 13-week game both reached winner with 0 console errors; dist rebuilt (JS 88.6 kB / 31.6 kB gz, total 60 MB) and verified from /dist/ subfolder incl. mobile portrait.

## Phase 2 — fixes from the user's play test (2026-10-09, Asia/Shanghai)
- 07:30 Static RE of omasterq.exe (objdump + REA): dice dialog @0x4089d0, walk.spr one/two-dice panel @0x4085b0, turn handler @0x410d00 (steps = d1+d2, no doubles rule), AI dice d2 = rand()%7, speak() @0x416770 + GOOD/BAD tables @0x442c34/0x442c40, playSfx @0x40fa40 call sites.
- 07:38 Engine rewrite: 16-card starting hand, AI decisions → non-blocking toasts, random forks (arrows removed), one/two dice, voice/SFX mapped per call site, chance op names fixed to spec.
- 07:44 View rewrite: rAF/delta-time continuous walking (distance-synced walk cycle), smooth-damp camera, scaffold→rise→dust construction, static scenery baked into ImageBitmap chunks with occluder redraw (CPU render 23 ms → 8.5 ms/frame @1280x800; headless rAF p95 16.8 ms), allocation-free draw list, frame-clock wait().
- 07:50 UI: card.spr cast popup + chance.spr alignment measured from the sprites, ring menu + walk.spr dice panel (keys 1/2), two-dice animation with bounce, toasts; audio preloaded + unlocked on first gesture, verified via window.__lfzAudio.log.
- 07:53 Tests: 12 turbo games (26/52 weeks, all maps) + real-speed games → winner, 0 console errors. Screenshots via tests/screens2.mjs.
- 07:56 Built and redeployed to NAS (/lfz/index.html → 200).

## Phase 3 — HD graphics (2026-10-09, Asia/Shanghai)
- 08:35 Box has no GPU/Vulkan → PyTorch CPU venv (/workspace/hdtools/venv, spandrel). Candidates: realesr-animevideov3, RealESRGAN_x4plus_anime_6B, RealESRGAN_x4plus; comparisons in screenshots/hd_compare_*.png.
- 08:45 Chosen: animevideov3 for map/* (keeps dither/texture, 4x faster), anime_6B for UI/cards/chance (clean lines, removes JPEG artefacts); x4plus rejected (smears ornaments, 12x slower). Bitmap fonts not AI-upscaled (vector CJK text used).
- 08:50 tools/upscale.py batch (nohup, spawn pool 4×2 threads, resumable): sprites 691 s, images 72 s, in-context ground layer 127 s. Scales: map 2x (4x net → Lanczos), interface 4x, menus/misc 2x, cards 4x. Edge-padded RGB, separate alpha, frame rects ×S exact. Output webp q85 in web/public/assets/hd (62.4 MB vs SD 22 MB).
- 09:00 Renderer: HD sheets drawn at 1/scale, 2x baked chunk cache with HD ground tiles, auto SD/HD by DPR×viewport and deviceMemory, 'lite' tier on touch, ?q= override, 選項 畫質 自動/標準/高清; per-map lazy load + deferred non-essential sheets.
- 09:07 Autoplay on dist for q=hd/lite/sd → winners, 0 console errors; screenshots hd_board/closeup/card_* and hd_before_after_*.

## Round 3 — flicker + original windows (2026-10-09, Asia/Shanghai)
- 09:30 Flicker root cause: the hard-coded animated-scenery list cycled 大山 big_hill, 碼頭 pier and 荷花 sea_fllower_0102. Those sheets hold distinct *variants* (SPR anim_param = 0), so hills and harbour piers swapped shape every 140 ms on all maps. Animation is now taken from the SPR header (anim_param > 0 and more than 1 frame per group, `isAnimated`). This also correctly animates the 斑馬燈 beacons. The frame index stays inside its direction group. tools/upscale.py uses the same rule; the HD ground set is unchanged.
- 09:40 tests/flicker.mjs records 16 frames at a fixed camera per spot (hills, piers, ships, flowers), maps 0/1/2 × SD/HD, and diffs them against sprites marked animated in the SPR data. Before the fix: Kowloon hill 180k px and ancient hill 103k px of non-animation change. After: 0 on every spot (dev and dist). Proof images: screenshots/flicker_proof_*.png.
- 09:45 Rebuilt three windows from the original sprites and exe layout (static RE):
  - 選擇四字真言: card.spr. Dialog @0x40cb10, paint @0x40d050; 5-row list with a selection band, scroll strips, X/O.
  - 角色資產: detailinfo.spr. Dialog @0x407d70, paint @0x4081b0; face tabs, home/cash/net worth, L1–L3 building table.
  - 系統 + 設定: system.spr @0x40dd60 and option.spr @0x404c60 / paint @0x405250. The option window slides in beside the system window. Row 0 (originally 螢幕區域) now holds 畫質.
  - Removed the two bottom-right buttons; their functions are in the ring menu.
- 09:49 Autoplay on dist, SD and HD × 3 maps: winners, 0 errors. tests/uiwins.mjs drives the windows with real clicks/taps at 1920x1080 and 390x844@3x: 0 failures, 0 errors.

## Round 4 — original HUD, save/load, message boxes, main-menu 設定, loading screen (2026-10-09, Asia/Shanghai)
- 10:05 HUD (exe dialog @0x4027f0, paint @0x402880/@0x402940): info.spr panel 2i (current player, bright) / 2i+1 at (20+130i, 12); face expr*2(+1) at (17+130i, 25); name (14px) at (43+130i, 8); cash right-aligned to x 108+130i, y 24; status icon = info frame status+7 at (98+130i, 12) plus remaining weeks. Status ids come from the word-card handler table @0x442e34: 1 hospital, 2 jail, 3 金鋼護體, 4 催吉避凶, 5 一曝十寒, 6 神智不清, 7 得而復失, 8 魔高一丈 (9–12 best guess). ROUND plate (round.spr 10) + digits at (W-65, 30). Narrow screens use a 2×2 layout at ≥1× scale. Tapping a panel opens 角色資產. The exe's console command ShowDetailInfo (@0x403470) is the I key.
- 10:12 The black screen after 開始遊戲 was the remake's own loader (dark fill, ~3.5 s HD). It is now the original loading dialog (@0x401d10/@0x402260): the previous screen darkened 50% with misc/loading.spr 'LOADING…' at (50, H-70). The select-actor screen prewarms the map sheets, HD ground tiles and game UI sheets (MapView.plan/prefetch). Game start after prewarm: about 0.1 s of loading work.
- 10:20 Save/load: loadsave.spr carousel (@0x40a700 create, @0x40ab30/@0x40ac10 update, @0x40b0a0 paint). It slides up from H+200 to 2H/3. Shown per save: Save/Load title, entry digit, faces with "AI", 地區 / 年期 lines, EMPTY, X/O/►/◄. LoadErr appears when there are no saves; SaveMsg asks before overwriting. 10 slots; slot 0 is the autosave. Used in game and by the main menu's 讀取進度.
- 10:22 Message box: smessagebox.spr (@0x40b850 / paint @0x40bc90), anchored at (W/2, H/2+100), O = 1-3, X = 4-6, fade-in. Used for the in-game 結束遊戲 confirm (flags 3, @0x403830) and the main-menu 離開遊戲 confirm.
- 10:25 Main-menu 設定 (dialogs registered @0x404349): option/bg TV room, option/setting rows 0/2/4/9 (+1 when pressed), level bars 6-8 / 11-13, value text at (500,30) / (210,150), option/button O 0-2 / X 3-5. Row 0 (resolution) is now 畫質, its baked label covered and relabelled. Cancel restores the exact previous settings (also fixed in the in-game window).
- 10:30 tsc clean. Autoplay on dist, SD and HD × 3 maps: winners, 0 errors. tests/uiwins.mjs: 0 failures. tests/ui4.mjs (HD + SD, 1920x1080 + 390x844@3x): 0 failures, 0 errors. Screenshots: screenshots/ui4_*.

## Round 5 — original 小遊戲 mode + main menu row (2026-10-09, Asia/Shanghai)
- 10:40 Mini-game spec from static RE (spec/minigames/MINIGAMES.md, data/*.json, re/*.c). SPEC.md §11 corrected: only 01 畫展 and 04 吹氣球 award a word card (reel); 02 機械人打拍子 adds points to cash, 03 彈叉打賊 adds hits×10; standalone mode gives nothing.
- 10:55 web/src/mini: 40 fps runner (30 s timer, comic intro → zoom → ready → READY/GO → play → FINISH / TIME IS UP → result), all 4 games with original sprites, sounds and music (minigame03.mp3 for 01/03, AudioTrack07_1.mp3 for 02/04), AI per exe, word-card reel result + result2 ranking, number font with outline flag as in the exe. Input: original per-player keyboards (PgDn/Del/arrows, EQADWS, OUJLIK) + Space/Enter/Z/X, mouse, touch, on-screen pad on touch devices.
- 11:00 Board tile: random game with all eligible players (not bankrupt / hospital / jail / 一曝十寒), AI plays itself, rewards as above, map music resumes. Main menu = the original single row of 6 buttons (系統設定 · 相簿 · 小遊戲 · 新遊戲 · 載入進度 · 離開遊戲); 相簿 shows a message (album art is on Disc 2, not available). 小遊戲 → SelectActor → SelectMiniGame picker → standalone play.
- 11:05 HD sheets for minigame/ + selectminigame/ (anime_6B 2x, 326 s).
- 11:18 Tests: tests/minigames.mjs (each game standalone + board to its result, rewards, eligibility) HD / SD / mobile 390x844@3x and on dist: ALL OK, 0 errors. Autoplay maps 0/1/2 (26 + 104 weeks, SD/HD, dev + dist): winners, 0 errors, 2–8 board mini-games per game. ui4 (HD+SD) and uiwins: 0 failures. Screenshots: screenshots/mini_*.

## Round 6 — skip title, selectactor/card/detail alignment, ring bottom-left, fullscreen, slow-net load (2026-10-09, Asia/Shanghai)
- 12:00 Boot goes straight to the original 6-button main menu (title/"開始遊戲" press page skipped; attract mode still returns to TitleScene after 30 s idle). Boot only loads MENU_SHEETS; IDLE_SHEETS warm via requestIdleCallback. Original LOADING overlay kept for GameScene when map assets aren't ready yet.
- 12:05 SelectActor rebuilt from exe @0x4062e0: playerNN.spr at (W/2,H/2) via hotspots, device table 0x441820 (left oval), face table 0x441840 (right oval / actor.spr), banknote on top, button.spr title+X/O at centre. Click left oval = 玩家/電腦/關閉, right = cycle character.
- 12:10 四字真言 list text baseline-middle on the ruled lines (y=30+20i bands); cast popup title on first rule, body in the description panel below the knot. 角色資產 colour pips left of faces, height-matched to the 49px face.
- 12:12 Ring menu (game_menu.spr) moved to bottom-left (exe @0x408cb0: x=0, y=H-0x96); walk panel to its right. Bottom-left map-help legend removed; week/jackpot info box moved to bottom-right.
- 12:15 全螢幕 option in main-menu 設定 and in-game 設定 (settings.fullscreen + Fullscreen API).
- 12:18 Slow-net: SD-first sheet load with background HD upgrade (debounced assetEpoch); service worker `public/sw.js` cache-first for hashed JS/CSS + sprites/images/audio.
- 12:25 tests/ui6.mjs (HD, 1920x1080 + 390x844@3x): ALL OK, 0 errors. Autoplay (dev + dist): winners, 0 errors. TTFM @50KB/s 200ms RTT q=sd ≈ 40 s; unthrottled dist noted in commit.

## Round 7 — SelectActor devices, card overlap, detail pips, 全螢幕 row (2026-10-09, Asia/Shanghai)
- SelectActor left oval cycles 滑鼠 → 鍵盤1/2/3 → AI → 關閉; face always drawn (even when seat off). Seat.device wired to mini-game KEYBOARD01..03.
- Removed 角色資產 colour pips left of faces.
- 四字真言 list: text + selection mask sit between ruled lines (window y=43+20i) and inside red margins; description inset in the panel.
- In-game / main-menu 設定: 全螢幕 is a proper row (label left, 開/關 right) above X/O — no longer overlapping the chrome.
- tests/ui7.mjs: device cycle, cards, detail, op-fs/mo-fs geometry. README: drop LAN line; add 4 screenshots under docs/screenshots/.

## Round 8 — card list first row + grown 設定 panel (2026-10-09, Asia/Shanghai)
- 四字真言 list restored to exe rows y=30+20i (mid 40+20i) so the first card sits on the first row; selection band inset above the rule.
- 設定: 9-slice grow of option.spr frame 0 by +48px; five rows at 30/70/110/150/190; X/O shifted down onto the grown chrome. tests/ui8.mjs.

## Round 9 — floating 全螢幕 + card names between rules (2026-10-09, Asia/Shanghai)
- Reverted option.spr panel growth; removed 全螢幕 from in-game and main-menu 設定 panels.
- Added translucent ⛶ 全螢幕 toggle at screen bottom-right (above info box / over options modal).
- 四字真言 list: names at gap centres mid=ruleBot-12 (31+20i), selection mask inset inside rules & red margins; desc further inset. Before/after: screenshots/ui9_*_before/after_*.
- tests/ui9.mjs.

## Round 15
- HD ground for rotated views: `tools/upscale.py ground --rots 1,2,3` → `hd/ground/<map>_r1..r3` (all 3 maps); view loads `<map>_r<rot>` (SD fallback). Test: `tests/round15_hd_rotate.mjs`.
- Thief NPC (exe slot 0x4480b4): walks the board; passing/landing on it steals (r+10)·cash/(50 pass | 100 land) (0x4168df); breaks into a 屋企 with chance 1/(locks+1), taking (rand%40+60)% of savings (0x416357). Weekly move cadence is inferred. The old random 5% thief event was removed.
- Salary is paid mid-walk when passing 洋行 'of' (0x4169d4). Test: `tests/round15_thief_salary.mjs`.
- Comparison images (no restyle yet): `screenshots/round15/compare_{bankrupt,npc_panel,choose_player,choose_steps}.png`.

## Round 16
- Restyled to the original: bankrupt = gameOver.spr 破/產 stamp centred (@0x409160, remake adds the name line); NPC events with a picture = chance.spr card; choose-target = exe window @0x40d3b0 (smessagebox.spr at W/2,H/2+40, Misc/SelectCardTager prompt, faces (frame 1) in a row at H/2+50 spaced 200/n, X = cancel); steps = step.spr at (30, H-300) with 6 dice (normal/hover/pressed).
- Keyboard: target ←/→/Tab + Enter, 1–4, Esc; steps 1–6, arrows + Enter. Test: tests/round16_dialogs.mjs.

## Round 17
- Bankrupt: stamp only (removed remake name line under 破產).
- Choose-target: no face glow; exe paints every face at panel alpha and only plays highLight.wav on selection change (@0x40d6aa / paint @0x40d87c).
- Picture-less NPC (財神 etc.): smessagebox.spr via drawMsgBox (same as plain messages); pictured NPC still chance.spr.
- Target filter matches exe @0x40d530: exclude out / hospital / jail / **frozen (status 5 一曝十寒)**. Helper `targetCandidates` used by cards + 打小人; AI chooseCard uses the same.
- AI auto-pick: pickPlayer / pickSteps accept `{ auto }`; AI card/smallman/步步為營 go through the panels (TURBO still skips for speed). Test `round17_fixes.mjs` exercises them without turbo.
- Jockey ticket: VERIFIED @0x40b809 cash −= 2 flat (was inferred scale(200)); ask text is plain Misc/Jclub (no remake price line). Win chance still INFERRED.
- Per-map shots: `screenshots/round17/map{0,1,2}/{bankrupt,npc_pictured,npc_no_picture,choose_player,choose_steps,autoplay}.png`.

## Round 18
- Jockey win VERIFIED @0x40b4d3: five `(rand()%10)`, win iff sum==0 → P=1e-5. No char bonus. Ticket still 2; lose does not feed jackpot; win sets jackpot=0 (not init).
- Chance apply table @0x442874 mapped for all 26 ids. Lucky `add_cash` now also does jackpot += amount/2 (@0x413620/@0x4139f0). Percents 10 unscaled for cards 4/18/19 (@0x413110). 裹足不前 → frozen=1 (exe status 5 @0x413e00).
- 四字真言: 隻手遮天 20% and 人棄我取 half dump confirmed; status weeks 3 from texts; 移形換影→屋企, 多勞多得→洋行+salary already matched.
- Test: `tests/round18_chance_jockey.mjs`. Shots: `screenshots/round18/{jockey,chance_lucky,chance_bad,mantra_01,mantra_05,mantra_07,autoplay_map*}.png`.

## Round 19 — 魔高一丈 weeks, NPC amounts, chance pick filters (2026-10-12 Asia/Shanghai)

| Item | Original (exe) | Remake (before) | Fixed |
|------|----------------|-----------------|-------|
| 魔高一丈 duration | @0x418b30 status=8 weeks=**3** | guessed 3 | **verified 3** (no code change; comment) |
| 打小人 effect | @0x410a66 status=**5** weeks=**2** (same as 一曝十寒/frozen) | badGod=3 “衰神” | **frozen=2** |
| 財神 weeks | @0x410c14 GodIn: weeks=**4**, status=godType+9 | wealthGod=3 | **wealthGod=4** |
| Thug / 打手 hospital | @0x416c5d weeks=**3** (tile collision) | hospital 3 via npcEvent ~5% | weeks **OK**; rate still INFERRED (exe is collision) |
| Chance pick @0x413060 | no plots → re-roll {1,9,10,17,19,25}; else no cards → re-roll {20}; else any | badGod→bad-only pool | **ported exe filters**; removed badGod filter |
| 否極泰來 (card 15) | @0x418b60 clears status 6 or 7 only | cleared frozen too | **confused/dropMoney only** |
| 時來運轉 (card 11) | @0x4138a0 nop | cleared badGod | **nop** |

Still open: npcEventChance 5% (exe thug/gods are walkers/GodIn, not a per-turn roll); card-god as instant card vs status≥9 buff; hospital fee on entry (chance cards carry their own cash penalty; thug path has none).

tests/round19_npc_chance.mjs; screenshots/round19/; autoplay 26w maps 0–2 OK 0 errors.

## Round 20 — walkers vs tile gods (2026-10-12 Asia/Shanghai)

User clarification (verified in exe): **小偷/惡人 walk**; **財神/機械人/工程女神/卡神 are tile gods** (teleport + attach), not walkers. Removed remake `npcEventChance` 5% roll.

| Item | Original | Remake before | Fixed |
|------|----------|---------------|-------|
| Entity slots | 4 players + slot4 thief + slot5 thug + god mgr @4480bc | thief only + random npcEvent | **thief+thug walkers + mapGod** |
| Walker steps | @0x4165a0 rand%6+1 | thief 1–6 | both 1–6 |
| Thug hit | @0x416c5d hospital **3w**, no entry fee | npcEvent ~5% | **tile collision** |
| Ancient thug | slot5 → char13 tiger | PK3 in random event | **char 13 actor** |
| God spawn | @0x4140c3 weekly teleport + type 0..3 | random event | **mapGod relocate** |
| God attach | @0x410c14 weeks=**4**, status=type+9 | wealthGod=3/4 via roll | **land on tile → attach 4w** |
| Type0 機械人 | @0x4182b8 downgrade/demolish | — | **on attach** |
| Type1 財神 | passive free-spend (status≥9) | wealthGod | **GiveMoney0 + free-spend** |
| Type2 工程女神 | @0x418251 upgrade +1 | — | **on attach** |
| Type3 卡神 | @0x418180 CardGodMsg + card | instant via roll | **on attach** |
| 衰神 | **no** ActorName / no tile god; card flavor only | badGod invent | **stuck: not a god entity** |
| Hospital fee (thug) | none on entry | none | verified none |
| Chance hospital fee | card add_cash −500 scaled | same | verified |

tests/round20_walkers_gods.mjs; screenshots/round20/.

## Round 23 — 四字真言 grey tables, usecard feel, 驅鬼, hand cap (2026-10-12 Asia/Shanghai)

User: continue restoring mantra flow to original after R22 audit.

| Item | Original | Before | Fixed |
|------|----------|--------|-------|
| Grey tables | `@0x44224c/5c/6c` via status `@0x40cb10`; paint `@0x40d171` | only selectPlayer=-1 | **`cardUsable`**: god→only 驅鬼; 6/7→+和氣; else grey 驅鬼/和氣/化險 |
| 驅鬼捉邪 | `@0x410ee0` case 10 → clear + GodOut `@0x414530` | nop (wrong 時來運轉 note) | **detach mapGod + GodOut** |
| Cast UI | usecard anim + SFX12 + line `@0x417980` | full card.spr text modal | **toast + anim** (human+AI) |
| Start hand | `@0x40407f` push 0..15 (16) | 1..16 | **verified same 16** |
| cardMax | `@0x423140` growable, no hard cap | 32 INFERRED | **256 soft-cap** (doc: no hard max) |
| 步步為營 | immediate steps (R22 `179214b`) | — | kept; **deployed this round** |

tests/round23_mantra_grey.mjs; screenshots/round23/; autoplay maps 0–2.

Deploy: main `804b668`, Pages `c08ef1c`, NAS `/volume4/web/lfz/`.

## Round 22 — 衰神 CardGodMsg transfer; 財神-only free build/upgrade/invest (2026-10-12 Asia/Shanghai)

User: switch 衰神 from discard to exe `@0x418180` transfer; confirm 財神 free build+upgrade + 士多 gain-only under attach/status≥9.

| Item | Original | Before R22 | Fixed |
|------|----------|------------|-------|
| Type3 衰神 | `@0x418180` transfer 1 card → other (CardGodMsg) | per-turn discard | **transfer + CardGodMsg**; skip if no others / hand full |
| Attach copy | — | 「隨機失去一張」 | **「送給其他玩家」** |
| Free spend gate | land ctx `[+0x14]==1` (財神 type) `@0x4128c2`/`@0x410900`/`@0x41292e` | any `wealthGod>0` | **`isWealthGod` = attached && type===1 && weeks>0** |
| New build free | yes `@0x4128c2` | yes (but all gods) | **財神 only** — new builds + upgrades |
| 士多 invest | gain-only when type==1 | gainOnly via wealthGod | **`investDelta(..., isWealthGod)`** |
| Other gods | duration only | wrongly free-spend | duration via `wealthGod`; no free-spend |

tests/round22_caishen_transfer.mjs; screenshots/round22/; autoplay maps 0–2.

Deploy: main `62ae809`, Pages `6260bca`, NAS `/volume4/web/lfz/`.

## Round 21 — 衰神 per-turn discard; GodIn/Out only on attach/detach (2026-10-12 Asia/Shanghai)

User: 卡神 = 衰神; each turn while attached, discard 1 四字真言; VFX only on attach & expire.

| Item | Original | Before | Fixed |
|------|----------|--------|-------|
| Type3 name | ActorName 卡神; card text 衰神 | 卡神 + grant card | **衰神** (GOD_NAMES); discard |
| Type3 effect | @0x418180 per-land: transfer card to other (CardGodMsg) | grant on attach | **per-turn discard** (user); note exe transfers |
| Effect cadence | @0x410460→418110 after land while attached | once on attach | **godTick after each land** |
| 機械人/女神 | same 418110 per-land | once on attach | **godTick per land** |
| 財神 | 418110 no-op; free-spend | GiveMoney0 on attach | attach msg + passive; tick no-op |
| GodIn VFX | attach @0x4143c0 SFX 0x11; weekly relocate also GodIn | attach + godWeek | **attach only** (relocate silent) |
| GodOut VFX | @0x414530 on expire | on wealthGod expire | kept |

tests/round21_suishen.mjs; screenshots/round21/.
