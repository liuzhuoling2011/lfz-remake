// HD verification screenshots: SD vs HD in-game board (1920x1080, mobile 3x), character close-up, card popup.
// node tests/hdshots.mjs [outDir]
import { chromium } from 'playwright';
const out = process.argv[2] || '/workspace/lfz-remake/screenshots';
const base = process.env.BASE || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const errs = [];
async function open(q, w, h, dpr, mobile) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto(base + q);
  await page.waitForFunction(() => window.__lfz && window.__lfz.g && window.__lfz.scene.turnMenuRes, null, { timeout: 120000 });
  await page.waitForTimeout(2500); // let the chunk cache (re)bake and images decode
  return page;
}
for (const [w, h, dpr, mob, tag] of [[1920, 1080, 1, false, '1920x1080'], [390, 844, 3, true, 'mobile3x']]) {
  for (const q of ['sd', 'hd']) {
    const page = await open(`?scene=game&mute&q=${q}`, w, h, dpr, mob);
    console.log(tag, q, JSON.stringify(await page.evaluate(() => window.__lfzHD())));
    await page.screenshot({ path: `${out}/hd_board_${tag}_${q}.png` });
    // character close-up: max zoom on the current player
    await page.evaluate(() => { const l = window.__lfz; const v = l.engine.view; const a = v.actor(l.g.current); v.userZoom = 3; v.lastManualPan = -1e9; v.focusOn(a.x, a.y - 40, true); });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/hd_closeup_${tag}_${q}.png` });
    await page.evaluate(() => { const v = window.__lfz.engine.view; v.userZoom = 1; });
    await page.evaluate(() => { const l = window.__lfz; void l.engine.useCard(l.g.players[0], 7, 1); });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/hd_card_${tag}_${q}.png` });
    await page.close();
  }
}
console.log('console errors:', errs.length, errs.slice(0, 5).join('\n'));
await browser.close();
