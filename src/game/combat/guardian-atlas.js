const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const finite = (value, name) => {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
};

export const GUARDIAN_ATLAS_RULES = Object.freeze({
  version: 'guardian-atlas-v1', maxHp: 36, maxDelta: .05,
  entrySeconds: 2.2, arrivalSeconds: 1.35, phaseBreakSeconds: 1.65,
  shutdownSeconds: 1.55, hurtSeconds: .16,
  phaseOne: Object.freeze({chargeSeconds: 1.15, fireSeconds: .28, recoverySeconds: 2.05,
    projectileSpeed: 280, projectileDamage: 14}),
  phaseTwo: Object.freeze({chargeSeconds: 1.4, fireSeconds: .62, secondVolleyAt: .34,
    recoverySeconds: 2.25, projectileSpeed: 255, projectileDamage: 12})
});

/**
 * A single encounter owned by the existing game loop. It does not schedule a
 * clock, animate Canvas, update projectiles, change saves, or award a reward.
 * Units are logical Canvas pixels and seconds. The caller must use
 * hitGuardianAtlas rather than changing hp directly, and must move emitted
 * projectiles with vx/vy and expire them after duration seconds.
 */
export function createGuardianAtlas({width = 720, height = 1280,
  playerY = height - 135, seed = 0x41544c41} = {}) {
  finite(width, 'width'); finite(height, 'height'); finite(playerY, 'playerY');
  if (width < 280 || height < 540 || playerY < 430 || playerY > height - 24 ||
    !Number.isInteger(seed)) throw new RangeError('Invalid Guardian Atlas arena');
  const radius = Math.min(104, width * .19);
  const targetY = Math.min(height * .22, playerY - 360);
  return {
    type: 'guardianAtlas', version: GUARDIAN_ATLAS_RULES.version,
    width, height, playerY, seed: seed >>> 0 || 1,
    x: width / 2, y: -radius * 1.6, baseX: width / 2, targetY,
    r: radius, s: 0, rot: 0, rs: 0, p: 0, amp: 0, alpha: 1,
    hp: GUARDIAN_ATLAS_RULES.maxHp, maxHp: GUARDIAN_ATLAS_RULES.maxHp,
    age: 0, state: 'entry', stateTime: 0, phase: 1,
    vulnerability: false, telegraph: null, disabled: false, resolved: false,
    attackId: 0, volley: 0, lastGapIndex: -1, flash: 0,
    resumeState: null, resumeTime: 0
  };
}

function nextRandom(boss) {
  let value = boss.seed;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  boss.seed = value >>> 0;
  return boss.seed / 0x100000000;
}

function rules(boss) {
  return boss.phase === 1 ? GUARDIAN_ATLAS_RULES.phaseOne : GUARDIAN_ATLAS_RULES.phaseTwo;
}

function transition(boss, next, events) {
  boss.state = next;
  boss.stateTime = 0;
  boss.vulnerability = next === 'idle' || next === 'fire' || next === 'hurt';
  events.push({type: 'state', state: next, phase: boss.phase, attackId: boss.attackId});
}

function beginCharge(boss, player, events) {
  boss.attackId++;
  boss.volley = 0;
  const timing = rules(boss);
  const originY = boss.y + boss.r * .7;
  let safeGap = null;
  if (boss.phase === 2) {
    // The second volley repeats the SAME corridor. Changing it while bullets
    // remain in flight would force a crossing through a curtain of fire.
    let index = Math.floor(nextRandom(boss) * 3);
    if (index === boss.lastGapIndex) index = (index + 1) % 3;
    boss.lastGapIndex = index;
    // Preserve the established ship outline (wings reach +/-109 logical
    // pixels), plus an 11px projectile radius and 5px clearance. Do not shrink
    // gameplay collisions to fit a visually narrow warning strip.
    const halfWidth = Math.min(Math.max(125, boss.width * .17), boss.width / 2 - 14);
    const center = clamp(boss.width * [.28, .5, .72][index],
      halfWidth + 14, boss.width - halfWidth - 14);
    safeGap = {left: center - halfWidth, right: center + halfWidth, center};
  }
  boss.telegraph = {
    kind: boss.phase === 1 ? 'aimedSalvo' : 'openCorridor',
    progress: 0, targetX: clamp(player.x, 24, boss.width - 24), targetY: clamp(Number.isFinite(player.y) ? player.y : boss.playerY, 24, boss.height-24),
    originX: boss.x, originY, seconds: timing.chargeSeconds,
    safeGap, attackId: boss.attackId
  };
  transition(boss, 'charge', events);
  events.push({type: 'warning', phase: boss.phase, ...boss.telegraph,
    safeGap: safeGap && {...safeGap}});
}

