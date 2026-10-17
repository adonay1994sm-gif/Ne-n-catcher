/**
 * A bounded write-ahead log for the legacy completion keys, not a second save.
 * localStorage writes are individually atomic, not a multi-key transaction.
 * Persist an intent first and replay monotonic targets after interruption. Keep
 * its last receipt so retrying the same completionId is harmless.
 * No clock, browser global, reward callback, analytics or campaign migration.
 */
export function createCompletionJournal({storage, keys, levelCount,
  checkpointKey = null, validateCheckpoint = null} = {}) {
  const names = ['stars', 'unlocked', 'best', 'levelBest'];
  if (!storage || !['readRaw', 'set', 'setJSON'].every(name => typeof storage[name] === 'function')) {
    throw new TypeError('Storage facade with tagged readRaw/set/setJSON required');
  }
  if (!Number.isSafeInteger(levelCount) || levelCount < 1 ||
      !keys || !names.every(name => typeof keys[name] === 'string' && keys[name])) {
    throw new TypeError('Existing campaign keys and positive levelCount required');
  }
  keys = Object.freeze(Object.fromEntries(names.map(name => [name, keys[name]])));
  const targets = names.map(name => keys[name]);
  if (new Set(targets).size !== names.length ||
      (checkpointKey !== null && (typeof checkpointKey !== 'string' || !checkpointKey || targets.includes(checkpointKey)))) {
    throw new TypeError('Save keys must be distinct');
  }
  if (checkpointKey !== null && typeof validateCheckpoint !== 'function') {
    throw new TypeError('Checkpoint writes require the runtime validator');
  }
  const journalKey = `${keys.unlocked}:completion-journal:v1`;
  if (targets.includes(journalKey) || checkpointKey === journalKey) throw new TypeError('Journal key collision');
  const scope = JSON.stringify([...targets, checkpointKey, levelCount]);
  const unreadable = Object.freeze({});
  const integer = (value, min = 0) => Number.isSafeInteger(value) && value >= min;
  const result = (ok, status, extra = {}) => ({ok, status, ...extra});
  const blocked = (reason, key) => result(false, 'blocked', {reason, key});
  const read = key => {
    try {
      const outcome = storage.readRaw(key);
      return outcome?.ok === true && (outcome.value === null || typeof outcome.value === 'string')
        ? outcome.value : unreadable;
    } catch { return unreadable; }
  };
  const write = (key, value, json = false) => {
    try { return (json ? storage.setJSON(key, value) : storage.set(key, value)) === true; } catch { return false; }
  };
  const checkpointValid = value => {
    try { return validateCheckpoint(value) === true; } catch { return false; }
  };
  function parseNumber(raw, fallback, min = 0) {
    if (raw === null || raw === '') return fallback;
    const value = Number(raw);
    return integer(value, min) ? value : null;
  }
  function parseMap(raw) {
    if (raw === null) return {};
    try {
      const value = JSON.parse(raw);
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch { return null; }
  }
  function readSave() {
    const raw = {};
    for (const name of names) {
      raw[name] = read(keys[name]);
      if (raw[name] === unreadable) return {error: blocked('storage-read-denied', keys[name])};
    }
    const save = {raw, stars: parseMap(raw.stars), levelBest: parseMap(raw.levelBest),
      unlocked: parseNumber(raw.unlocked, 1, 1), best: parseNumber(raw.best, 0)};
    for (const name of names) if (save[name] === null) return {error: blocked('invalid-existing-save', keys[name])};
    return save;
  }
  function validRecord(record) {
    if (!record || typeof record !== 'object' || record.version !== 1 || record.scope !== scope ||
        !['pending', 'committed'].includes(record.phase) || typeof record.id !== 'string' ||
        record.id.length < 1 || record.id.length > 200 || !integer(record.level, 1) || record.level > levelCount ||
        !integer(record.stars, 1) || record.stars > 3 || !integer(record.score) ||
        !integer(record.unlockTo, 1) || record.unlockTo > levelCount) return false;
    if (record.checkpoint === null) return true;
    return checkpointKey !== null && record.checkpoint &&
      (record.checkpoint.before === null || typeof record.checkpoint.before === 'string') &&
      checkpointValid(record.checkpoint.after);
  }
  function readRecord() {
    const raw = read(journalKey);
    if (raw === unreadable) return {error: blocked('storage-read-denied', journalKey)};
    if (raw === null) return {record: null};
    try {
      const record = JSON.parse(raw);
      return validRecord(record) ? {record} : {error: blocked('invalid-journal', journalKey)};
    } catch { return {error: blocked('invalid-journal', journalKey)}; }
  }
  function replay(record) {
    const save = readSave();
    if (save.error) return save.error;
    const key = String(record.level);
    const oldStars = parseNumber(save.stars[key] === undefined ? null : save.stars[key], 0);
    const oldBest = parseNumber(save.levelBest[key] === undefined ? null : save.levelBest[key], 0);
    if (oldStars === null || oldStars > 3) return blocked('invalid-existing-save', keys.stars);
    if (oldBest === null) return blocked('invalid-existing-save', keys.levelBest);
    let checkpointRaw = null, checkpointAfter = null;
    if (record.checkpoint !== null) {
      checkpointRaw = read(checkpointKey);
      if (checkpointRaw === unreadable) return blocked('storage-read-denied', checkpointKey);
      checkpointAfter = JSON.stringify(record.checkpoint.after);
      // A newer/different route save belongs to its owner. Never roll it back.
      if (checkpointRaw !== record.checkpoint.before && checkpointRaw !== checkpointAfter) {
        return blocked('checkpoint-conflict', checkpointKey);
      }
    }
    const stars = {...save.stars, [key]: Math.max(oldStars, record.stars)};
    const bests = {...save.levelBest, [key]: Math.max(oldBest, record.score)};
    const writes = [
      [keys.stars, stars, true, save.raw.stars],
      [keys.levelBest, bests, true, save.raw.levelBest],
      [keys.best, Math.max(save.best, record.score), false, save.raw.best],
      ...(record.checkpoint === null ? [] : [[checkpointKey, record.checkpoint.after, true, checkpointRaw]]),
      [keys.unlocked, Math.max(save.unlocked, record.unlockTo), false, save.raw.unlocked]
    ];
    for (const [target, value, json, current] of writes) {
      if ((json ? JSON.stringify(value) : String(value)) === current) continue;
      if (!write(target, value, json)) return result(false, 'pending', {reason: 'storage-write-denied', key: target, completionId: record.id});
    }
    if (!write(journalKey, {...record, phase: 'committed'}, true)) {
      return result(false, 'pending', {reason: 'receipt-write-denied', key: journalKey, completionId: record.id});
    }
    return result(true, 'committed', {completionId: record.id,
      newlyUnlocked: record.unlockTo > save.unlocked});
  }
  function recover() {
    const loaded = readRecord();
    if (loaded.error) return loaded.error;
    if (!loaded.record) return result(true, 'idle');
    if (loaded.record.phase === 'committed') return result(true, 'committed', {
      completionId: loaded.record.id, duplicate: true});
    return {...replay(loaded.record), recovered: true};
  }
  function complete({completionId, level, stars, score, checkpoint = null} = {}) {
    if (typeof completionId !== 'string' || !completionId || completionId.length > 200 ||
        !integer(level, 1) || level > levelCount || !integer(stars, 1) || stars > 3 || !integer(score)) {
      throw new TypeError('Valid completionId, campaign level, stars and score required');
    }
    // Finish an earlier intent before replacing it with this run's intent.
    const recovery = recover();
    if (!recovery.ok || recovery.completionId === completionId) return recovery;
    const save = readSave();
    if (save.error) return save.error;
    if (save.unlocked > levelCount) return blocked('unsupported-campaign-progress', keys.unlocked);
    let checkpointIntent = null;
    if (checkpoint !== null) {
      if (!checkpointKey || !checkpointValid(checkpoint)) throw new TypeError('Invalid completion checkpoint');
      const before = read(checkpointKey);
      if (before === unreadable) return blocked('storage-read-denied', checkpointKey);
      if (before !== null) {
        try {
          if (!checkpointValid(JSON.parse(before))) return blocked('invalid-existing-checkpoint', checkpointKey);
        } catch { return blocked('invalid-existing-checkpoint', checkpointKey); }
      }
      // Snapshot the payload: later runtime mutations cannot alter its intent.
      let after;
      try { after = JSON.parse(JSON.stringify(checkpoint)); } catch { throw new TypeError('Checkpoint must be JSON data'); }
      if (!checkpointValid(after)) throw new TypeError('Invalid JSON checkpoint');
      checkpointIntent = {before, after};
    }
    const record = {version: 1, scope, phase: 'pending', id: completionId, level, stars, score,
      unlockTo: save.unlocked === level ? Math.min(levelCount, level + 1) : save.unlocked,
      checkpoint: checkpointIntent};
    // No target key is changed unless this write-ahead record was accepted.
    if (!write(journalKey, record, true)) return result(false, 'blocked', {
      reason: 'intent-write-denied', key: journalKey, completionId});
    return replay(record);
  }
  return Object.freeze({complete, recover, journalKey});
}
