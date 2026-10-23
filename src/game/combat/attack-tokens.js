/**
 * Turnos de ataque (diseño de campaña 6.9): solo `max` enemigos atacan a la
 * vez; el resto se recoloca, flanquea o protege. Si varios piden turno en el
 * mismo instante, gana el que más tiempo lleva vivo (menor `bornAt`). Un
 * ataque ya en curso (turno concedido en un instante anterior) no se quita.
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
  let youngest = null;
  for (const [id, holder] of holders) {
    if (holder.grantedAt === now && (!youngest || holder.bornAt > youngest[1].bornAt)) youngest = [id, holder];
  }
  if (!youngest || enemy.bornAt >= youngest[1].bornAt) return false;
  holders.delete(youngest[0]);
  holders.set(enemy.id, {bornAt: enemy.bornAt, grantedAt: now});
  return true;
}

export function releaseAttack(tokens, enemyId) {
  tokens.holders.delete(enemyId);
}

export function forgetEnemy(tokens, enemyId) {
  tokens.holders.delete(enemyId);
}

export const attackHolders = tokens => [...tokens.holders.keys()];
