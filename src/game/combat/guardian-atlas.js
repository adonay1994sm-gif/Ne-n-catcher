const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const finite = (value, name) => {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
};

export const GUARDIAN_ATLAS_RULES = Object.freeze({
  version: 'guardian-atlas-v5', maxHp: 96, maxDelta: .05,
  entrySeconds: 2.2, closedSeconds: 1.05, repositionSeconds: .7,
  openingSeconds: .65, exposedSeconds: 4.2, closingSeconds: .55,
  phaseBreakSeconds: 1.25, shutdownSeconds: 1.55, hurtSeconds: .16,
  coreRadius: 42, maxProjectilesPerAttack: 10, tailClearance: 42,
  phaseOne: Object.freeze({projectileSpeed: 380, projectileDamage: 13}),
  phaseTwo: Object.freeze({projectileSpeed: 420, projectileDamage: 15}),
  attacks: Object.freeze({
    basic: Object.freeze({chargeSeconds: .36, volleyTimes: Object.freeze([0]), damage: 13}),
    medium: Object.freeze({chargeSeconds: .52, volleyTimes: Object.freeze([0, .34]), damage: 15}),
    superpower: Object.freeze({chargeSeconds: .86, volleyTimes: Object.freeze([0, .45]), damage: 22})
  })
});

/** One encounter driven by the existing update. It owns no clock, projectile
 * movement, rendering, save, money or reward. The core is damageable only in
 * EXPOSED, never while attacking, opening, closing or changing phase.
 */
export function createGuardianAtlas({width = 720, height = 1280,
  playerY = height - 135, seed = 0x41544c41} = {}) {
  finite(width, 'width'); finite(height, 'height'); finite(playerY, 'playerY');
  if (width < 280 || height < 540 || playerY < 180 || playerY > height - 16 ||
      !Number.isInteger(seed)) throw new RangeError('Invalid Guardian Atlas arena');
  const radius = Math.min(104, width * .19);
  const targetY = Math.max(64, Math.min(height * .22, playerY - 240));
  return {
    type: 'guardianAtlas', version: GUARDIAN_ATLAS_RULES.version,
    width, height, playerY, seed: seed >>> 0 || 1,
    x: width / 2, y: -radius * 1.6, baseX: width / 2, targetY,
    r: radius, coreRadius: Math.min(GUARDIAN_ATLAS_RULES.coreRadius, width * .085),
    s: 0, rot: 0, rs: 0, p: 0, amp: 0, alpha: 1,
    hp: GUARDIAN_ATLAS_RULES.maxHp, maxHp: GUARDIAN_ATLAS_RULES.maxHp,
    age: 0, state: 'entry', stateTime: 0, phase: 1, phaseAttacks: 0,
    vulnerability: false, coreExposure: 0, armorClosed: true,
    telegraph: null, disabled: false, resolved: false,
    attackId: 0, attackTier: null, volley: 0, attackClearanceSeconds: 0,
    observation: null, nextObservationAt: 0, lastPattern: null,
    flash: 0, lastHitAt: null, patrolFromX: width / 2, patrolToX: width / 2,
    protocol: 'falsified-identification', recordId: 'chronos-sabotage-atlas-log'
  };
}

function nextRandom(boss) {
  let value = boss.seed;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  boss.seed = value >>> 0;
  return boss.seed / 0x100000000;
}
const phaseRules = boss => boss.phase === 1 ? GUARDIAN_ATLAS_RULES.phaseOne : GUARDIAN_ATLAS_RULES.phaseTwo;
const attackRules = boss => GUARDIAN_ATLAS_RULES.attacks[boss.attackTier];

