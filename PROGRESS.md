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
