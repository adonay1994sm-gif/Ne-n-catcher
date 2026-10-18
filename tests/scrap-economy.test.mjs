import test from 'node:test';
import assert from 'node:assert/strict';
import {SCRAP_ECONOMY_KEY, SCRAP_ECONOMY_RULES, SCRAP_UPGRADES, SCRAP_REWARDS,
  createScrapRecord, normalizeScrapRecord, formatDenominations, rewardForEnemy,
  createScrapLedger} from '../src/game/progression/scrap-economy.js';

function memory(map = new Map(), {failWrite = 0, afterWrite = false, denyReads = new Set(),
  throwRead = false, throwWrite = false, interceptRead = null} = {}) {
  const writes = [];
  let attempts = 0;
  return {map, writes, storage: {
    readRaw(key) {
      if (throwRead) throw new Error('read denied');
      if (denyReads.has(key)) return {ok: false, value: null};
      if (interceptRead) interceptRead(key, map);
      return {ok: true, value: map.get(key) ?? null};
    },
    setJSON(key, value) {
      attempts++;
      if (throwWrite) throw new Error('write denied');
      if (attempts === failWrite && !afterWrite) return false;
      const raw = JSON.stringify(value);
      map.set(key, raw); writes.push({key, raw});
      return attempts !== failWrite;
    }
  }};
}
const ledger = device => createScrapLedger({storage: device.storage});
const start = (log, scope = 'classic:chronos') => log.beginRun({scope});
function fund(log, runId, count = 6) {
  for (let index = 0; index < count; index++) assert.equal(log.claimDrop({runId,
    dropId: `stage:1:enemy:${index}`, enemyType: 'scout'}).ok, true);
}

test('denominations exactly preserve the requested 100000 / 100 / 10 conversion and remainder', () => {
  assert.equal(SCRAP_ECONOMY_RULES.silver, 100000);
  assert.equal(SCRAP_ECONOMY_RULES.gold, 100 * SCRAP_ECONOMY_RULES.silver);
  assert.equal(SCRAP_ECONOMY_RULES.stellar, 10 * SCRAP_ECONOMY_RULES.gold);
  assert.deepEqual(formatDenominations(0), {scrap: 0, silver: 0, gold: 0, stellar: 0, label: '0 chatarra'});
  assert.deepEqual(formatDenominations(123456789), {scrap: 56789, silver: 34, gold: 2,
    stellar: 1, label: '1 estelar · 2 oro · 34 plata · 56789 chatarra'});
  assert.deepEqual(formatDenominations(99999999), {scrap: 99999, silver: 99, gold: 9,
    stellar: 0, label: '9 oro · 99 plata · 99999 chatarra'});
  for (const amount of [0, 99999, 100000, 10000000, 100000000, Number.MAX_SAFE_INTEGER]) {
    const coins = formatDenominations(amount);
    assert.equal(coins.scrap + coins.silver * 100000 + coins.gold * 10000000 + coins.stellar * 100000000, amount);
  }
  for (const amount of [-1, .5, Infinity, Number.MAX_SAFE_INTEGER + 1, '100']) {
    assert.throws(() => formatDenominations(amount), TypeError);
  }
});

test('enemy families drop different small scrap values, never minted silver or arbitrary terrain rewards', () => {
  assert.deepEqual(SCRAP_REWARDS, {raider: 6, scout: 9, interceptor: 15, atlas: 180});
  assert.equal(rewardForEnemy('ch-01'), 9);
  assert.equal(rewardForEnemy('ch-02'), 15);
  assert.equal(rewardForEnemy('guardian-atlas'), 180);
  for (const type of ['meteor', 'comet', 'orb', 'unknown', '__proto__', 'constructor', null, {}]) {
    assert.equal(rewardForEnemy(type), 0);
  }
  for (const amount of Object.values(SCRAP_REWARDS)) assert.ok(amount < 100000);
});