function updateCore(boss) {
  boss.vulnerability = boss.state === 'exposed' && !boss.disabled;
  boss.coreExposure = boss.state === 'exposed' ? 1 : boss.state === 'opening'
    ? clamp(boss.stateTime / GUARDIAN_ATLAS_RULES.openingSeconds, 0, 1)
    : boss.state === 'closing' ? 1 - clamp(boss.stateTime / GUARDIAN_ATLAS_RULES.closingSeconds, 0, 1) : 0;
  boss.armorClosed = !boss.vulnerability;
}
function observePlayer(boss, player) {
  if (boss.age + 1e-9 < boss.nextObservationAt) return;
  const previous = boss.observation, elapsed = previous ? boss.age - previous.at : 0;
  const x = clamp(player.x, 24, boss.width - 24);
  const y = clamp(Number.isFinite(player.y) ? player.y : boss.playerY, 24, boss.height - 16);
  const vx = elapsed > 0 ? clamp((x - previous.x) / elapsed, -720, 720) : 0;
  boss.observation = {x, y, at: boss.age, vx: previous ? previous.vx * .4 + vx * .6 : 0};
  boss.nextObservationAt = boss.age + .22;
}
function transition(boss, next, events) {
  boss.state = next; boss.stateTime = 0;
  if (next === 'closed') {
    boss.patrolFromX = boss.x;
    const sample = boss.observation || {x: boss.width / 2, vx: 0};
    const distance = Math.max(0, boss.playerY - boss.targetY - boss.r * .7);
    const offset = Math.min(boss.width * .21, distance * .18);
    const side = Math.abs(sample.vx) > 50 ? Math.sign(sample.vx) :
      sample.x === boss.width / 2 ? (nextRandom(boss) < .5 ? -1 : 1) : Math.sign(sample.x - boss.width / 2);
    boss.patrolToX = clamp(sample.x + side * offset * .45 + clamp(sample.vx * .16, -48, 48),
      Math.max(boss.r + 12, boss.width / 2 - offset),
      Math.min(boss.width - boss.r - 12, boss.width / 2 + offset));
  }
  updateCore(boss);
  events.push({type: 'state', state: next, phase: boss.phase, attackId: boss.attackId});
  if (next === 'opening') events.push({type: 'opening', phase: boss.phase});
  if (next === 'exposed') events.push({type: 'coreExposed', phase: boss.phase,
    seconds: GUARDIAN_ATLAS_RULES.exposedSeconds, coreRadius: boss.coreRadius});
  if (next === 'closing') events.push({type: 'coreClosed', phase: boss.phase});
}
function beginCharge(boss, player, events) {
  boss.attackId++; boss.phaseAttacks++; boss.volley = 0; boss.attackClearanceSeconds = 0;
  const tiers = boss.phase === 1 ? ['basic', 'medium', 'superpower'] : ['medium', 'basic', 'superpower'];
  boss.attackTier = tiers[(boss.phaseAttacks - 1) % tiers.length];
  const sample = boss.observation || {x: player.x, y: boss.playerY, vx: 0, at: boss.age};
  const tier = boss.attackTier;
  const pattern = tier === 'superpower' ? 'reactorBarrage' : tier === 'medium'
    ? boss.phase === 1 ? 'crossfire' : 'rakingSalvo' : boss.phase === 1 ? 'focusedSalvo' : 'leadSalvo';
  const leadOffset = tier === 'basic' && boss.phase === 1 ? 0 : clamp(sample.vx * .28, -100, 100);
  const originY = boss.y + boss.r * .7;
  boss.lastPattern = pattern;
  boss.telegraph = {kind: 'mechanicalDeployment', pattern, attackTier: tier, progress: 0,
    targetX: clamp(sample.x + leadOffset, 24, boss.width - 24),
    // A pilot moving above the guns must not produce upward/negative-lifetime
    // ordnance. Arena layout remains the integration's responsibility.
    targetY: Math.max(originY + 180, sample.y), observedX: sample.x,
    observedVx: sample.vx, observedAt: sample.at, leadOffset,
    originX: boss.x, originY, seconds: attackRules(boss).chargeSeconds,
    safeGap: null, attackId: boss.attackId};
  transition(boss, 'charge', events);
  // Animation-only compatibility event. Integration must not reveal aim or a
  // future safe lane through HUD warnings, reticles or helper lines.
  events.push({type: 'warning', phase: boss.phase, ...boss.telegraph});
}
function projectile(boss, x, y, vx, vy, ordinal, targetX) {
  const aim = boss.telegraph, heavy = boss.attackTier === 'superpower';
  const damage = boss.attackTier === 'basic' ? phaseRules(boss).projectileDamage : attackRules(boss).damage;
  return {type: 'meteor', guardianProjectile: true, pattern: aim.pattern,
    attackTier: boss.attackTier, heavy, attackId: boss.attackId, volley: boss.volley,
    projectileId: `${boss.attackId}:${boss.volley}:${ordinal}`,
    x, baseX: x, y, vx, vy, s: vy, r: heavy ? 14 : 10,
    damage, duration: 7, life: 7, telegraphSeconds: aim.seconds, safeGap: null,
    observedX: aim.observedX, observedVx: aim.observedVx, leadOffset: aim.leadOffset,
    targetX, targetY: aim.targetY, rot: Math.atan2(vy, vx) - Math.PI / 2,
    rs: 0, p: 0, phase: 0, amp: 0, special: '', alpha: 1, hp: 1, maxHp: 1};
}
function fireVolley(boss, events, fireTime = boss.stateTime) {
  const aim = boss.telegraph, tier = boss.attackTier, heavy = tier === 'superpower';
  const crossfire = aim.pattern === 'crossfire';
  const originX = aim.originX + (crossfire ? (boss.volley === 0 ? -1 : 1) * boss.r * .72 : 0);
  const rake = Math.min(44, (aim.targetY - aim.originY) * .09);
  const targetX = clamp(aim.targetX + (aim.pattern === 'rakingSalvo'
    ? (boss.volley === 0 ? -rake : rake) : 0), 24, boss.width - 24);
  const distance = aim.targetY - aim.originY;
  const direction = Math.atan2(distance, targetX - originX);
  // The heavy barrage occupies a wider observed sector, but is slower and
  // retains an escape outside that sector. Small fixture arenas use a narrow
  // fan rather than an unavoidable full-width wall. No safe corridor is stored.
  const spread = heavy ? Math.atan2(boss.width * (boss.width < 440 ? .055 : .24), distance) :
    aim.pattern === 'rakingSalvo' ? .035 : .045;
  const offsets = heavy || (tier === 'medium' && boss.phase === 2)
    ? [-spread, -spread / 2, 0, spread / 2, spread] : [-spread, 0, spread];
  const speed = heavy ? (boss.phase === 1 ? 300 : 325) : phaseRules(boss).projectileSpeed;
  for (const [index, offset] of offsets.entries()) {
    const angle = direction + offset;
    const shot = projectile(boss, originX, aim.originY,
      Math.cos(angle) * speed, Math.sin(angle) * speed, index, targetX);
    boss.attackClearanceSeconds = Math.max(boss.attackClearanceSeconds,
      fireTime + (boss.playerY + GUARDIAN_ATLAS_RULES.tailClearance + shot.r - shot.y) / shot.vy);
    events.push({type: 'projectile', projectile: shot});
  }
  events.push({type: 'volley', attackId: boss.attackId, phase: boss.phase,
    attackTier: tier, volley: boss.volley});
  boss.volley++;
}
function stateDuration(boss) {
  const rule = GUARDIAN_ATLAS_RULES;
  if (boss.state === 'entry') return rule.entrySeconds;
  if (boss.state === 'closed') return rule.closedSeconds;
  if (boss.state === 'charge') return attackRules(boss).chargeSeconds;
  if (boss.state === 'fire') return Math.max(attackRules(boss).volleyTimes.at(-1) + .08,
    boss.attackClearanceSeconds + .12);
  if (boss.state === 'opening') return rule.openingSeconds;
  if (boss.state === 'exposed') return rule.exposedSeconds;
  if (boss.state === 'closing') return rule.closingSeconds;
  if (boss.state === 'phaseBreak') return rule.phaseBreakSeconds;
  if (boss.state === 'disabled') return rule.shutdownSeconds;
  throw new RangeError('Unknown Guardian Atlas state');
}
function finishState(boss, player, events) {
  if (boss.state === 'entry') {
    boss.y = boss.targetY; transition(boss, 'closed', events);
    events.push({type: 'arrival', phase: 1, reason: 'falsified-identification',
      recordId: boss.recordId});
  } else if (boss.state === 'closed') beginCharge(boss, player, events);
  else if (boss.state === 'charge') {
    transition(boss, 'fire', events); boss.telegraph.progress = 1; fireVolley(boss, events);
  } else if (boss.state === 'fire') { boss.telegraph = null; transition(boss, 'opening', events); }
  else if (boss.state === 'opening') transition(boss, 'exposed', events);
  else if (boss.state === 'exposed') transition(boss, 'closing', events);
  else if (boss.state === 'closing' || boss.state === 'phaseBreak') transition(boss, 'closed', events);
  else if (boss.state === 'disabled' && !boss.resolved) {
    boss.resolved = true; boss.protocol = 'identity-restored';
    events.push({type: 'disabled', phase: boss.phase, rewardId: 'guardian-atlas-access',
      resolution: 'identity-restored', recordId: boss.recordId});
  }
}

