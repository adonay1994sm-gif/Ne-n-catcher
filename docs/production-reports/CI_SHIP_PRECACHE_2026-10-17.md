# DIAGNÓSTICO — fallo de precarga de la nave en GitHub Actions

Fecha: 17/10/2026, UTC. Rama: `continuity-assets-audit-20261013`.

HEAD inicial local y remoto: `5bc9a16cf3d0ce907ee4623c77dda1e0204690b8`, árbol limpio. Se conservaron todos los commits posteriores al fallo; no se volvió a `d325e51`.

**Causa confirmada:** la prueba web del commit `d325e51f19df0dd1e77ab9257ddcdeee775299be` todavía exigía precargar `assets/ship_frame_00.webp`, después de retirar esa presentación de la nave. La ejecución [39064407643](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39064407643) construyó correctamente la preview, pero falló en `tests/run-v7-web-tests.mjs:64`. Los pasos posteriores quedaron omitidos. [Error original conservado](evidence/ci-ship-precache/original-failure.txt).

La corrección principal ya existía en `53a8244db58227eee8cc32463a0593eee69ce3bd`. Al iniciar esta revisión, [39065361265](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39065361265), correspondiente al HEAD inicial, ya había terminado con éxito. Esto se verificó en GitHub, además de leer los informes anteriores.

La revisión del código confirma que corregir el contrato, conservando las comprobaciones, es lo adecuado:

- `src/game/01-runtime-assets.js` fuerza el modo modular; mantiene el equipamiento guardado. Los seis frames antiguos tienen carga diferida y no reciben `src` durante el uso normal.
- `src/game/07-player-item-rendering.js` dibuja el ensamblaje modular; si no está disponible, usa el retrato actual y, finalmente, una representación de emergencia. No recurre a los seis frames antiguos. Menú, briefing y hangar usan la identidad actual.
- La declaración histórica `SPRITES.shipFallback` no tiene consumidor activo. `ANIMATION_MAP.player` conserva referencias para el motor reservado; `USE_ENGINE_V1` permanece en `false`.
- `ASSET_MANIFEST.json` marca el grupo antiguo `activeRuntime:false`, `precache:false`. Los recursos actuales están inventariados y disponibles.
- `sw.js` precarga el retrato actual y el atlas modular; sirve gráficos mediante `cacheFirst`. El worker de la portada incluye el retrato actual. `build:preview` deriva ambos workers mediante el pipeline existente.

No hay un modo activo ni una recuperación offline que justifique reintroducir la nave antigua en la precarga.

# INFORME DE PRODUCCIÓN — CORRECCIÓN DE CI

## Resultado y alcance