test('empty profile is isolated from all legacy campaign and equipment keys', () => {
  const map = new Map([['neonCatcher.flightEquipment.v1', '{legacy equipment bytes'],
    ['neonCatcher.journey.v1', '{legacy journey credits'], ['unlocked', '10']]);
  const original = new Map(map), device = memory(map), log = ledger(device);
  assert.equal(log.getBalance(), null);
  assert.deepEqual(log.load(), {ok: true, status: 'new', state: createScrapRecord()});
  assert.equal(device.writes.length, 0, 'reading an absent profile does not fabricate a save');
  const run = start(log); fund(log, run.runId);
  assert.equal(log.getBalance(), 54);
  for (const [key, raw] of original) assert.equal(map.get(key), raw);
  assert.deepEqual([...map.keys()].filter(key => !original.has(key)), [SCRAP_ECONOMY_KEY]);
});

test('reload resumes persisted run and stable enemy receipt prevents repeated pickup or checkpoint farming', () => {
  const device = memory(), log = ledger(device), run = start(log);
  assert.equal(run.runId, 'salvage-run:1');
  const claim = {runId: run.runId, dropId: 'stage:3:enemy:7', enemyType: 'interceptor'};
  assert.equal(log.claimDrop(claim).amount, 15);
  const bytes = new Map(device.map), fresh = memory(device.map), resumed = ledger(fresh);
  assert.equal(resumed.load().ok, true);
  assert.equal(start(resumed).runId, run.runId);
  assert.equal(resumed.claimDrop(claim).duplicate, true);
  assert.equal(resumed.claimDrop(claim).amount, 0);
  assert.equal(resumed.getBalance(), 15);
  assert.equal(fresh.writes.length, 0);
  assert.deepEqual(device.map, bytes);
  assert.equal(resumed.claimDrop({...claim, enemyType: 'scout'}).reason, 'drop-id-conflict');
  assert.equal(resumed.getBalance(), 15);
});

test('only explicit fresh expedition clears per-run receipts; other scopes and stale run IDs cannot mint rewards', () => {
  const device = memory(), log = ledger(device), first = start(log);
  fund(log, first.runId, 1);
  const before = new Map(device.map);
  assert.equal(start(log, 'classic:gaia').reason, 'run-scope-conflict');
  assert.deepEqual(device.map, before);
  const next = log.beginRun({scope: 'classic:gaia', fresh: true});
  assert.equal(next.runId, 'salvage-run:2');
  assert.equal(next.state.balance, 9);
  assert.equal(next.state.activeRun.claimed.length, 0);
  assert.equal(log.claimDrop({runId: first.runId, dropId: 'new', enemyType: 'raider'}).reason, 'inactive-run');
  assert.equal(log.claimDrop({runId: next.runId, dropId: 'stage:1:enemy:0', enemyType: 'raider'}).amount, 6);
  assert.equal(log.getBalance(), 15);
});

test('a collected drop writes exactly one atomic receipt and a world drop is not itself a grant', () => {
  const device = memory(), log = ledger(device), run = start(log);
  const count = device.writes.length;
  assert.equal(log.getBalance(), 0, 'world spawning/defeating a ship does not call a pickup grant');
  const result = log.claimDrop({runId: run.runId, dropId: 'stage:2:enemy:4', enemyType: 'raider'});
  assert.equal(result.amount, 6);
  assert.equal(device.writes.length, count + 1);
  assert.deepEqual(JSON.parse(device.writes.at(-1).raw).activeRun.claimed,
    [{id: 'stage:2:enemy:4', enemyType: 'raider', amount: 6}]);
});

test('C9 purchase commits balance, entitlement and receipt in one write without granting weapon ownership', () => {
  const device = memory(), log = ledger(device), run = start(log);
  fund(log, run.runId);
  const count = device.writes.length;
  const result = log.purchase({transactionId: 'c9:prep:1', sku: 'twin-preparation'});
  assert.equal(result.ok, true); assert.equal(result.price, 24);
  assert.equal(device.writes.length, count + 1);
  assert.equal(log.getBalance(), 30);
  assert.deepEqual(result.state.upgrades, ['twin-preparation']);
  assert.deepEqual(result.state.purchases, [{id: 'c9:prep:1', sku: 'twin-preparation', price: 24}]);
  assert.equal(result.state.spent, 24);
  assert.equal(Object.hasOwn(result.state, 'unlocked'), false);
  assert.equal(Object.hasOwn(result.state, 'equipment'), false);
  assert.equal(device.map.has('neonCatcher.flightEquipment.v1'), false);
  assert.equal(SCRAP_UPGRADES['twin-preparation'].price, 24);
  assert.equal(SCRAP_UPGRADES['shield-cell'].price, 30);
  assert.equal(SCRAP_UPGRADES['coolant-feed'].price, 45);
});

