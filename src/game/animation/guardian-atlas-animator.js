import {GUARDIAN_ATLAS_RULES} from '../combat/guardian-atlas.js';

const states = new Set(['entry', 'closed', 'charge', 'fire', 'opening', 'exposed', 'closing', 'phaseBreak', 'disabled']);
const clamp = value => Math.max(0, Math.min(1, value));
// A real crop of pose0's central armor, registered to its reactor pivot222,226.
// The renderer composes it above the authored open-core firing artwork. This
// prevents the v1 atlas from showing an exposed red core while rejecting hits.
const coverRect = Object.freeze({x:156,y:145,width:132,height:162,pivotX:66,pivotY:81,sourceCell:443.5});
function pose(frame, previousFrame = null, blend = 1) {
  const opacity = clamp(blend);
  return {frame, previousFrame: opacity < 1 ? previousFrame : null,
    blend: opacity, columns: 4, rows: 2};
}

/** Read-only composition of authored mechanical poses. The encounter owns all
 * time and coreExposure; reading a pose never advances combat or fires a gun.
 * coverFrame/coverRect/coreCover are mandatory parts of the firing composition,
 * not a drawn force-field circle or a second animation scheduler.
 */
export function guardianAtlasAnimation(boss) {
  if (!boss || !states.has(boss.state)) throw new RangeError('Unknown Guardian Atlas animation state');
  if (!Number.isFinite(boss.stateTime) || boss.stateTime < 0) {
    throw new RangeError('Guardian Atlas animation time must be finite and nonnegative');
  }
  if (boss.phase !== 1 && boss.phase !== 2) throw new RangeError('Unknown Guardian Atlas animation phase');
  const {state, stateTime, phase} = boss, openFrame = phase === 2 ? 5 : 1;
  let result;
  if (state === 'entry' || state === 'closed') result = pose(0);
  else if (state === 'charge') result = pose(2, 0, stateTime / .18);
  else if (state === 'fire') result = pose(phase === 2 ? 6 : 3);
  else if (state === 'opening') result = pose(openFrame, 0, stateTime / GUARDIAN_ATLAS_RULES.openingSeconds);
  else if (state === 'exposed') result = pose(openFrame);
  else if (state === 'closing') result = pose(0, openFrame, stateTime / GUARDIAN_ATLAS_RULES.closingSeconds);
  else if (state === 'phaseBreak') result = pose(5, 2, stateTime / .5);
  else result = pose(7, openFrame, stateTime / .6);
  const exposure = state === 'disabled' ? 1 : Number.isFinite(boss.coreExposure) ? clamp(boss.coreExposure) :
    state === 'exposed' ? 1 : state === 'opening' ? clamp(stateTime / GUARDIAN_ATLAS_RULES.openingSeconds) :
      state === 'closing' ? 1 - clamp(stateTime / GUARDIAN_ATLAS_RULES.closingSeconds) : 0;
  return {...result, coreCover: 1 - exposure, coverFrame: 0, coverRect,
    impactFlash: clamp((boss.flash || 0) / .14),
    attackTier: boss.attackTier || null};
}
