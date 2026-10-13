// Round 26: thug hospital only on same-tile end; map gods visible on all maps
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const base = process.env.BASE || 'http://127.0.0.1:4174/';
const out = path.resolve('../screenshots/round26');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
let fail = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fail++; };

async function boot(map) {
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(base + `?scene=game&map=${map}&mute`);
  await page.waitForFunction(() => window.__lfz?.scene?.ready, null, { timeout: 120000 });
  await page.waitForTimeout(400);
  return page;
}

// --- Thug pass vs land ---
{
  const page = await boot(0);
  const r = await page.evaluate(async () => {
    const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
    e.info = async () => {}; e.ui.toast = () => {}; e.speak = () => {};
    e.view.walkPath = async () => {}; // skip anim
    // Build a 3-step path where thug sits on the MIDDLE tile only
    // Monkeypatch route to return controlled path
    const start = p.tile;
    // Find a line of 3 connected tiles
    let a = start;
    const n1 = e.b.options(a, e.b.defaultPrev(a))[0];
    const n2 = e.b.options(n1, a)[0];
    const path = [n1, n2, e.b.options(n2, n1)[0]];
    g.thug = { tile: path[0], prev: a }; // thug on first step (pass-through if we continue)
    // clear hospital
    p.status.kind = 0; p.status.weeks = 0; p.status.hospital = 0;
    p.cash = 5000; p.alive = true;
    // Directly call move with patched route
    e.route = () => path;
    await e.move(p, 3);
    const afterPass = {
      tile: p.tile, dest: path[2],
      hosp: p.status.hospital, kind: p.status.kind,
      endedOnThug: p.tile === g.thug.tile,
    };
    // Now land ON thug
    p.status.kind = 0; p.status.weeks = 0; p.status.hospital = 0;
    g.thug.tile = path[2];
    e.route = () => path;
    p.tile = start; p.prev = e.b.defaultPrev(start);
    await e.move(p, 3);
    const afterLand = {
      tile: p.tile, thug: g.thug.tile,
      hosp: p.status.hospital, kind: p.status.kind,
    };
    return { path, afterPass, afterLand, hospTile: e.b.hospitalTile };
  });
  ok(r.afterPass.hosp === 0 && r.afterPass.kind !== 1,
    'pass through thug tile → no hospital: ' + JSON.stringify(r.afterPass));
  ok(r.afterLand.kind === 1 && r.afterLand.hosp === 3,
    'land on thug tile → hospital 3: ' + JSON.stringify(r.afterLand));
  ok(r.afterLand.tile === r.hospTile, 'sent to hospital tile: ' + r.afterLand.tile);

  // Screenshots: pass setup vs land
  await page.evaluate(() => {
    const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
    // reset visual: player and thug on different tiles, camera on both
    p.status.kind = 0; p.status.weeks = 0; p.status.hospital = 0;
    const t0 = 10, t1 = 11;
    p.tile = t0; g.thug.tile = t1;
    e.view.placeActor(0, t0, e.b.defaultPrev(t0));
    const T = e.b.tiles[t1];
    const th = e.view.actor(5); if (th) { th.x = T.x; th.y = T.y; th.hidden = false; }
    e.view.focusOn(e.b.tiles[t0].x, e.b.tiles[t0].y, true);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: out + '/thug_separate_tiles.png' });

  await page.evaluate(() => {
    const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
    const t = p.tile;
    g.thug.tile = t;
    const T = e.b.tiles[t];
    const th = e.view.actor(5); if (th) { th.x = T.x; th.y = T.y; }
    e.view.placeActor(0, t, e.b.defaultPrev(t));
    e.view.focusOn(T.x, T.y, true);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: out + '/thug_same_tile.png' });
  await page.close();
}

// --- Gods visible on all 3 maps ---
for (const map of [0, 1, 2]) {
  const page = await boot(map);
  const ginfo = await page.evaluate(async () => {
    const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
    // Ensure unattached god on player tile
    if (!g.mapGod) g.mapGod = { tile: p.tile, type: 1, attachedTo: null };
    g.mapGod.attachedTo = null;
    g.mapGod.tile = p.tile;
    const types = [];
    for (let type = 0; type < 4; type++) {
      g.mapGod.type = type;
      e.syncGodActor();
      const a = e.view.actors.find(x => x.seat === 6);
      types.push({
        type, char: a?.char, hidden: a?.hidden,
        x: a?.x, y: a?.y,
        onPlayer: a && Math.abs(a.x - e.b.tiles[p.tile].x) < 1 && Math.abs(a.y - e.b.tiles[p.tile].y) < 1,
      });
    }
    g.mapGod.type = 1; e.syncGodActor();
    e.view.focusOn(e.b.tiles[p.tile].x, e.b.tiles[p.tile].y, true);
    // plan includes gods in main?
    return { mapGod: g.mapGod, types, actorCount: e.view.actors.length };
  });
  ok(ginfo.types.every(t => t.hidden === false), `map${map} all god types unhidden: ` + JSON.stringify(ginfo.types));
  ok(ginfo.types.every(t => t.onPlayer), `map${map} god actor on player tile`);
  ok(ginfo.types.map(t => t.char).join(',') === '9,10,11,12', `map${map} char ids 9..12: ` + ginfo.types.map(t => t.char));

  for (const type of [0, 1, 2, 3]) {
    await page.evaluate((type) => {
      const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
      g.mapGod.attachedTo = null; g.mapGod.type = type; g.mapGod.tile = p.tile;
      e.syncGodActor();
      e.view.focusOn(e.b.tiles[p.tile].x, e.b.tiles[p.tile].y, true);
    }, type);
    await page.waitForTimeout(350);
    await page.screenshot({ path: out + `/map${map}_god_type${type}.png` });
  }
  // godWeek relocates
  const week = await page.evaluate(async () => {
    const e = window.__lfz.engine; const g = e.g;
    const before = { tile: g.mapGod.tile, type: g.mapGod.type };
    g.mapGod.attachedTo = null;
    await e.godWeek();
    const a = e.view.actors.find(x => x.seat === 6);
    return { before, after: { tile: g.mapGod.tile, type: g.mapGod.type }, hidden: a?.hidden };
  });
  ok(week.hidden === false, `map${map} godWeek keeps visible: ` + JSON.stringify(week));
  await page.close();
}

console.log(fail ? `FAILED ${fail}` : 'ALL OK');
await b.close();
process.exit(fail ? 1 : 0);
