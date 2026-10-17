import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import * as flight from '../src/game/ship/flight-controls.js';

// Execute the input/frame section of the actual source, not a stale generated
// bundle. JSDOM simulates event dispatch; these are not physical Safari tests.
const source = readFileSync(new URL('../src/game/08-loop-input-bootstrap.js', import.meta.url), 'utf8');
const inputSource = source.slice(source.indexOf('  function frame(now) {'), source.indexOf('  $("play").onclick'));
assert.ok(inputSource.includes('function startFireInput(event)'));
const fireClickSource = source.match(/  ui\.fire\.onclick = \(event\) => \{[\s\S]*?\n  \};/)?.[0];
assert.ok(fireClickSource, 'The source retains an accessible click handler');
const visibilitySource = source.match(/  document\.addEventListener\("visibilitychange", async \(\) => \{[\s\S]*?\n  \}\);/)?.[0];
assert.ok(visibilitySource);

function harness(t, {pointerEvents = true, mode = 'classic'} = {}) {
  const dom = new JSDOM('<canvas id="canvas"></canvas><button id="fire">Disparar</button>', {
    runScripts: 'outside-only', pretendToBeVisual: true
  });
  const {window} = dom;
  t.after(() => window.close());
  window.NeonCampaign = flight;
  const frames = new Map();
  let nextFrame = 0;
  window.requestAnimationFrame = callback => (frames.set(++nextFrame, callback), nextFrame);
  window.cancelAnimationFrame = id => frames.delete(id);
  const captures = new Map();
  window.Element.prototype.setPointerCapture = function(id) { captures.set(id, this.id); };
  window.Element.prototype.releasePointerCapture = function(id) { captures.delete(id); };
  window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({left: 0, top: 0, width: 390, height: 844});
  if (pointerEvents) {
    window.PointerEvent = class extends window.MouseEvent {
      constructor(type, options = {}) {
        super(type, options);
        for (const [key, value] of Object.entries({pointerId: options.pointerId ?? 1,
          pointerType: options.pointerType ?? 'touch', isPrimary: options.isPrimary ?? true})) {
          Object.defineProperty(this, key, {value});
        }
      }
    };
  } else window.PointerEvent = undefined;
  window.eval(`
    let state='playing', last=0, legacyRunning=true, legacyFrameId=null;
    const W=720,H=1558,canvas=document.getElementById('canvas'),ui={fire:document.getElementById('fire')};
    const settings={sensitivity:100},player={x:360,y:1100,target:360,targetY:1100};
    const classicFlightInput=NeonCampaign.createRelativeFlightInput();
    const classicFlightBounds={minX:119,maxX:601,minY:350,maxY:1300};
    const JOURNEY_DEMO=${JSON.stringify(mode === 'journey')};
    let journeyPointerLast=null,shotCount=0,charges=3,cooldown=0;
    function isUnifiedClassic(){return ${JSON.stringify(mode === 'classic')};}
    function refreshClassicFlightBounds(){return classicFlightBounds;}
    function clamp(n,lo,hi){return Math.min(hi,Math.max(lo,n));}
    function fireManualShot(){
      if(state!=='playing'||charges===0||cooldown>1e-9)return false;
      shotCount++;charges--;cooldown=.32;return true;
    }
    function update(dt){cooldown=Math.max(0,cooldown-dt);}
    function render(){}
    function pauseGame(){resetGameInput();state='paused';}
    function resumeGame(){state='playing';}
    async function suspendAudio(){}
    ${inputSource}
    ${fireClickSource}
    ${visibilitySource}
    window.__input={
      snapshot:()=>({state,player:{...player},pilot:{...classicFlightInput},
        fire:fireInput?{...fireInput}:null,legacyPilotId,journeyPointerLast,shotCount,charges,cooldown}),
      tick(dt=.034){last=0;frame(dt*1000);},
      pause:pauseGame,resume:resumeGame,reset:resetGameInput,
      restart(){resetGameInput();state='playing';charges=3;cooldown=0;},
      ready(){cooldown=0;}, state(value){state=value;}
    };
  `);
  const api = window.__input;
  const canvas = window.document.getElementById('canvas');
  const fire = window.document.getElementById('fire');
  const snapshot = () => JSON.parse(JSON.stringify(api.snapshot()));
  function pointer(target, type, id, x = 250, y = 600, extra = {}) {
    const event = new window.PointerEvent(type, {pointerId: id, clientX: x, clientY: y,
      pointerType: 'touch', buttons: /up|cancel|lost/.test(type) ? 0 : 1,
      bubbles: true, cancelable: true, ...extra});
    target.dispatchEvent(event);
    return event;
  }
  function touch(target, type, touches, changedTouches = touches) {
    const event = new window.Event(type, {bubbles: true, cancelable: true});
    Object.defineProperties(event, {touches: {value: touches}, changedTouches: {value: changedTouches}});
    target.dispatchEvent(event);
    return event;
  }
  function tick(count = 1) {
    for (let index = 0; index < count; index++) {
      frames.clear();
      api.tick();
      assert.equal(frames.size, 1, 'The existing frame schedules exactly one successor');
    }
  }
  return {window, api, canvas, fire, pointer, touch, tick, snapshot, frames, captures};
}

