import {GUARDIAN_ATLAS_RULES} from '../combat/guardian-atlas.js';

const states = new Set(['entry', 'idle', 'charge', 'fire', 'hurt', 'phaseBreak', 'disabled']);
const clamp = value => Math.max(0, Math.min(1, value));

function pose(frame, previousFrame = null, blend = 1) {
  const opacity = clamp(blend);
  return {frame, previousFrame: opacity < 1 ? previousFrame : null,
    blend: opacity, columns: 4, rows: 2};
}

/**
 * Read-only presentation of the authored eight-pose atlas. `blend` is the
 * opacity of `frame`; draw `previousFrame` at 1 - blend when it is present.
 * Time comes exclusively from the encounter. Reading the pose never advances
 * combat, fires an attack, queues an event or changes a paused animation.
 */
export function guardianAtlasAnimation(boss) {
  if (!boss || !states.has(boss.state)) throw new RangeError('Unknown Guardian Atlas animation state');
  if (!Number.isFinite(boss.stateTime) || boss.stateTime < 0) {
    throw new RangeError('Guardian Atlas animation time must be finite and nonnegative');
  }
  if (boss.phase !== 1 && boss.phase !== 2) throw new RangeError('Unknown Guardian Atlas animation phase');
  const {state, stateTime, phase} = boss;
  if (state === 'entry') {
    const revealAt = GUARDIAN_ATLAS_RULES.entrySeconds - .25;
    return stateTime < revealAt ? pose(0) : pose(1, 0, (stateTime - revealAt) / .25);
  }
  if (state === 'phaseBreak') return pose(5, 4, stateTime / .5);
  if (state === 'disabled') return pose(7, phase === 2 ? 5 : 4, stateTime / .6);
  if (phase === 2) {
    // Once the outer ring has opened it must remain open after a hit or while
    // charging. Pose 4 belongs to the intact first-phase ring only.
    return pose(state === 'fire' ? 6 : 5);
  }
  if (state === 'hurt') return pose(4);
  if (state === 'charge') return pose(2, 1, stateTime / .18);
  if (state === 'fire') return pose(3);
  return pose(1);
}
