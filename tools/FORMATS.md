# 老夫子大富翁 file formats (reverse-engineered, static analysis only)

## .dat archives (omasterq.dat, voice.dat, music.dat) — same container
- Entries are concatenated; each is either a `pKLs` block (LZSS) or raw bytes (JPG in omasterq.dat, MP3 in voice/music).
- Last 4 bytes of file: u32 offset of the directory, which is itself a `pKLs` block.
- `pKLs` block: `'pKLs' u32 unpacked_size u32 packed_size <packed>`.
- LZSS = classic Okumura: N=4096, F=18, THRESHOLD=2, ring buffer zero-filled, r starts at 4078; flag byte LSB-first (1 = literal);
  match = 2 bytes `pos = b0 | (b1 & 0xF0) << 4`, `len = (b1 & 0x0F) + 3`.
- Directory records: `u32 rec_len, u32 stored_size, u32 offset, char name[]` (NUL-terminated DOS path, e.g. `DAT\MAP\HONGKONG.MAB`).
- The exe also checks for an `LZPK` magic (alternate packer) but no entry uses it.
- omasterq.dat: 535 entries (491 pKLs + 44 raw JPG). voice.dat: 474 (237 MP3 + 237 WAV twins, all pKLs-or-raw). music.dat: 18 MP3.

## .SPR sprites (407 files, 8777 frames)
Tail: `[u32 extra_off, 'Ver\x02']` (v2 only) `u32 frame_off[N], u32 N`.
Frame header @frame_off: `i32 w, h, hotspot_x, hotspot_y; u32 line_off[h]` (absolute offsets).
Line RLE of u16: `0x8000` EOL · `0x8000|n` skip n · `0x4000|n, u16 alpha, n*RGB565` · `0x0000|n, n*RGB565` (opaque).
v2 extra block: `char name_zh[32] (Big5), i32 tiles_w, tiles_h, groups(1|4 directions), anim_param, i32 frames_per_group[groups]`.

## .MAB maps (3)
`i32 w,h (tiles), tile_w=80, tile_h=40`; sprite table `{u32 kind(0 ground/1 object), cstr name}` until `0xFFFFFFFF`;
`u32 nlayers`; layer = `cstr name, u32 flag(0 ground,1 objects,2 labels), u32 count, {u32 dir, u32 frame, i32 x, i32 y, cstr label_big5}[count]`.
Objects reference sprites by the SPR v2 `name_zh`. Positions are world pixels of the sprite hotspot on a staggered iso lattice (x step 40, y step 20).
Label layer holds editor annotations `N(price)` (buyable lot N + price), `cN(value)` (special building N), and markers `po/ho/lo/te/of`.

## .FNT fonts (4)
`'FONT', u32 16, u32 cjk_off, u16 cell_w, u16 cell_h, u32 ascii_off[96]`; ASCII glyph = `u16 w,h` + 1bpp rows (MSB first).
@cjk_off: 13973 fixed slots = Big5 lead 0xA1..0xF9 × 157 trails, each `cell_h * ceil(cell_w/8)` bytes 1bpp. Glyphs are 2× supersampled
(the "14x14" font has 28×28 cells).

## .TXT — Big5 INI-like tables (`[section]`, `key = value` or `N.value`). Converted to UTF-8 + JSON.
## .WAV — PCM 16-bit mono 44.1k (SFX). MP3 — 128k (music) / 320k (voice). AVI — Cinepak 15fps + PCM u8.
