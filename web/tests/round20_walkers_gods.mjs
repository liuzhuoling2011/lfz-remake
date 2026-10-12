// Round 20: thief/thug walkers + map-god tile attach (no npcEventChance roll).
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const base = process.env.BASE || 'http://127.0.0.1:4174/';
const out = path.resolve('../screenshots/round20');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
let fail = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fail++; };

const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(base + '?scene=game&map=0&mute');
await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 });
await page.waitForTimeout(1000);

// --- spawn: thief, thug, mapGod present; no npcEvent ---
const spawn = await page.evaluate(() => {
  const e = window.__lfz.engine; const g = e.g;
  return {
    thief: !!g.thief, thug: !!g.thug, mapGod: g.mapGod && typeof g.mapGod.type === 'number',
    hasNpcEvent: typeof e.npcEvent === 'function',
    actors: e.view.actors.map(a => ({ seat: a.seat, char: a.char, hidden: !!a.hidden })),
  };
});
ok(spawn.thief && spawn.thug && spawn.mapGod, 'spawn thief+thug+mapGod: ' + JSON.stringify(spawn));
ok(!spawn.hasNpcEvent, 'npcEvent removed');
ok(spawn.actors.some(a => a.seat === 4 && a.char === 7), 'thief actor seat4 char7');
ok(spawn.actors.some(a => a.seat === 5 && a.char === 8), 'thug actor seat5 char8');
ok(spawn.actors.some(a => a.seat === 6), 'god actor seat6');

// --- thug assault → hospital 3, no fee beyond weeks ---
const thug = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
  p.status.hospital = 0; p.status.jail = 0; p.status.cardImmune = 0; p.cash = 5000;
  const cash0 = p.cash;
  e.info = async () => {};
  await e.thugAssault(p);
  return { hospital: p.status.hospital, cash: p.cash, cash0 };
});
ok(thug.hospital === 3, 'thug → hospital 3w: ' + thug.hospital);
ok(thug.cash === thug.cash0, 'thug no entry fee (cash unchanged)');

// --- god attach 財神 (type 1) → wealthGod 4 ---
const god1 = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[1];
  p.status.wealthGod = 0; p.tile = 0;
  g.mapGod = { tile: p.tile, type: 1, attachedTo: null };
  e.info = async () => {};
  await e.godAttach(p);
  return { wealthGod: p.status.wealthGod, attached: g.mapGod.attachedTo, hidden: e.view.actors.find(a => a.seat === 6)?.hidden };
});
ok(god1.wealthGod === 4 && god1.attached === 1, '財神 attach weeks=4: ' + JSON.stringify(god1));
ok(god1.hidden === true, 'god actor hidden while attached');

// --- 衰神 type 3 → attach 4w (discard is per-turn via godTick, not grant) ---
const god3 = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[2];
  p.cards = [1, 2, 3];
  g.mapGod = { tile: p.tile, type: 3, attachedTo: null };
  p.status.wealthGod = 0;
  e.info = async () => {};
  await e.godAttach(p);
  return { wealthGod: p.status.wealthGod, name: e.godName(3), cards: p.cards.length };
});
ok(god3.wealthGod === 4 && god3.name === '衰神', '衰神 attach 4w: ' + JSON.stringify(god3));

// --- godWeek relocates when unattached ---
const rel = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g;
  g.mapGod = { tile: 0, type: 0, attachedTo: null };
  const t0 = g.mapGod.tile, ty0 = g.mapGod.type;
  // force several relocates
  const seen = new Set();
  for (let i = 0; i < 8; i++) { await e.godWeek(); seen.add(g.mapGod.tile + ':' + g.mapGod.type); }
  return { moved: g.mapGod.tile !== t0 || g.mapGod.type !== ty0, n: seen.size, type: g.mapGod.type };
});
ok(rel.moved || rel.n > 1, 'godWeek relocates: ' + JSON.stringify(rel));

// --- walker step count 1..6 ---
const steps = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g;
  const counts = [];
  const realWalk = e.view.walkPath.bind(e.view);
  e.view.walkPath = async (seat, from, path) => { counts.push(path.length); };
  e.info = async () => {};
  for (let i = 0; i < 20; i++) {
    g.thief.tile = 0; g.thief.prev = e.b.defaultPrev(0);
    await e.thiefTurn();
  }
  e.view.walkPath = realWalk;
  return { min: Math.min(...counts), max: Math.max(...counts), counts };
});
ok(steps.min >= 1 && steps.max <= 6, 'thief steps 1..6: ' + JSON.stringify({ min: steps.min, max: steps.max }));

// screenshots map0
await page.evaluate(() => {
  const e = window.__lfz.engine; const g = e.g;
  g.mapGod.attachedTo = null; g.mapGod.type = 1; g.mapGod.tile = g.players[0].tile;
  e.syncGodActor();
  const T = e.b.tiles[g.mapGod.tile]; e.view.focusOn(T.x, T.y);
});
await page.waitForTimeout(400);
await page.screenshot({ path: out + '/map0_god_tile.png' });

await page.evaluate(() => {
  const e = window.__lfz.engine; const g = e.g;
  const T = e.b.tiles[g.thief.tile]; e.view.focusOn(T.x, T.y);
});
await page.waitForTimeout(300);
await page.screenshot({ path: out + '/map0_thief.png' });

await page.evaluate(() => {
  const e = window.__lfz.engine; const g = e.g;
  const T = e.b.tiles[g.thug.tile]; e.view.focusOn(T.x, T.y);
});
await page.waitForTimeout(300);
await page.screenshot({ path: out + '/map0_thug.png' });

// open attach dialog shot
const U = 'window.__lfz.engine.ui';
await page.evaluate(js => { window.__r = 'pending'; Promise.resolve(eval(js)).then(v => { window.__r = v; }); },
  `${U}.message('財神附體，所有消費免費！', { title: '財神', kind: 'npc' })`);
await page.waitForTimeout(500);
await page.screenshot({ path: out + '/attach_wealth.png' });
await page.evaluate(() => { const s = window.__lfz.scene; while (s.dlgs.length) s.dlgs[s.dlgs.length - 1].resolve(undefined); });

await page.close();

// maps 1 & 2 board with walkers/gods
for (const m of [1, 2]) {
  const pg = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await pg.goto(base + `?scene=game&map=${m}&mute`);
  await pg.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 });
  await pg.waitForTimeout(800);
  const info = await pg.evaluate(() => {
    const e = window.__lfz.engine; const g = e.g;
    g.mapGod.attachedTo = null; e.syncGodActor();
    const T = e.b.tiles[g.mapGod.tile]; e.view.focusOn(T.x, T.y);
    return { thugChar: e.view.actors.find(a => a.seat === 5)?.char, godType: g.mapGod.type };
  });
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: out + `/map${m}_god_tile.png` });
  ok(m !== 2 || info.thugChar === 13, `map${m} thug char (ancient=13): ` + info.thugChar);
  await pg.close();
}

await b.close();
console.log(fail ? `FAILURES ${fail}` : 'ALL OK');
process.exit(fail ? 1 : 0);
