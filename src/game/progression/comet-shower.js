/**
 * Authored crossings for El gran vacío. This is an encounter policy, not a
 * second route clock or update loop. The legacy caller advances it with played
 * delta only and integrates emitted items once with advanceShowerComet.
 */
export const COMET_SHOWER_VERSION = 'comet-shower-v2';
export const COMET_SHOWER_RULES = Object.freeze({
  maxActive: 5, warningSeconds: 2, resumeGraceSeconds: 7,
  maxDelta: .05, shipWidth: 208, corridorClearance: 40,
  minSpeed: 700, maxSpeed: 950, boundsMargin: 128,
  burstStarts: Object.freeze([7, 16, 25])
});

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const finite = (value, label) => {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite`);
  return value;
};
const randomFor = seed => {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
};
const validateDelta = delta => {
  finite(delta, 'delta');
  if (delta < 0) throw new RangeError('delta must not be negative');
  return Math.min(delta, COMET_SHOWER_RULES.maxDelta);
};
const positionAt = (item, seconds) => ({
  x: item.x + item.vx * seconds + item.ax * seconds * seconds / 2,
  y: item.y + item.vy * seconds + item.ay * seconds * seconds / 2
});

function corridorFor(width, height, seed, burst) {
  // Flight controls reserve 119 logical pixels on either side of the hull.
  // On a very narrow fixture the safe center collapses, rather than pretending
  // that the same hull has become smaller or offering an unreachable escape.
  const minimum = Math.min(119, width / 2), maximum = width - minimum;
  const side = ((Math.abs(Math.trunc(seed)) + burst) % 2) ? 1 : -1;
  const center = clamp(width * (side < 0 ? .30 : .70), minimum, maximum);
  const corridorWidth = COMET_SHOWER_RULES.shipWidth + COMET_SHOWER_RULES.corridorClearance;
  return Object.freeze({center, width: corridorWidth, left: center - corridorWidth / 2,
    right: center + corridorWidth / 2, top: height * .48, bottom: height + 128,
    side, burst});
}

function staysOutsideCorridor(item, corridor) {
  // Validate the complete ballistic path, not just its spawn point. The
  // corridor applies in the lower flight area; high lateral passes preserve a
  // route beneath them. Eight milliseconds is smaller than a normal frame.
  const clearance = item.r + 12;
  for (let seconds = 0; seconds <= item.life; seconds += .008) {
    const point = positionAt(item, seconds);
    if (point.y + clearance < corridor.top || point.y - clearance > corridor.bottom) continue;
    if (point.x + clearance >= corridor.left && point.x - clearance <= corridor.right) return false;
  }
  return true;
}

function makeCandidate(state, burst, ordinal, mode) {
  const {width, height} = state, corridor = state.corridors[burst];
  const random = randomFor(state.seed + burst * 1013 + ordinal * 7919 + mode * 211);
  const speed = COMET_SHOWER_RULES.minSpeed + random() *
    (COMET_SHOWER_RULES.maxSpeed - COMET_SHOWER_RULES.minSpeed);
  const margin = 96, dangerSide = -corridor.side;
  let x, y, vx, vy, ax, ay;
  if (mode === 0) {
    // A broadside train crosses the upper corridor. Its nucleus travels across
    // the scene; the tail naturally points against instantaneous velocity.
    const direction = ((burst + ordinal + state.seed) & 1) ? -1 : 1;
    x = direction > 0 ? -margin : width + margin;
    y = height * (.12 + random() * .035);
    vy = speed * Math.min(.14, height * .19 / (width + margin * 2));
    vx = direction * Math.sqrt(speed * speed - vy * vy);
    ax = -direction * (12 + random() * 12);
    ay = Math.min(10 + random() * 6, height * .012);
  } else {
    // Diagonal rain and overtaking objects occupy the opposite side of the
    // reserved passage. Acceleration is authored once and never tracks a ship.
    const laneMinimum = dangerSide < 0 ? 32 : corridor.right + 44;
    const laneMaximum = dangerSide < 0 ? corridor.left - 44 : width - 32;
    const fraction=width>=500?(dangerSide<0?.46:.54):(dangerSide<0?.25:.75);
    const preferredX = width * fraction + (random() - .5) * 30;
    // Keep the rain inside useful flight lanes. Placing it at x≈60/660 on the
    // 720px field would let a ship ignore every crossing from the center.
    // The v2 wide-field lanes pass close enough to the center to require a
    // response, while the full-width safe lane remains on the opposite side.
    x = laneMinimum <= laneMaximum ? clamp(preferredX, laneMinimum, laneMaximum) : preferredX;
    y = mode === 1 ? -margin : height + margin;
    vx = dangerSide * (15 + random() * 15);
    vy = (mode === 1 ? 1 : -1) * speed;
    ax = -dangerSide * (8 + random() * 5);
    ay = (mode === 1 ? 1 : -1) * (12 + random() * 10);
  }
  const id = `${COMET_SHOWER_VERSION}:${state.stageId}:${state.seed}:${burst}:${ordinal}`;
  const radius = 15 + random() * 4;
  const crossingDistance = (mode === 0 ? width : height) + margin * 2;
  const travelSpeed = Math.max(500, Math.abs(mode === 0 ? vx : vy) - 70);
  return {id, type: 'meteor', flightComet: true, showerComet: true,
    showerVersion: COMET_SHOWER_VERSION, showerBurst: burst,
    showerWidth: width, showerHeight: height,
    x, y, previousX: x, previousY: y, baseX: x,
    vx, vy, ax, ay, r: radius, s: vy, damage: 18, hp: 2, maxHp: 2,
    special: 'comet', spriteKey: 'comet', visualScale: 1,
    rot: Math.atan2(vy, vx), rs: 0, p: 0, phase: ordinal + burst * 3,
    amp: 0, alpha: 1, life: crossingDistance / travelSpeed + .35};
}

function makeComet(state, burst, ordinal) {
  const mode = burst; // lateral crossing → diagonal rain → overtaking train.
  let item = makeCandidate(state, burst, ordinal, mode);
  if (staysOutsideCorridor(item, state.corridors[burst])) return item;
  // The visual hull deliberately stays 208px wide. Narrow viewports cannot fit
  // a dangerous lower lane beside it: use a genuinely separate high crossing,
  // rather than secretly reducing collision sizes or filling the only gap.
  item = makeCandidate(state, burst, ordinal, 0);
  return staysOutsideCorridor(item, state.corridors[burst]) ? item : null;
}

export function createCometShower({width = 720, height = 1280, seed = 0,
  stageId = '1.5', elapsed = 0} = {}) {
  for (const [label, value] of Object.entries({width, height, seed, elapsed})) finite(value, label);
  if (width < 250 || height < 300 || elapsed < 0 || !['1.5', '1.9'].includes(stageId)) {
    throw new RangeError('Invalid comet shower route or viewport');
  }
  const normalizedSeed = Math.trunc(seed) >>> 0;
  const graceUntil = elapsed > 0 ? elapsed + COMET_SHOWER_RULES.resumeGraceSeconds : 0;
  const schedule = [];
  for (let burst = 0; burst < COMET_SHOWER_RULES.burstStarts.length; burst++) {
    const at = COMET_SHOWER_RULES.burstStarts[burst];
    if (at <= elapsed || at < graceUntil) continue;
    const warningAt = at - COMET_SHOWER_RULES.warningSeconds;
    if (warningAt <= elapsed) continue;
    schedule.push({at: warningAt, kind: 'warning', burst});
    const count = burst === 1 ? 4 : 3;
    for (let ordinal = 0; ordinal < count; ordinal++) {
      schedule.push({at: at + ordinal * .42, kind: 'spawn', burst, ordinal});
    }
  }
  schedule.sort((left, right) => left.at - right.at);
  return {version: COMET_SHOWER_VERSION, width, height, seed: normalizedSeed, stageId,
    elapsed, initialElapsed: elapsed, schedule, cursor: 0, active: [],
    emittedIds: new Set(), skipped: 0, spawned: 0, warnings: 0,
    corridors: [0, 1, 2].map(burst => corridorFor(width, height, normalizedSeed, burst))};
}

/** Mutates encounter scheduling only; never changes an emitted item's position. */
export function advanceCometShower(state, delta, player, emit) {
  const step = validateDelta(delta);
  if (state?.version !== COMET_SHOWER_VERSION) throw new TypeError('Comet shower state required');
  if (typeof emit !== 'function') throw new TypeError('Comet shower callback required');
  if (!Number.isFinite(player?.x) || !Number.isFinite(player?.y)) throw new TypeError('Finite player position required');
  if (step === 0) return cometShowerSnapshot(state);
  state.elapsed += step;
  // Lifetime belongs to the physical item and can be slowed by a power. Do not
  // age references out using the route clock: that would let a new burst exceed
  // the cap while older bodies are still crossing in slow motion.
  state.active = state.active.filter(entry => entry.item.life > 0 && entry.item.hp > 0);
  while (state.cursor < state.schedule.length && state.schedule[state.cursor].at <= state.elapsed + 1e-8) {
    const scheduled = state.schedule[state.cursor++];
    const id = `${COMET_SHOWER_VERSION}:${state.stageId}:${state.seed}:${scheduled.burst}:${scheduled.kind}:${scheduled.ordinal ?? 'all'}`;
    if (state.emittedIds.has(id)) continue;
    state.emittedIds.add(id);
    if (scheduled.kind === 'warning') {
      state.warnings++;
      const entrance=state.width>=500&&scheduled.burst>0
        ?`${scheduled.burst===2?'desde abajo, ':''}${state.corridors[scheduled.burst].side<0?'derecha':'izquierda'}`:null;
      emit(Object.freeze({id, type: 'warning', text: `Se aproxima lluvia de cometas${entrance?` · ${entrance}`:''}`,
        stageId: state.stageId, burst: scheduled.burst, at: scheduled.at,
        firstCometAt: scheduled.at + COMET_SHOWER_RULES.warningSeconds,
        corridor: state.corridors[scheduled.burst]}));
      continue;
    }
    if (state.active.length >= COMET_SHOWER_RULES.maxActive) { state.skipped++; continue; }
    const item = makeComet(state, scheduled.burst, scheduled.ordinal);
    if (!item) { state.skipped++; continue; }
    state.spawned++;
    state.active.push({item, until: scheduled.at + item.life});
    emit(Object.freeze({id, type: 'spawn', stageId: state.stageId, burst: scheduled.burst,
      at: scheduled.at, corridor: state.corridors[scheduled.burst], item}));
  }
  return cometShowerSnapshot(state);
}

/** Sole ballistic integrator. Pass dt already affected by any slow power. */
export function advanceShowerComet(item, delta) {
  const step = validateDelta(delta);
  if (!item?.showerComet || item.showerVersion !== COMET_SHOWER_VERSION) {
    throw new TypeError('Shower comet item required');
  }
  if (step === 0) return item.life > 0;
  const point = positionAt(item, step);
  item.previousX = item.x; item.previousY = item.y;
  item.x = point.x; item.y = point.y;
  item.vx += item.ax * step; item.vy += item.ay * step;
  item.s = item.vy; item.rot = Math.atan2(item.vy, item.vx); item.life -= step;
  const margin = COMET_SHOWER_RULES.boundsMargin;
  return item.life > 0 && item.x >= -margin && item.x <= item.showerWidth + margin &&
    item.y >= -margin && item.y <= item.showerHeight + margin;
}

export function releaseCometShowerItem(state, item) {
  if (state?.version !== COMET_SHOWER_VERSION) throw new TypeError('Comet shower state required');
  const id = typeof item === 'string' ? item : item?.id;
  const before = state.active.length;
  state.active = state.active.filter(entry => entry.item.id !== id);
  return state.active.length < before;
}

/** Swept nucleus contact prevents a 950px/s comet skipping a narrow target. */
export function showerCometIntersectsCircle(item, circle) {
  if (!item?.showerComet || ![circle?.x, circle?.y, circle?.r].every(Number.isFinite) || circle.r < 0) {
    throw new TypeError('Shower comet and finite target circle required');
  }
  const startX = item.previousX ?? item.x, startY = item.previousY ?? item.y;
  const dx = item.x - startX, dy = item.y - startY;
  const denominator = dx * dx + dy * dy;
  const t = denominator > 0 ? clamp(((circle.x - startX) * dx + (circle.y - startY) * dy) / denominator, 0, 1) : 0;
  const x = startX + t * dx, y = startY + t * dy;
  return Math.hypot(circle.x - x, circle.y - y) <= item.r * .94 + circle.r;
}

export function cometShowerSnapshot(state) {
  return Object.freeze({version: state.version, stageId: state.stageId, elapsed: state.elapsed,
    active: state.active.length, spawned: state.spawned, skipped: state.skipped,
    warnings: state.warnings, done: state.cursor >= state.schedule.length && state.active.length === 0});
}
