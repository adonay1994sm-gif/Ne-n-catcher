# Hostile Ordnance & Salvage v1 · NEON CRONIUM

Original art generated on 2026-10-18 with `image_gen.imagegen`, then packed with ImageMagick. No external image, purchased asset, franchise image or third-party source was used. Platform generation terms apply; exclusivity is not asserted. Artistic acceptance belongs to the owner. **IN_REVIEW**: export QA is not game integration or physical-device certification.

The preserved original is `hostile-salvage-generated-master.png` (1254×1254 RGBA). `hostile-salvage-packed-master.png` and the 16 PNGs in `frames/` are transparent production masters. Runtime: `assets/hostile_ordnance_atlas_v1.webp`, 1024×1024, 237,838 bytes, **4,194,304 decoded RGBA bytes**. `contact-dark.png` is an art contact sheet, not a screenshot of gameplay.

| Cells | Representation | Playback |
| --- | --- | --- |
| 0–3 | Scout: rounded turquoise plasma shell, white-hot volumetric core and short trailing plume | 12 FPS, looping |
| 4–7 | Interceptor: red titanium missile dart, silver machined fins and short thermal exhaust | 12 FPS, looping |
| 8–11 | Atlas: heavy amber orb in a segmented mechanical containment shell, animated plasma and exhaust | 10 FPS, looping |
| 12, 13, 14, 15 | Copper, silver, gold, stellar physical salvage tokens | Four different denominations; do not animate them as one object |

All cells are 256×256; pivot `(0.5,0.5)`. Forward points upward `(0,-1)`; rotate a sprite by `atan2(vy,vx)+π/2` to follow an actual trajectory. Tails are part of the illustrated sprite, not full-length laser lines. Keep width and height proportional, independent of collision geometry. Bullets contain real animated changes in shell, heat, exhaust and internal plasma. Salvage tokens are physical pickups with distinct metal and silhouette; currency rules belong to gameplay, not this art export.

Packing preserves the source and places each isolated object within a fully transparent margin of at least 16 pixels on all sides. All 16 decoded RGBA hashes differ. Source rectangles, frame hashes, alpha bounds, pivots, durations, dimensions, provenance and runtime hash are in `hostile-ordnance-atlas-v1.json`.

Regenerate and validate export:

```sh
node art-source/vfx/hostile-salvage-v1/pack-atlas.mjs
node art-source/vfx/hostile-salvage-v1/validate-browser.cjs
```

The browser check only decodes/draws the real WebP in Chromium. Its contact screenshot is clearly labelled **asset QA only**. Parent integration must verify the actual enemy projectiles, pickups, scaling, animations, collisions and offline precache in the game before closing the integration task. No iPhone, Safari or aesthetic certification is claimed.

Generation brief: an original 4×4 isolated transparent sprite sheet of compact upward-flying volumetric Scout plasma, a metal Interceptor dart, a heavy Atlas containment orb (four genuine animation poses each), followed by copper/silver/gold/stellar salvage tokens. Cinematic stylized arcade science fiction; strong readable silhouettes; restrained glow; no text, backgrounds, dividers, connecting lines, horizontal streaks or shared trails. All artwork is in the preserved generation master; packing code only crops, pads and exports it.
