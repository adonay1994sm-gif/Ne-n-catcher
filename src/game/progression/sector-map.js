/**
 * Mapa de sector (docs/design/MAPA_SECTOR.md). Datos y estado puros: el juego
 * solo dibuja lo que devuelve. Sin guardados propios: lo hecho se deduce del
 * progreso existente.
 */
const freeze = Object.freeze;

export const SECTOR_MAPS = freeze({
  1: freeze({id: 1, title: 'SECTOR 1 · HUIDA DE CHRONOS',
    places: freeze([
      freeze({id: 'chronos', label: 'Chronos', note: 'Estación en ruinas', kind: 'ruin', x: 0.16, y: 0.07}),
      freeze({id: 'baliza', label: 'Baliza exterior', kind: 'waypoint', x: 0.80, y: 0.24}),
      freeze({id: 'anillo', label: 'Anillo de satélites', kind: 'waypoint', x: 0.20, y: 0.41}),
      freeze({id: 'orbita', label: 'Órbita alta', kind: 'waypoint', x: 0.80, y: 0.57}),
      freeze({id: 'nocturno', label: 'Lado nocturno', kind: 'waypoint', x: 0.22, y: 0.72}),
      freeze({id: 'gaia', label: 'Gaia Nova', note: 'Base · Iria', kind: 'base', actor: 'iria', x: 0.76, y: 0.86}),
      freeze({id: 'c9', label: 'Taller C9', note: 'Base móvil · Mira', kind: 'base', actor: 'mira', x: 0.88, y: 0.40})
    ]),
    routes: freeze([
      freeze({voyage: 'S1-V1', title: 'Escapa de Chronos', from: 'chronos', to: 'baliza'}),
      freeze({voyage: 'S1-V2', title: 'Cruza la red exterior de Gaia', from: 'baliza', to: 'anillo'}),
      freeze({voyage: 'S1-V3', title: 'Escolta a los evacuados', from: 'anillo', to: 'orbita'}),
      freeze({voyage: 'S1-V4', title: 'Sigue la señal falsa', from: 'orbita', to: 'nocturno'}),
      freeze({voyage: 'S1-V5', title: 'Convence a Atlas', from: 'nocturno', to: 'gaia'})
    ])}),
  2: freeze({id: 2, title: 'SECTOR 2 · EL RASTRO DEL C-17',
    places: freeze([
      freeze({id: 'gaia', label: 'Gaia Nova', note: 'Paso libre', kind: 'planet', x: .18, y: .07}),
      freeze({id: 'borde', label: 'Borde de Gaia', kind: 'waypoint', x: .78, y: .24}),
      freeze({id: 'carga', label: 'Ruta de carga', kind: 'waypoint', x: .20, y: .41}),
      freeze({id: 'escoria', label: 'Cinturón de escoria', kind: 'waypoint', x: .80, y: .57}),
      freeze({id: 'orbita-vulkar', label: 'Órbita de Vulkar', kind: 'waypoint', x: .22, y: .72}),
      freeze({id: 'vulkar', label: 'Forjas de Vulkar', note: 'Titán de Vulkar', kind: 'planet', x: .74, y: .86}),
      freeze({id: 'c9', label: 'Taller C9', note: 'Base móvil · Mira', kind: 'base', actor: 'mira', x: .88, y: .40})
    ]),
    routes: freeze([
      freeze({voyage: 'S2-V1', title: 'Sal de Gaia con paso libre', from: 'gaia', to: 'borde'}),
      freeze({voyage: 'S2-V2', title: 'Sigue al C-17', from: 'borde', to: 'carga'}),
      freeze({voyage: 'S2-V3', title: 'Cruza el cinturón de escoria', from: 'carga', to: 'escoria'}),
      freeze({voyage: 'S2-V4', title: 'Responde a la llamada de Yara', from: 'escoria', to: 'orbita-vulkar'}),
      freeze({voyage: 'S2-V5', title: 'Detén al Titán de Vulkar', from: 'orbita-vulkar', to: 'vulkar'})
    ])})
});

/**
 * Estado de cada ruta: 'done' (hecha), 'open' (jugable ahora) o 'locked'.
 * Una ruta solo se abre si su viaje tiene ficha jugable y la anterior está hecha.
 */
export function sectorMapState(sectorId, {playable = [], completed = []} = {}) {
  const map = SECTOR_MAPS[sectorId];
  if (!map) return null;
  const canPlay = new Set(playable), done = new Set(completed);
  // Un sector se abre al terminar el último viaje del anterior.
  const previous = SECTOR_MAPS[sectorId - 1];
  let previousDone = !previous || done.has(previous.routes.at(-1).voyage);
  const routes = map.routes.map(route => {
    const status = done.has(route.voyage) ? 'done'
      : previousDone && canPlay.has(route.voyage) ? 'open' : 'locked';
    previousDone = status === 'done';
    return freeze({...route, status});
  });
  return freeze({...map, open: !previous || done.has(previous.routes.at(-1).voyage), routes: freeze(routes)});
}
