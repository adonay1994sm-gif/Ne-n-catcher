import test from 'node:test';
import assert from 'node:assert/strict';
import {createClassicPursuer, advanceClassicPursuer} from '../src/game/combat/classic-pursuit.js';
import {createAttackTokens, attackHolders} from '../src/game/combat/attack-tokens.js';

// Plan F3b, tarea 1: los perseguidores respetan los turnos de ataque del sector.
const DT = .02;
const enemyAt = (id, x, seed) => ({id, type: 'scout', x, y: -85, s: 150, r: 38, hp: 2, maxHp: 2,
  classicScout: createClassicPursuer({x, role: 'raider', seed, width: 720, height: 1280, minAttackY: 135})});

function run(items, seconds, {tokens, player = {x: 360, y: 1080}, onStep = () => {}} = {}) {
  const shots = [];
  let now = 0;
  for (let frame = 0; frame < seconds / DT; frame++) {
    now += DT;
    for (let index = items.length - 1; index >= 0; index--) {
      const item = items[index];
      item.y += item.s * DT;
      advanceClassicPursuer(item, DT, player, shot => shots.push({...shot, owner: item.id}), tokens ? {tokens, now} : null);
    }
    onStep(now);
  }
  return shots;
}

test('with one token only one pursuer charges at a time', () => {
  const tokens = createAttackTokens({max: 1}), items = [enemyAt('a', 210, 1), enemyAt('b', 510, 2)];
  let worst = 0;
  const shots = run(items, 20, {tokens, onStep: () => {
    worst = Math.max(worst, items.filter(item => ['charge', 'fire'].includes(item.classicScout.state)).length);
  }});
  assert.equal(worst, 1);
  assert.ok(new Set(shots.map(shot => shot.owner)).size === 2, 'both get their turn');
});

test('the token is released when the pursuer fires, retreats or dies', () => {
  const tokens = createAttackTokens({max: 1}), item = enemyAt('a', 360, 3);
  let held = false;
  run([item], 20, {tokens, onStep: () => {
    if (attackHolders(tokens).includes('a')) held = true;
    if (item.classicScout.state === 'reposition') assert.ok(!attackHolders(tokens).includes('a'), 'free while repositioning');
  }});
  assert.ok(held, 'it did attack');
  item.hp = 0;
  run([item], .1, {tokens});
  assert.deepEqual(attackHolders(tokens), []);
});

test('with tokens there is no escalation', () => {
  const tokens = createAttackTokens({max: 2}), item = enemyAt('a', 360, 4);
  run([item], 30, {tokens});
  assert.equal(item.classicScout.intensity, 0);
});

test('a long pause does not make anyone fire', () => {
  const tokens = createAttackTokens({max: 2}), item = enemyAt('a', 360, 5);
  run([item], 3, {tokens});
  const shots = [];
  for (let frame = 0; frame < 600; frame++) advanceClassicPursuer(item, 0, {x: 360, y: 1080}, shot => shots.push(shot), {tokens, now: 3});
  assert.equal(shots.length, 0);
});

// Plan F3b, tarea 2: abanicos abiertos (spec 6.10).
test('an open fan fires five shots across about 68 degrees', () => {
  const fans = [];
  for (const seed of [3, 21, 58, 90]) {
    const item = enemyAt('fan', 360, seed), bySerial = new Map();
    for (const shot of run([item], 60)) bySerial.set(shot.attackSerial, [...(bySerial.get(shot.attackSerial) || []), shot]);
    fans.push(...[...bySerial.values()].filter(volley => volley[0].volley === 'spread'));
  }
  assert.ok(fans.length > 0, 'some fans were fired');
  for (const fan of fans) {
    assert.equal(fan.length, 5);
    const angles = fan.map(shot => Math.atan2(shot.vx, shot.vy));
    assert.ok(Math.max(...angles) - Math.min(...angles) >= 1.15, `span ${Math.max(...angles) - Math.min(...angles)}`);
    for (const shot of fan) assert.ok(shot.vy > 0);
  }
});
