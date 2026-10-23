/**
 * Presentation only: select the authored Chronos destruction and wave poses
 * from the existing flight snapshot. This function owns no clock or gameplay.
 * Calling it again with a paused snapshot returns the same visual state.
 */
const DEFAULT_MIN_DURATION = 90;
const RUPTURE_POSITION = .10;
const WAVE_DURATION = 7.2;
const WAVE_FADE_DURATION = 1.2;
const WAVE_FRAME_DURATION = WAVE_DURATION / 4;
const FRAME_ENDS = Object.freeze([0, .45, 1.25, 2.4, 4.4]);
const STATES = Object.freeze(['intact', 'impact', 'fracture', 'rupture', 'dispersion', 'aftermath']);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function getChronosDestructionPose(view) {
  const elapsed = Number.isFinite(view?.elapsed) && view.elapsed >= 0 ? view.elapsed : 0;
  // The expanded voyage retains the authored nine-second incident. Its route
  // duration is independent from this presentation timing; neither owns a RAF.
  const duration = view?.cinematicDuration ?? view?.minDuration;
  const minDuration = Number.isFinite(duration) && duration > 0
    ? duration : DEFAULT_MIN_DURATION;
  const ruptureAt = minDuration * RUPTURE_POSITION;
  const beforeRupture = elapsed < ruptureAt;
  const age = Math.max(0, elapsed - ruptureAt);

  // Compare absolute boundaries rather than a rounded/subtracted age. At a
  // nominal boundary such as 9 + .45, subtraction can produce .449999999999.
  let frame = 0;
  while (frame < FRAME_ENDS.length && elapsed >= ruptureAt + FRAME_ENDS[frame]) frame++;

  let waveFrame = 0;
  while (waveFrame < 3 && elapsed >= ruptureAt + (waveFrame + 1) * WAVE_FRAME_DURATION) waveFrame++;
  const waveVisible = !beforeRupture && elapsed < ruptureAt + WAVE_DURATION;
  const waveProgress = clamp(age / WAVE_DURATION, 0, 1);
  const waveAlpha = waveVisible
    ? .55 * clamp((WAVE_DURATION - age) / WAVE_FADE_DURATION, 0, 1) : 0;

  return Object.freeze({
    frame,
    age,
    state: STATES[frame],
    waveFrame,
    waveScale: .34 + waveProgress * 1.90,
    waveAlpha,
    waveVisible
  });
}
