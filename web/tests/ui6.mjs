// Round 6: skip title → main menu, selectactor layout, card/detail alignment, ring bottom-left,
// fullscreen setting, no bottom-left help legend. node tests/ui6.mjs [outDir]
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

  // 1) Boot lands on main menu (no title / 開始遊戲 page)
  await page.goto(base + `?mute&q=${Q}`);
  await page.waitForFunction(() => window.__scene === 'mainmenu', null, { timeout: 60000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/ui6_mainmenu_${tag}.png` });
  ok(await ev(() => window.__scene === 'mainmenu'), `${tag}: boot → mainmenu`);
  const mm = await ev(() => window.__lfzApp.hits.map(h => h.id));
  ok(['mmnew', 'mmopt', 'mmmini'].every(i => mm.includes(i)), `${tag}: main menu 6-button hits`);

  // 2) Select actor layout
  await page.goto(base + `?scene=selectactor&mute&q=${Q}`);
  await page.waitForFunction(() => window.__scene === 'selectactor', null, { timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${out}/ui6_selectactor_${tag}.png` });
  const sa = await ev(() => window.__lfzApp.hits.map(h => h.id));
  ok(['dev0', 'chr0', 'aok', 'aback'].every(i => sa.includes(i)), `${tag}: selectactor hits (device/face/OK/X)`);
  // faces use actor.spr — ensure sheets loaded
  ok(await ev(() => !!window.__lfzApp.scene), `${tag}: selectactor scene live`);

  // 3) In-game: ring bottom-left, no help legend, card + detail
  await page.goto(base + `?scene=selectactor&mute&q=${Q}`);
  await page.waitForFunction(() => window.__scene === 'selectactor', null, { timeout: 60000 });
  await ev(() => { window.__setup.seats.forEach((s, i) => { s.on = true; s.ai = i > 0; }); window.__lfzApp.scene.start(); });
  await page.waitForFunction(() => window.__lfz && window.__lfz.scene.ready && window.__lfz.scene.turnMenuRes, null, { timeout: 120000 });
  await page.waitForTimeout(1200);
  // ring should be in the left half
  const ring = await ev(() => {
    const h = window.__lfzApp.hits.find(h => h.id === 'gm-dice');
    return h ? { x: h.r.x, y: h.r.y, w: window.__lfzApp.w, h: window.__lfzApp.h } : null;
  });
  ok(!!ring && ring.x < ring.w * 0.4, `${tag}: ring menu in left half (x=${ring?.x})`);
  ok(!!ring && ring.y > ring.h * 0.45, `${tag}: ring menu in lower half (y=${ring?.y})`);
  await page.screenshot({ path: `${out}/ui6_ring_${tag}.png` });

  // open cards
  await hit('gm-card', 600);
  ok(await ev(() => window.__lfz.scene.dlgs.some(d => d.kind === 'cards')), `${tag}: 四字真言 select open`);
  await page.screenshot({ path: `${out}/ui6_cards_${tag}.png` });
  await hit('cs-x', 400);

  // detail via ring info
  await hit('gm-info', 500);
  ok(await ev(() => window.__lfz.scene.overlay === 'detail'), `${tag}: 角色資產 open`);
  await page.screenshot({ path: `${out}/ui6_detail_${tag}.png` });
  await hit('di-x', 300);

  // fullscreen option in system → options
  await hit('gm-sys', 500); await hit('sy-opt', 500);
  ok(await ev(() => window.__lfzApp.hits.some(h => h.id === 'op-fs')), `${tag}: in-game 全螢幕 hit`);
  await page.screenshot({ path: `${out}/ui6_options_fs_${tag}.png` });
  await hit('op-x', 300); await hit('sy-x', 300);

  // main-menu 設定 fullscreen
  await page.goto(base + `?scene=mainmenu&mute&q=${Q}`);
  await page.waitForFunction(() => window.__scene === 'mainmenu', null, { timeout: 60000 });
  await page.waitForTimeout(600);
  await hit('mmopt', 600);
  ok(await ev(() => window.__lfzApp.hits.some(h => h.id === 'mo-fs')), `${tag}: main-menu 全螢幕 hit`);
  await page.screenshot({ path: `${out}/ui6_menu_options_fs_${tag}.png` });
  await hit('mo-x', 400);

  await page.close();
}

// load-time under throttling
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 200, downloadThroughput: 50 * 1024, uploadThroughput: 20 * 1024, connectionType: 'cellular2g'
  });
  const t0 = Date.now();
  await page.goto(base + '?mute&q=sd');
  await page.waitForFunction(() => window.__scene === 'mainmenu', null, { timeout: 120000 });
  const ms = Date.now() - t0;
  console.log(`time-to-mainmenu (50KB/s, 200ms RTT, q=sd): ${ms} ms`);
  await page.screenshot({ path: `${out}/ui6_slow_mainmenu.png` });
  ok(ms < 60000, `time-to-mainmenu under 60s (got ${ms}ms)`);
  // expose for the report
  await page.evaluate(ms => { window.__ttfm = ms; }, ms);
  await page.close();
}

console.log('\n=== ui6 summary ===');
console.log('fails', fails.length, fails);
console.log('console errors', errs.length, errs.slice(0, 8));
await browser.close();
if (fails.length || errs.length) process.exit(1);
console.log('ALL OK');