test('pilot first: a nonprimary action pointer fires immediately and its release cannot cancel steering', t => {
  const h = harness(t);
  h.pointer(h.canvas, 'pointerdown', 11);
  h.pointer(h.canvas, 'pointermove', 11, 260, 580);
  const before = h.snapshot();
  h.pointer(h.fire, 'pointerdown', 12, 350, 750, {isPrimary: false});
  assert.equal(h.snapshot().shotCount, 1);
  assert.equal(h.snapshot().charges, 2);
  assert.equal(h.snapshot().pilot.id, 11);
  assert.equal(h.captures.get(11), 'canvas');
  assert.equal(h.captures.get(12), 'fire');
  h.pointer(h.fire, 'pointerup', 12, 350, 750, {isPrimary: false});
  assert.equal(h.snapshot().fire, null);
  assert.equal(h.snapshot().pilot.active, true);
  h.pointer(h.canvas, 'pointermove', 11, 270, 570);
  assert.ok(h.snapshot().player.target > before.player.target);
  assert.ok(h.snapshot().player.targetY < before.player.targetY);
  h.api.ready();
  h.fire.dispatchEvent(new h.window.MouseEvent('click', {detail: 1, bubbles: true}));
  assert.equal(h.snapshot().shotCount, 1, 'A delayed compatibility click must not spend a second charge');
});

test('fire first: the secondary pilot remains independent while a held action repeats through the existing frame', t => {
  const h = harness(t);
  h.pointer(h.fire, 'pointerdown', 20, 350, 750);
  h.pointer(h.canvas, 'pointerdown', 21, 200, 600, {isPrimary: false});
  const before = h.snapshot();
  h.pointer(h.canvas, 'pointermove', 21, 220, 560, {isPrimary: false});
  assert.ok(h.snapshot().player.target > before.player.target);
  assert.ok(h.snapshot().player.targetY < before.player.targetY);
  h.tick(12);
  assert.equal(h.snapshot().shotCount, 2);
  assert.equal(h.snapshot().fire.id, 20);
  assert.equal(h.snapshot().pilot.id, 21);
  h.pointer(h.canvas, 'pointerup', 21, 220, 560, {isPrimary: false});
  assert.equal(h.snapshot().pilot.active, false);
  assert.equal(h.snapshot().fire.id, 20);
  h.tick(12);
  assert.equal(h.snapshot().shotCount, 3);
  h.tick(40);
  assert.equal(h.snapshot().shotCount, 3, 'Holding does not bypass an empty battery');
});

for (const actionFirst of [false, true]) {
  test(`touch fallback ${actionFirst ? 'fire first' : 'pilot first'} tracks identifiers when touches[0] belongs to the other control`, t => {
    const h = harness(t, {pointerEvents: false});
    const pilot = {identifier: 31, clientX: 200, clientY: 600};
    const action = {identifier: 32, clientX: 350, clientY: 750};
    if (actionFirst) {
      h.touch(h.fire, 'touchstart', [action], [action]);
      h.touch(h.canvas, 'touchstart', [action, pilot], [pilot]);
    } else {
      h.touch(h.canvas, 'touchstart', [pilot], [pilot]);
      h.touch(h.fire, 'touchstart', [pilot, action], [action]);
    }
    assert.equal(h.snapshot().shotCount, 1);
    assert.equal(h.snapshot().pilot.id, 31);
    const before = h.snapshot();
    const moved = {...pilot, clientX: 220, clientY: 575};
    h.touch(h.canvas, 'touchmove', [action, moved], [moved]);
    assert.ok(h.snapshot().player.target > before.player.target);
    assert.ok(h.snapshot().player.targetY < before.player.targetY);
    h.touch(h.fire, 'touchend', [moved], [action]);
    assert.equal(h.snapshot().fire, null);
    assert.equal(h.snapshot().pilot.id, 31);
    h.touch(h.canvas, 'touchmove', [{...moved, clientX: 230}], [{...moved, clientX: 230}]);
    assert.ok(h.snapshot().player.target > before.player.target + 20 * 720 / 390);
    h.touch(h.canvas, 'touchcancel', [], [moved]);
    assert.equal(h.snapshot().pilot.active, false);
  });
}

test('pause, restart, blur and nonplaying frame clear held fire without resurrecting it on resume', t => {
  const h = harness(t);
  for (const cancel of [() => h.api.pause(), () => h.api.restart(),
    () => h.window.dispatchEvent(new h.window.Event('blur')),
    () => { h.api.state('complete'); h.tick(); }]) {
    h.api.restart();
    h.pointer(h.canvas, 'pointerdown', 40);
    h.pointer(h.fire, 'pointerdown', 41, 350, 750, {isPrimary: false});
    const shotCount = h.snapshot().shotCount;
    cancel();
    assert.equal(h.snapshot().pilot.active, false);
    assert.equal(h.snapshot().fire, null);
    assert.equal(h.captures.size, 0);
    h.api.resume();
    h.tick(25);
    assert.equal(h.snapshot().shotCount, shotCount);
  }
});

