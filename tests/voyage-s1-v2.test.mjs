import test from 'node:test';
import assert from 'node:assert/strict';
import {createVoyageRoute} from '../src/game/progression/voyage-engine.js';
import {S1_V2_GAIA_OUTER_NET as FICHA} from '../src/game/progression/voyages/s1-v2-gaia-outer-net.js';
import {getVoyageStageRules, PLAYABLE_VOYAGES} from '../src/game/progression/voyages/index.js';

const route = createVoyageRoute(FICHA);

function fly(goal = FICHA.baseGoal) {
  const voyage = route.create({goal}), events = [];
  let collected = 0, view = voyage.snapshot();
  for (let step = 0; step < 20000 && !view.canFinish; step++) {
    if (view.waitingFor === 'cronium' || step % 40 === 0) collected = Math.min(goal, collected + 1);
    view = voyage.advance(.034, collected, event => events.push(event));
  }
  return {voyage, view, events};
}

test('S1-V2 is seven stages from the outer beacon to the satellite ring with no C9 stop', () => {
  assert.equal(route.stageCount, 7);
  assert.equal(route.stages[0].origin, 'Baliza exterior de Gaia');
  assert.equal(route.stages.at(-1).destination, 'Anillo de satélites');
  assert.equal(FICHA.service, null);
  assert.ok(route.minDuration >= 200 && route.minDuration <= 260, `${route.minDuration} s`);
  for (let index = 1; index < route.stages.length; index++) {
    assert.equal(route.stages[index].origin, route.stages[index - 1].destination);
    assert.ok(route.stages[index].goal > route.stages[index - 1].goal);
  }
});

test('the engine flies S1-V2 to its arrival, firing every stage once and the Gaia warning', () => {
  const {view, events} = fly();
  assert.equal(view.canFinish, true);
  assert.equal(view.waitingFor, null);
  const ids = events.map(event => event.id);
  assert.equal(new Set(ids).size, ids.length, 'no event fires twice');
  assert.ok(ids.includes('s1-v2-gaia-beacon') && ids.includes('s1-v2-arrival'));
  assert.equal(events.filter(event => event.type === 'stage-start').length, 7);
  assert.equal(view.station.visible, false, 'Chronos is far behind');
  assert.ok(view.planet.scale > .6, 'Gaia fills the sky on arrival');
});

test('checkpoints restore S1-V2 mid-route and reject other routes', () => {
  const checkpoint = route.createCheckpoint(4, {goal: 30});
  assert.deepEqual(route.normalizeCheckpoint(checkpoint), checkpoint);
  assert.equal(route.create({goal: 30, checkpoint}).snapshot().stageNumber, 4);
  assert.equal(route.normalizeCheckpoint({...checkpoint, routeId: 'chronos-to-gaia'}), null);
});

test('every S1-V2 stage has its own encounter rules and the card is not playable yet', () => {
  for (let stage = 1; stage <= 7; stage++) assert.ok(getVoyageStageRules('gaia-outer-net', stage), `tramo ${stage}`);
  assert.equal(getVoyageStageRules('gaia-outer-net', 8), null);
  assert.equal(PLAYABLE_VOYAGES.some(ficha => ficha.id === 'S1-V2'), false);
});
