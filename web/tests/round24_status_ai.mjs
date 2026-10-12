// Round 24: single status overwrite (kind/weeks) + AI card gates
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const base = process.env.BASE || 'http://127.0.0.1:4174/';
const out = path.resolve('../screenshots/round24');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
let fail = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fail++; };

const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', e => console.log('pageerror', e.message));
await page.goto(base + '?scene=game&map=0&mute');
await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 });
await page.waitForTimeout(500);

const st = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[0]; const T = g.players[1];
  e.info = async () => {}; e.ui.toast = () => {}; e.speak = () => {};
  const clearEx = (x) => {
    x.status.kind = 0; x.status.weeks = 0;
    Object.assign(x.status, { hospital:0,jail:0,frozen:0,confused:0,dropMoney:0,cardImmune:0,badGodImmune:0,smallmanImmune:0,wealthGod:0,skip:0,stay:0,badGod:0 });
  };

  // 1) card 神智 → kind 6 (strip 化險 so defense doesn't eat the hit)
  clearEx(p); clearEx(T); T.cards = [];
  p.cards = [6];
  await e.useCard(p, 6, T.seat);
  const afterConf = { Tk: T.status.kind, Tw: T.status.weeks, Tc: T.status.confused };

  // 2) god blocks card status write
  clearEx(T); T.cards = [];
  g.mapGod = { tile: T.tile, type: 1, attachedTo: T.seat };
  T.status.kind = 10; T.status.weeks = 4; T.status.wealthGod = 4;
  p.cards = [7];
  await e.useCard(p, 7, T.seat);
  const godBlock = { Tk: T.status.kind, Tw: T.status.weeks, Tf: T.status.frozen, attached: g.mapGod.attachedTo };

  // 3) hospital force-overwrites god
  clearEx(p);
  g.mapGod = { tile: p.tile, type: 3, attachedTo: p.seat };
  p.status.kind = 12; p.status.weeks = 3; p.status.wealthGod = 3;
  e.teleportTo = async () => {};
  await e.sendTo(p, 'hospital', 3);
  const hospOver = { kind: p.status.kind, weeks: p.status.weeks, hosp: p.status.hospital, wealth: p.status.wealthGod, attached: g.mapGod.attachedTo };

  // 4) god attach type2 → kind 11
  clearEx(p);
  g.mapGod = { tile: p.tile, type: 2, attachedTo: null };
  p.status.kind = 3; p.status.weeks = 2; p.status.cardImmune = 2;
  await e.godAttach(p);
  const attach = { kind: p.status.kind, weeks: p.status.weeks, wealth: p.status.wealthGod, immune: p.status.cardImmune, attached: g.mapGod.attachedTo };

  // 5) 否極 clears only 6/7
  clearEx(p); g.mapGod.attachedTo = null;
  p.status.kind = 6; p.status.weeks = 2; p.status.confused = 2;
  p.cards = [15];
  await e.useCard(p, 15, p.seat);
  const clear67 = { kind: p.status.kind, conf: p.status.confused };
  p.status.kind = 5; p.status.weeks = 2; p.status.frozen = 2; p.cards = [15];
  await e.useCard(p, 15, p.seat);
  const clear5 = { kind: p.status.kind, frozen: p.status.frozen };

  // 6) grey via kind
  clearEx(p); g.mapGod = { tile: 0, type: 1, attachedTo: null };
  const normal11 = e.cardUsable(p, 11);
  p.status.kind = 6; p.status.weeks = 2; p.status.confused = 2;
  const clear15 = e.cardUsable(p, 15);
  p.status.kind = 10; p.status.weeks = 4; p.status.wealthGod = 4;
  g.mapGod = { tile: p.tile, type: 1, attachedTo: p.seat };
  const godOnly = { 11: e.cardUsable(p, 11), 1: e.cardUsable(p, 1), 15: e.cardUsable(p, 15) };

  return { afterConf, godBlock, hospOver, attach, clear67, clear5, normal11, clear15, godOnly };
});

ok(st.afterConf.Tk === 6 && st.afterConf.Tc > 0, 'card 神智 → kind=6: ' + JSON.stringify(st.afterConf));
ok(st.godBlock.Tk === 10 && st.godBlock.Tf === 0, 'god blocks 一曝 write: ' + JSON.stringify(st.godBlock));
ok(st.hospOver.kind === 1 && st.hospOver.weeks === 3 && st.hospOver.attached === null && st.hospOver.wealth === 0,
  'hospital force overwrites god: ' + JSON.stringify(st.hospOver));
ok(st.attach.kind === 11 && st.attach.weeks === 4 && st.attach.immune === 0 && st.attach.attached === 0,
  'godAttach type2 → kind=11 weeks=4: ' + JSON.stringify(st.attach));
