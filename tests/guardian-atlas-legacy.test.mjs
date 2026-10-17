import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

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
function harness(t, campaign = '') {
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
  window.localStorage.setItem('neon-unlocked-v2', '2');
  window.localStorage.setItem('neon-stars-v2', '{"1":2}');
  window.localStorage.setItem('neon-n7-unlocked-v1', '37');
  window.localStorage.setItem('neon-n7-best-v1', '2037');
  window.eval(core); window.eval(content);
  const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
  assert.equal(game.split(marker).length, 2, 'Legacy bootstrap marker changed');
  const hook = `window.__ATLAS_LEGACY_TEST__ = {
    update, startLevel, pauseGame, resumeGame, goHome, completeLevel, damageShip, resumeReward,
    fireManualShot, firePhaser, fireAtlasPulse,
    prepare(index=1) {
      startLevel(index); warpTimer=0; spawnTimer=999; classicScoutTimer=999;
      items=[]; gates=[];
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
      if(atlasBoss){player.x=player.target=atlasBoss.x;}
      update(dt);
    },
    setSlow(seconds) { powers.slow=seconds; },
    pilotedAtlasFrame(dt=1/60) {
      // Keep the actual emitted curtains in the real collision/update loop.
      // The in-memory pilot follows the announced corridor to isolate timing.
      const corridor=atlasBoss?.telegraph?.safeGap || items.find(item=>
        item.guardianProjectile && item.safeGap && item.y<player.y+140)?.safeGap;
      player.x=player.target=corridor?.center ?? 360;
      update(dt);
    },
    snapshot:()=>({state,hull,score,collected,ammo,manualShotCooldown,currentLevel,runToken,
      elapsed,unlocked:getUnlocked(),stars:getStars(),continued,atlasAutoFire,slow:powers.slow,
      player:{x:player.x,y:player.y},
      weapons:classicWeapons?NeonCampaign.classicWeaponSnapshot(classicWeapons):null,
      projectiles:items.filter(item=>item.guardianProjectile).map(item=>({
        id:item.projectileId,attackId:item.attackId,volley:item.volley,
        x:item.x,y:item.y,vx:item.vx,vy:item.vy,r:item.r,life:item.life})),
      boss:atlasBoss?JSON.parse(JSON.stringify(atlasBoss)):null})
  };\n`;
  window.eval(game.replace(marker, hook + marker));
  const api = window.__ATLAS_LEGACY_TEST__;
  const snapshot = () => plain(api.snapshot());
  function collectGoal() {
    for (let index = 0; index < 45; index++) api.collectEnergy();
    return snapshot();
  }
  function until(predicate, maximum = 60 * 90) {
    for (let frame = 0; frame < maximum; frame++) {
      const q = snapshot(); if (predicate(q)) return q;
      assert.ok(q.state === 'playing' || q.state === 'destroying', `Unexpected fixture state ${q.state}`);
      api.isolatedFrame(1 / 60);
    }
    assert.fail(`Fixture condition not reached: ${JSON.stringify(snapshot())}`);
  }
  return {window, api, pending, snapshot, collectGoal, until,
    stars: () => JSON.parse(window.localStorage.getItem('neon-stars-v2') || '{}')};
}

test('Gaia keeps recovery meaningful and gates saved victory behind the real Atlas encounter', t => {
  const h = harness(t); h.api.prepare();
  for (let index = 0; index < 44; index++) h.api.collectEnergy();
  let q = h.snapshot();
  assert.equal(q.collected, 44); assert.equal(q.boss, null); assert.equal(q.state, 'playing');
  h.api.collectEnergy(); q = h.snapshot();
  assert.equal(q.collected, 45); assert.equal(q.state, 'playing');
  assert.ok(q.boss, 'The authored guardian should start at the recovery threshold');
  assert.equal(q.boss.state, 'entry'); assert.equal(q.boss.hp, q.boss.maxHp);
  assert.equal(q.unlocked, 2); assert.deepEqual(h.stars(), {'1': 2});
  const age = q.boss.age;
  h.api.completeLevel(); h.api.completeLevel(); q = h.snapshot();
  assert.equal(q.state, 'playing'); assert.equal(q.boss.age, age);
  assert.equal(q.unlocked, 2); assert.deepEqual(h.stars(), {'1': 2});
  assert.equal(h.pending.size, 1, 'The existing legacy RAF remains the only owner');
});

