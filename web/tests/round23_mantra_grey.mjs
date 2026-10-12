// Round 23: card grey tables @0x44224c/5c/6c; 驅鬼 clears god; usecard toast (no modal cast).
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const base = process.env.BASE || 'http://127.0.0.1:4174/';
const out = path.resolve('../screenshots/round23');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
let fail = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fail++; };

const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(base + '?scene=game&map=0&mute');
await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 });
await page.waitForTimeout(600);

const grey = await page.evaluate(() => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
  // normal: 11,15,16 grey
  g.mapGod = { tile: 0, type: 1, attachedTo: null };
  p.status.wealthGod = 0; p.status.confused = 0; p.status.dropMoney = 0;
  const normal = [11, 15, 16].map(id => ({ id, u: e.cardUsable(p, id) }));
  const normalOk = [1, 4, 12].every(id => e.cardUsable(p, id));
  // status 6/7: 15 lit, 11/16 grey
  p.status.confused = 3;
  const clear = { 15: e.cardUsable(p, 15), 11: e.cardUsable(p, 11), 16: e.cardUsable(p, 16) };
  p.status.confused = 0; p.status.dropMoney = 2;
  const clear2 = e.cardUsable(p, 15);
  // god: only 11
  p.status.dropMoney = 0;
  g.mapGod = { tile: p.tile, type: 3, attachedTo: p.seat };
  p.status.wealthGod = 4;
  const god = {
    11: e.cardUsable(p, 11),
    1: e.cardUsable(p, 1),
    4: e.cardUsable(p, 4),
    15: e.cardUsable(p, 15),
  };
  return { normal, normalOk, clear, clear2, god };
});
ok(grey.normal.every(x => x.u === false) && grey.normalOk, 'normal grey 11/15/16, others lit: ' + JSON.stringify(grey.normal));
ok(grey.clear[15] && !grey.clear[11] && !grey.clear[16] && grey.clear2, 'status6/7 lights 和氣 only: ' + JSON.stringify(grey.clear));
ok(grey.god[11] && !grey.god[1] && !grey.god[4] && !grey.god[15], 'god attach only 驅鬼: ' + JSON.stringify(grey.god));

// 驅鬼 clears god
const qu = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
  e.info = async () => {}; e.ui.toast = () => {};
  g.mapGod = { tile: p.tile, type: 3, attachedTo: p.seat };
  p.status.wealthGod = 4;
  p.cards = [11, 1, 2];
  await e.useCard(p, 11, p.seat);
  return { attached: g.mapGod.attachedTo, weeks: p.status.wealthGod, has11: p.cards.includes(11) };
});
ok(qu.attached === null && qu.weeks === 0 && !qu.has11, '驅鬼 clears god + consumes card: ' + JSON.stringify(qu));

// start hand 16 unique
const hand = await page.evaluate(() => {
  const p = window.__lfz.g.players[1];
  const set = new Set(p.cards);
  return { n: p.cards.length, unique: set.size };
});
ok(hand.n === 16 && hand.unique === 16, 'start hand 16 unique: ' + JSON.stringify(hand));

// screenshots: card list normal vs god
await page.evaluate(() => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
  g.mapGod.attachedTo = null; p.status.wealthGod = 0; p.status.confused = 0; p.status.dropMoney = 0;
  p.cards = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
});
await page.evaluate(() => window.__lfz.scene.turnMenuRes?.('card'));
await page.waitForTimeout(500);
await page.screenshot({ path: out + '/grey_normal.png' });
await page.evaluate(() => { const d = window.__lfz.scene.dlgs.at(-1); d?.resolve(null); });
await page.waitForTimeout(300);

await page.evaluate(() => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
  g.mapGod = { tile: p.tile, type: 3, attachedTo: p.seat }; p.status.wealthGod = 4;
});
// need turn menu again
await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 30000 }).catch(() => {});
await page.evaluate(() => window.__lfz.scene.turnMenuRes?.('card'));
await page.waitForTimeout(500);
await page.screenshot({ path: out + '/grey_god_only_qugui.png' });
await page.evaluate(() => { const d = window.__lfz.scene.dlgs.at(-1); d?.resolve(null); });

await page.close(); await b.close();
console.log(fail ? `FAILURES ${fail}` : 'ALL OK');
process.exit(fail ? 1 : 0);
