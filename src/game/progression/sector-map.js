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
  let previousDone = true;
  const routes = map.routes.map(route => {
    const status = done.has(route.voyage) ? 'done'
      : previousDone && canPlay.has(route.voyage) ? 'open' : 'locked';
    previousDone = status === 'done';
    return freeze({...route, status});
  });
  return freeze({...map, routes: freeze(routes)});
}
