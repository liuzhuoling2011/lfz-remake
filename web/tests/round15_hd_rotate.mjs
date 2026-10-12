// Regression: HD mode keeps an AI-upscaled ground in all 4 orientations (hd/ground/<map>_r1..3).
import { chromium } from 'playwright'; import path from 'path';
const base = process.env.BASE || 'http://127.0.0.1:4174/'; const out = path.resolve('../screenshots/round15');
const b = await chromium.launch(); let fail = 0;
for (const map of [0, 1, 2]) {
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(base + `?scene=game&map=${map}&mute&q=hd`);
  await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 }); await page.waitForTimeout(3000);
  for (let r = 1; r <= 3; r++) {
    await page.evaluate(() => window.__lfz.scene.view.rotate()); await page.waitForTimeout(4000);
    const s = await page.evaluate(() => { const v = window.__lfz.scene.view; return { rot: v.rot, key: v.groundKey, n: v.ground ? v.ground.size : 0 }; });
    const good = s.rot === r && s.key.endsWith('_r' + r) && s.n > 0; if (!good) fail++;
    console.log(good ? 'OK  ' : 'FAIL', `map${map} rot${r}`, JSON.stringify(s));
    if (map === 0) await page.screenshot({ path: path.join(out, `hd_rot${r}.png`) });
  }
  await page.close();
}
await b.close(); process.exit(fail ? 1 : 0);
