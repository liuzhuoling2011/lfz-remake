#!/usr/bin/env python3
"""Extractor for 老夫子大富翁 (Old Master Q Monopoly, 2002) .dat archives.

Archive layout (omasterq.dat / voice.dat / music.dat):
  [entry data ...]                 each entry either raw bytes (JPG/MP3) or a pKLs block
  [pKLs block: directory]          LZSS-compressed directory
  u32 dir_offset                   last 4 bytes of file = offset of the directory pKLs block
pKLs block: 'pKLs' u32 unpacked_size u32 packed_size  <packed LZSS bytes>
LZSS: Okumura-style, N=4096, F=18, threshold 2, ring init 0x00, start r=N-F (0xFEE);
      flag byte LSB-first, 1=literal, 0=match (pos = b0 | (b1&0xF0)<<4, len = (b1&0x0F)+3).
Directory entries: u32 entry_len, u32 stored_size, u32 offset, char name[] (NUL-terminated, Big5/ASCII)
Usage: extract.py [src_dir] [out_dir]
"""
import os, struct, sys, json

def lzss_decompress(src, outlen=None):
    N, F = 4096, 18
    ring = bytearray(N); r = N - F
    out = bytearray(); i = 0; flags = 0; n = len(src)
    while i < n:
        flags >>= 1
        if not (flags & 0x100):
            flags = src[i] | 0xff00; i += 1
            if i >= n: break
        if flags & 1:
            c = src[i]; i += 1; out.append(c); ring[r] = c; r = (r + 1) & 0xfff
        else:
            if i + 1 >= n: break
            a = src[i]; b = src[i + 1]; i += 2
            pos = a | ((b & 0xf0) << 4); ln = (b & 0x0f) + 3
            for k in range(ln):
                c = ring[(pos + k) & 0xfff]; out.append(c); ring[r] = c; r = (r + 1) & 0xfff
        if outlen is not None and len(out) >= outlen: break
    return bytes(out[:outlen] if outlen is not None else out)

def read_block(d, off, stored):
    if d[off:off + 4] == b'pKLs':
        usz, psz = struct.unpack_from('<II', d, off + 4)
        out = lzss_decompress(d[off + 12: off + 12 + psz], usz)
        assert len(out) == usz, (off, usz, len(out))
        return out, 'pKLs'
    return d[off:off + stored], 'raw'

def read_dir(d):
    doff = struct.unpack('<I', d[-4:])[0]
    raw, _ = read_block(d, doff, len(d) - doff - 4)
    p = 0; ents = []
    while p + 12 <= len(raw):
        L, sz, off = struct.unpack_from('<III', raw, p)
        if L == 0: break
        nb = raw[p + 12:p + L].split(b'\0')[0]
        try: name = nb.decode('ascii')
        except UnicodeDecodeError: name = nb.decode('big5', 'replace')
        ents.append(dict(name=name, offset=off, stored=sz)); p += L
    return doff, ents

def extract(path, outdir):
    d = open(path, 'rb').read()
    doff, ents = read_dir(d)
    arch = os.path.basename(path)
    for e in ents:
        data, kind = read_block(d, e['offset'], e['stored'])
        e['kind'] = kind; e['size'] = len(data)
        rel = e['name'].replace('\\', '/').lower()
        e['path'] = f'{os.path.splitext(arch)[0]}/{rel}'
        fp = os.path.join(outdir, e['path'])
        os.makedirs(os.path.dirname(fp), exist_ok=True)
        with open(fp, 'wb') as f: f.write(data)
    return dict(archive=arch, size=len(d), dir_offset=doff, entries=ents)

if __name__ == '__main__':
    src = sys.argv[1] if len(sys.argv) > 1 else '/workspace/lfzdfw-analysis/extract'
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'raw')
    out = os.path.abspath(out); os.makedirs(out, exist_ok=True)
    index = []
    for a in ('omasterq.dat', 'voice.dat', 'music.dat'):
        r = extract(os.path.join(src, a), out)
        print(f"{a}: {len(r['entries'])} entries, dir@{r['dir_offset']:#x}", flush=True)
        index.append(r)
    json.dump(index, open(os.path.join(out, 'index.json'), 'w'), indent=1, ensure_ascii=False)
