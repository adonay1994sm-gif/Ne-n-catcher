import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from '/workspace/Ne-n-catcher/node_modules/jsdom/lib/api.js';

const repository = new URL('file:///workspace/Ne-n-catcher/');
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
  destructionAsset = 'loaded', rects = {}, unlocked = 2, savedVoyage, randomSeed = 0} = {}) {
  const dom = new JSDOM(html, {url: `https://neon.test/${campaign ? '?campaign=' + campaign : ''}`,
    runScripts: 'outside-only', pretendToBeVisual: true});
  const {window} = dom; t.after(() => window.close());
  let randomState=randomSeed>>>0; window.Math.random=()=>{randomState=(randomState+0x6d2b79f5)|0;let v=Math.imul(randomState^(randomState>>>15),1|randomState);v^=v+Math.imul(v^(v>>>7),61|v);return ((v^(v>>>14))>>>0)/4294967296;};
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
    const patrolSpawnsForTest=[];
    const originalPatrolForTest=spawnClassicFlightPatrol;
    spawnClassicFlightPatrol=function(...args){const item=originalPatrolForTest(...args);patrolSpawnsForTest.push({requested:args[0],elapsed,role:item?.classicScout?.role,id:item?.id,frame:item?.classicScout?.animator.getFrame()});return item;};
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
      snapshot:()=>({patrolSpawns:patrolSpawnsForTest,state,elapsed,score,hull,ammo,collected,currentLevel,W,H,unlocked:getUnlocked(),
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


const results=[];
for(let seed=0;seed<120;seed++){
 const cleanup=[];const h=harness({after(fn){cleanup.push(fn);}},{unlocked:2,randomSeed:seed});h.api.startLevel(1);
 const seen=[];let prior='';
 for(let n=0;n<Math.ceil(17/.034);n++){h.api.update(.034);const q=h.snapshot();const ids=q.targets.filter(i=>i.role).map(i=>i.id);if(ids.join(',')!==prior){seen.push({elapsed:q.elapsed,state:q.state,hull:q.hull,ids,roles:q.targets.filter(i=>i.role).map(i=>i.role)});prior=ids.join(',');}}
 const q=h.snapshot();const passed=q.targets.some(i=>i.role==='interceptor');
 const result={seed,passed,state:q.state,hull:q.hull,elapsed:q.elapsed,patrolSpawns:q.patrolSpawns,seen,targets:q.targets};results.push(result);
 for(const fn of cleanup)fn();
 if(!passed){console.log(JSON.stringify(result));break;}
}
await (await import('node:fs/promises')).writeFile('/tmp/neon-patrol-ci-investigation-20261018/seed-diagnosis.json',JSON.stringify(results,null,2));
console.log(JSON.stringify({runs:results.length,failed:results.filter(r=>!r.passed).map(r=>r.seed)}));
