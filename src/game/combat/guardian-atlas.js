const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const finite = (value, name) => {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
};

export const GUARDIAN_ATLAS_RULES = Object.freeze({
  version: 'guardian-atlas-v8', maxHp: 96, maxDelta: .05,
  entrySeconds: 2.2, closedSeconds: .85,
  // v8: ventana de núcleo más corta (antes 3,8 s) y más corta aún en la fase 2.
  openingSeconds: .65, exposedSeconds: 3.0, exposedPhaseTwoSeconds: 2.5, closingSeconds: .55,
  phaseBreakSeconds: 1.25, shutdownSeconds: 1.55, hurtSeconds: .16,
  coreRadius: 42, maxProjectilesPerAttack: 10, tailClearance: 56,
  phaseOne: Object.freeze({projectileSpeed: 460, projectileDamage: 13}),
  phaseTwo: Object.freeze({projectileSpeed: 520, projectileDamage: 15}),
  motion: Object.freeze({acceleration: 200, maxSpeed: 132, maxVerticalSpeed: 26,
    exposedSpeed: 32, exposedPhaseTwoSpeed: 38, observationSeconds: .22}),
  attacks: Object.freeze({
    basic: Object.freeze({chargeSeconds: .36, volleyTimes: Object.freeze([0]), damage: 13}),
    medium: Object.freeze({chargeSeconds: .52, volleyTimes: Object.freeze([0, .34]), damage: 15}),
    superpower: Object.freeze({chargeSeconds: .86, volleyTimes: Object.freeze([0, .45]), damage: 22}),
    // Ataque fulminante: carga larga y visible, un muro de orbes pesados con
    // un único hueco alcanzable que obliga a moverse.
    fulminant: Object.freeze({chargeSeconds: 1.05, volleyTimes: Object.freeze([0]), damage: 26})
  }),
  fulminant: Object.freeze({spacing: 64, gapHalf: 115, phaseTwoGapHalf: 100, speed: 390, phaseTwoSpeed: 440,
    minPlayerDistance: 170, everyAttacks: Object.freeze([3, 5]), phaseTwoEveryAttacks: Object.freeze([2, 4])}),
  // Ataques encadenados antes de abrir el núcleo, una vez presentadas las rutinas.
  chains: Object.freeze({phaseOneChance: .45, phaseTwoMinimum: 1, phaseTwoExtraChance: .4}),
  patterns: Object.freeze({
    duelBurst: Object.freeze({volleyTimes: Object.freeze([0, .24]), projectiles: 2}),
    staggeredSalvo: Object.freeze({volleyTimes: Object.freeze([0, .25, .58]), projectiles: 3}),
    flankSalvo: Object.freeze({volleyTimes: Object.freeze([0, .36]), projectiles: 4}),
    reactorSweep: Object.freeze({volleyTimes: Object.freeze([0, .34, .72]), projectiles: 3}),
    reactorPincer: Object.freeze({volleyTimes: Object.freeze([0, .48]), projectiles: 5})
  })
});

