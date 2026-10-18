// Focused natural Gaia patrol: only the level unlock and owned equipment are
// seeded. Enemies, health, time, projectiles, rewards and movement stay shipped.
// node scripts/gaia-interceptor-browser-smoke.cjs --root preview-dist \
//   --output /tmp/gaia-interceptor-01 --expected-commit FULL_SHA --timeout 300000
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {parseArgs} = require('node:util');
const {startStaticServer, prepareEvidence, saveEvidence, sha256, errorText} = require('./browser-qa-helpers.cjs');

const {values} = parseArgs({options: {root: {type: 'string'}, output: {type: 'string'},
  timeout: {type: 'string'}, 'expected-commit': {type: 'string'}, combat: {type: 'boolean', default: false},
  'equip-twin': {type: 'boolean', default: false}, 'close-range': {type: 'boolean', default: false}}});
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output || `/tmp/gaia-interceptor-${Date.now()}`);
const timeout = Number(values.timeout || 300000);
assert.ok(Number.isFinite(timeout) && timeout >= 30000 && timeout <= 600000, 'Timeout must be 30000–600000 ms');
const equipment = {version: 1, selected: 'pulse', unlocked: ['pulse', 'twin'], recoveredTwin: true,
  assembly: {hull: 'striker', wings: 'delta', engines: 'ion'}};
const report = {status: 'running', exitCode: null, startedAt: new Date().toISOString(), command: process.argv,
  sourceRoot: root, browser: 'Real Chromium, 390x844, DPR 1',
  pilotVersion: values['close-range']?'natural-gaia-ch02-close-range-v3':'natural-gaia-ch02-bait-align-v2',
  cases: [], errors: [], consoleErrors: [], failedRequests: [],
  screenshots: [], samples: [], interceptors: [], actions: [],
  fixtures: {unlocked: 2, equipment}, combatRequired: values.combat, equipTwinViaUI:values['equip-twin'],
  closeRange:values['close-range'], verticalActions:[],hudSnapshots:[],
  limits: ['Only level 2 unlock and owned Pulse/Twin equipment are seeded in a fresh preview profile.',
    'Patrol scheduling, enemy health, spawning, elapsed time, weapon projectiles and collisions are never changed.',
    'The automatic QA pilot uses real pointer and keyboard controls; this is not a human playtest.',
    'Read-only closure diagnostics and native Canvas/RAF observers are injected into a local response; package files are unchanged.',
    'All sixteen source cells are checked for distinct decoded pixels; actual gameplay draw counts are reported separately.',
    'A successful focused patrol does not certify the entire Gaia mission, aesthetic acceptance, Safari or physical iPhone.']};
