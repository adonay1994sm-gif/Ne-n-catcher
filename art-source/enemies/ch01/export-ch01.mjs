// Offline export only. Runtime code must not depend on ImageMagick.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const directory = path.dirname(fileURLToPath(import.meta.url));
const master = path.join(directory, 'ch01-master-v2.png');
const atlas = path.join(directory, 'ch01-atlas-v1.webp');
execFileSync('magick', [master, '-define', 'webp:method=6', '-define', 'webp:alpha-quality=100', '-quality', '84', atlas], { stdio: 'inherit' });
execFileSync('magick', [atlas, '-background', '#07182D', '-alpha', 'remove', '-alpha', 'off', '-resize', '768x1152', path.join(directory, 'ch01-contact-sheet-dark.jpg')], { stdio: 'inherit' });
console.log('CH-01: WebP atlas and dark review contact sheet exported from the preserved v2 master.');
