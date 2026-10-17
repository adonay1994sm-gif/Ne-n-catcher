import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGuardianAtlas, advanceGuardianAtlas, hitGuardianAtlas,
  GUARDIAN_ATLAS_RULES} from '../src/game/combat/guardian-atlas.js';

const player = {x: 360, y: 1145};

function runFor(boss, seconds, pilot = player, events = []) {
  let remaining = seconds;
  while (remaining > 1e-8) {
    const delta = Math.min(1 / 60, remaining);
    events.push(...advanceGuardianAtlas(boss, delta, pilot));
    remaining -= delta;
  }
  return events;
}

function until(boss, predicate, pilot = player, events = []) {
  for (let frame = 0; frame < 120 * 60; frame++) {
    if (predicate(boss)) return events;
    events.push(...advanceGuardianAtlas(boss, 1 / 60, pilot));
  }
  throw new Error(`Condition not reached: state=${boss.state}, hp=${boss.hp}`);
}

function readyBoss(options) {
  const boss = createGuardianAtlas(options);
  until(boss, unit => unit.state === 'idle');
  return boss;
}

test('Guardian arrives visibly before fighting and does not accept damage during entry', () => {
  const boss = createGuardianAtlas();
  const initialY = boss.y;
  assert.equal(hitGuardianAtlas(boss, 5).accepted, false);
  const events = runFor(boss, 1);
  assert.ok(boss.y > initialY && boss.y < boss.targetY);
  assert.equal(events.some(event => event.type === 'projectile'), false);
  until(boss, unit => unit.state === 'idle', player, events);
  assert.equal(boss.y, boss.targetY);
  assert.equal(boss.hp, 36);
  assert.equal(boss.vulnerability, true);
  assert.equal(events.filter(event => event.type === 'arrival').length, 1);
});

test('zero delta freezes entry, warnings, hurt, fire and terminal animation exactly', () => {
  const boss = createGuardianAtlas();
  for (const desired of ['entry', 'idle', 'charge', 'fire']) {
    until(boss, unit => unit.state === desired);
    const before = structuredClone(boss);
    let calls = 0;
    assert.deepEqual(advanceGuardianAtlas(boss, 0, player, () => { calls++; }), []);
    assert.deepEqual(boss, before);
    assert.equal(calls, 0);
  }
  hitGuardianAtlas(boss, 1);
  assert.equal(boss.state, 'hurt');
  const hurt = structuredClone(boss);
  advanceGuardianAtlas(boss, 0, player);
  assert.deepEqual(boss, hurt);
  hitGuardianAtlas(boss, 100);
  const terminal = structuredClone(boss);
  advanceGuardianAtlas(boss, 0, player);
  assert.deepEqual(boss, terminal);
});

test('phase-one aim is announced, then fixed, with one salvo and no homing', () => {
  const boss = readyBoss();
  const events = until(boss, unit => unit.state === 'charge', {x: 170});
  const warning = events.find(event => event.type === 'warning');
  assert.equal(warning.kind, 'aimedSalvo');
  assert.equal(warning.targetX, 170);
  assert.ok(warning.seconds >= 1);
  assert.equal(hitGuardianAtlas(boss, 1).reason, 'armored');
  const shots = until(boss, unit => unit.state === 'fire', {x: 600});
  const emitted = shots.filter(event => event.type === 'projectile');
  assert.equal(emitted.length, 3);
  assert.equal(emitted[1].projectile.targetX, 170);
  const middle = emitted[1].projectile;
  const crossingX = middle.x + middle.vx * ((middle.targetY - middle.y) / middle.vy);
  assert.ok(Math.abs(crossingX - 170) < .00001);
  assert.ok(middle.vy > 0);
  assert.equal(middle.telegraphSeconds, warning.seconds);
  assert.ok((middle.targetY - middle.y) / middle.vy > 2);
  const attackId = middle.attackId;
  runFor(boss, .7, {x: 600}, shots);
  assert.equal(shots.filter(event => event.type === 'projectile' &&
    event.projectile.attackId === attackId).length, 3);
});

