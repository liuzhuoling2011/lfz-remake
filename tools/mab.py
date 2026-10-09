"""Parser for .MAB map files (isometric board maps).
Layout:
  i32 map_w, map_h (tiles), tile_w, tile_h (px, 80x40 diamond)
  sprite table: repeat { u32 kind (0=ground tile,1=object), cstr spr_name } until u32 0xFFFFFFFF
  u32 n_layers
  layer: cstr layer_name, u32 flag, u32 count, count * { u32 a, u32 b, i32 x, i32 y, cstr label(Big5) }
"""
import struct

def cstr(d, p):
    e = d.index(b'\0', p); return d[p:e], e + 1

def parse(d):
    w, h, tw, th = struct.unpack_from('<4i', d, 0); p = 16
    sprites = []
    while True:
        k = struct.unpack_from('<I', d, p)[0]; p += 4
        if k == 0xFFFFFFFF: break
        s, p = cstr(d, p); sprites.append(dict(kind=k, name=s.decode('ascii', 'replace')))
    nl = struct.unpack_from('<I', d, p)[0]; p += 4
    layers = []
    for _ in range(nl):
        s, p = cstr(d, p)
        flag, cnt = struct.unpack_from('<II', d, p); p += 8
        objs = []
        for _ in range(cnt):
            a, b, x, y = struct.unpack_from('<IIii', d, p); p += 16
            lab, p = cstr(d, p)
            objs.append(dict(a=a, b=b, x=x, y=y, label=lab.decode('big5', 'replace')))
        layers.append(dict(name=s.decode('ascii', 'replace'), flag=flag, objects=objs))
    return dict(width=w, height=h, tile_w=tw, tile_h=th, sprites=sprites, layers=layers, trailing=d[p:])
