// Real same-origin Chromium upgrade from a previous package to a rebranded one.
// Only a temporary serving fixture and explicitly declared prior-save fixtures
// are written. No game-source hooks, response routing or simulation changes.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {startStaticServer, prepareEvidence, saveEvidence, sha256, errorText} = require('./browser-qa-helpers.cjs');
const {values} = parseArgs({options: {root: {type: 'string'}, previous: {type: 'string'}, output: {type: 'string'}, timeout: {type: 'string'}}});
const root = path.resolve(values.root || 'preview-dist');
const previous = path.resolve(values.previous || '/workspace/sites/neon-catcher-pruebas/dist');
const output = path.resolve(values.output || 'docs/production-reports/evidence/rebrand/browser-01');
const timeout = Number(values.timeout || 120000);
assert.ok(Number.isFinite(timeout) && timeout >= 30000 && timeout <= 180000);
assert.notEqual(root, previous, 'Current and previous packages must be different directories');
const began = Date.now();
const report = {status: 'running', exitCode: null, command: process.argv, startedAt: new Date().toISOString(),
  root, previous, cases: [], errors: [], consoleErrors: [], failedRequests: [], incidentalBrowserRequests: [],
  screenshots: [], assetResponses: [],
  limits: ['Real Chromium native service workers on a temporary same-origin HTTP copy; not an installed iPhone PWA or Safari.',
    'Previous package is read only. Current package and historical package are hashed before and after this run.',
    'Prior save data is an explicitly seeded controlled compatibility fixture, not progress earned in a natural playthrough.',
    'No source hooks, request interception, entity insertion, clock acceleration or in-flight counter changes.',
    'RAF and drawImage observers call the original functions unchanged and do not create another animation loop.',
    'Checks brand, worker upgrade, offline restart, checkpoint UI and ship rendering; not chapter balance or aesthetic acceptance.']};
