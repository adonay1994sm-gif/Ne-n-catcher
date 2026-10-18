import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

const repository = new URL('..', import.meta.url);
const [html, core, content, game] = await Promise.all(
  ['index.html', 'core-runtime.js', 'content-runtime.js', 'game.js']
    .map(file => readFile(new URL(file, repository), 'utf8'))
);
const EQUIPMENT_KEY = 'neonCatcher.flightEquipment.v1';
const VOYAGE_KEY = 'neonCatcher.chronosVoyage.v2';
const DESTRUCTION_PATH = 'assets/chronos_destruction_atlas_v1.webp';
const FLIGHT_KIT_PATH = 'assets/chronos_flight_atlas_v1.webp';
const plain = value => JSON.parse(JSON.stringify(value));
const closeTo = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-7,
  `${message || 'Values differ'}: ${actual} !== ${expected}`);

/**
 * Controlled JSDOM integration fixture. It runs the actual bundled legacy
 * handlers/models, with a mocked Canvas and loaded images. Explicit collection,
 * target insertion and quiet frames isolate contracts; this is not natural
 * gameplay, a visual acceptance test or a physical iPhone certification.
 */
function harness(t, {campaign = '', saved, backups, pointerEvents = true, failBackup = false,
  destructionAsset = 'loaded', rects = {}, unlocked = 2, savedVoyage} = {}) {
  const dom = new JSDOM(html, {url: `https://neon.test/${campaign ? '?campaign=' + campaign : ''}`,
    runScripts: 'outside-only', pretendToBeVisual: true});
  const {window} = dom; t.after(() => window.close());
  const gradient = {addColorStop() {}};
  const drawCalls = [];
  const context = new Proxy({}, {get(target, key) {
    if (key in target) return target[key];
    if (key === 'drawImage') return (image, ...args) => drawCalls.push({path: image?._assetPath || image?.path || null, args});
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
    if (key === 'measureText') return () => ({width: 30});
    return () => {};
  }, set(target, key, value) { target[key] = value; return true; }});
  window.HTMLCanvasElement.prototype.getContext = () => context;
  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
  // JSDOM has no layout engine. These optional measured-rectangle fixtures
  // exercise the real UI-to-Canvas boundary adapter, not CSS appearance.
  const layoutRects = new Map(Object.entries(rects));
  const rectReadCounts = new Map();
  const rectangle = ({left = 0, top = 0, width = 0, height = 0} = {}) => ({
    x: left, y: top, left, top, width, height, right: left + width, bottom: top + height});
  const originalRect = window.Element.prototype.getBoundingClientRect;
  window.Element.prototype.getBoundingClientRect = function() {
    rectReadCounts.set(this.id, (rectReadCounts.get(this.id) || 0) + 1);
    if (this.closest('.hidden')) return rectangle();
    if (!layoutRects.has(this.id)) return originalRect.call(this);
    const fixture = layoutRects.get(this.id);
    return rectangle(typeof fixture === 'function' ? fixture(this) : fixture);
  };
  window.HTMLCanvasElement.prototype.getBoundingClientRect = function() {
    return rectangle(layoutRects.get(this.id) || {width: 390, height: 844});
  };
  window.HTMLCanvasElement.prototype.setPointerCapture = () => {};
  window.HTMLCanvasElement.prototype.releasePointerCapture = () => {};
  const images = new Map();
  function configureDestructionImage(image, status) {
    image.complete = status !== 'unresolved';
    image.naturalWidth = status === 'loaded' ? 1536 : 0;
    image.naturalHeight = status === 'loaded' ? 1024 : 0;
    if (status === 'error') image.onerror?.(new window.Event('error'));
  }
  window.Image = class {
    constructor() { this.complete = true; this.naturalWidth = this.naturalHeight = 1536; }
    get src() { return this.path || ''; }
    set src(value) {
      this.path = value; images.set(value, this);
      if (value === DESTRUCTION_PATH) configureDestructionImage(this, destructionAsset);
      if (value === FLIGHT_KIT_PATH) { this.naturalWidth = 1536; this.naturalHeight = 1024; }
    }
  };
  const pending = new Map(); let id = 0;
  window.requestAnimationFrame = callback => (pending.set(++id, callback), id);
  window.cancelAnimationFrame = frame => pending.delete(frame);
  window.navigator.vibrate = () => true;
  if (pointerEvents) {
    window.PointerEvent = class extends window.MouseEvent {
      constructor(type, options = {}) {
        super(type, options);
        for (const [key, value] of Object.entries({pointerId: options.pointerId ?? 1,
          pointerType: options.pointerType || 'touch', isPrimary: options.isPrimary ?? true})) {
          Object.defineProperty(this, key, {value});
        }
      }
    };
  } else window.PointerEvent = undefined;
  window.localStorage.setItem('neon-unlocked-v2', String(unlocked));
  window.localStorage.setItem('neon-stars-v2', '{}');
  window.localStorage.setItem('neon-n7-unlocked-v1', '37');
  window.localStorage.setItem('neon-n7-best-v1', '2037');
  if (saved !== undefined) window.localStorage.setItem(EQUIPMENT_KEY, saved);
  if (savedVoyage !== undefined) window.localStorage.setItem(VOYAGE_KEY,
    typeof savedVoyage === 'string' ? savedVoyage : JSON.stringify(savedVoyage));
  if (backups !== undefined) window.localStorage.setItem(EQUIPMENT_KEY + ':invalid-backups', JSON.stringify(backups));
  if (failBackup) {
    const set = window.Storage.prototype.setItem;
    window.Storage.prototype.setItem = function(key, value) {
      if (key === EQUIPMENT_KEY + ':invalid-backups') throw new Error('Fixture: backup quota exhausted');
      return set.call(this, key, value);
    };
  }
  window.eval(core); window.eval(content);
  const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
  assert.equal(game.split(marker).length, 2, 'Expected one legacy bootstrap marker');
  const hook = `
    const flightEventsForTest=[];
    const originalFlightEventForTest=classicFlightEvent;
    classicFlightEvent=function(event){flightEventsForTest.push({...event});return originalFlightEventForTest(event);};
    const explosionCallsForTest=[];
    const originalAddExplosionForTest=addExplosion;
    addExplosion=function(...args){explosionCallsForTest.push([...args]);return originalAddExplosionForTest(...args);};
    window.__UNIFIED_FLIGHT_TEST__={
      update,render,background,startLevel,prepareLevel,pauseGame,resumeGame,goHome,completeLevel,fireManualShot,
      finishGame,resumeReward,
      refreshClassicFlightBounds,showStoryTransmission,hideStoryTransmission,syncClassicFlightHud,
      prepare(index=0){startLevel(index);warpTimer=0;spawnTimer=999;classicScoutTimer=999;classicPatrolTimer=999;items=[];gates=[];},
      frame(dt=1/60,quiet=false){
        spawnTimer=999;classicScoutTimer=999;classicPatrolTimer=999;
        if(quiet){items=[];gates=[];}
        update(dt);
      },
      collectEnergy(){energySpawned++;collectItem({type:'energy',x:player.x,y:player.y-30,r:22});},
      collectModule(){collectItem({type:'flightModule',x:player.x,y:player.y-40,r:29});},
      collectPower(type){collectItem({type,x:player.x,y:player.y-40,r:22});},
      seedModule(){items=[{type:'flightModule',x:player.x,y:player.y-65,r:29,s:0,rot:0,rs:0,p:0,phase:0,amp:0,alpha:1}];},
      seedTarget(){
        items=[{id:'fixture-target',type:'meteor',x:player.x,baseX:player.x,y:player.y-350,
          r:28,s:0,rot:0,rs:0,p:0,phase:0,amp:0,alpha:1,special:'',spriteKey:'meteorMedium',hp:2,maxHp:2,damage:20}];
      },
      seedTransitFixture(){items=[{id:'boundary-live-debris',type:'debris',x:W*.2,baseX:W*.2,y:H*.35,
        r:26,s:0,rot:0,rs:0,p:0,phase:0,amp:0,alpha:1,special:'',spriteKey:'debrisMetal',hp:2,maxHp:2,damage:16}];},
      snapshot:()=>({state,elapsed,score,hull,ammo,collected,currentLevel,W,H,unlocked:getUnlocked(),
        player:{...player},bounds:classicFlightBounds?{...classicFlightBounds}:null,input:{...classicFlightInput},
        weapons:classicWeapons?NeonCampaign.classicWeaponSnapshot(classicWeapons):null,
        route:classicFlight?.snapshot()||null,equipment:{...classicEquipment,unlocked:[...classicEquipment.unlocked]},
        destructionPose:classicFlightView?NeonCampaign.getChronosDestructionPose(classicFlightView):null,
        destructionAsset:{ready:spriteReady(SPRITES.chronosDestruction),failed:SPRITES.chronosDestruction._loadError},
        explosionCalls:explosionCallsForTest.map(args=>[...args]),
        equipmentWritable:classicEquipmentWritable,events:flightEventsForTest.map(event=>({...event})),
        targets:items.map(item=>({id:item.id,type:item.type,x:item.x,y:item.y,hp:item.hp,
          role:item.classicScout?.role,tactics:item.classicScout?.tacticsVersion,enemyState:item.classicScout?.state,
          telegraph:item.classicScout?.telegraph,fired:item.classicScout?.fired,projectile:Boolean(item.classicScoutProjectile),
          vx:item.vx,vy:item.vy,frame:item.classicScout?.animator.getFrame()})),
        projectiles:items.filter(item=>item.guardianProjectile).map(item=>({id:item.projectileId,
          x:item.x,y:item.y,vx:item.vx,vy:item.vy,targetX:item.targetX,targetY:item.targetY})),
        boss:atlasBoss?JSON.parse(JSON.stringify(atlasBoss)):null})
    };\n`;
  window.eval(game.replace(marker, hook + marker));
  const api = window.__UNIFIED_FLIGHT_TEST__, canvas = window.document.getElementById('canvas');
  const snapshot = () => plain(api.snapshot());
  function advance(seconds, quiet = true) {
    let remaining = seconds;
    while (remaining > 1e-9) {
      const dt = Math.min(1 / 60, remaining); api.frame(dt, quiet); remaining -= dt;
    }
    return snapshot();
  }
  function recoverStageQuota() {
    const quota = snapshot().route.stageGoal;
    while (snapshot().collected < quota) api.collectEnergy();
  }
  function advanceStage({recover = true, service = false} = {}) {
    const before = snapshot();
    if (recover) recoverStageQuota();
    const remaining = before.route.stageDuration - before.route.stageElapsed;
    advance(remaining + .04);
    if (snapshot().route.waitingFor === 'service' && service) {
      window.document.getElementById('flightDockContinue').click();
    }
    return snapshot();
  }
  function reachStage(number) {
    for (let boundary = 0; snapshot().route.stageNumber < number && boundary < 10; boundary++) {
      const previous = snapshot().route.stageNumber;
      advanceStage({service: true});
      assert.ok(snapshot().route.stageNumber > previous, 'A satisfied stage boundary must advance');
    }
    assert.equal(snapshot().route.stageNumber, number);
    return snapshot();
  }
  function pointer(type, pointerId, clientX, clientY) {
    canvas.dispatchEvent(new window.PointerEvent(type, {pointerId, clientX, clientY,
      pointerType: 'touch', buttons: /up|cancel/.test(type) ? 0 : 1,
      bubbles: true, cancelable: true}));
  }
  function touches(type, all, changed = all) {
    const event = new window.Event(type, {bubbles: true, cancelable: true});
    Object.defineProperties(event, {touches: {value: all}, changedTouches: {value: changed}});
    canvas.dispatchEvent(event);
  }
  return {window, api, snapshot, advance, advanceStage, reachStage, recoverStageQuota, pointer, touches, pending, drawCalls,
    setRect: (id, rect) => layoutRects.set(id, rect),
    rectReads: id => rectReadCounts.get(id) || 0,
    clearDrawCalls: () => { drawCalls.length = 0; },
    setDestructionStatus: status => {
      const image = images.get(DESTRUCTION_PATH);
      assert.ok(image, 'The actual level loader must request the destruction atlas');
      configureDestructionImage(image, status);
    },
    node: id => window.document.getElementById(id),
    stored: key => window.localStorage.getItem(key),
    equipment: () => JSON.parse(window.localStorage.getItem(EQUIPMENT_KEY)),
    voyage: () => JSON.parse(window.localStorage.getItem(VOYAGE_KEY))};
}

