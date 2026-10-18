# Enemy navigation and fair comet crossings — 2026-10-18

Owner: `/root/enemy_navigation`. Sources frozen after targeted verification. No build/browser/commit/push performed by this agent.

## Exclusive files changed

- `src/game/combat/classic-pursuit.js`
- `src/game/progression/comet-shower.js`
- `tests/classic-pursuit.test.mjs`
- `tests/comet-shower.test.mjs`

## Runtime changes

### Pursuit v4

Same caller API and existing legacy item/animator ownership. Raider = attack strafe, Scout = survey orbit, Interceptor = faster flanking arc. Correlated, seeded lateral and depth targets produce actual two-dimensional paths. Motion has the existing bounded acceleration and speed, short firing steadiness, and distinct deterministic individual signatures. Role observation intervals are now actually respected (.24/.32/.20 s). Aim still locks to past observations; emitted bullets retain fixed physical velocities and animation fire events emit once. No input-reading, bullet dodging, homing, new timers or RAF. Existing retreat/HP/hurt and reaction-distance protections preserved.

### Comet shower v3

Three families remain lateral / descending / overtaking, but their order is shuffled per seed. Reserved passage positions vary continuously, individual paths vary angle, entry side, initial speed 700–950 logical px/s and quadratic curvature. Warning describes the actual first body's entry edge; the prefix remains `Se aproxima lluvia de cometas`. Later bodies can include high lateral crossings instead of identical vertical copies.

Complete-path safe passage now uses exact quadratic/rectangle interval classification rather than .008 s samples: collect every crossing of each expanded corridor edge and inspect interval endpoints/interiors. No secretly shrunken collision radii. Conservative clearance is nucleus r + 12 around full-hull corridor. Normal 10-body schedule, max5 references, two-second warnings, resume grace, IDs, stage1.5/1.9 isolation and single physical integrator preserved.

If slow motion or external hold leaves a prior train alive, a later incompatible train is skipped to avoid two reserved corridors closing each other. Held-first-train fixture now correctly retains3 and skips7, not five overlapping bodies with incompatible passages.

## Root integration

- `createCometShower` accepts `{shipWidth, shipSideClearance}`. Defaults108.16 (=208*.52) and61.88 (=119*.52), matching the 30% relative increase from .40 to .52.
- Root should pass `shipWidth: SHIP_VISUAL.assemblySize, shipSideClearance: 119 * SHIP_VISUAL.classicScale` in `resetClassicCometShower` to prevent later visual/physical drift.
- `scripts/gaia-interceptor-browser-smoke.cjs:381` has old literal `classic-pursuit-v3`; root owns adapting its contract to `classic-pursuit-v4`.
- Browser scripts making assumptions about fixed comet burst order/side need to inspect item.crossingMode/entryEdge/corridor instead. These new fields are additive.
- No other source, bundle, doc, package or asset modified by this agent.

## Targeted verification

Command: `node --test tests/classic-pursuit.test.mjs tests/comet-shower.test.mjs`
Result: 30 tests PASS, 0 fail, exit0 (~554 ms final run).

Includes100 pursuit seeds/three roles, bounded speed/acceleration, exact replay, hurt/death cancellation, one-shot events, no post-launch steering, pause, visibility/reaction corridor, real X/Y curves and nine distinct role/seed trajectories.

Comets include100 seeds at each of six viewports (250x300,320x568,390x844,540x960,720x1280,720x1558), full-route safety and reachable passage centers; all six shuffled orders over48seeds; >35 distinct entry pitches; actual warning entrance at three widths; deterministic trajectories; custom larger hull widths; old central immunity disproven for descending and overtaking; freeze/resume, exact integration/swept contact, bounds retirement and slow-motion safety.

`git diff --check --` those four files: exit0.

Initial expected test failures were obsolete v2/version/fixed burst labels/old119px unscaled center contracts and old <58px vertical band. New bounded depth arcs require <110px while keeping the stronger per-frame visible/reaction-distance assertions. No coverage deleted.

## Limits

Targeted model verification is not a natural browser playthrough or human balance approval. Only legacy first-level pursuit roles and authored comet shower policy changed; this does not claim every N-7 or world enemy has been redesigned. Root owns final build, browser/full suite, integration report and publication.
