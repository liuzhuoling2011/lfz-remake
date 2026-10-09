// measures time from GameScene start to ready + screenshots mid-load. node tests/loadtime.mjs out.png
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://127.0.0.1:5173/'; const Q = process.env.Q || 'hd';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto(base + `?scene=selectactor&mute&q=${Q}`);
await p.waitForFunction(() => window.__scene === 'selectactor', null, { timeout: 60000 });
await p.waitForTimeout(Number(process.env.WAIT || 1500));
p.on('console', m => { if (m.text().startsWith('T ')) console.log(m.text()); });
const t0 = Date.now();
await p.evaluate(() => window.__lfzApp.scene.start());
await p.waitForTimeout(400);
await p.screenshot({ path: process.argv[2] || '/tmp/loading.png' });
await p.waitForFunction(() => window.__lfz && window.__lfz.scene.ready, null, { timeout: 120000, polling: 50 });
console.log('load ms', Date.now() - t0);
await b.close();
