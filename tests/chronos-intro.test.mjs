import test from 'node:test';
import assert from 'node:assert/strict';
import {getChronosIntroPose, CHRONOS_INTRO_TIMELINE as T} from '../src/game/animation/chronos-intro.js';

const finiteDeep = value => {
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(finiteDeep);
  if (value && typeof value === 'object') return Object.values(value).every(finiteDeep);
  return true;
};
const pose = (time, options) => getChronosIntroPose(time, options);
const fragmentDistance = value => value.fragments.reduce((sum, item) => sum + Math.hypot(item.dx, item.dy), 0);

test('the rupture keeps the nine-second route moment, controls stay locked until then and eight shots follow the script', () => {
  assert.equal(T.rupture, 9);
  assert.ok(T.omen < T.tearOpen && T.tearOpen < T.appear && T.appear < T.drain && T.drain < T.beamStart && T.beamStart < T.rupture);
  assert.equal(pose(8.9).controlsLocked, true); assert.equal(pose(9.01).controlsLocked, false);
  const shots = new Set();
  for (let time = 0; time <= T.end; time += .1) shots.add(pose(time).phase);
  assert.deepEqual([...shots], ['scale', 'omen', 'appearance', 'drain', 'shot', 'rupture', 'scorn', 'escape']);
  assert.equal(pose(T.end + .01).active, false);
});

test('shot 1 sells the scale: the camera starts close on Chronos and pulls back before the villain feeds', () => {
  assert.ok(pose(0).camera.zoom >= 2, 'Chronos does not fit on screen at first');
  let previous = Infinity;
  for (let time = 0; time <= T.drain; time += .2) {
    const {zoom} = pose(time).camera;
    assert.ok(zoom <= previous + 1e-9, `the camera keeps pulling back at ${time}`); previous = zoom;
  }
  assert.ok(Math.abs(pose(T.drain).camera.zoom - 1) < .01);
  assert.ok(pose(1).convoy.length >= 1, 'convoy ships give a size reference');
  assert.equal(pose(T.drain + .1).convoy.length, 0, 'the convoy is gone once the attack starts');
});

test('shots 2–3: space darkens, a tear opens and Cronos Prime comes out of it from the depth', () => {
  assert.equal(pose(T.omen - .1).darkness, 0); assert.ok(pose(T.appear).darkness > .5);
  assert.equal(pose(T.tearOpen - .1).tear.open, 0); assert.ok(pose(T.appear + .3).tear.open > .5);
  assert.ok(pose(T.appear + .3).tear.bolts.length === 4);
  assert.equal(pose(T.appear - .01).prime.visible, false);
  const born = pose(T.appear + .02).prime, emerged = pose(T.emerged).prime;
  assert.ok(born.scale < .3, 'it starts small, far away');
  assert.ok(Math.abs(born.y - .19) < .03, 'it starts inside the tear, below the HUD');
  assert.ok(emerged.scale > .95 && Math.abs(emerged.y - .3) < .01);
});

test('the wings snap open in a fraction of a second with an overshoot, then the eye opens and the name is shown', () => {
  assert.equal(pose(T.wingsSnap - .01).prime.wingSpread, 0);
  assert.ok(pose(T.wingsSnap + .2).prime.wingSpread > 1.05, 'overshoot');
  assert.ok(pose(T.wingsSnap + .05).prime.snap > .8 && pose(T.wingsSnap + .5).prime.snap === 0, 'one energy pulse');
  assert.ok(Math.abs(pose(T.wingsSnap + 1).prime.wingSpread - 1) < .05, 'settles');
  assert.equal(pose(T.eyeOpen - .01).prime.eye, 0); assert.ok(pose(T.eyeOpen + .5).prime.eye > .99);
  assert.ok(pose(T.eyeOpen + 1).prime.nameCard > .9); assert.equal(pose(T.beamStart).prime.nameCard, 0);
  assert.ok(Math.hypot(pose(T.wingsSnap + .05).camera.shakeX, pose(T.wingsSnap + .05).camera.shakeY) > 0, 'the snap kicks the camera');
});

test('shot 4: it feeds on the station — streams flow in, sectors go dark and the core charge grows', () => {
  assert.equal(pose(T.drain - .01).drainStreams.length, 0);
  assert.equal(pose(T.drain + .5).drainStreams.length, 8);
  let lights = Infinity, charge = -1;
  for (let time = T.drain; time < T.beamStart; time += .2) {
    const value = pose(time);
    assert.ok(value.station.lights <= lights + 1e-9, `lights fade at ${time}`); lights = value.station.lights;
    assert.ok(value.prime.charge >= charge - 1e-9); charge = value.prime.charge;
  }
  assert.ok(pose(T.beamStart).station.lights < .2 && pose(T.beamStart).station.drainedSectors === 8);
  assert.ok(pose(T.beamStart).prime.scale > pose(T.emerged).prime.scale, 'swollen with energy');
});

