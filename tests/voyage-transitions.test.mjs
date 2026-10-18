import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {CHRONOS_VOYAGE_STAGES, CHRONOS_VOYAGE_VERSION, createChronosFlight} from '../src/game/progression/chronos-flight.js';
import {getVoyageTransitionPresentation, VOYAGE_CROSSING_SECONDS} from '../src/game/presentation/voyage-transitions.js';

const source = await readFile(new URL('../src/game/06-world-rendering.js', import.meta.url), 'utf8');
const stageView = (number, seconds) => {
  const stage = CHRONOS_VOYAGE_STAGES[number - 1];
  return Object.freeze({version: CHRONOS_VOYAGE_VERSION, stageNumber: number,
    stageElapsed: seconds, stageDuration: stage.duration, elapsed: stage.offset + seconds,
    routeProgress: (stage.offset + seconds) / 360,
    deepSpace: Object.freeze({nebulaOpacity: stage.nebulaOpacity, starDensity: stage.starDensity})});
};

test('all nine stage boundaries share a continuous, route-timed crossing and ambient state', () => {
  for (let number = 1; number < 10; number++) {
    const previous = getVoyageTransitionPresentation(stageView(number, CHRONOS_VOYAGE_STAGES[number - 1].duration));
    const next = getVoyageTransitionPresentation(stageView(number + 1, 0));
    assert.equal(previous.active, true); assert.equal(next.active, true);
    assert.equal(previous.boundary, number); assert.equal(next.boundary, number);
    assert.equal(previous.progress, .5); assert.equal(next.progress, .5);
    assert.deepEqual(next.cue, previous.cue);
    assert.deepEqual(next.environment, previous.environment);
    const settled = getVoyageTransitionPresentation(stageView(number + 1, VOYAGE_CROSSING_SECONDS));
    assert.equal(settled.active, false);
    assert.equal(settled.environment.nebulaOpacity, CHRONOS_VOYAGE_STAGES[number].nebulaOpacity);
    assert.equal(settled.environment.starDensity, CHRONOS_VOYAGE_STAGES[number].starDensity);
  }
});

test('brief crossing windows do not create an introduction, fake completion or repeat mid-stage', () => {
  const intro = getVoyageTransitionPresentation(stageView(1, 0));
  assert.equal(intro.active, false); assert.equal(intro.cue, null);
  for (let number = 1; number <= 10; number++) {
    const view = stageView(number, 10), before = structuredClone(view);
    const model = getVoyageTransitionPresentation(view);
    assert.equal(model.active, false); assert.equal(model.cue, null);
    assert.deepEqual(view, before);
  }
  assert.equal(getVoyageTransitionPresentation(stageView(10, 36)).active, false);
});

test('an illustrated waypoint approaches, grows and leaves the corridor without an opacity dissolve', () => {
  const stage = CHRONOS_VOYAGE_STAGES[0];
  const near = getVoyageTransitionPresentation(stageView(1, stage.duration - 1.5)).cue;
  const middle = getVoyageTransitionPresentation(stageView(2, 0)).cue;
  const past = getVoyageTransitionPresentation(stageView(2, 1.59)).cue;
  assert.equal(near.kind, 'chronos-remnant'); assert.equal(past.kind, near.kind);
  assert.ok(near.scale < middle.scale && middle.scale < past.scale);
  assert.ok(near.y < middle.y && middle.y < past.y);
  assert.ok(past.x - past.scale / 2 > 1, 'the illustrated object exits past the side');
  assert.ok(past.y > 1, 'it passes the foreground rather than fading in place');
  for (const cue of [near, middle, past]) {
    assert.equal('alpha' in cue, false);
    assert.ok(Math.abs(cue.x - .5) >= .19, 'keep the central firing lane clear');
  }
  assert.equal(getVoyageTransitionPresentation(stageView(8, 0)).cue.kind, 'navigation-beacon');
});

