/**
 * Ficha del viaje S1-V4 · Sigue la señal falsa (órbita alta → lado nocturno
 * de Gaia). Ver docs/design/CAMPANA_50_VIAJES.md, sector 1.
 *
 * Alguien emite tu firma copiada para culparte: una escolta del C-17. En el
 * lado nocturno apenas se ven luces y disparos (cielo oscuro, pocas estrellas).
 */
import {smooth} from '../voyage-engine.js';
import {VOYAGE_HAZARD_PROFILES} from '../voyage-hazards.js';

const immutable = object => Object.freeze(object);
const ROSTERS = immutable({
  decoys: immutable(['scout', 'scout', 'raider']), escort: immutable(['interceptor', 'raider', 'scout', 'raider'])
});
const encounter = (profile, patrol, {comets = false, repairAt = null} = {}) => immutable({
  patrol: patrol && immutable({cap: patrol[0], roster: patrol[1], gap: patrol[2]}),
  hazards: VOYAGE_HAZARD_PROFILES[profile], comets, repairAt
});

export const S1_V4_FALSE_SIGNAL = immutable({
  id: 'S1-V4', sector: 1, number: 4, title: 'Sigue la señal falsa',
  chapter: 4, version: 's1-v4-voyage-v1', saveKey: 'neonCatcher.voyage.S1-V4.v1',
  routeId: 'gaia-false-signal', eventPrefix: 's1-v4', baseGoal: 36,
  origin: 'Órbita alta de Gaia', destination: 'Lado nocturno de Gaia',
  arrivalDestinationId: 'gaia-night-side', cinematicDuration: 0, recoveryAt: 0,
  invalidCheckpointMessage: 'Invalid S1-V4 voyage checkpoint',
  stages: immutable([
    ['Tu propia firma',30,4,'N-7 capta tu firma emitida desde otra nave','Órbita alta de Gaia','Terminador','false-signature',.10,.46,.36],
    ['El terminador',32,9,'Cruza la línea entre el día y la noche de Gaia','Terminador','Lado nocturno','terminator',.08,.34,.42],
    ['Señuelos',32,15,'Distingue los señuelos de la nave que emite tu firma','Lado nocturno','Rastro de la escolta','decoys',.06,.24,.54],
    ['Solo luces y disparos',34,21,'Avanza a oscuras guiándote por los disparos','Rastro de la escolta','Ciudades dormidas','darkness',.04,.16,.62],
    ['Ciudades dormidas',30,26,'Sobrevuela las luces de Gaia sin perder el rastro','Ciudades dormidas','Escolta del C-17','sleeping-cities',.06,.22,.50],
    ['Escolta del C-17',34,31,'Alcanza a la escolta: huye dañada hacia el acceso','Escolta del C-17','Acceso nocturno','escort-chase',.08,.28,.72],
    ['Acceso nocturno',32,36,'Llega al acceso nocturno; Atlas vigila al otro lado','Acceso nocturno','Lado nocturno de Gaia','night-arrival',.10,.32,.60]
  ].map(stage => immutable(stage))),
  events: immutable([]),
  service: null,
  encounters: immutable([
    encounter(3, [2, ROSTERS.decoys, 8]),
    encounter(4, [2, ROSTERS.decoys, 8]),
    encounter(7, [3, ROSTERS.decoys, 7], {repairAt: 16}),
    encounter(5, [2, ROSTERS.escort, 8], {comets: true}),
    encounter(8, [3, ROSTERS.escort, 7]),
    encounter(9, [3, ROSTERS.escort, 6], {repairAt: 18}),
    encounter(10, [3, ROSTERS.escort, 6])
  ]),
  phase(stageIndex) {
    return stageIndex < 2 ? 'gaia-approach' : 'night-side';
  },
  scenery({p, stageIndex, stage, arrived}) {
    // Gaia se queda abajo y en sombra: el viaje rodea su lado nocturno.
    const night = smooth(p, .1, .45);
    return {
      station: immutable({x: .5, y: 1.4, scale: .01, rotation: 0, visible: false, alpha: 0, state: 'ruptured'}),
      planet: immutable({x: .60 - .30 * night, y: .14 + .02 * night, scale: .82 - .12 * night,
        rotation: .02 + .05 * p, visible: true, alpha: 1 - .55 * night}),
      beacon: immutable({x: .5, y: 1.2, scale: 0, visible: false, alpha: 0, active: false}),
      relay: immutable({visible: false, x: 0, y: 0, scale: 0, alpha: 0, active: false, state: 'approach'}),
      attacker: immutable({x: 1.2, y: 0, scale: 0, rotation: 0, visible: false, state: 'retreat'}),
      deepSpace: immutable({travel: p, offsetX: -.06 * p, offsetY: 1.5 * p, speed: .48 + .20 * smooth(p, .2, .6),
        alpha: 1, nebulaOpacity: stage.nebulaOpacity, starDensity: stage.starDensity, dustDensity: .12}),
      debris: immutable({visible: !arrived && stageIndex >= 2, travel: p, directionX: -.14, directionY: .99,
        depth: .3, density: .20})
    };
  }
});
