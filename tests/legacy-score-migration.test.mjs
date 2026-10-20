import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createStorageService} from '../src/core/storage-service.js';

// Execute the real source function, without copying its implementation into
// this fixture or requiring a build to test a pre-bootstrap migration.
const source = await readFile(new URL('../src/game/01-runtime-assets.js', import.meta.url), 'utf8');
const migration = source.match(/  function migrateLegacyStorage\(\) \{[\s\S]*?\n  \}/)?.[0];
assert.ok(migration, 'Actual runtime migration function found');
const invoke = new Function('storage', 'N7_CAMPAIGN', 'LEGACY_KEYS', 'KEYS',
  `${migration}\nreturn migrateLegacyStorage();`);
const LEGACY = 'neon-best-v1', CURRENT = 'neon-best-v2';
function fixture({legacy, current, denied = [], writeDenied = false, n7 = false} = {}) {
  const values = new Map(), reads = [], writes = [];
  if (legacy !== undefined) values.set(LEGACY, legacy);
  if (current !== undefined) values.set(CURRENT, current);
  values.set('neon-n7-best-v1', '2037');
  const storage = createStorageService({
    getItem(key) {
      reads.push(key);
      if (denied.includes(key)) throw new Error('Injected read denial with writable storage');
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (writeDenied) throw new Error('Injected write denial');
      writes.push({key, value}); values.set(key, String(value));
    }
  });
  const result = invoke(storage, n7, {best: LEGACY}, {best: CURRENT});
  return {values, reads, writes, result};
}

test('denied current-score read preserves 9000 despite writable legacy score 100', () => {
  const result = fixture({legacy: '100', current: '9000', denied: [CURRENT]});
  assert.equal(result.result, false); assert.equal(result.values.get(CURRENT), '9000');
  assert.deepEqual(result.writes, []); assert.deepEqual(result.reads, [LEGACY, CURRENT]);
});

test('denied legacy-score read aborts instead of treating it as zero', () => {
  const result = fixture({legacy: '10000', current: '9000', denied: [LEGACY]});
  assert.equal(result.result, false); assert.equal(result.values.get(CURRENT), '9000');
  assert.deepEqual(result.writes, []); assert.deepEqual(result.reads, [LEGACY, CURRENT]);
});

test('denial of both reads cannot write or manufacture an empty current record', () => {
  const result = fixture({legacy: '100', current: '9000', denied: [LEGACY, CURRENT]});
  assert.equal(result.result, false); assert.equal(result.values.get(CURRENT), '9000');
  assert.deepEqual(result.writes, []); assert.deepEqual(result.reads, [LEGACY, CURRENT]);
});

test('a genuinely higher readable legacy score migrates once and keeps campaign identity', () => {
  const result = fixture({legacy: '12000', current: '9000'});
  assert.equal(result.result, true); assert.equal(result.values.get(CURRENT), '12000');
  assert.deepEqual(result.writes, [{key: CURRENT, value: '12000'}]);
  assert.deepEqual(result.reads, [LEGACY, CURRENT]);
  assert.equal(result.values.get(LEGACY), '12000'); assert.equal(result.values.get('neon-n7-best-v1'), '2037');
});

test('equal or higher current scores are never replaced by historical ones', () => {
  for (const legacy of ['100', '9000']) {
    const result = fixture({legacy, current: '9000'});
    assert.equal(result.result, false); assert.equal(result.values.get(CURRENT), '9000');
    assert.deepEqual(result.writes, []); assert.deepEqual(result.reads, [LEGACY, CURRENT]);
  }
});

test('absent current score accepts the readable legacy value with the old zero fallback semantics', () => {
  const result = fixture({legacy: '100'});
  assert.equal(result.result, true); assert.equal(result.values.get(CURRENT), '100');
  assert.deepEqual(result.reads, [LEGACY, CURRENT]);
});

test('absent legacy or both absent saves create no score key and do not lower existing data', () => {
  for (const current of [undefined, '9000']) {
    const result = fixture({current}); assert.equal(result.result, false);
    assert.equal(result.values.get(CURRENT), current); assert.deepEqual(result.writes, []);
  }
});

test('corrupt/nonfinite readable scores are preserved instead of silently migrating over their raw bytes', () => {
  for (const invalid of ['broken', 'NaN', 'Infinity', '-Infinity']) {
    const corruptLegacy = fixture({legacy: invalid, current: '9000'});
    assert.equal(corruptLegacy.result, false); assert.equal(corruptLegacy.values.get(CURRENT), '9000');
    const corruptCurrent = fixture({legacy: '100', current: invalid});
    assert.equal(corruptCurrent.result, false); assert.equal(corruptCurrent.values.get(CURRENT), invalid);
    assert.deepEqual(corruptCurrent.writes, []);
  }
  const emptyCurrent = fixture({legacy: '100', current: ''});
  assert.equal(emptyCurrent.result, true); assert.equal(emptyCurrent.values.get(CURRENT), '100');
  const emptyLegacy = fixture({legacy: '', current: '9000'});
  assert.equal(emptyLegacy.result, false); assert.equal(emptyLegacy.values.get(CURRENT), '9000');
});

test('readable negative scores clamp to zero and finite decimal scores keep their existing semantics', () => {
  const negative = fixture({legacy: '-10', current: '-1'});
  assert.equal(negative.result, false); assert.deepEqual(negative.writes, []);
  const decimal = fixture({legacy: '100.5', current: '100.25'});
  assert.equal(decimal.result, true); assert.equal(decimal.values.get(CURRENT), '100.5');
});

test('write denial reports failure and preserves both readable scores', () => {
  const result = fixture({legacy: '12000', current: '9000', writeDenied: true});
  assert.equal(result.result, false); assert.equal(result.values.get(CURRENT), '9000');
  assert.equal(result.values.get(LEGACY), '12000'); assert.deepEqual(result.writes, []);
});

test('N-7 never reads or migrates classic keys', () => {
  for (const campaign of [{n7: true}]) {
    const result = fixture({...campaign, legacy: '12000', current: '9000'});
    assert.equal(result.result, false); assert.deepEqual(result.reads, []); assert.deepEqual(result.writes, []);
    assert.equal(result.values.get(CURRENT), '9000');
  }
});
