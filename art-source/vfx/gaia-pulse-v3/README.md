# Gaia Pulse v3 · NEON CRONIUM

**IN_REVIEW.** New illustrated player projectiles requested for the arrival at Gaia. Technical export validation is separate from gameplay integration, owner artistic acceptance and physical-device certification.

## Canva generation and production limits

The concept was **actually generated with Canva** (`generate-image`, MEDIA `MAHYWJAlpCA`, 2026-10-18). [Open generated image](https://www.canva.com/M/MAHYWJAlpCA?utm_source=OC-AaBlKrqBJJNF&utm_campaign=agent_connector_create_image_asset_opened).

Canva declared a 1264×1264 JPG original but the available connector returned only a 200×200 JPEG thumbnail. That exact concept thumbnail is retained as `canva-concept-thumbnail-200.jpg`; it is **not** presented as a high-resolution production master. The original image page and an original-size rendition request returned HTTP 403. No further access changes were attempted. Canva's background-removal tool returned `INVALID_ARGUMENT`: “This feature requires a Canva paid plan (such as Canva Pro, Canva Business, or Canva Enterprise).” **No paid plan, upgrade, purchase or external API was enabled.**

For actual integration, `image_gen.imagegen` rebuilt the original Canva concept at production quality with true alpha transparency. The generated 1254×1254 PNG is preserved untouched as `gaia-pulse-production-master.png`. This is new generated artwork, not an enlargement of the 200 px thumbnail. ImageMagick only crops, resamples, pads transparent cells and exports WebP; the source of the illustrated design is recorded accurately.

## Atlas contract

Runtime: `assets/gaia_pulse_atlas_v3.webp` — **1024×1024 RGBA**, **256,162 bytes**, **4,194,304 decoded RGBA bytes**. Four columns × four rows; each cell 256²; pivot `(0.5,0.5)`. Nose points up `(0,-1)`; render at `atan2(vy,vx)+π/2` for actual travel direction. A short wake is embedded in each projectile; do not stretch it into a full ray.

| Cells | Animation | Contract |
| --- | --- | --- |
| 0–3 | Pulse: turquoise rounded energy capsule, bright spherical core, silver containment and animated plasma wake | 12 FPS loop |
| 4–7 | Twin: one blue/silver dart per cell, engineered fins and animated white-hot tip/exhaust | 12 FPS loop; game spawns the two projectiles |
| 8–11 | Lance: violet crystalline torpedo, mechanical clamps, animated volumetric plasma and lightning | 12 FPS loop |
| 12–15 | Impact: ignition → expanding plasma/debris → larger broken plasma bloom → separated embers/fragments | 16 FPS, one 0.25 s sequence, no loop |

All sixteen decoded frames differ. Each has at least a 16 px fully transparent gutter. The impact sequence uses the same packing scale across its four poses so its original expansion is preserved. Source rectangles, alpha bounds, individual RGBA hashes, dimensions, pivots, timing, provenance and runtime SHA-256 are in `gaia-pulse-atlas-v3.json`. Transparent PNG frames and a packed PNG master are retained. `contact-dark.png` and `chromium-asset-qa.png` are **asset contact sheets, not gameplay screenshots**.

Regenerate and run asset QA:

```sh
node art-source/vfx/gaia-pulse-v3/pack-atlas.mjs
node art-source/vfx/gaia-pulse-v3/validate-browser.cjs
```

The real Chromium check tests decoding, isolated alpha gutters, nonempty content, sixteen distinct frames and JavaScript errors. Integration still requires a running-game capture showing player projectiles and impacts at actual scale, stable controls/collisions, current loader/precache and offline verification. No Safari, physical iPhone or final aesthetic approval is claimed.

## Provenance and rights

Original Canva concept and imagegen production for this project. No franchise reference image, stock purchase or external third-party asset was used. The platforms' generation terms apply; exclusive rights are not asserted. Existing project art is preserved. The original generation remains at `/workspace/generated_images/exec-d2fba385-5c20-4cde-aa30-46c202fdb315.png` in addition to the repository master.