test('C9 remains the actual service landmark instead of getting a copied second station', () => {
  for (const [number, seconds] of [[5,38], [6,0], [6,32], [7,0]]) {
    const state = getVoyageTransitionPresentation(stageView(number, seconds));
    assert.equal(state.active, true);
    assert.equal(state.cue, null);
  }
});

test('comfort mode removes brief foreground acceleration but keeps continuous route geography', () => {
  const view = stageView(9, .8), normal = getVoyageTransitionPresentation(view);
  const reduced = getVoyageTransitionPresentation(view, {reducedEffects: true});
  assert.ok(normal.cue); assert.ok(normal.starStretch > 0);
  assert.equal(reduced.cue, null); assert.equal(reduced.starStretch, 0);
  assert.equal(reduced.progress, normal.progress);
  assert.deepEqual(reduced.environment, normal.environment);
});

test('paused/quota-blocked snapshots are immutable and repeat exactly without a presentation clock', () => {
  const view = stageView(2, 36), before = structuredClone(view);
  const state = getVoyageTransitionPresentation(view);
  assert.ok(Object.isFrozen(state)); assert.ok(Object.isFrozen(state.cue));
  for (let count = 0; count < 20; count++) assert.deepEqual(getVoyageTransitionPresentation(view), state);
  assert.deepEqual(view, before);
  assert.doesNotMatch(awaitSource(), /requestAnimationFrame|setTimeout|setInterval|performance\.now|Date\.now/);
});

// Read once above for the actual legacy renderer. Presentation module validation
// below checks the exported behavior, including preservation of the older route.
function awaitSource() {
  const start = source.indexOf('function drawChronosRouteCrossing(');
  const end = source.indexOf('function drawVulkarOrbitBackground(', start);
  return source.slice(start, end);
}

test('historical flights and invalid timing data cannot acquire new scenery or overwrite their models', () => {
  const old = createChronosFlight().snapshot();
  assert.equal(getVoyageTransitionPresentation(old), null);
  for (const value of [null, {}, {...stageView(2, 0), stageNumber: 0}, {...stageView(2, 0), stageElapsed: NaN},
    {...stageView(2, 0), stageDuration: 0}, {...stageView(2, 0), stageNumber: 11}]) {
    assert.equal(getVoyageTransitionPresentation(value), null);
  }
});

function recordingRenderer(width, height, bounds) {
  const calls = [], stack = [], state = {alpha: 1, x: 0, y: 0};
  const ctx = new Proxy({}, {
    get(_target, key) {
      if (key === 'save') return () => stack.push({...state});
      if (key === 'restore') return () => Object.assign(state, stack.pop());
      if (key === 'translate') return (x,y) => {state.x += x; state.y += y;};
      if (key === 'createLinearGradient') return () => ({addColorStop() {}});
      return (...args) => calls.push({method: key, args, ...state});
    },
    set(_target, key, value) {if (key === 'globalAlpha') state.alpha = value; return true;}
  });
  const image = name => ({name, naturalWidth: 128, naturalHeight: 128});
  const SPRITES = {debrisPanel: image('panel'), debrisMetal: image('metal'), satellite: image('satellite'),
    flightSpace: {...image('space'), naturalWidth: 1024, naturalHeight: 1536},
    flightKit: {...image('kit'), naturalWidth: 1536, naturalHeight: 1024}};
  const sandbox = vm.createContext({ctx, W: width, H: height, classicFlightBounds: bounds,
    SPRITES, spriteReady: value => Boolean(value?.naturalWidth),
    elapsed: 10, collected: 0, level: () => ({goal: 45}), settings: {effectsQuality: 'high'},
    clamp: (value,min,max) => Math.max(min, Math.min(max,value))});
  vm.runInContext(source, sandbox);
  return {calls, SPRITES, sandbox,
    draw: state => {calls.length = 0; sandbox.drawChronosRouteCrossing(state); return structuredClone(calls);},
    drawGaia: () => {calls.length = 0; const ready = sandbox.drawGaiaOrbitBackground(); return {ready,calls:structuredClone(calls)};}};
}

