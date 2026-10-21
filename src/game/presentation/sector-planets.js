/**
 * Planetas animados del cielo de cada sector (sustituyen a los fondos fijos).
 * Pose pura: el juego solo dibuja lo que devuelve. Cada atlas tiene 7
 * fotogramas de giro (4×2, celdas de 384 px); se funden entre sí para que el
 * giro sea lento y continuo.
 */
export const SECTOR_PLANET_FRAMES = 7;
export const SECTOR_PLANET_FRAME_SECONDS = .9;

// Índice de nivel (currentLevel) → planeta del sector.
export const SECTOR_PLANETS = Object.freeze({
  3: Object.freeze({key: 'volcanico', x: .76, y: .25, size: .52}),
  4: Object.freeze({key: 'glacial', x: .74, y: .24, size: .50}),
  5: Object.freeze({key: 'glacial', x: .26, y: .25, size: .56}),
  6: Object.freeze({key: 'violeta', x: .76, y: .24, size: .52}),
  7: Object.freeze({key: 'violeta', x: .27, y: .26, size: .54}),
  8: Object.freeze({key: 'tormentoso', x: .74, y: .25, size: .54})
});

const clamp01 = value => Math.max(0, Math.min(1, value));

/** Pose del planeta del sector, o null si el nivel no tiene. */
export function sectorPlanetPose(levelIndex, elapsed, progress = 0) {
  const planet = SECTOR_PLANETS[levelIndex];
  if (!planet || !Number.isFinite(elapsed) || elapsed < 0) return null;
  const done = clamp01(Number.isFinite(progress) ? progress : 0);
  const position = elapsed / SECTOR_PLANET_FRAME_SECONDS;
  const frame = Math.floor(position) % SECTOR_PLANET_FRAMES;
  // Al avanzar en el sector el planeta se acerca un poco: el viaje se nota.
  return Object.freeze({key: planet.key, frame, next: (frame + 1) % SECTOR_PLANET_FRAMES,
    blend: position % 1, x: planet.x + Math.sin(elapsed * .03) * .01,
    y: planet.y + done * .03, size: planet.size * (1 + done * .15)});
}
