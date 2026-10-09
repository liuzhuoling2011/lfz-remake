// Mini-games (小遊戲): drives every game standalone (main menu → 小遊戲 → SelectActor → picker) and from the board
// (engine.minigame with a forced game) to its result screen; checks rewards; screenshots.
// node tests/minigames.mjs [outDir]   env: BASE, Q=sd|hd, MOBILE=1
import { chromium } from 'playwright';
const out = process.argv[2] || '/workspace/lfz-remake/screenshots';
const base = process.env.BASE || 'http://127.0.0.1:5173/';
const Q = process.env.Q || 'hd';
const mob = !!process.env.MOBILE;
const tag = (mob ? 'mobile_' : '') + Q;
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage(mob ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } });
const errs = [], fails = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
const ok = (c, m) => { if (!c) { fails.push(m); console.log('FAIL', m); } else console.log('ok', m); };
const ev = (f, a) => page.evaluate(f, a);
const shot = n => page.screenshot({ path: `${out}/mini_${n}_${tag}.png` });
const hit = async (id, wait = 400) => {
  const r = await ev(id => { const h = window.__lfzApp.hits.find(h => h.id === id); return h && h.r; }, id);
  if (!r) { ok(false, `no hit region ${id}`); return false; }
  const x = r.x + r.w / 2, y = r.y + r.h / 2;
  if (mob) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
  await page.waitForTimeout(wait); return true;
};
const press = async () => {
  if (mob) { const p = await ev(() => { const R = window.__lfzMini; const b = R.pad.find(b => b.k === 0); return b ? { x: b.x, y: b.y } : null; }); if (p) await page.touchscreen.tap(p.x, p.y); }
  else { await page.keyboard.down('Space'); await page.waitForTimeout(60); await page.keyboard.up('Space'); }
};
const phase = () => ev(() => window.__lfzMini?.phase);
const waitPhase = (p, t = 120000) => page.waitForFunction(p => window.__lfzMini && (Array.isArray(p) ? p.includes(window.__lfzMini.phase) : window.__lfzMini.phase === p), p, { timeout: t });
const NAMES = ['01_paint', '02_robot', '03_sling', '04_balloon'];
const MAP = [2, 1, 3, 0]; // picker button → game

