import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CLASSIC_WEAPON_RULES, createClassicWeapons, selectClassicWeapon, unlockClassicWeapon,
  triggerClassicWeapon, advanceClassicWeapons, hitClassicProjectile,
  classicWeaponSnapshot} from '../src/game/combat/classic-weapons.js';

const origin = {x: 360, y: 1000};
const run = (state, seconds, events = []) => {
  let remaining = seconds;
  while (remaining > 1e-9) {
    const delta = Math.min(1 / 60, remaining);
    events.push(...advanceClassicWeapons(state, delta));
    remaining -= delta;
  }
  return events;
};

test('a match starts with three pulses and a trigger cannot spend through cooldown', () => {
  const state = createClassicWeapons();
  assert.equal(state.charges, 3);
  const first = triggerClassicWeapon(state, origin);
  assert.equal(first.accepted, true);
  assert.equal(first.projectiles.length, 1);
  assert.equal(state.charges, 2);
  const before = classicWeaponSnapshot(state);
  assert.equal(triggerClassicWeapon(state, origin).reason, 'cooldown');
  assert.deepEqual(classicWeaponSnapshot(state), before);
  run(state, .24);
  assert.equal(triggerClassicWeapon(state, origin).accepted, true);
  run(state, .24);
  assert.equal(triggerClassicWeapon(state, origin).accepted, true);
  assert.equal(state.charges, 0);
  assert.equal(triggerClassicWeapon(state, origin).reason, 'empty');
});

test('recharge gives one charge per 3.6 played seconds and does not restart on another shot', () => {
  const state = createClassicWeapons();
  triggerClassicWeapon(state, origin);
  run(state, 1.8);
  triggerClassicWeapon(state, origin);
  run(state, 1.79);
  assert.equal(state.charges, 1);
  const events = run(state, .01);
  assert.equal(state.charges, 2);
  assert.equal(events.filter(event => event.type === 'recharged').length, 1);
  run(state, 3.6);
  assert.equal(state.charges, 3);
  assert.equal(state.recharge, 0);
  run(state, 10);
  triggerClassicWeapon(state, origin);
  assert.equal(state.recharge, 0, 'full batteries cannot bank free ammo');
  run(state, 3.59);
  assert.equal(state.charges, 2);
});

test('zero delta freezes cooldown, charge recovery, projectile movement and event identity', () => {
  const state = createClassicWeapons();
  triggerClassicWeapon(state, origin);
  run(state, .1);
  const before = classicWeaponSnapshot(state);
  for (let index = 0; index < 60; index++) assert.deepEqual(advanceClassicWeapons(state, 0), []);
  assert.deepEqual(classicWeaponSnapshot(state), before);
});

test('a suspended-frame delta cannot refill ammunition or jump projectiles across the arena', () => {
  const state = createClassicWeapons();
  triggerClassicWeapon(state, origin);
  const beforeY = state.projectiles[0].y;
  advanceClassicWeapons(state, 86400);
  assert.equal(state.charges, 2);
  assert.equal(state.elapsed, .05);
  assert.equal(state.recharge, .05);
  assert.ok(Math.abs(state.projectiles[0].y - beforeY + 920 * .05) < 1e-8);
});

test('twin is a distinct two-muzzle spread but spends one shared charge', () => {
  const state = createClassicWeapons({type: 'twin', unlocked: ['pulse', 'twin']});
  const result = triggerClassicWeapon(state, origin);
  assert.equal(result.projectiles.length, 2);
  assert.equal(state.charges, 2);
  const [left, right] = result.projectiles;
  assert.equal(left.x, 318); assert.equal(right.x, 402);
  assert.ok(left.vx < 0 && right.vx > 0);
  assert.ok(left.vy < 0 && right.vy < 0);
  assert.equal(left.damage + right.damage, 1.4);
  assert.equal(left.shotId, right.shotId);
  assert.notEqual(left.id, right.id);
  assert.equal(result.events.filter(event => event.type === 'fired').length, 1);
  assert.equal(result.events.filter(event => event.type === 'projectile').length, 2);
});

