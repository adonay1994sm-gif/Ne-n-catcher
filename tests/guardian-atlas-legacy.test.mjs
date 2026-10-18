import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createChronosVoyageCheckpoint} from '../src/game/progression/chronos-flight.js';

const root = new URL('..', import.meta.url);
const [html, core, content, game] = await Promise.all(
  ['index.html', 'core-runtime.js', 'content-runtime.js', 'game.js']
    .map(file => readFile(new URL(file, root), 'utf8'))
);
const plain = value => JSON.parse(JSON.stringify(value));

/**
 * Controlled integration fixture, NOT a natural playthrough. It simulates real
 * collection callbacks and the existing update function. It suppresses unrelated
 * obstacles and pilots the ship in memory to isolate boss lifecycle/save rules.
 * The separate Chromium test never uses these mutations.
 */
function harness(t, campaign = '', {saved, savedSettings, storageEntries = [], failEquipmentWrite = false} = {}) {
  const dom = new JSDOM(html, {url: `https://neon.test/${campaign ? '?campaign=' + campaign : ''}`,
    runScripts: 'outside-only', pretendToBeVisual: true});
  t.after(() => dom.window.close());
  const {window} = dom;
  const gradient = {addColorStop() {}};
  const ctx = new Proxy({}, {get: (target, key) => key in target ? target[key]
    : key === 'createLinearGradient' || key === 'createRadialGradient' ? () => gradient
      : key === 'measureText' ? () => ({width: 20}) : () => {},
    set(target, key, value) { target[key] = value; return true; }});
  window.HTMLCanvasElement.prototype.getContext = () => ctx;
  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
  window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({
    x: 0, y: 0, left: 0, top: 0, right: 390, bottom: 844, width: 390, height: 844
  });
  window.Image = class {
    constructor() { this.complete = true; this.naturalWidth = this.naturalHeight = 1024; }
    set src(value) { this.path = value; }
  };
  const pending = new Map(); let id = 0;
  window.requestAnimationFrame = callback => (pending.set(++id, callback), id);
  window.cancelAnimationFrame = frame => pending.delete(frame);
  window.navigator.vibrate = () => true;
  window.localStorage.setItem('neon-unlocked-v2', '1');
  window.localStorage.setItem('neon-stars-v2', '{}');
  // Instrumented fixture starts at the already-reached final route checkpoint.
  // It still advances its remaining 36 seconds and collects the missing quota.
  window.localStorage.setItem('neonCatcher.chronosVoyage.v2', JSON.stringify({version: 2,
    checkpoint: createChronosVoyageCheckpoint(10), unlockedStage: 10, completed: false,
    entry: {hull: 100, score: 0, maxCombo: 1, collected: 32}}));
  window.localStorage.setItem('neon-n7-unlocked-v1', '37');
  window.localStorage.setItem('neon-n7-best-v1', '2037');
  for(const [key,value] of storageEntries)window.localStorage.setItem(key,value);
  if (saved !== undefined) window.localStorage.setItem('neonCatcher.flightEquipment.v1', saved);
  if (savedSettings !== undefined) window.localStorage.setItem('neon-settings-v5', savedSettings);
  const storageWrite = window.Storage.prototype.setItem;
  let equipmentWriteBlocked = failEquipmentWrite, salvageWriteBlocked = false;
  window.Storage.prototype.setItem = function(key, value) {
    if (equipmentWriteBlocked && key === 'neonCatcher.flightEquipment.v1') throw new Error('Fixture: equipment save interrupted');
    if (salvageWriteBlocked && key === 'neonCatcher.classicSalvage.v1') throw new Error('Fixture: missile save interrupted');
    return storageWrite.call(this, key, value);
  };
  window.eval(core); window.eval(content);
  const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
  assert.equal(game.split(marker).length, 2, 'Legacy bootstrap marker changed');
  const hook = `let atlasContactFixturePosition=null;
  function holdAtlasContactFixturePosition(){
    if(!atlasContactFixturePosition||!atlasBoss)return;
    // This one controlled contact fixture pins only the physical boss pose.
    // It isolates weapon/armor collision math, not moving-target accuracy or
    // difficulty; v6 movement is checked by the unpinned model tests.
    atlasBoss.x=atlasContactFixturePosition.x;atlasBoss.y=atlasContactFixturePosition.y;
    atlasBoss.targetY=atlasContactFixturePosition.y;
    atlasBoss.motionX=atlasBoss.x;atlasBoss.motionY=atlasBoss.y;
    atlasBoss.motionVx=0;atlasBoss.motionVy=0;atlasBoss.nextMotionAt=Infinity;
  }
  window.__ATLAS_LEGACY_TEST__ = {
    update, startLevel, pauseGame, resumeGame, goHome, completeLevel, damageShip, resumeReward,
    fireManualShot, firePhaser, fireAtlasPulse, fireClassicMissile,
    prepare(index=0) {
      startLevel(index); warpTimer=0; spawnTimer=999; classicScoutTimer=999;
      items=[]; gates=[];
    },
    prepareFresh(index=0) {
      if(index===0){classicVoyageRecord=null;classicVoyageRequestedStage=1;}
      startLevel(index);warpTimer=0;spawnTimer=999;classicScoutTimer=999;
      classicChapterStory?.skipIntro();classicChapterView=classicChapterStory?.snapshot()||null;
      items=[];gates=[];
    },
    collectEnergy() {
      energySpawned++;
      collectItem({type:'energy',x:player.x,y:player.y-30,r:22});
    },
    queueThresholdCollection() {
      const energy={type:'energy',x:player.x,y:player.y-30,r:22,s:0,rot:0,rs:0,p:0,phase:0,amp:0};
      items=[{...energy,x:60,y:-60},{...energy}];
      energySpawned+=2;
    },
    isolatedFrame(dt=1/60) {
      // This fixture isolates progression, not projectile avoidance or balance.
      items=[];gates=[];spawnTimer=999;classicScoutTimer=999;
      holdAtlasContactFixturePosition();
      if(atlasBoss){player.x=player.target=atlasBoss.x;}
      update(dt);
    },
    pinAtlasContactFixture(){
      if(!atlasBoss)throw new Error('Atlas must exist before isolating its physical pose');
      atlasContactFixturePosition={x:atlasBoss.x,y:atlasBoss.y};holdAtlasContactFixturePosition();
    },
    manualAtlasFrame(dt=1/60) {
      // Deliberately instrumented lifecycle fixture: suppress unrelated
      // obstacles and issue explicit manual triggers at the real core.
      // This is not a balance or natural-input certification.
      items=[];gates=[];spawnTimer=999;classicScoutTimer=999;
      if(atlasBoss){player.x=player.target=atlasBoss.x;
        if(atlasBoss.vulnerability)fireManualShot();}
      update(dt);
    },
    placeShip(x){player.x=player.target=x;},
    setSlow(seconds) { powers.slow=seconds; },
    pilotedAtlasFrame(dt=1/60) {
      // Keep the actual emitted curtains in the real collision/update loop.
      // This instrumented pilot reads visible projectile trajectories, never
      // a hidden/announced safe corridor. It isolates timing, not natural skill.
      const incoming=items.filter(item=>item.guardianProjectile && item.vy>0).map(item=>{
        const tail=Math.max(...SHIP_COLLISION_OUTLINE.map(point=>point[1]));
        const time=(player.y-item.y)/item.vy;
        return item.y-item.r<=player.y+tail && time<2 ?
          {x:item.x+item.vx*Math.max(0,time),r:item.r} : null;
      }).filter(Boolean);
      const lanes=[132,210,285,360,435,510,588];
      let best=360,clearance=-Infinity;
      for(const lane of lanes){
        const distance=incoming.length ? Math.min(...incoming.map(item=>Math.abs(item.x-lane)-item.r)) : 999-Math.abs(lane-360);
        if(distance>clearance){clearance=distance;best=lane;}
      }
      player.x=player.target=best;
      update(dt);
    },
    snapshot:()=>({state,hull,score,collected,ammo,manualShotCooldown,currentLevel,runToken,
      elapsed,unlocked:getUnlocked(),stars:getStars(),continued,autoFire:settings.autoFire,slow:powers.slow,
      flight:classicFlightView?{elapsed:classicFlightView.elapsed,stageElapsed:classicFlightView.stageElapsed,canFinish:classicFlightView.canFinish}:null,
      chapter:classicChapterView?JSON.parse(JSON.stringify(classicChapterView)):null,
      salvage:classicSalvageState?JSON.parse(JSON.stringify(classicSalvageState)):null,
      hullReserve:classicHullReserve,
      equipment:{...classicEquipment,unlocked:[...classicEquipment.unlocked]},
      player:{x:player.x,y:player.y,tail:Math.max(...SHIP_COLLISION_OUTLINE.map(point=>point[1]))},
      weapons:classicWeapons?NeonCampaign.classicWeaponSnapshot(classicWeapons):null,
      shots:shots.map(shot=>({kind:shot.kind,damage:shot.damage,atlasPulse:shot.atlasPulse,
        x1:shot.x1,x2:shot.x2,life:shot.life})),
      projectiles:items.filter(item=>item.guardianProjectile).map(item=>({
        id:item.projectileId,attackId:item.attackId,volley:item.volley,
        x:item.x,y:item.y,vx:item.vx,vy:item.vy,r:item.r,life:item.life})),
      boss:atlasBoss?JSON.parse(JSON.stringify(atlasBoss)):null})
  };\n`;
  window.eval(game.replace(marker, hook + marker));
  const api = window.__ATLAS_LEGACY_TEST__;
  const snapshot = () => plain(api.snapshot());
  function collectGoal() {
    while (snapshot().collected < 36) api.collectEnergy();
    for(let frame=0;frame<60*40&&!snapshot().boss;frame++)api.isolatedFrame(1/60);
    assert.ok(snapshot().boss, 'The fixture must reach route end plus quota before Atlas starts');
    assert.equal(snapshot().flight.elapsed,360);
    return snapshot();
  }
  // The twenty-round magazine remains finite outside Atlas. During Atlas,
  // basic fire is unlimited but still respects cadence; missiles stay finite.
  // This bounded lifecycle fixture does not certify natural balance.
  function until(predicate, maximum = 60 * 240, shoot = false) {
    for (let frame = 0; frame < maximum; frame++) {
      const q = snapshot(); if (predicate(q)) return q;
      assert.ok(q.state === 'playing' || q.state === 'destroying', `Unexpected fixture state ${q.state}`);
      if(shoot)api.manualAtlasFrame(1 / 60);else api.isolatedFrame(1 / 60);
    }
    assert.fail(`Fixture condition not reached: ${JSON.stringify(snapshot())}`);
  }
  return {window, api, pending, snapshot, collectGoal, until,
    setEquipmentWriteBlocked: value => { equipmentWriteBlocked = value; },
    setSalvageWriteBlocked: value => { salvageWriteBlocked = value; },
    stars: () => JSON.parse(window.localStorage.getItem('neon-stars-v2') || '{}')};
}

