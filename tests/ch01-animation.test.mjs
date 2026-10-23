import test from 'node:test';
import assert from 'node:assert/strict';
import metadata from '../art-source/enemies/ch01/ch01-atlas-v1.json' with {type: 'json'};
import {CH01_ANIMATIONS, CH01_ATLAS, createCh01Animator} from '../src/game/animation/ch01-animator.js';

const advance = (animator, seconds, sample) => {
  const events = [];
  while (seconds > 1e-9) {
    const dt = Math.min(.01, seconds);
    events.push(...animator.update(dt, sample));
    seconds -= dt;
  }
  return events;
};

test('CH-01 frame rectangles, pivots and timings come from the produced 24-frame atlas', () => {
  assert.equal(CH01_ATLAS.frameCount, 24);
  assert.deepEqual(CH01_ATLAS.pivot, metadata.pivot);
  assert.equal(CH01_ATLAS.drawSize, metadata.recommendedDrawSizeLogical);
  for (const [state, definition] of Object.entries(metadata.animations)) {
    assert.deepEqual(CH01_ANIMATIONS[state].frames, definition.frames);
    assert.deepEqual(CH01_ANIMATIONS[state].durationMs, definition.durationMs);
    const animator = createCh01Animator({initialState: state});
    const frame = animator.getFrame();
    assert.equal(frame.frameIndex, definition.frames[0]);
    assert.deepEqual(frame.rect, metadata.frames[frame.frameIndex].rect);
    assert.ok(frame.rect.x + frame.rect.width <= CH01_ATLAS.width);
    assert.ok(frame.rect.y + frame.rect.height <= CH01_ATLAS.height);
    assert.deepEqual(frame.pivot, {x: .5, y: .5});
    assert.ok(Object.isFrozen(frame.rect));
  }
  assert.equal(CH01_ANIMATIONS.spawn.totalMs, 430);
  assert.equal(CH01_ANIMATIONS.attack.totalMs, 500);
  assert.equal(CH01_ANIMATIONS.hurt.totalMs, 250);
  assert.equal(CH01_ANIMATIONS.destroy.totalMs, 490);
});

test('spawn lasts 430 ms, resists locomotion requests, and follows real lateral velocity afterward', () => {
  const animator = createCh01Animator();
  assert.equal(animator.request('bankLeft'), false);
  advance(animator, .429, {vx: -80, vy: 180});
  assert.equal(animator.getFrame().state, 'spawn');
  advance(animator, .001, {vx: -80, vy: 180});
  assert.equal(animator.getFrame().state, 'bankLeft');
  assert.equal(animator.getFrame().frameIndex, 8);
  animator.update(.01, {vx: 80});
  assert.equal(animator.getFrame().state, 'bankRight');
  assert.equal(animator.getFrame().frameIndex, 10);
  animator.update(.01, {vx: 0, vy: 180});
  const straightFrames = new Set();
  for (let step = 0; step < 40; step++) {
    animator.update(.025);
    straightFrames.add(animator.getFrame().frameIndex);
  }
  assert.deepEqual([...straightFrames].sort((a, b) => a - b), [9, 11]);
  animator.update(.01, {vy: 0});
  assert.equal(animator.getFrame().state, 'idle');
});

test('attack fires once at frame 1 / 160 ms, survives skipped frames and cannot restart itself', () => {
  const animator = createCh01Animator({initialState: 'idle', maxDeltaSeconds: .5});
  assert.equal(animator.request('attack'), true);
  const id = animator.getFrame().attackId;
  assert.deepEqual(animator.update(0), []);
  const first = animator.update(.159);
  assert.deepEqual(first.map(event => event.name), ['charge']);
  assert.equal(animator.getFrame().frameIndex, 12);
  assert.equal(animator.request('attack'), false);
  const second = animator.update(.171); // Crosses fire and the next two pose boundaries.
  assert.deepEqual(second.map(event => event.name), ['fire']);
  assert.deepEqual(second[0], {name: 'fire', state: 'attack', frameIndex: 13, atMs: 160, attackId: id});
  assert.equal(animator.getFrame().frameIndex, 15);
  const rest = animator.update(.17);
  assert.deepEqual(rest, []);
  assert.equal(animator.getFrame().state, 'idle');
  assert.deepEqual(animator.update(.5), []);
  assert.equal(animator.request('attack'), true);
  assert.notEqual(animator.getFrame().attackId, id);
  assert.equal(animator.update(.5).filter(event => event.name === 'fire').length, 1);
});

