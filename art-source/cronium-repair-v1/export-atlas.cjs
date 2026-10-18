/* Technical atlas export only: original illustration was produced by image_gen.
 * No geometry or painted substitutes are generated here. Remove almost-invisible
 * alpha <= 2/255, align luminous centers, retain the complete illustrated corona,
 * scale down and pack four padded runtime cells. Original master is untouched.
 */
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const dir = __dirname;
const repository = path.resolve(dir, '../..');
const input = path.join(dir, 'masters/cronium_energy_atlas_generated_v2.png');
const output = path.join(repository, 'assets/cronium_energy_atlas_v2.webp');
const frameSize = 256;
const padding = 32;
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

async function main() {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== 1254 || info.height !== 1254) throw new Error('Unexpected original source dimensions');
  const sourceCell = 627;
  const frames = [];
  for (let frame = 0; frame < 4; frame += 1) {
    const sourceX = (frame % 2) * sourceCell;
    const sourceY = Math.floor(frame / 2) * sourceCell;
    const pixels = Buffer.alloc(sourceCell * sourceCell * 4);
    let weightSum = 0; let centerXSum = 0; let centerYSum = 0;
    let left = sourceCell; let right = 0; let top = sourceCell; let bottom = 0;
    for (let y = 0; y < sourceCell; y += 1) {
      for (let x = 0; x < sourceCell; x += 1) {
        const source = ((sourceY + y) * info.width + sourceX + x) * 4;
        const target = (y * sourceCell + x) * 4;
        if (data[source + 3] <= 2) continue;
        data.copy(pixels, target, source, source + 4);
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
        const luminance = (data[source] + data[source + 1] + data[source + 2]) / 3;
        const weight = Math.max(0, luminance - 220) ** 3 * (data[source + 3] / 255);
        weightSum += weight; centerXSum += x * weight; centerYSum += y * weight;
      }
    }
    const centerX = Math.round(centerXSum / weightSum);
    const centerY = Math.round(centerYSum / weightSum);
    const radius = Math.ceil(Math.max(centerX - left, right - centerX, centerY - top, bottom - centerY)) + 8;
    const diameter = radius * 2;
    const canvasSize = Math.max(sourceCell, diameter);
    const centeredCanvas = await sharp({ create: { width: canvasSize * 2, height: canvasSize * 2, channels: 4, background: transparent } })
      .composite([{ input: pixels, raw: { width: sourceCell, height: sourceCell, channels: 4 }, left: canvasSize - centerX, top: canvasSize - centerY }])
      .png().toBuffer();
    const aligned = await sharp(centeredCanvas)
      .extract({ left: canvasSize - radius, top: canvasSize - radius, width: diameter, height: diameter })
      .resize(frameSize - padding * 2, frameSize - padding * 2, { kernel: 'lanczos3' })
      .extend({ top: padding, bottom: padding, left: padding, right: padding, background: transparent })
      .png().toBuffer();
    const filename = `frames/cronium_energy_${String(frame).padStart(2, '0')}.png`;
    fs.writeFileSync(path.join(dir, filename), aligned);
    frames.push({ frame, sourceCell: { x: sourceX, y: sourceY, width: sourceCell, height: sourceCell }, sourceLuminousCenter: { x: centerX, y: centerY }, sourceAlphaBounds: { left, top, right, bottom }, normalizationRadius: radius, file: filename, sha256: sha256(aligned) });
  }
  const atlas = await sharp({ create: { width: frameSize * 2, height: frameSize * 2, channels: 4, background: transparent } })
    .composite(frames.map((frame) => ({ input: path.join(dir, frame.file), left: (frame.frame % 2) * frameSize, top: Math.floor(frame.frame / 2) * frameSize })))
    .png().toBuffer();
  fs.writeFileSync(path.join(dir, 'masters/cronium_energy_atlas_normalized_v2.png'), atlas);
  await sharp(atlas).webp({ quality: 90, alphaQuality: 100, effort: 6, smartSubsample: true }).toFile(output);
  const exportBuffer = fs.readFileSync(output);
  const metadata = { id: 'cronium_energy_atlas_v2', version: 2, output: 'assets/cronium_energy_atlas_v2.webp', width: 512, height: 512, columns: 2, rows: 2, frameCount: 4, frameWidth: frameSize, frameHeight: frameSize, pivot: { x: 128, y: 128, normalizedX: 0.5, normalizedY: 0.5 }, transparentPadding: padding, decodedRGBABytes: 512 * 512 * 4, bytes: exportBuffer.length, sha256: sha256(exportBuffer), suggestedAnimation: { fps: 8, loop: true, frames: [0, 1, 2, 3], actualStates: ['rising-spiral', 'outward-curl', 'rolling-crescent', 'gathered-pulse'] }, frames, artisticAcceptance: 'PENDING_OWNER', physicalDeviceQA: 'PENDING', runtimeIntegration: 'PENDING_INTEGRATOR' };
  fs.writeFileSync(path.join(dir, 'atlas.json'), JSON.stringify(metadata, null, 2) + '\n');
  console.log(JSON.stringify({ file: metadata.output, dimensions: [512, 512], bytes: metadata.bytes, sha256: metadata.sha256, decodedRGBABytes: metadata.decodedRGBABytes }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