test('cancellation and lost capture only clear their own control; a third contact cannot take either control', t => {
  const h = harness(t);
  h.pointer(h.canvas, 'pointerdown', 50);
  h.pointer(h.fire, 'pointerdown', 51, 350, 750, {isPrimary: false});
  h.pointer(h.canvas, 'pointerdown', 52, 80, 300, {isPrimary: false});
  h.pointer(h.fire, 'pointerdown', 53, 360, 750, {isPrimary: false});
  assert.equal(h.snapshot().pilot.id, 50);
  assert.equal(h.snapshot().fire.id, 51);
  assert.equal(h.snapshot().shotCount, 1);
  h.pointer(h.fire, 'lostpointercapture', 53);
  assert.equal(h.snapshot().fire.id, 51);
  h.pointer(h.fire, 'pointercancel', 51);
  assert.equal(h.snapshot().fire, null);
  assert.equal(h.snapshot().pilot.id, 50);
  h.pointer(h.canvas, 'lostpointercapture', 50);
  assert.equal(h.snapshot().pilot.active, false);
  h.api.ready();
  h.fire.dispatchEvent(new h.window.MouseEvent('click', {detail: 1}));
  h.fire.dispatchEvent(new h.window.MouseEvent('click', {detail: 1}));
  assert.equal(h.snapshot().shotCount, 1, 'Neither the third contact nor the owner releases can fire compatibility clicks');
});

test('background visibility stops both contacts immediately and returning does not resume held fire', t => {
  const h = harness(t);
  h.pointer(h.canvas, 'pointerdown', 80);
  h.pointer(h.fire, 'pointerdown', 81, 350, 750, {isPrimary: false});
  Object.defineProperty(h.window.document, 'hidden', {configurable: true, value: true});
  h.window.document.dispatchEvent(new h.window.Event('visibilitychange'));
  assert.equal(h.snapshot().state, 'paused');
  assert.equal(h.snapshot().pilot.active, false);
  assert.equal(h.snapshot().fire, null);
  Object.defineProperty(h.window.document, 'hidden', {configurable: true, value: false});
  h.window.document.dispatchEvent(new h.window.Event('visibilitychange'));
  h.api.resume(); h.tick(25);
  assert.equal(h.snapshot().shotCount, 1);
});

test('keyboard and assistive click remain single-shot alternatives while right mouse and compatibility touch events are ignored', t => {
  const h = harness(t);
  h.pointer(h.fire, 'pointerdown', 60, 350, 750, {pointerType: 'mouse', button: 2});
  assert.equal(h.snapshot().shotCount, 0);
  h.fire.click();
  assert.equal(h.snapshot().shotCount, 1);
  h.api.ready();
  h.window.dispatchEvent(new h.window.KeyboardEvent('keydown', {key: ' ', cancelable: true}));
  assert.equal(h.snapshot().shotCount, 2);
  h.api.ready();
  h.pointer(h.fire, 'pointerdown', 61, 350, 750);
  h.touch(h.fire, 'touchstart', [{identifier: 61, clientX: 350, clientY: 750}]);
  assert.equal(h.snapshot().shotCount, 3);
  h.api.ready();
  h.fire.dispatchEvent(new h.window.MouseEvent('click', {detail: 1}));
  assert.equal(h.snapshot().shotCount, 3);
});

for (const mode of ['n7', 'journey']) {
  test(`${mode} keeps its historical movement rule while a second action contact starts and ends`, t => {
    const h = harness(t, {mode, pointerEvents: false});
    const action = {identifier: 70, clientX: 350, clientY: 750};
    const pilot = {identifier: 71, clientX: 180, clientY: 600};
    h.touch(h.fire, 'touchstart', [action], [action]);
    h.touch(h.canvas, 'touchstart', [action, pilot], [pilot]);
    const before = h.snapshot();
    h.touch(h.fire, 'touchend', [pilot], [action]);
    assert.equal(h.snapshot().legacyPilotId, 71);
    assert.equal(h.snapshot().fire, null);
    assert.equal(h.snapshot().shotCount, 1);
    const moved = {...pilot, clientX: 210};
    h.touch(h.canvas, 'touchmove', [moved], [moved]);
    if (mode === 'journey') {
      assert.equal(h.snapshot().player.target, before.player.target + 30 * 720 / 390);
    } else {
      assert.equal(h.snapshot().player.target, 210 * 720 / 390);
    }
    h.touch(h.canvas, 'touchend', [], [moved]);
    assert.equal(h.snapshot().legacyPilotId, null);
    assert.equal(h.snapshot().journeyPointerLast, null);
  });
}
