// Real Chromium service-worker/offline check. No game-source hooks, request
// routing, inserted entities, unlocked levels or altered storage/progression.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {startStaticServer, prepareEvidence, saveEvidence, sha256, errorText} = require('./browser-qa-helpers.cjs');
const {values} = parseArgs({options: {root: {type: 'string'}, output: {type: 'string'}, timeout: {type: 'string'}}});
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output || 'docs/production-reports/evidence/ci-ship-precache/offline-01');
const timeout = Number(values.timeout || 90000);
const active = ['player_ship_identity_v1.webp', 'ship_modular_atlas_v1.webp', 'comet_flight_atlas_v2.webp'];
const retired = /(?:\/ship_frame_\d\d\.webp|\/comet_animation_sheet_v1\.webp)(?:\?|$)/;
const started = Date.now();
const report = {status: 'running', exitCode: null, startedAt: new Date().toISOString(), command: process.argv,
  sourceRoot: root, cases: [], errors: [], consoleErrors: [], failedRequests: [], retiredRequests: [], screenshots: [], incidentalBrowserRequests: [],
  limits: ['Real Chromium with native service workers and browser-context offline mode; not Safari or physical iPhone.',
    'Fresh browser context and fresh offline pages; HTTP cache disabled using CDP. Worker CacheStorage remains enabled.',
    'Canvas drawImage and RAF wrappers observe and call through unchanged; no game source or simulation hooks.',
    'Only the naturally unlocked first level is launched through each campaign UI. This is not a full-level balance test.',
    'Pause checks use the real overlay, disabled fire and unchanged HUD values; no private simulation state is read.',
    'An undeclared /favicon.ico probe by Chromium is recorded separately; it is not a requested game resource.']};
let browser, context, server, evidenceReady = false;
const save = () => saveEvidence(output, report);
async function waitAsync(page, predicate, argument, milliseconds = timeout) {
  const end = Date.now() + milliseconds;
  while (Date.now() < end) {
    if (await page.evaluate(predicate, argument)) return;
    await page.waitForTimeout(100);
  }
  throw new Error(`Asynchronous browser predicate timed out after ${milliseconds} ms`);
}
async function packageFiles(directory, relative = '') {
  const result = {};
  for (const entry of await fs.readdir(path.join(directory, relative), {withFileTypes: true})) {
    const file = path.join(relative, entry.name);
    if (entry.isDirectory()) Object.assign(result, await packageFiles(directory, file));
    else {const bytes = await fs.readFile(path.join(directory, file)); result[file] = {bytes: bytes.length, sha256: sha256(bytes)};}
  }
  return result;
}
async function step(name, action) {
  const entry = {name, status: 'running'}, before = Date.now(); report.cases.push(entry); await save();
  console.log(`[ship offline] ${name}`);
  try {entry.result = await action(); entry.status = 'passed';}
  catch (error) {entry.status = 'failed'; entry.error = errorText(error); throw error;}
  finally {entry.durationMs = Date.now() - before; await save();}
}
function assertClean() {
  assert.deepEqual(report.errors, [], 'Uncaught JavaScript errors');
  assert.deepEqual(report.consoleErrors, [], 'Browser console errors');
  assert.deepEqual(report.failedRequests, [], 'Failed visible-page requests or HTTP errors');
  assert.deepEqual(report.retiredRequests, [], 'Retired ship/comet requested during normal play');
}
async function newPage() {
  const page = await context.newPage(); page.setDefaultTimeout(timeout);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', {cacheDisabled: true});
  page.on('pageerror', error => report.errors.push(errorText(error)));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const entry = {text: message.text(), location: message.location()};
    if (/\/favicon\.ico$/.test(entry.location.url || '') && /404/.test(entry.text)) report.incidentalBrowserRequests.push(entry);
    else report.consoleErrors.push(entry);
  });
  page.on('request', request => {if (retired.test(new URL(request.url()).pathname)) report.retiredRequests.push(request.url());});
  page.on('requestfailed', request => report.failedRequests.push({url: request.url(), error: request.failure()?.errorText}));
  page.on('response', response => {if (response.status() >= 400) report.failedRequests.push({url: response.url(), status: response.status()});});
  return page;
}
async function capture(page, file) {
  await page.screenshot({path: path.join(output, file)});
  report.screenshots.push({file, type: 'authentic running Chromium viewport'}); await save();
}
const inspect = page => page.evaluate(() => ({
  online: navigator.onLine, controller: navigator.serviceWorker.controller?.scriptURL,
  draw: JSON.parse(JSON.stringify(window.__SHIP_OFFLINE_OBSERVER__.draw)),
  raf: {frames: window.__SHIP_OFFLINE_OBSERVER__.raf.frames, maximum: window.__SHIP_OFFLINE_OBSERVER__.raf.maximum,
    pending: window.__SHIP_OFFLINE_OBSERVER__.raf.pending.size, errors: window.__SHIP_OFFLINE_OBSERVER__.raf.errors},
  hud: Object.fromEntries(['score', 'goal', 'hull', 'ammo'].map(id => [id, document.getElementById(id)?.textContent?.trim() || null]))
}));

