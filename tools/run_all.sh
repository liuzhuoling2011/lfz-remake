#!/usr/bin/env bash
# Reproducible pipeline: raw extraction -> web conversion -> manifest/contact sheets.
# Needs python3 with numpy+Pillow (system or .venv) and ffmpeg (libvorbis, libx264, libvpx-vp9, libopus).
set -euo pipefail
cd "$(dirname "$0")"
PY=python3
if ! $PY -c 'import numpy, PIL' 2>/dev/null; then
  [ -d .venv ] || python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt; PY=.venv/bin/python
fi
SRC=${1:-/workspace/lfzdfw-analysis/extract}
$PY extract.py "$SRC" ../raw
$PY convert.py
$PY make_manifest.py
