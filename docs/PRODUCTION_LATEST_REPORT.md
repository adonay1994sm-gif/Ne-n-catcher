# INFORME DE PRODUCCIÓN — NEON CATCHER

Fecha: 2026-10-16 UTC
Rama: `continuity-assets-audit-20261013`
SHA inicial del lote: `7fe5a6d539ea7ead41a59bd4306f8f4bcc3f6c20`
SHA del código integrado y publicado: `9d28569fe13ecb1d7e6cd53693dc10ae580db9e4`
Bloques trabajados: cierre local del 03 y lote CH-01 del 05.
Tareas verificadas: 21/267 de la checklist; es cobertura de tareas, no porcentaje del juego.
Tareas pendientes: 217 PENDING, 2 IN_PROGRESS, 7 BLOCKED y 20 IN_REVIEW.
Pruebas aprobadas: 11/11 fases locales, 15/15 preview, 2/2 casos Chromium de ruta, 4/4 pasos offline y 4/4 pasos visuales controlados de CH-01.
Pruebas fallidas: la primera certificación dio static/regresión fallidos por expectativa de nombre de caché obsoleta; la repetición final pasó. Un primer intento de la nueva prueba de integración falló por un error de la instrumentación y se corrigió.
Assets integrados: atlas original CH-01, `assets/ch01_atlas_v1.webp`, 1024×1536, 24 fotogramas, 484 814 bytes.
Estado Netlify: paquete local ZIP listo; no se ha desplegado ni verificado URL remota.
Estado general: CH-01 jugable como tirador N-7 en revisión visual; Gaia clásica, Safari/iPhone y el resto del juego siguen pendientes.
Próxima prioridad: probar impacto/destrucción con controles naturales, integrar CH-01 en Gaia si el diseño lo requiere, y resolver la preview aislada autenticada.

## A. Diagnóstico previo

El atlas CH-01 y su animador estaban publicados, pero el juego real todavía utilizaba un meteorito grande para todos los tiradores N-7. El inventario de ejecución tenía 58 recursos. La ficha del catálogo CH-01 conservaba dimensiones del boceto antiguo (1536×384) y el SW precargaba únicamente los recursos anteriores. La preview del Bloque 03 ya había pasado Chromium 7/7 y offline 4/4 en la versión anterior; Netlify e iPhone físico continuaban sin prueba.

## B. Trabajo ejecutado e integraciones

- `src/game/progression/encounter-director.js`: cada tirador N-7 instancia el animador CH-01. El ataque solicita la animación cuando llega la ventana telegráfica y crea el proyectil **solo** al evento `fire` de 160 ms. Un impacto antes de disparar cancela el ataque y programa otra advertencia. Se preservaron plan, semilla y versión `n7-waves-v2`; no se añadió RAF.
- `src/game/01-runtime-assets.js` y `07-player-item-rendering.js`: atlas cargado de forma diferida, recorte del fotograma real según metadatos y fallback anterior durante la carga. La destrucción sigue dibujándose desde el atlas después de retirar la entidad del juego.
- `src/game/04-entities-collision-damage.js`: los disparos manuales y Phaser activan las poses de impacto y destrucción. El sistema existente otorga la puntuación una sola vez. `tests/content-legacy-integration.test.mjs` lo comprueba sobre el bundle real con Canvas simulado.
- `ASSET_MANIFEST.json`, `sw.js` y tests static/regresión: inventario 59 recursos, 1 693 904 bytes, cache revisionado y precarga offline de CH-01. `ASSET_PRODUCTION_150.json` especifica atlas real, 24 poses compartidas y ámbito de integración actual: **tiradores N-7, no Gaia clásica**. Las tres fichas siguen `IN_REVIEW` por la QA visual pendiente.
- `content-runtime.js`, `game.js` y copias `www/` e iOS se regeneraron desde fuentes. Engine V1 sigue desactivado.

## C. Archivos y assets

Código funcional y arte publicado en `9d28569`. Rutas principales: `src/game/progression/encounter-director.js`, `src/game/animation/ch01-animator.js`, `src/game/01-runtime-assets.js`, `src/game/04-entities-collision-damage.js`, `src/game/07-player-item-rendering.js`, `assets/ch01_atlas_v1.webp`, `ASSET_MANIFEST.json`, `sw.js`, `tests/procedural-runtime.test.mjs` y bundles derivados. El master y procedencia están en `art-source/enemies/ch01/` y `docs/art/CH01_PROVENANCE.md`; alfa preservada. Dimensión decodificada: ~6 MiB RGBA. El catálogo de 150 assets no se declara completado por este único atlas.

