import {CHRONOS_VOYAGE_STAGES, CHRONOS_VOYAGE_VERSION} from '../progression/chronos-flight.js';

// Presentation only. A crossing borrows the already-played route seconds on
// either side of a stage boundary; it owns no timer, checkpoint or encounter.
export const VOYAGE_CROSSING_SECONDS = 1.6;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = value => value * value * (3 - 2 * value);
const mix = (from, to, amount) => from + (to - from) * amount;

export function getVoyageTransitionPresentation(view, {reducedEffects = false} = {}) {
  if (!view || (view.version && view.version !== CHRONOS_VOYAGE_VERSION) ||
      !Number.isInteger(view.stageNumber) || view.stageNumber < 1 || view.stageNumber > 10 ||
      !Number.isFinite(view.stageElapsed) || !Number.isFinite(view.stageDuration) || view.stageDuration <= 0) return null;

  const number = view.stageNumber;
  const seconds = clamp(view.stageElapsed, 0, view.stageDuration);
  const definition = CHRONOS_VOYAGE_STAGES[number - 1];
  const previous = CHRONOS_VOYAGE_STAGES[Math.max(0, number - 2)];
  const settled = number === 1 ? 1 : smooth(clamp(seconds / VOYAGE_CROSSING_SECONDS, 0, 1));
  const targetNebula = Number.isFinite(view.deepSpace?.nebulaOpacity)
    ? clamp(view.deepSpace.nebulaOpacity, 0, 1) : definition.nebulaOpacity;
  const targetStars = Number.isFinite(view.deepSpace?.starDensity)
    ? clamp(view.deepSpace.starDensity, 0, 1) : definition.starDensity;
  const environment = Object.freeze({
    // Do not swap a painting or dissolve the station/planet. Only the distant
    // ambient illumination and tiny star density settle into their next region.
    nebulaOpacity: mix(previous.nebulaOpacity, targetNebula, settled),
    starDensity: mix(previous.starDensity, targetStars, settled)
  });

  let boundary = null, progress = 0;
  if (number > 1 && seconds < VOYAGE_CROSSING_SECONDS) {
    boundary = number - 1;
    progress = .5 + seconds / (VOYAGE_CROSSING_SECONDS * 2);
  } else if (number < 10 && seconds >= view.stageDuration - VOYAGE_CROSSING_SECONDS) {
    boundary = number;
    progress = Math.min(.5, (seconds - (view.stageDuration - VOYAGE_CROSSING_SECONDS)) / (VOYAGE_CROSSING_SECONDS * 2));
  }

  // C9 itself is the authored approach/departure landmark. Adding another
  // station or a copied relay at those boundaries would counterfeit geography.
  const cueAllowed = boundary !== null && boundary !== 5 && boundary !== 6 && !reducedEffects;
  const side = boundary % 2 ? 1 : -1;
  const depth = clamp(progress, 0, 1);
  const cue = cueAllowed ? Object.freeze({
    kind: boundary <= 3 ? 'chronos-remnant' : 'navigation-beacon',
    side, x: .5 + side * (.19 + .52 * Math.pow(depth, 1.9)),
    y: .16 + .94 * Math.pow(depth, 1.45),
    scale: .018 + .30 * Math.pow(depth, 1.8),
    rotation: side * (.12 + depth * .45)
  }) : null;
  return Object.freeze({
    active: boundary !== null, boundary, progress: depth, cue, environment,
    // Navigation stars are secondary presentation; comfort mode retains the
    // same route/environment but removes this brief acceleration embellishment.
    starStretch: boundary !== null && !reducedEffects ? Math.sin(depth * Math.PI) : 0
  });
}
