import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompletionJournal} from '../src/game/progression/completion-journal.js';
import {createStorageService} from '../src/core/storage-service.js';
import {createChronosVoyageCheckpoint, normalizeChronosVoyageCheckpoint} from '../src/game/progression/chronos-flight.js';

const KEYS = Object.freeze({stars: 'neon-stars-v2', unlocked: 'neon-unlocked-v2',
  best: 'neon-best-v2', levelBest: 'neon-level-best-v2'});
const CHECKPOINT = 'neonCronium.chronosVoyage.v2';
const checkpoint = completed => ({version: 2,
  checkpoint: createChronosVoyageCheckpoint(10, {collected: 36}),
  entry: {hull: 66, score: 220, maxCombo: 3, collected: 36}, unlockedStage: 10, completed});
const validateCheckpoint = value => Boolean(value?.version === 2 &&
  normalizeChronosVoyageCheckpoint(value.checkpoint) &&
  typeof value.completed === 'boolean' && value.unlockedStage === 10 &&
  value.entry?.collected === value.checkpoint.collected);
function seed() {
  return new Map([[KEYS.stars, '{"1":1,"2":2}'], [KEYS.unlocked, '1'], [KEYS.best, '200'],
    [KEYS.levelBest, '{"1":100,"2":140}'], [CHECKPOINT, JSON.stringify(checkpoint(false))],
    ['neon-n7-unlocked-v1', '37'], ['neon-games-v2', '7']]);
}
function memory(map = seed(), {failWrite = 0, after = false, denyReads = new Set()} = {}) {
  const writes = []; let index = 0, denied = false;
  const raw = {
    getItem(key) { if (denyReads.has(key)) throw new Error('SecurityError'); return map.get(key) ?? null; },
    setItem(key, value) {
      index++;
      if (denied || (index === failWrite && !after)) { denied = true; throw new Error('QuotaExceededError'); }
      map.set(key, value); writes.push({key, value});
      if (index === failWrite && after) { denied = true; throw new Error('interrupted after atomic write'); }
    }
  };
  return {storage: createStorageService(raw), map, writes};
}
const journal = device => createCompletionJournal({storage: device.storage, keys: KEYS, levelCount: 10,
  checkpointKey: CHECKPOINT, validateCheckpoint});
const completion = (extra = {}) => ({completionId: 'classic:run-8:level-1', level: 1,
  stars: 3, score: 550, checkpoint: checkpoint(true), ...extra});
function assertComplete(map) {
  assert.deepEqual(JSON.parse(map.get(KEYS.stars)), {'1': 3, '2': 2});
  assert.deepEqual(JSON.parse(map.get(KEYS.levelBest)), {'1': 550, '2': 140});
  assert.equal(map.get(KEYS.best), '550'); assert.equal(map.get(KEYS.unlocked), '2');
  assert.equal(JSON.parse(map.get(CHECKPOINT)).completed, true);
  assert.equal(map.get('neon-n7-unlocked-v1'), '37');
  assert.equal(map.get('neon-games-v2'), '7');
}

test('completion writes intent first, checkpoint before unlock, then one bounded receipt', () => {
  const device = memory(), log = journal(device);
  const result = log.complete(completion());
  assert.equal(result.ok, true); assert.equal(result.newlyUnlocked, true); assertComplete(device.map);
  assert.deepEqual(device.writes.map(write => write.key), [log.journalKey, KEYS.stars, KEYS.levelBest,
    KEYS.best, CHECKPOINT, KEYS.unlocked, log.journalKey]);
  assert.equal(JSON.parse(device.writes[0].value).phase, 'pending');
  assert.equal(JSON.parse(device.map.get(log.journalKey)).phase, 'committed');
  assert.equal(device.map.size, seed().size + 1);
});

