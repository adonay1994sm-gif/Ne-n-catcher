import test from 'node:test';
import assert from 'node:assert/strict';
import {createClassicPursuer, advanceClassicPursuer, CLASSIC_PURSUIT_VERSION} from '../src/game/combat/classic-pursuit.js';

const DT = .02;
function enemyAt({x = 360, y = -85, role = 'raider', seed = 0, width = 720, height = 1280,
  minAttackY = 135} = {}) {
  return {type: 'scout', x, y, s: 150, r: 38, hp: 2, maxHp: 2,
    classicScout: createClassicPursuer({x, role, seed, width, height, minAttackY})};
}
function step(item, player, shots, dt = DT) {
  item.y += item.s * dt;
  advanceClassicPursuer(item, dt, player, shot => shots.push({...shot, at: item.classicScout.age,
    target: item.classicScout.lockedTarget}));
}
function until(item, player, predicate, shots = [], maxFrames = 1000) {
  for (let index = 0; index < maxFrames && !predicate(); index++) step(item, player, shots);
  assert.ok(predicate(), 'expected encounter state reached in bounded time');
  return shots;
}

test('new pursuit keeps the legacy item contract and has no independent timer', () => {
  const item = enemyAt(), enemy = item.classicScout;
  assert.equal(enemy.tacticsVersion, CLASSIC_PURSUIT_VERSION);
  assert.equal(enemy.animator.getFrame().state, 'spawn');
  const frame = enemy.animator.getFrame();
  assert.ok(frame.rect.width > 0);
  assert.equal(enemy.stage, 'entry');
  const before = {age: enemy.age, x: item.x, y: item.y, s: item.s, frame: frame.frameIndex};
  advanceClassicPursuer(item, 0, {x: 360, y: 1080}, () => assert.fail('paused shot'));
  assert.deepEqual({age: enemy.age, x: item.x, y: item.y, s: item.s,
    frame: enemy.animator.getFrame().frameIndex}, before);
  assert.throws(() => createClassicPursuer({x: NaN}), /spawn/);
  assert.throws(() => createClassicPursuer({x: 360, role: 'boss'}), /spawn/);
  assert.throws(() => advanceClassicPursuer(item, -.01, {x: 360, y: 1080}, () => {}), /delta/);
});

test('charge fixes the observed aim and waits for a complete warning plus the animation fire event', () => {
  const item = enemyAt({x: 210}), player = {x: 510, y: 1080}, shots = [];
  until(item, player, () => item.classicScout.state === 'charge', shots);
  const chargedAt = item.classicScout.age, lock = item.classicScout.lockedTarget;
  assert.deepEqual(lock, {x: 510, y: 1080});
  player.x = 80;
  for (let index = 0; index < 40; index++) {
    step(item, player, shots);
    assert.equal(shots.length, 0, 'no shot before the .82 second warning');
    assert.deepEqual(item.classicScout.lockedTarget, lock, 'aim does not follow later input');
  }
  until(item, player, () => shots.length > 0, shots);
  assert.ok(shots[0].at - chargedAt >= .82);
  assert.ok(shots[0].vx > 0, 'shot travels toward the observed right-hand target, not the new left position');
  assert.ok(shots[0].vy > 0);
  assert.ok(Math.abs(Math.hypot(shots[0].vx, shots[0].vy) - 295) < 1e-8);
  assert.equal(shots[0].classicScoutProjectile, true);
  const velocity = {vx: shots[0].vx, vy: shots[0].vy};
  for (let index = 0; index < 20; index++) step(item, player, shots);
  assert.deepEqual({vx: shots[0].vx, vy: shots[0].vy}, velocity, 'there is no homing after launch');
  assert.equal(shots.filter(shot => shot.attackSerial === 1).length, 1, 'one emission for the animation');
});

test('damage cancels charging with real hurt frames and no hidden projectile or immediate retry', () => {
  const item = enemyAt(), player = {x: 360, y: 1080}, shots = [];
  until(item, player, () => item.classicScout.attackScheduled, shots);
  assert.equal(shots.length, 0);
  item.hp = 1;
  step(item, player, shots);
  assert.equal(item.classicScout.state, 'reposition');
  assert.equal(item.classicScout.animator.getFrame().state, 'hurt');
  assert.equal(item.classicScout.telegraph, 0);
  assert.equal(item.classicScout.lockedTarget, null);
  assert.equal(item.classicScout.attackScheduled, false);
  for (let index = 0; index < 45; index++) step(item, player, shots);
  assert.equal(shots.length, 0);
});

test('a close approach or a player crossing above the enemy cancels the locked attack', () => {
  for (const y of [280, 360, 120]) {
    const item = enemyAt({y: 180}), player = {x: 360, y: 1080}, shots = [];
    until(item, player, () => item.classicScout.state === 'charge', shots);
    player.y = y;
    step(item, player, shots);
    assert.equal(item.classicScout.state, 'reposition');
    for (let index = 0; index < 100; index++) step(item, player, shots);
    assert.equal(shots.length, 0, 'never fires from close range or behind the player');
  }
});

