# Chapter 1 Rebirth · illustrated opening, characters and missile

Generated 2026-10-18 for **NEON CRONIUM**. Status: **IN_REVIEW**. Export validation does not certify game integration, artistic acceptance, Safari or a physical iPhone.

## What was actually created

Canva `generate-image` generated the opening concept, MEDIA `MAHYWkFSixE`: [Open generated image](https://www.canva.com/M/MAHYWkFSixE?utm_source=OC-AaBlKrqBJJNF&utm_campaign=agent_connector_create_image_asset_opened). The exact returned preview is retained as `intro/canva-concept-thumbnail.jpg`. It is a thumbnail, not a high-resolution production master. This was an **image-generation** call, not Canva video creation or an exported movie.

Three original production masters were generated independently with `image_gen.imagegen`, in parallel from the same written art direction. They were **not** image-to-image edits of the Canva thumbnail; the provenance records this distinction. The available Canva image connector does not expose an original-byte export endpoint. No paid plan, upgrade, stock purchase or external API was enabled. The production PNG masters remain untouched in this repository and the original generated-image directory.

| Runtime | Layout and contents | Compressed bytes | Decoded RGBA bytes |
| --- | --- | ---: | ---: |
| `assets/chapter1_intro_atlas_v1.webp` | 1024×1536, 2×2 cells of 512×768; active Chronos / convoy attack / evacuation / deep-space route | 490,076 | 6,291,456 |
| `assets/chapter1_portraits_v1.webp` | 768×256, three 256² portraits; Lira / Mira / Iria | 67,988 | 786,432 |
| `assets/chapter1_missile_atlas_v1.webp` | 1024², 4×4 cells of 256²; flight / launch / impact / aftermath | 246,250 | 4,194,304 |
| **Total** | Three reusable runtime resources | **804,314** | **11,272,192 (10.75 MiB)** |

These decoded-memory numbers describe RGBA image pixels, not measured total browser memory. The game integrator should load the opening on demand and release or bound its cache after use. Runtime weights and SHA-256 hashes are in `asset-summary.json` and each subdirectory's metadata.

## Opening contract

`intro/chapter1-intro-generated-master.png`: 1024×1536 original PNG. Each of its four illustrated story states is genuinely different: an active scientific installation, a hostile convoy striking its structures, catastrophic reactor rupture with evacuation, and a distant broken station with CRONIUM tracing the route through space. Direction, architecture and Gaia's side of the composition remain coherent. The original generated storyboard's white separators were removed by source cropping; aspect-preserving cover resize avoids stretching its scenes. The exported atlas has no separator lines.

Frame order is row-major: **0 active**, **1 attack**, **2 evacuation**, **3 deep space**. Source rectangles and final rectangles are in `intro/intro-metadata.json`; separate optimized-production PNG cells are in `intro/frames/`. Each cell is opaque and complete; pivot `(0.5,0.5)`.

These four illustrations are **story states**, not a video and not independent parallax layers. They provide poses for an opening sequence. Existing independently illustrated Chronos station parts, enemies, ship, fragments and effects can supply compatible moving foreground layers in the game. Do not present a static contact sheet or a simple fade between panels as a finished animated cinematic. Timing, actual animation, controls, skip/pause, state continuity and asset release remain integration responsibilities.

## Characters

`portraits/chapter1-portraits-generated-master.png`: 2172×724 original transparent PNG. Export cells 0/1/2 are **Lira, Mira, Iria**. The three women have distinct silhouettes, age, face, clothing and illumination. The working visual choices are an empathetic Chronos operator in cyan/navy, an experienced C9 mechanic/service chief in amber, and a focused Gaia commander in silver/cobalt. These are reversible art decisions, not claims that the owner previously confirmed every appearance detail.

Each exported portrait has 16 px fully transparent padding. These are **three static portraits**, not mouth-animation frames. Names and dialogue belong to readable game text; no text is baked into the portraits. The UI can reuse them for contextual communications without hiding live threats.

## Missile

`missile/chapter1-missile-generated-master.png`: 1254² original transparent PNG. All 16 poses have different decoded pixels. The missile has a tangible silver-black casing, cyan seeker, fins and orange/cyan nozzle; it is not a stretched laser ray. Frames are row-major:

- **0–3:** flight, 12 FPS loop; animated seeker and exhaust, stable physical hull.
- **4–7:** launch, 12 FPS once (1/3 s); clamps open, nozzle ignites, fins deploy and missile leaves its mount.
- **8–11:** impact, 16 FPS once (0.25 s); ignition, developing blast, larger fragmented explosion, separated cooling material.
- **12–15:** aftermath, 10 FPS once (0.4 s); illustrated fragments and embers disperse while the small translucent wisp fades.

Pivot `(0.5,0.5)`; forward `(0,-1)`. Rotate flight by `atan2(vy,vx)+π/2` to match its real trajectory, preserving proportional scale. All cells have a 16 px clear alpha gutter. Source and destination rectangles, individual frame hashes, alpha bounds, timing, provenance and resource hashes are in `missile/missile-metadata.json`.

Launch/impact/aftermath artwork does not itself fire or award anything. The game must trigger a missile once per actual launch event and damage once per physical hit; replaying an animation cannot duplicate a projectile or reward. No new countermeasure mechanic is represented or claimed.

## Reproduction and QA

```sh
node art-source/chapter1-rebirth/pack-assets.mjs
node art-source/chapter1-rebirth/validate-browser.cjs
```

Packing completed with exit 0. The real Chromium asset check passed **7/7**, exit 0, with **23 distinct visible cells** (4 opening, 3 portraits, 16 missile), declared dimensions, transparent margins on portrait/missile atlases and no JavaScript errors. Evidence: `chromium-asset-qa.json`, plus three `chapter1-*-v1-chromium.png` contact screenshots. Each is clearly labelled **asset QA only**. The `contact-dark.png` files are illustration contact sheets, not gameplay screenshots. No sources, manifests, loaders, renderer, bundles or game loops were modified by this art task.

Still required: actual running-game appearance, animation sequencing, natural combat, event-once behavior, loading/offline cache verification, memory/performance measurement, owner review and physical-device QA. None is implied by decoding the atlas.

## Rights and preservation

Original generated project art, without external franchise images or stock purchases. Platform generation terms apply; exclusivity is not asserted. The original PNG masters, derived per-cell PNGs, packed PNGs, Canva preview, metadata and export script are retained. ImageMagick performs production crop/resize/padding/compression; no Python image editing was used. Previous game resources were not deleted or modified.
