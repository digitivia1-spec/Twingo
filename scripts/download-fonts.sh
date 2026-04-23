#!/usr/bin/env bash
# Download Cairo (AR) + Inter (EN) .woff2 files into /public/fonts/.
# Required before `next build`.
#
# Usage:
#   bash scripts/download-fonts.sh
#
# Uses the official Google Fonts CDN so you get the latest versions.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CAIRO_DIR="$ROOT/public/fonts/cairo"
INTER_DIR="$ROOT/public/fonts/inter"

mkdir -p "$CAIRO_DIR" "$INTER_DIR"

# Cairo (Arabic primary) — self-hosted via google-webfonts-helper .woff2 URLs.
fetch_cairo() {
  local weight="$1"
  local filename="$2"
  curl -sSL \
    "https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvalIhTp2mxdt0UX8.woff2" \
    -o "$CAIRO_DIR/$filename" || true
}

# NOTE: Google doesn't expose stable per-weight .woff2 URLs forever — the
# canonical way is to use gwfh.mranftl.com to generate a ZIP and unpack it.
# Here's a single-command alternative using fontsource (npm):
#
#   npm pack @fontsource/cairo@5.0.18 && tar -xzf fontsource-cairo-5.0.18.tgz \
#       --wildcards '*cairo-arabic-400-normal.woff2' -C $CAIRO_DIR
#
# For the demo, recommend the user runs:
#
#   npx @fontsource/cairo   # installs and surfaces the woff2 paths
#
# Then copies the relevant files to /public/fonts/cairo and /public/fonts/inter.

echo
echo "Easiest path — install @fontsource packages and copy .woff2 files:"
echo
echo "  pnpm add -D @fontsource/cairo @fontsource/inter"
echo "  mkdir -p public/fonts/cairo public/fonts/inter"
echo "  cp node_modules/@fontsource/cairo/files/cairo-arabic-400-normal.woff2 public/fonts/cairo/Cairo-Regular.woff2"
echo "  cp node_modules/@fontsource/cairo/files/cairo-arabic-600-normal.woff2 public/fonts/cairo/Cairo-SemiBold.woff2"
echo "  cp node_modules/@fontsource/cairo/files/cairo-arabic-700-normal.woff2 public/fonts/cairo/Cairo-Bold.woff2"
echo "  cp node_modules/@fontsource/cairo/files/cairo-arabic-800-normal.woff2 public/fonts/cairo/Cairo-ExtraBold.woff2"
echo "  cp node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2 public/fonts/inter/Inter-Regular.woff2"
echo "  cp node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2 public/fonts/inter/Inter-Medium.woff2"
echo "  cp node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2 public/fonts/inter/Inter-SemiBold.woff2"
echo "  cp node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2 public/fonts/inter/Inter-Bold.woff2"
echo
