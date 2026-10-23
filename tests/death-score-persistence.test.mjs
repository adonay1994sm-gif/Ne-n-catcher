import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createStorageService} from '../src/core/storage-service.js';

const source = await readFile(new URL('../src/game/03-ui-game-flow.js', import.meta.url), 'utf8');
const fn = source.match(/  function saveScore\(\) \{[\s\S]*?\n  \}/)?.[0];
assert.ok(fn, 'Actual runtime death-score function found');
const invoke = new Function('storage', 'KEYS', 'score', 'currentLevel', `${fn}\nreturn saveScore();`);
const K = {best: 'neon-best-v2', levelBest: 'neon-level-best-v2'};
function fixture({best = '9000', levels = '{"1":9000,"2":444}', score = 100,
  level = 0, denied = [], failWrite = null} = {}) {
  const values = new Map([['neon-n7-best-v1', '2037']]), reads = [], writes = [];
  if (best !== null) values.set(K.best, best);
  if (levels !== null) values.set(K.levelBest, levels);
  const before = new Map(values);
  const storage = createStorageService({getItem(key) {
    reads.push(key); if (denied.includes(key)) throw new Error('Injected denied score read');
    return values.get(key) ?? null;
  }, setItem(key, value) {
    if (key === failWrite) throw new Error('Injected denied score write');
    writes.push({key, value}); values.set(key, String(value));
  }});
  const result = invoke(storage, K, score, level);
  return {result, values, before, reads, writes};
}

test('death preserves current best 9000 if its read fails while score 100 and writes remain available', () => {
  const result = fixture({denied: [K.best]});
  assert.equal(result.result, false); assert.deepEqual(result.values, result.before);
  assert.deepEqual(result.writes, []); assert.deepEqual(result.reads, [K.best, K.levelBest]);
});

test('death preserves all per-level scores when their read is denied and a higher new score exists', () => {
  const result = fixture({score: 12000, denied: [K.levelBest]});
  assert.equal(result.result, false); assert.deepEqual(result.values, result.before);
  assert.deepEqual(result.writes, []); assert.deepEqual(result.reads, [K.best, K.levelBest]);
});

test('both denied reads abort without writing defaults', () => {
  const result = fixture({denied: [K.best, K.levelBest], score: 12000});
  assert.equal(result.result, false); assert.deepEqual(result.values, result.before);
  assert.deepEqual(result.reads, [K.best, K.levelBest]); assert.deepEqual(result.writes, []);
});

test('a new death-run record updates both maxima without losing another level or N-7 data', () => {
  const result = fixture({score: 12000});
  assert.equal(result.result, true); assert.equal(result.values.get(K.best), '12000');
  assert.deepEqual(JSON.parse(result.values.get(K.levelBest)), {'1': 12000, '2': 444});
  assert.equal(result.values.get('neon-n7-best-v1'), '2037');
  assert.deepEqual(result.reads, [K.best, K.levelBest]); assert.equal(result.writes.length, 2);
});

test('equal and lower scores cause no writes and preserve legacy bytes', () => {
  for (const score of [100, 9000]) {
    const result = fixture({score}); assert.equal(result.result, true);
    assert.deepEqual(result.values, result.before); assert.deepEqual(result.writes, []);
  }
});

test('a per-level improvement can be saved without lowering the higher global best', () => {
  const result = fixture({level: 1, score: 1000});
  assert.equal(result.result, true); assert.equal(result.values.get(K.best), '9000');
  assert.deepEqual(JSON.parse(result.values.get(K.levelBest)), {'1': 9000, '2': 1000});
  assert.deepEqual(result.writes.map(value => value.key), [K.levelBest]);
});

test('an absent global or level map uses compatible zero/empty defaults only after successful reads', () => {
  const result = fixture({best: null, levels: null, score: 100});
  assert.equal(result.result, true); assert.equal(result.values.get(K.best), '100');
  assert.deepEqual(JSON.parse(result.values.get(K.levelBest)), {'1': 100});
});

test('malformed and structurally invalid JSON maps abort before even updating a global record', () => {
  for (const levels of ['broken', 'null', '[]', '100', 'true', '"record"']) {
    const result = fixture({levels, score: 12000});
    assert.equal(result.result, false); assert.deepEqual(result.values, result.before);
    assert.deepEqual(result.writes, []);
  }
});

test('invalid existing global numbers remain recoverable and are not silently replaced', () => {
  for (const best of ['broken', 'Infinity', '-1']) {
    const result = fixture({best, score: 12000});
    assert.equal(result.result, false); assert.deepEqual(result.values, result.before);
    assert.deepEqual(result.writes, []);
  }
});

test('invalid numbers anywhere in the existing map abort rather than discarding other saved levels', () => {
  for (const levels of ['{"1":"broken","2":444}', '{"1":9000,"2":-1}', '{"1":9000,"2":"Infinity"}']) {
    const result = fixture({levels, score: 12000});
    assert.equal(result.result, false); assert.deepEqual(result.values, result.before);
    assert.deepEqual(result.writes, []);
  }
});

test('legacy numeric strings and fractional records keep their monotonic values', () => {
  const result = fixture({best: '9000.5', levels: '{"1":"9000.5","2":"444"}', score: 9000});
  assert.equal(result.result, true); assert.deepEqual(result.values, result.before);
  assert.deepEqual(result.writes, []);
});

test('a denied global write does not continue with a separate per-level write', () => {
  const result = fixture({score: 12000, failWrite: K.best});
  assert.equal(result.result, false); assert.deepEqual(result.values, result.before);
  assert.deepEqual(result.writes, []);
});

test('denied per-level write reports failure; the already saved global improvement is preserved', () => {
  const result = fixture({score: 12000, failWrite: K.levelBest});
  assert.equal(result.result, false); assert.equal(result.values.get(K.best), '12000');
  assert.equal(result.values.get(K.levelBest), result.before.get(K.levelBest));
});

test('invalid runtime scores cannot poison records', () => {
  for (const score of [-1, NaN, Infinity]) {
    const result = fixture({score}); assert.equal(result.result, false);
    assert.deepEqual(result.values, result.before); assert.deepEqual(result.writes, []);
  }
});

test('the actual game-over handler calls this protected save instead of writing score keys itself', () => {
  const gameOver = source.slice(source.indexOf('  function finishGame('), source.indexOf('  function resumeReward('));
  assert.match(gameOver, /const scoreSaved = saveScore\(\);/);
  assert.doesNotMatch(gameOver, /storage\.set(?:JSON)?\(KEYS\.(?:best|levelBest)/);
});
