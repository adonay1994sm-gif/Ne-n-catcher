/**
 * Classic-only salvage ledger. One localStorage value commits money, the
 * purchased entitlement and its receipt together. It deliberately knows
 * nothing about campaign saves, weapon ownership, rendering or browser time.
 */
export const SCRAP_ECONOMY_KEY = 'neonCatcher.classicSalvage.v1';
export const SCRAP_ECONOMY_RULES = Object.freeze({
  version: 1, silver: 100000, gold: 10000000, stellar: 100000000,
  maxDropReceipts: 512, maxPurchaseReceipts: 128, maxInvalidBackups: 8
});

export const SCRAP_REWARDS = Object.freeze({raider: 6, scout: 9, interceptor: 15, atlas: 180});
export const SCRAP_UPGRADES = Object.freeze({
  'twin-preparation': Object.freeze({id: 'twin-preparation', price: 24,
    label: 'Preparar emisor', description: 'Prepara la pieza recuperada; Gemelo sigue requiriendo vencer a Atlas.'}),
  'shield-cell': Object.freeze({id: 'shield-cell', price: 30,
    label: 'Célula de escudo', description: 'Activa tres segundos de protección al salir de C9 o entrar en una etapa.'}),
  'coolant-feed': Object.freeze({id: 'coolant-feed', price: 45,
    label: 'Alimentación refrigerada', description: 'Recupera un proyectil cada 1,5 segundos en lugar de cada dos.'})
});

const integer = value => Number.isSafeInteger(value) && value >= 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const identifier = value => typeof value === 'string' && value.length > 0 && value.length <= 160 &&
  !/[\u0000-\u001f\u007f]/.test(value);
const copy = value => JSON.parse(JSON.stringify(value));
const has = (value, key) => Object.hasOwn(value, key);
const enemyAliases = Object.freeze({'ch-01': 'scout', 'ch01': 'scout', 'ch-02': 'interceptor',
  'ch02': 'interceptor', 'guardian-atlas': 'atlas'});
const enemyName = type => typeof type !== 'string' ? null : has(SCRAP_REWARDS, type) ? type :
  has(enemyAliases, type) ? enemyAliases[type] : null;

export function rewardForEnemy(type) {
  const name = enemyName(type);
  return name === null ? 0 : SCRAP_REWARDS[name];
}

/** No rounded shorthand: the visible exchange rates always retain the base remainder. */
export function formatDenominations(balance) {
  if (!integer(balance)) throw new TypeError('Salvage balance must be a nonnegative safe integer');
  let remaining = balance;
  const stellar = Math.floor(remaining / SCRAP_ECONOMY_RULES.stellar);
  remaining %= SCRAP_ECONOMY_RULES.stellar;
  const gold = Math.floor(remaining / SCRAP_ECONOMY_RULES.gold);
  remaining %= SCRAP_ECONOMY_RULES.gold;
  const silver = Math.floor(remaining / SCRAP_ECONOMY_RULES.silver);
  const scrap = remaining % SCRAP_ECONOMY_RULES.silver;
  const parts = [[stellar, 'estelar', 'estelares'], [gold, 'oro', 'oro'],
    [silver, 'plata', 'plata'], [scrap, 'chatarra', 'chatarra']]
    .filter(([amount]) => amount > 0).map(([amount, singular, plural]) =>
      `${amount} ${amount === 1 ? singular : plural}`);
  return {scrap, silver, gold, stellar, label: parts.join(' · ') || '0 chatarra'};
}

export function createScrapRecord() {
  return {version: 1, balance: 0, earned: 0, spent: 0, runSequence: 0,
    activeRun: null, upgrades: [], purchases: []};
}

