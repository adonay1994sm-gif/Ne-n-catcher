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

// Plan F3b, tarea 1: cola por antigüedad. El bucle del juego no pide en orden
// de edad; un enemigo más viejo que espera turno pasa delante.
test('an older waiting enemy gets the next free token before a younger one', () => {
  const tokens = createAttackTokens({max: 1});
  assert.equal(requestAttack(tokens, {id: 'holder', bornAt: 0}, 1), true);
  assert.equal(requestAttack(tokens, {id: 'old', bornAt: 2}, 1), false);
  releaseAttack(tokens, 'holder');
  assert.equal(requestAttack(tokens, {id: 'young', bornAt: 5}, 1.1), false, 'the old one is still waiting');
  assert.equal(requestAttack(tokens, {id: 'old', bornAt: 2}, 1.1), true);
});

test('a waiting entry expires after half a second without asking', () => {
  const tokens = createAttackTokens({max: 1});
  requestAttack(tokens, {id: 'holder', bornAt: 0}, 1);
  requestAttack(tokens, {id: 'old', bornAt: 2}, 1);
  releaseAttack(tokens, 'holder');
  assert.equal(requestAttack(tokens, {id: 'young', bornAt: 5}, 1.6), true);
});

test('forgetting an enemy also removes it from the queue', () => {
  const tokens = createAttackTokens({max: 1});
  requestAttack(tokens, {id: 'holder', bornAt: 0}, 1);
  requestAttack(tokens, {id: 'old', bornAt: 2}, 1);
  forgetEnemy(tokens, 'old'); releaseAttack(tokens, 'holder');
  assert.equal(requestAttack(tokens, {id: 'young', bornAt: 5}, 1.1), true);
});