test('chapter one gates Atlas behind both recovered CRONIUM and the real route arrival', t => {
  const h = harness(t); h.api.prepare();
  assert.equal(h.snapshot().currentLevel,0);
  assert.equal(h.snapshot().flight.elapsed,324);
  assert.equal(h.snapshot().collected,32);
  for (let index = 0; index < 3; index++) h.api.collectEnergy();
  let q = h.snapshot();
  assert.equal(q.collected,35); assert.equal(q.boss,null); assert.equal(q.state,'playing');
  h.api.collectEnergy();q=h.snapshot();
  assert.equal(q.collected,36);assert.equal(q.boss,null,'Quota alone cannot skip the journey');
  h.api.completeLevel();assert.equal(h.snapshot().state,'playing');
  h.collectGoal();q=h.snapshot();
  assert.ok(q.boss);assert.equal(q.flight.canFinish,true);assert.equal(q.flight.elapsed,360);
  assert.equal(q.boss.state,'entry');assert.equal(q.boss.hp,96);assert.equal(q.boss.hp,q.boss.maxHp);
  assert.equal(q.unlocked,1);assert.deepEqual(h.stars(),{});
  const age=q.boss.age;
  h.api.completeLevel();h.api.completeLevel();q=h.snapshot();
  assert.equal(q.state,'playing');assert.equal(q.boss.age,age);
  assert.equal(q.unlocked,1);assert.deepEqual(h.stars(),{});
  assert.equal(h.pending.size,1,'The existing legacy RAF remains the only owner');
});

