/**
 * Campo de peligros ambientales del viaje Chronos → Gaia (meteoritos, restos
 * de naves y satélites rotos). Es una política de aparición, no un segundo
 * reloj: quien llama le pasa el tiempo jugado y crea los objetos reales con su
 * física y colisión habituales.
 *
 * Reglas de justicia: nunca supera el tope de amenazas del tramo y cada
 * aparición deja en la franja superior al menos un hueco por el que cabe la
 * nave con margen. Si no hay sitio, espera en vez de cerrar el paso.
 */
export const VOYAGE_HAZARD_VERSION = 'voyage-hazards-v2';

export const VOYAGE_HAZARD_RULES = Object.freeze({
  maxDelta: .05, upperBand: .45, gapMargin: 50, footprint: 1.3, edgeMargin: 46, attempts: 8
});

// gap: segundos entre apariciones [mín, máx]; cap: amenazas ambientales a la
// vez; cluster: probabilidad de que salgan 2–3 juntas; mix: pesos por tipo;
// speed: px/s [mín, máx]; start: segundos del tramo sin peligros; damageScale:
// parte del daño normal que hacen. Valores de trabajo reversibles.
const profile = (gap, cap, cluster, mix, speed, {start = 0, damageScale = 1} = {}) => Object.freeze({
  gap: Object.freeze(gap), cap, cluster, mix: Object.freeze(mix), speed: Object.freeze(speed), start, damageScale
});
export const VOYAGE_HAZARD_PROFILES = Object.freeze({
  // 1.1: el campo nace con la ruptura (9 s de ruta); 8 s de respiro desde
  // ahí, dos a la vez como mucho y medio daño mientras el piloto se sitúa
  // (prueba del propietario, 20/10).
  1: profile([1.7, 2.7], 2, .15, {meteor: .45, debris: .55}, [170, 260], {start: 8, damageScale: .5}),
  2: profile([1.1, 1.9], 4, .30, {meteor: .30, debris: .55, satellite: .15}, [160, 250], {damageScale: .5}),
  3: profile([.9, 1.6], 5, .35, {meteor: .35, debris: .50, satellite: .15}, [170, 270]),
  4: profile([1.3, 2.1], 4, .25, {meteor: .50, debris: .40, satellite: .10}, [190, 290]),
  5: profile([2.3, 3.4], 2, .10, {meteor: .80, debris: .20}, [210, 320]),
  6: profile([2.8, 4.0], 2, .05, {meteor: .60, debris: .40}, [170, 250]),
  7: profile([1.5, 2.3], 3, .20, {meteor: .55, debris: .35, satellite: .10}, [200, 300]),
  8: profile([1.2, 2.0], 4, .30, {meteor: .55, debris: .35, satellite: .10}, [210, 310]),
  9: profile([1.6, 2.5], 3, .20, {meteor: .50, debris: .35, satellite: .15}, [210, 320]),
  10: profile([1.0, 1.7], 5, .35, {meteor: .45, debris: .40, satellite: .15}, [220, 330])
});

const finite = (value, label) => {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite`);
  return value;
};

const randomFor = seed => {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
};

const RADIUS_ESTIMATE = Object.freeze({meteor: 42, debris: 35, satellite: 46});

export function createVoyageHazardField({stageNumber, seed = 0, width = 720, height = 1280,
  shipWidth = 208 * .52, profile = null} = {}) {
  for (const [label, value] of Object.entries({stageNumber, seed, width, height, shipWidth})) finite(value, label);
  // Cada ficha de viaje puede traer su perfil; sin él se usa el del viaje 1.
  const stage = profile || VOYAGE_HAZARD_PROFILES[stageNumber];
  if (!stage || width < 250 || height < 300 || shipWidth <= 0) throw new RangeError('Invalid voyage hazard stage or viewport');
  const random = randomFor((Math.trunc(seed) >>> 0) ^ Math.imul(stageNumber, 0x9E3779B9));
  return {version: VOYAGE_HAZARD_VERSION, stageNumber, profile: stage, width, height, shipWidth, random,
    // La primera aparición llega pronto para que el tramo no empiece vacío.
    wait: stage.start + .6 + random() * .8, emitted: 0, skipped: 0};
}

function pickType(mix, random) {
  const entries = Object.entries(mix);
  let roll = random() * entries.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [type, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return entries[entries.length - 1][0];
}

/** Mayor hueco horizontal libre entre las amenazas de la franja superior. */
export function largestUpperGap(field, threats) {
  const band = field.height * VOYAGE_HAZARD_RULES.upperBand;
  const spans = threats.filter(item => item.y < band)
    .map(item => [item.x - item.r * VOYAGE_HAZARD_RULES.footprint, item.x + item.r * VOYAGE_HAZARD_RULES.footprint])
    .sort((a, b) => a[0] - b[0]);
  let cursor = 0, best = 0;
  for (const [left, right] of spans) {
    best = Math.max(best, left - cursor);
    cursor = Math.max(cursor, right);
  }
  return Math.max(best, field.width - cursor);
}

function placeHazard(field, profileData, threats) {
  const required = field.shipWidth + VOYAGE_HAZARD_RULES.gapMargin;
  const type = pickType(profileData.mix, field.random);
  const r = RADIUS_ESTIMATE[type];
  for (let attempt = 0; attempt < VOYAGE_HAZARD_RULES.attempts; attempt++) {
    const margin = VOYAGE_HAZARD_RULES.edgeMargin;
    const x = margin + field.random() * (field.width - margin * 2);
    // Evita que dos apariciones nazcan una encima de otra.
    if (threats.some(item => item.y < field.height * .2 && Math.abs(item.x - x) < item.r + r + 24)) continue;
    const candidate = {x, y: -95, r};
    if (largestUpperGap(field, [...threats, candidate]) < required) continue;
    const [low, high] = profileData.speed;
    return {type, x, speed: low + field.random() * (high - low), r};
  }
  return null;
}

/**
 * Avanza el campo con el tiempo jugado. `threats` son las amenazas ambientales
 * vivas ({x, y, r}); `emit` recibe {type, x, speed} para crear cada objeto.
 */
export function advanceVoyageHazardField(field, delta, threats, emit) {
  if (field?.version !== VOYAGE_HAZARD_VERSION) throw new TypeError('Voyage hazard field required');
  if (typeof emit !== 'function') throw new TypeError('Voyage hazard callback required');
  finite(delta, 'delta');
  if (delta < 0) throw new RangeError('delta must not be negative');
  const step = Math.min(delta, VOYAGE_HAZARD_RULES.maxDelta);
  const profileData = field.profile;
  field.wait -= step;
  if (field.wait > 0) return 0;
  const [low, high] = profileData.gap;
  field.wait = low + field.random() * (high - low);
  const live = threats.map(item => ({x: item.x, y: item.y, r: item.r}));
  const wanted = field.random() < profileData.cluster ? 2 + (field.random() < .35 ? 1 : 0) : 1;
  let count = 0;
  for (let index = 0; index < wanted && live.length < profileData.cap; index++) {
    const hazard = placeHazard(field, profileData, live);
    if (!hazard) { field.skipped++; break; }
    live.push({x: hazard.x, y: -95 - index * 70, r: hazard.r});
    field.emitted++; count++;
    emit(Object.freeze({type: hazard.type, x: hazard.x, speed: hazard.speed, delayY: index * 70,
      damageScale: profileData.damageScale}));
  }
  return count;
}
