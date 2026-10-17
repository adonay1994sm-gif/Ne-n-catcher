// Real first-launch Chronos destruction, observed through the actual UI.
// No game clocks, entities, health, saves or unlocks are written by this script.
// node scripts/chronos-destruction-browser-smoke.cjs --root preview-dist --output <new-directory>
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {startStaticServer, prepareEvidence, saveEvidence, sha256, errorText} = require('./browser-qa-helpers.cjs');

const {values} = parseArgs({options: {root: {type: 'string'}, output: {type: 'string'}}});
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output || `docs/production-reports/evidence/chronos-destruction/browser-${Date.now()}`);
const ATLAS = 'chronos_destruction_atlas_v1.webp';
const started = Date.now();
const report = {status: 'running', exitCode: null, command: process.argv, sourceRoot: root,
  startedAt: new Date().toISOString(), browser: 'Real Chromium, touch-emulated 390x844, DPR 1', profiles: [],
  limits: ['Natural first launch through the principal journey entry; no game-state or save writes.',
    'Read-only HTTP inspection and canvas/RAF observers leave the package files unchanged.',
    'The draw observer delegates to the original canvas operation; it adds no animation callback.',
    'This covers the first destruction event, not a complete 90-second mission or aesthetic approval.',
    'The missing-atlas profile deliberately returns one HTTP 404 and records it separately.',
    'Service workers are blocked; this does not certify cache lifecycle, Safari, physical iPhone or sustained performance.']};
let server, browser, page, profile, evidenceReady = false;
const save = () => saveEvidence(output, report);
const inspect = () => page.evaluate(() => ({...window.__CHRONOS_DESTRUCTION_QA__(),
  raf: {maximum: window.__CHRONOS_DESTRUCTION_RAF__.maximum,
    pending: window.__CHRONOS_DESTRUCTION_RAF__.pending.size,
    frames: window.__CHRONOS_DESTRUCTION_RAF__.frames,
    errors: [...window.__CHRONOS_DESTRUCTION_RAF__.errors]},
  draw: JSON.parse(JSON.stringify(window.__CHRONOS_DESTRUCTION_DRAW__))}));

// Poll in Node. Async page.waitForFunction predicates are deliberately avoided:
// this environment's Playwright can treat a returned Promise as truthy.
async function until(predicate, timeout = 180000) {
  const deadline = Date.now() + timeout;
  let q;
  while (Date.now() < deadline) {
    q = await inspect();
    healthy(q);
    if (predicate(q)) return q;
    await page.waitForTimeout(50);
  }
  throw new Error(`Timed out waiting for game state: ${JSON.stringify(q)}`);
}
function healthy(q) {
  assert.deepEqual(profile.errors, [], 'Uncaught JavaScript error');
  assert.deepEqual(profile.consoleErrors, [], 'Unexpected console error');
  assert.deepEqual(profile.failedRequests, [], 'Unexpected HTTP or network error');
  assert.deepEqual(q.raf.errors, [], 'RAF callback threw');
  assert.ok(q.legacyRunning, 'The legacy loop stopped');
  assert.ok(q.raf.maximum <= 1, 'More than one RAF owner was pending');
}
async function check(name, operation) {
  const entry = {name, status: 'running', startedAt: new Date().toISOString()};
  profile.checks.push(entry); await save();
  console.log(`[Chronos destruction ${profile.id}] ${name}`);
  const began = Date.now();
  try { await operation(); entry.snapshot = await inspect(); healthy(entry.snapshot); entry.status = 'passed'; }
  catch (error) { entry.status = 'failed'; entry.error = errorText(error); throw error; }
  finally { entry.durationMs = Date.now() - began; await save(); }
}
async function capture(name, before) {
  const file = `${profile.id}-${name}.png`;
  await page.screenshot({path: path.join(output, file), timeout: 30000});
  const after = await inspect();
  profile.screenshots.push({file, type: 'Actual game viewport in Chromium', before: before || after, after,
    note: before?.pose?.frame === after.pose?.frame ? 'Pose remained stable during capture.' : 'Live capture; see before/after snapshots.'});
  await save();
}

