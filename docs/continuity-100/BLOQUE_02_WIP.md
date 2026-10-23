# Bloque 02 — conservación urgente WIP

13/10/2026. Rama `continuity-assets-audit-20261013`. Base de publicación: `bf33e2bedd8d8a8312d1692d9f849666f3919999`. El usuario ordenó conservar y subir el trabajo antes de agotar la sesión, incluso sin cerrar Chromium. No es un cierre de certificación.

## A. Diagnóstico y recuperación

El árbol previo coincidía byte por byte con los 246 archivos del paquete `neon-catcher-continuidad-20261013.tar.gz`, SHA-256 `d934e9d5d9e424c015966e5afdbd5c3b0e1e7950f62ddebf07aa1bfab4768b00`. Se guardaron respaldo y parche sin borrar ni descartar archivos. El remoto había añadido dos commits de KOO con `CODEX_STATUS.md` y `CODEX_NEXT_ORDERS.md`; se incorporaron mediante avance rápido y se preservaron sus documentos.

## B. Implementación conservada

La base procedural optativa descrita en `TRASPASO_2026-10-13.md` está ahora preparada para commit: planes deterministas, director ejecutable, patrones, suministro, progreso aislado, bundle y copias web/iOS. Esta intervención añade límite inferior del delta RAF, indicador de oleadas independiente del aviso de restos, etiquetas RUTA y tres pruebas más (23 en total de contenido).

Fuentes nuevas: `src/game/progression/level-designs.js`, `encounter-director.js`, `legacy-content-entry.js`. Generador ampliado: `src/game/progression/generator.js`. Integración: módulos legacy 00, 01, 02, 03, 05, 07 y 08; `index.html`, `sw.js`, `package.json`, `scripts/build-web.mjs`. Bundles regenerados, no editados manualmente.

Nuevos scripts: `build-content.mjs`, `content-browser-smoke.cjs`, `certify-local.mjs`. Nuevas pruebas: `procedural-runtime.test.mjs`, `content-legacy-integration.test.mjs`; se actualizaron verificaciones de empaquetado en `run-static-tests.mjs` y `run-tests.mjs`.

## C. Assets

No se generaron assets nuevos durante la recuperación. Los 58 activos anteriores y dos archivos conservados permanecen intactos. Los iconos/splash del Bloque 01 ya estaban publicados. La captura histórica parcial de Chromium se conserva; no es evidencia de una ejecución aprobada.

## D. Pruebas

`certification/run-01/results.json` registra comandos, Exit Codes, duración, rama, HEAD inicial y hashes de bundles. Build, motor 40/40, arquitectura 6/6, contenido/integración/assets 23/23, static 13/13, general 33/33, web 13/13, experimentales 14/14 e inventario sin inconsistencias: todos Exit Code 0.

La nueva regresión de RAF falló antes del arreglo con Exit Code 1, conservado en `certification/raf-before-fix.txt`. Simula `last=1000`, callback RAF con `now=999.8`, y después uno con `now=1016.7`: exige que el director no retroceda ni arroje error y que continúe con exactamente un RAF. Pasa después de compilar el arreglo.

Las pruebas de 100 rutas usan JSDOM y Canvas simulado. Los 3.200 casos prueban geometría y serialización; no equivalen a partidas físicas ni a equilibrio final. Los conteos de suites no son sumables.

## E. Resultados de los agentes

### Revisión procedural — completada, solo lectura

- Defecto P1 confirmado: `frame()` permitía delta negativo después de `resumeGame()`; el director rechaza ese delta, lanza RangeError y corta la programación RAF. Reproducción del cuerpo real: `last=100.25`, `now=100`, salida `{error: 'Finite nonnegative delta required', rafRescheduled: 0, directorTime: 0}`. Root añadió reproducción integrada, conservó el fallo y aplicó `Math.max(0, Math.min(...))`.
- El indicador de oleada se escribía en un aviso que `updateGateSystem()` ocultaba cada fotograma por `gate:0`. Corregido con `#encounterProgress`, chip independiente, y prueba de reinicio.
- Las primeras pruebas invocaban `update()` directamente y no drenaban los callbacks RAF. Corregida la cobertura mediante la regresión que ejecuta callbacks reales.
- `difficulty.spawnInterval` es un dato decreciente, pero los eventos siguen utilizando separación de 0,32 s y oleadas de 8,5 s. Pendiente de diseño/versionado; no se modificó la secuencia v2 durante la conservación.
- No se encontraron escrituras en guardados originales. Jefes continúan siendo datos. Corredor fijo y recogidas cercanas al centro permiten quedarse quieto; equilibrio pendiente.

