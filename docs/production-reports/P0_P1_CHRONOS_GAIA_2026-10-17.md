# DIAGNÓSTICO — continuidad y mandato rector

Fecha: 17/10/2026 UTC. Rama única `continuity-assets-audit-20261013`. El HEAD local y remoto al recibir el mandato rector era `bfc6683085e3797a2b0c86957a299f8b7fba0d68`; se conservaron las campañas clásica y N-7, CH-01, maestros y registros. Había un maestro Chronos y un WebP recién generados, todavía sin integrar: se conservaron y registraron. No se ejecutó reset, clean, checkout ni pull destructivo.

El producto anterior no tenía un viaje con pieza→servicio→mejora→frontera. Los diez fondos clásicos y cien rutas N-7 eran bases distintas; no se convirtieron en cien etapas canónicas. El mandato vigente está en [PRODUCT_VISION.md](../PRODUCT_VISION.md) y la guía en [AGENTS.md](../../AGENTS.md). No había informe estratégico adicional adjunto en el workspace.

# INFORME DE PRODUCCIÓN — primera unidad Chronos → Gaia

## 1. Versiones y resultado

- SHA inicial: `bfc6683085e3797a2b0c86957a299f8b7fba0d68`.
- Primer incremento publicado: `398d1ca479de9aefe6bacc6f36900c3111ffa7d4` — **WIP**, viaje integrado y mandato rector.
- SHA funcional probado/publicado: `ce71b299cb0eea8cbb908dd4886319e4e859580e` — corrección de zona útil y regresión visual.
- SHA de cierre documental y snapshot limpio: `24b591ca6814e21a8cfd75eb017ad869b18e1e66`; [acta y ZIP](PAQUETE_JOURNEY_2026-10-17.md). El commit posterior de acta se consulta en `git log -1`.
- Tiempo total de producción: no se midió; no se atribuyen horas. La última partida Chromium registró **72,367 s de pared**.

Puede jugarse una demostración comprimida con **salida Chronos → baliza C9 → tránsito → acceso Atlas a Gaia**. Se inicia directamente con CONTINUAR VIAJE. El recorrido gobierna el paisaje, los encuentros, la disponibilidad de la pieza, la parada y la llegada. El jugador recoge una pieza físicamente, Mira la instala gratis, sella el casco, se continúa con respuesta lateral +20 % y propulsión ámbar, se desactiva un guardián CH-01 y se llega con una recompensa única de 120 créditos. La recarga conserva checkpoints coherentes, sin afirmar guardado exacto en mitad de combate.

**P1 permanece IN_REVIEW como entrega: verificación técnica aprobada y aceptación artística/física pendientes.** Esta demostración no son diez etapas acabadas, no es una economía completa y no cierra ningún nivel artístico clásico.

## 2. Requisitos y decisiones de trabajo

Confirmado por el propietario: aventura espacial canónica 10 capítulos×10 etapas; viaje visible; combate, piezas y estaciones; antiguas campañas recuperables; único ciclo legacy; Engine V1 reservado y desactivado.

Decisiones reversibles de esta demo: tres tramos de 20+24+20 s; disparo básico automático inicialmente activado y configurable, pulso manual ilimitado; escudo y tractor como dos habilidades con duración/cooldown; aleta C9 recuperada de instalación gratuita; robot de servicio **Mira**, nombre y papel propuestos; recompensa de 120 créditos sin gasto ni mercado todavía. No son preferencias históricas confirmadas ni balance comercial definitivo.

Mapa y guardado: IDs `demo-departure`, `demo-transit`, `demo-border`, versión `chronos-gaia-demo-v1`. Orígenes/destinos se conectan explícitamente. N-7 conserva cinco sectores y sus claves; no hay equivalencia numérica con las nuevas etapas. El viaje usa `neonCatcher.journeyDemo.v1`, con aislamiento adicional en preview; una entrada inválida se respalda antes de recuperarla.

## 3. Archivos y sistemas

