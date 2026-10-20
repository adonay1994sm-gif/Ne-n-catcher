/**
 * Inicio de Chronos (v5), con la animación de Cronos Prime y la explosión
 * azul que preparó el propietario (docs/design/GUION_INICIO_CHRONOS.md).
 *
 * Cronos Prime llega desde fuera (una luz lejana que se acerca girando),
 * frena sobre la estación, se alimenta de ella sector a sector, dispara en
 * vertical contra la torre y, tras la explosión, se gira y se va por donde
 * vino. La estación desaparece tras la explosión: solo quedan restos.
 * La ruptura sigue a los 9 s del reloj de ruta.
 *
 * Función pura del reloj de ruta: no avanza ningún reloj, no toca la partida
 * ni los guardados; solo dice qué dibujar y dónde. La escena se dibuja bajo
 * una cámara propia ({zoom, cx, cy, shakeX, shakeY}) que no afecta al juego.
 * Posiciones de escena en fracciones de pantalla (con cámara neutra);
 * distancias ligadas a la estación, en unidades de su diámetro.
 *
 * Fotogramas de Cronos Prime (atlas de 24): 0–2 reposo, 3–7 carga,
 * 8 disparo, 9–11 enfriamiento, 12–23 giro (12–15 de lado, 16–19 de frente).
 */
export const CHRONOS_INTRO_TIMELINE = Object.freeze({
  omen: 2.8, approach: 3.6, arrive: 6, drain: 6.4, beamStart: 8.6, rupture: 9,
  fireEnd: 9.2, explosionSeconds: 1.6, stationGone: 9.5, turn: 10.4, leave: 11.5, gone: 12.6,
  fragmentsEnd: 17, end: 26
});

export const CRONOS_PRIME_FRAMES = Object.freeze({
  idle: [0, 1, 2], charge: [3, 4, 5, 6, 7], fire: 8, cooldown: [9, 10, 11], side: [12, 13, 14, 15], front: [16, 17, 18, 19]
});