test('shot 5: the beam only exists around the impact and the camera pushes in', () => {
  assert.equal(pose(T.beamStart - .01).beam.alpha, 0);
  assert.ok(pose(T.rupture).beam.alpha > .9);
  assert.equal(pose(T.beamEnd + .01).beam.alpha, 0);
  assert.ok(pose(T.rupture).camera.zoom > 1.05);
  assert.equal(pose(T.rupture - .01).station.towerCell, 3, 'the tower only breaks when the beam lands');
});

test('shot 6: a short flash, a shockwave bigger than the station, a chain of explosions and debris flying at the camera', () => {
  const hit = pose(T.rupture + .03);
  assert.equal(hit.station.towerCell, 4); assert.equal(hit.station.wheelCell, 2);
  assert.ok(hit.flash > .6 && hit.flash <= .85);
  assert.equal(pose(T.rupture + .5).flash, 0, 'the flash is a hit, not a white screen');
  assert.ok(pose(T.rupture + .05, {reducedEffects: true}).flash <= .3);
  const frames = [];
  for (let time = T.rupture; time < T.rupture + T.shockwaveSeconds; time += .05) frames.push(pose(time).shockwave.frame);
  assert.deepEqual([...new Set(frames)], [0, 1, 2, 3]);
  assert.ok(pose(T.rupture + 1.2).shockwave.scale > 1.8, 'the wave outgrows the station');
  assert.ok(pose(T.rupture + 1.2).shockwave.alpha < .5, 'and clears before play needs the screen');
  assert.equal(pose(T.rupture + T.shockwaveSeconds + .01).shockwave, null);
  const exploded = new Set();
  for (let time = T.rupture; time < T.rupture + 2.2; time += .05) for (const item of pose(time).explosions) exploded.add(item.angle);
  assert.equal(exploded.size, 8, 'the explosions run around the whole ring');
  assert.ok(pose(T.rupture + .1).explosions.length < pose(T.rupture + .9).explosions.length, 'it is a chain, not a single blast');
  assert.ok(pose(T.rupture + 2).fragments.some(item => item.scale > 2.5), 'debris grows as it passes the camera');
  assert.ok(fragmentDistance(pose(T.rupture + 2)) > fragmentDistance(pose(T.rupture + .5)));
  assert.ok(Math.hypot(pose(T.rupture + .1).camera.shakeX, pose(T.rupture + .1).camera.shakeY) > .005);
  assert.equal(pose(T.rupture + .1, {reducedEffects: true}).camera.shakeX, 0);
});

test('shot 7: Cronos Prime looks at the ship with a red eye and leaves in a jump instead of fading out', () => {
  assert.equal(pose(T.scorn - .01).prime.eyeRed, 0);
  assert.ok(pose(T.scorn + .9).prime.eyeRed > .9);
  assert.ok(pose(T.gone - .2).prime.stretch > 3, 'warp streak');
  assert.ok(pose(T.gone - .2).prime.y < 0, 'it leaves the screen upwards');
  assert.equal(pose(T.gone).prime.visible, false);
});

test('the wreck burns, dims into the background, keeps spinning and steps back for play', () => {
  assert.ok(pose(T.rupture + 4).fires.every(item => item.alpha > .3));
  assert.ok(pose(T.rupture + 6).station.alpha <= .56);
  assert.ok(pose(18).station.zoom <= .5 * pose(1).station.zoom + 1e-9);
  assert.equal(pose(T.ringGone + .1).station.ringAlpha, 0);
  assert.equal(pose(T.end + 5).active, false);
  const held = pose(T.end + 5, {holdWreck: true}), later = pose(T.end + 6, {holdWreck: true});
  assert.equal(held.active, true); assert.equal(held.station.towerCell, 4);
  assert.notEqual(held.station.wheelAngle, later.station.wheelAngle);
  assert.equal(held.prime.visible, false); assert.equal(held.flash, 0);
});

test('poses are pure, deterministic and finite for every frame, and invalid clocks yield an inactive pose', () => {
  for (let time = 0; time <= 32; time += 1 / 30) {
    const a = pose(time, {holdWreck: true}), b = pose(time, {holdWreck: true});
    assert.deepEqual(a, b);
    assert.ok(finiteDeep(a), `finite at ${time}`);
  }
  for (const bad of [NaN, -1, Infinity, undefined]) assert.equal(pose(bad).active, false);
});