test('hurt cancels an un-fired attack and never releases a delayed shot', () => {
  const animator = createCh01Animator({initialState: 'idle'});
  animator.request('attack');
  const id = animator.getFrame().attackId;
  advance(animator, .15);
  assert.equal(animator.request('hurt'), true);
  assert.equal(animator.request('attack'), false);
  const canceled = advance(animator, .25, {hp: 1});
  assert.deepEqual(canceled.map(event => event.name), ['attackCanceled']);
  assert.equal(canceled[0].attackId, id);
  assert.equal(canceled[0].fired, false);
  assert.equal(animator.getFrame().state, 'damaged');
  assert.deepEqual(advance(animator, 1), []);
  assert.equal(animator.request('attack'), true);
  assert.equal(advance(animator, .5).filter(event => event.name === 'fire').length, 1);
  assert.equal(animator.getFrame().state, 'damaged');
});

test('hurt after fire reports a consumed attack without firing twice or extending hitstun', () => {
  const animator = createCh01Animator({initialState: 'idle'});
  animator.request('attack');
  assert.equal(advance(animator, .16).filter(event => event.name === 'fire').length, 1);
  animator.request('hurt');
  const events = advance(animator, .249, {hp: 1});
  assert.equal(events[0].name, 'attackCanceled');
  assert.equal(events[0].fired, true);
  assert.equal(animator.request('hurt'), false);
  assert.equal(animator.getFrame().state, 'hurt');
  advance(animator, .001);
  assert.equal(animator.getFrame().state, 'damaged');
  assert.deepEqual(advance(animator, .8), []);
});

test('health changes drive hurt, persistent damage and terminal destruction without resurrection', () => {
  const animator = createCh01Animator({initialState: 'flight'});
  advance(animator, .25, {hp: 1, vx: 50, vy: 150});
  assert.equal(animator.getFrame().state, 'damaged');
  assert.equal(animator.getFrame().damageRatio, .5);
  advance(animator, .5, {hp: 1});
  assert.equal(animator.getFrame().state, 'damaged');
  assert.ok([18, 19].includes(animator.getFrame().frameIndex));
  animator.update(.01, {hp: 2});
  assert.equal(animator.getFrame().state, 'bankRight');
  const events = advance(animator, .489, {hp: 0});
  assert.equal(animator.getFrame().state, 'destroy');
  assert.equal(animator.getFrame().done, false);
  for (const state of ['spawn', 'idle', 'attack', 'hurt', 'destroy']) assert.equal(animator.request(state), false);
  events.push(...advance(animator, .001, {hp: 2}));
  assert.deepEqual(events.map(event => event.name), ['coreBurst', 'removeVisual']);
  assert.equal(animator.getFrame().frameIndex, 23);
  assert.equal(animator.getFrame().done, true);
  assert.equal(animator.getFrame().hp, 0);
  assert.deepEqual(advance(animator, 2, {hp: 2}), []);
});

test('destroy before fire cancels the attack and emits destruction events once', () => {
  const animator = createCh01Animator({initialState: 'idle', maxDeltaSeconds: 1});
  animator.request('attack');
  animator.update(.1);
  animator.request('destroy');
  const events = animator.update(1);
  assert.deepEqual(events.map(event => event.name), ['attackCanceled', 'coreBurst', 'removeVisual']);
  assert.equal(events[0].fired, false);
  assert.deepEqual(animator.update(1), []);
});

test('delta bounds and pause prevent NaN, skipped suspension time and accidental events', () => {
  const animator = createCh01Animator({initialState: 'idle'});
  animator.request('attack');
  const before = animator.getFrame();
  assert.deepEqual(animator.update(0, {hp: 0, vx: 90}), []);
  assert.deepEqual(animator.getFrame(), before);
  assert.deepEqual(animator.update(500).map(event => event.name), ['charge']); // Only 50 ms applied.
  assert.equal(animator.getFrame().frameIndex, 12);
  for (const dt of [NaN, Infinity, -Infinity, -1]) assert.throws(() => animator.update(dt));
  for (const sample of [{hp: NaN}, {maxHp: 0}, {vx: Infinity}, {vy: NaN}]) {
    assert.throws(() => animator.update(.01, sample));
  }
  for (const options of [{maxDeltaSeconds: 0}, {maxDeltaSeconds: 2}, {maxHp: 0}, {hp: NaN}, {initialState: 'missing'}]) {
    assert.throws(() => createCh01Animator(options));
  }
  assert.throws(() => animator.request('missing'));
  assert.equal(createCh01Animator({hp: -20}).getFrame().state, 'destroy');
  assert.equal(createCh01Animator({hp: 999, maxHp: 2}).getFrame().hp, 2);
});

test('the same elapsed time and inputs reproduce frames and events across frame partitions', () => {
  const traces = [];
  for (const step of [.01, .025, .05]) {
    const animator = createCh01Animator({initialState: 'idle'});
    animator.request('attack');
    const events = [];
    for (let index = 0; index < Math.round(.5 / step); index++) events.push(...animator.update(step));
    traces.push({events, frame: animator.getFrame()});
  }
  assert.deepEqual(traces[0], traces[1]);
  assert.deepEqual(traces[0], traces[2]);
});
