import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {guardianAtlasAnimation} from '../src/game/animation/guardian-atlas-animator.js';
import {createGuardianAtlas, advanceGuardianAtlas, hitGuardianAtlas,
  GUARDIAN_ATLAS_RULES} from '../src/game/combat/guardian-atlas.js';

const sample = (state, stateTime = 0, phase = 1) => ({state, stateTime, phase, age: 10});

function until(boss, predicate) {
  for (let frame = 0; frame < 6000; frame++) {
    if (predicate(boss)) return;
    advanceGuardianAtlas(boss, 1 / 60, {x: 360});
  }
  throw new Error(`Combat did not reach expected state: ${boss.state}`);
}

test('authored poses map combat states into one 4 by 2 atlas', () => {
  const expectations = [
    ['entry', 0, 1, 0], ['idle', 1, 1, 1], ['charge', .3, 1, 2],
    ['fire', .1, 1, 3], ['hurt', .05, 1, 4], ['phaseBreak', .7, 2, 5],
    ['idle', 1, 2, 5], ['charge', .4, 2, 5], ['fire', .2, 2, 6],
    ['disabled', 1, 2, 7]
  ];
  for (const [state, stateTime, phase, frame] of expectations) {
    const visual = guardianAtlasAnimation(sample(state, stateTime, phase));
    assert.equal(visual.frame, frame, `${state} in phase ${phase}`);
    assert.equal(visual.columns, 4);
    assert.equal(visual.rows, 2);
    assert.equal(visual.previousFrame, null);
    assert.equal(visual.blend, 1);
  }
});

test('entry retains closed shutters until the last 250 milliseconds', () => {
  const revealAt = GUARDIAN_ATLAS_RULES.entrySeconds - .25;
  assert.equal(guardianAtlasAnimation(sample('entry', revealAt - .001)).frame, 0);
  const halfway = guardianAtlasAnimation(sample('entry', revealAt + .125));
  assert.equal(halfway.frame, 1);
  assert.equal(halfway.previousFrame, 0);
  assert.ok(Math.abs(halfway.blend - .5) < 1e-8);
  assert.deepEqual(guardianAtlasAnimation(sample('entry', GUARDIAN_ATLAS_RULES.entrySeconds)),
    guardianAtlasAnimation(sample('idle')));
});

test('charge deploys illustrated barrels during 180 milliseconds without looping a shot', () => {
  const beginning = guardianAtlasAnimation(sample('charge'));
  assert.equal(beginning.frame, 2);
  assert.equal(beginning.previousFrame, 1);
  assert.equal(beginning.blend, 0);
  assert.equal(guardianAtlasAnimation(sample('charge', .09)).blend, .5);
  const deployed = guardianAtlasAnimation(sample('charge', .18));
  assert.equal(deployed.previousFrame, null);
  assert.equal(deployed.blend, 1);
  assert.equal(guardianAtlasAnimation(sample('charge', 1)).frame, 2);
  assert.equal(guardianAtlasAnimation(sample('fire', .01)).frame, 3);
});

test('phase transition opens the ring and subsequent damage cannot restore intact geometry', () => {
  const transition = guardianAtlasAnimation(sample('phaseBreak', .25, 2));
  assert.equal(transition.frame, 5);
  assert.equal(transition.previousFrame, 4);
  assert.equal(transition.blend, .5);
  for (const state of ['idle', 'charge', 'hurt']) {
    for (const time of [0, .05, .3, 1.4]) {
      const visual = guardianAtlasAnimation(sample(state, time, 2));
      assert.equal(visual.frame, 5);
      assert.notEqual(visual.previousFrame, 4);
    }
  }
  assert.equal(guardianAtlasAnimation(sample('hurt', .04, 1)).frame, 4);
});

test('shutdown fades from an opened ring to the cyan deactivated core and never loops', () => {
  const opening = guardianAtlasAnimation(sample('disabled', 0, 2));
  assert.equal(opening.frame, 7);
  assert.equal(opening.previousFrame, 5);
  assert.equal(opening.blend, 0);
  assert.equal(guardianAtlasAnimation(sample('disabled', .3, 2)).blend, .5);
  const terminal = guardianAtlasAnimation(sample('disabled', .6, 2));
  assert.equal(terminal.frame, 7);
  assert.equal(terminal.previousFrame, null);
  for (const time of [1.55, 5, 60]) {
    assert.deepEqual(guardianAtlasAnimation(sample('disabled', time, 2)), terminal);
  }
});

test('repeated rendering is read-only, emits no combat events, and stays frozen during pause', () => {
  const boss = createGuardianAtlas();
  until(boss, unit => unit.state === 'charge');
  advanceGuardianAtlas(boss, .05, {x: 360});
  const before = structuredClone(boss);
  const visual = guardianAtlasAnimation(boss);
  const frozen = Object.freeze(structuredClone(boss));
  for (let render = 0; render < 1000; render++) {
    assert.deepEqual(guardianAtlasAnimation(frozen), visual);
  }
  assert.deepEqual(boss, before);
  let events = 0;
  advanceGuardianAtlas(boss, 0, {x: 360}, () => { events++; });
  assert.deepEqual(guardianAtlasAnimation(boss), visual);
  assert.equal(events, 0);
  assert.deepEqual(boss, before);
});

test('real encounter transitions select phase-two hurt geometry and terminal art consistently', () => {
  const boss = createGuardianAtlas();
  until(boss, unit => unit.state === 'idle');
  hitGuardianAtlas(boss, boss.maxHp / 2);
  until(boss, unit => unit.state === 'idle');
  hitGuardianAtlas(boss, 1);
  assert.equal(boss.state, 'hurt');
  assert.equal(guardianAtlasAnimation(boss).frame, 5);
  hitGuardianAtlas(boss, 100);
  until(boss, unit => unit.resolved);
  assert.equal(guardianAtlasAnimation(boss).frame, 7);
  assert.equal(guardianAtlasAnimation(boss).blend, 1);
});

test('invalid presentation inputs fail clearly instead of sampling an unrelated atlas cell', () => {
  for (const value of [undefined, {}, sample('destroy'), sample('idle', -1),
    sample('idle', NaN), sample('idle', Infinity), sample('idle', 0, 3)]) {
    assert.throws(() => guardianAtlasAnimation(value));
  }
});

test('presentation does not own clocks, random sources, combat calls or event emitters', async () => {
  const source = await readFile(new URL('../src/game/animation/guardian-atlas-animator.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /requestAnimationFrame|cancelAnimationFrame|setInterval|setTimeout|Date\.now|Math\.random|hitGuardianAtlas|advanceGuardianAtlas/);
});