let browser, context, server, temp, evidenceReady = false, offline = false;
const save = () => saveEvidence(output, report);
const bounded = (promise, milliseconds, label) => {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label)), milliseconds); })])
    .finally(() => clearTimeout(timer));
};
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
    else { const bytes = await fs.readFile(path.join(directory, file)); result[file] = {bytes: bytes.length, sha256: sha256(bytes)}; }
  }
  return result;
}
async function step(name, action) {
  const entry = {name, status: 'running', startedAt: new Date().toISOString()}, start = Date.now();
  report.cases.push(entry); await save(); console.log(`[Rebrand upgrade] ${name}`);
  try { entry.result = await action(); clean(); entry.status = 'passed'; }
  catch (error) { entry.status = 'failed'; entry.error = errorText(error); throw error; }
  finally { entry.durationMs = Date.now() - start; await save(); }
}
function clean() {
  assert.deepEqual(report.errors, [], 'JavaScript error');
  assert.deepEqual(report.consoleErrors, [], 'Browser console error');
  assert.deepEqual(report.failedRequests, [], 'Requested resource failed');
}
async function newPage() {
  const page = await context.newPage(); page.setDefaultTimeout(timeout);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', {cacheDisabled: true});
  if (offline) {
    await context.setOffline(true);
    await cdp.send('Network.emulateNetworkConditions', {offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1});
  }
  page.on('pageerror', error => report.errors.push(errorText(error)));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const entry = {text: message.text(), location: message.location(), offline};
    if (/\/favicon\.ico$/.test(entry.location.url || '') && /404/.test(entry.text)) report.incidentalBrowserRequests.push(entry);
    else report.consoleErrors.push(entry);
  });
  page.on('requestfailed', request => {
    const entry = {url: request.url(), error: request.failure()?.errorText, offline};
    if (/\/favicon\.ico(?:\?|$)/.test(entry.url)) report.incidentalBrowserRequests.push(entry);
    else report.failedRequests.push(entry);
  });
  page.on('response', response => {
    if (response.status() >= 400) {
      const entry = {url: response.url(), status: response.status(), offline};
      if (/\/favicon\.ico(?:\?|$)/.test(entry.url)) report.incidentalBrowserRequests.push(entry);
      else report.failedRequests.push(entry);
    }
    if (/\/assets\/(?:player_ship_identity_v1|ship_modular_atlas_v1)\.webp(?:\?|$)/.test(response.url()))
      report.assetResponses.push({url: response.url(), status: response.status(), offline, fromServiceWorker: response.fromServiceWorker()});
  });
  return page;
}
const storage = page => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
const workerState = page => page.evaluate(async () => ({
  url: location.href, online: navigator.onLine, controller: navigator.serviceWorker.controller?.scriptURL || null,
  registrations: (await navigator.serviceWorker.getRegistrations()).map(reg => ({scope: reg.scope, active: reg.active?.scriptURL, state: reg.active?.state})),
  caches: await caches.keys()
}));
const observer = page => page.evaluate(() => {
  const q = window.__REBRAND_OBSERVER__;
  return {draw: JSON.parse(JSON.stringify(q.draw)), raf: {frames: q.raf.frames, maximum: q.raf.maximum, errors: [...q.raf.errors]}};
});
async function capture(page, name) {
  const file = `${String(report.screenshots.length + 1).padStart(2, '0')}-${name}.png`;
  await page.screenshot({path: path.join(output, file)});
  report.screenshots.push({file, type: 'Authentic Chromium viewport; prior-save compatibility fixture'}); await save();
}
function brand(text) {
  assert.match(text, /NEON\s*CRONIUM/i, `Missing current brand in ${JSON.stringify(text)}`);
  assert.doesNotMatch(text, /NEON[\s_-]*CATCHER/i, 'Retired product name is visible');
}
function savedBytesEqual(actual, fixture) {
  for (const [key, value] of Object.entries(fixture)) assert.equal(actual[key], value, `Prior save changed before launch: ${key}`);
}
async function launcherBrand(page) {
  brand(await page.title()); brand(await page.locator('h1').innerText());
  await page.locator('.hero img').evaluate(image => image.decode());
  const layout = await page.locator('h1').evaluate(element => {
    const r = element.getBoundingClientRect(), image = document.querySelector('.hero img').getBoundingClientRect();
    return {text: element.innerText, x: r.x, right: r.right, width: r.width, height: r.height,
      scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth, imageLeft: image.left};
  });
  assert.ok(layout.x >= 0 && layout.right <= layout.viewport + 1, 'Brand heading extends beyond the viewport');
  assert.ok(layout.scrollWidth <= layout.clientWidth + 1, 'Brand letters overflow their heading box');
  assert.ok(layout.documentWidth <= layout.viewport + 1, 'Launcher creates horizontal scrolling');
  assert.ok(layout.right <= layout.imageLeft + 1, 'Brand heading overlaps the portrait');
  const manifests = await page.evaluate(async () => {
    const results = [];
    for (const file of ['manifest.webmanifest']) {
      const url = new URL(file, location.href).href, response = await fetch(url), value = await response.json();
      results.push({file, url, status: response.status, value});
    }
    return results;
  });
  for (const item of manifests) { assert.equal(item.status, 200); brand(item.value.name); brand(item.value.short_name); }
  return {title: await page.title(), layout, manifests, worker: await workerState(page)};
}
async function gameBrandAndSave(page, fixture) {
  await page.locator('#menu.show').waitFor(); brand(await page.title());
  brand(await page.locator('#menu .menu-topline strong').innerText());
  // Fetch the nested manifest from a game-controlled client: the launcher
  // intentionally does not intercept nested game subresources offline.
  const manifest = await page.evaluate(async () => {
    const response = await fetch('manifest.webmanifest');
    return {status: response.status, value: await response.json()};
  });
  assert.equal(manifest.status, 200); brand(manifest.value.name); brand(manifest.value.short_name);
  savedBytesEqual(await storage(page), fixture);
  assert.match(await page.locator('#playSector').innerText(), /ETAPA 1\.3\/10/);
  assert.equal((await page.locator('#best').innerText()).trim(), '1739');
  await page.locator('#openHangar').click(); await page.locator('#shipHangar.show').waitFor();
  assert.equal(await page.locator('#shipHull').inputValue(), 'aster');
  assert.equal(await page.locator('#shipWings').inputValue(), 'bastion');
  assert.equal(await page.locator('#shipEngines').inputValue(), 'aster');
  await page.locator('#shipHangarBack').click();
  savedBytesEqual(await storage(page), fixture);
  return {title: await page.title(), manifest, playSector: await page.locator('#playSector').innerText(), storage: await storage(page)};
}

