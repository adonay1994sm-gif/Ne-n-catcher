import test from 'node:test';
import assert from 'node:assert/strict';
import {getVoyageStageRules, getVoyageFicha, VOYAGES} from '../src/game/progression/voyages/index.js';
import {VOYAGE_HAZARD_PROFILES} from '../src/game/progression/voyage-hazards.js';

// Las reglas de cada tramo del viaje 1 salen ahora de su ficha. Deben ser
// exactamente las fórmulas que estaban escritas a mano en el bucle de juego.
const original = n => ({
  patrol: [5, 6].includes(n) ? null : {
    cap: n === 1 ? 1 : [3, 8, 9, 10].includes(n) ? 3 : 2,
    roster: n <= 2 ? ['raider'] : n <= 4 ? ['raider', 'scout', 'raider']
      : n <= 8 ? ['scout', 'raider', 'interceptor'] : ['interceptor', 'raider', 'scout', 'interceptor'],
    gap: n < 3 ? 9 : n >= 9 ? 6 : 8
  },
  comets: [5, 9].includes(n),
  repairAt: [4, 8].includes(n) ? 15 : null
});

test('the S1-V1 card reproduces the hand-written stage rules of the original voyage', () => {
  for (let n = 1; n <= 10; n++) {
    const rules = getVoyageStageRules('chronos-to-gaia', n);
    const {hazards, ...rest} = rules;
    assert.deepEqual(JSON.parse(JSON.stringify(rest)), original(n), `tramo ${n}`);
    assert.equal(hazards, VOYAGE_HAZARD_PROFILES[n], `peligros del tramo ${n}`);
  }
});

test('unknown routes or stages have no rules and every card has one rule per stage', () => {
  assert.equal(getVoyageStageRules('otra-ruta', 1), null);
  assert.equal(getVoyageStageRules('chronos-to-gaia', 11), null);
  assert.equal(getVoyageFicha('otra-ruta'), null);
  for (const ficha of VOYAGES) assert.equal(ficha.encounters.length, ficha.stages.length, ficha.id);
});
