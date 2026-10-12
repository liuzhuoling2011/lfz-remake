// Regression: thief walker pickpocket (exe @0x4168df) and mid-walk 洋行 salary (@0x4169d4).
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://127.0.0.1:4174/';
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
let fail = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fail++; };
await page.goto(base + '?scene=game&map=0&mute');
await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 }); await page.waitForTimeout(1500);
const r = await page.evaluate(async () => {
  const { engine: e, g } = window.__lfz; const bd = e.b; const p = g.players[0];
  const path = []; let cur = p.tile, prev = p.prev;
  for (let i = 0; i < 5; i++) { const o = bd.options(cur, prev); path.push(o[0]); prev = cur; cur = o[0]; }
  e.route = () => path.slice();
  // thief on step 2 (passing), office on step 4 (passing)
  g.thief = { tile: path[1], prev: path[0] };
  for (const t of path) bd.tiles[t].landmarks = bd.tiles[t].landmarks.filter(l => l.kind !== 'of');
  bd.tiles[path[3]].landmarks.push({ code: 'of', kind: 'of', x: 0, y: 0, tile: path[3] });
  p.cash = 10000; p.salary = 777;
  const log = [];
  const ms = e.message?.bind(e); const sal = e.salary.bind(e);
  e.salary = async q => { log.push({ ev: 'salary', tile: q.tile, cash: q.cash }); return sal(q); };
  const tp = e.thiefPickpocket.bind(e);
  e.thiefPickpocket = async (q, last) => { const c0 = q.cash; const a = await tp(q, last); log.push({ ev: 'thief', tile: q.tile, last, amt: a, pct: a / c0 * 100 }); return a; };
  const ui = e.ui; const m0 = ui.message; ui.message = () => Promise.resolve();
  await e.move(p, 5);
  ui.message = m0;
  // landing on the thief: 10–19 %
  const c1 = p.cash; const land = await tp(p, true, 9); const land0 = await tp(p, true, 0);
  return { path, log, end: p.tile, landPct: land / c1 * 100, land0 };
});
const th = r.log.find(x => x.ev === 'thief'), sa = r.log.find(x => x.ev === 'salary');
ok(th && th.tile === r.path[1] && !th.last, 'thief resolved mid-walk on its tile');
ok(th && th.pct >= 20 && th.pct < 39, `passing thief takes 20–38%: ${th?.pct.toFixed(1)}%`);
ok(sa && sa.tile === r.path[3] && r.log.indexOf(sa) > r.log.indexOf(th), 'salary paid mid-walk at the 洋行 tile, before the walk ends');
ok(r.end === r.path[4], 'walk continues to the final tile');
ok(r.landPct >= 18.9 && r.landPct <= 19.1, `landing on thief, r=9 → 19%: ${r.landPct.toFixed(2)}%`);
ok(!errs.length, 'no page errors ' + errs.join('|'));
await b.close(); process.exit(fail ? 1 : 0);
