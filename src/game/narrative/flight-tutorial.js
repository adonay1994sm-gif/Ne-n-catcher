/** The existing route clock and player actions own this non-blocking lesson.
 * This policy never moves the ship, pauses the journey or grants a reward.
 */
export const FLIGHT_TUTORIAL_VERSION = 'flight-tutorial-v2';
export const FLIGHT_TUTORIAL_CUES = Object.freeze([
  Object.freeze({id: `${FLIGHT_TUTORIAL_VERSION}:pilot`, at: 1, until: 100, seconds: 4,
    text: 'Desliza el pulgar izquierdo para maniobrar.', target: 56}),
  Object.freeze({id: `${FLIGHT_TUTORIAL_VERSION}:fire`, at: 27, until: 140, seconds: 4,
    text: 'Sin soltar el pilotaje, mantén DISPARAR con el otro pulgar.', target: 1}),
  Object.freeze({id: `${FLIGHT_TUTORIAL_VERSION}:recovery`, at: 40, until: 170, seconds: 4,
    text: 'Acércate al CRONIUM brillante para recuperar su energía.', target: 1}),
  Object.freeze({id: `${FLIGHT_TUTORIAL_VERSION}:missile`, at: 80, until: 320, seconds: 4,
    text: 'MISIL daña más. Resérvalo para una buena oportunidad; tienes tres.', target: 1, optional: true}),
  Object.freeze({id: `${FLIGHT_TUTORIAL_VERSION}:workshop`, at: 65, until: 332, seconds: 4,
    text: 'Pieza recuperada. Abre C9 para ver las mejoras de tu nave.', target: 1})
]);

const NOOP = () => {};
const validTime = value => Number.isFinite(value) && value >= 0;
const validCount = value => Number.isSafeInteger(value) && value >= 0;
const names = ['pilot', 'fire', 'recovery', 'missile', 'workshop'];
const cueById = new Map(FLIGHT_TUTORIAL_CUES.map(cue => [cue.id, cue]));
const cueFor = name => FLIGHT_TUTORIAL_CUES[names.indexOf(name)];
const listIsValid = value => Array.isArray(value) && new Set(value).size === value.length &&
  value.every(id => cueById.has(id));
const clamp = value => Math.max(0, Math.min(1, value));

function restoreCheckpoint(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 2 ||
      value.contentVersion !== FLIGHT_TUTORIAL_VERSION ||
      !listIsValid(value.completed) || !listIsValid(value.skipped) || !listIsValid(value.emitted) ||
      value.completed.some(id => value.skipped.includes(id))) {
    return null; // An unrelated or older settings record cannot block flight.
  }
  return value;
}

/**
 * Backwards-compatible advance({elapsed, playing, shots, collected,
 * workshopOpened, channelBusy}, emit) accepts richer observations as well.
 * Cumulative pilotDistance is measured in logical viewport pixels, never
 * screen pixels; missileOpportunity means an actual target is within reach.
 * Store checkpoint() inside an existing saved settings/route record. This
 * module deliberately owns no storage key. replay ignores previous lessons.
 */
