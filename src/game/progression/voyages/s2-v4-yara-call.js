/**
 * Ficha del viaje S2-V4 · Responde a la llamada de Yara (Cinturón de escoria → Órbita alta de Vulkar).
 * Ver docs/design/CAMPANA_50_VIAJES.md, sector 2 (Gaia → Vulkar).
 *
 * Yara Kest pide ayuda: cargueros de obreros atrapados entre las minas de
 * la refinería y nubes de ceniza que ocultan el camino.
 */
import {smooth} from '../voyage-engine.js';
import {VULKAR_HAZARD_PROFILES} from '../voyage-hazards.js';

const immutable = object => Object.freeze(object);
const ROSTERS = immutable({
  mines: immutable(['scout', 'raider', 'scout']), forge: immutable(['interceptor', 'scout', 'interceptor', 'raider'])
});
const encounter = (profile, patrol, {comets = false, repairAt = null} = {}) => immutable({
  patrol: patrol && immutable({cap: patrol[0], roster: patrol[1], gap: patrol[2]}),
  hazards: VULKAR_HAZARD_PROFILES[profile], comets, repairAt
});

export const S2_V4_YARA_CALL = immutable({
  id: 'S2-V4', sector: 2, number: 4, title: 'Responde a la llamada de Yara', planet: 'volcanico',
  chapter: 9, version: 's2-v4-voyage-v1', saveKey: 'neonCronium.voyage.S2-V4.v1',
  routeId: 'yara-call', eventPrefix: 's2-v4', baseGoal: 36,
  origin: 'Cinturón de escoria', destination: 'Órbita alta de Vulkar',
  arrivalDestinationId: 'vulkar-high-orbit', cinematicDuration: 0, recoveryAt: 0,
  invalidCheckpointMessage: 'Invalid S2-V4 voyage checkpoint',
  stages: immutable([
    ['Llamada de Yara',30,4,'Yara Kest pide ayuda desde la refinería','Cinturón de escoria','Nubes de ceniza','yara-call',.14,.48,.36],
    ['Nubes de ceniza',32,10,'Avanza entre la ceniza sin perder la señal','Nubes de ceniza','Campo de minas','ash-clouds',.20,.36,.46],
    ['Campo de minas',32,15,'Abre paso entre las minas de la refinería','Campo de minas','Cargueros atrapados','minefield',.16,.44,.58],
    ['Cargueros atrapados',34,21,'Protege a los cargueros de obreros','Cargueros atrapados','Batería de forja','trapped-freighters',.16,.50,.62],
    ['Batería de forja',34,27,'Silencia la batería de forja de tres torretas','Batería de forja','Rampa de salida','forge-battery',.18,.54,.72],
    ['Rampa de salida',30,32,'Escolta a los cargueros fuera de la ceniza','Rampa de salida','Órbita alta','exit-ramp',.14,.50,.58],
    ['Órbita alta',32,36,'Llega a la órbita alta: Yara te debe una','Órbita alta','Órbita alta de Vulkar','high-orbit',.12,.54,.54]
  ].map(stage => immutable(stage))),
  events: immutable([]),
  service: null,
  encounters: immutable([
    encounter(4, [2, ROSTERS.mines, 8]),
    encounter(5, [2, ROSTERS.mines, 8]),
    encounter(8, [3, ROSTERS.mines, 7], {repairAt: 16}),
    encounter(7, [3, ROSTERS.forge, 7]),
    encounter(9, [3, ROSTERS.forge, 6], {repairAt: 18}),
    encounter(9, [2, ROSTERS.forge, 7], {comets: true}),
    encounter(10, [3, ROSTERS.forge, 6])
  ]),
  phase(stageIndex) {
    return stageIndex < 2 ? 'ash-clouds' : 'vulkar-orbit';
  },
  scenery({p, stageIndex, stage, arrived}) {
    // Vulkar (atlas volcánico del propietario) crece al frente durante el viaje.
    const approach = smooth(p, 0, 1);
    return {
      station: immutable({x: .5, y: 1.4, scale: .01, rotation: 0, visible: false, alpha: 0, state: 'ruptured'}),
      planet: immutable({x: .60 - .12 * approach, y: .10 + .04 * approach,
        scale: .48 + .24 * approach, rotation: .03 * p, visible: true, alpha: 1}),
      beacon: immutable({x: .5, y: 1.2, scale: 0, visible: false, alpha: 0, active: false}),
      relay: immutable({visible: false, x: 0, y: 0, scale: 0, alpha: 0, active: false, state: 'approach'}),
      attacker: immutable({x: 1.2, y: 0, scale: 0, rotation: 0, visible: false, state: 'retreat'}),
      deepSpace: immutable({travel: p, offsetX: -.08 * p, offsetY: 1.8 * p, speed: .50 + .25 * smooth(p, .1, .5),
        alpha: 1, nebulaOpacity: stage.nebulaOpacity, starDensity: stage.starDensity, dustDensity: .26}),
      debris: immutable({visible: !arrived, travel: p, directionX: -.20, directionY: .98,
        depth: .35, density: stageIndex === 2 ? .60 : .30})
    };
  }
});