test('repeated purchase and reload never charge twice even when UI retries with a new transaction ID', () => {
  const device = memory(), log = ledger(device), run = start(log);
  fund(log, run.runId); log.purchase({transactionId: 'c9:shield:1', sku: 'shield-cell'});
  const before = new Map(device.map), fresh = memory(device.map), restored = ledger(fresh);
  assert.equal(restored.purchase({transactionId: 'c9:shield:1', sku: 'shield-cell'}).duplicate, true);
  assert.equal(restored.purchase({transactionId: 'c9:shield:2', sku: 'shield-cell'}).reason, 'already-owned');
  assert.equal(restored.purchase({transactionId: 'c9:shield:1', sku: 'coolant-feed'}).reason, 'transaction-id-conflict');
  assert.equal(restored.getBalance(), 24);
  assert.deepEqual(device.map, before);
  assert.equal(fresh.writes.length, 0);
});

test('insufficient funds leave no receipt, negative balance or partly owned module', () => {
  const device = memory(), log = ledger(device), run = start(log);
  fund(log, run.runId, 2);
  const before = new Map(device.map), count = device.writes.length;
  const result = log.purchase({transactionId: 'shield:pending', sku: 'shield-cell'});
  assert.equal(result.reason, 'insufficient-funds');
  assert.equal(result.missing, 12);
  assert.deepEqual(device.map, before); assert.equal(device.writes.length, count);
  fund(log, run.runId, 5);
  assert.equal(log.purchase({transactionId: 'shield:pending', sku: 'shield-cell'}).ok, true);
  assert.equal(log.getBalance(), 15);
});

for (const afterWrite of [false, true]) {
  test(`drop retry is coherent after interruption ${afterWrite ? 'after' : 'before'} its atomic write`, () => {
    const device = memory(), first = ledger(device), run = start(first);
    const failing = memory(device.map, {failWrite: 1, afterWrite}), log = ledger(failing);
    const input = {runId: run.runId, dropId: 'stage:2:enemy:9', enemyType: 'scout'};
    const result = log.claimDrop(input);
    assert.equal(result.ok, afterWrite);
    const restored = ledger(memory(device.map));
    assert.equal(restored.claimDrop(input).duplicate, afterWrite);
    assert.equal(restored.getBalance(), 9);
    assert.equal(restored.getState().activeRun.claimed.length, 1);
  });
  test(`C9 interruption ${afterWrite ? 'after' : 'before'} commit cannot separate price and module`, () => {
    const device = memory(), first = ledger(device), run = start(first);
    fund(first, run.runId);
    const failing = memory(device.map, {failWrite: 1, afterWrite}), log = ledger(failing);
    const input = {transactionId: 'c9:coolant:1', sku: 'coolant-feed'};
    assert.equal(log.purchase(input).ok, afterWrite);
    const saved = JSON.parse(device.map.get(SCRAP_ECONOMY_KEY));
    assert.equal(saved.balance, afterWrite ? 9 : 54);
    assert.equal(saved.upgrades.includes('coolant-feed'), afterWrite);
    assert.equal(saved.purchases.length, afterWrite ? 1 : 0);
    const restored = ledger(memory(device.map)), retried = restored.purchase(input);
    assert.equal(retried.ok, true); assert.equal(retried.duplicate, afterWrite);
    assert.equal(restored.getBalance(), 9);
    assert.equal(restored.getState().purchases.length, 1);
  });
}

test('unreadable storage is never interpreted as new or overwritten with defaults', () => {
  const good = createScrapRecord(), map = new Map([[SCRAP_ECONOMY_KEY, JSON.stringify(good)]]);
  for (const options of [{denyReads: new Set([SCRAP_ECONOMY_KEY])}, {throwRead: true}]) {
    const device = memory(map, options), log = ledger(device), before = new Map(map);
    assert.equal(log.load().reason, 'storage-read-denied');
    assert.equal(start(log).reason, 'storage-read-denied');
    assert.equal(log.purchase({transactionId: 'x', sku: 'shield-cell'}).reason, 'storage-read-denied');
    assert.deepEqual(map, before); assert.equal(device.writes.length, 0); assert.equal(log.getState(), null);
  }
});