test('death stops attacks and plays the terminal produced animation', () => {
  const item = enemyAt(), player = {x: 360, y: 1080}, shots = [];
  until(item, player, () => item.classicScout.state === 'charge', shots);
  item.hp = 0;
  for (let index = 0; index < 80; index++) step(item, player, shots);
  assert.equal(shots.length, 0);
  assert.equal(item.classicScout.state, 'destroyed');
  assert.equal(item.classicScout.animator.getFrame().state, 'destroy');
  assert.equal(item.classicScout.animator.getFrame().done, true);
});

test('roles choose distinct interior repositioning lanes with bounded movement and deterministic replay', () => {
  const player = {x: 530, y: 1100}, results = {};
  for (const role of ['raider', 'scout', 'interceptor']) {
    const item = enemyAt({x: 190, role}), replay = enemyAt({x: 190, role});
    let frames = 0;
    while (item.classicScout.state !== 'reposition' && frames++ < 600) {
      step(item, player, []); step(replay, player, []);
      assert.equal(item.x, replay.x);
      assert.equal(item.y, replay.y);
      assert.equal(item.classicScout.state, replay.classicScout.state);
      assert.ok(Math.abs(item.classicScout.vx) <= 148 + 1e-8);
    }
    assert.equal(item.classicScout.state, 'reposition');
    results[role] = item.classicScout.targetX;
    assert.ok(results[role] >= item.classicScout.combatMinX);
    assert.ok(results[role] <= item.classicScout.combatMaxX);
  }
  assert.notEqual(results.scout, results.raider);
  assert.notEqual(results.interceptor, results.raider);
});

test('large resume deltas are capped rather than skipping an unobserved attack warning', () => {
  const item = enemyAt({y: 180}), player = {x: 360, y: 1080};
  const before = item.classicScout.age;
  advanceClassicPursuer(item, 10, player, () => assert.fail('resume cannot emit an instant attack'));
  assert.equal(item.classicScout.age - before, .05);
});

test('100 seeds across three roles keep readable, finite, bounded attacks and an evadeable trajectory', () => {
  let totalShots = 0;
  for (let seed = 0; seed < 100; seed++) {
    const role = ['raider', 'scout', 'interceptor'][seed % 3];
    const width = seed % 2 ? 720 : 390;
    const player = {x: width * (.22 + (seed % 6) * .1), y: 1080};
    const item = enemyAt({x: 52 + (seed * 83 % Math.floor(width - 104)), width, seed, role});
    const shots = [], charges = new Map();
    for (let frame = 0; frame < 1000 && item.y < 1240; frame++) {
      const previousX = item.x;
      step(item, player, shots);
      const enemy = item.classicScout;
      if (enemy.state === 'charge' && !charges.has(enemy.chargeSerial)) {
        charges.set(enemy.chargeSerial, enemy.chargeStartedAt);
      }
      assert.ok(item.x >= 52 && item.x <= width - 52);
      assert.ok(Math.abs(item.x - previousX) <= 148 * DT + 1e-8);
      assert.ok(Number.isFinite(item.s) && item.s >= -82 && item.s <= 202.5);
    }
    assert.ok(shots.length > 0, `${role}/${seed} presents an actual attack`);
    assert.ok(shots.length <= (role === 'interceptor' ? 4 : 3));
    assert.equal(new Set(shots.map(shot => shot.attackSerial)).size, shots.length);
    for (const shot of shots) {
      totalShots++;
      assert.ok(shot.y <= player.y - 230 + 1e-8, 'minimum reaction distance');
      assert.ok(shot.y >= 135 + 38, 'weapon is visible below the HUD');
      assert.ok(shot.at - charges.get(shot.attackSerial) >= .82 - 1e-8);
      // Even the minimum vertical spacing permits a 180 px/s player to clear
      // a 38+9px combined collision radius before this non-homing shot arrives.
      const travelTime = (player.y - shot.y) / shot.vy;
      assert.ok(travelTime * 180 > 47 * 2, 'an announced attack has room for an evasive response');
      assert.ok(shot.damage >= 12 && shot.damage <= 14);
    }
  }
  assert.ok(totalShots >= 100);
});