test('three classic charges recharge from played time and freeze completely while paused', t => {
  const h = harness(t); h.api.prepare();
  assert.equal(h.snapshot().weapons.charges, 3);
  for (let shot = 0; shot < 3; shot++) {
    assert.equal(h.api.fireManualShot(), true);
    h.advance(.25);
  }
  assert.equal(h.snapshot().weapons.charges, 0); assert.equal(h.api.fireManualShot(), false);
  h.api.pauseGame(); const before = h.snapshot();
  h.advance(10);
  const paused = h.snapshot();
  assert.equal(paused.state, 'paused'); assert.deepEqual(paused.weapons, before.weapons);
  assert.deepEqual(paused.route, before.route);
  h.api.resumeGame();
  const remaining = 3.6 - before.weapons.recharge;
  h.advance(remaining - .03); assert.equal(h.snapshot().weapons.charges, 0);
  h.advance(.04); assert.equal(h.snapshot().weapons.charges, 1);
  assert.equal(h.api.fireManualShot(), true, 'The fourth shot must become available without a purchase or restart');
  assert.equal(h.pending.size, 1);
});

test('a classic projectile travels before impact and applies damage and destruction reward only once', t => {
  const h = harness(t); h.api.prepare();
  h.api.frame(1 / 60, true); // Enter the real first-stage lifecycle before inserting a combat fixture.
  h.api.seedTarget();
  assert.equal(h.api.fireManualShot(), true);
  const fired = h.snapshot();
  assert.equal(fired.targets[0].hp, 2, 'A trigger must not instantly damage a distant target');
  h.advance(.10, false); const travelling = h.snapshot();
  assert.equal(travelling.targets[0].hp, 2);
  assert.ok(travelling.weapons.projectiles[0].y < fired.weapons.projectiles[0].y - 80);
  h.advance(.30, false); const hit = h.snapshot();
  assert.equal(hit.targets[0].hp, 1); assert.equal(hit.score, 3);
  assert.equal(hit.weapons.projectiles.length, 0);
  h.advance(.8, false);
  assert.equal(h.snapshot().targets[0].hp, 1); assert.equal(h.snapshot().score, 3);
  assert.equal(h.api.fireManualShot(), true); h.advance(.5, false);
  assert.equal(h.snapshot().targets.length, 0); assert.equal(h.snapshot().score, 13);
  h.advance(1, false); assert.equal(h.snapshot().score, 13);
  assert.equal(h.pending.size, 1);
});

test('the actual PointerEvent handlers anchor without jumping and move both axes without a second finger stealing control', t => {
  const h = harness(t); h.api.prepare(); const initial = h.snapshot();
  h.pointer('pointerdown', 11, 290, 550);
  assert.equal(h.snapshot().player.target, initial.player.target);
  assert.equal(h.snapshot().player.targetY, initial.player.targetY);
  h.pointer('pointerdown', 12, 80, 300); h.pointer('pointermove', 12, 120, 260);
  assert.equal(h.snapshot().input.id, 11);
  assert.equal(h.snapshot().player.target, initial.player.target);
  assert.equal(h.snapshot().player.targetY, initial.player.targetY);
  h.pointer('pointerup', 12, 120, 260); assert.equal(h.snapshot().input.active, true);
  h.pointer('pointermove', 11, 320, 510); const moved = h.snapshot();
  closeTo(moved.player.target, initial.player.target + 30 * initial.W / 390, 'Relative X');
  closeTo(moved.player.targetY, initial.player.targetY - 40 * initial.H / 844, 'Relative Y');
  h.advance(.2); const actual = h.snapshot();
  assert.ok(actual.player.x > initial.player.x); assert.ok(actual.player.y < initial.player.y);
  h.api.pauseGame(); assert.equal(h.snapshot().input.active, false);
  h.api.resumeGame(); const resumed = h.snapshot();
  h.pointer('pointermove', 11, 350, 480);
  assert.equal(h.snapshot().player.target, resumed.player.target);
  assert.equal(h.snapshot().player.targetY, resumed.player.targetY);
  h.pointer('pointerdown', 13, 100, 700);
  assert.equal(h.snapshot().player.target, resumed.player.target);
  assert.equal(h.snapshot().player.targetY, resumed.player.targetY);
  h.pointer('pointercancel', 13, 100, 700); assert.equal(h.snapshot().input.active, false);
  assert.equal(h.pending.size, 1);
});

