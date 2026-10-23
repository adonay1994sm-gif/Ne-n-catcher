/**
 * Ficha del viaje S1-V2 · Cruza la red exterior de Gaia (baliza exterior →
 * anillo de satélites). Ver docs/design/CAMPANA_50_VIAJES.md, sector 1.
 *
 * La red de Gaia cree que atacaste Chronos (firma copiada): barridos de
 * identificación y satélites. N-7 busca un hueco; Iria aún no responde.
 * Sin parada C9: el taller sigue en el panel. Gaia crece al frente.
 */
import {smooth} from '../voyage-engine.js';
import {VOYAGE_HAZARD_PROFILES} from '../voyage-hazards.js';

const immutable = object => Object.freeze(object);
const ROSTERS = immutable({
  watch: immutable(['scout']), net: immutable(['scout', 'raider', 'scout']),
  quarantine: immutable(['interceptor', 'scout', 'raider', 'scout'])
});
// Mismo formato que S1-V1: patrulla [tope, mezcla, segundos], peligros del
// perfil indicado (los del viaje 1, por ahora), cometas y reparación.
const encounter = (profile, patrol, {comets = false, repairAt = null} = {}) => immutable({
  patrol: patrol && immutable({cap: patrol[0], roster: patrol[1], gap: patrol[2]}),
  hazards: VOYAGE_HAZARD_PROFILES[profile], comets, repairAt
});

export const S1_V2_GAIA_OUTER_NET = immutable({
  id: 'S1-V2', sector: 1, number: 2, title: 'Cruza la red exterior de Gaia',
  chapter: 2, version: 's1-v2-voyage-v1', saveKey: 'neonCronium.voyage.S1-V2.v1',
  routeId: 'gaia-outer-net', eventPrefix: 's1-v2', baseGoal: 36,
  origin: 'Baliza exterior de Gaia', destination: 'Anillo de satélites',
  arrivalDestinationId: 'gaia-satellite-ring', cinematicDuration: 0, recoveryAt: 0,
  invalidCheckpointMessage: 'Invalid S1-V2 voyage checkpoint',
  stages: immutable([
    ['Baliza en silencio',30,4,'Deja atrás la baliza; la red aún no te ha visto','Baliza exterior de Gaia','Red exterior','net-edge',.10,.50,.30],
    ['Primer barrido',32,10,'Esquiva los barridos de identificación','Red exterior','Malla de sensores','identity-sweep',.12,.56,.40],
    ['Malla de sensores',32,16,'Cruza la malla sin atraer a los satélites','Malla de sensores','Hueco de N-7','sensor-mesh',.14,.60,.48],
    ['El hueco de N-7',30,21,'Sigue el hueco que encuentra N-7 entre dos satélites','Hueco de N-7','Cuarentena','net-gap',.08,.44,.36],
    ['Cuarentena',34,27,'Resiste el escudo de cuarentena de la red','Cuarentena','Sombra de Gaia','quarantine',.16,.62,.62],
    ['Sombra de Gaia',32,32,'Avanza bajo la sombra del planeta','Sombra de Gaia','Anillo de satélites','gaia-shadow',.12,.52,.54],
    ['Anillo de satélites',34,36,'Alcanza el anillo; Iria sigue sin responder','Anillo de satélites','Anillo de satélites','ring-arrival',.18,.64,.70]
  ].map(stage => immutable(stage))),
  events: immutable([
    {id:'s1-v2-gaia-beacon',type:'gaia-beacon',at:3,destinationId:'gaia-satellite-ring'}
  ].map(event => immutable(event))),
  service: null,
  encounters: immutable([
    encounter(3, [1, ROSTERS.watch, 9]),
    encounter(4, [2, ROSTERS.watch, 8]),
    encounter(7, [2, ROSTERS.net, 8], {repairAt: 16}),
    encounter(5, null, {comets: true}),
    encounter(8, [3, ROSTERS.quarantine, 7]),
    encounter(9, [2, ROSTERS.net, 7], {repairAt: 16}),
    encounter(10, [3, ROSTERS.quarantine, 6])
  ]),
  phase(stageIndex) {
    return stageIndex < 3 ? 'gaia-net' : stageIndex < 5 ? 'quarantine' : 'gaia-approach';
  },
  scenery({p, stageIndex, stage, arrived}) {
    const approach = smooth(p, 0, 1), leave = smooth(p, 0, .18);
    return {
      // La estación de Chronos ya no está: este viaje empieza lejos de ella.
      station: immutable({x: .5, y: 1.4, scale: .01, rotation: 0, visible: false, alpha: 0, state: 'ruptured'}),
      // Gaia ya ocupa el cielo y sigue creciendo hasta el anillo.
      planet: immutable({x: .70 - .12 * approach, y: .09 + .05 * approach,
        scale: .30 + .42 * approach, rotation: .04 * p, visible: true, alpha: 1}),
      // Atlas espera al final del sector (S1-V5): aquí no se dibuja su baliza.
      beacon: immutable({x: .46 - .30 * leave, y: .30 + .80 * leave, scale: .22 * (1 - .7 * leave),
        visible: false, alpha: 0, active: false}),
      relay: immutable({visible: false, x: 0, y: 0, scale: 0, alpha: 0, active: false, state: 'approach'}),
      attacker: immutable({x: 1.2, y: 0, scale: 0, rotation: 0, visible: false, state: 'retreat'}),
      deepSpace: immutable({travel: p, offsetX: -.10 * p, offsetY: 1.6 * p, speed: .45 + .25 * smooth(p, .1, .4),
        alpha: 1, nebulaOpacity: stage.nebulaOpacity, starDensity: stage.starDensity, dustDensity: .18}),
      debris: immutable({visible: !arrived && stageIndex >= 1, travel: p, directionX: -.18, directionY: .98,
        depth: .3, density: stageIndex === 3 ? .12 : .30})
    };
  }
});
