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
