import test from 'node:test';
import assert from 'node:assert/strict';
import {getChronosIntroPose, CHRONOS_INTRO_TIMELINE as T, CRONOS_PRIME_FRAMES as F} from '../src/game/animation/chronos-intro.js';

const finiteDeep = value => {
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(finiteDeep);
  if (value && typeof value === 'object') return Object.values(value).every(finiteDeep);
  return true;
};
const pose = (time, options) => getChronosIntroPose(time, options);
const lit = value => value.station.sectorLights.filter(light => light > .5).length;
const framesBetween = (from, to) => {
  const frames = new Set();
  for (let time = from; time < to; time += .02) frames.add(pose(time).prime.frame);
  return frames;
};

test('the rupture keeps the nine-second route moment and the shots follow the script', () => {
  assert.equal(T.rupture, 9);
  assert.ok(T.omen < T.approach && T.approach < T.arrive && T.arrive < T.drain && T.drain < T.beamStart && T.beamStart < T.rupture);
  const shots = new Set();
  for (let time = 0; time <= T.end; time += .1) shots.add(pose(time).phase);
  assert.deepEqual([...shots], ['scale', 'omen', 'arrival', 'drain', 'shot', 'rupture', 'scorn', 'escape']);
  assert.equal(pose(T.end + .01).active, false);
});

test('shot 1 keeps the station shot the owner liked: very close, then pulling back', () => {
  assert.ok(pose(0).camera.zoom >= 2.9);
  let previous = Infinity;
  for (let time = 0; time <= T.drain; time += .2) {
    assert.ok(pose(time).camera.zoom <= previous + 1e-9); previous = pose(time).camera.zoom;
  }
  assert.equal(pose(1).prime.visible, false); assert.equal(lit(pose(1)), 8);
});

test('Cronos Prime arrives from outside: a distant light, then it closes in turning and brakes over the tower', () => {
  assert.equal(pose(T.omen - .1).distantLight, null);
  assert.ok(pose(T.approach - .1).distantLight.alpha > .8, 'a violet light far above first');
  const far = pose(T.approach + .05).prime, near = pose(T.arrive).prime;
  assert.ok(far.visible && far.scale < .2 && far.x > .65, 'small and far at first');
  assert.ok(Math.abs(near.scale - 1) < .02 && Math.abs(near.x - .48) < .01 && Math.abs(near.y - .25) < .02);
  assert.ok(far.trail > .9 && pose(T.arrive + .5).prime.trail === 0, 'engine trail only while moving');
  for (const frame of framesBetween(T.approach, T.arrive - .4)) assert.ok(F.side.includes(frame), 'it turns (rotation frames) while closing in');
  assert.ok(F.front.includes(pose(T.arrive).prime.frame), 'and faces the station when it brakes');
  assert.ok(pose(T.arrive + .05).prime.brake > .8, 'it brakes hard');
  assert.ok(pose(T.arrive + .5).prime.nameCard > .9);
  assert.equal(pose(T.approach + .3).station.whole, true);
});

test('it charges with the owner frames while the station goes dark sector by sector, then fires straight down', () => {
  const charge = framesBetween(T.drain, T.beamStart);
  assert.deepEqual([...charge].sort((a, b) => a - b), F.charge);
  let previous = 8;
  for (let time = T.drain; time <= T.beamStart; time += .1) {
    const count = lit(pose(time)); assert.ok(count <= previous); previous = count;
  }
  assert.equal(lit(pose(T.beamStart)), 0);
  assert.ok(pose(T.drain + .9).drainStreams.some(stream => stream.alpha > .5));
  assert.equal(pose(T.beamStart + .1).prime.frame, F.fire);
  assert.ok(pose(T.rupture).beam.alpha > .9); assert.equal(pose(T.fireEnd + .01).beam.alpha, 0);
  assert.ok(Math.abs(pose(T.rupture).prime.x - .48) < .02, 'right above the tower: a vertical shot');
});

test('the blue explosion plays its eight frames and the station is gone behind it, leaving only debris', () => {
  const frames = [];
  for (let time = T.rupture; time < T.rupture + T.explosionSeconds; time += .02) frames.push(pose(time).explosion.frame);
  assert.deepEqual([...new Set(frames)], [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(pose(T.rupture + T.explosionSeconds + .01).explosion, null);
  assert.equal(pose(T.stationGone - .01).station.whole, true);
  assert.equal(pose(T.stationGone + .01).station.whole, false, 'never whole again');
  assert.ok(pose(T.stationGone).explosion.frame >= 2, 'the swap happens while the blast covers it');
  assert.equal(pose(20).station.whole, false); assert.ok(pose(20).station.alpha < .5);
  assert.ok(pose(T.rupture + 2).fragments.some(item => item.scale > 2.5));
  assert.ok(pose(T.rupture + .05).flash > 0 && pose(T.rupture + .3).flash === 0, 'a short flash, no white screen');
  assert.ok(pose(T.rupture + .05, {reducedEffects: true}).flash <= .25);
  assert.equal(pose(T.rupture + .1, {reducedEffects: true}).camera.shakeX, 0);
});

test('after the blast it cools down, turns and leaves the way it came, without fading out on the spot', () => {
  for (const frame of framesBetween(T.fireEnd, T.turn)) assert.ok(F.cooldown.includes(frame));
  const turning = framesBetween(T.turn, T.gone);
  assert.ok([...turning].some(frame => F.side.includes(frame)), 'it turns away');
  assert.ok(pose(T.gone - .05).prime.x > .85, 'it flies off the way it came');
  assert.ok(pose(T.gone - .05).prime.scale < .2);
  assert.equal(pose(T.gone).prime.visible, false);
});

test('frames cross-fade into the next one (no visible jumps) except the sharp cut of the shot', () => {
  for (let time = T.approach; time < T.leave; time += .01) {
    const {prime} = pose(time), later = pose(time + .01).prime;
    assert.ok(prime.blend >= 0 && prime.blend <= 1);
    if (later.frame !== prime.frame && !(time < T.beamStart && time + .01 >= T.beamStart) && !(time < T.fireEnd && time + .01 >= T.fireEnd)) {
      assert.equal(later.frame, prime.next, `frame ${prime.frame} hands over to the one it was fading into at ${time.toFixed(2)}`);
      assert.ok(prime.blend > .9, `the hand-over is invisible at ${time.toFixed(2)}`);
    }
  }
  assert.equal(pose(T.beamStart + .01).prime.blend, 0, 'the shot cuts in');
});

test('the scene stays owned by the intro after it ends and poses are pure, deterministic and finite', () => {
  assert.equal(pose(T.end + 5).active, false);
  const held = pose(T.end + 5, {holdWreck: true});
  assert.equal(held.active, true); assert.equal(held.prime.visible, false); assert.equal(held.station.whole, false);
  for (let time = 0; time <= 32; time += 1 / 30) {
    const a = pose(time, {holdWreck: true}), b = pose(time, {holdWreck: true});
    assert.deepEqual(a, b);
    assert.ok(finiteDeep(a), `finite at ${time}`);
  }
  for (const bad of [NaN, -1, Infinity, undefined]) assert.equal(pose(bad).active, false);
});
