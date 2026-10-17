// Controlled, real-Chromium integration fixtures. These are not a natural
// pickup, a complete mission, a human playtest, or a physical-device certificate.
// No writes to gameplay clocks, hull, entities, ammunition or progression are
// made directly. Documented fixtures call the real collection/power/damage
// handlers; the equipment fixture starts with a declared legacy v1 save.
// node scripts/combat-readability-smoke.cjs --root preview-dist --output /tmp/combat-readability-01
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {startStaticServer, prepareEvidence, saveEvidence, sha256, errorText} = require('./browser-qa-helpers.cjs');

const {values} = parseArgs({options: {root: {type: 'string'}, output: {type: 'string'}, 'supplement-only': {type: 'boolean', default: false}}});
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output || `docs/production-reports/evidence/combat-readability/browser-${Date.now()}`);
const started = Date.now();
const equipmentKey = 'neonCatcher.flightEquipment.v1';
const legacyEquipment = {version: 1, recoveredTwin: true, unlocked: ['pulse', 'twin'], selected: 'twin'};
const report = {status: 'running', exitCode: null, startedAt: new Date().toISOString(), command: process.argv,
  sourceRoot: root, checks: [], screenshots: [], fixtureCalls: [], errors: [], consoleErrors: [], failedRequests: [],
  classification: 'Controlled integration and presentation fixtures in real Chromium',
  scope: values['supplement-only'] ? 'Supplement only: responsive presentation, compact workshop and live force field' : 'Complete controlled integration and presentation fixture',
  omittedChecks: values['supplement-only'] ? ['The eight combat/equipment/orb/orbit/reload checks are not repeated or marked passed by this supplement. Their earlier results must be cited separately.'] : [],
  limits: ['The initial equipment save is explicitly seeded as a legacy v1 recovered and installed twin emitter. This does not certify natural recovery or a natural workshop arrival.',
    'The preview QA-unlock checkbox and normal menu, workshop, weapon, fire, pause and resume buttons are used.',
    'The orb fixture calls drawEnergy and collectItem on a synthetic item at the current ship position. A declared synthetic quota fill calls collectItem to enter Atlas; this does not demonstrate natural recovery or boss balance. The shield fixture calls activatePower and damageShip. Every such handler call is recorded.',
    'Render probes temporarily observe the original Canvas drawImage/scale methods and delegate unchanged; they introduce no simulation owner or RAF callback.',
    'No direct assignments to gameplay time, hull, ammunition, entities, progression or rewards are made by the injected hook.',
    'These fixtures do not certify a complete natural mission, boss balance, aesthetic approval, Safari, a physical iPhone, sustained performance or service-worker lifecycle.']};