/** One encounter driven by the existing update. It owns no clock, projectile
 * movement, rendering, save, money or reward. The core is damageable only in
 * EXPOSED, never while attacking, opening, closing or changing phase. Version 7
 * keeps the three introductory routines, then varies sampled interception,
 * staggered salvos and reactor sweeps. The renderer and collision integration
 * both use the same moving x/y, never a decorative offset.
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
    observation: null, nextObservationAt: 0, lastPattern: null, attackDecision: null,
    previousPatterns: {basic: null, medium: null, superpower: null}, tacticalManeuver: 'patrol',
    attacksSinceSuperpower: 0, attacksSinceFulminant: 0, nextFulminantAfter: 4, chainRemaining: 0,
    motionDecision: 0, nextMotionAt: 0,
    motionX: width / 2, motionY: targetY, motionVx: 0, motionVy: 0,
    motionSide: seed % 2 ? -1 : 1,
    flash: 0, lastHitAt: null,
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
const patternRules = boss => GUARDIAN_ATLAS_RULES.patterns[boss.telegraph?.pattern];
const volleyTimes = boss => patternRules(boss)?.volleyTimes || attackRules(boss).volleyTimes;

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
  boss.nextObservationAt = boss.age + GUARDIAN_ATLAS_RULES.motion.observationSeconds;
}
function motionBounds(boss) {
  const margin = Math.min(boss.width * .42,Math.max(boss.r + Math.min(18, boss.width * .025),
    Number.isFinite(boss.presentationHalfWidth)?boss.presentationHalfWidth+8:0));
  const top = Math.max(64, boss.targetY - 16);
  return {left: margin, right: boss.width - margin,
    top, bottom: Math.max(top, Math.min(boss.playerY - 210, boss.targetY + 24))};
}
function planMotion(boss) {
  const bounds = motionBounds(boss), sample = boss.observation || {x: boss.width / 2, vx: 0};
  const exposed = boss.state === 'exposed';
  const underFire = boss.lastHitAt !== null && boss.age - boss.lastHitAt < .55;
  const space = bounds.right - bounds.left;
  // A target is chosen from observations, then approached with acceleration.
  // No position snap or projectile homing is needed to flank an occupied lane.
  if (boss.x > bounds.right - Math.min(40, space * .2)) boss.motionSide = -1;
  else if (boss.x < bounds.left + Math.min(40, space * .2)) boss.motionSide = 1;
  else if (!exposed && (underFire || Math.abs(boss.x - boss.motionX) < Math.min(26, space * .12))) {
    boss.motionSide = -boss.motionSide;
  }
  const tacticalAttack = boss.state === 'charge' || boss.state === 'fire';
  if (tacticalAttack && boss.tacticalManeuver === 'flank') {
    boss.motionSide = boss.telegraph.sweepDirection;
  }
  const flank = exposed ? space * .24 : space * (.28 + nextRandom(boss) * .17);
  const lead = clamp(sample.vx * .24, -boss.width * .10, boss.width * .10);
  const target = exposed ? boss.x + boss.motionSide * flank
    : tacticalAttack && boss.tacticalManeuver === 'withdraw' ? boss.width / 2 + boss.motionSide * space * .34
      : sample.x + lead + boss.motionSide * flank;
  boss.motionX = clamp(target, bounds.left, bounds.right);
  const verticalPhase = boss.motionDecision * 1.7 + boss.phase * .9;
  boss.motionY = clamp(boss.targetY + (tacticalAttack && boss.tacticalManeuver === 'withdraw'
    ? -16 : Math.sin(verticalPhase) * 18), bounds.top, bounds.bottom);
  boss.nextMotionAt = boss.age + (exposed ? 1.15 : tacticalAttack ? .8 : 1.25 + nextRandom(boss) * .5);
  boss.motionDecision++;
}
function moveAtlas(boss, dt) {
  if (!dt || boss.disabled || boss.state === 'entry') return;
  if (boss.age + 1e-9 >= boss.nextMotionAt) planMotion(boss);
  const rules = GUARDIAN_ATLAS_RULES.motion, bounds = motionBounds(boss);
  const exposed = boss.state === 'exposed';
  const maxSpeed = exposed ? (boss.phase === 2 ? rules.exposedPhaseTwoSpeed : rules.exposedSpeed)
    : boss.state === 'opening' ? 68 : boss.phase === 2 ? rules.maxSpeed : 108;
  const desiredVx = clamp((boss.motionX - boss.x) * 2.4, -maxSpeed, maxSpeed);
  const desiredVy = clamp((boss.motionY - boss.y) * 2, -rules.maxVerticalSpeed, rules.maxVerticalSpeed);
  boss.motionVx += clamp(desiredVx - boss.motionVx, -rules.acceleration * dt, rules.acceleration * dt);
  boss.motionVy += clamp(desiredVy - boss.motionVy, -rules.acceleration * dt, rules.acceleration * dt);
  const x = boss.x + boss.motionVx * dt, y = boss.y + boss.motionVy * dt;
  boss.x = clamp(x, bounds.left, bounds.right); boss.y = clamp(y, bounds.top, bounds.bottom);
  if (boss.x !== x) boss.motionVx = 0;
  if (boss.y !== y) boss.motionVy = 0;
}
function transition(boss, next, events) {
  boss.state = next; boss.stateTime = 0;
  if (next === 'closed' || next === 'opening' || next === 'exposed') boss.nextMotionAt = boss.age;
  updateCore(boss);
  events.push({type: 'state', state: next, phase: boss.phase, attackId: boss.attackId});
  if (next === 'opening') events.push({type: 'opening', phase: boss.phase});
  if (next === 'exposed') events.push({type: 'coreExposed', phase: boss.phase,
    seconds: boss.phase === 1 ? GUARDIAN_ATLAS_RULES.exposedSeconds : GUARDIAN_ATLAS_RULES.exposedPhaseTwoSeconds,
    coreRadius: boss.coreRadius});
  if (next === 'closing') events.push({type: 'coreClosed', phase: boss.phase});
}
function scheduleFulminant(boss) {
  const [low, high] = boss.phase === 1 ? GUARDIAN_ATLAS_RULES.fulminant.everyAttacks
    : GUARDIAN_ATLAS_RULES.fulminant.phaseTwoEveryAttacks;
  boss.nextFulminantAfter = low + Math.floor(nextRandom(boss) * (high - low + 1));
}
function beginCharge(boss, player, events, chained = false) {
  boss.attackId++; boss.phaseAttacks++; boss.volley = 0; boss.attackClearanceSeconds = 0;
  const tiers = boss.phase === 1 ? ['basic', 'medium', 'superpower'] : ['medium', 'basic', 'superpower'];
  const sample = boss.observation || {x: player.x, y: boss.playerY, vx: 0, at: boss.age};
  // Teach all three routines once; later choices react to sampled movement,
  // rather than repeating the same basic/medium/superpower turn forever.
  if (boss.phaseAttacks <= 3) {
    boss.attackTier = tiers[boss.phaseAttacks - 1]; boss.attackDecision = 'introduce-routine';
  } else if (boss.attacksSinceFulminant >= boss.nextFulminantAfter) {
    boss.attackTier = 'fulminant'; boss.attackDecision = 'crono-rupture';
  } else if (boss.attacksSinceSuperpower >= 3) {
    boss.attackTier = 'superpower'; boss.attackDecision = 'reactor-recharged';
  } else if (Math.abs(sample.vx) >= 85 || Math.abs(sample.x - boss.width / 2) >= boss.width * .27) {
    // v8: el flanqueo suele responderse con un ataque medio, pero no siempre.
    boss.attackTier = nextRandom(boss) < .7 ? 'medium' : 'basic'; boss.attackDecision = 'intercept-flank';
  } else {
    boss.attackTier = nextRandom(boss) < .5 ? 'medium' : 'basic'; boss.attackDecision = 'pressure-observed-lane';
  }
  boss.attacksSinceSuperpower = boss.attackTier === 'superpower' ? 0 : boss.attacksSinceSuperpower + 1;
  if (boss.attackTier === 'fulminant') { boss.attacksSinceFulminant = 0; scheduleFulminant(boss); }
  else if (boss.phaseAttacks > 3) boss.attacksSinceFulminant++;
  // Tras presentar las rutinas, cada ciclo de la fase 1 puede encadenar un
  // ataque más antes de abrir el núcleo; la fase 2 siempre encadena 1-2.
  if (!chained) {
    const chains = GUARDIAN_ATLAS_RULES.chains;
    boss.chainRemaining = boss.phase === 2
      ? chains.phaseTwoMinimum + (nextRandom(boss) < chains.phaseTwoExtraChance ? 1 : 0)
      : boss.phaseAttacks <= 3 ? 0 : nextRandom(boss) < chains.phaseOneChance ? 1 : 0;
  }
  const tier = boss.attackTier;
  let pattern = tier === 'fulminant' ? 'cronoRupture' : tier === 'superpower' ? 'reactorBarrage' : tier === 'medium'
    ? boss.phase === 1 ? 'crossfire' : 'rakingSalvo' : boss.phase === 1 ? 'focusedSalvo' : 'leadSalvo';
  if ((boss.phaseAttacks > 3 || boss.phase === 2) && tier !== 'fulminant') {
    const options = tier === 'basic' ? ['duelBurst'] : tier === 'medium'
      ? Math.abs(sample.vx) >= 85 ? ['flankSalvo', 'staggeredSalvo'] : ['staggeredSalvo', 'flankSalvo']
      : ['reactorSweep', 'reactorPincer'];
    const candidates = options.filter(candidate => candidate !== boss.previousPatterns[tier]);
    pattern = candidates[Math.floor(nextRandom(boss) * candidates.length)] || options[0];
  }
  boss.previousPatterns[tier] = pattern;
  const leadOffset = tier === 'basic' && boss.phase === 1 ? 0 : clamp(sample.vx * .28, -100, 100);
  const originY = boss.y + boss.r * .7;
  boss.lastPattern = pattern;
  // A maneuver is committed with the attack. New samples cannot rotate an
  // already emitted shot or move the sweep's destination under the player.
  const sweepDirection = sample.vx ? Math.sign(sample.vx) : sample.x < boss.width / 2 ? 1 : -1;
  boss.tacticalManeuver = tier === 'fulminant' ? 'withdraw'
    : pattern === 'flankSalvo' || pattern === 'staggeredSalvo' ? 'flank'
    : tier === 'superpower' ? 'withdraw' : 'pressure';
  boss.nextMotionAt = boss.age;
  boss.telegraph = {kind: 'mechanicalDeployment', pattern, attackTier: tier, progress: 0,
    targetX: clamp(sample.x + leadOffset, 24, boss.width - 24),
    // A pilot moving above the guns must not produce upward/negative-lifetime
    // ordnance. Arena layout remains the integration's responsibility.
    targetY: Math.max(originY + 180, sample.y), observedX: sample.x,
    observedVx: sample.vx, observedAt: sample.at, leadOffset,
    originX: boss.x, originY, seconds: attackRules(boss).chargeSeconds,
    safeGap: null, attackId: boss.attackId, decision: boss.attackDecision,
    sweepDirection, maneuver: boss.tacticalManeuver};
  transition(boss, 'charge', events);
  // Animation-only compatibility event. Integration must not reveal aim or a
  // future safe lane through HUD warnings, reticles or helper lines.
  events.push({type: 'warning', phase: boss.phase, ...boss.telegraph});
  // Alarma propia del ataque fulminante (sonido/destello de pantalla). No
  // revela dónde quedará el hueco.
  if (tier === 'fulminant') events.push({type: 'fulminant', phase: boss.phase, attackId: boss.attackId,
    seconds: attackRules(boss).chargeSeconds});
}
function projectile(boss, x, y, vx, vy, ordinal, targetX) {
  const aim = boss.telegraph, heavy = boss.attackTier === 'superpower' || boss.attackTier === 'fulminant';
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
// Cortina de la Ruptura Crono: Atlas libera orbes pesados a lo largo de una
// línea a su altura que caen rectos y cubren todo el ancho salvo un hueco,
// elegido al azar y preferiblemente lejos de la posición observada. Al caer
// en vertical, el hueco a la altura de la nave es exacto.
function fireCronoRupture(boss, events, fireTime) {
  const rule = GUARDIAN_ATLAS_RULES.fulminant, aim = boss.telegraph;
  const originY = boss.y + boss.r * .7;
  const gapHalf = Math.min(boss.phase === 1 ? rule.gapHalf : rule.phaseTwoGapHalf, boss.width * .3);
  const low = gapHalf + 12, high = boss.width - gapHalf - 12;
  let gapX = (low + high) / 2, best = -1;
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = low + nextRandom(boss) * Math.max(0, high - low);
    const distance = Math.abs(candidate - aim.observedX);
    if (distance >= rule.minPlayerDistance) { gapX = candidate; break; }
    if (distance > best) { best = distance; gapX = candidate; }
  }
  const spacing = Math.min(rule.spacing, (boss.width - 48) / 8);
  const speed = boss.phase === 1 ? rule.speed : rule.phaseTwoSpeed;
  let ordinal = 0;
  for (let x = 24; x <= boss.width - 24 + 1e-9 && ordinal < GUARDIAN_ATLAS_RULES.maxProjectilesPerAttack; x += spacing) {
    if (Math.abs(x - gapX) < gapHalf) continue;
    const shot = projectile(boss, x, originY, 0, speed, ordinal++, x);
    shot.targetY = Math.max(originY + 180, aim.targetY); shot.fulminant = true;
    boss.attackClearanceSeconds = Math.max(boss.attackClearanceSeconds,
      fireTime + (boss.playerY + GUARDIAN_ATLAS_RULES.tailClearance + shot.r - shot.y) / shot.vy);
    events.push({type: 'projectile', projectile: shot});
  }
  events.push({type: 'volley', attackId: boss.attackId, phase: boss.phase,
    attackTier: boss.attackTier, volley: boss.volley, x: boss.x, y: originY, fulminant: true});
  boss.volley++;
}
function fireVolley(boss, events, fireTime = boss.stateTime) {
  if (boss.attackTier === 'fulminant') return fireCronoRupture(boss, events, fireTime);
  const aim = boss.telegraph, tier = boss.attackTier, heavy = tier === 'superpower';
  const crossfire = ['crossfire', 'flankSalvo', 'reactorPincer'].includes(aim.pattern);
  const originSide = (boss.volley === 0 ? -1 : 1) * (aim.pattern === 'crossfire' ? 1 : aim.sweepDirection);
  const originX = boss.x + (crossfire ? originSide * boss.r * .72 : 0);
  const originY = boss.y + boss.r * .7;
  const targetY = Math.max(originY + 180, aim.targetY);
  const rake = Math.min(44, (targetY - originY) * .09);
  const sweep = aim.pattern === 'staggeredSalvo' ? [-1, 1, 0][boss.volley] * boss.width * .065
    : aim.pattern === 'reactorSweep' ? (boss.volley - 1) * boss.width * .09
      : aim.pattern === 'reactorPincer' ? (boss.volley === 0 ? -1 : 1) * boss.width * .055
        : aim.pattern === 'flankSalvo' ? (boss.volley === 0 ? -.025 : .04) * boss.width
          : aim.pattern === 'duelBurst' ? (boss.volley === 0 ? -.018 : .018) * boss.width : 0;
  const targetX = clamp(aim.targetX + sweep * aim.sweepDirection + (aim.pattern === 'rakingSalvo'
    ? (boss.volley === 0 ? -rake : rake) : 0), 24, boss.width - 24);
  const distance = targetY - originY;
  const direction = Math.atan2(distance, targetX - originX);
  // The heavy barrage occupies a wider observed sector, but is slower and
  // retains an escape outside that sector. Small fixture arenas use a narrow
  // fan rather than an unavoidable full-width wall. No safe corridor is stored.
  const spread = heavy ? Math.atan2(boss.width * (boss.width < 440 ? .055 : patternRules(boss) ? .12 : .24), distance) :
    aim.pattern === 'rakingSalvo' ? .035 : .045;
  const count = patternRules(boss)?.projectiles;
  const offsets = count ? Array.from({length: count}, (_, index) => (index / (count - 1) * 2 - 1) * spread)
    : heavy || (tier === 'medium' && boss.phase === 2)
    ? [-spread, -spread / 2, 0, spread / 2, spread] : [-spread, 0, spread];
  const speed = heavy ? (boss.phase === 1 ? 300 : 325) : phaseRules(boss).projectileSpeed;
  for (const [index, offset] of offsets.entries()) {
    const angle = direction + offset;
    const shot = projectile(boss, originX, originY,
      Math.cos(angle) * speed, Math.sin(angle) * speed, index, targetX);
    shot.targetY = targetY;
    boss.attackClearanceSeconds = Math.max(boss.attackClearanceSeconds,
      fireTime + (boss.playerY + GUARDIAN_ATLAS_RULES.tailClearance + shot.r - shot.y) / shot.vy);
    events.push({type: 'projectile', projectile: shot});
  }
  events.push({type: 'volley', attackId: boss.attackId, phase: boss.phase,
    attackTier: tier, volley: boss.volley, x: originX, y: originY});
  boss.volley++;
}
function stateDuration(boss) {
  const rule = GUARDIAN_ATLAS_RULES;
  if (boss.state === 'entry') return rule.entrySeconds;
  if (boss.state === 'closed') return rule.closedSeconds;
  if (boss.state === 'charge') return attackRules(boss).chargeSeconds;
  if (boss.state === 'fire') return Math.max(volleyTimes(boss).at(-1) + .08,
    boss.attackClearanceSeconds + .12);
  if (boss.state === 'opening') return rule.openingSeconds;
  if (boss.state === 'exposed') return boss.phase === 1 ? rule.exposedSeconds : rule.exposedPhaseTwoSeconds;
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
  } else if (boss.state === 'fire') {
    boss.telegraph = null;
    if (boss.chainRemaining > 0) { boss.chainRemaining--; beginCharge(boss, player, events, true); }
    else transition(boss, 'opening', events);
  }
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
    } else moveAtlas(boss, step);
    if (boss.state === 'charge') boss.telegraph.progress = clamp(boss.stateTime / duration, 0, 1);
    else if (boss.state === 'fire') {
      const schedule = volleyTimes(boss);
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
    boss.phase = 2; boss.phaseAttacks = 0; boss.telegraph = null; boss.chainRemaining = 0;
    boss.attacksSinceFulminant = 0; scheduleFulminant(boss);
    transition(boss, 'phaseBreak', events); events.push({type: 'phase', phase: 2, clearProjectiles: true});
  }
  return {accepted: true, damage: lost, events};
}