export function createFlightTutorial({routeElapsed = 0, checkpoint = null,
  replay = false, enabled = true} = {}) {
  if (!validTime(routeElapsed) || typeof replay !== 'boolean' || typeof enabled !== 'boolean') {
    throw new RangeError('Valid tutorial route time and options required');
  }
  const restored = checkpoint === null ? null : restoreCheckpoint(checkpoint);
  let elapsed = routeElapsed, suspended = false;
  const completed = new Set(replay ? [] : restored?.completed || []);
  const skipped = new Set(replay ? [] : restored?.skipped || []);
  const emitted = new Set(replay ? [] : restored?.emitted || []);
  const stats = {pilotDistance: 0, shots: 0, collected: 0, missilesFired: 0,
    workshopOpened: false, moduleRecovered: false};
  let context = {playing: true, channelBusy: false, bossActive: false,
    missileReady: false, missileOpportunity: false};
  const offset = replay ? routeElapsed : 0;
  // With no persisted tutorial state, a resumed stage is already understood.
  // Do not dump old lessons over a much later part of the journey.
  if (routeElapsed > 0 && !restored && !replay) {
    for (const cue of FLIGHT_TUTORIAL_CUES) if (cue.at <= routeElapsed) skipped.add(cue.id);
  }
  const done = cue => completed.has(cue.id) || skipped.has(cue.id);
  function reconcile() {
    const successes = [stats.pilotDistance >= cueFor('pilot').target, stats.shots > 0,
      stats.collected > 0, stats.missilesFired > 0, stats.workshopOpened];
    for (let index = 0; index < successes.length; index++) {
      const cue = FLIGHT_TUTORIAL_CUES[index];
      if (successes[index] && !done(cue)) completed.add(cue.id);
    }
  }
  function progress(cue) {
    if (completed.has(cue.id)) return 1;
    if (cue === cueFor('pilot')) return clamp(stats.pilotDistance / cue.target);
    return 0;
  }
  function currentCue() {
    if (!enabled || !context.playing || context.bossActive) return null;
    for (const cue of FLIGHT_TUTORIAL_CUES) {
      if (done(cue)) continue;
      if (cue.optional && !(context.missileReady && context.missileOpportunity)) continue;
      // A missile is optional. When the recovered part needs attention, teach
      // the workshop first rather than making someone spend scarce ammunition.
      if (cue.optional && stats.moduleRecovered && !stats.workshopOpened) continue;
      if (cue === cueFor('workshop') && !stats.moduleRecovered) return null;
      if (elapsed < cue.at + offset) return null;
      return cue;
    }
    return null;
  }
  function checkpointView() {
    return Object.freeze({version: 2, contentVersion: FLIGHT_TUTORIAL_VERSION,
      completed: Object.freeze([...completed]), skipped: Object.freeze([...skipped]),
      emitted: Object.freeze([...emitted])});
  }
  function snapshot() {
    const cue = currentCue();
    return Object.freeze({version: FLIGHT_TUTORIAL_VERSION, elapsed, enabled,
      emitted: Object.freeze([...emitted]), completed: Object.freeze([...completed]),
      skipped: Object.freeze([...skipped]),
      pending: Object.freeze(FLIGHT_TUTORIAL_CUES.filter(item => !done(item)).map(item => item.id)),
      active: cue ? Object.freeze({...cue, progress: progress(cue)}) : null,
      complete: FLIGHT_TUTORIAL_CUES.filter(item => !item.optional).every(item => completed.has(item.id)),
      finished: FLIGHT_TUTORIAL_CUES.every(done)});
  }

  /** Observe only successful gameplay actions; refused shots/purchases do not count. */
  function observe(action = {}) {
    if (!action || typeof action !== 'object' || !['pilot', 'fire', 'recovery', 'missile',
      'module', 'workshop'].includes(action.type) ||
      (action.type === 'pilot' && !validTime(action.distance))) {
      throw new TypeError('Valid successful tutorial action required');
    }
    if (!enabled || suspended || !context.playing || context.bossActive) return snapshot();
    if (action.type === 'pilot') stats.pilotDistance += action.distance;
    if (action.type === 'fire') stats.shots++;
    if (action.type === 'recovery') stats.collected++;
    if (action.type === 'missile') stats.missilesFired++;
    if (action.type === 'module') stats.moduleRecovered = true;
    if (action.type === 'workshop') stats.workshopOpened = true;
    reconcile();
    return snapshot();
  }

  function advance({elapsed: next, playing = true, shots = 0, collected = 0,
    workshopOpened = false, channelBusy = false, pilotDistance = 0,
    missilesFired = 0, moduleRecovered = false, missileReady = false,
    missileOpportunity = false, bossActive = false} = {}, emit = NOOP) {
    if (!validTime(next) || !validTime(pilotDistance) || !validCount(shots) ||
        !validCount(collected) || !validCount(missilesFired) ||
        [playing, workshopOpened, channelBusy, moduleRecovered, missileReady,
          missileOpportunity, bossActive].some(value => typeof value !== 'boolean') ||
        typeof emit !== 'function') {
      throw new TypeError('Valid tutorial route view and event callback required');
    }
    if (!playing) { suspended = true; return []; }
    if (next < elapsed) throw new RangeError('Create a new tutorial when restoring an earlier route checkpoint');
    suspended = false;
    // Context must update even at a held route endpoint: Atlas freezes route
    // distance while its combat clock continues. It must never show a lesson.
    context = {playing, channelBusy, bossActive, missileReady, missileOpportunity};
    if (!enabled || next === elapsed) return [];
    elapsed = next;
    stats.pilotDistance = Math.max(stats.pilotDistance, pilotDistance);
    stats.shots = Math.max(stats.shots, shots);
    stats.collected = Math.max(stats.collected, collected);
    stats.missilesFired = Math.max(stats.missilesFired, missilesFired);
    stats.workshopOpened ||= workshopOpened;
    stats.moduleRecovered ||= moduleRecovered;
    reconcile();
    for (const cue of FLIGHT_TUTORIAL_CUES) {
      if (!done(cue) && elapsed >= cue.until + offset) skipped.add(cue.id);
    }
    const cue = currentCue();
    if (!cue || context.channelBusy || emitted.has(cue.id)) return [];
    const event = Object.freeze({type: 'tutorial', ...cue, routeElapsed: elapsed,
      expiresAt: cue.until + offset, progress: progress(cue)});
    emitted.add(cue.id); // Consume before callbacks, including reentrant/throwing ones.
    emit(event);
    return [event];
  }
  return Object.freeze({advance, observe, snapshot, checkpoint: checkpointView});
}