function projectile(boss, x, y, vx, vy, ordinal) {
  const timing = rules(boss);
  return {
    type: 'meteor', guardianProjectile: true, pattern: boss.telegraph.kind,
    attackId: boss.attackId, volley: boss.volley,
    projectileId: `${boss.attackId}:${boss.volley}:${ordinal}`,
    x, baseX: x, y, vx, vy, s: vy,
    r: boss.phase === 1 ? 10 : 11,
    damage: timing.projectileDamage, duration: 7, life: 7,
    telegraphSeconds: timing.chargeSeconds, safeGap: boss.telegraph.safeGap && {...boss.telegraph.safeGap},
    targetX: boss.telegraph.targetX, targetY: boss.telegraph.targetY,
    rot: Math.atan2(vy, vx) - Math.PI / 2, rs: 0,
    p: 0, phase: 0, amp: 0, special: '', alpha: 1, hp: 1, maxHp: 1
  };
}

function fireVolley(boss, events) {
  const timing = rules(boss);
  const aim = boss.telegraph;
  if (boss.phase === 1) {
    const direction = Math.atan2(aim.targetY - aim.originY, aim.targetX - aim.originX);
    for (const [index, offset] of [-.115, 0, .115].entries()) {
      const angle = direction + offset;
      const shot = projectile(boss, aim.originX, aim.originY,
        Math.cos(angle) * timing.projectileSpeed, Math.sin(angle) * timing.projectileSpeed, index);
      events.push({type: 'projectile', projectile: shot});
    }
  } else {
    for (let index = 0; index < 9; index++) {
      const x = 14 + (boss.width - 28) * index / 8;
      if (x >= aim.safeGap.left - 15 && x <= aim.safeGap.right + 15) continue;
      const shot = projectile(boss, x, aim.originY, 0, timing.projectileSpeed, index);
      events.push({type: 'projectile', projectile: shot});
    }
  }
  events.push({type: 'volley', attackId: boss.attackId, phase: boss.phase, volley: boss.volley});
  boss.volley++;
}

function stateDuration(boss) {
  if (boss.state === 'entry') return GUARDIAN_ATLAS_RULES.entrySeconds;
  if (boss.state === 'phaseBreak') return GUARDIAN_ATLAS_RULES.phaseBreakSeconds;
  if (boss.state === 'disabled') return GUARDIAN_ATLAS_RULES.shutdownSeconds;
  if (boss.state === 'hurt') return GUARDIAN_ATLAS_RULES.hurtSeconds;
  if (boss.state === 'charge') return rules(boss).chargeSeconds;
  if (boss.state === 'fire') return rules(boss).fireSeconds;
  if (boss.attackId === 0) return GUARDIAN_ATLAS_RULES.arrivalSeconds;
  const timing = rules(boss);
  const flightToPlayer = (boss.playerY - (boss.y + boss.r * .7)) / timing.projectileSpeed;
  const lastVolleyAt = boss.phase === 2 ? timing.secondVolleyAt : 0;
  // Do not announce a DIFFERENT escape corridor while an earlier curtain is
  // still crossing the player line. This scales with tall mobile viewports.
  return Math.max(timing.recoverySeconds,
    flightToPlayer + lastVolleyAt + .45 - timing.fireSeconds);
}

function finishState(boss, player, events) {
  if (boss.state === 'entry') {
    boss.y = boss.targetY;
    transition(boss, 'idle', events);
    events.push({type: 'arrival', phase: 1});
  } else if (boss.state === 'idle') {
    beginCharge(boss, player, events);
  } else if (boss.state === 'charge') {
    transition(boss, 'fire', events);
    boss.telegraph.progress = 1;
    fireVolley(boss, events);
  } else if (boss.state === 'fire') {
    boss.telegraph = null;
    transition(boss, 'idle', events);
  } else if (boss.state === 'phaseBreak') {
    transition(boss, 'idle', events);
  } else if (boss.state === 'hurt') {
    // Hit animation does not reset the combat clock; rapid fire cannot lock the
    // guardian forever in its first vulnerable pose.
    transition(boss, boss.resumeState || 'idle', events);
    boss.stateTime = boss.resumeTime;
    boss.resumeState = null;
    boss.resumeTime = 0;
  } else if (boss.state === 'disabled' && !boss.resolved) {
    boss.resolved = true;
    events.push({type: 'disabled', phase: boss.phase, rewardId: 'guardian-atlas-access'});
  }
}

