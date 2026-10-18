import {createCh01Animator} from '../animation/ch01-animator.js';

export const CLASSIC_PURSUIT_VERSION = 'classic-pursuit-v1';
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const approach = (value, target, amount) => value + clamp(target - value, -amount, amount);
const profiles = Object.freeze({
  raider: Object.freeze({entry: .8, warning: .72, recovery: 1.45, maxAttacks: 3,
    lateralSpeed: 124, acceleration: 230, sampleInterval: .32, damage: 14}),
  scout: Object.freeze({entry: 1, warning: .88, recovery: 2.2, maxAttacks: 2,
    lateralSpeed: 78, acceleration: 145, sampleInterval: .55, damage: 12}),
  interceptor: Object.freeze({entry: .8, warning: .76, recovery: 1.8, maxAttacks: 2,
    lateralSpeed: 148, acceleration: 250, sampleInterval: .44, damage: 14})
});

/** An encounter policy inside the existing item/update loop; owns no clock or RAF.
 * Aim is sampled when charging starts, never predicted or changed by later input.
 * The legacy caller still owns Y integration, collisions, damage and removal.
 */
export function createClassicPursuer({x, width = 720, height = 1280,
  role = 'scout', seed = 0, minAttackY = Math.max(96, height * .105),
  baseSpeed = null} = {}) {
  if (![x, width, height, seed, minAttackY].every(Number.isFinite) || width < 250 || height < 300 ||
    !Object.hasOwn(profiles, role) || (baseSpeed !== null && (!Number.isFinite(baseSpeed) || baseSpeed <= 0))) {
    throw new RangeError('Invalid classic pursuer spawn');
  }
  const side = (Math.abs(Math.trunc(seed)) % 2) ? -1 : 1;
  return {
    tacticsVersion: CLASSIC_PURSUIT_VERSION, role, width, height, minAttackY,
    seed, side, phase: (Math.abs(seed) * .61803398875 % 1) * Math.PI * 2,
    age: 0, state: 'entry', stage: 'entry', stateAge: 0,
    baseX: clamp(x, 52, width - 52), targetX: clamp(x, 52, width - 52), vx: 0,
    baseSpeed, nextTargetAt: 0, nextFire: profiles[role].entry + .3,
    fired: 0, telegraph: 0, lockedTarget: null, attackScheduled: false,
    chargeSerial: 0, firedSerial: -1, previousHp: null, chargeStartedAt: null,
    animator: createCh01Animator({hp: 2, maxHp: 2})
  };
}

