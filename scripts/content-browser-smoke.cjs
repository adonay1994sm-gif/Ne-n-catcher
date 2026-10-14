// Local-only QA. Requires Playwright and Chromium; never deploys or changes game files.
// node scripts/content-browser-smoke.cjs --root www --output /tmp/neon-browser-www
// node scripts/content-browser-smoke.cjs --root preview-dist --output /tmp/neon-browser-preview
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const {parseArgs} = require('node:util');
const repository = path.resolve(__dirname, '..');
const {values: args} = parseArgs({options: {
  root: {type: 'string'}, output: {type: 'string'}, 'base-url': {type: 'string'},
  baseURL: {type: 'string'}, timeout: {type: 'string'}, help: {type: 'boolean'}
}});
if (args.help) {
  console.log('Options: --root www|preview-dist --output DIRECTORY --base-url URL --timeout 45000');
  process.exit(0);
}
const root = path.resolve(args.root || process.env.NEON_BROWSER_ROOT || path.join(repository, 'www'));
const output = path.resolve(args.output || process.env.NEON_BROWSER_EVIDENCE ||
  path.join(repository, 'docs/continuity-100/evidence/block-02', 'browser-' + new Date().toISOString().replace(/[:.]/g, '-')));
const timeout = Number(args.timeout || process.env.NEON_BROWSER_TIMEOUT || 45000);
assert.ok(Number.isFinite(timeout) && timeout >= 1000 && timeout <= 180000, 'Timeout must be 1000–180000 ms');
const externalURL = args['base-url'] || args.baseURL || process.env.NEON_BROWSER_BASE_URL;
const profiles = [
  {name: '390x844', width: 390, height: 844, dpr: 3},
  {name: '320x568', width: 320, height: 568, dpr: 2},
  {name: '844x390', width: 844, height: 390, dpr: 3}
];
const mime = {'.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.map': 'application/json', '.svg': 'image/svg+xml'};
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const errorText = error => error?.stack || String(error);
const report = {
  status: 'running', exitCode: null, startedAt: new Date().toISOString(), command: process.argv,
  sourceRoot: root, output, timeout, cases: [],
  limits: ['Chromium emulation only; no physical Safari/iPhone certification.',
    'Real game images and Canvas rendering; not a sustained FPS or memory benchmark.',
    'Read-only inspection hook inserted into the served game response; shipped bundles unchanged.',
    'Both modes unlocked through separate localStorage keys in fresh browser contexts.',
    'Selector currently renders 10/100 buttons; pagination requires an explicit test update.',
    'Service workers blocked to verify fresh resources; offline/cache lifecycle not certified.']
};
async function saveReport() {
  report.updatedAt = new Date().toISOString();
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
}
async function startServer() {
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root + path.sep) && file !== root) { response.writeHead(403).end(); return; }
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const body = await fs.readFile(file);
      response.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
      response.end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject); server.listen(0, '127.0.0.1', resolve);
  });
  return server;
}
// Temporal polling is deliberate: QA must not schedule additional RAF callbacks.
async function wait(page, predicate, argument) {
  await page.waitForFunction(predicate, argument, {polling: 100, timeout});
}
async function snapshot(page) {
  return page.evaluate(() => {
    const a = window.__RAF_AUDIT__;
    return {game: window.__GAME_QA__?.() || null, raf: a ? {
      maxPending: a.maximum, pending: a.pending.size, frames: a.frames,
      firstTimestamp: a.first, lastTimestamp: a.last, recentFrames: a.recent,
      callbackErrors: a.errors, negativeRawDeltas: a.negativeRawDeltas
    } : null, events: window.__QA_EVENTS__ || [], visibility: document.visibilityState};
  });
}
async function runCase(browser, profile, mode, baseURL) {
  const result = {id: `${profile.name}-${mode}`, profile, mode, status: 'running',
    startedAt: new Date().toISOString(), steps: [], errors: [], failedRequests: [],
    consoleErrors: [], instrumentationErrors: [], bundles: {}, images: []};
  report.cases.push(result); await saveReport();
  const began = Date.now();
  const context = await browser.newContext({viewport: {width: profile.width, height: profile.height},
    deviceScaleFactor: profile.dpr, isMobile: true, hasTouch: true, serviceWorkers: 'block'});
  const page = await context.newPage();
  page.setDefaultTimeout(timeout); page.setDefaultNavigationTimeout(timeout);
  page.on('pageerror', error => result.errors.push(errorText(error)));
  page.on('requestfailed', request => result.failedRequests.push({url: request.url(), error: request.failure()?.errorText}));
  page.on('response', response => {
    if (response.status() >= 400) result.failedRequests.push({url: response.url(), status: response.status()});
  });
  page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push(message.text()); });
  async function step(name, action) {
    const entry = {name, startedAt: new Date().toISOString(), status: 'running'};
    result.steps.push(entry); await saveReport();
    console.log(`[${result.id}] ${name}`);
    const started = Date.now();
    try {
      await action(); entry.snapshot = await snapshot(page);
      assert.deepEqual(result.instrumentationErrors, [], 'Inspection hook failed');
      assert.deepEqual(result.errors, [], 'Uncaught game JavaScript exception');
      assert.deepEqual(entry.snapshot.raf?.callbackErrors || [], [], 'RAF callback failed');
      entry.status = 'passed';
    } catch (error) {
      entry.status = 'failed'; entry.error = errorText(error);
      entry.snapshot = await snapshot(page).catch(error => ({inspectionError: errorText(error)}));
      throw error;
    } finally { entry.durationMs = Date.now() - started; await saveReport(); }
  }
  try {
    await page.addInitScript(() => {
      localStorage.setItem('neon-n7-unlocked-v1', '100'); localStorage.setItem('neon-unlocked-v2', '10');
      localStorage.setItem('neon-preview-v1:neon-n7-unlocked-v1', '100');
      localStorage.setItem('neon-preview-v1:neon-unlocked-v2', '10');
      const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
      const audit = window.__RAF_AUDIT__ = {pending: new Set(), maximum: 0, frames: 0,
        first: null, last: null, recent: [], errors: [], negativeRawDeltas: []};
      window.requestAnimationFrame = callback => {
        const id = request(now => {
          audit.pending.delete(id); audit.frames++; audit.first ??= now; audit.last = now;
          const before = window.__GAME_QA__?.();
          const trace = {timestamp: now, previousLast: before?.last, state: before?.state,
            directorBefore: before?.directorTime, rawDelta: before ? (now - before.last) / 1000 : null};
          if (trace.rawDelta < 0) {
            audit.negativeRawDeltas.push(trace); if (audit.negativeRawDeltas.length > 24) audit.negativeRawDeltas.shift();
          }
          try { callback(now); }
          catch (error) { audit.errors.push({timestamp: now, error: error.stack || String(error)}); throw error; }
          finally {
            trace.directorAfter = window.__GAME_QA__?.().directorTime;
            audit.recent.push(trace); if (audit.recent.length > 24) audit.recent.shift();
          }
        });
        audit.pending.add(id); audit.maximum = Math.max(audit.maximum, audit.pending.size); return id;
      };
      window.cancelAnimationFrame = id => { audit.pending.delete(id); cancel(id); };
      window.__QA_EVENTS__ = [];
      const eventBefore = new WeakMap();
      document.addEventListener('click', event => {
        const id = event.target.closest?.('button')?.id;
        if (!['launch', 'pause', 'resume', 'restart', 'quit', 'fire'].includes(id)) return;
        eventBefore.set(event, {id, before: window.__GAME_QA__?.()});
      }, true);
      // Bubble after the actual target handler, without waiting for another frame.
      document.addEventListener('click', event => {
        const captured = eventBefore.get(event);
        if (captured) window.__QA_EVENTS__.push({...captured, at: performance.now(), after: window.__GAME_QA__?.()});
      });
    });
    await page.route(/\/(?:game|content-runtime|core-runtime)\.js(?:\?.*)?$/, async route => {
      try {
        const response = await route.fetch({timeout}); const body = await response.body();
        const name = path.posix.basename(new URL(route.request().url()).pathname);
        result.bundles[name] = {url: route.request().url(), bytes: body.length, sha256: sha256(body)};
        if (name !== 'game.js') { await route.fulfill({response, body}); return; }
        const source = body.toString('utf8');
        const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
        assert.equal(source.split(marker).length, 2, 'Expected exactly one legacy bootstrap marker');
        const hook = `window.__GAME_QA__ = () => ({state,hull,ammo,currentLevel,N7_CAMPAIGN,
          levelCount:LEVELS.length,playerX:player.x,target:player.target,W,H,elapsed,last,warpTimer,runToken,
          legacyRunning,legacyFrameId,entityCount:items.length,directorTime:encounterDirector?.elapsed ?? null,
          reproduction:encounterDirector?.reproduction ?? null});
          window.__GAME_ASSETS_QA__ = () => [...new Set([...Object.values(SPRITES),
            ...Object.values(SPRITE_GROUPS).flat()])].map(image => ({path:image._assetPath,url:image.src,
            complete:image.complete,width:image.naturalWidth,height:image.naturalHeight}));\n`;
        await route.fulfill({response, body: source.replace(marker, hook + marker)});
      } catch (error) {
        result.instrumentationErrors.push(errorText(error)); await route.abort().catch(() => {});
      }
    });
    await step('open selected mode and verify level selector', async () => {
      await page.goto(baseURL, {waitUntil: 'load'});
      const preview = await page.locator('#n7link').count() === 1;
      result.previewLauncher = preview;
      if (preview) {
        if (mode === 'n7') { await page.locator('#unlock').check(); await page.locator('#n7link').click(); }
        else await page.locator('a.card:not(#n7link)').click();
      } else if (mode === 'n7') {
        const url = new URL(page.url()); url.searchParams.set('campaign', 'n7');
        await page.goto(url.href, {waitUntil: 'load'});
      }
      await wait(page, () => typeof window.__GAME_QA__ === 'function' && __GAME_QA__().state === 'menu');
      result.gameURL = page.url();
      const state = await page.evaluate(() => __GAME_QA__());
      assert.equal(state.N7_CAMPAIGN, mode === 'n7'); assert.equal(state.levelCount, mode === 'n7' ? 100 : 10);
      await page.locator('#levels').click();
      await wait(page, expected => document.querySelectorAll('#levelGrid button').length === expected, state.levelCount);
      result.levelCards = await page.locator('#levelGrid button').count();
      assert.equal(await page.locator('#levelGrid button:disabled').count(), 0);
      await page.locator('#levelGrid button').nth(mode === 'n7' ? 36 : 0).click();
      await page.locator('#launch').click();
      await wait(page, isN7 => {
        const g = __GAME_QA__();
        return g.state === 'playing' && g.warpTimer === 0 && (isN7 ? g.directorTime > .05 : g.elapsed > 1.3);
      }, mode === 'n7');
      await wait(page, () => __GAME_ASSETS_QA__().every(image => image.complete && image.width > 0 && image.height > 0));
      result.images = await page.evaluate(() => __GAME_ASSETS_QA__());
    });
    await step('touch movement and fire with visible controls', async () => {
      const canvas = await page.locator('#canvas').boundingBox();
      assert.ok(canvas?.width > 0 && canvas.height > 0, 'Canvas has no rendered size');
      const before = await page.evaluate(() => __GAME_QA__());
      await page.touchscreen.tap(canvas.x + canvas.width * .42, canvas.y + canvas.height * .60);
      await wait(page, previousX => {
        const g = __GAME_QA__(); return Math.abs(g.target - g.W * .42) < 2 && g.playerX < previousX - 4;
      }, before.playerX);
      result.touch = {canvas, before, after: await page.evaluate(() => __GAME_QA__())};
      await page.touchscreen.tap(canvas.x + canvas.width * .5, canvas.y + canvas.height * .60);
      const fire = await page.locator('#fire').boundingBox();
      assert.ok(fire && fire.x >= 0 && fire.y >= 0 && fire.x + fire.width <= profile.width + 1 &&
        fire.y + fire.height <= profile.height + 1, 'Fire control outside viewport');
      result.fireBounds = fire;
      await page.locator('#fire').click();
      await wait(page, () => __QA_EVENTS__.some(event => event.id === 'fire' && event.after.ammo === event.before.ammo - 1));
    });
    let paused;
    await step('pause freezes simulation while one RAF continues', async () => {
      await page.locator('#pause').click(); await wait(page, () => __GAME_QA__().state === 'paused');
      paused = await snapshot(page);
      await wait(page, frame => __RAF_AUDIT__.frames >= frame + 3, paused.raf.frames);
      const after = await snapshot(page);
      assert.equal(after.game.elapsed, paused.game.elapsed); assert.equal(after.game.directorTime, paused.game.directorTime);
      assert.equal(after.raf.pending, 1); assert.equal(after.raf.maxPending, 1);
      await page.screenshot({path: path.join(output, result.id + '-paused.png'), timeout});
    });
    await step('resume advances real game clock and encounter director', async () => {
      await page.locator('#resume').click();
      await wait(page, before => {
        const g = __GAME_QA__(); return g.state === 'playing' && g.elapsed > before.elapsed + .05 &&
          (before.directorTime === null || g.directorTime > before.directorTime + .05);
      }, paused.game);
      const resumed = await snapshot(page);
      assert.equal(resumed.raf.pending, 1); assert.equal(resumed.raf.maxPending, 1);
      assert.ok(resumed.raf.frames > paused.raf.frames); result.lifecycle = {paused, resumed};
    });
    await step('restart resets progress, preserves seed and advances again', async () => {
      await page.locator('#pause').click(); const before = await page.evaluate(() => __GAME_QA__());
      await page.locator('#restart').click();
      await wait(page, token => __QA_EVENTS__.some(event => event.id === 'restart' && event.after.runToken === token + 1), before.runToken);
      const event = await page.evaluate(() => __QA_EVENTS__.filter(event => event.id === 'restart').at(-1));
      assert.equal(event.after.state, 'playing'); assert.equal(event.after.hull, 100); assert.equal(event.after.ammo, 3);
      assert.equal(event.after.elapsed, 0); assert.equal(event.after.directorTime, mode === 'n7' ? 0 : null);
      assert.equal(event.after.currentLevel, before.currentLevel); assert.deepEqual(event.after.reproduction, before.reproduction);
      await wait(page, isN7 => {
        const g = __GAME_QA__(); return g.state === 'playing' && g.warpTimer === 0 &&
          (isN7 ? g.directorTime > .05 : g.elapsed > 1.3);
      }, mode === 'n7');
    });
    await step('return to menu and verify resource and RAF health', async () => {
      await page.locator('#pause').click(); await page.locator('#quit').click();
      await wait(page, () => __GAME_QA__().state === 'menu' && document.querySelector('#menu').classList.contains('show'));
      const before = await snapshot(page);
      await wait(page, frame => __RAF_AUDIT__.frames >= frame + 2, before.raf.frames);
      const after = await snapshot(page);
      assert.equal(after.game.elapsed, before.game.elapsed); assert.equal(after.game.directorTime, before.game.directorTime);
      assert.equal(after.raf.maxPending, 1); assert.equal(after.raf.pending, 1);
      assert.deepEqual(result.failedRequests, [], 'Failed HTTP/image/script requests');
      assert.deepEqual(result.consoleErrors, [], 'Browser console errors');
      for (const bundle of ['game.js', 'core-runtime.js', 'content-runtime.js']) assert.ok(result.bundles[bundle], `Missing loaded bundle ${bundle}`);
      result.final = after;
    });
    result.status = 'passed';
  } catch (error) {
    result.status = 'failed'; result.error = errorText(error);
    result.failureSnapshot = await snapshot(page).catch(error => ({inspectionError: errorText(error)}));
    await page.screenshot({path: path.join(output, result.id + '-failure.png'), timeout: Math.min(timeout, 10000)})
      .catch(error => { result.screenshotError = errorText(error); });
    console.error(`[${result.id}] ${result.error}`);
  } finally { result.durationMs = Date.now() - began; await context.close(); await saveReport(); }
}
async function main() {
  await fs.mkdir(output, {recursive: true});
  // Refuse to replace evidence from any earlier run, including failures.
  try { await fs.access(path.join(output, 'results.json')); throw new Error(`Evidence already exists: ${output}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  let browser, server;
  const began = Date.now();
  try {
    await saveReport();
    if (!externalURL) server = await startServer();
    const baseURL = externalURL || `http://127.0.0.1:${server.address().port}/`; report.baseURL = baseURL;
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      headless: true, timeout, args: ['--no-sandbox', '--disable-dev-shm-usage']});
    report.browser = browser.version();
    for (const profile of profiles) for (const mode of ['original', 'n7']) await runCase(browser, profile, mode, baseURL);
    report.status = report.cases.length === 6 && report.cases.every(result => result.status === 'passed') ? 'passed' : 'failed';
    report.exitCode = report.status === 'passed' ? 0 : 1;
  } catch (error) {
    report.status = 'failed'; report.exitCode = 1; report.error = errorText(error); console.error(report.error);
  } finally {
    report.durationMs = Date.now() - began; report.finishedAt = new Date().toISOString(); await saveReport();
    await browser?.close();
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    process.exitCode = report.exitCode;
    console.log(JSON.stringify({status: report.status, exitCode: report.exitCode,
      casesPassed: report.cases.filter(result => result.status === 'passed').length, totalCases: 6, output, durationMs: report.durationMs}));
  }
}
main().catch(error => { console.error(errorText(error)); process.exitCode = 1; });
