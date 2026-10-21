/**
 * Ficha del viaje S2-V2 · Sigue al C-17 (Borde del sistema de Gaia → Ruta de carga abandonada).
 * Ver docs/design/CAMPANA_50_VIAJES.md, sector 2 (Gaia → Vulkar).
 *
 * El C-17 aparece pequeño al frente todo el viaje: la persecución empieza
 * en el primer tramo. Sus escoltas cubren la huida.
 */
import {smooth} from '../voyage-engine.js';
import {VOYAGE_HAZARD_PROFILES} from '../voyage-hazards.js';

const immutable = object => Object.freeze(object);
const ROSTERS = immutable({
  escort: immutable(['raider', 'raider', 'interceptor']), rearguard: immutable(['interceptor', 'raider', 'interceptor', 'scout'])
});
const encounter = (profile, patrol, {comets = false, repairAt = null} = {}) => immutable({
  patrol: patrol && immutable({cap: patrol[0], roster: patrol[1], gap: patrol[2]}),
  hazards: VOYAGE_HAZARD_PROFILES[profile], comets, repairAt
});

export const S2_V2_FOLLOW_C17 = immutable({
  id: 'S2-V2', sector: 2, number: 2, title: 'Sigue al C-17', planet: 'volcanico',
  chapter: 7, version: 's2-v2-voyage-v1', saveKey: 'neonCatcher.voyage.S2-V2.v1',
  routeId: 'c17-pursuit', eventPrefix: 's2-v2', baseGoal: 36,
  origin: 'Borde del sistema de Gaia', destination: 'Ruta de carga abandonada',
  arrivalDestinationId: 'abandoned-cargo-route', cinematicDuration: 0, recoveryAt: 0,
  invalidCheckpointMessage: 'Invalid S2-V2 voyage checkpoint',
  stages: immutable([
    ['Una nave negra',30,5,'El C-17 aparece al frente: no lo pierdas de vista','Borde del sistema de Gaia','Estela del C-17','black-ship',.10,.50,.42],
    ['Estela del C-17',32,11,'Sigue su estela entre los restos de su escolta','Estela del C-17','Escoltas','c17-wake',.12,.54,.52],
    ['Escoltas',32,17,'Derriba a las escoltas que cubren la huida','Escoltas','Ruta de carga','escorts',.14,.58,.64],
    ['Ruta de carga',30,22,'Entra en la ruta de carga abandonada','Ruta de carga','Contenedores a la deriva','cargo-route',.12,.54,.48],
    ['Contenedores a la deriva',32,27,'Esquiva los contenedores que suelta el C-17','Contenedores a la deriva','Retaguardia','drifting-cargo',.16,.58,.58],
    ['Retaguardia',32,32,'Rompe la retaguardia antes de que cierre la ruta','Retaguardia','Fin de la ruta','rearguard',.16,.60,.70],
    ['Fin de la ruta',34,36,'Llega al final de la ruta: el C-17 se escapa hacia Vulkar','Fin de la ruta','Ruta de carga abandonada','route-end',.14,.56,.62]
  ].map(stage => immutable(stage))),
  events: immutable([]),
  service: null,
  encounters: immutable([
    encounter(4, [2, ROSTERS.escort, 8]),
    encounter(7, [2, ROSTERS.escort, 7]),
    encounter(8, [3, ROSTERS.escort, 6], {repairAt: 16}),
    encounter(3, [2, ROSTERS.escort, 8]),
    encounter(9, [2, ROSTERS.rearguard, 7], {comets: true}),
    encounter(9, [3, ROSTERS.rearguard, 6], {repairAt: 16}),
    encounter(10, [3, ROSTERS.rearguard, 6])
  ]),
  phase(stageIndex) {
    return stageIndex < 2 ? 'pursuit' : 'cargo-route';
  },
  scenery({p, stageIndex, stage, arrived}) {
    // Vulkar (atlas volcánico del propietario) crece al frente durante el viaje.
    const approach = smooth(p, 0, 1);
    return {
      station: immutable({x: .5, y: 1.4, scale: .01, rotation: 0, visible: false, alpha: 0, state: 'ruptured'}),
      planet: immutable({x: .72 - .14 * approach, y: .10 + .04 * approach,
        scale: .16 + .22 * approach, rotation: .03 * p, visible: true, alpha: 1}),
      beacon: immutable({x: .5, y: 1.2, scale: 0, visible: false, alpha: 0, active: false}),
      relay: immutable({visible: false, x: 0, y: 0, scale: 0, alpha: 0, active: false, state: 'approach'}),
      attacker: immutable({x: 1.2, y: 0, scale: 0, rotation: 0, visible: false, state: 'retreat'}),
      deepSpace: immutable({travel: p, offsetX: -.08 * p, offsetY: 1.8 * p, speed: .50 + .25 * smooth(p, .1, .5),
        alpha: 1, nebulaOpacity: stage.nebulaOpacity, starDensity: stage.starDensity, dustDensity: .26}),
      debris: immutable({visible: !arrived, travel: p, directionX: -.20, directionY: .98,
        depth: .35, density: stageIndex === 4 ? .70 : .36})
    };
  }
});
