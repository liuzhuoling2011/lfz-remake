// Round-4 UI: original HUD (info.spr/round.spr), loadsave carousel, smessagebox exit confirms, main-menu 設定, loading
// screen. Real pointer clicks on hit regions; screenshots 1920x1080 + 390x844@3x. node tests/ui4.mjs [outDir]
import { chromium } from 'playwright';
const out = process.argv[2] || '/workspace/lfz-remake/screenshots';
const base = process.env.BASE || 'http://127.0.0.1:5173/';
const Q = process.env.Q || 'hd';
const browser = await chromium.launch();
const errs = []; const fails = [];
const ok = (c, m) => { if (!c) { fails.push(m); console.log('FAIL', m); } };
for (const [w, h, dpr, mob, tag] of [[1920, 1080, 1, false, '1920x1080'], [390, 844, 3, true, 'mobile3x']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mob, hasTouch: mob });
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  const hit = async (id, wait = 350) => {
    const r = await page.evaluate(id => { const h = window.__lfzApp.hits.find(h => h.id === id); return h && h.r; }, id);
    if (!r) { ok(false, `${tag}: no hit region ${id}`); return false; }
    const x = r.x + r.w / 2, y = r.y + r.h / 2;
    if (mob) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
    await page.waitForTimeout(wait); return true;
  };
  const ev = f => page.evaluate(f);
  // ---------- loading screen (select actor → 開始遊戲)
  await page.goto(base + `?scene=selectactor&mute&q=${Q}`);
  await page.waitForFunction(() => window.__scene === 'selectactor', null, { timeout: 60000 });
  await ev(() => { for (let i = 0; i < 10; i++) localStorage.removeItem('lfz.save.' + i); });
  await page.waitForTimeout(800);
  await ev(() => { window.__lfzApp.scene.start(); window.__lfzApp.scene.ready = false; });
  await ev(() => { const s = window.__lfzApp.scene; s.__hold = true; });
  // freeze the loader for the screenshot: render loading even if ready
  await ev(() => { const s = window.__lfzApp.scene; const r = s.render.bind(s); s.render = (c, w, h) => s.__hold ? s.renderLoading(c, w, h) : r(c, w, h); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/ui4_loading_${tag}.png` });
  await ev(() => { window.__lfzApp.scene.__hold = false; });
  await page.waitForFunction(() => window.__lfz && window.__lfz.scene.ready && window.__lfz.scene.turnMenuRes, null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  // ---------- HUD
  await ev(() => { const g = window.__lfz.g; g.players[1].status.jail = 2; g.players[2].status.wealthGod = 3; g.week = 11; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/ui4_hud_${tag}.png` });
  const hs = await ev(() => window.__lfzApp.hits.map(h => h.id));
  ok(['pl0', 'pl1', 'pl2', 'pl3'].every(i => hs.includes(i)), `${tag}: HUD panel hit regions`);
  await hit('pl1'); ok(await ev(() => window.__lfz.scene.overlay === 'detail' && window.__lfz.scene.detailSeat === 1), `${tag}: HUD tap opens 角色資產`);
  await hit('di-x');
  // ---------- save (empty) → save → save again (overwrite confirm) → load window
  await hit('gm-sys', 500); await hit('sy-save', 700);
  await page.screenshot({ path: `${out}/ui4_save_empty_${tag}.png` });
  await hit('ls-o', 500);
  ok(await ev(() => !!localStorage.getItem('lfz.save.1') && window.__lfz.scene.overlay === 'none'), `${tag}: save into entry 1`);
  await hit('gm-sys', 500); await hit('sy-save', 700);
  await page.screenshot({ path: `${out}/ui4_save_entry_${tag}.png` });
  await hit('ls-o', 400);
  await page.screenshot({ path: `${out}/ui4_save_overwrite_${tag}.png` });
  ok(await ev(() => window.__lfzApp.hits.some(h => h.id === 'ls-mb-o')), `${tag}: overwrite asks SaveMsg`);
  await hit('ls-mb-x', 300);
  await hit('ls-next', 300);
  ok(await ev(() => window.__lfz.scene.lsWin.idx === 1), `${tag}: ► next entry`);
  await hit('ls-x', 300);
  ok(await ev(() => window.__lfz.scene.overlay === 'none'), `${tag}: X closes save window`);
  // ---------- exit confirm (in game)
  await hit('gm-sys', 500); await hit('sy-exit', 400);
  await page.screenshot({ path: `${out}/ui4_exit_game_${tag}.png` });
  await hit('q-x', 300);
  ok(await ev(() => window.__lfz.scene.overlay === 'none'), `${tag}: exit X cancels`);
  // ---------- load window (in game)
  await hit('gm-sys', 500); await hit('sy-load', 700);
  await page.screenshot({ path: `${out}/ui4_load_game_${tag}.png` });
  await hit('ls-x', 300);
  // ---------- main menu: 設定 / 讀取進度 / 離開
  await page.goto(base + `?scene=mainmenu&mute&q=${Q}`);
  await page.waitForFunction(() => window.__scene === 'mainmenu', null, { timeout: 60000 });
  await page.waitForTimeout(1200);
  await hit('mmopt', 600); await hit('mo-o', 500); // persist the current settings once
  await hit('mmopt', 600);
  await page.screenshot({ path: `${out}/ui4_menu_options_${tag}.png` });
  const s0 = await ev(() => JSON.parse(localStorage.getItem('lfz.settings') || '{}'));
  await hit('mo-spd'); await hit('mo-mus');
  const mid = await ev(() => ({ ...window.__lfzApp.scene.ed.v }));
  await page.screenshot({ path: `${out}/ui4_menu_options_edit_${tag}.png` });
  await hit('mo-x', 500);
  const s1 = await ev(() => JSON.parse(localStorage.getItem('lfz.settings') || '{}'));
  ok(mid.spd !== (s0.speed ?? 1) || mid.mus !== Math.round((s0.music ?? 1) * 3), `${tag}: option rows cycle`);
  ok(s1.speed === s0.speed && s1.music === s0.music, `${tag}: X reverts options`);
  ok(await ev(() => window.__scene === 'mainmenu'), `${tag}: X returns to main menu`);
  await page.waitForTimeout(400);
  await hit('mmopt', 600); await hit('mo-spd'); await hit('mo-o', 500);
  const s2 = await ev(() => JSON.parse(localStorage.getItem('lfz.settings') || '{}'));
  ok(s2.speed !== s0.speed, `${tag}: O keeps options`);
  await hit('mmopt', 600); await hit('mo-spd'); await hit('mo-spd'); await hit('mo-o', 500); // restore speed
  await hit('mmload', 900);
  await page.screenshot({ path: `${out}/ui4_menu_load_${tag}.png` });
  await hit('ls-next', 300); // entry 0 = autosave, entry 1 = our save
  await page.screenshot({ path: `${out}/ui4_menu_load_entry1_${tag}.png` });
  await hit('ls-o', 400);
  await page.waitForFunction(() => window.__scene === 'game' && window.__lfz && window.__lfz.scene.ready, null, { timeout: 120000 });
  ok(await ev(() => window.__lfz.g.week === 11), `${tag}: main-menu load restores the saved game`);
  await page.goto(base + `?scene=mainmenu&mute&q=${Q}`);
  await page.waitForFunction(() => window.__scene === 'mainmenu', null, { timeout: 60000 });
  await page.waitForTimeout(1000);
  await hit('mmexit', 400);
  await page.screenshot({ path: `${out}/ui4_menu_exit_${tag}.png` });
  await hit('ex-x', 300);
  ok(await ev(() => !window.__lfzApp.scene.confirmExit), `${tag}: menu exit X cancels`);
  await ev(() => { for (let i = 0; i < 10; i++) localStorage.removeItem('lfz.save.' + i); });
  await page.close();
}
console.log('fails:', fails.length, 'console errors:', errs.length, errs.slice(0, 5).join('\n'));
await browser.close();
process.exit(fails.length || errs.length ? 1 : 0);