let server, browser, context, page, evidenceReady = false;
const started = Date.now();
const save = () => saveEvidence(output, report);
const inspect = () => page.evaluate(() => ({...window.__INTERCEPTOR_QA__(), observer: {
  maximum: window.__INTERCEPTOR_OBSERVER__.maximum, frames: window.__INTERCEPTOR_OBSERVER__.frames,
  errors: [...window.__INTERCEPTOR_OBSERVER__.errors], draws: {...window.__INTERCEPTOR_OBSERVER__.draws}
}}));
function healthy(q) {
  assert.deepEqual(report.errors, [], 'Uncaught JavaScript exception');
  assert.deepEqual(report.consoleErrors, [], 'Console error');
  assert.deepEqual(report.failedRequests, [], 'Missing resource');
  assert.deepEqual(q.observer.errors, [], 'RAF callback threw');
  assert.ok(q.legacyRunning, 'Legacy loop stopped');
  assert.ok(q.observer.maximum <= 1, 'More than one pending RAF callback');
  assert.ok(!['destroying', 'gameover'].includes(q.state),
    `Natural QA run ended: state=${q.state}, reason=${q.supplyFailed?'supply':q.hull<=0?'hull':'see result'}, `+
    `hull=${q.hull}, CRONIUM=${q.collected}/${q.goal}. ${q.resultText||''}`);
}
function checkHudScoreTarget(q,reason) {
  // This closure snapshot runs between browser tasks, after the original hit
  // handler returned. The bounded award observer itself does not assert HUD
  // state halfway through that handler.
  assert.equal(q.hudScoreTarget,q.score,`HUD target must include the latest score after ${reason}`);
  const snapshot={reason,elapsed:q.elapsed,score:q.score,hudScoreTarget:q.hudScoreTarget,
    displayedScore:q.displayedScore,text:q.hudScoreText,damageEventCount:q.damageEvents.length};
  report.hudSnapshots.push(snapshot);
  return snapshot;
}
async function step(name, action) {
  const entry = {name, status: 'running', startedAt: new Date().toISOString()};
  report.cases.push(entry); await save(); console.log(`[Gaia interceptor] ${name}`);
  const began = Date.now();
  try { entry.result = await action(); healthy(await inspect()); entry.status = 'passed'; }
  catch (error) { entry.status = 'failed'; entry.error = errorText(error); throw error; }
  finally { entry.durationMs = Date.now() - began; await save(); }
}
const captures = new Set();
async function capture(name, q) {
  if (captures.has(name)) return;
  captures.add(name);
  const file = `${String(report.screenshots.length + 1).padStart(2, '0')}-${name}.png`;
  await page.screenshot({path: path.join(output, file)});
  report.screenshots.push({file, type: 'Authentic running game viewport; unlock/equipment fixture only',
    elapsed: q.elapsed, hull: q.hull, collected: q.collected, score: q.score});
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
function pilotTarget(q, enemy, collecting = false) {
  const bounds = q.bounds || {minX: 119, maxX: q.W - 119};
  const clamp = x => Math.max(bounds.minX, Math.min(bounds.maxX, x));
  const nearest = collecting ? q.items.filter(item => item.type === 'energy' && item.y < q.player.y + 40)
    .sort((a, b) => b.y - a.y)[0] : null;
  const weaponSpeed = q.weapons.selected==='twin'?900:920;
  const travel = enemy ? Math.max(0, (q.player.y - 125 - enemy.y) / (weaponSpeed + enemy.s)) : 0;
  // Choose a firing lead from observed position/velocity and the disclosed
  // pursuit-v1 movement limits. This simulates QA's aim only, never the game.
  // Holding centre during entry avoids endlessly chasing a flanking target;
  // once it commits to a visible charge, move into its firing lane.
  let lead = enemy?.x;
  if(enemy) {
    let x=enemy.x,vx=enemy.classicScout.vx;
    for(let future=0;future<travel;future+=.025) {
      const step=Math.min(.025,travel-future);
      const inFireHold=enemy.classicScout.state==='fire'&&future<Math.max(0,.34-enemy.classicScout.stateAge);
      const held=enemy.classicScout.state==='charge'||inFireHold;
      const target=enemy.classicScout.state==='fire'||enemy.classicScout.state==='break-away'
        ?enemy.classicScout.side>0?q.W-66:66:enemy.classicScout.targetX;
      const desired=held?0:Math.max(-148,Math.min(148,(target-x)*2.8));
      vx+=Math.max(-250*step,Math.min(250*step,desired-vx));
      x=Math.max(52,Math.min(q.W-52,x+vx*step));
    }
    lead=x;
  }
  const aim = enemy ? clamp(lead) : nearest?.x ?? q.W / 2;
  const candidates = [aim, q.player.x, q.player.target, bounds.minX, bounds.maxX];
  for (let x = bounds.minX; x <= bounds.maxX; x += 24) candidates.push(x);
  const threats = q.items.filter(item => ['meteor', 'debris', 'satellite', 'scout'].includes(item.type));
  const cost = x => {
    let result = Math.abs(x - aim) * (enemy ? .65 : .22) + Math.abs(x - q.player.x) * .025;
    for (const threat of threats) {
      const speed = threat.vy ?? threat.s ?? 0;
      if (threat.y > q.player.y + 140 || threat.y + speed * 1.5 < q.player.y - 220) continue;
      const vx = threat.classicScout?.vx ?? threat.vx ?? 0;
      for (let future = 0; future <= 1.5; future += .06) {
        const playerX = x + (q.player.x - x) * Math.exp(-q.follow * future);
        const obstacleX = threat.x + vx * future;
        const obstacleY = threat.y + speed * future;
        const rotation = (threat.rot || 0) + (threat.rs || 0) * future;
        for (const circle of threat.circles || [{x: 0, y: 0, r: threat.r}]) {
          const dx = obstacleX + circle.x * Math.cos(rotation) - circle.y * Math.sin(rotation) - playerX;
          const dy = obstacleY + circle.x * Math.sin(rotation) + circle.y * Math.cos(rotation) - q.player.y;
          const radius = circle.r + 11;
          if (Math.abs(dx) > 120 + radius || dy < -160 - radius || dy > 110 + radius) continue;
          if (circleTouchesOutline(dx, dy, radius, q.outline)) result += 20000 / (.2 + future);
        }
      }
    }
    return result;
  };
  return [...new Set(candidates.filter(Number.isFinite).map(clamp))].sort((a, b) => cost(a) - cost(b))[0];
}

(async () => {
  await prepareEvidence(output); evidenceReady = true;
  await fs.copyFile(__filename, path.join(output, 'qa-script-used.cjs'));
  report.qaScriptSha256 = sha256(await fs.readFile(__filename));
  report.buildInfo = JSON.parse(await fs.readFile(path.join(root, 'build-info.json'), 'utf8'));
  if (values['expected-commit']) {
    assert.equal(report.buildInfo.commit, values['expected-commit'], 'Unexpected package commit');
    assert.equal(report.buildInfo.dirty, false, 'Final browser certification requires a clean source package');
  }
  const nested = await fs.access(path.join(root, 'juego', 'index.html')).then(() => true).catch(() => false);
  const prefix = nested ? 'neon-preview-v1:' : '';
  report.packageFiles = {};
  for (const relative of ['game.js', 'content-runtime.js', 'assets/ch02_interceptor_atlas_v1.webp']) {
    const file = nested ? `juego/${relative}` : relative;
    const bytes = await fs.readFile(path.join(root, file));
    report.packageFiles[file] = {bytes: bytes.length, sha256: sha256(bytes)};
  }
  server = await startStaticServer(root);
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
  context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, serviceWorkers: 'block'});
  await context.addInitScript(({prefix, equipment}) => {
    const url = new URL(location.href);
    if (url.pathname.endsWith('/juego/index.html') || url.pathname.endsWith('/juego/')) {
      if (localStorage.getItem(prefix + 'neon-unlocked-v2') === null) localStorage.setItem(prefix + 'neon-unlocked-v2', '2');
      if (localStorage.getItem(prefix + 'neonCatcher.flightEquipment.v1') === null) {
        localStorage.setItem(prefix + 'neonCatcher.flightEquipment.v1', JSON.stringify(equipment));
      }
    }
    const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
    const observer = window.__INTERCEPTOR_OBSERVER__ = {maximum: 0, frames: 0, pending: new Set(), errors: [], draws: {}};
    window.requestAnimationFrame = callback => {
      const id = request(now => {
        observer.pending.delete(id); observer.frames++;
        try { callback(now); } catch (error) { observer.errors.push(error.stack || String(error)); throw error; }
      });
      observer.pending.add(id); observer.maximum = Math.max(observer.maximum, observer.pending.size); return id;
    };
    window.cancelAnimationFrame = id => { observer.pending.delete(id); cancel(id); };
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      const source = args[0]?.currentSrc || args[0]?.src || '';
      if (this.canvas.id === 'canvas' && source.includes('/ch02_interceptor_atlas_v1.webp') && args.length === 9) {
        const key = [args[1], args[2], args[3], args[4]].join(',');
        observer.draws[key] = (observer.draws[key] || 0) + 1;
      }
      return draw.apply(this, args);
    };
  }, {prefix, equipment});
  page = await context.newPage(); page.setDefaultTimeout(30000);
  page.on('pageerror', error => report.errors.push(errorText(error)));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('requestfailed', request => report.failedRequests.push({url: request.url(), error: request.failure()?.errorText}));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push({url: response.url(), status: response.status()}); });
  await page.route(/\/game\.js(?:\?.*)?$/, async route => {
    const response = await route.fetch(), body = await response.body(), source = body.toString('utf8');
    const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
    assert.equal(source.split(marker).length, 2, 'Legacy bootstrap marker changed');
    const hook = `window.__INTERCEPTOR_QA__ = () => ({state,currentLevel,elapsed,hull,score,collected,W,H,
      goal:level().goal,supplyFailed,resultText:ui.result?.textContent,supplyStatus:ui.supplyStatus?.textContent,
      atlasActive:Boolean(atlasBoss),damageEvents:[...window.__INTERCEPTOR_HITS_QA__],
      hudScoreTarget,displayedScore,hudScoreText:ui.score?.textContent,
      legacyRunning,legacyFrameId,follow:9+settings.sensitivity/100*8,outline:SHIP_COLLISION_OUTLINE,
      player:{x:player.x,y:player.y,target:player.target,targetY:player.targetY},
      bounds:classicFlightBounds?{...classicFlightBounds}:null,
      equipment:JSON.parse(JSON.stringify(classicEquipment)),
      weapons:classicWeapons?{...NeonCampaign.classicWeaponSnapshot(classicWeapons),shotSequence:classicWeapons.shotSequence}:null,
      atlas:{ready:spriteReady(SPRITES.ch02),width:SPRITES.ch02.naturalWidth,height:SPRITES.ch02.naturalHeight,source:SPRITES.ch02.currentSrc||SPRITES.ch02.src},
      items:items.map(item=>({id:item.id,type:item.type,x:item.x,y:item.y,s:item.s,r:item.r,hp:item.hp,maxHp:item.maxHp,
        rot:item.rot,rs:item.rs,vx:item.vx,vy:item.vy,circles:collisionCircles(item),
        classicScoutProjectile:Boolean(item.classicScoutProjectile),attackSerial:item.attackSerial,role:item.role,
        classicScout:item.classicScout?{tacticsVersion:item.classicScout.tacticsVersion,role:item.classicScout.role,
          state:item.classicScout.state,stateAge:item.classicScout.stateAge,age:item.classicScout.age,
          vx:item.classicScout.vx,targetX:item.classicScout.targetX,side:item.classicScout.side,
          fired:item.classicScout.fired,telegraph:item.classicScout.telegraph,chargeSerial:item.classicScout.chargeSerial,
          lockedTarget:item.classicScout.lockedTarget?{...item.classicScout.lockedTarget}:null,
          frame:item.classicScout.animator?.getFrame()}:null})),
      destruction:explosions.filter(effect=>effect.ch01Animator).map(effect=>({x:effect.x,y:effect.y,life:effect.life,
        frame:effect.ch01Animator.getFrame()})),
      unlocked:getUnlocked(),keys:{...KEYS}});\n`;
    const rewardMarker='score+=(item.n7Projectile||item.classicScoutProjectile)?0:(destroyed?10:3);';
    assert.equal(source.split(rewardMarker).length,2,'Classic projectile reward observation marker changed');
    const observeReward=`if(item.classicScout?.role==='interceptor'&&window.__INTERCEPTOR_HITS_QA__.length<200)
      window.__INTERCEPTOR_HITS_QA__.push({targetId:item.id,shotId:shot.id,projectileId:shot.id,
        at:elapsed,damage:impact.damage,hp:item.hp,maxHp:item.maxHp,destroyed,
        reward:(item.n7Projectile||item.classicScoutProjectile)?0:(destroyed?10:3),score});`;
    // Add a bounded observation immediately after the original reward statement;
    // the statement, collision result, HP and scoring execution stay untouched.
    const observed=source.replace(rewardMarker,rewardMarker+observeReward);
    await route.fulfill({response, body: observed.replace(marker,
      'window.__INTERCEPTOR_HITS_QA__=[];\n'+hook+marker)});
  });
  await step('open Gaia via the actual selector with declared unlock/equipment fixtures', async () => {
    await page.goto(server.url, {waitUntil: 'load'});
    if (nested) await page.locator('#classiclink').click();
    await page.waitForFunction(() => typeof __INTERCEPTOR_QA__ === 'function' && __INTERCEPTOR_QA__().state === 'menu',
      null, {polling: 100});
    await page.locator('#levels').click(); await page.locator('#levelGrid button').nth(1).click();
    await page.locator('#launch').click();
    await page.waitForFunction(() => __INTERCEPTOR_QA__().currentLevel === 1 && __INTERCEPTOR_QA__().state === 'playing',
      null, {polling: 100});
    const q = await inspect();
    assert.equal(q.equipment.selected, 'pulse'); assert.ok(q.equipment.unlocked.includes('twin'));
    await capture('gaia-natural-patrol-start', q);
    if(values['equip-twin']) {
      await page.locator('#flightWeapon').click();const equipped=await inspect();
      assert.equal(equipped.weapons.selected,'twin');
      assert.equal(equipped.weapons.charges,q.weapons.charges,'Selecting owned Twin must not recharge the battery');
      report.initialWeaponSwitch={before:q.weapons,after:equipped.weapons,action:'Actual #flightWeapon click'};
      await capture('gaia-twin-equipped-via-real-control',equipped);
    }
    return q;
  });
  await step('the real CH-02 image contains sixteen distinct nonempty transparent cells', async () => {
    await page.waitForFunction(() => __INTERCEPTOR_QA__().atlas.ready, null, {polling: 100});
    const atlas = await page.evaluate(async () => {
      const source = __INTERCEPTOR_QA__().atlas, image = new Image(); image.src = source.source; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
      const ctx = canvas.getContext('2d', {willReadFrequently: true}), cells = [];
      for (let index = 0; index < 16; index++) {
        ctx.clearRect(0, 0, 256, 256); ctx.drawImage(image, index % 4 * 256, Math.floor(index / 4) * 256, 256, 256, 0, 0, 256, 256);
        const bytes = ctx.getImageData(0, 0, 256, 256).data;
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        let opaque = 0, transparent = 0, borderAlpha = 0;
        for (let pixel = 0; pixel < bytes.length; pixel += 4) {
          const alpha = bytes[pixel + 3], at = pixel / 4, x = at % 256, y = Math.floor(at / 256);
          if (alpha) opaque++; else transparent++;
          if (x === 0 || x === 255 || y === 0 || y === 255) borderAlpha = Math.max(borderAlpha, alpha);
        }
        cells.push({index, sha256: Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join(''),
          opaque, transparent, borderAlpha});
      }
      return {...source, cells};
    });
    assert.equal(atlas.width, 1024); assert.equal(atlas.height, 1024);
    assert.equal(new Set(atlas.cells.map(cell => cell.sha256)).size, 16, 'Repeated source cells');
    for (const cell of atlas.cells) { assert.ok(cell.opaque > 500); assert.ok(cell.transparent > 500); assert.equal(cell.borderAlpha, 0); }
    report.atlasCellAudit = atlas; return atlas;
  });
  let targetId, pauseChecked = false, firstFireSeen = false, damaged = false, destroyed = false;
  const enemies = new Map(), shotSerials = new Set(), firedAt = new Map();
  let previousSample = 0, lastVerticalAt=-Infinity, observedHudDamageEvents=0,
    box = await page.locator('#canvas').boundingBox();
  await step(values.combat
    ? 'a natural interceptor flanks, announces an attack, freezes on pause and can be shot down'
    : 'a natural interceptor flanks, announces an attack, fires a real projectile and freezes on pause', async () => {
    const began = Date.now();
    while (Date.now() - began < timeout) {
      const q = await inspect(); healthy(q);
      if(q.damageEvents.length>observedHudDamageEvents) {
        checkHudScoreTarget(q,q.damageEvents.at(-1).destroyed?'natural CH-02 destruction':'natural CH-02 damage');
        observedHudDamageEvents=q.damageEvents.length;
      }
      if(values.combat&&!destroyed)assert.equal(q.atlasActive,false,
        'Focused combat scope ended: Atlas replaced the patrol before natural CH-02 destruction was observed');
      const interceptors = q.items.filter(item => item.classicScout?.role === 'interceptor');
      for (const enemy of interceptors) {
        let record = enemies.get(enemy.id);
        if (!record) {
          record = {id: enemy.id, firstElapsed: q.elapsed, initialHp: enemy.hp, minimumX: enemy.x,
            maximumX: enemy.x, fired: 0, states: [], animationStates: [], frames: [], hp: []};
          enemies.set(enemy.id, record); report.interceptors.push(record);
          targetId ??= enemy.id;
        }
        record.minimumX = Math.min(record.minimumX, enemy.x); record.maximumX = Math.max(record.maximumX, enemy.x);
        record.fired = Math.max(record.fired, enemy.classicScout.fired);
        if (!record.states.includes(enemy.classicScout.state)) record.states.push(enemy.classicScout.state);
        if (!record.animationStates.includes(enemy.classicScout.frame.state)) record.animationStates.push(enemy.classicScout.frame.state);
        if (!record.frames.includes(enemy.classicScout.frame.frameIndex)) record.frames.push(enemy.classicScout.frame.frameIndex);
        if (record.hp.at(-1) !== enemy.hp) record.hp.push(enemy.hp);
        assert.equal(enemy.classicScout.tacticsVersion, 'classic-pursuit-v1');
        assert.equal(enemy.classicScout.frame.image, 'assets/ch02_interceptor_atlas_v1.webp');
        assert.ok(enemy.classicScout.fired <= 2, 'An interceptor exceeded its finite attack budget');
      }
      let target = interceptors.find(enemy => enemy.id === targetId);
      if (!target && targetId && !destroyed && q.destruction.some(effect => effect.frame.image === 'assets/ch02_interceptor_atlas_v1.webp')) {
        destroyed = true; await capture('ch02-authentic-destruction', q); report.destructionAt = q;
      }
      // If an unharmed target flew out before firing alignment, pursue the next
      // naturally scheduled unit. No respawn, health reset or entity insertion.
      if (!target && !destroyed && targetId && !q.destruction.length) targetId = interceptors[0]?.id;
      target = interceptors.find(enemy => enemy.id === targetId);
      if (target) {
        await capture('ch02-natural-spawn', q);
        if (target.classicScout.state === 'charge') {
          await capture('ch02-target-lock', q);
          if (!pauseChecked) {
            await page.locator('#pause').click(); const before = await inspect();
            await page.waitForTimeout(650); const after = await inspect();
            assert.equal(after.elapsed, before.elapsed); assert.deepEqual(after.items, before.items);
            assert.deepEqual(after.weapons, before.weapons); assert.deepEqual(after.destruction, before.destruction);
            report.pause = {before, after, unchanged: true};
            await page.locator('#resume').click(); pauseChecked = true; continue;
          }
        }
        if (target.classicScout.fired > 0) { firstFireSeen = true; await capture('ch02-real-attack-projectile', q); }
        if (target.hp < target.maxHp) { damaged = true; await capture('ch02-player-inflicted-damage', q); }
      }
      for (const projectile of q.items.filter(item => item.classicScoutProjectile && item.role === 'interceptor')) {
        shotSerials.add(`${projectile.attackSerial}:${projectile.x.toFixed(3)}:${projectile.y.toFixed(3)}`);
      }
      if (Date.now() - previousSample >= 250) {
        report.samples.push({wallMs: Date.now() - began, elapsed: q.elapsed, hull: q.hull, collected: q.collected,
          score: q.score,hudScoreTarget:q.hudScoreTarget,displayedScore:q.displayedScore,hudScoreText:q.hudScoreText,
          weapons: q.weapons, target, destruction: q.destruction,
          hostileProjectiles: q.items.filter(item => item.classicScoutProjectile), draws: q.observer.draws});
        previousSample = Date.now();
        if(report.samples.length%8===0)await save();
      }
      if (destroyed || (!values.combat && firstFireSeen && shotSerials.size > 0 && pauseChecked &&
          report.interceptors.some(enemy => enemy.maximumX - enemy.minimumX > 35))) break;
      if(values['close-range']&&target&&target.y>=90&&q.elapsed-lastVerticalAt>=.08) {
        const desiredY=Math.max(q.bounds.minY,Math.min(q.bounds.maxY,target.y+375));
        const delta=desiredY-q.player.targetY;
        if(Math.abs(delta)>42.5) {
          const key=delta<0?'ArrowUp':'ArrowDown';
          const expected=Math.max(q.bounds.minY,Math.min(q.bounds.maxY,q.player.targetY+(delta<0?-85:85)));
          await page.keyboard.press(key);const after=await inspect();
          assert.ok(Math.abs(after.player.targetY-expected)<1e-6,'Each real vertical keydown must move targetY by its shipped 85-pixel step');
          report.verticalActions.push({key,at:q.elapsed,targetId:target.id,enemyY:target.y,desiredY,
            beforeTargetY:q.player.targetY,afterTargetY:after.player.targetY,shipY:q.player.y,
            separation:q.player.y-target.y});
          lastVerticalAt=q.elapsed;
          // Obtain a fresh position after this actual input instead of aiming
          // with the pre-key snapshot. No key is held as a velocity control.
          await page.waitForTimeout(35);continue;
        }
      }
      const committedTarget=target&&(target.classicScout.state==='charge'||target.classicScout.fired>0||target.hp<target.maxHp)
        ?target:null;
      const destination = pilotTarget(q, committedTarget, !target);
      await page.mouse.move(box.x + destination * box.width / q.W, box.y + box.height * .72);
      const previousShot = firedAt.get(targetId) ?? -Infinity;
      const safeToShoot = target && firstFireSeen && target.y < q.player.y - 180 &&
        Math.abs(q.player.x - destination) < 26 && Math.abs(destination - target.x) < 135 &&
        q.weapons.charges > 0 && q.weapons.cooldown <= 0 && q.elapsed - previousShot > .32;
      if (values.combat && safeToShoot) {
        await page.keyboard.press('Space'); const after = await inspect();
        assert.equal(after.weapons.shotSequence, q.weapons.shotSequence + 1, 'Discrete fire emitted exactly one accepted shot');
        report.actions.push({action: 'Space', atElapsed: q.elapsed, enemyId: targetId,
          targetHp: target.hp, shipX: q.player.x, targetX: target.x, aimX: destination,
          selected: q.weapons.selected, beforeSequence: q.weapons.shotSequence, afterSequence: after.weapons.shotSequence});
        firedAt.set(targetId, q.elapsed);
      }
      await page.waitForTimeout(35);
    }
    assert.ok(report.interceptors.length > 0, 'No naturally scheduled CH-02 appeared');
    assert.ok(report.interceptors[0].firstElapsed < 20, 'CH-02 must appear in the opening Gaia patrol sequence');
    assert.ok(report.interceptors.some(enemy => enemy.maximumX - enemy.minimumX > 35), 'No observable flank movement');
    assert.ok(firstFireSeen, 'No natural interceptor attack fired'); assert.ok(shotSerials.size > 0, 'No real interceptor projectile observed');
    assert.equal(pauseChecked, true, 'No live target-lock pause was checked');
    if(values.combat) {
      assert.equal(damaged, true, 'No player-inflicted damage observed');
      assert.equal(destroyed, true, `The natural QA pilot did not destroy CH-02 within ${timeout} ms`);
    }
    report.naturalCombat = {destroyed, damaged, firstFireSeen, pauseChecked, realFireInputs: report.actions.length,
      elapsed: (await inspect()).elapsed, hostileProjectileSamples: shotSerials.size,
      enemyShotsEmitted:report.interceptors.reduce((sum,enemy)=>sum+enemy.fired,0),
      verticalInputs:report.verticalActions.length};
    if(values['close-range'])assert.ok(report.verticalActions.length>0,'Close-range scope must exercise actual vertical control');
    return report.naturalCombat;
  });
  await step(values.combat
    ? 'the produced destruction finishes once, the dead hitbox is removed and unlocked Twin still works'
    : 'actual gameplay uses distinct CH-02 animation cells and unlocked Twin still works', async () => {
    const before = await inspect(), destroyedId = targetId;
    await page.waitForTimeout(1200); const after = await inspect();
    const hudBefore=checkHudScoreTarget(before,'entry to the post-combat live window');
    const hudAfter=checkHudScoreTarget(after,'1200 ms of unpaused post-combat play');
    report.hudConvergence={waitWallMs:1200,paused:false,simulationSeconds:after.elapsed-before.elapsed,
      scoreStable:after.score===before.score,before:hudBefore,after:hudAfter,
      textConverged:Number(after.hudScoreText)===after.score};
    if(after.score===before.score) {
      assert.equal(Number(after.hudScoreText),after.score,'HUD text must converge during a stable-score live window');
      report.hudConvergence.verified=true;
    } else {
      report.hudConvergence.verified=false;
      report.hudConvergence.limit='Natural score changed during the live window; target equality was checked, stable-score text convergence was not claimed.';
    }
    if(values.combat) {
      assert.equal(after.items.some(item => item.id === destroyedId), false, 'Dead interceptor still has a gameplay hitbox');
      assert.equal(after.destruction.some(effect => effect.frame.image === 'assets/ch02_interceptor_atlas_v1.webp'), false,
        'Completed destruction visual leaked');
      const beforeHits=before.damageEvents.filter(event=>event.targetId===destroyedId);
      const afterHits=after.damageEvents.filter(event=>event.targetId===destroyedId);
      assert.deepEqual(afterHits,beforeHits,'Repeating destruction frames duplicated a hit or reward');
      const deaths=afterHits.filter(event=>event.destroyed);
      assert.equal(deaths.length,1,'Destroyed CH-02 must award exactly one death reward');
      assert.equal(deaths[0].reward,10,'CH-02 death reward must match the shipped ten-point rule');
      report.uniqueDeathReward={targetId:destroyedId,deaths,hits:afterHits,duplicateAfterAnimation:false};
    }
    // Read the actual score but do not assert a total which unrelated natural
    // pickups/impacts can legitimately change during these real-time frames.
    report.postDestruction = {beforeScore: before.score, afterScore: after.score,
      enemyAbsent:!after.items.some(item=>item.id===destroyedId),
      effectFinished:!after.destruction.some(effect=>effect.frame.image==='assets/ch02_interceptor_atlas_v1.webp'),
      verified:values.combat};
    assert.ok(Object.keys(after.observer.draws).length >= (values.combat?8:4),
      'Too few distinct CH-02 source cells were actually drawn during gameplay');
    for (const rectangle of Object.keys(after.observer.draws)) {
      const [x, y, width, height] = rectangle.split(',').map(Number);
      assert.equal(width, 256); assert.equal(height, 256);
      assert.ok(x >= 0 && x <= 768 && x % 256 === 0 && y >= 0 && y <= 768 && y % 256 === 0);
    }
    await page.locator('#flightWeapon').click(); let switched = await inspect();
    assert.equal(switched.weapons.selected,after.weapons.selected==='twin'?'pulse':'twin');
    assert.equal(switched.weapons.charges, after.weapons.charges, 'Switching equipment granted battery charge');
    if(switched.weapons.selected!=='twin') {
      await page.locator('#flightWeapon').click();const restored=await inspect();
      assert.equal(restored.weapons.selected,'twin');
      assert.equal(restored.weapons.charges,switched.weapons.charges,'Restoring Twin granted battery charge');
      switched=restored;
    }
    await capture('gaia-after-ch02-twin-selected', switched); report.final = switched;
    return report.postDestruction;
  });
  for (const [file, entry] of Object.entries(report.packageFiles)) {
    assert.equal(sha256(await fs.readFile(path.join(root, file))), entry.sha256, `Distributed ${file} changed during QA`);
  }
  report.status = 'passed'; report.exitCode = 0;
})().catch(async error => {
  report.status = 'failed'; report.exitCode = 1; report.error = errorText(error); process.exitCode = 1;
  if (page) {
    report.failureSnapshot = await inspect().catch(error => ({inspectionError: errorText(error)}));
    if (evidenceReady) await page.screenshot({path: path.join(output, 'failure.png')}).catch(() => {});
  }
}).finally(async () => {
  await browser?.close(); await server?.close(); report.durationMs = Date.now() - started;
  if (evidenceReady) await save();
  console.log(JSON.stringify({status: report.status, exitCode: report.exitCode,
    cases: report.cases.map(entry => ({name: entry.name, status: entry.status})), output, error: report.error}));
});
