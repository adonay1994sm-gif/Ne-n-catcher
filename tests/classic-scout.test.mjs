import test from 'node:test';
import assert from 'node:assert/strict';
import {createClassicScout, advanceClassicScout} from '../src/game/progression/classic-scout.js';

function scoutAt(x = 360) {
  return {type: 'scout', x, y: -70, s: 160, hp: 2, maxHp: 2,
    classicScout: createClassicScout({x, phase: 0, width: 720})};
}

test('classic CH-01 pauses with a zero delta and fires only after a visible approach', () => {
  const item = scoutAt();
  const shots = [];
  const player = {x: 360, y: 1030};
  for (let index = 0; index < 30; index++) {
    item.y += item.s * .034;
    advanceClassicScout(item, .034, player, shot => shots.push(shot));
  }
  const frozenAge = item.classicScout.age;
  const frozenX = item.x;
  advanceClassicScout(item, 0, player, shot => shots.push(shot));
  assert.equal(item.classicScout.age, frozenAge);
  assert.equal(item.x, frozenX);
  assert.equal(shots.length, 0);
  for (let index = 0; index < 124; index++) {
    item.y += item.s * .034;
    advanceClassicScout(item, .034, player, shot => shots.push(shot));
  }
  assert.ok(shots.length >= 1 && shots.length <= 2);
  for (const shot of shots) {
    assert.equal(shot.classicScoutProjectile, true);
    assert.equal(shot.x, shot.baseX);
    assert.equal(shot.s, 295);
    assert.ok(shot.y < player.y - 225, 'projectile has reaction distance');
  }
});

test('classic CH-01 hit interrupts a charged shot without inventing a projectile', () => {
  const item = scoutAt(400);
  const shots = [];
  const player = {x: 400, y: 1100};
  let charging = false;
  for (let index = 0; index < 60; index++) {
    item.y += item.s * .034;
    advanceClassicScout(item, .034, player, shot => shots.push(shot));
    if (item.classicScout.attackScheduled) { charging = true; break; }
  }
  assert.equal(charging, true);
  item.hp = 1;
  advanceClassicScout(item, .034, player, shot => shots.push(shot));
  assert.equal(shots.length, 0);
  assert.equal(item.classicScout.animator.getFrame().state, 'hurt');
  assert.equal(item.classicScout.attackScheduled, false);
  assert.ok(item.classicScout.nextFire > item.classicScout.age);
});

test('classic CH-01 stays inside the viewport and rejects invalid simulation deltas', () => {
  const item = scoutAt(55);
  const player = {x: 55, y: 1000};
  for (let index = 0; index < 200; index++) {
    item.y += item.s * .016;
    advanceClassicScout(item, .016, player, () => {});
    assert.ok(item.x >= 52 && item.x <= 668);
  }
  assert.throws(() => advanceClassicScout(item, -.01, player, () => {}), /delta/);
});
