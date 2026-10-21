/**
 * Catálogo de viajes (fichas). Crece hasta los 50 viajes de la campaña
 * (10 sectores × 5 viajes); hoy contiene el viaje original.
 */
import {S1_V1_CHRONOS_GAIA} from './s1-v1-chronos-gaia.js';
import {S1_V2_GAIA_OUTER_NET} from './s1-v2-gaia-outer-net.js';

export const VOYAGES = Object.freeze([S1_V1_CHRONOS_GAIA, S1_V2_GAIA_OUTER_NET]);
/** Viajes que el juego ya sabe lanzar (los demás se ven «en preparación»). */
export const PLAYABLE_VOYAGES = Object.freeze(VOYAGES.filter(ficha => ficha.playable !== false));
const byRoute = new Map(VOYAGES.map(ficha => [ficha.routeId, ficha]));

export const getVoyageFicha = routeId => byRoute.get(routeId) || null;

/** Reglas del tramo actual de un viaje (null si no hay ficha o tramo). */
export function getVoyageStageRules(routeId, stageNumber) {
  return getVoyageFicha(routeId)?.encounters[stageNumber - 1] || null;
}
