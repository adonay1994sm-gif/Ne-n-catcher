import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createFlightTutorial, FLIGHT_TUTORIAL_VERSION, FLIGHT_TUTORIAL_CUES}
  from '../src/game/narrative/flight-tutorial.js';

const id = name => `${FLIGHT_TUTORIAL_VERSION}:${name}`;
const action = (tutorial, type, rest = {}) => tutorial.observe({type, ...rest});

test('first-flight has one brief objective and recognizes real pilot motion before teaching fire', () => {
  const tutorial = createFlightTutorial();
  const initial = tutorial.advance({elapsed: 1})[0];
  assert.equal(initial.id, id('pilot'));
  assert.equal(action(tutorial, 'pilot', {distance: 28}).active.progress, .5);
  assert.equal(action(tutorial, 'pilot', {distance: 28}).active, null);
  assert.equal(tutorial.advance({elapsed: 27})[0].id, id('fire'));
  assert.ok(tutorial.snapshot().completed.includes(id('pilot')));
  assert.ok(tutorial.snapshot().pending.includes(id('fire')));
  for (const cue of FLIGHT_TUTORIAL_CUES) {
    assert.ok(Object.isFrozen(cue)); assert.ok(cue.text.length <= 100); assert.equal(cue.seconds, 4);
  }
});

test('an elapsed clock never completes an objective; actions advance one objective without stopping the journey', () => {
  const tutorial = createFlightTutorial();
  tutorial.advance({elapsed: 1});
  tutorial.advance({elapsed: 50});
  assert.equal(tutorial.snapshot().active.id, id('pilot'));
  assert.deepEqual(tutorial.snapshot().completed, []);
  action(tutorial, 'pilot', {distance: 56});
  assert.equal(tutorial.snapshot().active.id, id('fire'));
  action(tutorial, 'fire');
  assert.equal(tutorial.snapshot().active.id, id('recovery'));
  action(tutorial, 'recovery');
  assert.equal(tutorial.snapshot().active, null);
  assert.deepEqual(tutorial.snapshot().completed, ['pilot', 'fire', 'recovery'].map(id));
});

test('existing caller counters complete proven skills instead of nagging experienced players', () => {
  const tutorial = createFlightTutorial();
  assert.deepEqual(tutorial.advance({elapsed: 50, pilotDistance: 56, shots: 12, collected: 4}), []);
  assert.deepEqual(tutorial.snapshot().completed, ['pilot', 'fire', 'recovery'].map(id));
  assert.equal(tutorial.snapshot().active, null);
  // Old call shape remains valid, and its collected/shot values cannot undo learning.
  tutorial.advance({elapsed: 51, shots: 0, collected: 0, workshopOpened: false, channelBusy: false});
  assert.deepEqual(tutorial.snapshot().completed, ['pilot', 'fire', 'recovery'].map(id));
});

test('missile lesson needs an actual opportunity and never requires wasting ammunition to reach the workshop', () => {
  const tutorial = createFlightTutorial();
  tutorial.advance({elapsed: 90, pilotDistance: 56, shots: 1, collected: 1, missileReady: true});
  assert.equal(tutorial.snapshot().active, null);
  assert.equal(tutorial.advance({elapsed: 91, missileReady: true, missileOpportunity: true})[0].id, id('missile'));
  action(tutorial, 'module');
  assert.equal(tutorial.snapshot().active.id, id('workshop'));
  assert.equal(tutorial.advance({elapsed: 92, missileReady: true, missileOpportunity: true})[0].id, id('workshop'));
  action(tutorial, 'workshop');
  assert.equal(tutorial.snapshot().complete, true);
  assert.equal(tutorial.snapshot().completed.includes(id('missile')), false);
  action(tutorial, 'missile');
  assert.equal(tutorial.snapshot().finished, true);
});

test('workshop only appears after the recovered module and opening it satisfies the action', () => {
  const tutorial = createFlightTutorial();
  tutorial.advance({elapsed: 90, pilotDistance: 56, shots: 1, collected: 1});
  assert.equal(tutorial.snapshot().active, null);
  assert.equal(tutorial.advance({elapsed: 91, moduleRecovered: true})[0].id, id('workshop'));
  assert.ok(tutorial.snapshot().pending.includes(id('workshop')));
  tutorial.advance({elapsed: 92, workshopOpened: true});
  assert.ok(tutorial.snapshot().completed.includes(id('workshop')));
});

test('story has channel priority, callbacks are idempotent, and no identical-time call repeats a hint', () => {
  const tutorial = createFlightTutorial();
  assert.deepEqual(tutorial.advance({elapsed: 1, channelBusy: true}), []);
  assert.deepEqual(tutorial.advance({elapsed: 1, channelBusy: false}), []);
  const failure = new Error('consumer unavailable');
  assert.throws(() => tutorial.advance({elapsed: 2}, event => {
    assert.equal(event.id, id('pilot'));
    assert.deepEqual(tutorial.advance({elapsed: 2.01}), []);
    throw failure;
  }), error => error === failure);
  assert.deepEqual(tutorial.advance({elapsed: 3}), []);
  assert.deepEqual(tutorial.snapshot().emitted, [id('pilot')]);
});

test('paused route cannot consume hints or action counters, and held Atlas endpoint suppresses all tutorial UI', () => {
  const tutorial = createFlightTutorial();
  tutorial.advance({elapsed: 1, channelBusy: true});
  const before = tutorial.snapshot();
  assert.deepEqual(tutorial.advance({elapsed: 50, playing: false, shots: 10}), []);
  action(tutorial, 'fire');
  assert.deepEqual(tutorial.snapshot(), before);
  tutorial.advance({elapsed: 1, bossActive: true});
  assert.equal(tutorial.snapshot().active, null);
  action(tutorial, 'fire');
  assert.deepEqual(tutorial.snapshot().completed, []);
  assert.deepEqual(tutorial.advance({elapsed: 2, bossActive: true}), []);
  assert.equal(tutorial.snapshot().active, null);
});

