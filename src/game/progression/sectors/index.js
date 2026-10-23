/**
 * Catálogo de sectores: cada sector es un viaje continuo de 10 tramos
 * (docs/superpowers/specs/2026-10-22-campana-galaxia-design.md).
 */
import {S1_GAIA} from './s1-gaia.js';

export const SECTORS = Object.freeze([S1_GAIA]);
const byId = new Map(SECTORS.map(ficha => [ficha.id, ficha]));

export const getSectorFicha = id => byId.get(id) || null;
