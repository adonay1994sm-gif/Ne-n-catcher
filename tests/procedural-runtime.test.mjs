import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {generateLevel, GENERATOR_VERSION, PLAYFIELD} from '../src/game/progression/generator.js';
import {AUTHORED_LEVELS} from '../src/game/progression/level-designs.js';
import {EncounterDirector, makeLegacyEntity, advanceEnemy} from '../src/game/progression/encounter-director.js';

test('100 authored routes have distinct names and explicit objectives and rhythms', () => {
  assert.equal(new Set(AUTHORED_LEVELS.map(level => level.title)).size, 100);
  for (const level of AUTHORED_LEVELS) {
    assert.ok(level.mission.length > 20);
    assert.ok(level.rhythm.length >= 3);
    assert.ok(level.goal > 0 && level.waveCount >= 6);
  }
});

test('wave generation never reads nondeterministic entropy', () => {
  const random = Math.random;
  const now = Date.now;
  Math.random = Date.now = () => { throw new Error('Forbidden entropy source'); };
  try {
    for (let level = 1; level <= 100; level++) {
      const first = generateLevel(level);
      assert.deepEqual(first, generateLevel(level));
      assert.equal(first.version, GENERATOR_VERSION);
    }
  } finally { Math.random = random; Date.now = now; }
});

test('reproduction accepts explicit uint32 seed and rejects unknown generator version', () => {
  const plan = generateLevel(37, {seed: 7});
  assert.equal(plan.seed, 7);
  assert.deepEqual(plan, generateLevel(37, {seed: 7, version: plan.version}));
  assert.notDeepEqual(plan.waves, generateLevel(37, {seed: 8}).waves);
  assert.throws(() => generateLevel(37, {seed: -1}), RangeError);
  assert.throws(() => generateLevel(37, {version: 'unknown'}), RangeError);
});

test('level 37 retains its versioned reproduction fixture', () => {
  const plan = generateLevel(37);
  assert.equal(plan.seed, 1467968345);
  assert.equal(createHash('sha256').update(JSON.stringify(plan)).digest('hex'),
    '68b34e922f836f91b6244ded89da91c5c476811cadb2808ef68a11613eb03a14');
});

test('100 levels reserve a continuous corridor wider than the real ship', () => {
  for (let level = 1; level <= 100; level++) {
    const plan = generateLevel(level);
    assert.equal(plan.corridor.width, 2 * (PLAYFIELD.shipHalfWidth + PLAYFIELD.safetyMargin));
    assert.ok(plan.corridor.left > 0 && plan.corridor.right < PLAYFIELD.width);
    for (const wave of plan.waves) for (const enemy of wave.enemies) {
      assert.ok(enemy.bounds.min <= enemy.x && enemy.x <= enemy.bounds.max);
      assert.ok(enemy.bounds.max + enemy.radius <= plan.corridor.left ||
        enemy.bounds.min - enemy.radius >= plan.corridor.right);
      assert.ok(enemy.at >= wave.at && enemy.at < wave.at + 8.5);
    }
    assert.ok(plan.energyBudget >= plan.design.goal);
    assert.ok(plan.pickups.every(pickup => pickup.at < plan.duration));
  }
});

test('swept enemy movement and shooter projectiles preserve the refuge in every level', () => {
  const patterns = new Set();
  let projectiles = 0;
  for (let level = 1; level <= 100; level++) {
    const plan = generateLevel(level);
    for (const spec of plan.waves.flatMap(wave => wave.enemies)) {
      patterns.add(spec.type);
      const item = makeLegacyEntity({kind: 'enemy', data: spec}, plan);
      for (let step = 0; step < 180; step++) {
        item.y += item.s / 60;
        advanceEnemy(item, 1 / 60, {x: step % 60 < 30 ? 0 : 720, y: 1150}, shot => {
          projectiles++;
          assert.ok(shot.x + shot.r <= plan.corridor.left || shot.x - shot.r >= plan.corridor.right);
          assert.ok(shot.s > 0 && shot.damage > 0);
        });
        assert.ok(item.x + spec.radius <= plan.corridor.left + 1e-9 ||
          item.x - spec.radius >= plan.corridor.right - 1e-9);
      }
    }
  }
  assert.deepEqual([...patterns].sort(), ['chaser', 'linear', 'shooter', 'zigzag']);
  assert.ok(projectiles > 0);
});

test('director emits each entity once, replays after reset and bounds suspended deltas', () => {
  const director = new EncounterDirector(37);
  const trace = [];
  for (let i = 0; i < 6000; i++) director.advance(1 / 60, entity => trace.push(entity.id));
  assert.equal(director.finished, true);
  assert.equal(new Set(trace).size, director.events.length);
  assert.equal(trace.length, director.events.length);
  director.reset();
  const replay = [];
  for (let i = 0; i < 6000; i++) director.advance(1 / 60, entity => replay.push(entity.id));
  assert.deepEqual(replay, trace);
  director.reset();
  director.advance(500, () => assert.fail('No initial wave expected'));
  assert.equal(director.elapsed, .05);
  assert.throws(() => director.advance(NaN, () => {}), RangeError);
  assert.throws(() => director.advance(-1, () => {}), RangeError);
});

test('3200 level/seed combinations serialize reproducibly and preserve traversable corridors', () => {
  for (let level = 1; level <= 100; level++) {
    for (let sample = 0; sample < 32; sample++) {
      const seed = sample === 0 ? 0 : sample === 31 ? 0xffffffff : Math.imul(sample, 0x9e3779b9) >>> 0;
      const plan = generateLevel(level, {seed});
      assert.equal(JSON.stringify(plan), JSON.stringify(generateLevel(level, {seed})));
      const {left, right, center} = plan.corridor;
      assert.ok(center - PLAYFIELD.shipHalfWidth > left);
      assert.ok(center + PLAYFIELD.shipHalfWidth < right);
      const ids = new Set();
      for (const wave of plan.waves) for (const enemy of wave.enemies) {
        assert.ok(enemy.bounds.min <= enemy.bounds.max);
        assert.ok(enemy.bounds.min <= enemy.x && enemy.x <= enemy.bounds.max);
        assert.ok(enemy.bounds.max + enemy.radius <= left || enemy.bounds.min - enemy.radius >= right);
        assert.ok(enemy.at >= wave.at && enemy.at < wave.at + 8.5);
        assert.ok(enemy.telegraphSeconds >= .8);
        assert.ok(!ids.has(enemy.id)); ids.add(enemy.id);
      }
      assert.ok(plan.energyBudget >= plan.design.goal);
      for (const pickup of plan.pickups) {
        assert.ok(pickup.x > left && pickup.x < right);
        assert.ok(pickup.at >= 0 && pickup.at < plan.duration);
        assert.ok(!ids.has(pickup.id)); ids.add(pickup.id);
      }
    }
  }
});
