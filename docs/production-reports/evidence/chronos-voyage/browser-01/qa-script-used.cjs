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

const {values} = parseArgs({options: {root: {type: 'string'}, output: {type: 'string'}, timeout: {type: 'string'}}});
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output || `docs/production-reports/evidence/chronos-voyage/browser-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const timeout = Number(values.timeout || 1200000);
assert.ok(Number.isFinite(timeout) && timeout >= 30000 && timeout <= 1200000, 'Timeout must be 30000–1200000 ms');
const began = Date.now();
const report = {status: 'running', exitCode: null, command: process.argv, sourceRoot: root,
  startedAt: new Date().toISOString(), browser: 'Real Chromium, 390x844, DPR 1',
  pilotVersion: 'natural-chronos-ten-stages-v1', checks: [], errors: [], consoleErrors: [],
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
  await fs.copyFile(__filename, path.join(output, 'qa-script-used.cjs'));
  report.buildInfo = JSON.parse(await fs.readFile(path.join(root, 'build-info.json'), 'utf8'));
  report.packageFiles = {};
  for (const file of ['game.js', 'content-runtime.js', 'styles.css', 'build-info.json']) {
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
      voyageSave:classicVoyageRecord?JSON.parse(JSON.stringify(classicVoyageRecord)):null,
      weapons:classicWeapons?NeonCampaign.classicWeaponSnapshot(classicWeapons):null,
      equipment:JSON.parse(JSON.stringify(classicEquipment)),
      items:items.map(item=>({id:item.id,type:item.type,x:item.x,y:item.y,s:item.s,r:item.r,vx:item.vx,vy:item.vy,
        rot:item.rot,rs:item.rs,hp:item.hp,circles:collisionCircles(item),flightComet:Boolean(item.flightComet),
        flightPatrol:Boolean(item.flightPatrol),guardianProjectile:Boolean(item.guardianProjectile)})),
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
  const stageNumbers = new Set([1]), stageSnapshots = {}, quotas = [4,8,12,16,18,18,24,28,32,36];
  const sessionBegan = Date.now();
  await check('naturally play all ten connected stages, recover the piece, use C9 and arrive at Gaia', async () => {
    while (Date.now() - sessionBegan < timeout) {
      let q = await inspect(); healthy(q);
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
      if (q.items.some(item => item.flightComet && item.x > 20 && item.x < q.W - 20)) await capture(`comet-stage-${n}`, q);
      if (q.items.some(item => item.type === 'flightModule')) await capture('recoverable-emitter', q);
      if (q.equipment.recoveredTwin) await capture('emitter-recovered', q);
      if (Date.now() - lastSample > 2000) {
        report.samples.push({wallMs: Date.now() - sessionBegan, elapsed: q.elapsed, routeElapsed: q.flight.elapsed,
          routeProgress: q.flight.routeProgress, stageNumber:n, stageId:q.flight.stageId, stageProgress:q.flight.stageProgress,
          goal:q.flight.stageGoal, objective:q.flight.stageObjective, origin:q.flight.stageOrigin,destination:q.flight.stageDestination,
          state:q.state,collected:q.collected,hull:q.hull,entities:q.items.length,charges:q.weapons?.charges,
          waitingFor:q.flight.waitingFor,rafFrames:q.raf.frames});
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
        await capture('c9-before-installation',q);
        await page.waitForTimeout(900);const frozen=await inspect();
        assert.deepEqual(frozen.flight,q.flight);assert.equal(frozen.elapsed,q.elapsed);
        await page.locator('#flightInstallTwin').click();const mounted=await inspect();
        assert.equal(mounted.equipment.selected,'twin');assert.ok(mounted.equipment.unlocked.includes('twin'));
        await capture('c9-emitter-installed',mounted);
        await page.locator('#flightDockContinue').click();
        await wait(()=>__FLIGHT_QA__().state==='playing'&&__FLIGHT_QA__().flight.stageNumber===7);
        const resumed=await inspect();assert.equal(resumed.weapons.selected,'twin');
        assert.equal(resumed.voyageSave.checkpoint.stageNumber,7);
        report.service={before:q.flight,frozen:frozen.flight,equipment:mounted.equipment,resumed:resumed.flight};
        serviceVerified=true;previous=undefined;continue;
      }
      if(q.state==='complete'){report.finalArrival=q;await capture('gaia-persistent-arrival',q);break;}
      assert.equal(q.state,'playing');assert.equal(q.unlocked,1,'Gaia unlocked before final arrival');
      const destination=recoveryTarget(q);
      await page.mouse.move(box.x+destination*box.width/q.W,box.y+box.height*.72);
      if(q.weapons.charges>0 && q.weapons.cooldown<=0 && q.items.some(item=>['meteor','debris','satellite','scout'].includes(item.type)&&
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
    report.naturalVoyage={wallMs:Date.now()-sessionBegan,routeSimulationSeconds:360,
      stages:[...stageNumbers],stageSnapshots,movementRange:maxX-minX,firedCount};
  });
  await check('arrival, equipment and stage unlocks persist and the real next-level UI enters Gaia',async()=>{
    const before=await inspect();
    await page.reload({waitUntil:'load'});
    await wait(()=>typeof __FLIGHT_QA__==='function'&&__FLIGHT_QA__().state==='menu');
    const reloaded=await inspect();
    assert.equal(reloaded.unlocked,2);assert.equal(reloaded.voyageSave.completed,true);
    assert.equal(reloaded.voyageSave.unlockedStage,10);assert.equal(reloaded.equipment.selected,'twin');
    assert.equal(reloaded.equipment.recoveredTwin,true);
    const historical=saves=>Object.fromEntries(Object.entries(saves).filter(([key])=>/n7|journey/i.test(key)));
    assert.deepEqual(historical(reloaded.saves),historical(report.initialSaves));
    await page.locator('#play').click();await page.locator('#launch').click();
    await wait(()=>__FLIGHT_QA__().currentLevel===1&&__FLIGHT_QA__().state==='playing'&&__FLIGHT_QA__().warpTimer===0);
    const gaia=await inspect();assert.equal(gaia.flight,null);assert.equal(gaia.weapons.selected,'twin');
    const charge=gaia.weapons.charges;await page.locator('#fire').click();const fired=await inspect();
    assert.equal(fired.weapons.charges,charge-1);assert.equal(fired.weapons.projectiles.length,2);
    await capture('gaia-next-territory-twin-flight',fired);
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
