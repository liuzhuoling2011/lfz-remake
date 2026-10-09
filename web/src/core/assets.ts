// Asset loading: sprite sheets (WebP + frame table), JSON, images.
export const BASE = import.meta.env.BASE_URL + 'assets/';

export type Frame = [number, number, number, number, number, number]; // x,y,w,h,hx,hy
export interface SheetMeta { f: Frame[]; g?: number[]; tw?: number; th?: number; n?: string; a?: number }
/**
 * A loaded sheet. `f` is always in SD (original 640x480-era) units — hotspots, layout and hit-tests never change.
 * `sf` are the matching *source* rects inside `img`, i.e. f scaled by `hs` when the HD (AI-upscaled) sheet is loaded,
 * so every draw samples the HD pixels but lands at exactly the same place/size as SD.
 */
export interface Sheet extends SheetMeta { name: string; img: CanvasImageSource | null; groupStart: number[]; sf: Frame[]; hs: number }

let index: Record<string, SheetMeta> = {};

// ------------------------------------------------------------------ HD asset set (畫質)
/** hd/index.json written by tools/upscale.py: per-sheet scale + upscaled card images */
let hdIndex: { sheets: Record<string, number>; images: Record<string, string>; bytes: number } | null = null;
let hdOn = false;
/** 'full' = every sheet + 2x chunk cache; 'lite' (auto on phones/tablets) = only what you look at closely:
 *  UI panels, card art, characters and player buildings — terrain/scenery stay SD to keep GPU memory low. */
let hdTier: 'full' | 'lite' = 'full';
const LITE = /^(interface\/|map\/character\/|map\/(a_)?(house|commcal|eating|home|buildhouse|downhouse)\d?$|map\/playermark)/;
/** sheets only used for the static ground (covered by the in-context HD ground tiles) → keep SD, saves memory + download */
export const preferSD = new Set<string>();
function hdAllowed(name: string) { return hdOn && !preferSD.has(name) && (hdTier === 'full' || LITE.test(name)); }
export function hdFull() { return hdOn && hdTier === 'full'; }
function isTouch() { return matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window; }
function decide(mode: number) {
  hdOn = hdAvailable() && (mode === 2 || (mode === 0 && autoWantsHD()));
  hdTier = mode === 0 && isTouch() ? 'lite' : 'full';
}
export let assetEpoch = 0; // bumped whenever the active SD/HD set changes (map view re-bakes its chunk cache)
/** 0 = 自動 (auto), 1 = 標準 (SD), 2 = 高清 (HD) */
export function autoWantsHD() {
  const dpr = window.devicePixelRatio || 1;
  const eff = dpr * Math.max(0.55, Math.min(2.4, Math.min(innerWidth, innerHeight) / 560)); // device px per art px on the board
  const mem = (navigator as any).deviceMemory as number | undefined;
  if (mem !== undefined && mem < 4) return false; // low-memory devices keep the light SD set
  return eff >= 1.3 || dpr >= 2;
}
export function hdActive() { return hdOn; }
export function hdAvailable() { return !!hdIndex && Object.keys(hdIndex.sheets).length > 0; }
export function hdBytes() { return hdIndex?.bytes ?? 0; }
/** Switch the asset set; already-loaded sheets are swapped in place once their new image is decoded. */
export async function setQuality(mode: number) {
  const before = hdOn + hdTier;
  decide(mode);
  if (before === hdOn + hdTier) return;
  imgCache.clear();
  await Promise.all([...sheets.values()].map(sh => fetchSheetImage(sh).catch(() => undefined)));
  assetEpoch++;
}
function sheetURL(name: string) { return hdAllowed(name) && hdIndex?.sheets[name] ? { url: BASE + 'hd/sprites/' + name + '.webp', s: hdIndex.sheets[name] } : { url: BASE + 'sprites/' + name + '.webp', s: 1 }; }
async function fetchSheetImage(sh: Sheet) {
  const { url, s } = sheetURL(sh.name);
  let img: CanvasImageSource, hs = s;
  try { img = await toBitmap(await loadImage(url)); }
  catch (e) { if (s === 1) throw e; img = await toBitmap(await loadImage(BASE + 'sprites/' + sh.name + '.webp')); hs = 1; } // HD missing → SD fallback
  const old = sh.img;
  sh.sf = hs === 1 ? sh.f : sh.f.map(f => [f[0] * hs, f[1] * hs, f[2] * hs, f[3] * hs, f[4], f[5]] as Frame);
  sh.hs = hs; sh.img = img;
  if (old && old !== img) (old as ImageBitmap).close?.();
  return sh;
}
function mapImagePath(path: string) { return hdOn && hdIndex?.images[path] ? hdIndex.images[path] : path; }
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

