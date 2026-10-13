import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {ANIMATION_MAP} from '../src/game/animation/animation-map.js';

const root = fileURLToPath(new URL('..', import.meta.url));

test('every declared animation frame exists in the runtime inventory', async () => {
  const manifest = JSON.parse(await readFile(join(root, 'ASSET_MANIFEST.json'), 'utf8'));
  const available = new Set([...manifest.groups.flatMap(group => group.paths),
    ...manifest.standalone.map(item => item.path)]);
  for (const group of Object.values(ANIMATION_MAP)) {
    for (const state of Object.values(group)) {
      assert.ok(Object.isFrozen(state.frames));
      if (!state.frames.length) {
        assert.equal(state.status, 'assets-required');
        continue;
      }
      assert.ok(state.frameMs > 0);
      for (const path of state.frames) {
        assert.ok(available.has(path), `Undeclared animation frame: ${path}`);
        assert.ok((await readFile(join(root, path))).length > 0, path);
      }
    }
  }
});

test('banking mirrors the authored pose; impact cannot enter the idle loop', () => {
  const player = ANIMATION_MAP.player;
  assert.deepEqual(player.bankLeft.frames, player.bankRight.frames);
  assert.equal(player.bankLeft.flipX, false);
  assert.equal(player.bankRight.flipX, true);
  assert.ok(player.idle.frames.every(frame => !frame.endsWith('05.webp')));
  assert.equal(player.impact.loop, false);
  assert.equal(player.impact.frameMs, 320);
});

test('all iOS catalog image entries exist with the required PNG dimensions', async () => {
  const catalogs = join(root, 'ios/App/App/Assets.xcassets');
  let checked = 0;
  for (const folder of await readdir(catalogs, {withFileTypes: true})) {
    if (!folder.isDirectory()) continue;
    const catalog = JSON.parse(await readFile(join(catalogs, folder.name, 'Contents.json'), 'utf8'));
    for (const entry of catalog.images ?? []) {
      const png = await readFile(join(catalogs, folder.name, entry.filename));
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      const size = folder.name === 'AppIcon.appiconset' ? 1024 : 2732;
      assert.equal(png.readUInt32BE(16), size, entry.filename);
      assert.equal(png.readUInt32BE(20), size, entry.filename);
      assert.equal(png[25], 2, 'Native artwork must be opaque RGB PNG');
      checked++;
    }
  }
  assert.equal(checked, 4);
});