for (const after of [false, true]) for (let point = 1; point <= 7; point++) {
  test(`recover every actual completion write on reload: ${after ? 'after' : 'before'} atomic write ${point}/7`, () => {
    const device = memory(seed(), {failWrite: point, after}), log = journal(device);
    const result = log.complete(completion());
    assert.equal(result.ok, false);
    const fresh = memory(device.map), restored = journal(fresh), recovery = restored.recover();
    assert.equal(recovery.ok, true);
    if (point === 1 && !after) {
      // No durable intent exists: nothing is fabricated on reload. The active
      // completion can be retried if its unsaved run is still available.
      assert.equal(recovery.status, 'idle'); assert.deepEqual(device.map, seed());
      assert.equal(restored.complete(completion()).ok, true);
    }
    assertComplete(device.map);
    const bytes = new Map(device.map), count = fresh.writes.length;
    assert.equal(restored.recover().ok, true);
    assert.equal(restored.complete(completion()).duplicate, true);
    assert.deepEqual(device.map, bytes); assert.equal(fresh.writes.length, count);
  });
}

test('storage denied before intent changes no legacy key and does not invent success', () => {
  const device = memory(seed(), {failWrite: 1});
  const result = journal(device).complete(completion());
  assert.equal(result.ok, false); assert.equal(result.reason, 'intent-write-denied');
  assert.equal(device.writes.length, 0); assert.deepEqual(device.map, seed());
});

test('read denial is distinct from an absent save; completion never writes defaults over old saves', () => {
  for (const key of [...Object.values(KEYS), CHECKPOINT, `${KEYS.unlocked}:completion-journal:v1`]) {
    const device = memory(seed(), {denyReads: new Set([key])});
    const result = journal(device).complete(completion());
    assert.equal(result.ok, false); assert.equal(result.reason, 'storage-read-denied');
    assert.equal(device.writes.length, 0); assert.deepEqual(device.map, seed());
  }
});

test('new saves and old classic keys keep their original shape; no checkpoint is required outside Chronos', () => {
  const device = memory(new Map()), log = createCompletionJournal({storage: device.storage, keys: KEYS, levelCount: 10});
  assert.equal(log.recover().status, 'idle');
  assert.equal(log.complete(completion({checkpoint: null})).ok, true);
  assert.equal(device.map.get(KEYS.unlocked), '2');
  assert.deepEqual(JSON.parse(device.map.get(KEYS.stars)), {'1': 3});
  assert.equal(device.map.has(CHECKPOINT), false);
});

test('replay preserves higher scores, other levels and external advancement instead of rolling back', () => {
  const device = memory(seed(), {failWrite: 2}), log = journal(device);
  assert.equal(log.complete(completion()).status, 'pending');
  device.map.set(KEYS.stars, '{"1":3,"2":3,"9":2,"future":"kept"}');
  device.map.set(KEYS.levelBest, '{"1":900,"2":400,"9":800}');
  device.map.set(KEYS.best, '1200'); device.map.set(KEYS.unlocked, '8');
  const restored = journal(memory(device.map)); assert.equal(restored.recover().ok, true);
  assert.equal(device.map.get(KEYS.unlocked), '8'); assert.equal(device.map.get(KEYS.best), '1200');
  assert.deepEqual(JSON.parse(device.map.get(KEYS.levelBest)), {'1': 900, '2': 400, '9': 800});
  assert.deepEqual(JSON.parse(device.map.get(KEYS.stars)), {'1': 3, '2': 3, '9': 2, future: 'kept'});
});

test('pending checkpoint conflicts block replay before any progress key is changed', () => {
  const device = memory(seed(), {failWrite: 2}); journal(device).complete(completion());
  const newer = {...checkpoint(false), entry: {...checkpoint(false).entry, score: 999}};
  device.map.set(CHECKPOINT, JSON.stringify(newer));
  const fresh = memory(device.map), before = new Map(device.map), result = journal(fresh).recover();
  assert.equal(result.ok, false); assert.equal(result.reason, 'checkpoint-conflict');
  assert.deepEqual(device.map, before); assert.equal(fresh.writes.length, 0);
});

test('invalid existing saves and journal bytes remain recoverable, never silently removed', () => {
  for (const [key, raw] of [[KEYS.stars, '{bad'], [KEYS.best, 'NaN'],
    [CHECKPOINT, '{invalid'], [`${KEYS.unlocked}:completion-journal:v1`, '{unknown']]) {
    const device = memory(); device.map.set(key, raw); const before = new Map(device.map);
    const result = journal(device).complete(completion());
    assert.equal(result.ok, false); assert.deepEqual(device.map, before);
    assert.equal(device.writes.length, 0);
  }
});