/** Unknown versions and malformed monetary relationships are never migrated by guessing. */
export function normalizeScrapRecord(value) {
  if (!object(value) || value.version !== 1 ||
      !['balance', 'earned', 'spent', 'runSequence'].every(key => integer(value[key])) ||
      value.earned < value.spent || value.balance !== value.earned - value.spent ||
      !Array.isArray(value.upgrades) || value.upgrades.length > Object.keys(SCRAP_UPGRADES).length ||
      value.upgrades.some(sku => typeof sku !== 'string' || !has(SCRAP_UPGRADES, sku)) ||
      new Set(value.upgrades).size !== value.upgrades.length ||
      !Array.isArray(value.purchases) || value.purchases.length > SCRAP_ECONOMY_RULES.maxPurchaseReceipts) return null;
  const transactionIds = new Set(), purchased = new Set();
  let spent = 0;
  for (const receipt of value.purchases) {
    if (!object(receipt) || !identifier(receipt.id) || transactionIds.has(receipt.id) ||
        typeof receipt.sku !== 'string' || !has(SCRAP_UPGRADES, receipt.sku) || purchased.has(receipt.sku) ||
        receipt.price !== SCRAP_UPGRADES[receipt.sku].price) return null;
    transactionIds.add(receipt.id); purchased.add(receipt.sku); spent += receipt.price;
  }
  if (spent !== value.spent || value.upgrades.length !== purchased.size ||
      value.upgrades.some(sku => !purchased.has(sku))) return null;
  if (value.activeRun !== null) {
    const run = value.activeRun;
    if (!object(run) || run.sequence !== value.runSequence || run.sequence < 1 ||
        run.id !== `salvage-run:${run.sequence}` || !identifier(run.scope) ||
        !Array.isArray(run.claimed) || run.claimed.length > SCRAP_ECONOMY_RULES.maxDropReceipts) return null;
    const dropIds = new Set();
    let earnedThisRun = 0;
    for (const receipt of run.claimed) {
      if (!object(receipt) || !identifier(receipt.id) || dropIds.has(receipt.id) ||
          typeof receipt.enemyType !== 'string' || !has(SCRAP_REWARDS, receipt.enemyType) ||
          receipt.amount !== SCRAP_REWARDS[receipt.enemyType]) return null;
      dropIds.add(receipt.id); earnedThisRun += receipt.amount;
    }
    if (earnedThisRun > value.earned) return null;
  } else if (value.runSequence !== 0) return null;
  // Preserve only the public v1 data, not caller prototypes or optional callbacks.
  return {version: 1, balance: value.balance, earned: value.earned, spent: value.spent,
    runSequence: value.runSequence, activeRun: value.activeRun === null ? null : {
      id: value.activeRun.id, scope: value.activeRun.scope, sequence: value.activeRun.sequence,
      claimed: value.activeRun.claimed.map(receipt => ({id: receipt.id,
        enemyType: receipt.enemyType, amount: receipt.amount}))},
    upgrades: [...value.upgrades], purchases: value.purchases.map(receipt => ({
      id: receipt.id, sku: receipt.sku, price: receipt.price}))};
}

/**
 * Supply stable enemy IDs (stage + deterministic spawn serial) as dropId.
 * beginRun() resumes the durable run by default. Only a deliberate new
 * expedition uses fresh:true; restoring a checkpoint must not reset receipts.
 * Receipt capacity is bounded without evicting any ID during that run.
 */