/**
 * Returns ordered events and optionally delivers each event to emit(event).
 * A zero delta changes NOTHING. A long foreground gap advances at most 50 ms;
 * pause/background handling remains the responsibility of the existing loop.
 * Projectiles are emitted only at state transitions, never by a rendered frame.
 */
export function advanceGuardianAtlas(boss, dt, player, emit = () => {}) {
  finite(dt, 'delta');
  if (dt < 0) throw new RangeError('Finite nonnegative delta required');
  if (typeof emit !== 'function') throw new TypeError('Event callback required');
  if (!player || !Number.isFinite(player.x)) throw new TypeError('Player x must be finite');
  if (dt === 0 || boss.resolved) return [];
  const events = [];
  let remaining = Math.min(dt, GUARDIAN_ATLAS_RULES.maxDelta);
  boss.age += remaining;
  boss.flash = Math.max(0, boss.flash - remaining);
  while (remaining > 1e-10 && !boss.resolved) {
    const duration = stateDuration(boss);
    const step = Math.min(remaining, Math.max(0, duration - boss.stateTime));
    const before = boss.stateTime;
    boss.stateTime += step;
    remaining -= step;
    if (boss.state === 'entry') {
      const progress = clamp(boss.stateTime / duration, 0, 1);
      boss.y = -boss.r * 1.6 + (boss.targetY + boss.r * 1.6) * (1 - (1 - progress) ** 3);
    } else if (boss.state === 'idle' || boss.state === 'hurt') {
      boss.x = clamp(boss.width / 2 + Math.sin(boss.age * .64) * boss.width * .11,
        boss.r + 12, boss.width - boss.r - 12);
    } else if (boss.state === 'charge') {
      boss.telegraph.progress = clamp(boss.stateTime / duration, 0, 1);
    } else if (boss.state === 'fire' && boss.phase === 2 && boss.volley === 1 &&
      before < rules(boss).secondVolleyAt && boss.stateTime >= rules(boss).secondVolleyAt) {
      fireVolley(boss, events);
    }
    if (boss.stateTime + 1e-10 >= duration) finishState(boss, player, events);
    else break;
  }
  for (const event of events) emit(event);
  return events;
}

/**
 * Combat owns damage; rendering reads the resulting state. `shutdown` begins
 * the authored deactivation animation. `disabled` is emitted ONCE, later, by
 * advanceGuardianAtlas when that animation has completed. Reward/progression
 * belongs to the integration, which should use that terminal event.
 */
export function hitGuardianAtlas(boss, damage = 1) {
  finite(damage, 'damage');
  if (damage <= 0) throw new RangeError('Damage must be positive');
  if (boss.disabled || !boss.vulnerability) return {accepted: false, damage: 0, events: [],
    reason: boss.disabled ? 'disabled' : 'armored'};
  const lost = Math.min(boss.hp, damage);
  boss.hp -= lost;
  boss.flash = .14;
  const events = [{type: 'hit', damage: lost, hp: boss.hp, maxHp: boss.maxHp}];
  if (boss.hp === 0) {
    boss.disabled = true;
    boss.telegraph = null;
    boss.resumeState = null;
    transition(boss, 'disabled', events);
    events.push({type: 'shutdown', rewardId: 'guardian-atlas-access'});
  } else if (boss.phase === 1 && boss.hp <= boss.maxHp / 2) {
    boss.phase = 2;
    boss.telegraph = null;
    boss.resumeState = null;
    transition(boss, 'phaseBreak', events);
    events.push({type: 'phase', phase: 2, clearProjectiles: true});
  } else if (boss.state !== 'hurt') {
    boss.resumeState = boss.state;
    boss.resumeTime = boss.stateTime;
    transition(boss, 'hurt', events);
  }
  return {accepted: true, damage: lost, events};
}