async function openProfile(id, missingAtlas = false) {
  profile = {id, missingAtlas, status: 'running', checks: [], errors: [], consoleErrors: [],
    failedRequests: [], expectedHttpErrors: [], expectedConsoleErrors: [], screenshots: []};
  report.profiles.push(profile);
  const context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, serviceWorkers: 'block'});
  page = await context.newPage(); page.setDefaultTimeout(30000);
  page.on('pageerror', error => profile.errors.push(errorText(error)));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const entry = {text: message.text(), location: message.location()};
    if (missingAtlas && entry.location?.url?.includes(ATLAS) && /404/.test(entry.text)) profile.expectedConsoleErrors.push(entry);
    else profile.consoleErrors.push(entry);
  });
  page.on('requestfailed', request => profile.failedRequests.push({url: request.url(), error: request.failure()?.errorText}));
  page.on('response', response => {
    if (response.status() < 400) return;
    const entry = {url: response.url(), status: response.status()};
    if (missingAtlas && entry.url.includes(ATLAS) && entry.status === 404) profile.expectedHttpErrors.push(entry);
    else profile.failedRequests.push(entry);
  });
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
    const raf = window.__CHRONOS_DESTRUCTION_RAF__ = {pending: new Set(), maximum: 0, frames: 0, errors: []};
    window.requestAnimationFrame = callback => {
      const id = request(now => {
        raf.pending.delete(id); raf.frames++;
        try { callback(now); } catch (error) { raf.errors.push(error.stack || String(error)); throw error; }
      });
      raf.pending.add(id); raf.maximum = Math.max(raf.maximum, raf.pending.size); return id;
    };
    window.cancelAnimationFrame = id => { raf.pending.delete(id); cancel(id); };
    const original = CanvasRenderingContext2D.prototype.drawImage;
    const draw = window.__CHRONOS_DESTRUCTION_DRAW__ = {calls: 0, atlas: {}, wave: {}, flightKit: {}};
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      draw.calls++;
      const image = args[0], source = image?.src || '';
      if (args.length === 9 && image?.naturalWidth > 0) {
        let frames, columns, rows;
        if (source.includes('chronos_destruction_atlas_v1.webp')) { frames = draw.atlas; columns = 3; rows = 2; }
        else if (source.includes('chronos_shockwave_atlas_v1.webp')) { frames = draw.wave; columns = 2; rows = 2; }
        else if (source.includes('chronos_flight_atlas_v1.webp')) { frames = draw.flightKit; columns = 3; rows = 2; }
        if (frames) {
          const frame = Math.round(args[1] / (image.naturalWidth / columns)) + columns * Math.round(args[2] / (image.naturalHeight / rows));
          frames[frame] = (frames[frame] || 0) + 1;
        }
      }
      return original.apply(this, args);
    };
  });
  if (missingAtlas) await page.route(`**/${ATLAS}`, route => route.fulfill({status: 404, contentType: 'text/plain', body: 'Expected QA missing-atlas fixture'}));
  await page.route(/\/game\.js(?:\?.*)?$/, async route => {
    const response = await route.fetch(), body = await response.body(), source = body.toString('utf8');
    assert.equal(sha256(body), report.bundleHashes.game, 'Served bundle differs from recorded package');
    const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
    assert.equal(source.split(marker).length, 2, 'Legacy bootstrap marker changed');
    const hook = `window.__CHRONOS_DESTRUCTION_QA__ = () => ({state,currentLevel,elapsed,hull,collected,W,H,warpTimer,legacyRunning,
      fireLabel:document.querySelector('#fire b')?.textContent,fireAccessibleLabel:document.querySelector('#fire')?.getAttribute('aria-label'),
      flight:classicFlightView?JSON.parse(JSON.stringify(classicFlightView)):null,
      pose:classicFlightView?NeonCampaign.getChronosDestructionPose(classicFlightView):null,
      assets:Object.fromEntries(['chronosDestruction','chronosShockwave','flightKit','flightSpace'].map(id=>{
        const image=SPRITES[id];return [id,{url:image?.src||null,loaded:Boolean(image?.complete&&image.naturalWidth>0),
          loadError:Boolean(image?._loadError),width:image?.naturalWidth||0,height:image?.naturalHeight||0}];}))});\n`;
    await route.fulfill({response, body: source.replace(marker, hook + marker)});
  });
  await page.goto(server.url, {waitUntil: 'load'});
  assert.equal(await page.locator('#unlockClassic').isChecked(), false, 'The route must start without QA unlocks');
  assert.equal(await page.locator('#qaArchive').getAttribute('open'), null, 'Historical QA modes must stay closed');
  await page.locator('#classiclink').click();
  // This predicate is synchronous and only establishes that the read-only hook exists.
  await page.waitForFunction(() => typeof window.__CHRONOS_DESTRUCTION_QA__ === 'function' && window.__CHRONOS_DESTRUCTION_QA__().state === 'menu');
  await page.locator('#play').click(); await page.locator('#launch').click();
  return context;
}

