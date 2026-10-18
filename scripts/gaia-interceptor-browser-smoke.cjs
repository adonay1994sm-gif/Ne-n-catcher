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
  'equip-twin': {type: 'boolean', default: false}, 'close-range': {type: 'boolean', default: false},
  'legacy-lance':{type:'boolean',default:false},'observe-engagement':{type:'boolean',default:false},
  'perf-only':{type:'boolean',default:false}}});
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output || `/tmp/gaia-interceptor-${Date.now()}`);
const timeout = Number(values.timeout || 600000);
assert.ok(Number.isFinite(timeout) && timeout >= 30000 && timeout <= 1200000, 'Timeout must be 30000–1200000 ms');
assert.ok(!(values.combat&&values['observe-engagement']),'Choose combat or observation of the complete attack/retreat policy');
const legacyEquipment=values['equip-twin']||values['legacy-lance'];
const equipment = legacyEquipment
  ?{version:1,selected:'pulse',unlocked:values['legacy-lance']?['pulse','twin','lance']:['pulse','twin'],recoveredTwin:true,...(values['legacy-lance']?{lanceCalibrated:true}:{})}
  :{version:1,selected:'pulse',unlocked:['pulse'],recoveredTwin:true,twinPrepared:true};
const report = {status: 'running', exitCode: null, startedAt: new Date().toISOString(), command: process.argv,
  sourceRoot: root, browser: 'Real Chromium, 390x844, DPR 1',
  pilotVersion: values['close-range']?'natural-gaia-ch02-observed-close-range-v4':'natural-gaia-ch02-observed-ballistics-v4',
  cases: [], errors: [], consoleErrors: [], failedRequests: [],
  screenshots: [], samples: [], interceptors: [], actions: [],
  fixtures: {unlocked: 2, equipment}, combatRequired: values.combat, equipTwinViaUI:values['equip-twin'],
  closeRange:values['close-range'], verticalActions:[],hudSnapshots:[],
  loadoutProfile:legacyEquipment?'historical-owned-equipment':'fresh-C9-prepared-Pulse',
  observeEngagement:values['observe-engagement'],perfOnly:values['perf-only'],
  limits: ['Only level 2 unlock and the explicitly recorded equipment profile are seeded; historical Twin/Lance ownership is a compatibility fixture, not a fresh reward.',
    'Patrol scheduling, enemy health, spawning, elapsed time, weapon projectiles and collisions are never changed.',
    'The pointer pilot leads only currently observed enemy positions/velocity and avoids already emitted ballistic projectiles; hidden future AI targets are never consulted.',
    'The automatic QA pilot uses real pointer and keyboard controls; this is not a human playtest.',
    'Read-only closure diagnostics and native Canvas/RAF observers are injected into a local response; package files are unchanged.',
    'All sixteen source cells are checked for distinct decoded pixels; actual gameplay draw counts are reported separately.',
    'A successful focused patrol does not certify the entire Gaia mission, aesthetic acceptance, Safari or physical iPhone.']};
