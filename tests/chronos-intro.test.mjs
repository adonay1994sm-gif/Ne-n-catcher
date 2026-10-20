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
const lit = value => value.station.sectorLights.filter(light => light > .5).length;
const platesStart = T.rupture + T.whiteSeconds;
const platesEnd = platesStart + 5 * T.plateFastSeconds + 5 * T.plateSlowSeconds;

test('the rupture keeps the nine-second route moment, controls stay locked until then and eight shots follow the script', () => {
  assert.equal(T.rupture, 9);
  assert.ok(T.omen < T.tearOpen && T.tearOpen < T.appear && T.appear < T.looming && T.drain < T.beamStart && T.beamStart < T.rupture);
  assert.equal(pose(8.9).controlsLocked, true); assert.equal(pose(9.01).controlsLocked, false);
  const shots = new Set();
  for (let time = 0; time <= T.end; time += .1) shots.add(pose(time).phase);
  assert.deepEqual([...shots], ['scale', 'omen', 'appearance', 'drain', 'shot', 'rupture', 'scorn', 'escape']);
  assert.equal(pose(T.end + .01).active, false);
});

test('shot 1 sells the scale: the camera starts very close on Chronos and pulls back before the villain feeds', () => {
  assert.ok(pose(0).camera.zoom >= 2.9, 'Chronos does not fit on screen at first');
  let previous = Infinity;
  for (let time = 0; time <= T.drain; time += .2) {
    const {zoom} = pose(time).camera;
    assert.ok(zoom <= previous + 1e-9, `the camera keeps pulling back at ${time}`); previous = zoom;
  }
  assert.ok(Math.abs(pose(T.drain).camera.zoom - 1) < .01);
});

test('shots 2–3: space darkens, a tear opens and Cronos Prime comes out of it, looming larger than the screen', () => {
  assert.equal(pose(T.omen - .1).darkness, 0); assert.ok(pose(T.appear).darkness > .5);
  assert.equal(pose(T.tearOpen - .1).tear.open, 0); assert.ok(pose(T.appear).tear.open > .5);
  assert.equal(pose(T.appear + .3).tear.bolts.length, 4);
  assert.equal(pose(T.appear - .01).prime.visible, false);
  const born = pose(T.appear + .02).prime, looming = pose(T.looming).prime;
  assert.ok(born.scale < .3, 'it starts small, inside the tear');
  assert.ok(Math.abs(born.x - pose(T.appear).tear.x) < .01 && Math.abs(born.y - pose(T.appear).tear.y) < .02);
  assert.ok(looming.scale >= 1.5, 'its wings no longer fit on screen');
  const firing = pose(T.inPosition).prime;
  assert.ok(firing.scale < 1 && firing.x < .35 && firing.y > .2 && firing.y < .3, 'it pulls back to an off-axis firing post, clear of the HUD');
});

test('the wings snap open with an overshoot and one energy pulse, then the eye opens and the title punches in', () => {
  assert.equal(pose(T.wingsSnap - .01).prime.wingSpread, 0);
  assert.ok(pose(T.wingsSnap + .2).prime.wingSpread > 1.05, 'overshoot');
  assert.ok(Math.abs(pose(T.wingsSnap + 1).prime.wingSpread - 1) < .05, 'settles');
  assert.ok(pose(T.wingsSnap + .05).prime.snap > .8 && pose(T.wingsSnap + .5).prime.snap === 0);
  assert.ok(Math.hypot(pose(T.wingsSnap + .05).camera.shakeX, pose(T.wingsSnap + .05).camera.shakeY) > 0);
  assert.equal(pose(T.eyeOpen - .01).prime.eye, 0); assert.ok(pose(T.eyeOpen + .5).prime.eye > .99);
  assert.ok(pose(T.eyeOpen + .02).prime.nameCardPunch > .5 && pose(T.eyeOpen + .5).prime.nameCardPunch === 0);
  assert.ok(pose(T.eyeOpen + 1).prime.nameCard > .9); assert.equal(pose(T.beamStart).prime.nameCard, 0);
});

test('shot 4: it drinks the station sector by sector, the last one just before firing', () => {
  assert.equal(lit(pose(T.drain - .01)), 8);
  let previous = 8;
  for (let time = T.drain; time <= T.beamStart; time += .1) {
    const count = lit(pose(time));
    assert.ok(count <= previous, `sectors only go dark at ${time}`); previous = count;
  }
  assert.ok(lit(pose((T.drain + T.beamStart) / 2)) > 0 && lit(pose((T.drain + T.beamStart) / 2)) < 8, 'one by one, not all at once');
  assert.equal(lit(pose(T.beamStart)), 0);
  assert.ok(pose(T.drain + .9).drainStreams.some(stream => stream.alpha > .5), 'energy visibly flows');
  assert.ok(pose(T.beamStart).prime.charge > .99);
});

