import atlas from '../../../art-source/enemies/ch02/ch02-atlas-v1.json' with {type: 'json'};

const EPSILON_MS = 1e-7;
const finite = (value, name) => {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// CH-02 uses its own produced poses and timings; it owns no Canvas, timer or RAF.
// Frames, events and pivots come from the preserved atlas metadata.
const rectangles = Object.freeze(atlas.frames.map(frame => {
  const {x, y, width, height} = frame.rect;
  if (![x, y, width, height].every(Number.isFinite) || x < 0 || y < 0 || width <= 0 || height <= 0 ||
    x + width > atlas.dimensions.width || y + height > atlas.dimensions.height) {
    throw new RangeError('CH-02 frame lies outside its atlas');
  }
  return Object.freeze({...frame.rect});
}));
const animations = Object.freeze(Object.fromEntries(Object.entries(atlas.animations).map(([name, definition]) => {
  if (definition.frames.length !== definition.durationMs.length || !definition.frames.length ||
    definition.frames.some(index => !Number.isInteger(index) || !rectangles[index]) ||
    definition.durationMs.some(duration => !Number.isFinite(duration) || duration <= 0)) {
    throw new RangeError(`Invalid CH-02 animation: ${name}`);
  }
  const durations = Object.freeze([...definition.durationMs]);
  const events = Object.freeze((definition.events || []).map(event => {
    if (!Number.isInteger(event.frameOffset) || event.frameOffset < 0 || event.frameOffset >= definition.frames.length) {
      throw new RangeError(`Invalid CH-02 event: ${name}`);
    }
    return Object.freeze({...event, atMs: durations.slice(0, event.frameOffset).reduce((sum, value) => sum + value, 0)});
  }).sort((a, b) => a.atMs - b.atMs));
  return [name, Object.freeze({...definition, frames: Object.freeze([...definition.frames]),
    durationMs: durations, totalMs: durations.reduce((sum, value) => sum + value, 0), events})];
})));
const priority = name => {
  const index = atlas.transitionRules.priority.indexOf(name);
  return index < 0 ? atlas.transitionRules.priority.length : index;
};
const pivot = Object.freeze({...atlas.pivot});

export const CH02_ANIMATIONS = animations;
export const CH02_ATLAS = Object.freeze({image: atlas.proposedRuntimeImage, revision: atlas.revision,
  width: atlas.dimensions.width, height: atlas.dimensions.height,
  frameCount: rectangles.length, pivot, drawSize: atlas.recommendedDrawSizeLogical});

/**
 * A single visual lifetime; no clock, RAF, Canvas or collision ownership.
 * dt uses seconds and is capped (default 50 ms). update(0) freezes everything,
 * including queued events. Gameplay may fire only on a returned `fire` event.
 * A higher-priority hurt/destroy cancels the active attack: attackCanceled carries
 * its id and whether fire already occurred. Cancellation never schedules a retry.
 * Callers choose a new request after hitstun; duplicate requests cannot reset fire.
 */
export function createCh02Animator({hp = 3, maxHp = 3, maxDeltaSeconds = .05,
  bankThreshold = 16, initialState = 'spawn'} = {}) {
  finite(maxHp, 'maxHp'); finite(hp, 'hp'); finite(maxDeltaSeconds, 'maxDeltaSeconds');
  finite(bankThreshold, 'bankThreshold');
  if (maxHp <= 0 || maxDeltaSeconds <= 0 || maxDeltaSeconds > 1 || bankThreshold < 0) {
    throw new RangeError('Invalid CH-02 animator bounds');
  }
  if (!Object.hasOwn(animations, initialState)) throw new RangeError('Unknown CH-02 initial state');
  let health = clamp(hp, 0, maxHp), maximumHealth = maxHp;
  let state = health === 0 ? 'destroy' : initialState;
  if (state === 'destroy') health = 0;
  let elapsedMs = 0, eventCursor = 0, done = false;
  let vx = 0, vy = 0, attackCounter = 0, attackId = state === 'attack' ? ++attackCounter : null;
  let attackFired = false;
  let pending = [];

  function frameIndex() {
    const definition = animations[state];
    let end = 0;
    for (let offset = 0; offset < definition.frames.length; offset++) {
      end += definition.durationMs[offset];
      if (elapsedMs < end - EPSILON_MS) return definition.frames[offset];
    }
    return definition.frames.at(-1);
  }

  function baseState() {
    if (health / maximumHealth <= .5) return 'damaged';
    if (vx < -bankThreshold) return 'bankLeft';
    if (vx > bankThreshold) return 'bankRight';
    return Math.abs(vy) > bankThreshold ? 'flight' : 'idle';
  }

  function enter(next) {
    state = next;
    elapsedMs = 0;
    eventCursor = 0;
    done = false;
    attackId = next === 'attack' ? ++attackCounter : null;
    attackFired = false;
    if (next === 'destroy') health = 0;
  }

  function request(next) {
    if (!Object.hasOwn(animations, next)) throw new RangeError(`Unknown CH-02 animation: ${next}`);
    if (animations[state].terminal || state === next) return false;
    if (animations[state].locked && priority(next) >= priority(state)) return false;
    if (state === 'attack') {
      pending.push({name: 'attackCanceled', state, frameIndex: frameIndex(), atMs: elapsedMs,
        attackId, fired: attackFired});
    }
    enter(next);
    return true;
  }

  function update(dt, sample = {}) {
    finite(dt, 'dt');
    if (dt < 0) throw new RangeError('dt must be nonnegative');
    const nextMax = sample.maxHp === undefined ? maximumHealth : finite(sample.maxHp, 'maxHp');
    if (nextMax <= 0) throw new RangeError('maxHp must be positive');
    const nextHealth = clamp(sample.hp === undefined ? health : finite(sample.hp, 'hp'), 0, nextMax);
    const nextVx = sample.vx === undefined ? vx : finite(sample.vx, 'vx');
    const nextVy = sample.vy === undefined ? vy : finite(sample.vy, 'vy');
    if (dt === 0) return [];
    if (!animations[state].terminal) {
      const lostHealth = nextHealth < health;
      health = nextHealth; maximumHealth = nextMax;
      vx = nextVx; vy = nextVy;
      if (health === 0) request('destroy');
      else if (lostHealth) request('hurt');
      else if (!animations[state].locked && state !== baseState()) enter(baseState());
    }
    const emitted = pending;
    pending = [];
    let remaining = Math.min(dt, maxDeltaSeconds) * 1000;
    while (remaining > EPSILON_MS && !done) {
      const definition = animations[state];
      const step = Math.min(remaining, definition.totalMs - elapsedMs);
      elapsedMs += step;
      remaining -= step;
      while (eventCursor < definition.events.length && definition.events[eventCursor].atMs <= elapsedMs + EPSILON_MS) {
        const event = definition.events[eventCursor++];
        if (event.name === 'fire') attackFired = true;
        emitted.push({name: event.name, state, frameIndex: definition.frames[event.frameOffset],
          atMs: event.atMs, attackId});
      }
      if (elapsedMs + EPSILON_MS < definition.totalMs) break;
      if (definition.terminal) {
        done = true;
        if (definition.completionEvent) emitted.push({name: definition.completionEvent,
          state, frameIndex: frameIndex(), atMs: definition.totalMs, attackId});
      } else if (definition.loop) {
        elapsedMs = 0; eventCursor = 0;
      } else {
        enter(baseState());
      }
    }
    return emitted;
  }

  function getFrame() {
    const index = frameIndex();
    return {state, frameIndex: index, rect: rectangles[index], pivot,
      drawSize: CH02_ATLAS.drawSize, image: CH02_ATLAS.image,
      done, terminal: Boolean(animations[state].terminal),
      damageRatio: 1 - health / maximumHealth, damaged: health / maximumHealth <= .5,
      attackId, hp: health, maxHp: maximumHealth};
  }

  return Object.freeze({request, update, getFrame});
}