test('the real legacy renderer uses an illustrated peripheral object clipped clear of HUD and controls', () => {
  for (const [width,height,top,bottom] of [[390,844,122,730], [320,568,122,460], [844,390,90,310]]) {
    const bounds = Object.freeze({presentationTop: top, presentationBottom: bottom});
    const renderer = recordingRenderer(width,height,bounds);
    const transition = getVoyageTransitionPresentation(stageView(8, 0));
    const calls = renderer.draw(transition), drawn = calls.find(call => call.method === 'drawImage');
    assert.equal(drawn.args[0].name, 'satellite');
    assert.ok(drawn.args[3] <= (bottom - top) * .28);
    assert.equal(drawn.alpha, .74);
    assert.deepEqual(calls.find(call => call.method === 'rect').args, [0,top,width,bottom-top]);
    assert.ok(calls.findIndex(call => call.method === 'clip') < calls.findIndex(call => call.method === 'drawImage'));
    assert.ok(Math.abs(drawn.x - width*.5) > width * .19);
    assert.deepEqual(renderer.draw(transition), calls);
    assert.deepEqual(bounds, {presentationTop: top, presentationBottom: bottom});
  }
});

test('the crossing has no geometric substitute if its illustration is unavailable', () => {
  const renderer = recordingRenderer(390,844,{presentationTop: 122,presentationBottom: 730});
  renderer.SPRITES.satellite.naturalWidth = 0;
  assert.deepEqual(renderer.draw(getVoyageTransitionPresentation(stageView(8,0))), []);
  assert.deepEqual(renderer.draw(getVoyageTransitionPresentation(stageView(8,0),{reducedEffects:true})), []);
});

test('Gaia orbital scenery separates illustrated space, growing planet and relays below measured HUD', () => {
  for (const [width,height,top,bottom] of [[390,844,122,730], [320,568,122,460], [844,390,90,310]]) {
    const renderer = recordingRenderer(width,height,{presentationTop:top,presentationBottom:bottom});
    let previous = 0;
    for (const collected of [0,20,45]) {
      renderer.sandbox.collected = collected;
      const {ready,calls} = renderer.drawGaia();
      assert.equal(ready,true);
      const drawn = calls.filter(call => call.method === 'drawImage');
      assert.equal(drawn.filter(call => call.args[0].name === 'space').length,1);
      const planet = drawn.find(call => call.args[0].name === 'kit');
      assert.equal(planet.args[1],1024,'use the distinct Gaia illustration atlas cell');
      assert.equal(planet.alpha,1,'the planet remains solid rather than dissolving into a scene');
      assert.ok(planet.y - planet.args[7] / 2 > top);
      assert.ok(planet.y + planet.args[7] / 2 < bottom);
      assert.ok(planet.args[7] >= previous); previous = planet.args[7];
      assert.equal(drawn.filter(call => call.args[0].name === 'satellite').length,2);
      assert.deepEqual(renderer.drawGaia().calls,calls,'paused played-time snapshots freeze every layer');
    }
    renderer.sandbox.elapsed += 1;
    const later = renderer.drawGaia().calls;
    assert.ok(later.some(call => call.method === 'drawImage'));
  }
});

test('Gaia keeps its existing painting fallback until both independent illustrations are ready', () => {
  const renderer = recordingRenderer(390,844,{presentationTop:122,presentationBottom:730});
  for (const name of ['flightSpace','flightKit']) {
    const previous = renderer.SPRITES[name].naturalWidth;
    renderer.SPRITES[name].naturalWidth = 0;
    assert.deepEqual(renderer.drawGaia(),{ready:false,calls:[]});
    renderer.SPRITES[name].naturalWidth = previous;
  }
  assert.match(source,/currentLevel===1 && drawGaiaOrbitBackground\(\)/);
  assert.match(source,/!N7_CAMPAIGN && currentLevel === 1 && spriteReady\(SPRITES\.atlasBackground\)/);
});
