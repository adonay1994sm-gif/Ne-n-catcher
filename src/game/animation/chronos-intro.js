/**
 * Inicio de Chronos (v3), plano a plano según docs/design/GUION_INICIO_CHRONOS.md.
 * Cronos Prime rasga el espacio, absorbe la energía de la estación, dispara
 * contra el reactor y se marcha tras mirar a la nave. La ruptura sigue a los
 * 9 s del reloj de ruta.
 *
 * Función pura del reloj de ruta: no avanza ningún reloj, no toca la partida
 * ni los guardados; solo dice qué dibujar y dónde. La escena se dibuja bajo
 * una cámara propia ({zoom, cx, cy, shakeX, shakeY}) que no afecta al juego.
 * Posiciones de escena en fracciones de pantalla (con cámara neutra);
 * distancias ligadas a la estación, en unidades de su diámetro.
 */
export const CHRONOS_INTRO_TIMELINE = Object.freeze({
  omen: 2.8, tearOpen: 3.4, appear: 4.6, emerged: 5.6, wingsSnap: 5.6, eyeOpen: 5.9,
  drain: 6.4, beamStart: 8.6, rupture: 9, beamEnd: 9.6, flashSeconds: .45,
  shockwaveSeconds: 1.6, scorn: 11.5, warp: 12.8, gone: 13.6,
  ringGone: 16, fragmentsEnd: 17, end: 26
});

const T = CHRONOS_INTRO_TIMELINE;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const smooth = (value, from, to) => {
  const t = clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOut = (value, from, to) => 1 - (1 - clamp((value - from) / (to - from), 0, 1)) ** 3;
const mix = (from, to, amount) => from + (to - from) * amount;
// Ruido determinista para temblores y parpadeos (sin Math.random).
const wobble = (time, rate, seed) => Math.sin(time * rate + seed) * .6 + Math.sin(time * rate * 2.13 + seed * 1.7) * .4;

const SHOTS = Object.freeze([
  [0, 'scale'], [T.omen, 'omen'], [T.appear, 'appearance'], [T.drain, 'drain'],
  [T.beamStart, 'shot'], [T.rupture, 'rupture'], [T.scorn, 'scorn'], [T.gone, 'escape']
]);

// Encuadre base de la estación durante el inicio (algo más pequeña y baja que
// en la ruta para dejar sitio a Cronos Prime). Solo afecta al dibujo.
const STATION_FRAME = Object.freeze({zoom: .72, drop: .08});
// Grieta y puesto de disparo de Cronos Prime, bajo el HUD y el diálogo.
const TEAR = Object.freeze({x: .5, y: .19});
const HOVER = Object.freeze({x: .5, y: .3});

// Giro visible: la rueda da una vuelta cada ~20 s y el anillo gira al revés.
const SPIN = Object.freeze({wheel: .32, ring: -.2, wreck: .22, wobble: .035});

// Ocho restos con direcciones fijas: la mitad sale hacia la nave y crecen,
// como si pasaran junto a la cámara.
const FRAGMENTS = Object.freeze([
  [-.95, -.35, 1.6], [.9, -.45, -1.2], [-.55, .85, 2.1], [.6, .8, -1.8],
  [-.2, -1, .9], [1, .15, 1.4], [-1, .2, -2.3], [.15, 1, 1.1]
].map(([x, y, spin], cell) => Object.freeze({cell, x, y, spin})));

// Explosiones en cadena por el anillo tras el impacto (ángulo, retraso).
const CHAIN = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7].map(index => Object.freeze({
  angle: -Math.PI / 2 + index * Math.PI / 4 + (index % 2 ? .18 : -.12), delay: .06 + index * .17
})));
const EXPLOSION_SECONDS = .72;

// Naves del convoy atracando: referencia de escala en el plano 1.
const CONVOY = Object.freeze([
  {lane: .46, start: .3, speed: .16}, {lane: .38, start: 2.1, speed: -.13}, {lane: .5, start: 3.9, speed: .2}
]);

// Incendios que quedan en la estación rota.
const FIRES = Object.freeze([[.2, -.12, 0], [-.24, .06, 1.3], [.06, .2, 2.4]]);

const INACTIVE = Object.freeze({active: false});