export function createScrapLedger({storage, key = SCRAP_ECONOMY_KEY} = {}) {
  if (!storage || typeof storage.readRaw !== 'function' || typeof storage.setJSON !== 'function' ||
      !identifier(key)) throw new TypeError('Tagged readRaw/setJSON storage and a valid save key are required');
  const backupKey = `${key}:invalid-backups`;
  let current = null;
  const blocked = (reason, extra = {}) => ({ok: false, status: 'blocked', reason, ...extra});
  const success = (status, extra = {}) => ({ok: true, status, state: copy(current), ...extra});
  function read(target) {
    try {
      const result = storage.readRaw(target);
      return result?.ok === true && (result.value === null || typeof result.value === 'string')
        ? result : {ok: false};
    } catch { return {ok: false}; }
  }
  function writeJSON(target, value) {
    try { return storage.setJSON(target, value) === true; } catch { return false; }
  }
  function preserveInvalid(raw) {
    const loaded = read(backupKey);
    if (!loaded.ok) return blocked('backup-read-denied', {key: backupKey});
    let records = [];
    if (loaded.value !== null) {
      try {
        const backup = JSON.parse(loaded.value);
        if (!object(backup) || backup.version !== 1 || !Array.isArray(backup.records) ||
            backup.records.length > SCRAP_ECONOMY_RULES.maxInvalidBackups ||
            backup.records.some(record => typeof record !== 'string')) return blocked('invalid-backup', {key: backupKey});
        records = backup.records;
      } catch { return blocked('invalid-backup', {key: backupKey}); }
    }
    if (records.includes(raw)) return blocked('invalid-save-backed-up', {key, backupKey});
    if (records.length >= SCRAP_ECONOMY_RULES.maxInvalidBackups) return blocked('backup-capacity', {key: backupKey});
    const snapshot = {version: 1, records: [...records, raw]};
    if (!writeJSON(backupKey, snapshot)) return blocked('backup-write-denied', {key: backupKey});
    return blocked('invalid-save-backed-up', {key, backupKey});
  }
  function readState() {
    current = null;
    const loaded = read(key);
    if (!loaded.ok) return {error: blocked('storage-read-denied', {key})};
    if (loaded.value === null) {
      current = createScrapRecord();
      return {raw: null};
    }
    let parsed;
    try { parsed = JSON.parse(loaded.value); } catch { return {error: preserveInvalid(loaded.value)}; }
    if (object(parsed) && integer(parsed.version) && parsed.version !== 1) {
      return {error: blocked('unsupported-save-version', {key})};
    }
    current = normalizeScrapRecord(parsed);
    return current === null ? {error: preserveInvalid(loaded.value)} : {raw: loaded.value};
  }
  function commit(next, beforeRaw, extra = {}) {
    const normalized = normalizeScrapRecord(next);
    if (normalized === null) throw new TypeError('Invalid salvage transaction');
    const before = read(key);
    if (!before.ok) { current = null; return blocked('storage-read-denied', {key}); }
    if (before.value !== beforeRaw) { current = null; return blocked('save-conflict', {key}); }
    const snapshot = copy(normalized);
    const written = writeJSON(key, snapshot);
    // An interrupted facade can report false after the atomic set completed.
    // Verification recognizes that commit; an uncertain write never grants UI success.
    const after = read(key);
    if (!after.ok || after.value !== JSON.stringify(snapshot)) {
      current = null;
      return blocked(after.ok && written ? 'save-conflict' : 'storage-write-denied', {key});
    }
    current = normalized;
    return success('committed', extra);
  }
  function load() {
    const loaded = readState();
    return loaded.error || success(loaded.raw === null ? 'new' : 'loaded');
  }
  function beginRun({scope, fresh = false} = {}) {
    if (!identifier(scope) || typeof fresh !== 'boolean') throw new TypeError('A stable run scope and boolean fresh flag are required');
    const loaded = readState();
    if (loaded.error) return loaded.error;
    if (current.activeRun && !fresh) {
      if (current.activeRun.scope !== scope) return blocked('run-scope-conflict', {runId: current.activeRun.id});
      return success('resumed', {runId: current.activeRun.id, duplicate: true});
    }
    if (current.runSequence === Number.MAX_SAFE_INTEGER) return blocked('run-capacity');
    const next = copy(current), sequence = next.runSequence + 1;
    next.runSequence = sequence;
    next.activeRun = {id: `salvage-run:${sequence}`, sequence, scope, claimed: []};
    return commit(next, loaded.raw, {runId: next.activeRun.id});
  }
  function claimDrop({runId, dropId, enemyType} = {}) {
    const type = enemyName(enemyType);
    if (!identifier(runId) || !identifier(dropId) || type === null) throw new TypeError('A known enemy and stable run/drop IDs are required');
    const loaded = readState();
    if (loaded.error) return loaded.error;
    if (!current.activeRun || current.activeRun.id !== runId) return blocked('inactive-run');
    const prior = current.activeRun.claimed.find(receipt => receipt.id === dropId);
    if (prior) return prior.enemyType === type
      ? success('duplicate', {duplicate: true, amount: 0, originalAmount: prior.amount})
      : blocked('drop-id-conflict');
    if (current.activeRun.claimed.length >= SCRAP_ECONOMY_RULES.maxDropReceipts) return blocked('drop-receipt-capacity');
    const amount = SCRAP_REWARDS[type];
    if (!Number.isSafeInteger(current.earned + amount)) return blocked('balance-capacity');
    const next = copy(current);
    next.balance += amount; next.earned += amount;
    next.activeRun.claimed.push({id: dropId, enemyType: type, amount});
    return commit(next, loaded.raw, {amount, duplicate: false, runId, dropId});
  }
  function purchase({transactionId, sku} = {}) {
    if (!identifier(transactionId) || typeof sku !== 'string' || !has(SCRAP_UPGRADES, sku)) throw new TypeError('A stable transaction ID and catalogue SKU are required');
    const loaded = readState();
    if (loaded.error) return loaded.error;
    const prior = current.purchases.find(receipt => receipt.id === transactionId);
    if (prior) return prior.sku === sku ? success('duplicate', {duplicate: true, sku, price: 0})
      : blocked('transaction-id-conflict');
    if (current.upgrades.includes(sku)) return {ok: false, status: 'unavailable', reason: 'already-owned', state: copy(current)};
    if (current.purchases.length >= SCRAP_ECONOMY_RULES.maxPurchaseReceipts) return blocked('purchase-receipt-capacity');
    const price = SCRAP_UPGRADES[sku].price;
    if (current.balance < price) return {ok: false, status: 'unavailable', reason: 'insufficient-funds', price,
      missing: price - current.balance, state: copy(current)};
    const next = copy(current);
    next.balance -= price; next.spent += price; next.upgrades.push(sku);
    next.purchases.push({id: transactionId, sku, price});
    return commit(next, loaded.raw, {sku, price, duplicate: false});
  }
  return Object.freeze({key, backupKey, load, beginRun, claimDrop,
    grant: ({runId, rewardId, enemyType} = {}) => claimDrop({runId, dropId: rewardId, enemyType}),
    purchase, getState: () => current === null ? null : copy(current),
    getBalance: () => current?.balance ?? null});
}