test('the Safari touch fallback tracks the first finger and ignores a secondary finger ending', t => {
  const h = harness(t, {pointerEvents: false}); h.api.prepare(); const initial = h.snapshot();
  const first = {identifier: 21, clientX: 250, clientY: 620};
  const second = {identifier: 22, clientX: 80, clientY: 300};
  h.touches('touchstart', [first], [first]);
  h.touches('touchstart', [first, second], [second]);
  h.touches('touchmove', [first, {...second, clientX: 160}], [{...second, clientX: 160}]);
  assert.equal(h.snapshot().player.target, initial.player.target);
  assert.equal(h.snapshot().player.targetY, initial.player.targetY);
  h.touches('touchend', [first], [second]); assert.equal(h.snapshot().input.id, 21);
  const moved = {...first, clientX: 270, clientY: 590};
  h.touches('touchmove', [moved], [moved]);
  closeTo(h.snapshot().player.target, initial.player.target + 20 * initial.W / 390);
  closeTo(h.snapshot().player.targetY, initial.player.targetY - 30 * initial.H / 844);
  h.touches('touchcancel', [], [moved]); assert.equal(h.snapshot().input.active, false);
});

test('the first mission requires recovered CRONIUM, all ten visible stages and the service stop before Gaia unlocks', t => {
  const h = harness(t, {unlocked: 1}); h.api.prepare();
  for (let fragment = 0; fragment < 36; fragment++) h.api.collectEnergy();
  let q = h.snapshot();
  assert.equal(q.collected, 36); assert.equal(q.state, 'playing');
  assert.equal(q.route.canFinish, false); assert.equal(q.route.routeProgress, 0);
  assert.equal(q.route.stageNumber, 1); assert.equal(q.route.minDuration, 360);
  assert.deepEqual(JSON.parse(h.stored('neon-stars-v2')), {});
  h.api.completeLevel(); assert.equal(h.snapshot().state, 'playing');
  for (let number = 1; number <= 10; number++) {
    q = h.snapshot(); assert.equal(q.route.stageNumber, number);
    h.advance(q.route.stageDuration - q.route.stageElapsed - .05);
    q = h.snapshot();
    assert.equal(q.state, 'playing'); assert.equal(q.route.canFinish, false);
    assert.equal(q.unlocked, 1, 'No intermediate stage may unlock the next classic territory');
    assert.deepEqual(JSON.parse(h.stored('neon-stars-v2')), {});
    h.api.completeLevel(); assert.equal(h.snapshot().state, 'playing');
    if (number === 10) assert.ok(q.route.routeProgress > .9 && q.route.routeProgress < 1);
    h.advance(.06); q = h.snapshot();
    if (number === 6) {
      assert.equal(q.state, 'paused'); assert.equal(q.route.waitingFor, 'service');
      assert.ok(h.node('flightDock').classList.contains('show'));
      assert.equal(q.route.canFinish, false);
      h.node('flightDockContinue').click();
      assert.equal(h.snapshot().state, 'playing');
      assert.equal(h.snapshot().route.stageNumber, 7);
    } else if (number < 10) {
      assert.equal(q.state, 'playing'); assert.equal(q.route.stageNumber, number + 1);
      assert.equal(q.route.canFinish, false);
    }
  }
  q = h.snapshot();
  assert.equal(q.state, 'complete'); assert.equal(q.route.canFinish, true);
  assert.equal(q.route.routeProgress, 1); assert.ok(JSON.parse(h.stored('neon-stars-v2'))['1'] >= 1);
  assert.equal(q.unlocked, 2); assert.equal(h.voyage().completed, true);
  assert.equal(q.events.filter(event => event.type === 'stage-start').length, 10);
  assert.equal(q.events.filter(event => event.type === 'stage-complete').length, 10);
  assert.equal(q.events.filter(event => event.type === 'arrival').length, 1);
  assert.equal(h.pending.size, 1);
});

test('the Chronos attack and reactor rupture occur once in route order and cannot advance during pause', t => {
  const h = harness(t); h.api.prepare();
  h.advance(3); const attacked = h.snapshot();
  assert.equal(attacked.events.filter(event => event.type === 'attack').length, 1);
  assert.equal(attacked.events.some(event => event.type === 'rupture'), false);
  h.api.pauseGame(); h.advance(12); const paused = h.snapshot();
  assert.deepEqual(paused.route, attacked.route); assert.deepEqual(paused.events, attacked.events);
  h.api.resumeGame(); h.advance(9); const resumed = h.snapshot();
  assert.equal(resumed.events.filter(event => event.type === 'attack').length, 1);
  assert.equal(resumed.events.filter(event => event.type === 'rupture').length, 1);
  const attack = resumed.events.findIndex(event => event.type === 'attack');
  const rupture = resumed.events.findIndex(event => event.type === 'rupture');
  assert.ok(attack < rupture);
  h.advance(3); assert.equal(h.snapshot().events.filter(event => event.type === 'rupture').length, 1);
  assert.equal(h.pending.size, 1);
});

test('the real Chronos renderer selects all six illustrated source cells and preserves the destroyed station', t => {
  const h = harness(t); h.api.prepare();
  let previousTime = 0;
  for (const [time, frame] of [[0, 0], [9.1, 1], [9.6, 2], [10.5, 3], [11.6, 4], [13.6, 5], [23.6, 5]]) {
    h.advance(time - previousTime); previousTime = time;
    const snapshot = h.snapshot();
    assert.equal(snapshot.destructionPose.frame, frame, `Simulated time ${time}`);
    h.clearDrawCalls(); h.api.background(999_999);
    const stationCalls = h.drawCalls.filter(call => call.path === DESTRUCTION_PATH);
    assert.equal(stationCalls.length, 1, `One authored station layer at time ${time}`);
    assert.deepEqual(stationCalls[0].args.slice(0, 4),
      [(frame % 3) * 512, Math.floor(frame / 3) * 512, 512, 512]);
    assert.ok(stationCalls[0].args.slice(4).every(Number.isFinite));
    assert.equal(snapshot.explosionCalls.length, 0,
      'The temporal rupture must not create a generic combat explosion over the reactor');
  }
  assert.equal(h.snapshot().events.filter(event => event.type === 'rupture').length, 1);
  assert.equal(h.snapshot().destructionPose.waveVisible, false);
  assert.equal(h.pending.size, 1);
});

test('pause and repeated real background renders freeze the Chronos pose, clock and event stream', t => {
  const h = harness(t); h.api.prepare(); h.advance(11);
  h.api.pauseGame(); const before = h.snapshot();
  assert.equal(before.destructionPose.frame, 3);
  assert.equal(before.destructionPose.waveVisible, true);
  h.clearDrawCalls(); h.api.background(0);
  const pausedDrawing = plain(h.drawCalls);
  for (const timestamp of [1, 1000, 1e9, 0]) {
    h.advance(2);
    h.clearDrawCalls(); h.api.background(timestamp);
    assert.deepEqual(plain(h.drawCalls), pausedDrawing,
      'Rendering a different wall-clock timestamp must not advance the authored scene');
    const repeated = h.snapshot();
    assert.equal(repeated.elapsed, before.elapsed);
    assert.deepEqual(repeated.route, before.route);
    assert.deepEqual(repeated.destructionPose, before.destructionPose);
    assert.deepEqual(repeated.events, before.events);
    assert.equal(h.pending.size, 1);
  }
  h.api.resumeGame(); h.advance(1);
  assert.ok(h.snapshot().route.elapsed > before.route.elapsed);
  assert.equal(h.snapshot().destructionPose.frame, 4);
  assert.equal(h.snapshot().events.filter(event => event.type === 'rupture').length, 1);
  assert.equal(h.pending.size, 1);
});

