import test from 'node:test';
import assert from 'node:assert/strict';
import { Camera2D } from '../src/engine/Camera2D.js';
import { SceneCompositor } from '../src/engine/SceneCompositor.js';
import { Renderer } from '../src/engine/Renderer.js';
import { EngineCore } from '../src/engine/EngineCore.js';

const viewport = { width: 720, height: 1280 };
const image = (width = 100, height = 100) => ({ width, height, complete: true });
function context() {
  const calls = [], stack = [];
  const ctx = {
    calls, globalAlpha: 1,
    save() { stack.push(this.globalAlpha); calls.push(['save']); },
    restore() { this.globalAlpha = stack.pop(); calls.push(['restore']); },
    translate(...args) { calls.push(['translate', ...args]); },
    rotate(...args) { calls.push(['rotate', ...args]); },
    setTransform(...args) { calls.push(['transform', ...args]); },
    clearRect() {},
    drawImage(...args) { calls.push(['image', ...args, this.globalAlpha]); },
    fillRect() {}
  };
  return { ctx, calls, stack };
}

test('01 camera world/screen round trip with zoom and parallax', () => {
  const camera = new Camera2D({ x: 120, y: -50, zoom: 1.5 });
  for (const p of [0, 0.25, 1, 1.8]) {
    const screen = camera.worldToScreen(300, 400, viewport, p);
    const world = camera.screenToWorld(screen.x, screen.y, viewport, p);
    assert.ok(Math.abs(world.x - 300) < 1e-9);
    assert.ok(Math.abs(world.y - 400) < 1e-9);
  }
});
test('02 parallax planes travel at different apparent speeds', () => {
  const camera = new Camera2D({ x: 100 });
  assert.equal(camera.worldToScreen(0, 0, viewport, 1).x, 260);
  assert.equal(camera.worldToScreen(0, 0, viewport, 0.2).x, 340);
});
test('03 follow is paused at dt=0 and stable across frame splits', () => {
  const a = new Camera2D(), b = new Camera2D();
  a.follow(100, 0, 0); assert.equal(a.x, 0);
  a.follow(100, 0, 0.1); b.follow(100, 0, 0.05).follow(100, 0, 0.05);
  assert.ok(Math.abs(a.x - b.x) < 1e-10);
});
test('04 camera validates viewport and zoom', () => {
  assert.throws(() => new Camera2D({ zoom: 0 }), RangeError);
  assert.throws(() => new Camera2D({ minZoom: 3, maxZoom: 1 }), RangeError);
  assert.throws(() => new Camera2D().worldToScreen(0, 0, { width: 0, height: 1 }), RangeError);
  assert.equal(new Camera2D({ zoom: 8 }).zoom, 4);
});
test('05 layer order is stable and independent of source array', () => {
  const layers = [{ id: 'front', z: 2, image: image() }, { id: 'first', z: 1, image: image() }, { id: 'second', z: 1, image: image() }];
  const compositor = new SceneCompositor({ layers });
  assert.deepEqual(compositor.layers.map(layer => layer.id), ['first', 'second', 'front']);
  assert.equal(layers[0].id, 'front');
});
test('06 compositor uses real image draw calls, never substitute geometry', () => {
  const f = context();
  const compositor = new SceneCompositor({ layers: [{ id: 'ship', image: image(), width: 180, height: 220 }] });
  assert.deepEqual(compositor.render(f.ctx, viewport), { drawn: 1, skipped: 0, culled: 0 });
  assert.equal(f.calls.filter(c => c[0] === 'image').length, 1);
  assert.equal(f.stack.length, 0);
});
test('07 cover scales to fill viewport and clamps camera offset to overscan', () => {
  const f = context();
  const compositor = new SceneCompositor({ camera: new Camera2D({ x: 10000 }), layers: [
    { id: 'background', mode: 'cover', image: image(100, 100), parallax: 0.5 }
  ] });
  compositor.render(f.ctx, viewport);
  const translate = f.calls.find(c => c[0] === 'translate');
  assert.deepEqual(translate, ['translate', 80, 640]); // 1280px cover, 280px horizontal overscan
  const draw = f.calls.find(c => c[0] === 'image');
  assert.equal(draw[4], 1280);
  assert.equal(draw[5], 1280);
});
test('08 sprite atlas crop is used without changing logical bounds', () => {
  const f = context();
  new SceneCompositor({ layers: [{ id: 'atlas', image: image(1536, 1024), width: 160, height: 160,
    source: { x: 512, y: 0, width: 512, height: 512 } }] }).render(f.ctx, viewport);
  const draw = f.calls.find(c => c[0] === 'image');
  assert.deepEqual(draw.slice(2, 6), [512, 0, 512, 512]);
  assert.equal(draw[8], 160);
});
test('09 offscreen sprites are culled, not merely hidden under effects', () => {
  const f = context();
  const compositor = new SceneCompositor({ layers: [
    { id: 'far', image: image(), x: 10000, y: 10000 },
    { id: 'near', image: image(), x: 0, y: 0 }
  ] });
  assert.deepEqual(compositor.render(f.ctx, viewport), { drawn: 1, skipped: 0, culled: 1 });
});
test('10 unloaded images and invisible layers are skipped without placeholders', () => {
  const f = context();
  const compositor = new SceneCompositor({ layers: [
    { id: 'unloaded', image: { width: 100, height: 100, complete: false } },
    { id: 'missing', image: null },
    { id: 'hidden', image: image(), visible: false }
  ] });
  assert.deepEqual(compositor.render(f.ctx, viewport), { drawn: 0, skipped: 3, culled: 0 });
  assert.equal(f.calls.some(c => c[0] === 'image'), false);
});
test('11 opacity and canvas save/restore are balanced per sprite', () => {
  const f = context();
  const compositor = new SceneCompositor({ layers: [
    { id: 'fade', image: image(), opacity: 0.35, rotation: 0.1 },
    { id: 'opaque', image: image() }
  ] });
  compositor.render(f.ctx, viewport);
  assert.deepEqual(f.calls.filter(c => c[0] === 'image').map(c => c.at(-1)), [0.35, 1]);
  assert.equal(f.ctx.globalAlpha, 1);
  assert.equal(f.stack.length, 0);
});
test('12 failed drawing still restores canvas state', () => {
  const f = context();
  f.ctx.drawImage = () => { throw new Error('context lost'); };
  const compositor = new SceneCompositor({ layers: [{ id: 'ship', image: image() }] });
  assert.throws(() => compositor.render(f.ctx, viewport), /context lost/);
  assert.equal(f.stack.length, 0);
});
test('13 updateLayer preserves other layers and validates geometry', () => {
  const compositor = new SceneCompositor({ layers: [
    { id: 'a', image: image(), z: 0 }, { id: 'b', image: image(), z: 1 }
  ] });
  assert.equal(compositor.updateLayer('a', { z: 2, x: 50 }), true);
  assert.deepEqual(compositor.layers.map(layer => layer.id), ['b', 'a']);
  assert.equal(compositor.layers[1].x, 50);
  assert.equal(compositor.updateLayer('missing', { x: 3 }), false);
  assert.throws(() => compositor.updateLayer('a', { opacity: 2 }), RangeError);
  assert.equal(compositor.layers[1].x, 50);
});
test('14 rejects duplicate IDs and invalid atlas regions', () => {
  assert.throws(() => new SceneCompositor({ layers: [
    { id: 'a' }, { id: 'a' }
  ] }), /Duplicate/);
  assert.throws(() => new SceneCompositor({ layers: [
    { id: 'bad', source: { x: -1, y: 0, width: 20, height: 20 } }
  ] }), RangeError);
  const f = context();
  const compositor = new SceneCompositor({ layers: [
    { id: 'out-of-atlas', image: image(100, 100), source: { x: 90, y: 0, width: 20, height: 20 } }
  ] });
  assert.equal(compositor.render(f.ctx, viewport).skipped, 1);
});
test('15 HUD screen-space transform does not inherit camera shake', () => {
  const f = context();
  const canvas = { width: 0, height: 0, getContext: () => f.ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 360, height: 640 }) };
  const renderer = new Renderer(canvas, { dprProvider: () => 2 });
  renderer.shakeScreen(8, 1);
  renderer.beginFrame();
  const before = f.calls.length;
  renderer.withScreenSpace(ctx => ctx.drawImage(image(), 0, 0, 10, 10));
  renderer.endFrame();
  assert.deepEqual(f.calls.slice(before).find(c => c[0] === 'transform'), ['transform', 2, 0, 0, 2, 0, 0]);
  assert.equal(f.stack.length, 0);
});
test('16 HUD callback exceptions restore transforms and alpha', () => {
  const f = context();
  const canvas = { width: 0, height: 0, getContext: () => f.ctx,
    getBoundingClientRect: () => ({ width: 360, height: 640 }) };
  const renderer = new Renderer(canvas, { dprProvider: () => 2 });
  renderer.beginFrame();
  assert.throws(() => renderer.withScreenSpace(() => { throw Error('hud fault'); }), /hud fault/);
  renderer.endFrame();
  assert.equal(f.stack.length, 0);
});
test('17 compositor integrates with EngineCore without creating another RAF', () => {
  const f = context();
  const canvas = { width: 0, height: 0, getContext: () => f.ctx,
    getBoundingClientRect: () => ({ width: 360, height: 640 }) };
  const frames = new Map(); let next = 0;
  const compositor = new SceneCompositor({ layers: [{ id: 'chronos', image: image() }] });
  const engine = new EngineCore({ canvas,
    requestFrame: cb => { frames.set(++next, cb); return next; },
    cancelFrame: id => frames.delete(id),
    drawScene: (ctx, renderer) => {
      compositor.render(ctx, renderer);
      renderer.withScreenSpace(hud => hud.drawImage(image(), 10, 10, 30, 30));
    }
  });
  assert.equal(engine.start(), true);
  assert.equal(frames.size, 1);
  const [id, callback] = [...frames][0]; frames.delete(id); callback(100);
  assert.equal(frames.size, 1);
  assert.equal(f.calls.filter(c => c[0] === 'image').length, 2);
  engine.stop();
  assert.equal(frames.size, 0);
});
test('18 cover cannot expose empty borders by shrinking its image', () => {
  const f = context();
  new SceneCompositor({ layers: [{ id: 'space', image: image(100, 100), mode: 'cover', scale: 0.1 }] })
    .render(f.ctx, viewport);
  const draw = f.calls.find(c => c[0] === 'image');
  assert.ok(draw[4] >= viewport.width && draw[5] >= viewport.height);
});
test('19 camera motion produces different displacement for foreground and background', () => {
  const f = context();
  const camera = new Camera2D();
  const compositor = new SceneCompositor({ camera, layers: [
    { id: 'planet', image: image(), parallax: 0.2, z: 0 },
    { id: 'ship', image: image(), parallax: 1, z: 1 }
  ] });
  compositor.render(f.ctx, viewport);
  const before = f.calls.filter(c => c[0] === 'translate').map(c => c[1]);
  f.calls.length = 0;
  camera.setPosition(100, 0);
  compositor.render(f.ctx, viewport);
  const after = f.calls.filter(c => c[0] === 'translate').map(c => c[1]);
  assert.deepEqual(after.map((x, i) => x - before[i]), [-20, -100]);
});
test('20 HUD resets alpha for readable text and restores world alpha afterwards', () => {
  const f = context();
  const canvas = { width: 0, height: 0, getContext: () => f.ctx,
    getBoundingClientRect: () => ({ width: 360, height: 640 }) };
  const renderer = new Renderer(canvas, { dprProvider: () => 2 });
  renderer.beginFrame();
  f.ctx.globalAlpha = 0.3;
  let hudAlpha;
  renderer.withScreenSpace(ctx => { hudAlpha = ctx.globalAlpha; });
  assert.equal(hudAlpha, 1);
  assert.equal(f.ctx.globalAlpha, 0.3);
  renderer.endFrame();
  assert.equal(f.stack.length, 0);
});