(async () => {
  await prepareEvidence(output); evidenceReady = true;
  report.scriptSha256 = sha256(await fs.readFile(__filename));
  report.git = {sha: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
    status: execFileSync('git', ['status', '--short'], {encoding: 'utf8'}).trim()};
  const info = JSON.parse(await fs.readFile(path.join(root, 'build-info.json'), 'utf8'));
  report.buildInfo = {commit: info.commit, revision: info.revision, dirty: info.dirty, sourceTree: info.sourceTree};
  const packageFiles = ['game.js', 'content-runtime.js', 'styles.css', `assets/${ATLAS}`,
    'assets/chronos_shockwave_atlas_v1.webp', 'assets/chronos_flight_atlas_v1.webp'];
  report.packageFiles = {};
  for (const name of packageFiles) {
    const bytes = await fs.readFile(path.join(root, 'juego', name));
    report.packageFiles[name] = {bytes: bytes.length, sha256: sha256(bytes)};
  }
  report.bundleHashes = {game: report.packageFiles['game.js'].sha256};
  server = await startStaticServer(root);
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']});
  let context = await openProfile('natural');
  await check('fresh classic launch loads the real six-pose atlas and starts its own route clock', async () => {
    const q = await until(q => q.state === 'playing' && q.warpTimer === 0 && q.flight?.elapsed > .1 && q.assets.chronosDestruction.loaded);
    assert.equal(q.currentLevel, 0); assert.equal(q.flight.minDuration, 90); assert.equal(q.pose.frame, 0);
    assert.equal(await page.locator('#flightStage').innerText(), q.flight.stageName,
      'The playable HUD retained its loading label');
    assert.deepEqual([q.assets.chronosDestruction.width, q.assets.chronosDestruction.height], [1536, 1024]);
    assert.ok(q.draw.atlas[0] > 0, 'The intact station was not actually drawn');
    profile.observedPoses = [{frame: q.pose.frame, state: q.pose.state, elapsed: q.flight.elapsed}];
    await capture('00-intact', q);
  });
  await check('the route naturally draws all six destruction states and four authored wave poses', async () => {
    const seen = new Set([0]), deadline = Date.now() + 240000;
    let paused = false;
    while (Date.now() < deadline) {
      let q = await inspect(); healthy(q);
      assert.equal(q.state, 'playing', 'The natural first event stopped before its aftermath');
      if (!seen.has(q.pose.frame)) {
        assert.equal(q.pose.frame, seen.size, 'A destruction pose was skipped by the browser observation');
        assert.ok(q.draw.atlas[q.pose.frame] > 0, `Pose ${q.pose.frame} was selected but not drawn`);
        seen.add(q.pose.frame); profile.observedPoses.push({frame: q.pose.frame, state: q.pose.state, elapsed: q.flight.elapsed, age: q.pose.age});
        await capture(`${String(q.pose.frame).padStart(2, '0')}-${q.pose.state}`, q);
      }
      if (!paused && (q.pose.frame === 2 || q.pose.frame === 3)) {
        await page.locator('#pause').click();
        const before = await inspect(); assert.equal(before.state, 'paused');
        assert.ok(before.pose.frame === 2 || before.pose.frame === 3, 'Pause did not occur during the fracture/release');
        await page.waitForTimeout(650);
        const after = await inspect();
        assert.equal(after.state, 'paused'); assert.equal(after.elapsed, before.elapsed);
        assert.deepEqual(after.flight, before.flight); assert.deepEqual(after.pose, before.pose);
        assert.ok(after.raf.frames > before.raf.frames, 'The existing render loop was not exercised while paused');
        assert.ok(after.draw.calls > before.draw.calls, 'Paused drawing was not exercised');
        assert.ok(after.draw.atlas[after.pose.frame] > before.draw.atlas[before.pose.frame], 'Paused station drawing was not exercised');
        profile.pause = {before, after}; await capture('paused-fracture', after);
        await page.locator('#resume').click();
        q = await until(value => value.state === 'playing' && value.flight.elapsed > before.flight.elapsed);
        paused = true;
      }
      if (q.pose.age >= 8 && seen.size === 6) break;
      await page.waitForTimeout(50);
    }
    assert.deepEqual([...seen], [0, 1, 2, 3, 4, 5]); assert.equal(paused, true);
    const q = await inspect();
    assert.ok(q.pose.age >= 8, 'Wave did not reach its designed end');
    assert.equal(q.pose.frame, 5); assert.equal(q.pose.state, 'aftermath'); assert.equal(q.pose.waveVisible, false);
    for (let frame = 0; frame < 4; frame++) assert.ok(q.draw.wave[frame] > 0, `Authored wave pose ${frame} was never drawn`);
    profile.waveFrames = {...q.draw.wave}; await capture('wave-ended-wreck-persists', q);
  });
  await check('the aftermath remains wrecked while the real route and rendering continue', async () => {
    const before = await inspect();
    const after = await until(q => q.flight.elapsed >= before.flight.elapsed + .5);
    assert.equal(after.pose.frame, 5); assert.equal(after.flight.station.state, 'ruptured');
    assert.ok(after.flight.routeProgress > before.flight.routeProgress);
    assert.ok(after.draw.atlas[5] > before.draw.atlas[5]);
    profile.aftermath = {before, after};
  });
  profile.status = 'passed'; await save(); await context.close(); page = null;

  context = await openProfile('expected-missing-atlas', true);
  await check('an expected atlas 404 activates preserved station art without stopping the route', async () => {
    const q = await until(q => q.state === 'playing' && q.warpTimer === 0 && q.flight?.elapsed > .3 && q.assets.chronosDestruction.loadError);
    assert.equal(q.assets.chronosDestruction.loaded, false); assert.equal(q.assets.flightKit.loaded, true);
    assert.equal(await page.locator('#flightStage').innerText(), q.flight.stageName,
      'The fallback HUD retained its loading label');
    assert.ok(q.draw.flightKit[0] > 0, 'Preserved intact fallback was not actually drawn');
    assert.deepEqual(q.draw.atlas, {}, 'The blocked atlas unexpectedly rendered');
    assert.equal(profile.expectedHttpErrors.length, 1, 'The deliberately missing atlas was not recorded as exactly one expected 404');
    profile.fallbackStart = q; await capture('preserved-intact-station', q);
  });
  await check('the missing-atlas fallback still reaches the breach and draws preserved wreck art', async () => {
    const q = await until(q => q.flight?.elapsed >= 10 && q.draw.flightKit[1] > 0);
    assert.equal(q.state, 'playing'); assert.equal(q.flight.station.state, 'ruptured');
    assert.ok(q.flight.elapsed > profile.fallbackStart.flight.elapsed);
    assert.equal(q.assets.chronosDestruction.loadError, true); assert.deepEqual(q.draw.atlas, {});
    assert.equal(profile.expectedHttpErrors.length, 1); await capture('preserved-wreck-station', q);
  });
  profile.status = 'passed'; await save(); await context.close(); page = null;
  for (const [name, recorded] of Object.entries(report.packageFiles)) {
    assert.equal(sha256(await fs.readFile(path.join(root, 'juego', name))), recorded.sha256, `Package changed during QA: ${name}`);
  }
  report.packageUnchanged = true; report.status = 'passed'; report.exitCode = 0;
})().catch(async error => {
  report.status = 'failed'; report.exitCode = 1; report.error = errorText(error); if (profile) profile.status = 'failed';
  if (page) {
    try { profile.failureSnapshot = await inspect(); } catch {}
    try { const file = `${profile?.id || 'unknown'}-failure.png`; await page.screenshot({path: path.join(output, file), timeout: 5000}); profile.failureScreenshot = file; } catch {}
  }
  console.error(report.error);
}).finally(async () => {
  report.durationMs = Date.now() - started; report.finishedAt = new Date().toISOString();
  if (server) report.requests = server.requests;
  if (browser) await browser.close().catch(() => {}); if (server) await server.close().catch(() => {});
  if (evidenceReady) await save();
  console.log(JSON.stringify({status: report.status, exitCode: report.exitCode,
    profiles: report.profiles.map(value => ({id: value.id, status: value.status, checks: value.checks.length})), output, durationMs: report.durationMs}));
  process.exitCode = report.exitCode ?? 1;
});
