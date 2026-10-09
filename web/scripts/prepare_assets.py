#!/usr/bin/env python3
"""Copy/convert the subset of extracted assets the web remake needs into web/public/assets.
- sprite sheets -> lossless WebP + slim JSON (frames as arrays [x,y,w,h,hx,hy])
- maps -> slim JSON (sprite table + ground/object layers)
- audio: music mp3, sfx ogg->also mp3 (Safari), voice mp3 only (drop *_wav.ogg PCM twins)
"""
import json, os, shutil, subprocess, sys, glob
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
A = os.path.join(ROOT, 'assets')
SPEC = os.path.join(ROOT, 'spec', 'data')
OUT = os.path.join(ROOT, 'web', 'public', 'assets')
FORCE = '--force' in sys.argv

def ensure(p):
    os.makedirs(os.path.dirname(p), exist_ok=True); return p

def fresh(src, dst):
    return FORCE or not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src)

sprites = set()
UI_DIRS = ['logo', 'mainmenu', 'selectyear', 'selectmap', 'selectactor', 'option', 'interface', 'interface/option',
           'winner', 'season', 'misc', 'dice', 'selectminigame', 'minigame', 'minigame/01', 'minigame/02', 'minigame/03', 'minigame/04',
           'minigame/turn', 'minigame/result', 'minigame/result2']
for d in UI_DIRS:
    for p in glob.glob(os.path.join(A, 'sprites', d, '*.json')):
        sprites.add(os.path.relpath(p, os.path.join(A, 'sprites'))[:-5])
maps = {}
for m in ['hongkong', 'kowloon', 'ancient']:
    d = json.load(open(os.path.join(A, 'data', 'maps', m + '.json')))
    maps[m] = d
    for L in d['layers']:
        for o in L['objects']:
            if o.get('sprite'): sprites.add('map/' + o['sprite'])
EXTRA = ['house', 'commcal', 'eating', 'home1', 'home2', 'home3', 'house1', 'house2', 'house3', 'commcal1', 'commcal2', 'commcal3',
         'eating1', 'eating2', 'eating3', 'a_house1', 'a_house2', 'a_house3', 'a_commcal1', 'a_commcal2', 'a_commcal3',
         'a_eating1', 'a_eating2', 'a_eating3', 'a_home1', 'a_home2', 'a_home3', 'buildhouse1', 'buildhouse2', 'buildhouse3',
         'a_buildhouse1', 'a_buildhouse2', 'a_buildhouse3', 'downhouse', 'a_downhouse', 'getmoney', 'a_getmoney', 'lostmoney',
         'cardhit', 'usecard', 'shadow', 'money', 'a_money', 'havemoney', 'nomoney', 'godin', 'godout',
         'god01_01', 'god02_01', 'god03_01', 'god04_01', 'land_bs', 'lockshop']
EXTRA += ['playermark0%d' % i for i in range(1, 5)] + ['playermark0%d_2' % i for i in range(1, 5)]
for c in range(1, 7):
    for k in ['01', '02', '03', '04', '05']:
        EXTRA.append('character/character%02d_%s' % (c, k))
EXTRA += ['character/character07_02', 'character/character08_02', 'character/character10_01', 'character/character10_02',
          'character/character12_02', 'character/character13_02']
for e in EXTRA: sprites.add('map/' + e)

index = {}
def do_sprite(name):
    sj = os.path.join(A, 'sprites', name + '.json'); sp = os.path.join(A, 'sprites', name + '.png')
    if not os.path.exists(sj): return name, None
    j = json.load(open(sj))
    dst = os.path.join(OUT, 'sprites', name + '.webp')
    if fresh(sp, dst):
        im = Image.open(sp).convert('RGBA')
        im.save(ensure(dst), 'WEBP', lossless=True, quality=100, method=4)
    meta = j.get('meta') or {}
    ent = dict(f=[[f['x'], f['y'], f['w'], f['h'], f['hx'], f['hy']] for f in j['frames']])
    if meta:
        ent['g'] = meta.get('frames_per_group'); ent['tw'] = meta.get('tiles_w'); ent['th'] = meta.get('tiles_h')
        ent['n'] = meta.get('name_zh'); ent['a'] = meta.get('anim_param')
    return name, ent

with ThreadPoolExecutor(8) as ex:
    for name, ent in ex.map(do_sprite, sorted(sprites)):
        if ent: index[name] = ent
        else: print('missing sprite', name)