let server, browser, context, page, evidenceReady = false;
const save = () => saveEvidence(output, report);
const inspect = () => page.evaluate(() => ({...window.__COMBAT_READABILITY_QA__.snapshot(), raf: {
  maximum: window.__COMBAT_READABILITY_RAF__.maximum, pending: window.__COMBAT_READABILITY_RAF__.pending.size,
  frames: window.__COMBAT_READABILITY_RAF__.frames, errors: [...window.__COMBAT_READABILITY_RAF__.errors]
}}));
function healthy(q) {
  assert.deepEqual(report.errors, [], 'Uncaught JavaScript exception');
  assert.deepEqual(report.consoleErrors, [], 'Console error');
  assert.deepEqual(report.failedRequests, [], 'Failed resource request');
  assert.deepEqual(q.raf.errors, [], 'RAF callback threw');
  assert.ok(q.legacyRunning, 'Legacy loop stopped');
  assert.ok(q.raf.maximum <= 1, 'More than one pending RAF owner');
}
async function until(predicate, timeout = 120000) {
  const deadline = Date.now() + timeout;
  let q;
  while (Date.now() < deadline) {
    q = await inspect(); healthy(q);
    if (predicate(q)) return q;
    await page.waitForTimeout(75);
  }
  throw new Error(`State timeout: ${JSON.stringify(q)}`);
}
async function check(name, operation) {
  const entry = {name, status: 'running', startedAt: new Date().toISOString()};
  report.checks.push(entry); await save();
  const began = Date.now(); console.log(`[Combat readability] ${name}`);
  try { await operation(); entry.snapshot = await inspect(); healthy(entry.snapshot); entry.status = 'passed'; }
  catch (error) { entry.status = 'failed'; entry.error = errorText(error); throw error; }
  finally { entry.durationMs = Date.now() - began; await save(); }
}
async function capture(name, classification = 'Actual live game viewport; controlled fixture state is disclosed') {
  const file = `${String(report.screenshots.length + 1).padStart(2, '0')}-${name}.png`;
  await page.screenshot({path: path.join(output, file), timeout: 45000});
  report.screenshots.push({file, classification, snapshot: await inspect()}); await save();
}
async function quit() {
  const q = await inspect();
  if (q.state === 'playing') await page.locator('#pause').click();
  if (['playing', 'paused'].includes(q.state)) await page.locator('#quit').click();
  await until(q => q.state === 'menu');
}
async function openBriefing(index) {
  await page.locator('#levels').click();
  assert.equal(await page.locator('#levelGrid button').count(), 10);
  await page.locator('#levelGrid button').nth(index).click();
  await page.waitForFunction(() => document.querySelector('#briefing').classList.contains('show'), null, {polling: 100});
}
async function launch(index) {
  await openBriefing(index); await page.locator('#launch').click();
  return until(q => q.state === 'playing' && q.currentLevel === index && q.warpTimer === 0 && q.elapsed > .12 && q.assets.every(a => a.loaded));
}
async function briefingLayout() {
  return page.evaluate(async () => {
    const visual = document.querySelector('#briefingVisual');
    const rect = node => { const r = node.getBoundingClientRect(); return {left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height}; };
    const backgrounds = [];
    for (const node of [visual, ...visual.querySelectorAll('*')]) {
      if (node instanceof HTMLImageElement && !node.classList.contains('briefing-ship')) {
        await node.decode().catch(() => {});
        backgrounds.push({source: node.currentSrc || node.src, width: node.naturalWidth, height: node.naturalHeight, type: 'image', rect: rect(node)});
      }
      const css = getComputedStyle(node).backgroundImage;
      for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
        const image = new Image(); image.src = match[1]; await image.decode().catch(() => {});
        backgrounds.push({source: image.src, width: image.naturalWidth, height: image.naturalHeight, type: 'CSS background'});
      }
    }
    return {viewport: {width: innerWidth, height: innerHeight}, visual: rect(visual), backgrounds,
      title: {text: document.querySelector('#briefingName').textContent, fontSize: parseFloat(getComputedStyle(document.querySelector('#briefingName')).fontSize)},
      panel: {...rect(document.querySelector('#briefingPanel')), scrollTop: document.querySelector('#briefingPanel').scrollTop,
        scrollHeight: document.querySelector('#briefingPanel').scrollHeight, clientHeight: document.querySelector('#briefingPanel').clientHeight},
      launch: rect(document.querySelector('#launch'))};
  });
}
function verifyBriefing(value, requireLaunchInViewport = true) {
  assert.ok(value.title.text && value.title.fontSize >= 18, 'Mission title is too small');
  assert.ok(value.visual.width >= Math.min(220, value.viewport.width * .55), 'Illustration is still a tiny thumbnail');
  assert.ok(value.visual.height >= 90, 'Illustration is too short to inspect');
  assert.ok(value.backgrounds.some(image => image.width >= 512 && image.height >= 256), 'No decoded mission illustration replaces the generic miniature');
  assert.ok(value.launch.width >= 44 && value.launch.height >= 44, 'Launch target is too small');
  assert.ok(value.launch.left >= -1 && value.launch.right <= value.viewport.width + 1, 'Launch button leaves the horizontal viewport');
  if (requireLaunchInViewport) assert.ok(value.launch.top >= -1 && value.launch.bottom <= value.viewport.height + 1, 'Launch button leaves the viewport');
}

async function swipePanel(selector) {
  const box = await page.locator(selector).boundingBox(); assert.ok(box, `${selector} is absent`);
  const cdp = await context.newCDPSession(page);
  const x = box.x + 12, startY = box.y + box.height - 24, endY = box.y + 28;
  try {
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{id: 17, x, y: startY}]});
    for (let step = 1; step <= 12; step++) {
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{id: 17, x, y: startY + (endY - startY) * step / 12}]});
      await page.waitForTimeout(15);
    }
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    await page.waitForTimeout(200);
  } finally { await cdp.detach(); }
}