const T = CHRONOS_INTRO_TIMELINE;
const F = CRONOS_PRIME_FRAMES;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const smooth = (value, from, to) => {
  const t = clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOut = (value, from, to) => 1 - (1 - clamp((value - from) / (to - from), 0, 1)) ** 3;
const easeIn = (value, from, to) => clamp((value - from) / (to - from), 0, 1) ** 2;
const mix = (from, to, amount) => from + (to - from) * amount;
// Ruido determinista para temblores y parpadeos (sin Math.random).
const wobble = (time, rate, seed) => Math.sin(time * rate + seed) * .6 + Math.sin(time * rate * 2.13 + seed * 1.7) * .4;
const pick = (list, amount) => list[Math.min(list.length - 1, Math.floor(clamp(amount, 0, .9999) * list.length))];

const SHOTS = Object.freeze([
  [0, 'scale'], [T.omen, 'omen'], [T.approach, 'arrival'], [T.drain, 'drain'],
  [T.beamStart, 'shot'], [T.rupture, 'rupture'], [T.turn, 'scorn'], [T.gone, 'escape']
]);

// Encuadre base de la estación durante el inicio. Solo afecta al dibujo.
const STATION_FRAME = Object.freeze({zoom: .72, drop: .08});
// Llega desde lo lejos (una luz a la derecha, dentro del encuadre aunque la
// cámara siga cerca) y frena sobre la torre.
const FAR = Object.freeze({x: .72, y: .22, scale: .07});
const HOVER = Object.freeze({x: .48, y: .25, scale: 1});
const EXIT = Object.freeze({x: .94, y: .12, scale: .05});
const SECTORS = 8;

// Ocho restos con direcciones fijas: la mitad sale hacia la nave y crecen,
// como si pasaran junto a la cámara.
const FRAGMENTS = Object.freeze([
  [-.95, -.35, 1.6], [.9, -.45, -1.2], [-.55, .85, 2.1], [.6, .8, -1.8],
  [-.2, -1, .9], [1, .15, 1.4], [-1, .2, -2.3], [.15, 1, 1.1]
].map(([x, y, spin], cell) => Object.freeze({cell, x, y, spin})));

const INACTIVE = Object.freeze({active: false});

function primeFrame(elapsed, drain) {
  if (elapsed < T.arrive) return pick(F.side, (elapsed - T.approach) / (T.arrive - T.approach));
  if (elapsed < T.drain) return pick(F.front, (elapsed - T.arrive) / (T.drain - T.arrive));
  if (elapsed < T.beamStart) return pick(F.charge, drain);
  if (elapsed < T.fireEnd) return F.fire;
  if (elapsed < T.turn) return pick(F.cooldown, (elapsed - T.fireEnd) / (T.turn - T.fireEnd));
  // Se gira hacia un lado para mirar a la nave y se marcha de perfil.
  return pick([...F.front].reverse().concat([...F.side].reverse()), (elapsed - T.turn) / (T.leave - T.turn));
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
  const shotIndex = SHOTS.reduce((found, [at], index) => elapsed >= at ? index : found, 0);
  const motion = reducedEffects ? 0 : 1;

  // --- Cámara: empieza pegada a la torre (Chronos no cabe) y se aleja.
  const push = smooth(elapsed, T.beamStart, T.rupture) * (1 - smooth(elapsed, T.rupture + .2, T.rupture + 1.5));
  const brake = elapsed >= T.arrive && elapsed < T.arrive + .4 ? .01 * (1 - (elapsed - T.arrive) / .4) : 0;
  const drain = smooth(elapsed, T.drain, T.beamStart);
  const tremor = drain * (ruptured ? 0 : 1) * .006 + brake + (ruptured ? .03 * Math.max(0, 1 - since / 1.1) ** 2 : 0);
  const camera = {
    zoom: mix(3, 1, smooth(elapsed, 0, T.drain)) + .08 * push,
    cx: mix(.48, .5, smooth(elapsed, 0, T.approach)),
    cy: mix(.32, .5, smooth(elapsed, T.omen * .5, T.drain)),
    shakeX: motion * tremor * wobble(elapsed, 47, 1),
    shakeY: motion * tremor * wobble(elapsed, 53, 4)
  };

  // --- Estación: viva, apagada sector a sector y, tras la explosión, rota.
  const flicker = elapsed >= T.omen && elapsed < T.drain ? .82 + .18 * Math.max(0, wobble(elapsed, 31, 2)) : 1;
  const station = {
    ringAngle: -.2 * spinClock,
    wheelAngle: .32 * spinClock,
    tiltY: .8 + .035 * Math.sin(spinClock * .45),
    sway: .04 * Math.sin(spinClock * .3),
    // Mientras la explosión lo tapa todo, la estación entera desaparece.
    whole: elapsed < T.stationGone,
    towerCell: ruptured ? 4 : 3,
    sectorLights: Array.from({length: SECTORS}, (_, index) => ruptured ? 0
      : flicker * (1 - smooth(drain * SECTORS, index, index + .8))),
    zoom: STATION_FRAME.zoom * (1 - .5 * smooth(elapsed, T.rupture + 1, 18)),
    drop: STATION_FRAME.drop,
    // Lo que queda (la torre partida) es fondo: oscuro y lejano.
    alpha: ruptured ? .75 * (1 - smooth(elapsed, T.rupture + 2, T.rupture + 9)) + .2 : 1
  };

  // --- Cronos Prime: luz lejana, se acerca girando, frena, se alimenta,
  // dispara, se enfría, se gira hacia la nave y se va por donde vino.
  const arrival = easeOut(elapsed, T.approach, T.arrive);
  const leaving = easeIn(elapsed, T.leave, T.gone);
  const hover = elapsed >= T.arrive ? .006 * Math.sin((elapsed - T.arrive) * 2.2) : 0;
  const recoil = ruptured ? .02 * Math.max(0, 1 - since / .35) : 0;
  const prime = {
    visible: elapsed >= T.approach && elapsed < T.gone,
    frame: primeFrame(elapsed, drain),
    x: mix(mix(FAR.x, HOVER.x, arrival), EXIT.x, leaving),
    y: mix(mix(FAR.y, HOVER.y, arrival), EXIT.y, leaving) + hover - recoil,
    scale: mix(mix(FAR.scale, HOVER.scale, arrival), EXIT.scale, leaving) * (1 + .08 * drain),
    alpha: elapsed < T.approach ? 0 : 1,
    // Estela de motor al llegar y al irse.
    trail: Math.max(1 - smooth(elapsed, T.arrive - .3, T.arrive + .2), smooth(elapsed, T.leave, T.leave + .3)) * (elapsed >= T.approach ? 1 : 0),
    heading: elapsed < T.leave ? Math.atan2(HOVER.y - FAR.y, HOVER.x - FAR.x) : Math.atan2(EXIT.y - HOVER.y, EXIT.x - HOVER.x),
    // Onda al frenar en seco.
    brake: elapsed >= T.arrive && elapsed < T.arrive + .45 ? 1 - (elapsed - T.arrive) / .45 : 0,
    charge: drain,
    nameCard: smooth(elapsed, T.arrive, T.arrive + .25) * (1 - smooth(elapsed, T.beamStart - .6, T.beamStart - .2)),
    nameCardPunch: 1 - easeOut(elapsed, T.arrive, T.arrive + .3)
  };
  // Antes de verse entero, es una luz violeta que crece en lo alto.
  const distantLight = elapsed >= T.omen && elapsed < T.approach + .6
    ? {x: FAR.x, y: FAR.y, alpha: smooth(elapsed, T.omen, T.approach) * (1 - smooth(elapsed, T.approach, T.approach + .6)),
      size: .02 + .03 * smooth(elapsed, T.omen, T.approach)} : null;

  // Descargas que llevan la energía de cada sector a su núcleo.
  const drainStreams = elapsed >= T.drain && elapsed < T.rupture ? station.sectorLights.map((light, index) => ({
    angle: -Math.PI / 2 + (index + .5) * Math.PI * 2 / SECTORS,
    alpha: smooth(drain * SECTORS, index - .3, index) * (1 - smooth(drain * SECTORS, index + .8, index + 1.4)) * (1 - smooth(elapsed, T.beamStart, T.rupture)),
    cell: 1 + (index + Math.floor(elapsed * 14)) % 6, progress: ((elapsed - T.drain) * 1.8 + index * .37) % 1
  })) : [];

  const beamWindow = smooth(elapsed, T.beamStart, T.beamStart + .1) * (1 - smooth(elapsed, T.rupture + .05, T.fireEnd));
  const beam = {alpha: beamWindow, width: (.6 + .4 * smooth(elapsed, T.beamStart, T.rupture)) * (1 + .1 * Math.sin(elapsed * 60) * motion)};

  const flash = ruptured && since < .25 ? (reducedEffects ? .25 : .7) * (1 - since / .25) ** 2 : 0;

  // Explosión azul del propietario: 8 fotogramas sobre el núcleo.
  const explosionAge = ruptured ? since / T.explosionSeconds : 1;
  const explosion = explosionAge < 1 ? {frame: Math.min(7, Math.floor(explosionAge * 8)),
    scale: 1.7 + .45 * easeOut(explosionAge, 0, 1), alpha: 1 - smooth(explosionAge, .8, 1)} : null;

  const fragments = elapsed >= T.stationGone - .1 ? FRAGMENTS.map(item => {
    const age = elapsed - (T.stationGone - .1);
    const travel = age * (.45 + .12 * (item.cell % 3)) + age * age * .04;
    return {cell: item.cell, dx: item.x * travel, dy: item.y * travel,
      angle: item.spin * age, scale: 1 + travel * (item.y > 0 ? 2.2 : 1),
      alpha: 1 - smooth(elapsed, T.fragmentsEnd - 3, T.fragmentsEnd)};
  }) : [];

  const darkness = .35 * smooth(elapsed, T.omen, T.approach) * (1 - smooth(elapsed, T.rupture, T.rupture + .6));

  const phase = SHOTS[shotIndex][1];
  return {active: true, phase, shot: shotIndex + 1, clock: elapsed, camera, darkness, distantLight,
    station, prime, drainStreams, beam, flash, explosion, fragments};
}
