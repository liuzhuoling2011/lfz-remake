// Round 17: stamp-only bankrupt; no face glow; picture-less NPC → smessagebox; target filter; AI auto-pick (no turbo).
import { chromium } from 'playwright';
import path from 'path';
const base = process.env.BASE || 'http://127.0.0.1:4174/';
const out = path.resolve('../screenshots/round17');
const b = await chromium.launch();
let fail = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fail++; };

// --- unit-ish: targetCandidates via engine ---
{
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(base + '?scene=game&map=0&mute');
  await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const e = window.__lfz.engine; const g = e.g;
    g.players[1].status.hospital = 2;
    g.players[2].status.jail = 1;
    g.players[3].status.frozen = 3;
    const a = e.targetCandidates(g.players[0]);
    g.players[2].status.jail = 0; g.players[3].status.frozen = 0; g.players[1].alive = false; g.players[1].status.hospital = 0;
    const b = e.targetCandidates(g.players[0]);
    // reset
    g.players[1].alive = true; g.players[2].status.jail = 0; g.players[3].status.frozen = 0;
    const c = e.targetCandidates(g.players[0]);
    const d = e.targetCandidates(g.players[0], true);
    return { hospJailFrozen: a, dead: b, allOpp: c, withSelf: d };
  });
  ok(r.hospJailFrozen.length === 0, 'target: hospital+jail+frozen all excluded → ' + JSON.stringify(r.hospJailFrozen));
  ok(r.dead.length === 2, 'target: dead excluded, 2 remain → ' + r.dead);
  ok(r.allOpp.length === 3 && !r.allOpp.includes(0), 'target: 3 opponents');
  ok(r.withSelf.length === 4 && r.withSelf.includes(0), 'target: includeSelf adds caster');
  await page.close();
}

// --- visual shots + AI auto-pick WITHOUT turbo ---
{
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(base + '?scene=game&map=0&mute');
  await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  const U = 'window.__lfz.engine.ui';
  const open = (js) => page.evaluate(js => { window.__r = 'pending'; Promise.resolve(eval(js)).then(v => { window.__r = v === undefined ? 'undef' : v; }); }, js);
  const waitRes = async (ms = 2500) => { await page.waitForFunction(() => window.__r !== 'pending', null, { timeout: ms }); return page.evaluate(() => window.__r); };
  const shot = async (n) => { await page.waitForTimeout(500); await page.screenshot({ path: path.join(out, n) }); };

  // bankrupt stamp only
  await open(`${U}.message('大番薯破產了！', { badge: 'gameover' })`);
  await shot('bankrupt.png');
  await page.mouse.click(640, 400); ok(await waitRes() === 'undef', 'bankrupt closes');

  // pictured NPC → chance card
  await open(`${U}.message('流氓阿飛動手！', { title: '流氓', image: 'images/cards/character08_attack.jpg', kind: 'npc' })`);
  await shot('npc_pictured.png');
  await page.evaluate(() => { const d = window.__lfz.scene.dlgs[0]; if (d) d.resolve(undefined); }); await waitRes();

  // picture-less NPC (財神) → smessagebox, not white remake panel
  await open(`${U}.message('財神降臨！免費過路！', { title: '財神', kind: 'npc' })`);
  await page.waitForTimeout(600);
  const hasMb = await page.evaluate(() => {
    const hits = [...(window.__lfzApp.hits || []), ...(window.__lfzApp.prevHits || [])];
    // smessagebox O button id is 'dm-o' from drawMsgBox
    return hits.some(h => String(h.id).startsWith('dm'));
  });
  ok(hasMb, 'picture-less NPC uses smessagebox hits');
  await shot('npc_no_picture.png');
  await page.evaluate(() => { const d = window.__lfz.scene.dlgs[0]; if (d) d.resolve(undefined); }); await waitRes();

  // choose-target: no glow (just capture); AI auto-pick resolves to seat 2 without turbo
  await open(`${U}.pickPlayer('你要對誰使用？', [1,2,3], { auto: 2 })`);
  await shot('choose_player.png');
  ok(await waitRes(3000) === 2, 'AI auto-pick players → 2');

  // steps AI auto-pick
  await open(`${U}.pickSteps({ auto: 4 })`);
  await shot('choose_steps.png');
  ok(await waitRes(3000) === 4, 'AI auto-pick steps → 4');

  // confirm panel is still showing during auto (not turbo-skipped): open and check dlg exists mid-wait
  await open(`${U}.pickPlayer('t', [1,2,3], { auto: 1 })`);
  await page.waitForTimeout(200);
  const mid = await page.evaluate(() => ({ n: window.__lfz.scene.dlgs.length, kind: window.__lfz.scene.dlgs[0]?.kind, auto: window.__lfz.scene.dlgs[0]?.auto?.value }));
  ok(mid.n === 1 && mid.kind === 'players' && mid.auto === 1, 'auto panel is visible mid-flight (not turbo-skipped) ' + JSON.stringify(mid));
  ok(await waitRes(3000) === 1, 'auto eventually resolves');

  await page.close();
}

await b.close();
process.exit(fail ? 1 : 0);