json.dump(index, open(ensure(os.path.join(OUT, 'sprites', 'index.json')), 'w'), ensure_ascii=False, separators=(',', ':'))
print('sprites', len(index))

# maps
for m, d in maps.items():
    names = []; nidx = {}
    layers = []
    for L in d['layers']:
        if L['flag'] == 2: continue
        objs = []
        for o in L['objects']:
            s = o.get('sprite')
            if not s: continue
            if s not in nidx: nidx[s] = len(names); names.append(s)
            objs.append([nidx[s], o.get('frame', 0), o['x'], o['y'], o.get('a', 0)])
        layers.append(dict(name=L['name'], flag=L['flag'], o=objs))
    out = dict(key=m, width=d['width'], height=d['height'], sprites=names, layers=layers)
    json.dump(out, open(ensure(os.path.join(OUT, 'maps', m + '.json')), 'w'), ensure_ascii=False, separators=(',', ':'))
    # board (spec, ordered tiles + landmarks)
    idx = {'hongkong': 0, 'kowloon': 1, 'ancient': 2}[m]
    # board adapter primary source: spec map_<key>.json (verified aligned); assets/data/boards kept as legacy fallback
    shutil.copy(os.path.join(A, 'data', 'boards', m + '.json'), ensure(os.path.join(OUT, 'maps', m + '_board.json')))
    if os.path.exists(os.path.join(SPEC, 'map_%s.json' % m)):
        shutil.copy(os.path.join(SPEC, 'map_%s.json' % m), ensure(os.path.join(OUT, 'maps', m + '_spec.json')))
    # preview thumbnail for select-map screen
    prev = os.path.join(A, 'images', 'maps', m + '_preview.jpg')
    dst = os.path.join(OUT, 'images', m + '_preview.jpg')
    if fresh(prev, dst):
        im = Image.open(prev); im.thumbnail((1024, 1024)); im.save(ensure(dst), quality=85)

# data
for f in ['rules_core.json', 'chance_effects.json', 'word_card_effects.json', 'characters.json', 'economy.json', 'audio.json',
          'sp_buildings.json', 'maps.json', 'ai_rules.json']:
    if os.path.exists(os.path.join(SPEC, f)):
        shutil.copy(os.path.join(SPEC, f), ensure(os.path.join(OUT, 'data', f)))
shutil.copy(os.path.join(A, 'data', 'text', 'exttext', 'maindata.json'), ensure(os.path.join(OUT, 'data', 'maindata.json')))

# bitmap fonts used by the mini-games (2x supersampled glyph sheet)
for f in ['minigame/01/number']:
    for ext in ['.png', '.json']:
        src = os.path.join(A, 'fonts', f + ext); dst = os.path.join(OUT, 'fonts', f + ext)
        if fresh(src, dst): shutil.copy(src, ensure(dst))

# images (cards)
for p in glob.glob(os.path.join(A, 'images', 'wordcard', '*.jpg')):
    dst = os.path.join(OUT, 'images', 'cards', os.path.basename(p))
    if fresh(p, dst): shutil.copy(p, ensure(dst))

# audio
def conv_sfx(p):
    rel = os.path.relpath(p, os.path.join(A, 'audio', 'sfx'))
    dst = os.path.join(OUT, 'audio', 'sfx', rel[:-4] + '.mp3')
    if fresh(p, dst):
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', p, '-codec:a', 'libmp3lame', '-q:a', '4', ensure(dst)], check=True)
with ThreadPoolExecutor(8) as ex:
    list(ex.map(conv_sfx, glob.glob(os.path.join(A, 'audio', 'sfx', '**', '*.ogg'), recursive=True)))
for p in glob.glob(os.path.join(A, 'audio', 'music', '*.mp3')) + glob.glob(os.path.join(A, 'audio', 'voice', '*.mp3')):
    sub = 'music' if '/music/' in p else 'voice'
    dst = os.path.join(OUT, 'audio', sub, os.path.basename(p))
    if fresh(p, dst): shutil.copy(p, ensure(dst))
for v in ['logo800.webm', 'logo800.mp4']:
    p = os.path.join(A, 'video', v); dst = os.path.join(OUT, 'video', v)
    if fresh(p, dst): shutil.copy(p, ensure(dst))
print('done')
