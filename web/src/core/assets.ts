// Asset loading: sprite sheets (WebP + frame table), JSON, images.
export const BASE = import.meta.env.BASE_URL + 'assets/';

export type Frame = [number, number, number, number, number, number]; // x,y,w,h,hx,hy
export interface SheetMeta { f: Frame[]; g?: number[]; tw?: number; th?: number; n?: string; a?: number }
export interface Sheet extends SheetMeta { name: string; img: CanvasImageSource | null; groupStart: number[] }

let index: Record<string, SheetMeta> = {};
const sheets = new Map<string, Sheet>();
const loading = new Map<string, Promise<Sheet>>();

export async function fetchJSON<T = any>(path: string): Promise<T> {
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error('fetch ' + path + ' ' + r.status);
  return r.json();
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('img ' + url));
    im.src = url;
  });
}

/** Pre-decode an image into an ImageBitmap (falls back to the decoded <img>). */
export async function toBitmap(im: HTMLImageElement): Promise<CanvasImageSource> {
  try { await im.decode(); } catch { /* already decoded / not supported */ }
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(im); } catch { /* fall through */ }
  }
  return im;
}

export async function initSprites() {
  index = await fetchJSON('sprites/index.json');
}

export function hasSheet(name: string) { return name in index; }

export function sheet(name: string): Sheet | null {
  const s = sheets.get(name);
  if (s) return s;
  if (!(name in index)) return null;
  void loadSheet(name);
  return sheets.get(name) ?? null;
}

export function loadSheet(name: string): Promise<Sheet> {
  const ex = loading.get(name);
  if (ex) return ex;
  const meta = index[name];
  if (!meta) return Promise.reject(new Error('no sheet ' + name));
  const gs: number[] = [];
  let acc = 0;
  for (const c of meta.g ?? [meta.f.length]) { gs.push(acc); acc += c; }
  const sh: Sheet = { ...meta, name, img: null, groupStart: gs };
  sheets.set(name, sh);
  // decode off the main thread and keep a GPU-friendly ImageBitmap so the first draw never stalls
  const p = loadImage(BASE + 'sprites/' + name + '.webp').then(toBitmap).then(img => { sh.img = img; return sh; });
  loading.set(name, p);
  return p;
}

export async function loadSheets(names: string[], onProgress?: (done: number, total: number) => void) {
  let done = 0;
  const uniq = [...new Set(names)].filter(n => n in index);
  await Promise.all(uniq.map(n => loadSheet(n).catch(e => console.warn(e)).then(() => { done++; onProgress?.(done, uniq.length); })));
}

/** Draw a frame with its hotspot at (x,y). */
export function drawFrame(ctx: CanvasRenderingContext2D, name: string | Sheet, fi: number, x: number, y: number, scale = 1, alpha = 1) {
  const sh = typeof name === 'string' ? sheet(name) : name;
  if (!sh || !sh.img) return;
  const f = sh.f[fi < 0 ? 0 : fi >= sh.f.length ? sh.f.length - 1 : fi];
  if (!f) return;
  if (alpha !== 1) { const a = ctx.globalAlpha; ctx.globalAlpha = a * alpha; ctx.drawImage(sh.img, f[0], f[1], f[2], f[3], x - f[4] * scale, y - f[5] * scale, f[2] * scale, f[3] * scale); ctx.globalAlpha = a; }
  else ctx.drawImage(sh.img, f[0], f[1], f[2], f[3], x - f[4] * scale, y - f[5] * scale, f[2] * scale, f[3] * scale);
}

/** Draw a frame into a target rect (ignoring hotspot), keeping aspect ratio (contain). */
export function drawFrameFit(ctx: CanvasRenderingContext2D, name: string, fi: number, x: number, y: number, w: number, h: number) {
  const sh = sheet(name);
  if (!sh || !sh.img) return;
  const f = sh.f[Math.min(fi, sh.f.length - 1)];
  const s = Math.min(w / f[2], h / f[3]);
  const dw = f[2] * s, dh = f[3] * s;
  ctx.drawImage(sh.img, f[0], f[1], f[2], f[3], x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

export function frameRect(name: string, fi: number, ax: number, ay: number, scale = 1) {
  const sh = sheet(name) ?? (index[name] as Sheet | undefined);
  const f = sh?.f[fi];
  if (!f) return { x: ax, y: ay, w: 0, h: 0 };
  return { x: ax - f[4] * scale, y: ay - f[5] * scale, w: f[2] * scale, h: f[3] * scale };
}

export function frameCount(name: string) { return index[name]?.f.length ?? 0; }
const giCache = new Map<string, { g: number[]; start: number[] }>();
/** Direction-group layout of a sheet (cached: called every frame for animated objects). */
export function groupInfo(name: string): { g: number[]; start: number[] } {
  let r = giCache.get(name);
  if (r) return r;
  const m = index[name];
  const g = m?.g ?? [m?.f.length ?? 1];
  const start: number[] = []; let a = 0; for (const c of g) { start.push(a); a += c; }
  r = { g, start }; if (m) giCache.set(name, r);
  return r;
}

const imgCache = new Map<string, HTMLImageElement>();
export function image(path: string): HTMLImageElement | null {
  const c = imgCache.get(path);
  if (c) return c.complete ? c : null;
  const im = new Image(); im.src = BASE + path; imgCache.set(path, im);
  return null;
}
export function preloadImage(path: string) { return loadImage(BASE + path).then(async im => { try { await im.decode(); } catch { /* ignore */ } imgCache.set(path, im); return im; }); }
