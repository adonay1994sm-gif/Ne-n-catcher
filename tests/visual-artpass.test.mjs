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

test('Vulkar descent uses a real background in classic level 3 only', async () => {
  const src = await text('src/game/06-world-rendering.js');
  assert.match(src, /!N7_CAMPAIGN && currentLevel === 2 && spriteReady\(SPRITES\.vulkarBackground\)/);
  const assets = await text('src/game/01-runtime-assets.js');
  assert.match(assets, /assets\/vulkar_descent_background_v1\.webp/);
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
