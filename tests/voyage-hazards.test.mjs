import test from 'node:test';
import assert from 'node:assert/strict';
import {createVoyageHazardField, advanceVoyageHazardField, largestUpperGap,
  VOYAGE_HAZARD_PROFILES, VOYAGE_HAZARD_RULES} from '../src/game/progression/voyage-hazards.js';

const RADIUS = {meteor: 42, debris: 35, satellite: 46};

// Simula un tramo: las amenazas caen a su velocidad y salen por abajo.
function simulate(stageNumber, seconds, seed = 7) {
  const field = createVoyageHazardField({stageNumber, seed});
  const threats = [], emitted = [];
  let maxLive = 0, minGap = Infinity;
  for (let time = 0; time < seconds; time += .05) {
    for (const item of threats) item.y += item.speed * .05;
    for (let index = threats.length - 1; index >= 0; index--) if (threats[index].y > 1400) threats.splice(index, 1);
    advanceVoyageHazardField(field, .05, threats, hazard => {
      const item = {...hazard, y: -95 - hazard.delayY, r: RADIUS[hazard.type]};
      threats.push(item); emitted.push(item);
    });
    maxLive = Math.max(maxLive, threats.length);
    minGap = Math.min(minGap, largestUpperGap(field, threats));
  }
  return {field, emitted, maxLive, minGap};
}

test('every stage of the voyage has a hazard profile and the field fills a stage instead of leaving it empty', () => {
  for (let stage = 1; stage <= 10; stage++) {
    assert.ok(VOYAGE_HAZARD_PROFILES[stage], `stage ${stage}`);
    const {emitted} = simulate(stage, 36 + VOYAGE_HAZARD_PROFILES[stage].start);
    assert.ok(emitted.length >= 8, `stage ${stage} emitted only ${emitted.length}`);
  }
  assert.ok(simulate(3, 36).emitted.length > simulate(6, 36).emitted.length, 'the debris field is denser than the C9 stage');
});

test('the field never exceeds the stage cap and always leaves a passable gap for the ship', () => {
  for (let stage = 1; stage <= 10; stage++) for (const seed of [1, 99, 4242]) {
    const {maxLive, minGap, field} = simulate(stage, 36, seed);
    assert.ok(maxLive <= VOYAGE_HAZARD_PROFILES[stage].cap, `stage ${stage} live ${maxLive}`);
    assert.ok(minGap >= field.shipWidth + VOYAGE_HAZARD_RULES.gapMargin, `stage ${stage} gap ${minGap}`);
  }
});

test('the first stage leaves a breather after the rupture and the opening stages hit softer', () => {
  // Tramo 1.1: el juego crea el campo con la ruptura (9 s de ruta), así que
  // start cuenta desde ahí: 8 s de respiro, no 8 + 9.
  assert.equal(VOYAGE_HAZARD_PROFILES[1].start, 8);
  for (const seed of [1, 7, 99, 4242]) {
    const {emitted} = simulate(1, VOYAGE_HAZARD_PROFILES[1].start - .1, seed);
    assert.equal(emitted.length, 0, `seed ${seed}`);
  }
  assert.ok(VOYAGE_HAZARD_PROFILES[1].cap <= 2, 'never more than two ambient hazards in 1.1');
  for (let stage = 1; stage <= 10; stage++) {
    const {emitted} = simulate(stage, 40 + VOYAGE_HAZARD_PROFILES[stage].start);
    // 1.1–1.2 a la mitad; 1.3 al 75 % (el pico más duro llegaba demasiado pronto).
    const expected = stage <= 2 ? .5 : stage === 3 ? .75 : 1;
    assert.ok(emitted.every(item => item.damageScale === expected), `stage ${stage}`);
    assert.equal(VOYAGE_HAZARD_PROFILES[stage].start > 0, stage === 1, `only 1.1 waits (stage ${stage})`);
  }
});

test('wrecked ships, satellites and rock are mixed, sometimes in clusters, from varied positions', () => {
  const {emitted} = simulate(3, 72, 11);
  const types = new Set(emitted.map(item => item.type));
  assert.deepEqual([...types].sort(), ['debris', 'meteor', 'satellite']);
  assert.ok(emitted.some(item => item.delayY > 0), 'at least one cluster');
  const columns = new Set(emitted.map(item => Math.floor(item.x / 120)));
  assert.ok(columns.size >= 5, 'positions are spread across the width');
});

test('the same seed reproduces the same field and invalid input is rejected', () => {
  assert.deepEqual(simulate(8, 20, 5).emitted, simulate(8, 20, 5).emitted);
  assert.throws(() => createVoyageHazardField({stageNumber: 11}), RangeError);
  const field = createVoyageHazardField({stageNumber: 1});
  assert.throws(() => advanceVoyageHazardField(field, -1, [], () => {}), RangeError);
  assert.throws(() => advanceVoyageHazardField({}, .05, [], () => {}), TypeError);
});
