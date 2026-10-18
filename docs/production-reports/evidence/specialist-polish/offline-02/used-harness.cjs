// Real same-origin Chromium upgrade between two exact preserved preview packages.
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
const {values} = parseArgs({options: {root: {type: 'string'}, previous: {type: 'string'}, output: {type: 'string'}, timeout: {type: 'string'}, 'expected-commit': {type: 'string'}, 'previous-commit': {type:'string'}}});
const root = path.resolve(values.root || 'preview-dist');
const previous = path.resolve(values.previous || '/tmp/neon-chapter-previous49');
const expectedPrevious=values['previous-commit']||'49e4e59e7f5301d2b44e929755b4895f5b830212';
assert.match(expectedPrevious,/^[a-f0-9]{40}$/,'Require the exact previous package commit');
const output = path.resolve(values.output || 'docs/production-reports/evidence/chapter-one/offline-01');
const timeout = Number(values.timeout || 120000);
assert.ok(Number.isFinite(timeout) && timeout >= 30000 && timeout <= 180000);
assert.notEqual(root, previous, 'Current and previous packages must be different directories');
const began = Date.now();
const report = {status: 'running', exitCode: null, command: process.argv, startedAt: new Date().toISOString(),
  root, previous, cases: [], errors: [], consoleErrors: [], failedRequests: [], incidentalBrowserRequests: [],
  screenshots: [], assetResponses: [],
  limits: ['Real Chromium native service workers on a temporary same-origin HTTP copy; not an installed iPhone PWA or Safari.',
    'Previous is an immutable copy of the explicitly identified prior package. Both inputs are hashed before/after; only a temporary same-origin serving copy is replaced.',
    'Upgrade scenario seeds declared compatibility saves, including an authentic old-schema empty salvage ledger: zero money, zero purchases. These are fixtures, not progress earned in play. A separate fresh context launches the naturally unlocked chapter without any seeded save.',
    'No source hooks, request interception, entity insertion, clock acceleration or in-flight counter changes.',
    'RAF and drawImage observers call the original functions unchanged and do not create another animation loop.',
    'Checks native worker upgrade/offline restart, saved progress/economy migration, three new atlases and two AAC scores, current ship/projectiles, and N7 regression. Fresh chapter launch is natural UI operation; this is not a full chapter/boss balance certification or aesthetic/device acceptance.']};
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
  report.cases.push(entry); await save(); console.log(`[Chapter offline upgrade] ${name}`);
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
    if (/\/assets\/(?:(?:player_ship_identity_v1|ship_modular_atlas_v1|arcade_pulse_atlas_v2|gaia_pulse_atlas_v3|hostile_ordnance_atlas_v1|chapter1_intro_atlas_v1|chapter1_portraits_v1|chapter1_missile_atlas_v1|guardian_atlas_states_v2|cronium_energy_atlas_v2)\.webp|chapter1_(?:opening|voyage)_score_v1\.m4a|combat_sfx_atlas_v1\.(?:m4a|json))(?:\?|$)/.test(response.url()))
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
  const q = window.__CHAPTER_OFFLINE_OBSERVER__;
  return {draw: JSON.parse(JSON.stringify(q.draw)), raf: {frames: q.raf.frames, maximum: q.raf.maximum, errors: [...q.raf.errors], overlaps: q.raf.overlaps}};
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
function savedBytesEqual(actual, fixture, allowEconomyMigration=false) {
  for (const [key, value] of Object.entries(fixture)) {
    if(allowEconomyMigration&&key.endsWith('neonCatcher.classicSalvage.v1')) {
      const migrated=JSON.parse(actual[key]);
      assert.equal(migrated.version,1);assert.equal(migrated.revision,2);
      for(const field of ['balance','earned','spent'])assert.equal(migrated[field],0);
      assert.deepEqual(migrated.upgrades,[]);assert.deepEqual(migrated.purchases,[]);
      assert.equal(migrated.missileAmmo,3);assert.equal(migrated.missileShotsSpent,0);
      const backup=JSON.parse(actual[key+':migration-backups']);
      assert.ok(backup.records.includes(value),'Actual prior wallet bytes were not backed up before migration');
    } else assert.equal(actual[key], value, `Prior save changed before launch: ${key}`);
  }
}

