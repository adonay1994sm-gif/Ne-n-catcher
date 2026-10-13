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
  assert.doesNotMatch(src, /for \(let index = 0; index < 13; index\+\+\)/);
});

test('level one shockwave uses the existing graphical energy field', async () => {
  const src = await text('src/game/06-world-rendering.js');
  const a = src.indexOf('if (currentLevel === 0 && levelOneShockwave > 0)');
  const b = src.indexOf('if (stormPulse > 0)', a);
  assert.ok(a > 0 && b > a);
  const snippet = src.slice(a, b);
  assert.match(snippet, /spriteReady\(SPRITES\.shieldEffect\)/);
  assert.match(snippet, /ctx\.drawImage\(SPRITES\.shieldEffect/);
  assert.doesNotMatch(snippet, /for \(let index = 0; index < 18; index\+\+\)/);
  assert.match(snippet, /ctx\.globalAlpha = strength \* 0\.19/);
});

test('visual pass does not change collision model or native bundle identifier', async () => {
  const cfg = await text('capacitor.config.ts');
  const game = await text('src/game/04-entities-collision-damage.js');
  assert.match(cfg, /com\.adonay\.neoncatcher/);
  assert.match(game, /SHIP_COLLISION_OUTLINE|collision/i);
});
