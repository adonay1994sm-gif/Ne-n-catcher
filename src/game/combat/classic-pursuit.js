import {createCh01Animator} from '../animation/ch01-animator.js';

export const CLASSIC_PURSUIT_VERSION = 'classic-pursuit-v2';
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const approach = (value, target, amount) => value + clamp(target - value, -amount, amount);
const profiles = Object.freeze({
  raider: Object.freeze({warning: .82, recovery: 2.05, maxAttacks: 3, holdSeconds: 13,
    depth: .26, lateralSpeed: 110, acceleration: 215, sampleInterval: .42, damage: 14}),
  scout: Object.freeze({warning: .96, recovery: 2.35, maxAttacks: 3, holdSeconds: 14.5,
    depth: .28, lateralSpeed: 78, acceleration: 145, sampleInterval: .6, damage: 12}),
  interceptor: Object.freeze({warning: .82, recovery: 1.85, maxAttacks: 4, holdSeconds: 15.5,
    depth: .24, lateralSpeed: 148, acceleration: 250, sampleInterval: .4, damage: 14})
});

/** An encounter policy inside the existing item/update loop; owns no clock or RAF.
 * Aim is sampled when charging starts, never predicted or changed by later input.
 * The caller integrates Y once using item.s. This policy brakes that speed to
 * hold a visible combat band, then resumes forward flight on a bounded retreat.
 */
