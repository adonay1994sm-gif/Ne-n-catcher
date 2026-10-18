import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createFlightTutorial, FLIGHT_TUTORIAL_VERSION, FLIGHT_TUTORIAL_CUES}
  from '../src/game/narrative/flight-tutorial.js';

const id = name => `${FLIGHT_TUTORIAL_VERSION}:${name}`;

test('first-flight hints are brief, stable and tied to the designed route beats', () => {
  assert.equal(FLIGHT_TUTORIAL_VERSION, 'flight-tutorial-v1');
  assert.deepEqual(FLIGHT_TUTORIAL_CUES.map(cue => cue.at), [27, 52, 65]);
  assert.deepEqual(FLIGHT_TUTORIAL_CUES.map(cue => cue.id), ['fire', 'recovery', 'workshop'].map(id));
  for (const cue of FLIGHT_TUTORIAL_CUES) {
    assert.ok(Object.isFrozen(cue)); assert.ok(cue.text.length <= 110); assert.equal(cue.seconds, 4);
  }
  assert.match(FLIGHT_TUTORIAL_CUES[0].text, /otro, mantén DISPARAR/);
  assert.match(FLIGHT_TUTORIAL_CUES[1].text, /energía.*chatarra/);
  assert.match(FLIGHT_TUTORIAL_CUES[2].text, /HUD.*pausar y configurar/);
});

test('advancing the real route emits each hint once without requiring elapsed wall time', () => {
  const tutorial = createFlightTutorial(), delivered = [];
  for (const elapsed of [0, 1, 26.999, 27, 27, 30, 51.99, 52, 60, 65, 65, 100]) {
    const events = tutorial.advance({elapsed}, event => delivered.push(event));
    assert.ok(events.length <= 1);
  }
  assert.deepEqual(delivered.map(event => event.id), FLIGHT_TUTORIAL_CUES.map(cue => cue.id));
  assert.deepEqual(tutorial.snapshot().emitted, delivered.map(event => event.id));
  assert.deepEqual(tutorial.snapshot().pending, []); assert.deepEqual(tutorial.snapshot().skipped, []);
  for (const event of delivered) {
    assert.equal(event.type, 'tutorial'); assert.equal(event.routeElapsed, event.at);
    assert.equal(event.expiresAt, event.at + 12); assert.ok(Object.isFrozen(event));
  }
});

test('pause and zero route advancement cannot emit or consume hints, even when a slot opens', () => {
  const tutorial = createFlightTutorial();
  tutorial.advance({elapsed: 27, channelBusy: true}); const before = tutorial.snapshot();
  assert.deepEqual(tutorial.advance({elapsed: 65, playing: false}), []);
  assert.deepEqual(tutorial.snapshot(), before);
  assert.deepEqual(tutorial.advance({elapsed: 27, channelBusy: false}), []);
  assert.deepEqual(tutorial.snapshot(), before);
  assert.equal(tutorial.advance({elapsed: 27.01, channelBusy: false})[0].id, id('fire'));
});

test('story occupies the slot first; the hint waits only inside its route-time validity window', () => {
  const tutorial = createFlightTutorial();
  assert.deepEqual(tutorial.advance({elapsed: 27, channelBusy: true}), []);
  assert.deepEqual(tutorial.advance({elapsed: 38.9, channelBusy: true}), []);
  assert.equal(tutorial.advance({elapsed: 38.99})[0].id, id('fire'));
  assert.deepEqual(tutorial.advance({elapsed: 52, channelBusy: true}), []);
  assert.deepEqual(tutorial.advance({elapsed: 64}), []);
  assert.ok(tutorial.snapshot().skipped.includes(id('recovery')));
  assert.deepEqual(tutorial.advance({elapsed: 65, channelBusy: true}), []);
  assert.deepEqual(tutorial.advance({elapsed: 77}), []);
  assert.deepEqual(tutorial.snapshot().skipped, [id('recovery'), id('workshop')]);
});

