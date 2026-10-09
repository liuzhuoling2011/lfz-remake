#!/usr/bin/env python3
"""HD asset pipeline for the 老夫子大富翁 web remake (AI super-resolution, CPU-friendly).

  venv:   python3 -m venv /workspace/hdtools/venv && . /workspace/hdtools/venv/bin/activate
          pip install --index-url https://download.pytorch.org/whl/cpu torch && pip install spandrel pillow numpy
  models: /workspace/hdtools/models/*.pth  (Real-ESRGAN release weights, see tools/HD.md)

  python tools/upscale.py compare            # side-by-side model comparison PNGs → screenshots/hd_compare_*.png
  python tools/upscale.py sprites [--workers 4] [--only map/house3,...]   # resumable, per-sheet
  python tools/upscale.py images             # card / event JPGs (4x → webp)
  python tools/upscale.py index              # write web/public/assets/hd/index.json (scale per sheet + sizes)

Sprites: every frame is cut out of the SD sheet with a transparent margin, its RGB is edge-padded into the
transparent area (so the network never sees the black/colour-key background → no dark halos), RGB and alpha are
upscaled separately (alpha through the same network as a grey image, then a light contrast curve to keep edges crisp
but anti-aliased), the result is fitted back into an HD sheet at exactly (x*S, y*S, w*S, h*S) so hotspots / frame rects
scale by S and placement is unchanged. Network always runs at 4x; 2x outputs are a high-quality 4x→2x downsample.
"""
import os, sys, json, time, glob, argparse, math
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
A = os.path.join(ROOT, 'assets')
SD = os.path.join(ROOT, 'web', 'public', 'assets')
HD = os.path.join(ROOT, 'web', 'public', 'assets', 'hd')
MODELS = os.environ.get('HD_MODELS', '/workspace/hdtools/models')
WORK = os.environ.get('HD_WORK', '/workspace/hdtools/work')
DEFAULT_MODEL = os.environ.get('HD_MODEL', 'realesr-animevideov3')

_models = {}
def load_model(name):
    import torch
    from spandrel import ModelLoader
    if name not in _models:
        m = ModelLoader().load_from_file(os.path.join(MODELS, name + '.pth'))
        m.model.eval()
        _models[name] = m
    return _models[name]

def run_model(name, rgb: np.ndarray, tile=192, pad=12) -> np.ndarray:
    """rgb: HxWx3 uint8 → (4H)x(4W)x3 uint8. Tiled inference with overlap (bounded memory)."""
    import torch
    m = load_model(name); s = m.scale
    h, w, _ = rgb.shape
    x = torch.from_numpy(rgb).permute(2, 0, 1).float().div(255).unsqueeze(0)
    out = torch.zeros(1, 3, h * s, w * s)
    with torch.inference_mode():
        for y0 in range(0, h, tile):
            for x0 in range(0, w, tile):
                y1, x1 = min(h, y0 + tile), min(w, x0 + tile)
                py0, px0, py1, px1 = max(0, y0 - pad), max(0, x0 - pad), min(h, y1 + pad), min(w, x1 + pad)
                inp = x[:, :, py0:py1, px0:px1]
                # reflect-pad tiny inputs so every conv sees a reasonable context
                ph, pw = max(0, 16 - inp.shape[2]), max(0, 16 - inp.shape[3])
                if ph or pw: inp = torch.nn.functional.pad(inp, (0, pw, 0, ph), mode='replicate')
                o = m.model(inp)[:, :, :(py1 - py0) * s, :(px1 - px0) * s]
                out[:, :, y0 * s:y1 * s, x0 * s:x1 * s] = o[:, :, (y0 - py0) * s:(y0 - py0 + y1 - y0) * s, (x0 - px0) * s:(x0 - px0 + x1 - x0) * s]
    return (out.clamp(0, 1).mul(255).round().byte().squeeze(0).permute(1, 2, 0).numpy())

