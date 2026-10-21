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
- [x] Push y Pull Request #5 (el 403 se resolvió al reconectar GitHub).

## Mejoras jugables del capítulo 1 (tras la prueba del propietario)
- [x] Botón INICIAR siempre visible en la ficha del tramo.
- [x] Mínimo de casco 50 al reanudar/reintentar y texto "REINTENTAR TRAMO".
- [x] Disparos básicos enemigos en rojo (antes cian como los del jugador).
- [x] Campo de meteoritos, restos y satélites en los diez tramos (`voyage-hazards.js`).
- [x] Lluvia de cometas dispersa v4 (7-9 cometas por oleada, varios bordes).
- [x] Enemigos v5: ráfagas dobles, abanicos, esperas irregulares; más patrullas.
- [x] Atlas v8: Ruptura Crono, ataques encadenados, núcleo menos expuesto.
- [x] Nuevo inicio de Chronos con el arte del propietario: estación por piezas,
  Cronos Prime fase 1 la destruye a los 9 s, restos, destello y láminas de la
  ruptura (`src/game/animation/chronos-intro.js`). Sin las piezas, inicio anterior.
- [x] Inicio de Chronos rehecho tras la prueba del propietario ("no tiene
  sentido"): Cronos Prime llega desde fuera, se coloca sobre la estación,
  carga, dispara y se marcha. Sin láminas mezcladas, sin tartamudeo y sin la
  nave atacante antigua. Las láminas quedan en `assets/` sin usar.
- [ ] Prueba del propietario en iPhone de todo lo anterior (valores reversibles).
- [ ] Partida natural completa automática sobre esta rama (el piloto solo genera
  preview desde la rama autorizada).

## Limpieza de la rama (20/10/2026)
- [x] Fuera 3.307 capturas antiguas de QA, el zip 6.8, 9 assets sin uso y
  25 reexportaciones: de 955 MB a 221 MB. Ver `LIMPIEZA_2026-10-20.md`.
- [x] Modos ocultos n7 y journey retirados; web y app sin demo del motor ni
  mapas (12,9 MB); capturas de pruebas fuera de git.

## Campaña de 50 viajes · Fase A: motor por fichas (20/10/2026)

- [x] Motor genérico `progression/voyage-engine.js`: cada viaje es una ficha.
- [x] El viaje 1 es la ficha `voyages/s1-v1-chronos-gaia.js` y se juega igual:
      prueba paso a paso contra una copia congelada del motor original.
- [x] Patrullas, peligros, cometas y reparación de cada tramo salen de la ficha
      (`getVoyageStageRules`), con prueba de que son las mismas reglas de antes.
- [x] Propuesta de historia: `docs/design/CAMPANA_50_VIAJES.md` (pendiente de
      decisiones del propietario).
- [ ] Fase B: sector 1 en 5 viajes (S1-V1…S1-V5).

## Noche 21/10/2026 (plan en `PLAN_NOCHE_2026-10-21.md`)

- [x] Planetas animados del propietario en los sectores 4–9.
- [x] `scripts/capture-levels.cjs` para capturar cualquier nivel.
- [x] Mapa del sector 1 en RUTA con bases y conversaciones (Mira, Iria).
- [x] S1-V2 «Cruza la red exterior de Gaia» jugable desde el mapa tras S1-V1.
- [x] S1-V3 «Escolta a los evacuados» y S1-V4 «Sigue la señal falsa» jugables.
- [x] S1-V5 «Convence a Atlas» jugable con Atlas al final (de momento Atlas sigue también al final de S1-V1).

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