test('journal is bound to real campaign keys and cannot replay a classic intent into N-7', () => {
  const classic = memory(seed(), {failWrite: 2}), classicLog = journal(classic);
  classicLog.complete(completion());
  const n7Keys = Object.fromEntries(Object.keys(KEYS).map(name => [name, `neon-n7-${name}-v1`]));
  const n7Log = createCompletionJournal({storage: memory(classic.map).storage, keys: n7Keys, levelCount: 100});
  classic.map.set(n7Log.journalKey, classic.map.get(classicLog.journalKey));
  const before = new Map(classic.map), result = n7Log.recover();
  assert.equal(result.ok, false); assert.equal(result.reason, 'invalid-journal');
  assert.deepEqual(classic.map, before);
});

test('a pending prior completion is recovered before replacing the one-record receipt for the next level', () => {
  const device = memory(seed(), {failWrite: 4}); journal(device).complete(completion());
  const fresh = memory(device.map), restored = journal(fresh);
  assert.equal(restored.complete(completion({completionId: 'classic:run-9:level-2', level: 2,
    stars: 3, score: 1000, checkpoint: null})).ok, true);
  assert.deepEqual(JSON.parse(device.map.get(KEYS.stars)), {'1': 3, '2': 3});
  assert.equal(device.map.get(KEYS.unlocked), '3'); assert.equal(device.map.get(KEYS.best), '1000');
  assert.equal(JSON.parse(device.map.get(restored.journalKey)).id, 'classic:run-9:level-2');
  assert.equal(device.map.size, seed().size + 1);
});

test('replaying an older level never skips a gate; the final level never unlocks a nonexistent territory', () => {
  const device = memory(); device.map.set(KEYS.unlocked, '5'); const log = journal(device);
  log.complete(completion({level: 1, checkpoint: null})); assert.equal(device.map.get(KEYS.unlocked), '5');
  log.complete(completion({completionId: 'locked:attempt', level: 8, checkpoint: null}));
  assert.equal(device.map.get(KEYS.unlocked), '5');
  device.map.set(KEYS.unlocked, '10');
  log.complete(completion({completionId: 'last:attempt', level: 10, checkpoint: null}));
  assert.equal(device.map.get(KEYS.unlocked), '10');
});

test('invalid requests fail before writes and caller checkpoint objects cannot mutate the durable snapshot', () => {
  const device = memory(), log = journal(device);
  for (const input of [completion({stars: 4}), completion({score: Infinity}), completion({level: 0}),
    completion({completionId: ''}), completion({checkpoint: {version: 8}})]) {
    assert.throws(() => log.complete(input), TypeError);
  }
  assert.equal(device.writes.length, 0);
  const waiting = memory(seed(), {failWrite: 2}), payload = completion();
  journal(waiting).complete(payload); payload.checkpoint.completed = false;
  assert.equal(journal(memory(waiting.map)).recover().ok, true);
  assert.equal(JSON.parse(waiting.map.get(CHECKPOINT)).completed, true);
});

const EQUIPMENT = 'neonCronium.flightEquipment.v1';
const equipment = (rewarded = false) => ({version: 1, recoveredTwin: rewarded,
  unlocked: rewarded ? ['pulse', 'twin'] : ['pulse'], selected: 'pulse'});
const validateEquipment = value => Boolean(value?.version === 1 &&
  typeof value.recoveredTwin === 'boolean' && Array.isArray(value.unlocked) &&
  value.unlocked.includes('pulse') && value.unlocked.every(name => ['pulse', 'twin', 'lance'].includes(name)) &&
  value.unlocked.includes(value.selected) && (!value.unlocked.includes('twin') || value.recoveredTwin));
const equipmentSeed = () => new Map([...seed(), [EQUIPMENT, JSON.stringify(equipment(false))]]);
const rewardJournal = device => createCompletionJournal({storage: device.storage, keys: KEYS, levelCount: 10,
  checkpointKey: CHECKPOINT, validateCheckpoint, equipmentKey: EQUIPMENT, validateEquipment});
