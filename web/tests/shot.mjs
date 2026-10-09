// Usage: node tests/shot.mjs <url-query> <out.png> [waitMs] [w] [h] [clicks-json]
import { chromium } from 'playwright';
const [,, q = '', out = '/tmp/s.png', waitMs = '3000', W = '1280', H = '800', actions = '[]'] = process.argv;
const base = process.env.BASE || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => logs.push('pageerror: ' + e.message));
await page.goto(base + q);
await page.waitForTimeout(+waitMs);
for (const a of JSON.parse(actions)) {
  if (a.click) await page.mouse.click(a.click[0], a.click[1]);
  if (a.wait) await page.waitForTimeout(a.wait);
  if (a.key) await page.keyboard.press(a.key);
  if (a.eval) console.log(JSON.stringify(await page.evaluate(a.eval)));
  if (a.shot) await page.screenshot({ path: a.shot });
}
await page.screenshot({ path: out });
console.log('scene', await page.evaluate(() => window.__scene), 'errors', JSON.stringify(await page.evaluate(() => window.__errors)));
console.log(logs.slice(0, 20).join('\n'));
await browser.close();