const chapterAssets=['chapter1_intro_atlas_v1.webp','chapter1_portraits_v1.webp',
  'chapter1_missile_atlas_v1.webp','chapter1_opening_score_v1.m4a','chapter1_voyage_score_v1.m4a',
  'guardian_atlas_states_v2.webp','cronium_energy_atlas_v2.webp','combat_sfx_atlas_v1.m4a','combat_sfx_atlas_v1.json'];
async function verifyChapterAssetsOffline(page) {
  const results=[];
  for(const file of chapterAssets) {
    const item=await page.evaluate(async file=>{
      const response=await fetch('assets/'+file),bytes=await response.arrayBuffer();
      const result={file,status:response.status,bytes:bytes.byteLength,online:navigator.onLine,
        sha256:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('')};
      if(file.endsWith('.webp')) {
        const image=new Image();image.src='assets/'+file;await image.decode();
        result.width=image.naturalWidth;result.height=image.naturalHeight;
      } else if(file.endsWith('.json')) {
        result.metadata=JSON.parse(new TextDecoder().decode(bytes));
      } else {
        // OfflineAudioContext only decodes the actual returned artifact. It
        // neither drives gameplay nor creates an audible second music owner.
        const decoder=new OfflineAudioContext(2,1,44100);
        const audio=await decoder.decodeAudioData(bytes.slice(0));
        result.duration=audio.duration;result.channels=audio.numberOfChannels;result.sampleRate=audio.sampleRate;
        const samples=audio.getChannelData(0);let peak=0;
        for(let index=0;index<samples.length;index+=101)peak=Math.max(peak,Math.abs(samples[index]));
        result.sampledPeak=peak;
      }
      return result;
    },file);
    const disk=await fs.readFile(path.join(root,'juego/assets',file));
    assert.equal(item.online,false);assert.equal(item.status,200);
    assert.equal(item.bytes,disk.length);assert.equal(item.sha256,sha256(disk));
    if(file.endsWith('.webp')) {
      const dimensions={'chapter1_intro_atlas_v1.webp':[1024,1536],
        'chapter1_portraits_v1.webp':[768,256],'chapter1_missile_atlas_v1.webp':[1024,1024],
        'guardian_atlas_states_v2.webp':[2048,1024],'cronium_energy_atlas_v2.webp':[512,512]};
      assert.deepEqual([item.width,item.height],dimensions[file],`${file} must decode at its actual registered dimensions`);
    }
    else if(file.endsWith('.json')) assert.ok(item.metadata&&typeof item.metadata==='object','Cue metadata decodes offline');
    else if(file.startsWith('combat_')){assert.equal(item.channels,1);assert.ok(item.duration>=13.56&&item.duration<15);assert.ok(item.sampledPeak>.001);}
    else {assert.equal(item.channels,2);assert.equal(item.duration,file.includes('opening')?28:48);assert.ok(item.sampledPeak>.001);}
    assert.ok(report.assetResponses.some(response=>response.offline&&response.fromServiceWorker&&response.url.endsWith('/'+file)),
      file+' must be returned by its real current game service worker');
    results.push(item);
  }
  return results;
}
async function launcherBrand(page) {
  brand(await page.title()); brand(await page.locator('h1').innerText());
  await page.locator('.hero img').evaluate(image => image.decode());
  const layout = await page.locator('h1').evaluate(element => {
    const r = element.getBoundingClientRect(), image = document.querySelector('.hero img').getBoundingClientRect();
    return {text: element.innerText, x: r.x, right: r.right, width: r.width, height: r.height,
      top:r.top,bottom:r.bottom,imageTop:image.top,imageBottom:image.bottom,imageRight:image.right,
      scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth, imageLeft: image.left};
  });
  assert.ok(layout.x >= 0 && layout.right <= layout.viewport + 1, 'Brand heading extends beyond the viewport');
  assert.ok(layout.scrollWidth <= layout.clientWidth + 1, 'Brand letters overflow their heading box');
  assert.ok(layout.documentWidth <= layout.viewport + 1, 'Launcher creates horizontal scrolling');
  assert.ok(layout.right <= layout.imageLeft + 1 || layout.imageRight <= layout.x + 1 ||
    layout.bottom <= layout.imageTop + 1 || layout.imageBottom <= layout.top + 1, 'Brand heading overlaps the portrait');
  assert.equal(await page.locator('#qaArchive,#n7link,#journeylink,#unlockClassic,#unlock').count(),0,
    'The current entry cannot expose archived variants or QA unlocks');
  assert.equal(await page.locator('a[href*="campaign="]').count(),0);
  assert.doesNotMatch(await page.locator('body').innerText(),/ARCHIVO DE PRUEBAS|VERSIÓN EXPERIMENTAL|PRUEBA EXPERIMENTAL|V7\.2\.0/i);
  const manifests = await page.evaluate(async () => {
    const results = [];
    for (const file of ['manifest.webmanifest']) {
      const url = new URL(file, location.href).href, response = await fetch(url), value = await response.json();
      results.push({file, url, status: response.status, value});
    }
    return results;
  });
  for (const item of manifests) { assert.equal(item.status, 200); brand(item.value.name); brand(item.value.short_name); }
  return {title: await page.title(), layout, manifests, worker: await workerState(page),canonicalEntry:true,legacyControls:0};
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
  savedBytesEqual(await storage(page), fixture,true);
  assert.match(await page.locator('#playSector').innerText(), /ETAPA 1\.3\/10/);
  assert.equal((await page.locator('#best').innerText()).trim(), '1739');
  await page.locator('#openHangar').click(); await page.locator('#shipHangar.show').waitFor();
  assert.equal(await page.locator('#shipHull').inputValue(), 'aster');
  assert.equal(await page.locator('#shipWings').inputValue(), 'bastion');
  assert.equal(await page.locator('#shipEngines').inputValue(), 'aster');
  await page.locator('#shipHangarBack').click();
  savedBytesEqual(await storage(page), fixture,true);
  return {title: await page.title(), manifest, playSector: await page.locator('#playSector').innerText(), storage: await storage(page)};
}

