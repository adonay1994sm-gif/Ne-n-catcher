/**
 * Turnos de ataque (diseño de campaña 6.9): solo `max` enemigos atacan a la
 * vez; el resto se recoloca, flanquea o protege. Un turno concedido no se
 * quita: la prioridad del que más tiempo lleva vivo la da el orden de las
 * peticiones (decideEnemyIntents pide por `bornAt`, revisión F2).
 * Puro: el reloj es el `now` de juego que pasa el llamador.
 */
export function createAttackTokens({max}) {
  if (!Number.isInteger(max) || max < 1) throw new RangeError('max must be a positive integer');
  return {max, holders: new Map()};
}

export function requestAttack(tokens, enemy, now) {
  const {holders} = tokens;
  if (holders.has(enemy.id)) return true;
  if (holders.size < tokens.max) {
    holders.set(enemy.id, {bornAt: enemy.bornAt, grantedAt: now});
    return true;
  }
  return false;
}

export function releaseAttack(tokens, enemyId) {
  tokens.holders.delete(enemyId);
}

export function forgetEnemy(tokens, enemyId) {
  tokens.holders.delete(enemyId);
}

export const attackHolders = tokens => [...tokens.holders.keys()];