test('the actual legacy pause freezes Atlas and resume continues without a duplicate loop', t => {
  const h = harness(t); h.api.prepare(); h.collectGoal();
  h.until(q => q.boss.state === 'charge');
  h.api.pauseGame(); const before = h.snapshot();
  for (let frame = 0; frame < 120; frame++) h.api.update(1 / 60);
  const after = h.snapshot();
  assert.equal(after.state, 'paused'); assert.equal(after.elapsed, before.elapsed);
  assert.deepEqual(after.boss, before.boss); assert.equal(after.unlocked, 1);
  assert.deepEqual(after.weapons, before.weapons);
  assert.deepEqual(after.shots, before.shots);
  h.api.resumeGame(); h.api.isolatedFrame(1 / 60);
  assert.ok(h.snapshot().boss.age > before.boss.age);
  assert.equal(h.pending.size, 1);
});

test('the final quota capture and route arrival keep the actual collision loop safe', t => {
  const h=harness(t);h.api.prepare();
  for(let index=0;index<3;index++)h.api.collectEnergy();
  h.until(q=>q.flight.stageElapsed===36);
  assert.equal(h.snapshot().flight.canFinish,false);
  assert.equal(h.snapshot().collected,35);
  h.api.queueThresholdCollection();
  assert.doesNotThrow(()=>h.api.update(1/60));
  assert.doesNotThrow(()=>h.api.update(1/60));
  const q=h.snapshot();
  assert.equal(q.collected,36);assert.equal(q.state,'playing');assert.ok(q.boss);
  assert.equal(q.unlocked,1);assert.equal(h.pending.size,1);
});

