/**
 * Ficha del viaje S2-V5 · Detén al Titán de Vulkar (Órbita alta de Vulkar → Descenso a las forjas).
 * Ver docs/design/CAMPANA_50_VIAJES.md, sector 2 (Gaia → Vulkar).
 *
 * El C-17 descargó CRONIUM en las forjas y el Titán sale a cerrar el paso.
 * El combate del Titán llegará con su arte; de momento el viaje termina al
 * alcanzar el descenso, entre columnas de plasma anunciadas.
 */
import {smooth} from '../voyage-engine.js';
import {VOYAGE_HAZARD_PROFILES} from '../voyage-hazards.js';

const immutable = object => Object.freeze(object);
const ROSTERS = immutable({
  drones: immutable(['interceptor', 'interceptor', 'scout']), titanGuard: immutable(['interceptor', 'raider', 'interceptor', 'raider'])
});
const encounter = (profile, patrol, {comets = false, repairAt = null} = {}) => immutable({
  patrol: patrol && immutable({cap: patrol[0], roster: patrol[1], gap: patrol[2]}),
  hazards: VOYAGE_HAZARD_PROFILES[profile], comets, repairAt
});

export const S2_V5_VULKAR_TITAN = immutable({
  id: 'S2-V5', sector: 2, number: 5, title: 'Detén al Titán de Vulkar', planet: 'volcanico',
  chapter: 10, version: 's2-v5-voyage-v1', saveKey: 'neonCatcher.voyage.S2-V5.v1',
  routeId: 'vulkar-titan', eventPrefix: 's2-v5', baseGoal: 36,
  origin: 'Órbita alta de Vulkar', destination: 'Descenso a las forjas',
  arrivalDestinationId: 'vulkar-forges', cinematicDuration: 0, recoveryAt: 0,
  invalidCheckpointMessage: 'Invalid S2-V5 voyage checkpoint',
  stages: immutable([
    ['Rastro de descarga',30,4,'Sigue el rastro de la descarga del C-17','Órbita alta de Vulkar','Columnas de plasma','unload-trail',.14,.52,.44],
    ['Columnas de plasma',34,9,'Atento a los avisos: el planeta escupe plasma','Columnas de plasma','Drones de escoria','plasma-columns',.18,.56,.58],
    ['Drones de escoria',32,14,'Una pareja de drones de escoria te corta el paso','Drones de escoria','Puerta de las forjas','slag-drones',.16,.58,.66],
    ['Puerta de las forjas',32,19,'Cruza la puerta de las forjas abierta por el C-17','Puerta de las forjas','Sombra del Titán','forge-gate',.16,.56,.62],
    ['Sombra del Titán',34,24,'Algo enorme se mueve bajo la lava','Sombra del Titán','Guardia del Titán','titan-shadow',.20,.60,.70],
    ['Guardia del Titán',32,28,'Rompe la guardia que protege el descenso','Guardia del Titán','Calor extremo','titan-guard',.18,.60,.74],
    ['Calor extremo',30,32,'Aguanta el calor del descenso','Calor extremo','Descenso','extreme-heat',.20,.62,.68],
    ['Descenso a las forjas',34,36,'Alcanza el descenso: el Titán te espera','Descenso','Descenso a las forjas','forge-descent',.22,.64,.78]
  ].map(stage => immutable(stage))),
  events: immutable([]),
  service: null,
  encounters: immutable([
    encounter(7, [2, ROSTERS.drones, 8]),
    encounter(9, [2, ROSTERS.drones, 7], {comets: true}),
    encounter(8, [3, ROSTERS.drones, 7], {repairAt: 16}),
    encounter(7, [3, ROSTERS.titanGuard, 7]),
    encounter(9, [3, ROSTERS.titanGuard, 6], {repairAt: 18}),
    encounter(10, [3, ROSTERS.titanGuard, 6]),
    encounter(9, [3, ROSTERS.titanGuard, 6], {comets: true}),
    encounter(10, [3, ROSTERS.titanGuard, 6], {repairAt: 14})
  ]),
  phase(stageIndex) {
    return stageIndex < 2 ? 'plasma' : 'forge-descent';
  },
  scenery({p, stageIndex, stage, arrived}) {
    // Vulkar (atlas volcánico del propietario) crece al frente durante el viaje.
    const approach = smooth(p, 0, 1);
    return {
      station: immutable({x: .5, y: 1.4, scale: .01, rotation: 0, visible: false, alpha: 0, state: 'ruptured'}),
      planet: immutable({x: .56 - .10 * approach, y: .10 + .04 * approach,
        scale: .66 + .30 * approach, rotation: .03 * p, visible: true, alpha: 1}),
      beacon: immutable({x: .5, y: 1.2, scale: 0, visible: false, alpha: 0, active: false}),
      relay: immutable({visible: false, x: 0, y: 0, scale: 0, alpha: 0, active: false, state: 'approach'}),
      attacker: immutable({x: 1.2, y: 0, scale: 0, rotation: 0, visible: false, state: 'retreat'}),
      deepSpace: immutable({travel: p, offsetX: -.08 * p, offsetY: 1.8 * p, speed: .50 + .25 * smooth(p, .1, .5),
        alpha: 1, nebulaOpacity: stage.nebulaOpacity, starDensity: stage.starDensity, dustDensity: .26}),
      debris: immutable({visible: !arrived, travel: p, directionX: -.20, directionY: .98,
        depth: .35, density: stageIndex >= 4 ? .40 : .30})
    };
  }
});
