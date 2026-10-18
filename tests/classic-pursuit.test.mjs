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
  for (let index = 0; index < 35; index++) {
    step(item, player, shots);
    assert.equal(shots.length, 0, 'no shot before the .72 second warning');
    assert.deepEqual(item.classicScout.lockedTarget, lock, 'aim does not follow later input');
  }
  until(item, player, () => shots.length > 0, shots);
  assert.ok(shots[0].at - chargedAt >= .72);
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
  assert.equal(item.classicScout.state, 'break-away');
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
    assert.equal(item.classicScout.state, 'break-away');
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

test('roles produce distinct tracking decisions with bounded velocity and deterministic replay', () => {
  const player = {x: 530, y: 1100};
  const results = {};
  for (const role of ['raider', 'scout', 'interceptor']) {
    const item = enemyAt({x: 190, role}), replay = enemyAt({x: 190, role});
    for (let frame = 0; frame < 70; frame++) {
      step(item, player, []); step(replay, player, []);
      assert.equal(item.x, replay.x);
      assert.equal(item.classicScout.state, replay.classicScout.state);
      assert.ok(Math.abs(item.classicScout.vx) <= 148 + 1e-8);
    }
    results[role] = item.classicScout.targetX;
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
      assert.ok(Number.isFinite(item.s) && item.s > 0);
    }
    assert.ok(shots.length > 0, `${role}/${seed} presents an actual attack`);
    assert.ok(shots.length <= (role === 'raider' ? 3 : 2));
    assert.equal(new Set(shots.map(shot => shot.attackSerial)).size, shots.length);
    for (const shot of shots) {
      totalShots++;
      assert.ok(shot.y <= player.y - 230 + 1e-8, 'minimum reaction distance');
      assert.ok(shot.y >= 135 + 38, 'weapon is visible below the HUD');
      assert.ok(shot.at - charges.get(shot.attackSerial) >= .72 - 1e-8);
      // Even the minimum vertical spacing permits a 180 px/s player to clear
      // a 38+9px combined collision radius before this non-homing shot arrives.
      const travelTime = (player.y - shot.y) / shot.vy;
      assert.ok(travelTime * 180 > 47 * 2, 'an announced attack has room for an evasive response');
      assert.ok(shot.damage >= 12 && shot.damage <= 14);
    }
  }
  assert.ok(totalShots >= 100);
});
