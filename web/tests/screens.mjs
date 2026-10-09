// Captures the verification screenshots into ../screenshots/
import { chromium } from 'playwright';
const OUT = process.env.OUT || '/workspace/lfz-remake/screenshots';
const base = process.env.BASE || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const errs = [];
async function page(w = 1280, h = 800, mobile = false) {
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, hasTouch: mobile, isMobile: mobile });
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  return p;
}
const shots = [['title', ''], ['mainmenu', 'scene=mainmenu'], ['setup_year', 'scene=selectyear'], ['setup_map', 'scene=selectmap'], ['setup_characters', 'scene=selectactor']];
const PART = process.env.PART || 'all';
const p = await page();
if (PART === 'all') for (const [n, q] of shots) { await p.goto(base + '?mute&' + q); await p.waitForTimeout(2500); await p.screenshot({ path: `${OUT}/${n}.png` }); console.log('saved', n); }
// in-game board + chance / word-card popups (AI game at normal speed)
if (PART === 'all') for (const map of [0, 1, 2]) {
  await p.goto(base + `?auto&mute&map=${map}`); await p.waitForTimeout(6000);
  await p.screenshot({ path: `${OUT}/ingame_${['hongkong', 'kowloon', 'ancient'][map]}.png` }); console.log('saved ingame', map);
}
await p.goto(base + '?auto&mute&map=0');
const want = new Set(['chance']); const t0 = Date.now(); // AI 四字真言 casts are non-blocking toasts now; the card popup is captured by screens2.mjs
while (want.size && Date.now() - t0 < 240000) {
  await p.waitForTimeout(150);
  const k = await p.evaluate(() => { const d = window.__lfz?.scene?.dlgs; const top = d && d[d.length - 1]; return top && top.t > 450 ? top.style : null; });
  if (k && want.has(k)) { await p.screenshot({ path: `${OUT}/popup_${k}.png` }); want.delete(k); console.log('saved popup', k); }
}
// mobile portrait
const m = await page(390, 844, true);
await m.goto(base + '?auto&mute'); await m.waitForTimeout(6000); await m.screenshot({ path: `${OUT}/mobile_ingame.png` });
await m.goto(base + '?mute&scene=mainmenu'); await m.waitForTimeout(2500); await m.screenshot({ path: `${OUT}/mobile_mainmenu.png` });
console.log('console errors:', errs.length, errs.slice(0, 10).join('\n'));
await browser.close();