def edge_pad_rgb(rgba: np.ndarray, iters=6) -> np.ndarray:
    """Fill fully transparent pixels with the colour of the nearest opaque neighbours (iterative dilation)."""
    rgb = rgba[:, :, :3].astype(np.float32); a = rgba[:, :, 3] > 0
    if a.all() or not a.any(): return rgba[:, :, :3].copy()
    known = a.copy(); acc = rgb * known[..., None]
    for _ in range(iters):
        s = np.zeros_like(acc); n = np.zeros(known.shape, np.float32)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)):
            s += np.roll(np.roll(acc, dy, 0), dx, 1); n += np.roll(np.roll(known.astype(np.float32), dy, 0), dx, 1)
        new = (~known) & (n > 0)
        acc[new] = s[new] / n[new][:, None]; known |= new
        if known.all(): break
    # remaining far-away background: mean colour (smooth, no edges for the network to sharpen)
    if not known.all(): acc[~known] = rgb[a].mean(0)
    return acc.clip(0, 255).astype(np.uint8)

def resize(arr: np.ndarray, w, h, mode=Image.LANCZOS):
    return np.asarray(Image.fromarray(arr).resize((w, h), mode))

def upscale_rgba(rgba: np.ndarray, out_scale: int, model=DEFAULT_MODEL, alpha_mode='model') -> np.ndarray:
    """HxWx4 → (H*S)x(W*S)x4. Network runs at x4, then area/lanczos down to S (2 or 4)."""
    h, w, _ = rgba.shape
    M = 6  # transparent margin so edges/halos have room
    big = np.zeros((h + 2 * M, w + 2 * M, 4), np.uint8); big[M:M + h, M:M + w] = rgba
    has_alpha = (big[:, :, 3] < 255).any()
    rgb = edge_pad_rgb(big) if has_alpha else big[:, :, :3]
    up = run_model(model, rgb)
    s4 = up.shape[0] // big.shape[0]
    if has_alpha:
        al = big[:, :, 3]
        if (alpha_mode == 'model' and np.unique(al).size > 2) or alpha_mode == 'model-all':
            au = run_model(model, np.repeat(al[:, :, None], 3, 2)).mean(2)
        else:
            au = np.asarray(Image.fromarray(al).resize((big.shape[1] * s4, big.shape[0] * s4), Image.BICUBIC)).astype(np.float32)
            if np.unique(al).size <= 2:  # binary key alpha → crisp anti-aliased edge (smoothstep around 50%)
                t = np.clip((au / 255 - 0.3) / 0.4, 0, 1); au = (t * t * (3 - 2 * t)) * 255
        au = au.clip(0, 255).astype(np.uint8)
        out = np.dstack([up, au])
    else:
        out = np.dstack([up, np.full(up.shape[:2], 255, np.uint8)])
    if out_scale != s4:
        W2, H2 = big.shape[1] * out_scale, big.shape[0] * out_scale
        # premultiply for the downsample so transparent colours never bleed into edges
        f = out.astype(np.float32); a = f[:, :, 3:4] / 255
        pm = np.dstack([f[:, :, :3] * a, f[:, :, 3]])
        pm = np.asarray(Image.fromarray(pm.clip(0, 255).astype(np.uint8), 'RGBA').resize((W2, H2), Image.LANCZOS) if False else
                        np.dstack([resize(np.ascontiguousarray(pm[:, :, c].clip(0, 255).astype(np.uint8)), W2, H2) for c in range(4)]))
        a2 = pm[:, :, 3:4].astype(np.float32) / 255
        rgb2 = np.where(a2 > 0, pm[:, :, :3].astype(np.float32) / np.maximum(a2, 1e-3), 0)
        out = np.dstack([rgb2.clip(0, 255), pm[:, :, 3]]).astype(np.uint8)
        s = out_scale
    else:
        s = s4
    return out[M * s:(M + h) * s, M * s:(M + w) * s]