async function launchOfflineCampaign(name, expectedLevels) {
  const page = await newPage();
  await page.goto(server.url, {waitUntil: 'load'});
  assert.equal(await page.evaluate(() => navigator.onLine), false);
  if (name === 'n7') {
    await page.locator('#qaArchive summary').click();
    assert.equal(await page.locator('#unlock').isChecked(), false, 'Do not unlock or seed historical progression');
    await page.locator('#n7link').click();
  } else await page.locator('#classiclink').click();
  await page.locator('#levels').click();
  assert.equal(await page.locator('#levelGrid button').count(), expectedLevels);
  assert.equal(await page.locator('#levelGrid button:not(:disabled)').count(), 1, 'Fresh context must keep normal progression');
  await page.locator('#levelGrid button').first().click();
  await page.locator('#launch').click();
  await page.waitForFunction(() => {
    const audit = window.__SHIP_OFFLINE_OBSERVER__;
    return !document.querySelector('#menu')?.classList.contains('show') &&
      audit.draw['ship_modular_atlas_v1.webp']?.mainCanvas >= 24 && audit.raf.frames >= 12;
  }, undefined, {timeout});
  await page.locator('#fire').waitFor({state: 'visible'});
  assert.equal(await page.locator('#fire').isDisabled(), false);
  const before = await inspect(page);
  assert.equal(before.online, false);
  assert.ok(before.controller.endsWith('/juego/sw.js'), 'Game must be controlled by the actual game worker');
  assert.ok(before.draw['ship_modular_atlas_v1.webp'].mainCanvas >= 24, 'Real ship component atlas was not drawn on the gameplay canvas');
  assert.equal(before.raf.maximum, 1, 'Only the existing main RAF may own animation');
  assert.deepEqual(before.raf.errors, []);
  const pixels = await page.evaluate(() => {
    const canvas = document.querySelector('#canvas'), data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    const samples = new Set();
    for (let index = 0; index < data.length; index += Math.max(4, Math.floor(data.length / 2048 / 4) * 4)) samples.add(`${data[index]},${data[index + 1]},${data[index + 2]}`);
    return {width: canvas.width, height: canvas.height, distinctSampleColors: samples.size};
  });
  assert.ok(pixels.width > 0 && pixels.height > 0 && pixels.distinctSampleColors > 20, 'Gameplay canvas is empty or uniformly filled');
  await capture(page, `offline-${name}-playing.png`);
  await page.locator('#pause').click();
  await page.locator('#paused.show').waitFor({state: 'visible'});
  assert.equal(await page.locator('#fire').isDisabled(), true);
  const paused = await inspect(page);
  await page.waitForFunction(frames => window.__SHIP_OFFLINE_OBSERVER__.raf.frames >= frames + 5, paused.raf.frames);
  const pausedAfter = await inspect(page);
  assert.deepEqual(pausedAfter.hud, paused.hud, 'HUD changed while paused');
  assert.equal(pausedAfter.raf.maximum, 1); assert.deepEqual(pausedAfter.raf.errors, []);
  await capture(page, `offline-${name}-paused.png`);
  await page.locator('#resume').click(); await page.locator('#paused.show').waitFor({state: 'hidden'});
  assert.equal(await page.locator('#fire').isDisabled(), false);
  assertClean();
  await page.close();
  return {campaign: name, levelCards: expectedLevels, unlocked: 1, before, pixels, paused, pausedAfter, resumed: true};
}

