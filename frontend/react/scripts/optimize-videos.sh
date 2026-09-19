#!/usr/bin/env bash
# Compress selected Drive clips for the public site.
# Sources live in tmp/evolve-videos/raw (not committed).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
RAW="$ROOT/tmp/evolve-videos/raw"
OUT="$ROOT/frontend/react/public/videos"
mkdir -p "$OUT"

VF='scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30'
ENC=(-an -c:v libx264 -pix_fmt yuv420p -profile:v high -movflags +faststart -crf 28 -preset medium)

echo "→ hero.mp4 (facility walkthrough)"
ffmpeg -y -i "$RAW/Evolve Reel 18-05-26.mp4" \
  -vf "$VF" "${ENC[@]}" "$OUT/hero.mp4"

echo "→ training.mp4 (coaching / floor work)"
ffmpeg -y -i "$RAW/001.mp4" \
  -vf "$VF" "${ENC[@]}" "$OUT/training.mp4"

echo "→ inside.mp4 (cinematic interiors + athletes, skip steam/shower)"
ffmpeg -y -i "$RAW/Screen Video.mp4" -filter_complex \
  "[0:v]trim=start=0:end=11.8,setpts=PTS-STARTPTS,${VF}[v1];\
[0:v]trim=start=23.8:end=40.6,setpts=PTS-STARTPTS,${VF}[v2];\
[v1][v2]concat=n=2:v=1:a=0[v]" \
  -map "[v]" "${ENC[@]}" "$OUT/inside.mp4"

echo "→ posters"
ffmpeg -y -ss 8 -i "$OUT/hero.mp4" -frames:v 1 -q:v 3 "$OUT/hero-poster.jpg"
ffmpeg -y -ss 4 -i "$OUT/training.mp4" -frames:v 1 -q:v 3 "$OUT/training-poster.jpg"
ffmpeg -y -ss 8 -i "$OUT/inside.mp4" -frames:v 1 -q:v 3 "$OUT/inside-poster.jpg"

ls -lh "$OUT"
echo "done"