const rewardCompletion = (extra = {}) => completion({equipment: equipment(true), ...extra});
function assertRewardComplete(map) {
  assertComplete(map);
  assert.deepEqual(JSON.parse(map.get(EQUIPMENT)), equipment(true));
}

test('optional equipment reward shares the v1 scope and writes its snapshot before campaign unlock', () => {
  const device = memory(equipmentSeed()), log = rewardJournal(device);
  assert.equal(log.complete(rewardCompletion()).ok, true);
  assertRewardComplete(device.map);
  assert.deepEqual(device.writes.map(write => write.key), [log.journalKey, KEYS.stars, KEYS.levelBest,
    KEYS.best, CHECKPOINT, EQUIPMENT, KEYS.unlocked, log.journalKey]);
  const intent = JSON.parse(device.writes[0].value);
  assert.equal(intent.version, 1);
  assert.equal(intent.scope, JSON.stringify([...Object.values(KEYS), CHECKPOINT, 10]));
  assert.equal(intent.equipment.before, JSON.stringify(equipment(false)));
  assert.deepEqual(intent.equipment.after, equipment(true));
  assert.equal(device.map.size, equipmentSeed().size + 1, 'one bounded existing journal, no second save subsystem');
});

for (const after of [false, true]) for (let point = 1; point <= 8; point++) {
  test(`recover equipment and progress together: ${after ? 'after' : 'before'} atomic write ${point}/8`, () => {
    const device = memory(equipmentSeed(), {failWrite: point, after}), log = rewardJournal(device);
    assert.equal(log.complete(rewardCompletion()).ok, false);
    const fresh = memory(device.map), restored = rewardJournal(fresh), recovery = restored.recover();
    assert.equal(recovery.ok, true);
    if (point === 1 && !after) {
      assert.equal(recovery.status, 'idle');
      assert.deepEqual(device.map, equipmentSeed(), 'no reward is fabricated without a durable intent');
      assert.equal(restored.complete(rewardCompletion()).ok, true);
    }
    assertRewardComplete(device.map);
    const bytes = new Map(device.map), count = fresh.writes.length;
    assert.equal(restored.recover().ok, true);
    assert.equal(restored.complete(rewardCompletion()).duplicate, true);
    assert.deepEqual(device.map, bytes);
    assert.equal(fresh.writes.length, count, 'completion retry cannot grant or replace the reward twice');
  });
}

test('old pending v1 intents recover with new equipment configuration without reading or inventing a reward', () => {
  const old = memory(seed(), {failWrite: 2}), oldLog = journal(old);
  assert.equal(oldLog.complete(completion()).status, 'pending');
  const oldIntent = JSON.parse(old.map.get(oldLog.journalKey));
  assert.equal(Object.hasOwn(oldIntent, 'equipment'), false);
  old.map.set(EQUIPMENT, '{unrelated invalid profile');
  const fresh = memory(old.map, {denyReads: new Set([EQUIPMENT])}), restored = rewardJournal(fresh);
  assert.equal(restored.journalKey, oldLog.journalKey);
  assert.equal(restored.recover().ok, true);
  assertComplete(old.map);
  const receipt = JSON.parse(old.map.get(oldLog.journalKey));
  assert.equal(receipt.scope, oldIntent.scope);
  assert.equal(Object.hasOwn(receipt, 'equipment'), false, 'historical record shape is preserved');
  assert.equal(old.map.get(EQUIPMENT), '{unrelated invalid profile');
  assert.equal(fresh.writes.some(write => write.key === EQUIPMENT), false);
});

test('gearless completion remains byte-compatible and does not access an optional equipment key', () => {
  const without = memory(seed()), withConfig = memory(seed(), {denyReads: new Set([EQUIPMENT])});
  assert.equal(journal(without).complete(completion()).ok, true);
  assert.equal(rewardJournal(withConfig).complete(completion()).ok, true);
  assert.deepEqual(withConfig.map, without.map);
  assert.deepEqual(withConfig.writes, without.writes);
  assert.equal(Object.hasOwn(JSON.parse(withConfig.map.get(journal(without).journalKey)), 'equipment'), false);
});