/** Zero delta changes nothing, including observations and animation. A long
 * foreground gap advances only 50 ms. Each scheduled volley is emitted once.
 */
export function advanceGuardianAtlas(boss, dt, player, emit = () => {}) {
  finite(dt, 'delta');
  if (dt < 0) throw new RangeError('Finite nonnegative delta required');
  if (typeof emit !== 'function') throw new TypeError('Event callback required');
  if (!player || !Number.isFinite(player.x)) throw new TypeError('Player x must be finite');
  if (dt === 0 || boss.resolved) return [];
  const events = [];
  let remaining = Math.min(dt, GUARDIAN_ATLAS_RULES.maxDelta);
  boss.age += remaining; observePlayer(boss, player); boss.flash = Math.max(0, boss.flash - remaining);
  while (remaining > 1e-10 && !boss.resolved) {
    const duration = stateDuration(boss);
    const step = Math.min(remaining, Math.max(0, duration - boss.stateTime));
    const before = boss.stateTime;
    boss.stateTime += step; remaining -= step;
    if (boss.state === 'entry') {
      const progress = clamp(boss.stateTime / duration, 0, 1);
      boss.y = -boss.r * 1.6 + (boss.targetY + boss.r * 1.6) * (1 - (1 - progress) ** 3);
    } else if (boss.state === 'closed') {
      const progress = clamp(boss.stateTime / GUARDIAN_ATLAS_RULES.repositionSeconds, 0, 1);
      const smooth = progress * progress * (3 - 2 * progress);
      boss.x = boss.patrolFromX + (boss.patrolToX - boss.patrolFromX) * smooth;
    } else if (boss.state === 'charge') boss.telegraph.progress = clamp(boss.stateTime / duration, 0, 1);
    else if (boss.state === 'fire') {
      const schedule = attackRules(boss).volleyTimes;
      while (boss.volley < schedule.length && before < schedule[boss.volley] + 1e-9 &&
          boss.stateTime + 1e-9 >= schedule[boss.volley]) fireVolley(boss, events, schedule[boss.volley]);
    }
    updateCore(boss);
    if (boss.stateTime + 1e-10 >= stateDuration(boss)) finishState(boss, player, events);
    else break;
  }
  for (const event of events) emit(event);
  return events;
}