test('the eye beats faster as it charges, without slowing down before the shot', () => {
  // Frecuencia instantánea por diferencias de la fase: nunca baja durante la carga.
  const phase = time => Math.asin(Math.max(-1, Math.min(1, pose(time).prime.pulse * 2 - 1)));
  let lastRate = 0;
  for (let time = T.drain; time < T.beamStart; time += .25) {
    let crossings = 0;
    for (let step = 0; step < 50; step++) if (Math.sign(phase(time + step * .005)) !== Math.sign(phase(time + (step + 1) * .005))) crossings++;
    assert.ok(crossings >= lastRate - 1, `steady acceleration at ${time}`); lastRate = crossings;
  }
});

test('shot 5: a diagonal beam across half the screen, only around the impact, with a camera push', () => {
  assert.equal(pose(T.beamStart - .01).beam.alpha, 0);
  assert.ok(pose(T.rupture).beam.alpha > .9);
  assert.equal(pose(T.rupture + .55).beam.alpha, 0);
  assert.ok(pose(T.rupture).camera.zoom > 1.05);
  assert.ok(Math.abs(pose(T.beamStart).prime.x - .48) > .15, 'fired from off-axis, not sitting on the tower');
  assert.equal(pose(T.rupture - .01).station.towerCell, 3);
});

test('shot 6: two frames of white, then a hard cut to the painted rupture plates and the station never comes back whole', () => {
  assert.equal(pose(T.rupture + .02).flash, 1);
  assert.ok(pose(T.rupture + .02, {reducedEffects: true}).flash <= .3);
  assert.equal(pose(T.rupture + .5).flash, 0);
  assert.equal(pose(platesStart - .01).plates, null);
  assert.equal(pose(platesStart + .01).plates.index, 0);
  let previous = 0;
  for (let time = platesStart; time < platesEnd + 2; time += .05) {
    const {plates} = pose(time);
    assert.ok(plates.index >= previous && plates.index <= 10 && plates.mix >= 0 && plates.mix <= 1); previous = plates.index;
  }
  assert.equal(pose(platesStart + 5 * T.plateFastSeconds - .01).plates.index, 4, 'five fast plates');
  assert.equal(pose(platesEnd + .01).plates.index, 10, 'then the aftermath backdrop');
  assert.ok(pose(platesEnd + 1.5).plates.alpha <= .56, 'dimmed while flying');
  assert.ok(pose(T.fondoOutEnd + .1).plates.alpha === 0, 'which finally gives the screen back to play');
  assert.ok(pose(platesStart + .1).plates.shake > 0); assert.equal(pose(platesStart + .1, {reducedEffects: true}).plates.shake, 0);
  assert.ok(pose(T.rupture + 2).fragments.some(item => item.scale > 2.5), 'debris grows as it passes the camera');
  assert.equal(pose(20).station.towerCell, 4);
});

test('shot 7: it leans towards the ship, the eye turns red and looks at it, then it tears out of space', () => {
  assert.equal(pose(T.scorn - .01).prime.eyeRed, 0);
  const scorn = pose(T.scorn + .6).prime;
  assert.ok(scorn.eyeRed > .9 && scorn.lookY > 0 && scorn.tilt > .1);
  assert.ok(T.gone - T.scorn <= 1.6, 'a short shot');
  assert.ok(pose(T.warp + .25).tear.open > .5, 'the tear reopens where it leaves');
  assert.ok(pose(T.gone - .1).prime.stretch > 3);
  assert.equal(pose(T.gone).prime.visible, false);
  assert.equal(pose(T.gone + .1).tear.open, 0);
});

test('the scene stays owned by the intro after it ends and poses are pure, deterministic and finite', () => {
  assert.equal(pose(T.end + 5).active, false);
  const held = pose(T.end + 5, {holdWreck: true});
  assert.equal(held.active, true); assert.equal(held.prime.visible, false); assert.equal(held.flash, 0);
  for (let time = 0; time <= 32; time += 1 / 30) {
    const a = pose(time, {holdWreck: true}), b = pose(time, {holdWreck: true});
    assert.deepEqual(a, b);
    assert.ok(finiteDeep(a), `finite at ${time}`);
  }
  for (const bad of [NaN, -1, Infinity, undefined]) assert.equal(pose(bad).active, false);
});
