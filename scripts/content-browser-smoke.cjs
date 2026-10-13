// Local-only smoke test. Requires Playwright 1.62.1 and a Chromium installation.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/continuity-100/evidence/block-02/browser');
const mime = {'.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.map': 'application/json'};

async function main() {
  await fs.mkdir(output, {recursive: true});
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root + path.sep) && file !== root) { response.writeHead(403).end(); return; }
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      response.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'});
      response.end(await fs.readFile(file));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const results = [];
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
    for (const profile of [
      {name: '390x844', width: 390, height: 844, dpr: 3},
      {name: '320x568', width: 320, height: 568, dpr: 2},
      {name: '844x390', width: 844, height: 390, dpr: 3}
    ]) {
      const context = await browser.newContext({viewport: {width: profile.width, height: profile.height},
        deviceScaleFactor: profile.dpr, isMobile: true, hasTouch: true, serviceWorkers: 'block'});
      const result = {profile, errors: [], failedRequests: []};
      results.push(result);
      const page = await context.newPage();
      page.on('pageerror', error => result.errors.push(error.stack || error.message));
      page.on('requestfailed', request => result.failedRequests.push(request.url()));
      page.on('response', response => { if (response.status() >= 400) result.failedRequests.push(`${response.status()} ${response.url()}`); });
      await page.addInitScript(() => {
        localStorage.setItem('neon-n7-unlocked-v1', '100');
        const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
        const audit = window.__RAF_AUDIT__ = {pending: new Set(), maximum: 0, frames: 0, first: null, last: null};
        window.requestAnimationFrame = callback => {
          const id = request(now => {
            audit.pending.delete(id); audit.frames++; audit.first ??= now; audit.last = now;
            callback(now);
          });
          audit.pending.add(id); audit.maximum = Math.max(audit.maximum, audit.pending.size); return id;
        };
        window.cancelAnimationFrame = id => { audit.pending.delete(id); cancel(id); };
      });
      // Read-only inspection inserted into the response, never into shipped game.js.
      await page.route('**/game.js?*', async route => {
        const response = await route.fetch();
        const source = await response.text();
        const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
        assert.ok(source.includes(marker));
        const hook = `window.__GAME_QA__ = () => ({state,hull,ammo,currentLevel,playerX:player.x,
          target:player.target,W,H,elapsed,entityCount:items.length,
          directorTime:encounterDirector?.elapsed,reproduction:encounterDirector?.reproduction});\n`;
        await route.fulfill({response, body: source.replace(marker, hook + marker)});
      });
      await page.goto(origin + '/www/?campaign=n7', {waitUntil: 'networkidle'});
      await page.click('#levels');
      assert.equal(await page.locator('#levelGrid button').count(), 100);
      await page.locator('#levelGrid button').nth(36).click();
      await page.click('#launch');
      await page.waitForTimeout(2100);
      const canvas = await page.locator('#canvas').boundingBox();
      await page.touchscreen.tap(canvas.x + canvas.width * .30, canvas.y + canvas.height * .60);
      await page.waitForTimeout(200);
      const mapped = await page.evaluate(() => __GAME_QA__());
      assert.ok(Math.abs(mapped.target - mapped.W * .30) < 2, 'Touch mapping mismatch');
      await page.click('#fire');
      await page.waitForTimeout(2500);
      result.game = await page.evaluate(() => __GAME_QA__());
      assert.deepEqual(result.errors, [], 'The live game must not throw before lifecycle checks');
      assert.equal(result.game.currentLevel, 36);
      assert.ok(result.game.directorTime > 0);
      const fire = await page.locator('#fire').boundingBox();
      assert.ok(fire && fire.y >= 0 && fire.y + fire.height <= profile.height + 1, 'Fire control outside viewport');
      await page.screenshot({path: path.join(output, profile.name + '.png')});
      await page.click('#pause');
      const paused = await page.evaluate(() => __GAME_QA__());
      await page.waitForTimeout(400);
      assert.equal((await page.evaluate(() => __GAME_QA__())).directorTime, paused.directorTime);
      await page.click('#resume');
      await page.waitForFunction(time => __GAME_QA__().state === 'playing' && __GAME_QA__().directorTime > time,
        paused.directorTime, {timeout: 5000});
      assert.ok((await page.evaluate(() => __GAME_QA__())).directorTime > paused.directorTime);
      await page.click('#pause'); await page.click('#restart');
      assert.equal((await page.evaluate(() => __GAME_QA__())).reproduction.seed, result.game.reproduction.seed);
      result.raf = await page.evaluate(() => {
        const a = __RAF_AUDIT__;
        return {maxPending: a.maximum, pending: a.pending.size, frames: a.frames,
          measuredSeconds: (a.last - a.first) / 1000};
      });
      assert.equal(result.raf.maxPending, 1);
      assert.deepEqual(result.errors, []); assert.deepEqual(result.failedRequests, []);
      await context.close();
    }
    const page = await browser.newPage();
    await page.goto(origin + '/www/');
    const nativePaths = [
      'AppIcon.appiconset/AppIcon-512@2x.png', 'Splash.imageset/splash-2732x2732.png',
      'Splash.imageset/splash-2732x2732-1.png', 'Splash.imageset/splash-2732x2732-2.png'
    ];
    const nativeDecode = await page.evaluate(async paths => Promise.all(paths.map(async suffix => {
      const image = new Image(); image.src = '/ios/App/App/Assets.xcassets/' + suffix;
      await image.decode(); return {path: suffix, width: image.naturalWidth, height: image.naturalHeight};
    })), nativePaths);
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({
      browser: browser.version(), note: 'Chromium emulation; physical Safari and sustained performance remain untested',
      profiles: results, nativeDecode
    }, null, 2) + '\n');
    console.log(JSON.stringify({profilesPassed: results.length, nativeImagesDecoded: nativeDecode.length}));
  } catch (error) {
    await fs.writeFile(path.join(output, 'failure.json'), JSON.stringify({error: error.stack, profiles: results}, null, 2) + '\n');
    throw error;
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
