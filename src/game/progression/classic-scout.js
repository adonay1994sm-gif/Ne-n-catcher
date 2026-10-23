import {createCh01Animator} from '../animation/ch01-animator.js';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

// Classic Gaia uses the same produced frames as N-7, but owns its own encounter.
// This module does not own a clock, Canvas, input, or RAF.
export function createClassicScout({x, phase = 0, width = 720} = {}) {
  if (![x, phase, width].every(Number.isFinite) || width < 250) throw new RangeError('Invalid scout spawn');
  return {
    age: 0, baseX: x, phase, width, nextFire: 1.7, fireInterval: 1.9,
    fired: 0, telegraph: 0, attackScheduled: false,
    animator: createCh01Animator({hp: 2, maxHp: 2})
  };
}

export function advanceClassicScout(item, dt, player, spawnProjectile) {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Invalid scout delta');
  if (typeof spawnProjectile !== 'function') throw new TypeError('Spawn callback required');
  const scout = item.classicScout;
  if (!scout || dt === 0) return;
  scout.age += dt;
  const previousX = item.x;
  item.x = clamp(scout.baseX + Math.sin(scout.age * 1.35 + scout.phase) * 28,
    52, scout.width - 52);
  const inRange = item.y >= 0 && item.y < player.y - 270;
  if (inRange && scout.fired < 2 && scout.age >= scout.nextFire - .46 && !scout.attackScheduled) {
    scout.attackScheduled = scout.animator.request('attack');
  }
  const events = scout.animator.update(dt, {hp: item.hp, maxHp: item.maxHp,
    vx: (item.x - previousX) / dt, vy: item.s});
  for (const event of events) {
    if (event.name === 'attackCanceled' && !event.fired) {
      scout.attackScheduled = false;
      scout.nextFire = scout.age + 1.1;
    }
  }
  scout.telegraph = inRange && scout.attackScheduled
    ? clamp(1 - (scout.nextFire - scout.age) / .46, 0, 1) : 0;
  if (!inRange || scout.fired >= 2 || !events.some(event => event.name === 'fire')) return;
  // A vertical, signalled projectile leaves the player at least 270 logical
  // pixels to respond. It cannot track or instantly hit the ship.
  spawnProjectile({
    type: 'meteor', x: item.x, baseX: item.x, y: item.y + 38,
    r: 9, s: 295, damage: 16, rot: 0, rs: 0, p: 0, phase: 0,
    amp: 0, special: '', alpha: 1, hp: 1, maxHp: 1,
    classicScoutProjectile: true
  });
  scout.fired++;
  scout.nextFire = scout.age + scout.fireInterval;
  scout.attackScheduled = false;
  scout.telegraph = 0;
}