### Auditoría visual — completada, solo lectura

- Los recursos PNG/WebP de ejecución decodifican; 58 activos, 1.209.090 bytes. No se modificaron.
- `art-source/comet_animation_master_v1.png` falla al decodificar; su WebP runtime funciona. `art-source/cronium_fragment_master_v2.png` referenciado no existe. Los masters nativos RGB 1254×1254 decodifican.
- Aparición/disparo propios de enemigos están pendientes. El render actual reutiliza meteoritos; el mapa de animación no sustituye un reproductor con estados/eventos.
- Próximo recurso propuesto, NO generado: CH-01 Scout, atlas RGBA 768×768 con 16 celdas 192×192; poses diferentes para aparición, reposo, desplazamiento, disparo, impacto y destrucción. Ruta sugerida `assets/ch01_scout_states_v1.webp`, fuente/procedencia en `art-source/enemies/ch01/`.
- Próximo módulo propuesto, NO implementado: `src/game/animation/state-animator.js`, sin RAF propio, eventos únicos, destrucción terminal, prioridad de impacto y avance exclusivamente mediante dt legacy. La animación no decidirá el momento del disparo determinista.
- Riesgo de física: `collisionCircles()` depende de `spriteKey` (meteorLarge ×1,22; Medium ×1,12; otros ×1,04). Añadir identidad visual separada o probar equivalencia antes de cambiar claves.
- Integración prevista: imagen compartida cargada solo en N-7; pose de daño en ataques manual/phaser; retirar enemigos muertos inmediatamente y conservar destrucción visual acotada; pool existente ≤320.
- Un atlas nuevo exigiría actualizar explícitamente manifiesto, bytes, SW, mapa y conteo de inventario 58→59, conservando hashes de los activos anteriores. El auditor actual espera rutas planas en `assets/`.
- Tests previstos: transiciones, pausa, evento único, daño, muerte, ausencia de amenazas fantasma, colisión equivalente, decodificación/alfa, poses distintas, carga única y capturas. Nada de ello se declara realizado en Bloque 03.

### Investigación Chromium — interrumpida, no certificada

El agente leyó `scripts/content-browser-smoke.cjs` e intentó una ejecución con salida a `browser/resume-investigation.log`. La llamada se interrumpió tras 515 s sin devolver sesión, código de salida ni resultados verificables. El agente declara que no modificó archivos y no obtuvo diagnóstico nuevo ni certificación. No se debe interpretar ese tiempo como una prueba ejecutada o aprobada. Al ordenar conservación, el agente detuvo toda actividad.

La evidencia confirmada de delta negativo pertenece a la reproducción local de root y a la revisión procedural. Falta verificar la relación exacta con el fallo de Chromium y completar tres perfiles. El script ya conserva errores JS/HTTP y espera una condición observable; no existe un `browser/results.json` aprobado.

## F. GitHub y restricciones

Commit deliberadamente WIP, sin promesa de certificación. `USE_ENGINE_V1 = false`, guardia Netlify conservada, main y PR #3 intactas. Última consulta PR #3: abierta, Draft, no fusionada; head `ca5f974f508b18b50d2faeafcdc5a5a00c1331fb`, main `00a44b4b4cd5d50b5cfac2aa5e760dd92d71e862`. No despliegue público.

## G. Continuación

Seguir los comandos y criterios de `docs/CODEX_STATUS.md`. Primero cerrar Chromium con resultados verificables, sin tocar otras funciones. Repetir suites afectadas si cambia código. Después actualizar la documentación y continuar con producción visual; no iniciar jefes/narrativa/audio sacrificando este cierre. Safari/iPhone físico, WKWebView, FPS, memoria y GC siguen pendientes.
