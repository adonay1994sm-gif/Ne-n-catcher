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

const {values} = parseArgs({options: {root: {type: 'string'}, output: {type: 'string'}, timeout: {type: 'string'}}});
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output || `docs/production-reports/evidence/guardian-atlas/browser-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const timeout = Number(values.timeout || 180000);
assert.ok(Number.isFinite(timeout) && timeout >= 30000 && timeout <= 360000, 'Timeout must be 30000–360000 ms');
const began = Date.now();
const report = {status: 'running', exitCode: null, command: process.argv, sourceRoot: root,
  startedAt: new Date().toISOString(), browser: 'Real Chromium, 390x844, DPR 1', checks: [],
  qaPilotVersion: 'swept-collision-v2', qaScriptSha256: sha256(require('node:fs').readFileSync(__filename)),
  errors: [], consoleErrors: [], failedRequests: [], screenshots: [], samples: [],
  limits: ['Automatic QA pilot uses real pointer and button inputs; this is not a human playtest.',
    'Only initial unlock/save sentinels are seeded; no game state, delta time, health or entities are changed.',
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
  const boss = q.boss;
  const curtains = q.items.filter(item => item.guardianProjectile && item.safeGap && item.y <= q.player.y + 115)
    .sort((a, b) => b.y - a.y);
  // Keep the advertised opening until its already-fired curtain passes the
  // complete ship. A new warning does not teleport older bullets away.
  if (curtains.length) return curtains[0].safeGap.center;
  if (boss.telegraph?.safeGap) return boss.telegraph.safeGap.center;
  if (boss.telegraph?.kind === 'aimedSalvo') {
    const lockedX = boss.telegraph.targetX;
    return lockedX < q.W / 2 ? q.W * .70 : q.W * .30;
  }
  const aim = boss.x ?? q.W / 2;
  const candidates = [aim, q.W * .25, q.W * .5, q.W * .75, 100, q.W - 100];
  const cost = x => {
    let value = Math.abs(x - aim) * .18;
    for (const shot of q.items.filter(item => item.guardianProjectile && !item.safeGap)) {
      const untilShip = (q.player.y - 55 - shot.y) / Math.max(1, shot.vy || shot.s || 1);
      if (untilShip < -.6 || untilShip > 3.2) continue;
      const predictedX = shot.x + (shot.vx || 0) * Math.max(0, untilShip);
      value += Math.max(0, 125 - Math.abs(x - predictedX)) * 7;
    }
    return value;
  };
  candidates.sort((a, b) => cost(a) - cost(b));
  return candidates[0];
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
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('atlas-natural-seeded')) {
      for (const prefix of ['', 'neon-preview-v1:']) {
        localStorage.setItem(prefix + 'neon-unlocked-v2', '2');
        localStorage.setItem(prefix + 'neon-stars-v2', '{}');
        localStorage.setItem(prefix + 'neon-n7-unlocked-v1', '37');
        localStorage.setItem(prefix + 'neon-n7-best-v1', '2037');
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
  });
  await page.route(/\/game\.js(?:\?.*)?$/, async route => {
    const response = await route.fetch(), body = await response.body(), source = body.toString('utf8');
    report.gameBundle = {bytes: body.length, sha256: sha256(body)};
    const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
    assert.equal(source.split(marker).length, 2, 'Legacy bootstrap marker changed');
    const hook = `window.__ATLAS_QA__ = () => ({state,elapsed,hull,score,collected,goal:level().goal,W,H,
      player:{x:player.x,y:player.y,w:player.w,h:player.h,target:player.target},
      follow:9+settings.sensitivity/100*8,outline:SHIP_COLLISION_OUTLINE,
      boss:atlasBoss ? JSON.parse(JSON.stringify(atlasBoss)) : null,
      items:items.map(item=>({type:item.type,x:item.x,y:item.y,s:item.s,r:item.r,vx:item.vx,vy:item.vy,
        rot:item.rot,rs:item.rs,circles:collisionCircles(item),
        guardianProjectile:Boolean(item.guardianProjectile),safeGap:item.safeGap?{...item.safeGap}:null,
        attackId:item.attackId,scout:Boolean(item.classicScout)})),
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
    await page.locator('#levels').click();
    await page.locator('#levelGrid button').nth(1).click();
    await page.locator('#launch').click();
    await wait(() => __ATLAS_QA__().state === 'playing' && __ATLAS_QA__().elapsed > 1.4);
    const q = await inspect(); assert.equal(q.goal, 45); assert.equal(q.unlocked, 2); assert.equal(q.boss, null);
    report.gameURL = page.url(); await capture('gaia-recovery', q);
  });
  const box = await page.locator('#canvas').boundingBox();
  let paused = false, manualChecked = false, maxCollected = 0, minX = Infinity, maxX = -Infinity;
  let previous = null;
  const bossStates = new Set(), bossPhases = new Set();
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
      maxCollected = Math.max(maxCollected, q.collected); minX = Math.min(minX, q.player.x); maxX = Math.max(maxX, q.player.x);
      if (Date.now() - lastSample > 1000) {
        report.samples.push({wallMs: Date.now() - sessionBegan, elapsed: q.elapsed, state: q.state,
          collected: q.collected, hull: q.hull, entities: q.items.length,
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
        }
        if (!manualChecked && q.boss.vulnerability && !q.boss.disabled) {
          const control = page.locator('#atlasAutoFire');
          assert.equal(await control.getAttribute('aria-pressed'), 'true');
          await control.click(); assert.equal((await inspect()).atlasAutoFire, false);
          await page.locator('#fire').click();
          assert.ok((await inspect()).manualShotCooldown > 0, 'Manual button did not emit a pulse');
          await control.click(); assert.equal((await inspect()).atlasAutoFire, true);
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
    report.naturalSession = {wallMs: Date.now() - sessionBegan, simulationSeconds: report.finalSnapshot.elapsed,
      maxCollected, movementRange: maxX - minX, bossStates: [...bossStates], bossPhases: [...bossPhases]};
  });
  await check('victory persists once and preserves the separate N-7 campaign', async () => {
    const saved = await page.evaluate(prefix => ({
      unlocked: localStorage.getItem(prefix + 'neon-unlocked-v2'),
      stars: JSON.parse(localStorage.getItem(prefix + 'neon-stars-v2') || '{}'),
      n7Unlocked: localStorage.getItem(prefix + 'neon-n7-unlocked-v1'),
      n7Best: localStorage.getItem(prefix + 'neon-n7-best-v1')
    }), storagePrefix);
    assert.equal(saved.unlocked, '3'); assert.ok(saved.stars['2'] >= 1);
    assert.equal(saved.n7Unlocked, '37'); assert.equal(saved.n7Best, '2037');
    report.saved = saved; const before = await inspect();
    await page.waitForTimeout(450); const after = await inspect();
    assert.equal(after.score, before.score); assert.equal(after.unlocked, before.unlocked);
    assert.equal(await page.locator('#nextLevel').isVisible(), true);
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
