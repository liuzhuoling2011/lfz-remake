// Per-map screenshots of Round 17 restyled panels + a short autoplay frame.
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const base = process.env.BASE || 'http://127.0.0.1:4174/';
const root = path.resolve('../screenshots/round17');
const b = await chromium.launch();
for (const map of [0, 1, 2]) {
  const out = path.join(root, `map${map}`);
  fs.mkdirSync(out, { recursive: true });
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(base + `?scene=game&map=${map}&mute`);
  await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 });
  await page.waitForTimeout(2000);
  const U = 'window.__lfz.engine.ui';
  const open = js => page.evaluate(js => { window.__r = 'pending'; Promise.resolve(eval(js)).then(v => { window.__r = v === undefined ? 'undef' : v; }); }, js);
  const close = async () => {
    await page.evaluate(() => { const s = window.__lfz.scene; while (s.dlgs.length) s.dlgs[s.dlgs.length - 1].resolve(s.dlgs[s.dlgs.length - 1].auto?.value ?? s.dlgs[s.dlgs.length - 1].buttons?.[0]?.value); });
    await page.waitForTimeout(250);
  };
  const shot = async (n, js) => {
    await open(js); await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(out, n) });
    await close();
  };
  await shot('bankrupt.png', `${U}.message('破產了！', { badge: 'gameover' })`);
  await shot('npc_pictured.png', `${U}.message('流氓阿飛動手！', { title: '流氓', image: 'images/cards/character08_attack.jpg', kind: 'npc' })`);
  await shot('npc_no_picture.png', `${U}.message('財神降臨！免費過路！', { title: '財神', kind: 'npc' })`);
  await shot('choose_player.png', `${U}.pickPlayer('你要對誰使用？', [1,2,3])`);
  await shot('choose_steps.png', `${U}.pickSteps()`);
  // short autoplay frame: force a few turbo AI turns then capture board
  await page.goto(base + `?scene=game&map=${map}&auto&turbo&mute&weeks=4`);
  await page.waitForFunction(() => window.__lfz?.g && window.__lfz.g.week >= 1, null, { timeout: 120000 }).catch(() => null);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(out, 'autoplay.png') });
  console.log('map', map, 'done', fs.readdirSync(out).join(','));
  await page.close();
}
await b.close();