export function advanceClassicPursuer(item, dt, player, spawnProjectile) {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Invalid pursuer delta');
  if (typeof spawnProjectile !== 'function') throw new TypeError('Spawn callback required');
  const enemy = item.classicScout;
  if (!enemy || dt === 0) return;
  if (![item.x, item.y, item.s, player?.x, player?.y].every(Number.isFinite)) {
    throw new TypeError('Finite pursuer and player positions required');
  }
  // Match the animator/legacy frame cap: resuming a background tab never skips
  // the warning or integrates an unseen second of hostile movement.
  const step = Math.min(dt, .05), profile = profiles[enemy.role];
  const hp = item.hp ?? 2, maxHp = item.maxHp ?? 2;
  enemy.baseSpeed ??= Math.max(1, item.s);
  enemy.age += step;
  enemy.stateAge += step;
  const lostHealth = enemy.previousHp !== null && hp < enemy.previousHp;
  enemy.previousHp = hp;
  const canAttack = () => hp > 0 && item.y >= enemy.minAttackY &&
    item.y + 38 <= player.y - 230 && enemy.fired < profile.maxAttacks;
  const enter = state => {
    enemy.state = enemy.stage = state;
    enemy.stateAge = 0;
  };
  const breakAway = () => {
    enemy.telegraph = 0;
    enemy.attackScheduled = false;
    enemy.lockedTarget = null;
    enemy.targetX = enemy.side > 0 ? enemy.width - 66 : 66;
    enemy.nextFire = enemy.age + profile.recovery;
    enter('break-away');
  };

  if (hp <= 0) {
    enemy.telegraph = 0;
    enemy.attackScheduled = false;
    enemy.lockedTarget = null;
    enter('destroyed');
  } else if (lostHealth && enemy.state === 'charge') {
    // The animator sees the same HP loss below and cancels its own fire event.
    breakAway();
  } else if (enemy.state === 'charge' && !canAttack()) {
    // Never finish charging a weapon below/near a ship which changed lanes.
    breakAway();
  }

  if (enemy.state === 'entry' && enemy.age >= profile.entry) enter('track');
  if (enemy.state === 'break-away' && enemy.stateAge >= .75 &&
      enemy.age >= enemy.nextFire && canAttack()) enter('track');
  if (enemy.state === 'fire' && enemy.stateAge >= .34) breakAway();

  if (enemy.state === 'track') {
    if (enemy.age >= enemy.nextTargetAt) {
      const observedX = clamp(player.x, 52, enemy.width - 52);
      enemy.targetX = clamp(enemy.role === 'interceptor' ? observedX + enemy.side * 118 :
        enemy.role === 'scout' ? enemy.baseX * .65 + observedX * .35 : observedX,
      52, enemy.width - 52);
      enemy.nextTargetAt = enemy.age + profile.sampleInterval;
    }
    if (canAttack() && enemy.age >= enemy.nextFire && !lostHealth) {
      enemy.lockedTarget = Object.freeze({x: player.x, y: player.y});
      enemy.targetX = item.x;
      enemy.chargeStartedAt = enemy.age;
      enemy.chargeSerial++;
      enter('charge');
    } else if (item.y + 38 > player.y - 230) {
      breakAway();
    }
  }

  if (enemy.state === 'charge') {
    const warningElapsed = enemy.age - enemy.chargeStartedAt;
    enemy.telegraph = clamp(warningElapsed / profile.warning, 0, 1);
    // The complete warning precedes requesting the produced attack animation;
    // only its returned fire event can emit a projectile.
    if (warningElapsed >= profile.warning && !enemy.attackScheduled) {
      enemy.attackScheduled = enemy.animator.request('attack');
    }
  }

  const previousX = item.x;
  const desiredVelocity = enemy.state === 'charge' || enemy.state === 'fire' || enemy.state === 'destroyed'
    ? 0 : clamp((enemy.targetX - item.x) * 2.8, -profile.lateralSpeed, profile.lateralSpeed);
  enemy.vx = approach(enemy.vx, desiredVelocity, profile.acceleration * step);
  item.x = clamp(item.x + enemy.vx * step, 52, enemy.width - 52);
  enemy.vx = (item.x - previousX) / step;
  const speedFactor = enemy.state === 'charge' || enemy.state === 'fire' ? .32 :
    enemy.state === 'track' ? .52 : 1;
  item.s = approach(item.s, enemy.baseSpeed * speedFactor, enemy.baseSpeed * 1.8 * step);
  const events = enemy.animator.update(step, {hp, maxHp, vx: enemy.vx, vy: item.s});
  for (const event of events) {
    if (event.name === 'attackCanceled' && enemy.state === 'charge') {
      breakAway();
    }
    if (event.name !== 'fire' || enemy.state !== 'charge' || !enemy.attackScheduled ||
        enemy.firedSerial === enemy.chargeSerial || !canAttack()) continue;
    const aim = enemy.lockedTarget;
    const dy = Math.max(1, aim.y - (item.y + 38));
    const dx = clamp(aim.x - item.x, -dy * .65, dy * .65);
    const length = Math.hypot(dx, dy), speed = 295;
    const shot = {
      type: 'meteor', x: item.x, baseX: item.x, y: item.y + 38,
      r: 9, s: speed, vx: dx / length * speed, vy: dy / length * speed, life: 5,
      damage: profile.damage, rot: 0, rs: 0, p: 0, phase: 0,
      amp: 0, special: '', alpha: 1, hp: 1, maxHp: 1,
      classicScoutProjectile: true, tacticsVersion: CLASSIC_PURSUIT_VERSION,
      attackSerial: enemy.chargeSerial, role: enemy.role
    };
    enemy.firedSerial = enemy.chargeSerial;
    enemy.fired++;
    enemy.telegraph = 0;
    enemy.attackScheduled = false;
    enter('fire');
    spawnProjectile(shot);
  }
}
