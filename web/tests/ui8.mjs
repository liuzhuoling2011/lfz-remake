// Round 8: card list first row occupied; options panel tall enough for 5 rows + X/O inside.
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
  await page.waitForTimeout(800);

  // --- cards: first visible row must be list[0], hit cs-row0 near top of list ---
  await hit('gm-card', 600);
  ok(await ev(() => window.__lfz.scene.dlgs.some(d => d.kind === 'cards')), `${tag}: cards open`);
  const cardGeo = await ev(() => {
    const d = window.__lfz.scene.dlgs.find(d => d.kind === 'cards');
    const rows = [0, 1, 2, 3, 4].map(i => {
      const h = window.__lfzApp.hits.find(h => h.id === 'cs-row' + i);
      return h ? { y: h.r.y, h: h.r.h } : null;
    });
    return { sel: d?.sel, scroll: d?.scroll, rows };
  });
  ok(cardGeo.scroll === 0 || cardGeo.scroll === undefined, `${tag}: scroll starts at 0 (got ${cardGeo.scroll})`);
  ok(!!cardGeo.rows[0] && !!cardGeo.rows[1], `${tag}: cs-row0 and cs-row1 exist`);
  if (cardGeo.rows[0] && cardGeo.rows[1]) {
    const gap = cardGeo.rows[1].y - cardGeo.rows[0].y;
    ok(gap > 10 && gap < 80 * (h / 480), `${tag}: row pitch sane (${gap.toFixed(1)}px)`);
  }
  await page.screenshot({ path: `${out}/ui8_cards_${tag}.png` });
  await hit('cs-x', 400);

  // --- options: 5 rows + X/O; fs bottom above X; X inside grown panel ---
  await hit('gm-sys', 500); await hit('sy-opt', 500);
  const opt = await ev(() => {
    const ids = ['op-q', 'op-spd', 'op-sfx', 'op-mus', 'op-fs', 'op-x', 'op-o'];
    const H = {};
    for (const id of ids) {
      const h = window.__lfzApp.hits.find(h => h.id === id);
      H[id] = h ? { x: h.r.x, y: h.r.y, w: h.r.w, h: h.r.h, bottom: h.r.y + h.r.h } : null;
    }
    return H;
  });
  ok(!!opt['op-fs'] && !!opt['op-x'] && !!opt['op-q'], `${tag}: option hits present`);
  ok(opt['op-fs'].bottom <= opt['op-x'].y + 1, `${tag}: 全螢幕 above X (fsBottom=${opt['op-fs']?.bottom?.toFixed(0)} xY=${opt['op-x']?.y?.toFixed(0)})`);
  // five rows ordered by y
  const ys = ['op-q', 'op-spd', 'op-sfx', 'op-mus', 'op-fs'].map(id => opt[id]?.y);
  ok(ys.every((y, i) => i === 0 || y > ys[i - 1]), `${tag}: five rows top→bottom ordered`);
  await page.screenshot({ path: `${out}/ui8_options_fs_${tag}.png` });
  await hit('op-x', 300); await hit('sy-x', 300);

  // main-menu 設定
  await page.goto(base + `?scene=mainmenu&mute&q=${Q}`);
  await page.waitForFunction(() => window.__scene === 'mainmenu', null, { timeout: 60000 });
  await page.waitForTimeout(500);
  await hit('mmopt', 600);
  ok(await ev(() => window.__lfzApp.hits.some(h => h.id === 'mo-fs')), `${tag}: mo-fs`);
  await page.screenshot({ path: `${out}/ui8_menu_options_${tag}.png` });

  await page.close();
}
console.log('fails:', fails.length, 'console errors:', errs.length);
if (errs.length) console.log(errs.slice(0, 6).join('\n'));
await browser.close();
if (fails.length) process.exit(1);
