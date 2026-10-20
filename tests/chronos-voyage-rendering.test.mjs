import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {getChronosDestructionPose} from '../src/game/animation/chronos-destruction.js';
import {createChronosVoyage,createChronosVoyageCheckpoint} from '../src/game/progression/chronos-flight.js';

const source = await readFile(new URL('../src/game/06-world-rendering.js', import.meta.url), 'utf8');

// Execute the actual legacy scenery functions with a recording Canvas. These
// tests check drawing contracts and finite budgets, not aesthetic acceptance.
function harness(overrides = {}, quality = 'high', geometry = {}) {
  const calls = [], stack = [];
  const state = {globalAlpha: 1, globalCompositeOperation: 'source-over', x: 0, y: 0};
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
      if (key === 'translate') return (x, y) => {
        state.x += x; state.y += y;
        calls.push({method: key, args: [x, y], alpha: state.globalAlpha,
          composite: state.globalCompositeOperation, x: state.x, y: state.y});
      };
      return (...args) => calls.push({method: key, args, alpha: state.globalAlpha,
        composite: state.globalCompositeOperation, x: state.x, y: state.y,
        fillStyle: typeof state.fillStyle === 'string' ? state.fillStyle : null});
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
    classicFlightBounds: null, ...geometry,
    SPRITES, settings: {effectsQuality: quality}, NeonCampaign: {getChronosDestructionPose},
    spriteReady: candidate => Boolean(candidate?.naturalWidth), ensureSprite() {},
    clamp: (n, a, b) => Math.max(a, Math.min(b, n))});
  vm.runInContext(source, sandbox);
  const draw = () => { calls.length = 0; sandbox.drawChronosFlightBackground(); return structuredClone(calls); };
  return {sandbox, view, SPRITES, draw, recording: () => structuredClone(calls)};
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

test('C9 preserves its illustrated download-failure fallback and active-only service label', () => {
  const h = harness(); h.view.relay.visible = true;
  let calls = h.draw();
  assert.equal(images(calls).filter(call => call.args[0].name === 'satellite').length, 1);
  assert.equal(calls.some(call => call.method === 'fillText'), false);
  h.view.relay.active = true;
  calls = h.draw();
  const label = calls.find(call => call.method === 'fillText').args;
  assert.equal(label[0], 'SERVICIO C9'); assert.equal(label[1], 390 * .68);
  const relay = images(calls).find(call => call.args[0].name === 'satellite');
  assert.ok(label[2] > relay.y + relay.args[3] * .5);
  assert.ok(label[2] < 844);
  assert.equal(relay.args[3], 390 * .18);
  assert.equal(relay.alpha, 1);
});

test('Gaia grows below the measured HUD without changing its route coordinates or hitboxes', () => {
  for (const [width, height, top, bottom] of [[720,1280,200,1100], [390,844,130,730],
    [320,568,145,460], [844,390,100,310]]) {
    const bounds = Object.freeze({presentationTop: top, presentationBottom: bottom,
      minX: 119, maxX: width - 119, minY: top + 158, maxY: bottom - 104});
    const h = harness({}, 'high', {W: width, H: height, classicFlightBounds: bounds});
    const before = structuredClone(h.view);
    let previousSize = 0;
    for (const scale of [.014, .05, .2, .4, .724]) {
      h.view.planet.scale = scale;
      const draw = images(h.draw()).find(call => call.args[0].name === 'kit');
      const size = draw.args[7];
      assert.ok(draw.y - size / 2 > top, `planet above HUD at ${width}x${height}`);
      assert.ok(draw.y + size / 2 < bottom, `planet above controls at ${width}x${height}`);
      assert.equal(draw.x, width * h.view.planet.x);
      assert.ok(size >= previousSize, 'approach cannot visually retreat');
      assert.equal(draw.alpha, 1); previousSize = size;
      assert.equal(h.view.planet.scale, scale, 'cosmetic fitting cannot mutate the model');
    }
    h.view.planet.scale = before.planet.scale;
    assert.deepEqual(h.view, before);
    assert.deepEqual(h.sandbox.classicFlightBounds, bounds, 'flight bounds are read-only');
  }
});