test('readable storage with write denial or exception cannot fabricate a run, reward or purchase success', () => {
  for (const options of [{failWrite: 1}, {throwWrite: true}]) {
    const device = memory(new Map(), options), log = ledger(device);
    assert.equal(start(log).reason, 'storage-write-denied');
    assert.equal(device.map.has(SCRAP_ECONOMY_KEY), false);
    assert.equal(log.getState(), null);
  }
});

test('corrupt bytes are backed up before further operations and never silently reset or replaced', () => {
  for (const raw of ['{broken', 'null', '[]', JSON.stringify({...createScrapRecord(), balance: -1})]) {
    const device = memory(new Map([[SCRAP_ECONOMY_KEY, raw]])), log = ledger(device);
    const loaded = log.load();
    assert.equal(loaded.ok, false); assert.equal(loaded.reason, 'invalid-save-backed-up');
    assert.equal(device.map.get(SCRAP_ECONOMY_KEY), raw);
    assert.deepEqual(JSON.parse(device.map.get(log.backupKey)), {version: 1, records: [raw]});
    const count = device.writes.length;
    assert.equal(start(log).reason, 'invalid-save-backed-up');
    assert.equal(log.purchase({transactionId: 'buy', sku: 'shield-cell'}).reason, 'invalid-save-backed-up');
    assert.equal(device.writes.length, count, 'same invalid bytes are retained once, not rewritten repeatedly');
  }
});

test('denied or malformed backup preserves corrupt wallet bytes and existing historical backups', () => {
  const backupKey = `${SCRAP_ECONOMY_KEY}:invalid-backups`;
  for (const [backup, options, reason] of [[null, {failWrite: 1}, 'backup-write-denied'],
    [null, {denyReads: new Set([backupKey])}, 'backup-read-denied'],
    ['{prior malformed', {}, 'invalid-backup'],
    [JSON.stringify({version: 1, records: Array.from({length: 8}, (_, i) => `historic:${i}`)}), {}, 'backup-capacity']]) {
    const map = new Map([[SCRAP_ECONOMY_KEY, '{bad']]);
    if (backup !== null) map.set(backupKey, backup);
    const before = new Map(map), device = memory(map, options), log = ledger(device);
    assert.equal(log.load().reason, reason);
    assert.deepEqual(map, before); assert.equal(device.writes.length, 0);
  }
});

test('future-format save is preserved without guessing a migration or overwriting the backup', () => {
  const raw = JSON.stringify({...createScrapRecord(), version: 2, future: 'keep me'});
  const device = memory(new Map([[SCRAP_ECONOMY_KEY, raw]])), log = ledger(device);
  assert.equal(log.load().reason, 'unsupported-save-version');
  assert.equal(start(log).reason, 'unsupported-save-version');
  assert.equal(device.map.get(SCRAP_ECONOMY_KEY), raw);
  assert.equal(device.writes.length, 0);
});

test('bounded drop receipts refuse overflow instead of evicting IDs that could be replayed for currency', () => {
  const device = memory(), log = ledger(device), run = start(log);
  for (let index = 0; index < SCRAP_ECONOMY_RULES.maxDropReceipts; index++) {
    assert.equal(log.claimDrop({runId: run.runId, dropId: `stage:1:enemy:${index}`, enemyType: 'raider'}).ok, true);
  }
  const bytes = new Map(device.map), count = device.writes.length;
  assert.equal(log.claimDrop({runId: run.runId, dropId: 'overflow', enemyType: 'raider'}).reason, 'drop-receipt-capacity');
  assert.equal(log.claimDrop({runId: run.runId, dropId: 'stage:1:enemy:0', enemyType: 'raider'}).duplicate, true);
  assert.equal(log.getBalance(), SCRAP_ECONOMY_RULES.maxDropReceipts * 6);
  assert.deepEqual(device.map, bytes); assert.equal(device.writes.length, count);
});

test('reload and a second ledger instance observe each other instead of spending stale balances', () => {
  const device = memory(), one = ledger(device), run = start(one);
  fund(one, run.runId);
  const two = ledger(memory(device.map)); two.load();
  one.purchase({transactionId: 'first', sku: 'shield-cell'});
  assert.equal(two.purchase({transactionId: 'second', sku: 'coolant-feed'}).reason, 'insufficient-funds');
  assert.equal(two.getBalance(), 24);
  assert.deepEqual(two.getState().upgrades, ['shield-cell']);
});