ok(st.clear67.kind === 0 && st.clear5.kind === 5, '否極 clears 6/7 only: ' + JSON.stringify({ clear67: st.clear67, clear5: st.clear5 }));
ok(st.normal11 === false && st.clear15 === true && st.godOnly[11] && !st.godOnly[1] && !st.godOnly[15],
  'grey via kind: ' + JSON.stringify({ n11: st.normal11, c15: st.clear15, god: st.godOnly }));

const ai2 = await page.evaluate(() => {
  const AI = window.__lfz.AI; const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
  g.mapGod = { tile: p.tile, type: 3, attachedTo: p.seat };
  p.status.kind = 12; p.status.weeks = 4; p.status.wealthGod = 4; p.status.confused = 0; p.status.dropMoney = 0;
  p.cards = [1, 5, 6, 7, 11, 12];
  const godPicks = [];
  for (let i = 0; i < 15; i++) { const c = AI.chooseCard(g, e.b, p); godPicks.push(c && c.card); }

  g.mapGod.attachedTo = null; p.status.kind = 6; p.status.weeks = 2; p.status.confused = 2; p.status.wealthGod = 0;
  p.cards = [15, 1, 6];
  const clear = AI.chooseCard(g, e.b, p);

  p.status.kind = 0; p.status.weeks = 0; p.status.confused = 0;
  const T = g.players[1];
  g.mapGod = { tile: T.tile, type: 1, attachedTo: T.seat };
  T.status.kind = 10; T.status.weeks = 4; T.status.wealthGod = 4;
  T.status.hospital = 0; T.status.jail = 0; T.status.frozen = 0; T.alive = true;
  for (const o of g.players) {
    if (o.seat === 1) continue;
    o.status.kind = 0; o.status.weeks = 0; o.status.wealthGod = 0;
    o.status.hospital = 0; o.status.jail = 0; o.status.frozen = 0; o.alive = true;
  }
  p.cards = [7, 6, 8];
  let offense = null;
  for (let i = 0; i < 50; i++) { offense = AI.chooseCard(g, e.b, p); if (offense) break; }
  return { godPicks, clear, offense, hasAI: !!AI };
});

ok(ai2.hasAI, 'AI exposed on __lfz');
ok(ai2.godPicks.every(c => c === 11 || c === null) && ai2.godPicks.some(c => c === 11),
  'AI god → only 驅鬼: ' + JSON.stringify(ai2.godPicks));
ok(ai2.clear && ai2.clear.card === 15, 'AI clears 6/7 with 否極: ' + JSON.stringify(ai2.clear));
ok(!ai2.offense || ai2.offense.target !== 1, 'AI offense avoids god target seat1: ' + JSON.stringify(ai2.offense));

await page.evaluate(() => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
  g.mapGod.attachedTo = null;
  p.status.kind = 1; p.status.weeks = 3; p.status.hospital = 3;
  p.status.confused = 0; p.status.wealthGod = 0; p.status.frozen = 0;
  e.onChange();
});
await page.waitForTimeout(400);
await page.screenshot({ path: out + '/status_hospital_kind1.png' });

await page.evaluate(() => {
  const e = window.__lfz.engine; const p = e.g.players[0];
  p.status.kind = 10; p.status.weeks = 4; p.status.wealthGod = 4; p.status.hospital = 0;
  e.g.mapGod = { tile: p.tile, type: 1, attachedTo: p.seat };
  e.syncGodActor(); e.onChange();
});
await page.waitForTimeout(400);
await page.screenshot({ path: out + '/status_god_kind10.png' });

await page.evaluate(() => {
  const e = window.__lfz.engine; const p = e.g.players[0];
  e.g.mapGod.attachedTo = null; p.status.kind = 5; p.status.weeks = 2; p.status.frozen = 2; p.status.wealthGod = 0;
  e.onChange();
});
await page.waitForTimeout(300);
await page.screenshot({ path: out + '/status_frozen_kind5.png' });

// card grey list under god
await page.evaluate(() => {
  const e = window.__lfz.engine; const p = e.g.players[0];
  e.g.mapGod = { tile: p.tile, type: 3, attachedTo: p.seat };
  p.status.kind = 12; p.status.weeks = 4; p.status.wealthGod = 4;
  p.cards = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
});
await page.evaluate(() => window.__lfz.scene.turnMenuRes?.('card'));
await page.waitForTimeout(500);
await page.screenshot({ path: out + '/card_grey_god.png' });
await page.evaluate(() => { const d = window.__lfz.scene.dlgs.at(-1); d?.resolve(null); });

console.log(fail ? `FAILED ${fail}` : 'ALL OK');
await b.close();
process.exit(fail ? 1 : 0);
