#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/pptx_to_md.sh INPUT.pptx OUTPUT.md [IMAGES_DIR]
# Example: scripts/pptx_to_md.sh context/sources/to_convert/setup_guide.pptx context/sources/setup_guide/setup_guide.md context/sources/setup_guide
# Requires: uv (https://github.com/astral-sh/uv) and pptx2md
# We run pptx2md via uvx so no global pip install is needed.

if ! command -v uvx >/dev/null 2>&1; then
  echo "Error: uv (uvx) is not installed or not on PATH." >&2
  echo "Install uv: https://github.com/astral-sh/uv#installation" >&2
  exit 127
fi

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 INPUT.pptx OUTPUT.md [IMAGES_DIR]" >&2
  exit 2
fi

INPUT="$1"
OUTPUT="$2"
IMAGES_DIR="${3:-}" # optional

if [ ! -f "$INPUT" ]; then
  echo "Error: input not found: $INPUT" >&2
  exit 3
fi

OUTDIR="$(dirname "$OUTPUT")"
mkdir -p "$OUTDIR"

# If images dir provided, pass -i; else use OUTDIR/img
if [ -n "$IMAGES_DIR" ]; then
  mkdir -p "$IMAGES_DIR"
  uvx pptx2md "$INPUT" -o "$OUTPUT" -i "$IMAGES_DIR" --keep-similar-titles || {
    echo "pptx2md failed." >&2
    exit 4
  }
else
  mkdir -p "$OUTDIR/img"
  uvx pptx2md "$INPUT" -o "$OUTPUT" -i "$OUTDIR/img" --keep-similar-titles || {
    echo "pptx2md failed." >&2
    exit 4
  }
fi

echo "Converted PPTX -> $OUTPUT"
