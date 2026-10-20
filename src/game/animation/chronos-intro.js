/**
 * Inicio de Chronos (v4), plano a plano según docs/design/GUION_INICIO_CHRONOS.md
 * y la revisión del director de arte. Cronos Prime rasga el espacio, sale
 * más grande que la pantalla, se retira a su puesto de tiro, se bebe la
 * energía de Chronos sector a sector y dispara en diagonal contra la torre.
 * El impacto corta a las láminas pintadas de la ruptura; la estación queda
 * destruida (no vuelve a verse entera). La ruptura sigue a los 9 s del reloj
 * de ruta.
 *
 * Función pura del reloj de ruta: no avanza ningún reloj, no toca la partida
 * ni los guardados; solo dice qué dibujar y dónde. La escena se dibuja bajo
 * una cámara propia ({zoom, cx, cy, shakeX, shakeY}) que no afecta al juego.
 * Posiciones de escena en fracciones de pantalla (con cámara neutra);
 * distancias ligadas a la estación, en unidades de su diámetro.
 */
export const CHRONOS_INTRO_TIMELINE = Object.freeze({
  omen: 2.8, tearOpen: 3.4, appear: 4.6, looming: 5.4, wingsSnap: 5.4, eyeOpen: 5.7,
  retreat: 6.3, inPosition: 7.1, drain: 6.6, beamStart: 8.6, rupture: 9,
  whiteSeconds: .07, plateFastSeconds: .22, plateSlowSeconds: .42, fondoIn: .6,
  scorn: 12.4, warp: 13.4, gone: 13.9, fondoOutStart: 14, fondoOutEnd: 18,
  ringGone: 16, fragmentsEnd: 17, end: 26
});

const T = CHRONOS_INTRO_TIMELINE;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const smooth = (value, from, to) => {
  const t = clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
};
// Integral de smooth(value, from, to): fase de un latido que se acelera sin
// saltos al crecer la carga.
const smoothIntegral = (value, from, to) => {
  const t = clamp((value - from) / (to - from), 0, 1);
  return (to - from) * (t ** 3 - t ** 4 / 2) + Math.max(0, value - to);
};
const easeOut = (value, from, to) => 1 - (1 - clamp((value - from) / (to - from), 0, 1)) ** 3;
const mix = (from, to, amount) => from + (to - from) * amount;
// Ruido determinista para temblores y parpadeos (sin Math.random).
const wobble = (time, rate, seed) => Math.sin(time * rate + seed) * .6 + Math.sin(time * rate * 2.13 + seed * 1.7) * .4;

// Láminas pintadas: 01–05 rápidas, 06–10 lentas, después el fondo (11).
const FAST_PLATES = 5, SLOW_PLATES = 5, FONDO_PLATE = 10;
const PLATES_START = T.rupture + T.whiteSeconds;
const PLATES_END = PLATES_START + FAST_PLATES * T.plateFastSeconds + SLOW_PLATES * T.plateSlowSeconds;

const SHOTS = Object.freeze([
  [0, 'scale'], [T.omen, 'omen'], [T.appear, 'appearance'], [T.drain, 'drain'],
  [T.beamStart, 'shot'], [T.rupture, 'rupture'], [T.scorn, 'scorn'], [T.gone, 'escape']
]);

// Encuadre base de la estación durante el inicio. Solo afecta al dibujo.
const STATION_FRAME = Object.freeze({zoom: .72, drop: .08});
// Grieta, momento de presencia y puesto de tiro (en diagonal sobre la torre,
// bajo el HUD y el diálogo, para que el haz cruce media pantalla).
const TEAR = Object.freeze({x: .5, y: .22});
const LOOM = Object.freeze({x: .5, y: .3, scale: 1.6});
const FIRING = Object.freeze({x: .27, y: .25, scale: .82});
// La nave del jugador, a la que mira Cronos Prime al marcharse.
const SHIP = Object.freeze({x: .5, y: .82});

// Giro visible: la rueda da una vuelta cada ~20 s y el anillo gira al revés.
const SPIN = Object.freeze({wheel: .32, ring: -.2, wreck: .22, wobble: .035});

// Ocho restos con direcciones fijas: la mitad sale hacia la nave y crecen,
// como si pasaran junto a la cámara.
const FRAGMENTS = Object.freeze([
  [-.95, -.35, 1.6], [.9, -.45, -1.2], [-.55, .85, 2.1], [.6, .8, -1.8],
  [-.2, -1, .9], [1, .15, 1.4], [-1, .2, -2.3], [.15, 1, 1.1]
].map(([x, y, spin], cell) => Object.freeze({cell, x, y, spin})));