- `src/game/progression/journey-demo.js`: única fuente de progreso, eventos diseñados, checkpoints, instalación y recompensa idempotentes. Ningún RAF/Canvas/DOM.
- `src/game/progression/legacy-content-entry.js`: incorpora el modelo al bundle de contenido existente.
- `src/game/00-bootstrap-config.js` y `01-runtime-assets.js`: modo optativo `?campaign=journey`, claves aisladas y recursos compartidos.
- `src/game/02-storage-audio.js`, `03-ui-game-flow.js`, `04-entities-collision-damage.js`, `05-corridor-update.js`, `06-world-rendering.js`, `07-player-item-rendering.js`, `08-loop-input-bootstrap.js`: control relativo, menú directo, HUD/servicio, habilidades, disparo básico, recogida, combate CH-01, paisaje y mejoras. Se mantiene el propietario RAF legacy y la geometría de colisión de nave. Solo Journey eleva la posición de pilotaje para dejar libres los controles.
- `src/core/storage-service.js`: lectura raw segura para respaldar guardados inválidos sin acoplar el producto a la preview.
- `styles.css`, `preview/launcher.html`: presentación optativa y acceso principal a la demo; enlaces históricos de regresión conservados.
- `ASSET_MANIFEST.json`, `ASSET_PRODUCTION_150.json`, `sw.js`: nuevo recurso registrado y caché versionada. El inventario se verifica contra manifiesto y disco, sin fijar 69 como meta permanente.
- Bundles `core-runtime.js`, `content-runtime.js`, `game.js`, mapas y copias web/iOS: regenerados mediante scripts existentes.
- `tests/journey-demo.test.mjs`, `tests/journey-legacy-integration.test.mjs`, `scripts/journey-browser-smoke.cjs`, `package.json`: pruebas de modelo, pipeline y partida natural. `scripts/update-production-progress.mjs` muestra puertas canónicas y aceptaciones separadas desde `docs/production-tasks.json`.

## 4. Arte y animación

**Nuevo recurso real:** [módulo Chronos](../../assets/chronos_detached_module_v1.webp), WebP con alfa **640×640, 101 668 bytes**, maestro PNG **1254×1254, 2 161 708 bytes** en `art-source/immersive-rebirth/levels/01/`. [Metadatos y procedencia](../../art-source/immersive-rebirth/levels/01/chronos-detached-module.json). Memoria decodificada estimada **1 638 400 bytes**. Aparece como hito independiente que pierde escala al alejarse; no se presenta como animación de un enemigo. Estado IN_REVIEW.

Reutilizados: ilustración Chronos, Gaia/Atlas, atlas de onda de cuatro fases, nave de seis poses, atlas CH-01 de 24 poses, efectos phaser, panel metálico y dron de reparación. El panel recuperado pasa a montajes visibles de la nave y cambia el motor; el dron ilustra a Mira. Estas reutilizaciones prueban el bucle y quedan pendientes de aceptación artística. No se produjeron sprites nuevos de comerciante, estación exterior o jefe territorial completo.

Inventario actual: **70 recursos runtime, 5 038 154 bytes, cero inconsistencias**, más dos archivos conservados. La cifra es un estado comprobado, no un objetivo de producción.

## 5. Pruebas reales y límites

| Comando / evidencia | Resultado |
| --- | --- |
| `node scripts/certify-local.mjs docs/production-reports/evidence/journey-p1/certification-03` | **11/11 fases, exit 0**: build; motor40/40; arquitectura6/6; contenido/integración44/44; static13/13; regresión33/33; web13/13; render/adaptadores; audio; art pass12/12; inventario. [Resultados](evidence/journey-p1/certification-03/results.json) |
| `npm run build:preview` | Construcción completa,105 archivos verificados; sin despliegue |
| `npm run test:preview` | **15/15,exit0**; [registro](evidence/journey-p1/preview-final.txt) |
| `node scripts/journey-browser-smoke.cjs --root preview-dist --output docs/production-reports/evidence/journey-p1/browser-04` | **5/5 grupos,exit0**, partida natural completa,72,367s,3455 callbacks; RAF máximo1;0 excepciones/consola/HTTP. [Resultado](evidence/journey-p1/browser-04/results.json) |
| `node --test tests/journey-legacy-integration.test.mjs` tras añadir alternativa manual | **4/4,exit0**; [registro](evidence/journey-p1/manual-and-integration-final.txt). El paquete actual contiene una prueba más que la certificación44 anterior; no se infla su cifra. |
| `node scripts/update-production-progress.mjs --check` | Registro y Markdown sincronizados,exit0 |

