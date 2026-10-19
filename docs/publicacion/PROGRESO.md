# Progreso de la preparación para la App Store

Rama: `claude/preparar-publicacion-rtfl9q` (sale de `continuity-assets-audit-20261013`).
Tras cada commit se ejecuta `npm run build`, `npm test` y `npm run test:static`.

## Fase 0 · Preparación
- [x] `CLAUDE.md` en la raíz.
- [x] Estado inicial en `docs/publicacion/ESTADO_INICIAL.md`.

## Fase 1 · Colisiones
- [x] a) Recuadro de la nave calculado desde `SHIP_COLLISION_OUTLINE`.
- [x] b) Propuesta sobre radios de colisión (`docs/propuestas/COLISIONES.md`).
- [x] c) `collisionCircles` reutiliza círculos.

## Fase 2 · Robustez técnica
- [x] a) `resizeCanvas()` sin reasignaciones innecesarias.
- [x] b) `sw.js` tolera fallos sueltos y sube versión de caché.
- [x] c) CSP en modo Report-Only en `_headers`.
- [x] d) Propuesta sobre `@capacitor/android`.

## Fase 3 · Orden del repositorio
- [x] a) Análisis de referencias y carpetas de motor.
- [x] b) Informes sueltos movidos a `docs/`.
- [x] d) `.gitignore` con restos de exportación.
- [x] e) README con mapa de carpetas.

## Fase 4 · Publicación
- [x] a) `docs/publicacion/CHECKLIST.md`.
- [x] b) Borradores de privacidad y términos.
- [x] c) Revisión del README público.

## Fase 5 · Propuestas
- [x] art-source a LFS · evidencias · historial · repo privado · nombre y bundle ID · motores · dividir 03-ui.

## Cierre
- [x] Ejecución final e `INFORME_FINAL.md`.
- [ ] Push y Pull Request (bloqueado por 403 en git push).

## Incidencias
- Fase 1a: la primera versión calculaba el recuadro al cargar el módulo y
  rompía 35 pruebas de `npm run test:content` (cargan el módulo sin la
  silueta). Se corrigió antes de publicar el commit: cálculo en el primer uso.
- Fase 1c: siete scripts de smoke de navegador (`scripts/*-smoke.cjs`) guardaban
  el resultado de `collisionCircles`; ahora lo copian. Esos smokes no se han
  ejecutado aquí (necesitan el paquete de preview de la rama autorizada).
- Fase 2b: subir la caché obliga a actualizar el nombre esperado en
  `tests/run-static-tests.mjs`, `tests/run-tests.mjs`,
  `tests/run-v7-web-tests.mjs` y `tests/product-brand.test.mjs`.
- `git push` devuelve 403 (la app de GitHub de Claude no tiene permiso de
  escritura por git en este repositorio). Los commits están en local.
- `npm run build:preview` y 6 pruebas de `npm run test:preview` fallan desde el
  principio porque la preview solo se genera en la rama autorizada. No se toca.