test('Atlas deactivation completes before a single persisted victory and preserves N-7 saves', t => {
  const h = harness(t); h.api.prepare(); h.collectGoal();
  const terminal = h.until(q => q.boss?.disabled, 60 * 240, true);
  assert.equal(terminal.state, 'playing', 'Shutdown animation must finish before victory');
  assert.equal(terminal.unlocked, 1); assert.deepEqual(h.stars(), {});
  assert.deepEqual(terminal.equipment.unlocked, ['pulse'], 'The reward must wait for the authored terminal event');
  const resolved=h.until(q=>q.boss?.resolved);
  assert.equal(resolved.state,'playing');assert.equal(resolved.chapter.aftermathReady,false);
  h.api.completeLevel();h.api.completeLevel();
  assert.equal(h.snapshot().state,'playing','A direct call cannot bypass Iria and the real eight-second resolution');
  const finished = h.until(q => q.state === 'complete');
  assert.equal(finished.unlocked, 2); assert.ok(h.stars()['1'] >= 1);
  assert.equal(JSON.parse(h.window.localStorage.getItem('neonCatcher.chronosVoyage.v2')).completed,true);
  assert.ok(finished.equipment.unlocked.includes('twin'), 'Atlas grants the actual Gemelo reward');
  assert.equal(finished.equipment.unlocked.includes('lance'), false, 'Atlas does not grant every future weapon');
  const equipmentSave = h.window.localStorage.getItem('neonCatcher.flightEquipment.v1');
  const score = finished.score;
  const games = h.window.localStorage.getItem('neon-games-v2');
  const stars = h.window.localStorage.getItem('neon-stars-v2');
  h.api.completeLevel(); h.api.completeLevel();
  for (let frame = 0; frame < 120; frame++) h.api.update(1 / 60);
  assert.equal(h.snapshot().score, score);
  assert.equal(h.window.localStorage.getItem('neon-games-v2'), games);
  assert.equal(h.window.localStorage.getItem('neon-stars-v2'), stars);
  assert.equal(h.window.localStorage.getItem('neonCatcher.flightEquipment.v1'), equipmentSave,
    'Repeated completion cannot duplicate or reselect the weapon reward');
  assert.equal(h.window.localStorage.getItem('neon-n7-unlocked-v1'), '37');
  assert.equal(h.window.localStorage.getItem('neon-n7-best-v1'), '2037');
  assert.equal(h.pending.size, 1);
});

test('death, a rewarded continuation and retry cannot bypass or prematurely save Atlas', t => {
  const h = harness(t); h.api.prepare(); h.collectGoal();
  h.until(q => q.boss.state === 'exposed');
  const before = h.snapshot();
  h.api.damageShip(1000); h.until(q => q.state === 'gameover', 180);
  assert.equal(h.snapshot().unlocked, 1); assert.deepEqual(h.stars(), {});
  assert.equal(h.api.resumeReward(), true);
  const continued = h.snapshot();
  assert.equal(continued.state, 'playing'); assert.equal(continued.continued, true);
  assert.ok(continued.boss, 'Rewarded continuation must not lose the blocking encounter');
  assert.equal(continued.boss.hp, before.boss.hp);
  assert.equal(continued.collected, 36); assert.equal(continued.unlocked, 1);
  h.api.completeLevel(); assert.equal(h.snapshot().state, 'playing');
  h.api.prepareFresh(); const restarted = h.snapshot();
  assert.equal(restarted.boss, null); assert.equal(restarted.collected, 0);
  assert.equal(restarted.hull, 100); assert.equal(restarted.continued, false);
  assert.equal(restarted.unlocked, 1); assert.deepEqual(h.stars(), {});
  assert.equal(h.pending.size, 1);
});

