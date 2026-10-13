import {generateLevel} from './generator.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Simulation data only. The existing legacy loop owns timing, input and drawing. */
export class EncounterDirector {
  constructor(level, options) {
    this.plan = generateLevel(level, options);
    this.events = this.plan.waves.flatMap(wave => wave.enemies.map(enemy => ({at: enemy.at, kind: 'enemy', data: enemy})));
    this.events.push(...this.plan.pickups.map(pickup => ({at: pickup.at, kind: 'pickup', data: pickup})));
    this.events.sort((a, b) => a.at - b.at || (a.data.id < b.data.id ? -1 : 1));
    this.reset();
  }

  reset() { this.elapsed = 0; this.cursor = 0; this.wave = 0; }

  advance(dt, spawn) {
    if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Finite nonnegative delta required');
    if (typeof spawn !== 'function') throw new TypeError('Spawn callback required');
    this.elapsed += Math.min(.05, dt);
    this.wave = Math.min(this.plan.waves.length, Math.max(0, Math.floor((this.elapsed - 2) / 8.5) + 1));
    while (this.cursor < this.events.length && this.events[this.cursor].at <= this.elapsed + 1e-9) {
      const event = this.events[this.cursor];
      spawn(makeLegacyEntity(event, this.plan));
      this.cursor++;
    }
  }

  get finished() { return this.cursor === this.events.length && this.elapsed >= this.plan.duration; }
  get reproduction() { return {level: this.plan.level, seed: this.plan.seed, version: this.plan.version}; }
}

export function makeLegacyEntity(event, plan) {
  const spec = event.data;
  const pickup = event.kind === 'pickup';
  const pattern = pickup ? null : spec.type;
  return {
    id: spec.id, type: pickup ? 'energy' : 'meteor',
    x: spec.x, baseX: spec.x, y: -70, r: pickup ? 22 : 32,
    s: pickup ? 255 : 180 * spec.speedMultiplier,
    rot: 0, rs: 0, p: spec.phase, phase: spec.phase, amp: 0,
    special: '', alpha: 1, damage: pickup ? 0 : 24,
    spriteKey: pickup ? '' : pattern === 'shooter' ? 'meteorLarge' : 'meteorMedium',
    hp: 2, maxHp: 2, shape: null, craters: null, variant: '',
    n7: pickup ? null : {
      pattern, bounds: spec.bounds, age: 0, nextFire: 1.5,
      telegraphSeconds: spec.telegraphSeconds, fireInterval: spec.fireInterval,
      projectileSpeed: 280 * spec.projectileMultiplier,
      telegraph: 0, fired: 0, phase: spec.phase, corridor: plan.corridor
    }
  };
}

/** Keep each enemy's entire swept shape outside the reserved escape corridor. */
export function advanceEnemy(item, dt, player, spawnProjectile) {
  const behavior = item.n7;
  if (!behavior) return;
  behavior.age += dt;
  const {bounds} = behavior;
  if (behavior.pattern === 'zigzag') {
    const mid = (bounds.min + bounds.max) / 2;
    item.x = mid + Math.sin(behavior.age * 2.2 + behavior.phase) * (bounds.max - bounds.min) / 2;
  } else if (behavior.pattern === 'chaser' && item.y < player.y - 230) {
    const target = clamp(player.x, bounds.min, bounds.max);
    item.x += clamp(target - item.x, -100 * dt, 100 * dt);
  }
  item.x = clamp(item.x, bounds.min, bounds.max);
  if (behavior.pattern !== 'shooter' || item.y < 0 || item.y > player.y - 260) return;
  behavior.telegraph = clamp(1 - (behavior.nextFire - behavior.age) / behavior.telegraphSeconds, 0, 1);
  if (behavior.age + 1e-9 < behavior.nextFire || behavior.fired >= 3) return;
  // Vertical, signalled fire: no aiming into the guaranteed refuge.
  spawnProjectile({
    id: `${item.id}:shot:${++behavior.fired}`, type: 'meteor', x: item.x, baseX: item.x,
    y: item.y + 38, r: 9, s: behavior.projectileSpeed, damage: 16,
    rot: 0, rs: 0, p: 0, phase: 0, amp: 0, special: '', alpha: 1,
    spriteKey: '', hp: 1, maxHp: 1, shape: null, craters: null,
    n7Projectile: true
  });
  behavior.nextFire += behavior.fireInterval;
  behavior.telegraph = 0;
}
