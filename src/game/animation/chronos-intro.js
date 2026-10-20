/**
 * Coreografía del inicio de Chronos con las piezas del propietario.
 * Cronos Prime (fase 1) llega desde fuera, se coloca frente a la estación,
 * despliega las alas, carga y dispara su haz contra el reactor. A los 9 s
 * la estación se rompe y Cronos Prime se marcha mientras la nave huye.
 *
 * Función pura del reloj de ruta: no avanza ningún reloj, no toca la partida
 * ni los guardados; solo dice qué dibujar y dónde. Posiciones de Cronos Prime
 * en fracciones de pantalla; las de la estación, en unidades de su diámetro.
 */
export const CHRONOS_INTRO_TIMELINE = Object.freeze({
  arrive: 3, arrived: 6.2, unfoldStart: 5.4, unfoldEnd: 7.4,
  chargeStart: 7, beamStart: 8.6, rupture: 9, beamEnd: 9.9,
  flashSeconds: .9, retreatStart: 10.6, retreatEnd: 13.4,
  ringGone: 16, fragmentsEnd: 17, end: 26
});

const T = CHRONOS_INTRO_TIMELINE;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const smooth = (value, from, to) => {
  const t = clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
};
const mix = (from, to, amount) => from + (to - from) * amount;

// Puesto de disparo de Cronos Prime: encima del reactor, bajo el HUD y el
// diálogo, para que se vea entero.
const ENTRY = Object.freeze({x: 1.3, y: -.2});
const HOVER = Object.freeze({x: .5, y: .3});
// Encuadre de la estación durante el inicio: algo más pequeña y más abajo que
// en la ruta, para dejar sitio a Cronos Prime. Solo afecta al dibujo.
const STATION_FRAME = Object.freeze({zoom: .72, drop: .08});
const EXIT = Object.freeze({x: .62, y: -.4});

// Ocho restos con direcciones fijas (reproducibles): la mitad sale hacia la
// parte baja de la pantalla, donde vuela la nave.
const FRAGMENTS = Object.freeze([
  [-.95, -.35, 1.6], [.9, -.45, -1.2], [-.55, .85, 2.1], [.6, .8, -1.8],
  [-.2, -1, .9], [1, .15, 1.4], [-1, .2, -2.3], [.15, 1, 1.1]
].map(([x, y, spin], cell) => Object.freeze({cell, x, y, spin})));

const INACTIVE = Object.freeze({active: false});

export function getChronosIntroPose(elapsed, {reducedEffects = false} = {}) {
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > T.end) return INACTIVE;
  const ruptured = elapsed >= T.rupture;
  const since = elapsed - T.rupture;
  const phase = elapsed < T.arrive ? 'calm' : elapsed < T.arrived ? 'arrival'
    : elapsed < T.beamStart ? 'charge' : elapsed < T.beamEnd ? 'fire'
      : elapsed < T.retreatEnd ? 'retreat' : 'aftermath';

  const separation = ruptured ? smooth(since, 0, T.ringGone - T.rupture) : 0;
  const station = {
    // Giros contrarios y lentos; tras la ruptura el anillo exterior gira más rápido.
    ringAngle: -.06 * elapsed - (ruptured ? .35 * since * since / (1 + since) : 0),
    wheelAngle: .09 * elapsed + (ruptured ? .12 * since : 0),
    ringOffset: separation * .55,
    ringScale: 1 + separation * .35,
    ringAlpha: ruptured ? 1 - smooth(since, 2.5, T.ringGone - T.rupture) : 1,
    wheelCell: ruptured ? 2 : 1,
    towerCell: ruptured ? 4 : 3,
    towerLift: ruptured ? smooth(since, 0, 4) * .08 : 0,
    // Sacudida breve del impacto (sin ella con efectos reducidos).
    shake: ruptured && !reducedEffects ? .03 * Math.max(0, 1 - since / .8) * Math.sin(since * 55) : 0,
    // Alejamiento de presentación: la estación rota se aleja más deprisa que
    // la ruta para dejar sitio al juego. Solo afecta al dibujo.
    zoom: STATION_FRAME.zoom * (1 - .45 * smooth(elapsed, T.rupture + 1, 24)),
    drop: STATION_FRAME.drop
  };

  const arrival = smooth(elapsed, T.arrive, T.arrived);
  const leaving = smooth(elapsed, T.retreatStart, T.retreatEnd);
  const x = mix(mix(ENTRY.x, HOVER.x, arrival), EXIT.x, leaving);
  const y = mix(mix(ENTRY.y, HOVER.y, arrival), EXIT.y, leaving);
  // Retroceso del disparo: se empuja hacia arriba un instante.
  const recoil = ruptured ? .025 * Math.max(0, 1 - since / .6) : 0;
  const charge = smooth(elapsed, T.chargeStart, T.rupture);
  const prime = {
    visible: elapsed >= T.arrive && elapsed < T.retreatEnd,
    x, y: y - recoil,
    // Entra inclinado, se endereza al llegar y se ladea al marcharse.
    tilt: -.5 * (1 - arrival) + .35 * leaving,
    scale: mix(.55, 1, arrival) * (1 - .45 * leaving),
    alpha: elapsed < T.arrive ? 0 : 1,
    wingSpread: smooth(elapsed, T.unfoldStart, T.unfoldEnd) * (1 - .6 * leaving),
    bladeSpread: smooth(elapsed, T.unfoldStart + .5, T.unfoldEnd + .3) * (1 - .6 * leaving),
    coreGlow: ruptured ? 1 - smooth(since, .4, 2) * .7 : charge,
    charge,
    beamAlpha: smooth(elapsed, T.beamStart, T.rupture) * (1 - smooth(elapsed, T.rupture + .3, T.beamEnd))
  };

  const flashPeak = reducedEffects ? .3 : .6;
  const flash = ruptured && since < T.flashSeconds ? flashPeak * (1 - since / T.flashSeconds) ** 2 : 0;

  const fragments = ruptured ? FRAGMENTS.map(item => {
    const travel = since * (.35 + .1 * (item.cell % 3)) + since * since * .03;
    return {cell: item.cell, dx: item.x * travel, dy: item.y * travel,
      angle: item.spin * since, scale: .9 + travel * .55,
      alpha: 1 - smooth(elapsed, T.fragmentsEnd - 3, T.fragmentsEnd)};
  }) : [];

  return {active: true, phase, clock: elapsed, flash, station, prime, fragments};
}
