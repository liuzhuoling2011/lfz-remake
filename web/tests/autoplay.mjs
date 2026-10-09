// AI-only full game: node tests/autoplay.mjs [query] [timeoutSec] [outPng]
import { chromium } from 'playwright';
const [,, q = '?auto&turbo&mute&weeks=26', tmo = '600', out = '/tmp/auto.png'] = process.argv;
const base = process.env.BASE || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
await page.goto(base + q);
const t0 = Date.now(); let last = '';
while (Date.now() - t0 < +tmo * 1000) {
  await page.waitForTimeout(3000);
  const s = await page.evaluate(() => { const l = window.__lfz; if (!l || !l.g) return null; const g = l.g;
    return { week: g.week, turns: g.turnCount, fin: !!l.finished, winner: l.winner ?? g.winner, err: l.error,
      p: g.players.map(p => `${p.char}:${p.cash}/${p.home}${p.alive ? '' : 'X'}`).join(' '), owned: g.plots.filter(x => x).length, mg: l.minigames || 0 }; });
  const line = JSON.stringify(s); if (line !== last) { console.log(Math.round((Date.now() - t0) / 1000) + 's', line); last = line; }
  if (s && (s.fin || s.err || s.winner)) break;
  if (errs.length) break;
}
await page.waitForTimeout(1500);
await page.screenshot({ path: out });
console.log('console errors:', errs.length, errs.slice(0, 10).join('\n'));
await browser.close();