test('a pending destruction atlas holds the flight clock and an actual load error enables the preserved station fallback', t => {
  const h = harness(t, {destructionAsset: 'unresolved'}); h.api.prepare();
  const initial = h.snapshot();
  assert.deepEqual(initial.destructionAsset, {ready: false, failed: false});
  h.advance(3);
  assert.equal(h.snapshot().elapsed, initial.elapsed);
  assert.deepEqual(h.snapshot().route, initial.route);
  assert.equal(h.snapshot().events.length, 0);
  assert.equal(h.node('flightStage').textContent, 'CARGANDO CHRONOS');

  h.setDestructionStatus('error');
  assert.deepEqual(h.snapshot().destructionAsset, {ready: false, failed: true});
  h.advance(.2);
  assert.ok(h.snapshot().route.elapsed > 0, 'An explicit download failure must not block the playable fallback');
  assert.equal(h.node('flightStage').textContent, `${h.snapshot().route.stageId} · ${h.snapshot().route.stageName}`,
    'A settled download must clear the transient loading label immediately and restore the current stage');
  h.clearDrawCalls(); h.api.background(0);
  let fallbackCalls = h.drawCalls.filter(call => call.path === FLIGHT_KIT_PATH);
  assert.ok(fallbackCalls.some(call => call.args[0] === 0 && call.args[1] === 0),
    'The preserved intact station must render before impact');
  assert.equal(h.drawCalls.some(call => call.path === DESTRUCTION_PATH), false);

  h.advance(9.2);
  assert.equal(h.snapshot().route.station.state, 'ruptured');
  h.clearDrawCalls(); h.api.background(1e9);
  fallbackCalls = h.drawCalls.filter(call => call.path === FLIGHT_KIT_PATH);
  assert.ok(fallbackCalls.some(call => call.args[0] === 512 && call.args[1] === 0),
    'The preserved ruined station must render after impact');
  assert.equal(h.drawCalls.some(call => call.path === DESTRUCTION_PATH), false);
  assert.equal(h.snapshot().events.filter(event => event.type === 'rupture').length, 1);
  assert.equal(h.pending.size, 1);
});

test('recovering, installing and switching a real weapon preserve ammunition and separate campaign saves', t => {
  const h = harness(t); h.api.prepare(); h.api.fireManualShot(); h.advance(.3);
  h.api.collectModule();
  assert.equal(h.snapshot().equipment.recoveredTwin, true);
  assert.deepEqual(h.equipment().unlocked, ['pulse']);
  const afterRecovery = h.stored(EQUIPMENT_KEY);
  h.api.collectModule(); assert.equal(h.stored(EQUIPMENT_KEY), afterRecovery);
  const ammunition = h.snapshot().weapons;
  h.api.goHome(); h.node('openFlightDock').click();
  assert.ok(h.node('flightDock').classList.contains('show'));
  h.node('flightInstallTwin').click(); const installed = h.snapshot();
  assert.deepEqual(h.equipment(), {version: 1, recoveredTwin: true, unlocked: ['pulse', 'twin'], selected: 'twin'});
  assert.equal(installed.weapons.charges, ammunition.charges);
  assert.equal(installed.weapons.recharge, ammunition.recharge);
  assert.equal(installed.weapons.cooldown, ammunition.cooldown);
  assert.equal(h.node('flightInstallTwin').disabled, true);
  const save = h.stored(EQUIPMENT_KEY); h.node('flightInstallTwin').click(); assert.equal(h.stored(EQUIPMENT_KEY), save);
  h.api.prepare(1); assert.equal(h.snapshot().weapons.selected, 'twin');
  assert.equal(h.api.fireManualShot(), true); const fired = h.snapshot().weapons;
  assert.equal(fired.charges, 2); assert.equal(fired.projectiles.length, 2);
  h.node('flightWeapon').click(); let switched = h.snapshot().weapons;
  assert.equal(switched.selected, 'pulse'); assert.equal(switched.charges, 2);
  assert.equal(switched.cooldown, fired.cooldown); assert.equal(switched.recharge, fired.recharge);
  h.node('flightWeapon').click(); switched = h.snapshot().weapons;
  assert.equal(switched.selected, 'twin'); assert.equal(switched.charges, 2);
  assert.equal(switched.projectiles.length, 2, 'Switching cannot duplicate a trigger event');
  const restored = harness(t, {saved: h.stored(EQUIPMENT_KEY)}); restored.api.prepare();
  assert.equal(restored.snapshot().equipment.selected, 'twin');
  assert.equal(restored.snapshot().weapons.selected, 'twin');
  assert.equal(h.stored('neon-n7-unlocked-v1'), '37'); assert.equal(h.stored('neon-n7-best-v1'), '2037');
  const n7 = harness(t, {campaign: 'n7', saved: save}); n7.api.prepare();
  assert.equal(n7.snapshot().weapons, null); assert.equal(n7.snapshot().route, null);
  assert.equal(n7.stored(EQUIPMENT_KEY), save); assert.equal(n7.node('flightRoute'), null);
  assert.equal(h.pending.size, 1); assert.equal(restored.pending.size, 1); assert.equal(n7.pending.size, 1);
});

test('invalid equipment is backed up once before replacement and a failed backup blocks destructive recovery', t => {
  const invalid = '{broken equipment';
  const h = harness(t, {saved: invalid});
  assert.equal(h.stored(EQUIPMENT_KEY), invalid);
  assert.deepEqual(JSON.parse(h.stored(EQUIPMENT_KEY + ':invalid-backups')), [invalid]);
  assert.deepEqual(h.snapshot().equipment, {version: 1, recoveredTwin: false, unlocked: ['pulse'], selected: 'pulse'});
  h.api.prepare(); h.api.collectModule();
  assert.equal(h.equipment().recoveredTwin, true);
  assert.deepEqual(JSON.parse(h.stored(EQUIPMENT_KEY + ':invalid-backups')), [invalid]);
  const again = harness(t, {saved: invalid, backups: [invalid]});
  assert.deepEqual(JSON.parse(again.stored(EQUIPMENT_KEY + ':invalid-backups')), [invalid]);
  const blocked = harness(t, {saved: invalid, failBackup: true}); blocked.api.prepare(); blocked.api.collectModule();
  assert.equal(blocked.snapshot().equipmentWritable, false);
  assert.equal(blocked.snapshot().equipment.recoveredTwin, false);
  assert.equal(blocked.stored(EQUIPMENT_KEY), invalid, 'Do not overwrite unpreserved data when storage fails');
  blocked.api.frame(1 / 60, true); // Finish stage-entry cleanup before inserting the persistence fixture.
  blocked.api.seedModule(); blocked.api.frame(1 / 60, false);
  assert.equal(blocked.snapshot().targets.filter(item => item.type === 'flightModule').length, 1,
    'The collision loop must retain a recoverable piece until its persistence succeeds');
  assert.equal(blocked.stored('neon-n7-unlocked-v1'), '37');
});

