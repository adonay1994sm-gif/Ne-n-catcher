// A natural Gaia session through real menu/pointer/button inputs. The injected
// hook only reads state: no inserted entities, forced health, collection or time.
// node scripts/guardian-atlas-browser-smoke.cjs --root preview-dist --output /tmp/atlas-natural-01
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {startStaticServer, prepareEvidence, saveEvidence, sha256, errorText} = require('./browser-qa-helpers.cjs');

const {values} = parseArgs({options: {root: {type: 'string'}, output: {type: 'string'}, timeout: {type: 'string'}, weapon: {type: 'string'},
  'profile-cpu': {type: 'boolean'}}});
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output || `docs/production-reports/evidence/guardian-atlas/browser-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const timeout = Number(values.timeout || 600000);
assert.ok(Number.isFinite(timeout) && timeout >= 30000 && timeout <= 900000, 'Timeout must be 30000–900000 ms');
const equippedWeapon = values.weapon || 'twin';
assert.ok(['pulse', 'twin'].includes(equippedWeapon), 'Weapon profile must be pulse or twin');
const equipmentProfile = {version: 1, recoveredTwin: equippedWeapon === 'twin',
  unlocked: equippedWeapon === 'twin' ? ['pulse', 'twin'] : ['pulse'], selected: equippedWeapon};
const began = Date.now();
const report = {status: 'running', exitCode: null, command: process.argv, sourceRoot: root,
  startedAt: new Date().toISOString(), browser: 'Real Chromium, 390x844, DPR 1', checks: [],
  qaPilotVersion: 'observed-projectile-swept-collision-v3', qaScriptSha256: sha256(require('node:fs').readFileSync(__filename)),
  initialEquipmentFixture: equipmentProfile,
  errors: [], consoleErrors: [], failedRequests: [], screenshots: [], samples: [],
  limits: ['Automatic QA pilot uses real pointer and button inputs; this is not a human playtest.',
    'Initial Gaia unlock/save sentinels and the explicitly recorded equipment profile are seeded before launch; no running game state, delta time, health or entities are changed.',
    'The combat pilot sees projectile positions/velocities and the ship outline; hidden aim coordinates and internal safe-corridor metadata are not exposed.',
    'Read-only inspection code is inserted into the local HTTP response; shipped bundles are unchanged.',
    'Service workers are blocked for a fresh-resource run; offline lifecycle is not certified.',
    'Real Chromium is not Safari, a physical iPhone test, or aesthetic acceptance.']};
try {
  report.git = {sha: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
    status: execFileSync('git', ['status', '--short'], {encoding: 'utf8'}).trim()};
} catch (error) { report.git = {error: error.message}; }
let server, browser, page, evidenceReady = false;
const save = () => saveEvidence(output, report);
const inspect = () => page.evaluate(() => ({...window.__ATLAS_QA__(), raf: {
  maximum: window.__ATLAS_RAF_QA__.maximum, pending: window.__ATLAS_RAF_QA__.pending.size,
  frames: window.__ATLAS_RAF_QA__.frames, errors: [...window.__ATLAS_RAF_QA__.errors]
}}));
const wait = (fn, argument, milliseconds = 15000) => page.waitForFunction(fn, argument, {polling: 100, timeout: milliseconds});
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
  report.checks.push(entry); await save(); console.log(`[Guardian natural] ${name}`);
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
  report.screenshots.push({file, type: 'Real game viewport', atElapsed: q.elapsed,
    collected: q.collected, bossStateObserved: q.boss?.state, bossPhaseObserved: q.boss?.phase});
  await save();
}

function circleTouchesOutline(x, y, radius, outline) {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [ax, ay] = outline[j], [bx, by] = outline[i];
    if ((by > y) !== (ay > y) && x < (ax - bx) * (y - by) / ((ay - by) || .000001) + bx) inside = !inside;
    const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
    const along = length ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length)) : 0;
    if ((x - ax - along * dx) ** 2 + (y - ay - along * dy) ** 2 <= radius ** 2) return true;
  }
  return inside;
}

// Account for the full path of the ship, not just its final destination. In the
// first retained failed run, the simple endpoint heuristic crossed obstacles
// while changing collection lanes. These calculations affect QA pointer choices
// only: production collision, spawns, time and ship state remain untouched.
function recoveryTarget(q) {
  const ship = q.player;
  const energies = q.items.filter(item => item.type === 'energy' && item.y < ship.y + 30)
    .sort((a, b) => b.y - a.y);
  const next = energies[0];
  const candidates = [...energies.slice(0, 4).map(item => item.x), ship.x, 90, 180, 270, 360, 450, 540, 630]
    .filter(Number.isFinite).map(x => Math.max(90, Math.min(q.W - 90, x)));
  const threats = q.items.filter(item => ['meteor', 'debris', 'satellite', 'scout'].includes(item.type));
  const cost = x => {
    let value = next ? Math.abs(x - next.x) * .4 : Math.abs(x - ship.x) * .04;
    for (const item of threats) {
      const speed = item.vy ?? item.s ?? 0;
      if (item.y > ship.y + 155 || item.y + speed * 1.25 < ship.y - 200) continue;
      let danger = 0;
      for (let future = 0; future <= 1.25; future += .05) {
        const playerX = x + (ship.x - x) * Math.exp(-q.follow * future);
        const obstacleX = item.x + (item.vx || 0) * future;
        const obstacleY = item.y + speed * future;
        const rotation = (item.rot || 0) + (item.rs || 0) * future;
        for (const circle of item.circles || [{x: 0, y: 0, r: item.r}]) {
          const localX = obstacleX + circle.x * Math.cos(rotation) - circle.y * Math.sin(rotation) - playerX;
          const localY = obstacleY + circle.x * Math.sin(rotation) + circle.y * Math.cos(rotation) - ship.y;
          const radius = circle.r + 9;
          if (Math.abs(localX) > 112 + radius || localY < -151 - radius || localY > 98 + radius) continue;
          if (circleTouchesOutline(localX, localY, radius, q.outline)) danger += 1600 * (1.35 - future);
        }
      }
      value += danger;
    }
    return value;
  };
  candidates.sort((a, b) => cost(a) - cost(b));
  return candidates[0] ?? q.W / 2;
}
function combatTarget(q) {
  const ship = q.player, aim = q.boss.x ?? q.W / 2;
  const minimum = q.bounds?.minX ?? 119, maximum = q.bounds?.maxX ?? q.W - 119;
  const clampX = x => Math.max(minimum, Math.min(maximum, x));
  const outlineLeft = Math.min(...q.outline.map(point => point[0]));
  const outlineRight = Math.max(...q.outline.map(point => point[0]));
  const outlineTop = Math.min(...q.outline.map(point => point[1]));
  const outlineBottom = Math.max(...q.outline.map(point => point[1]));
  const threats = q.items.filter(item => item.guardianProjectile &&
    item.y - item.r < ship.y + outlineBottom + 12);
  const candidates = [aim, ship.x, ship.target, minimum, maximum];
  for (let x = minimum; x <= maximum; x += 20) candidates.push(x);
  for (const shot of threats) {
    // Candidate positions come from observed bullet trajectories. They are
    // evaluated against the actual polygon, including the complete move path.
    const crossing = Math.max(0, (ship.y - shot.y) / Math.max(1, shot.vy || shot.s || 1));
    const crossingX = shot.x + (shot.vx || 0) * crossing;
    candidates.push(crossingX + outlineLeft - shot.r - 18,
      crossingX + outlineRight + shot.r + 18);
  }
  const horizon = 4.1, stride = .055;
  const effectiveFollow = q.follow * (q.inputGain || 1);
  const cost = x => {
    // Return to firing alignment when safe, without sacrificing a viable dodge
    // merely to spend a charge. The movement term prevents pointless jitter.
    let value = Math.abs(x - aim) * (q.boss.vulnerability ? .25 : .08) +
      Math.abs(x - ship.x) * .055;
    for (const shot of threats) {
      const speed = shot.vy || shot.s || 1;
      const radius = shot.r + 10;
      const enters = Math.max(0, (ship.y + outlineTop - radius - shot.y) / speed);
      const exits = Math.min(horizon, (ship.y + outlineBottom + radius - shot.y) / speed);
      if (enters > exits) continue;
      for (let future = enters; future <= exits + 1e-8; future += stride) {
        const playerX = x + (ship.x - x) * Math.exp(-effectiveFollow * future);
        const localX = shot.x + (shot.vx || 0) * future - playerX;
        const localY = shot.y + speed * future - ship.y;
        if (localX < outlineLeft - radius || localX > outlineRight + radius) continue;
        if (circleTouchesOutline(localX, localY, radius, q.outline)) {
          value += 1000000 / (.2 + future);
          break;
        }
        // A small clearance preference makes narrow-grazing plans less likely
        // under the finite polling interval and actual pointer latency.
        value += Math.max(0, 24 - Math.abs(localX)) / (2 + future);
      }
    }
    return value;
  };
  return [...new Set(candidates.filter(Number.isFinite).map(clampX))]
    .map(x => ({x, cost: cost(x)})).sort((a, b) => a.cost - b.cost)[0].x;
}

(async () => {
  await prepareEvidence(output); evidenceReady = true;
  server = await startStaticServer(root);
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
  const context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, serviceWorkers: 'block'});
  page = await context.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', error => report.errors.push(errorText(error)));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('requestfailed', request => report.failedRequests.push({url: request.url(), error: request.failure()?.errorText}));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push({url: response.url(), status: response.status()}); });
  await page.addInitScript(equipment => {
    if (!sessionStorage.getItem('atlas-natural-seeded')) {
      for (const prefix of ['', 'neon-preview-v1:']) {
        localStorage.setItem(prefix + 'neon-unlocked-v2', '2');
        localStorage.setItem(prefix + 'neon-stars-v2', '{}');
        localStorage.setItem(prefix + 'neon-n7-unlocked-v1', '37');
        localStorage.setItem(prefix + 'neon-n7-best-v1', '2037');
        localStorage.setItem(prefix + 'neonCatcher.flightEquipment.v1', JSON.stringify(equipment));
      }
      sessionStorage.setItem('atlas-natural-seeded', '1');
    }
    const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
    const audit = window.__ATLAS_RAF_QA__ = {pending: new Set(), maximum: 0, frames: 0, errors: []};
    window.requestAnimationFrame = callback => {
      const id = request(now => {
        audit.pending.delete(id); audit.frames++;
        try { callback(now); } catch (error) { audit.errors.push(error.stack || String(error)); throw error; }
      });
      audit.pending.add(id); audit.maximum = Math.max(audit.maximum, audit.pending.size); return id;
    };
    window.cancelAnimationFrame = id => { audit.pending.delete(id); cancel(id); };
  }, equipmentProfile);
  await page.route(/\/game\.js(?:\?.*)?$/, async route => {
    const response = await route.fetch(), body = await response.body(), source = body.toString('utf8');
    report.gameBundle = {bytes: body.length, sha256: sha256(body)};
    const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
    assert.equal(source.split(marker).length, 2, 'Legacy bootstrap marker changed');
    const hook = `window.__ATLAS_QA__ = () => ({state,elapsed,hull,score,collected,goal:level().goal,W,H,currentLevel,pendingLevel,continued,
      player:{x:player.x,y:player.y,w:player.w,h:player.h,target:player.target},
      follow:9+settings.sensitivity/100*8,inputGain:settings.sensitivity/100,outline:SHIP_COLLISION_OUTLINE,
      bounds:classicFlightBounds?{...classicFlightBounds}:null,
      boss:atlasBoss ? {x:atlasBoss.x,y:atlasBoss.y,r:atlasBoss.r,state:atlasBoss.state,
        phase:atlasBoss.phase,hp:atlasBoss.hp,maxHp:atlasBoss.maxHp,age:atlasBoss.age,
        stateTime:atlasBoss.stateTime,disabled:atlasBoss.disabled,vulnerability:atlasBoss.vulnerability,
        attackId:atlasBoss.attackId} : null,
      items:items.map(item=>({type:item.type,x:item.x,y:item.y,s:item.s,r:item.r,vx:item.vx,vy:item.vy,
        rot:item.rot,rs:item.rs,circles:collisionCircles(item),
        guardianProjectile:Boolean(item.guardianProjectile),projectileId:item.projectileId,
        attackId:item.attackId,scout:Boolean(item.classicScout)})),
      weapons:classicWeapons?{selected:classicWeapons.selected,charges:classicWeapons.charges,
        cooldown:classicWeapons.cooldown,recharge:classicWeapons.recharge,shotSequence:classicWeapons.shotSequence}:null,
      scoreAudio: typeof voyageScore!=="undefined" ? voyageScore?.snapshot() : null,
      legacyRunning,legacyFrameId,atlasAutoFire,manualShotCooldown,
      unlocked:getUnlocked(),keys:{...KEYS}});\n`;
    await route.fulfill({response, body: source.replace(marker, hook + marker)});
  });
  const nested = await fs.access(path.join(root, 'juego', 'index.html')).then(() => true).catch(() => false);
  const storagePrefix = nested ? 'neon-preview-v1:' : '';
  await check('navigate from the preview selector into classic Gaia using the real level menu', async () => {
    await page.goto(server.url, {waitUntil: 'load'});
    if (nested) {
      // Read hrefs instead of guessing a new hosting URL or campaign parameter.
      const href = await page.locator('a.card').evaluateAll(nodes => nodes.map(node => node.getAttribute('href'))
        .find(value => value && !value.includes('campaign=')));
      assert.ok(href, 'The preview selector has no classic-campaign link');
      await page.locator(`a.card[href="${href}"]`).click();
    }
    await wait(() => typeof __ATLAS_QA__ === 'function' && __ATLAS_QA__().state === 'menu');
    if (values['profile-cpu']) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Profiler.enable');
      await cdp.send('Profiler.setSamplingInterval', {interval: 1000});
      await cdp.send('Profiler.start');
      await page.waitForTimeout(1500);
      const {profile} = await cdp.send('Profiler.stop');
      await fs.writeFile(path.join(output, 'menu-cpu-profile.json'), JSON.stringify(profile) + '\n');
      const self = new Map();
      for (let index = 0; index < profile.samples.length; index++) {
        const id = profile.samples[index];
        self.set(id, (self.get(id) || 0) + (profile.timeDeltas[index] || 0));
      }
      report.menuCpuProfile = {file: 'menu-cpu-profile.json',
        note: 'One desktop-software-rendered Gaia menu sample before play; not an iPhone GPU measurement.',
        durationMs: (profile.endTime - profile.startTime) / 1000,
        hottestSelfSamples: profile.nodes.map(node => ({function: node.callFrame.functionName || '(anonymous)',
          url: node.callFrame.url, line: node.callFrame.lineNumber + 1,
          sampledSelfMs: (self.get(node.id) || 0) / 1000}))
          .sort((a, b) => b.sampledSelfMs - a.sampledSelfMs).slice(0, 18)};
      await cdp.detach(); await save();
    }
    await page.locator('#levels').click();
    await page.locator('#levelGrid button').nth(1).click();
    await page.locator('#launch').click();
    await wait(() => __ATLAS_QA__().state === 'playing' && __ATLAS_QA__().elapsed > 1.4);
    const q = await inspect(); assert.equal(q.goal, 45); assert.equal(q.unlocked, 2); assert.equal(q.boss, null);
    assert.equal(q.weapons.selected, equippedWeapon);
    report.gameURL = page.url(); await capture('gaia-recovery', q);
  });
  const box = await page.locator('#canvas').boundingBox();
  let paused = false, manualChecked = false, manualStarted = false,
    maxCollected = 0, minX = Infinity, maxX = -Infinity;
  let previous = null;
  const bossStates = new Set(), bossPhases = new Set(), observedProjectileIds = new Set();
  const sessionBegan = Date.now(); let lastSample = 0;
  await check('recover CRONIUM, face Atlas, pause/resume and finish through natural controls', async () => {
    while (Date.now() - sessionBegan < timeout) {
      const q = await inspect(); healthy(q);
      if (previous && q.hull < previous.hull) {
        report.damageObservations ??= [];
        report.damageObservations.push({elapsed: q.elapsed, beforeHull: previous.hull, afterHull: q.hull,
          previousPlayer: previous.player, player: q.player,
          nearbyBefore: previous.items.filter(item => Math.abs(item.y - previous.player.y) < 260)});
        await save();
      }
      previous = q;
      for (const item of q.items) if (item.guardianProjectile) observedProjectileIds.add(item.projectileId);
      maxCollected = Math.max(maxCollected, q.collected); minX = Math.min(minX, q.player.x); maxX = Math.max(maxX, q.player.x);
      if (Date.now() - lastSample > 1000) {
        report.samples.push({wallMs: Date.now() - sessionBegan, elapsed: q.elapsed, state: q.state,
          collected: q.collected, hull: q.hull, entities: q.items.length, rafFrames: q.raf.frames,
          weapon: q.weapons,
          boss: q.boss && {state: q.boss.state, phase: q.boss.phase, hp: q.boss.hp, age: q.boss.age}});
        lastSample = Date.now(); await save();
      }
      assert.ok(!['destroying', 'gameover'].includes(q.state), `Natural QA pilot failed: ${JSON.stringify(q)}`);
      if (q.state === 'complete') { report.finalSnapshot = q; await capture('gaia-victory', q); break; }
      assert.equal(q.unlocked, 2, 'Gaia was unlocked before the boss finished');
      if (q.boss) {
        assert.ok(q.collected >= q.goal, 'Atlas appeared before the recovery objective');
        bossStates.add(q.boss.state); bossPhases.add(q.boss.phase);
        if (q.boss.state === 'entry') await capture('atlas-entry', q);
        if (q.boss.state === 'charge') await capture('atlas-warning', q);
        if (q.boss.phase === 2) await capture('atlas-phase-two', q);
        if (q.boss.disabled) await capture('atlas-disabled', q);
        if (!paused && q.boss.state !== 'entry' && !q.boss.disabled) {
          await page.locator('#pause').click(); const before = await inspect();
          await page.waitForTimeout(350); const after = await inspect();
          assert.equal(after.state, 'paused'); assert.equal(after.boss.age, before.boss.age);
          assert.equal(after.boss.stateTime, before.boss.stateTime); assert.equal(after.boss.hp, before.boss.hp);
          assert.equal(after.elapsed, before.elapsed); assert.equal(after.unlocked, 2);
          await page.locator('#resume').click(); paused = true;
          await wait(age => __ATLAS_QA__().boss.age > age, before.boss.age);
          continue; // Re-inspect current bullet positions after interacting.
        }
        if (!manualStarted && q.boss.vulnerability && !q.boss.disabled) {
          const control = page.locator('#atlasAutoFire');
          assert.equal(await control.getAttribute('aria-pressed'), 'true');
          await control.click(); assert.equal((await inspect()).atlasAutoFire, false);
          manualStarted = true;
          // The previous snapshot predates disabling automatic fire. Re-read
          // the actual battery before making any single-shot assertion.
          continue;
        }
        if (manualStarted && !manualChecked && q.boss.vulnerability && !q.boss.disabled &&
          q.weapons.charges > 0 && q.weapons.recharge < 2.4 && q.manualShotCooldown <= 0 && Math.abs(q.player.x - q.boss.x) < 105) {
          const charges = q.weapons.charges;
          // Keyboard activation is a discrete accessible shot. A pointer click
          // held by a busy browser can legitimately repeat through the RAF.
          await page.locator('#fire').focus();
          await page.keyboard.press('Enter');
          const after = await inspect();
          assert.ok(after.manualShotCooldown > 0, 'Manual button did not emit a pulse');
          assert.equal(after.weapons.charges, charges - 1, 'Manual fire must spend one shared battery charge');
          assert.equal(after.weapons.shotSequence,q.weapons.shotSequence+1,'Discrete activation emits exactly one shot');
          assert.equal(after.scoreAudio.context,'atlas','The actual guardian selects its musical phrase');
          await page.locator('#atlasAutoFire').click(); assert.equal((await inspect()).atlasAutoFire, true);
          manualChecked = true;
        }
      }
      const destination = q.boss && !q.boss.disabled ? combatTarget(q) : recoveryTarget(q);
      await page.mouse.move(box.x + destination * box.width / q.W, box.y + box.height * .70);
      await page.waitForTimeout(65);
    }
    assert.ok(report.finalSnapshot, `Session did not finish within ${timeout} ms`);
    assert.ok(maxCollected >= 45); assert.ok(maxX - minX > 120, 'Pointer pilot did not move the ship');
    assert.ok(bossStates.has('entry') && bossStates.has('charge'), 'Visible entry and warning were not observed');
    assert.ok(bossPhases.has(1) && bossPhases.has(2), 'Both boss phases were not observed');
    assert.ok(captured.has('atlas-disabled'), 'The deactivation sequence was not observed');
    assert.equal(paused, true); assert.equal(manualChecked, true);
    assert.ok(observedProjectileIds.size >= 5, 'The pilot must actually face emitted attacks');
    report.naturalSession = {wallMs: Date.now() - sessionBegan, simulationSeconds: report.finalSnapshot.elapsed,
      maxCollected, movementRange: maxX - minX, bossStates: [...bossStates], bossPhases: [...bossPhases],
      observedProjectiles: observedProjectileIds.size, initialEquipmentFixture: equipmentProfile};
  });
  await check('victory persists once and preserves the separate N-7 campaign', async () => {
    const saved = await page.evaluate(prefix => ({
      unlocked: localStorage.getItem(prefix + 'neon-unlocked-v2'),
      stars: JSON.parse(localStorage.getItem(prefix + 'neon-stars-v2') || '{}'),
      n7Unlocked: localStorage.getItem(prefix + 'neon-n7-unlocked-v1'),
      n7Best: localStorage.getItem(prefix + 'neon-n7-best-v1'),
      equipment: JSON.parse(localStorage.getItem(prefix + 'neonCatcher.flightEquipment.v1') || 'null')
    }), storagePrefix);
    assert.equal(saved.unlocked, '3'); assert.ok(saved.stars['2'] >= 1);
    assert.equal(saved.n7Unlocked, '37'); assert.equal(saved.n7Best, '2037');
    assert.deepEqual(saved.equipment, equipmentProfile);
    report.saved = saved; const before = await inspect();
    await page.waitForTimeout(450); const after = await inspect();
    assert.equal(after.score, before.score); assert.equal(after.unlocked, before.unlocked);
    assert.equal(await page.locator('#nextLevel').isVisible(), true);
  });
  await check('continue naturally into Vulkar and reload without losing victory or equipment', async () => {
    await page.locator('#nextLevel').click();
    await page.locator('#briefing').waitFor({state: 'visible'});
    assert.equal((await inspect()).pendingLevel, 2);
    await capture('vulkar-briefing', await inspect());
    await page.locator('#launch').click();
    await wait(() => __ATLAS_QA__().state === 'playing' && __ATLAS_QA__().currentLevel === 2 &&
      __ATLAS_QA__().elapsed > 1.4);
    const inVulkar = await inspect();
    assert.equal(inVulkar.boss, null); assert.equal(inVulkar.unlocked, 3);
    assert.equal(inVulkar.weapons.selected, equippedWeapon);
    await capture('vulkar-after-atlas', inVulkar);
    await page.locator('#pause').click(); await page.locator('#quit').click();
    await wait(() => __ATLAS_QA__().state === 'menu');
    await page.reload({waitUntil: 'load'});
    await wait(() => typeof __ATLAS_QA__ === 'function' && __ATLAS_QA__().state === 'menu');
    const afterReload = await inspect();
    assert.equal(afterReload.unlocked, 3);
    const persisted = await page.evaluate(prefix => ({
      stars: JSON.parse(localStorage.getItem(prefix + 'neon-stars-v2') || '{}'),
      equipment: JSON.parse(localStorage.getItem(prefix + 'neonCatcher.flightEquipment.v1') || 'null'),
      n7Unlocked: localStorage.getItem(prefix + 'neon-n7-unlocked-v1'),
      n7Best: localStorage.getItem(prefix + 'neon-n7-best-v1')
    }), storagePrefix);
    assert.deepEqual(persisted.stars, report.saved.stars);
    assert.deepEqual(persisted.equipment, equipmentProfile);
    assert.equal(persisted.n7Unlocked, '37'); assert.equal(persisted.n7Best, '2037');
    report.continuation = {levelAfterAtlas: inVulkar.currentLevel + 1,
      unlockedAfterReload: afterReload.unlocked, persisted};
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
