import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));

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
