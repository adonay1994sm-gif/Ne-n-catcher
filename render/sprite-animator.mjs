/* NEON Render Engine — deterministic frame sequencing and art direction hooks.
 * Pure logic; integration with game.js is deliberately opt-in.
 */
export const DEFAULT_ANIMATIONS = Object.freeze({
  ship_idle: Object.freeze({ frames: [0, 1, 2, 3], fps: 8, loop: true }),
  ship_bank_left: Object.freeze({ frames: [4], fps: 1, loop: false }),
  ship_bank_right: Object.freeze({ frames: [5], fps: 1, loop: false }),
  ship_boost: Object.freeze({ frames: [6], fps: 1, loop: false }),
  ship_damaged: Object.freeze({ frames: [7], fps: 1, loop: false }),
  cronium_pulse: Object.freeze({ frames: [0, 1, 2, 3, 4, 5], fps: 12, loop: true })
});
export function validateAnimation(animation) {
  if (!animation || !Array.isArray(animation.frames) || !animation.frames.length ||
      !animation.frames.every(frame => Number.isInteger(frame) && frame >= 0) ||
      !Number.isFinite(animation.fps) || animation.fps <= 0) {
    throw new TypeError('Invalid animation definition');
  }
  return animation;
}
export function animationFrame(animation, elapsedSeconds) {
  validateAnimation(animation);
  const elapsed = Math.max(0, Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0);
  const index = Math.floor(elapsed * animation.fps);
  const position = animation.loop === false
    ? Math.min(index, animation.frames.length - 1)
    : index % animation.frames.length;
  return animation.frames[position];
}
export class SpriteAnimator {
  constructor(animations = DEFAULT_ANIMATIONS, initial = 'ship_idle') {
    this.animations = animations;
    this.elapsed = 0;
    this.play(initial);
  }
  play(name, { restart = false } = {}) {
    const next = validateAnimation(this.animations[name]);
    if (this.name !== name || restart) this.elapsed = 0;
    this.name = name;
    this.definition = next;
    return this;
  }
  update(dt) {
    if (Number.isFinite(dt) && dt > 0) this.elapsed += Math.min(dt, 0.05);
    return this.frame;
  }
  get frame() { return animationFrame(this.definition, this.elapsed); }
}
