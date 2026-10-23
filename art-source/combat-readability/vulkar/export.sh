#!/usr/bin/env bash
set -euo pipefail

magick art-source/combat-readability/vulkar/background-master.png -resize 768x1152! -quality 87 -define webp:method=6 assets/vulkar_orbit_background_v1.webp
magick art-source/combat-readability/vulkar/planet-master.png -resize 640x640 -quality 89 -define webp:alpha-quality=100 -define webp:method=6 assets/vulkar_orbit_planet_v1.webp
magick assets/vulkar_orbit_planet_v1.webp -background '#060c15' -alpha remove -alpha off art-source/combat-readability/vulkar/planet-runtime-on-dark-qa.png
