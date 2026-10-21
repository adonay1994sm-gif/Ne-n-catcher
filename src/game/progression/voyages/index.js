/**
 * Catálogo de viajes (fichas). Crece hasta los 50 viajes de la campaña
 * (10 sectores × 5 viajes); hoy contiene el viaje original.
 */
import {S1_V1_CHRONOS_GAIA} from './s1-v1-chronos-gaia.js';
import {applyDifficulty, calibrate, stagePressure, voyageNumber} from '../difficulty.js';
import {S1_V2_GAIA_OUTER_NET} from './s1-v2-gaia-outer-net.js';
import {S1_V3_EVACUEE_ESCORT} from './s1-v3-evacuee-escort.js';
import {S1_V4_FALSE_SIGNAL} from './s1-v4-false-signal.js';
import {S1_V5_CONVINCE_ATLAS} from './s1-v5-convince-atlas.js';
import {S2_V1_GAIA_DEPARTURE} from './s2-v1-gaia-departure.js';
import {S2_V2_FOLLOW_C17} from './s2-v2-follow-c17.js';
import {S2_V3_SLAG_BELT} from './s2-v3-slag-belt.js';
import {S2_V4_YARA_CALL} from './s2-v4-yara-call.js';
import {S2_V5_VULKAR_TITAN} from './s2-v5-vulkar-titan.js';

export const VOYAGES = Object.freeze([S1_V1_CHRONOS_GAIA, S1_V2_GAIA_OUTER_NET, S1_V3_EVACUEE_ESCORT, S1_V4_FALSE_SIGNAL, S1_V5_CONVINCE_ATLAS,
  S2_V1_GAIA_DEPARTURE, S2_V2_FOLLOW_C17, S2_V3_SLAG_BELT, S2_V4_YARA_CALL, S2_V5_VULKAR_TITAN]);
/** Viajes que el juego ya sabe lanzar (los demás se ven «en preparación»). */
export const PLAYABLE_VOYAGES = Object.freeze(VOYAGES.filter(ficha => ficha.playable !== false));
const byRoute = new Map(VOYAGES.map(ficha => [ficha.routeId, ficha]));

export const getVoyageFicha = routeId => byRoute.get(routeId) || null;

// Curva de dificultad: cada ficha se calibra contra S1-V1 (ver difficulty.js).
const rulesOf = ficha => ficha.encounters;
const REFERENCE = rulesOf(S1_V1_CHRONOS_GAIA).reduce((sum, rules) => sum + stagePressure(rules), 0) /
  S1_V1_CHRONOS_GAIA.encounters.length;
const FACTORS = new Map(VOYAGES.map(ficha => [ficha.routeId,
  ficha === S1_V1_CHRONOS_GAIA ? 1 : calibrate(rulesOf(ficha), {voyage: voyageNumber(ficha), reference: REFERENCE})]));

/** Reglas del tramo con la curva de la campaña y el modo de dificultad aplicados. */
export function getVoyageStageRulesFor(routeId, stageNumber, mode = 'normal') {
  return applyDifficulty(getVoyageStageRules(routeId, stageNumber), {factor: FACTORS.get(routeId) ?? 1, mode});
}

/** Reglas del tramo actual de un viaje (null si no hay ficha o tramo). */
export function getVoyageStageRules(routeId, stageNumber) {
  return getVoyageFicha(routeId)?.encounters[stageNumber - 1] || null;
}