La preview experimental se reconstruyó desde `9d28569` con `dirty:false`; se archivó el contenido de `preview-dist/` como `docs/production-reports/evidence/block-03/neon-catcher-preview-9d28569.zip` (1 825 986 bytes; 95 archivos, `index.html` en raíz). SHA-256: `89786c8540c94558e0657c9644556f9db2eb5ed600be2dfa69cc164dcbcd21f2`. Procedencia y lista de entradas: `evidence/block-03/preview-package-9d28569.json`. El ZIP no es un deploy.

## D. Pruebas y evidencia

| Comando o escenario | Resultado real | Evidencia |
| --- | --- | --- |
| `node scripts/audit-asset-inventory.mjs` | exit 0, 59 recursos, 0 inconsistencias, 1 693 904 bytes | `evidence/block-05/certification-03/inventory.txt` |
| `node --test --test-isolation=none tests/ch01-animation.test.mjs tests/procedural-runtime.test.mjs` | 17/17, exit 0; luego procedural 9/9 tras nueva prueba | consola de trabajo; `certification-03/content-integration-assets.txt` |
| `node scripts/certify-local.mjs .../certification-01` | exit 1: static/regresión fallaron por nombre de caché esperado | `evidence/block-05/certification-01/results.json` |
| `node scripts/certify-local.mjs .../certification-02` | exit 0, 11/11 fases | `evidence/block-05/certification-02/results.json` |
| `node scripts/certify-local.mjs .../certification-03` | exit 0, 11/11 fases: build, engine 40, arquitectura 6, contenido 25, static 13, general 33, web 13, adicionales 14, audio 3, visual 4, inventario sin errores | `evidence/block-05/certification-03/results.json` |
| `npm run build:preview && npm run test:preview` | exit 0; preview 15/15; SHA `9d28569`, dirty false | `preview-dist/build-info.json`, paquete ZIP |
| `node scripts/content-browser-smoke.cjs --root preview-dist --output .../browser-ch01-01 --profile 390x844 --mode n7 --combat` | Chromium 154, 2/2, exit 0; ruta 37 completada y guardada, proyectiles y sprite CH-01 visible | `evidence/block-05/browser-ch01-01/results.json` y PNG |
| `node scripts/preview-offline-smoke.cjs --root preview-dist --output .../offline-ch01-01` | Chromium con SW reales, 4/4, exit 0 | `evidence/block-05/offline-ch01-01/results.json` |
| `node --test --test-isolation=none --test-name-pattern='legacy shots' tests/content-legacy-integration.test.mjs` | exit 0; hit, fotograma, destrucción y recompensa única | incluido también en contenido 25/25 de `certification-03` |
| `npm run test:content` tras reconciliar el catálogo CH-01 | 25/25, exit 0 | `evidence/block-05/content-after-catalog.txt` |
| `node scripts/update-production-progress.mjs --check` y `git diff --check` | exit 0 | consola de cierre |

Los conteos de suites se solapan; no se suman como número total de pruebas únicas. En Chromium se observó el WebP cargado a 1024×1536, sprite CH-01 real, proyectil, avance del director, un solo RAF pendiente y guardado independiente. La prueba completa terminó la ruta 37 sin excepción. También existen capturas de impacto y destrucción del Canvas real en Chromium, obtenidas mediante un escenario controlado que detiene el único RAF y avanza el tiempo manualmente. Esto certifica las poses renderizadas, pero no equivale a vencer naturalmente al enemigo con controles táctiles ni a probar Safari.

## E. Errores y correcciones

Cambiar el nombre de caché para invalidar versiones previas rompió dos aserciones ancladas al nombre anterior. Se corrigieron las expectativas en `tests/run-static-tests.mjs` y `tests/run-tests.mjs`; dos certificaciones posteriores aprobaron. La primera ejecución de la nueva prueba de integración falló por una variable de instrumentación inaccesible dentro de JSDOM (`atlasDraws`), corregida exportándola únicamente al `window` de prueba. La prueba focal y la fase de contenido completa aprobaron. No se modificó el juego para encubrir las pruebas.

## F. GitHub y Netlify

Rama autorizada: `continuity-assets-audit-20261013`. Código integrado y QA de certificación publicados en `9d28569fe13ecb1d7e6cd53693dc10ae580db9e4`; historial anterior de esta sesión `e1a7aa8`, `9c86abd`, `dbb0fa4`, `7fe5a6d`. Los cambios posteriores de test, catálogo, ledger, ZIP e informe se conservarán en un commit de documentación/QA separado. No hubo force push, cambio de `main` ni PR #3.

El entorno no tiene `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` ni herramienta Netlify conectada. Por tanto **no hay URL de deploy N-7**, ni SHA remoto Netlify comprobable. La antigua URL de PR #3 pertenece a otro contexto. El ZIP se puede entregar a un sitio de prueba aislado mediante Netlify Drop o usar la configuración de la rama; no se usó producción.

## G. Estado y próximo bloque

