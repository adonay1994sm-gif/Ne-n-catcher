import {GUARDIAN_ATLAS_RULES} from '../combat/guardian-atlas.js';

const states = new Set(['entry', 'closed', 'charge', 'fire', 'opening', 'exposed', 'closing', 'phaseBreak', 'disabled']);
const clamp = value => Math.max(0, Math.min(1, value));
function pose(frame, previousFrame = null, blend = 1) {
  const opacity = clamp(blend);
  return {frame, previousFrame: opacity < 1 ? previousFrame : null,
    blend: opacity, columns: 4, rows: 2};
}

/** Read-only composition of the eight v2 authored mechanical states. Closed
 * charge/fire poses already contain protective plating; the legacy cover crop
 * must not be drawn over the new uniformly registered 512px cells. The encounter
 * owns coreExposure and all events; sampling never advances or fires anything.
 */
export function guardianAtlasAnimation(boss) {
  if (!boss || !states.has(boss.state)) throw new RangeError('Unknown Guardian Atlas animation state');
  if (!Number.isFinite(boss.stateTime) || boss.stateTime < 0) {
    throw new RangeError('Guardian Atlas animation time must be finite and nonnegative');
  }
  if (boss.phase !== 1 && boss.phase !== 2) throw new RangeError('Unknown Guardian Atlas animation phase');
  const {state, stateTime, phase} = boss, openFrame = phase === 2 ? 5 : 1;
  // The time fallback supports old isolated presentation fixtures only. A real
  // encounter always supplies its single simulation-owned exposure value.
  const exposure = state === 'disabled' ? 1 : Number.isFinite(boss.coreExposure) ? clamp(boss.coreExposure) :
    state === 'exposed' ? 1 : state === 'opening' ? clamp(stateTime / GUARDIAN_ATLAS_RULES.openingSeconds) :
      state === 'closing' ? 1 - clamp(stateTime / GUARDIAN_ATLAS_RULES.closingSeconds) : 0;
  const impactFlash = clamp((boss.flash || 0) / .14);
  let result;
  if (state === 'entry' || state === 'closed') result = pose(0);
  else if (state === 'charge' || state === 'phaseBreak') result = pose(2, 0, stateTime / .18);
  else if (state === 'fire') result = pose(phase === 2 ? 6 : 3);
  else if (state === 'opening') result = pose(openFrame, 0, exposure);
  else if (state === 'exposed') result = phase === 1 && impactFlash > 0
    ? pose(4, openFrame, impactFlash) : pose(openFrame);
  else if (state === 'closing') result = pose(0, openFrame, 1 - exposure);
  else result = pose(7, openFrame, stateTime / .6);
  return {...result, coreCover: 1 - exposure, coverFrame: 0, coverRect: null,
    impactFlash, attackTier: boss.attackTier || null};
}