export function getChronosIntroPose(elapsed, {reducedEffects = false, holdWreck = false} = {}) {
  if (!Number.isFinite(elapsed) || elapsed < 0) return INACTIVE;
  // Pasada la secuencia, holdWreck mantiene la estación rota girando con la
  // ruta (mismo dibujo, sin volver al antiguo); el resto queda congelado.
  if (elapsed > T.end && !holdWreck) return INACTIVE;
  const spinClock = elapsed;
  elapsed = Math.min(elapsed, T.end);
  const ruptured = elapsed >= T.rupture;
  const since = elapsed - T.rupture;
  const spinSince = spinClock - T.rupture;
  const shotIndex = SHOTS.reduce((found, [at], index) => elapsed >= at ? index : found, 0);
  const motion = reducedEffects ? 0 : 1;

  // --- Cámara: empieza pegada a la torre, se aleja revelando la escala,
  // sube hacia la grieta, empuja al disparar y vuelve tras el golpe.
  const reveal = smooth(elapsed, 0, T.appear);
  const push = smooth(elapsed, T.beamStart, T.rupture) * (1 - smooth(elapsed, T.rupture + .2, T.rupture + 1.5));
  const tremor = smooth(elapsed, T.drain, T.beamStart) * (ruptured ? 0 : 1) * .006
    + (ruptured ? .03 * Math.max(0, 1 - since / 1.1) ** 2 : 0)
    + (elapsed >= T.wingsSnap && elapsed < T.wingsSnap + .35 ? .01 * (1 - (elapsed - T.wingsSnap) / .35) : 0);
  const camera = {
    zoom: mix(2.1, 1, smooth(elapsed, 0, T.drain)) + .08 * push,
    cx: mix(.48, .5, reveal),
    cy: mix(.36, .5, smooth(elapsed, T.omen * .5, T.drain)) - .04 * smooth(elapsed, T.omen, T.appear) * (1 - smooth(elapsed, T.appear, T.drain)),
    shakeX: motion * tremor * wobble(elapsed, 47, 1),
    shakeY: motion * tremor * wobble(elapsed, 53, 4)
  };

  // --- Presagio: oscuridad desde arriba y grieta violeta con descargas.
  const darkness = .6 * smooth(elapsed, T.omen, T.appear) * (1 - smooth(elapsed, T.rupture + .5, T.scorn));
  const tearAmount = smooth(elapsed, T.tearOpen, T.emerged) * (1 - smooth(elapsed, T.emerged + .2, T.drain + .4));
  const tear = {
    x: TEAR.x, y: TEAR.y, open: tearAmount,
    bolts: tearAmount > 0 ? [0, 1, 2, 3].map(index => ({
      cell: 1 + (index + Math.floor(elapsed * 9)) % 6,
      angle: index * Math.PI / 2 + .4 * wobble(elapsed, 3, index),
      alpha: tearAmount * clamp(.55 + .45 * wobble(elapsed, 23, index * 2.3), 0, 1)
    })) : []
  };

  // --- Estación: viva, luego drenada sector a sector, luego rota.
  const drain = smooth(elapsed, T.drain, T.beamStart);
  const flicker = elapsed >= T.omen && elapsed < T.drain
    ? .82 + .18 * Math.max(0, wobble(elapsed, 31, 2)) : 1;
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
    // Luz propia de la estación (1 encendida, 0 apagada): parpadea en el
    // presagio y Cronos Prime se la bebe antes de disparar.
    lights: ruptured ? 0 : flicker * (1 - .85 * drain),
    drainedSectors: Math.floor(drain * 8 + 1e-9),
    zoom: STATION_FRAME.zoom * (1 - .5 * smooth(elapsed, T.rupture + 1, 18)),
    drop: STATION_FRAME.drop,
    // Tras la ruptura la estación pasa a ser fondo: se oscurece para que los
    // peligros y enemigos se lean por encima.
    alpha: 1 - .45 * smooth(elapsed, T.rupture + 2, T.rupture + 6),
    shake: 0
  };

  // --- Cronos Prime: sale de la grieta desde el fondo, chasquea las alas,
  // abre el ojo, se alimenta, dispara, mira a la nave y se va de un salto.
  const emerge = easeOut(elapsed, T.appear, T.emerged);
  const snapTime = elapsed - T.wingsSnap;
  // Las alas se abren de golpe con un rebote (pasan de largo y se asientan).
  const wingSpread = snapTime < 0 ? 0 : snapTime < .18 ? 1.15 * snapTime / .18
    : 1 + .15 * Math.cos((snapTime - .18) * 14) * Math.exp(-(snapTime - .18) * 6);
  const eye = smooth(elapsed, T.eyeOpen, T.eyeOpen + .4);
  const turn = smooth(elapsed, T.scorn, T.scorn + .8);
  const warp = smooth(elapsed, T.warp, T.gone);
  const recoil = ruptured ? .03 * Math.max(0, 1 - since / .5) : 0;
  const charge = drain;
  const prime = {
    visible: elapsed >= T.appear && elapsed < T.gone,
    x: mix(TEAR.x, HOVER.x, emerge) + .04 * turn * Math.sin(elapsed * 1.3) * (1 - warp),
    y: mix(TEAR.y, HOVER.y, emerge) - recoil - .75 * warp ** 2,
    scale: mix(.12, 1, emerge) * (1 + .12 * charge) * (1 - .35 * warp),
    stretch: 1 + 5 * warp ** 2,
    tilt: .22 * turn * (1 - warp),
    alpha: elapsed < T.appear ? 0 : 1 - smooth(elapsed, T.gone - .15, T.gone),
    wingSpread: clamp(wingSpread, 0, 1.15) * (1 - .5 * warp),
    bladeSpread: smooth(elapsed, T.wingsSnap + .1, T.wingsSnap + .45) * (1 - .5 * warp),
    // El ojo: abierto y blanco al cargar; rojo un instante al mirar a la nave.
    eye, eyeRed: turn * (1 - smooth(elapsed, T.warp - .1, T.warp + .3)),
    pulse: .5 + .5 * Math.sin(elapsed * (5 + 9 * charge)),
    // Onda del chasquido de las alas (1 → 0 en 0,45 s).
    snap: snapTime >= 0 && snapTime < .45 ? 1 - snapTime / .45 : 0,
    charge, coreGlow: ruptured ? 1 - .6 * smooth(since, .4, 2) : Math.max(eye * .5, charge),
    nameCard: smooth(elapsed, T.eyeOpen, T.eyeOpen + .4) * (1 - smooth(elapsed, T.beamStart - .4, T.beamStart))
  };

  // Hilos de energía de los sectores de la estación al núcleo.
  const drainStreams = elapsed >= T.drain && elapsed < T.rupture ? [0, 1, 2, 3, 4, 5, 6, 7].map(index => ({
    angle: -Math.PI / 2 + index * Math.PI / 4 + station.ringAngle * .2,
    progress: ((elapsed - T.drain) * 1.6 + index * .37) % 1,
    alpha: smooth(elapsed, T.drain, T.drain + .4) * (1 - smooth(elapsed, T.beamStart, T.rupture))
  })) : [];

  const beamWindow = smooth(elapsed, T.beamStart, T.beamStart + .12) * (1 - smooth(elapsed, T.rupture + .15, T.beamEnd));
  const beam = {alpha: beamWindow, width: (.55 + .45 * smooth(elapsed, T.beamStart, T.rupture)) * (1 + .12 * Math.sin(elapsed * 60) * motion)};

  const flashPeak = reducedEffects ? .3 : .85;
  const flash = ruptured && since < T.flashSeconds ? flashPeak * (1 - since / T.flashSeconds) ** 3 : 0;

  const shockAge = ruptured ? since / T.shockwaveSeconds : 1;
  const shockwave = shockAge < 1 ? {
    frame: Math.min(3, Math.floor(shockAge * 4)), scale: .6 + 1.5 * easeOut(shockAge, 0, 1),
    alpha: 1 - smooth(shockAge, .35, 1)
  } : null;

  const explosions = ruptured ? CHAIN.map(item => {
    const age = (since - item.delay) / EXPLOSION_SECONDS;
    return age >= 0 && age < 1 ? {angle: item.angle, radius: .42, frame: Math.min(7, Math.floor(age * 8)),
      scale: .34 + .12 * Math.sin(item.angle * 3), alpha: 1 - smooth(age, .7, 1)} : null;
  }).filter(Boolean) : [];

  const fires = ruptured ? FIRES.map(([dx, dy, seed]) => ({dx, dy,
    frame: Math.floor((spinClock * 9 + seed * 3) % 8), alpha: smooth(since, 1.2, 2.5) * (.55 + .2 * Math.sin(spinClock * 7 + seed)),
    scale: .14})) : [];

  const fragments = ruptured ? FRAGMENTS.map(item => {
    const travel = since * (.5 + .14 * (item.cell % 3)) + since * since * .05;
    return {cell: item.cell, dx: item.x * travel, dy: item.y * travel,
      angle: item.spin * since, scale: 1 + travel * (item.y > 0 ? 2.4 : 1.1),
      alpha: 1 - smooth(elapsed, T.fragmentsEnd - 3, T.fragmentsEnd)};
  }) : [];

  const convoy = elapsed < T.drain ? CONVOY.map((ship, index) => {
    const age = elapsed - ship.start;
    const flee = smooth(elapsed, T.appear, T.drain);
    return age < 0 ? null : {angle: -Math.PI / 2 + index * 2.1 + ship.speed * age * 3, radius: ship.lane + flee * .9,
      alpha: smooth(age, 0, .4) * (1 - flee), heading: Math.sign(ship.speed)};
  }).filter(Boolean) : [];

  const phase = SHOTS[shotIndex][1];
  return {active: true, phase, shot: shotIndex + 1, clock: elapsed, controlsLocked: elapsed < T.rupture,
    camera, darkness, tear, station, prime, drainStreams, beam, flash, shockwave, explosions,
    fires, fragments, convoy};
}
