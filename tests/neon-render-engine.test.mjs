import test from 'node:test';
import assert from 'node:assert/strict';
import { seededRandom, createStarfield, NeonRenderEngine } from '../render/neon-render-engine.mjs';

function fakeCanvas() {
  const ctx = {
    globalAlpha: 1, fillStyle: '',
    fillRect() {}, beginPath() {}, arc() {}, fill() {},
    save() {}, restore() {}, translate() {}, rotate() {}, drawImage() {}
  };
  return { width: 720, height: 1280, getContext(type) { return type === '2d' ? ctx : null; } };
}
test('seeded RNG and starfield are reproducible', () => {
  assert.deepEqual(createStarfield({ seed: 42 }), createStarfield({ seed: 42 }));
  assert.notDeepEqual(createStarfield({ seed: 42 }), createStarfield({ seed: 43 }));
  const rand = seededRandom(42);
  for (let i = 0; i < 100; i++) assert.ok(rand() >= 0 && rand() < 1);
});
test('quality controls bounded particle pools', () => {
  const engine = new NeonRenderEngine(fakeCanvas(), { quality: 'low' });
  for (let i = 0; i < 200; i++) engine.emit({ x: 20, y: 30 });
  assert.equal(engine.particles.length, 70);
  engine.update(1);
  assert.ok(engine.particles.length <= 70);
  engine.setQuality('high');
  assert.equal(engine.stars.length, 140);
});
test('draw methods operate with minimal Canvas 2D context', () => {
  const engine = new NeonRenderEngine(fakeCanvas());
  engine.drawBackground({ speed: 100 });
  engine.emit({ x: 1, y: 2 });
  engine.drawParticles();
  assert.equal(engine.drawSprite({ width: 64, height: 64 }, { x: 10, y: 10, width: 32, height: 32 }), true);
});
test('invalid quality and dimensions rejected', () => {
  const engine = new NeonRenderEngine(fakeCanvas());
  assert.throws(() => engine.setQuality('ultra'), RangeError);
  assert.throws(() => engine.resize(0, 10), RangeError);
});
