// Bytes of image assets fetched to boot + start a game (per quality set / map).
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://127.0.0.1:8099/dist/';
const browser = await chromium.launch();
for (const q of ['sd', 'hd', 'lite']) for (const m of [0, 2]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  let bytes = 0;
  page.on('response', async r => { const u = r.url(); if (/\.(webp|jpg|png)$/.test(u)) { bytes += +(r.headers()['content-length'] || 0); } });
  await page.goto(base + `?auto&mute&map=${m}&q=${q}`);
  await page.waitForFunction(() => window.__lfz && window.__lfz.g, null, { timeout: 120000 });
  await page.waitForTimeout(4000);
  console.log(q, 'map' + m, (bytes / 1e6).toFixed(1) + ' MB images');
  await page.close();
}
await browser.close();
