// Offline export only. The runtime reads the compact atlas and its metadata.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(directory, '../../..');
const master = path.join(directory, 'ch02-master-v2.png');
const runtime = path.join(project, 'assets/ch02_interceptor_atlas_v1.webp');
const temporary = mkdtempSync(path.join(tmpdir(), 'neon-ch02-export-'));
const sha256 = value => createHash('sha256').update(value).digest('hex');
// The generated master is 1254 px, so its painted rows are registered explicitly.
// Repacking uses a single scale per sprite; no mirroring, invented poses or repainting.
const rows = [{y: 32, height: 306}, {y: 329, height: 294},
  {y: 624, height: 298}, {y: 926, height: 302}];
const frames = [];
try {
  for (let index = 0; index < 16; index++) {
    const column = index % 4, row = Math.floor(index / 4);
    const x = Math.round(column * 1254 / 4), endX = Math.round((column + 1) * 1254 / 4);
    const sourceRect = {x, y: rows[row].y, width: endX - x, height: rows[row].height};
    const image = path.join(temporary, `frame-${String(index).padStart(2, '0')}.png`);
    execFileSync('magick', [master, '-crop', `${sourceRect.width}x${sourceRect.height}+${sourceRect.x}+${sourceRect.y}`,
      '+repage', '-resize', '224x224', '-background', 'none', '-gravity', 'center', '-extent', '256x256', image]);
    const rgba = execFileSync('magick', [image, '-depth', '8', 'rgba:-']);
    let minX = 256, minY = 256, maxX = -1, maxY = -1, edgeAlpha = 0;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const alpha = rgba[(y * 256 + x) * 4 + 3];
      if (alpha) {minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);}
      if (!x || !y || x === 255 || y === 255) edgeAlpha = Math.max(edgeAlpha, alpha);
    }
    frames.push({index, stateRow: ['navigation', 'attack', 'damage', 'destroy'][row], sourceRect,
      rect: {x: column * 256, y: row * 256, width: 256, height: 256},
      rgbaSha256: sha256(rgba), alphaBounds: {minX, minY, maxX, maxY}, maximumBorderAlpha: edgeAlpha});
  }
  const rowFiles = [];
  for (let row = 0; row < 4; row++) {
    const output = path.join(temporary, `row-${row}.png`);
    execFileSync('magick', [...Array.from({length: 4}, (_, column) =>
      path.join(temporary, `frame-${String(row * 4 + column).padStart(2, '0')}.png`)), '+append', output]);
    rowFiles.push(output);
  }
  execFileSync('magick', [...rowFiles, '-append', '-define', 'webp:method=6',
    '-define', 'webp:alpha-quality=100', '-quality', '86', runtime]);
  copyFileSync(runtime, path.join(directory, 'ch02-atlas-v1.webp'));
  execFileSync('magick', [runtime, '-background', '#07182D', '-alpha', 'remove', '-alpha', 'off',
    '-quality', '90', path.join(directory, 'ch02-contact-sheet-dark.jpg')]);
  const animation = (indices, durations, extra = {}) => ({frames: indices, durationMs: durations,
    loop: false, locked: true, ...extra});
  const metadata = {
    schemaVersion: 1, id: 'gaia.ch02.interceptor', revision: 'ch02-art-v1', productionStatus: 'IN_REVIEW',
    technicalAcceptance: 'ASSET_AND_ANIMATOR_VALIDATED_RUNTIME_PENDING', artisticAcceptance: 'PENDING_OWNER',
    physicalAcceptance: 'PENDING', image: 'ch02-atlas-v1.webp',
    proposedRuntimeImage: 'assets/ch02_interceptor_atlas_v1.webp', master: 'ch02-master-v2.png',
    sourceHistorical: 'ch02-master-v1.png', dimensions: {width: 1024, height: 1024},
    layout: {columns: 4, rows: 4, frameWidth: 256, frameHeight: 256, frameCount: 16},
    pivot: {x: .5, y: .5}, forward: {x: 0, y: 1}, recommendedDrawSizeLogical: 108,
    transparent: true, decodedRgbaBytes: 4194304, runtimeBytes: readFileSync(runtime).length, frames,
    animations: {
      spawn: animation([0, 1], [130, 190], {next: 'idle'}),
      idle: animation([0, 1], [180, 180], {loop: true, locked: false}),
      flight: animation([1, 0], [100, 100], {loop: true, locked: false}),
      bankLeft: animation([2], [100], {loop: true, locked: false}),
      bankRight: animation([3], [100], {loop: true, locked: false}),
      attack: animation([4, 5, 6, 7], [160, 80, 90, 170], {next: 'idle',
        events: [{frameOffset: 0, name: 'charge'}, {frameOffset: 1, name: 'fire'}]}),
      hurt: animation([8, 9, 10], [65, 75, 100], {next: 'idle'}),
      damaged: animation([10, 11], [150, 150], {loop: true, locked: false}),
      destroy: animation([12, 13, 14, 15], [90, 110, 140, 200], {terminal: true,
        events: [{frameOffset: 1, name: 'coreBurst'}], completionEvent: 'removeVisual'})
    },
    transitionRules: {priority: ['destroy', 'hurt', 'attack', 'spawn', 'bankLeft', 'bankRight', 'flight', 'idle'],
      destroyCannotBeInterrupted: true, gameplayCollisionIndependentOfArt: true,
      banking: 'Use the bank pose matching actual lateral velocity; do not animate left/right while stationary.',
      fire: 'Only the returned fire event may release projectiles; the visible muzzle pose is cell 5 at 160 ms.',
      destroy: 'Remove gameplay hitbox at death; retain this visual until removeVisual, emitted once.'},
    palette: {titanium: '#E8EDF0', graphite: '#15202D', cyan: '#5CF5FF', hostile: '#B92328'},
    catalogEntries: ['gaia-ch02-move', 'gaia-ch02-attack', 'gaia-ch02-destroy'],
    provenance: {method: 'OpenAI image_gen generation and image_gen correction; ImageMagick crop/repack/WebP export',
      generatorOutputOriginal: 'exec-82980262-9067-4dce-adb2-589ed069ef5b.png',
      generatorOutputCorrection: 'exec-70db54ea-4dff-402e-b4cb-2524f0dee78d.png',
      generatedAtUtcDate: '2026-10-18', preparedAtUtcDate: '2026-10-18', prompts: 'PROVENANCE.md',
      rights: 'Original generated design for this project. Existing project CH-01 and modular player ship inspected for style; neither was submitted as a generation reference. Correction references only the first generated CH-02. No downloaded stock or copied franchise assets; legal clearance is not asserted.'},
    checksums: Object.fromEntries(['ch02-master-v1.png', 'ch02-master-v2.png', 'ch02-atlas-v1.webp']
      .map(file => [file, sha256(readFileSync(path.join(directory, file)))])),
    verificationLimits: ['Runtime integration, natural encounters and offline precache require root integration and browser QA.',
      'Artistic acceptance remains with the owner. Sixteen distinct poses are not a skeletal or high-frame-rate animation.',
      'Generative poses can have minor registration differences; source rectangles preserve the same fuselage pivot approximately.',
      'The generated master has irregular vertical spacing. Recorded source rectangles isolate each row before transparent padding.',
      'No physical iPhone or decoded GPU memory measurement has been performed.']
  };
  if (new Set(frames.map(frame => frame.rgbaSha256)).size !== 16 || frames.some(frame => frame.maximumBorderAlpha !== 0)) {
    throw new Error('CH-02 export must contain sixteen unique padded transparent frames');
  }
  writeFileSync(path.join(directory, 'ch02-atlas-v1.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(JSON.stringify({runtime, bytes: metadata.runtimeBytes, sha256: metadata.checksums['ch02-atlas-v1.webp'],
    frames: frames.length, uniqueFrames: 16, transparentBorders: true}));
} finally {rmSync(temporary, {recursive: true, force: true});}
