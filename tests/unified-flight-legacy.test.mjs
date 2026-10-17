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
  destructionAsset = 'loaded'} = {}) {
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
  window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({x: 0, y: 0, left: 0, top: 0,
    width: 390, height: 844, right: 390, bottom: 844});
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
  window.localStorage.setItem('neon-unlocked-v2', '2');
  window.localStorage.setItem('neon-stars-v2', '{}');
  window.localStorage.setItem('neon-n7-unlocked-v1', '37');
  window.localStorage.setItem('neon-n7-best-v1', '2037');
  if (saved !== undefined) window.localStorage.setItem(EQUIPMENT_KEY, saved);
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
      update,render,background,startLevel,pauseGame,resumeGame,goHome,completeLevel,fireManualShot,
      prepare(index=0){startLevel(index);warpTimer=0;spawnTimer=999;classicScoutTimer=999;classicPatrolTimer=999;items=[];gates=[];},
      frame(dt=1/60,quiet=false){
        spawnTimer=999;classicScoutTimer=999;classicPatrolTimer=999;
        if(quiet){items=[];gates=[];}
        update(dt);
      },
      collectEnergy(){energySpawned++;collectItem({type:'energy',x:player.x,y:player.y-30,r:22});},
      collectModule(){collectItem({type:'flightModule',x:player.x,y:player.y-40,r:29});},
      seedModule(){items=[{type:'flightModule',x:player.x,y:player.y-65,r:29,s:0,rot:0,rs:0,p:0,phase:0,amp:0,alpha:1}];},
      seedTarget(){
        items=[{id:'fixture-target',type:'meteor',x:player.x,baseX:player.x,y:player.y-350,
          r:28,s:0,rot:0,rs:0,p:0,phase:0,amp:0,alpha:1,special:'',spriteKey:'meteorMedium',hp:2,maxHp:2,damage:20}];
      },
      snapshot:()=>({state,elapsed,score,hull,ammo,collected,currentLevel,W,H,unlocked:getUnlocked(),
        player:{...player},bounds:classicFlightBounds?{...classicFlightBounds}:null,input:{...classicFlightInput},
        weapons:classicWeapons?NeonCampaign.classicWeaponSnapshot(classicWeapons):null,
        route:classicFlight?.snapshot()||null,equipment:{...classicEquipment,unlocked:[...classicEquipment.unlocked]},
        destructionPose:classicFlightView?NeonCampaign.getChronosDestructionPose(classicFlightView):null,
        destructionAsset:{ready:spriteReady(SPRITES.chronosDestruction),failed:SPRITES.chronosDestruction._loadError},
        explosionCalls:explosionCallsForTest.map(args=>[...args]),
        equipmentWritable:classicEquipmentWritable,events:flightEventsForTest.map(event=>({...event})),
        targets:items.map(item=>({id:item.id,type:item.type,x:item.x,y:item.y,hp:item.hp})),
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
  return {window, api, snapshot, advance, pointer, touches, pending, drawCalls,
    clearDrawCalls: () => { drawCalls.length = 0; },
    setDestructionStatus: status => {
      const image = images.get(DESTRUCTION_PATH);
      assert.ok(image, 'The actual level loader must request the destruction atlas');
      configureDestructionImage(image, status);
    },
    node: id => window.document.getElementById(id),
    stored: key => window.localStorage.getItem(key),
    equipment: () => JSON.parse(window.localStorage.getItem(EQUIPMENT_KEY))};
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
  const h = harness(t); h.api.prepare(); h.api.seedTarget();
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

test('the first mission requires both recovered CRONIUM and a completed visible route', t => {
  const h = harness(t); h.api.prepare();
  for (let fragment = 0; fragment < 36; fragment++) h.api.collectEnergy();
  let q = h.snapshot();
  assert.equal(q.collected, 36); assert.equal(q.state, 'playing');
  assert.equal(q.route.canFinish, false); assert.equal(q.route.routeProgress, 0);
  assert.deepEqual(JSON.parse(h.stored('neon-stars-v2')), {});
  h.api.completeLevel(); assert.equal(h.snapshot().state, 'playing');
  const minimum = q.route.minDuration;
  h.advance(minimum - .1); q = h.snapshot();
  assert.equal(q.state, 'playing'); assert.equal(q.route.canFinish, false);
  assert.ok(q.route.routeProgress > .9 && q.route.routeProgress < 1);
  h.advance(.15); q = h.snapshot();
  assert.equal(q.state, 'complete'); assert.equal(q.route.canFinish, true);
  assert.equal(q.route.routeProgress, 1); assert.ok(JSON.parse(h.stored('neon-stars-v2'))['1'] >= 1);
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
  assert.equal(h.node('flightStage').textContent, h.snapshot().route.stageName,
    'A settled download must clear the transient loading label immediately');
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
  blocked.api.seedModule(); blocked.api.frame(1 / 60, false);
  assert.equal(blocked.snapshot().targets.filter(item => item.type === 'flightModule').length, 1,
    'The collision loop must retain a recoverable piece until its persistence succeeds');
  assert.equal(blocked.stored('neon-n7-unlocked-v1'), '37');
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
  assert.equal(fired.projectiles.length, 3);
  const middle = fired.projectiles.find(projectile => projectile.id.endsWith(':1'));
  assert.ok(middle, 'The real emitted three-way volley must contain its central projectile');
  closeTo(middle.targetY, locked.targetY, 'Projectile metadata preserves the actual warning line');
  const crossingX = middle.x + middle.vx * (locked.targetY - middle.y) / middle.vy;
  closeTo(crossingX, locked.targetX, 'The emitted projectile must cross the announced location');
  assert.ok(Math.abs(locked.targetY - fired.player.y) > 10, 'The fixture must actually move after the warning');
  assert.ok(locked.targetY > origin); assert.equal(h.pending.size, 1);
});
