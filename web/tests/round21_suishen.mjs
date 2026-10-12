// Round 21: 衰神 (=type3) per-turn discard; GodIn/Out only on attach/detach; mid-attach no VFX.
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const base = process.env.BASE || 'http://127.0.0.1:4174/';
const out = path.resolve('../screenshots/round21');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
let fail = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fail++; };

const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(base + '?scene=game&map=0&mute');
await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 });
await page.waitForTimeout(1000);

// Track VFX/SFX calls
const setup = await page.evaluate(() => {
  const e = window.__lfz.engine;
  window.__fx = []; window.__sfx = [];
  const realFx = e.view.fx.bind(e.view);
  e.view.fx = (sheet, ...a) => { window.__fx.push(sheet); return realFx(sheet, ...a); };
  const realSfxi = e.sfxi.bind(e);
  e.sfxi = (i) => { window.__sfx.push(i); return realSfxi(i); };
  e.info = async () => {};
  return true;
});

// --- GOD_NAMES type 3 = 衰神 ---
const names = await page.evaluate(() => {
  const e = window.__lfz.engine;
  return [0, 1, 2, 3].map(t => e.godName(t));
});
ok(names[3] === '衰神', 'type3 label 衰神: ' + names[3]);
ok(names[0] === '機械人' && names[1] === '財神' && names[2] === '工程女神', 'other god names: ' + names);

// --- Attach: GodIn once, no card grant, weeks=4 ---
const attach = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
  window.__fx = []; window.__sfx = [];
  p.cards = [1, 2, 3, 4, 5]; p.status.wealthGod = 0;
  const n0 = p.cards.length;
  g.mapGod = { tile: p.tile, type: 3, attachedTo: null };
  await e.godAttach(p);
  // godTick not called from attach; call it as playTurn would after land
  await e.godTick(p);
  return {
    weeks: p.status.wealthGod, attached: g.mapGod.attachedTo, cards: p.cards.length, n0,
    fx: window.__fx.slice(), sfx: window.__sfx.slice(), name: e.godName(3),
  };
});
ok(attach.weeks === 4 && attach.attached === 0, 'attach weeks=4: ' + JSON.stringify(attach));
ok(attach.cards === attach.n0 - 1, 'same-turn tick transfers 1 card away: ' + attach.cards + '/' + attach.n0);
ok(attach.fx.filter(f => f === 'map/godin').length === 1, 'exactly one GodIn VFX on attach: ' + attach.fx);
ok(attach.fx.filter(f => f === 'map/godout').length === 0, 'no GodOut on attach');

// --- Mid-attach tick: discard, NO GodIn ---
const mid = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
  window.__fx = []; window.__sfx = [];
  const n0 = p.cards.length;
  await e.godTick(p);
  await e.godTick(p);
  return { cards: p.cards.length, n0, fx: window.__fx.slice(), sfxGodIn: window.__sfx.filter(i => i === 17).length };
});
ok(mid.cards === mid.n0 - 2, 'two mid ticks transfer 2: ' + mid.cards + '/' + mid.n0);
ok(mid.fx.filter(f => f === 'map/godin').length === 0, 'no GodIn mid-attach: ' + mid.fx);
ok(mid.fx.filter(f => f === 'map/godout').length === 0, 'no GodOut mid-attach');

// --- godWeek relocate: no GodIn ---
const week = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g;
  // detach first
  g.mapGod.attachedTo = null; g.players[0].status.wealthGod = 0;
  e.syncGodActor();
  window.__fx = []; window.__sfx = [];
  const t0 = g.mapGod.tile;
  await e.godWeek();
  return { moved: g.mapGod.tile !== t0 || true, fx: window.__fx.slice(), sfx: window.__sfx.slice() };
});
ok(week.fx.filter(f => f === 'map/godin').length === 0, 'godWeek no GodIn VFX: ' + week.fx);

// --- Detach: GodOut once ---
const det = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[1];
  g.mapGod = { tile: 0, type: 1, attachedTo: p.seat };
  p.status.wealthGod = 1; // will expire this tick
  window.__fx = []; window.__sfx = [];
  e.tickStatuses(p);
  return { weeks: p.status.wealthGod, attached: g.mapGod.attachedTo, fx: window.__fx.slice(), sfx: window.__sfx.slice() };
});
ok(det.weeks === 0 && det.attached === null, 'detach clears attach: ' + JSON.stringify(det));
ok(det.fx.filter(f => f === 'map/godout').length === 1, 'GodOut VFX on expire: ' + det.fx);

// --- 財神 tick is no-op (no building change) ---
const wealth = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[2];
  g.mapGod = { tile: p.tile, type: 1, attachedTo: p.seat };
  p.status.wealthGod = 4;
  const plots0 = g.plots.map(x => x ? x.level : null);
  await e.godTick(p);
  const plots1 = g.plots.map(x => x ? x.level : null);
  return { same: JSON.stringify(plots0) === JSON.stringify(plots1) };
});
ok(wealth.same, '財神 godTick is no-op');

// screenshots
await page.evaluate(() => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
  g.mapGod = { tile: p.tile, type: 3, attachedTo: null };
  e.syncGodActor();
  const T = e.b.tiles[p.tile]; e.view.focusOn(T.x, T.y);
});
await page.waitForTimeout(400);
await page.screenshot({ path: out + '/suishen_on_tile.png' });

const U = 'window.__lfz.engine.ui';
const open = js => page.evaluate(js => { window.__r = 'pending'; Promise.resolve(eval(js)).then(v => { window.__r = v; }); }, js);
const close = async () => { await page.evaluate(() => { const s = window.__lfz.scene; while (s.dlgs.length) s.dlgs[s.dlgs.length - 1].resolve(undefined); }); await page.waitForTimeout(200); };

await open(`${U}.message('衰神附身！往後每回合將隨機把一張四字真言送給其他玩家！', { title: '衰神', kind: 'npc' })`);
await page.waitForTimeout(500); await page.screenshot({ path: out + '/attach.png' }); await close();

await open(`${U}.message('老夫子贈送四字真言「人棄我取」給大番薯！', { title: '衰神', kind: 'card', cardId: 1 })`);
await page.waitForTimeout(500); await page.screenshot({ path: out + '/transfer.png' }); await close();

// mid-attach: board with wealthGod>0, no dialog
await page.evaluate(() => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
  g.mapGod = { tile: 1, type: 3, attachedTo: p.seat }; p.status.wealthGod = 3;
  e.syncGodActor(); // hidden while attached
  e.view.focusOn(e.view.actor(0).x, e.view.actor(0).y);
});
await page.waitForTimeout(400);
await page.screenshot({ path: out + '/mid_attach_no_vfx.png' });

await open(`${U}.message('財神附體，所有消費免費！', { title: '財神', kind: 'npc' })`);
await page.waitForTimeout(400); await page.screenshot({ path: out + '/detach_godout_label.png' }); await close();
// show GodOut via forcing message about leave
await open(`${U}.message('衰神消散了！', { title: '衰神', kind: 'npc' })`);
await page.waitForTimeout(400); await page.screenshot({ path: out + '/detach.png' }); await close();

await page.close();
await b.close();
console.log(fail ? `FAILURES ${fail}` : 'ALL OK');
process.exit(fail ? 1 : 0);
