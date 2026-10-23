import test from 'node:test';
import assert from 'node:assert/strict';
import {AIMED_METEOR_RULES, createAimedMeteorRain, advanceAimedMeteorRain} from '../src/game/progression/aimed-meteors.js';

// Plan F3b, tarea 9: meteoritos dirigidos a la nave, con aviso y sin pasillo.
const DT = 1 / 60;
function run(state, seconds, player = {x: 300, y: 1050}, moving = false) {
  const events = [];
  let now = 0;
  for (let frame = 0; frame < Math.round(seconds / DT); frame++) {
    now += DT;
    if (moving) player.x = 360 + 250 * Math.sin(now * 1.3);
    advanceAimedMeteorRain(state, DT, player, event => events.push({...event, at: now, ship: {...player}}));
  }
  return events;
}
const pointLineDistance = (p, a, v) => Math.abs((p.x - a.x) * v.vy - (p.y - a.y) * v.vx) / Math.hypot(v.vx, v.vy);

test('each meteor is aimed at where the ship was when it was announced', () => {
  const events = run(createAimedMeteorRain({seed: 4, width: 720, height: 1280, count: 6}), 15, {x: 300, y: 1050}, true);
  const warnings = new Map(events.filter(e => e.type === 'warning').map(e => [e.id, e]));
  const meteors = events.filter(e => e.type === 'meteor');
  assert.equal(meteors.length, 6);
  for (const meteor of meteors) assert.ok(pointLineDistance(warnings.get(meteor.id).ship, meteor, meteor) < 25);
});

test('there is always time to dodge', () => {
  const events = run(createAimedMeteorRain({seed: 9, width: 720, height: 1280, count: 8}), 20);
  const warnings = new Map(events.filter(e => e.type === 'warning').map(e => [e.id, e]));
  for (const meteor of events.filter(e => e.type === 'meteor')) {
    const warning = warnings.get(meteor.id);
    const reach = (warning.ship.y - meteor.y) / meteor.vy;
    assert.ok(meteor.at - warning.at + reach >= 1.2, `reaction ${meteor.at - warning.at + reach}`);
    assert.ok(meteor.at - warning.at >= AIMED_METEOR_RULES.warning - 1e-9);
  }
});

test('meteors are at least 0.6 s apart', () => {
  const meteors = run(createAimedMeteorRain({seed: 2, width: 720, height: 1280, count: 10}), 25).filter(e => e.type === 'meteor');
  for (let index = 1; index < meteors.length; index++) assert.ok(meteors[index].at - meteors[index - 1].at >= .6 - 1e-9);
});

test('the rain ends, and dropping its pending meteors still ends it', () => {
  const state = createAimedMeteorRain({seed: 5, width: 720, height: 1280, count: 4});
  run(state, 2);
  state.pending.length = 0;
  run(state, 20);
  assert.equal(state.done, true);
});
