/** First-flight hints use the existing route clock and communication slot.
 * They never own input, route progress, storage, rewards or a scheduler.
 */
export const FLIGHT_TUTORIAL_VERSION = 'flight-tutorial-v1';
export const FLIGHT_TUTORIAL_CUES = Object.freeze([
  Object.freeze({id: `${FLIGHT_TUTORIAL_VERSION}:fire`, at: 27, seconds: 4,
    text: 'Un dedo pilota. Con otro, mantén DISPARAR para sostener el Phaser.'}),
  Object.freeze({id: `${FLIGHT_TUTORIAL_VERSION}:recovery`, at: 52, seconds: 4,
    text: 'Recoge el CRONIUM brillante: es energía. La chatarra paga tus mejoras.'}),
  Object.freeze({id: `${FLIGHT_TUTORIAL_VERSION}:workshop`, at: 65, seconds: 4,
    text: 'C9, en el HUD: abre el taller para pausar y configurar la nave.'})
]);

const WINDOW_SECONDS = 12;
const validTime = value => Number.isFinite(value) && value >= 0;
const validCount = value => Number.isSafeInteger(value) && value >= 0;
const NOOP = () => {};

export function createFlightTutorial({routeElapsed = 0} = {}) {
  if (!validTime(routeElapsed)) throw new RangeError('Finite nonnegative tutorial route time required');
  let elapsed = routeElapsed;
  const emitted = new Set(), skipped = new Set();
  // A restored stage is already understood as crossed. No second storage key
  // or burst of old hints is introduced when continuing an existing journey.
  for (const cue of FLIGHT_TUTORIAL_CUES) if (cue.at <= routeElapsed) skipped.add(cue.id);

  function snapshot() {
    return Object.freeze({version: FLIGHT_TUTORIAL_VERSION, elapsed,
      emitted: Object.freeze([...emitted]), skipped: Object.freeze([...skipped]),
      pending: Object.freeze(FLIGHT_TUTORIAL_CUES.filter(cue =>
        !emitted.has(cue.id) && !skipped.has(cue.id)).map(cue => cue.id))});
  }

  function advance({elapsed: next, playing = true, shots = 0, collected = 0,
    workshopOpened = false, channelBusy = false} = {}, emit = NOOP) {
    if (!validTime(next) || typeof playing !== 'boolean' || !validCount(shots) ||
        !validCount(collected) || typeof workshopOpened !== 'boolean' ||
        typeof channelBusy !== 'boolean' || typeof emit !== 'function') {
      throw new TypeError('Valid tutorial route view and event callback required');
    }
    if (!playing) return [];
    if (next < elapsed) throw new RangeError('Create a new tutorial when restoring an earlier route checkpoint');
    if (next === elapsed) return [];
    elapsed = next;
    const events = [];
    for (const cue of FLIGHT_TUTORIAL_CUES) {
      if (emitted.has(cue.id) || skipped.has(cue.id) || elapsed < cue.at) continue;
      if (elapsed >= cue.at + WINDOW_SECONDS ||
          (cue.id === `${FLIGHT_TUTORIAL_VERSION}:workshop` && workshopOpened)) {
        skipped.add(cue.id); continue;
      }
      if (channelBusy) continue;
      // Existing successful shots/pickups do not remove the basic hold/two-
      // finger and energy/material distinction; these are useful reminders.
      const event = Object.freeze({type: 'tutorial', ...cue,
        expiresAt: cue.at + WINDOW_SECONDS, routeElapsed: elapsed});
      emitted.add(cue.id); // Consume before callbacks, including reentrant/throwing ones.
      events.push(event); emit(event);
      break; // One short hint can occupy the communication slot at a time.
    }
    return events;
  }
  return Object.freeze({advance, snapshot});
}
