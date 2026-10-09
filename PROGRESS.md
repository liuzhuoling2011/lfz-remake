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