test('twenty rounds refill in played time outside Atlas while only the boss permits unlimited basic fire', t => {
  const h=harness(t);h.api.prepare();
  assert.equal(h.window.document.getElementById('atlasAutoFire'),null);
  assert.equal(h.snapshot().autoFire,false);
  assert.equal(h.snapshot().boss,null);assert.equal(h.snapshot().weapons.unlimitedFire,false);
  let emitted=0;
  while(h.snapshot().ammo>0&&emitted<40){
    assert.equal(h.api.fireManualShot(),true,`Manual pulse ${emitted+1} was unavailable`);emitted++;
    if(h.snapshot().ammo>0)for(let frame=0;frame<20;frame++)h.api.isolatedFrame(1/60);
  }
  assert.ok(emitted>=20&&emitted<40,'Gradual recharge may contribute rounds during a finite burst');
  assert.equal(h.snapshot().state,'playing');assert.equal(h.snapshot().ammo,0);
  assert.equal(h.api.fireManualShot(),false);assert.equal(h.snapshot().weapons.shotSequence,emitted);
  assert.equal(h.window.document.getElementById('ammo').textContent,'');
  assert.doesNotMatch(h.window.document.getElementById('fire').getAttribute('aria-label'),/\d|segundos|cargas/i);
  const depleted=h.snapshot();h.api.pauseGame();
  for(let frame=0;frame<600;frame++)h.api.update(1/60);
  assert.deepEqual(h.snapshot().weapons,depleted.weapons,'Pause cannot refill the finite magazine');
  h.api.resumeGame();
  while(h.snapshot().weapons.recharge+1/60<h.snapshot().weapons.rechargeSeconds-1e-8)h.api.isolatedFrame(1/60);
  assert.equal(h.snapshot().ammo,0);assert.equal(h.api.fireManualShot(),false);
  h.api.isolatedFrame(1/60);assert.equal(h.snapshot().ammo,1);
  assert.equal(h.snapshot().weapons.shotSequence,emitted,'Recovery cannot silently fire');
  assert.equal(h.api.fireManualShot(),true);assert.equal(h.snapshot().ammo,0);
  assert.equal(h.snapshot().weapons.shotSequence,emitted+1);
  h.collectGoal();
  const bossMagazine=h.snapshot().weapons.charges,bossRecharge=h.snapshot().weapons.recharge;
  assert.equal(h.snapshot().weapons.unlimitedFire,true);
  for(let shot=0;shot<24;shot++){
    while(h.snapshot().weapons.cooldown>1e-9)h.api.isolatedFrame(1/60);
    assert.equal(h.api.fireManualShot(),true,`Unlimited basic pulse ${shot+1}`);
    for(let frame=0;frame<20;frame++)h.api.isolatedFrame(1/60);
  }
  assert.equal(h.snapshot().weapons.charges,bossMagazine,'Boss basic fire cannot consume or refill the stored magazine');
  assert.equal(h.snapshot().weapons.recharge,bossRecharge,'Unlimited boss fire preserves the exact finite-magazine recovery boundary');
  assert.equal(h.snapshot().salvage.missileAmmo,3,'Basic fire does not create or spend special missiles');
  h.api.prepareFresh();
  assert.equal(h.snapshot().weapons.unlimitedFire,false);
  assert.equal(h.snapshot().weapons.charges,20);
});

test('Atlas receives the advertised ×1, ×2 and ×3 damage only when physical projectiles reach its core', t => {
  for (const [selected, multiplier, bolts] of [['pulse', 1, 1], ['twin', 2, 2], ['lance', 3, 1]]) {
    const saved = JSON.stringify({version: 1, recoveredTwin: selected !== 'pulse',
      unlocked: selected === 'pulse' ? ['pulse'] : selected === 'twin' ? ['pulse', 'twin'] : ['pulse', 'twin', 'lance'],
      selected, ...(selected === 'lance' ? {lanceCalibrated: true} : {})});
    const h = harness(t, '', {saved}); h.api.prepare(); h.collectGoal();
    assert.equal(h.snapshot().autoFire, false);
    h.until(q => q.boss.state === 'exposed' && q.boss.vulnerability);
    h.api.pinAtlasContactFixture();
    const before = h.snapshot();
    assert.equal(before.weapons.damageMultiplier, multiplier);
    assert.equal(h.window.document.getElementById('flightWeaponDamage').textContent, `DAÑO ×${multiplier}`);
    assert.equal(h.window.document.getElementById('flightHud').classList.contains('hidden'), false);
    assert.equal(h.window.document.getElementById('flightRoute').classList.contains('hidden'), true);
    assert.equal(h.api.fireManualShot(), true);
    const fired = h.snapshot();
    assert.equal(fired.boss.hp, before.boss.hp, 'Damage must wait for the actual projectile impact');
    assert.equal(fired.shots.filter(shot => shot.atlasPulse).length, 0,
      'A physical trigger must not also create a homing ray');
    assert.equal(fired.weapons.projectiles.length, bolts);
    assert.equal(fired.weapons.projectiles.reduce((total, shot) => total + shot.damage, 0), multiplier);
    assert.equal(fired.weapons.charges, before.weapons.charges, 'Only basic boss fire is unlimited');
    assert.equal(fired.weapons.shotSequence, before.weapons.shotSequence + 1);
    for(const shot of fired.weapons.projectiles) {
      assert.ok(shot.vy<0);assert.ok(Math.abs(shot.vx)<1e-6);
    }
    assert.equal(h.api.fireManualShot(), false, 'A second same-frame trigger cannot duplicate the volley');
    const impact = h.until(q => q.boss.hp < before.boss.hp, 120);
    assert.equal(impact.boss.hp, before.boss.hp - multiplier);
    assert.equal(impact.shots.length, 0);
    assert.equal(impact.weapons.projectiles.length, selected==='lance'?1:0);
    if(selected==='lance') {
      assert.equal(impact.weapons.projectiles[0].pierce,1);
      assert.equal(impact.weapons.projectiles[0].hitTargets.length,1,
        'A piercing lance remembers Atlas so crossing its circle cannot apply damage twice');
    }
    for (let frame = 0; frame < 30; frame++) h.api.isolatedFrame(1 / 60);
    assert.equal(h.snapshot().boss.hp, impact.boss.hp, 'A completed projectile cannot apply its damage again');
    assert.equal(h.snapshot().weapons.shotSequence, fired.weapons.shotSequence);
    assert.equal(h.pending.size, 1);
  }
});

