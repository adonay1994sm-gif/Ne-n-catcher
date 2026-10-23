/**
 * Ficha del viaje S2-V3 · Cruza el cinturón de escoria (Ruta de carga abandonada → Cinturón de escoria).
 * Ver docs/design/CAMPANA_50_VIAJES.md, sector 2 (Gaia → Vulkar).
 *
 * N-7 detecta CRONIUM fundido entre la escoria que expulsan las forjas.
 * Mucha chatarra para la bodega y lluvia de escoria incandescente.
 */
import {smooth} from '../voyage-engine.js';
import {VULKAR_HAZARD_PROFILES} from '../voyage-hazards.js';

const immutable = object => Object.freeze(object);
const ROSTERS = immutable({
  scavengers: immutable(['raider', 'scout', 'raider']), lava: immutable(['interceptor', 'raider', 'raider', 'scout'])
});
const encounter = (profile, patrol, {comets = false, repairAt = null} = {}) => immutable({
  patrol: patrol && immutable({cap: patrol[0], roster: patrol[1], gap: patrol[2]}),
  hazards: VULKAR_HAZARD_PROFILES[profile], comets, repairAt
});

export const S2_V3_SLAG_BELT = immutable({
  id: 'S2-V3', sector: 2, number: 3, title: 'Cruza el cinturón de escoria', planet: 'volcanico',
  chapter: 8, version: 's2-v3-voyage-v1', saveKey: 'neonCronium.voyage.S2-V3.v1',
  routeId: 'slag-belt', eventPrefix: 's2-v3', baseGoal: 36,
  origin: 'Ruta de carga abandonada', destination: 'Cinturón de escoria',
  arrivalDestinationId: 'vulkar-slag-belt', cinematicDuration: 0, recoveryAt: 0,
  invalidCheckpointMessage: 'Invalid S2-V3 voyage checkpoint',
  stages: immutable([
    ['Primeras brasas',30,4,'Entra en el cinturón siguiendo el CRONIUM fundido','Ruta de carga abandonada','Escoria fina','first-embers',.12,.50,.40],
    ['Escoria fina',32,9,'Recupera el CRONIUM entre la escoria fina','Escoria fina','Lluvia de escoria','fine-slag',.14,.54,.48],
    ['Lluvia de escoria',34,15,'Cruza la lluvia de escoria incandescente','Lluvia de escoria','Chatarreros','slag-rain',.18,.58,.62],
    ['Chatarreros',32,20,'Los chatarreros del sindicato reclaman el botín','Chatarreros','Núcleo de lava','scavengers',.14,.56,.58],
    ['Núcleo de lava',34,26,'Un núcleo de lava se parte al calentarse','Núcleo de lava','Vetas de CRONIUM','lava-core',.18,.60,.70],
    ['Vetas de CRONIUM',32,31,'Rescata las vetas antes de que se fundan','Vetas de CRONIUM','Salida del cinturón','cronium-veins',.16,.58,.60],
    ['Salida del cinturón',32,36,'Sal del cinturón hacia la órbita de Vulkar','Salida del cinturón','Cinturón de escoria','belt-exit',.14,.54,.56]
  ].map(stage => immutable(stage))),
  events: immutable([]),
  service: null,
  encounters: immutable([
    encounter(5, [2, ROSTERS.scavengers, 8]),
    encounter(7, [2, ROSTERS.scavengers, 8]),
    encounter(9, [2, ROSTERS.scavengers, 7], {comets: true}),
    encounter(8, [3, ROSTERS.scavengers, 7], {repairAt: 16}),
    encounter(9, [3, ROSTERS.lava, 6]),
    encounter(8, [3, ROSTERS.lava, 6], {repairAt: 16}),
    encounter(10, [3, ROSTERS.lava, 6])
  ]),
  phase(stageIndex) {
    return stageIndex < 2 ? 'slag-belt' : 'vulkar-approach';
  },
  scenery({p, stageIndex, stage, arrived}) {
    // Vulkar (atlas volcánico del propietario) crece al frente durante el viaje.
    const approach = smooth(p, 0, 1);
    return {
      station: immutable({x: .5, y: 1.4, scale: .01, rotation: 0, visible: false, alpha: 0, state: 'ruptured'}),
      planet: immutable({x: .66 - .12 * approach, y: .10 + .04 * approach,
        scale: .30 + .24 * approach, rotation: .03 * p, visible: true, alpha: 1}),
      beacon: immutable({x: .5, y: 1.2, scale: 0, visible: false, alpha: 0, active: false}),
      relay: immutable({visible: false, x: 0, y: 0, scale: 0, alpha: 0, active: false, state: 'approach'}),
      attacker: immutable({x: 1.2, y: 0, scale: 0, rotation: 0, visible: false, state: 'retreat'}),
      deepSpace: immutable({travel: p, offsetX: -.08 * p, offsetY: 1.8 * p, speed: .50 + .25 * smooth(p, .1, .5),
        alpha: 1, nebulaOpacity: stage.nebulaOpacity, starDensity: stage.starDensity, dustDensity: .26}),
      debris: immutable({visible: !arrived, travel: p, directionX: -.20, directionY: .98,
        depth: .35, density: stageIndex === 2 ? .80 : .50})
    };
  }
});
