import test from 'node:test';
import assert from 'node:assert/strict';
import {GAIA_ENEMY_RULES, createGaiaEnemy, advanceGaiaEnemy} from '../src/game/combat/gaia-enemies.js';
import {createAttackTokens, requestAttack} from '../src/game/combat/attack-tokens.js';

// Plan F3b: enemigos nuevos de Gaia (biblia §3.1) sobre la IA de perfiles.
const DT = 1 / 60, BOUNDS = {w: 720, h: 1280};

function spawn(kind, {x = 360, y = 300, id = kind} = {}) {
  const gaia = createGaiaEnemy({kind, x, y, now: 0});
  return {id, x, y, hp: gaia.hp, maxHp: gaia.maxHp, gaia};
}

function sim(item, seconds, {player = {x: 360, y: 1050}, tokens = createAttackTokens({max: 2}), allies = [], onStep} = {}) {
  const events = [], warnings = [];
  let now = 0, wasPending = false;
  for (let frame = 0; frame < Math.round(seconds / DT); frame++) {
    now += DT;
    advanceGaiaEnemy(item, DT, {now, player: {...player, hull: 100, reloading: false}, bounds: BOUNDS,
      allies: [item, ...allies], tokens}, event => events.push({...event, at: now}));
    if (item.gaia.pending && !wasPending) warnings.push({at: now, aim: {...item.gaia.aim}, ability: item.gaia.pending});
    wasPending = Boolean(item.gaia.pending);
    onStep?.(now, item);
  }
  return {events, warnings};
}

const pointLineDistance = (p, a, v) => Math.abs((p.x - a.x) * v.vy - (p.y - a.y) * v.vx) / Math.hypot(v.vx, v.vy);

test('the tracker enters from below and stays behind the ship', () => {
  const item = spawn('tracker', {y: 1320}), player = {x: 360, y: 1050};
  sim(item, 4, {player});
  assert.ok(item.y > player.y, `y=${item.y}`);
});

test('the tracker warns before shooting upward at the ship', () => {
  const item = spawn('tracker', {y: 1320}), player = {x: 300, y: 1050};
  const {events, warnings} = sim(item, 8, {player});
  const shot = events.find(event => event.type === 'shot');
  assert.ok(shot, 'it shoots');
  const warning = warnings.filter(w => w.ability === 'basic' && w.at <= shot.at).at(-1);
  assert.ok(shot.at - warning.at >= GAIA_ENEMY_RULES.tracker.warning - 1e-9);
  assert.ok(shot.vy < 0, 'upward');
  assert.ok(pointLineDistance(warning.aim, shot, shot) < 30);
});

test('the tracker marks the ship every 9 seconds', () => {
  const item = spawn('tracker', {y: 1320});
  const marks = sim(item, 30).events.filter(event => event.type === 'mark');
  assert.ok(marks.length >= 2);
  assert.equal(marks[0].seconds, 4);
  for (let index = 1; index < marks.length; index++) assert.ok(marks[index].at - marks[index - 1].at >= 9 - 1e-9);
});

test('it never attacks without a token', () => {
  const tokens = createAttackTokens({max: 1});
  requestAttack(tokens, {id: 'other', bornAt: -1}, 0);
  const item = spawn('tracker', {y: 1320});
  const {events} = sim(item, 10, {tokens});
  assert.equal(events.filter(event => event.type === 'shot').length, 0);
});

test('same seed, same events', () => {
  const a = sim(spawn('tracker', {y: 1320}), 12).events, b = sim(spawn('tracker', {y: 1320}), 12).events;
  assert.deepEqual(a, b);
});