test('C9 calibrates the recovered twin into a persistent lance and cycling ×1/×2/×3 never grants ammunition', t => {
  const h = harness(t); h.api.prepare();
  assert.equal(h.node('flightWeaponDamage').textContent, 'DAÑO ×1');
  h.api.fireManualShot(); h.advance(.3);
  h.api.collectModule(); h.api.goHome(); h.node('openFlightDock').click();
  assert.equal(h.node('flightCalibrateLance').disabled, true,
    'Recovering a piece alone must not skip its installation');
  h.node('flightCalibrateLance').click();
  assert.deepEqual(h.equipment().unlocked, ['pulse']);
  const beforeInstallation = h.snapshot().weapons;
  h.node('flightInstallTwin').click();
  assert.equal(h.node('flightCalibrateLance').disabled, false);
  assert.equal(h.equipment().lanceCalibrated, undefined,
    'The optional extension must not rewrite an old v1 profile before calibration');
  h.node('flightCalibrateLance').click();
  const calibrated = h.snapshot();
  assert.deepEqual(h.equipment(), {version: 1, recoveredTwin: true,
    unlocked: ['pulse', 'twin', 'lance'], selected: 'lance', lanceCalibrated: true});
  assert.equal(calibrated.weapons.charges, beforeInstallation.charges);
  assert.equal(calibrated.weapons.recharge, beforeInstallation.recharge);
  assert.equal(calibrated.weapons.cooldown, beforeInstallation.cooldown);
  assert.equal(h.node('flightCalibrateLance').disabled, true);
  const saved = h.stored(EQUIPMENT_KEY);
  h.node('flightCalibrateLance').click();
  assert.equal(h.stored(EQUIPMENT_KEY), saved, 'Repeating calibration cannot duplicate an unlock');
  const choices=h.node('flightLoadoutChoices');
  for(const type of ['pulse','twin','lance']) {
    choices.querySelector(`[data-flight-loadout="${type}"]`).click();
    assert.equal(h.equipment().selected,type,'C9 selection persists the actual weapon');
    assert.equal(choices.querySelector(`[data-flight-loadout="${type}"]`).getAttribute('aria-pressed'),'true');
    assert.equal(h.snapshot().weapons.charges,calibrated.weapons.charges,'C9 comparison cannot manufacture ammunition');
    assert.equal(h.snapshot().weapons.recharge,calibrated.weapons.recharge);
  }

  h.api.prepare(1);
  assert.equal(h.node('flightWeaponName').textContent, 'LANZA');
  assert.equal(h.node('flightWeaponDamage').textContent, 'DAÑO ×3');
  assert.equal(h.api.fireManualShot(), true);
  const fired = h.snapshot().weapons;
  assert.equal(fired.charges, 2); assert.equal(fired.projectiles.length, 1);
  assert.equal(fired.projectiles[0].damage, 3); assert.equal(fired.projectiles[0].pierce, 2);
  for (const [selected, multiplier] of [['pulse', 1], ['twin', 2], ['lance', 3]]) {
    h.node('flightWeapon').click(); const switched = h.snapshot().weapons;
    assert.equal(switched.selected, selected);
    assert.equal(h.node('flightWeaponDamage').textContent, `DAÑO ×${multiplier}`);
    assert.match(h.node('flightWeapon').getAttribute('aria-label'), new RegExp(`Daño ×${multiplier}`));
    assert.equal(switched.charges, fired.charges);
    assert.equal(switched.recharge, fired.recharge);
    assert.equal(switched.cooldown, fired.cooldown);
    assert.equal(switched.shotSequence, fired.shotSequence);
    assert.deepEqual(switched.projectiles, fired.projectiles);
    assert.equal(h.api.fireManualShot(), false, 'Switching cannot bypass the lance cooldown');
  }
  const restored = harness(t, {saved: h.stored(EQUIPMENT_KEY)}); restored.api.prepare();
  assert.equal(restored.snapshot().equipment.lanceCalibrated, true);
  assert.equal(restored.snapshot().weapons.selected, 'lance');
  assert.equal(restored.node('flightWeaponDamage').textContent, 'DAÑO ×3');
  assert.equal(h.stored('neon-n7-unlocked-v1'), '37');
  assert.equal(h.stored('neon-n7-best-v1'), '2037');
  assert.equal(h.pending.size, 1); assert.equal(restored.pending.size, 1);
});

test('malformed lance unlocks are preserved as backups instead of granting uncalibrated weapons', t => {
  for (const profile of [
    {version: 1, recoveredTwin: true, unlocked: ['pulse', 'twin', 'lance'], selected: 'lance'},
    {version: 1, recoveredTwin: true, unlocked: ['pulse', 'twin', 'lance'], selected: 'lance', lanceCalibrated: false},
    {version: 1, recoveredTwin: true, unlocked: ['pulse', 'twin', 'lance'], selected: 'lance', lanceCalibrated: 'true'},
    {version: 1, recoveredTwin: true, unlocked: ['pulse', 'lance'], selected: 'lance', lanceCalibrated: true},
    {version: 1, recoveredTwin: false, unlocked: ['pulse', 'twin', 'lance'], selected: 'lance', lanceCalibrated: true}
  ]) {
    const raw = JSON.stringify(profile), h = harness(t, {saved: raw});
    assert.equal(h.stored(EQUIPMENT_KEY), raw, 'Invalid data must remain recoverable before a successful replacement');
    assert.deepEqual(JSON.parse(h.stored(EQUIPMENT_KEY + ':invalid-backups')), [raw]);
    assert.deepEqual(h.snapshot().equipment,
      {version: 1, recoveredTwin: false, unlocked: ['pulse'], selected: 'pulse'});
    h.api.prepare();
    assert.equal(h.snapshot().weapons.selected, 'pulse');
    assert.deepEqual(h.snapshot().weapons.unlocked, ['pulse']);
    assert.equal(h.stored('neon-unlocked-v2'), '2');
    assert.equal(h.stored('neon-n7-unlocked-v1'), '37');
    assert.equal(h.pending.size, 1);
  }
});

test('Atlas locks its warning and actual projectile trajectory to the movable ship position', t => {
  const h = harness(t); h.api.prepare(1);
  for (let fragment = 0; fragment < 45; fragment++) h.api.collectEnergy();
  if (h.snapshot().boss === null) assert.fail('Gaia did not start Atlas');
  h.node('atlasAutoFire').click(); assert.equal(h.snapshot().boss.phase, 1);
  h.pointer('pointerdown', 31, 250, 650); h.pointer('pointermove', 31, 290, 590);
  h.advance(.6); h.pointer('pointerup', 31, 290, 590);
  for (let frame = 0; frame < 600 && h.snapshot().boss.state !== 'charge'; frame++) h.api.frame(1 / 60, true);
  const warning = h.snapshot();
  assert.equal(warning.boss.state, 'charge');
  closeTo(warning.boss.telegraph.targetX, warning.player.x, 'Warning captures actual X');
  closeTo(warning.boss.telegraph.targetY, warning.player.y, 'Warning captures actual Y');
  const locked = warning.boss.telegraph;
  h.pointer('pointerdown', 32, 200, 600); h.pointer('pointermove', 32, 150, 650);
  h.advance(.3); h.pointer('pointerup', 32, 150, 650);
  closeTo(h.snapshot().boss.telegraph.targetY, locked.targetY, 'An announced attack must not retarget after movement');
  const origin = locked.originY;
  for (let frame = 0; frame < 180; frame++) {
    if (h.snapshot().projectiles.length) break;
    h.api.frame(1 / 60, true);
  }
  const fired = h.snapshot(); assert.equal(fired.boss.state, 'fire');
  closeTo(fired.boss.telegraph.targetY, locked.targetY);
  assert.equal(fired.projectiles.length, 5);
  const middle = fired.projectiles.find(projectile => projectile.id.endsWith(':2'));
  assert.ok(middle, 'The real emitted five-way volley must contain its central projectile');
  closeTo(middle.targetY, locked.targetY, 'Projectile metadata preserves the actual warning line');
  const crossingX = middle.x + middle.vx * (locked.targetY - middle.y) / middle.vy;
  closeTo(crossingX, locked.targetX, 'The emitted projectile must cross the announced location');
  assert.ok(Math.abs(locked.targetY - fired.player.y) > 10, 'The fixture must actually move after the warning');
  assert.ok(locked.targetY > origin); assert.equal(h.pending.size, 1);
});

test('the route bar advances between collections without a stage, ammunition or recharge change', t => {
  const h = harness(t); h.api.prepare(); h.advance(.1);
  const before = h.snapshot(), distance = h.node('flightDistance').value;
  const stage = h.node('flightStage').textContent;
  h.advance(.41); const after = h.snapshot(); // Cross the 0.001 route/HUD quantum on the new 360-second flight.
  assert.equal(after.collected, before.collected);
  assert.equal(after.weapons.charges, before.weapons.charges);
  assert.equal(after.weapons.recharge, before.weapons.recharge);
  assert.equal(h.node('flightStage').textContent, stage);
  assert.ok(after.route.routeProgress > before.route.routeProgress);
  assert.ok(h.node('flightDistance').value > distance,
    'A quiet route must visibly advance without requiring a pickup or weapon update');
  assert.ok(Math.abs(h.node('flightDistance').value - after.route.routeProgress) < .001);
  assert.equal(h.node('flightDistance').getAttribute('aria-label'), 'Recorrido hasta el destino');
  assert.equal(h.pending.size, 1);
});

