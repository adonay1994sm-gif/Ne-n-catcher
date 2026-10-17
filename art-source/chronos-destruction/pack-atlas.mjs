import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Layout/export only: all six illustrated states are from the retained generation.
// A uniform scale preserves the relative expansion of the destroyed structure.
const root = dirname(fileURLToPath(import.meta.url));
const master = join(root, 'generated-master.png');
const output = resolve(root, '../../assets/chronos_destruction_atlas_v1.webp');
const packed = join(root, 'packed-master.png');
const tileSize = 512;
const scaledSize = 400;
const scale = scaledSize / tileSize;
const reactorAnchors = [[274, 263], [259, 270], [248, 273], [267, 240], [273, 228], [250, 234]];
const scratch = mkdtempSync(join(tmpdir(), 'neon-chronos-atlas-'));
const run = args => execFileSync('magick', args, { stdio: 'inherit' });
try {
  const cells = reactorAnchors.map(([anchorX, anchorY], index) => {
    const cell = join(scratch, `cell-${index}.png`);
    const resized = join(scratch, `resized-${index}.png`);
    const x = Math.round(256 - anchorX * scale);
    const y = Math.round(256 - anchorY * scale);
    run([master, '-crop', `512x512+${index % 3 * 512}+${Math.floor(index / 3) * 512}`, '+repage',
      '-colorspace', 'sRGB', '-alpha', 'on', '-resize', `${scaledSize}x${scaledSize}!`, `PNG32:${resized}`]);
    run(['-size', '512x512', 'xc:none', resized, '-geometry', `+${x}+${y}`, '-compose', 'over', '-composite', `PNG32:${cell}`]);
    return cell;
  });
  const placements = ['-size', '1536x1024', 'xc:none'];
  cells.forEach((cell, index) => placements.push(cell, '-geometry', `+${index % 3 * 512}+${Math.floor(index / 3) * 512}`, '-compose', 'over', '-composite'));
  run([...placements, '-colorspace', 'sRGB', `PNG32:${packed}`]);
  mkdirSync(dirname(output), { recursive: true });
  run([packed, '-quality', '86', '-define', 'webp:alpha-quality=100', '-define', 'webp:method=6', output]);
  const bytes = readFileSync(output);
  process.stdout.write(JSON.stringify({ output, width: 1536, height: 1024, bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex') }, null, 2) + '\n');
} finally {
  // Only disposable files created by this invocation are removed.
  rmSync(scratch, { recursive: true, force: true });
}