test('a surviving opponent brakes into a visible band and re-engages instead of merely crossing the screen', () => {
  for (const role of ['raider', 'scout', 'interceptor']) {
    const item = enemyAt({role}), player = {x: 360, y: 1080}, shots = [], held = [], states = new Set();
    for (let frame = 0; frame < 1300 && item.classicScout.state !== 'retreat'; frame++) {
      step(item, player, shots);
      const enemy = item.classicScout;
      states.add(enemy.state);
      if (enemy.combatStartedAt !== null && enemy.state !== 'retreat') {
        held.push({age: enemy.age, y: item.y, speed: item.s, x: item.x});
        assert.ok(item.y >= enemy.minAttackY, 'enemy remains visible below the HUD');
        assert.ok(item.y + 38 < player.y - 230, 'combat band leaves a reaction corridor');
        assert.ok(item.x >= enemy.combatMinX && item.x <= enemy.combatMaxX,
          'active opponent does not hide in the old inaccessible edge lane');
      }
    }
    for (const state of ['entry', 'brake', 'charge', 'fire', 'reposition', 'retreat']) {
      assert.ok(states.has(state), `${role} actually traverses ${state}`);
    }
    assert.ok(shots.length >= 3, `${role} completes repeated attacks with real animation events`);
    assert.ok(shots.at(-1).at - shots[0].at >= 6, 'multiple combat opportunities span several seconds');
    assert.ok(held.at(-1).age - held[0].age >= 7, 'the enemy persists as a fightable opponent');
    assert.ok(Math.max(...held.map(q => q.y)) - Math.min(...held.map(q => q.y)) < 45,
      'combat does not continue descending past the ship');
    assert.ok(held.some(q => Math.abs(q.speed) < 1), 'vertical velocity genuinely settles');
    assert.equal(item.hp, 2, 'persistence does not inflate HP');
    assert.ok(['attack-budget', 'time-limit'].includes(item.classicScout.retreatReason));
  }
});

test('height corrections use the existing speed field and never integrate Y twice', () => {
  const item = enemyAt(), player = {x: 360, y: 1080}, shots = [];
  until(item, player, () => item.classicScout.state === 'charge', shots);
  const y = item.y;
  advanceClassicPursuer(item, .02, player, shot => shots.push(shot));
  assert.equal(item.y, y, 'only the legacy caller owns positional Y integration');
  // A vertical player manoeuvre moves the legal combat band; the opponent
  // corrects gradually with negative speed rather than snapping to that band.
  player.y = 570;
  for (let frame = 0; frame < 50; frame++) step(item, player, shots);
  assert.ok(item.s < 0, 'the opponent can back up to keep a safe visible band');
  assert.ok(item.s >= -82);
  assert.ok(item.y < y && item.y > item.classicScout.minAttackY);
});

test('an interrupted opponent reloads and resumes the fight after hurt without becoming invulnerable', () => {
  const item = enemyAt(), player = {x: 360, y: 1080}, shots = [];
  until(item, player, () => item.classicScout.attackScheduled, shots);
  const interruptedSerial = item.classicScout.chargeSerial;
  item.hp = 1;
  step(item, player, shots);
  assert.equal(item.classicScout.state, 'reposition');
  assert.equal(item.classicScout.animator.getFrame().state, 'hurt');
  until(item, player, () => shots.length > 0, shots);
  assert.ok(shots[0].attackSerial > interruptedSerial);
  assert.equal(shots.filter(shot => shot.attackSerial === interruptedSerial).length, 0);
  assert.equal(item.hp, 1, 'the policy never heals or grants temporary HP');
  assert.equal(item.classicScout.animator.getFrame().hp, 1);
});

test('small widths preserve reachable fighting lanes, pause freezes the whole engagement, and retreat is bounded', () => {
  for (const width of [250, 320, 390, 720]) {
    for (const role of ['raider', 'scout', 'interceptor']) {
      const item = enemyAt({x: width * .25, width, role, height: 844, minAttackY: 115});
      const player = {x: width * .5, y: 720}, shots = [];
      until(item, player, () => item.classicScout.state === 'charge', shots);
      const enemy = item.classicScout;
      assert.ok(enemy.targetX >= enemy.combatMinX && enemy.targetX <= enemy.combatMaxX);
      const paused = {x: item.x, y: item.y, s: item.s, age: enemy.age, stateAge: enemy.stateAge,
        telegraph: enemy.telegraph, lock: enemy.lockedTarget, frame: enemy.animator.getFrame().frameIndex};
      for (let count = 0; count < 200; count++) advanceClassicPursuer(item, 0, player, () => assert.fail('paused emission'));
      assert.deepEqual({x: item.x, y: item.y, s: item.s, age: enemy.age, stateAge: enemy.stateAge,
        telegraph: enemy.telegraph, lock: enemy.lockedTarget, frame: enemy.animator.getFrame().frameIndex}, paused);
      until(item, player, () => enemy.state === 'retreat', shots, 1400);
      const atRetreat = enemy.age, fired = shots.length;
      until(item, player, () => item.y - item.r > 844, shots, 1000);
      assert.ok(enemy.age - atRetreat < 7, 'retirement exits through the legacy removal boundary');
      assert.equal(shots.length, fired, 'retreat is communicated by cessation of attacks');
      assert.ok(enemy.age < 32, 'a surviving opponent cannot hold a stage spawn slot forever');
    }
  }
});

test('a ship too close to the HUD cannot provoke an unavoidable shot or an endless stationary enemy', () => {
  const item = enemyAt({role: 'interceptor'}), player = {x: 360, y: 180}, shots = [];
  until(item, player, () => item.classicScout.state === 'retreat', shots, 1600);
  assert.equal(shots.length, 0);
  assert.equal(item.classicScout.retreatReason, 'time-limit');
  until(item, player, () => item.y - item.r > 1280, shots, 1200);
  assert.equal(shots.length, 0);
  assert.ok(item.classicScout.age < 35);
});
