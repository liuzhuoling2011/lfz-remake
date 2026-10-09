"""Decoder for .FNT bitmap fonts.
Header: 'FONT', u32 hdr_size(16), u32 cjk_offset, u16 cell_w, u16 cell_h
u32 ascii_offsets[96] (chars 0x20..0x7F), each glyph: u16 w, u16 h, h rows of ceil(w/8) bytes (1bpp, MSB first)
@cjk_offset (if < file size): fixed slots for Big5 lead 0xA1..0xF9 x 157 trail bytes (0x40-0x7E,0xA1-0xFE),
  each slot cell_h rows of ceil(cell_w/8) bytes, 1bpp MSB-first.
Glyphs are 2x supersampled (e.g. '14x14' font has 28x28 cells) - the game downsamples for antialiasing.
"""
import struct
import numpy as np

TRAILS = list(range(0x40, 0x7F)) + list(range(0xA1, 0xFF))

def bits(buf, w, h):
    bpr = (w + 7) // 8
    a = np.frombuffer(buf, np.uint8, bpr * h).reshape(h, bpr)
    return np.unpackbits(a, axis=1)[:, :w]

def parse(d):
    magic, hs, cjk, cw, ch = struct.unpack_from('<4sIIHH', d, 0)
    offs = struct.unpack_from('<96I', d, 16)
    ascii_ = {}
    for i, o in enumerate(offs):
        if o == 0 or o + 4 > len(d): continue
        w, h = struct.unpack_from('<HH', d, o)
        if w == 0 or h == 0: continue
        ascii_[0x20 + i] = bits(d[o + 4:o + 4 + ((w + 7) // 8) * h], w, h)
    cjk_glyphs = {}
    if cjk < len(d) and cw and ch:
        slot = ((cw + 7) // 8) * ch
        n = (len(d) - cjk) // slot
        for k in range(n):
            lead = 0xA1 + k // 157; trail = TRAILS[k % 157]
            g = d[cjk + k * slot: cjk + (k + 1) * slot]
            if any(g): cjk_glyphs[(lead, trail)] = bits(g, cw, ch)
    return dict(cell_w=cw, cell_h=ch, ascii=ascii_, cjk=cjk_glyphs)
