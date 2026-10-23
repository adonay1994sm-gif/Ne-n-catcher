import test from 'node:test';
import assert from 'node:assert/strict';
import {createAttackTokens, requestAttack, releaseAttack, forgetEnemy, attackHolders} from '../src/game/combat/attack-tokens.js';

test('never grants more than max tokens', () => {
  const tokens = createAttackTokens({max: 2});
  for (const [id, bornAt] of [['a', 1], ['b', 2], ['c', 3]]) requestAttack(tokens, {id, bornAt}, 10);
  assert.equal(attackHolders(tokens).length, 2);
});

test('a granted token is never taken away by a later request', () => {
  const tokens = createAttackTokens({max: 1});
  requestAttack(tokens, {id: 'a', bornAt: 5}, 10);
  assert.equal(requestAttack(tokens, {id: 'b', bornAt: 1}, 10), false);
  assert.deepEqual(attackHolders(tokens), ['a']);
});

test('a dead holder frees its token at once', () => {
  const tokens = createAttackTokens({max: 1});
  requestAttack(tokens, {id: 'b', bornAt: 1}, 10);
  forgetEnemy(tokens, 'b');
  assert.equal(requestAttack(tokens, {id: 'c', bornAt: 4}, 10), true);
});

test('a finished attack frees its token', () => {
  const tokens = createAttackTokens({max: 1});
  requestAttack(tokens, {id: 'a', bornAt: 1}, 10);
  releaseAttack(tokens, 'a');
  assert.equal(requestAttack(tokens, {id: 'c', bornAt: 4}, 11), true);
});

test('asking twice does not take two tokens', () => {
  const tokens = createAttackTokens({max: 3});
  requestAttack(tokens, {id: 'a', bornAt: 1}, 10);
  assert.equal(requestAttack(tokens, {id: 'a', bornAt: 1}, 10.2), true);
  assert.equal(attackHolders(tokens).length, 1);
});