test('equipment read denial and invalid existing profiles block before intent or progress writes', () => {
  for (const invalid of [null, '{bad', '[]', JSON.stringify({...equipment(false), version: 7})]) {
    const device = memory(equipmentSeed(), invalid === null ? {denyReads: new Set([EQUIPMENT])} : {});
    if (invalid !== null) device.map.set(EQUIPMENT, invalid);
    const before = new Map(device.map), result = rewardJournal(device).complete(rewardCompletion());
    assert.equal(result.ok, false);
    assert.equal(result.reason, invalid === null ? 'storage-read-denied' : 'invalid-existing-equipment');
    assert.equal(result.key, EQUIPMENT);
    assert.deepEqual(device.map, before);
    assert.equal(device.writes.length, 0);
  }
});

test('an absent equipment profile accepts a validated first snapshot and preserves the null CAS origin', () => {
  const device = memory(seed()), log = rewardJournal(device);
  assert.equal(log.complete(rewardCompletion()).ok, true);
  const intent = JSON.parse(device.writes[0].value);
  assert.equal(intent.equipment.before, null);
  assertRewardComplete(device.map);
});

test('conflicting equipment blocks pending replay before any other key is mutated', () => {
  const old = memory(equipmentSeed(), {failWrite: 2}); rewardJournal(old).complete(rewardCompletion());
  const newer = {...equipment(true), selected: 'twin'};
  old.map.set(EQUIPMENT, JSON.stringify(newer));
  const fresh = memory(old.map), before = new Map(old.map), result = rewardJournal(fresh).recover();
  assert.equal(result.ok, false); assert.equal(result.reason, 'equipment-conflict');
  assert.equal(result.key, EQUIPMENT);
  assert.deepEqual(old.map, before);
  assert.equal(fresh.writes.length, 0);
});

test('recovery recognizes equipment already written before an unlock interruption and never rewrites it', () => {
  const old = memory(equipmentSeed(), {failWrite: 7});
  assert.equal(rewardJournal(old).complete(rewardCompletion()).status, 'pending');
  assert.equal(old.map.get(KEYS.unlocked), '1');
  assert.deepEqual(JSON.parse(old.map.get(EQUIPMENT)), equipment(true));
  const fresh = memory(old.map);
  assert.equal(rewardJournal(fresh).recover().ok, true);
  assertRewardComplete(old.map);
  assert.equal(fresh.writes.some(write => write.key === EQUIPMENT), false);
});

test('read denial during a pending reward keeps the intent and every progress byte untouched', () => {
  const old = memory(equipmentSeed(), {failWrite: 2}); rewardJournal(old).complete(rewardCompletion());
  const fresh = memory(old.map, {denyReads: new Set([EQUIPMENT])}), before = new Map(old.map);
  const result = rewardJournal(fresh).recover();
  assert.equal(result.ok, false); assert.equal(result.reason, 'storage-read-denied');
  assert.deepEqual(old.map, before); assert.equal(fresh.writes.length, 0);
});

test('committed completion retries preserve a later player equipment selection without reapplying the reward', () => {
  const device = memory(equipmentSeed()), log = rewardJournal(device);
  assert.equal(log.complete(rewardCompletion()).ok, true);
  const selected = {...equipment(true), selected: 'twin'};
  device.map.set(EQUIPMENT, JSON.stringify(selected));
  const before = new Map(device.map), count = device.writes.length;
  assert.equal(log.complete(rewardCompletion()).duplicate, true);
  assert.deepEqual(device.map, before); assert.equal(device.writes.length, count);
});

