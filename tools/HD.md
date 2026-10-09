# HD asset set (AI super-resolution)

The SD set (`web/public/assets/sprites`, original 2002 resolution) stays the reference and fallback.
`tools/upscale.py` generates a parallel HD set in `web/public/assets/hd/` (git-ignored, regenerate any time).

## Setup (CPU only, no GPU needed)
```sh
python3 -m venv /workspace/hdtools/venv && . /workspace/hdtools/venv/bin/activate
pip install --index-url https://download.pytorch.org/whl/cpu torch
pip install spandrel pillow numpy
mkdir -p /workspace/hdtools/models && cd /workspace/hdtools/models
curl -LO https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-animevideov3.pth
curl -LO https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth
curl -LO https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth   # comparison only
```
Prerequisite: the extracted assets (`assets/`) and `web/scripts/prepare_assets.py` output (`web/public/assets/`).

## Run
```sh
python tools/upscale.py compare                 # screenshots/hd_compare_{map,characters,buildings,card,ui,font}.png
nohup python tools/upscale.py all --workers 4 > /workspace/hdtools/work/batch.out 2>&1 &   # images + sprites + index
python tools/upscale.py sprites --only map/house3,interface/   # partial / re-run; finished sheets are skipped
python tools/upscale.py index                   # web/public/assets/hd/index.json (sheet → scale, card images, bytes)
```
Resumable: a sheet is skipped when its HD webp is newer than the SD source (`--force` to redo). Work is split per sheet
over `--workers` spawned processes (8 cores / workers torch threads each).

## Models / scale factors
| set | model | output | why |
|---|---|---|---|
| map tiles, scenery, buildings, characters, fx (`map/*`) | realesr-animevideov3 | 2x | keeps the dithering / fabric texture of the isometric art, crisp edges, 4x faster than 6B |
| in-game UI (`interface/*`) | RealESRGAN_x4plus_anime_6B | 4x | flat UI with fine ornaments: cleanest lines; panels are shown up to ~2.2 × DPR |
| menus, season, dice, winner, misc | RealESRGAN_x4plus_anime_6B | 2x | full-screen 800x600 art drawn ≤ 2 × DPR |
| word-card / chance JPGs | RealESRGAN_x4plus_anime_6B | 4x | comic line art; also removes JPEG artefacts |
The network always runs at 4x; 2x outputs are a premultiplied Lanczos 4x→2x downsample (sharper than native-2x models).

## Sprite processing (alpha + exact placement)
* Each frame is cut from the SD sheet with a 6 px transparent margin (no bleeding between neighbouring frames).
* RGB: transparent pixels are filled by iterative edge dilation before inference (no dark/colour-key halos).
* Alpha: binary colour-key masks → bicubic + smoothstep (anti-aliased but crisp); semi-transparent masks (shadows, glows)
  → through the network as grey; ground tiles (`flag≠1` map layers) → exact nearest mask so tiles still butt together.
* The result is pasted into an HD sheet at exactly (x·S, y·S, w·S, h·S). Frame tables / hotspots stay in SD units;
  the renderer samples `f·S` from the HD image and draws at the SD size, so layout and hit-tests never change.
* Output: WebP q85, lossless alpha. Identical frames inside a sheet are upscaled once.

## Not upscaled
* Bitmap fonts (`assets/fonts`): the remake renders all text with vector CJK system fonts, crisp at any DPR.
* Map preview JPGs (select-map thumbnails, already 1024 px), the logo video, minigame art (not used by the remake).

## Runtime selection (畫質 in 系統設定: 自動 / 標準 / 高清)
* 標準 = SD set. 高清 = all HD sheets + the static map layer cached at 2 device px per art px.
* 自動 = HD when devicePixelRatio × board zoom ≥ 1.3 (or DPR ≥ 2), SD when `navigator.deviceMemory < 4`.
  On touch devices 自動 uses the *lite* tier: HD for UI, cards, characters and player buildings; terrain/scenery SD
  (keeps GPU memory low on phones).
* Missing HD files fall back to SD per sheet/image. Sheets are fetched per map (only that map's building style and the
  characters in the game); season and winner art on demand.
