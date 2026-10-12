// Regression: ring-menu centre button (game_menu frame 13) rotates the map 90° like the original (@0x414810).
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path';
const base = process.env.BASE || 'http://127.0.0.1:4174/';
const out = path.resolve('../screenshots/round14'); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
let fail = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fail++; };
await page.goto(base + '?scene=game&map=0&mute');
await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(out, 'rotate_0.png') });
const click = async () => {
  const r = await page.evaluate(() => { const h = [...(window.__lfzApp.prevHits||[]), ...(window.__lfzApp.hits||[])]; const x = (h || []).find(z => z.id === 'gm-rot'); return x?.r ?? x?.rect ?? null; });
  if (!r) throw new Error('gm-rot hit region not found');
  await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2);
};
const st = () => page.evaluate(() => { const v = window.__lfz.scene.view, b = v.board, a = v.actor(window.__lfz.g.current), t = b.tiles[window.__lfz.g.players[window.__lfz.g.current].tile];
  return { rot: v.rot, t0: [b.tiles[0].x, b.tiles[0].y], actorOnTile: Math.hypot(a.x - t.x, a.y - t.y) < 1 }; });
const s0 = await st();
for (let k = 1; k <= 4; k++) {
  await click(); await page.waitForTimeout(1500);
  const s = await st();
  ok(s.rot === k % 4, `click ${k}: rot=${s.rot}`); ok(s.actorOnTile, `click ${k}: token stays on its tile`);
  if (k < 4) await page.screenshot({ path: path.join(out, `rotate_${k}.png`) });
  else ok(Math.abs(s.t0[0] - s0.t0[0]) < 1 && Math.abs(s.t0[1] - s0.t0[1]) < 1, 'four turns return to the start layout');
}
ok(!errs.length, 'no page errors ' + errs.join('|'));
await browser.close(); process.exit(fail ? 1 : 0);
