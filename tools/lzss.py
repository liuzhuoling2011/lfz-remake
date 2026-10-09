def lzss_decompress(src, outlen=None, N=4096, F=18, TH=2, fill=0, start=None):
    if start is None: start = N - F
    ring = bytearray([fill])*N
    r = start; out = bytearray(); i = 0; flags = 0; n = len(src)
    while i < n:
        flags >>= 1
        if not (flags & 0x100):
            flags = src[i] | 0xff00; i += 1
            if i>=n: break
        if flags & 1:
            c = src[i]; i += 1; out.append(c); ring[r] = c; r = (r+1) & (N-1)
        else:
            if i+1>=n: break
            a = src[i]; b = src[i+1]; i += 2
            pos = a | ((b & 0xf0) << 4); ln = (b & 0x0f) + TH + 1
            for k in range(ln):
                c = ring[(pos+k) & (N-1)]; out.append(c); ring[r] = c; r = (r+1) & (N-1)
        if outlen and len(out) >= outlen: break
    return bytes(out)
