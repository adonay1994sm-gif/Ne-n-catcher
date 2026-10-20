import test from 'node:test';
import assert from 'node:assert/strict';
import {getChronosIntroPose, CHRONOS_INTRO_TIMELINE as T} from '../src/game/animation/chronos-intro.js';

const finiteDeep = value => {
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(finiteDeep);
  if (value && typeof value === 'object') return Object.values(value).every(finiteDeep);
  return true;
};
const fragmentDistance = pose => pose.fragments.reduce((sum, item) => sum + Math.hypot(item.dx, item.dy), 0);
const onScreen = prime => prime.x > 0 && prime.x < 1 && prime.y > 0 && prime.y < 1;

test('the rupture keeps the established nine-second route moment and the sequence ends before stage two', () => {
  assert.equal(T.rupture, 9);
  assert.ok(T.arrive < T.arrived && T.arrived < T.beamStart && T.beamStart < T.rupture);
  assert.ok(T.end <= 30);
  assert.equal(getChronosIntroPose(T.end + .01).active, false);
});

test('Chronos is alive before the attack: rings turn in opposite directions, the tower is intact and Cronos Prime is not here yet', () => {
  const a = getChronosIntroPose(1), b = getChronosIntroPose(2.5);
  assert.equal(a.active, true); assert.equal(a.phase, 'calm');
  assert.ok(Math.sign(b.station.ringAngle - a.station.ringAngle) !== Math.sign(b.station.wheelAngle - a.station.wheelAngle));
  assert.equal(a.station.towerCell, 3); assert.equal(a.station.wheelCell, 1);
  assert.equal(a.prime.visible, false); assert.equal(a.fragments.length, 0);
  assert.equal(a.flash, 0); assert.equal(a.prime.beamAlpha, 0);
});

test('Cronos Prime arrives from outside the screen and stops above the reactor, under the HUD', () => {
  const entering = getChronosIntroPose(T.arrive + .01);
  assert.equal(entering.prime.visible, true);
  assert.equal(onScreen(entering.prime), false, 'it comes from beyond the screen edge');
  let previous = Infinity;
  for (let time = T.arrive + .2; time <= T.arrived; time += .2) {
    const {prime} = getChronosIntroPose(time);
    const distance = Math.hypot(prime.x - .5, prime.y - .3);
    assert.ok(distance <= previous + 1e-9, `approaching at ${time}`);
    previous = distance;
  }
  const hover = getChronosIntroPose(T.beamStart).prime;
  assert.ok(Math.abs(hover.x - .5) < .01 && hover.y > .22 && hover.y < .4);
  assert.equal(hover.tilt, 0);
});

test('it unfolds and charges before firing, and the beam only exists around the rupture', () => {
  const folded = getChronosIntroPose(T.arrive + .5).prime, open = getChronosIntroPose(T.beamStart).prime;
  assert.ok(folded.wingSpread < .05 && open.wingSpread > .95);
  let glow = 0;
  for (let time = T.chargeStart; time < T.rupture; time += .2) {
    const {prime} = getChronosIntroPose(time);
    assert.ok(prime.coreGlow >= glow - 1e-9); glow = prime.coreGlow;
  }
  assert.equal(getChronosIntroPose(T.beamStart - .01).prime.beamAlpha, 0);
  assert.ok(getChronosIntroPose(T.rupture).prime.beamAlpha > .9);
  assert.equal(getChronosIntroPose(T.beamEnd + .01).prime.beamAlpha, 0);
  assert.equal(getChronosIntroPose(T.rupture - .01).station.towerCell, 3, 'the tower only breaks when the beam lands');
});

test('at nine seconds the tower breaks, the wheel tilts, a soft flash fires and eight fragments fly outwards', () => {
  const hit = getChronosIntroPose(T.rupture + .05);
  assert.equal(hit.station.towerCell, 4); assert.equal(hit.station.wheelCell, 2);
  assert.ok(hit.flash > .3 && hit.flash <= .6, 'the flash marks the impact without hiding the picture');
  assert.ok(getChronosIntroPose(T.rupture + .05, {reducedEffects: true}).flash <= .3);
  assert.equal(getChronosIntroPose(T.rupture + .05, {reducedEffects: true}).station.shake, 0);
  assert.equal(getChronosIntroPose(T.rupture + 1).flash, 0);
  assert.deepEqual(hit.fragments.map(item => item.cell).sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.ok(fragmentDistance(getChronosIntroPose(T.rupture + 2)) > fragmentDistance(getChronosIntroPose(T.rupture + .5)));
  assert.ok(getChronosIntroPose(T.rupture + 2).fragments.filter(item => item.dy > 0).length >= 4, 'debris also comes towards the ship');
  assert.ok(getChronosIntroPose(T.fragmentsEnd + .1).fragments.every(item => item.alpha === 0));
});

test('Cronos Prime leaves the way it came while the broken station stays and steps back', () => {
  assert.ok(onScreen(getChronosIntroPose(T.retreatStart).prime));
  const gone = getChronosIntroPose(T.retreatEnd - .01).prime;
  assert.equal(onScreen(gone), false, 'it flies out of the screen instead of fading away');
  assert.equal(getChronosIntroPose(T.retreatEnd).prime.visible, false);
  const early = getChronosIntroPose(T.rupture + .5), late = getChronosIntroPose(T.rupture + 4);
  assert.ok(late.station.ringOffset > early.station.ringOffset);
  assert.equal(getChronosIntroPose(T.ringGone + .1).station.ringAlpha, 0);
  assert.equal(getChronosIntroPose(20).station.towerCell, 4);
  assert.equal(getChronosIntroPose(T.rupture).station.zoom, getChronosIntroPose(1).station.zoom, 'no zoom jump at the rupture');
  assert.ok(getChronosIntroPose(T.end).station.zoom < .6 * getChronosIntroPose(1).station.zoom, 'the wreck steps back to clear the play area');
});

test('poses are pure, deterministic and finite for every frame, and invalid clocks yield an inactive pose', () => {
  for (let time = 0; time <= 32; time += 1 / 30) {
    const a = getChronosIntroPose(time), b = getChronosIntroPose(time);
    assert.deepEqual(a, b);
    assert.ok(finiteDeep(a), `finite at ${time}`);
  }
  for (const bad of [NaN, -1, Infinity, undefined]) assert.equal(getChronosIntroPose(bad).active, false);
});