export function createClassicPursuer({x, width = 720, height = 1280,
  role = 'scout', seed = 0, minAttackY = Math.max(96, height * .105),
  baseSpeed = null} = {}) {
  if (![x, width, height, seed, minAttackY].every(Number.isFinite) || width < 250 || height < 300 ||
    !Object.hasOwn(profiles, role) || (baseSpeed !== null && (!Number.isFinite(baseSpeed) || baseSpeed <= 0))) {
    throw new RangeError('Invalid classic pursuer spawn');
  }
  const side = (Math.abs(Math.trunc(seed)) % 2) ? -1 : 1;
  const combatMargin = Math.min(width * .32, Math.max(80, width * .18));
  const entryInset = Math.min(16, (width - combatMargin * 2) * .15);
  return {
    tacticsVersion: CLASSIC_PURSUIT_VERSION, role, width, height, minAttackY,
    seed, side, phase: (Math.abs(seed) * .61803398875 % 1) * Math.PI * 2,
    age: 0, state: 'entry', stage: 'entry', stateAge: 0,
    baseX: clamp(x, combatMargin, width - combatMargin),
    targetX: clamp(x, combatMargin + entryInset, width - combatMargin - entryInset), vx: 0,
    combatMinX: combatMargin, combatMaxX: width - combatMargin,
    holdY: null, combatStartedAt: null, retreatReason: null, repositionCount: 0,
    baseSpeed, nextTargetAt: 0, nextFire: 1.25,
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
  // Match the animator/legacy frame cap: a background resume cannot skip the
  // warning. The caller keeps responsibility for clamping its own Y delta.
  const step = Math.min(dt, .05), profile = profiles[enemy.role];
  const hp = item.hp ?? 2, maxHp = item.maxHp ?? 2;
  enemy.baseSpeed ??= Math.max(1, item.s);
  enemy.age += step;
  enemy.stateAge += step;
  const lostHealth = enemy.previousHp !== null && hp < enemy.previousHp;
  enemy.previousHp = hp;
  const enter = state => {
    enemy.state = enemy.stage = state;
    enemy.stateAge = 0;
  };
  const combatX = value => clamp(value, enemy.combatMinX, enemy.combatMaxX);
  const minimumHoldY = enemy.minAttackY + 52;
  const maximumHoldY = Math.max(minimumHoldY, Math.min(enemy.height * .52, player.y - 350));
  enemy.holdY = clamp(enemy.height * profile.depth + Math.sin(enemy.phase) * 22,
    minimumHoldY, maximumHoldY);
  const canAttack = () => hp > 0 && enemy.state !== 'retreat' &&
    item.y >= enemy.minAttackY && item.y + 38 <= player.y - 230 &&
    enemy.fired < profile.maxAttacks;
  const clearCharge = () => {
    enemy.telegraph = 0;
    enemy.attackScheduled = false;
    enemy.lockedTarget = null;
  };
  const laneTarget = () => {
    const observedX = combatX(player.x);
    const span = Math.min(enemy.width * .22, 128);
    return combatX(enemy.role === 'interceptor' ? observedX + enemy.side * span :
      enemy.role === 'scout' ? enemy.baseX * .5 + observedX * .5 + enemy.side * span * .32 :
        observedX + enemy.side * span * .48);
  };
  const reposition = () => {
    clearCharge();
    enemy.side *= -1;
    enemy.repositionCount++;
    enemy.targetX = laneTarget();
    enemy.nextTargetAt = enemy.age + profile.sampleInterval;
    enemy.nextFire = enemy.age + profile.recovery;
    enter('reposition');
  };
  const retreat = reason => {
    clearCharge();
    enemy.retreatReason = reason;
    // Only the final departure uses the outer lane. Combat targets stay in
    // the player's reachable interior, and retreat still has real collision.
    enemy.targetX = player.x < enemy.width / 2 ? enemy.width - 56 : 56;
    enter('retreat');
  };

  if (hp <= 0) {
    clearCharge();
    if (enemy.state !== 'destroyed') enter('destroyed');
  } else if (enemy.state !== 'retreat' && enemy.state !== 'destroyed') {
    const heldFor = enemy.combatStartedAt === null ? 0 : enemy.age - enemy.combatStartedAt;
    if (heldFor >= profile.holdSeconds || enemy.age >= profile.holdSeconds + 8) {
      retreat('time-limit');
    } else if (lostHealth && !['entry', 'brake'].includes(enemy.state)) {
      // Same HP sample reaches the animator below: hurt cancels its fire event.
      reposition();
    } else if (enemy.state === 'charge' && !canAttack()) {
      reposition();
    }
  }

  if (enemy.state === 'entry' && item.y >= enemy.holdY - 110) enter('brake');
  if (enemy.state === 'brake' && Math.abs(item.y - enemy.holdY) <= 32 && Math.abs(item.s) <= 62 &&
      item.x >= enemy.combatMinX && item.x <= enemy.combatMaxX) {
    enemy.combatStartedAt ??= enemy.age;
    enemy.targetX = laneTarget();
    enemy.nextTargetAt = enemy.age + profile.sampleInterval;
    enter('track');
  }
  if (enemy.state === 'fire' && enemy.stateAge >= .34) {
    if (enemy.fired >= profile.maxAttacks) retreat('attack-budget');
    else reposition();
  }
  if (enemy.state === 'reposition' && enemy.age >= enemy.nextFire) enter('track');

  if (enemy.state === 'track') {
    if (enemy.age >= enemy.nextTargetAt) {
      enemy.targetX = laneTarget();
      enemy.nextTargetAt = enemy.age + profile.sampleInterval;
    }
    if (canAttack() && enemy.age >= enemy.nextFire && !lostHealth &&
        Math.abs(item.y - enemy.holdY) <= 45 && Math.abs(item.s) <= 62) {
      enemy.lockedTarget = Object.freeze({x: player.x, y: player.y});
      enemy.targetX = item.x;
      enemy.chargeStartedAt = enemy.age;
      enemy.chargeSerial++;
      enter('charge');
    }
  }

  if (enemy.state === 'charge') {
    const warningElapsed = enemy.age - enemy.chargeStartedAt;
    enemy.telegraph = clamp(warningElapsed / profile.warning, 0, 1);
    // The full warning precedes requesting the produced attack animation.
    // Only its returned fire event can emit one projectile for this charge.
    if (warningElapsed >= profile.warning && !enemy.attackScheduled) {
      enemy.attackScheduled = enemy.animator.request('attack');
    }
  }

  const previousX = item.x;
  const desiredVelocity = ['charge', 'fire', 'destroyed'].includes(enemy.state) ? 0 :
    clamp((enemy.targetX - item.x) * 2.8, -profile.lateralSpeed, profile.lateralSpeed);
  enemy.vx = approach(enemy.vx, desiredVelocity, profile.acceleration * step);
  const minimumX = enemy.state === 'retreat' ? 52 : Math.min(item.x, enemy.combatMinX);
  const maximumX = enemy.state === 'retreat' ? enemy.width - 52 : Math.max(item.x, enemy.combatMaxX);
  item.x = clamp(item.x + enemy.vx * step, minimumX, maximumX);
  enemy.vx = (item.x - previousX) / step;
  const desiredVertical = enemy.state === 'destroyed' ? 0 : enemy.state === 'retreat'
    ? enemy.baseSpeed * 1.35
    : clamp((enemy.holdY - item.y) * 1.8, -82, enemy.baseSpeed);
  item.s = approach(item.s, desiredVertical, enemy.baseSpeed * 1.8 * step);
  const events = enemy.animator.update(step, {hp, maxHp, vx: enemy.vx, vy: item.s});
  for (const event of events) {
    if (event.name === 'attackCanceled' && enemy.state === 'charge') reposition();
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
