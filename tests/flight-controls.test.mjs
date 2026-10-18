import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFlightBounds, createRelativeFlightInput,
  beginFlightInput, moveFlightInput, endFlightInput
} from '../src/game/ship/flight-controls.js';

const viewport = { width: 720, height: 1558, hudBottom: 260, controlsTop: 1300 };
const bounds = calculateFlightBounds(viewport);
const target = { targetX: 360, targetY: 1050 };

test('flight bounds retain the complete unchanged ship outline clear of HUD and controls', () => {
  assert.deepEqual(bounds, {
    minX: 119, maxX: 601, minY: 418, maxY: 1196,
    fits: true, xFits: true, yFits: true
  });
  assert.equal(Object.isFrozen(bounds), true);
  assert.ok(bounds.minX - 109 >= 10);
  assert.ok(viewport.width - (bounds.maxX + 109) >= 10);
  assert.ok(bounds.minY - 148 >= viewport.hudBottom + 10);
  assert.ok(bounds.maxY + 94 <= viewport.controlsTop - 10);
});

test('a short landscape arena reports insufficient room instead of inventing safe movement', () => {
  const short = calculateFlightBounds({ width: 720, height: 332, hudBottom: 70, controlsTop: 250 });
  assert.equal(short.fits, false); assert.equal(short.xFits, true); assert.equal(short.yFits, false);
  assert.equal(short.minY, short.maxY); assert.equal(short.minY, 187);
  assert.ok(short.minY >= 0 && short.maxY <= 332);
  const narrow = calculateFlightBounds({ width: 200, height: 1000, hudBottom: 100, controlsTop: 900 });
  assert.equal(narrow.fits, false); assert.equal(narrow.xFits, false); assert.equal(narrow.yFits, true);
  assert.equal(narrow.minX, 100); assert.equal(narrow.maxX, 100);
});

test('exact-fit arenas allow one coherent center and reject impossible viewport boundaries', () => {
  assert.deepEqual(calculateFlightBounds({ width: 238, height: 262, hudBottom: 0, controlsTop: 262 }), {
    minX: 119, maxX: 119, minY: 158, maxY: 158, fits: true, xFits: true, yFits: true
  });
  for (const patch of [{ width: 0 }, { height: -1 }, { hudBottom: -1 },
    { controlsTop: 1600 }, { hudBottom: 1301 }, { width: Infinity }, { height: NaN }]) {
    assert.throws(() => calculateFlightBounds({ ...viewport, ...patch }), RangeError);
  }
});

test('a distant initial touch only sets an anchor and subsequent movement is relative in both axes', () => {
  const state = createRelativeFlightInput();
  assert.equal(beginFlightInput(state, { id: 3, x: 125, y: 700 }), true);
  const first = moveFlightInput(state, { id: 3, x: 125, y: 700, ...target, bounds });
  assert.deepEqual(first, { ...target, moved: false });
  const moved = moveFlightInput(state, { id: 3, x: 145, y: 665, ...target, sensitivity: 1.5, bounds });
  assert.deepEqual(moved, { targetX: 390, targetY: 997.5, moved: true });
  assert.deepEqual(state, { active: true, id: 3, lastX: 145, lastY: 665 });
});

test('a second touch cannot take over or shift the active anchor, including its release', () => {
  const state = createRelativeFlightInput();
  beginFlightInput(state, { id: 7, x: 100, y: 200 }); const before = { ...state };
  assert.equal(beginFlightInput(state, { id: 8, x: 600, y: 900 }), false);
  assert.equal(beginFlightInput(state, { id: 7, x: 600, y: 900 }), false);
  assert.deepEqual(moveFlightInput(state, { id: 8, x: 620, y: 950, ...target, bounds }),
    { ...target, moved: false });
  assert.equal(endFlightInput(state, 8), false); assert.deepEqual(state, before);
  assert.deepEqual(moveFlightInput(state, { id: 7, x: 115, y: 225, ...target, bounds }),
    { targetX: 375, targetY: 1075, moved: true });
});

