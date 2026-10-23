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

test('Chronos accident uses four authored atlas phases instead of a drawn ring', async () => {
  const src = await text('src/game/06-world-rendering.js');
  const scene = src.slice(src.indexOf('if (currentLevel === 0 && levelOneShockwave > 0)'),
    src.indexOf('if (stormPulse > 0 && !settings.reduceEffects)'));
  assert.match(scene, /SPRITES\.chronosShockwave/);
  assert.match(scene, /Math\.floor\(progress \* 4\)/);
  assert.doesNotMatch(scene, /ctx\.arc\(/);
  const atlas = await readFile(join(root, 'assets/chronos_shockwave_atlas_v1.webp'));
  assert.ok(atlas.byteLength > 100_000);
});

test('static painted backgrounds are gone: every sector sky is drawn live', async () => {
  // Orden del propietario (21/10/2026): fuera los fondos fijos; la aventura
  // se cuenta con planetas, rutas y bases vivas, no con láminas pintadas.
  const runtime = (await Promise.all(['src/game/01-runtime-assets.js', 'src/game/06-world-rendering.js',
    'styles.css', 'sw.js', 'ASSET_MANIFEST.json'].map(text))).join('\n');
  assert.doesNotMatch(runtime, /assets\/[a-z0-9_]+_background(_v1)?\.webp/);
  for (const level of [3, 4, 5, 6, 7, 8, 9]) {
    assert.doesNotMatch(await text('src/game/06-world-rendering.js'), new RegExp(`currentLevel !== ${level}\\)`));
  }
  const src = await text('src/game/06-world-rendering.js');
  assert.match(src, /if \(currentLevel === 2\) drawVulkarOrbitBackground\(\);/, 'Vulkar keeps its planet over the drawn sky');
});

test('level one shockwave retains a graphical fallback while the atlas loads', async () => {
  const src = await text('src/game/06-world-rendering.js');
  const a = src.indexOf('if (currentLevel === 0 && levelOneShockwave > 0)');
  const b = src.indexOf('if (stormPulse > 0 && !settings.reduceEffects)', a);
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
  assert.match(cfg, /com\.neoncronium/);
  assert.match(game, /SHIP_COLLISION_OUTLINE|collision/i);
});
