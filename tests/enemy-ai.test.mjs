import test from 'node:test';
import assert from 'node:assert/strict';
import {ENEMY_AI_PROFILES, decideEnemyIntent, decideEnemyIntents} from '../src/game/combat/enemy-ai.js';
import {createAttackTokens, requestAttack, attackHolders} from '../src/game/combat/attack-tokens.js';

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const enemy = (profile, extra = {}) => ({id: profile, profile, x: 360, y: 300, hp: 3, maxHp: 3, bornAt: 0,
  cooldowns: {basic: 0, unique: 0}, ...extra});
const ctx = (extra = {}) => ({now: 10, player: {x: 360, y: 1000, hull: 80, ammo: 10, maxAmmo: 20, reloading: false},
  allies: [], tokens: createAttackTokens({max: 3}), bounds: {w: 720, h: 1280}, ...extra});
const target = intent => ({x: intent.targetX, y: intent.targetY});

test('there are six profiles', () => {
  assert.deepEqual(Object.keys(ENEMY_AI_PROFILES).sort(), ['ambusher', 'artillery', 'escort', 'hunter', 'miner', 'opportunist']);
});

test('hunter closes in on the player', () => {
  const e = enemy('hunter'), c = ctx();
  assert.ok(dist(target(decideEnemyIntent(e, c)), c.player) < dist(e, c.player));
});

test('artillery keeps its distance', () => {
  const near = ctx({player: {...ctx().player, x: 360, y: 450}});
  const e = enemy('artillery');
  assert.ok(dist(target(decideEnemyIntent(e, near)), near.player) > dist(e, near.player));
  const far = ctx({player: {...ctx().player, x: 360, y: 900}});
  assert.ok(dist(target(decideEnemyIntent(e, far)), e) < 1);
});

test('escort stays beside the weakest ally', () => {
  const strong = enemy('hunter', {id: 's', x: 100, y: 200}), weak = enemy('hunter', {id: 'w', x: 600, y: 250, hp: 1});
  const intent = decideEnemyIntent(enemy('escort'), ctx({allies: [strong, weak]}));
  assert.ok(dist(target(intent), weak) < 90);
});

test('opportunist only attacks when the player reloads or is below 35 hull', () => {
  const e = enemy('opportunist');
  assert.equal(decideEnemyIntent(e, ctx()).attack, false);
  assert.equal(decideEnemyIntent(e, ctx({player: {...ctx().player, reloading: true}})).attack, true);
  assert.equal(decideEnemyIntent(e, ctx({player: {...ctx().player, hull: 30}})).attack, true);
});

test('ambusher enters from below and aims upwards', () => {
  const e = enemy('ambusher', {y: 1200}), c = ctx();
  const t = target(decideEnemyIntent(e, c));
  assert.ok(t.y > c.player.y, 'stays below the player');
  assert.ok(dist(t, c.player) < dist(e, c.player));
});

test('miner crosses the bottom third and drops mines', () => {
  const intent = decideEnemyIntent(enemy('miner', {y: 1000}), ctx());
  assert.ok(intent.targetY >= 1280 * 2 / 3);
  assert.equal(intent.ability, 'unique');
});

test('no attack without a token', () => {
  const tokens = createAttackTokens({max: 1});
  requestAttack(tokens, {id: 'other', bornAt: -5}, 9);
  for (const profile of Object.keys(ENEMY_AI_PROFILES)) {
    const intent = decideEnemyIntent(enemy(profile, {y: 1000}), ctx({tokens, player: {...ctx().player, reloading: true}}));
    assert.equal(intent.attack, false, profile);
  }
});

test('abilities respect their cooldowns', () => {
  for (const profile of Object.keys(ENEMY_AI_PROFILES)) {
    const intent = decideEnemyIntent(enemy(profile, {y: 1000, cooldowns: {basic: 99, unique: 99}}), ctx({player: {...ctx().player, reloading: true}}));
    assert.equal(intent.ability, null, profile);
    assert.equal(intent.attack, false, profile);
  }
});

test('the same game time gives the same decision (no wall clock)', () => {
  const e = enemy('hunter'), a = decideEnemyIntent(e, ctx()), b = decideEnemyIntent(e, ctx());
  assert.deepEqual(a, b);
});

test('in one frame the longest-surviving enemy wins and never more than max attack', () => {
  const tokens = createAttackTokens({max: 1}), c = ctx({tokens});
  const young = enemy('hunter', {id: 'young', bornAt: 8}), old = enemy('hunter', {id: 'old', bornAt: 1});
  const [a, b] = decideEnemyIntents([young, old], c);
  assert.deepEqual([a.attack, b.attack], [false, true]);
  assert.deepEqual(attackHolders(tokens), ['old']);
});

test('after a long pause a crowd of ready enemies still respects max', () => {
  const tokens = createAttackTokens({max: 2}), c = ctx({tokens, now: 500});
  const crowd = [1, 2, 3, 4, 5].map(i => enemy('hunter', {id: `h${i}`, bornAt: i}));
  assert.equal(decideEnemyIntents(crowd, c).filter(intent => intent.attack).length, 2);
});

test('an enemy that no longer wants to attack gives its token back', () => {
  const tokens = createAttackTokens({max: 1});
  const opp = enemy('opportunist', {id: 'opp'});
  decideEnemyIntent(opp, ctx({tokens, player: {...ctx().player, reloading: true}}));
  decideEnemyIntent(opp, ctx({tokens, now: 11}));
  assert.equal(decideEnemyIntent(enemy('hunter', {id: 'hun'}), ctx({tokens, now: 11})).attack, true);
});

test('miner crosses the screen from side to side', () => {
  let m = enemy('miner', {x: 100, y: 1000, cooldowns: {basic: 99, unique: 99}});
  const seen = [];
  for (let i = 0; i < 60; i++) {
    const intent = decideEnemyIntent(m, ctx());
    const step = Math.sign(intent.targetX - m.x) * Math.min(40, Math.abs(intent.targetX - m.x));
    m = {...m, x: m.x + step, heading: intent.heading};
    seen.push(m.x);
  }
  assert.ok(Math.max(...seen) > 620, `reaches the right edge (max ${Math.max(...seen)})`);
  assert.ok(seen.slice(30).some(x => x < 200), 'comes back to the left edge');
});

// Plan F3b, tarea 4: la Escolta dice a quién protege.
test('the escort intent names the ally it guards', () => {
  const weak = {id: 'weak', x: 200, y: 300, hp: 1, maxHp: 4}, strong = {id: 'strong', x: 500, y: 300, hp: 4, maxHp: 4};
  const e = enemy('escort'), intent = decideEnemyIntent(e, ctx({allies: [e, weak, strong]}));
  assert.equal(intent.guardId, 'weak');
  assert.equal(decideEnemyIntent(e, ctx({allies: [e]})).guardId, null);
});
