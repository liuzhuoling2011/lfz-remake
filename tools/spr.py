"""Decoder for 老夫子大富翁 .SPR sprite files (RLE, 16-bit RGB565 + 8-bit alpha runs).

File layout:
  [pixel RLE data / frame headers in any order]
  [optional extra block (animation/meta), starts at offset X]
  u32 X  (offset of extra block == end of last frame header)   } only in v2 files
  'Ver\x02'                                                     }
  u32 frame_offset[N]
  u32 N
Frame header @frame_offset: i32 w, i32 h, i32 hotspot_x, i32 hotspot_y, u32 line_offset[h] (absolute file offsets)
Line RLE (u16 words):
  0x8000        end of line
  0x8000|n      skip n transparent pixels
  0x4000|n, a   n pixels with alpha a (0..255), followed by n RGB565 words
  0x0000|n      n opaque RGB565 pixels
"""
import struct
import numpy as np

def parse(d):
    n = struct.unpack_from('<I', d, len(d) - 4)[0]
    if not (0 < n < 5000) or len(d) < 12 + 4 * n: raise ValueError('bad frame count')
    offs = struct.unpack_from('<%dI' % n, d, len(d) - 4 - 4 * n)
    vpos = len(d) - 4 - 4 * n - 4
    ver = d[vpos:vpos + 4]
    if ver[:3] == b'Ver':
        extra_off = struct.unpack_from('<I', d, vpos - 4)[0]
        extra = d[extra_off:vpos - 4] if 0 <= extra_off <= vpos - 4 else b''
    else:  # version 1: no Ver tag / extra block
        ver = b'Ver\x01'; extra_off = None; extra = b''
    frames = []
    for o in offs:
        w, h, hx, hy = struct.unpack_from('<4i', d, o)
        lines = struct.unpack_from('<%dI' % h, d, o + 16) if h > 0 else ()
        frames.append(dict(w=w, h=h, hx=hx, hy=hy, lines=lines, hdr=o))
    return dict(n=n, version=ver[3], frames=frames, extra=extra, extra_off=extra_off)

def decode_frame(d, fr):
    w, h = fr['w'], fr['h']
    rgba = np.zeros((max(h, 1), max(w, 1), 4), np.uint8)
    if w <= 0 or h <= 0: return rgba
    col = np.zeros((h, w), np.uint16); alpha = np.zeros((h, w), np.uint8)
    for y, lo in enumerate(fr['lines']):
        x = 0; p = lo
        while x < w:
            c = d[p] | (d[p + 1] << 8); p += 2
            if c == 0x8000: break
            t = c & 0xC000; k = c & 0x3FFF
            if t == 0x8000:
                x += k
            elif t == 0x4000:
                a = d[p] | (d[p + 1] << 8); p += 2
                k2 = min(k, w - x)
                col[y, x:x + k2] = np.frombuffer(d, '<u2', k2, p); alpha[y, x:x + k2] = min(a, 255)
                p += 2 * k; x += k
            elif t == 0:
                k2 = min(k, w - x)
                col[y, x:x + k2] = np.frombuffer(d, '<u2', k2, p); alpha[y, x:x + k2] = 255
                p += 2 * k; x += k
            else:
                raise ValueError('unknown opcode %04x at %d' % (c, p - 2))
    r = (col >> 11) & 31; g = (col >> 5) & 63; b = col & 31
    rgba[..., 0] = (r << 3) | (r >> 2); rgba[..., 1] = (g << 2) | (g >> 4); rgba[..., 2] = (b << 3) | (b >> 2)
    rgba[..., 3] = alpha
    return rgba
