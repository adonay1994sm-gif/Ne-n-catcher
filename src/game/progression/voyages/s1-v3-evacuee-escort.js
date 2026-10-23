/**
 * Ficha del viaje S1-V3 · Escolta a los evacuados (anillo de satélites →
 * órbita alta de Gaia). Ver docs/design/CAMPANA_50_VIAJES.md, sector 1.
 *
 * Naves civiles de Chronos llegan sin permiso y los perseguidores del C-17
 * las cazan. Por ahora la escolta se cuenta con la radio y la presión de las
 * patrullas (la mecánica de convoy llegará con su propio arte).
 */
import {smooth} from '../voyage-engine.js';
import {VOYAGE_HAZARD_PROFILES} from '../voyage-hazards.js';

const immutable = object => Object.freeze(object);
const ROSTERS = immutable({
  hunters: immutable(['raider', 'raider', 'scout']), alpha: immutable(['interceptor', 'raider', 'interceptor', 'scout'])
});
const encounter = (profile, patrol, {comets = false, repairAt = null} = {}) => immutable({
  patrol: patrol && immutable({cap: patrol[0], roster: patrol[1], gap: patrol[2]}),
  hazards: VOYAGE_HAZARD_PROFILES[profile], comets, repairAt
});

export const S1_V3_EVACUEE_ESCORT = immutable({
  id: 'S1-V3', sector: 1, number: 3, title: 'Escolta a los evacuados',
  chapter: 3, version: 's1-v3-voyage-v1', saveKey: 'neonCronium.voyage.S1-V3.v1',
  routeId: 'gaia-evacuee-escort', eventPrefix: 's1-v3', baseGoal: 36,
  origin: 'Anillo de satélites', destination: 'Órbita alta de Gaia',
  arrivalDestinationId: 'gaia-high-orbit', cinematicDuration: 0, recoveryAt: 0,
  invalidCheckpointMessage: 'Invalid S1-V3 voyage checkpoint',
  stages: immutable([
    ['Naves sin permiso',30,5,'Localiza a los evacuados de Chronos','Anillo de satélites','Columna civil','civilian-contact',.10,.52,.34],
    ['Columna civil',32,11,'Mantente junto a la columna y recupera su CRONIUM','Columna civil','Cazadores del C-17','escort-start',.12,.56,.46],
    ['Cazadores del C-17',34,17,'Derriba a los perseguidores antes de que alcancen la columna','Cazadores del C-17','Paso estrecho','hunter-wave',.14,.60,.60],
    ['Paso estrecho',30,22,'Abre paso entre restos para las naves lentas','Paso estrecho','Alfa del C-17','narrow-pass',.16,.62,.52],
    ['Alfa del C-17',34,29,'Resiste al interceptor Alfa que lidera la caza','Alfa del C-17','Órbita alta','alpha-hunt',.18,.66,.70],
    ['Órbita alta',34,36,'Lleva a los evacuados hasta la órbita alta de Gaia','Órbita alta','Órbita alta de Gaia','high-orbit-arrival',.12,.58,.58]
  ].map(stage => immutable(stage))),
  events: immutable([]),
  service: null,
  encounters: immutable([
    encounter(3, [2, ROSTERS.hunters, 8]),
    encounter(4, [2, ROSTERS.hunters, 7]),
    encounter(8, [3, ROSTERS.hunters, 6], {repairAt: 16}),
    encounter(7, [2, ROSTERS.alpha, 8], {comets: true}),
    encounter(9, [3, ROSTERS.alpha, 6], {repairAt: 18}),
    encounter(10, [3, ROSTERS.alpha, 6])
  ]),
  phase(stageIndex) {
    return stageIndex < 2 ? 'escort' : stageIndex < 5 ? 'hunt' : 'gaia-approach';
  },
  scenery({p, stageIndex, stage, arrived}) {
    const approach = smooth(p, 0, 1);
    return {
      station: immutable({x: .5, y: 1.4, scale: .01, rotation: 0, visible: false, alpha: 0, state: 'ruptured'}),
      planet: immutable({x: .62 - .10 * approach, y: .12 + .04 * approach,
        scale: .58 + .30 * approach, rotation: .05 * p, visible: true, alpha: 1}),
      beacon: immutable({x: .5, y: 1.2, scale: 0, visible: false, alpha: 0, active: false}),
      relay: immutable({visible: false, x: 0, y: 0, scale: 0, alpha: 0, active: false, state: 'approach'}),
      attacker: immutable({x: 1.2, y: 0, scale: 0, rotation: 0, visible: false, state: 'retreat'}),
      deepSpace: immutable({travel: p, offsetX: -.08 * p, offsetY: 1.8 * p, speed: .50 + .25 * smooth(p, .1, .5),
        alpha: 1, nebulaOpacity: stage.nebulaOpacity, starDensity: stage.starDensity, dustDensity: .24}),
      debris: immutable({visible: !arrived, travel: p, directionX: -.20, directionY: .98,
        depth: .35, density: stageIndex === 3 ? .70 : .34})
    };
  }
});