let server, browser, context, page, evidenceReady = false;
const started = Date.now();
const save = () => saveEvidence(output, report);
const inspect = () => page.evaluate(perfOnly => ({...window.__INTERCEPTOR_QA__(), observer: {
  maximum: window.__INTERCEPTOR_OBSERVER__.maximum, frames: window.__INTERCEPTOR_OBSERVER__.frames,
  errors: [...window.__INTERCEPTOR_OBSERVER__.errors], draws: {...window.__INTERCEPTOR_OBSERVER__.draws},
  visualDraws:[...window.__INTERCEPTOR_OBSERVER__.visualDraws],
  frameTimes:perfOnly?[...window.__INTERCEPTOR_OBSERVER__.frameTimes]:undefined
}}),values['perf-only']);
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
  // This is a QA aim estimate from the last visible position and current
  // velocity only. Do not simulate hidden targetX/side/state-machine decisions
  // or the player's future inputs to manufacture a successful natural hit.
  const observedVx = enemy?.classicScout?.vx || 0;
  const lead = enemy ? enemy.x + Math.max(-100, Math.min(100, observedVx * travel * .75)) : null;
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
  for (const relative of ['game.js', 'content-runtime.js', 'assets/ch02_interceptor_atlas_v1.webp',
    ...(!values['perf-only']?['assets/gaia_pulse_atlas_v3.webp','assets/hostile_ordnance_atlas_v1.webp']:[])]) {
    const file = nested ? `juego/${relative}` : relative;
    const bytes = await fs.readFile(path.join(root, file));
    report.packageFiles[file] = {bytes: bytes.length, sha256: sha256(bytes)};
  }
  server = await startStaticServer(root);
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
  context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, serviceWorkers: 'block'});
  await context.addInitScript(({prefix, equipment, perfOnly}) => {
    const url = new URL(location.href);
    if (url.pathname.endsWith('/juego/index.html') || url.pathname.endsWith('/juego/')) {
      if (localStorage.getItem(prefix + 'neon-unlocked-v2') === null) localStorage.setItem(prefix + 'neon-unlocked-v2', '2');
      if (localStorage.getItem(prefix + 'neonCatcher.flightEquipment.v1') === null) {
        localStorage.setItem(prefix + 'neonCatcher.flightEquipment.v1', JSON.stringify(equipment));
      }
    }
    const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
    const observer = window.__INTERCEPTOR_OBSERVER__ = {maximum: 0, frames: 0, pending: new Set(), errors: [], draws: {},visualDraws:[],frameTimes:[]};
    window.requestAnimationFrame = callback => {
      const id = request(now => {
        observer.pending.delete(id); observer.frames++;
        if(perfOnly){observer.frameTimes.push(now);if(observer.frameTimes.length>2400)observer.frameTimes.shift();}
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
      if(this.canvas.id==='canvas'&&/atlas_combat_vfx|hostile_ordnance|hostile_projectiles|gaia_pulse|arcade_pulse|smoke/i.test(source)) {
        const matrix=this.getTransform();
        observer.visualDraws.push({frame:observer.frames,source,rect:args.length===9?args.slice(1,5):null,
          destination:args.length===9?args.slice(5):args.slice(1),alpha:this.globalAlpha,
          transform:{a:matrix.a,b:matrix.b,c:matrix.c,d:matrix.d,e:matrix.e,f:matrix.f}});
        if(observer.visualDraws.length>160)observer.visualDraws.shift();
      }
      return draw.apply(this, args);
    };
  }, {prefix, equipment, perfOnly:values['perf-only']});
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
      settingsAutoFire:settings.autoFire,
      powers:{...powers},particleTypes:typeof particles!=='undefined'&&Array.isArray(particles)?
        [...new Set(particles.map(part=>part.kind))]:null,
      player:{x:player.x,y:player.y,target:player.target,targetY:player.targetY},
      bounds:classicFlightBounds?{...classicFlightBounds}:null,
      equipment:JSON.parse(JSON.stringify(classicEquipment)),
      salvage:typeof classicSalvageLedger!=="undefined"?classicSalvageLedger?.getState():null,
      weapons:classicWeapons?{...NeonCampaign.classicWeaponSnapshot(classicWeapons),shotSequence:classicWeapons.shotSequence}:null,
      atlas:{ready:spriteReady(SPRITES.ch02),width:SPRITES.ch02.naturalWidth,height:SPRITES.ch02.naturalHeight,source:SPRITES.ch02.currentSrc||SPRITES.ch02.src},
      items:items.map(item=>({id:item.id,type:item.type,x:item.x,y:item.y,s:item.s,r:item.r,hp:item.hp,maxHp:item.maxHp,
        rot:item.rot,rs:item.rs,vx:item.vx,vy:item.vy,circles:collisionCircles(item),
        salvageDropId:item.salvageDropId,salvagePickup:!!item.salvagePickup,dropId:item.dropId,enemyType:item.enemyType,amount:item.amount,
        classicScoutProjectile:Boolean(item.classicScoutProjectile),attackSerial:item.attackSerial,role:item.role,
        classicScout:item.classicScout?{tacticsVersion:item.classicScout.tacticsVersion,role:item.classicScout.role,
          state:item.classicScout.state,stateAge:item.classicScout.stateAge,age:item.classicScout.age,
          vx:item.classicScout.vx,targetX:item.classicScout.targetX,side:item.classicScout.side,
          holdY:item.classicScout.holdY,combatStartedAt:item.classicScout.combatStartedAt,
          combatMinX:item.classicScout.combatMinX,combatMaxX:item.classicScout.combatMaxX,
          retreatReason:item.classicScout.retreatReason,repositionCount:item.classicScout.repositionCount,
          firedSerial:item.classicScout.firedSerial,
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
    assert.equal(q.equipment.selected, 'pulse');
    assert.deepEqual(q.equipment.unlocked,equipment.unlocked,'Current normalization must preserve legitimate ownership without granting fresh upgrades');
    assert.equal(q.settingsAutoFire,false,'New profiles must start with manual fire');
    if(!values['perf-only']) {
      assert.equal(q.weapons.charges,20);
      assert.equal(await page.locator('#ammo').isVisible(),false,'No numeric charge/reload counter in the flight controls');
    }
    if(!legacyEquipment)assert.equal(q.equipment.twinPrepared,true);
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
  if(values['perf-only']) {
    await step('measure a fixed12-second natural Gaia RAF window with identical idle/manual controls',async()=>{
      await page.waitForFunction(()=>__INTERCEPTOR_QA__().state==='playing'&&__INTERCEPTOR_QA__().elapsed>=3,
        null,{polling:100,timeout:120000});
      const box=await page.locator('#canvas').boundingBox(),initial=await inspect();
      await page.mouse.move(box.x+box.width*.5,box.y+box.height*.72);
      const before=await inspect(),wallStart=Date.now();
      await page.waitForTimeout(12000);
      const after=await inspect(),wallMs=Date.now()-wallStart;
      assert.equal(before.state,'playing');assert.equal(after.state,'playing');
      assert.equal(after.currentLevel,1);assert.equal(after.settingsAutoFire,false);
      const start=before.observer.frameTimes.at(-1);
      const times=after.observer.frameTimes.filter(now=>now>=start);
      const gaps=times.slice(1).map((now,index)=>now-times[index]);
      assert.ok(gaps.length>=5,'Too few actual RAF callbacks to measure frame pacing');
      const sorted=[...gaps].sort((a,b)=>a-b),pct=p=>sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))];
      const heap=await page.evaluate(()=>performance.memory?{used:performance.memory.usedJSHeapSize,
        total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit}:null);
      report.performance={measurement:'Real Chromium existing-RAF callback pacing; software host, no iPhone/GPU/60FPS certification',
        controls:'Idle ship at centre; manual firing stays OFF, no shot/timer/entity mutations',
        wallMs,frames:after.observer.frames-before.observer.frames,
        callbacksPerWallSecond:(after.observer.frames-before.observer.frames)/(wallMs/1000),
        medianFrameMs:pct(.5),p95FrameMs:pct(.95),p99FrameMs:pct(.99),maxFrameMs:sorted.at(-1),
        gapsOver50Ms:gaps.filter(gap=>gap>50).length,rawFrameGapsMs:gaps,
        simulatedSeconds:after.elapsed-before.elapsed,
        gameSecondsPerWallSecond:(after.elapsed-before.elapsed)/(wallMs/1000),heapBytes:heap,
        before:{elapsed:before.elapsed,hull:before.hull,entities:before.items.length,
          energy:before.items.filter(item=>item.type==='energy').length,weapon:before.weapons.selected,charges:before.weapons.charges},
        after:{elapsed:after.elapsed,hull:after.hull,entities:after.items.length,
          energy:after.items.filter(item=>item.type==='energy').length,weapon:after.weapons.selected,charges:after.weapons.charges},
        warmup:{elapsed:initial.elapsed,entities:initial.items.length}};
      await capture('gaia-natural-performance-window',after);return report.performance;
    });
    report.status='passed';report.exitCode=0;return;
  }
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
    ? 'a natural interceptor flanks, deploys its cannon, freezes on pause and can be shot down'
    : 'a natural interceptor flanks, deploys its cannon, fires a ballistic projectile and freezes on pause', async () => {
    const began = Date.now();
    while (Date.now() - began < timeout) {
      const q = await inspect(); healthy(q);
      report.healthVisualObservations??=[];
      const healthBand=q.hull<67?'below-67':'at-least-67';
      if(!report.healthVisualObservations.some(sample=>sample.band===healthBand)) {
        report.healthVisualObservations.push({band:healthBand,hull:q.hull,elapsed:q.elapsed,powers:q.powers,
          particleTypes:q.particleTypes,smokeDraws:q.observer.visualDraws.filter(draw=>/smoke/i.test(draw.source))});
        await capture(`ship-effects-${healthBand}`,q);
      }
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
            maximumX: enemy.x, fired: 0, states: [], animationStates: [], frames: [], hp: [],
            holdSamples:[],retreatReason:null,salvageDropId:enemy.salvageDropId};
          enemies.set(enemy.id, record); report.interceptors.push(record);
          targetId ??= enemy.id;
        }
        record.minimumX = Math.min(record.minimumX, enemy.x); record.maximumX = Math.max(record.maximumX, enemy.x);
        record.fired = Math.max(record.fired, enemy.classicScout.fired);
        if (!record.states.includes(enemy.classicScout.state)) record.states.push(enemy.classicScout.state);
        if (!record.animationStates.includes(enemy.classicScout.frame.state)) record.animationStates.push(enemy.classicScout.frame.state);
        if (!record.frames.includes(enemy.classicScout.frame.frameIndex)) record.frames.push(enemy.classicScout.frame.frameIndex);
        if (record.hp.at(-1) !== enemy.hp) record.hp.push(enemy.hp);
        assert.equal(enemy.classicScout.tacticsVersion, 'classic-pursuit-v3');
        assert.equal(enemy.classicScout.frame.image, 'assets/ch02_interceptor_atlas_v1.webp');
        assert.ok(enemy.classicScout.fired <= 10, 'An interceptor exceeded its finite pursuit-v3 attack budget');
        assert.ok(enemy.classicScout.firedSerial<=enemy.classicScout.chargeSerial,'A projectile cannot precede its mechanical cannon-deployment state');
        if(enemy.classicScout.combatStartedAt!==null&&enemy.classicScout.state!=='retreat') {
          record.holdSamples.push({age:enemy.classicScout.age,y:enemy.y,speed:enemy.s,holdY:enemy.classicScout.holdY});
          if(record.holdSamples.length>160)record.holdSamples.shift();
        }
        if(enemy.classicScout.state==='retreat') {
          assert.ok(['time-limit','attack-budget'].includes(enemy.classicScout.retreatReason));
          record.retreatReason=enemy.classicScout.retreatReason;
          record.retreatAt=enemy.classicScout.age;
        }
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
          await capture('ch02-mechanical-cannon-deployment', q);
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
          report.interceptors.some(enemy => enemy.maximumX - enemy.minimumX > 35)&&
          (!values['observe-engagement']||report.interceptors.some(enemy=>enemy.fired>=4&&enemy.retreatReason)))) break;
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
        const oldIds=new Set(q.weapons.projectiles.map(shot=>shot.id));
        const emitted=after.weapons.projectiles.filter(shot=>!oldIds.has(shot.id));
        if(emitted.length===(q.weapons.selected==='twin'?2:1)) {
          for(const shot of emitted){assert.ok(Math.abs(shot.vx)<1e-8);assert.ok(shot.vy<0);}
          if(emitted.length===2){assert.ok(Math.abs(Math.abs(emitted[0].x-emitted[1].x)-20)<1e-6);assert.ok(Math.abs(emitted[0].y-emitted[1].y)<1e-6);}
          report.weaponGeometry??=[];report.weaponGeometry.push({at:after.elapsed,weapon:q.weapons.selected,
            projectiles:emitted,actualDraws:after.observer.visualDraws.filter(draw=>/atlas_combat_vfx|hostile_ordnance|hostile_projectiles|gaia_pulse/.test(draw.source))});
        }
        firedAt.set(targetId, q.elapsed);
      }
      await page.waitForTimeout(35);
    }
    assert.ok(report.interceptors.length > 0, 'No naturally scheduled CH-02 appeared');
    assert.ok(report.interceptors[0].firstElapsed < 20, 'CH-02 must appear in the opening Gaia patrol sequence');
    assert.ok(report.interceptors.some(enemy => enemy.maximumX - enemy.minimumX > 35), 'No observable flank movement');
    assert.ok(firstFireSeen, 'No natural interceptor attack fired'); assert.ok(shotSerials.size > 0, 'No real interceptor projectile observed');
    assert.equal(pauseChecked, true, 'No live cannon-deployment pause was checked');
    if(values.combat) {
      assert.equal(damaged, true, 'No player-inflicted damage observed');
      assert.equal(destroyed, true, `The natural QA pilot did not destroy CH-02 within ${timeout} ms`);
    }
    if(values['observe-engagement']) {
      const full=report.interceptors.find(enemy=>enemy.fired>=4&&enemy.retreatReason);
      assert.ok(full,'Observe at least four real attacks and a finite, reasoned retreat');
      assert.ok(full.retreatAt<34,'The encounter must respect its 24-second combat policy plus finite arrival');
      assert.ok(full.holdSamples.at(-1).age-full.holdSamples[0].age>=3,'The enemy must remain in active combat instead of flying through');
      report.engagementObservation=full;
    }
    report.naturalCombat = {destroyed, damaged, firstFireSeen, pauseChecked, realFireInputs: report.actions.length,
      elapsed: (await inspect()).elapsed, hostileProjectileSamples: shotSerials.size,
      enemyShotsEmitted:report.interceptors.reduce((sum,enemy)=>sum+enemy.fired,0),
      verticalInputs:report.verticalActions.length};
    if(values['close-range'])assert.ok(report.verticalActions.length>0,'Close-range scope must exercise actual vertical control');
    return report.naturalCombat;
  });
  await step(values.combat
    ? 'the produced destruction finishes once, the dead hitbox is removed and recorded weapon ownership remains usable'
    : 'actual gameplay uses distinct CH-02 animation cells and recorded weapon ownership remains usable', async () => {
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
      const dropId=enemies.get(destroyedId)?.salvageDropId;assert.ok(dropId,'Enemy needs a stable salvage identity');
      const pickups=[...before.items,...after.items].filter(item=>item.salvagePickup&&item.dropId===dropId);
      const receipts=(after.salvage?.activeRun?.claimed||[]).filter(receipt=>receipt.id===dropId);
      assert.ok(pickups.length>0||receipts.length>0,'A real CH-02 death must leave recoverable salvage or its collected receipt');
      assert.ok(pickups.every(item=>item.amount===15&&item.enemyType==='interceptor'));
      assert.ok(receipts.length<=1,'Repeating death animation must not duplicate a salvage receipt');
      assert.ok(receipts.every(receipt=>receipt.amount===15&&receipt.enemyType==='interceptor'));
      if(after.salvage)assert.equal(after.salvage.balance,after.salvage.earned-after.salvage.spent);
      report.uniqueSalvageDrop={dropId,amount:15,pickups,receipts,
        collected:receipts.length===1,limit:receipts.length?'Real collection observed':'World pickup observed; this focused test does not claim collection'};
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
    const ownership=after.equipment.unlocked;
    assert.equal(switched.weapons.selected,ownership[(ownership.indexOf(after.weapons.selected)+1)%ownership.length]);
    assert.equal(switched.weapons.charges, after.weapons.charges, 'Switching equipment granted battery charge');
    if(ownership.includes('twin')) {
      for(let attempt=0;switched.weapons.selected!=='twin'&&attempt<ownership.length;attempt++) {
        await page.locator('#flightWeapon').click();const restored=await inspect();
        assert.equal(restored.weapons.charges,switched.weapons.charges,'Switching historical equipment granted a charge');
        switched=restored;
      }
      assert.equal(switched.weapons.selected,'twin');
    } else {
      assert.equal(switched.weapons.selected,'pulse');assert.deepEqual(switched.equipment.unlocked,['pulse'],
        'A patrol victory must not grant the Atlas-only reward');
    }
    await capture(ownership.includes('twin')?'gaia-legacy-twin-preserved':'gaia-fresh-pulse-retained', switched); report.final = switched;
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
  if(report.packageFiles)for(const [file,entry]of Object.entries(report.packageFiles)){
    try{assert.equal(sha256(await fs.readFile(path.join(root,file))),entry.sha256,`Package changed during QA: ${file}`);}
    catch(error){report.status='failed';report.exitCode=1;process.exitCode=1;report.error??=errorText(error);report.packageChangedDuringRun=true;}
  }
  await browser?.close(); await server?.close(); report.durationMs = Date.now() - started;
  if (evidenceReady) await save();
  console.log(JSON.stringify({status: report.status, exitCode: report.exitCode,
    cases: report.cases.map(entry => ({name: entry.name, status: entry.status})), output, error: report.error}));
});