// Respaldo sin láminas: estallidos azules en cadena por el anillo.
const CHAIN = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7].map(index => Object.freeze({
  angle: -Math.PI / 2 + index * Math.PI / 4 + (index % 2 ? .18 : -.12), delay: .06 + index * .17
})));
const EXPLOSION_SECONDS = .72;
const SECTORS = 8;

const INACTIVE = Object.freeze({active: false});

function platePose(elapsed) {
  if (elapsed < PLATES_START) return null;
  const age = elapsed - PLATES_START;
  const fastSpan = FAST_PLATES * T.plateFastSeconds;
  let index, local, length;
  if (age < fastSpan) {
    index = Math.floor(age / T.plateFastSeconds); local = age - index * T.plateFastSeconds; length = T.plateFastSeconds;
  } else if (elapsed < PLATES_END) {
    const slow = age - fastSpan;
    index = FAST_PLATES + Math.floor(slow / T.plateSlowSeconds);
    local = slow - (index - FAST_PLATES) * T.plateSlowSeconds; length = T.plateSlowSeconds;
  } else {
    index = FONDO_PLATE; local = 0; length = 1;
  }
  index = Math.min(index, FONDO_PLATE);
  const next = Math.min(FONDO_PLATE, index + 1);
  // Fundido corto al final de cada lámina; el último paso al fondo es más lento.
  const blend = index === FONDO_PLATE ? 0 : smooth(local / length, index < FAST_PLATES ? .7 : .45, 1);
  // El fondo tras la ruptura baja a media luz al empezar a pilotar (sus
  // relámpagos no deben competir con los disparos) y se retira pronto.
  const fondoAlpha = (1 - .45 * smooth(elapsed, PLATES_END, PLATES_END + 1)) * (1 - smooth(elapsed, T.fondoOutStart, T.fondoOutEnd));
  return {index, next, mix: blend, alpha: index === FONDO_PLATE ? fondoAlpha : 1,
    // Empuje de cámara y sacudida sobre las láminas (en pantalla, no en escena).
    zoom: 1.18 + .14 * easeOut(age, 0, 1.4) - .08 * smooth(age, 1.4, 4),
    shake: .022 * Math.max(0, 1 - age / 1.2) ** 2};
}

