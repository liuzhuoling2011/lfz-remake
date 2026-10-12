// Round 19: 魔高一丈 weeks=3, 打小人→frozen 2w, 財神 weeks=4, chance pick filters @0x413060, thug hospital 3w.
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const base = process.env.BASE || 'http://127.0.0.1:4174/';
const out = path.resolve('../screenshots/round19');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
let fail = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fail++; };

const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(base + '?scene=game&map=0&mute');
await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 });
await page.waitForTimeout(1200);

// --- config constants ---
const cfg = await page.evaluate(() => {
  const R = window.__lfz.engine.constructor === undefined ? null : null;
  // RULES is not on window; read via engine behaviour / import side effects
  return {
    wealth: eval('window.__lfz.engine.g.players[0].status.wealthGod'), // just probe
  };
});

// Read RULES by applying wealthGod / smallman paths
const rules = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[0]; const T = g.players[1];
  // wealthGodWeeks: set via npc path assignment using RULES — poke by reading after forced set
  // Import isn't exposed; infer by calling smallman internals after stubs
  T.status.frozen = 0; T.status.badGod = 0; T.status.smallmanImmune = 0; T.status.badGodImmune = 0;
  p.cash = 5000; p.ai = true;
  // Force smallman apply arithmetic (mirror engine after immunity check)
  const feeOk = p.cash >= 20;
  // Call engine.smallman with only one opponent and auto-pick — but needs UI. Directly apply what engine does:
  // We expose pickChanceIndex; for smallman call the method with stubbed ui.
  const ui = e.ui;
  const realConfirm = ui.confirm.bind(ui);
  const realPick = ui.pickPlayer.bind(ui);
  ui.confirm = async () => true;
  ui.pickPlayer = async (_t, cands) => (typeof cands[0] === 'number' ? cands[0] : cands[0]?.seat) ?? 1;
  const infoLog = [];
  const realInfo = e.info.bind(e);
  e.info = async (msg, ...a) => { infoLog.push(String(msg)); };
  T.status.frozen = 0; T.status.badGod = 0;
  const rr = Math.random; Math.random = () => 0; // wantSmallman always
  await e.smallman(p);
  Math.random = rr;
  ui.confirm = realConfirm; ui.pickPlayer = realPick; e.info = realInfo;
  const sm = { frozen: T.status.frozen, badGod: T.status.badGod, info: infoLog[infoLog.length - 1] || '' };

  // wealthGod weeks from RULES via npcEvent branch — set directly using same constant path
  // Trigger by evaluating the assignment pattern: import RULES through a side channel
  // Engine uses RULES.wealthGodWeeks — force via setting and reading config from a mini eval
  p.status.wealthGod = 0;
  // Dynamically import not available; use the fact that npcEvent sets it — stub random
  const realRand = Math.random;
  let phase = 0;
  Math.random = () => {
    // first call npcEventChance check: return 0 to always fire; second for branch: 0.5 → wealth (0.3..0.75)
    phase++;
    if (phase === 1) return 0;
    return 0.5;
  };
  const realInfo2 = e.info.bind(e);
  e.info = async () => {};
  await e.npcEvent(p);
  e.info = realInfo2;
  Math.random = realRand;
  const wealth = p.status.wealthGod;

  // thug hospital weeks
  const Th = g.players[2];
  Th.status.hospital = 0; Th.status.cardImmune = 0;
  phase = 0;
  Math.random = () => { phase++; if (phase === 1) return 0; return 0.1; }; // r<0.3 thug
  e.info = async () => {};
  const realSend = e.sendTo.bind(e);
  let hospWeeks = null;
  e.sendTo = async (pl, where, weeks) => { hospWeeks = { where, weeks }; pl.status.hospital = weeks; };
  await e.npcEvent(Th);
  e.sendTo = realSend; e.info = realInfo2; Math.random = realRand;

  // 魔高一丈: useCard case 14 sets smallmanImmune = RULES.statusWeeks (3)
  p.status.smallmanImmune = 0;
  p.cards = [14];
  const realMsg = ui.message.bind(ui);
  ui.message = async () => {};
  await e.useCard(p, 14, p.seat); // 魔高一丈 is self-buff
  ui.message = realMsg;
  const mogao = p.status.smallmanImmune;

  return { sm, wealth, hospWeeks, mogao, statusWeeksGuess: mogao };
});

ok(rules.sm.frozen === 2 && rules.sm.badGod === 0, '打小人 → frozen=2 not badGod: ' + JSON.stringify(rules.sm));
ok(rules.wealth === 4, '財神 wealthGodWeeks=4: ' + rules.wealth);
ok(rules.hospWeeks?.where === 'hospital' && rules.hospWeeks?.weeks === 3, 'thug hospital 3w: ' + JSON.stringify(rules.hospWeeks));
ok(rules.mogao === 3, '魔高一丈 smallmanImmune=3: ' + rules.mogao);

