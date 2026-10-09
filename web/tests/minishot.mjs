// quick visual probe: node tests/minishot.mjs <game> [w h dpr]
import { chromium } from 'playwright';
const [,, g = '0', W = '1280', H = '800', D = '1'] = process.argv;
const base = process.env.BASE || 'http://127.0.0.1:5173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: +D });
const errs = []; page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', e => errs.push(e.message));
await page.goto(base + '?scene=mainmenu&mute&q=' + (process.env.Q || 'sd'));
await page.waitForFunction(() => window.__scene === 'mainmenu', null, { timeout: 60000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `/tmp/mm.png` });
await page.evaluate(g => { const s = window.__setup; s.seats.forEach((x, i) => { x.on = true; x.ai = i > 0; }); window.__nav('miniplay', +g); }, g);
for (const [t, n] of [[1500, 'intro'], [4500, 'intro2'], [3500, 'zoom']]) { await page.waitForTimeout(t); await page.screenshot({ path: `/tmp/mg${g}_${n}.png` }); }
await page.keyboard.down('Space'); await page.keyboard.up('Space');
await page.waitForTimeout(6000); await page.screenshot({ path: `/tmp/mg${g}_play.png` });
console.log(await page.evaluate(() => { const R = window.__lfzMini; return { phase: R.phase, t: R.t, W: R.W, H: R.H }; }));
console.log('errors', errs);
await browser.close();