test('checkpoint reentry skips previously crossed lessons and never dumps them into comms', () => {
  for (const routeElapsed of [27, 36, 52, 65, 180, 360]) {
    const tutorial = createFlightTutorial({routeElapsed});
    const old = FLIGHT_TUTORIAL_CUES.filter(cue => cue.at <= routeElapsed).map(cue => cue.id);
    assert.deepEqual(tutorial.snapshot().skipped, old);
    const events = tutorial.advance({elapsed: routeElapsed + .01});
    assert.equal(events.length, 0); assert.deepEqual(tutorial.snapshot().emitted, []);
  }
  const tutorial = createFlightTutorial({routeElapsed: 36});
  assert.equal(tutorial.advance({elapsed: 52})[0].id, id('recovery'));
});

test('existing shots and recovered energy do not suppress the hold-fire and material lessons', () => {
  const tutorial = createFlightTutorial();
  assert.equal(tutorial.advance({elapsed: 27, shots: 40, collected: 5})[0].id, id('fire'));
  assert.equal(tutorial.advance({elapsed: 52, shots: 70, collected: 12})[0].id, id('recovery'));
});

test('opening C9 before its lesson skips redundant instruction without a new saved flag', () => {
  const tutorial = createFlightTutorial();
  assert.deepEqual(tutorial.advance({elapsed: 65, workshopOpened: true}), []);
  assert.deepEqual(tutorial.snapshot().skipped, FLIGHT_TUTORIAL_CUES.map(cue => cue.id));
});

test('callback delivery consumes the event first and remains idempotent after callback failure or reentry', () => {
  const tutorial = createFlightTutorial(), delivered = [];
  const failure = new Error('consumer unavailable');
  assert.throws(() => tutorial.advance({elapsed: 27}, event => {
    delivered.push(event); assert.deepEqual(tutorial.advance({elapsed: 27.01}), []); throw failure;
  }), error => error === failure);
  assert.deepEqual(tutorial.advance({elapsed: 28}), []);
  assert.deepEqual(tutorial.snapshot().emitted, [id('fire')]); assert.equal(delivered.length, 1);
  assert.equal(tutorial.advance({elapsed: 52})[0].id, id('recovery'));
});

test('snapshots expose immutable copies and identical route input reproduces delivery', () => {
  const trace = () => {
    const tutorial = createFlightTutorial(), events = [];
    const initial = tutorial.snapshot(); assert.ok(Object.isFrozen(initial));
    assert.throws(() => initial.pending.push('fake'));
    for (const elapsed of [27, 28, 52, 53, 65]) events.push(...tutorial.advance({elapsed}));
    assert.equal(initial.pending.length, 3);
    return {events, snapshot: tutorial.snapshot()};
  };
  assert.deepEqual(trace(), trace());
});

test('invalid clocks, counters and views fail before mutating the current tutorial', () => {
  for (const routeElapsed of [-1, NaN, Infinity, '27']) assert.throws(() => createFlightTutorial({routeElapsed}));
  const tutorial = createFlightTutorial(); tutorial.advance({elapsed: 10}); const before = tutorial.snapshot();
  for (const view of [{elapsed: NaN}, {elapsed: -1}, {elapsed: 9}, {elapsed: 27, shots: -1},
    {elapsed: 27, collected: .5}, {elapsed: 27, playing: 1}, {elapsed: 27, channelBusy: 1},
    {elapsed: 27, workshopOpened: 'yes'}, {}, undefined]) {
    assert.throws(() => tutorial.advance(view)); assert.deepEqual(tutorial.snapshot(), before);
  }
  assert.throws(() => tutorial.advance({elapsed: 27}, null)); assert.deepEqual(tutorial.snapshot(), before);
});

test('tutorial owns no scheduler, browser clock, storage, reward or input operations', async () => {
  const source = await readFile(new URL('../src/game/narrative/flight-tutorial.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /requestAnimationFrame|cancelAnimationFrame|setInterval|setTimeout|Date\.now|performance\.now|Math\.random|localStorage|sessionStorage|addEventListener/);
});