test('a last-moment external save conflict is preserved before the ledger write', () => {
  const initial = memory(), one = ledger(initial); start(one);
  const external = createScrapRecord();
  const externalRaw = JSON.stringify(external);
  let reads = 0;
  const changing = memory(initial.map, {interceptRead(key, map) {
    if (key === SCRAP_ECONOMY_KEY && ++reads === 2) map.set(key, externalRaw);
  }});
  const two = ledger(changing);
  const result = two.claimDrop({runId: 'salvage-run:1', dropId: 'x', enemyType: 'scout'});
  assert.equal(result.reason, 'save-conflict');
  assert.equal(changing.map.get(SCRAP_ECONOMY_KEY), externalRaw);
  assert.equal(changing.writes.length, 0);
});

test('unsafe monetary overflow and exhausted run sequence block without changing bytes', () => {
  const record = {...createScrapRecord(), balance: Number.MAX_SAFE_INTEGER, earned: Number.MAX_SAFE_INTEGER,
    runSequence: 1, activeRun: {id: 'salvage-run:1', scope: 'classic:chronos', sequence: 1, claimed: []}};
  const device = memory(new Map([[SCRAP_ECONOMY_KEY, JSON.stringify(record)]])), log = ledger(device);
  const before = new Map(device.map);
  assert.equal(log.claimDrop({runId: 'salvage-run:1', dropId: 'x', enemyType: 'scout'}).reason, 'balance-capacity');
  assert.deepEqual(device.map, before);
  record.runSequence = Number.MAX_SAFE_INTEGER;
  record.activeRun.sequence = record.runSequence; record.activeRun.id = `salvage-run:${record.runSequence}`;
  device.map.set(SCRAP_ECONOMY_KEY, JSON.stringify(record));
  assert.equal(log.beginRun({scope: 'classic:chronos', fresh: true}).reason, 'run-capacity');
  assert.equal(device.writes.length, 0);
});

test('validators reject forged receipts, duplicate modules and malformed monetary relationships', () => {
  const record = createScrapRecord();
  const invalid = [{...record, balance: 1}, {...record, earned: -1}, {...record, spent: 24},
    {...record, upgrades: ['shield-cell']}, {...record, runSequence: 1},
    {...record, purchases: [{id: 'a', sku: 'shield-cell', price: 0}]},
    {...record, purchases: [{id: 'a', sku: '__proto__', price: 0}]},
    {...record, upgrades: ['shield-cell', 'shield-cell']},
    {...record, activeRun: {id: 'salvage-run:1', sequence: 1, scope: 'classic', claimed: []}}];
  for (const value of invalid) assert.equal(normalizeScrapRecord(value), null);
  const normalized = normalizeScrapRecord(record);
  normalized.upgrades.push('shield-cell');
  assert.deepEqual(record.upgrades, [], 'normalization never returns caller-owned mutable arrays');
});

test('invalid requests fail before any write, and returned snapshots cannot mutate durable balances or receipts', () => {
  const device = memory(), log = ledger(device);
  for (const input of [{}, {scope: ''}, {scope: 'classic', fresh: 'true'}]) assert.throws(() => log.beginRun(input), TypeError);
  for (const input of [{}, {runId: 'x', dropId: '', enemyType: 'scout'},
    {runId: 'x', dropId: 'y', enemyType: '__proto__'}]) assert.throws(() => log.claimDrop(input), TypeError);
  for (const input of [{}, {transactionId: '', sku: 'shield-cell'},
    {transactionId: 'x', sku: '__proto__'}]) assert.throws(() => log.purchase(input), TypeError);
  assert.equal(device.writes.length, 0);
  const run = start(log); fund(log, run.runId, 1);
  const copy = log.getState(); copy.balance = 999; copy.activeRun.claimed.length = 0;
  assert.equal(log.getBalance(), 9);
  assert.equal(log.claimDrop({runId: run.runId, dropId: 'stage:1:enemy:0', enemyType: 'scout'}).duplicate, true);
  assert.equal(log.getBalance(), 9);
});
