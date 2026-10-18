const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const finite = (value, name) => {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
};

export const GUARDIAN_ATLAS_RULES = Object.freeze({
  version: 'guardian-atlas-v4', maxHp: 36, maxDelta: .05,
  entrySeconds: 2.2, arrivalSeconds: 1.1, phaseBreakSeconds: 1.35,
  shutdownSeconds: 1.55, hurtSeconds: .16,
  phaseOne: Object.freeze({chargeSeconds: .38, fireSeconds: .28, recoverySeconds: 1.95,
    repositionSeconds: .8, counterattackSeconds: 1.25,
    projectileSpeed: 400, projectileDamage: 14}),
  phaseTwo: Object.freeze({chargeSeconds: .34, fireSeconds: .56, secondVolleyAt: .30,
    recoverySeconds: 1.8, repositionSeconds: .72, counterattackSeconds: 1.35,
    projectileSpeed: 430, projectileDamage: 13})
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
    attackId: 0, volley: 0, lastGapIndex: -1, phaseTwoAttacks: 0,
    observation: null, nextObservationAt: 0, lastPattern: null,
    attackClearanceSeconds: 0, flash: 0,
    patrolFromX: width / 2, patrolToX: width / 2,
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

function updateVulnerability(boss) {
  const recoveryTime = boss.state === 'hurt' ? boss.resumeTime : boss.stateTime;
  const effectiveState = boss.state === 'hurt' ? boss.resumeState : boss.state;
  boss.vulnerability = effectiveState === 'fire' || (effectiveState === 'idle' &&
    (boss.attackId === 0 || recoveryTime >= rules(boss).repositionSeconds));
}

function observePlayer(boss, player) {
  if (boss.age + 1e-9 < boss.nextObservationAt) return;
  const prior = boss.observation, elapsed = prior ? boss.age - prior.at : 0;
  const x = clamp(player.x, 24, boss.width - 24);
  const y = clamp(Number.isFinite(player.y) ? player.y : boss.playerY, 24, boss.height - 24);
  const vx = elapsed > 0 ? clamp((x - prior.x) / elapsed, -720, 720) : 0;
  boss.observation = {x, y, at: boss.age, vx: prior ? prior.vx * .4 + vx * .6 : 0};
  boss.nextObservationAt = boss.age + .22;
}

function transition(boss, next, events, resume = false) {
  boss.state = next;
  boss.stateTime = 0;
  if (next === 'idle' && !resume) {
    boss.patrolFromX = boss.x;
    const sample = boss.observation || {x: boss.width / 2, vx: 0};
    const approachDistance = boss.playerY - (boss.targetY + boss.r * .7);
    const offset = Math.min(boss.width * .22, Math.max(0, approachDistance * .16));
    // Cut toward an observed flank instead of alternating fixed screen lanes.
    // Slow/stationary pilots are bracketed; a moving pilot can reverse direction.
    const direction = Math.abs(sample.vx) > 50 ? Math.sign(sample.vx) :
      sample.x < boss.width / 2 ? -1 : sample.x > boss.width / 2 ? 1 :
        (nextRandom(boss) < .5 ? -1 : 1);
    const lead = clamp(sample.vx * .2, -55, 55);
    boss.patrolToX = boss.attackId === 0 ? boss.width / 2 : clamp(
      sample.x + direction * offset * .55 + lead,
      Math.max(boss.r + 12, boss.width / 2 - offset),
      Math.min(boss.width - boss.r - 12, boss.width / 2 + offset));
  }
  updateVulnerability(boss);
  events.push({type: 'state', state: next, phase: boss.phase, attackId: boss.attackId});
}

function beginCharge(boss, player, events) {
  boss.attackId++;
  boss.volley = 0;
  boss.attackClearanceSeconds = 0;
  const timing = rules(boss);
  const sample = boss.observation || {x: player.x, y: boss.playerY, vx: 0, at: boss.age};
  if (boss.phase === 2) boss.phaseTwoAttacks++;
  // Patterns describe physical cannon routines, not a HUD instruction or an
  // advertised safe corridor. All projectiles remain ballistic after emission.
  const pattern = boss.phase === 1 ? (boss.attackId % 2 ? 'focusedSalvo' : 'leadSalvo') :
    ['crossfire', 'rakingSalvo', 'leadSalvo'][(boss.phaseTwoAttacks - 1) % 3];
  const leadOffset = pattern === 'focusedSalvo' ? 0 : clamp(sample.vx * .3, -105, 105);
  boss.lastPattern = pattern;
  boss.telegraph = {
    kind: 'aimedSalvo', pattern, progress: 0,
    targetX: clamp(sample.x + leadOffset, 24, boss.width - 24),
    targetY: sample.y, observedX: sample.x, observedVx: sample.vx,
    observedAt: sample.at, leadOffset,
    originX: boss.x, originY: boss.y + boss.r * .7,
    seconds: timing.chargeSeconds, safeGap: null, attackId: boss.attackId
  };
  transition(boss, 'charge', events);
  // Kept as a model/animation event for integration compatibility. The game
  // must not turn the short mechanical deployment into a target marker.
  events.push({type: 'warning', phase: boss.phase, ...boss.telegraph});
}

function projectile(boss, x, y, vx, vy, ordinal) {
  const timing = rules(boss);
  return {
    type: 'meteor', guardianProjectile: true, pattern: boss.telegraph.pattern,
    attackId: boss.attackId, volley: boss.volley,
    projectileId: `${boss.attackId}:${boss.volley}:${ordinal}`,
    x, baseX: x, y, vx, vy, s: vy,
    r: boss.phase === 1 ? 10 : 11,
    damage: timing.projectileDamage, duration: 7, life: 7,
    telegraphSeconds: timing.chargeSeconds, safeGap: null,
    observedX: boss.telegraph.observedX, observedVx: boss.telegraph.observedVx,
    leadOffset: boss.telegraph.leadOffset,
    targetX: boss.telegraph.targetX, targetY: boss.telegraph.targetY,
    rot: Math.atan2(vy, vx) - Math.PI / 2, rs: 0,
    p: 0, phase: 0, amp: 0, special: '', alpha: 1, hp: 1, maxHp: 1
  };
}

function fireVolley(boss, events, fireTime = boss.stateTime) {
  const timing = rules(boss), aim = boss.telegraph;
  const crossfire = aim.pattern === 'crossfire';
  const originX = aim.originX + (crossfire ? (boss.volley === 0 ? -1 : 1) * boss.r * .72 : 0);
  // Raking guns cross a small observed area in two successive volleys. The
  // offset is limited on short arenas so the full unchanged hull can escape.
  const rake = Math.min(54, Math.max(0, (aim.targetY - aim.originY) * .10));
  const targetX = clamp(aim.targetX + (aim.pattern === 'rakingSalvo' ?
    (boss.volley === 0 ? -rake : rake) : 0), 24, boss.width - 24);
  const direction = Math.atan2(aim.targetY - aim.originY, targetX - originX);
  const spread = aim.pattern === 'rakingSalvo' ? .024 : crossfire ? .045 : .055;
  const offsets = crossfire ? [-spread, -spread / 2, 0, spread / 2, spread] : [-spread, 0, spread];
  const shots = offsets.map((offset, index) => {
    const angle = direction + offset;
    const shot = projectile(boss, originX, aim.originY,
      Math.cos(angle) * timing.projectileSpeed, Math.sin(angle) * timing.projectileSpeed, index);
    shot.targetX = targetX;
    return shot;
  });
  for (const shot of shots) {
    // Combat may re-aim only after the physical tail clears the old salvo.
    // This preserves an actual counterattack window without a safe-lane UI.
    boss.attackClearanceSeconds = Math.max(boss.attackClearanceSeconds,
      fireTime + (boss.playerY + 104 + shot.r - shot.y) / shot.vy);
    events.push({type: 'projectile', projectile: shot});
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
  // After avoiding a salvo, a manual pilot needs time to re-align and let a
  // real projectile travel to the core. An exposed pose while the ship is
  // trapped in a different lane is not a usable counterattack opportunity.
  return Math.max(timing.recoverySeconds,
    boss.attackClearanceSeconds + timing.counterattackSeconds - timing.fireSeconds);
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
    // The underlying combat clock keeps advancing through the visual recoil;
    // repeated impacts cannot extend a vulnerability window or delay an attack.
    transition(boss, boss.resumeState || 'idle', events, true);
    boss.stateTime = boss.resumeTime;
    boss.resumeState = null;
    boss.resumeTime = 0;
    updateVulnerability(boss);
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
  observePlayer(boss, player);
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
      if (boss.state === 'hurt') {
        const resumedBefore = boss.resumeTime;
        boss.resumeTime += step;
        if (boss.resumeState === 'fire' && boss.phase === 2 && boss.volley === 1 &&
          resumedBefore < rules(boss).secondVolleyAt && boss.resumeTime >= rules(boss).secondVolleyAt) {
          fireVolley(boss, events, boss.resumeTime);
        }
      }
      const recoveryTime = boss.state === 'hurt' ? boss.resumeTime : boss.stateTime;
      if (boss.state === 'idle' || boss.resumeState === 'idle') {
        const progress = clamp(recoveryTime / rules(boss).repositionSeconds, 0, 1);
        const smooth = progress * progress * (3 - 2 * progress);
        boss.x = boss.patrolFromX + (boss.patrolToX - boss.patrolFromX) * smooth;
      }
    } else if (boss.state === 'charge') {
      boss.telegraph.progress = clamp(boss.stateTime / duration, 0, 1);
    } else if (boss.state === 'fire' && boss.phase === 2 && boss.volley === 1 &&
      before < rules(boss).secondVolleyAt && boss.stateTime >= rules(boss).secondVolleyAt) {
      fireVolley(boss, events);
    }
    updateVulnerability(boss);
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
