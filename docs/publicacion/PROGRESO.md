# Progreso de la preparación para la App Store

Rama: `claude/preparar-publicacion-rtfl9q` (sale de `continuity-assets-audit-20261013`).
Tras cada commit se ejecuta `npm run build`, `npm test` y `npm run test:static`.

## Fase 0 · Preparación
- [x] `CLAUDE.md` en la raíz.
- [x] Estado inicial en `docs/publicacion/ESTADO_INICIAL.md`.

## Fase 1 · Colisiones
- [ ] a) Recuadro de la nave calculado desde `SHIP_COLLISION_OUTLINE`.
- [ ] b) Propuesta sobre radios de colisión (`docs/propuestas/COLISIONES.md`).
- [ ] c) `collisionCircles` reutiliza círculos.

## Fase 2 · Robustez técnica
- [ ] a) `resizeCanvas()` sin reasignaciones innecesarias.
- [ ] b) `sw.js` tolera fallos sueltos y sube versión de caché.
- [ ] c) CSP en modo Report-Only en `_headers`.
- [ ] d) Propuesta sobre `@capacitor/android`.

## Fase 3 · Orden del repositorio
- [ ] a) Análisis de referencias y carpetas de motor.
- [ ] b) Informes sueltos movidos a `docs/`.
- [ ] d) `.gitignore` con restos de exportación.
- [ ] e) README con mapa de carpetas.

## Fase 4 · Publicación
- [ ] a) `docs/publicacion/CHECKLIST.md`.
- [ ] b) Borradores de privacidad y términos.
- [ ] c) Revisión del README público.

## Fase 5 · Propuestas
- [ ] art-source a LFS · evidencias · historial · repo privado · nombre y bundle ID · motores · dividir 03-ui.

## Cierre
- [ ] Ejecución final, `INFORME_FINAL.md` y Pull Request.

## Incidencias
- `npm run build:preview` y 6 pruebas de `npm run test:preview` fallan desde el
  principio porque la preview solo se genera en la rama autorizada. No se toca.
