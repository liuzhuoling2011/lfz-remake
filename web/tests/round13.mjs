// Round 13: owner marker = head marker sprite (flash on arrival only), 食肆 no owner invest, original build popups.
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const base = process.env.BASE || 'http://127.0.0.1:4174/';
const out = path.resolve('../screenshots/round13'); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
let fail = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fail++; };
await page.goto(base + '?scene=game&map=0&mute');
await page.waitForFunction(() => window.__lfz?.engine && window.__lfz.scene.turnMenuRes, null, { timeout: 120000 });
await page.waitForTimeout(2500);
const shot = n => page.screenshot({ path: path.join(out, n) });
// pick a plot, give it to seat 0 (士多 level 0), stand seat 0 on it
const pl = await page.evaluate(() => {
  const { scene, g } = window.__lfz; const b = scene.board; const v = scene.view;
  const p = g.players[0]; p.cash = 50000;
  const i = 3; const plot = b.plots[i];
  g.plots[i] = { owner: 0, type: 3, level: 0 };
  const a = v.actor(0); const t = plot.tiles[0]; p.tile = t;
  const tt = b.tiles[t]; a.x = tt.x; a.y = tt.y; v.focusOn?.(plot.x, plot.y); v.cx = plot.x; v.cy = plot.y; v.follow = null;
  return i;
});
// (c) own-house upgrade popup + (a1) flashing marker while visiting
await page.evaluate(i => { const { engine, g } = window.__lfz; window.__r = engine.property(g.players[0], i); }, pl);
await page.waitForFunction(() => window.__lfz.scene.buildDlg?.kind === 'upgrade', null, { timeout: 15000 }).catch(() => {});
const k1 = await page.evaluate(() => window.__lfz.scene.buildDlg?.kind);
ok(k1 === 'upgrade', 'own-house popup is original upgrade box: ' + k1);
await page.waitForTimeout(500); await shot('c_own_house_upgrade_popup.png');
ok(await page.evaluate(i => window.__lfz.scene.view.flashPlots.has(i), pl), 'marker flashing while visited');
await page.evaluate(() => window.__lfz.scene.buildDlg.resolve(0));
await page.evaluate(() => window.__r);
await page.waitForTimeout(150); await shot('a1_marker_flash_arrival_f1.png');
await page.waitForTimeout(140); await shot('a1_marker_flash_arrival_f2.png');
// end of turn
await page.evaluate(() => window.__lfz.scene.view.clearFlash());
await page.waitForTimeout(300); await shot('a2_marker_static_after_turn.png');
ok(await page.evaluate(i => !window.__lfz.scene.view.flashPlots.has(i), pl), 'marker static after turn');
// (b) empty lot: SelectBuilding
await page.evaluate(i => { const { engine, g } = window.__lfz; g.plots[i] = null; g.players[0].homePlot = 99; window.__r = engine.property(g.players[0], i); }, pl);
await page.waitForFunction(() => window.__lfz.scene.buildDlg?.kind === 'select', null, { timeout: 15000 }).catch(() => {});
ok(await page.evaluate(() => window.__lfz.scene.buildDlg?.kind) === 'select', 'empty-lot SelectBuilding popup');
await page.waitForTimeout(400); await shot('b_empty_lot_popup.png');
await page.evaluate(() => window.__lfz.scene.buildDlg.resolve(-1)); await page.evaluate(() => window.__r);
// (b2) first lot → 屋企 popup
await page.evaluate(i => { const { engine, g } = window.__lfz; g.players[0].homePlot = null; window.__r = engine.property(g.players[0], i); }, pl);
await page.waitForFunction(() => window.__lfz.scene.buildDlg?.kind === 'home', null, { timeout: 15000 }).catch(() => {});
ok(await page.evaluate(() => window.__lfz.scene.buildDlg?.kind) === 'home', 'empty-lot 屋企 popup');
await page.waitForTimeout(400); await shot('b2_empty_lot_home_popup.png');
await page.evaluate(() => window.__lfz.scene.buildDlg.resolve(0)); await page.evaluate(() => window.__r);
// 食肆 owner: no invest dialog
const cash = await page.evaluate(async i => { const { engine, g } = window.__lfz; const p = g.players[0];
  g.plots[i] = { owner: 0, type: 2, level: 3 }; const c0 = p.cash; let n = 0; const m = engine.ui.message; engine.ui.message = (...a) => { n++; return Promise.resolve(); };
  for (let k = 0; k < 20; k++) await engine.property(p, i); engine.ui.message = m; return { d: p.cash - c0, n }; }, pl);
ok(cash.d === 0 && cash.n === 0, '食肆 owner: no invest gain/loss over 20 visits ' + JSON.stringify(cash));
ok(errs.length === 0, 'no page errors ' + errs.join(' | '));
await browser.close(); process.exit(fail ? 1 : 0);