Checklist al redactar: 267 tareas, 21 DONE, 20 IN_REVIEW, 217 PENDING, 2 IN_PROGRESS, 7 BLOCKED. `B05-03/04/05/06/08` están verificados; `B05-07/09` quedan en revisión por combate natural, audio propio y Gaia clásica. `B03-17` incluye ZIP probado; `B03-18` (URL Netlify) bloqueado por acceso externo. `B03-12/19` requieren actualización de SW e instalación PWA real. Campaña clásica de 10 niveles y N-7 de 100 rutas siguen, pero no equivalen a 100 niveles terminados con jefes, historia y sonido.

Próximo ciclo: crear un smoke de Chromium para daño y destrucción CH-01 con evidencia visual; corregir si el atlas o tiempo de pose falla; validar la actualización de caché v1→v2; sólo después marcar las fichas gráficas listas. Después versionar una mejora procedural sin alterar `n7-waves-v2` y preparar el primer jefe. Netlify remoto requiere acceso a un sitio de prueba; Safari/iPhone físico y memoria/FPS siguen pendientes.

## H. Correcciones y regresiones

Se actualizó el contrato de caché en ambas suites al añadir el nuevo recurso. Se corrigió el alcance de la variable usada solo por JSDOM. La última batería volvió a ejecutar build, motor, arquitectura, 25 pruebas de contenido, 13 static, 33 generales, 13 web y auditoría de assets con códigos de salida cero. La fixture reproducible de ruta 37 mantiene su hash `n7-waves-v2`; ni la campaña clásica ni sus claves de guardado se alteraron.

## I. Commit y estado remoto

El commit funcional `9d28569fe13ecb1d7e6cd53693dc10ae580db9e4` se subió mediante push normal a `continuity-assets-audit-20261013`. El ZIP, la prueba ampliada y este informe se publicaron en `b6af9b8c06345066624cc7168442de2f9ca496d3`; la prueba visual controlada se publicará en un commit posterior. Consultar `git log -2 --format='%H %s'` y `git ls-remote --heads origin continuity-assets-audit-20261013` para el SHA exacto de ese cierre; un documento versionado no puede incluir su propio SHA sin crear otro commit.

## J. Netlify

No se desplegó. La comprobación de entorno encontró token y site ID ausentes, así como CLI Netlify no disponible. El paquete ZIP es autocontenido con selector en su raíz y verificación SHA-256; la URL de la PR #3 no sirve para esta rama. Para publicar una prueba habrá que usar un sitio aislado autenticado y verificar respuesta, commit y ambos enlaces.

## K. Estado de tareas

El ledger conserva 267 tareas con estados permitidos. Las tareas marcadas DONE tienen evidencia de integración y ejecución; las de impacto/destrucción visual permanecen IN_REVIEW, y la URL remota es BLOCKED. El progreso no se extrapola a los 100 niveles artísticos, diez jefes, narrativa o audio.

## L. Siguiente actuación técnica

Ampliar el escenario visual controlado a interacción táctil natural con CH-01 y completar su revisión en Gaia. Verificar SW actualización real y entregar el ZIP a un sitio experimental Netlify cuando haya acceso.

## M. Riesgos abiertos

Carga decodificada del atlas ~6 MiB; se debe medir memoria en un iPhone. `n7-waves-v2` conserva un corredor fijo y cadencia casi fija que pueden trivializar rutas. No hay prueba física Safari, instalación PWA iOS ni URL remota. El nuevo CH-01 está en N-7; los enemigos de Gaia de la campaña clásica aún no lo usan. No se activó Engine V1 y no hay segundo RAF.


## N. Addendum visual de CH-01 — 2026-10-16 UTC

El nuevo `scripts/ch01-browser-smoke.cjs` sirve `preview-dist` sin modificarlo, detiene el RAF legacy mediante su puente existente, aísla un tirador realmente generado en la ruta 37 y adelanta fotogramas de forma controlada. La ejecución `evidence/block-05/ch01-visual-browser-04/results.json` pasó **4/4, exit 0**: vuelo, ataque con proyectil, herida tras el primer disparo y destrucción tras el segundo con recompensa única. Capturas reales de Canvas: `ch01-attack.png`, `ch01-hurt.png` y `ch01-destroy.png` en ese mismo directorio; se inspeccionaron visualmente. La prueba no altera el bundle distribuido ni crea un segundo RAF.

Los intentos previos se conservan: `ch01-visual-browser-01` falló antes de iniciar por ruta de Chromium no especificada; `-02` llegó al navegador pero no desbloqueó la ruta 37; `-03` aprobó con el enemigo en un extremo de pantalla; `-04` aprobó con un encuadre centrado para inspección. El escenario coloca temporalmente al enemigo y a la nave en el centro después de generarlo; por ello es una prueba visual controlada, **no** una partida natural ni una certificación de equilibrio. Los assets CH-01 continúan `IN_REVIEW` por Gaia clásica e iPhone.