(async () => {
  await prepareEvidence(output); evidenceReady = true;
  await fs.copyFile(__filename, path.join(output, 'used-harness.cjs'));
  report.harnessSha256 = sha256(await fs.readFile(__filename));
  report.git = {head: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], {encoding: 'utf8'}).trim(),
    workingTree: execFileSync('git', ['status', '--short'], {encoding: 'utf8'}).trim()};
  report.previousInfo = JSON.parse(await fs.readFile(path.join(previous, 'build-info.json'), 'utf8'));
  report.currentInfo = JSON.parse(await fs.readFile(path.join(root, 'build-info.json'), 'utf8'));
  assert.notEqual(report.previousInfo.revision, report.currentInfo.revision, 'Build the new preview before running this test');
  assert.equal(report.previousInfo.storagePrefix, report.currentInfo.storagePrefix, 'Rebranding must not change save isolation');
  assert.equal(report.currentInfo.engineV1, false);
  report.currentPackageBefore = await packageFiles(root); report.previousPackageBefore = await packageFiles(previous);
  const model = await import(pathToFileURL(path.resolve(__dirname, '../src/game/progression/chronos-flight.js')).href);
  const checkpoint = model.createChronosVoyageCheckpoint(3, {goal: 36});
  const prefix = report.previousInfo.storagePrefix;
  const fixture = report.seededPreviousSaveFixture = {
    [`${prefix}neon-best-v2`]: '1739', [`${prefix}neon-unlocked-v2`]: '1',
    [`${prefix}neon-n7-unlocked-v1`]: '37',
    [`${prefix}neonCatcher.shipFleet.v1`]: JSON.stringify({version: 1, mode: 'modular', loadout: {hull: 'aster', wings: 'bastion', engines: 'aster'}}),
    [`${prefix}neonCatcher.flightEquipment.v1`]: JSON.stringify({version: 1, recoveredTwin: true, unlocked: ['pulse', 'twin'], selected: 'twin'}),
    [`${prefix}${model.CHRONOS_VOYAGE_KEY}`]: JSON.stringify({version: 2, checkpoint,
      entry: {hull: 74, score: 160, maxCombo: 3, collected: checkpoint.collected}, unlockedStage: 3, completed: false}),
    'neon-unlocked-v2': '7', 'neon-best-v2': '25000', 'neon-n7-unlocked-v1': '42'
  };
  temp = await fs.mkdtemp(path.join(os.tmpdir(), 'neon-cronium-rebrand-'));
  await fs.cp(previous, temp, {recursive: true});
  server = await startStaticServer(temp);
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']});
  report.browser = browser.version();
  context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, serviceWorkers: 'allow'});
  await context.addInitScript(() => {
    const q = window.__REBRAND_OBSERVER__ = {draw: {}, raf: {frames: 0, maximum: 0, pending: new Set(), errors: []}};
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
      const answer = Reflect.apply(draw, this, [image, ...args]);
      const file = image?.src?.split('/').at(-1)?.split('?')[0];
      if (file && this.canvas?.id === 'canvas') q.draw[file] = (q.draw[file] || 0) + 1;
      return answer;
    };
    const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => {
      const id = request(time => { q.raf.pending.delete(id); q.raf.frames++;
        try { callback(time); } catch (error) { q.raf.errors.push(error.stack || String(error)); throw error; } });
      q.raf.pending.add(id); q.raf.maximum = Math.max(q.raf.maximum, q.raf.pending.size); return id;
    };
    window.cancelAnimationFrame = id => { q.raf.pending.delete(id); return cancel(id); };
  });
  await step('install the actual previous launcher/game workers and seed declared prior-save fixtures', async () => {
    const page = await newPage(); await page.goto(server.url, {waitUntil: 'load'});
    assert.match(await page.title(), /NEON\s*CATCHER/i);
    await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.endsWith('/launcher-sw.js'));
    await capture(page, 'previous-launcher');
    await page.locator('#classiclink').click();
    await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.endsWith('/juego/sw.js'));
    await waitAsync(page, async revision => {
      const own = (await caches.keys()).filter(key => key.startsWith('neon-preview-v1:') || key.startsWith('neon-preview-launcher-v1:'));
      return own.length === 2 && own.every(key => key.endsWith(revision));
    }, report.previousInfo.revision);
    await page.evaluate(values => { for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value); }, fixture);
    await page.evaluate(async () => { const cache = await caches.open('rebrand-unrelated-app'); await cache.put('/keep', new Response('untouched')); });
    await page.reload({waitUntil: 'load'}); await page.locator('#menu.show').waitFor();
    assert.match(await page.locator('#playSector').innerText(), /ETAPA 1\.3\/10/);
    savedBytesEqual(await storage(page), fixture);
    await capture(page, 'previous-menu-checkpoint-1-3');
    report.previousStorage = await storage(page);
    const old = await workerState(page); assert.equal(old.registrations.length, 2);
    await page.waitForLoadState('networkidle');
    for (const current of context.pages()) await current.close();
    return old;
  });
  await step('replace only the temporary package, update both native workers and retire the old generations', async () => {
    await fs.cp(root, temp, {recursive: true, force: true});
    const page = await newPage(); await page.goto(new URL('build-info.json', server.url).href, {waitUntil: 'load'});
    report.upgradeBefore = await workerState(page);
    await bounded(page.evaluate(async () => {
      for (const registration of await navigator.serviceWorker.getRegistrations()) await registration.update();
    }), timeout, 'Native worker update timed out');
    await waitAsync(page, async revision => {
      const registrations = await navigator.serviceWorker.getRegistrations(), keys = await caches.keys();
      const own = keys.filter(key => key.startsWith('neon-preview-v1:') || key.startsWith('neon-preview-launcher-v1:'));
      return registrations.length === 2 && registrations.every(reg => reg.active?.state === 'activated') &&
        own.length === 2 && own.every(key => key.endsWith(revision));
    }, report.currentInfo.revision);
    const current = await workerState(page);
    assert.ok(!current.caches.some(key => key.endsWith(report.previousInfo.revision)));
    assert.ok(current.caches.includes('rebrand-unrelated-app'));
    savedBytesEqual(await storage(page), fixture);
    await page.close(); return current;
  });
  await step('new online launcher/manifests fit 390px and the unchanged checkpoint and hangar remain usable', async () => {
    const page = await newPage(); await page.goto(server.url, {waitUntil: 'load'});
    const launcher = await launcherBrand(page); await capture(page, 'current-online-launcher');
    await page.locator('#classiclink').click();
    const game = await gameBrandAndSave(page, fixture); await capture(page, 'current-online-menu');
    assert.ok((await workerState(page)).controller.endsWith('/juego/sw.js'));
    await page.close(); return {launcher, game};
  });
  offline = true; await context.setOffline(true);
  report.requestsBeforeOffline = server.requests.length;
  await step('fresh offline launcher and game retain the current brand and exact prior-save bytes', async () => {
    const page = await newPage(); await page.goto(server.url, {waitUntil: 'load'});
    const launcher = await launcherBrand(page);
    assert.equal(launcher.worker.online, false); assert.ok(launcher.worker.controller.endsWith('/launcher-sw.js'));
    await capture(page, 'current-offline-launcher');
    assert.ok(report.assetResponses.some(item => item.offline && item.fromServiceWorker && item.url.endsWith('/player_ship_identity_v1.webp')));
    await page.locator('#classiclink').click();
    const game = await gameBrandAndSave(page, fixture); await capture(page, 'current-offline-menu');
    assert.equal((await workerState(page)).online, false);
    report.offlineStorageBeforeLaunch = await storage(page);
    await page.close(); return {launcher, game};
  });
  await step('offline CONTINUAR resumes fixture stage 1.3 and draws the actual modular ship with one RAF', async () => {
    const page = await newPage(); await page.goto(new URL('juego/index.html', server.url).href, {waitUntil: 'load'});
    await page.locator('#menu.show').waitFor(); savedBytesEqual(await storage(page), fixture); brand(await page.title());
    await page.locator('#play').click();
    assert.equal(await page.locator('[data-voyage-stage="3"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-voyage-stage]:disabled').count(), 7);
    await capture(page, 'current-offline-checkpoint-briefing');
    await page.locator('#launch').click();
    await page.waitForFunction(() => window.__REBRAND_OBSERVER__.draw['ship_modular_atlas_v1.webp'] >= 24 && !document.querySelector('#fire').disabled);
    assert.equal((await page.locator('#hudLevel').innerText()).trim(), '1.3');
    assert.equal((await page.locator('#goal').innerText()).trim(), '8/36');
    assert.equal((await page.locator('#hull').innerText()).trim(), '74%');
    assert.equal((await page.locator('#flightWeaponName').innerText()).trim(), 'GEMELO');
    const running = await observer(page); assert.equal(running.raf.maximum, 1); assert.deepEqual(running.raf.errors, []);
    assert.ok(report.assetResponses.some(item => item.offline && item.fromServiceWorker && item.url.endsWith('/ship_modular_atlas_v1.webp')));
    await capture(page, 'current-offline-continuation-playing');
    await page.locator('#pause').click(); await page.locator('#paused.show').waitFor();
    const hud = () => page.evaluate(() => Object.fromEntries(['score', 'goal', 'hull', 'ammo'].map(id => [id, document.getElementById(id)?.textContent?.trim()])));
    const frozen = await hud(); await page.waitForTimeout(600); assert.deepEqual(await hud(), frozen);
    const afterLaunch = await storage(page);
    for (const [key, value] of Object.entries(fixture)) {
      if (key.endsWith(model.CHRONOS_VOYAGE_KEY)) continue;
      assert.equal(afterLaunch[key], value, `Unrelated saved field changed while continuing: ${key}`);
    }
    const voyage = JSON.parse(afterLaunch[prefix + model.CHRONOS_VOYAGE_KEY]);
    assert.equal(voyage.checkpoint.stageNumber, 3); assert.equal(voyage.checkpoint.collected, checkpoint.collected);
    assert.equal(voyage.entry.hull, 74); assert.equal(voyage.entry.score, 160);
    await page.locator('#resume').click(); await page.locator('#paused.show').waitFor({state: 'hidden'});
    const state = await workerState(page); assert.equal(state.online, false);
    assert.ok(state.controller.endsWith('/juego/sw.js'));
    report.offlineStorageAfterLaunch = afterLaunch;
    const final = await observer(page); assert.equal(final.raf.maximum, 1); assert.deepEqual(final.raf.errors, []);
    await page.close(); return {state, running, final, stage: '1.3', fixtureResume: true, voyage};
  });
  clean(); report.status = 'passed'; report.exitCode = 0;
})().catch(async error => {
  report.status = 'failed'; report.exitCode = 1; report.error = errorText(error); process.exitCode = 1;
  const page = context?.pages().at(-1);
  if (page) { report.failureWorkerState = await workerState(page).catch(error => ({error: errorText(error)}));
    if (evidenceReady) await page.screenshot({path: path.join(output, 'failure.png')}).catch(() => {}); }
}).finally(async () => {
  if (evidenceReady && report.currentPackageBefore && report.previousPackageBefore) {
    try {
      report.currentPackageAfter = await packageFiles(root); report.previousPackageAfter = await packageFiles(previous);
      assert.deepEqual(report.currentPackageAfter, report.currentPackageBefore, 'Current input package was changed during QA');
      assert.deepEqual(report.previousPackageAfter, report.previousPackageBefore, 'Previous input package was changed during QA');
      report.inputPackagesUnchanged = true;
    } catch (error) { report.status = 'failed'; report.exitCode = 1; report.error ||= errorText(error); process.exitCode = 1; }
  }
  if (server) report.serverRequests = server.requests;
  await context?.close(); await browser?.close(); await server?.close();
  if (temp) await fs.rm(temp, {recursive: true, force: true});
  report.durationMs = Date.now() - began; report.finishedAt = new Date().toISOString();
  if (evidenceReady) await save();
  console.log(JSON.stringify({status: report.status, exitCode: report.exitCode, durationMs: report.durationMs,
    passed: report.cases.filter(x => x.status === 'passed').length, failed: report.cases.filter(x => x.status === 'failed').length,
    error: report.error, output}));
});
