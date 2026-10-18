const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const atlasPath = path.join(root, 'assets/cronium_energy_atlas_v2.webp');
const hash = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

async function main() {
  const { data, info } = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 512); assert.equal(info.height, 512); assert.equal(info.channels, 4);
  const frames = [];
  for (let frame = 0; frame < 4; frame += 1) {
    const pixels = Buffer.alloc(256 * 256 * 4);
    let maximumPaddingAlpha = 0; let opaqueBlackPixels = 0; let visiblePixels = 0;
    let minimumX = 256; let minimumY = 256; let maximumX = -1; let maximumY = -1;
    for (let y = 0; y < 256; y += 1) {
      for (let x = 0; x < 256; x += 1) {
        const source = ((Math.floor(frame / 2) * 256 + y) * 512 + (frame % 2) * 256 + x) * 4;
        data.copy(pixels, (y * 256 + x) * 4, source, source + 4);
        const alpha = data[source + 3];
        if (x < 32 || x >= 224 || y < 32 || y >= 224) maximumPaddingAlpha = Math.max(maximumPaddingAlpha, alpha);
        if (alpha > 32 && Math.max(data[source], data[source + 1], data[source + 2]) < 8) opaqueBlackPixels += 1;
        if (alpha > 0) {
          visiblePixels += 1; minimumX = Math.min(minimumX, x); minimumY = Math.min(minimumY, y);
          maximumX = Math.max(maximumX, x); maximumY = Math.max(maximumY, y);
        }
      }
    }
    assert.equal(maximumPaddingAlpha, 0, `Frame ${frame}: padding contains visible color`);
    assert.equal(opaqueBlackPixels, 0, `Frame ${frame}: opaque black matte`);
    assert.ok(visiblePixels > 10000 && visiblePixels < 256 * 256 / 2, `Frame ${frame}: unexpected coverage`);
    frames.push({ frame, maximumPaddingAlpha, opaqueBlackPixels, visiblePixels, alphaBounds: { x: minimumX, y: minimumY, width: maximumX - minimumX + 1, height: maximumY - minimumY + 1 }, decodedPixelSha256: hash(pixels) });
  }
  assert.equal(new Set(frames.map((frame) => frame.decodedPixelSha256)).size, 4, 'Animation frames must genuinely differ');
  for (const [name, background] of [['black', '#05070b'], ['gray', '#6c7480'], ['white', '#ffffff']]) {
    await sharp({ create: { width: 512, height: 512, channels: 3, background } })
      .composite([{ input: atlasPath }]).png().toFile(path.join(__dirname, `qa/${name}.png`));
  }
  const sizes = [24, 32, 40, 48];
  const thumbnails = [];
  for (let row = 0; row < sizes.length; row += 1) {
    for (let frame = 0; frame < 4; frame += 1) {
      const size = sizes[row];
      const input = await sharp(atlasPath).extract({ left: (frame % 2) * 256, top: Math.floor(frame / 2) * 256, width: 256, height: 256 }).resize(size, size).png().toBuffer();
      thumbnails.push({ input, left: frame * 80 + Math.round((80 - size) / 2), top: row * 64 + Math.round((64 - size) / 2) });
    }
  }
  await sharp({ create: { width: 320, height: 256, channels: 3, background: '#05070b' } }).composite(thumbnails).png().toFile(path.join(__dirname, 'qa/native-scale-24-32-40-48.png'));
  const report = { kind: 'static-asset-export-verification', notBrowserOrGameplayQA: true, runAtUTC: new Date().toISOString(), asset: 'assets/cronium_energy_atlas_v2.webp', sha256: hash(fs.readFileSync(atlasPath)), bytes: fs.statSync(atlasPath).size, dimensions: [512, 512], decodedRGBABytes: data.length, checks: { dimensionsAndRGBA: 'PASS', fourAuthenticallyDistinctFrames: 'PASS', padding32PixelsClearEveryCell: 'PASS', noOpaqueBlackMatte: 'PASS', noFrameEdgeClipping: 'PASS', threeBackgroundCompositesWritten: 'PASS' }, frames, reviewedBackgrounds: ['black.png', 'gray.png', 'white.png'], limitations: ['No claim of runtime integration or physical iPhone testing', 'Visual owner acceptance pending', 'Source art has four distinct temporal states; transition smoothness must be evaluated in gameplay'] };
  fs.writeFileSync(path.join(__dirname, 'qa/static-asset-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ checks: 6, passed: 6, sha256: report.sha256, bytes: report.bytes, decodedRGBABytes: report.decodedRGBABytes, frames: frames.map((frame) => ({ frame: frame.frame, alphaBounds: frame.alphaBounds })) }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
