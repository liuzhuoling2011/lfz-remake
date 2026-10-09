import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const base = process.env.BASE || 'http://127.0.0.1:4174/';
const outDir = path.resolve('../screenshots');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', e => console.log('pageerror', e.message));

async function waitGame(timeoutMs = 90000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const s = await page.evaluate(() => window.__lfz?.g ? { ok: true, map: window.__lfz.g.map } : null);
    if (s?.ok) return s;
    await page.waitForTimeout(400);
  }
  throw new Error('game not ready');
}

async function seedAndShot(q, name) {
  await page.goto(base + q);
  await waitGame();
  // let sheets load
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const l = window.__lfz;
    const g = l.g; const b = l.scene.board; const v = l.scene.view;
    const types = [4, 3, 2, 1];
    let sx = 0, sy = 0, n = 0;
    const N = Math.min(20, b.plots.length);
    for (let i = 0; i < N; i++) {
      g.plots[i] = { owner: i % 4, type: types[i % 4], level: Math.min(3, i % 4) };
      if (types[i % 4] === 4) g.players[i % 4].homePlot = i;
      sx += b.plots[i].x; sy += b.plots[i].y; n++;
    }
    const cx = sx / n, cy = sy / n;
    v.focusOn(cx, cy); v.camX = cx; v.camY = cy;
    // ensure mark sheets present
    const marks = [1,2,3,4].map(i => ({
      a: !!window.__lfzApp && true,
      m: !!(window.__lfz),
    }));
    return { n, cx, cy, map: g.map, hasMark: !!(v.constructor) };
  });
  console.log('seed', name, info);
  await page.waitForTimeout(800);
  const p = path.join(outDir, name);
  await page.screenshot({ path: p });
  console.log('shot', p);
}

await seedAndShot('?auto&turbo&mute&weeks=52&map=0', 'property_markers_four_types.png');
await seedAndShot('?auto&turbo&mute&weeks=26&map=1', 'property_markers_kowloon.png');
await seedAndShot('?auto&turbo&mute&weeks=26&map=2', 'property_markers_ancient.png');

// Mid-game natural ownership shot
await page.goto(base + '?auto&turbo&mute&weeks=52&map=0');
await waitGame();
for (let i = 0; i < 40; i++) {
  const s = await page.evaluate(() => {
    const g = window.__lfz?.g; if (!g) return null;
    return { owned: g.plots.filter(Boolean).length, week: g.week, fin: !!window.__lfz.finished };
  });
  if (s && (s.owned >= 10 || s.fin || s.week >= 20)) break;
  await page.waitForTimeout(500);
}
await page.evaluate(() => {
  const l = window.__lfz; if (!l?.g) return;
  const g = l.g; const b = l.scene.board; const v = l.scene.view;
  const owned = g.plots.map((ps, i) => ps ? i : -1).filter(i => i >= 0);
  if (!owned.length) return;
  let sx = 0, sy = 0;
  for (const i of owned.slice(0, 8)) { sx += b.plots[i].x; sy += b.plots[i].y; }
  const n = Math.min(8, owned.length); v.focusOn(sx / n, sy / n); v.camX = sx / n; v.camY = sy / n;
});
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(outDir, 'property_markers_ingame.png') });
console.log('shot ingame');
await browser.close();