test('compact comms do not repeat the quota and expire only with played time without moving the flight bounds', t => {
  const h = harness(t, {unlocked: 3, rects: {
    hud: {left: 10, top: 10, width: 370, height: 44},
    flightRoute: {left: 10, top: 58, width: 370, height: 24},
    flightObjective: {left: 10, top: 86, width: 370, height: 34}
  }});
  h.api.prepare(2); h.api.collectEnergy();
  assert.equal(h.node('goal').textContent, '1/60');
  assert.equal(h.node('flightObjective').textContent, '');
  assert.equal(h.node('flightObjective').dataset.active, 'false');
  assert.equal(h.node('flightDistance').getAttribute('aria-label'), 'CRONIUM recuperado');
  const bounds = h.snapshot().bounds;
  h.api.showStoryTransmission('CONTROL', 'Restos por babor. Mantén el corredor.', 1.1);
  h.api.refreshClassicFlightBounds();
  assert.equal(h.node('flightObjective').textContent, 'CONTROL: Restos por babor. Mantén el corredor.');
  assert.equal(h.node('flightObjective').dataset.active, 'true');
  assert.deepEqual(h.snapshot().bounds, bounds);
  h.api.pauseGame(); h.advance(3);
  assert.equal(h.node('flightObjective').dataset.active, 'true',
    'A paused transmission must remain readable until its played-time duration elapses');
  h.api.resumeGame(); h.advance(1.11); h.api.refreshClassicFlightBounds();
  assert.equal(h.node('flightObjective').textContent, '');
  assert.equal(h.node('flightObjective').dataset.active, 'false');
  assert.deepEqual(h.snapshot().bounds, bounds,
    'Showing or clearing comms must not displace the playable boundary');
  assert.equal(h.pending.size, 1);
});

test('measured compact bounds release the former top reserve and ignore side controls outside the Canvas', t => {
  const h = harness(t, {unlocked: 3, rects: {
    hud: {left: 10, top: 10, width: 370, height: 44},
    flightRoute: {left: 10, top: 58, width: 370, height: 24},
    flightObjective: {left: 10, top: 86, width: 370, height: 34},
    fire: {left: 258, top: 760, width: 116, height: 64},
    flightWeapon: {left: 10, top: 700, width: 104, height: 48}
  }});
  h.api.prepare(2); const first = h.snapshot(), scale = first.H / 844;
  assert.equal(first.bounds.fits, true);
  closeTo((first.bounds.minY - 158) / scale, 120,
    'The upper boundary follows the actual comms slot rather than a 182px minimum');
  closeTo((first.bounds.maxY + 104) / scale, 700,
    'The complete ship tail must clear the measured weapon button');
  h.setRect('flightObjective', {left: 500, top: 400, width: 200, height: 34});
  h.setRect('flightWeapon', {left: 500, top: 200, width: 104, height: 48});
  h.api.refreshClassicFlightBounds(); const lateral = h.snapshot();
  closeTo((lateral.bounds.minY - 158) / scale, 82,
    'An off-Canvas transmission must not lower the playable ceiling');
  closeTo((lateral.bounds.maxY + 104) / scale, 740,
    'An off-Canvas weapon must not constrain the lower boundary');
  assert.ok(lateral.bounds.minY < first.bounds.minY);
  assert.ok(lateral.bounds.maxY > first.bounds.maxY);
  assert.equal(lateral.bounds.fits, true);
  assert.equal(h.pending.size, 1);
});

test('the compact HUD and weapon share menu, completion, death and Atlas visibility while switching preserves ammunition', t => {
  const saved = JSON.stringify({version: 1, recoveredTwin: true,
    unlocked: ['pulse', 'twin'], selected: 'twin'});
  const h = harness(t, {saved, unlocked: 3, rects: {
    hud: {left: 10, top: 10, width: 370, height: 44},
    flightRoute: {left: 10, top: 58, width: 370, height: 24},
    flightObjective: {left: 10, top: 86, width: 370, height: 34},
    fire: {left: 258, top: 760, width: 116, height: 64},
    flightWeapon: {left: 10, top: 700, width: 104, height: 48}
  }});
  const hidden = () => {
    assert.equal(h.node('flightHud').classList.contains('hidden'), true);
    assert.equal(h.node('flightRoute').classList.contains('hidden'), true);
    assert.ok(h.node('flightWeapon').closest('#flightHud.hidden'),
      'The detached lower weapon control must remain inside the hidden HUD lifecycle');
  };
  hidden(); h.api.prepare(2);
  assert.equal(h.node('flightHud').classList.contains('hidden'), false);
  assert.equal(h.node('flightRoute').classList.contains('hidden'), false);
  assert.equal(h.api.fireManualShot(), true); const fired = h.snapshot().weapons;
  for (const selected of ['pulse', 'twin']) {
    h.node('flightWeapon').click(); const switched = h.snapshot().weapons;
    assert.equal(switched.selected, selected);
    assert.equal(switched.charges, fired.charges);
    assert.equal(switched.recharge, fired.recharge);
    assert.equal(switched.cooldown, fired.cooldown);
    assert.equal(switched.projectiles.length, fired.projectiles.length);
    assert.equal(h.node('flightWeaponName').textContent, selected === 'twin' ? 'GEMELO' : 'PULSO');
    assert.equal(h.node('flightWeaponDamage').textContent, selected === 'twin' ? 'DAÑO ×2' : 'DAÑO ×1');
  }
  const normalBounds = h.snapshot().bounds;
  h.api.finishGame('hull');
  assert.equal(h.snapshot().state, 'gameover'); hidden();
  h.api.refreshClassicFlightBounds();
  assert.ok(h.snapshot().bounds.minY < normalBounds.minY,
    'A layout refresh while defeated must actually observe the hidden interface');
  assert.equal(h.api.resumeReward(), true);
  assert.equal(h.snapshot().state, 'playing');
  assert.equal(h.node('flightHud').classList.contains('hidden'), false,
    'Continuing an ordinary flight must restore its compact HUD and weapon');
  assert.equal(h.node('flightRoute').classList.contains('hidden'), false);
  assert.deepEqual(h.snapshot().bounds, normalBounds,
    'Continuing after a defeated-state layout refresh must restore measured HUD and weapon clearance');
  for (let fragment = 0; fragment < 60; fragment++) h.api.collectEnergy();
  assert.equal(h.snapshot().state, 'complete'); hidden();
  h.api.goHome(); assert.equal(h.snapshot().state, 'menu'); hidden();
  h.api.prepare(1);
  for (let fragment = 0; fragment < 45; fragment++) h.api.collectEnergy();
  assert.ok(h.snapshot().boss, 'The actual Gaia quota must enter Atlas');
  assert.equal(h.node('flightHud').classList.contains('hidden'), false,
    'Atlas must retain the same weapon selector and damage explanation');
  assert.equal(h.node('flightRoute').classList.contains('hidden'), true,
    'The ordinary travel line must stay hidden behind the combat interface');
  assert.equal(h.node('flightWeapon').closest('#flightHud.hidden'), null);
  assert.equal(h.snapshot().state, 'playing');
  h.api.finishGame('hull');
  assert.equal(h.snapshot().state, 'gameover'); hidden();
  assert.equal(h.api.resumeReward(), true);
  assert.equal(h.snapshot().state, 'playing');
  assert.ok(h.snapshot().boss);
  assert.equal(h.node('flightHud').classList.contains('hidden'), false);
  assert.equal(h.node('flightRoute').classList.contains('hidden'), true);
  assert.equal(h.node('atlasEncounter').classList.contains('hidden'), false,
    'Continuing Atlas restores its combat interface without leaking the ordinary route controls');
  assert.equal(h.pending.size, 1);
});

