import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {getChronosDestructionPose} from '../src/game/animation/chronos-destruction.js';

const source = await readFile(new URL('../src/game/06-world-rendering.js', import.meta.url), 'utf8');

// Execute the actual legacy scenery functions with a recording Canvas. These
// tests check drawing contracts and finite budgets, not aesthetic acceptance.
function harness(overrides = {}, quality = 'high') {
  const calls = [], stack = [];
  const state = {globalAlpha: 1, globalCompositeOperation: 'source-over'};
  const ctx = new Proxy({}, {
    get(_target, key) {
      if (key in state) return state[key];
      if (key === 'save') return () => stack.push({...state});
      if (key === 'restore') return () => {
        const previous = stack.pop();
        for (const name of Object.keys(state)) delete state[name];
        Object.assign(state, previous);
      };
      if (key === 'createLinearGradient' || key === 'createRadialGradient') {
        return () => ({addColorStop() {}});
      }
      return (...args) => calls.push({method: key, args, alpha: state.globalAlpha,
        composite: state.globalCompositeOperation});
    },
    set(_target, key, value) { state[key] = value; return true; }
  });
  const image = (name, width, height) => ({name, naturalWidth: width, naturalHeight: height});
  const SPRITES = {
    flightSpace: image('space', 1024, 1536), flightKit: image('kit', 1536, 1024),
    chronosDestruction: image('destruction', 1536, 1024),
    satellite: image('satellite', 288, 288),
    debrisPanel: image('panel', 128, 128), debrisMetal: image('metal', 128, 128)
  };
  const view = {
    elapsed: 140, minDuration: 360, cinematicDuration: 90,
    routeProgress: .55, stageNumber: 6,
    deepSpace: {travel: .55, offsetX: -.05, offsetY: .29, speed: .8,
      nebulaOpacity: .025, starDensity: .65, dustDensity: 0},
    station: {visible: false, x: -.2, y: 1.2, scale: .05},
    planet: {visible: true, x: .79, y: .06, scale: .014, alpha: 1},
    debris: {visible: true, directionX: -.28, directionY: .96},
    beacon: {visible: false}, attacker: {visible: false},
    relay: {visible: false, x: .68, y: .25, scale: .18, active: false},
    ...overrides
  };
  const sandbox = vm.createContext({ctx, W: 390, H: 844, classicFlightView: view,
    SPRITES, settings: {effectsQuality: quality}, NeonCampaign: {getChronosDestructionPose},
    spriteReady: candidate => Boolean(candidate?.naturalWidth), ensureSprite() {},
    clamp: (n, a, b) => Math.max(a, Math.min(b, n))});
  vm.runInContext(source, sandbox);
  const draw = () => { calls.length = 0; sandbox.drawChronosFlightBackground(); return structuredClone(calls); };
  return {sandbox, view, SPRITES, draw};
}

const images = calls => calls.filter(call => call.method === 'drawImage');
const stars = calls => calls.filter(call => call.method === 'fillRect' && call.composite === 'screen');

test('the empty transit composes one distant plate and a separate tiny, opaque Gaia', () => {
  const h = harness(), before = structuredClone(h.view), calls = images(h.draw());
  const plate = calls.filter(call => call.args[0].name === 'space');
  assert.equal(plate.length, 1);
  assert.equal(plate[0].alpha, .025);
  const planet = calls.filter(call => call.args[0].name === 'kit');
  assert.equal(planet.length, 1);
  assert.equal(planet[0].args[1], 1024, 'Gaia uses its own atlas cell');
  assert.equal(planet[0].args[7], 390 * .014);
  assert.equal(planet[0].alpha, 1);
  assert.equal(calls.some(call => call.args[0].name === 'destruction'), false);
  assert.deepEqual(h.view, before, 'rendering cannot advance or modify the route');
});

test('star and ambient-dust density are bounded at both effects qualities', () => {
  for (const [quality, starLimit, dustLimit] of [['high', 30, 6], ['low', 16, 3]]) {
    const h = harness({}, quality);
    h.view.deepSpace.starDensity = 100;
    h.view.deepSpace.dustDensity = 100;
    h.view.deepSpace.nebulaOpacity = 100;
    const calls = h.draw();
    assert.equal(stars(calls).length, starLimit);
    assert.equal(images(calls).filter(call => ['panel', 'metal'].includes(call.args[0].name)).length, dustLimit);
    assert.equal(images(calls).find(call => call.args[0].name === 'space').alpha, 1);
    for (const star of stars(calls)) {
      for (const value of star.args) assert.ok(Number.isFinite(value));
      assert.ok(star.args[2] < 2 && star.args[3] < 3, 'stars remain discreet secondary marks');
    }
    h.view.deepSpace.starDensity = 0;
    h.view.deepSpace.dustDensity = 0;
    assert.equal(stars(h.draw()).length, 0);
    assert.equal(images(h.draw()).filter(call => ['panel', 'metal'].includes(call.args[0].name)).length, 0);
  }
});

test('middle stages remain sparse without optional density fields and old flights retain their scenery', () => {
  const h = harness();
  delete h.view.deepSpace.dustDensity;
  for (const stageNumber of [5, 6, 7]) {
    h.view.stageNumber = stageNumber;
    assert.equal(images(h.draw()).filter(call => ['panel', 'metal'].includes(call.args[0].name)).length, 1);
  }
  delete h.view.stageNumber;
  assert.equal(images(h.draw()).filter(call => ['panel', 'metal'].includes(call.args[0].name)).length, 6);
});

test('paused snapshots freeze every parallax layer and the relay without acquiring a render clock', () => {
  const h = harness(); h.view.relay.visible = true;
  const first = h.draw();
  for (let index = 0; index < 10; index++) assert.deepEqual(h.draw(), first);
  h.view.elapsed += 1;
  const next = h.draw();
  assert.notDeepEqual(stars(next), stars(first));
  assert.notDeepEqual(next.filter(call => call.method === 'rotate'), first.filter(call => call.method === 'rotate'));
});

test('C9 uses the existing illustrated satellite with an active-only service label', () => {
  const h = harness(); h.view.relay.visible = true;
  let calls = h.draw();
  assert.equal(images(calls).filter(call => call.args[0].name === 'satellite').length, 1);
  assert.equal(calls.some(call => call.method === 'fillText'), false);
  h.view.relay.active = true;
  calls = h.draw();
  assert.deepEqual(calls.find(call => call.method === 'fillText').args, ['SERVICIO C9', 390 * .68, 844 * .25 + 390 * .18 * .62]);
  const relay = images(calls).find(call => call.args[0].name === 'satellite');
  assert.equal(relay.args[3], 390 * .18);
  assert.equal(relay.alpha, 1);
});

test('a failed space plate still renders the independent stars and planet', () => {
  const h = harness(); h.SPRITES.flightSpace.naturalWidth = 0;
  const calls = h.draw();
  assert.equal(images(calls).some(call => call.args[0].name === 'space'), false);
  assert.equal(images(calls).some(call => call.args[0].name === 'kit'), true);
  assert.ok(stars(calls).length > 0);
});
