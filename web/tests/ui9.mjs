// Round 9: floating BR 全螢幕 (not in panel); card names between ruled lines.
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
    const r = await page.evaluate(id => window.__lfzApp.hits.find(h => h.id === id)?.r, id);
    if (!r) { ok(false, `${tag}: no hit ${id}`); return false; }
    const x = r.x + r.w / 2, y = r.y + r.h / 2;
    if (mob) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
    await page.waitForTimeout(wait); return true;
  };
  const ev = f => page.evaluate(f);

  await page.goto(base + `?scene=game&mute&q=${Q}`);
  await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 });
  await page.waitForTimeout(700);

  // floating FS always in-game
  ok(await ev(() => window.__lfzApp.hits.some(h => h.id === 'fs-toggle')), `${tag}: fs-toggle on board`);
  const fs = await ev(() => { const h = window.__lfzApp.hits.find(h => h.id === 'fs-toggle'); return h && { x: h.r.x, y: h.r.y, w: h.r.w, h: h.r.h }; });
  ok(!!fs && fs.x > w * 0.5 && fs.y > h * 0.5, `${tag}: fs-toggle bottom-right`);

  // cards
  await hit('gm-card', 600);
  ok(await ev(() => window.__lfz.scene.dlgs.some(d => d.kind === 'cards')), `${tag}: cards open`);
  // pixel check: text mid should be at window 33+20i; rules at 43+20i — sample via hit row centers
  const rows = await ev(() => [0,1,2,3,4].map(i => {
    const h = window.__lfzApp.hits.find(h => h.id === 'cs-row' + i);
    return h ? { cy: h.r.y + h.r.h / 2, y: h.r.y, h: h.r.h } : null;
  }));
  ok(rows.every(Boolean), `${tag}: 5 card rows`);
  if (rows[0] && rows[1]) ok(rows[1].cy - rows[0].cy > 5, `${tag}: row pitch`);
  await page.screenshot({ path: `${out}/ui9_cards_after_${tag}.png` });
  await hit('cs-x', 300);

  // options: no op-fs; panel original; fs-toggle still present on top
  await hit('gm-sys', 500); await hit('sy-opt', 500);
  ok(!(await ev(() => window.__lfzApp.hits.some(h => h.id === 'op-fs'))), `${tag}: no op-fs in panel`);
  ok(await ev(() => window.__lfzApp.hits.some(h => h.id === 'op-q')), `${tag}: op-q present`);
  ok(await ev(() => window.__lfzApp.hits.some(h => h.id === 'fs-toggle')), `${tag}: fs-toggle over options`);
  await page.screenshot({ path: `${out}/ui9_options_after_${tag}.png` });
  await hit('op-x', 300); await hit('sy-x', 300);

  // main menu options
  await page.goto(base + `?scene=mainmenu&mute&q=${Q}`);
  await page.waitForFunction(() => window.__scene === 'mainmenu', null, { timeout: 60000 });
  await page.waitForTimeout(500);
  await hit('mmopt', 600);
  ok(!(await ev(() => window.__lfzApp.hits.some(h => h.id === 'mo-fs'))), `${tag}: no mo-fs in menu panel`);
  ok(await ev(() => window.__lfzApp.hits.some(h => h.id === 'fs-toggle')), `${tag}: fs-toggle on menu options`);
  await page.screenshot({ path: `${out}/ui9_menu_options_${tag}.png` });

  await page.close();
}
console.log('fails:', fails.length, 'errs:', errs.length);
if (errs.length) console.log(errs.slice(0, 6).join('\n'));
await browser.close();
if (fails.length) process.exit(1);
