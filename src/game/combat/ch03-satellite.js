/**
 * Satélite de defensa CH-03, subjefe del sector 1 (biblia §3.1, plan F3c).
 * Tres ataques, siempre avisados: barrido láser (el hueco está detrás del
 * rayo), anillo de cañones (dos anillos de 8) y rejilla de negación (columnas
 * que se encienden por partes; la columna segura se mueve). Sin furia.
 * Puro: reloj de juego que pasa el llamador y azar con semilla.
 */
export const CH03_RULES = Object.freeze({
  hp: 40, entrySeconds: 2, holdY: .24, warning: .8, rest: 1.2, defeatSeconds: 1.4,
  // ±0,5 rad: a la altura de la nave el rayo recorre la pantalla de borde a borde.
  sweep: Object.freeze({range: .5, speed: .3, width: 28, damage: 14}),
  ring: Object.freeze({count: 8, speed: 260, gap: .5, tail: .3, damage: 12}),
  grid: Object.freeze({columns: 6, steps: 4, warning: .7, active: .5, damage: 16})
});
const ORDER = Object.freeze(['sweep', 'ring', 'grid']);

function nextRandom(boss) {
  boss.rng = (boss.rng + 0x6D2B79F5) >>> 0;
  let value = Math.imul(boss.rng ^ boss.rng >>> 15, 1 | boss.rng);
  value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
}

export function createCh03Satellite({width, height, seed = 0}) {
  if (![width, height, seed].every(Number.isFinite) || width < 280 || height < 540) throw new RangeError('Invalid CH-03 arena');
  return {width, height, x: width / 2, y: -120, holdY: height * CH03_RULES.holdY,
    hp: CH03_RULES.hp, maxHp: CH03_RULES.hp, state: 'entry', stateTime: 0, attack: null, attacks: 0,
    beam: null, grid: null, ringsFired: 0, resolved: false, defeatAnnounced: false,
    rng: (Math.imul(Math.trunc(seed) >>> 0, 0x9E3779B9) ^ 0x43483033) >>> 0};
}

function chooseAttack(boss) {
  if (boss.attacks < ORDER.length) return ORDER[boss.attacks];
  const options = ORDER.filter(attack => attack !== boss.attack);
  return options[Math.floor(nextRandom(boss) * options.length)];
}

function enter(boss, state) { boss.state = state; boss.stateTime = 0; }

function startAttack(boss, emit) {
  enter(boss, 'attack');
  if (boss.attack === 'sweep') {
    const direction = nextRandom(boss) < .5 ? -1 : 1;
    boss.beam = {angle: -direction * CH03_RULES.sweep.range, direction, active: true};
  } else if (boss.attack === 'ring') {
    boss.ringsFired = 0; fireRing(boss, emit);
  } else {
    boss.grid = {columns: CH03_RULES.grid.columns, step: 0, safe: Math.floor(nextRandom(boss) * CH03_RULES.grid.columns),
      active: false, time: 0};
  }
}

function fireRing(boss, emit) {
  const {count, speed, damage} = CH03_RULES.ring, offset = boss.ringsFired * Math.PI / count;
  for (let k = 0; k < count; k++) {
    const angle = offset + k * 2 * Math.PI / count;
    emit({type: 'projectile', x: boss.x, y: boss.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage});
  }
  boss.ringsFired++;
}

function endAttack(boss) {
  boss.beam = null; boss.grid = null; boss.attacks++;
  enter(boss, 'idle');
}

function advanceAttack(boss, dt, emit) {
  if (boss.attack === 'sweep') {
    const {range, speed} = CH03_RULES.sweep;
    boss.beam.angle += boss.beam.direction * speed * dt;
    if (Math.abs(boss.beam.angle) >= range && Math.sign(boss.beam.angle) === boss.beam.direction) endAttack(boss);
  } else if (boss.attack === 'ring') {
    const {gap, tail} = CH03_RULES.ring;
    if (boss.ringsFired === 1 && boss.stateTime >= gap) fireRing(boss, emit);
    if (boss.stateTime >= gap + tail) endAttack(boss);
  } else {
    const rules = CH03_RULES.grid, grid = boss.grid;
    grid.time += dt;
    if (!grid.active && grid.time >= rules.warning) { grid.active = true; grid.time = 0; }
    else if (grid.active && grid.time >= rules.active) {
      grid.step++;
      if (grid.step >= rules.steps) { endAttack(boss); return; }
      // La columna segura se mueve una posición; en el borde, hacia dentro.
      const step = grid.safe === 0 ? 1 : grid.safe === rules.columns - 1 ? -1 : nextRandom(boss) < .5 ? -1 : 1;
      grid.safe += step; grid.active = false; grid.time = 0;
    }
  }
}

/** Avanza el combate. Eventos: warning {attack}, projectile {x, y, vx, vy,
 * damage} y defeated (una vez). dt = 0 no cambia nada (pausa). */
export function advanceCh03Satellite(boss, dt, emit) {
  if (!(dt > 0) || boss.resolved) return;
  boss.stateTime += dt;
  if (boss.state === 'entry') {
    const progress = Math.min(1, boss.stateTime / CH03_RULES.entrySeconds);
    boss.y = -120 + (boss.holdY + 120) * (1 - (1 - progress) ** 3);
    if (progress >= 1) enter(boss, 'idle');
  } else if (boss.state === 'idle') {
    if (boss.stateTime >= CH03_RULES.rest) {
      boss.attack = chooseAttack(boss);
      enter(boss, 'warning');
      emit({type: 'warning', attack: boss.attack});
    }
  } else if (boss.state === 'warning') {
    if (boss.stateTime >= CH03_RULES.warning) startAttack(boss, emit);
  } else if (boss.state === 'attack') advanceAttack(boss, dt, emit);
  else if (boss.state === 'defeated') {
    if (!boss.defeatAnnounced) { boss.defeatAnnounced = true; emit({type: 'defeated'}); }
    if (boss.stateTime >= CH03_RULES.defeatSeconds) boss.resolved = true;
  }
}

/** Daño a la nave del rayo o de la rejilla activos (0 si no la tocan). */
export function ch03HitsShip(boss, ship) {
  if (boss.state !== 'attack') return 0;
  if (boss.attack === 'sweep' && boss.beam?.active) {
    const dx = Math.sin(boss.beam.angle), dy = Math.cos(boss.beam.angle);
    const along = (ship.x - boss.x) * dx + (ship.y - boss.y) * dy;
    if (along <= 0) return 0;
    const across = Math.abs((ship.x - boss.x) * dy - (ship.y - boss.y) * dx);
    return across <= CH03_RULES.sweep.width / 2 + ship.r ? CH03_RULES.sweep.damage : 0;
  }
  if (boss.attack === 'grid' && boss.grid?.active) {
    const column = Math.floor(ship.x / (boss.width / boss.grid.columns));
    return column === boss.grid.safe ? 0 : CH03_RULES.grid.damage;
  }
  return 0;
}

export function hitCh03Satellite(boss, damage = 1) {
  if (!(damage > 0) || boss.state === 'entry' || boss.state === 'defeated') return {accepted: false, hp: boss.hp};
  boss.hp = Math.max(0, boss.hp - damage);
  if (boss.hp === 0) { boss.beam = null; boss.grid = null; enter(boss, 'defeated'); }
  return {accepted: true, hp: boss.hp};
}