test('old objectives expire as skipped rather than success, without delaying the route or Atlas', () => {
  const tutorial = createFlightTutorial();
  tutorial.advance({elapsed: 360, bossActive: true});
  assert.equal(tutorial.snapshot().elapsed, 360);
  assert.equal(tutorial.snapshot().finished, true);
  assert.equal(tutorial.snapshot().complete, false);
  assert.deepEqual(tutorial.snapshot().skipped, FLIGHT_TUTORIAL_CUES.map(cue => cue.id));
  assert.deepEqual(tutorial.snapshot().completed, []);
});

test('checkpoint retains proven skills and idempotent hints inside an existing save record', () => {
  const tutorial = createFlightTutorial();
  tutorial.advance({elapsed: 50, pilotDistance: 56, shots: 2});
  const saved = tutorial.checkpoint();
  const resumed = createFlightTutorial({routeElapsed: 50, checkpoint: saved});
  assert.deepEqual(resumed.checkpoint(), saved);
  assert.equal(resumed.snapshot().active.id, id('recovery'));
  assert.deepEqual(resumed.advance({elapsed: 51}), []);
  action(resumed, 'recovery');
  assert.ok(resumed.snapshot().completed.includes(id('recovery')));
  assert.ok(Object.isFrozen(saved)); assert.ok(Object.isFrozen(saved.completed));
  assert.throws(() => saved.completed.push('fake'));
});

test('reentry without tutorial checkpoint skips crossed instructions; replay deliberately starts an independent lesson', () => {
  const resumed = createFlightTutorial({routeElapsed: 180});
  assert.deepEqual(resumed.snapshot().skipped, FLIGHT_TUTORIAL_CUES.map(cue => cue.id));
  assert.deepEqual(resumed.advance({elapsed: 181}), []);
  const replayed = createFlightTutorial({routeElapsed: 180, checkpoint: resumed.checkpoint(), replay: true});
  assert.equal(replayed.advance({elapsed: 181})[0].id, id('pilot'));
  action(replayed, 'pilot', {distance: 56});
  assert.equal(replayed.snapshot().active, null);
  assert.equal(replayed.advance({elapsed: 207})[0].id, id('fire'));
});

test('disabled tutorial produces neither prompts nor lesson progress', () => {
  const tutorial = createFlightTutorial({enabled: false});
  assert.deepEqual(tutorial.advance({elapsed: 50, shots: 2, collected: 3}), []);
  action(tutorial, 'pilot', {distance: 100});
  assert.equal(tutorial.snapshot().active, null);
  assert.deepEqual(tutorial.snapshot().completed, []);
});

test('invalid clocks, actions and counters fail before changing lesson state', () => {
  for (const routeElapsed of [-1, NaN, Infinity, '27']) assert.throws(() => createFlightTutorial({routeElapsed}));
  const tutorial = createFlightTutorial(); tutorial.advance({elapsed: 10}); const before = tutorial.snapshot();
  for (const view of [{elapsed: NaN}, {elapsed: -1}, {elapsed: 9}, {elapsed: 27, shots: -1},
    {elapsed: 27, collected: .5}, {elapsed: 27, playing: 1}, {elapsed: 27, channelBusy: 1},
    {elapsed: 27, workshopOpened: 'yes'}, {elapsed: 27, pilotDistance: -1},
    {elapsed: 27, missileReady: 1}, {elapsed: 27, bossActive: 1}, {}, undefined]) {
    assert.throws(() => tutorial.advance(view)); assert.deepEqual(tutorial.snapshot(), before);
  }
  for (const invalid of [{}, {type: 'pilot', distance: -1}, {type: 'pilot', distance: NaN}, {type: 'reward'}]) {
    assert.throws(() => tutorial.observe(invalid)); assert.deepEqual(tutorial.snapshot(), before);
  }
  assert.throws(() => tutorial.advance({elapsed: 27}, null)); assert.deepEqual(tutorial.snapshot(), before);
});

test('unrelated, older or corrupted settings cannot block flight or claim lessons completed', () => {
  for (const checkpoint of [{}, [], 'foreign setting', {version: 1},
    {version: 2, contentVersion: FLIGHT_TUTORIAL_VERSION, completed: [id('fire')], skipped: [id('fire')], emitted: []},
    {version: 2, contentVersion: FLIGHT_TUTORIAL_VERSION, completed: ['foreign-id'], skipped: [], emitted: []},
    {version: 2, contentVersion: FLIGHT_TUTORIAL_VERSION, completed: [], skipped: [], emitted: [id('fire'), id('fire')]}]) {
    const tutorial = createFlightTutorial({checkpoint});
    assert.deepEqual(tutorial.snapshot().completed, []);
    assert.equal(tutorial.advance({elapsed: 1})[0].id, id('pilot'));
    const resumed = createFlightTutorial({routeElapsed: 180, checkpoint});
    assert.deepEqual(resumed.advance({elapsed: 181}), []);
  }
});

test('tutorial owns no scheduler, browser clock, storage, reward or input operations', async () => {
  const source = await readFile(new URL('../src/game/narrative/flight-tutorial.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /requestAnimationFrame|cancelAnimationFrame|setInterval|setTimeout|Date\.now|performance\.now|Math\.random|localStorage|sessionStorage|addEventListener/);
});