export function getChronosIntroPose(elapsed, {reducedEffects = false, holdWreck = false} = {}) {
  if (!Number.isFinite(elapsed) || elapsed < 0) return INACTIVE;
  // Pasada la secuencia, holdWreck la mantiene activa (sin volver al dibujo
  // antiguo de la estación); lo demás queda congelado.
  if (elapsed > T.end && !holdWreck) return INACTIVE;
  const spinClock = elapsed;
  elapsed = Math.min(elapsed, T.end);
  const ruptured = elapsed >= T.rupture;
  const since = elapsed - T.rupture;
  const spinSince = spinClock - T.rupture;
  const shotIndex = SHOTS.reduce((found, [at], index) => elapsed >= at ? index : found, 0);
  const motion = reducedEffects ? 0 : 1;

  // --- Cámara: empieza pegada a la torre (Chronos no cabe), se aleja
  // revelando la escala, sube hacia la grieta y empuja al disparar.
  const push = smooth(elapsed, T.beamStart, T.rupture) * (1 - smooth(elapsed, T.rupture + .2, T.rupture + 1.5));
  const loomShake = elapsed >= T.wingsSnap && elapsed < T.wingsSnap + .45 ? .014 * (1 - (elapsed - T.wingsSnap) / .45) : 0;
  const tremor = smooth(elapsed, T.drain, T.beamStart) * (ruptured ? 0 : 1) * .006 + loomShake
    + (ruptured ? .03 * Math.max(0, 1 - since / 1.1) ** 2 : 0);
  const camera = {
    zoom: mix(3, 1, smooth(elapsed, 0, T.drain)) + .08 * push,
    cx: mix(.48, .5, smooth(elapsed, 0, T.appear)),
    cy: mix(.32, .5, smooth(elapsed, T.omen * .5, T.drain)) - .04 * smooth(elapsed, T.omen, T.appear) * (1 - smooth(elapsed, T.appear, T.drain)),
    shakeX: motion * tremor * wobble(elapsed, 47, 1),
    shakeY: motion * tremor * wobble(elapsed, 53, 4)
  };

  // --- Presagio: oscuridad desde arriba y grieta vertical de borde blanco.
  const darkness = .6 * smooth(elapsed, T.omen, T.appear) * (1 - smooth(elapsed, T.rupture, T.rupture + .4));
  const opening = smooth(elapsed, T.tearOpen, T.appear + .3) * (1 - smooth(elapsed, T.looming + .3, T.retreat));
  const warp = smooth(elapsed, T.warp, T.gone);
  // Al marcharse, la grieta se reabre un instante donde está y se cierra de golpe.
  const exitTear = elapsed >= T.warp && elapsed < T.gone ? Math.sin(Math.PI * (elapsed - T.warp) / (T.gone - T.warp)) : 0;
  const tearAmount = Math.max(opening, exitTear);
  const tearAt = opening >= exitTear ? TEAR : FIRING;
  const tear = {
    x: tearAt.x, y: tearAt.y, open: tearAmount,
    bolts: tearAmount > 0 ? [0, 1, 2, 3].map(index => ({
      cell: 1 + (index + Math.floor(elapsed * 9)) % 6,
      angle: (index % 2 ? 1 : -1) * (.25 + .15 * index) + .2 * wobble(elapsed, 3, index),
      alpha: tearAmount * clamp(.55 + .45 * wobble(elapsed, 23, index * 2.3), 0, 1)
    })) : []
  };

  // --- Estación: viva, después apagada sector a sector; al romperse se
  // dibuja solo en el respaldo sin láminas.
  const drain = smooth(elapsed, T.drain, T.beamStart);
  const flicker = elapsed >= T.omen && elapsed < T.drain ? .82 + .18 * Math.max(0, wobble(elapsed, 31, 2)) : 1;
  const separation = ruptured ? smooth(since, 0, T.ringGone - T.rupture) : 0;
  const station = {
    ringAngle: SPIN.ring * spinClock - (ruptured ? .35 * since * since / (1 + since) : 0),
    wheelAngle: ruptured ? SPIN.wheel * T.rupture + SPIN.wreck * spinSince + .25 * Math.sin(spinSince * .7) * smooth(since, 0, 2)
      : SPIN.wheel * spinClock,
    tiltY: .8 + SPIN.wobble * Math.sin(spinClock * .45) + (ruptured ? .05 * Math.sin(spinSince * .9) * smooth(since, 0, 1.5) : 0),
    sway: .04 * Math.sin(spinClock * .3) + (ruptured ? .12 * Math.sin(spinSince * .5) * smooth(since, 0, 2) : 0),
    ringOffset: separation * .55,
    ringScale: 1 + separation * .35,
    ringAlpha: ruptured ? 1 - smooth(since, 2.5, T.ringGone - T.rupture) : 1,
    wheelCell: ruptured ? 2 : 1,
    towerCell: ruptured ? 4 : 3,
    towerLift: ruptured ? smooth(since, 0, 4) * .08 : 0,
    // Luz de cada sector (1 encendido, 0 apagado): Cronos Prime los apaga
    // uno a uno; el último justo antes del disparo.
    sectorLights: Array.from({length: SECTORS}, (_, index) => ruptured ? 0
      : flicker * (1 - smooth(drain * SECTORS, index, index + .8))),
    zoom: STATION_FRAME.zoom * (1 - .5 * smooth(elapsed, T.rupture + 1, 18)),
    drop: STATION_FRAME.drop,
    alpha: 1 - .45 * smooth(elapsed, T.rupture + 2, T.rupture + 6)
  };

  // --- Cronos Prime.
  const emerge = easeOut(elapsed, T.appear, T.looming);
  const retreat = smooth(elapsed, T.retreat, T.inPosition);
  const snapTime = elapsed - T.wingsSnap;
  // Las alas se abren de golpe con un rebote (pasan de largo y se asientan).
  const wingSpread = snapTime < 0 ? 0 : snapTime < .18 ? 1.15 * snapTime / .18
    : 1 + .15 * Math.cos((snapTime - .18) * 14) * Math.exp(-(snapTime - .18) * 6);
  const eye = smooth(elapsed, T.eyeOpen, T.eyeOpen + .4);
  const turn = smooth(elapsed, T.scorn, T.scorn + .5);
  const recoil = ruptured ? Math.max(0, 1 - since / .3) : 0;
  const baseX = mix(mix(TEAR.x, LOOM.x, emerge), FIRING.x, retreat);
  const baseY = mix(mix(TEAR.y, LOOM.y, emerge), FIRING.y, retreat);
  const prime = {
    visible: elapsed >= T.appear && elapsed < T.gone,
    x: baseX,
    y: baseY - .02 * recoil - .7 * warp ** 2,
    scale: mix(mix(.15, LOOM.scale, emerge), FIRING.scale, retreat) * (1 + .1 * drain) * (1 - .05 * recoil) * (1 - .35 * warp),
    stretch: 1 + 5 * warp ** 2,
    // Se inclina hacia la nave al mirarla.
    tilt: .17 * turn * Math.sign(SHIP.x - baseX) * (1 - warp),
    alpha: elapsed < T.appear ? 0 : 1 - smooth(elapsed, T.gone - .1, T.gone),
    wingSpread: clamp(wingSpread, 0, 1.15) * (1 - .5 * warp),
    bladeSpread: smooth(elapsed, T.wingsSnap + .1, T.wingsSnap + .45) * (1 - .5 * warp),
    snap: snapTime >= 0 && snapTime < .45 ? 1 - snapTime / .45 : 0,
    // El ojo se abre, late con la carga y, al mirar a la nave, se vuelve rojo
    // y se desplaza hacia ella (fracción del tamaño del núcleo).
    eye, eyeRed: turn * (1 - smooth(elapsed, T.warp, T.warp + .2)),
    lookX: .06 * turn * Math.sign(SHIP.x - baseX), lookY: .07 * turn,
    pulse: .5 + .5 * Math.sin(5 * elapsed + 9 * smoothIntegral(elapsed, T.drain, T.beamStart)),
    charge: drain, coreGlow: ruptured ? 1 - .6 * smooth(since, .4, 2) : Math.max(eye * .5, drain),
    nameCard: smooth(elapsed, T.eyeOpen, T.eyeOpen + .25) * (1 - smooth(elapsed, T.beamStart - .5, T.beamStart - .1)),
    nameCardPunch: 1 - easeOut(elapsed, T.eyeOpen, T.eyeOpen + .3)
  };

  // Descargas que llevan la energía de cada sector a su núcleo.
  const drainStreams = elapsed >= T.drain && elapsed < T.rupture ? station.sectorLights.map((light, index) => ({
    angle: -Math.PI / 2 + (index + .5) * Math.PI * 2 / SECTORS,
    // Cada sector fluye mientras se apaga.
    alpha: smooth(drain * SECTORS, index - .3, index) * (1 - smooth(drain * SECTORS, index + .8, index + 1.4)) * (1 - smooth(elapsed, T.beamStart, T.rupture)),
    cell: 1 + (index + Math.floor(elapsed * 14)) % 6, progress: ((elapsed - T.drain) * 1.8 + index * .37) % 1
  })) : [];

  const beamWindow = smooth(elapsed, T.beamStart, T.beamStart + .12) * (1 - smooth(elapsed, T.rupture + .1, T.rupture + .5));
  const beam = {alpha: beamWindow, width: (.55 + .45 * smooth(elapsed, T.beamStart, T.rupture)) * (1 + .12 * Math.sin(elapsed * 60) * motion)};

  // Golpe: dos fotogramas de blanco puro (suave con efectos reducidos).
  const flash = ruptured && since < T.whiteSeconds ? (reducedEffects ? .3 : 1)
    : ruptured && since < T.whiteSeconds + .25 ? (reducedEffects ? .15 : .45) * (1 - (since - T.whiteSeconds) / .25) : 0;
  const plates = platePose(elapsed);
  if (plates && reducedEffects) plates.shake = 0;

  // Respaldo sin láminas: onda y estallidos azules sobre la estación.
  const shockAge = ruptured ? since / 1.6 : 1;
  const shockwave = shockAge < 1 ? {frame: Math.min(3, Math.floor(shockAge * 4)), scale: .6 + 1.5 * easeOut(shockAge, 0, 1),
    alpha: 1 - smooth(shockAge, .35, 1)} : null;
  const explosions = ruptured ? CHAIN.map(item => {
    const age = (since - item.delay) / EXPLOSION_SECONDS;
    return age >= 0 && age < 1 ? {angle: item.angle, radius: .36, frame: Math.min(3, Math.floor(age * 4)),
      scale: .3 + .1 * Math.sin(item.angle * 3), alpha: 1 - smooth(age, .6, 1)} : null;
  }).filter(Boolean) : [];

  const fragments = ruptured ? FRAGMENTS.map(item => {
    const travel = since * (.5 + .14 * (item.cell % 3)) + since * since * .05;
    return {cell: item.cell, dx: item.x * travel, dy: item.y * travel,
      angle: item.spin * since, scale: 1 + travel * (item.y > 0 ? 2.4 : 1.1),
      alpha: 1 - smooth(elapsed, T.fragmentsEnd - 3, T.fragmentsEnd)};
  }) : [];

  const phase = SHOTS[shotIndex][1];
  return {active: true, phase, shot: shotIndex + 1, clock: elapsed, controlsLocked: elapsed < T.rupture,
    camera, darkness, tear, station, prime, drainStreams, beam, flash, plates, shockwave, explosions, fragments};
}