(async () => {
  await prepareEvidence(output); evidenceReady = true;
  report.git = {commit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], {encoding: 'utf8'}).trim(),
    status: execFileSync('git', ['status', '--porcelain'], {encoding: 'utf8'}).trim()};
  report.buildInfo = JSON.parse(await fs.readFile(path.join(root, 'build-info.json'), 'utf8'));
  report.packageBefore = await packageFiles(root);
  report.harness = {path: 'scripts/ship-offline-browser-smoke.cjs', sha256: sha256(await fs.readFile(__filename))};
  await fs.copyFile(__filename, path.join(output, 'used-harness.cjs'));
  server = await startStaticServer(root);
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']});
  report.browser = browser.version();
  context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, serviceWorkers: 'allow'});
  await context.addInitScript(() => {
    const audit = window.__SHIP_OFFLINE_OBSERVER__ = {draw: {}, raf: {frames: 0, maximum: 0, pending: new Set(), errors: []}};
    const drawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(image, ...arguments_) {
      const answer = Reflect.apply(drawImage, this, [image, ...arguments_]);
      const file = image?.src?.split('/').at(-1)?.split('?')[0];
      if (file) {
        const record = audit.draw[file] ||= {total: 0, mainCanvas: 0}; record.total++;
        if (this.canvas?.id === 'canvas') record.mainCanvas++;
      }
      return answer;
    };
    const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => {
      const id = request(time => {
        audit.raf.pending.delete(id); audit.raf.frames++;
        try {callback(time);} catch (error) {audit.raf.errors.push(error.stack || String(error)); throw error;}
      });
      audit.raf.pending.add(id); audit.raf.maximum = Math.max(audit.raf.maximum, audit.raf.pending.size); return id;
    };
    window.cancelAnimationFrame = id => {audit.raf.pending.delete(id); return cancel(id);};
  });
  const online = await newPage();
  await step('install native launcher/game workers; verify current artwork cache bytes and exclude retired artwork', async () => {
    await online.goto(server.url, {waitUntil: 'load'});
    await online.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.endsWith('/launcher-sw.js'));
    await online.locator('#classiclink').click();
    await online.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.endsWith('/juego/sw.js'));
    await waitAsync(online, async files => {
      const keys = await caches.keys();
      if (keys.filter(key => key.startsWith('neon-preview')).length !== 2) return false;
      for (const file of files) if (!await caches.match(new URL(`assets/${file}`, location.href))) return false;
      return true;
    }, active);
    const state = await online.evaluate(async files => {
      const snapshots = [];
      for (const name of await caches.keys()) {
        const cache = await caches.open(name), entries = [];
        for (const request of await cache.keys()) {
          const item = {url: request.url};
          if (files.some(file => new URL(request.url).pathname.endsWith(`/assets/${file}`))) {
            const response = await cache.match(request), bytes = await response.arrayBuffer();
            item.status = response.status; item.bytes = bytes.byteLength;
            item.sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
          }
          entries.push(item);
        }
        snapshots.push({name, entries});
      }
      return {registrations: (await navigator.serviceWorker.getRegistrations()).map(item => ({scope: item.scope, active: item.active?.scriptURL, state: item.active?.state})), caches: snapshots};
    }, active);
    assert.equal(state.registrations.length, 2); assert.ok(state.registrations.every(item => item.state === 'activated'));
    for (const cache of state.caches) {
      assert.equal(cache.entries.filter(entry => retired.test(new URL(entry.url).pathname)).length, 0, 'Retired artwork entered native precache');
      const expected = cache.name.startsWith('neon-preview-launcher-') ? [active[0]] : active;
      for (const file of expected) {
        const entry = cache.entries.find(item => new URL(item.url).pathname.endsWith(`/assets/${file}`));
        assert.ok(entry, `${file} missing from ${cache.name}`);
        const disk = report.packageBefore[`juego/assets/${file}`];
        assert.equal(entry.status, 200); assert.equal(entry.bytes, disk.bytes); assert.equal(entry.sha256, disk.sha256);
      }
    }
    assertClean(); await online.close(); await context.setOffline(true);
    return state;
  });
  await step('fresh offline launcher decodes the current portrait without HTTP cache', async () => {
    const page = await newPage(); await page.goto(server.url, {waitUntil: 'load'});
    await page.waitForFunction(() => {
      const image = document.querySelector('.hero img');
      return image?.complete && image.naturalWidth === 512 && image.naturalHeight === 640;
    });
    const image = await page.locator('.hero img').evaluate(async element => {
      await element.decode();
      return {src: element.currentSrc, width: element.naturalWidth, height: element.naturalHeight,
        online: navigator.onLine, controller: navigator.serviceWorker.controller?.scriptURL};
    });
    assert.equal(image.online, false); assert.ok(image.src.endsWith('/assets/player_ship_identity_v1.webp'));
    assert.ok(image.controller.endsWith('/launcher-sw.js'));
    await capture(page, 'offline-launcher-portrait.png'); assertClean(); await page.close(); return image;
  });
  await step('fresh offline classic page launches level one and renders the real modular ship; pause/resume', () => launchOfflineCampaign('classic', 10));
  await step('fresh offline historical N-7 page launches route one and renders the same modular ship; pause/resume', () => launchOfflineCampaign('n7', 100));
  assertClean(); report.status = 'passed'; report.exitCode = 0;
})().catch(error => {report.status = 'failed'; report.exitCode = 1; report.error = errorText(error); process.exitCode = 1;})
  .finally(async () => {
    if (evidenceReady) {
      try {report.packageAfter = await packageFiles(root); assert.deepEqual(report.packageAfter, report.packageBefore); report.packageUnchanged = true;}
      catch (error) {report.status = 'failed'; report.exitCode = 1; report.error ||= errorText(error); process.exitCode = 1;}
    }
    report.durationMs = Date.now() - started;
    report.checksPassed = report.cases.filter(item => item.status === 'passed').length;
    report.checksFailed = report.cases.filter(item => item.status === 'failed').length;
    if (server) report.httpRequests = server.requests;
    await context?.close(); await browser?.close(); await server?.close();
    if (evidenceReady) await save();
    console.log(JSON.stringify({status: report.status, exitCode: report.exitCode, durationMs: report.durationMs,
      checksPassed: report.checksPassed, checksFailed: report.checksFailed, error: report.error, output}));
  });
