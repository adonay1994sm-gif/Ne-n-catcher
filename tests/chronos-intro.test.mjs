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

test('the rupture keeps the established nine-second route moment and the sequence ends before stage two', () => {
  assert.equal(T.rupture, 9);
  assert.ok(T.awaken < T.stutterStart && T.stutterEnd < T.rupture);
  assert.ok(T.end <= 30);
  assert.equal(getChronosIntroPose(T.end + .01).active, false);
});

test('Chronos is alive before the attack: rings turn in opposite directions with an intact tower and no Cronos Prime', () => {
  const a = getChronosIntroPose(1), b = getChronosIntroPose(3);
  assert.equal(a.active, true); assert.equal(a.phase, 'calm');
  assert.notEqual(a.station.ringAngle, b.station.ringAngle);
  assert.notEqual(a.station.wheelAngle, b.station.wheelAngle);
  assert.ok(Math.sign(b.station.ringAngle - a.station.ringAngle) !== Math.sign(b.station.wheelAngle - a.station.wheelAngle));
  assert.equal(a.station.towerCell, 3); assert.equal(a.station.wheelCell, 1);
  assert.equal(a.prime.alpha, 0); assert.equal(a.fragments.length, 0);
  assert.equal(a.backdrop.alpha, 0); assert.equal(a.flash, 0);
});

test('Cronos Prime awakens inside the reactor with a monotonic glow and unfolding wings before the rupture', () => {
  let previous = getChronosIntroPose(T.awaken - .01);
  assert.equal(previous.prime.alpha, 0);
  for (let time = T.awaken + .2; time < T.rupture; time += .2) {
    const pose = getChronosIntroPose(time);
    if (time >= T.stutterStart && time < T.stutterEnd) continue;
    assert.ok(pose.prime.coreGlow >= previous.prime.coreGlow - 1e-9, `glow at ${time}`);
    assert.ok(pose.prime.wingSpread >= previous.prime.wingSpread - 1e-9, `wings at ${time}`);
    previous = pose;
  }
  assert.ok(previous.prime.coreGlow > .8 && previous.prime.wingSpread > .8);
  assert.equal(previous.station.towerCell, 3, 'the tower only breaks at the rupture');
});

test('time stutters once: the scenery replays half a second before the shot, outside it the clock is real', () => {
  const inside = getChronosIntroPose(T.stutterStart + .1);
  assert.equal(inside.phase, 'stutter');
  assert.ok(Math.abs(inside.clock - (T.stutterStart + .1 - T.stutterRewind)) < 1e-9);
  assert.ok(inside.stutter > 0);
  for (const time of [T.stutterStart - .01, T.stutterEnd + .01, 2, 12]) {
    const pose = getChronosIntroPose(time);
    assert.equal(pose.clock, time); assert.equal(pose.stutter, 0);
  }
  const reduced = getChronosIntroPose(T.stutterStart + .1, {reducedEffects: true});
  assert.equal(reduced.clock, T.stutterStart + .1, 'reduced effects never rewind the image');
});

test('at nine seconds the tower breaks, the wheel tilts, a bounded flash fires and eight fragments fly outwards', () => {
  const before = getChronosIntroPose(T.rupture - .01), hit = getChronosIntroPose(T.rupture + .05);
  assert.equal(before.station.towerCell, 3); assert.equal(hit.station.towerCell, 4);
  assert.equal(hit.station.wheelCell, 2);
  assert.ok(hit.flash > .5 && hit.flash <= 1);
  assert.ok(getChronosIntroPose(T.rupture + .05, {reducedEffects: true}).flash <= .45, 'reduced effects soften the flash');
  assert.equal(getChronosIntroPose(T.rupture + 1.5).flash, 0);
  assert.equal(hit.fragments.length, 8);
  assert.deepEqual(hit.fragments.map(item => item.cell).sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.ok(fragmentDistance(getChronosIntroPose(T.rupture + 2)) > fragmentDistance(getChronosIntroPose(T.rupture + .5)));
  assert.ok(getChronosIntroPose(T.rupture + 2).fragments.filter(item => item.dy > 0).length >= 4, 'debris also comes towards the ship');
  assert.ok(getChronosIntroPose(T.fragmentsEnd + .1).fragments.every(item => item.alpha === 0));
});

test('the outer ring separates and leaves while the broken core stays, and Cronos Prime vanishes in the flash', () => {
  const early = getChronosIntroPose(T.rupture + .5), late = getChronosIntroPose(T.rupture + 4);
  assert.ok(late.station.ringOffset > early.station.ringOffset);
  assert.ok(late.station.ringAlpha < early.station.ringAlpha);
  assert.equal(getChronosIntroPose(T.ringGone + .1).station.ringAlpha, 0);
  assert.equal(getChronosIntroPose(20).station.towerCell, 4);
  assert.equal(getChronosIntroPose(20).station.coreAlpha, 1, 'the wrecked hub keeps travelling with the route');
  assert.equal(getChronosIntroPose(T.rupture).station.zoom, 1, 'no zoom jump at the rupture');
  assert.ok(getChronosIntroPose(T.end).station.zoom < .6, 'the wreck steps back to clear the play area');
  assert.ok(getChronosIntroPose(T.rupture + .2).prime.alpha > 0);
  assert.equal(getChronosIntroPose(T.primeGone + .01).prime.alpha, 0);
});

test('the illustrated rupture plates fade in behind play, cross-fade in order and fade out', () => {
  assert.equal(getChronosIntroPose(T.rupture - .1).backdrop.alpha, 0);
  const mid = getChronosIntroPose(14);
  assert.ok(mid.backdrop.alpha > .5 && mid.backdrop.alpha <= T.backdropMaxAlpha);
  let lastFrame = 0;
  for (let time = T.rupture; time < T.backdropEnd; time += .25) {
    const {backdrop} = getChronosIntroPose(time);
    assert.ok(backdrop.frameA >= lastFrame && backdrop.frameA <= 5 && backdrop.frameB <= 5);
    assert.ok(backdrop.mix >= 0 && backdrop.mix <= 1);
    lastFrame = backdrop.frameA;
  }
  assert.equal(lastFrame, 5);
  assert.equal(getChronosIntroPose(T.backdropEnd + .01).backdrop.alpha, 0);
});

test('poses are pure, deterministic and finite for every frame, and invalid clocks yield an inactive pose', () => {
  for (let time = 0; time <= 32; time += 1 / 30) {
    const a = getChronosIntroPose(time), b = getChronosIntroPose(time);
    assert.deepEqual(a, b);
    assert.ok(finiteDeep(a), `finite at ${time}`);
  }
  for (const bad of [NaN, -1, Infinity, undefined]) assert.equal(getChronosIntroPose(bad).active, false);
});
