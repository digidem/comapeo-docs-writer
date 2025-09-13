#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/docx_to_md.sh INPUT.docx OUTPUT.md [IMAGES_DIR]
# Example: scripts/docx_to_md.sh context/sources/to_convert/content_deck.docx context/sources/content_deck/content_deck.md context/sources/content_deck

if ! command -v pandoc >/dev/null 2>&1; then
  echo "Error: pandoc is not installed or not on PATH." >&2
  echo "Install pandoc and retry. Example (Debian/Ubuntu): sudo apt-get install pandoc" >&2
  exit 127
fi

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 INPUT.docx OUTPUT.md [IMAGES_DIR]" >&2
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

# If images dir provided, use it; otherwise place under OUTPUT's dir + /images
if [ -n "$IMAGES_DIR" ]; then
  mkdir -p "$IMAGES_DIR"
  pandoc --extract-media "${IMAGES_DIR}" "$INPUT" -o "$OUTPUT"
else
  pandoc --extract-media "${OUTDIR}/images" "$INPUT" -o "$OUTPUT"
fi

echo "Converted DOCX -> $OUTPUT"

