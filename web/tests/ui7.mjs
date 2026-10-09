// Round 7: SelectActor device cycle (mouse→kb1-3→AI→off) + face always drawn;
// no detail colour pips; 四字真言 text between rules / mask inset inside panel.
import { chromium } from 'playwright';
const out = process.argv[2] || '/workspace/lfz-remake/screenshots';
const base = process.env.BASE || 'http://127.0.0.1:5173/';
const Q = process.env.Q || 'hd';
const browser = await chromium.launch();
const errs = []; const fails = [];
const ok = (c, m) => { if (!c) { fails.push(m); console.log('FAIL', m); } else console.log('OK', m); };

for (const [w, h, dpr, mob, tag] of [[1920, 1080, 1, false, '1920x1080'], [390, 844, 3, true, 'mobile3x']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mob, hasTouch: mob });
  page.on('console', m => { if (m.type() === 'error') errs.push(`[${tag}] ${m.text()}`); });
  page.on('pageerror', e => errs.push(`[${tag}] pageerror: ${e.message}`));
  const hit = async (id, wait = 400) => {
    const r = await page.evaluate(id => { const h = window.__lfzApp.hits.find(h => h.id === id); return h && h.r; }, id);
    if (!r) { ok(false, `${tag}: no hit ${id}`); return false; }
    const x = r.x + r.w / 2, y = r.y + r.h / 2;
    if (mob) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
    await page.waitForTimeout(wait); return true;
  };
  const ev = f => page.evaluate(f);

  // --- SelectActor device cycle + face always on ---
  await page.goto(base + `?scene=selectactor&mute&q=${Q}`);
  await page.waitForFunction(() => window.__scene === 'selectactor', null, { timeout: 60000 });
  await page.waitForTimeout(800);
  // reset seat0 to mouse
  await ev(() => { const s = window.__setup.seats[0]; s.on = true; s.ai = false; s.device = 0; });
  await page.waitForTimeout(100);
  const cycle = [];
  for (let i = 0; i < 6; i++) {
    cycle.push(await ev(() => { const s = window.__setup.seats[0]; return { on: s.on, ai: s.ai, device: s.device }; }));
    await hit('dev0', 250);
  }
  // expected: mouse(0) → kb5 → kb6 → kb7 → AI(8) → off(8,!on) → mouse(0)
  ok(cycle[0].device === 0 && !cycle[0].ai && cycle[0].on, `${tag}: start mouse`);
  ok(cycle[1].device === 5 && !cycle[1].ai, `${tag}: → keyboard1`);
  ok(cycle[2].device === 6 && !cycle[2].ai, `${tag}: → keyboard2`);
  ok(cycle[3].device === 7 && !cycle[3].ai, `${tag}: → keyboard3`);
  ok(cycle[4].device === 8 && cycle[4].ai && cycle[4].on, `${tag}: → AI`);
  ok(!cycle[5].on && cycle[5].device === 8, `${tag}: → off`);
  // 6th hit in the loop already took off → mouse
  ok(await ev(() => window.__setup.seats[0].on && !window.__setup.seats[0].ai && window.__setup.seats[0].device === 0), `${tag}: off → mouse`);
  await page.screenshot({ path: `${out}/ui7_selectactor_cycle_${tag}.png` });
  await page.screenshot({ path: `${out}/ui7_selectactor_${tag}.png` });

  // --- In-game cards + detail ---
  await page.goto(base + `?scene=game&mute&q=${Q}`);
  await page.waitForFunction(() => window.__lfz && window.__lfz.scene.ready && window.__lfz.scene.turnMenuRes, null, { timeout: 120000 });
  await page.waitForTimeout(1000);

  await hit('gm-card', 600);
  ok(await ev(() => window.__lfz.scene.dlgs.some(d => d.kind === 'cards')), `${tag}: 四字真言 open`);
  await page.screenshot({ path: `${out}/ui7_cards_${tag}.png` });
  // scroll + select a mid row so the mask is visible away from the top ornament
  await hit('cs-dn', 200); await hit('cs-dn', 200);
  await page.screenshot({ path: `${out}/ui7_cards_sel_${tag}.png` });
  await hit('cs-x', 400);

  await hit('gm-info', 500);
  ok(await ev(() => window.__lfz.scene.overlay === 'detail'), `${tag}: 角色資產 open`);
  // no colour pip fillRect — we just screenshot; pip removal is visual
  await page.screenshot({ path: `${out}/ui7_detail_${tag}.png` });
  await hit('di-x', 300);

  // in-game 設定 — 全螢幕 must be a proper row (op-fs hit present, not overlapping X/O)
  await hit('gm-sys', 500); await hit('sy-opt', 500);
  ok(await ev(() => window.__lfzApp.hits.some(h => h.id === 'op-fs')), `${tag}: op-fs hit`);
  const fsRow = await ev(() => {
    const fs = window.__lfzApp.hits.find(h => h.id === 'op-fs');
    const ox = window.__lfzApp.hits.find(h => h.id === 'op-x');
    const oo = window.__lfzApp.hits.find(h => h.id === 'op-o');
    if (!fs || !ox || !oo) return null;
    return { fsY: fs.r.y + fs.r.h, xY: Math.min(ox.r.y, oo.r.y), fsH: fs.r.h, fsTop: fs.r.y };
  });
  ok(!!fsRow && fsRow.fsY <= fsRow.xY + 2, `${tag}: 全螢幕 row above X/O (fsBottom=${fsRow?.fsY} xTop=${fsRow?.xY})`);
  await page.screenshot({ path: `${out}/ui7_options_fs_${tag}.png` });
  await hit('op-x', 300); await hit('sy-x', 300);

  // main-menu 設定 全螢幕
  await page.goto(base + `?scene=mainmenu&mute&q=${Q}`);
  await page.waitForFunction(() => window.__scene === 'mainmenu', null, { timeout: 60000 });
  await page.waitForTimeout(500);
  await hit('mmopt', 600);
  ok(await ev(() => window.__lfzApp.hits.some(h => h.id === 'mo-fs')), `${tag}: mo-fs hit`);
  await page.screenshot({ path: `${out}/ui7_menu_options_fs_${tag}.png` });

  await page.close();
}
console.log('fails:', fails.length, 'console errors:', errs.length);
if (errs.length) console.log(errs.slice(0, 8).join('\n'));
await browser.close();
if (fails.length) process.exit(1);
