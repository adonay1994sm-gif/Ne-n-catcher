#!/usr/bin/env bash
set -euo pipefail
# Original generated artwork is preserved. This script only crops, aligns,
# resamples and packs that real artwork; it does not draw replacement art.
task_art_dir="$(cd "$(dirname "$0")" && pwd)"
task_repo_dir="$(cd "$task_art_dir/../.." && pwd)"
task_master="$task_art_dir/comet_generated_master.png"
task_offsets=('0 0 669 308' '768 0 643 308' '0 512 669 193' '768 512 643 192')
for task_index in 0 1 2 3; do
  read -r task_crop_x task_crop_y task_core_x task_core_y <<<"${task_offsets[$task_index]}"
  magick "$task_master" \
    -crop "768x512+$task_crop_x+$task_crop_y" +repage \
    -virtual-pixel transparent -filter Lanczos \
    -define distort:viewport=512x512+0+0 \
    -distort SRT "$task_core_x,$task_core_y 0.56 0 384,256" \
    +repage -background none -alpha on -alpha background \
    "$task_art_dir/comet_frame_$task_index.png"
done
magick "$task_art_dir/comet_frame_0.png" "$task_art_dir/comet_frame_1.png" \
  "$task_art_dir/comet_frame_2.png" "$task_art_dir/comet_frame_3.png" \
  +append "$task_art_dir/comet_flight_atlas_master.png"
magick "$task_art_dir/comet_flight_atlas_master.png" -filter Lanczos \
  -resize 1536x384! -background none -alpha on -alpha background \
  -define webp:lossless=true -define webp:method=6 \
  "$task_repo_dir/assets/comet_flight_atlas_v2.webp"
magick "$task_repo_dir/assets/comet_flight_atlas_v2.webp" \
  -background '#071329' -alpha remove \
  "$task_art_dir/review_on_space.png"
