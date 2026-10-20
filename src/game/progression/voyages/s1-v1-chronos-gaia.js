/**
 * Ficha del viaje S1-V1 · Escapa de Chronos (Chronos → baliza de Gaia).
 * Es el viaje original: el motor (voyage-engine.js) lo reproduce exacto.
 * Identificadores, claves de guardado y textos se conservan tal cual.
 */
import {smooth} from '../voyage-engine.js';

const immutable = object => Object.freeze(object);

export const S1_V1_CHRONOS_GAIA = immutable({
  id: 'S1-V1', sector: 1, number: 1, title: 'Escapa de Chronos',
  chapter: 1, version: 'chronos-voyage-v2', saveKey: 'neonCatcher.chronosVoyage.v2',
  routeId: 'chronos-to-gaia', eventPrefix: 'chronos-voyage', baseGoal: 36,
  origin: 'Centro Chronos', destination: 'Baliza de acceso a Gaia Nova',
  arrivalDestinationId: 'gaia-atlas-approach', cinematicDuration: 90, recoveryAt: 9,
  invalidCheckpointMessage: 'Invalid Chronos voyage checkpoint',
  stages: immutable([
    ['Emergencia en Chronos',36,4,'Recupera los primeros fragmentos del reactor','Chronos · reactor','Perímetro destruido','reactor-strike',.18,.70,.36],
    ['Perímetro destruido',36,8,'Cruza los restos y recupera el rastro de CRONIUM','Perímetro destruido','Campo de restos','wreckage-crossing',.15,.80,.48],
    ['Campo de restos',36,12,'Sigue el rastro y rescata el emisor si lo encuentras','Campo de restos','Salida orbital','recoverable-module',.12,.72,.56],
    ['Salida orbital',36,16,'Abandona la órbita de Chronos sin perder la señal','Salida orbital','Corredor exterior','origin-retreat',.08,.52,.42],
    ['El gran vacío',38,18,'Atraviesa el vacío; observa el cometa anunciado','Corredor exterior','Corredor de enlace','comet-crossing',.025,.26,.22],
    ['Enlace C9',32,18,'Configura la nave desde C9 en el HUD mientras sigues el corredor','Corredor de enlace','Ruta exterior de Gaia','service-stop',.035,.34,.12],
    ['Estela de regreso',38,24,'Prueba tu nave y recupera la señal en espacio abierto','Ruta exterior de Gaia','Ruta de Gaia','equipment-trial',.025,.28,.44],
    ['Gaia en la distancia',36,28,'Mantén la ruta hacia el planeta que crece al frente','Ruta de Gaia','Baliza exterior de Gaia','destination-reveal',.06,.40,.52],
    ['Señales de Atlas',36,32,'Cruza la patrulla y localiza el acceso orbital','Baliza exterior de Gaia','Acceso orbital de Gaia','atlas-identification',.12,.52,.72],
    ['Llegada a Gaia',36,36,'Completa el rastro y alcanza la baliza de llegada','Acceso orbital de Gaia','Baliza de acceso a Gaia Nova','persistent-arrival',.18,.62,.82]
  ].map(stage => immutable(stage))),
  events: immutable([
    {id:'chronos-voyage-intruder',type:'attack',at:2.25,attackerId:'cronium-raider',targetId:'chronos-reactor'},
    {id:'chronos-voyage-breach',type:'rupture',at:9,resourceId:'cronium',cause:'hostile-reactor-strike'},
    {id:'chronos-voyage-perimeter-exit',type:'departure',at:108,originId:'chronos-scientific-centre'},
    {id:'chronos-voyage-recovered-module',type:'twin-module-marker',at:90,moduleId:'twin-emitter',resourceId:'cronium'},
    {id:'chronos-voyage-gaia-beacon',type:'gaia-beacon',at:292,destinationId:'gaia-atlas-approach'}
  ].map(event => immutable(event))),
  // C9 atraca poco después de entrar en el tramo 6 (aproximación visible) y
  // el resto del tramo es la salida tras el servicio.
  service: immutable({stage: 6, approach: 1.2, visibleApproach: 2.4, departure: 2.4,
    renamedStage: 'Corredor de Gaia', renamedObjective: 'Prueba tu nave en el corredor; C9 continúa disponible en el panel'}),
  phase(stageIndex, elapsed) {
    return stageIndex === 0 ? (elapsed < 9 ? 'emergency' : 'recovery') :
      stageIndex < 3 ? 'recovery' : stageIndex === 3 ? 'departure' : stageIndex < 7 ? 'deep-space' : 'gaia-approach';
  },
  scenery({elapsed, p, stageIndex, stage, arrived, relay}) {
    const departure = smooth(p, .025, .43), approach = smooth(p, .70, 1);
    const attackApproach = smooth(elapsed, 1.35, 4.95), attackExit = smooth(elapsed, 10.8, 21.6);
    const reactorState = elapsed < 6.3 ? 'stable' : elapsed < 9 ? 'struck' : 'ruptured';
    const attackerState = elapsed < 4.95 ? 'approach' : elapsed < 6.3 ? 'charge' : elapsed < 9 ? 'fire' : 'retreat';
    return {
      station: immutable({x: .48 - .72 * departure, y: .43 + .94 * departure,
        scale: 1.12 * Math.pow(.032, departure), rotation: -.10 * departure,
        visible: p < .44, alpha: 1, state: reactorState}),
      planet: immutable({x: .79 - .15 * approach, y: .06 + .03 * approach,
        scale: .014 + .71 * approach * approach, rotation: .06 * p, visible: true, alpha: 1}),
      beacon: immutable({x: .54 + .08 * (1 - approach), y: .16 + .10 * approach,
        scale: .012 + .216 * approach, visible: p >= .80, alpha: 1, active: p >= 292 / 360}),
      relay: immutable({visible: relay.visible, x: .77 - .09 * relay.arrival - .48 * relay.exit,
        y: .08 + .16 * relay.arrival + .84 * relay.exit,
        scale: (.025 + .15 * relay.arrival) * (1 - .85 * relay.exit), alpha: 1, active: relay.active, state: relay.state}),
      attacker: immutable({x: 1.12 - .48 * attackApproach - .95 * attackExit,
        y: .13 + .11 * attackApproach - .15 * attackExit,
        scale: .10 + .07 * attackApproach - .05 * attackExit,
        rotation: -.18 - .65 * attackExit, visible: elapsed >= 1.35 && elapsed < 21.6, state: attackerState}),
      deepSpace: immutable({travel: p, offsetX: -.16 * p, offsetY: 2.4 * p,
        speed: .20 + .80 * smooth(p, .25, .46), alpha: 1, nebulaOpacity: stage.nebulaOpacity,
        starDensity: stage.starDensity, dustDensity: stageIndex >= 4 && stageIndex <= 6 ? .10 : .32}),
      debris: immutable({visible: elapsed >= 9 && !arrived, travel: p, directionX: -.28, directionY: .96,
        depth: smooth(p, .025, .35), density: stageIndex >= 4 && stageIndex <= 6 ? .22 : .70})
    };
  }
});