test('muzzles rotate with the direction and selecting a weapon never refills or bypasses cooldown', () => {
  const state = createClassicWeapons({unlocked: ['pulse', 'twin']});
  triggerClassicWeapon(state, origin);
  run(state, .1);
  const timing = {charges: state.charges, cooldown: state.cooldown, recharge: state.recharge};
  assert.equal(selectClassicWeapon(state, 'twin').accepted, true);
  assert.deepEqual({charges: state.charges, cooldown: state.cooldown, recharge: state.recharge}, timing);
  assert.equal(triggerClassicWeapon(state, origin).reason, 'cooldown');
  run(state, .2);
  const result = triggerClassicWeapon(state, {x: 100, y: 200, angle: 0});
  assert.equal(result.projectiles[0].x, 100);
  assert.equal(result.projectiles[0].y, 158);
  assert.equal(result.projectiles[1].y, 242);
  assert.ok(result.projectiles.every(projectile => projectile.vx > 0));
});

test('locked and unknown selections cannot mutate the current match', () => {
  const state = createClassicWeapons();
  const before = classicWeaponSnapshot(state);
  assert.equal(selectClassicWeapon(state, 'twin').reason, 'locked');
  assert.throws(() => selectClassicWeapon(state, 'unknown'), RangeError);
  assert.deepEqual(classicWeaponSnapshot(state), before);
});

test('a repeated unlock reward is idempotent and cannot equip or refill a weapon', () => {
  const state = createClassicWeapons();
  triggerClassicWeapon(state, origin);
  run(state, .1);
  const before = {selected: state.selected, charges: state.charges,
    cooldown: state.cooldown, recharge: state.recharge};
  const first = unlockClassicWeapon(state, 'twin');
  assert.equal(first.accepted, true);
  assert.equal(first.events.length, 1);
  assert.deepEqual(state.unlocked, ['pulse', 'twin']);
  const after = classicWeaponSnapshot(state);
  assert.equal(unlockClassicWeapon(state, 'twin').accepted, false);
  assert.deepEqual(classicWeaponSnapshot(state), after);
  assert.deepEqual({selected: state.selected, charges: state.charges,
    cooldown: state.cooldown, recharge: state.recharge}, before);
  assert.equal(selectClassicWeapon(state, 'twin').accepted, true);
});

test('collision damage is delivered once per projectile and twin barrels remain independent', () => {
  const state = createClassicWeapons({type: 'twin', unlocked: ['pulse', 'twin']});
  const result = triggerClassicWeapon(state, origin);
  const [left, right] = result.projectiles;
  const first = hitClassicProjectile(state, left.id, 'enemy-7');
  assert.equal(first.accepted, true);
  assert.equal(first.damage, .7);
  assert.equal(first.events.filter(event => event.type === 'hit').length, 1);
  for (let index = 0; index < 12; index++) {
    const repeat = hitClassicProjectile(state, left.id, 'enemy-7');
    assert.equal(repeat.accepted, false);
    assert.equal(repeat.damage, 0);
    assert.equal(repeat.events.length, 0);
  }
  assert.equal(hitClassicProjectile(state, right.id, 'enemy-7').accepted, true);
  assert.equal(state.projectiles.length, 0);
});