export async function initSprites(quality = 0) {
  const [idx, hd] = await Promise.all([fetchJSON('sprites/index.json'), fetchJSON('hd/index.json').catch(() => null)]);
  index = idx; hdIndex = hd;
  // ?q=sd|hd|lite forces a set (tests / comparisons)
  const q = new URLSearchParams(location.search).get('q');
  decide(q === 'sd' ? 1 : q === 'hd' || q === 'lite' ? 2 : quality);
  if (q === 'lite') hdTier = 'lite';
  (window as any).__lfzHD = () => ({ on: hdOn, tier: hdTier, sheets: [...sheets.values()].filter(s => s.hs > 1).length, loaded: sheets.size });
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
  const sh: Sheet = { ...meta, name, img: null, groupStart: gs, sf: meta.f, hs: 1 };
  sheets.set(name, sh);
  // decode off the main thread and keep a GPU-friendly ImageBitmap so the first draw never stalls
  const p = fetchSheetImage(sh);
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
  const i = fi < 0 ? 0 : fi >= sh.f.length ? sh.f.length - 1 : fi;
  const f = sh.f[i], s = sh.sf[i];
  if (!f) return;
  if (alpha !== 1) { const a = ctx.globalAlpha; ctx.globalAlpha = a * alpha; ctx.drawImage(sh.img, s[0], s[1], s[2], s[3], x - f[4] * scale, y - f[5] * scale, f[2] * scale, f[3] * scale); ctx.globalAlpha = a; }
  else ctx.drawImage(sh.img, s[0], s[1], s[2], s[3], x - f[4] * scale, y - f[5] * scale, f[2] * scale, f[3] * scale);
}

/** Draw a frame into a target rect (ignoring hotspot), keeping aspect ratio (contain). */
export function drawFrameFit(ctx: CanvasRenderingContext2D, name: string, fi: number, x: number, y: number, w: number, h: number) {
  const sh = sheet(name);
  if (!sh || !sh.img) return;
  const i = Math.min(fi, sh.f.length - 1); const f = sh.f[i], src = sh.sf[i];
  const s = Math.min(w / f[2], h / f[3]);
  const dw = f[2] * s, dh = f[3] * s;
  ctx.drawImage(sh.img, src[0], src[1], src[2], src[3], x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
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
/** Images (cards / chance art) by their SD path; transparently served from the HD set when active (with SD fallback). */
export function image(path: string): HTMLImageElement | null {
  const c = imgCache.get(path);
  if (c) return c.complete && c.naturalWidth ? c : null;
  const im = new Image(); const hp = mapImagePath(path);
  if (hp !== path) im.onerror = () => { im.onerror = null; im.src = BASE + path; };
  im.src = BASE + hp; imgCache.set(path, im);
  return null;
}
export function preloadImage(path: string) {
  const hp = mapImagePath(path);
  return loadImage(BASE + hp).catch(e => { if (hp === path) throw e; return loadImage(BASE + path); })
    .then(async im => { try { await im.decode(); } catch { /* ignore */ } imgCache.set(path, im); return im; });
}