// ---------------- main menu → 小遊戲 → select actor → picker
await page.goto(base + `?scene=mainmenu&mute&q=${Q}`);
await page.waitForFunction(() => window.__scene === 'mainmenu', null, { timeout: 60000 });
await page.waitForTimeout(1200);
await shot('mainmenu');
const ids = await ev(() => window.__lfzApp.hits.map(h => h.id));
ok(['mmopt', 'mmalbum', 'mmmini', 'mmnew', 'mmload', 'mmexit'].every(i => ids.includes(i)), 'main menu has the 6 original buttons');
await hit('mmalbum', 500); await shot('mainmenu_album');
ok(await ev(() => window.__lfzApp.hits.some(h => h.id === 'al-o')), '相簿 shows the no-content message'); await hit('al-o', 300);
for (let g = 0; g < 4; g++) {
  await page.goto(base + `?scene=mainmenu&mute&q=${Q}`);
  await page.waitForFunction(() => window.__scene === 'mainmenu', null, { timeout: 60000 });
  await page.waitForTimeout(600);
  await hit('mmmini', 700);
  ok(await ev(() => window.__scene === 'selectactor' && window.__setup.mode === 'mini'), `${NAMES[g]}: 小遊戲 → SelectActor (minigame mode)`);
  await ev(() => window.__setup.seats.forEach((s, i) => { s.on = true; s.ai = i > 0; }));
  if (g === 0) await shot('selectactor');
  await hit('aok', 800);
  ok(await ev(() => window.__scene === 'selectmini'), `${NAMES[g]}: SelectActor → SelectMiniGame`);
  await page.waitForTimeout(500);
  if (g === 0) await shot('picker');
  await hit('smg' + MAP.indexOf(g), 300);
  await page.waitForFunction(() => window.__scene === 'miniplay', null, { timeout: 10000 });
  ok(await ev(g => window.__lfzMini.game.id === g, g), `${NAMES[g]}: picker launches game ${g + 1}`);
  await waitPhase('intro', 30000); await page.waitForTimeout(2600); await shot(`${NAMES[g]}_intro`);
  await waitPhase('ready', 30000); await page.waitForTimeout(400);
  await shot(`${NAMES[g]}_ready`);
  await press();
  await waitPhase('play', 20000);
  // let the human do something
  for (let i = 0; i < 12; i++) {
    if (mob) { await press(); }
    else if (g === 0) { await page.keyboard.press('ArrowRight'); await page.keyboard.press('Space'); }
    else if (g === 3) { await page.keyboard.down('PageDown'); await page.keyboard.up('PageDown'); await page.keyboard.down('Delete'); await page.keyboard.up('Delete'); }
    else { await page.keyboard.down('Space'); await page.waitForTimeout(80); await page.keyboard.up('Space'); }
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(g === 1 ? 2500 : 1500);
  await shot(`${NAMES[g]}_play`);
  await ev(() => { window.__lfzMini.speed = 4; });
  if (g === 1 || g === 2) {
    await waitPhase('result', 120000); await ev(() => { window.__lfzMini.speed = 1; }); await page.waitForTimeout(3500);
    await shot(`${NAMES[g]}_result_standalone`);
    await ev(() => { window.__lfzMini.speed = 8; });
  }
  await page.waitForFunction(() => window.__scene === 'selectmini', null, { timeout: 120000 });
  const last = await ev(() => window.__lfzMiniLast);
  ok(last && last.game === g && last.standalone && last.cardId === null, `${NAMES[g]}: standalone finished → back to picker, no card (${JSON.stringify(last)})`);
}

// ---------------- board mode: forced game, rewards
await page.goto(base + `?scene=game&mute&q=${Q}`);
await page.waitForFunction(() => window.__lfz && window.__lfz.scene.ready && window.__lfz.scene.turnMenuRes, null, { timeout: 120000 });
await page.waitForTimeout(800);
for (let g = 0; g < 4; g++) {
  let done = false;
  for (let attempt = 0; attempt < 4 && !done; attempt++) {
    const before = await ev(() => window.__lfz.g.players.map(p => ({ cash: p.cash, cards: p.cards.length })));
    await ev(g => { window.__forceMini = g; window.__lfz.miniP = window.__lfz.engine.minigame(window.__lfz.g.players[0]).then(() => { window.__lfz.miniDone = true; }); window.__lfz.miniDone = false; }, g);
    await waitPhase('ready', 60000); await press();
    await waitPhase('play', 20000);
    await ev(() => { window.__lfzMini.speed = 12; });
    await waitPhase(['result', 'done'], 120000);
    const r0 = await ev(() => ({ ph: window.__lfzMini.phase, w: window.__lfzMini.winner, to: window.__lfzMini.timeout }));
    if (r0.ph === 'result') {
      await ev(() => { window.__lfzMini.speed = 1; });
      await page.waitForTimeout(g === 0 || g === 3 ? 1800 : 3500);
      await shot(`${NAMES[g]}_result_board`);
      if (g === 0 || g === 3) { await press(); await page.waitForTimeout(200); }
      await ev(() => { window.__lfzMini.speed = 8; });
    }
    await page.waitForFunction(() => window.__lfz.miniDone, null, { timeout: 120000 });
    await page.waitForTimeout(300);
    const res = await ev(() => window.__lfz.lastMini);
    const after = await ev(() => window.__lfz.g.players.map(p => ({ cash: p.cash, cards: p.cards.length })));
    if (g === 0 || g === 3) {
      if (res.winner === null) { console.log(`  ${NAMES[g]} board: TIME IS UP (no reward) — retry for a winner`); ok(after.every((a, i) => a.cards === before[i].cards), `${NAMES[g]} board: timeout gives nothing`); continue; }
      ok(res.cardId >= 1 && res.cardId <= 16, `${NAMES[g]} board: winner P${res.winner + 1} drew word card ${res.cardId}`);
      ok(after[res.winner].cards === Math.min(32, before[res.winner].cards + 1) && after.every((a, i) => i === res.winner || a.cards === before[i].cards), `${NAMES[g]} board: only the winner got a card`);
      ok(after.every((a, i) => a.cash === before[i].cash), `${NAMES[g]} board: no cash change`);
    } else {
      ok(res.scores.every((s, i) => s === null || after[i].cash === before[i].cash + s), `${NAMES[g]} board: cash += score ${JSON.stringify(res.scores)}`);
      if (g === 2) ok(res.scores.every(s => s === null || s % 10 === 0), `${NAMES[g]} board: score = hits×10`);
      ok(after.every((a, i) => a.cards === before[i].cards), `${NAMES[g]} board: no cards`);
    }
    done = true;
  }
  ok(done, `${NAMES[g]} board: reached its result`);
}
// eligibility: jailed / hospital / frozen players sit out
await ev(() => { const g = window.__lfz.g; g.players[1].status.jail = 2; g.players[2].status.frozen = 1; window.__forceMini = 3; window.__lfz.engine.minigame(g.players[0]); });
await waitPhase('ready', 60000);
ok(await ev(() => JSON.stringify(window.__lfzMini.parts.map(p => p.slot)) === '[0,3]'), 'jail / 一曝十寒 players excluded');
await shot('board_eligibility');
await ev(() => { window.__lfzMini.abort(); });
console.log('console errors:', errs.length, errs.slice(0, 10).join('\n'));
console.log(fails.length ? `FAILURES ${fails.length}: ${fails.join(' | ')}` : 'ALL OK');
await browser.close();
process.exit(fails.length || errs.length ? 1 : 0);
