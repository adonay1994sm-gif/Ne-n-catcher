import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const text = (file) => readFile(join(root, file), 'utf8');
const gameFiles = [
  '00-bootstrap-config.js', '01-runtime-assets.js', '02-storage-audio.js',
  '03-ui-game-flow.js', '04-entities-collision-damage.js',
  '05-corridor-update.js', '06-world-rendering.js',
  '07-player-item-rendering.js', '08-loop-input-bootstrap.js'
];

test('art pass preserves the nine-source game bundle', async () => {
  const parts = await Promise.all(gameFiles.map((name) => text(`src/game/${name}`)));
  assert.equal(await text('game.js'), parts.join(''));
});

test('Chronos background uses the authored image and bounded readability veil', async () => {
  const src = await text('src/game/06-world-rendering.js');
  assert.match(src, /spriteReady\(SPRITES\.cronosBackground\)/);
  assert.match(src, /ctx\.globalAlpha = 0\.62;/);
  assert.match(src, /const readability = ctx\.createLinearGradient/);
  const sceneStart = src.indexOf('if (lv.scene === "cronos")');
  const sceneEnd = src.indexOf('} else if (lv.scene === "orbit")', sceneStart);
  assert.ok(sceneStart > 0 && sceneEnd > sceneStart);
  const cronosScene = src.slice(sceneStart, sceneEnd);
  assert.equal(cronosScene.includes('for (let index = 0; index < 13; index++)'), false);
});

