/**
 * Turnos de ataque (diseño de campaña 6.9): solo `max` enemigos atacan a la
 * vez; el resto se recoloca, flanquea o protege. Un turno concedido no se
 * quita: la prioridad del que más tiempo lleva vivo la da el orden de las
 * peticiones (decideEnemyIntents pide por `bornAt`, revisión F2).
 * Puro: el reloj es el `now` de juego que pasa el llamador.
 *
 * Cola (plan F3b): quien pide sin sitio espera; al quedar un turno libre pasa
 * el que más tiempo lleva vivo, aunque pida después. Quien deja de pedir
 * durante WAIT_EXPIRY segundos sale de la cola, para no bloquear a nadie.
 */
const WAIT_EXPIRY = .5;
export function createAttackTokens({max}) {
  if (!Number.isInteger(max) || max < 1) throw new RangeError('max must be a positive integer');
  return {max, holders: new Map(), waiting: new Map()};
}

export function requestAttack(tokens, enemy, now) {
  const {holders, waiting} = tokens;
  if (holders.has(enemy.id)) return true;
  for (const [id, entry] of waiting) if (now - entry.at > WAIT_EXPIRY) waiting.delete(id);
  const olderWaiting = [...waiting].some(([id, entry]) => id !== enemy.id && entry.bornAt < enemy.bornAt);
  if (holders.size < tokens.max && !olderWaiting) {
    waiting.delete(enemy.id);
    holders.set(enemy.id, {bornAt: enemy.bornAt, grantedAt: now});
    return true;
  }
  waiting.set(enemy.id, {bornAt: enemy.bornAt, at: now});
  return false;
}

export function releaseAttack(tokens, enemyId) {
  tokens.holders.delete(enemyId);
}

export function forgetEnemy(tokens, enemyId) {
  tokens.holders.delete(enemyId);
  tokens.waiting.delete(enemyId);
}

export const attackHolders = tokens => [...tokens.holders.keys()];
