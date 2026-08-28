export function resolveDamage({ hull, amount, shieldActive }) {
  const safeHull = Math.max(0, Number(hull) || 0);
  const safeAmount = Math.max(0, Number(amount) || 0);
  if (shieldActive) return Object.freeze({ hull: safeHull, absorbed: true, destroyed: false });
  const nextHull = Math.max(0, safeHull - safeAmount);
  return Object.freeze({ hull: nextHull, absorbed: false, destroyed: nextHull <= 0 });
}
