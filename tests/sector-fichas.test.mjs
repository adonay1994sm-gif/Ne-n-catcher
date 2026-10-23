import test from 'node:test';
import assert from 'node:assert/strict';
import {createVoyageRoute} from '../src/game/progression/voyage-engine.js';
import {S1_GAIA} from '../src/game/progression/sectors/s1-gaia.js';
import {SECTORS, getSectorFicha} from '../src/game/progression/sectors/index.js';

test('the sector 1 route has ten stages of 45 to 60 seconds', () => {
  const route = createVoyageRoute(S1_GAIA);
  assert.equal(route.stageCount, 10);
  for (const stage of route.stages) assert.ok(stage.duration >= 45 && stage.duration <= 60, `${stage.name}: ${stage.duration}s`);
});

test('the sub-boss fights in stage 5 and the boss in stage 10', () => {
  assert.deepEqual(S1_GAIA.encounters[4].boss, {id: 'ch03', role: 'subjefe'});
  assert.deepEqual(S1_GAIA.encounters[9].boss, {id: 'guardian-atlas', role: 'jefe'});
  S1_GAIA.encounters.forEach((rules, index) => {
    if (index !== 4 && index !== 9) assert.equal(rules.boss, null, `stage ${index + 1}`);
  });
});

test('C9 docks at the start of stage 6 with only the entry quota', () => {
  assert.equal(S1_GAIA.service.stage, 6);
  const route = createVoyageRoute(S1_GAIA), voyage = route.create({goal: 60});
  const entry = route.stages[4].goal; // cuota para entrar al tramo 6
  let view = voyage.snapshot();
  for (let i = 0; i < 40000 && view.stageNumber < 6; i++) view = voyage.advance(.034, entry);
  assert.equal(view.stageNumber, 6);
  for (let t = 0; t < 1.5 && view.waitingFor !== 'service'; t += .034) view = voyage.advance(.034, entry);
  assert.equal(view.waitingFor, 'service');
});

test('stages 1 to 4 bring in the new Gaia profiles before the sub-boss', () => {
  const early = new Set(S1_GAIA.encounters.slice(0, 4).flatMap(rules => rules.patrol ? [...rules.patrol.roster] : []));
  for (const id of ['tracker', 'sower', 'aegis']) assert.ok(early.has(id), id);
});

test('sectors are found by id', () => {
  assert.equal(getSectorFicha('S1'), S1_GAIA);
  assert.equal(getSectorFicha('S9'), null);
  assert.ok(SECTORS.includes(S1_GAIA));
});