test('half-health causes a protected phase transition and a different attack pattern', () => {
  const boss = readyBoss();
  const result = hitGuardianAtlas(boss, 18);
  assert.equal(result.accepted, true);
  assert.equal(boss.phase, 2);
  assert.equal(boss.state, 'phaseBreak');
  assert.equal(boss.vulnerability, false);
  assert.equal(hitGuardianAtlas(boss, 1).accepted, false);
  assert.ok(result.events.some(event => event.type === 'phase' && event.clearProjectiles));
  const events = until(boss, unit => unit.state === 'charge');
  const warning = events.find(event => event.type === 'warning');
  assert.equal(warning.kind, 'openCorridor');
  assert.ok(warning.safeGap.right - warning.safeGap.left >= 250);
  until(boss, unit => unit.state === 'fire', player, events);
  runFor(boss, .64, player, events);
  const volleys = events.filter(event => event.type === 'volley');
  assert.equal(volleys.length, 2);
  assert.deepEqual(volleys.map(event => event.volley), [0, 1]);
  assert.equal(boss.state, 'idle');
  assert.equal(boss.vulnerability, true);
});

test('both phase-two curtains preserve one announced traversable corridor at three viewport widths', () => {
  for (const width of [320, 390, 720]) {
    for (const seed of [1, 17, 9001]) {
      const boss = readyBoss({width, height: 1180, playerY: 1045, seed});
      hitGuardianAtlas(boss, 18);
      const events = until(boss, unit => unit.state === 'charge', {x: width / 2});
      const gap = structuredClone(boss.telegraph.safeGap);
      until(boss, unit => unit.state === 'fire', {x: width - 30}, events);
      runFor(boss, .65, {x: 30}, events);
      const shots = events.filter(event => event.type === 'projectile').map(event => event.projectile);
      // A 250px full-wing corridor can leave just one firing side in a 320px
      // fixture. Keep both real volleys rather than narrowing the ship's gap.
      assert.ok(shots.length >= 2 && shots.length <= 14);
      assert.deepEqual([...new Set(shots.map(shot => shot.volley))], [0, 1]);
      assert.equal(new Set(shots.map(shot => shot.projectileId)).size, shots.length);
      assert.ok(gap.left >= 14 && gap.right <= width - 14);
      assert.ok(gap.right - gap.left >= 250);
      for (const shot of shots) {
        assert.equal(shot.vx, 0, 'curtain must not drift into the promised corridor');
        assert.ok(shot.x + shot.r < gap.left || shot.x - shot.r > gap.right);
        assert.ok(Math.abs(shot.x - gap.center) > 109 + shot.r + 5,
          'the established full wing outline plus projectile radius and clearance fits');
        const crossingSeconds = (1045 - shot.y) / shot.vy;
        const crossingX = shot.x + shot.vx * crossingSeconds;
        assert.ok(Math.abs(crossingX - gap.center) > 109 + shot.r + 5,
          'the same full-width clearance must remain where the bullets reach the ship');
        assert.deepEqual(shot.safeGap, gap);
        assert.ok(shot.duration > (1045 - shot.y) / shot.vy);
      }
    }
  }
});

test('repeat hits play one hurt response without permanently resetting recovery or duplicating fire', () => {
  const boss = readyBoss();
  runFor(boss, .45);
  const priorTime = boss.stateTime;
  hitGuardianAtlas(boss, 1);
  assert.equal(boss.state, 'hurt');
  runFor(boss, .08);
  const hurtTime = boss.stateTime;
  hitGuardianAtlas(boss, 1);
  assert.equal(boss.stateTime, hurtTime);
  runFor(boss, .09);
  assert.equal(boss.state, 'idle');
  assert.ok(boss.stateTime >= priorTime);
  const events = until(boss, unit => unit.state === 'fire');
  assert.equal(events.filter(event => event.type === 'projectile').length, 3);
  const id = boss.attackId;
  hitGuardianAtlas(boss, 1);
  runFor(boss, .8, player, events);
  assert.equal(events.filter(event => event.type === 'projectile' &&
    event.projectile.attackId === id).length, 3);
});

