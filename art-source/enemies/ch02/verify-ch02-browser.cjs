// Asset decoder check only. This is not a game capture or a natural encounter.
const {chromium} = require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

(async () => {
  const runtime = path.resolve(__dirname, '../../../assets/ch02_interceptor_atlas_v1.webp');
  const bytes = fs.readFileSync(runtime);
  const browser = await chromium.launch({executablePath: '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']});
  try {
    const page = await browser.newPage({viewport: {width: 1024, height: 1024}});
    await page.setContent('<style>html,body{margin:0;background:#050b16}canvas{display:block}</style><canvas width="1024" height="1024"></canvas>');
    const result = await page.evaluate(async source => {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.querySelector('canvas'), context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const raw = context.getImageData(0, 0, 1024, 1024).data;
      const coordinates = [[250, 340], [255, 380], [255, 450], [512, 540], [500, 540]];
      const samples = coordinates.map(([x, y]) => ({x, y,
        decodedCanvasRgba: Array.from(raw.slice((y * 1024 + x) * 4, (y * 1024 + x) * 4 + 4))}));
      const transparentPixels = [];
      for (let y = 0; y < 1024; y++) for (let x = 0; x < 1024; x++) {
        if (raw[(y * 1024 + x) * 4 + 3] === 0) transparentPixels.push(y * 1024 + x);
      }
      context.globalCompositeOperation = 'destination-over';
      context.fillStyle = '#050b16';
      context.fillRect(0, 0, 1024, 1024);
      const composited = context.getImageData(0, 0, 1024, 1024).data;
      let unexpectedTransparentPixelColor = 0;
      for (const pixel of transparentPixels) {
        const offset = pixel * 4;
        if (composited[offset] !== 5 || composited[offset + 1] !== 11 || composited[offset + 2] !== 22 ||
          composited[offset + 3] !== 255) unexpectedTransparentPixelColor++;
      }
      for (const sample of samples) {
        const offset = (sample.y * 1024 + sample.x) * 4;
        sample.compositedRgba = Array.from(composited.slice(offset, offset + 4));
      }
      return {naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
        transparentPixelCount: transparentPixels.length, unexpectedTransparentPixelColor, samples};
    }, `data:image/webp;base64,${bytes.toString('base64')}`);
    if (result.unexpectedTransparentPixelColor || result.samples.some(sample => sample.decodedCanvasRgba[3] !== 0)) {
      throw new Error('CH-02 transparent inter-cell pixels became visible in Chromium Canvas');
    }
    await page.screenshot({path: path.join(__dirname, 'ch02-chromium-composited.png')});
    const report = {kind: 'asset-decoder-check-not-gameplay', checkedAt: new Date().toISOString(),
      browser: browser.version(), runtime: 'assets/ch02_interceptor_atlas_v1.webp',
      sha256: createHash('sha256').update(bytes).digest('hex'), background: '#050b16',
      outcome: 'PASS', explanation: 'The red inter-cell streaks seen by view_image exist in RGB channels only where alpha is zero. Chromium drawImage composites every fully transparent pixel to the exact requested background.', ...result};
    fs.writeFileSync(path.join(__dirname, 'ch02-browser-validation.json'), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report));
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