// --- chance pick filters ---
const filt = await page.evaluate(() => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
  // clear all plots owned by p
  g.plots.forEach((ps, i) => { if (ps && ps.owner === p.seat) g.plots[i] = null; });
  p.homePlot = null; p.cards = [];
  const noProp = new Set([1, 9, 10, 17, 19, 25]);
  const counts = new Array(26).fill(0);
  let seq = 0;
  // deterministic cycle through all ids repeatedly
  const ids = [];
  for (let round = 0; round < 5; round++) for (let i = 0; i < 26; i++) ids.push(i / 26 + 1e-9);
  let k = 0;
  const rand = () => ids[k++ % ids.length];
  for (let i = 0; i < 26 * 5; i++) counts[e.pickChanceIndex(p, rand)]++;
  const hitNoProp = [...noProp].filter(id => counts[id] > 0);

  // give a property, no cards → exclude only 20
  g.plots[0] = { owner: p.seat, type: 1, level: 0 }; p.cards = [];
  const counts2 = new Array(26).fill(0);
  k = 0;
  for (let i = 0; i < 26 * 5; i++) counts2[e.pickChanceIndex(p, rand)]++;
  const hit20 = counts2[20] > 0;
  const othersOk = counts2.filter((c, i) => i !== 20).every(c => c > 0);

  // property + cards → any
  p.cards = [1];
  const counts3 = new Array(26).fill(0);
  k = 0;
  for (let i = 0; i < 26 * 5; i++) counts3[e.pickChanceIndex(p, rand)]++;
  const allOk = counts3.every(c => c > 0);

  return { hitNoProp, hit20, othersOk, allOk, counts, counts2, counts3 };
});
ok(filt.hitNoProp.length === 0, 'no-prop filter excludes 1,9,10,17,19,25 (hits=' + filt.hitNoProp + ')');
ok(filt.hit20 === false && filt.othersOk, 'has-prop no-cards excludes only id 20');
ok(filt.allOk, 'has-prop+cards allows all 26');

// card 15 does not clear frozen
const c15 = await page.evaluate(async () => {
  const e = window.__lfz.engine; const p = e.g.players[0];
  p.cards = [15]; p.status.frozen = 2; p.status.confused = 2; p.status.dropMoney = 2;
  const ui = e.ui; const real = ui.message.bind(ui); ui.message = async () => {};
  await e.useCard(p, 15, p.seat);
  ui.message = real;
  return { frozen: p.status.frozen, confused: p.status.confused, dropMoney: p.status.dropMoney };
});
ok(c15.frozen === 2 && c15.confused === 0 && c15.dropMoney === 0, '否極泰來 clears 6/7 only: ' + JSON.stringify(c15));

// screenshots
const U = 'window.__lfz.engine.ui';
const open = js => page.evaluate(js => { window.__r = 'pending'; Promise.resolve(eval(js)).then(v => { window.__r = v === undefined ? 'undef' : v; }); }, js);
const close = async () => { await page.evaluate(() => { const s = window.__lfz.scene; while (s.dlgs.length) s.dlgs[s.dlgs.length - 1].resolve(undefined); }); await page.waitForTimeout(200); };

await open(`${U}.message('被打小人，動彈不得 2 個星期！', { title: '打小人' })`);
await page.waitForTimeout(500); await page.screenshot({ path: out + '/smallman_freeze.png' }); await close();

await open(`${U}.message('財神降臨！你現在不須繳付任何費用。', { title: '財神', kind: 'npc' })`);
await page.waitForTimeout(500); await page.screenshot({ path: out + '/wealth_god.png' }); await close();

await open(`${U}.message('不小心從屋頂跌下，往院三個星期及繳付醫藥費500元！', { title: '意料之外', image: 'images/cards/bad_chance_01.jpg', kind: 'chance' })`);
await page.waitForTimeout(500); await page.screenshot({ path: out + '/chance_hospital.png' }); await close();

await open(`${U}.message('會使你對打小人有免疫能力，維持三個星期。', { title: '魔高一丈', kind: 'card', cardId: 14 })`);
await page.waitForTimeout(500); await page.screenshot({ path: out + '/mantra_mogao.png' }); await close();

// freeze HUD
await page.evaluate(() => { const p = window.__lfz.g.players[0]; p.status.frozen = 2; window.__lfz.engine.onChange(); });
await page.waitForTimeout(300);
await page.screenshot({ path: out + '/hud_frozen.png' });

await page.close();
await b.close();
console.log(fail ? `FAILURES ${fail}` : 'ALL OK');
process.exit(fail ? 1 : 0);