(async () => {
  await prepareEvidence(output); evidenceReady = true;
  report.scriptSha256 = sha256(await fs.readFile(__filename));
  report.git = {sha: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(), status: execFileSync('git', ['status', '--short'], {encoding: 'utf8'}).trim()};
  report.buildInfo = JSON.parse(await fs.readFile(path.join(root, 'build-info.json'), 'utf8'));
  const nested = await fs.access(path.join(root, 'juego', 'index.html')).then(() => true).catch(() => false);
  const gameDirectory = nested ? path.join(root, 'juego') : root;
  report.packageFiles = {};
  for (const name of ['game.js', 'styles.css', 'index.html', 'content-runtime.js']) {
    const bytes = await fs.readFile(path.join(gameDirectory, name));
    report.packageFiles[name] = {bytes: bytes.length, sha256: sha256(bytes)};
  }
  server = await startStaticServer(root);
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']});
  context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block'});
  page = await context.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(errorText(error)));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('requestfailed', request => report.failedRequests.push({url: request.url(), error: request.failure()?.errorText}));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push({url: response.url(), status: response.status()}); });
  await page.addInitScript(({key, equipment}) => {
    if (!sessionStorage.getItem('combat-readability-seeded')) {
      for (const prefix of ['', 'neon-preview-v1:']) {
        localStorage.setItem(prefix + key, JSON.stringify(equipment));
        localStorage.setItem(prefix + 'neon-n7-unlocked-v1', '37');
        localStorage.setItem(prefix + 'neon-n7-best-v1', '2037');
      }
      sessionStorage.setItem('combat-readability-seeded', '1');
    }
    const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
    const audit = window.__COMBAT_READABILITY_RAF__ = {pending: new Set(), maximum: 0, frames: 0, errors: []};
    window.requestAnimationFrame = callback => {
      const id = request(now => { audit.pending.delete(id); audit.frames++; try { callback(now); } catch (error) { audit.errors.push(error.stack || String(error)); throw error; } });
      audit.pending.add(id); audit.maximum = Math.max(audit.maximum, audit.pending.size); return id;
    };
    window.cancelAnimationFrame = id => { audit.pending.delete(id); cancel(id); };
  }, {key: equipmentKey, equipment: legacyEquipment});
  await page.route(/\/game\.js(?:\?.*)?$/, async route => {
    const response = await route.fetch(), body = await response.body(), source = body.toString('utf8');
    assert.equal(sha256(body), report.packageFiles['game.js'].sha256, 'Browser loaded a different game snapshot');
    const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
    assert.equal(source.split(marker).length, 2, 'Legacy bootstrap marker changed');
    const hook = `window.__COMBAT_READABILITY_QA__={fixtureCalls:[],snapshot:()=>({state,currentLevel,elapsed,hull,score,collected,W,H,warpTimer,legacyRunning,observedAt:performance.now(),
      jsHeap:performance.memory?{usedJSHeapSize:performance.memory.usedJSHeapSize,totalJSHeapSize:performance.memory.totalJSHeapSize,jsHeapSizeLimit:performance.memory.jsHeapSizeLimit}:null,
      powers:{...powers},shieldAge:typeof classicShieldAge==='number'?classicShieldAge:null,shieldImpact:typeof classicShieldImpact==='number'?classicShieldImpact:null,
      player:{x:player.x,y:player.y,target:player.target,targetY:player.targetY},
      equipment:JSON.parse(JSON.stringify(classicEquipment)),weapons:classicWeapons?NeonCampaign.classicWeaponSnapshot(classicWeapons):null,
      boss:atlasBoss?{state:atlasBoss.state,phase:atlasBoss.phase,hp:atlasBoss.hp}:null,
      atlasShots:shots.filter(shot=>shot.atlasPulse).map(shot=>({x1:shot.x1,y1:shot.y1,damage:shot.damage,kind:shot.kind,life:shot.life})),
      saves:Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])),
      assets:Object.entries(SPRITES).filter(([,image])=>image.src).map(([id,image])=>({id,loaded:image.complete&&image.naturalWidth>0,width:image.naturalWidth,height:image.naturalHeight}))}),
      orb(){if(state!=='playing')throw new Error('Orb fixture requires active play');
        const item={type:'energy',x:player.x,y:player.y,r:20,alpha:1,phase:0,rot:0,p:0};
        const before={collected,score,r:item.r,circles:collisionCircles(item),hitsShip:hit(item)};
        const base=ctx.getTransform(),draws=[],scales=[],drawImage=ctx.drawImage,scale=ctx.scale;
        ctx.drawImage=function(image,...args){const matrix=this.getTransform(),index=Object.values(SPRITES).indexOf(image),id=index<0?null:Object.keys(SPRITES)[index];
          const width=args.length===8?args[6]:args.length===4?args[2]:image.naturalWidth;
          draws.push({id,args,width,relativeScale:Math.hypot(matrix.a,matrix.b)/Math.hypot(base.a,base.b),projectedWidth:width*Math.hypot(matrix.a,matrix.b)/Math.hypot(base.a,base.b)});
          return drawImage.call(this,image,...args);};
        ctx.scale=function(x,y){scales.push([x,y]);return scale.call(this,x,y);};
        try{drawEnergy(item);}finally{ctx.drawImage=drawImage;ctx.scale=scale;}
        const afterRender={r:item.r,circles:collisionCircles(item),hitsShip:hit(item)};
        const drawTime=elapsed,proximity=1,breath=.5+.5*Math.sin(drawTime*3.4),pulse=1+breath*.055+proximity*.08;
        collectItem(item);
        const result={type:'synthetic-orb-real-draw-and-collection-handlers',before,afterRender,after:{collected,score},draws,scales,pulse};this.fixtureCalls.push(result);return result;},
      shield(){if(state!=='playing')throw new Error('Shield fixture requires active play');const before={hull,score,power:powers.shield};
        activatePower('shield',{x:player.x,y:player.y});damageShip(25,player.x+42,player.y-32);
        document.querySelector('#pause').click();const result={type:'real-activatePower-and-damageShip',damage:25,before,after:{hull,score,power:powers.shield,age:classicShieldAge,impact:classicShieldImpact},paused:state};this.fixtureCalls.push(result);return result;},
      liveShield(){if(state!=='playing')throw new Error('Live shield fixture requires active play');const before={elapsed,hull,score,power:powers.shield};activatePower('shield',{x:player.x,y:player.y});
        const result={type:'real-activatePower-without-pausing',before,after:{elapsed,hull,score,power:powers.shield}};this.fixtureCalls.push(result);return result;},
      liveShieldImpact(){if(state!=='playing'||powers.shield<=0)throw new Error('Live shield impact fixture requires an active shield');const before={hull,score};damageShip(25,player.x+42,player.y-32);
        const result={type:'real-damageShip-live-state-observation-only',damage:25,before,after:{hull,score,impact:classicShieldImpact}};this.fixtureCalls.push(result);return result;},
      orbitProbe(){if(typeof drawVulkarOrbitBackground!=='function')throw new Error('Vulkar orbital renderer missing');const draws=[],drawImage=ctx.drawImage;
        ctx.drawImage=function(image,...args){const matrix=this.getTransform(),key=Object.keys(SPRITES).find(key=>SPRITES[key]===image)||'unregistered';draws.push({key,args,matrix:[matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f]});return drawImage.call(this,image,...args);};
        try{drawVulkarOrbitBackground();}finally{ctx.drawImage=drawImage;}return{elapsed,state,draws};},
      atlasQuota(){if(state!=='playing'||currentLevel!==1||atlasBoss)throw new Error('Atlas quota fixture requires Gaia before its guardian');
        const before={collected,score,goal:level().goal};let count=0;
        while(collected<level().goal){collectItem({type:'energy',x:player.x,y:player.y,r:20,alpha:1,phase:0,rot:0,p:0});count++;}
        const result={type:'synthetic-orbs-real-collection-handler-to-enter-Atlas',count,before,after:{collected,score,bossState:atlasBoss?.state}};this.fixtureCalls.push(result);return result;},
      atlasRenderProbe(){const texts=[],rects=[],fillText=ctx.fillText,fillRect=ctx.fillRect;
        ctx.fillText=function(text,...args){texts.push(String(text));return fillText.call(this,text,...args);};
        ctx.fillRect=function(...args){rects.push(args);return fillRect.apply(this,args);};
        try{drawGuardianAtlas();}finally{ctx.fillText=fillText;ctx.fillRect=fillRect;}return{state:atlasBoss?.state,texts,rects};}};\n`;
    await route.fulfill({response, body: source.replace(marker, hook + marker)});
  });
  if (!values['supplement-only']) {
  await check('legacy equipment survives loading and the real C9 workshop calibrates the lance', async () => {
    await page.goto(server.url, {waitUntil: 'load'});
    if (nested) { await page.locator('#qaArchive summary').click(); await page.locator('#unlockClassic').check(); await page.locator('#classiclink').click(); }
    await page.waitForFunction(() => typeof window.__COMBAT_READABILITY_QA__ === 'object', null, {polling: 100});
    const initial = await until(q => q.state === 'menu');
    assert.deepEqual(initial.equipment.unlocked, ['pulse', 'twin']); assert.equal(initial.equipment.selected, 'twin'); assert.equal(initial.equipment.recoveredTwin, true);
    report.legacyLoaded = initial; await page.locator('#openFlightDock').click();
    await capture('c9-before-calibration'); await page.locator('#flightCalibrateLance').click();
    const calibrated = await inspect(); assert.equal(calibrated.equipment.lanceCalibrated, true);
    assert.deepEqual(calibrated.equipment.unlocked, ['pulse', 'twin', 'lance']);
    assert.equal(await page.locator('#flightCalibrateLance').isDisabled(), true);
    report.calibrated = calibrated; await capture('c9-lance-calibrated');
    await page.locator('#flightDockContinue').click(); await until(q => q.state === 'menu');
  });
  await check('mission illustrations replace the miniature and all ten briefs remain launchable', async () => {
    report.briefings = [];
    for (let index = 0; index < 10; index++) {
      await openBriefing(index); const value = await briefingLayout(); verifyBriefing(value);
      report.briefings.push({level: index + 1, ...value});
      if ([0, 2, 9].includes(index)) await capture(`briefing-level-${index + 1}`, 'Actual mission briefing; no gameplay completion is claimed');
      await page.locator('#briefingBack').click(); await page.locator('#levelBack').click();
    }
  });
  await check('pulse, centered twin and lance expose ×1, ×2 and ×3 damage without free ammunition on switching', async () => {
    await launch(2); report.weaponUses = [];
    for (const [type, multiplier, count] of [['pulse', 1, 1], ['twin', 2, 2], ['lance', 3, 1]]) {
      for (let attempt = 0; (await inspect()).weapons.selected !== type && attempt < 3; attempt++) await page.locator('#flightWeapon').click();
      const ready = await until(q => q.weapons.selected === type && q.weapons.cooldown <= 0);
      assert.equal(ready.weapons.damageMultiplier, multiplier); assert.equal((await page.locator('#flightWeaponDamage').textContent()).trim(), `DAÑO ×${multiplier}`);
      const fired = await page.evaluate(() => {
        const qa = window.__COMBAT_READABILITY_QA__, before = qa.snapshot();
        document.querySelector('#fire').click(); const after = qa.snapshot();
        document.querySelector('#flightWeapon').click(); const switched = qa.snapshot();
        return {before: before.weapons, after: after.weapons, switched: switched.weapons};
      });
      assert.equal(fired.after.charges, fired.before.charges - 1); assert.equal(fired.switched.charges, fired.after.charges);
      assert.equal(fired.switched.recharge, fired.after.recharge); assert.equal(fired.switched.cooldown, fired.after.cooldown);
      const emitted = fired.after.projectiles.filter(shot => !fired.before.projectiles.some(before => before.id === shot.id));
      assert.equal(emitted.length, count); assert.equal(emitted.reduce((sum, shot) => sum + shot.damage, 0), multiplier);
      if (type === 'twin') { assert.ok(Math.abs((emitted[0].x + emitted[1].x) / 2 - ready.player.x) < 1); assert.ok(Math.abs(emitted[1].x - emitted[0].x) <= 24, 'Twin fire is still spread apart'); assert.equal(emitted[0].vx, emitted[1].vx); }
      report.weaponUses.push({type, multiplier, fired, emitted});
    }
    const cycle = await page.evaluate(() => {
      const qa = window.__COMBAT_READABILITY_QA__, before = qa.snapshot().weapons, states = [];
      for (let index = 0; index < 3; index++) { document.querySelector('#flightWeapon').click(); states.push(qa.snapshot().weapons); }
      return {before, states};
    });
    assert.equal(new Set(cycle.states.map(q => q.selected)).size, 3);
    for (const q of cycle.states) { assert.equal(q.charges, cycle.before.charges); assert.equal(q.recharge, cycle.before.recharge); assert.equal(q.cooldown, cycle.before.cooldown); }
    report.cycle = cycle; await capture('vulkar-orbit-and-weapon-readout');
  });
  await check('the orb is drawn at half size while the real capture radius and collection remain unchanged', async () => {
    const fixture = await page.evaluate(() => window.__COMBAT_READABILITY_QA__.orb()); report.fixtureCalls.push(fixture);
    assert.deepEqual(fixture.before.circles, [{x: 0, y: 0, r: 22}]); assert.deepEqual(fixture.afterRender.circles, fixture.before.circles);
    assert.equal(fixture.afterRender.r, fixture.before.r); assert.equal(fixture.before.hitsShip, true); assert.equal(fixture.afterRender.hitsShip, true);
    assert.equal(fixture.after.collected, fixture.before.collected + 1); assert.ok(fixture.after.score > fixture.before.score);
    const crystal = fixture.draws.find(draw => draw.id === 'croniumFragment'); assert.ok(crystal, 'The illustrated CRONIUM fragment was not drawn');
    const ratio = crystal.projectedWidth / (fixture.before.r * 2.62 * fixture.pulse);
    assert.ok(Math.abs(ratio - .5) < .000001, `Orb width ratio is ${ratio}, expected .5`); report.orbVisualRatio = ratio;
  });
  await check('the illustrated force field absorbs a real damage handler and its age, impact and timer pause together', async () => {
    const fixture = await page.evaluate(() => window.__COMBAT_READABILITY_QA__.shield()); report.fixtureCalls.push(fixture);
    assert.equal(fixture.after.hull, fixture.before.hull); assert.equal(fixture.after.score, fixture.before.score + 10);
    assert.ok(fixture.after.power > 0); assert.ok(fixture.after.impact > 0); assert.equal(fixture.paused, 'paused');
    const before = await until(q => q.assets.some(asset => asset.id === 'forceShieldAtlas' && asset.loaded && asset.width / 4 >= 96 && asset.height >= 128));
    await page.waitForTimeout(500); const after = await inspect();
    assert.equal(after.elapsed, before.elapsed); assert.deepEqual(after.powers, before.powers); assert.equal(after.shieldAge, before.shieldAge); assert.equal(after.shieldImpact, before.shieldImpact); assert.deepEqual(after.weapons, before.weapons);
    report.shieldPause = {before, after}; await capture('force-field-absorbed-impact-paused');
    await page.locator('#resume').click(); await until(q => q.elapsed > before.elapsed && q.shieldAge > before.shieldAge);
  });
  await check('independent orbital scenery moves with played time and freezes exactly while paused', async () => {
    await page.locator('#pause').click();
    const pausedA = await page.evaluate(() => window.__COMBAT_READABILITY_QA__.orbitProbe());
    assert.ok(new Set(pausedA.draws.map(draw => draw.key)).size >= 2, 'Vulkar does not compose two independently registered illustration layers');
    await page.waitForTimeout(400); const pausedB = await page.evaluate(() => window.__COMBAT_READABILITY_QA__.orbitProbe());
    assert.deepEqual(pausedB, pausedA, 'Orbital composition moves on wall-clock time while paused');
    await page.locator('#resume').click(); await until(q => q.elapsed >= pausedA.elapsed + .6);
    const played = await page.evaluate(() => window.__COMBAT_READABILITY_QA__.orbitProbe());
    assert.ok(played.elapsed > pausedA.elapsed); assert.notDeepEqual(played.draws, pausedA.draws, 'Orbital illustration layers did not move during play');
    report.orbit = {pausedA, pausedB, played}; await capture('vulkar-orbital-layers');
  });
  await check('calibrated equipment reloads and archived N-7 saves remain untouched', async () => {
    await quit(); const before = await inspect();
    await page.reload({waitUntil: 'load'}); await page.waitForFunction(() => typeof window.__COMBAT_READABILITY_QA__ === 'object', null, {polling: 100});
    const after = await until(q => q.state === 'menu');
    assert.deepEqual(after.equipment, before.equipment); assert.equal(after.equipment.lanceCalibrated, true);
    const archived = saves => Object.fromEntries(Object.entries(saves).filter(([key]) => /neon-n7-(unlocked|best)-v1$/.test(key)));
    assert.deepEqual(archived(after.saves), archived(report.legacyLoaded.saves)); report.reload = {before, after};
  });
  await check('the guardian shares the three-charge battery and warns through its weapons without displaying a solved escape lane', async () => {
    await launch(1);
    const fixture = await page.evaluate(() => window.__COMBAT_READABILITY_QA__.atlasQuota()); report.fixtureCalls.push(fixture);
    await until(q => Boolean(q.boss) && q.assets.every(asset => asset.loaded));
    if (await page.locator('#atlasAutoFire').getAttribute('aria-pressed') === 'true') await page.locator('#atlasAutoFire').click();
    assert.equal(await page.locator('#flightWeapon').isVisible(), true); assert.equal(await page.locator('#flightRoute').isVisible(), false);
    const ready = await inspect(); assert.equal(ready.weapons.charges, 3);
    report.atlasWeaponUses = [];
    for (let index = 0; index < 3; index++) {
      await until(q => q.weapons.cooldown <= 0);
      const use = await page.evaluate(() => { const qa = window.__COMBAT_READABILITY_QA__, before = qa.snapshot(); document.querySelector('#fire').click(); return {before, after: qa.snapshot()}; });
      assert.equal(use.after.weapons.charges, use.before.weapons.charges - 1, 'Guardian bypassed the shared charge battery');
      assert.ok(use.after.atlasShots.length > 0); report.atlasWeaponUses.push(use);
    }
    await until(q => q.boss?.state === 'charge'); await page.locator('#pause').click();
    const probe = await page.evaluate(() => window.__COMBAT_READABILITY_QA__.atlasRenderProbe());
    assert.ok(!probe.texts.some(text => /RUTA LIBRE/i.test(text))); assert.deepEqual(probe.rects, [], 'The guardian renderer still paints a solved safe corridor');
    const status = await page.locator('#atlasStatus').textContent(); assert.ok(!/atraviesa la franja|cambia de posici[oó]n|ruta libre/i.test(status));
    report.atlasPresentation = {probe, status}; await capture('atlas-charge-no-solved-corridor', 'Actual guardian warning; entered through an explicitly synthetic collection fixture, not a natural playthrough');
    await page.locator('#quit').click(); await until(q => q.state === 'menu');
  });
  } else {
    await page.goto(server.url, {waitUntil: 'load'});
    if (nested) { await page.locator('#qaArchive summary').click(); await page.locator('#unlockClassic').check(); await page.locator('#classiclink').click(); }
    await page.waitForFunction(() => typeof window.__COMBAT_READABILITY_QA__ === 'object', null, {polling: 100});
    await until(q => q.state === 'menu');
  }
  await check('small portrait and landscape briefings retain decoded art and accessible launch controls', async () => {
    report.smallBriefings = [];
    for (const [width, height] of [[320, 568], [844, 390]]) {
      await page.setViewportSize({width, height}); await openBriefing(2);
      const value = await briefingLayout(); verifyBriefing(value, false);
      await capture(`briefing-vulkar-${width}x${height}-top`, 'Actual responsive mission briefing before scrolling; no physical-device claim');
      let scrolled = value;
      if (value.launch.top < 0 || value.launch.bottom > value.viewport.height) {
        assert.ok(value.panel.scrollHeight > value.panel.clientHeight, 'Offscreen launch has no scroll container');
        await swipePanel('#briefingPanel'); scrolled = await briefingLayout();
        assert.ok(scrolled.panel.scrollTop > value.panel.scrollTop, 'Actual touch swipe did not scroll the mission panel');
      }
      verifyBriefing(scrolled); report.smallBriefings.push({beforeScroll: value, afterScroll: scrolled});
      await capture(`briefing-vulkar-${width}x${height}-controls`, 'Actual responsive mission briefing after any required real touch swipe');
      await page.locator('#briefingBack').click(); await page.locator('#levelBack').click();
    }
  });
  await check('the compact C9 workshop can be inspected and operated using real touch scrolling', async () => {
    await page.setViewportSize({width: 320, height: 568}); await page.locator('#openFlightDock').click();
    const layout = () => page.evaluate(() => {
      const panel = document.querySelector('.flight-dock'), r = panel.getBoundingClientRect();
      const button = document.querySelector('#flightDockContinue'), b = button.getBoundingClientRect();
      return {viewport: {width: innerWidth, height: innerHeight}, panel: {left: r.left, top: r.top, right: r.right, bottom: r.bottom, scrollTop: panel.scrollTop, scrollHeight: panel.scrollHeight, clientHeight: panel.clientHeight},
        continueButton: {left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height}};
    });
    const before = await layout(); await capture('c9-320x568-top', 'Actual C9 workshop with declared legacy twin equipment; first scroll position');
    if (before.continueButton.bottom > before.viewport.height) await swipePanel('.flight-dock');
    const after = await layout();
    if (before.continueButton.bottom > before.viewport.height) assert.ok(after.panel.scrollTop > before.panel.scrollTop, 'Actual touch swipe did not scroll C9');
    assert.ok(after.panel.left >= 0 && after.panel.right <= 320 && after.panel.top >= 0 && after.panel.bottom <= 568);
    assert.ok(after.continueButton.width >= 44 && after.continueButton.height >= 44);
    assert.ok(after.continueButton.top >= 0 && after.continueButton.bottom <= 568, 'Workshop continue button cannot be reached');
    report.compactDock = {before, after}; await capture('c9-320x568-controls', 'Actual C9 workshop after a real touch swipe if required');
    await page.locator('#flightDockContinue').click(); await until(q => q.state === 'menu');
  });
  await check('the stable force field is visible during uninterrupted play and exposes an honest short heap/FPS sample', async () => {
    await page.setViewportSize({width: 390, height: 844}); await launch(2);
    const activated = await page.evaluate(() => window.__COMBAT_READABILITY_QA__.liveShield()); report.fixtureCalls.push(activated);
    const before = await until(q => q.state === 'playing' && q.shieldAge >= .3 && q.powers.shield > 0 && q.assets.some(asset => asset.id === 'forceShieldAtlas' && asset.loaded));
    const wallStarted = Date.now(); await capture('force-field-stable-live', 'Actual stable force field during uninterrupted playing; activated through the explicitly declared real power handler');
    const after = await inspect();
    assert.equal(before.state, 'playing'); assert.equal(after.state, 'playing'); assert.ok(before.powers.shield > 0 && after.powers.shield > 0, 'Shield expired during capture; image cannot certify live force-field visibility');
    assert.equal(await page.locator('#paused').evaluate(node => node.classList.contains('show')), false, 'Pause overlay obscures the live field');
    report.liveShieldCapture = {before, after, wallCaptureMs: Date.now() - wallStarted, activeBeforeAndAfter: true};
    const impact = await page.evaluate(() => window.__COMBAT_READABILITY_QA__.liveShieldImpact()); report.fixtureCalls.push(impact);
    assert.equal(impact.after.hull, impact.before.hull); assert.equal(impact.after.score, impact.before.score + 10); assert.ok(impact.after.impact > 0);
    report.liveImpact = {stateObserved: impact, screenshotClaim: 'None: a state observation does not certify a particular 180ms animation frame'};
    const sampleBefore = await inspect(); await page.waitForTimeout(1200); const sampleAfter = await inspect();
    const milliseconds = sampleAfter.observedAt - sampleBefore.observedAt, frames = sampleAfter.raf.frames - sampleBefore.raf.frames;
    assert.ok(milliseconds >= 1000 && frames > 0);
    report.shortPerformanceSample = {browser: 'Software Chromium, 390x844 DPR1', intervalBrowserMs: milliseconds, frames,
      framesPerSecond: frames * 1000 / milliseconds, playedSeconds: sampleAfter.elapsed - sampleBefore.elapsed,
      jsHeapBefore: sampleBefore.jsHeap, jsHeapAfter: sampleAfter.jsHeap,
      limitation: 'A short wall-time frame-count sample and Chromium JavaScript heap only. This does not measure GPU/RGBA decoded-image memory, physical iPhone performance, stable 60 FPS or a memory leak.'};
  });
  for (const [name, recorded] of Object.entries(report.packageFiles)) assert.equal(sha256(await fs.readFile(path.join(gameDirectory, name))), recorded.sha256, `Build changed while QA was running: ${name}`);
  report.packageUnchanged = true; report.status = 'passed'; report.exitCode = 0;
})().catch(async error => {
  report.status = 'failed'; report.exitCode = 1; report.error = errorText(error); console.error(report.error);
  if (page) { report.failureSnapshot = await inspect().catch(error => ({error: errorText(error)})); if (evidenceReady) await page.screenshot({path: path.join(output, 'failure.png'), timeout: 10000}).catch(() => {}); }
}).finally(async () => {
  report.durationMs = Date.now() - started; report.finishedAt = new Date().toISOString();
  if (server) report.requests = server.requests;
  if (browser) await browser.close().catch(() => {}); if (server) await server.close().catch(() => {});
  if (evidenceReady) await save();
  console.log(JSON.stringify({status: report.status, exitCode: report.exitCode, checks: report.checks.map(q => ({name: q.name, status: q.status})), output, durationMs: report.durationMs}));
  process.exitCode = report.exitCode ?? 1;
});
