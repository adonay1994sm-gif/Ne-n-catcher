import test from 'node:test';
import assert from 'node:assert/strict';
import { animationFrame, SpriteAnimator, DEFAULT_ANIMATIONS } from '../render/sprite-animator.mjs';

test('animation frames are deterministic and loop correctly', () => {
  const animation = { frames: [2, 4, 6], fps: 10, loop: true };
  assert.equal(animationFrame(animation, 0), 2);
  assert.equal(animationFrame(animation, 0.1), 4);
  assert.equal(animationFrame(animation, 0.3), 2);
});
test('non-looping animation holds last frame', () => {
  assert.equal(animationFrame({ frames: [1, 3], fps: 10, loop: false }, 20), 3);
});
test('animator preserves playback when same state repeats', () => {
  const animator = new SpriteAnimator();
  animator.update(0.05);
  animator.play('ship_idle');
  animator.update(0.05);
  assert.equal(animator.frame, DEFAULT_ANIMATIONS.ship_idle.frames[0]);
  animator.play('ship_boost');
  assert.equal(animator.frame, 6);
  animator.play('ship_idle');
  assert.equal(animator.elapsed, 0);
});
test('invalid animation is rejected', () => {
  assert.throws(() => animationFrame({ frames: [], fps: 0 }, 0), TypeError);
});
