// Natural ten-stage Chronos -> empty space -> C9 -> Gaia voyage using real inputs.
// No writes to game state, time, hull, entities, collection or save storage.
// node scripts/chronos-voyage-browser-smoke.cjs --root preview-dist --output /tmp/chronos-voyage-01 --timeout 1200000
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {startStaticServer, prepareEvidence, saveEvidence, sha256, errorText} = require('./browser-qa-helpers.cjs');

const {values} = parseArgs({options: {root: {type: 'string'}, output: {type: 'string'}, timeout: {type: 'string'},
  'expected-commit': {type: 'string'}}});
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output || `docs/production-reports/evidence/chronos-voyage/browser-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const timeout = Number(values.timeout || 1200000);
assert.ok(Number.isFinite(timeout) && timeout >= 30000 && timeout <= 1200000, 'Timeout must be 30000–1200000 ms');
const began = Date.now();
const report = {status: 'running', exitCode: null, command: process.argv, sourceRoot: root,
  startedAt: new Date().toISOString(), browser: 'Real Chromium, 390x844, DPR 1',
  pilotVersion: 'natural-chronos-pulse-prepared-c9-pursuit-v2', checks: [], errors: [], consoleErrors: [],
  failedRequests: [], screenshots: [], samples: [], damageObservations: [], boundaryObservations: [],
  pursuitObservations: [], enemyShotCounts: {raider: 0, scout: 0, interceptor: 0},
  qaScriptSha256: sha256(require('node:fs').readFileSync(__filename)),
  limits: ['Automatic QA pilot uses actual mouse, touch, keyboard and UI actions; not a human playtest.',
    'Fresh context, no unlocks or saves seeded. No game state, delta time, health, entities or collection are changed.',
    'Read-only inspection is injected into a local HTTP response. Shipped game files are unchanged.',
    'Service workers are blocked for this fresh-resource run; offline lifecycle is not certified.',
    'Software-rendered Chromium does not certify iPhone, Safari, aesthetic acceptance or 60 FPS.']};
try {
  report.git = {sha: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
    status: execFileSync('git', ['status', '--short'], {encoding: 'utf8'}).trim()};
} catch (error) { report.git = {error: error.message}; }
let server, browser, page, cdp, evidenceReady = false;
const save = () => saveEvidence(output, report);
const inspect = () => page.evaluate(() => ({...window.__FLIGHT_QA__(), raf: {
  maximum: window.__FLIGHT_RAF_QA__.maximum, pending: window.__FLIGHT_RAF_QA__.pending.size,
  frames: window.__FLIGHT_RAF_QA__.frames, errors: [...window.__FLIGHT_RAF_QA__.errors]
}}));
const wait = (fn, argument, milliseconds = 30000) => page.waitForFunction(fn, argument, {polling: 100, timeout: milliseconds});
function healthy(q) {
  assert.deepEqual(report.errors, [], 'Uncaught JavaScript exception');
  assert.deepEqual(report.consoleErrors, [], 'Console error');
  assert.deepEqual(report.failedRequests, [], 'Missing asset or failed request');
  assert.deepEqual(q.raf.errors, [], 'RAF callback threw');
  assert.ok(q.legacyRunning, 'Legacy loop stopped');
  assert.ok(q.raf.maximum <= 1, 'More than one RAF callback was pending');
}
async function check(name, action) {
  const entry = {name, status: 'running', startedAt: new Date().toISOString()};
  report.checks.push(entry); await save(); console.log(`[Chronos voyage natural] ${name}`);
  const start = Date.now();
  try { await action(); entry.snapshot = await inspect(); healthy(entry.snapshot); entry.status = 'passed'; }
  catch (error) { entry.status = 'failed'; entry.error = errorText(error); throw error; }
  finally { entry.durationMs = Date.now() - start; await save(); }
}
const captured = new Set();
async function capture(name, q) {
  if (captured.has(name)) return;
  captured.add(name);
  const file = `${String(report.screenshots.length + 1).padStart(2, '0')}-${name}.png`;
  await page.screenshot({path: path.join(output, file)});
  report.screenshots.push({file, type: 'Real running game viewport, natural controls',
    elapsed: q.elapsed, collected: q.collected, state: q.state,
    routeProgress: q.flight?.routeProgress, stage: q.flight?.stageId, phase: q.flight?.phase,
    equipment: q.equipment, station: q.flight?.station});
  await save();
}

function circleTouchesOutline(x, y, radius, outline) {
  let inside = false;
  for (let index = 0, previous = outline.length - 1; index < outline.length; previous = index++) {
    const [ax, ay] = outline[previous], [bx, by] = outline[index];
    if ((by > y) !== (ay > y) && x < (ax - bx) * (y - by) / ((ay - by) || .000001) + bx) inside = !inside;
    const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
    const along = length ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length)) : 0;
    if ((x - ax - along * dx) ** 2 + (y - ay - along * dy) ** 2 <= radius ** 2) return true;
  }
  return inside;
}

// This only chooses pointer actions. The game collision outline, spawning,
// supply budget and time remain exactly as shipped. Include the swept ship
// path so a lane change does not cross an otherwise avoidable obstacle.
function recoveryTarget(q) {
  const ship = q.player, bounds = q.bounds || {minX: 119, maxX: q.W - 119};
  const collectibles = q.items.filter(item => ['energy', 'flightModule', 'shield'].includes(item.type) && item.y < ship.y + 45)
    .sort((a, b) => (a.type === 'flightModule' ? -1 : b.type === 'flightModule' ? 1 : b.y - a.y));
  const next = collectibles[0];
  const candidates = [...collectibles.slice(0, 5).map(item => item.x), ship.x,
    119, 180, 240, 300, 360, 420, 480, 540, q.W - 119]
    .filter(Number.isFinite).map(x => Math.max(bounds.minX, Math.min(bounds.maxX, x)));
  const threats = q.items.filter(item => ['meteor', 'debris', 'satellite', 'scout'].includes(item.type));
  const cost = x => {
    let value = next ? Math.abs(x - next.x) * (next.type === 'flightModule' ? 1.2 : .45) : Math.abs(x - ship.x) * .05;
    for (const item of threats) {
      const speed = item.vy ?? item.s ?? 0;
      if (item.y > ship.y + 160 || item.y + speed * 1.3 < ship.y - 210) continue;
      for (let future = 0; future <= 1.3; future += .05) {
        const playerX = x + (ship.x - x) * Math.exp(-q.follow * future);
        const obstacleX = item.x + (item.classicScout?.vx ?? item.vx ?? 0) * future;
        const obstacleY = item.y + speed * future;
        const rotation = (item.rot || 0) + (item.rs || 0) * future;
        for (const circle of item.circles || [{x: 0, y: 0, r: item.r}]) {
          const localX = obstacleX + circle.x * Math.cos(rotation) - circle.y * Math.sin(rotation) - playerX;
          const localY = obstacleY + circle.x * Math.sin(rotation) + circle.y * Math.cos(rotation) - ship.y;
          const radius = circle.r + 9;
          if (Math.abs(localX) > 112 + radius || localY < -151 - radius || localY > 98 + radius) continue;
          if (circleTouchesOutline(localX, localY, radius, q.outline)) value += 1800 * (1.4 - future);
        }
      }
    }
    return value;
  };
  candidates.sort((a, b) => cost(a) - cost(b));
  return candidates[0] ?? q.W / 2;
}

async function touch(type, x, y) {
  await cdp.send('Input.dispatchTouchEvent', {type, touchPoints: type === 'touchEnd' ? [] : [{x, y, id: 7}]});
}

(async () => {
  await prepareEvidence(output); evidenceReady = true;
  await fs.copyFile(__filename, path.join(output, 'qa-script-used.cjs'));
  report.buildInfo = JSON.parse(await fs.readFile(path.join(root, 'build-info.json'), 'utf8'));
  if (values['expected-commit']) {
    assert.equal(report.buildInfo.commit, values['expected-commit'], 'Unexpected package commit');
    assert.equal(report.buildInfo.dirty, false, 'Final natural certification requires a clean source package');
  }
  report.packageFiles = {};
  for (const file of ['juego/game.js', 'juego/content-runtime.js', 'juego/styles.css', 'build-info.json']) {
    const bytes = await fs.readFile(path.join(root, file));
    report.packageFiles[file] = {bytes: bytes.length, sha256: sha256(bytes)};
  }
  server = await startStaticServer(root);
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
  const context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, serviceWorkers: 'block'});
  page = await context.newPage(); page.setDefaultTimeout(30000);
  cdp = await context.newCDPSession(page);
  page.on('pageerror', error => report.errors.push(errorText(error)));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('requestfailed', request => report.failedRequests.push({url: request.url(), error: request.failure()?.errorText}));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push({url: response.url(), status: response.status()}); });
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
    const audit = window.__FLIGHT_RAF_QA__ = {pending: new Set(), maximum: 0, frames: 0, errors: []};
    window.requestAnimationFrame = callback => {
      const id = request(now => {
        audit.pending.delete(id); audit.frames++;
        try {
          callback(now);
          // Observe the actual checkpoint frame, without changing any runtime
          // object or adding a second scheduler. The identities live in QA only.
          if (typeof window.__FLIGHT_BOUNDARY_QA__ === 'function') {
            const sample = window.__FLIGHT_BOUNDARY_QA__();
            const previous = audit.lastRouteSample;
            if (previous?.state === 'playing' && sample.state === 'playing' &&
                previous.stage && sample.stage && previous.stage !== sample.stage) {
              audit.boundaries.push({before: previous, after: sample});
            }
            audit.lastRouteSample = sample;
          }
        } catch (error) { audit.errors.push(error.stack || String(error)); throw error; }
      });
      audit.pending.add(id); audit.maximum = Math.max(audit.maximum, audit.pending.size); return id;
    };
    window.cancelAnimationFrame = id => { audit.pending.delete(id); cancel(id); };
    audit.boundaries = [];
  });
  await page.route(/\/game\.js(?:\?.*)?$/, async route => {
    const response = await route.fetch(), body = await response.body(), source = body.toString('utf8');
    report.gameBundle = {bytes: body.length, sha256: sha256(body)};
    const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
    assert.equal(source.split(marker).length, 2, 'Legacy bootstrap marker changed');
    const hook = `const qaEntityIds = new WeakMap(); let qaEntitySequence = 0;
      const qaEntityId = item => {if(!qaEntityIds.has(item))qaEntityIds.set(item,++qaEntitySequence);return qaEntityIds.get(item);};
      window.__FLIGHT_BOUNDARY_QA__ = () => ({state,elapsed,stage:classicFlightView?.stageNumber,
        routeElapsed:classicFlightView?.elapsed,player:{x:player.x,y:player.y},
        items:items.map(item=>({qaId:qaEntityId(item),id:item.id,type:item.type,x:item.x,y:item.y,hp:item.hp,
          projectile:Boolean(item.classicScoutProjectile),role:item.classicScout?.role})),
        shots:classicWeapons?.projectiles.map(shot=>({id:shot.id,x:shot.x,y:shot.y,life:shot.life}))||[]});
      window.__FLIGHT_QA__ = () => ({state,currentLevel,elapsed,hull,score,collected,goal:level().goal,W,H,
      energySpawned,energyBudget,warpTimer,manualShotCooldown,legacyRunning,legacyFrameId,
      settingsAutoFire:settings.autoFire,
      player:{x:player.x,y:player.y,w:player.w,h:player.h,target:player.target,targetY:player.targetY},
      bounds:classicFlightBounds?{...classicFlightBounds}:null,
      follow:9+settings.sensitivity/100*8,outline:SHIP_COLLISION_OUTLINE,
      flight:classicFlightView?JSON.parse(JSON.stringify(classicFlightView)):null,
      voyageSave:classicVoyageRecord?JSON.parse(JSON.stringify(classicVoyageRecord)):null,
      weapons:classicWeapons?{...NeonCampaign.classicWeaponSnapshot(classicWeapons),shotSequence:classicWeapons.shotSequence}:null,
      equipment:JSON.parse(JSON.stringify(classicEquipment)),
      items:items.map(item=>({qaId:qaEntityId(item),id:item.id,type:item.type,x:item.x,y:item.y,s:item.s,r:item.r,vx:item.vx,vy:item.vy,
        rot:item.rot,rs:item.rs,hp:item.hp,circles:collisionCircles(item).map(circle=>({...circle})),flightComet:Boolean(item.flightComet),
        flightPatrol:Boolean(item.flightPatrol),guardianProjectile:Boolean(item.guardianProjectile),
        classicScoutProjectile:Boolean(item.classicScoutProjectile),attackSerial:item.attackSerial,role:item.role,
        classicScout:item.classicScout?{tacticsVersion:item.classicScout.tacticsVersion,role:item.classicScout.role,
          state:item.classicScout.state,age:item.classicScout.age,vx:item.classicScout.vx,fired:item.classicScout.fired,
          telegraph:item.classicScout.telegraph,chargeSerial:item.classicScout.chargeSerial,
          firedSerial:item.classicScout.firedSerial,holdY:item.classicScout.holdY,
          combatStartedAt:item.classicScout.combatStartedAt,retreatReason:item.classicScout.retreatReason,
          repositionCount:item.classicScout.repositionCount,
          lockedTarget:item.classicScout.lockedTarget?{...item.classicScout.lockedTarget}:null,
          frame:item.classicScout.animator?.getFrame()}:null})),
      boundaries:[...window.__FLIGHT_RAF_QA__.boundaries],
      unlocked:getUnlocked(),keys:{...KEYS},saves:Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)]))});\n`;
    await route.fulfill({response, body: source.replace(marker, hook + marker)});
  });
  await check('fresh launcher enters only the first unlocked stage using the real UI', async () => {
    await page.goto(server.url, {waitUntil: 'load'});
    assert.equal(await page.locator('#unlockClassic').isChecked(), false);
    await page.locator('#classiclink').click();
    await wait(() => typeof __FLIGHT_QA__ === 'function' && __FLIGHT_QA__().state === 'menu');
    const menu = await inspect(); report.initialSaves = menu.saves; report.gameURL = page.url();
    assert.equal(menu.unlocked, 1); assert.equal(menu.equipment.recoveredTwin, false);
    assert.equal(menu.settingsAutoFire,false,'Fresh saves start with manual fire');
    assert.deepEqual(menu.equipment.unlocked,['pulse']);
    await page.locator('#play').click();
    assert.equal(await page.locator('[data-voyage-stage]').count(), 10);
    assert.equal(await page.locator('[data-voyage-stage]:disabled').count(), 9);
    await page.locator('#launch').click();
    await wait(() => __FLIGHT_QA__().state === 'playing' && __FLIGHT_QA__().warpTimer === 0);
    const start = await inspect();
    assert.equal(start.currentLevel, 0); assert.equal(start.flight.stageNumber, 1);
    assert.equal(start.flight.stageId, '1.1'); assert.equal(start.flight.minDuration, 360);
    assert.equal(start.weapons.charges, 3); await capture('stage-01-emergencia-chronos', start);
  });
  let box = await page.locator('#canvas').boundingBox();
  await check('relative touch and pause freeze the single real route and weapons clock', async () => {
    const before = await inspect();
    const anchor = {x: box.x + box.width * .22, y: box.y + box.height * .48};
    await touch('touchStart', anchor.x, anchor.y); const down = await inspect();
    assert.equal(down.player.target, before.player.target);
    assert.equal(down.player.targetY, before.player.targetY);
    await touch('touchMove', anchor.x + 45, anchor.y - 35); const moved = await inspect();
    assert.ok(moved.player.target > before.player.target + 20);
    assert.ok(moved.player.targetY < before.player.targetY - 20);
    await touch('touchMove', anchor.x, anchor.y); await touch('touchEnd');
    await page.locator('#fire').click();
    assert.equal((await inspect()).weapons.charges, 2);
    await page.locator('#pause').click();
    const frozen = await inspect(); assert.equal(frozen.state, 'paused');
    await page.waitForTimeout(800); const after = await inspect();
    assert.equal(after.elapsed, frozen.elapsed); assert.deepEqual(after.flight, frozen.flight);
    assert.deepEqual(after.weapons, frozen.weapons);
    await page.locator('#resume').click();
    report.pause = {before: frozen.flight, after: after.flight, weaponsUnchanged: true};
  });
  let lastSample = 0, lastProgress = 0, previous, minX = Infinity, maxX = -Infinity;
  let firedCount = 1, checkpointVerified = false, serviceVerified = false;
  let documentGeneration = 0, pursuitPauseVerified = false;
  const observedPursuers = new Map(), observedShots = new Set();
  const observePursuit = q => {
    for (const item of q.items) {
      if (item.classicScout?.tacticsVersion !== 'classic-pursuit-v2') continue;
      const id = `${documentGeneration}:${item.qaId}`;
      let record = observedPursuers.get(id);
      if (!record) {
        record = {id, runtimeId: item.id, role: item.classicScout.role, firstElapsed: q.elapsed,
          firstRouteElapsed: q.flight?.elapsed, firstStage: q.flight?.stageId,
          fired: 0, states: [], frames: [], minimumX: item.x, maximumX: item.x};
        observedPursuers.set(id, record); report.pursuitObservations.push(record);
      }
      record.minimumX = Math.min(record.minimumX, item.x); record.maximumX = Math.max(record.maximumX, item.x);
      if (!record.states.includes(item.classicScout.state)) record.states.push(item.classicScout.state);
      const frame = item.classicScout.frame;
      if (frame && !record.frames.some(previous => previous.image === frame.image && previous.index === frame.frameIndex)) {
        record.frames.push({image: frame.image, index: frame.frameIndex, state: frame.state});
      }
      const fired = item.classicScout.fired;
      assert.ok(fired >= record.fired, 'An existing enemy fire count regressed');
      assert.ok(fired <= (record.role === 'interceptor' ? 4 : 3), 'Enemy exceeded the pursuit-v2 attack budget');
      assert.ok(item.classicScout.firedSerial<=item.classicScout.chargeSerial,'Fire serial exceeds announced charges');
      if(item.classicScout.state==='retreat')assert.ok(['time-limit','attack-budget'].includes(item.classicScout.retreatReason),
        'A final retreat must have a bounded, documented cause');
      report.enemyShotCounts[record.role] += fired - record.fired; record.fired = fired;
    }
    for (const shot of q.items.filter(item => item.classicScoutProjectile)) {
      observedShots.add(`${documentGeneration}:${shot.qaId}`);
    }
  };
  const recordBoundaries = q => {
    for (const boundary of q.boundaries) {
      if (report.boundaryObservations.some(entry => entry.document === documentGeneration &&
          entry.before.stage === boundary.before.stage && entry.after.stage === boundary.after.stage)) continue;
      report.boundaryObservations.push({document: documentGeneration, ...boundary});
    }
  };
  const stageNumbers = new Set([1]), stageSnapshots = {}, quotas = [4,8,12,16,18,18,24,28,32,36];
  const sessionBegan = Date.now();
  await check('naturally play all ten connected stages, recover the piece, use C9 and arrive at Gaia', async () => {
    while (Date.now() - sessionBegan < timeout) {
      let q = await inspect(); healthy(q);
      observePursuit(q); recordBoundaries(q);
      if (previous && q.hull < previous.hull) report.damageObservations.push({elapsed: q.elapsed,
        routeElapsed: q.flight?.elapsed, stage: q.flight?.stageId, before: previous.hull, after: q.hull});
      previous = q;
      assert.ok(!['destroying','gameover'].includes(q.state), `Natural pilot died at ${q.flight?.stageId} with ${q.hull} hull`);
      assert.ok(q.flight, 'First-territory route disappeared before arrival');
      minX = Math.min(minX, q.player.x); maxX = Math.max(maxX, q.player.x);
      const n = q.flight.stageNumber;
      if (!stageNumbers.has(n)) {
        assert.equal(n, Math.max(...stageNumbers) + 1, 'A playable stage was skipped');
        assert.ok(q.collected >= quotas[n-2], 'Stage advanced without completing previous quota');
        stageNumbers.add(n);
      }
      stageSnapshots[n] ??= q.flight;
      if (n >= 2 && q.flight.stageElapsed >= 3) await capture(`stage-${String(n).padStart(2,'0')}-${q.flight.stageEvent}`, q);
      if (q.flight.attacker?.state === 'fire') await capture('reactor-attack', q);
      if (q.items.some(item => item.classicScout?.state === 'charge')) {
        await capture('pursuer-locks-announced-target', q);
        if (!pursuitPauseVerified) {
          await page.locator('#pause').click(); const frozen = await inspect();
          await page.waitForTimeout(600); const after = await inspect();
          assert.equal(after.elapsed, frozen.elapsed); assert.deepEqual(after.items, frozen.items);
          assert.deepEqual(after.weapons, frozen.weapons);
          report.pursuitPause = {before: frozen, after, unchanged: true};
          await page.locator('#resume').click(); pursuitPauseVerified = true; continue;
        }
      }
      if (q.items.some(item => item.classicScoutProjectile)) await capture('pursuer-live-projectile', q);
      if (q.items.some(item => item.flightComet && item.x > 20 && item.x < q.W - 20)) await capture(`comet-stage-${n}`, q);
      if (q.items.some(item => item.type === 'flightModule')) await capture('recoverable-emitter', q);
      if (q.equipment.recoveredTwin) await capture('emitter-recovered', q);
      if (Date.now() - lastSample > 2000) {
        report.samples.push({wallMs: Date.now() - sessionBegan, elapsed: q.elapsed, routeElapsed: q.flight.elapsed,
          routeProgress: q.flight.routeProgress, stageNumber:n, stageId:q.flight.stageId, stageProgress:q.flight.stageProgress,
          goal:q.flight.stageGoal, objective:q.flight.stageObjective, origin:q.flight.stageOrigin,destination:q.flight.stageDestination,
          state:q.state,collected:q.collected,hull:q.hull,entities:q.items.length,charges:q.weapons?.charges,
          waitingFor:q.flight.waitingFor,rafFrames:q.raf.frames,
          pursuers:q.items.filter(item=>item.classicScout).map(item=>({id:item.id,x:item.x,y:item.y,...item.classicScout})),
          enemyProjectiles:q.items.filter(item=>item.classicScoutProjectile).length,
          enemyShotCounts:{...report.enemyShotCounts}});
        lastSample=Date.now();await save();
      }
      if(Date.now()-lastProgress>45000){
        console.log(`[Chronos voyage natural] ${q.flight.stageId} ${q.flight.stageName} · ${(q.flight.routeProgress*100).toFixed(1)}% · ${q.collected}/${q.flight.stageGoal} · hull ${q.hull}`);
        lastProgress=Date.now();
      }
      if(!checkpointVerified && n===2 && q.flight.stageElapsed>=8) {
        await page.locator('#pause').click(); const before=await inspect();
        assert.equal(before.voyageSave.checkpoint.stageNumber,2);
        assert.ok(before.flight.stageElapsed>=8);
        await capture('stage-02-before-reload',before);
        await page.reload({waitUntil:'load'});
        documentGeneration++;
        await wait(()=>typeof __FLIGHT_QA__==='function'&&__FLIGHT_QA__().state==='menu');
        assert.equal((await inspect()).voyageSave.checkpoint.stageNumber,2);
        await page.locator('#play').click();
        assert.equal(await page.locator('[data-voyage-stage="2"]').getAttribute('aria-pressed'),'true');
        assert.equal(await page.locator('[data-voyage-stage]:disabled').count(),8);
        await page.locator('#launch').click();
        await wait(()=>__FLIGHT_QA__().state==='playing');
        const resumed=await inspect();
        assert.equal(resumed.flight.stageNumber,2);
        assert.ok(resumed.flight.stageElapsed<2,'Reload resumed exact combat rather than the documented stage checkpoint');
        assert.equal(resumed.collected,before.voyageSave.checkpoint.collected);
        assert.equal(resumed.equipment.recoveredTwin,before.equipment.recoveredTwin);
        report.checkpoint={before:before.flight,checkpoint:before.voyageSave,after:resumed.flight};
        checkpointVerified=true;box=await page.locator('#canvas').boundingBox();previous=undefined;
        await capture('stage-02-checkpoint-restored',resumed);continue;
      }
      if(q.flight.waitingFor==='service') {
        assert.equal(n,6);assert.equal(q.state,'paused');assert.equal(serviceVerified,false);
        assert.equal(await page.locator('#flightDock').evaluate(node=>node.classList.contains('show')),true);
        assert.equal(q.equipment.recoveredTwin,true,'The real recovery pilot missed the recoverable emitter');
        assert.ok(Math.abs(q.flight.elapsed-183.2)<.06,'C9 must open at the short authored approach, not at the old end-of-stage boundary');
        assert.equal(q.equipment.selected,'pulse');assert.deepEqual(q.equipment.unlocked,['pulse']);
        assert.equal(q.hull,100,'The genuine C9 service repairs the ship');
        await capture('c9-before-preparation',q);
        await page.waitForTimeout(900);const frozen=await inspect();
        assert.deepEqual(frozen.flight,q.flight);assert.equal(frozen.elapsed,q.elapsed);
        await page.locator('#flightInstallTwin').click();const mounted=await inspect();
        assert.equal(mounted.equipment.twinPrepared,true,'C9 prepares the recovered hardware');
        assert.equal(mounted.equipment.selected,'pulse');assert.deepEqual(mounted.equipment.unlocked,['pulse'],
          'Preparing a part must not grant Twin or Lance before Atlas');
        assert.equal(mounted.weapons.charges,frozen.weapons.charges,'Preparation must not secretly refill weapon charges');
        assert.equal(await page.locator('[data-flight-loadout="twin"]').isDisabled(),true);
        assert.equal(await page.locator('[data-flight-loadout="lance"]').isDisabled(),true);
        await capture('c9-emitter-prepared-pulse-retained',mounted);
        await page.locator('#flightDockContinue').click();
        await wait(()=>__FLIGHT_QA__().state==='playing'&&__FLIGHT_QA__().flight.stageNumber===6&&
          __FLIGHT_QA__().flight.waitingFor!=='service');
        const resumed=await inspect();assert.equal(resumed.weapons.selected,'pulse');
        assert.equal(resumed.voyageSave.checkpoint.stageNumber,6);
        assert.equal(resumed.equipment.twinPrepared,true);
        assert.equal(resumed.flight.relay.state,'departing');
        report.service={before:q.flight,frozen:frozen.flight,equipment:mounted.equipment,resumed:resumed.flight};
        serviceVerified=true;previous=undefined;continue;
      }
      if(q.state==='complete'){report.finalArrival=q;await capture('gaia-persistent-arrival',q);break;}
      assert.equal(q.state,'playing');assert.equal(q.unlocked,1,'Gaia unlocked before final arrival');
      const destination=recoveryTarget(q);
      await page.mouse.move(box.x+destination*box.width/q.W,box.y+box.height*.72);
      // Allow the first raider to complete one announced attack before defending.
      // This chooses only player input and makes the new pressure observable.
      if(report.enemyShotCounts.raider>0 && q.weapons.charges>0 && q.weapons.cooldown<=0 && q.items.some(item=>['meteor','debris','satellite','scout'].includes(item.type)&&
        item.y<q.player.y-70&&item.y>q.player.y-1000&&Math.abs(item.x-q.player.x)<60)) {
        await page.keyboard.press('Space');firedCount++;
      }
      await page.waitForTimeout(45);
    }
    assert.ok(report.finalArrival,`Voyage did not finish naturally within ${timeout} ms`);
    assert.deepEqual([...stageNumbers],[1,2,3,4,5,6,7,8,9,10]);
    assert.equal(checkpointVerified,true);assert.equal(serviceVerified,true);
    assert.equal(report.finalArrival.flight.routeProgress,1);assert.equal(report.finalArrival.flight.elapsed,360);
    assert.equal(report.finalArrival.collected>=36,true);assert.equal(report.finalArrival.unlocked,2);
    assert.equal(report.finalArrival.voyageSave.completed,true);
    assert.equal(report.finalArrival.voyageSave.checkpoint.stageNumber,10);
    assert.ok(maxX-minX>150);
    assert.ok(stageSnapshots[2].station.scale>stageSnapshots[5].station.scale);
    assert.equal(stageSnapshots[5].station.alpha,1);
    assert.ok(stageSnapshots[8].planet.scale<stageSnapshots[10].planet.scale);
    assert.ok(stageSnapshots[5].deepSpace.nebulaOpacity<stageSnapshots[2].deepSpace.nebulaOpacity);
    const firstRaider = report.pursuitObservations.find(enemy=>enemy.role==='raider'&&enemy.firstStage==='1.1');
    assert.ok(firstRaider,'Chronos must naturally introduce an active pursuer during the first stage');
    assert.ok(firstRaider.firstRouteElapsed>=9&&firstRaider.firstRouteElapsed<=20,
      'The first active pursuer follows the actual reactor rupture, within the opening playable escape');
    assert.ok(report.pursuitObservations.some(enemy=>enemy.role==='raider'&&['1.2','1.3','1.4'].includes(enemy.firstStage)),
      'Pursuit pressure must continue across the early escape stages');
    assert.ok(report.enemyShotCounts.raider>0,'A real raider attack must emit a projectile');
    assert.ok(observedShots.size>0,'A real hostile projectile must be observed');
    assert.equal(pursuitPauseVerified,true,'A live target lock must be frozen by pause');
    let preservedEntities=0;
    for(const boundary of report.boundaryObservations) {
      if([6,7].includes(boundary.after.stage))continue; // C9 deliberately secures its service field.
      const expected=boundary.before.items.filter(item=>item.y>0&&item.y<report.finalArrival.H-120&&
        Math.hypot(item.x-boundary.before.player.x,item.y-boundary.before.player.y)>250&&
        ['energy','debris','satellite','scout'].includes(item.type)&&
        (item.hp===undefined||item.hp>0)&&
        boundary.before.shots.every(shot=>Math.hypot(shot.x-item.x,shot.y-item.y)>250));
      const afterIds=new Set(boundary.after.items.map(item=>item.qaId));
      for(const item of expected) {
        assert.ok(afterIds.has(item.qaId),`A live ${item.type} disappeared at checkpoint ${boundary.before.stage}→${boundary.after.stage}`);
        preservedEntities++;
      }
      assert.ok(boundary.after.routeElapsed>=boundary.before.routeElapsed,'Route clock reversed at a checkpoint');
      assert.ok(boundary.after.routeElapsed-boundary.before.routeElapsed<=.051,'Checkpoint inserted a route-time jump');
    }
    assert.ok(preservedEntities>0,'At least one live entity must demonstrate an ordinary checkpoint crossing');
    report.naturalVoyage={wallMs:Date.now()-sessionBegan,routeSimulationSeconds:360,
      stages:[...stageNumbers],stageSnapshots,movementRange:maxX-minX,firedCount,
      hostileProjectilesObserved:observedShots.size,enemyShotCounts:report.enemyShotCounts,preservedEntities};
  });
  await check('arrival, equipment and stage unlocks persist and the real next-level UI enters Gaia',async()=>{
    const before=await inspect();
    await page.locator('#nextLevel').click();
    await wait(()=>__FLIGHT_QA__().currentLevel===1&&__FLIGHT_QA__().state==='playing');
    const handoff=await inspect();
    assert.equal(await page.locator('#briefing').evaluate(node=>node.classList.contains('show')),false,
      'Continuing directly to Gaia must not require a duplicate briefing');
    assert.equal(handoff.flight,null);assert.equal(handoff.weapons.selected,'pulse');
    assert.deepEqual(handoff.equipment.unlocked,['pulse']);assert.equal(handoff.equipment.twinPrepared,true);
    await capture('chronos-to-gaia-direct-handoff',handoff);report.directHandoff=handoff;
    await page.reload({waitUntil:'load'});
    documentGeneration++;
    await wait(()=>typeof __FLIGHT_QA__==='function'&&__FLIGHT_QA__().state==='menu');
    const reloaded=await inspect();
    assert.equal(reloaded.unlocked,2);assert.equal(reloaded.voyageSave.completed,true);
    assert.equal(reloaded.voyageSave.unlockedStage,10);assert.equal(reloaded.equipment.selected,'pulse');
    assert.deepEqual(reloaded.equipment.unlocked,['pulse']);assert.equal(reloaded.equipment.twinPrepared,true);
    assert.equal(reloaded.equipment.recoveredTwin,true);
    const historical=saves=>Object.fromEntries(Object.entries(saves).filter(([key])=>/n7|journey/i.test(key)));
    assert.deepEqual(historical(reloaded.saves),historical(report.initialSaves));
    await page.locator('#play').click();await page.locator('#launch').click();
    await wait(()=>__FLIGHT_QA__().currentLevel===1&&__FLIGHT_QA__().state==='playing'&&__FLIGHT_QA__().warpTimer===0);
    const gaia=await inspect();assert.equal(gaia.flight,null);assert.equal(gaia.weapons.selected,'pulse');
    const charge=gaia.weapons.charges;await page.locator('#fire').click();const fired=await inspect();
    assert.equal(fired.weapons.charges,charge-1);assert.equal(fired.weapons.projectiles.length,1);
    await capture('gaia-next-territory-pulse-flight',fired);
    report.reloaded=reloaded;report.gaia=gaia;report.gaiaShot=fired.weapons;
    report.persistedComparison={arrival:before.voyageSave,reloaded:reloaded.voyageSave};
  });
  for(const[file,before]of Object.entries(report.packageFiles)){
    assert.equal(sha256(await fs.readFile(path.join(root,file))),before.sha256,`Distributed ${file} changed during QA`);
  }
  report.status='passed';report.exitCode=0;
})().catch(async error=>{
  report.status='failed';report.exitCode=1;report.error=errorText(error);process.exitCode=1;
  if(page){report.failureSnapshot=await inspect().catch(error=>({inspectionError:errorText(error)}));
    if(evidenceReady)await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});}
}).finally(async()=>{
  await browser?.close();await server?.close();report.durationMs=Date.now()-began;
  if(evidenceReady)await save();
  console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,
    checks:report.checks.map(entry=>({name:entry.name,status:entry.status})),output,error:report.error}));
});
