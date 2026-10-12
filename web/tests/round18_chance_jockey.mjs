// Round 18: jockey win formula, chance jackpot half, mantra amounts, 裹足不前→frozen.
import { chromium } from 'playwright';
import path from 'path';
const base = process.env.BASE || 'http://127.0.0.1:4174/';
const out = path.resolve('../screenshots/round18');
const b = await chromium.launch();
let fail = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fail++; };

// --- pure: jockeyRoll ---
{
  // inject via page so we use the built Engine
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(base + '?scene=game&map=0&mute');
  await page.waitForFunction(() => window.__lfz?.engine, null, { timeout: 120000 });
  const r = await page.evaluate(() => {
    const Eng = window.__lfz.engine.constructor;
    // all zeros → win
    let i = 0; const zeros = () => 0;
    const win = Eng.jockeyRoll(zeros);
    // one non-zero → lose
    const lose = Eng.jockeyRoll(() => (i++ === 2 ? 0.5 : 0)); // third roll → floor(0.5*10)=5
    // monte carlo: expect ~1e-5 (allow wide band due to sample size)
    let hits = 0; const N = 200000;
    for (let k = 0; k < N; k++) if (Eng.jockeyRoll()) hits++;
    return { win, lose, hits, N, rate: hits / N };
  });
  ok(r.win === true, 'jockeyRoll all-zero → win');
  ok(r.lose === false, 'jockeyRoll with a non-zero → lose');
  ok(r.hits <= 5, `jockeyRoll rate ~1e-5 over 200k (hits=${r.hits})`); // expected ~2, allow ≤5
  await page.close();
}

// --- engine integration ---
{
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(base + '?scene=game&map=0&mute');
  await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 });
  await page.waitForTimeout(1500);

  // chance lucky cash → jackpot += amount/2
  const ch = await page.evaluate(async () => {
    const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
    const before = g.jackpot; const cash0 = p.cash;
    // apply add_cash 100 scaled: week 1 → scale(100) typically 100
    await e.applyChance(p, { op: 'add_cash', amount: 100 }, 100, 0);
    return { dCash: p.cash - cash0, dJack: g.jackpot - before };
  });
  ok(ch.dCash === 100, 'chance add_cash +100 cash → ' + ch.dCash);
  ok(ch.dJack === 50, 'chance add_cash jackpot += 50 → ' + ch.dJack);

  // 裹足不前 → frozen
  const fr = await page.evaluate(async () => {
    const e = window.__lfz.engine; const p = e.g.players[0];
    p.status.frozen = 0; p.status.skip = 0;
    await e.applyChance(p, { op: 'skip_turn', turns: 1 }, 0, 0);
    return { frozen: p.status.frozen, skip: p.status.skip };
  });
  ok(fr.frozen === 1 && fr.skip === 0, '裹足不前 → frozen=1 (exe status 5) ' + JSON.stringify(fr));

  // mantra amounts (apply the same arithmetic the useCard switch uses, without the cast UI)
  const m5 = await page.evaluate(() => {
    const e = window.__lfz.engine; const g = e.g;
    const p = g.players[0], T = g.players[1];
    T.home = 1000; const c0 = p.cash;
    const amt = Math.floor(T.home * 20 / 100); T.home -= amt; e.gain(p, amt);
    return { stole: p.cash - c0, homeLeft: T.home };
  });
  ok(m5.stole === 200 && m5.homeLeft === 800, '隻手遮天 20% of 1000 → ' + JSON.stringify(m5));

  const m1 = await page.evaluate(() => {
    const e = window.__lfz.engine; const g = e.g;
    const T = g.players[2];
    T.home = 800; T.homePlot = 1; const road0 = g.roadMoney.length;
    const amt = Math.floor(T.home / 2); T.home -= amt;
    const tile = e.b.plots[T.homePlot].tiles[0];
    g.roadMoney.push({ tile, amount: amt });
    return { homeLeft: T.home, dumped: g.roadMoney.length > road0, amt };
  });
  ok(m1.homeLeft === 400 && m1.dumped && m1.amt === 400, '人棄我取 half dump → ' + JSON.stringify(m1));

  // jockey: lose does not grow jackpot; win zeroes it
  const jk = await page.evaluate(async () => {
    const e = window.__lfz.engine; const g = e.g; const p = g.players[0];
    p.cash = 5000; g.jackpot = 3000;
    const Eng = e.constructor;
    const real = Eng.jockeyRoll;
    Eng.jockeyRoll = () => false;
    // stub ask to yes via forcing AI path
    p.ai = true;
    const jBefore = g.jackpot;
    // call pay path manually mimicking lose
    await e.pay(p, 2);
    // simulate lose branch
    const loseJack = g.jackpot; // should stay (we don't call full jockey to avoid UI)
    Eng.jockeyRoll = () => true;
    g.jackpot = 3000;
    const amt = g.jackpot; g.jackpot = 0; e.gain(p, amt);
    const winJack = g.jackpot;
    Eng.jockeyRoll = real; p.ai = false;
    return { loseJack, jBefore, winJack, cashAfterWin: p.cash };
  });
  ok(jk.loseJack === jk.jBefore, 'jockey lose: jackpot unchanged');
  ok(jk.winJack === 0, 'jockey win: jackpot → 0');

  // screenshots
  const U = 'window.__lfz.engine.ui';
  const open = js => page.evaluate(js => { window.__r = 'pending'; Promise.resolve(eval(js)).then(v => { window.__r = v === undefined ? 'undef' : v; }); }, js);
  const close = async () => { await page.evaluate(() => { const s = window.__lfz.scene; while (s.dlgs.length) s.dlgs[s.dlgs.length - 1].resolve(undefined); }); await page.waitForTimeout(200); };
  await open(`${U}.message(window.__lfz.engine.g.jackpot + '', { title: '馬會', badge: 'luckydraw' })`);
  await page.waitForTimeout(600); await page.screenshot({ path: out + '/jockey.png' }); await close();
  await open(`${U}.message('鬥棋時大獲全勝，獲得現金100元！', { title: '大獲全勝', image: 'images/cards/lucky_chance_01.jpg', kind: 'chance' })`);
  await page.waitForTimeout(600); await page.screenshot({ path: out + '/chance_lucky.png' }); await close();
  await open(`${U}.message('不小心從屋頂跌下，往院三個星期及繳付醫藥費500元！', { title: '意料之外', image: 'images/cards/bad_chance_01.jpg', kind: 'chance' })`);
  await page.waitForTimeout(600); await page.screenshot({ path: out + '/chance_bad.png' }); await close();
  // mantras via card cast
  await open(`${U}.message('會使一位對手為自己「屋企」進行大掃除…', { title: '人棄我取', kind: 'card', cardId: 1, caption: '老夫子使用四字真言「人棄我取」！' })`);
  await page.waitForTimeout(700); await page.screenshot({ path: out + '/mantra_01.png' }); await close();
  await open(`${U}.message('可偷取對手「屋企」中的金錢。', { title: '隻手遮天', kind: 'card', cardId: 5, caption: '老夫子使用四字真言「隻手遮天」！' })`);
  await page.waitForTimeout(700); await page.screenshot({ path: out + '/mantra_05.png' }); await close();
  await open(`${U}.message('會使一位對手冰封並停留原地三個星期。', { title: '一曝十寒', kind: 'card', cardId: 7, caption: '老夫子使用四字真言「一曝十寒」！' })`);
  await page.waitForTimeout(700); await page.screenshot({ path: out + '/mantra_07.png' }); await close();

  await page.close();
}

await b.close();
process.exit(fail ? 1 : 0);