test('the actual legacy pause freezes Atlas and resume continues without a duplicate loop', t => {
  const h = harness(t); h.api.prepare(); h.collectGoal();
  h.until(q => q.boss.state === 'charge');
  h.api.pauseGame(); const before = h.snapshot();
  for (let frame = 0; frame < 120; frame++) h.api.update(1 / 60);
  const after = h.snapshot();
  assert.equal(after.state, 'paused'); assert.equal(after.elapsed, before.elapsed);
  assert.deepEqual(after.boss, before.boss); assert.equal(after.unlocked, 2);
  h.api.resumeGame(); h.api.isolatedFrame(1 / 60);
  assert.ok(h.snapshot().boss.age > before.boss.age);
  assert.equal(h.pending.size, 1);
});

test('the threshold capture can replace active items without crashing the real collision loop', t => {
  const h = harness(t); h.api.prepare();
  for (let index = 0; index < 44; index++) h.api.collectEnergy();
  h.api.queueThresholdCollection();
  assert.doesNotThrow(() => h.api.update(1 / 60));
  const q = h.snapshot();
  assert.equal(q.collected, 45); assert.equal(q.state, 'playing'); assert.ok(q.boss);
  assert.equal(q.unlocked, 2); assert.equal(h.pending.size, 1);
});

test('Atlas deactivation completes before a single persisted victory and preserves N-7 saves', t => {
  const h = harness(t); h.api.prepare(); h.collectGoal();
  const terminal = h.until(q => q.boss?.disabled);
  assert.equal(terminal.state, 'playing', 'Shutdown animation must finish before victory');
  assert.equal(terminal.unlocked, 2); assert.deepEqual(h.stars(), {'1': 2});
  const finished = h.until(q => q.state === 'complete');
  assert.equal(finished.unlocked, 3); assert.ok(h.stars()['2'] >= 1);
  const score = finished.score;
  const games = h.window.localStorage.getItem('neon-games-v2');
  const stars = h.window.localStorage.getItem('neon-stars-v2');
  h.api.completeLevel(); h.api.completeLevel();
  for (let frame = 0; frame < 120; frame++) h.api.update(1 / 60);
  assert.equal(h.snapshot().score, score);
  assert.equal(h.window.localStorage.getItem('neon-games-v2'), games);
  assert.equal(h.window.localStorage.getItem('neon-stars-v2'), stars);
  assert.equal(h.window.localStorage.getItem('neon-n7-unlocked-v1'), '37');
  assert.equal(h.window.localStorage.getItem('neon-n7-best-v1'), '2037');
  assert.equal(h.pending.size, 1);
});

test('death, a rewarded continuation and retry cannot bypass or prematurely save Atlas', t => {
  const h = harness(t); h.api.prepare(); h.collectGoal();
  h.until(q => q.boss.state === 'idle');
  const before = h.snapshot();
  h.api.damageShip(1000); h.until(q => q.state === 'gameover', 180);
  assert.equal(h.snapshot().unlocked, 2); assert.deepEqual(h.stars(), {'1': 2});
  assert.equal(h.api.resumeReward(), true);
  const continued = h.snapshot();
  assert.equal(continued.state, 'playing'); assert.equal(continued.continued, true);
  assert.ok(continued.boss, 'Rewarded continuation must not lose the blocking encounter');
  assert.equal(continued.boss.hp, before.boss.hp);
  assert.equal(continued.collected, 45); assert.equal(continued.unlocked, 2);
  h.api.completeLevel(); assert.equal(h.snapshot().state, 'playing');
  h.api.prepare(); const restarted = h.snapshot();
  assert.equal(restarted.boss, null); assert.equal(restarted.collected, 0);
  assert.equal(restarted.hull, 100); assert.equal(restarted.continued, false);
  assert.equal(restarted.unlocked, 2); assert.deepEqual(h.stars(), {'1': 2});
  assert.equal(h.pending.size, 1);
});