/** Damage cannot change the underlying combat clock. Repeated Phaser ticks
 * never extend exposure, reopen plating or duplicate the terminal reward.
 * Optional world-space contact lets integration validate the actual small core
 * independently of the large armored body. Collisions own projectile removal.
 */
export function hitGuardianAtlas(boss, damage = 1, contact = null) {
  finite(damage, 'damage');
  if (damage <= 0) throw new RangeError('Damage must be positive');
  if (contact !== null) {
    if (!contact || ![contact.x, contact.y, contact.radius ?? 0].every(Number.isFinite) ||
        (contact.radius ?? 0) < 0) throw new TypeError('Finite core contact required');
  }
  if (boss.disabled || !boss.vulnerability) return {accepted: false, damage: 0, events: [],
    reason: boss.disabled ? 'disabled' : 'armored'};
  if (contact && Math.hypot(contact.x - boss.x, contact.y - boss.y) > boss.coreRadius + (contact.radius || 0)) {
    return {accepted: false, damage: 0, events: [], reason: 'outside-core'};
  }
  const lost = Math.min(boss.hp, damage);
  boss.hp -= lost; boss.flash = .14; boss.lastHitAt = boss.age;
  const events = [{type: 'hit', damage: lost, hp: boss.hp, maxHp: boss.maxHp}];
  if (boss.hp === 0) {
    boss.disabled = true; boss.telegraph = null; transition(boss, 'disabled', events);
    events.push({type: 'shutdown', rewardId: 'guardian-atlas-access', recordId: boss.recordId});
  } else if (boss.phase === 1 && boss.hp <= boss.maxHp / 2) {
    boss.phase = 2; boss.phaseAttacks = 0; boss.telegraph = null;
    transition(boss, 'phaseBreak', events); events.push({type: 'phase', phase: 2, clearProjectiles: true});
  }
  return {accepted: true, damage: lost, events};
}