async function prepareContext() {
  context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, serviceWorkers: 'allow'});
  await context.addInitScript(() => {
    const q = window.__CHAPTER_OFFLINE_OBSERVER__ = {draw: {}, raf: {frames: 0, maximum: 0, pending: new Set(), details: new Map(), overlaps: [], errors: []}};
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
      const answer = Reflect.apply(draw, this, [image, ...args]);
      const file = image?.src?.split('/').at(-1)?.split('?')[0];
      if (file && this.canvas?.id === 'canvas') q.draw[file] = (q.draw[file] || 0) + 1;
      return answer;
    };
    const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => {
      const id = request(time => { q.raf.pending.delete(id); q.raf.details.delete(id); q.raf.frames++;
        try { callback(time); } catch (error) { q.raf.errors.push(error.stack || String(error)); throw error; } });
      q.raf.pending.add(id); q.raf.details.set(id, {name: callback.name, source: String(callback).slice(0, 250), stack: new Error().stack});
      q.raf.maximum = Math.max(q.raf.maximum, q.raf.pending.size);
      if (q.raf.pending.size > 1 && q.raf.overlaps.length < 10) q.raf.overlaps.push([...q.raf.details.values()]);
      return id;
    };
    window.cancelAnimationFrame = id => { q.raf.pending.delete(id); q.raf.details.delete(id); return cancel(id); };
  });
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
  assert.equal(report.currentInfo.dirty, false, 'Upgrade certification requires a clean final package');
  if(values['expected-commit'])assert.equal(report.currentInfo.commit,values['expected-commit'],'Wrong immutable package for this QA');
  assert.equal(report.previousInfo.commit,expectedPrevious,'Preserve and identify the actual prior package');
  assert.equal(report.previousInfo.dirty,false,'The prior input must also be a clean preserved build');
  assert.equal(report.previousInfo.engineV1,false);
  assert.notEqual(report.previousInfo.revision, report.currentInfo.revision, 'Build the new preview before running this test');
  assert.equal(report.previousInfo.storagePrefix, report.currentInfo.storagePrefix, 'This chapter update must not change save isolation');
  assert.equal(report.currentInfo.engineV1, false);
  report.currentPackageBefore = await packageFiles(root); report.previousPackageBefore = await packageFiles(previous);
  const model = await import(pathToFileURL(path.resolve(__dirname, '../src/game/progression/chronos-flight.js')).href);
  const checkpoint = model.createChronosVoyageCheckpoint(3, {goal: 36});
  const prefix = report.previousInfo.storagePrefix;
  const economy=await import(pathToFileURL(path.resolve(__dirname,'../src/game/progression/scrap-economy.js')).href);
  const historicalEmptySalvage={version:1,balance:0,earned:0,spent:0,runSequence:0,activeRun:null,upgrades:[],purchases:[]};
  const emptySalvage=economy.normalizeScrapRecord(historicalEmptySalvage);
  assert.ok(economy.normalizeScrapRecord(emptySalvage));
  const fixture = report.seededPreviousSaveFixture = {
    [`${prefix}neon-best-v2`]: '1739', [`${prefix}neon-unlocked-v2`]: '1',
    [`${prefix}neon-n7-unlocked-v1`]: '37',
    [`${prefix}neonCatcher.shipFleet.v1`]: JSON.stringify({version: 1, mode: 'modular', loadout: {hull: 'aster', wings: 'bastion', engines: 'aster'}}),
    [`${prefix}neonCatcher.flightEquipment.v1`]: JSON.stringify({version: 1, recoveredTwin: true, unlocked: ['pulse', 'twin'], selected: 'twin'}),
    [`${prefix}${model.CHRONOS_VOYAGE_KEY}`]: JSON.stringify({version: 2, checkpoint,
      entry: {hull: 74, score: 160, maxCombo: 3, collected: checkpoint.collected}, unlockedStage: 3, completed: false}),
    [`${prefix}${economy.SCRAP_ECONOMY_KEY}`]:JSON.stringify(historicalEmptySalvage),
    'neon-unlocked-v2': '7', 'neon-best-v2': '25000', 'neon-n7-unlocked-v1': '42'
  };
  temp = await fs.mkdtemp(path.join(os.tmpdir(), 'neon-cronium-chapter-upgrade-'));
  await fs.cp(previous, temp, {recursive: true});
  server = await startStaticServer(temp);
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']});
  report.browser = browser.version();
  await prepareContext();
  await step('install the actual previous launcher/game workers and seed declared prior-save fixtures', async () => {
    const page = await newPage(); await page.goto(server.url, {waitUntil: 'load'});
    const previousHtml=await fs.readFile(path.join(previous,'index.html'),'utf8');
    const previousTitle=previousHtml.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(previousTitle,'Previous real package must declare its own title');
    assert.equal(await page.title(),previousTitle,'Install the exact prior release, including its actual brand');
    await waitAsync(page, () => navigator.serviceWorker.controller?.scriptURL.endsWith('/launcher-sw.js'));
    await capture(page, 'previous-launcher');
    await page.locator('#classiclink').click();
    await waitAsync(page, () => navigator.serviceWorker.controller?.scriptURL.endsWith('/juego/sw.js'));
    await waitAsync(page, async revision => {
      const own = (await caches.keys()).filter(key => key.startsWith('neon-preview-v1:') || key.startsWith('neon-preview-launcher-v1:'));
      return own.length === 2 && own.every(key => key.endsWith(revision));
    }, report.previousInfo.revision);
    await page.evaluate(values => { for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value); }, fixture);
    await page.evaluate(async () => { const cache = await caches.open('chapter-offline-unrelated-app'); await cache.put('/keep', new Response('untouched')); });
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
    assert.ok(current.caches.includes('chapter-offline-unrelated-app'));
    savedBytesEqual(await storage(page), fixture);
    await page.close(); return current;
  });
  await step('new online launcher/manifests fit 390px without booting the upgraded game yet', async () => {
    const page = await newPage(); await page.goto(server.url, {waitUntil: 'load'});
    const launcher = await launcherBrand(page); await capture(page, 'current-online-launcher');
    await page.locator('#classiclink').click();
    // Leave the new game unbooted here: the next step validates its actual save migration while offline.
    await page.close(); return {launcher,newGameNotBooted:true};
  });
  offline = true; await context.setOffline(true);
  report.requestsBeforeOffline = server.requests.length;
  await step('offline first boot retains prior progress and migrates the zero-money historical wallet with backup', async () => {
    const page = await newPage(); await page.goto(server.url, {waitUntil: 'load'});
    const launcher = await launcherBrand(page);
    assert.equal(launcher.worker.online, false); assert.ok(launcher.worker.controller.endsWith('/launcher-sw.js'));
    await capture(page, 'current-offline-launcher');
    assert.ok(report.assetResponses.some(item => item.offline && item.fromServiceWorker && item.url.endsWith('/player_ship_identity_v1.webp')));
    await page.locator('#classiclink').click();
    const game = await gameBrandAndSave(page, fixture); await capture(page, 'current-offline-menu');
    assert.equal((await workerState(page)).online, false);
    report.chapterAssetsOffline=await verifyChapterAssetsOffline(page);
    assert.equal(report.chapterAssetsOffline.length,9);
    report.offlineStorageBeforeLaunch = await storage(page);
    await page.close(); return {launcher, game};
  });
  await step('offline CONTINUAR resumes fixture stage 1.3 and draws the actual modular ship with one RAF', async () => {
    const page = await newPage(); await page.goto(new URL('juego/index.html', server.url).href, {waitUntil: 'load'});
    await page.locator('#menu.show').waitFor(); savedBytesEqual(await storage(page), fixture,true); brand(await page.title());
    await page.locator('#play').click();
    assert.equal(await page.locator('[data-voyage-stage="3"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-voyage-stage]:disabled').count(), 7);
    await capture(page, 'current-offline-checkpoint-briefing');
    await page.locator('#launch').click();
    await waitAsync(page, () => window.__CHAPTER_OFFLINE_OBSERVER__.draw['ship_modular_atlas_v1.webp'] >= 24 && !document.querySelector('#fire').disabled);
    assert.equal((await page.locator('#hudLevel').innerText()).trim(), '1');
    assert.match((await page.locator('#flightStage').textContent()).trim(),/^1\.3\s*·/);
    assert.match((await page.locator('#flightDestination').textContent()).trim(),/3\/10$/);
    assert.equal((await page.locator('#goal').innerText()).trim(), '8/36');
    assert.equal((await page.locator('#hull').innerText()).trim(), '74%');
    assert.equal((await page.locator('#flightWeaponName').innerText()).trim(), 'GEMELO');
    const running = await observer(page); assert.equal(running.raf.maximum, 1); assert.deepEqual(running.raf.errors, []);
    assert.ok(report.assetResponses.some(item => item.offline && item.fromServiceWorker && item.url.endsWith('/ship_modular_atlas_v1.webp')));
    assert.equal((await page.locator('#ammo').textContent()).trim(),'');
    assert.equal(await page.locator('#ammo').getAttribute('aria-hidden'),'true');
    assert.doesNotMatch(await page.locator('#fire').getAttribute('aria-label'),/\d|cargas|segundos/i);
    await page.locator('#fire').click();
    await waitAsync(page,()=>window.__CHAPTER_OFFLINE_OBSERVER__.draw['gaia_pulse_atlas_v3.webp']>=1);
    report.offlineCombatAssets=[];
    for(const file of ['gaia_pulse_atlas_v3.webp','hostile_ordnance_atlas_v1.webp','arcade_pulse_atlas_v2.webp']) {
      const cached=await page.evaluate(async file=>{
        const response=await fetch('assets/'+file),bytes=await response.arrayBuffer();
        const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');
        const image=new Image();image.src='assets/'+file;await image.decode();
        return {file,status:response.status,bytes:bytes.byteLength,sha256:digest,online:navigator.onLine,
          width:image.naturalWidth,height:image.naturalHeight};
      },file);
      const expected=await fs.readFile(path.join(root,'juego/assets',file));
      assert.equal(cached.online,false);assert.equal(cached.status,200);
      assert.equal(cached.sha256,sha256(expected));assert.equal(cached.bytes,expected.length);
      assert.equal(cached.width,1024);assert.equal(cached.height,1024);
      assert.ok(report.assetResponses.some(item=>item.offline&&item.fromServiceWorker&&item.url.endsWith('/'+file)),
        file+' must come from its actual current service worker cache');
      report.offlineCombatAssets.push(cached);
    }
    report.offlinePulse=report.offlineCombatAssets.find(item=>item.file==='gaia_pulse_atlas_v3.webp');
    await capture(page, 'current-offline-continuation-playing');
    // The existing HUD counts up to the restored score across render frames.
    // Wait for its known checkpoint target before measuring a paused HUD;
    // otherwise the presentation tween (159 -> 160) is mistaken for simulation.
    // Poll via evaluate/timer: Playwright waitForFunction adds its own RAF.
    await waitAsync(page, () => document.getElementById('score').textContent.trim() === '160');
    await page.locator('#pause').click(); await page.locator('#paused.show').waitFor();
    const hud = () => page.evaluate(() => Object.fromEntries(['score', 'goal', 'hull', 'ammo'].map(id => [id, document.getElementById(id)?.textContent?.trim()])));
    const frozen = await hud(); await page.waitForTimeout(600); assert.deepEqual(await hud(), frozen);
    const afterLaunch = await storage(page);
    for (const [key, value] of Object.entries(fixture)) {
      if (key.endsWith(model.CHRONOS_VOYAGE_KEY)||key===prefix+economy.SCRAP_ECONOMY_KEY) continue;
      assert.equal(afterLaunch[key], value, `Unrelated saved field changed while continuing: ${key}`);
    }
    const salvage=economy.normalizeScrapRecord(JSON.parse(afterLaunch[prefix+economy.SCRAP_ECONOMY_KEY]));
    assert.ok(salvage,'Offline launch retains a coherent salvage ledger');
    for(const field of ['balance','earned','spent'])assert.equal(salvage[field],emptySalvage[field]);
    assert.deepEqual(salvage.upgrades,emptySalvage.upgrades);assert.deepEqual(salvage.purchases,emptySalvage.purchases);
    assert.ok(salvage.activeRun,'A resumed checkpoint establishes one coherent persistent salvage expedition');
    report.offlineSalvage={before:emptySalvage,after:salvage,fixture:'Empty valid ledger; no rewards or purchases injected'};
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
  await step('offline N7 remains available through its historical direct URL without changing classic saves',async()=>{
    const page=await newPage();await page.goto(new URL('juego/index.html?campaign=n7',server.url).href,{waitUntil:'load'});
    await page.locator('#menu.show').waitFor();
    const before=await storage(page);
    assert.equal(before[prefix+'neon-n7-unlocked-v1'],'37','N7 progress fixture must survive the upgrade');
    const protectedKeys=Object.keys(before).filter(key=>!key.startsWith(prefix+'neon-n7-'));
    await page.locator('#levels').click();
    assert.equal(await page.locator('#levelGrid button').count(),100);
    assert.equal(await page.locator('#levelGrid button:not(:disabled)').count(),37);
    await page.locator('#levelGrid button').first().click();await page.locator('#launch').click();
    await waitAsync(page,()=>window.__CHAPTER_OFFLINE_OBSERVER__.draw['ship_modular_atlas_v1.webp']>=24&&!document.querySelector('#fire').disabled);
    assert.equal(await page.evaluate(()=>navigator.onLine),false);
    assert.match((await page.locator('#ammo').textContent()).trim(),/^3\/3$/,
      'N7 keeps its independent historical magazine contract');
    await page.locator('#pause').click();await page.locator('#paused.show').waitFor();
    const after=await storage(page);
    for(const key of protectedKeys)assert.equal(after[key],before[key],`N7 changed unrelated save: ${key}`);
    const audit=await observer(page);assert.equal(audit.raf.maximum,1);assert.deepEqual(audit.raf.errors,[]);
    await capture(page,'offline-n7-regression-paused');
    await page.locator('#resume').click();await page.locator('#paused.show').waitFor({state:'hidden'});
    await page.close();return {fixture:'N7 unlock37 is seeded compatibility data, not earned by this run',
      totalRoutes:100,unlockedRoutes:37,protectedKeys,offline:true,audit};
  });
  await step('separate fresh context naturally launches the first chapter offline without seeded progress or money',async()=>{
    await context.close();offline=false;await prepareContext();
    const online=await newPage();await online.goto(server.url,{waitUntil:'load'});
    await online.locator('#classiclink').click();
    await waitAsync(online,async revision=>{
      const own=(await caches.keys()).filter(key=>key.startsWith('neon-preview-v1:')||key.startsWith('neon-preview-launcher-v1:'));
      return own.length===2&&own.every(key=>key.endsWith(revision));
    },report.currentInfo.revision);
    const untouched=await storage(online);
    assert.equal(untouched[prefix+'neon-unlocked-v2']??null,null,'No campaign unlock fixture belongs to this fresh context');
    await online.close();offline=true;await context.setOffline(true);
    const page=await newPage();await page.goto(server.url,{waitUntil:'load'});
    await page.locator('#classiclink').click();await page.locator('#menu.show').waitFor();
    await page.locator('#play').click();
    assert.equal(await page.locator('[data-voyage-stage="1"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('[data-voyage-stage]:disabled').count(),9);
    await page.locator('#launch').click();
    await waitAsync(page,()=>window.__CHAPTER_OFFLINE_OBSERVER__.draw['chapter1_intro_atlas_v1.webp']>=1);
    await capture(page,'fresh-offline-authored-opening');
    await waitAsync(page,()=>window.__CHAPTER_OFFLINE_OBSERVER__.draw['ship_modular_atlas_v1.webp']>=24&&!document.querySelector('#fire').disabled);
    assert.equal((await page.locator('#hudLevel').innerText()).trim(),'1');
    assert.match((await page.locator('#flightStage').textContent()).trim(),/^1\.1\s*·/);
    assert.equal((await page.locator('#ammo').textContent()).trim(),'');
    const owned=JSON.parse((await storage(page))[prefix+economy.SCRAP_ECONOMY_KEY]);
    assert.equal(owned.balance,0);assert.equal(owned.earned,0);assert.equal(owned.spent,0);
    assert.equal(owned.missileAmmo,3);assert.deepEqual(owned.upgrades,[]);
    const audit=await observer(page);assert.equal(audit.raf.maximum,1);assert.deepEqual(audit.raf.errors,[]);
    await page.locator('#pause').click();await page.locator('#paused.show').waitFor();
    await capture(page,'fresh-offline-first-chapter-playing-paused');
    await page.close();return {fixtures:false,offline:true,stage:'1.1',wallet:owned,audit,
      scope:'Natural first launch and authored opening only; no full level/boss balance claim'};
  });
  clean(); report.status = 'passed'; report.exitCode = 0;
})().catch(async error => {
  report.status = 'failed'; report.exitCode = 1; report.error = errorText(error); process.exitCode = 1;
  const page = context?.pages().at(-1);
  if (page) { report.failureWorkerState = await workerState(page).catch(error => ({error: errorText(error)}));
    report.failureObserver = await observer(page).catch(error => ({error: errorText(error)}));
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
