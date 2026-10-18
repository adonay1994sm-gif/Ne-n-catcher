// Chromium asset decode and Canvas composition check, deliberately separate from gameplay QA.
const {chromium} = require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

(async () => {
  const runtime = path.resolve(__dirname, '../../../assets/arcade_pulse_atlas_v2.webp');
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
      let transparentPixelCount = 0, maximumCellBorderAlpha = 0;
      for (let y = 0; y < 1024; y++) for (let x = 0; x < 1024; x++) {
        const alpha = raw[(y * 1024 + x) * 4 + 3];
        if (!alpha) transparentPixelCount++;
        if (x % 256 === 0 || x % 256 === 255 || y % 256 === 0 || y % 256 === 255) {
          maximumCellBorderAlpha = Math.max(maximumCellBorderAlpha, alpha);
        }
      }
      context.globalCompositeOperation = 'destination-over';
      context.fillStyle = '#050b16';
      context.fillRect(0, 0, 1024, 1024);
      const composed = context.getImageData(0, 0, 1024, 1024).data;
      let unexpectedlyVisibleTransparentPixels = 0;
      for (let offset = 0; offset < raw.length; offset += 4) {
        if (raw[offset + 3] === 0 && (composed[offset] !== 5 || composed[offset + 1] !== 11 ||
          composed[offset + 2] !== 22 || composed[offset + 3] !== 255)) unexpectedlyVisibleTransparentPixels++;
      }
      return {naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
        transparentPixelCount, maximumCellBorderAlpha, unexpectedlyVisibleTransparentPixels};
    }, `data:image/webp;base64,${bytes.toString('base64')}`);
    if (result.maximumCellBorderAlpha || result.unexpectedlyVisibleTransparentPixels) {
      throw new Error('Arcade pulse atlas has visible pixels at a cell border or transparency composition failure');
    }
    await page.screenshot({path: path.join(__dirname, 'arcade-pulse-chromium-composited.png')});
    const report = {kind: 'asset-decoder-check-not-gameplay', checkedAt: new Date().toISOString(),
      browser: browser.version(), runtime: 'assets/arcade_pulse_atlas_v2.webp',
      sha256: createHash('sha256').update(bytes).digest('hex'), background: '#050b16',
      outcome: 'PASS', ...result};
    fs.writeFileSync(path.join(__dirname, 'arcade-pulse-browser-validation.json'), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report));
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