**Incidencia verificada como resuelta en GitHub Actions.** Refuerzo publicado en [`f69d3651e9a180c8502d17aa523a27d9abed92e7`](https://github.com/adonay1994sm-gif/Ne-n-catcher/commit/f69d3651e9a180c8502d17aa523a27d9abed92e7), un commit de un archivo, 20 líneas añadidas y una sustituida. [Nueva ejecución completa, 39065781507](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39065781507): `completed / success`, doce pasos satisfactorios, incluido el empaquetado.

Este lote cambia pruebas y documentación. No incorpora funcionalidades, recursos artísticos ni modificaciones de jugabilidad, cargador, renderizador, service worker o guardados. No se desplegó en producción ni se actualizó el sitio privado: continúa la versión 9 publicada previamente.

## Archivos y contratos

| Ruta | Trabajo realizado |
| --- | --- |
| `tests/run-v7-web-tests.mjs` | Refuerza la corrección existente: comprueba los seis frames retirados, su conservación en disco, exclusión de CORE y flags del manifiesto. Comprueba presencia, tamaño y huella declarada de los recursos actuales. Conserva las trece pruebas y todas las comprobaciones anteriores. |
| `scripts/ship-offline-browser-smoke.cjs` | Nuevo verificador de Chromium real: workers nativos, caché, bytes/huellas, páginas nuevas offline y dibujo del atlas modular durante clásico y N-7. Sin insertar entidades, cambiar guardados o parchear fuentes del juego. |
| `docs/production-reports/evidence/ci-ship-precache/` | Registros locales y remotos, intentos de harness conservados, capturas auténticas y verificación del artefacto de GitHub. |
| `docs/production-tasks.json` y documentos generados | Cierre específico del incidente de CI, independiente de la aceptación artística o física del juego. |
| `docs/CODEX_STATUS.md`, `docs/CODEX_NEXT_ORDERS.md`, `docs/PRODUCTION_LATEST_REPORT.md` | Estado vigente y enlace a este cierre; historial anterior conservado. |

Los bundles se regeneraron por `npm run build:preview`. Sus bytes siguen correspondiendo a las fuentes; no se introdujeron parches exclusivos en `game.js` o sus copias web/iOS.

## Pruebas locales de esta revisión

Registro completo: [local-01/results.json](evidence/ci-ship-precache/local-01/results.json). Node local `v24.19.0`; commit `f69d365…`, preview `dirty=false`. Las once fases terminaron con salida 0 y las fuentes rastreadas permanecieron idénticas durante toda la corrida. No se usan los resultados antiguos como certificación de esta revisión.

| Comando exacto | Casos o resultado | Salida |
| --- | --- | --- |
| `npm run build:preview` | Build completo y preview aislada | 0 |
| `npm run test:engine` | 40/40 | 0 |
| `npm run test:architecture` | 6/6 | 0 |
| `npm run test:content` | 193/193 | 0 |
| `npm run test:static` | 13/13 | 0 |
| `npm test` | 33/33 | 0 |
| `node tests/run-v7-web-tests.mjs` | 13/13, contrato actual y originales recuperables | 0 |
| `npm run test:preview` | 23/23 | 0 |
| `node scripts/audit-asset-inventory.mjs` | 82 recursos; cero faltantes, duplicados o huellas incorrectas | 0 |
| `node --test tests/visual-artpass.test.mjs` | 12/12 | 0 |
| `node --test tests/audio-lifecycle.test.mjs` | 3/3 | 0 |

No se cambió el lockfile ni se eliminaron pruebas para obtener verde. GitHub ejecutó además la instalación bloqueada con `npm ci --no-fund`, Node `22.13.0` y el workflow existente completo.

## Nave sin conexión: verificación específica

Comando final:

```sh
node scripts/ship-offline-browser-smoke.cjs --root preview-dist --output docs/production-reports/evidence/ci-ship-precache/offline-06
```

[Resultado final y observaciones](evidence/ci-ship-precache/offline-06/results.json): **4/4 grupos, salida 0**, Chromium `154.0.8037.57`, 19.152 ms. Preview limpia `f69d365…`, revisión `db6313abea48cd98c196b1211b6976b32e56094ae1aa9f9147fbe2034c7626f2`; paquete sin cambios durante la prueba.

1. Instalación real de los workers de portada y juego. Los bytes y SHA-256 de retrato, atlas modular y cometa en CacheStorage coinciden con disco; ninguno de los siete recursos retirados entra en precarga.
2. Página nueva sin conexión y caché HTTP deshabilitada: el retrato actual se sirve por el worker y se decodifica a 512×640.
3. Página nueva de clásico sin conexión: primer nivel disponible por la UI normal, atlas modular dibujado realmente en el Canvas, pausa y reanudación.
4. Página nueva de N-7 sin conexión: primera ruta, misma identidad modular y comprobaciones de render/pausa/reanudación. No se desbloquearon rutas ni se prepararon guardados.

Las respuestas de las imágenes actuales registran `fromServiceWorker:true`. No hubo solicitudes HTTP al servidor después de desconectar, peticiones de la nave retirada, errores JavaScript ni fallos de recursos de la aplicación. El máximo observado de RAF del juego es uno. El harness observa `drawImage` y llama a la implementación original; sus esperas usan polling de 100 ms para no añadir otro RAF de instrumentación.

Se conserva un único 404 incidental del navegador para `/favicon.ico`, no declarado por el launcher, con URL y motivo explícitos. No se excluyen errores genéricos de consola ni otros recursos. Los intentos previos del nuevo harness permanecen en `offline-01` a `offline-05`; sus causas y correcciones están en el [registro de QA](evidence/ci-ship-precache/README.md). No son regresiones ocultadas del juego ni se reemplazaron por archivos de resultado favorable.

Esta prueba es Chromium local. No certifica Safari, iPhone físico, rendimiento sostenido ni la calidad artística de los diez niveles.

## GitHub Actions y artefacto

[Evidencia remota completa](evidence/ci-ship-precache/github-fix-run.json).

| Dato | Resultado |
| --- | --- |
| Workflow | NEON CRONIUM N-7 Integrated Preview QA |
| Ejecución del refuerzo | [39065781507](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39065781507) |
| SHA verificado | `f69d3651e9a180c8502d17aa523a27d9abed92e7` |
| Resultado | `completed / success`; doce pasos satisfactorios, sin pasos posteriores omitidos |
| Artefacto | `NEON-CRONIUM-N7-ARTPASS-NETLIFY-DROP`, ID `12113146729`, disponible al verificar |
| ZIP de GitHub | 8.163.033 bytes; 117 entradas |
| SHA-256 del ZIP | `3fd91520bd9bd7e8485c875e508a2fa9fabe63bbf1caa826cebd5807d8824a3e` |
| Verificación de descarga | Digest de los bytes descargados igual al informado por GitHub; `build-info.json` contiene `f69d365…`, `dirty=false`. Tres bundles y los tres recursos gráficos actuales coinciden byte por byte con la preview local probada. Los seis originales de nave siguen empaquetados. |
| Despliegue | Ninguno: publicación de artefacto de Actions, no despliegue Netlify/Sites |

La descarga por `gh run download` recibió HTTP 403 en la redirección del almacenamiento del artefacto. Se registró el fallo sin conservar la URL firmada y se utilizó el conector nativo de GitHub, que completó la descarga. Se verificó el digest y el contenido; no quedó pendiente esta comprobación.

Los commits documentales posteriores conservan evidencia y seguimiento; no representan una nueva versión jugable ni sustituyen el SHA de la ejecución correctiva identificada arriba.

## Estado y continuación

`P1-CI-01`: **DONE para esta incidencia de CI**, con contrato, prueba offline, suites locales y ejecución remota completa comprobados. La aceptación artística de recursos y la prueba física de las tareas del juego continúan separadas; no se declaran terminadas a causa de este cierre.

No quedan errores abiertos de esta incidencia. La comprobación física de dos dedos, el acabado visual, el defecto histórico de glifos y el trabajo de contenido conservan su estado anterior. Motor V1 desactivado; main, PR #3, guardados y producción intactos. Se mantiene la pausa de nuevas funcionalidades indicada por el propietario; no se reanuda expansión durante este lote.
