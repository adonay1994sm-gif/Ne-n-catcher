const finite = (value, name) => {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
};

/** Classic-only reserve points; the existing hull remains the hull authority. */
export const HULL_REINFORCEMENT_RULES = Object.freeze({
  version: 'hull-reinforcement-v1', maxHull: 100, baseCapacity: 30,
  reinforcedCapacity: 45, advancedCapacity: 65, phaserDamage: 10, heavyPhaserDamage: 15,
  largeAsteroidHullDamage: 38, protectedLargeAsteroidHullDamage: 20
});

/**
 * Pure damage resolution, with no timers or persistence. Ordinary damage spends
 * reserve first and carries its exact remainder into hull. A large asteroid
 * breaks every remaining reserve point: that protection reduces its hull blow
 * to 20; without any reserve the same impact costs 38 hull. This is a reversible
 * balance choice, not a conversion of reserve points into temporary immunity.
 */
export function resolveHullReinforcement({hull, reserve, capacity = 30,
  amount, kind = 'collision', largeAsteroid = false, largeAsteroidScale = 1} = {}) {
  finite(hull, 'hull'); finite(reserve, 'reserve'); finite(capacity, 'capacity');
  finite(amount, 'damage'); finite(largeAsteroidScale, 'largeAsteroidScale');
  if (hull < 0 || hull > 100 || ![30, 45, 65].includes(capacity) || reserve < 0 ||
      reserve > capacity || amount < 0 || typeof largeAsteroid !== 'boolean' ||
      largeAsteroidScale <= 0 || largeAsteroidScale > 1 ||
      !['collision', 'phaser', 'heavyPhaser', 'largeAsteroid'].includes(kind)) {
    throw new RangeError('Invalid reinforced hull damage request');
  }
  let incoming = amount;
  if (amount > 0 && kind === 'phaser') incoming = HULL_REINFORCEMENT_RULES.phaserDamage;
  if (amount > 0 && kind === 'heavyPhaser') incoming = HULL_REINFORCEMENT_RULES.heavyPhaserDamage;
  const large = (largeAsteroid || kind === 'largeAsteroid') && incoming > 0;
  const reserveDamage = large ? reserve : Math.min(reserve, incoming);
  // largeAsteroidScale: rebaja de los tramos de aprendizaje (1.1 y 1.2).
  const hullImpact = large ? Math.round((reserve > 0 ? HULL_REINFORCEMENT_RULES.protectedLargeAsteroidHullDamage :
    HULL_REINFORCEMENT_RULES.largeAsteroidHullDamage) * largeAsteroidScale) : Math.max(0, incoming - reserveDamage);
  const nextHull = Math.max(0, hull - hullImpact), nextReserve = reserve - reserveDamage;
  return {
    hull: nextHull, reserve: nextReserve, capacity,
    reserveDamage, hullDamage: hull - nextHull, requestedHullDamage: hullImpact,
    absorbed: incoming > 0 && reserveDamage > 0 && hullImpact === 0,
    shieldBroken: reserve > 0 && nextReserve === 0,
    destroyed: nextHull === 0
  };
}
