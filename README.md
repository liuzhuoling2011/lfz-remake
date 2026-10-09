# 老夫子大富翁 — Web Remake

Fan remake of **老夫子大富翁** (Old Master Q Monopoly, 2002) using TypeScript, Canvas 2D, and Vite. For personal / educational use only — not affiliated with the original rights holders.

## Play

- **GitHub Pages:** https://liuzhuoling2011.github.io/lfz-remake/
- Optional LAN (Synology): `http://192.168.88.88/lfz/`

## What's in this repo

Source for the browser remake (`web/`), design / RE notes (`spec/`), and asset pipeline scripts (`tools/`, `web/scripts/`).

**Original game data is not included.** You need the original ISO / install files to regenerate `raw/`, `assets/`, and `web/public/assets/` (and thus a local `web/dist` build). The playable site on GitHub Pages is published from a separate `gh-pages` branch.

## Build (local)

Requires **Node 22+** and Python 3 with `numpy` + Pillow (and `ffmpeg` for audio/video conversion).

```bash
# 1) Extract & convert original assets (path to extracted game data)
./tools/run_all.sh /path/to/extracted-game

# 2) Prepare web public assets
/opt/node22/bin/node -v   # or any Node 22+
cd web
python3 scripts/prepare_assets.py
npm install
npm run build             # output → web/dist
npm run preview           # local smoke test
```

Open `web/dist/index.html` via a static server (or `npm run preview`). Vite `base` is `./`, so the build also works under a project path such as `/lfz-remake/`.

## License / disclaimer

This is an unofficial fan remake. Original characters, art, music, and game design belong to their respective owners. Do not redistribute original ISO contents with this repository.