test('closed armor rejects physical fire and an exposed small core does not accept a wing hit', t => {
  const h=harness(t);h.api.prepare();h.collectGoal();
  h.until(q=>q.boss.state==='closed');
  h.api.pinAtlasContactFixture();
  const armored=h.snapshot();
  assert.equal(armored.boss.vulnerability,false);assert.equal(armored.boss.armorClosed,true);
  assert.ok(armored.boss.coreRadius<=42&&armored.boss.coreRadius<armored.boss.r);
  assert.equal(h.api.fireManualShot(),true);
  h.until(q=>q.weapons.projectiles.length===0,180);
  assert.equal(h.snapshot().boss.hp,armored.boss.hp,'Armored body contact cannot damage the hidden core');
  h.until(q=>q.boss.state==='exposed');
  const exposed=h.snapshot();
  assert.equal(exposed.boss.armorClosed,false);assert.equal(exposed.boss.coreExposure,1);
  h.api.placeShip(exposed.boss.x+exposed.boss.coreRadius+24);
  const offset=h.snapshot().player.x-exposed.boss.x;
  assert.ok(offset>exposed.boss.coreRadius+9&&offset<exposed.boss.r,
    'The test must target the illustrated outer body outside the actual core');
  assert.equal(h.api.fireManualShot(),true);
  h.until(q=>q.weapons.projectiles.length===0,180);
  assert.equal(h.snapshot().boss.hp,exposed.boss.hp,'A body-width shot cannot count as a core hit');
  assert.equal(h.pending.size,1);
});

test('three persistent special missiles deal eighteen damage and a failed debit cannot emit one', t => {
  const h=harness(t);h.api.prepare();
  assert.equal(h.snapshot().salvage.missileAmmo,3);
  const magazine=h.snapshot().weapons.charges;
  h.setSalvageWriteBlocked(true);
  assert.equal(h.api.fireClassicMissile(),false);
  assert.equal(h.snapshot().salvage.missileAmmo,3);
  assert.equal(h.snapshot().weapons.projectiles.filter(shot=>shot.missile).length,0);
  h.setSalvageWriteBlocked(false);
  for(let shot=0;shot<3;shot++){
    assert.equal(h.api.fireClassicMissile(),true);
    const q=h.snapshot(),latest=q.weapons.projectiles.filter(value=>value.missile).at(-1);
    assert.ok(latest);assert.equal(latest.damage,18);assert.ok(latest.vy<0);assert.ok(Math.abs(latest.vx)<1e-6);
    assert.equal(q.salvage.missileAmmo,2-shot);assert.equal(q.weapons.charges,magazine);
    assert.equal(h.api.fireClassicMissile(),false,'A same-frame trigger cannot debit or emit twice');
    for(let frame=0;frame<45;frame++)h.api.isolatedFrame(1/60);
  }
  assert.equal(h.api.fireClassicMissile(),false);
  const record=JSON.parse(h.window.localStorage.getItem('neonCatcher.classicSalvage.v1'));
  assert.equal(record.missileAmmo,0);assert.equal(record.missileShotsSpent,3);
  const restored=harness(t,'',{storageEntries:Object.entries(h.window.localStorage)});
  restored.api.prepare();
  assert.equal(restored.snapshot().salvage.missileAmmo,0,'Reloading or restarting cannot replenish spent specials');
  assert.equal(restored.api.fireClassicMissile(),false);
  assert.equal(restored.pending.size,1);
});

test('manual is the default and automatic fire is an explicit persistent setting outside the encounter', t => {
  const h=harness(t);h.api.prepare();h.collectGoal();
  assert.equal(h.snapshot().autoFire,false);
  assert.equal(h.window.document.getElementById('atlasAutoFire'),null);
  const setting=h.window.document.getElementById('autoFire');
  assert.ok(setting,'Settings retains the opt-in accessible automatic-fire choice');
  assert.equal(setting.checked,false);
  h.until(q=>q.boss.age>6);
  assert.equal(h.snapshot().weapons.shotSequence,0,'Waiting in front of the guardian must not fire automatically');
  assert.equal(h.snapshot().boss.hp,h.snapshot().boss.maxHp);
  setting.click();assert.equal(h.snapshot().autoFire,true);
  const savedSettings=h.window.localStorage.getItem('neon-settings-v5');
  assert.equal(JSON.parse(savedSettings).autoFire,true);
  const reloaded=harness(t,'',{savedSettings});
  assert.equal(reloaded.snapshot().autoFire,true);
  assert.equal(reloaded.window.document.getElementById('autoFire').checked,true);
  reloaded.window.document.getElementById('autoFire').click();
  assert.equal(reloaded.snapshot().autoFire,false);
  assert.equal(JSON.parse(reloaded.window.localStorage.getItem('neon-settings-v5')).autoFire,false);
});

