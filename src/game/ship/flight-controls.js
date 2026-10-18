/**
 * Logical Canvas coordinates only. The legacy loop owns interpolation and RAF.
 * These extents preserve the existing ship collision outline plus ten pixels of
 * clearance; cosmetic equipment must not enlarge the available flight area.
 */
const SIDE_CLEARANCE = 119;
const NOSE_CLEARANCE = 158;
const TAIL_CLEARANCE = 104;

function finite(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite`);
  }
  return value;
}

function pointerId(value) {
  if ((typeof value === 'number' && Number.isSafeInteger(value)) ||
      (typeof value === 'string' && value.length > 0)) return value;
  throw new TypeError('A finite integer or nonempty string pointer id is required');
}

function inputState(state) {
  if (!state || typeof state !== 'object' || typeof state.active !== 'boolean') {
    throw new TypeError('A relative flight input state is required');
  }
  if (state.active) {
    pointerId(state.id);
    finite(state.lastX, 'lastX');
    finite(state.lastY, 'lastY');
  }
}

function checkedBounds(bounds) {
  if (!bounds || typeof bounds !== 'object') throw new TypeError('Flight bounds are required');
  for (const key of ['minX', 'maxX', 'minY', 'maxY']) finite(bounds[key], key);
  if (bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) {
    throw new RangeError('Flight bounds must be ordered');
  }
  return bounds;
}

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

/**
 * Safe center positions, accounting for the asymmetric nose and tail. When the
 * entire outline cannot fit, collapse that axis to its balanced center and
 * report fits=false. The caller must adapt the layout instead of scaling the
 * collision shape or pretending the controls can be overlapped safely.
 */
export function calculateFlightBounds({ width, height, hudBottom, controlsTop, shipScale = 1 }) {
  finite(width, 'width'); finite(height, 'height');
  finite(hudBottom, 'hudBottom'); finite(controlsTop, 'controlsTop');
  finite(shipScale, 'shipScale');
  if (width <= 0 || height <= 0 || hudBottom < 0 || controlsTop > height ||
      hudBottom > controlsTop || shipScale<=0 || shipScale>4) {
    throw new RangeError('A positive viewport and ordered HUD/control boundaries are required');
  }
  const firstX = SIDE_CLEARANCE*shipScale, lastX = width - SIDE_CLEARANCE*shipScale;
  const firstY = hudBottom + NOSE_CLEARANCE*shipScale, lastY = controlsTop - TAIL_CLEARANCE*shipScale;
  const xFits = firstX <= lastX, yFits = firstY <= lastY;
  const centerY = clamp(firstY / 2 + lastY / 2, 0, height);
  return Object.freeze({
    minX: xFits ? firstX : width / 2,
    maxX: xFits ? lastX : width / 2,
    minY: yFits ? firstY : centerY,
    maxY: yFits ? lastY : centerY,
    fits: xFits && yFits,
    xFits,
    yFits
  });
}

export function createRelativeFlightInput() {
  return { active: false, id: null, lastX: null, lastY: null };
}

/** A press records an anchor only; it never relocates the ship to the finger. */
export function beginFlightInput(state, { id, x, y }) {
  inputState(state); pointerId(id); finite(x, 'x'); finite(y, 'y');
  if (state.active) return false;
  state.active = true;
  state.id = id;
  state.lastX = x;
  state.lastY = y;
  return true;
}

/**
 * Move the desired ship center by the tracked finger's delta. Even at an edge,
 * consume that delta so reversing direction responds immediately. Secondary
 * fingers cannot steal the anchor or influence the target.
 */
export function moveFlightInput(state, {
  id, x, y, targetX, targetY, sensitivity = 1, bounds
}) {
  inputState(state); pointerId(id); finite(x, 'x'); finite(y, 'y');
  finite(targetX, 'targetX'); finite(targetY, 'targetY');
  finite(sensitivity, 'sensitivity'); checkedBounds(bounds);
  if (sensitivity <= 0) throw new RangeError('Sensitivity must be positive');
  if (!state.active || state.id !== id) {
    return {
      targetX: clamp(targetX, bounds.minX, bounds.maxX),
      targetY: clamp(targetY, bounds.minY, bounds.maxY),
      moved: false
    };
  }
  const nextX = targetX + (x - state.lastX) * sensitivity;
  const nextY = targetY + (y - state.lastY) * sensitivity;
  // Validate computed values before changing the anchor, including overflow.
  finite(nextX, 'computed targetX'); finite(nextY, 'computed targetY');
  const moved = x !== state.lastX || y !== state.lastY;
  state.lastX = x;
  state.lastY = y;
  return {
    targetX: clamp(nextX, bounds.minX, bounds.maxX),
    targetY: clamp(nextY, bounds.minY, bounds.maxY),
    moved
  };
}

/** Omit id (or pass null) for pause, blur or cancellation of all active input. */
export function endFlightInput(state, id = null) {
  inputState(state);
  if (id !== null) pointerId(id);
  if (!state.active || (id !== null && state.id !== id)) return false;
  state.active = false;
  state.id = null;
  state.lastX = null;
  state.lastY = null;
  return true;
}