test('Chronos accident uses four authored atlas phases instead of a drawn ring', async () => {
  const src = await text('src/game/06-world-rendering.js');
  const scene = src.slice(src.indexOf('if (!N7_CAMPAIGN && currentLevel === 0 && levelOneShockwave > 0)'),
    src.indexOf('if (stormPulse > 0)'));
  assert.match(scene, /SPRITES\.chronosShockwave/);
  assert.match(scene, /Math\.floor\(progress \* 4\)/);
  assert.doesNotMatch(scene, /ctx\.arc\(/);
  const atlas = await readFile(join(root, 'assets/chronos_shockwave_atlas_v1.webp'));
  assert.ok(atlas.byteLength > 100_000);
});

test('Atlas perimeter draws its own illustrated Gaia Nova environment', async () => {
  const src = await text('src/game/06-world-rendering.js');
  assert.match(src, /!N7_CAMPAIGN && currentLevel === 1 && spriteReady\(SPRITES\.atlasBackground\)/);
  assert.match(src, /ctx\.drawImage\(image, \(W - width\) \/ 2 \+ driftX/);
  const master = await readFile(join(root, 'art-source/visual-rebirth/levels/02/atlas-perimeter-master.png'));
  const runtime = await readFile(join(root, 'assets/atlas_perimeter_background_v1.webp'));
  assert.ok(master.byteLength > runtime.byteLength);
});

test('Vulkar level 3 uses separate illustrated space and planet layers with the played clock', async () => {
  const src = await text('src/game/06-world-rendering.js');
  assert.match(src, /isUnifiedClassic\(\) && currentLevel===2.*drawVulkarOrbitBackground/);
  const orbit=src.slice(src.indexOf('function drawVulkarOrbitBackground'),src.indexOf('function background(t)'));
  assert.match(orbit,/SPRITES\.vulkarOrbitBackground,planet=SPRITES\.vulkarOrbitPlanet/);
  assert.match(orbit,/ctx\.drawImage\(planet/);
  assert.match(orbit,/elapsed\*/);
  assert.doesNotMatch(orbit,/Date\.now|performance\.now|requestAnimationFrame/);
  const assets = await text('src/game/01-runtime-assets.js');
  assert.match(assets, /assets\/vulkar_orbit_background_v1\.webp/);
  assert.match(assets, /assets\/vulkar_orbit_planet_v1\.webp/);
  // The previous illustration remains recoverable, not silently deleted.
  const master = await readFile(join(root, 'art-source/visual-rebirth/levels/03/vulkar-descent-master.png'));
  const runtime = await readFile(join(root, 'assets/vulkar_descent_background_v1.webp'));
  assert.ok(master.byteLength > runtime.byteLength);
});

test('Vulkar magma tunnel has a separate level 4 illustration and no purple ion overlay', async () => {
  const src = await text('src/game/06-world-rendering.js');
  assert.match(src, /!N7_CAMPAIGN && currentLevel === 3 && spriteReady\(SPRITES\.magmaTunnelBackground\)/);
  assert.match(src, /lv\.scene === "ion" && \(N7_CAMPAIGN \|\| currentLevel !== 3\)/);
  const master = await readFile(join(root, 'art-source/visual-rebirth/levels/04/vulkar-magma-tunnel-master.png'));
  const runtime = await readFile(join(root, 'assets/vulkar_magma_tunnel_background_v1.webp'));
  assert.ok(master.byteLength > runtime.byteLength);
});

test('Cryon whiteout has a dedicated illustrated classic level 5 scene', async () => {
  const src = await text('src/game/06-world-rendering.js');
  assert.match(src, /!N7_CAMPAIGN && currentLevel === 4 && spriteReady\(SPRITES\.cryonWhiteoutBackground\)/);
  assert.match(src, /lv\.scene === "crimson" && \(N7_CAMPAIGN \|\| currentLevel !== 4\)/);
  const master = await readFile(join(root, 'art-source/visual-rebirth/levels/05/cryon-whiteout-master.png'));
  const runtime = await readFile(join(root, 'assets/cryon_whiteout_background_v1.webp'));
  assert.ok(master.byteLength > runtime.byteLength);
});

test('Cryon Leviathan rift has its own classic level 6 scene', async () => {
  const src = await text('src/game/06-world-rendering.js');
  assert.match(src, /!N7_CAMPAIGN && currentLevel === 5 && spriteReady\(SPRITES\.cryonRiftBackground\)/);
  assert.match(src, /lv\.scene === "gravity" && \(N7_CAMPAIGN \|\| currentLevel !== 5\)/);
  const master = await readFile(join(root, 'art-source/visual-rebirth/levels/06/cryon-leviathan-rift-master.png'));
  const runtime = await readFile(join(root, 'assets/cryon_leviathan_rift_background_v1.webp'));
  assert.ok(master.byteLength > runtime.byteLength);
});

test('Aether cemetery and phantom threshold are separate classic scenes', async () => {
  const src = await text('src/game/06-world-rendering.js');
  assert.match(src, /!N7_CAMPAIGN && currentLevel === 6 && spriteReady\(SPRITES\.aetherEchoBackground\)/);
  assert.match(src, /!N7_CAMPAIGN && currentLevel === 7 && spriteReady\(SPRITES\.aetherThresholdBackground\)/);
  for (const [master, runtime] of [
    ['art-source/visual-rebirth/levels/07/aether-echo-cemetery-master.png', 'assets/aether_echo_cemetery_background_v1.webp'],
    ['art-source/visual-rebirth/levels/08/aether-phantom-threshold-master.png', 'assets/aether_phantom_threshold_background_v1.webp']
  ]) {
    assert.ok((await readFile(join(root, master))).byteLength > (await readFile(join(root, runtime))).byteLength);
  }
});

test('Titan Omega and final Chronos collapse use authored classic backgrounds', async () => {
  const src = await text('src/game/06-world-rendering.js');
  assert.match(src, /!N7_CAMPAIGN && currentLevel === 8 && spriteReady\(SPRITES\.titanGraveyardBackground\)/);
  assert.match(src, /!N7_CAMPAIGN && currentLevel === 9 && spriteReady\(SPRITES\.chronosCollapseBackground\)/);
  for (const [master, runtime] of [
    ['art-source/visual-rebirth/levels/09/titan-omega-graveyard-master.png', 'assets/titan_omega_graveyard_background_v1.webp'],
    ['art-source/visual-rebirth/levels/10/chronos-collapse-master.png', 'assets/chronos_collapse_background_v1.webp']
  ]) {
    assert.ok((await readFile(join(root, master))).byteLength > (await readFile(join(root, runtime))).byteLength);
  }
});

test('level one shockwave retains a graphical fallback while the atlas loads', async () => {
  const src = await text('src/game/06-world-rendering.js');
  const a = src.indexOf('if (!N7_CAMPAIGN && currentLevel === 0 && levelOneShockwave > 0)');
  const b = src.indexOf('if (stormPulse > 0)', a);
  assert.ok(a > 0 && b > a);
  const snippet = src.slice(a, b);
  assert.match(snippet, /spriteReady\(SPRITES\.shieldEffect\)/);
  assert.match(snippet, /ctx\.drawImage\(SPRITES\.shieldEffect/);
  assert.doesNotMatch(snippet, /for \(let index = 0; index < 18; index\+\+\)/);
  assert.match(snippet, /ctx\.globalAlpha = strength \* 0\.62/);
});

test('visual pass does not change collision model or native bundle identifier', async () => {
  const cfg = await text('capacitor.config.ts');
  const game = await text('src/game/04-entities-collision-damage.js');
  assert.match(cfg, /com\.adonay\.neoncatcher/);
  assert.match(game, /SHIP_COLLISION_OUTLINE|collision/i);
});
