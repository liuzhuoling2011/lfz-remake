#!/usr/bin/env python3
"""Convert extracted raw assets (../raw) to web formats (../assets).
Requires: numpy, Pillow, ffmpeg (libvorbis, libx264, libvpx-vp9).
Usage: convert.py [--only spr,audio,text,maps,fonts,video,jpg]
"""
import os, sys, json, struct, shutil, subprocess, re, glob, argparse
from concurrent.futures import ProcessPoolExecutor
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import spr, mab, fnt

ROOT = os.path.abspath(os.path.join(HERE, '..'))
RAW = os.path.join(ROOT, 'raw'); OUT = os.path.join(ROOT, 'assets')
SRC = '/workspace/lfzdfw-analysis/extract'

def rel(p): return os.path.relpath(p, OUT).replace(os.sep, '/')
def ensure(p): os.makedirs(os.path.dirname(p), exist_ok=True); return p

# ---------------------------------------------------------------- sprites
def pack(sizes, maxw):
    """simple shelf packer; returns positions and sheet size"""
    x = y = rowh = 0; W = 0; pos = []
    for w, h in sizes:
        if x and x + w > maxw: x = 0; y += rowh + 1; rowh = 0
        pos.append((x, y)); x += w + 1; rowh = max(rowh, h); W = max(W, x)
    return pos, max(W - 1, 1), max(y + rowh, 1)

def spr_meta_v2(extra):
    if len(extra) < 48: return None
    name = extra[:32].split(b'\0')[0].decode('big5hkscs', 'replace')
    n = (len(extra) - 32) // 4
    ints = struct.unpack_from('<%di' % n, extra, 32)
    tw, th, ng, param = ints[:4]
    fpg = list(ints[4:4 + ng])
    return dict(name_zh=name, tiles_w=tw, tiles_h=th, groups=ng, anim_param=param, frames_per_group=fpg)

def convert_spr(path):
    d = open(path, 'rb').read(); s = spr.parse(d)
    r = os.path.relpath(path, os.path.join(RAW, 'omasterq', 'dat'))
    base = os.path.join(OUT, 'sprites', os.path.splitext(r)[0])
    imgs = [spr.decode_frame(d, fr) for fr in s['frames']]
    sizes = [(max(fr['w'], 1), max(fr['h'], 1)) for fr in s['frames']]
    total = sum(w * h for w, h in sizes)
    maxw = max(2048, max(w for w, _ in sizes)) if total > 2048 * 1024 else max(1024, max(w for w, _ in sizes))
    pos, W, H = pack(sizes, maxw)
    sheet = np.zeros((H, W, 4), np.uint8)
    for (x, y), im in zip(pos, imgs):
        sheet[y:y + im.shape[0], x:x + im.shape[1]] = im
    Image.fromarray(sheet, 'RGBA').save(ensure(base + '.png'), compress_level=6)
    meta = dict(source='omasterq.dat:DAT/' + r.upper().replace('/', '\\'), image=rel(base + '.png'),
                sheet_w=W, sheet_h=H, version=s['version'], frame_count=s['n'],
                frames=[dict(x=x, y=y, w=fr['w'], h=fr['h'], hx=fr['hx'], hy=fr['hy'])
                        for (x, y), fr in zip(pos, s['frames'])])
    m2 = spr_meta_v2(s['extra']) if s['version'] == 2 else None
    if m2: meta['meta'] = m2
    json.dump(meta, open(base + '.json', 'w'), ensure_ascii=False)
    # first frame thumbnail for contact sheets
    fi = max(range(len(imgs)), key=lambda i: 0) if imgs else 0
    return dict(type='sprite', path=rel(base + '.png'), json=rel(base + '.json'), source=meta['source'],
                frames=s['n'], sheet=[W, H], frame0=[sizes[0][0], sizes[0][1]],
                max_frame=[max(w for w, _ in sizes), max(h for _, h in sizes)],
                name_zh=(m2 or {}).get('name_zh'), meta=m2)

# ---------------------------------------------------------------- audio
def ffmpeg(args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y'] + args, check=True)

def probe_dur(p):
    try:
        o = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p],
                           capture_output=True, text=True).stdout.strip()
        return round(float(o), 3)
    except Exception: return None

def convert_audio(args):
    src, dst = args
    ensure(dst)
    if src.lower().endswith('.wav'):
        ffmpeg(['-i', src, '-c:a', 'libvorbis', '-q:a', '5', dst])
    else:
        shutil.copyfile(src, dst)
    return dst, probe_dur(dst)

