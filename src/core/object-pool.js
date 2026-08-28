export function createObjectPool(factory = () => ({}), reset = (item) => item, maximum = 256) {
  const available = [];
  let created = 0;
  return Object.freeze({
    acquire(seed = {}) {
      const item = available.pop() || factory();
      if (!item.__poolCreated) {
        Object.defineProperty(item, "__poolCreated", { value: true, enumerable: false });
        created += 1;
      }
      Object.assign(item, seed);
      return item;
    },
    release(item) {
      if (!item || available.length >= maximum) return;
      reset(item);
      available.push(item);
    },
    stats() { return { created, available: available.length, maximum }; }
  });
}
