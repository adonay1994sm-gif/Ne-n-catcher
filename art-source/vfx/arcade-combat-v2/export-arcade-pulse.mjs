// Reproducible offline sprite export. No generated or painted shapes are made here.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../..');
const master = path.join(directory, 'arcade-pulse-master-v2.png');
const runtime = path.join(root, 'assets/arcade_pulse_atlas_v2.webp');
const temp = mkdtempSync(path.join(tmpdir(), 'neon-arcade-pulse-'));
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const centers = [[171, 476, 780, 1086], [171, 477, 781, 1087],
  [171, 477, 781, 1087], [171, 478, 782, 1086]];
const rows = [{y: 20, height: 320}, {y: 350, height: 270},
  {y: 620, height: 340}, {y: 975, height: 245}];
const kinds = ['pulse', 'twin', 'lance', 'impact'];
const frames = [];
try {
  for (let index = 0; index < 16; index++) {
    const row = Math.floor(index / 4), column = index % 4;
    const sourceRect = {x: centers[row][column] - 150, y: rows[row].y,
      width: 300, height: rows[row].height};
    const output = path.join(temp, `frame-${index}.png`);
    execFileSync('magick', [master, '-crop', `${sourceRect.width}x${sourceRect.height}+${sourceRect.x}+${sourceRect.y}`,
      '+repage', '-resize', '224x224', '-background', 'none', '-gravity', 'center', '-extent', '256x256', output]);
    frames.push({index, kind: kinds[row], sourceRect,
      rect: {x: column * 256, y: row * 256, width: 256, height: 256}});
  }
  const rowFiles = [];
  for (let row = 0; row < 4; row++) {
    const output = path.join(temp, `row-${row}.png`);
    execFileSync('magick', [...Array.from({length: 4}, (_, column) => path.join(temp, `frame-${row * 4 + column}.png`)),
      '+append', output]);
    rowFiles.push(output);
  }
  execFileSync('magick', [...rowFiles, '-append', '-define', 'webp:method=6',
    '-define', 'webp:alpha-quality=100', '-quality', '88', runtime]);
  copyFileSync(runtime, path.join(directory, 'arcade-pulse-atlas-v2.webp'));
  for (const frame of frames) {
    const {x, y, width, height} = frame.rect;
    const rgba = execFileSync('magick', [runtime, '-crop', `${width}x${height}+${x}+${y}`,
      '+repage', '-depth', '8', 'rgba:-']);
    let minX = 256, minY = 256, maxX = -1, maxY = -1, borderAlpha = 0;
    let brightXSum = 0, brightYSum = 0, brightCount = 0;
    for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) {
      const offset = (py * width + px) * 4;
      const [r, g, b, a] = rgba.subarray(offset, offset + 4);
      if (a) {minX = Math.min(minX, px); minY = Math.min(minY, py); maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);}
      if (!px || !py || px === width - 1 || py === height - 1) borderAlpha = Math.max(borderAlpha, a);
      if (Math.min(r, g, b) > 190 && a > 128) {brightXSum += px; brightYSum += py; brightCount++;}
    }
    Object.assign(frame, {rgbaSha256: hash(rgba), alphaBounds: {minX, minY, maxX, maxY},
      maximumBorderAlpha: borderAlpha, brightCoreCenter: {x: brightXSum / brightCount, y: brightYSum / brightCount}});
  }
  if (new Set(frames.map(frame => frame.rgbaSha256)).size !== 16 || frames.some(frame => frame.maximumBorderAlpha)) {
    throw new Error('Atlas must contain sixteen distinct frames with fully transparent borders');
  }
  const animation = (indices, ms, loop, recommendedDrawSizeLogical) => ({frames: indices, durationMs: ms,
    totalMs: ms.reduce((a, b) => a + b, 0), nominalFps: 1000 / ms[0], loop, recommendedDrawSizeLogical});
  const metadata = {
    schemaVersion: 1, id: 'combat.arcade-pulse.v2', revision: 'arcade-pulse-v2', status: 'IN_REVIEW',
    technicalAcceptance: 'ASSET_EXPORT_VALIDATED_GAMEPLAY_PENDING', artisticAcceptance: 'PENDING_OWNER',
    physicalAcceptance: 'PENDING', runtime: 'assets/arcade_pulse_atlas_v2.webp',
    master: 'arcade-pulse-master-v2.png', masterDimensions: {width: 1254, height: 1254},
    dimensions: {width: 1024, height: 1024}, layout: {columns: 4, rows: 4, frameWidth: 256, frameHeight: 256},
    pivot: {x: .5, y: .5}, forward: {x: 0, y: -1}, transparent: true,
    decodedRgbaBytes: 4194304, runtimeBytes: readFileSync(runtime).length, frames,
    animations: {
      pulse: animation([0, 1, 2, 3], [60, 60, 60, 60], true, 72),
      twin: animation([4, 5, 6, 7], [50, 50, 50, 50], true, 72),
      lance: animation([8, 9, 10, 11], [55, 55, 55, 55], true, 88),
      impact: animation([12, 13, 14, 15], [35, 55, 75, 95], false, 42)
    },
    playback: {clock: 'Use elapsed age from the existing projectile/impact update; no new RAF or timers.',
      orientation: 'Artwork points up. Do not rotate for the default ascending shot; atan2(vy,vx)+PI/2 only for nonvertical paths.',
      anchoring: 'Logical collision position and illustrated projectile center share x/y. All square atlas cells use normalized pivot .5/.5.',
      impact: 'Play once on a real collision, then remove after 260 ms; never create a second damage event from a visual frame.'},
    provenance: {method: 'OpenAI image_gen original generation; ImageMagick registration, crop/repack and WebP export',
      generatedAtUtcDate: '2026-10-18', sourceOutput: 'exec-f53f3c9a-3a21-49ee-8eaf-3a7539a3607d.png',
      styleReferencesInspected: ['assets/chronos_flight_weapons_v1.webp', 'assets/atlas_combat_vfx_v1.webp'],
      generationReferenceImagesSubmitted: [], prompt: 'PROVENANCE.md',
      rights: 'Original effects generated for this project using the available image_gen tool. No third-party stock, purchased licenses or copied franchise assets. Legal clearance is not asserted.'},
    hashes: {masterSha256: hash(readFileSync(master)), runtimeSha256: hash(readFileSync(runtime))},
    verificationLimits: ['Not a gameplay capture; runtime loader, combat alignment and effects must be integrated and verified separately.',
      'Generated core and glow vary by pose; exact geometric registration is approximate and the collision anchor remains code-owned.',
      'Sixteen unique illustrated poses are not a promise of skeletal interpolation or physical iPhone certification.']
  };
  writeFileSync(path.join(directory, 'arcade-pulse-atlas-v2.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  execFileSync('magick', [runtime, '-background', '#050b16', '-alpha', 'remove', '-alpha', 'off', '-quality', '92',
    path.join(directory, 'arcade-pulse-contact-sheet-dark.jpg')]);
  console.log(JSON.stringify({runtime, bytes: metadata.runtimeBytes, sha256: metadata.hashes.runtimeSha256,
    uniqueFrames: 16, transparentBorders: true,
    projectileBrightCoreCenters: frames.slice(0, 12).map(frame => ({index: frame.index, ...frame.brightCoreCenter}))}));
} finally {rmSync(temp, {recursive: true, force: true});}
