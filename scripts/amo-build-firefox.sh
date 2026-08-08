#!/usr/bin/env bash
# AMO reviewer helper: build the Firefox listing package from source.
# Requires Bun 1.3.x on PATH. See AMO_SOURCE_README.md.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v bun >/dev/null 2>&1; then
  echo "error: bun is required. Install from https://bun.sh/docs/installation" >&2
  exit 1
fi

echo "bun version: $(bun --version)"
bun install
bun run build:firefox

echo
echo "Build complete."
echo "  Unpacked extension: dist/"
echo "  Listing zip:        $(ls -1 add-remote-torrent-v*-firefox.zip 2>/dev/null | tail -1)"
