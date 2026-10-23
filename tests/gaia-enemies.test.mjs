import test from 'node:test';
import assert from 'node:assert/strict';
import {GAIA_ENEMY_RULES, createGaiaEnemy, advanceGaiaEnemy, advanceMine, advanceCrossBomb} from '../src/game/combat/gaia-enemies.js';
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

// Tarea 5: Sembrador, minas y bomba en cruz.
test('the sower crosses the lower lane from edge to edge', () => {
  const item = spawn('sower', {x: 80, y: 1000});
  let minX = Infinity, maxX = -Infinity, worstY = 0;
  sim(item, 12, {onStep: (now, it) => {
    if (now < 2) return;
    minX = Math.min(minX, it.x); maxX = Math.max(maxX, it.x);
    worstY = Math.max(worstY, Math.abs(it.y - .78 * BOUNDS.h));
  }});
  assert.ok(minX <= 100 && maxX >= 620, `${minX}..${maxX}`);
  assert.ok(worstY <= 40, `drifts ${worstY}`);
});

test('the sower drops a mine every 2.2 seconds', () => {
  const mines = sim(spawn('sower', {x: 80, y: 1000}), 12).events.filter(event => event.type === 'mine');
  assert.ok(mines.length >= 3);
  for (let index = 1; index < mines.length; index++) assert.ok(mines[index].at - mines[index - 1].at >= 2.2 - 1e-9);
});

test('a mine arms after 0.8 s and only explodes near the ship', () => {
  const near = {x: 360, y: 1000, age: 0, armed: false}, far = {x: 360, y: 1000, age: 0, armed: false};
  const results = [];
  for (let t = 0; t < 7.2; t += DT) {
    results.push([t, advanceMine(near, DT, {x: 420, y: 1000}), advanceMine(far, DT, {x: 460, y: 1000})]);
  }
  const boom = results.find(([, result]) => result === 'explode');
  assert.ok(boom && boom[0] >= .8 - DT, `explodes at ${boom?.[0]}`);
  assert.ok(!results.some(([, , result]) => result === 'explode'), 'a mine 100 px away never explodes');
  assert.ok(results.some(([t, , result]) => result === 'expire' && t >= 7 - 2 * DT));
});

test('the cross bomb bursts into three rays at the edge', () => {
  const bomb = {x: 100, y: 900, vx: -300};
  let rays = null;
  for (let frame = 0; frame < 120 && !rays; frame++) rays = advanceCrossBomb(bomb, DT, BOUNDS);
  assert.equal(rays.length, 3);
  assert.ok(rays.some(ray => ray.vx > 0 && ray.vy === 0), 'inward');
  assert.ok(rays.some(ray => ray.vy < 0 && ray.vx === 0), 'up');
  assert.ok(rays.some(ray => ray.vy > 0 && ray.vx === 0), 'down');
  for (const ray of rays) assert.ok(ray.x <= 1 && ray.damage > 0);
});

test('the sower throws its cross bomb toward the nearest edge', () => {
  const bombs = sim(spawn('sower', {x: 80, y: 1000}), 12).events.filter(event => event.type === 'cross-bomb');
  assert.ok(bombs.length >= 1);
  for (const bomb of bombs) assert.equal(Math.sign(bomb.vx), bomb.x < BOUNDS.w / 2 ? -1 : 1);
});

// Tarea 6: Égida y Alfa.
test('the aegis follows the weakest ally and shields it', () => {
  const item = spawn('aegis', {x: 600, y: 300});
  const weak = {id: 'weak', x: 200, y: 400, hp: 2, maxHp: 4}, strong = {id: 'strong', x: 500, y: 300, hp: 4, maxHp: 4};
  const start = Math.hypot(item.x - weak.x, item.y - weak.y);
  const shields = sim(item, 20, {allies: [weak, strong]}).events.filter(event => event.type === 'shield');
  assert.ok(Math.hypot(item.x - weak.x, item.y - weak.y) < start);
  assert.ok(shields.length >= 2);
  assert.deepEqual({targetId: shields[0].targetId, hits: shields[0].hits}, {targetId: 'weak', hits: 3});
  for (let index = 1; index < shields.length; index++) assert.ok(shields[index].at - shields[index - 1].at >= 8 - 1e-9);
});

test('the aegis never shoots and needs no token', () => {
  const tokens = createAttackTokens({max: 1});
  requestAttack(tokens, {id: 'other', bornAt: -1}, 0);
  const {events} = sim(spawn('aegis'), 12, {tokens, allies: [{id: 'ally', x: 300, y: 300, hp: 1, maxHp: 2}]});
  assert.ok(events.some(event => event.type === 'shield'));
  assert.ok(!events.some(event => event.type === 'shot'));
});

test('the alpha keeps 320 px above the ship', () => {
  const player = {x: 360, y: 1050};
  sim(spawn('alpha', {y: 200}), 12, {player, onStep: (now, it) => assert.ok(it.y <= player.y - 320 + 1e-9, `y=${it.y}`)});
});

test('the alpha fires four parallel cannons', () => {
  const shots = sim(spawn('alpha', {y: 200}), 6).events.filter(event => event.type === 'shot');
  const first = shots.filter(shot => shot.at === shots[0].at);
  assert.equal(first.length, 4);
  const xs = first.map(shot => shot.x).sort((a, b) => a - b);
  for (const shot of first) assert.equal(shot.vx, 0);
  for (let index = 1; index < xs.length; index++) assert.ok(Math.abs(xs[index] - xs[index - 1] - 28) < 1e-9);
});

test('the alpha cross volley has eight shots', () => {
  const shots = sim(spawn('alpha', {y: 200}), 12).events.filter(event => event.type === 'shot');
  const volleys = new Map();
  for (const shot of shots) volleys.set(shot.at, [...(volleys.get(shot.at) || []), shot]);
  const cross = [...volleys.values()].find(volley => volley.length === 8);
  assert.ok(cross, 'a cross volley was fired');
  assert.equal(new Set(cross.map(shot => Math.atan2(shot.vy, shot.vx).toFixed(3))).size, 8);
});