test('dragging beyond any boundary clamps the whole ship and reversing an edge drag responds immediately', () => {
  const state = createRelativeFlightInput(); beginFlightInput(state, { id: 'touch', x: 300, y: 700 });
  const edge = moveFlightInput(state, { id: 'touch', x: 10000, y: -10000, ...target, bounds });
  assert.deepEqual(edge, { targetX: bounds.maxX, targetY: bounds.minY, moved: true });
  const reverse = moveFlightInput(state, { id: 'touch', x: 9990, y: -9990,
    targetX: edge.targetX, targetY: edge.targetY, bounds });
  assert.deepEqual(reverse, { targetX: bounds.maxX - 10, targetY: bounds.minY + 10, moved: true });
  const opposite = moveFlightInput(state, { id: 'touch', x: -10000, y: 10000,
    targetX: reverse.targetX, targetY: reverse.targetY, bounds });
  assert.deepEqual(opposite, { targetX: bounds.minX, targetY: bounds.maxY, moved: true });
});

test('release, cancellation and reentry do not reuse a stale finger position or produce a jump', () => {
  const state = createRelativeFlightInput(); beginFlightInput(state, { id: 2, x: 100, y: 200 });
  assert.equal(endFlightInput(state, 2), true); assert.deepEqual(state, createRelativeFlightInput());
  assert.deepEqual(moveFlightInput(state, { id: 2, x: 600, y: 900, ...target, bounds }),
    { ...target, moved: false });
  assert.equal(endFlightInput(state), false);
  beginFlightInput(state, { id: 4, x: 600, y: 900 }); assert.equal(endFlightInput(state), true);
  beginFlightInput(state, { id: 9, x: 20, y: 1200 });
  assert.deepEqual(moveFlightInput(state, { id: 9, x: 20, y: 1200, ...target, bounds }),
    { ...target, moved: false });
  assert.equal(endFlightInput(state, null), true);
});

test('invalid pointer data and arithmetic overflow are rejected before mutating input', () => {
  const state = createRelativeFlightInput();
  for (const patch of [{ x: NaN }, { y: Infinity }, { id: NaN }, { id: undefined }, { id: '' }]) {
    assert.throws(() => beginFlightInput(state, { id: 3, x: 120, y: 200, ...patch }));
    assert.deepEqual(state, createRelativeFlightInput());
  }
  beginFlightInput(state, { id: 3, x: 120, y: 200 }); const before = { ...state };
  for (const patch of [{ x: NaN }, { y: -Infinity }, { sensitivity: 0 }, { sensitivity: -1 },
    { sensitivity: Infinity }, { targetX: NaN }, { targetY: Infinity },
    { bounds: { ...bounds, minX: 602 } }, { bounds: null }, { id: undefined },
    { x: Number.MAX_VALUE, sensitivity: 2 }]) {
    assert.throws(() => moveFlightInput(state, { id: 3, x: 130, y: 210, ...target, bounds, ...patch }));
    assert.deepEqual(state, before);
  }
  assert.throws(() => endFlightInput(state, NaN)); assert.deepEqual(state, before);
});

test('layout changes clamp stale desired positions and inactive pointers remain inert', () => {
  const state = createRelativeFlightInput();
  const small = calculateFlightBounds({ width: 720, height: 1180, hudBottom: 250, controlsTop: 940 });
  assert.deepEqual(moveFlightInput(state, { id: 1, x: 100, y: 100, targetX: 680, targetY: 1400, bounds: small }),
    { targetX: small.maxX, targetY: small.maxY, moved: false });
  const short = calculateFlightBounds({ width: 720, height: 332, hudBottom: 70, controlsTop: 250 });
  beginFlightInput(state, { id: 1, x: 100, y: 100 });
  const movement = moveFlightInput(state, { id: 1, x: 100, y: -1000, ...target, bounds: short });
  assert.equal(movement.targetY, short.minY); assert.equal(movement.targetY, short.maxY);
});

test('the smaller classic hull gains usable movement while historical campaign bounds retain their original defaults',()=>{
  const small=calculateFlightBounds({...viewport,shipScale:.4});
  assert.equal(small.minX,47.6);assert.equal(small.maxX,672.4);
  assert.equal(small.minY,323.2);assert.equal(small.maxY,1258.4);
  assert.ok(small.minX-109*.4>=4-.00001);
  assert.ok(small.minY-148*.4>=viewport.hudBottom+4-.00001);
  assert.ok(small.maxY+94*.4<=viewport.controlsTop-4+.00001);
  assert.deepEqual(calculateFlightBounds(viewport),bounds);
  for(const shipScale of [0,-1,Infinity,NaN,5])assert.throws(()=>calculateFlightBounds({...viewport,shipScale}),RangeError);
});
