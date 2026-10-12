// Regression: original-style bankrupt stamp, NPC card panel, choose-target window (exe 0x40d3b0) and steps panel (0x40d980):
// mouse + keyboard each resolve the right value.
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://127.0.0.1:4174/';
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
let fail = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fail++; };
await page.goto(base + '?scene=game&map=0&mute');
await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 }); await page.waitForTimeout(2000);
const open = js => page.evaluate(js => { window.__r = 'pending'; Promise.resolve(eval(js)).then(v => { window.__r = v === undefined ? 'undef' : v; }); }, js);
const res = async () => { await page.waitForTimeout(300); return page.evaluate(() => window.__r); };
const hit = id => page.evaluate(id => { const h = [...(window.__lfzApp.prevHits || []), ...(window.__lfzApp.hits || [])].find(z => z.id === id); const r = h?.r ?? h?.rect; return r ? { x: r.x + r.w / 2, y: r.y + r.h / 2 } : null; }, id);
const click = async id => { await page.waitForTimeout(700); const p = await hit(id); ok(!!p, `hit ${id} present`); if (p) await page.mouse.click(p.x, p.y); };
const U = 'window.__lfz.engine.ui';
await open(`${U}.pickPlayer('t', [1,2,3])`); await click('pp1'); ok(await res() === 2, 'players: click 2nd face → seat 2');
await open(`${U}.pickPlayer('t', [1,2,3])`); await page.waitForTimeout(400); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); ok(await res() === 2, 'players: →→Enter → seat 2');
await open(`${U}.pickPlayer('t', [1,2,3])`); await page.waitForTimeout(400); await page.keyboard.press('3'); ok(await res() === 3, 'players: key 3 → seat 3');
await open(`${U}.pickPlayer('t', [1,2,3])`); await click('ppx'); ok(await res() === -1, 'players: X → cancel');
await open(`${U}.pickPlayer('t', [1,2,3])`); await page.waitForTimeout(400); await page.keyboard.press('Escape'); ok(await res() === -1, 'players: Esc → cancel');
await open(`${U}.pickSteps()`); await click('stp2'); ok(await res() === 3, 'steps: click 3rd die → 3');
await open(`${U}.pickSteps()`); await page.waitForTimeout(400); await page.keyboard.press('5'); ok(await res() === 5, 'steps: key 5');
await open(`${U}.pickSteps()`); await page.waitForTimeout(400); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); ok(await res() === 2, 'steps: →→Enter → 2');
const sp = await page.evaluate(() => { const h = [...window.__lfzApp.hits]; return null; });
await open(`${U}.pickSteps()`); await page.waitForTimeout(700); const d0 = await hit('stp0'); ok(d0 && d0.x < 200 && d0.y > 300, 'steps panel bottom-left'); await page.keyboard.press('1'); await res();
await open(`${U}.message('X破產了！', { badge: 'gameover' })`); await page.waitForTimeout(800); await page.mouse.click(640, 400); ok(await res() === 'undef', 'bankrupt: click closes');
await open(`${U}.message('npc', { title: '流氓', image: 'images/cards/character08_attack.jpg', kind: 'npc' })`); await click('chanceok'); ok(await res() === 'undef', 'npc: card panel click closes');
ok(!errs.length, 'no page errors ' + errs.join('|'));
await b.close(); process.exit(fail ? 1 : 0);