# ---------------------------------------------------------------- text
def parse_ini(text):
    """game INI-ish text: [section] then 'key = value' or 'N.value' lines"""
    out = {}; cur = None
    for line in text.splitlines():
        line = line.rstrip()
        if not line.strip(): continue
        m = re.match(r'^\[(.+)\]$', line.strip())
        if m: cur = m.group(1); out[cur] = {}; continue
        if cur is None: continue
        m = re.match(r'^([^=]+?)\s*=\s*(.*)$', line)
        if m and not re.match(r'^[\w\-]+\.', line): out[cur][m.group(1).strip()] = m.group(2).strip(); continue
        m = re.match(r'^([\w\-]+)\.(.*)$', line)
        if m: out[cur][m.group(1)] = m.group(2).strip(); continue
        out[cur].setdefault('_lines', []).append(line)
    return out

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--only', default='')
    a = ap.parse_args(); only = set(filter(None, a.only.split(',')))
    want = lambda k: not only or k in only
    os.makedirs(OUT, exist_ok=True)
    manifest_path = os.path.join(OUT, '_parts'); os.makedirs(manifest_path, exist_ok=True)
    jobs = os.cpu_count() or 4

    if want('spr'):
        files = sorted(glob.glob(os.path.join(RAW, 'omasterq', 'dat', '**', '*.spr'), recursive=True))
        with ProcessPoolExecutor(jobs) as ex: res = list(ex.map(convert_spr, files, chunksize=2))
        json.dump(res, open(os.path.join(manifest_path, 'spr.json'), 'w'), ensure_ascii=False)
        print('sprites', len(res), sum(r['frames'] for r in res), flush=True)

    if want('audio'):
        items = []
        for p in sorted(glob.glob(os.path.join(RAW, '**', '*.wav'), recursive=True) +
                        glob.glob(os.path.join(RAW, '**', '*.mp3'), recursive=True)):
            r = os.path.relpath(p, RAW)
            if r.startswith('omasterq/dat/'): dst = os.path.join(OUT, 'audio', 'sfx', r[len('omasterq/dat/'):])
            elif r.startswith('voice/'): dst = os.path.join(OUT, 'audio', 'voice', os.path.basename(r))
            elif r.startswith('music/'): dst = os.path.join(OUT, 'audio', 'music', os.path.basename(r))
            else: dst = os.path.join(OUT, 'audio', 'misc', r)
            if dst.endswith('.wav'): dst = dst[:-4] + ('_wav.ogg' if r.startswith('voice/') else '.ogg')
            items.append((p, dst))
        with ProcessPoolExecutor(jobs) as ex: res = list(ex.map(convert_audio, items))
        out = [dict(type='audio', path=rel(dst), source=os.path.relpath(src, RAW), duration=dur)
               for (src, _), (dst, dur) in zip(items, res)]
        json.dump(out, open(os.path.join(manifest_path, 'audio.json'), 'w'), ensure_ascii=False)
        print('audio', len(out), flush=True)

    if want('jpg'):
        out = []
        for p in sorted(glob.glob(os.path.join(RAW, 'omasterq', 'dat', 'wordcard', '*.jpg'))):
            dst = os.path.join(OUT, 'images', 'wordcard', os.path.basename(p)); shutil.copyfile(p, ensure(dst))
            w, h = Image.open(dst).size
            out.append(dict(type='image', path=rel(dst), source='omasterq.dat:DAT/WORDCARD/' + os.path.basename(p).upper(), size=[w, h]))
        json.dump(out, open(os.path.join(manifest_path, 'jpg.json'), 'w'), ensure_ascii=False)
        print('jpg', len(out), flush=True)

    if want('text'):
        out = []
        for p in sorted(glob.glob(os.path.join(RAW, 'omasterq', 'dat', '**', '*.txt'), recursive=True)):
            r = os.path.relpath(p, os.path.join(RAW, 'omasterq', 'dat'))
            t = open(p, 'rb').read().decode('big5hkscs', 'replace').replace('\r\n', '\n')
            base = os.path.join(OUT, 'data', 'text', os.path.splitext(r)[0])
            open(ensure(base + '.txt'), 'w', encoding='utf-8').write(t)
            json.dump(parse_ini(t), open(base + '.json', 'w'), ensure_ascii=False, indent=1)
            out.append(dict(type='text', path=rel(base + '.json'), utf8=rel(base + '.txt'), source='omasterq.dat:DAT/' + r.upper()))
        json.dump(out, open(os.path.join(manifest_path, 'text.json'), 'w'), ensure_ascii=False)
        print('text', len(out), flush=True)

    if want('maps'):
        out = convert_maps()
        json.dump(out, open(os.path.join(manifest_path, 'maps.json'), 'w'), ensure_ascii=False)
        print('maps', len(out), flush=True)

    if want('fonts'):
        out = []
        for p in sorted(glob.glob(os.path.join(RAW, 'omasterq', 'dat', '**', '*.fnt'), recursive=True)):
            out.append(convert_font(p))
        json.dump(out, open(os.path.join(manifest_path, 'fonts.json'), 'w'), ensure_ascii=False)
        print('fonts', len(out), flush=True)

    if want('video'):
        out = []
        for n in ('logo640', 'logo800', 'logo1024'):
            src = os.path.join(SRC, n + '.avi')
            mp4 = ensure(os.path.join(OUT, 'video', n + '.mp4')); webm = os.path.join(OUT, 'video', n + '.webm')
            ffmpeg(['-i', src, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', mp4])
            ffmpeg(['-i', src, '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus', '-b:a', '96k', webm])
            out += [dict(type='video', path=rel(mp4), source=n + '.avi', duration=probe_dur(mp4)),
                    dict(type='video', path=rel(webm), source=n + '.avi', duration=probe_dur(webm))]
        json.dump(out, open(os.path.join(manifest_path, 'video.json'), 'w'), ensure_ascii=False)
        print('video', len(out), flush=True)

# ---------------------------------------------------------------- fonts
def convert_font(p):
    d = open(p, 'rb').read(); f = fnt.parse(d)
    r = os.path.relpath(p, os.path.join(RAW, 'omasterq', 'dat'))
    base = os.path.join(OUT, 'fonts', os.path.splitext(r)[0])
    cw, ch = f['cell_w'], f['cell_h']
    aw = max([g.shape[1] for g in f['ascii'].values()] + [1]); ah = max([g.shape[0] for g in f['ascii'].values()] + [1])
    cols = 157 if f['cjk'] else 16
    cellw = max(cw, aw); cellh = max(ch, ah)
    # rows: 6 rows of ascii (16/row) placed at top, then 89 CJK rows
    arows = 6; crows = 89 if f['cjk'] else 0
    W = cols * cellw; H = (arows + crows) * cellh
    alpha = np.zeros((H, W), np.uint8); glyphs = {}
    for c, g in f['ascii'].items():
        i = c - 0x20; x = (i % 16) * cellw; y = (i // 16) * cellh
        alpha[y:y + g.shape[0], x:x + g.shape[1]] = g * 255
        glyphs[chr(c)] = [x, y, int(g.shape[1]), int(g.shape[0])]
    nbad = 0
    for (lead, trail), g in f['cjk'].items():
        k = (lead - 0xA1) * 157 + fnt.TRAILS.index(trail)
        x = (k % 157) * cellw; y = (arows + k // 157) * cellh
        alpha[y:y + ch, x:x + cw] = g * 255
        try: u = bytes([lead, trail]).decode('big5hkscs')
        except UnicodeDecodeError: u = None; nbad += 1
        key = u if u and len(u) == 1 else 'big5:%02X%02X' % (lead, trail)
        glyphs.setdefault(key, [x, y, cw, ch])
    rgba = np.zeros((H, W, 4), np.uint8); rgba[..., :3] = 255; rgba[..., 3] = alpha
    Image.fromarray(rgba, 'RGBA').save(ensure(base + '.png'), optimize=True)
    json.dump(dict(source='omasterq.dat:DAT/' + r.upper(), image=rel(base + '.png'), cell_w=cw, cell_h=ch,
                   supersample=2, note='glyphs are 2x supersampled 1bpp; draw at 50% scale for the original look',
                   glyphs=glyphs), open(base + '.json', 'w'), ensure_ascii=False)
    return dict(type='font', path=rel(base + '.png'), json=rel(base + '.json'), source='omasterq.dat:DAT/' + r.upper(),
                cell=[cw, ch], ascii=len(f['ascii']), cjk=len(f['cjk']), sheet=[W, H])

# ---------------------------------------------------------------- maps
def convert_maps():
    sprdir = os.path.join(RAW, 'omasterq', 'dat', 'map')
    cache = {}
    def load(name):
        k = name.lower()
        if k in cache: return cache[k]
        p = os.path.join(sprdir, k + '.spr')
        if not os.path.exists(p): cache[k] = None; return None
        d = open(p, 'rb').read(); s = spr.parse(d)
        cache[k] = (d, s, spr_meta_v2(s['extra']) if s['version'] == 2 else None, {}); return cache[k]
    out = []
    for p in sorted(glob.glob(os.path.join(sprdir, '*.mab'))):
        m = mab.parse(open(p, 'rb').read()); mname = os.path.splitext(os.path.basename(p))[0]
        # label -> sprite file (restricted to this map's sprite table)
        bylabel = {}
        for e in m['sprites']:
            L = load(e['name'])
            if L and L[2]: bylabel.setdefault(L[2]['name_zh'], e['name'].lower())
            bylabel.setdefault(e['name'], e['name'].lower()); bylabel.setdefault(e['name'].lower(), e['name'].lower())
        unresolved = set()
        for L in m['layers']:
            for o in L['objects']:
                o['sprite'] = bylabel.get(o['label']) if L['flag'] != 2 else None
                if L['flag'] != 2 and not o['sprite']: unresolved.add(o['label'])
                if o['sprite']:
                    meta = load(o['sprite'])[2]
                    if meta and meta['groups'] > 1: o['frame'] = sum(meta['frames_per_group'][:o['a']]) + o['b']
                    else: o['frame'] = o['b']
        # board lots from label layer: "N(price)"
        lots = []
        for L in m['layers']:
            if L['flag'] == 2:
                for o in L['objects']:
                    mm = re.match(r'^(c?)(\d+)([a-z]?)\((\d+)\)$', o['label'])
                    lots.append(dict(label=o['label'], x=o['x'], y=o['y'],
                                     kind=('special' if mm and mm.group(1) else 'lot') if mm else 'marker',
                                     id=(mm.group(2) + mm.group(3)) if mm else o['label'], value=int(mm.group(4)) if mm else None))
        dj = dict(source='omasterq.dat:DAT/MAP/' + os.path.basename(p).upper(), width=m['width'], height=m['height'],
                  tile_w=m['tile_w'], tile_h=m['tile_h'], sprites=m['sprites'],
                  layers=[dict(name=L['name'], flag=L['flag'], objects=L['objects']) for L in m['layers']],
                  labels=lots, unresolved_labels=sorted(unresolved),
                  notes='object (x,y) are world pixel coords of the sprite hotspot; a=direction/group (0-3), b=frame within group; '
                        'layer flag 0=ground (draw in file order), 1=objects (y-sort), 2=editor labels "lot(price)" / "cN(value)" special squares')
        for L in m['layers']:
            for o in L['objects']: o['gx'] = round(o['x'] / 40); o['gy'] = round(o['y'] / 20)
        for lt in lots: lt['gx'] = round(lt['x'] / 40); lt['gy'] = round(lt['y'] / 20)
        build_board(mname, m, lots)
        jp = ensure(os.path.join(OUT, 'data', 'maps', mname + '.json'))
        json.dump(dj, open(jp, 'w'), ensure_ascii=False, indent=0)
        # render preview
        objs = []
        for li, L in enumerate(m['layers']):
            if L['flag'] == 2: continue
            for o in L['objects']:
                if o.get('sprite'): objs.append((li, L['flag'], o))
        minx = miny = 10 ** 9; maxx = maxy = -10 ** 9; draws = []
        for li, flag, o in objs:
            d, s, meta, fc = load(o['sprite'])
            fi = min(o['frame'], s['n'] - 1); fr = s['frames'][fi]
            x0 = o['x'] - fr['hx']; y0 = o['y'] - fr['hy']
            minx = min(minx, x0); miny = min(miny, y0); maxx = max(maxx, x0 + fr['w']); maxy = max(maxy, y0 + fr['h'])
            draws.append(((li if flag == 0 else 1000), (o['y'] if flag == 1 else 0), o['sprite'], fi, x0, y0))
        draws.sort(key=lambda t: (t[0], t[1]))
        Wd, Hd = maxx - minx, maxy - miny
        canvas = Image.new('RGBA', (Wd, Hd), (20, 30, 60, 255))
        for _, _, sp, fi, x0, y0 in draws:
            d, s, meta, fc = load(sp)
            if fi not in fc: fc[fi] = Image.fromarray(spr.decode_frame(d, s['frames'][fi]), 'RGBA')
            canvas.alpha_composite(fc[fi], (x0 - minx, y0 - miny))
        from PIL import ImageDraw
        dr = ImageDraw.Draw(canvas)
        for lt in lots:
            if lt['kind'] != 'other':
                dr.text((lt['x'] - minx - 10, lt['y'] - miny - 6), lt['label'], fill=(255, 255, 0, 255))
        full = ensure(os.path.join(OUT, 'images', 'maps', mname + '_full.png'))
        canvas.convert('RGB').save(full, optimize=False)
        prev = os.path.join(OUT, 'images', 'maps', mname + '_preview.jpg')
        sc = 2048 / max(Wd, Hd); canvas.convert('RGB').resize((int(Wd * sc), int(Hd * sc)), Image.LANCZOS).save(prev, quality=88)
        out.append(dict(type='map', path=rel(jp), render=rel(full), preview=rel(prev), origin=[minx, miny],
                        size_tiles=[m['width'], m['height']], render_px=[Wd, Hd], objects=sum(len(L['objects']) for L in m['layers']),
                        lots=sum(1 for l in lots if l['kind'] == 'lot'), specials=sum(1 for l in lots if l['kind'] == 'special'),
                        unresolved=sorted(unresolved), source=dj['source'], board=rel(os.path.join(OUT, 'data', 'boards', mname + '.json'))))
    return out

ICON_EVENT = {'機會': 'chance', '減錢': 'lose_money', '加錢': 'gain_money', 'walcome_icon': 'welcome/start?', '小遊戲': 'minigame',
              '馬會icon': 'jockey_club_lottery', 'icon_電車': 'tram_transport', 'icon_船': 'ferry_transport', 'icon_馬車': 'horse_cart_transport',
              '打小人icon': 'villain_hitting(打小人)'}

def build_board(mname, m, lots):
    """Derived (best-guess) board graph. Lattice coords: gx=x/40, gy=y/20 (staggered iso, neighbours at (+-1,+-1))."""
    lay = {L['name'].lower(): L for L in m['layers']}
    walk = {}
    for o in lay.get('walking', {'objects': []})['objects']: walk[(o['gx'], o['gy'])] = dict(gx=o['gx'], gy=o['gy'], x=o['x'], y=o['y'], tile=o['label'])
    for o in lay.get('icon', {'objects': []})['objects']:
        k = (o['gx'], o['gy'])
        walk.setdefault(k, dict(gx=o['gx'], gy=o['gy'], x=o['x'], y=o['y'], tile=None))
        walk[k]['event'] = ICON_EVENT.get(o['label'], o['label'])
    for k, t in walk.items():
        t['neighbours'] = [[k[0] + dx, k[1] + dy] for dx in (-1, 1) for dy in (-1, 1) if (k[0] + dx, k[1] + dy) in walk]
    plots = []
    for o in lay.get('sale_buy', {'objects': []})['objects']:
        best = min((l for l in lots if l['kind'] == 'lot'), key=lambda l: (l['x'] - o['x']) ** 2 + (l['y'] - o['y']) ** 2, default=None)
        dist = ((best['x'] - o['x']) ** 2 + (best['y'] - o['y']) ** 2) ** .5 if best else None
        adj = [[o['gx'] + dx, o['gy'] + dy] for dx in (-1, 1) for dy in (-1, 1) if (o['gx'] + dx, o['gy'] + dy) in walk]
        plots.append(dict(gx=o['gx'], gy=o['gy'], x=o['x'], y=o['y'], lot_id=best['id'] if best and dist < 60 else None,
                          price=best['value'] if best and dist < 60 else None, label_dist=round(dist, 1) if dist is not None else None,
                          adjacent_walk=adj))
    specials = [l for l in lots if l['kind'] in ('special', 'marker')]
    json.dump(dict(map=mname, note='DERIVED best-guess board graph from MAB layers walking/icon/sale_buy/label. lot price = label "N(price)" '
                   'nearest to the 空地 plot; cN(value) = special building N (see maindata [SpBuilding] cN), markers po/ho/lo/te/of = police/hospital/lock shop/temple/office(?)',
                   walk_tiles=sorted(walk.values(), key=lambda t: (t['gy'], t['gx'])), plots=plots, specials=specials,
                   counts=dict(walk=len(walk), events=sum(1 for t in walk.values() if 'event' in t), plots=len(plots),
                               plots_with_price=sum(1 for p in plots if p['price'] is not None))),
              open(ensure(os.path.join(OUT, 'data', 'boards', mname + '.json')), 'w'), ensure_ascii=False, indent=0)

if __name__ == '__main__':
    main()
