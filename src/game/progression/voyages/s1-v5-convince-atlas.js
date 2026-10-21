/**
 * Ficha del viaje S1-V5 · Convence a Atlas (lado nocturno → acceso orbital de
 * Gaia Nova). Ver docs/design/CAMPANA_50_VIAJES.md, sector 1 (opción B).
 *
 * Atlas bloquea el acceso; al vencerlo verifica el registro y Iria señala
 * Vulkar. El viaje termina con el combate de Atlas (`boss: 'atlas'`).
 */
import {smooth} from '../voyage-engine.js';
import {VOYAGE_HAZARD_PROFILES} from '../voyage-hazards.js';

const immutable = object => Object.freeze(object);
const ROSTERS = immutable({
  pickets: immutable(['scout', 'interceptor', 'scout']), defence: immutable(['interceptor', 'scout', 'interceptor', 'raider'])
});
const encounter = (profile, patrol, {comets = false, repairAt = null} = {}) => immutable({
  patrol: patrol && immutable({cap: patrol[0], roster: patrol[1], gap: patrol[2]}),
  hazards: VOYAGE_HAZARD_PROFILES[profile], comets, repairAt
});

export const S1_V5_CONVINCE_ATLAS = immutable({
  id: 'S1-V5', sector: 1, number: 5, title: 'Convence a Atlas', boss: 'atlas',
  chapter: 5, version: 's1-v5-voyage-v1', saveKey: 'neonCatcher.voyage.S1-V5.v1',
  routeId: 'gaia-atlas-gate', eventPrefix: 's1-v5', baseGoal: 36,
  origin: 'Lado nocturno de Gaia', destination: 'Acceso orbital de Gaia Nova',
  arrivalDestinationId: 'gaia-atlas-approach', cinematicDuration: 0, recoveryAt: 0,
  invalidCheckpointMessage: 'Invalid S1-V5 voyage checkpoint',
  stages: immutable([
    ['Amanecer en Gaia',30,4,'Sal del lado nocturno hacia la luz del acceso','Lado nocturno de Gaia','Cinturón de meteoritos','gaia-dawn',.10,.50,.36],
    ['Lluvia en el acceso',34,9,'Cruza la lluvia de meteoritos del acceso','Cinturón de meteoritos','Piquetes de Gaia','meteor-rain',.14,.58,.58],
    ['Piquetes de Gaia',32,14,'Atraviesa los piquetes sin responder al fuego de Gaia','Piquetes de Gaia','Haz de enlace','pickets',.12,.56,.52],
    ['Haz de enlace',32,19,'Dos satélites enlazados por un haz cierran el paso','Haz de enlace','Defensa orbital','linked-beam',.14,.60,.62],
    ['Defensa orbital',34,24,'Resiste la defensa orbital mientras Atlas se activa','Defensa orbital','Baliza de Atlas','orbital-defence',.16,.62,.66],
    ['Baliza de Atlas',30,28,'Atlas exige que detengas los motores','Baliza de Atlas','Corredor bloqueado','atlas-identification',.14,.56,.60],
    ['Corredor bloqueado',32,32,'Acércate al escudo de Atlas con el registro','Corredor bloqueado','Acceso orbital','blocked-corridor',.16,.60,.70],
    ['Acceso orbital',32,36,'Llega ante Atlas: tendrá que verificar el registro','Acceso orbital','Acceso orbital de Gaia Nova','atlas-gate',.18,.62,.78]
  ].map(stage => immutable(stage))),
  events: immutable([
    {id:'s1-v5-gaia-beacon',type:'gaia-beacon',at:160,destinationId:'gaia-atlas-approach'}
  ].map(event => immutable(event))),
  service: null,
  encounters: immutable([
    encounter(3, [2, ROSTERS.pickets, 8]),
    encounter(9, [2, ROSTERS.pickets, 8], {comets: true}),
    encounter(7, [3, ROSTERS.pickets, 7], {repairAt: 16}),
    encounter(8, [3, ROSTERS.defence, 7]),
    encounter(9, [3, ROSTERS.defence, 6], {repairAt: 18}),
    encounter(5, [2, ROSTERS.defence, 8]),
    encounter(10, [3, ROSTERS.defence, 6]),
    encounter(10, [3, ROSTERS.defence, 6], {repairAt: 14})
  ]),
  phase(stageIndex) {
    return stageIndex < 2 ? 'gaia-approach' : 'atlas-approach';
  },
  scenery({p, stageIndex, stage, arrived}) {
    const dawn = smooth(p, 0, .25), gate = smooth(p, .55, 1);
    return {
      station: immutable({x: .5, y: 1.4, scale: .01, rotation: 0, visible: false, alpha: 0, state: 'ruptured'}),
      planet: immutable({x: .34 + .20 * dawn, y: .16 - .04 * gate, scale: .72 + .20 * gate,
        rotation: .07 + .04 * p, visible: true, alpha: .45 + .55 * dawn}),
      // Atlas se ve venir: su plataforma crece al frente en la segunda mitad.
      beacon: immutable({x: .54, y: .14 + .10 * gate, scale: .03 + .20 * gate,
        visible: p >= .55, alpha: 1, active: stageIndex >= 5}),
      relay: immutable({visible: false, x: 0, y: 0, scale: 0, alpha: 0, active: false, state: 'approach'}),
      attacker: immutable({x: 1.2, y: 0, scale: 0, rotation: 0, visible: false, state: 'retreat'}),
      deepSpace: immutable({travel: p, offsetX: -.10 * p, offsetY: 1.9 * p, speed: .50 + .30 * smooth(p, .1, .5),
        alpha: 1, nebulaOpacity: stage.nebulaOpacity, starDensity: stage.starDensity, dustDensity: .22}),
      debris: immutable({visible: !arrived && stageIndex <= 2, travel: p, directionX: -.22, directionY: .97,
        depth: .35, density: stageIndex === 1 ? .70 : .30})
    };
  }
});