test('power pickup and expiry update flight clearance only when chip visibility changes and leave N-7 bounds alone', t => {
  const rects = {
    hud: {left: 10, top: 10, width: 370, height: 44},
    flightRoute: {left: 10, top: 58, width: 370, height: 24},
    flightObjective: {left: 10, top: 86, width: 370, height: 34},
    fire: {left: 258, top: 760, width: 116, height: 64},
    flightWeapon: {left: 10, top: 776, width: 104, height: 48},
    powerHud: node => ({left: 10, top: 712, width: 370,
      height: node.querySelector('.power-chip.active') ? 24 : 0})
  };
  const h = harness(t, {unlocked: 3, rects}); h.api.prepare(2);
  const before = h.snapshot(), scale = before.H / 844;
  closeTo((before.bounds.maxY + 104) / scale, 740);
  const initialReads = h.rectReads('powerHud');
  h.api.collectPower('shield'); const active = h.snapshot();
  assert.equal(h.node('powerShield').classList.contains('active'), true);
  assert.ok(h.rectReads('powerHud') > initialReads,
    'A real pickup must resample the newly visible chip row');
  closeTo((active.bounds.maxY + 104) / scale, 712);
  assert.ok(active.bounds.maxY < before.bounds.maxY);
  assert.ok(active.player.y + 104 <= 712 * scale,
    'The complete ship tail must remain above the newly visible power chip');
  const activeReads = h.rectReads('powerHud');
  h.advance(.5);
  assert.equal(h.rectReads('powerHud'), activeReads,
    'An unchanged countdown must not trigger layout sampling every frame');
  h.api.collectPower('shield');
  assert.equal(h.rectReads('powerHud'), activeReads,
    'Extending an already visible power must not resample unchanged geometry');
  h.advance(6.9);
  assert.equal(h.node('powerShield').classList.contains('active'), true);
  assert.equal(h.rectReads('powerHud'), activeReads);
  h.advance(.11);
  assert.equal(h.node('powerShield').classList.contains('active'), false);
  assert.ok(h.rectReads('powerHud') > activeReads,
    'Expiry must release the measured chip clearance');
  assert.deepEqual(h.snapshot().bounds, before.bounds);
  const expiredReads = h.rectReads('powerHud'); h.advance(.2);
  assert.equal(h.rectReads('powerHud'), expiredReads);

  const n7 = harness(t, {campaign: 'n7', rects}); n7.api.prepare();
  const n7Reads = n7.rectReads('powerHud');
  n7.api.collectPower('shield'); n7.advance(.5);
  assert.equal(n7.node('powerShield').classList.contains('active'), true);
  assert.equal(n7.snapshot().bounds, null);
  assert.equal(n7.rectReads('powerHud'), n7Reads,
    'The classic layout adapter must not run for the archived N-7 campaign');
  assert.equal(h.pending.size, 1); assert.equal(n7.pending.size, 1);
});

test('each Chronos stage gates its actual route on time and its cumulative recovery quota without replaying events', t => {
  const h = harness(t, {unlocked: 1}); h.api.prepare();
  const first = h.snapshot().route;
  assert.equal(first.stageNumber, 1); assert.equal(first.stageGoal, 4);
  h.advance(first.stageDuration + 3);
  const waiting = h.snapshot();
  assert.equal(waiting.state, 'playing'); assert.equal(waiting.route.stageNumber, 1);
  assert.equal(waiting.route.stageProgress, 1); assert.equal(waiting.route.waitingFor, 'cronium');
  assert.equal(waiting.route.canFinish, false); assert.equal(waiting.unlocked, 1);
  assert.equal(waiting.events.filter(event => event.type === 'attack').length, 1);
  assert.equal(waiting.events.filter(event => event.type === 'rupture').length, 1);
  h.api.pauseGame(); const beforePause = h.snapshot(); h.advance(12);
  assert.deepEqual(h.snapshot().route, beforePause.route);
  assert.deepEqual(h.snapshot().events, beforePause.events);
  h.api.resumeGame();
  for (let fragment = 0; fragment < 3; fragment++) h.api.collectEnergy();
  h.advance(.1); assert.equal(h.snapshot().route.stageNumber, 1);
  assert.equal(h.snapshot().route.waitingFor, 'cronium');
  h.api.collectEnergy(); h.advance(.04);
  const next = h.snapshot();
  assert.equal(next.route.stageNumber, 2); assert.equal(next.route.stageId, '1.2');
  assert.equal(next.route.stageGoal, 8); assert.ok(next.route.stageElapsed < .1);
  assert.equal(next.route.station.alpha, 1, 'Departure is spatial recession, rather than fading the origin');
  assert.ok(next.route.station.scale < first.station.scale);
  assert.ok(next.route.routeProgress > first.routeProgress);
  assert.equal(next.events.filter(event => event.type === 'attack').length, 1);
  assert.equal(next.events.filter(event => event.type === 'rupture').length, 1);
  assert.equal(next.events.filter(event => event.type === 'stage-complete').length, 1);
  assert.equal(next.events.filter(event => event.type === 'checkpoint').length, 2);
  assert.equal(h.voyage().unlockedStage, 2);
  assert.equal(h.pending.size, 1);
});

test('Chronos stage-entry checkpoints restore coherently after reload and retry without rewriting archived campaign saves', t => {
  const h = harness(t, {unlocked: 1}); h.api.prepare(); h.reachStage(3);
  const entry = h.snapshot(), record = h.voyage();
  assert.equal(record.version, 2); assert.equal(record.checkpoint.stageNumber, 3);
  assert.equal(record.unlockedStage, 3); assert.equal(record.completed, false);
  assert.equal(record.entry.collected, entry.collected);
  assert.equal(record.entry.score, entry.score);
  assert.equal(record.entry.hull, entry.hull);
  assert.equal(record.entry.collected, 8);
  h.advance(4); h.api.collectEnergy(); h.api.collectEnergy();
  assert.equal(h.snapshot().collected, entry.collected + 2);
  assert.ok(h.snapshot().score > entry.score);
  assert.deepEqual(h.voyage(), record,
    'Mid-combat changes must not pretend to be a persisted exact-position checkpoint');
  const restored = harness(t, {unlocked: 1, savedVoyage: h.stored(VOYAGE_KEY)}); restored.api.prepare();
  const reloaded = restored.snapshot();
  assert.equal(reloaded.route.stageNumber, 3); assert.equal(reloaded.route.stageElapsed, 0);
  assert.equal(reloaded.collected, record.entry.collected);
  assert.equal(reloaded.score, record.entry.score); assert.equal(reloaded.hull, record.entry.hull);
  assert.equal(reloaded.unlocked, 1);
  assert.equal(reloaded.events.some(event => ['attack', 'rupture', 'twin-module-marker'].includes(event.type)), false,
    'Restoring stage 3 must not immediately replay the previous cinematic or spawn its recovered-module event early');
  h.api.finishGame('hull'); assert.equal(h.snapshot().state, 'gameover');
  h.api.prepare(); const retried = h.snapshot();
  assert.equal(retried.route.stageNumber, 3); assert.equal(retried.route.stageElapsed, 0);
  assert.equal(retried.collected, record.entry.collected);
  assert.equal(retried.score, record.entry.score); assert.equal(retried.hull, record.entry.hull);
  for (const fixture of [h, restored]) {
    assert.equal(fixture.stored('neon-n7-unlocked-v1'), '37');
    assert.equal(fixture.stored('neon-n7-best-v1'), '2037');
    assert.deepEqual(JSON.parse(fixture.stored('neon-stars-v2')), {});
    assert.equal(fixture.pending.size, 1);
  }
});

