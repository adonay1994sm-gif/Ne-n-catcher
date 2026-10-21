/**
 * Ficha del viaje S2-V1 · Sal de Gaia con paso libre (Gaia Nova → Borde del sistema de Gaia).
 * Ver docs/design/CAMPANA_50_VIAJES.md, sector 2 (Gaia → Vulkar).
 *
 * Iria da paso libre y Mira cobra la reparación tras Atlas. Unidades CH
 * desconectadas de la red no reciben la orden y siguen disparando.
 */
import {smooth} from '../voyage-engine.js';
import {VOYAGE_HAZARD_PROFILES} from '../voyage-hazards.js';

const immutable = object => Object.freeze(object);
const ROSTERS = immutable({
  rogue: immutable(['scout', 'scout', 'interceptor']), rogueRaid: immutable(['interceptor', 'raider', 'scout'])
});
const encounter = (profile, patrol, {comets = false, repairAt = null} = {}) => immutable({
  patrol: patrol && immutable({cap: patrol[0], roster: patrol[1], gap: patrol[2]}),
  hazards: VOYAGE_HAZARD_PROFILES[profile], comets, repairAt
});

export const S2_V1_GAIA_DEPARTURE = immutable({
  id: 'S2-V1', sector: 2, number: 1, title: 'Sal de Gaia con paso libre', planet: 'volcanico',
  chapter: 6, version: 's2-v1-voyage-v1', saveKey: 'neonCatcher.voyage.S2-V1.v1',
  routeId: 'gaia-free-passage', eventPrefix: 's2-v1', baseGoal: 36,
  origin: 'Gaia Nova', destination: 'Borde del sistema de Gaia',
  arrivalDestinationId: 'gaia-system-edge', cinematicDuration: 0, recoveryAt: 0,
  invalidCheckpointMessage: 'Invalid S2-V1 voyage checkpoint',
  stages: immutable([
    ['Paso libre',30,4,'Despega de Gaia con la autorización de Iria','Gaia Nova','Tráfico civil','free-passage',.10,.52,.30],
    ['Tráfico civil',32,10,'Cruza el tráfico de Gaia sin dañar a sus naves','Tráfico civil','Satélites sordos','civil-traffic',.10,.54,.36],
    ['Satélites sordos',32,16,'Unidades CH desconectadas no reciben la orden de Iria','Satélites sordos','Malla rota','rogue-units',.12,.58,.52],
    ['Malla rota',30,21,'Atraviesa la malla rota del perímetro','Malla rota','Gaia atrás','broken-mesh',.12,.56,.46],
    ['Gaia atrás',32,26,'Deja atrás Gaia; Vulkar aparece en el horizonte','Gaia atrás','Primer resplandor','gaia-astern',.08,.48,.40],
    ['Primer resplandor',32,31,'Sigue el resplandor rojo de las forjas','Primer resplandor','Borde del sistema','first-glow',.12,.52,.56],
    ['Borde del sistema',34,36,'Alcanza el borde del sistema de Gaia','Borde del sistema','Borde del sistema de Gaia','system-edge',.14,.56,.62]
  ].map(stage => immutable(stage))),
  events: immutable([]),
  service: null,
  encounters: immutable([
    encounter(3, [1, ROSTERS.rogue, 9]),
    encounter(4, [2, ROSTERS.rogue, 8]),
    encounter(7, [3, ROSTERS.rogue, 7], {repairAt: 16}),
    encounter(5, [2, ROSTERS.rogue, 8]),
    encounter(5, null, {comets: true}),
    encounter(8, [3, ROSTERS.rogueRaid, 7], {repairAt: 16}),
    encounter(9, [3, ROSTERS.rogueRaid, 6])
  ]),
  phase(stageIndex) {
    return stageIndex < 2 ? 'gaia-departure' : 'deep-space';
  },
  scenery({p, stageIndex, stage, arrived}) {
    // Vulkar (atlas volcánico del propietario) crece al frente durante el viaje.
    const approach = smooth(p, 0, 1);
    return {
      station: immutable({x: .5, y: 1.4, scale: .01, rotation: 0, visible: false, alpha: 0, state: 'ruptured'}),
      planet: immutable({x: .80 - .10 * approach, y: .10 + .04 * approach,
        scale: .04 + .20 * approach, rotation: .03 * p, visible: true, alpha: 1}),
      beacon: immutable({x: .5, y: 1.2, scale: 0, visible: false, alpha: 0, active: false}),
      relay: immutable({visible: false, x: 0, y: 0, scale: 0, alpha: 0, active: false, state: 'approach'}),
      attacker: immutable({x: 1.2, y: 0, scale: 0, rotation: 0, visible: false, state: 'retreat'}),
      deepSpace: immutable({travel: p, offsetX: -.08 * p, offsetY: 1.8 * p, speed: .50 + .25 * smooth(p, .1, .5),
        alpha: 1, nebulaOpacity: stage.nebulaOpacity, starDensity: stage.starDensity, dustDensity: .26}),
      debris: immutable({visible: !arrived, travel: p, directionX: -.20, directionY: .98,
        depth: .35, density: stageIndex >= 4 ? .20 : .34})
    };
  }
});
