/**
 * Coreografía del inicio de Chronos con las piezas del propietario
 * (estación por piezas, Cronos Prime fase 1, fragmentos y láminas de la
 * ruptura). Función pura del reloj de ruta: no avanza ningún reloj, no toca
 * la partida ni los guardados; solo dice qué dibujar y dónde.
 *
 * Distancias en unidades del diámetro de la estación; ángulos en radianes.
 */
export const CHRONOS_INTRO_TIMELINE = Object.freeze({
  awaken: 5, stutterStart: 7.6, stutterEnd: 8.2, stutterRewind: .5,
  rupture: 9, flashSeconds: 1.2, primeGone: 11.5, ringGone: 16,
  fragmentsEnd: 17, backdropIn: .6, backdropFrameSeconds: 2.1,
  backdropOutStart: 21, backdropEnd: 24, backdropMaxAlpha: .78, end: 26
});

const T = CHRONOS_INTRO_TIMELINE;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const smooth = (value, from, to) => {
  const t = clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
};

// Ocho restos con direcciones fijas (reproducibles): la mitad sale hacia la
// parte baja de la pantalla, donde vuela la nave.
const FRAGMENTS = Object.freeze([
  [-.95, -.35, 1.6], [.9, -.45, -1.2], [-.55, .85, 2.1], [.6, .8, -1.8],
  [-.2, -1, .9], [1, .15, 1.4], [-1, .2, -2.3], [.15, 1, 1.1]
].map(([x, y, spin], cell) => Object.freeze({cell, x, y, spin})));

const INACTIVE = Object.freeze({active: false});

export function getChronosIntroPose(elapsed, {reducedEffects = false} = {}) {
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > T.end) return INACTIVE;
  const stuttering = !reducedEffects && elapsed >= T.stutterStart && elapsed < T.stutterEnd;
  // El tiempo «tartamudea»: el paisaje repite medio segundo justo antes del
  // disparo. La partida sigue con el reloj real.
  const clock = stuttering ? elapsed - T.stutterRewind : elapsed;
  const ruptured = elapsed >= T.rupture;
  const since = elapsed - T.rupture;
  const phase = elapsed < T.awaken ? 'calm' : stuttering ? 'stutter' : !ruptured ? 'awakening'
    : elapsed < T.primeGone ? 'rupture' : 'aftermath';

  const separation = ruptured ? smooth(since, 0, T.ringGone - T.rupture) : 0;
  const station = {
    // Giros contrarios y lentos; tras la ruptura el anillo exterior gira más rápido.
    ringAngle: -.06 * clock - (ruptured ? .35 * since * since / (1 + since) : 0),
    wheelAngle: .09 * clock + (ruptured ? .12 * since : 0),
    ringOffset: separation * .55,
    ringScale: 1 + separation * .35,
    ringAlpha: ruptured ? 1 - smooth(since, 2.5, T.ringGone - T.rupture) : 1,
    wheelCell: ruptured ? 2 : 1,
    towerCell: ruptured ? 4 : 3,
    towerLift: ruptured ? smooth(since, 0, 4) * .08 : 0,
    coreAlpha: 1,
    // Alejamiento de presentación: la estación rota se aleja más deprisa que
    // la ruta para dejar sitio al juego. Solo afecta al dibujo.
    zoom: 1 - .45 * smooth(elapsed, T.rupture + 1, T.backdropEnd)
  };

  const awakening = smooth(clock, T.awaken, T.rupture - .2);
  const prime = {
    alpha: elapsed < T.awaken ? 0 : ruptured ? 1 - smooth(since, .4, T.primeGone - T.rupture) : smooth(clock, T.awaken, T.awaken + 1.2),
    coreGlow: ruptured ? 1 : awakening,
    wingSpread: ruptured ? 1 : smooth(clock, T.awaken + 1.6, T.rupture - .3),
    bladeSpread: ruptured ? 1 : smooth(clock, T.awaken + 2.2, T.rupture - .2),
    beamAlpha: ruptured ? 1 - smooth(since, .2, 1.4) : smooth(clock, T.rupture - .5, T.rupture) * .9,
    scale: .55 + .2 * awakening + (ruptured ? .25 * smooth(since, 0, 2) : 0)
  };

  const flashPeak = reducedEffects ? .4 : 1;
  const flash = ruptured && since < T.flashSeconds ? flashPeak * (1 - since / T.flashSeconds) ** 2 : 0;

  const fragments = ruptured ? FRAGMENTS.map(item => {
    const travel = since * (.35 + .1 * (item.cell % 3)) + since * since * .03;
    return {cell: item.cell, dx: item.x * travel, dy: item.y * travel,
      angle: item.spin * since, scale: .9 + travel * .55,
      alpha: 1 - smooth(elapsed, T.fragmentsEnd - 3, T.fragmentsEnd)};
  }) : [];

  // Láminas de la ruptura detrás del juego, en orden, con fundido cruzado.
  let backdrop = {alpha: 0, frameA: 0, frameB: 0, mix: 0, zoom: 1.12};
  if (ruptured && elapsed < T.backdropEnd) {
    const position = clamp(since / T.backdropFrameSeconds, 0, 5);
    const frameA = Math.floor(position), frameB = Math.min(5, frameA + 1);
    backdrop = {
      alpha: T.backdropMaxAlpha * smooth(since, 0, T.backdropIn) * (1 - smooth(elapsed, T.backdropOutStart, T.backdropEnd)),
      frameA, frameB, mix: frameA === frameB ? 0 : smooth(position - frameA, .55, 1),
      zoom: 1.12 - .2 * smooth(elapsed, T.rupture, T.backdropEnd)
    };
  }

  return {active: true, phase, clock, stutter: stuttering ? 1 : 0, flash, station, prime, fragments, backdrop};
}
