// Phase-2 screenshots: card cast popup at several sizes/DPR, one-vs-two dice UI + animation, mid-build frames, AI toast.
// node tests/screens2.mjs [outDir]    (BASE env = server root)
import { chromium } from 'playwright';
const out = process.argv[2] || '/workspace/lfz-remake/screenshots';
const base = process.env.BASE || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const errs = [];
async function open(q, w, h, dpr = 1, mobile = false) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto(base + q);
  await page.waitForFunction(() => window.__lfz && window.__lfz.g && window.__lfz.scene.turnMenuRes, null, { timeout: 90000 });
  await page.waitForTimeout(800);
  return page;
}
const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png` }).then(() => console.log('saved', name));

// 1) card cast popup (real engine path: human casts 一曝十寒 on seat 1 / 金鋼護體 on self) at 4 sizes
for (const [w, h, dpr, mob, tag] of [[1280, 800, 1, false, '1280x800'], [1920, 1080, 1, false, '1920x1080'], [390, 844, 3, true, 'mobile_portrait'], [844, 390, 3, true, 'mobile_landscape']]) {
  const page = await open('?scene=game&mute', w, h, dpr, mob);
  if (tag === '1280x800') await shot(page, 'dice_choice_menu_1280x800');
  if (tag === 'mobile_portrait') await shot(page, 'dice_choice_menu_mobile_portrait');
  await page.evaluate(() => { const l = window.__lfz; void l.engine.useCard(l.g.players[0], 7, 1); });
  await page.waitForTimeout(700);
  await shot(page, `card_cast_${tag}`);
  if (tag === '1280x800') {
    await page.mouse.click(5, 5); await page.waitForTimeout(2500);
    await page.evaluate(() => { const l = window.__lfz; void l.engine.useCard(l.g.players[0], 12, 0); });
    await page.waitForTimeout(700); await shot(page, 'card_cast_self_1280x800');
  }
  await page.close();
}

// 2) dice: one die vs two dice animation (mid-tumble + landed with bounce/sum)
{
  const page = await open('?scene=game&mute', 1280, 800);
  // hide the turn menu while showing the dice (as in the real flow, where the menu closes on the throw)
  await page.evaluate(() => { const sc = window.__lfz.scene; window.__tm = sc.turnMenuRes; sc.turnMenuRes = null; });
  await page.evaluate(() => { void window.__lfz.scene.ui.dice(5, 0); });
  await page.waitForTimeout(380); await shot(page, 'dice_one_tumble');
  await page.waitForTimeout(800); await shot(page, 'dice_one_landed');
  await page.waitForTimeout(1200);
  await page.evaluate(() => { void window.__lfz.scene.ui.dice(3, 6); });
  await page.waitForTimeout(380); await shot(page, 'dice_two_tumble');
  await page.waitForTimeout(800); await shot(page, 'dice_two_landed');
  await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__lfz.scene.turnMenuRes = window.__tm; });
  // 3) building construction: scaffold → rise (mid-build) → done
  const info = await page.evaluate(() => {
    const l = window.__lfz; const v = l.engine.view; const b = l.engine.b; const g = l.g;
    const t = b.tiles[g.players[0].tile]; let best = 0, bd = 1e9;
    b.plots.forEach((p, i) => { if (g.plots[i]) return; const d = Math.hypot(p.x - t.x, p.y - t.y); if (d < bd) { bd = d; best = i; } });
    const p = b.plots[best]; v.lastManualPan = -1e9; v.focusOn(p.x, p.y, true);
    window.__bp = best; return best;
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => { const l = window.__lfz; const i = window.__bp; void l.engine.view.construct(i, false, () => { l.g.plots[i] = { owner: 0, type: 1, level: 2 }; }); });
  await page.waitForTimeout(330); await shot(page, 'build_scaffold');
  await page.waitForTimeout(470); await shot(page, 'build_mid_rise');
  await page.waitForTimeout(1200); await shot(page, 'build_done');
  await page.close();
}

// 4) AI turn: non-blocking toast (no dialog) — wait for the first toast in a real-speed AI game
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto(base + '?auto&mute&weeks=4');
  await page.waitForFunction(() => window.__lfz && window.__lfz.scene && window.__lfz.scene.toasts && window.__lfz.scene.toasts.some(t => t.t > 200), null, { timeout: 120000, polling: 100 });
  const st = await page.evaluate(() => ({ toasts: window.__lfz.scene.toasts.map(t => t.text), dialogs: window.__lfz.scene.dlgs.map(d => d.kind + (d.passive ? '(passive)' : '')) }));
  console.log('AI toast state', JSON.stringify(st));
  await shot(page, 'ai_toast_nonblocking');
  await page.close();
}
console.log('console errors:', errs.length, errs.slice(0, 10).join('\n'));
await browser.close();
