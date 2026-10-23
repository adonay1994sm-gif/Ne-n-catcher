import test from 'node:test';
import assert from 'node:assert/strict';
import {HORDE_RULES, createHordeWave} from '../src/game/combat/horde.js';

// Plan F3b, tarea 8: hordas de CH-01 en V que cruzan sin detenerse.
test('a horde wave is a V of the requested size', () => {
  const units = createHordeWave({size: 5, width: 720, seed: 3});
  assert.equal(units.length, 5);
  const leader = units[0];
  for (const unit of units.slice(1)) assert.ok(unit.y < leader.y, 'the wings trail behind the leader');
  assert.ok(units.every(unit => unit.y < 0), 'it enters from above');
});

test('a horde always leaves room to pass', () => {
  for (const seed of [1, 2, 3, 4]) for (const size of [3, 5, 7]) {
    const units = createHordeWave({size, width: 720, seed});
    for (let t = 0; t < 6; t += .1) {
      const at = units.map(unit => ({x: unit.x + unit.vx * t, y: unit.y + unit.vy * t}));
      for (let a = 0; a < at.length; a++) for (let b = a + 1; b < at.length; b++) {
        if (Math.abs(at[a].y - at[b].y) < 60) assert.ok(Math.abs(at[a].x - at[b].x) >= 160, `seed ${seed} size ${size}`);
      }
    }
  }
});

test('horde units never stop and cross diagonally', () => {
  for (const seed of [1, 2]) {
    const units = createHordeWave({size: 5, width: 720, seed});
    for (const unit of units) {
      assert.ok(unit.vy > 0);
      assert.ok(unit.vx !== 0);
      assert.ok(Math.abs(Math.hypot(unit.vx, unit.vy) - HORDE_RULES.speed) < 1e-9);
    }
  }
});