test('a manual off-axis shot keeps its own trajectory and misses Atlas instead of homing or applying instant damage', t => {
  const h=harness(t);h.api.prepare();h.collectGoal();h.until(q=>q.boss.vulnerability);
  h.api.placeShip(h.snapshot().boss.x<360?601:119);const before=h.snapshot();
  assert.ok(Math.abs(before.player.x-before.boss.x)>115);
  assert.equal(h.api.fireManualShot(),true,'Firing is not disabled by an artificial boss-alignment gate');
  const fired=h.snapshot();assert.equal(fired.weapons.charges,before.weapons.charges);
  assert.equal(fired.boss.hp,before.boss.hp);assert.equal(fired.shots.length,0);
  assert.equal(fired.weapons.projectiles.length,1);
  const origin=fired.weapons.projectiles[0];
  for(let frame=0;frame<12;frame++)h.api.isolatedFrame(1/60);
  const travelling=h.snapshot();
  assert.ok(travelling.weapons.projectiles[0].y<origin.y-100);
  assert.ok(Math.abs(travelling.weapons.projectiles[0].x-origin.x)<1e-6,
    'Moving the ship back toward Atlas cannot steer an already fired projectile');
  for(let frame=0;frame<100;frame++)h.api.isolatedFrame(1/60);
  assert.equal(h.snapshot().boss.hp,before.boss.hp);
  assert.equal(h.snapshot().weapons.shotSequence,1);
});

test('an interrupted chapter-one Atlas reward replays before unlocking Gaia and is idempotent after reload', t => {
  const h=harness(t,'',{failEquipmentWrite:true});h.api.prepare();h.collectGoal();
  h.until(q=>q.boss?.disabled,60*240,true);
  h.until(q=>q.state==='complete');
  assert.equal(h.snapshot().unlocked,1,'Failed equipment persistence cannot unlock Gaia');
  assert.deepEqual(h.snapshot().equipment.unlocked,['pulse']);
  const journalKey='neon-unlocked-v2:completion-journal:v1';
  const pending=JSON.parse(h.window.localStorage.getItem(journalKey));
  assert.equal(pending.phase,'pending');assert.ok(pending.equipment.after.unlocked.includes('twin'));
  assert.equal(h.window.localStorage.getItem('neonCatcher.flightEquipment.v1'),null);
  const storageEntries=Object.entries(h.window.localStorage);
  const restored=harness(t,'',{storageEntries});
  assert.equal(restored.snapshot().unlocked,2);
  assert.ok(restored.snapshot().equipment.unlocked.includes('twin'));
  const receipt=JSON.parse(restored.window.localStorage.getItem(journalKey));
  assert.equal(receipt.phase,'committed');assert.equal(receipt.id,pending.id);
  const saved=Object.fromEntries(Object.entries(restored.window.localStorage));
  const again=harness(t,'',{storageEntries:Object.entries(saved)});
  assert.equal(again.snapshot().unlocked,2);
  assert.equal(again.window.localStorage.getItem('neonCatcher.flightEquipment.v1'),saved['neonCatcher.flightEquipment.v1']);
  assert.equal(again.window.localStorage.getItem(journalKey),saved[journalKey]);
  assert.equal(again.window.localStorage.getItem('neon-n7-unlocked-v1'),'37');
  assert.equal(again.window.localStorage.getItem('neon-n7-best-v1'),'2037');
  assert.equal(again.pending.size,1);
});

test('a corrupt equipment record with a durable backup can receive the Atlas reward without losing its original data', t => {
  const corrupt='{interrupted equipment record';
  const h=harness(t,'',{saved:corrupt});
  const equipmentKey='neonCatcher.flightEquipment.v1',backupKey=equipmentKey+':invalid-backups';
  assert.equal(h.window.localStorage.getItem(equipmentKey),corrupt,
    'Boot must preserve the damaged record until its recovery is needed');
  assert.deepEqual(JSON.parse(h.window.localStorage.getItem(backupKey)),[corrupt]);
  h.api.prepare();h.collectGoal();
  h.until(q=>q.boss?.disabled,60*240,true);
  assert.equal(h.snapshot().unlocked,1);
  assert.equal(h.window.localStorage.getItem(equipmentKey),corrupt,
    'The protected terminal animation must not grant or replace equipment early');
  const victory=h.until(q=>q.state==='complete');
  assert.equal(victory.unlocked,2);
  assert.ok(victory.equipment.unlocked.includes('twin'));
  const saved=JSON.parse(h.window.localStorage.getItem(equipmentKey));
  assert.equal(saved.version,1);assert.ok(saved.unlocked.includes('twin'));
  assert.deepEqual(JSON.parse(h.window.localStorage.getItem(backupKey)),[corrupt],
    'Recovery must retain the exact original damaged record, once');
  const receipt=JSON.parse(h.window.localStorage.getItem('neon-unlocked-v2:completion-journal:v1'));
  assert.equal(receipt.phase,'committed');
  assert.deepEqual(JSON.parse(receipt.equipment.before).unlocked,['pulse'],
    'The journal compares against a valid recovery baseline, not an invented pre-awarded weapon');
  assert.ok(receipt.equipment.after.unlocked.includes('twin'));
  assert.equal(h.window.localStorage.getItem('neon-n7-unlocked-v1'),'37');
  assert.equal(h.window.localStorage.getItem('neon-n7-best-v1'),'2037');
  assert.equal(h.pending.size,1);
});