test('the next corridor warning waits until the previous curtain has passed the player on tall screens', () => {
  for (const height of [568, 1180, 1560]) {
    const playerY = height === 568 ? 450 : height - 135;
    const boss = readyBoss({height, playerY});
    hitGuardianAtlas(boss, 18);
    const events = [];
    let firstAttackId = null, lastShotPassedAt = 0, nextWarningAt = null;
    for (let frame = 0; frame < 20 * 60 && nextWarningAt === null; frame++) {
      const emitted = advanceGuardianAtlas(boss, 1 / 60, {x: 360});
      for (const event of emitted) {
        events.push(event);
        if (event.type === 'warning') {
          if (firstAttackId === null) firstAttackId = event.attackId;
          else if (event.attackId !== firstAttackId) nextWarningAt = boss.age;
        }
        if (event.type === 'projectile' && event.projectile.attackId === firstAttackId) {
          const shot = event.projectile;
          lastShotPassedAt = Math.max(lastShotPassedAt,
            boss.age + (playerY - shot.y) / shot.vy);
        }
      }
    }
    assert.ok(nextWarningAt !== null);
    assert.ok(nextWarningAt > lastShotPassedAt + .3,
      `height ${height}: moving toward the newly announced corridor must not cross old fire`);
  }
});

test('deactivation has a visible duration and emits its progression event exactly once', () => {
  const boss = readyBoss();
  const death = hitGuardianAtlas(boss, 100);
  assert.equal(death.accepted, true);
  assert.equal(boss.hp, 0);
  assert.equal(boss.state, 'disabled');
  assert.equal(boss.disabled, true);
  assert.equal(boss.resolved, false);
  assert.equal(death.events.filter(event => event.type === 'shutdown').length, 1);
  assert.equal(death.events.some(event => event.type === 'disabled'), false);
  assert.equal(hitGuardianAtlas(boss, 1).reason, 'disabled');
  const events = runFor(boss, 1);
  assert.equal(boss.resolved, false);
  runFor(boss, 1, player, events);
  assert.equal(boss.resolved, true);
  assert.equal(events.filter(event => event.type === 'disabled').length, 1);
  assert.equal(events.some(event => event.type === 'projectile'), false);
  const final = structuredClone(boss);
  runFor(boss, 10, player, events);
  assert.deepEqual(boss, final);
  assert.equal(events.filter(event => event.type === 'disabled').length, 1);
});

test('same seed and inputs reproduce warnings, transitions and projectile trajectories', () => {
  function trace() {
    const boss = readyBoss({seed: 507});
    hitGuardianAtlas(boss, 18);
    const events = runFor(boss, 32);
    return {boss, events};
  }
  const first = trace();
  assert.deepEqual(trace(), first);
  const warningGaps = first.events.filter(event => event.type === 'warning')
    .map(event => event.safeGap.center);
  assert.ok(warningGaps.length > 3);
  for (let index = 1; index < warningGaps.length; index++) {
    assert.notEqual(warningGaps[index], warningGaps[index - 1]);
  }
});

test('callback delivery preserves returned-event order and does not duplicate emission', () => {
  const boss = readyBoss();
  until(boss, unit => unit.state === 'charge');
  runFor(boss, GUARDIAN_ATLAS_RULES.phaseOne.chargeSeconds - .04);
  const callbacks = [];
  const events = advanceGuardianAtlas(boss, .05, player, event => callbacks.push(event));
  assert.deepEqual(callbacks, events);
  assert.equal(events.filter(event => event.type === 'projectile').length, 3);
  assert.deepEqual(advanceGuardianAtlas(boss, .01, player), []);
});

test('long deltas are bounded and invalid state inputs fail without advancing combat', () => {
  const boss = createGuardianAtlas();
  advanceGuardianAtlas(boss, 100, player);
  assert.equal(boss.age, GUARDIAN_ATLAS_RULES.maxDelta);
  const before = structuredClone(boss);
  for (const dt of [-.01, NaN, Infinity]) assert.throws(() => advanceGuardianAtlas(boss, dt, player));
  assert.throws(() => advanceGuardianAtlas(boss, .02, {x: NaN}));
  assert.throws(() => advanceGuardianAtlas(boss, .02, player, null));
  assert.deepEqual(boss, before);
  for (const damage of [0, -.1, Infinity, NaN]) assert.throws(() => hitGuardianAtlas(boss, damage));
  assert.throws(() => createGuardianAtlas({width: 100}));
  assert.throws(() => createGuardianAtlas({height: 500}));
  assert.throws(() => createGuardianAtlas({playerY: 200}));
});

test('encounter has no independent animation loop, wall clock, random source or save owner', async () => {
  const source = await readFile(new URL('../src/game/combat/guardian-atlas.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /requestAnimationFrame|cancelAnimationFrame|setInterval|setTimeout|Date\.now|Math\.random|localStorage/);
});
