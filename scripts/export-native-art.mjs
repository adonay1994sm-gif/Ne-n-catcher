/** Offline art export. Requires ImageMagick; never runs as part of the web build. */
import {spawnSync} from 'node:child_process';
import {copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const icon = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
const splash = 'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png';
for (const [source, size, destination] of [
  ['art-source/native/app-icon-master.png', 1024, icon],
  ['art-source/native/launch-screen-master.png', 2732, splash]
]) {
  const result = spawnSync('magick', [join(root, source), '-resize', `${size}x${size}`,
    '-alpha', 'off', '+dither', '-colors', '256', '-depth', '8', '-strip',
    '-define', 'png:color-type=2', join(root, destination)], {stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Native art export failed: ${source}`);
}
for (const suffix of ['-1', '-2']) {
  await copyFile(join(root, splash), join(root, splash.replace('.png', `${suffix}.png`)));
}
console.log('Exported opaque RGB icon and all three catalog launch images.');