if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] == 'bench':
    import torch
    torch.set_num_threads(int(os.environ.get('THREADS', '8')))
    im = np.asarray(Image.open(os.path.join(A, 'sprites/map/character/character01_01.png')).convert('RGBA'))[:256, :256]
    for name in sys.argv[2:]:
        t = time.time(); r = run_model(name, im[:, :, :3].copy()); print(name, r.shape, '%.2fs per 256² (%.3f Mpx/s in)' % (time.time() - t, 256 * 256 / 1e6 / (time.time() - t)))

# ------------------------------------------------------------------ compare
CANDIDATES = ['realesr-animevideov3', 'RealESRGAN_x4plus_anime_6B', 'RealESRGAN_x4plus']

def _frame(name, fi):
    j = json.load(open(os.path.join(A, 'sprites', name + '.json'))); f = j['frames'][fi]
    im = Image.open(os.path.join(A, 'sprites', name + '.png')).convert('RGBA')
    return np.asarray(im.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])))

def _checker(w, h, c1=(92, 120, 88), c2=(104, 132, 100), n=16):
    yy, xx = np.mgrid[0:h, 0:w]; m = ((yy // n + xx // n) % 2).astype(bool)
    out = np.zeros((h, w, 3), np.uint8); out[m] = c2; out[~m] = c1; return out

def _over(rgba, bg):
    a = rgba[:, :, 3:4].astype(np.float32) / 255
    return (rgba[:, :, :3] * a + bg * (1 - a)).astype(np.uint8)

def compare(out_dir, disp=2):
    from PIL import ImageDraw, ImageFont
    try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
    except Exception: font = ImageFont.load_default()
    rgba = lambda p: np.asarray(Image.open(p).convert('RGBA'))
    full = rgba(os.path.join(A, 'images/maps/hongkong_full.png'))
    samples = {
        'map': [full[470:660, 760:1060]],
        'characters': [_frame('map/character/character01_01', 0), _frame('map/character/character03_02', 20), _frame('map/character/character05_01', 50)],
        'buildings': [_frame('map/house3', 0), _frame('map/commcal3', 1), _frame('map/a_eating3', 0)],
        'card': [rgba(os.path.join(A, 'images/wordcard/a_003.jpg'))[40:200, 40:200]],
        'ui': [_frame('interface/walk', 0), _frame('interface/game_menu', 12), _frame('interface/card', 0)[0:120, 280:481]],
        'font': [rgba(os.path.join(A, 'fonts/20x20.png'))[0:80, 0:240]],
    }
    cols = ['SD nearest\nx%d' % disp, 'SD bilinear\nx%d (current)' % disp] + [c.replace('RealESRGAN_', 'RealESRGAN\n') + ' (x4→%d)' % disp for c in CANDIDATES]
    timings = {c: 0.0 for c in CANDIDATES}
    for key, ims in samples.items():
        rows = []
        for im in ims:
            h, w = im.shape[:2]; W, H = w * disp, h * disp
            cells = [resize(im, W, H, Image.NEAREST), resize(im, W, H, Image.BILINEAR)]
            for c in CANDIDATES:
                t = time.time(); cells.append(upscale_rgba(im, disp, c)); timings[c] += time.time() - t
            rows.append([_over(x, _checker(W, H)) for x in cells])
        cw = max(230, max(r[0].shape[1] for r in rows)); gap = 8
        tot_h = 44 + sum(r[0].shape[0] + gap for r in rows)
        canvas = Image.new('RGB', (len(cols) * (cw + gap) + gap, tot_h), (30, 30, 34))
        d = ImageDraw.Draw(canvas)
        for i, c in enumerate(cols): d.multiline_text((gap + i * (cw + gap), 4), c, fill=(255, 230, 140), font=font, spacing=2)
        y = 44
        for r in rows:
            for i, cell in enumerate(r): canvas.paste(Image.fromarray(cell), (gap + i * (cw + gap), y))
            y += r[0].shape[0] + gap
        p = os.path.join(out_dir, 'hd_compare_%s.png' % key); canvas.save(p); print('saved', p)
    print('model time (s):', {k: round(v, 1) for k, v in timings.items()})

if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] == 'compare':
    import torch; torch.set_num_threads(8)
    compare(os.path.join(ROOT, 'screenshots'))

# ------------------------------------------------------------------ batch (sprites / images)
MAP_MODEL = 'realesr-animevideov3'        # isometric pixel art: keeps dithering/texture, crisp edges, 4x faster
UI_MODEL = 'RealESRGAN_x4plus_anime_6B'   # comic art + flat UI: cleanest lines, removes JPEG artefacts
def plan(name):
    """(model, out_scale, alpha) per sheet. alpha: 'hard' = exact nearest mask (seamless ground tiles), 'soft' = AA edges."""
    top = name.split('/')[0]
    if top == 'map':
        return MAP_MODEL, 2, ('hard' if name in _ground() else 'soft')
    if top == 'interface':
        return UI_MODEL, 4, 'soft'
    return UI_MODEL, 2, 'soft'   # menu backgrounds, season, dice, winner, misc: full-screen art, 2x is plenty

_G = None
def _ground():
    global _G
    if _G is None:
        _G = set()
        for m in ['hongkong', 'kowloon', 'ancient']:
            d = json.load(open(os.path.join(SD, 'maps', m + '.json')))
            for L in d['layers']:
                if L['flag'] != 1:
                    for o in L['o']: _G.add('map/' + d['sprites'][o[0]])
    return _G

def upscale_frame(fr: np.ndarray, S: int, model: str, alpha: str) -> np.ndarray:
    binary = np.unique(fr[:, :, 3]).size <= 2
    out = upscale_rgba(fr, S, model, alpha_mode='model' if not binary else 'smooth')
    if alpha == 'hard' and binary:  # ground tiles must butt together exactly like the SD tiles do
        out[:, :, 3] = np.asarray(Image.fromarray(fr[:, :, 3]).resize((fr.shape[1] * S, fr.shape[0] * S), Image.NEAREST))
    return out

def do_sheet(name, force=False):
    import hashlib
    src = os.path.join(A, 'sprites', name + '.png'); sj = os.path.join(A, 'sprites', name + '.json')
    dst = os.path.join(HD, 'sprites', name + '.webp')
    model, S, alpha = plan(name)
    if not force and os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
        return name, 'skip', 0.0
    t = time.time()
    j = json.load(open(sj)); im = np.asarray(Image.open(src).convert('RGBA'))
    H, W = im.shape[:2]
    out = np.zeros((H * S, W * S, 4), np.uint8)
    cache = {}
    for f in j['frames']:
        x, y, w, h = f['x'], f['y'], f['w'], f['h']
        if w <= 0 or h <= 0: continue
        fr = np.ascontiguousarray(im[y:y + h, x:x + w])
        if fr[:, :, 3].max() == 0: continue
        key = hashlib.md5(fr.tobytes() + bytes([w & 255, h & 255])).hexdigest()
        if key not in cache: cache[key] = upscale_frame(fr, S, model, alpha)
        out[y * S:(y + h) * S, x * S:(x + w) * S] = cache[key]
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    Image.fromarray(out, 'RGBA').save(dst + '.tmp.webp', 'WEBP', quality=85, alpha_quality=100, method=4)
    os.replace(dst + '.tmp.webp', dst)
    return name, '%s x%d %s' % (model.split('_')[-1], S, alpha), time.time() - t

def _init_worker(threads):
    import torch; torch.set_num_threads(threads)

def _work(args):
    name, force = args
    try: return do_sheet(name, force)
    except Exception as e: return name, 'ERROR %r' % e, 0.0

def sprites(workers=4, only=None, force=False):
    import multiprocessing as mp
    Pool = mp.get_context('spawn').Pool  # never fork a process that already initialised torch/OpenMP (deadlocks)
    names = sorted(json.load(open(os.path.join(SD, 'sprites', 'index.json'))).keys())
    if only: names = [n for n in names if any(n == o or n.startswith(o.rstrip('*')) for o in only)]
    # biggest first → better load balance
    names.sort(key=lambda n: -os.path.getsize(os.path.join(A, 'sprites', n + '.png')))
    t0 = time.time(); done = 0
    log = open(os.path.join(WORK, 'sprites.log'), 'a')
    with Pool(workers, _init_worker, (max(1, 8 // workers),)) as pool:
        for name, st, dt in pool.imap_unordered(_work, [(n, force) for n in names]):
            done += 1
            line = '[%4d/%d %6.0fs] %-40s %s %.1fs' % (done, len(names), time.time() - t0, name, st, dt)
            print(line, flush=True); log.write(line + '\n'); log.flush()
    print('sprites done in %.0fs' % (time.time() - t0))

def images(force=False):
    import torch; torch.set_num_threads(8)
    t0 = time.time()
    for p in sorted(glob.glob(os.path.join(SD, 'images', 'cards', '*.jpg'))):
        dst = os.path.join(HD, 'images', 'cards', os.path.basename(p)[:-4] + '.webp')
        if not force and os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(p): continue
        rgb = np.asarray(Image.open(p).convert('RGB'))
        up = run_model(UI_MODEL, rgb)  # 4x
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        Image.fromarray(up).save(dst, 'WEBP', quality=85, method=4)
        print('card', os.path.basename(p), rgb.shape[:2], '->', up.shape[:2], flush=True)
    print('images done in %.0fs' % (time.time() - t0))

def write_index():
    """hd/index.json: {sheets: {name: scale}, images: [...], bytes}. The renderer only uses HD files listed here."""
    idx = {'sheets': {}, 'images': {}, 'bytes': 0}
    sd = json.load(open(os.path.join(SD, 'sprites', 'index.json')))
    for name in sd:
        p = os.path.join(HD, 'sprites', name + '.webp')
        if not os.path.exists(p): continue
        w_sd = Image.open(os.path.join(SD, 'sprites', name + '.webp')).size[0]; w_hd = Image.open(p).size[0]
        idx['sheets'][name] = round(w_hd / w_sd); idx['bytes'] += os.path.getsize(p)
    for p in glob.glob(os.path.join(HD, 'images', 'cards', '*.webp')):
        idx['images']['images/cards/' + os.path.basename(p)[:-5] + '.jpg'] = 'hd/images/cards/' + os.path.basename(p); idx['bytes'] += os.path.getsize(p)
    for p in glob.glob(os.path.join(HD, 'ground', '**', '*.webp'), recursive=True): idx['bytes'] += os.path.getsize(p)
    idx['ground'] = sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(HD, 'ground', '*.json')))
    json.dump(idx, open(os.path.join(HD, 'index.json'), 'w'), separators=(',', ':'))
    print('hd index: %d sheets, %d images, %.1f MB' % (len(idx['sheets']), len(idx['images']), idx['bytes'] / 1e6))

if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] in ('sprites', 'images', 'index', 'all'):
    ap = argparse.ArgumentParser(); ap.add_argument('cmd'); ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--only', default=''); ap.add_argument('--force', action='store_true')
    a = ap.parse_args(); os.makedirs(WORK, exist_ok=True)
    if a.cmd in ('images', 'all'): images(a.force)
    if a.cmd == 'all': ground(a.force)
    if a.cmd in ('sprites', 'all'): sprites(a.workers, [x for x in a.only.split(',') if x] or None, a.force)
    if a.cmd in ('index', 'all'): write_index()

# ------------------------------------------------------------------ ground (map background in context)
# Per-tile upscaling leaves faint seams where ground tiles meet (each tile is upscaled without its neighbours).
# So the *static ground layer* of every map is composited at SD exactly like the renderer bakes it, upscaled as one
# image (tiled inference with overlap → seamless), and cut into chunk tiles that the renderer uses as the base of its
# 2x chunk cache. Discrete objects (trees, buildings, characters) keep the per-sprite HD sheets.
# Must mirror web/src/game/view.ts (ANIM / LIVE_GROUND / SEASONAL, CHUNK).
ANIM = {'sea', 'smallsea', 'bigsea01', 'bigsea02', 'big_sea', 'sea2', 'sea_side1', 'sea_side2', 'sea_side3', 'sea_bird', 'dolphin', 'fishman', 'stone1', 'stone2',
        'smallship', 'hk_ship', 'kln_ship', 'oldship', 'ufo', 'taiping_hill', 'hill4', 'pier', 'sea_fllower_0102', 'chance', 'money_add', 'money_des', 'big_hill'}
SEASONAL = {'tree_change1', 'tree_change2'}
LIVE_GROUND = {'big_sea', 'icon'}
CHUNK = 512

def ground(force=False):
    import torch; torch.set_num_threads(8)
    sd_index = json.load(open(os.path.join(SD, 'sprites', 'index.json')))
    sheets = {}
    def sh(name):
        if name not in sheets: sheets[name] = Image.open(os.path.join(A, 'sprites', name + '.png')).convert('RGBA')
        return sheets[name]
    for m in ['hongkong', 'kowloon', 'ancient']:
        man_p = os.path.join(HD, 'ground', m + '.json')
        if not force and os.path.exists(man_p): print('skip', m); continue
        t0 = time.time()
        d = json.load(open(os.path.join(SD, 'maps', m + '.json')))
        items = []
        for L in d['layers']:
            if L['flag'] == 1 or L['name'] in LIVE_GROUND: continue
            for s, f, x, y, a in L['o']:
                nm = d['sprites'][s]
                if nm in ANIM or nm in SEASONAL: continue
                meta = sd_index.get('map/' + nm)
                if not meta: continue
                fr = meta['f'][min(f, len(meta['f']) - 1)]
                items.append((nm, fr, x - fr[4], y - fr[5]))
        x0 = min(i[2] for i in items); y0 = min(i[3] for i in items)
        x1 = max(i[2] + i[1][2] for i in items); y1 = max(i[3] + i[1][3] for i in items)
        cx0, cy0 = x0 // CHUNK, y0 // CHUNK; cx1, cy1 = (x1 - 1) // CHUNK, (y1 - 1) // CHUNK
        ox, oy = cx0 * CHUNK, cy0 * CHUNK
        W, H = (cx1 - cx0 + 1) * CHUNK, (cy1 - cy0 + 1) * CHUNK
        comp = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for nm, fr, px, py in items:
            comp.alpha_composite(sh('map/' + nm).crop((fr[0], fr[1], fr[0] + fr[2], fr[1] + fr[3])), (px - ox, py - oy))
        rgba = np.asarray(comp)
        up = upscale_rgba(rgba, 2, MAP_MODEL)          # whole layer in context (tiled with overlap inside run_model)
        # coastline / map edge: binary alpha → exact 2x nearest (matches SD footprint; the sea anim lives underneath)
        up[:, :, 3] = np.asarray(Image.fromarray(rgba[:, :, 3]).resize((W * 2, H * 2), Image.NEAREST))
        out_dir = os.path.join(HD, 'ground', m); os.makedirs(out_dir, exist_ok=True)
        keys = []
        for cy in range(cy0, cy1 + 1):
            for cx in range(cx0, cx1 + 1):
                tile = up[(cy - cy0) * CHUNK * 2:(cy - cy0 + 1) * CHUNK * 2, (cx - cx0) * CHUNK * 2:(cx - cx0 + 1) * CHUNK * 2]
                if tile[:, :, 3].max() == 0: continue
                Image.fromarray(np.ascontiguousarray(tile), 'RGBA').save(os.path.join(out_dir, '%d_%d.webp' % (cx, cy)), 'WEBP', quality=85, alpha_quality=100, method=4)
                keys.append('%d_%d' % (cx, cy))
        json.dump({'chunk': CHUNK, 'scale': 2, 'tiles': keys, 'skip': ['map/' + n for n in {i[0] for i in items}]}, open(man_p, 'w'), separators=(',', ':'))
        print('ground %s: %dx%d SD → %d chunks, %.0fs' % (m, W, H, len(keys), time.time() - t0), flush=True)

if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] == 'ground':
    ground('--force' in sys.argv)