test('projectiles have bounded lifetime/space, never exceed capacity and expire only once', () => {
  const state = createClassicWeapons();
  const shot = triggerClassicWeapon(state, {x: 360, y: 1}).projectiles[0];
  const events = run(state, 1);
  assert.equal(state.projectiles.length, 0);
  assert.equal(events.filter(event => event.type === 'expired' && event.projectileId === shot.id).length, 1);
  assert.equal(run(state, 1).filter(event => event.type === 'expired').length, 0);
  // The capacity guard is defensive against a caller that externally retains
  // entities. It must refuse without consuming a charge or dispatching a shot.
  state.projectiles = Array.from({length: CLASSIC_WEAPON_RULES.maxProjectiles}, (_, index) =>
    ({...shot, id: `fixture-${index}`}));
  const before = classicWeaponSnapshot(state);
  const refused = triggerClassicWeapon(state, origin);
  assert.equal(refused.reason, 'capacity');
  assert.deepEqual(classicWeaponSnapshot(state), before);
  const lifetime = createClassicWeapons({width: 100000, height: 100000});
  const lived = triggerClassicWeapon(lifetime, {x: 50000, y: 50000}).projectiles[0];
  const expirations = run(lifetime, 3).filter(event => event.type === 'expired');
  assert.equal(expirations.length, 1);
  assert.equal(expirations[0].projectileId, lived.id);
  assert.equal(expirations[0].reason, 'lifetime');
});

test('event IDs are unique, diagnostics cannot mutate combat, and events do not move with projectiles', () => {
  const state = createClassicWeapons({unlocked: ['pulse', 'twin']});
  const first = triggerClassicWeapon(state, origin);
  const emittedY = first.events.find(event => event.type === 'projectile').projectile.y;
  const snapshot = classicWeaponSnapshot(state);
  snapshot.unlocked.push('made-up');
  snapshot.projectiles[0].x = -999;
  snapshot.projectiles[0].hitTargets.push('anything');
  const events = [...first.events, ...run(state, 3.6)];
  assert.equal(state.unlocked.includes('made-up'), false);
  assert.equal(first.events.find(event => event.type === 'projectile').projectile.y, emittedY);
  assert.equal(new Set(events.map(event => event.id)).size, events.length);
});

test('invalid arguments reject before mutating ammunition, clocks or existing projectiles', () => {
  for (const invalid of [-1, NaN, Infinity, -Infinity, '1']) {
    const state = createClassicWeapons();
    triggerClassicWeapon(state, origin);
    const before = classicWeaponSnapshot(state);
    assert.throws(() => advanceClassicWeapons(state, invalid));
    assert.deepEqual(classicWeaponSnapshot(state), before);
  }
  const state = createClassicWeapons();
  const before = classicWeaponSnapshot(state);
  for (const invalid of [{x: NaN, y: 1}, {x: 1, y: Infinity}, {x: 1, y: 1, angle: NaN}, {}]) {
    assert.throws(() => triggerClassicWeapon(state, invalid));
    assert.deepEqual(classicWeaponSnapshot(state), before);
  }
  assert.throws(() => hitClassicProjectile(state, '', 'target'));
  assert.throws(() => hitClassicProjectile(state, 'projectile', {}));
  assert.throws(() => createClassicWeapons({width: 100}));
  assert.throws(() => createClassicWeapons({unlocked: ['missing']}));
  assert.throws(() => createClassicWeapons({type: 'twin'}));
});

test('long play stays bounded and deterministic with the same player inputs', () => {
  const a = createClassicWeapons({unlocked: ['pulse', 'twin']});
  const b = createClassicWeapons({unlocked: ['pulse', 'twin']});
  for (let frame = 0; frame < 60 * 90; frame++) {
    for (const state of [a, b]) {
      if (frame === 1800) selectClassicWeapon(state, 'twin');
      if (frame % 7 === 0) triggerClassicWeapon(state, origin);
      advanceClassicWeapons(state, 1 / 60);
      assert.ok(state.charges >= 0 && state.charges <= 3);
      assert.ok(state.projectiles.length <= CLASSIC_WEAPON_RULES.maxProjectiles);
      assert.ok(state.recharge >= 0 && state.recharge < 3.6);
    }
  }
  assert.deepEqual(classicWeaponSnapshot(a), classicWeaponSnapshot(b));
});

test('the model has no independent clock, random source, renderer or persistence', async () => {
  const source = await readFile(new URL('../src/game/combat/classic-weapons.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /requestAnimationFrame|setInterval|setTimeout|Math\.random|Date\.now|localStorage|document\.|window\./);
});