test('Gaia keeps its manual pulse and Chronos begins with three charges before recharging through played time', t => {
  const h = harness(t); h.api.prepare(); h.collectGoal();
  const toggle = h.window.document.getElementById('atlasAutoFire');
  assert.ok(toggle, 'The encounter must expose the automatic/manual fire choice');
  if (h.snapshot().atlasAutoFire) toggle.click();
  assert.equal(h.snapshot().atlasAutoFire, false);
  for (let shot = 0; shot < 6; shot++) {
    assert.equal(h.api.fireManualShot(), true, `Manual pulse ${shot + 1} was unavailable`);
    for (let frame = 0; frame < 20; frame++) h.api.isolatedFrame(1 / 60);
  }
  assert.equal(h.snapshot().state, 'playing');
  h.api.prepare(0);
  assert.equal(h.snapshot().ammo, 3); assert.equal(h.snapshot().boss, null);
  for (let shot = 0; shot < 3; shot++) {
    assert.equal(h.api.fireManualShot(), true);
    for (let frame = 0; frame < 20; frame++) h.api.isolatedFrame(1 / 60);
  }
  assert.equal(h.snapshot().ammo, 0); assert.equal(h.api.fireManualShot(), false);
  assert.equal(h.snapshot().weapons.shotSequence, 3);
  // Frame the actual legacy update, not a synthetic jump or a cooldown reset.
  // Immediately before 3.6 played seconds there is still no fourth charge.
  while (h.snapshot().weapons.recharge + 1 / 60 < 3.6 - 1e-8) h.api.isolatedFrame(1 / 60);
  const beforeRecharge = h.snapshot();
  assert.ok(beforeRecharge.weapons.recharge < 3.6);
  assert.equal(beforeRecharge.ammo, 0); assert.equal(h.api.fireManualShot(), false);
  h.api.isolatedFrame(1 / 60);
  const recharged = h.snapshot();
  assert.equal(recharged.ammo, 1);
  assert.equal(recharged.weapons.shotSequence, 3, 'Recharging cannot silently emit a shot');
  assert.equal(h.api.fireManualShot(), true);
  assert.equal(h.snapshot().ammo, 0); assert.equal(h.snapshot().weapons.shotSequence, 4);
});

test('leaving the encounter does not mutate saves and N-7 cannot start classic Atlas', t => {
  const h = harness(t); h.api.prepare(); h.collectGoal(); h.api.goHome();
  assert.equal(h.snapshot().state, 'menu'); assert.equal(h.snapshot().unlocked, 2);
  assert.deepEqual(h.stars(), {'1': 2});
  const n7 = harness(t, 'n7'); n7.api.prepare(1);
  assert.equal(n7.snapshot().boss, null);
  assert.equal(n7.window.localStorage.getItem('neon-unlocked-v2'), '2');
  assert.equal(n7.pending.size, 1);
});

test('slow time shares the real Atlas and projectile clock before announcing another corridor', t => {
  const h = harness(t); h.api.prepare(); h.collectGoal();
  h.until(q => q.boss.phase === 2);
  if (h.snapshot().atlasAutoFire) h.window.document.getElementById('atlasAutoFire').click();
  h.api.setSlow(120);
  const initial = h.snapshot();
  for (let frame = 0; frame < 60; frame++) h.api.pilotedAtlasFrame(1 / 60);
  const oneSecond = h.snapshot();
  assert.ok(Math.abs(oneSecond.elapsed - initial.elapsed - 1) < 1e-8);
  assert.ok(Math.abs(oneSecond.boss.age - initial.boss.age - .5) < 1e-8,
    'The existing slow ability must slow the encounter clock as well as its bullets');

  let firstAttack = null, nextWarning = null, measuredBulletStep = false;
  const volleys = new Set();
  for (let frame = 0; frame < 60 * 35 && !nextWarning; frame++) {
    const before = h.snapshot();
    h.api.pilotedAtlasFrame(1 / 60);
    const after = h.snapshot();
    assert.equal(after.state, 'playing', 'The announced corridor must remain usable');
    for (const bullet of after.projectiles) {
      if (firstAttack === null) firstAttack = bullet.attackId;
      if (bullet.attackId === firstAttack) volleys.add(bullet.volley);
      const earlier = before.projectiles.find(item => item.id === bullet.id);
      if (earlier) {
        assert.ok(Math.abs(bullet.y - earlier.y - bullet.vy / 120) < 1e-8,
          'The real emitted curtain uses the same half-speed clock');
        measuredBulletStep = true;
      }
    }
    if (firstAttack !== null && after.boss.state === 'charge' && after.boss.attackId > firstAttack) {
      nextWarning = after;
    }
  }
  assert.ok(measuredBulletStep, 'The test must observe actual projectile movement');
  assert.deepEqual([...volleys].sort(), [0, 1], 'Both real curtains must be emitted');
  assert.ok(nextWarning, 'The encounter must progress to its next warning under slow time');
  const previousCurtain = nextWarning.projectiles.filter(bullet => bullet.attackId === firstAttack);
  assert.ok(previousCurtain.length > 0, 'Do not replace the integration check by deleting old bullets');
  assert.ok(previousCurtain.every(bullet => bullet.y - bullet.r > nextWarning.player.y + 100),
    'A new escape corridor must wait until the slowed previous curtain has passed the full ship');
  assert.equal(h.pending.size, 1);
});
