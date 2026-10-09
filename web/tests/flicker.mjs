// Flicker proof: fixed camera over hills / piers / ships on each map, record consecutive frames, diff them.
// Changed pixels are attributed to (a) legit animated objects (sea, ships, birds, icons, actors…) or (b) anything else.
// node tests/flicker.mjs [outDir] [tag]   (BASE env = server root; Q env = "sd,hd")
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import fs from 'fs';
const out = process.argv[2] || '/workspace/lfz-remake/screenshots/flicker';
const tag = process.argv[3] || 'after';
fs.mkdirSync(out, { recursive: true });
const base = process.env.BASE || 'http://127.0.0.1:5173/';
const QS = (process.env.Q || 'sd,hd').split(',');
const W = 1280, H = 720, N = 16;
const browser = await chromium.launch();
const errs = [];
const report = [];
for (const map of [0, 1, 2]) for (const q of QS) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto(base + `?scene=game&mute&map=${map}&q=${q}`);
  await page.waitForFunction(() => window.__lfz && window.__lfz.g && window.__lfz.scene.turnMenuRes, null, { timeout: 120000 });
  await page.waitForTimeout(2500);
  // spots: one of each kind of suspicious scenery present on this map
  const spots = await page.evaluate(() => {
    const v = window.__lfz.engine.view; const r = []; const seen = new Set();
    const kinds = ['big_hill', 'pier', 'taiping_hill', 'oldship', 'hk_ship', 'smallship', 'sea_fllower_0102'];
    for (const o of v.objects) { const nm = v.data.sprites[o.s]; if (kinds.includes(nm) && !seen.has(nm)) { seen.add(nm); r.push({ nm, x: o.x, y: o.y - 40 }); } }
    return r;
  });
  for (const sp of spots) {
    await page.evaluate(({ x, y }) => {
      const l = window.__lfz, v = l.engine.view; v.follow = null; v.lastManualPan = 1e15; v.userZoom = 1; v.cx = x; v.cy = y;
      for (const a of v.actors) a.hidden = true; // actors idle-animate; hide them so only scenery remains
      l.scene.hideHud = true;
    }, sp);
    await page.waitForTimeout(400);
    // legit animation mask: union of all frames of every animated object (screen space)
    // "legit" = the sprite's own SPR header says it is an animation (anim_param > 0, >1 frame per direction group);
    // decided from the data, independent of what the renderer currently does
    const boxes = await page.evaluate(async () => {
      const meta = await (await fetch('assets/sprites/index.json')).json();
      const v = window.__lfz.engine.view; const r = [];
      for (const o of [...v.objects, ...v.liveGround, ...v.icons]) {
        const m = meta['map/' + v.data.sprites[o.s]]; const g = m && (m.g || [m.f.length]);
        if (!m || !(m.a > 0) || !g.some(n => n > 1)) continue; const sh = v.sheets[o.s]; if (!sh) continue;
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        for (const f of sh.f) { x0 = Math.min(x0, o.x - f[4]); y0 = Math.min(y0, o.y - f[5]); x1 = Math.max(x1, o.x - f[4] + f[2]); y1 = Math.max(y1, o.y - f[5] + f[3]); }
        const a = v.toScreen(x0, y0), b = v.toScreen(x1, y1); r.push([a.x - 2, a.y - 2, b.x + 2, b.y + 2]);
      }
      return r;
    });
    const frames = [];
    for (let i = 0; i < N; i++) { frames.push(PNG.sync.read(await page.screenshot())); await page.waitForTimeout(70); }
    const mask = new Uint8Array(W * H);
    for (const [x0, y0, x1, y1] of boxes) for (let y = Math.max(0, y0 | 0); y < Math.min(H, Math.ceil(y1)); y++) for (let x = Math.max(0, x0 | 0); x < Math.min(W, Math.ceil(x1)); x++) mask[y * W + x] = 1;
    const heat = new PNG({ width: W, height: H });
    let legit = 0, bad = 0;
    const acc = new Uint8Array(W * H);
    for (let i = 1; i < N; i++) {
      const A = frames[i - 1].data, B = frames[i].data;
      for (let p = 0; p < W * H; p++) { const k = p * 4; if (Math.abs(A[k] - B[k]) + Math.abs(A[k + 1] - B[k + 1]) + Math.abs(A[k + 2] - B[k + 2]) > 24) acc[p] = 1; }
    }
    const F = frames[0].data;
    for (let p = 0; p < W * H; p++) {
      const k = p * 4; const g = (F[k] * 0.3 + F[k + 1] * 0.59 + F[k + 2] * 0.11) * 0.45;
      heat.data[k] = heat.data[k + 1] = heat.data[k + 2] = g; heat.data[k + 3] = 255;
      if (acc[p]) { if (mask[p]) { legit++; heat.data[k] = 40; heat.data[k + 1] = 220; heat.data[k + 2] = 80; } else { bad++; heat.data[k] = 255; heat.data[k + 1] = 30; heat.data[k + 2] = 30; } }
    }
    const f = `${out}/flicker_${tag}_map${map}_${q}_${sp.nm}.png`;
    fs.writeFileSync(f, PNG.sync.write(heat));
    report.push({ map, q, spot: sp.nm, legitAnimPx: legit, otherChangedPx: bad, file: f });
    console.log(JSON.stringify(report[report.length - 1]));
  }
  await page.close();
}
fs.writeFileSync(`${out}/flicker_${tag}.json`, JSON.stringify(report, null, 1));
console.log('console errors:', errs.length, errs.slice(0, 5).join('\n'));
await browser.close();
