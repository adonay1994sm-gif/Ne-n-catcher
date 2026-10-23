import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import metadata from '../art-source/enemies/ch02/ch02-atlas-v1.json' with {type: 'json'};
import {CH02_ANIMATIONS, CH02_ATLAS, createCh02Animator} from '../src/game/animation/ch02-animator.js';

const advance = (animator, seconds, sample, step = .01) => {
  const events = [];
  while (seconds > 1e-9) {
    const dt = Math.min(step, seconds);
    events.push(...animator.update(dt, sample));
    seconds -= dt;
  }
  return events;
};

test('CH-02 has a preserved unique 16-pose atlas, true padded alpha and the exported runtime hash', () => {
  assert.equal(CH02_ATLAS.frameCount, 16);
  assert.equal(CH02_ATLAS.width, 1024);
  assert.equal(CH02_ATLAS.height, 1024);
  assert.equal(CH02_ATLAS.image, 'assets/ch02_interceptor_atlas_v1.webp');
  assert.deepEqual(CH02_ATLAS.pivot, {x: .5, y: .5});
  assert.deepEqual(metadata.forward, {x: 0, y: 1});
  assert.equal(metadata.transparent, true);
  assert.equal(metadata.decodedRgbaBytes, 1024 * 1024 * 4);
  assert.equal(new Set(metadata.frames.map(frame => frame.rgbaSha256)).size, 16);
  for (const frame of metadata.frames) {
    assert.equal(frame.maximumBorderAlpha, 0);
    assert.ok(frame.alphaBounds.minX >= 16 && frame.alphaBounds.minY >= 16);
    assert.ok(frame.alphaBounds.maxX <= 239 && frame.alphaBounds.maxY <= 239);
    assert.deepEqual(frame.rect, {x: frame.index % 4 * 256, y: Math.floor(frame.index / 4) * 256,
      width: 256, height: 256});
  }
  const image = readFileSync(new URL('../assets/ch02_interceptor_atlas_v1.webp', import.meta.url));
  assert.equal(image.length, metadata.runtimeBytes);
  assert.equal(createHash('sha256').update(image).digest('hex'), metadata.checksums['ch02-atlas-v1.webp']);
  assert.deepEqual(image, readFileSync(new URL('../art-source/enemies/ch02/ch02-atlas-v1.webp', import.meta.url)));
});

test('every animation uses its own CH-02 metadata rectangle and timing', () => {
  for (const [state, definition] of Object.entries(metadata.animations)) {
    assert.deepEqual(CH02_ANIMATIONS[state].frames, definition.frames);
    assert.deepEqual(CH02_ANIMATIONS[state].durationMs, definition.durationMs);
    const frame = createCh02Animator({initialState: state}).getFrame();
    assert.equal(frame.frameIndex, definition.frames[0]);
    assert.deepEqual(frame.rect, metadata.frames[frame.frameIndex].rect);
    assert.equal(frame.drawSize, 108);
    assert.equal(frame.image, CH02_ATLAS.image);
    assert.ok(Object.isFrozen(frame.rect));
  }
  assert.equal(CH02_ANIMATIONS.spawn.totalMs, 320);
  assert.equal(CH02_ANIMATIONS.attack.totalMs, 500);
  assert.equal(CH02_ANIMATIONS.hurt.totalMs, 240);
  assert.equal(CH02_ANIMATIONS.destroy.totalMs, 540);
});

test('interceptor deployment resists banking until ready, then follows actual movement', () => {
  const animator = createCh02Animator();
  assert.equal(animator.request('bankLeft'), false);
  advance(animator, .319, {vx: -90, vy: 130});
  assert.equal(animator.getFrame().state, 'spawn');
  advance(animator, .001);
  assert.equal(animator.getFrame().state, 'bankLeft');
  assert.equal(animator.getFrame().frameIndex, 2);
  animator.update(.01, {vx: 90});
  assert.equal(animator.getFrame().frameIndex, 3);
  animator.update(.01, {vx: 0});
  assert.equal(animator.getFrame().state, 'flight');
  const frames = new Set();
  for (let index = 0; index < 40; index++) {
    animator.update(.025);
    frames.add(animator.getFrame().frameIndex);
  }
  assert.deepEqual([...frames].sort(), [0, 1]);
});