test('the in-route C9 stop pauses the same flight, installs its recovered emitter and continues at stage 7 without granting charges', t => {
  const h = harness(t, {unlocked: 1}); h.api.prepare(); h.api.collectModule(); h.reachStage(6);
  assert.equal(h.snapshot().route.stageNumber, 6);
  assert.equal(h.snapshot().equipment.recoveredTwin, true);
  h.recoverStageQuota();
  const remaining = h.snapshot().route.stageDuration - h.snapshot().route.stageElapsed;
  h.advance(remaining - .3); assert.equal(h.api.fireManualShot(), true);
  h.advance(.35); const docked = h.snapshot();
  assert.equal(docked.state, 'paused'); assert.equal(docked.route.waitingFor, 'service');
  assert.equal(docked.route.stageNumber, 6); assert.ok(h.node('flightDock').classList.contains('show'));
  assert.equal(h.api.fireManualShot(), false, 'Docking cannot emit a combat projectile');
  const route = docked.route, ammunition = docked.weapons;
  h.advance(30); assert.deepEqual(h.snapshot().route, route);
  assert.deepEqual(h.snapshot().weapons, ammunition);
  h.api.resumeGame();
  assert.equal(h.snapshot().state, 'paused', 'The ordinary resume action must not bypass the service interaction');
  assert.deepEqual(h.snapshot().route, route);
  h.node('flightInstallTwin').click();
  assert.equal(h.equipment().selected, 'twin');
  assert.deepEqual(h.equipment().unlocked, ['pulse', 'twin']);
  const equipped = h.snapshot().weapons;
  assert.equal(equipped.charges, ammunition.charges);
  assert.equal(equipped.recharge, ammunition.recharge);
  assert.equal(equipped.cooldown, ammunition.cooldown);
  h.node('flightDockContinue').click(); const continued = h.snapshot();
  assert.equal(continued.state, 'playing'); assert.equal(continued.currentLevel, 0);
  assert.equal(continued.route.stageNumber, 7); assert.equal(continued.route.stageElapsed, 0);
  assert.equal(continued.route.waitingFor, null);
  assert.equal(h.node('flightDock').classList.contains('show'), false);
  assert.equal(continued.weapons.selected, 'twin');
  assert.equal(continued.weapons.charges, ammunition.charges);
  assert.equal(continued.weapons.recharge, ammunition.recharge);
  assert.equal(continued.weapons.cooldown, ammunition.cooldown);
  assert.equal(continued.events.filter(event => event.type === 'service').length, 1);
  assert.equal(continued.events.filter(event => event.type === 'service-complete').length, 1);
  assert.equal(h.voyage().checkpoint.stageNumber, 7);
  assert.equal(h.voyage().entry.collected, 18);
  assert.equal(continued.unlocked, 1);
  assert.equal(h.pending.size, 1);
});

test('the archived N-7 mode neither loads nor modifies the new Chronos voyage record', t => {
  const h = harness(t); h.api.prepare(); h.reachStage(2);
  const raw = h.stored(VOYAGE_KEY);
  const archived = harness(t, {campaign: 'n7', savedVoyage: raw}); archived.api.prepare();
  assert.equal(archived.snapshot().route, null);
  archived.advance(3); archived.api.collectEnergy();
  archived.api.pauseGame(); archived.advance(3); archived.api.resumeGame(); archived.api.goHome();
  assert.equal(archived.stored(VOYAGE_KEY), raw);
  assert.equal(archived.stored('neon-n7-unlocked-v1'), '37');
  assert.equal(archived.stored('neon-n7-best-v1'), '2037');
  assert.equal(archived.pending.size, 1);
});

test('the ten-stage selector exposes only persisted unlocked entries and an actual launch replays the chosen checkpoint', t => {
  const h = harness(t, {unlocked: 1}); h.api.prepare(); h.reachStage(3);
  h.api.goHome(); h.api.prepareLevel(0);
  const buttons = [...h.node('chronosStageGrid').querySelectorAll('button[data-voyage-stage]')];
  assert.equal(buttons.length, 10);
  assert.deepEqual(buttons.map(button => button.dataset.voyageStage),
    Array.from({length: 10}, (_, index) => String(index + 1)));
  assert.deepEqual(buttons.map(button => button.disabled),
    [false, false, false, true, true, true, true, true, true, true]);
  assert.match(h.node('chronosStagesNote').textContent, /3\/10/);
  buttons[9].click();
  assert.equal(h.voyage().unlockedStage, 3, 'Clicking a locked stage cannot grant progression');
  buttons[1].click();
  assert.match(h.node('chronosStagesNote').textContent, /1\.2/);
  assert.equal(h.node('chronosStageGrid').querySelector('[data-voyage-stage="2"]').getAttribute('aria-pressed'), 'true');
  h.node('launch').click(); const replayed = h.snapshot();
  assert.equal(replayed.state, 'playing'); assert.equal(replayed.currentLevel, 0);
  assert.equal(replayed.route.stageNumber, 2); assert.equal(replayed.route.stageElapsed, 0);
  assert.equal(replayed.collected, 4);
  assert.equal(replayed.unlocked, 1); assert.equal(replayed.route.canFinish, false);
  assert.equal(h.pending.size, 1);
});

test('a malformed new voyage is backed up without inferring stages from old classic or N-7 progress', t => {
  const raw = '{incomplete chronos route';
  const h = harness(t, {unlocked: 7, savedVoyage: raw});
  assert.equal(h.stored(VOYAGE_KEY), raw);
  assert.deepEqual(JSON.parse(h.stored(VOYAGE_KEY + ':invalid-backups')), [raw]);
  h.api.prepare(); h.advance(.05);
  assert.equal(h.snapshot().route.stageNumber, 1);
  assert.equal(h.voyage().unlockedStage, 1);
  assert.deepEqual(JSON.parse(h.stored(VOYAGE_KEY + ':invalid-backups')), [raw]);
  assert.equal(h.stored('neon-unlocked-v2'), '7');
  assert.equal(h.stored('neon-n7-unlocked-v1'), '37');
  assert.equal(h.stored('neon-n7-best-v1'), '2037');
  assert.equal(h.pending.size, 1);
});

test('stage crossings retain live debris and genuine projectiles instead of resetting the scene', t => {
  const h=harness(t,{unlocked:1});h.api.prepare();h.recoverStageQuota();
  h.advance(35.98);h.api.seedTransitFixture();h.api.fireManualShot();
  const before=h.snapshot();assert.equal(before.route.stageNumber,1);
  assert.ok(before.weapons.projectiles.length>0);
  h.api.update(.034);const after=h.snapshot();
  assert.equal(after.route.stageNumber,2);
  assert.ok(after.targets.some(item=>item.id==='boundary-live-debris'));
  assert.ok(after.weapons.projectiles.length>0);
  assert.ok(after.weapons.projectiles[0].y<before.weapons.projectiles[0].y);
  assert.equal(h.voyage().checkpoint.stageNumber,2);assert.equal(h.pending.size,1);
});

test('actual Chronos runtime introduces an announced pursuer after rupture without N-7 metadata', t => {
  const h=harness(t,{unlocked:1});h.api.startLevel(0);
  for(let n=0;n<Math.ceil(12/.034);n++)h.api.update(.034);
  assert.equal(h.snapshot().targets.some(item=>item.tactics),false);
  for(let n=0;n<Math.ceil(9/.034);n++)h.api.update(.034);
  const q=h.snapshot(),raiders=q.targets.filter(item=>item.tactics==='classic-pursuit-v1');
  assert.ok(raiders.length>=1&&raiders.length<=1);
  assert.equal(raiders[0].role,'raider');
  assert.ok(q.events.some(event=>event.type==='rupture'));
  assert.ok(q.targets.some(item=>item.projectile)||raiders[0].fired>0,'Pursuit must emit an actual signalled shot');
  h.api.pauseGame();const paused=h.snapshot();h.advance(2,false);
  assert.deepEqual(h.snapshot().targets,paused.targets);assert.deepEqual(h.snapshot().route,paused.route);
  assert.equal(h.pending.size,1);
});

test('Gaia introduces a genuine CH-02 animator in a natural patrol sequence after CH-01',t=>{
  const h=harness(t,{unlocked:2});h.api.startLevel(1);
  for(let n=0;n<Math.ceil(17/.034);n++)h.api.update(.034);
  const q=h.snapshot(),interceptors=q.targets.filter(item=>item.role==='interceptor');
  assert.ok(interceptors.length>=1);
  assert.equal(interceptors[0].hp,3);
  assert.equal(interceptors[0].frame.image,'assets/ch02_interceptor_atlas_v1.webp');
  assert.equal(q.currentLevel,1);assert.equal(q.route,null);assert.equal(h.pending.size,1);
});

test('Chronos arrival enters Gaia through the actual next control without a duplicate briefing',t=>{
  const h=harness(t,{unlocked:1});h.api.prepare();
  for(let n=1;n<=10;n++)h.advanceStage({service:true});
  assert.equal(h.snapshot().state,'complete');assert.equal(h.snapshot().unlocked,2);
  assert.match(h.node('nextLevel').textContent,/GAIA NOVA/);
  h.node('nextLevel').click();
  const q=h.snapshot();assert.equal(q.state,'playing');assert.equal(q.currentLevel,1);
  assert.equal(h.node('briefing').classList.contains('show'),false);
  assert.equal(h.voyage().completed,true);assert.equal(h.pending.size,1);
});