test('the independent C9 atlas shows four real route/service states from a shared centre pivot', () => {
  const h = harness({}, 'high', {classicFlightBounds: {presentationTop: 150, presentationBottom: 740}});
  h.SPRITES.c9Station = {name: 'c9', naturalWidth: 1024, naturalHeight: 1024};
  h.view.relay.visible = true;
  const before = structuredClone(h.view);
  for (const [stageNumber, active, x, y] of [[5,false,0,0], [6,false,512,0],
    [6,true,0,512], [7,false,512,512]]) {
    h.view.stageNumber = stageNumber; h.view.relay.active = active;
    const calls = h.draw(), station = images(calls).find(call => call.args[0].name === 'c9');
    assert.deepEqual(station.args.slice(1,5), [x,y,512,512]);
    assert.equal(station.args[5] + station.args[7] / 2, 0);
    assert.equal(station.args[6] + station.args[8] / 2, 0);
    assert.ok(station.y - station.args[8] / 2 > 150);
    assert.ok(station.x - station.args[7] * .55 >= 0);
    assert.ok(station.x + station.args[7] * .55 <= 390);
    assert.equal(images(calls).some(call => call.args[0].name === 'satellite'), false);
    assert.equal(station.alpha, 1);
    assert.deepEqual(h.draw(), calls, 'repeated service renders neither animate clocks nor repeat operations');
  }
  h.view.stageNumber = before.stageNumber; h.view.relay.active = before.relay.active;
  assert.deepEqual(h.view, before);
  h.SPRITES.c9Station.naturalWidth = 0;
  assert.equal(images(h.draw()).filter(call => call.args[0].name === 'satellite').length, 1);
});

test('the actual short C9 approach, immediate dock and undock select the four illustrated machine states',()=>{
  const model=createChronosVoyage({checkpoint:createChronosVoyageCheckpoint(5)});
  const advance=seconds=>{
    for(let step=0;step<Math.ceil(seconds/.02);step++)model.advance(.02,18);
    return model.snapshot();
  };
  const approaching=advance(36.82);
  assert.equal(approaching.relay.visible,true);assert.equal(approaching.relay.state,'approach');
  while(model.snapshot().stageNumber===5)model.advance(.02,18);
  const docking=advance(.6);assert.equal(docking.relay.state,'docking');
  const docked=advance(.6);assert.equal(docked.waitingFor,'service');
  const departing=model.resolveService();
  assert.equal(departing.stageNumber,6);assert.equal(departing.relay.state,'departing');
  const geometry={classicFlightBounds:{presentationTop:122,presentationBottom:730}};
  const h=harness(approaching,'high',geometry);
  h.SPRITES.c9Station={name:'c9',naturalWidth:1024,naturalHeight:1024};
  for(const [view,column,row] of [[approaching,0,0],[docking,512,0],[docked,0,512],[departing,512,512]]){
    Object.assign(h.view,view);
    const before=structuredClone(view),calls=h.draw();
    const drawn=images(calls).find(call=>call.args[0].name==='c9');
    assert.ok(drawn);assert.deepEqual(drawn.args.slice(1,5),[column,row,512,512]);
    assert.equal(drawn.alpha,1,'A service state uses an opaque machine, never a fade');
    assert.ok(calls.some(call=>call.method==='rect'&&call.args.join()==='0,122,390,608'));
    assert.ok(calls.some(call=>call.method==='clip'));
    assert.deepEqual(h.draw(),calls,'Paused route snapshots cannot rotate or change the pose');
    assert.deepEqual(view,before,'Scenery cannot advance the service or install equipment');
  }
  const gone=advance(2.4);assert.equal(gone.relay.visible,false);
  assert.equal(gone.stageNumber,6);assert.equal(gone.stageGoal,18);
  Object.assign(h.view,gone);
  assert.equal(images(h.draw()).some(call=>call.args[0].name==='c9'),false);
});

test('a failed space plate still renders the independent stars and planet', () => {
  const h = harness(); h.SPRITES.flightSpace.naturalWidth = 0;
  const calls = h.draw();
  assert.equal(images(calls).some(call => call.args[0].name === 'space'), false);
  assert.equal(images(calls).some(call => call.args[0].name === 'kit'), true);
  assert.ok(stars(calls).length > 0);
});

test('reduced effects removes the actual full-screen storm flash without changing storm state', () => {
  const h = harness();
  Object.assign(h.sandbox, {classicFlightView: null, isUnifiedClassic: () => false,
    N7_CAMPAIGN: true, currentLevel: 1, state: 'playing',
    level: () => ({top: '#020817', mid: '#050b17', accent: '#55eeee', scene: 'quiet'}),
    stars: [], spaceDust: [], foregroundParticles: [], visualSpeed: 1,
    stormPulse: 1, levelOneShockwave: 0});
  const draw = reduced => {
    h.sandbox.settings.reduceEffects = reduced;
    h.draw(); // clears the recording; the flight view is deliberately absent
    h.sandbox.background(1000);
    return h.recording();
  };
  const flash = calls => calls.filter(call => call.method === 'fillRect' &&
    call.fillStyle === 'rgba(255,255,255,0.28)' && call.args.join() === '0,0,390,844');
  assert.equal(flash(draw(false)).length, 1);
  assert.equal(flash(draw(true)).length, 0);
  assert.equal(h.sandbox.stormPulse, 1, 'presentation cannot alter storm timing or damage');
});
