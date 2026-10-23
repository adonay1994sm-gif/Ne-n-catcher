import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getChronosDestructionPose} from '../src/game/animation/chronos-destruction.js';

const viewAt = (age, extra = {}) => ({elapsed: 9 + age, minDuration: 90, ...extra});

test('Chronos remains intact until the existing route reaches its rupture position', () => {
  for (const elapsed of [0, 2.25, 6.3, 8.999]) {
    const pose = getChronosDestructionPose({elapsed, minDuration: 90});
    assert.equal(pose.frame, 0);
    assert.equal(pose.state, 'intact');
    assert.equal(pose.age, 0);
    assert.equal(pose.waveVisible, false);
    assert.equal(pose.waveAlpha, 0);
  }
});

test('the six authored poses follow their actual time boundaries without repeated starts', () => {
  for (const [age, expectedFrame] of [
    [0, 1], [.449, 1], [.45, 2], [1.249, 2], [1.25, 3],
    [2.399, 3], [2.4, 4], [4.399, 4], [4.4, 5], [7.2, 5]
  ]) {
    assert.equal(getChronosDestructionPose(viewAt(age)).frame, expectedFrame, `age ${age}`);
  }
  assert.deepEqual([0, .5, 1.3, 2.5, 4.5].map(age => getChronosDestructionPose(viewAt(age)).state),
    ['impact', 'fracture', 'rupture', 'dispersion', 'aftermath']);
});

test('rupture timing derives from the supplied route duration rather than a second clock', () => {
  for (const minDuration of [20, 60, 90, 180]) {
    const ruptureAt = minDuration * .10;
    assert.equal(getChronosDestructionPose({elapsed: ruptureAt - .001, minDuration}).frame, 0);
    assert.equal(getChronosDestructionPose({elapsed: ruptureAt, minDuration}).frame, 1);
    assert.equal(getChronosDestructionPose({elapsed: ruptureAt + 2.4, minDuration}).frame, 4);
  }
});

test('all four front poses remain readable instead of disappearing at either end', () => {
  for (const [age, expectedFrame] of [[0, 0], [1.8, 1], [3.6, 2], [5.4, 3]]) {
    const pose = getChronosDestructionPose(viewAt(age));
    assert.equal(pose.waveVisible, true);
    assert.equal(pose.waveFrame, expectedFrame);
    assert.equal(pose.waveAlpha, .55);
  }
  assert.equal(getChronosDestructionPose(viewAt(1.799)).waveFrame, 0);
  assert.equal(getChronosDestructionPose(viewAt(3.599)).waveFrame, 1);
  assert.equal(getChronosDestructionPose(viewAt(5.399)).waveFrame, 2);
});

test('the front expands monotonically and fades only during the final 1.2 seconds', () => {
  const poses = [0, 1, 3, 5.4, 6, 6.6, 7.1, 7.2].map(age => getChronosDestructionPose(viewAt(age)));
  for (let index = 1; index < poses.length; index++) {
    assert.ok(poses[index].waveScale >= poses[index - 1].waveScale);
    assert.ok(poses[index].waveAlpha <= .55);
    assert.ok(poses[index].waveAlpha >= 0);
  }
  assert.equal(poses[4].waveAlpha, .55);
  assert.ok(Math.abs(poses[5].waveAlpha - .275) < 1e-12);
  assert.ok(poses[6].waveVisible && poses[6].waveAlpha > 0);
  assert.equal(poses[7].waveVisible, false);
  assert.equal(poses[7].waveAlpha, 0);
});

test('the destroyed final pose persists for the rest of the mission without replaying the wave', () => {
  for (const age of [7.2, 15, 81, 300, 1e100]) {
    const pose = getChronosDestructionPose(viewAt(age));
    assert.equal(pose.frame, 5);
    assert.equal(pose.state, 'aftermath');
    assert.equal(pose.waveFrame, 3);
    assert.equal(pose.waveVisible, false);
    assert.equal(pose.waveAlpha, 0);
    assert.ok(Math.abs(pose.waveScale - 2.24) < 1e-12);
  }
});

test('paused snapshots and repeated renders return identical poses without mutating inputs', () => {
  const view = Object.freeze(viewAt(2.75, {routeProgress: .13, station: Object.freeze({state: 'ruptured'})}));
  const before = structuredClone(view);
  const expected = getChronosDestructionPose(view);
  for (let index = 0; index < 100; index++) assert.deepEqual(getChronosDestructionPose(view), expected);
  assert.deepEqual(view, before);
  assert.equal(Object.isFrozen(expected), true);
  assert.throws(() => { expected.frame = 0; }, TypeError);
});

test('low effects quality preserves all story poses and the complete front sequence', () => {
  for (const age of [-1, 0, .45, 1.25, 1.8, 2.4, 3.6, 4.4, 5.4, 7.2]) {
    const expected = getChronosDestructionPose(viewAt(age));
    assert.deepEqual(getChronosDestructionPose(viewAt(age, {effectsQuality: 'low', effects: false})), expected);
    assert.deepEqual(getChronosDestructionPose(viewAt(age, {effectsQuality: 'high'})), expected);
  }
});

test('null, incomplete and nonfinite inputs use safe finite defaults', () => {
  const defaultPose = getChronosDestructionPose({elapsed: 0, minDuration: 90});
  for (const value of [undefined, null, {}, 0, '', {elapsed: NaN}, {elapsed: Infinity}, {elapsed: -1}]) {
    assert.deepEqual(getChronosDestructionPose(value), defaultPose);
  }
  for (const minDuration of [undefined, NaN, Infinity, -90, 0, '90']) {
    assert.deepEqual(getChronosDestructionPose({elapsed: 9, minDuration}), getChronosDestructionPose(viewAt(0)));
  }
  const extreme = getChronosDestructionPose({elapsed: Number.MAX_VALUE, minDuration: Number.MAX_VALUE});
  for (const key of ['frame', 'age', 'waveFrame', 'waveScale', 'waveAlpha']) assert.ok(Number.isFinite(extreme[key]), key);
});

test('presentation owns no update loop, event emission, storage, damage or random time source', async () => {
  const source = await readFile(new URL('../src/game/animation/chronos-destruction.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /requestAnimationFrame\s*\(|setInterval\s*\(|setTimeout\s*\(|Date\.now\s*\(|Math\.random\s*\(/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.|window\.|\.emit\s*\(|\.damage\s*=/);
});