test('equipment payloads are validated as JSON snapshots and cannot mutate a durable pending intent', () => {
  const device = memory(equipmentSeed()), log = rewardJournal(device);
  const circular = equipment(true); circular.cycle = circular;
  for (const payload of [{version: 8}, circular, {...equipment(true), toJSON() { return {version: 8}; }}]) {
    assert.throws(() => log.complete(rewardCompletion({equipment: payload})), TypeError);
  }
  assert.equal(device.writes.length, 0);
  const waiting = memory(equipmentSeed(), {failWrite: 2}), payload = rewardCompletion();
  rewardJournal(waiting).complete(payload);
  payload.equipment.unlocked.splice(1); payload.equipment.recoveredTwin = false;
  assert.equal(rewardJournal(memory(waiting.map)).recover().ok, true);
  assertRewardComplete(waiting.map);
});

test('equipment-bearing intents require configured validation; malformed records remain intact', () => {
  for (const invalid of [false, [], {before: '{bad', after: equipment(true)},
    {before: null, after: {version: 8}}, {before: 7, after: equipment(true)}]) {
    const old = memory(equipmentSeed(), {failWrite: 2}), log = rewardJournal(old);
    log.complete(rewardCompletion());
    const record = JSON.parse(old.map.get(log.journalKey)); record.equipment = invalid;
    old.map.set(log.journalKey, JSON.stringify(record));
    const fresh = memory(old.map), before = new Map(old.map), result = rewardJournal(fresh).recover();
    assert.equal(result.ok, false); assert.equal(result.reason, 'invalid-journal');
    assert.deepEqual(old.map, before); assert.equal(fresh.writes.length, 0);
  }
  const old = memory(equipmentSeed(), {failWrite: 2}); rewardJournal(old).complete(rewardCompletion());
  const fresh = memory(old.map), before = new Map(old.map), result = journal(fresh).recover();
  assert.equal(result.reason, 'invalid-journal');
  assert.deepEqual(old.map, before); assert.equal(fresh.writes.length, 0);
});

test('equipment key collisions and missing runtime validators are rejected without writes', () => {
  const device = memory(equipmentSeed());
  for (const key of [...Object.values(KEYS), CHECKPOINT, `${KEYS.unlocked}:completion-journal:v1`, '', 7]) {
    assert.throws(() => createCompletionJournal({storage: device.storage, keys: KEYS, levelCount: 10,
      checkpointKey: CHECKPOINT, validateCheckpoint, equipmentKey: key, validateEquipment}), TypeError);
  }
  assert.throws(() => createCompletionJournal({storage: device.storage, keys: KEYS, levelCount: 10,
    equipmentKey: EQUIPMENT}), /runtime validator/);
  assert.throws(() => journal(device).complete(rewardCompletion()), /Invalid completion equipment/);
  assert.equal(device.writes.length, 0);
});

test('an Atlas-style reward without a Chronos checkpoint recovers equipment before opening the next territory', () => {
  const map = equipmentSeed(); map.set(KEYS.unlocked, '2');
  const priorCheckpoint = map.get(CHECKPOINT);
  const device = memory(map, {failWrite: 6}), log = rewardJournal(device);
  const atlas = rewardCompletion({completionId: 'classic:atlas-resolved:run-12', level: 2,
    score: 850, checkpoint: null});
  assert.equal(log.complete(atlas).status, 'pending');
  assert.deepEqual(device.writes.map(write => write.key), [log.journalKey, KEYS.stars,
    KEYS.levelBest, KEYS.best, EQUIPMENT]);
  assert.equal(map.get(KEYS.unlocked), '2', 'the frontier must not open before the reward is durable');
  assert.deepEqual(JSON.parse(map.get(EQUIPMENT)), equipment(true));
  const fresh = memory(map), restored = rewardJournal(fresh);
  assert.equal(restored.recover().ok, true);
  assert.equal(map.get(KEYS.unlocked), '3');
  assert.equal(map.get(CHECKPOINT), priorCheckpoint, 'Gaia completion cannot replace the Chronos checkpoint');
  assert.deepEqual(JSON.parse(map.get(KEYS.stars)), {'1': 1, '2': 3});
  assert.deepEqual(JSON.parse(map.get(KEYS.levelBest)), {'1': 100, '2': 850});
  const before = new Map(map), count = fresh.writes.length;
  assert.equal(restored.complete(atlas).duplicate, true);
  assert.deepEqual(map, before); assert.equal(fresh.writes.length, count);
});
