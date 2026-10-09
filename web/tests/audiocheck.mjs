// Real-speed AI game with sound: verifies voice/sfx actually start (window.__lfzAudio.log) and frame pacing.
import { chromium } from 'playwright';
const [,, q = '?auto&weeks=3', secs = '70'] = process.argv;
const base = process.env.BASE || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
await page.goto(base + q);
await page.waitForTimeout(1500);
await page.mouse.click(5, 5); // first user gesture → unlockAudio
await page.waitForFunction(() => window.__lfz && window.__lfz.g, null, { timeout: 60000 });
await page.evaluate(() => { window.__ft = []; let last = performance.now(); const f = t => { window.__ft.push(t - last); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); });
await page.waitForTimeout(+secs * 1000);
const r = await page.evaluate(() => {
  const log = window.__lfzAudio.log; const ft = window.__ft.slice(5).sort((a, b) => a - b);
  const by = {}; for (const e of log) { const k = e.kind + ':' + e.name; by[k] = (by[k] || 0) + 1; }
  return { state: window.__lfzAudio.state(), n: log.length, voices: log.filter(e => e.kind === 'voice').length, sfx: log.filter(e => e.kind === 'sfx').length, by,
    frames: ft.length, p50: ft[Math.floor(ft.length * 0.5)], p95: ft[Math.floor(ft.length * 0.95)], p99: ft[Math.floor(ft.length * 0.99)], week: window.__lfz.g.week, turns: window.__lfz.g.turnCount };
});
console.log(JSON.stringify(r, null, 1));
console.log('console errors:', errs.length, errs.slice(0, 10).join('\n'));
await browser.close();
