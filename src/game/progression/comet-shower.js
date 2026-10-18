/**
 * Authored crossings for El gran vacío. This is an encounter policy, not a
 * second route clock or update loop. The legacy caller advances it with played
 * delta only and integrates emitted items once with advanceShowerComet.
 */
export const COMET_SHOWER_VERSION = 'comet-shower-v3';
export const COMET_SHOWER_RULES = Object.freeze({
  maxActive: 5, warningSeconds: 2, resumeGraceSeconds: 7,
  maxDelta: .05, shipWidth: 208 * .52, shipSideClearance: 119 * .52, corridorClearance: 40,
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

function corridorFor(width, height, seed, burst, shipWidth, shipSideClearance) {
  // A route-wide safe passage uses the actual hull, including bank clearance.
  // Its position varies continuously by seed; it is not an alternating pair
  // of fixed left/right lanes. The conservative default matches the 52% ship.
  const corridorWidth = shipWidth + COMET_SHOWER_RULES.corridorClearance;
  const minimum = Math.min(Math.max(shipSideClearance, corridorWidth / 2), width / 2);
  const maximum = width - minimum;
  const random = randomFor(seed ^ Math.imul(burst + 3, 0x9E3779B9));
  const side = random() < .5 ? -1 : 1;
  const center = clamp(width * (side < 0 ? .22 + random() * .15 : .63 + random() * .15), minimum, maximum);
  return Object.freeze({center, width: corridorWidth, left: center - corridorWidth / 2,
    right: center + corridorWidth / 2, top: height * .48, bottom: height + 128,
    side, burst});
}

function boundaryTimes(position, velocity, acceleration, boundary, lifetime) {
  const a = acceleration / 2, b = velocity, c = position - boundary;
  if (Math.abs(a) < 1e-10) {
    const time = Math.abs(b) < 1e-10 ? -1 : -c / b;
    return time > 0 && time < lifetime ? [time] : [];
  }
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];
  const root = Math.sqrt(discriminant);
  return [(-b - root) / (2 * a), (-b + root) / (2 * a)]
    .filter(time => time > 0 && time < lifetime);
}

function staysOutsideCorridor(item, corridor) {
  // Exact interval validation of the entire quadratic trajectory. All times
  // where either coordinate crosses the expanded safe rectangle partition the
  // path into intervals with a constant inside/outside classification. Check
  // their endpoints and interiors, rather than sampling and missing a graze.
  const clearance = item.r + 12;
  const left = corridor.left - clearance, right = corridor.right + clearance;
  const top = corridor.top - clearance, bottom = corridor.bottom + clearance;
  const times = [0, item.life,
    ...boundaryTimes(item.x, item.vx, item.ax, left, item.life),
    ...boundaryTimes(item.x, item.vx, item.ax, right, item.life),
    ...boundaryTimes(item.y, item.vy, item.ay, top, item.life),
    ...boundaryTimes(item.y, item.vy, item.ay, bottom, item.life)]
    .sort((a, b) => a - b);
  const inside = seconds => {
    const point = positionAt(item, seconds);
    return point.y >= top - 1e-8 && point.y <= bottom + 1e-8 &&
      point.x >= left - 1e-8 && point.x <= right + 1e-8;
  };
  for (let index = 0; index < times.length; index++) {
    if (inside(times[index]) || index > 0 && inside((times[index] + times[index - 1]) / 2)) return false;
  }
  return true;
}

function makeCandidate(state, burst, ordinal, mode, attempt = 0) {
  const {width, height} = state, corridor = state.corridors[burst];
  const random = randomFor(state.seed + burst * 1013 + ordinal * 7919 + mode * 211 + attempt * 65537);
  const speed = COMET_SHOWER_RULES.minSpeed + random() *
    (COMET_SHOWER_RULES.maxSpeed - COMET_SHOWER_RULES.minSpeed);
  const margin = 96, dangerSide = -corridor.side;
  let x, y, vx, vy, ax, ay, entryEdge;
  if (mode === 0) {
    // Both upper side entries and their pitch vary between individual bodies.
    // Keep this fallback above the reserved lower flight area at all widths.
    const direction = random() < .5 ? -1 : 1;
    x = direction > 0 ? -margin : width + margin;
    entryEdge = direction > 0 ? 'left' : 'right';
    y = height * (.09 + random() * .13);
    vy = speed * (random() * 2 - 1) * Math.min(.15, height * .1 / (width + margin * 2));
    vx = direction * Math.sqrt(speed * speed - vy * vy);
    ax = -direction * (15 + random() * 35);
    ay = (random() * 2 - 1) * Math.min(28, height * .025);
  } else {
    // Solve an authored ballistic arc through a varying useful flight lane.
    // Unlike v2, this is neither an almost vertical fixed side train nor a
    // route-wide alternating pattern. The full curve must pass safety below.
    const laneMinimum = dangerSide < 0 ? 24 : corridor.right + 42;
    const laneMaximum = dangerSide < 0 ? corridor.left - 42 : width - 24;
    const referenceX = laneMinimum <= laneMaximum
      ? clamp(width * (.40 + random() * .20), laneMinimum, laneMaximum) : width / 2;
    y = mode === 1 ? -margin : height + margin;
    entryEdge = mode === 1 ? 'top' : 'bottom';
    const verticalDirection = mode === 1 ? 1 : -1;
    ax = dangerSide * (16 + random() * 65) * (random() < .32 ? -1 : 1);
    ay = verticalDirection * (10 + random() * 20);
    const referenceY = height * (.60 + random() * .24);
    const referenceTime = Math.abs(referenceY - y) / speed;
    vx = dangerSide * (18 + random() * 130) - ax * referenceTime;
    vx = clamp(vx, -speed * .32, speed * .32);
    vy = verticalDirection * Math.sqrt(speed * speed - vx * vx);
    const time = (-Math.abs(vy) + Math.sqrt(vy * vy + 2 * Math.abs(ay) * Math.abs(referenceY - y))) / Math.abs(ay);
    x = referenceX - vx * time - ax * time * time / 2;
  }
  const id = `${COMET_SHOWER_VERSION}:${state.stageId}:${state.seed}:${burst}:${ordinal}`;
  const radius = 15 + random() * 4;
  const crossingDistance = (mode === 0 ? width : height) + margin * 2;
  const travelSpeed = Math.max(500, Math.abs(mode === 0 ? vx : vy) - 70);
  return {id, type: 'meteor', flightComet: true, showerComet: true,
    showerVersion: COMET_SHOWER_VERSION, showerBurst: burst,
    showerWidth: width, showerHeight: height, entryEdge, crossingMode: mode,
    x, y, previousX: x, previousY: y, baseX: x,
    vx, vy, ax, ay, r: radius, s: vy, damage: 18, hp: 2, maxHp: 2,
    special: 'comet', spriteKey: 'comet', visualScale: 1,
    rot: Math.atan2(vy, vx), rs: 0, p: 0, phase: ordinal + burst * 3,
    amp: 0, alpha: 1, life: crossingDistance / travelSpeed + .35};
}

function makeComet(state, burst, ordinal) {
  const primaryMode = state.burstModes[burst];
  // Later members may cross above a lower train, so individual trajectories
  // cannot be memorised by counting a fixed vertical line of identical bodies.
  const mode = ordinal > 0 && randomFor(state.seed + burst * 211 + ordinal * 2017)() < .25 ? 0 : primaryMode;
  for (let attempt = 0; attempt < 18; attempt++) {
    const item = makeCandidate(state, burst, ordinal, mode, attempt);
    if (item.x < -128 || item.x > state.width + 128) continue;
    if (staysOutsideCorridor(item, state.corridors[burst])) return item;
  }
  // If the actual hull leaves insufficient room, use a real high crossing.
  // No collision or ship scale is secretly reduced to manufacture a gap.
  const fallback = makeCandidate(state, burst, ordinal, 0);
  return staysOutsideCorridor(fallback, state.corridors[burst]) ? fallback : null;
}

export function createCometShower({width = 720, height = 1280, seed = 0,
  stageId = '1.5', elapsed = 0, shipWidth = COMET_SHOWER_RULES.shipWidth,
  shipSideClearance = COMET_SHOWER_RULES.shipSideClearance} = {}) {
  for (const [label, value] of Object.entries({width, height, seed, elapsed, shipWidth, shipSideClearance})) finite(value, label);
  if (width < 250 || height < 300 || elapsed < 0 || shipWidth <= 0 || shipSideClearance < shipWidth / 2 ||
      !['1.5', '1.9'].includes(stageId)) {
    throw new RangeError('Invalid comet shower route or viewport');
  }
  const normalizedSeed = Math.trunc(seed) >>> 0;
  const random = randomFor(normalizedSeed ^ 0x84F3A91B), burstModes = [0, 1, 2];
  for (let index = burstModes.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [burstModes[index], burstModes[swap]] = [burstModes[swap], burstModes[index]];
  }
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
    shipWidth, shipSideClearance, burstModes: Object.freeze(burstModes),
    elapsed, initialElapsed: elapsed, schedule, cursor: 0, active: [],
    emittedIds: new Set(), skipped: 0, spawned: 0, warnings: 0,
    corridors: [0, 1, 2].map(burst => corridorFor(width, height, normalizedSeed, burst, shipWidth, shipSideClearance))};
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
      const first = makeComet(state, scheduled.burst, 0);
      const entrance = first && ({left: 'desde la izquierda', right: 'desde la derecha',
        top: 'desde arriba', bottom: 'desde abajo'})[first.entryEdge];
      emit(Object.freeze({id, type: 'warning', text: `Se aproxima lluvia de cometas${entrance ? ` · ${entrance}` : ''}`,
        stageId: state.stageId, burst: scheduled.burst, at: scheduled.at,
        firstCometAt: scheduled.at + COMET_SHOWER_RULES.warningSeconds,
        corridor: state.corridors[scheduled.burst]}));
      continue;
    }
    if (state.active.length >= COMET_SHOWER_RULES.maxActive) { state.skipped++; continue; }
    // A slow power can leave the preceding train alive after the normal quiet
    // gap. Different simultaneous safe corridors could cancel each other out:
    // never start the next train until its predecessor has physically retired.
    if (state.active.some(entry => entry.item.showerBurst !== scheduled.burst)) { state.skipped++; continue; }
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
