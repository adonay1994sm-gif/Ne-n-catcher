/**
 * Hordas (spec 6.10, plan F3b): grupos de CH-01 en V que entran por arriba y
 * cruzan la pantalla en diagonal sin detenerse, para obligar a moverse.
 * Siempre dejan hueco: dos unidades a la misma altura (|Δy| < 60) están a
 * 160 px o más. Puro y determinista: la dirección sale de la semilla.
 */
export const HORDE_RULES = Object.freeze({speed: 260, spacingX: 90, spacingY: 70, drift: .45});

export function createHordeWave({size, width, seed = 0}) {
  if (!Number.isInteger(size) || size < 1 || !Number.isFinite(width) || width < 250) throw new RangeError('Invalid horde wave');
  const {speed, spacingX, spacingY, drift} = HORDE_RULES;
  const direction = Math.abs(Math.trunc(seed)) % 2 ? 1 : -1;
  const centerX = width * (direction > 0 ? .3 : .7);
  const vx = direction * speed * drift, vy = speed * Math.sqrt(1 - drift * drift);
  return Array.from({length: size}, (_, index) => {
    // Líder delante; cada pareja de alas, un rango más atrás y más abierta.
    const rank = Math.ceil(index / 2), side = index === 0 ? 0 : index % 2 ? -1 : 1;
    return {x: centerX + side * rank * spacingX, y: -60 - rank * spacingY, vx, vy, delay: 0};
  });
}
