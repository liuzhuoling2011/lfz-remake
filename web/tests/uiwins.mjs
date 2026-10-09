// Round-3 UI: original-style 選擇四字真言 / 角色資產 / 系統+設定 windows, driven through real pointer clicks on their
// hit regions (window.__lfzApp.hits). Screenshots at 1920x1080 and 390x844@3x. node tests/uiwins.mjs [outDir]
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
  await page.goto(base + `?scene=game&mute&q=${Q}`);
  await page.waitForFunction(() => window.__lfz && window.__lfz.g && window.__lfz.scene.turnMenuRes, null, { timeout: 120000 });
  await page.waitForTimeout(2000);
  const hit = async id => {
    const r = await page.evaluate(id => { const h = window.__lfzApp.hits.find(h => h.id === id); return h && h.r; }, id);
    if (!r) { ok(false, `${tag}: no hit region ${id}`); return false; }
    const x = r.x + r.w / 2, y = r.y + r.h / 2;
    if (mob) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
    await page.waitForTimeout(350); return true;
  };
  const ids = () => page.evaluate(() => window.__lfzApp.hits.map(h => h.id));
  // board: no extra corner buttons any more
  await page.screenshot({ path: `${out}/ui3_board_${tag}.png` });
  const hs = await ids();
  ok(!hs.includes('sysbtn') && !hs.includes('camc'), `${tag}: corner buttons removed`);
  // ring menu → 四字真言 → original card window
  await hit('gm-card'); await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/ui3_cards_${tag}.png` });
  await hit('cs-dn'); await hit('cs-dn'); await hit('cs-row4');
  await page.screenshot({ path: `${out}/ui3_cards_scrolled_${tag}.png` });
  const before = await page.evaluate(() => window.__lfz.g.players[window.__lfz.g.current].cards.length);
  await hit('cs-x');
  ok(await page.evaluate(() => !window.__lfz.scene.dlgs.length), `${tag}: X closes the card window`);
  // ring menu → 角色資產
  await hit('gm-info'); await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/ui3_detail_${tag}.png` });
  await hit('di-tab1');
  ok(await page.evaluate(() => window.__lfz.scene.detailSeat === window.__lfz.g.players.filter(p => p.alive)[1].seat), `${tag}: tab selects player`);
  await page.screenshot({ path: `${out}/ui3_detail_p2_${tag}.png` });
  await hit('di-x');
  ok(await page.evaluate(() => window.__lfz.scene.overlay === 'none'), `${tag}: detail closes`);
  // ring menu → 系統 → 設定
  await hit('gm-sys'); await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/ui3_system_${tag}.png` });
  await hit('sy-opt'); await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/ui3_options_${tag}.png` });
  const s0 = await page.evaluate(() => JSON.parse(localStorage.getItem('lfz.settings') || '{}'));
  await hit('op-spd'); await hit('op-mus');
  const mid = await page.evaluate(() => window.__lfz.scene.opt);
  await hit('op-x');
  const s1 = await page.evaluate(() => ({ ov: window.__lfz.scene.overlay }));
  ok(s1.ov === 'system', `${tag}: X returns to system`);
  ok(mid && mid.spd !== mid.orig.spd, `${tag}: speed row cycles`);
  await hit('sy-x');
  ok(await page.evaluate(() => window.__lfz.scene.overlay === 'none'), `${tag}: system closes`);
  // use a card through the window (second tap on the highlighted row = use)
  await hit('gm-card'); await page.waitForTimeout(300); await hit('cs-o'); await page.waitForTimeout(1500);
  const after = await page.evaluate(() => window.__lfz.g.players[window.__lfz.g.current].cards.length);
  console.log(tag, 'cards before/after O:', before, after, 'settings', JSON.stringify(s0));
  await page.close();
}
console.log('fails:', fails.length, 'console errors:', errs.length, errs.slice(0, 5).join('\n'));
await browser.close();