test('leaving the encounter does not mutate saves and N-7 cannot start classic Atlas', t => {
  const h = harness(t); h.api.prepare(); h.collectGoal(); h.api.goHome();
  assert.equal(h.snapshot().state, 'menu'); assert.equal(h.snapshot().unlocked, 1);
  assert.deepEqual(h.stars(), {});
  const n7 = harness(t, 'n7'); n7.api.prepare(1);
  assert.equal(n7.snapshot().boss, null);
  assert.equal(n7.window.localStorage.getItem('neon-unlocked-v2'), '1');
  assert.equal(n7.pending.size, 1);
});

test('Gaia remains playable without spawning a second copy of the chapter-one guardian', t => {
  const h=harness(t,'',{storageEntries:[['neon-unlocked-v2','2']]});h.api.prepare(1);
  assert.equal(h.snapshot().currentLevel,1);assert.equal(h.snapshot().boss,null);
  assert.equal(h.snapshot().weapons.unlimitedFire,false);
  for(let index=0;index<45;index++)h.api.collectEnergy();
  assert.equal(h.snapshot().boss,null,'Gaia completion must not duplicate Atlas after its frontier resolution');
  assert.equal(h.snapshot().state,'complete');assert.equal(h.snapshot().unlocked,3);
  assert.equal(h.window.localStorage.getItem('neon-n7-unlocked-v1'),'37');
  assert.equal(h.pending.size,1);
});

test('slow time shares the real Atlas and projectile clock before firing another aimed pattern', t => {
  const h = harness(t); h.api.prepare(); h.collectGoal();
  h.until(q => q.boss.phase === 2, 60 * 240, true);
  h.api.setSlow(120);
  const initial = h.snapshot();
  for (let frame = 0; frame < 60; frame++) h.api.pilotedAtlasFrame(1 / 60);
  const oneSecond = h.snapshot();
  assert.ok(Math.abs(oneSecond.elapsed - initial.elapsed - 1) < 1e-8);
  assert.ok(Math.abs(oneSecond.boss.age - initial.boss.age - .5) < 1e-8,
    'The existing slow ability must slow the encounter clock as well as its bullets');

  let firstAttack = null, nextWarning = null, measuredBulletStep = false;
  const volleys = new Set(), emittedIds = new Set(), clearedIds = new Set(), vanished = [];
  for (let frame = 0; frame < 60 * 35 && !nextWarning; frame++) {
    const before = h.snapshot();
    h.api.pilotedAtlasFrame(1 / 60);
    const after = h.snapshot();
    assert.equal(after.state, 'playing', 'The instrumented visible-projectile pilot must retain a usable response');
    for (const bullet of after.projectiles) {
      if (firstAttack === null) firstAttack = bullet.attackId;
      if (bullet.attackId === firstAttack) {
        volleys.add(bullet.volley);emittedIds.add(bullet.id);
        if(bullet.y-bullet.r>after.player.y+after.player.tail)clearedIds.add(bullet.id);
      }
      const earlier = before.projectiles.find(item => item.id === bullet.id);
      if (earlier) {
        assert.ok(Math.abs(bullet.y - earlier.y - bullet.vy / 120) < 1e-8,
          'The real emitted salvo uses the same half-speed clock');
        measuredBulletStep = true;
      }
    }
    for(const bullet of before.projectiles.filter(item=>item.attackId===firstAttack)) {
      if(!after.projectiles.some(item=>item.id===bullet.id))vanished.push({bullet,hullBefore:before.hull,hullAfter:after.hull,player:after.player,bossAge:after.boss.age});
    }
    if (firstAttack !== null && after.boss.state === 'charge' && after.boss.attackId > firstAttack) {
      nextWarning = after;
    }
  }
  assert.ok(measuredBulletStep, 'The test must observe actual projectile movement');
  assert.deepEqual([...volleys].sort(), [0, 1], 'Both real phase-two salvos must be emitted');
  assert.ok(nextWarning, 'The encounter must progress to its next attack preparation under slow time');
  assert.ok(emittedIds.size>0);
  assert.deepEqual([...clearedIds].sort(),[...emittedIds].sort(),
    `Every actual previous projectile must be observed passing the full tail before another pattern is prepared; vanished=${JSON.stringify(vanished)}`);
  assert.equal(h.pending.size, 1);
});
