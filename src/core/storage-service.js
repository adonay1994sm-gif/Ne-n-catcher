export function createStorageService(storage) {
  const safe = (operation, fallback) => {
    try { return operation(); } catch { return fallback; }
  };
  const resolveStorage = () => storage ?? globalThis.localStorage;
  return Object.freeze({
    getRaw(key, fallback = null) {
      return safe(() => resolveStorage().getItem(key) ?? fallback, fallback);
    },
    getNumber(key, fallback = 0) {
      return safe(() => {
        const raw = resolveStorage().getItem(key);
        if (raw == null || raw === "") return fallback;
        const value = Number(raw);
        return Number.isFinite(value) ? value : fallback;
      }, fallback);
    },
    getJSON(key, fallback) {
      return safe(() => {
        const raw = resolveStorage().getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      }, fallback);
    },
    set(key, value) { return safe(() => (resolveStorage().setItem(key, String(value)), true), false); },
    setJSON(key, value) { return safe(() => (resolveStorage().setItem(key, JSON.stringify(value)), true), false); },
    remove(key) { return safe(() => (resolveStorage().removeItem(key), true), false); }
  });
}
