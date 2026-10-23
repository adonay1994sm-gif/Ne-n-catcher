/**
 * Meteoritos dirigidos (spec 6.10, plan F3b): sustituyen en el sector a la
 * lluvia con pasillo marcado (J04). Cada meteorito se avisa en el borde de
 * arriba y, `warning` segundos después, sale hacia donde estaba la nave al
 * avisar, sin perseguirla. Siempre se pueden esquivar: aviso + vuelo dan más
 * de 1,2 s de reacción y entre dos meteoritos pasan al menos 0,6 s.
 * Puro: reloj propio que avanza el llamador y azar con semilla.
 */
export const AIMED_METEOR_RULES = Object.freeze({warning: .8, speed: 470, gap: .75, jitter: .5, first: 1, count: 10,
  radius: 22, damage: 14, margin: 40, entryY: -40});

function nextRandom(state) {
  state.rng = (state.rng + 0x6D2B79F5) >>> 0;
  let value = Math.imul(state.rng ^ state.rng >>> 15, 1 | state.rng);
  value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
}

export function createAimedMeteorRain({seed = 0, width, height, count = AIMED_METEOR_RULES.count}) {
  if (![seed, width, height].every(Number.isFinite) || !Number.isInteger(count) || count < 1) throw new RangeError('Invalid aimed meteor rain');
  return {width, height, count, clock: 0, next: AIMED_METEOR_RULES.first, announced: 0, pending: [], done: false,
    rng: (Math.imul(Math.trunc(seed) >>> 0, 0x9E3779B9) ^ 0x2545F491) >>> 0};
}

/** Avanza la lluvia; emite {type:'warning', id, x, y} y luego
 * {type:'meteor', id, x, y, vx, vy, damage}. */
export function advanceAimedMeteorRain(state, dt, player, emit) {
  if (state.done || !(dt > 0)) return;
  const {warning, speed, gap, jitter, margin, entryY, damage} = AIMED_METEOR_RULES;
  state.clock += dt;
  while (state.announced < state.count && state.clock >= state.next) {
    const id = `aimed-meteor:${state.announced}`;
    const x = margin + nextRandom(state) * (state.width - margin * 2);
    state.pending.push({id, at: state.next + warning, x, y: entryY, aim: {x: player.x, y: player.y}});
    emit({type: 'warning', id, x, y: 0});
    state.announced++;
    state.next += gap + nextRandom(state) * jitter;
  }
  while (state.pending.length && state.clock >= state.pending[0].at) {
    const meteor = state.pending.shift();
    const dx = meteor.aim.x - meteor.x, dy = meteor.aim.y - meteor.y, length = Math.hypot(dx, dy) || 1;
    emit({type: 'meteor', id: meteor.id, x: meteor.x, y: meteor.y, vx: dx / length * speed, vy: dy / length * speed, damage});
  }
  state.done = state.announced === state.count && state.pending.length === 0;
}
