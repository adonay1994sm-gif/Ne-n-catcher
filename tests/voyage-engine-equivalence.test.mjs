import test from 'node:test';
import assert from 'node:assert/strict';
import * as current from '../src/game/progression/chronos-flight.js';
import * as reference from './fixtures/chronos-voyage-v2-reference.mjs';

// Motor de viaje por fichas: el viaje 1 debe comportarse EXACTAMENTE como el
// motor original (copia congelada en tests/fixtures). Se recorren partidas
// simuladas con la misma entrada en los dos y se compara todo lo observable.

const seeded = seed => () => {
  seed = (seed + 0x6D2B79F5) >>> 0;
  let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
  value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
};

function play(module, {seed, goal, checkpoint = null, steps = 16000}) {
  const random = seeded(seed);
  const voyage = module.createChronosVoyage({goal, checkpoint});
  const trace = [];
  let collected = checkpoint?.collected || 0;
  for (let step = 0; step < steps; step++) {
    const events = [];
    const roll = random();
    if (roll < .002) {
      trace.push(['service', voyage.resolveService(event => events.push(event)), events.slice()]);
      continue;
    }
    if (roll < .004) { trace.push(['checkpoint', voyage.exportCheckpoint()]); continue; }
    if (random() < .03) collected = Math.min(goal, collected + 1 + Math.floor(random() * 3));
    const dt = random() < .01 ? 0 : random() * .06;
    const view = voyage.advance(dt, collected, event => events.push(event));
    trace.push(['advance', view, events]);
    if (view.waitingFor === 'service' && random() < .2) {
      const serviceEvents = [];
      trace.push(['service', voyage.resolveService(event => serviceEvents.push(event)), serviceEvents]);
    }
    if (view.canFinish) break;
  }
  trace.push(['final', voyage.snapshot(), voyage.exportCheckpoint()]);
  return trace;
}

test('the voyage engine reproduces the original Chronos voyage step by step', () => {
  for (const [seed, goal] of [[1, 36], [7, 36], [42, 36], [99, 72], [1234, 12], [5, 1]]) {
    assert.deepEqual(play(current, {seed, goal}), play(reference, {seed, goal}), `seed ${seed}, goal ${goal}`);
  }
});

test('checkpoints, entry helpers and restored voyages stay identical', () => {
  assert.deepEqual(current.CHRONOS_VOYAGE_STAGES, reference.CHRONOS_VOYAGE_STAGES);
  assert.equal(current.CHRONOS_VOYAGE_MIN_DURATION, reference.CHRONOS_VOYAGE_MIN_DURATION);
  for (const name of ['CHRONOS_VOYAGE_VERSION', 'CHRONOS_VOYAGE_KEY', 'CHRONOS_VOYAGE_ROUTE_ID']) assert.equal(current[name], reference[name]);
  for (let stage = 1; stage <= 10; stage++) for (const goal of [36, 72]) {
    const a = current.createChronosVoyageCheckpoint(stage, {goal}), b = reference.createChronosVoyageCheckpoint(stage, {goal});
    assert.deepEqual(a, b);
    assert.deepEqual(current.normalizeChronosVoyageCheckpoint(b, {goal}), reference.normalizeChronosVoyageCheckpoint(b, {goal}));
    assert.deepEqual(play(current, {seed: stage, goal, checkpoint: b, steps: 3000}), play(reference, {seed: stage, goal, checkpoint: b, steps: 3000}));
  }
  // Partidas guardadas esperando a C9 (y las antiguas) se restauran igual.
  const waiting = {...reference.createChronosVoyageCheckpoint(6, {goal: 36}), serviceWaiting: true,
    collected: 20, eventIds: [...reference.createChronosVoyageCheckpoint(6, {goal: 36}).eventIds,
      'chronos-voyage:1.6:start', 'chronos-voyage:1.6:checkpoint', 'chronos-voyage:1.6:complete']};
  assert.deepEqual(current.normalizeChronosVoyageCheckpoint(waiting), reference.normalizeChronosVoyageCheckpoint(waiting));
  assert.deepEqual(play(current, {seed: 3, goal: 36, checkpoint: waiting, steps: 2000}),
    play(reference, {seed: 3, goal: 36, checkpoint: waiting, steps: 2000}));
  for (const bad of [null, {}, {version: 1}, {...waiting, stageNumber: 11}, {...waiting, stageId: '2.6'},
    {...waiting, eventIds: ['otro']}, {...waiting, routeId: 'otra-ruta'}, {...waiting, collected: -1}]) {
    assert.deepEqual(current.normalizeChronosVoyageCheckpoint(bad), reference.normalizeChronosVoyageCheckpoint(bad));
  }
  for (const [stage, options] of [[0, {}], [11, {}], [2, {collected: 0}], [1, {goal: 0}]]) {
    assert.throws(() => current.createChronosVoyageCheckpoint(stage, options), RangeError);
  }
});
