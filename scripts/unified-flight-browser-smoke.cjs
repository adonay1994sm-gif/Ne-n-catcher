// Natural first-launch Chronos -> recovery -> C9 -> Gaia, using real inputs.
// No writes to game state, time, hull, entities, collection or save storage.
// node scripts/unified-flight-browser-smoke.cjs --root preview-dist --output /tmp/flight-natural-01
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {startStaticServer, prepareEvidence, saveEvidence, sha256, errorText} = require('./browser-qa-helpers.cjs');

const {values} = parseArgs({options: {root: {type: 'string'}, output: {type: 'string'}, timeout: {type: 'string'}}});
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output || `docs/production-reports/evidence/unified-flight/browser-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const timeout = Number(values.timeout || 900000);
assert.ok(Number.isFinite(timeout) && timeout >= 30000 && timeout <= 900000, 'Timeout must be 30000–900000 ms');
const began = Date.now();
const report = {status: 'running', exitCode: null, command: process.argv, sourceRoot: root,
  startedAt: new Date().toISOString(), browser: 'Real Chromium, 390x844, DPR 1',
  pilotVersion: 'natural-relative-flight-v1', checks: [], errors: [], consoleErrors: [],
  failedRequests: [], screenshots: [], samples: [], damageObservations: [],
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
  report.checks.push(entry); await save(); console.log(`[Unified flight natural] ${name}`);
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
    routeProgress: q.flight?.routeProgress, stage: q.flight?.phase,
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
  const collectibles = q.items.filter(item => ['energy', 'flightModule'].includes(item.type) && item.y < ship.y + 45)
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
        const obstacleX = item.x + (item.vx || 0) * future;
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
  report.buildInfo = JSON.parse(await fs.readFile(path.join(root, 'build-info.json'), 'utf8'));
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
        try { callback(now); } catch (error) { audit.errors.push(error.stack || String(error)); throw error; }
      });
      audit.pending.add(id); audit.maximum = Math.max(audit.maximum, audit.pending.size); return id;
    };
    window.cancelAnimationFrame = id => { audit.pending.delete(id); cancel(id); };
  });
  await page.route(/\/game\.js(?:\?.*)?$/, async route => {
    const response = await route.fetch(), body = await response.body(), source = body.toString('utf8');
    report.gameBundle = {bytes: body.length, sha256: sha256(body)};
    const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
    assert.equal(source.split(marker).length, 2, 'Legacy bootstrap marker changed');
    const hook = `window.__FLIGHT_QA__ = () => ({state,currentLevel,elapsed,hull,score,collected,goal:level().goal,W,H,
      energySpawned,energyBudget,warpTimer,manualShotCooldown,legacyRunning,legacyFrameId,
      player:{x:player.x,y:player.y,w:player.w,h:player.h,target:player.target,targetY:player.targetY},
      bounds:classicFlightBounds?{...classicFlightBounds}:null,
      follow:9+settings.sensitivity/100*8,outline:SHIP_COLLISION_OUTLINE,
      flight:classicFlightView?JSON.parse(JSON.stringify(classicFlightView)):null,
      weapons:classicWeapons?NeonCampaign.classicWeaponSnapshot(classicWeapons):null,
      equipment:JSON.parse(JSON.stringify(classicEquipment)),
      items:items.map(item=>({id:item.id,type:item.type,x:item.x,y:item.y,s:item.s,r:item.r,vx:item.vx,vy:item.vy,
        rot:item.rot,rs:item.rs,hp:item.hp,circles:collisionCircles(item),flightComet:Boolean(item.flightComet),
        flightPatrol:Boolean(item.flightPatrol),guardianProjectile:Boolean(item.guardianProjectile)})),
      unlocked:getUnlocked(),keys:{...KEYS},saves:Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)]))});\n`;
    await route.fulfill({response, body: source.replace(marker, hook + marker)});
  });
  await check('first launch uses the single main journey entry, without QA unlocks', async () => {
    await page.goto(server.url, {waitUntil: 'load'});
    assert.equal(await page.locator('a.card.primary').count(), 1);
    assert.equal(await page.locator('#unlockClassic').isChecked(), false);
    await page.locator('#classiclink').click();
    await wait(() => typeof __FLIGHT_QA__ === 'function' && __FLIGHT_QA__().state === 'menu');
    const menu = await inspect();
    assert.equal(menu.unlocked, 1);
    assert.equal(menu.equipment.recoveredTwin, false);
    assert.deepEqual(menu.equipment.unlocked, ['pulse']);
    report.initialSaves = menu.saves; report.gameURL = page.url();
    assert.equal(new URL(page.url()).searchParams.get('campaign'), null);
    await page.locator('#play').click();
    await page.locator('#launch').click();
    await wait(() => __FLIGHT_QA__().state === 'playing' && __FLIGHT_QA__().warpTimer === 0);
    const start = await inspect();
    assert.equal(start.currentLevel, 0); assert.equal(start.goal, 36);
    assert.equal(start.weapons.charges, 3);
    await capture('chronos-start', start);
  });
  let box = await page.locator('#canvas').boundingBox();
  await check('real relative touch press does not jump, drag moves both axes and release is recoverable', async () => {
    const before = await inspect();
    const anchor = {x: box.x + box.width * .22, y: box.y + box.height * .48};
    await touch('touchStart', anchor.x, anchor.y);
    const down = await inspect();
    assert.equal(down.player.target, before.player.target);
    assert.equal(down.player.targetY, before.player.targetY);
    await touch('touchMove', anchor.x + 45, anchor.y - 35);
    const moved = await inspect();
    assert.ok(moved.player.target > before.player.target + 20);
    assert.ok(moved.player.targetY < before.player.targetY - 20);
    await touch('touchMove', anchor.x, anchor.y);
    await touch('touchEnd');
    const restored = await inspect();
    assert.ok(Math.abs(restored.player.target - before.player.target) < .01);
    assert.ok(Math.abs(restored.player.targetY - before.player.targetY) < .01);
    report.touch = {before: before.player, down: down.player, moved: moved.player, restored: restored.player};
  });
  let rechargeObserved = false;
  await check('one real shot spends a charge; pause freezes route, projectiles and recharge', async () => {
    await page.locator('#fire').click();
    const fired = await inspect();
    assert.equal(fired.weapons.charges, 2);
    assert.ok(fired.weapons.projectiles.length >= 1);
    await page.locator('#pause').click();
    const before = await inspect(); assert.equal(before.state, 'paused');
    await page.waitForTimeout(500);
    const after = await inspect();
    assert.equal(after.state, 'paused');
    assert.equal(after.elapsed, before.elapsed);
    assert.deepEqual(after.flight, before.flight);
    assert.deepEqual(after.weapons, before.weapons);
    await page.locator('#resume').click();
    await wait(value => __FLIGHT_QA__().elapsed > value, before.elapsed);
    report.pause = {elapsed: before.elapsed, routeProgress: before.flight.routeProgress, charges: before.weapons.charges};
  });
  let previous, lastSample = 0, minX = Infinity, maxX = -Infinity, firedCount = 1;
  const phases = new Set(), phaseSnapshots = {}, sessionBegan = Date.now();
  await check('play the attack, evacuation, deep-space recovery and arrival through natural controls', async () => {
    while (Date.now() - sessionBegan < timeout) {
      const q = await inspect(); healthy(q);
      if (previous && q.hull < previous.hull) report.damageObservations.push({elapsed: q.elapsed,
        before: previous.hull, after: q.hull, player: q.player,
        nearby: previous.items.filter(item => Math.abs(item.y - previous.player.y) < 250)});
      previous = q;
      assert.ok(!['destroying', 'gameover'].includes(q.state), `Natural pilot failed with ${q.hull} hull, ${q.collected}/${q.goal} fragments`);
      minX = Math.min(minX, q.player.x); maxX = Math.max(maxX, q.player.x);
      if (Date.now() - lastSample > 2000) {
        report.samples.push({wallMs: Date.now() - sessionBegan, elapsed: q.elapsed, routeProgress: q.flight?.routeProgress,
          phase: q.flight?.phase, state: q.state, collected: q.collected, hull: q.hull,
          player: q.player, entities: q.items.length, charges: q.weapons?.charges,
          recharge: q.weapons?.recharge, rafFrames: q.raf.frames});
        lastSample = Date.now(); await save();
      }
      if (q.flight) {
        const flight = q.flight;
        phases.add(flight.phase); phaseSnapshots[flight.phase] ??= flight;
        if (flight.attacker.visible && flight.attacker.state === 'charge') await capture('attacker-charge', q);
        if (flight.attacker.visible && flight.attacker.state === 'fire') await capture('attacker-firing', q);
        if (flight.station.state === 'ruptured' && flight.routeProgress < .18) await capture('chronos-ruptured', q);
        if (flight.phase === 'departure' && flight.routeProgress > .40) await capture('chronos-receding', q);
        if (flight.phase === 'deep-space') await capture('deep-space', q);
        if (q.items.some(item => item.flightComet && item.x > 0 && item.x < q.W)) await capture('diagonal-comet', q);
        if (q.items.some(item => item.type === 'flightModule')) await capture('recoverable-emitter', q);
        if (q.equipment.recoveredTwin) await capture('emitter-recovered', q);
        if (flight.phase === 'gaia-approach') await capture('gaia-approach', q);
      }
      if (q.state === 'complete') { report.firstStageFinal = q; await capture('chronos-arrival', q); break; }
      assert.equal(q.unlocked, 1, 'Next territory unlocked before finishing the mission');
      if (!rechargeObserved && q.weapons.charges === 3) {
        rechargeObserved = true; report.rechargeObservedAt = {elapsed: q.elapsed, charges: q.weapons.charges};
      }
      const destination = recoveryTarget(q);
      await page.mouse.move(box.x + destination * box.width / q.W, box.y + box.height * .72);
      if (rechargeObserved && q.weapons.charges > 0 && q.weapons.cooldown <= 0 &&
        q.items.some(item => ['meteor', 'debris', 'satellite', 'scout'].includes(item.type) &&
          item.y < q.player.y - 70 && item.y > q.player.y - 1000 && Math.abs(item.x - q.player.x) < 60)) {
        await page.keyboard.press('Space'); firedCount++;
      }
      await page.waitForTimeout(45);
    }
    assert.ok(report.firstStageFinal, `First mission did not finish within ${timeout} ms`);
    assert.ok(report.firstStageFinal.collected >= 36);
    assert.equal(report.firstStageFinal.flight.routeProgress, 1);
    assert.equal(report.firstStageFinal.unlocked, 2);
    assert.equal(report.firstStageFinal.equipment.recoveredTwin, true, 'Real recovery of the emitter failed');
    assert.equal(rechargeObserved, true, 'No natural recharge was observed');
    assert.ok(maxX - minX > 150, 'Natural pilot did not traverse recovery lanes');
    for (const phase of ['recovery', 'departure', 'deep-space', 'gaia-approach']) assert.ok(phases.has(phase), `Missing phase ${phase}`);
    for (const screenshot of ['attacker-firing', 'chronos-ruptured', 'chronos-receding', 'deep-space',
      'diagonal-comet', 'recoverable-emitter', 'gaia-approach']) assert.ok(captured.has(screenshot), `Missing real capture ${screenshot}`);
    assert.ok(phaseSnapshots.departure.station.scale > phaseSnapshots['deep-space'].station.scale);
    assert.equal(phaseSnapshots.departure.station.alpha, 1, 'Departure faded the origin instead of moving it');
    report.naturalFirstStage = {wallMs: Date.now() - sessionBegan, simulationSeconds: report.firstStageFinal.elapsed,
      movementRange: maxX - minX, phases: [...phases], firedCount};
  });
  await check('recover the part, install it at C9 and continue into Gaia using the real workshop', async () => {
    await page.locator('#nextLevel').click();
    assert.equal(await page.locator('#flightDock').evaluate(node => node.classList.contains('show')), true);
    assert.equal((await inspect()).equipment.unlocked.includes('twin'), false);
    await capture('c9-before-installation', await inspect());
    await page.locator('#flightInstallTwin').click();
    const installed = await inspect();
    assert.equal(installed.equipment.selected, 'twin');
    assert.deepEqual(installed.equipment.unlocked, ['pulse', 'twin']);
    assert.equal(await page.locator('#flightInstallTwin').isDisabled(), true);
    await capture('c9-twin-installed', installed);
    await page.locator('#flightDockContinue').click();
    await page.locator('#launch').click();
    await wait(() => __FLIGHT_QA__().currentLevel === 1 && __FLIGHT_QA__().state === 'playing' && __FLIGHT_QA__().warpTimer === 0);
    box = await page.locator('#canvas').boundingBox();
    const ready = await inspect(); assert.equal(ready.weapons.selected, 'twin');
    assert.equal(ready.weapons.charges, 3);
    await page.locator('#fire').click();
    const twin = await inspect();
    assert.equal(twin.weapons.charges, 2);
    assert.equal(twin.weapons.projectiles.length, 2);
    assert.ok(twin.weapons.projectiles.every(shot => shot.weapon === 'twin'));
    assert.equal(twin.weapons.projectiles[0].shotId, twin.weapons.projectiles[1].shotId);
    assert.ok(twin.weapons.projectiles[0].x < twin.weapons.projectiles[1].x);
    await capture('gaia-twin-flight', twin);
    report.gaiaTwin = twin;
    const saved = Object.entries(twin.saves).find(([key]) => key.endsWith('neonCatcher.flightEquipment.v1'));
    assert.ok(saved, 'Equipment did not persist');
    assert.equal(JSON.parse(saved[1]).selected, 'twin');
    await page.locator('#pause').click(); await page.locator('#quit').click();
    await page.reload({waitUntil: 'load'});
    await wait(() => typeof __FLIGHT_QA__ === 'function' && __FLIGHT_QA__().state === 'menu');
    const reloaded = await inspect(); assert.equal(reloaded.unlocked, 2);
    assert.equal(reloaded.equipment.selected, 'twin'); assert.equal(reloaded.equipment.recoveredTwin, true);
    for (const [key, value] of Object.entries(report.initialSaves).filter(([key]) => /n7|journey/i.test(key))) {
      assert.equal(reloaded.saves[key], value, `Historical save changed: ${key}`);
    }
    report.reloaded = reloaded;
  });
  report.status = 'passed'; report.exitCode = 0;
})().catch(async error => {
  report.status = 'failed'; report.exitCode = 1; report.error = errorText(error); process.exitCode = 1;
  if (page) {
    report.failureSnapshot = await inspect().catch(error => ({inspectionError: errorText(error)}));
    if (evidenceReady) await page.screenshot({path: path.join(output, 'failure.png')}).catch(() => {});
  }
}).finally(async () => {
  await browser?.close(); await server?.close(); report.durationMs = Date.now() - began;
  if (evidenceReady) await save();
  console.log(JSON.stringify({status: report.status, exitCode: report.exitCode,
    checks: report.checks.map(entry => ({name: entry.name, status: entry.status})), output, error: report.error}));
});