La partida Chromium solo añadió un hook de lectura y observación del RAF. Usó botones y arrastre de puntero, sin alterar relojes, posiciones, vida, entidades o progreso. Recogió la pieza, utilizó tractor/escudo, instaló, combatió, completó, recargó y comprobó guardados centinela clásicos/N-7. La alternativa manual sin límite de tres disparos se verificó en integración simulada; una partida humana con esa modalidad sigue pendiente.

Errores y correcciones conservados: primera instrumentación de navegador añadió RAF al usar el sondeo predeterminado de Playwright; se corrigió a sondeo100ms. Preview detectó una referencia `window.NeonPreview` dentro del producto; se sustituyó por `storage.getRaw`. Los tests globales esperaban69 recursos; ahora confrontan manifiesto y disco tras registrar el número70. La inspección de captura detectó solape de nave/control/transmisión: se elevó la banda de vuelo solo en Journey y se movieron las transmisiones arriba. `browser-04` midió cero intersecciones y mostró la nave completa. Los intentos previos quedan junto a las repeticiones aprobadas.

## 6. Capturas del ejecutable

- [Salida de Chronos](evidence/journey-p1/browser-04/01-chronos-departure.png): hito independiente y progreso real.
- [Parada C9](evidence/journey-p1/browser-04/02-relay-station.png): pieza, instalación y continuación.
- [Propulsión mejorada](evidence/journey-p1/browser-04/03-upgraded-propulsion.png): nave libre de controles/transmisión.
- [Acceso Atlas](evidence/journey-p1/browser-04/04-atlas-border.png): CH-01 con ataque anunciado.
- [Llegada a Gaia](evidence/journey-p1/browser-04/05-gaia-arrival.png): recompensa y cierre persistido.
- Comparación del defecto: [antes del ajuste](evidence/journey-p1/browser-03/03-upgraded-propulsion.png) / [después](evidence/journey-p1/browser-04/03-upgraded-propulsion.png). Todas son capturas reales de Chromium, no conceptos.

## 7. Organigrama y aceptación

P0: continuidad y documento rector verificados. P1: incremento jugable implementado y probado, **IN_REVIEW** por aceptación estética/física. P2: segunda configuración y mercado económico pendientes. Puerta M: **BLOCKED**, decisión del motor reservada. P3: capítulo1 con diez etapas pendiente. P4: campaña100 etapas pendiente. P5: calidad/distribución pendiente, sin publicación autorizada.

La fuente única es [production-tasks.json](../production-tasks.json): contiene relaciones explícitas de sustitución para planes N-7 anteriores y campos separados técnica/artística/física. No se borraron pruebas ni se convirtió22/267 en porcentaje del producto nuevo.

## 8. Rendimiento, distribución y próximo corte

Se registraron duración/callbacks del navegador y bytes de recursos; no se midió memoria del proceso ni se certificaron60FPS. La memoria de1,56MiB indicada para el nuevo módulo es cálculo deRGBA, no perfilado. Safari/iPhone físico, simulador/iOS nativo, pruebas prolongadas, pequeña pantalla y horizontal de esta demo siguen pendientes. El defecto intermitente de glifos del nivel10 histórico sigue abierto.

**Netlify:** no hay nuevo despliegue comprobado. Token/siteID y CLI no están disponibles, y no se encontró herramienta Netlify conectada. Se preparó el [ZIP verificado](PAQUETE_JOURNEY_2026-10-17.md) desde `24b591c`, con selector y build-info de árbol limpio; el acta registra hash, entradas y operación externa pendiente. No se reutiliza una URL antigua ni se toca producción, main o PR3.

Siguiente tarea exacta: revisar la demostración con el propietario en el paquete aislado, obtener aceptación/correcciones artísticas y la decisión reservada del motor antes de expandir. Mientras tanto: QA de320×568 y horizontal, guardado por interrupción real, modo manual natural, reducción de destellos/sacudidas y arte propio de estación/Mira. No iniciar producción masiva de cien etapas. Mantener `USE_ENGINE_V1=false`.
