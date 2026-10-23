import test from 'node:test';
import assert from 'node:assert/strict';
import {createVoyageRoute} from '../src/game/progression/voyage-engine.js';
import {VOYAGES, PLAYABLE_VOYAGES, getVoyageStageRules} from '../src/game/progression/voyages/index.js';
import {SECTOR_MAPS} from '../src/game/progression/sector-map.js';

// Todas las fichas de viaje secundario (todas menos S1-V1) cumplen el mismo
// contrato: se recorren hasta la llegada, guardan y encajan en el mapa.
const SIDE = VOYAGES.filter(ficha => ficha.id !== 'S1-V1');

test('every side voyage card flies to its arrival with one event per stage and its own save key', () => {
  const keys = new Set(VOYAGES.map(ficha => ficha.saveKey)), routes = new Set(VOYAGES.map(ficha => ficha.routeId));
  assert.equal(keys.size, VOYAGES.length); assert.equal(routes.size, VOYAGES.length);
  for (const ficha of SIDE) {
    const route = createVoyageRoute(ficha), voyage = route.create({goal: 36}), events = [];
    assert.equal(ficha.baseGoal, 36, `${ficha.id} matches the level goal`);
    assert.equal(route.stages.at(-1).goal, 36, ficha.id);
    let collected = 0, view = voyage.snapshot();
    for (let step = 0; step < 30000 && !view.canFinish; step++) {
      if (view.waitingFor === 'cronium' || step % 40 === 0) collected = Math.min(36, collected + 1);
      view = voyage.advance(.034, collected, event => events.push(event));
    }
    assert.equal(view.canFinish, true, ficha.id);
    assert.equal(events.filter(event => event.type === 'stage-start').length, route.stageCount, ficha.id);
    assert.equal(new Set(events.map(event => event.id)).size, events.length, ficha.id);
    assert.equal(view.station.visible, false, `${ficha.id} draws no Chronos station`);
    for (let stage = 1; stage <= route.stageCount; stage++) assert.ok(getVoyageStageRules(ficha.routeId, stage), `${ficha.id} tramo ${stage}`);
    for (let index = 1; index < route.stages.length; index++) assert.equal(route.stages[index].origin, route.stages[index - 1].destination, ficha.id);
  }
});

test('the map has a route for every card and the voyages are playable in order', () => {
  const mapped = new Set(Object.values(SECTOR_MAPS).flatMap(map => map.routes.map(route => route.voyage)));
  for (const ficha of VOYAGES) assert.ok(mapped.has(ficha.id), ficha.id);
  assert.deepEqual(PLAYABLE_VOYAGES.map(ficha => ficha.id), ['S1-V1', 'S1-V2', 'S1-V3', 'S1-V4', 'S1-V5', 'S2-V1', 'S2-V2', 'S2-V3', 'S2-V4', 'S2-V5']);
  for (const ficha of VOYAGES.filter(item => item.sector === 2)) assert.equal(ficha.planet, 'volcanico', `${ficha.id} flies towards Vulkar`);
  assert.deepEqual(VOYAGES.filter(ficha => ficha.boss === 'atlas').map(ficha => ficha.id), ['S1-V5'], 'Atlas guards the end of the sector');
});