test('real muzzle cell 5 emits exactly one fire at 160 ms, even across skipped pose boundaries', () => {
  const animator = createCh02Animator({initialState: 'idle', maxDeltaSeconds: .5});
  assert.equal(animator.request('attack'), true);
  const id = animator.getFrame().attackId;
  assert.deepEqual(animator.update(0), []);
  assert.deepEqual(animator.update(.159).map(event => event.name), ['charge']);
  assert.equal(animator.getFrame().frameIndex, 4);
  assert.equal(animator.request('attack'), false);
  const fire = animator.update(.001);
  assert.deepEqual(fire, [{name: 'fire', state: 'attack', frameIndex: 5, atMs: 160, attackId: id}]);
  assert.equal(animator.getFrame().frameIndex, 5);
  assert.deepEqual(animator.update(.34), []);
  assert.equal(animator.getFrame().state, 'idle');
  assert.deepEqual(animator.update(.5), []);
  animator.request('attack');
  assert.notEqual(animator.getFrame().attackId, id);
  assert.equal(animator.update(.5).filter(event => event.name === 'fire').length, 1);
});

test('damage cancels a prepared attack before emission and never schedules a ghost projectile', () => {
  const animator = createCh02Animator({initialState: 'idle'});
  animator.request('attack');
  const id = animator.getFrame().attackId;
  advance(animator, .15);
  const events = advance(animator, .24, {hp: 1});
  assert.deepEqual(events.map(event => event.name), ['attackCanceled']);
  assert.equal(events[0].attackId, id);
  assert.equal(events[0].fired, false);
  assert.equal(animator.getFrame().state, 'damaged');
  assert.ok([10, 11].includes(animator.getFrame().frameIndex));
  assert.deepEqual(advance(animator, 1), []);
  animator.request('attack');
  assert.equal(advance(animator, .5).filter(event => event.name === 'fire').length, 1);
});

test('damage after emission preserves the consumed attack and terminal destruction removes once', () => {
  const animator = createCh02Animator({initialState: 'idle'});
  animator.request('attack');
  assert.equal(advance(animator, .16).filter(event => event.name === 'fire').length, 1);
  const hit = advance(animator, .24, {hp: 1});
  assert.equal(hit[0].name, 'attackCanceled');
  assert.equal(hit[0].fired, true);
  const death = advance(animator, .539, {hp: 0});
  assert.equal(animator.getFrame().done, false);
  assert.equal(animator.request('idle'), false);
  death.push(...advance(animator, .001, {hp: 3}));
  assert.deepEqual(death.map(event => event.name), ['coreBurst', 'removeVisual']);
  assert.equal(animator.getFrame().frameIndex, 15);
  assert.equal(animator.getFrame().hp, 0);
  assert.equal(animator.getFrame().done, true);
  assert.deepEqual(advance(animator, 2, {hp: 3}), []);
});

test('paused frames freeze damage, clock and pending events, and suspension deltas remain bounded', () => {
  const animator = createCh02Animator({initialState: 'idle'});
  animator.request('attack');
  const before = animator.getFrame();
  assert.deepEqual(animator.update(0, {hp: 0, vx: 100}), []);
  assert.deepEqual(animator.getFrame(), before);
  assert.deepEqual(animator.update(500).map(event => event.name), ['charge']);
  assert.equal(animator.getFrame().frameIndex, 4);
  for (const delta of [NaN, Infinity, -1]) assert.throws(() => animator.update(delta));
  for (const sample of [{hp: NaN}, {vx: Infinity}, {maxHp: 0}]) assert.throws(() => animator.update(.01, sample));
  for (const options of [{hp: NaN}, {maxHp: 0}, {maxDeltaSeconds: 0}, {initialState: 'unknown'}]) {
    assert.throws(() => createCh02Animator(options));
  }
});

test('partitioned update timing reproduces one shot and the same recovery pose', () => {
  const traces = [.01, .025, .05].map(step => {
    const animator = createCh02Animator({initialState: 'idle'});
    animator.request('attack');
    return {events: advance(animator, .5, undefined, step), frame: animator.getFrame()};
  });
  assert.deepEqual(traces[0], traces[1]);
  assert.deepEqual(traces[0], traces[2]);
});
