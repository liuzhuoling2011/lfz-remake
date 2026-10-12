// Round 25: no remake「號地」toast after build/upgrade; landmarks not on lots; load SD-first
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const base = process.env.BASE || 'http://127.0.0.1:4174/';
const out = path.resolve('../screenshots/round25');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
let fail = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fail++; };

// --- BEFORE-style capture on OLD behavior is gone; capture AI build with toast hook ---
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(base + '?scene=game&map=0&mute');
await page.waitForFunction(() => window.__lfz?.scene?.ready, null, { timeout: 120000 });
await page.waitForTimeout(400);

const r = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[1]; // AI
  p.ai = true; p.cash = 99999; p.homePlot = null;
  const toasts = [];
  e.ui.toast = (t) => { toasts.push(t); };
  e.ui.message = async () => {};
  e.speak = () => {};
  e.view.construct = async (pl, down, onSwap) => { onSwap?.(); };
  // force wantHome/wantUpgrade by cash
  let pl = g.plots.findIndex(x => !x);
  p.tile = e.b.plots[pl].tiles[0];
  await e.property(p, pl); // home
  const afterHome = [...toasts];
  toasts.length = 0;
  await e.property(p, pl); // homeBank skipped? AI homeBank - need stub
  // stub homeBank on ui - property calls homeBank for HOME type
  return { afterHome, homePlot: p.homePlot, level: g.plots[pl]?.level, toastsAfter: toasts };
});

// More controlled
const r2 = await page.evaluate(async () => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[1];
  p.ai = true; p.cash = 99999;
  // reset a plot
  let pl = g.plots.findIndex((x, i) => x && x.owner === 1) ;
  if (pl < 0) {
    pl = g.plots.findIndex(x => !x);
    g.plots[pl] = { owner: 1, type: 4, level: 0 }; p.homePlot = pl;
  }
  p.tile = e.b.plots[pl].tiles[0];
  const toasts = [];
  e.ui.toast = (t) => toasts.push(String(t));
  e.ui.message = async () => {};
  e.ui.homeBank = async () => null;
  e.speak = () => {};
  e.view.construct = async (pl, d, onSwap) => { onSwap?.(); };
  await e.property(p, pl); // upgrade path
  // commercial
  let pl2 = g.plots.findIndex(x => !x);
  p.tile = e.b.plots[pl2].tiles[0];
  await e.property(p, pl2);
  const tilePop = toasts.filter(t => /號地|tile/i.test(t));
  // landmark co-location
  let overlaps = 0;
  for (const t of e.b.tiles) if (t.plots.length && t.landmarks.some(l => l.kind === 'sp')) overlaps++;
  // HD gate
  const hd = window.__lfzHD?.() || {};
  return { toasts, tilePop, overlaps, hd, built: !!g.plots[pl2] };
});

ok(r2.tilePop.length === 0, 'no 號地/tile toast on AI build/upgrade: ' + JSON.stringify(r2.tilePop));
ok(r2.built, 'AI still builds commercial');
ok(r2.overlaps === 0, 'no sp landmark on plot tiles: overlaps=' + r2.overlaps);
ok(r2.hd.gate === true, 'HD upgrade gate opens after ready: ' + JSON.stringify(r2.hd));

// Human buildConfirm still works; screenshot confirm + after (no extra dlg)
await page.evaluate(() => {
  const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
  p.ai = false; p.cash = 99999; p.homePlot = null;
  // clear a plot
  const pl = g.plots.findIndex(x => !x);
  window.__pl = pl;
  p.tile = e.b.plots[pl].tiles[0];
  e.view.placeActor(0, p.tile, e.b.defaultPrev(p.tile));
  e.view.focusOn(e.b.plots[pl].x, e.b.plots[pl].y, true);
});
const pflow = page.evaluate(async () => {
  const e = window.__lfz.engine;
  await e.property(e.g.players[0], window.__pl);
});
await page.waitForTimeout(500);
await page.screenshot({ path: out + '/build_confirm_before.png' });
await page.evaluate(() => { const d = window.__lfz.scene.buildDlg; if (d) d.resolve(1); });
await page.waitForTimeout(900);
const after = await page.evaluate(() => ({
  dlgs: window.__lfz.scene.dlgs.map(d => ({ text: d.text, title: d.title })),
  toasts: window.__lfz.scene.toasts.map(t => t.text),
  build: !!window.__lfz.scene.buildDlg,
  home: window.__lfz.g.players[0].homePlot,
}));
await page.screenshot({ path: out + '/build_after_no_extra.png' });
ok(after.dlgs.length === 0 && !after.build, 'no extra dialog after human home build: ' + JSON.stringify(after));
ok(!after.toasts.some(t => /號地|tile/i.test(t)), 'no tile toast after human build');
await pflow;

// Upgrade screenshot
await page.evaluate(() => {
  const e = window.__lfz.engine; const p = e.g.players[0];
  e.ui.homeBank = async () => null;
});
const uflow = page.evaluate(async () => {
  const e = window.__lfz.engine; const p = e.g.players[0];
  await e.property(p, p.homePlot);
});
await page.waitForTimeout(500);
await page.screenshot({ path: out + '/upgrade_confirm_before.png' });
await page.evaluate(() => { const d = window.__lfz.scene.buildDlg; if (d) d.resolve(1); });
await page.waitForTimeout(800);
const afterU = await page.evaluate(() => ({
  dlgs: window.__lfz.scene.dlgs.map(d => d.text),
  toasts: window.__lfz.scene.toasts.map(t => t.text),
}));
await page.screenshot({ path: out + '/upgrade_after_no_extra.png' });
ok(afterU.dlgs.length === 0, 'no extra dialog after upgrade: ' + JSON.stringify(afterU));
await uflow;

console.log(fail ? `FAILED ${fail}` : 'ALL OK');
await b.close();
process.exit(fail ? 1 : 0);
