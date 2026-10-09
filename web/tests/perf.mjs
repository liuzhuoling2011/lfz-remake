// Measures per-frame render cost of the game scene (ms) and rAF pacing.
import { chromium } from 'playwright';
const [,, q = '?auto&mute&weeks=3', w = '1280', h = '800', dpr = '1'] = process.argv;
const base = process.env.BASE || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ args: process.env.GPU ? ['--enable-gpu', '--use-angle=swiftshader'] : [] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
await page.goto(base + q);
await page.waitForFunction(() => window.__lfz && window.__lfz.g, null, { timeout: 60000 });
await page.waitForTimeout(3000);
const r = await page.evaluate(async () => {
  const sc = window.__lfz.scene; const v = sc.view; const app = window.__app;
  const c = document.querySelector('canvas'); const ctx = c.getContext('2d');
  const time = (fn, n = 40) => { const t0 = performance.now(); for (let i = 0; i < n; i++) fn(); ctx.getImageData(0, 0, 1, 1); return (performance.now() - t0) / n; };
  const W = innerWidth, H = innerHeight;
  const out = { full: time(() => sc.render(ctx, W, H)), view: time(() => v.render(ctx, W, H)) };
  { const lg = v.liveGround; v.liveGround = []; out.noLive = time(() => v.render(ctx, W, H)); v.liveGround = lg; const ob = v.objects; v.objects = []; out.noObj = time(() => v.render(ctx, W, H)); v.objects = ob; const ic = v.icons; v.icons=[]; const ck = v.chunks; v.chunks = []; out.noChunks = time(() => v.render(ctx, W, H)); v.chunks = ck; v.icons = ic; }
  const ch = v.chunks; out.chunks = ch.length; out.chunkType = ch[0]?.c?.constructor?.name; out.objects = v.objects.length; out.live = v.liveGround.length;
  const ft = await new Promise(res => { const a = []; let l = performance.now(); const f = t => { a.push(t - l); l = t; if (a.length < 120) requestAnimationFrame(f); else res(a.sort((x, y) => x - y)); }; requestAnimationFrame(f); });
  out.p50 = ft[60]; out.p95 = ft[114];
  return out;
});
console.log(JSON.stringify(r));
await browser.close();
