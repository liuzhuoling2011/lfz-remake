// Captures the remake side of the round-15 comparisons (+ the original-layout NPC panel via the rebuilt chance.spr renderer).
import { chromium } from 'playwright'; import path from 'path';
const base = process.env.BASE || 'http://127.0.0.1:4174/'; const out = path.resolve('../screenshots/round16');
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(base + '?scene=game&map=0&mute');
await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 }); await page.waitForTimeout(2500);
await page.evaluate(() => { window.__lfz.scene.walkOpen = false; });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, '_board.png') });
const shot = async (n, js) => {
  await page.evaluate(js => { window.__p = eval(js); }, js); await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(out, n) });
  await page.evaluate(() => { const s = window.__lfz.scene; while (s.dlgs.length) s.dlgs[s.dlgs.length - 1].resolve(undefined); });
  await page.waitForTimeout(200);
};
const NPC = "(()=>{const D=window.__lfz; return D.engine.ui.message('流氓阿飛向老夫子動手！老夫子被打至重傷入院。', { title: '流氓', image: 'images/cards/character08_attack.jpg', kind: 'npc' });})()";
await shot('remake_bankrupt.png', "window.__lfz.engine.ui.message('大番薯破產了！', { badge: 'gameover' })");
await shot('remake_npc.png', NPC);
await shot('remake_players.png', "window.__lfz.engine.ui.pickPlayer('你要對誰使用？', [1,2,3])");
await shot('remake_steps.png', "window.__lfz.engine.ui.pickSteps()");
await b.close();
