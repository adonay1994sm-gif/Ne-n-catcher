# DIAGNÓSTICO · cierre vigente

El viaje inicial necesitaba continuidad entre etapas y presión después del ataque a Chronos; Gaia necesitaba un enemigo con intención y arte animado. Se implementó y publicó ese incremento. Durante la verificación aparecieron dos defectos adicionales: un fixture inmóvil podía morir por peligros aleatorios antes de comprobar la segunda patrulla, y los puntos de combate esperaban otra recogida para actualizar el HUD. Ambos están corregidos y la nueva ejecución completa de Actions ha pasado. Se conserva íntegro el diagnóstico/informe anterior debajo, identificado como histórico.

# INFORME DE PRODUCCIÓN — NEON CRONIUM

- Fecha: **18/10/2026, UTC**. No se atribuyen horas de trabajo no cronometradas; los procesos conservan sus duraciones.
- Rama: **continuity-assets-audit-20261013**.
- SHA inicial: **51d56295aa07ff60f961c63c078be5ba17a83de1**.
- SHA funcional y paquete final limpio: **d39ed440740b094f9dddb588c540c537f4499215**.
- SHA de cierre documental: [recibo posterior al commit de informe](evidence/chronos-pursuit-gaia/closure.json); no modifica el paquete d39ed44.
- Bloques/niveles: presentación y persecución de **1.1–1.10 Chronos → Gaia**; profundidad orbital y **CH-02 del territorio clásico2**. No se han terminado otros nueve mundos ni cien etapas.
- Mecánicas nuevas/rediseñadas: cruces continuos, presión gradual tras la ruptura, adquisición de objetivo/carga/disparo/retirada por roles y cruce directo a Gaia. Se conserva la recuperación de CRONIUM, C9 y equipamiento.
- Assets/animaciones: atlas CH-02 WebP1024×1024,16 celdas256×256,252.886bytes, dos maestrosPNG1254×1254 conservados. **Las16 celdas se dibujaron realmente en gameplay**, incluidas las cuatro de destrucción. Estimación decodificada4MiB, no medición de GPU.
- Enemigos: CH-01 existente con nuevos roles clásicos y CH-02 de Gaia con flanqueo/ataque señalado. CH-03 y la terminación de Gaia siguen pendientes.
- Eventos/narrativa: huida posterior al ataque, cruces de restos/balizas y recepción hostil de Atlas. Audio contextual anterior conservado; no hay audio nuevo.
- Pruebas finales: **11/11 fases locales,484 casos por suites más23/23 preview**, salida0; GitHub Actions **completed/success**.
- Chromium: viaje natural4/4 sobre612a3f3; ciclo CH-02 completo4/4 sobre33263c5; paquete d39ed44: reentrada2/2, actualización/offline5/5, N-7 una sesión /seis pasos. La repetición ampliada Gaia06 en d39ed44 terminó por timeout del piloto y no se cuenta como aprobada; sí observó daño y el HUD corregido.
- Errores corregidos: objetos borrados al cruzar, acceso a metadatos N-7 ausentes, gracia de reentrada perdida, puntuación de combate no publicada al HUD y aislamiento defectuoso del test de patrullas. Falso RAF duplicado del arnés corregido sin alterar el juego.
- Errores/limitaciones abiertos: calibración humana de persecución/recuperación, repetición de la misión Gaia completa y comprobación física/iPhone. No hay prueba de kill completa en el SHA d39ed44; se conserva la procedencia del kill33263c5 y la diferencia de una sola línea de presentación.
- Web vigente: **[versión privada16]((web privada antigua, retirada))**, succeeded18/10/2026 **06:48:49UTC**. Fuente Site **8fb37f4d0ed9d4626bb2524c00abc406f6e954dd**, paquete d39ed44. HTTP remoto4/4 confirma los bytes actuales.
- Estado Netlify: no se despliega; se mantiene el laboratorio privado autorizado, sin alterar producción.
- Motor: **USE_ENGINE_V1=false**, un único RAF del clásico; sin migración de motor. Experimento orbital ajeno conservado.
- Tareas: **316**,26 DONE /77 IN_REVIEW /5 IN_PROGRESS /200 PENDING /8 BLOCKED. CH-02 y las dos tareas de este lote están IN_REVIEW, con técnica/arte/prueba física separados. Ningún territorio nuevo se declara visualmente completo.
- Siguiente prioridad: comprobar el ritmo de una misión Gaia completa y viabilidad de Pulso/Gemelo con recuperación de suministros; después integrar CH-03. Revisar dificultad con humanos antes de aumentar densidad o expandir otros mundos.

## Qué cambió después del primer informe

**Combate CH-02 completo.** El intento05 usó12 entradas verticales reales y dos activaciones de Gemelo para acercarse, atacar y retroceder. El enemigo apareció a12,0418s, atacó y pasó HP3→2→1→0; murió a18,2229s. Recompensa de destrucción10 puntos exactamente una vez, sin duplicación por animación; hitbox y efecto desaparecen al terminar. Casco88%,15 fragmentos,0 errores JavaScript/recursos/RAF y las16 poses dibujadas. [Resultados](evidence/chronos-pursuit-gaia/gaia-05/results.json), [resumen](evidence/chronos-pursuit-gaia/gaia-05/verified-close-range-summary.json). Es una partida de piloto automático con sólo desbloqueo/equipamiento sembrados, no una prueba humana ni toda Gaia.

**HUD.** En esas capturas, el estado interno tenía406/416puntos pero el HUD seguía en400. La causa era score actualizado sin publicar hudScoreTarget. Se añade **una línea** en src/game/03-ui-game-flow.js tras el premio de proyectil; updateHudVisual conserva su interpolación existente. No se cambia daño, recompensa, control, temporización, IA, colisiones, audio o guardados. La regresión exige3puntos por impacto y13tras destrucción, visibles sin recoger ningún orbe y sin duplicación. Falla contra33263c5 y pasa con el código corregido.

**Actions.** [39104552902](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39104552902) falló en la aserción de presencia CH-02 al segundo17. Con semilla34, el fixture quieto moría a10,710s y terminaba antes de programar el segundo patrullero. No era un fallo del loader ni ausencia de CH-02 en gameplay. Se mantiene la prueba y sus aserciones, aislando sólo spawns ambientales/gates para observar el contrato del programador; los patrulleros, tiempos, HP, colisiones y ataques siguen siendo los reales. Cinco semillas incluida34 comprueban ordenCH-01→CH-02, HP3, atlas, partida viva y RAF1. [Investigación reproducible](evidence/chronos-pursuit-gaia/patrol-ci-investigation/investigation-summary.json):24 ejecuciones previas,35 semillas diagnosticadas,20 repeticiones corregidas /40 casos /100 secuencias, archivo completo30/30. No se presenta el fixture aislado como partida natural.

La corrección está publicada en [d39ed44](https://github.com/adonay1994sm-gif/Ne-n-catcher/commit/d39ed440740b094f9dddb588c540c537f4499215). [Actions39105045562](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39105045562) terminó **completed/success, incluidas las fases posteriores y empaquetado**; [recibo de jobs/pasos](evidence/chronos-pursuit-gaia/github-hud-complete.json). No se resolvió simplemente repitiendo el workflow fallido ni quitando su aserción.

## Paquete final y pruebas actuales

[ZIP d39ed44](evidence/chronos-pursuit-gaia/closing-package/neon-cronium-chronos-gaia-pursuit-d39ed44.zip) · [recibo](evidence/chronos-pursuit-gaia/closing-package/package.json) · [build-info](evidence/chronos-pursuit-gaia/closing-package/build-info.json).

- **8.777.108bytes/120entradas**, SHA-256 **87dfe31b679730d00de9adf2a03d2211e192598575d54c963fd41342c8732135**.
- Revisión **458f6dcf810bc827aad45191b5d46b4862d47cfa83329e163e6f321b97a7b11f**, dirty=false.
- Descomprimir y servir index.html por HTTP; CONTINUAR VIAJE abre juego/index.html. En el Site se sirve en /clasico-actual/ con el mismo prefijo de guardados.
- [Equivalencia332→d39](evidence/chronos-pursuit-gaia/closing-package/runtime-equivalence.json):114archivos idénticos; cambian game.js por la líneaHUD y cuatro archivos de generación/procedencia de preview, además de build-info. Se conserva el [parche exacto](evidence/chronos-pursuit-gaia/closing-package/post-kill-05-source.patch). No se atribuye la partida05 al SHA posterior.
- [Certificación03](evidence/chronos-pursuit-gaia/certificate-03/results.json): build0; motor60/60, arquitectura6/6, contenido329/329, estáticos13/13, regresión34/34, web13/13, adapters14/14, audio3/3, artpass12/12 e inventario84. Todos salida0. Arrancó sobre8720d77 con los cambios d39 aún en el árbol; hashes de sus bundles preservados, iguales a los del paquete limpio posterior. No se oculta ese estado del árbol.
- [Build preview03](evidence/chronos-pursuit-gaia/build-preview-03.txt) y [preview23/23](evidence/chronos-pursuit-gaia/preview-03.txt), salida0; raíces web/iOS regeneradas mediante pipeline, no parcheadas a mano.

~~~bash
node scripts/certify-local.mjs /tmp/neon-pursuit-certificate-03
npm run build:preview
npm run test:preview
node scripts/pursuit-resume-browser-smoke.cjs --root preview-dist --checkpoint /tmp/neon-pursuit-natural-01/results.json --output /tmp/neon-pursuit-resume-browser-03 --expected-commit d39ed440740b094f9dddb588c540c537f4499215
node scripts/rebrand-browser-smoke.cjs --root preview-dist --previous /tmp/neon-before-pursuit-preview --output /tmp/neon-pursuit-upgrade-03 --timeout 180000
node scripts/content-browser-smoke.cjs --root preview-dist --output /tmp/neon-pursuit-n7-03 --profile 390x844 --mode n7
node scripts/gaia-interceptor-browser-smoke.cjs --combat --equip-twin --close-range --root preview-dist --output /tmp/neon-pursuit-gaia-06 --expected-commit d39ed440740b094f9dddb588c540c537f4499215 --timeout 180000
~~~

| Verificación | Resultado y evidencia | Alcance |
| --- | --- | --- |
| Recuperación actual | [2/2,exit0](evidence/chronos-pursuit-gaia/resume-browser-03/results.json) | Checkpoint auténtico1.2;7s de margen y pausa |
| Actualización/offline actual | [5/5,exit0](evidence/chronos-pursuit-gaia/upgrade-03/results.json) | Paquete anteriorv14→d39,SWreales,bytes de guardado/equipamiento,continuación1.3yRAF1 |
| N-7 actual | [1 sesión /6 pasos,exit0](evidence/chronos-pursuit-gaia/n7-03/results.json) | Entrada,controles,pausa,reinicio,recursos yRAF;no100partidas |
| Gaia06 actual | [2 casos aprobados /1 fallido,exit1](evidence/chronos-pursuit-gaia/gaia-06/results.json) | Timeout187.224ms;seguía jugando72%casco/41de45;sin muerte, Atlas ni error JavaScript;no se certifica kill |
| HUD actual en combate | [Observación específica](evidence/chronos-pursuit-gaia/gaia-06/hud-observation-and-failed-combat-summary.json) | Golpe real HP3→2:score2466=target2466, texto2465interpolando;final2476=target=displayed=text. Ventana posterior al kill no ejecutada |
| Entrada del Site final | [2/2,exit0](evidence/chronos-pursuit-gaia/site-local-02/results.json) | Chromium sobre distribución exacta,portada→clásicoactual→inicio;sin hooks/SWbloqueado |
| HTTP remoto actual | [4/4,exit0](evidence/chronos-pursuit-gaia/site-http-02/results.json) | HTTP200,build-info d39,bundle/atlas con hashes finales;no una partida remota completa |

**Fallos retenidos:** intentosGaia01/02/03/04/06, invocaciónresume01conSHAincorrecto, transporteNodefetchinicial, workflow39104552902 y rojo intencionalHUDcontra332. No se contabilizan como aprobados. El07conPulso **no se ejecutó**, al no cerrar06; su viabilidad natural sigue como próximoQA. No hay nueva certificaciónSafari/iPhone/Xcode, FPS,memorybenchmark ni humanos. No se rebaja dificultad para que gane el piloto.

## Publicación, capturas y continuación

[Web privada16]((web privada antigua, retirada)) → CONTINUAR VIAJE. Para volver al inicio: NIVELES → La Onda de Choque →1.1. Al completar el trayecto, CRUZAR HACIA GAIA NOVA entra directamente en el segundo territorio. [Recibo nativo](evidence/chronos-pursuit-gaia/site-publication-02.json), fuenteSite8fb37f4d0ed9d4626bb2524c00abc406f6e954dd. La comprobación remota confirma bundleSHA **0b84901e8f34b36c014970911f33fcc20460acedc47ed28c4c38d2a56be978e5** y atlas **0b1b84b7a14edbc315136339f6f423989d685c7ea4c6122a7a7b88939be78729**. [148archivosajenos preservados](evidence/chronos-pursuit-gaia/site-preservation-02.json), sin cambiar audiencia, producciónNetlify, main/PR3deljuego o tiendas.

Las capturas05 son del combate completo en332; las06 son de d39 y no representan un kill. [Galería05](evidence/chronos-pursuit-gaia/gaia-05/results.json) y [galería06](evidence/chronos-pursuit-gaia/gaia-06/results.json) enumeran archivos/tiempos/estado. La galería del viaje y comparación antes/después se conserva en el informe histórico siguiente. Son imágenes del ejecutable, no concept art.

La mejora está integrada y disponible para pruebas privadas. Falta terminar Gaia, CH-03, calibrar combate/recuperación con personas y certificar dispositivos. Se conserva el registro único de316 tareas y la aceptación artística/física separada; no se convierten las pruebas o la opinión de que el primer nivel está casi terminado en un DONEcomercial. El correo de soporte sigue aplazado, sin nuevas preguntas.

---

# Historial técnico · versión15 y primera integración de este lote

**Lo siguiente registra el estado anterior a los cierres05/HUD/CI. Sus SHA, resultados, pendientes y versión15 son históricos; prevalece el cierre d39/versión16 anterior.**

# DIAGNÓSTICO

El propietario considera el primer territorio casi terminado y pide mejorar sus cambios de etapa, elevar ligeramente la presión tras el ataque a Chronos y dar comportamientos reconocibles a los enemigos antes de continuar Gaia. Se partió de HEAD remoto/local limpio **51d56295aa07ff60f961c63c078be5ba17a83de1**, conservando los avances posteriores al mandato histórico. La versión privada anterior era la 14, paquete f39082f.

El cambio de etapa eliminaba los objetos y proyectiles presentes: rompía la continuidad del viaje. Chronos tenía amenazas de navegación pero no una persecución activa tras la ruptura. Gaia reutilizaba CH-01; faltaban el arte/animador de CH-02 y una composición orbital independiente. Se implementó este incremento sobre el ciclo legacy, sin expandir territorios ni activar el Motor V1.

# INFORME DE PRODUCCIÓN — NEON CRONIUM

- Fecha: **18/10/2026, UTC**.
- Tiempo registrado: no se cronometraron horas de trabajo; la partida natural completa registró457.500ms y cada prueba conserva sus tiempos propios.
- Rama: **continuity-assets-audit-20261013**.
- SHA inicial: **51d56295aa07ff60f961c63c078be5ba17a83de1**.
- SHA de integración natural: **612a3f34b99cc1e5197ebf066432a43fb848667f**.
- SHA de corrección funcional: **1313a2bee65d2ebb48cd3772a68a9ed2f8695919**.
- SHA del paquete final limpio probado/publicado: **33263c5219240b5fb119f23b430f9c6698191e0c**.
- Cierre documental: commit posterior; su recibo se conserva en [closure.json](evidence/chronos-pursuit-gaia/closure.json). No recompila ni cambia el paquete 33263c5.
- Bloques trabajados: continuidad/QA, presentación y combate clásico; inicio de la siguiente entrega Gaia.
- Niveles modificados: etapas **1.1–1.10 de Chronos → Gaia** y presentación/patrullas del **territorio clásico 2, Perímetro Atlas**. No son diez mundos nuevos ni diez etapas Gaia terminadas.
- Mecánicas: persecución con adquisición de objetivo, carga anunciada, disparo dirigido a una posición fijada y retirada; tres roles. Sin nuevas claves de progreso, reglas de puntuación ni geometría de la nave.
- Arte nuevo: un atlas CH-02, 16 poses, dos maestros conservados. Arte existente reutilizado para cruces, planeta y relés.
- Pruebas finales locales: **11/11 fases**, más **23/23 preview**, todas salida 0. Contenido **329/329**; detalle y comandos debajo.
- Chromium: travesía natural **4/4** sobre 612a3f3; paquete final: recuperación **2/2**, actualización/offline **5/5**, Gaia de alcance breve **4/4**, N-7 **1 sesión/6 pasos**, entrada del Site **2/2**. No equivalen a certificación humana o física.
- Fallos conservados: cuatro intentos ampliados Gaia no completaron la destrucción natural de CH-02 (el cuarto se interrumpió, salida 130); una invocación de QA rechazó un SHA mal transcrito; el primer transporte HTTP Node no conectó. No se borran ni contabilizan como aprobados.
- Estado web: **versión privada 15 publicada y comprobada**, [abrir NEON CRONIUM]((web privada antigua, retirada)). HTTP remoto **4/4** confirma paquete, bundle y CH-02 actuales.
- Netlify: no se despliega; se utiliza el laboratorio privado existente. Producción intacta.
- Motor gráfico: **USE_ENGINE_V1 = false**, legacy con su único RAF; experimento orbital ajeno preservado.
- Tareas: **316** en registro único: **26 DONE, 77 IN_REVIEW, 5 IN_PROGRESS, 200 PENDING, 8 BLOCKED**. No es un porcentaje de terminación comercial.
- Prioridad siguiente: validar una destrucción natural CH-02 y el ritmo de recuperar CRONIUM mientras se combate; después cerrar la siguiente unidad Gaia/CH-03. Arte y dificultad deben revisarse jugando.

## Experiencia que se puede jugar

CONTINUAR VIAJE abre el clásico actual. Después del ataque y ruptura de Chronos aparece el primer perseguidor alrededor del segundo 13 de juego. Los restos y los disparos continúan a través de las etapas ordinarias. Las balizas/restos ilustrados cruzan el campo con profundidad mientras cambia gradualmente la presencia de la nebulosa; la estación se aleja y Gaia gana presencia sin reiniciar su geografía. C9 conserva una pausa segura y enlazada.

La llegada persistida ofrece **CRUZAR HACIA GAIA NOVA →** y entra directamente en el segundo territorio. Gaia compone espacio, planeta y relés con recursos independientes. CH-01 patrulla; CH-02 entra en la segunda patrulla, flanquea, prepara su ataque y dispara. Recibe daño y muestra blindaje roto. Su secuencia de destrucción está implementada y probada en lógica, pero **no se certificó todavía su reproducción completa al matarlo durante una partida natural**.

Para revisar la nueva salida desde un guardado avanzado: CONTINUAR VIAJE → NIVELES → La Onda de Choque → 1.1. Para observar CH-02: Perímetro Atlas y su segunda patrulla; no aparece inmediatamente al abrir el menú. Los guardados existentes se conservan.

## Decisiones de diseño y alcance

Requisitos confirmados: mantener la base del primer nivel, mejorar transiciones, elevar ligeramente su dificultad y desarrollar la lógica enemiga/continuación a Gaia. Las siguientes cifras son decisiones reversibles de implementación, no preferencias históricas atribuidas al propietario:

| Elemento | Implementación | Propósito |
| --- | --- | --- |
| Cruce entre etapas | 1,6 s de aproximación + 1,6 s de salida; se deriva del reloj de etapa | Movimiento continuo y referencias de profundidad sin tapar el corredor |
| Inicio hostil | Ruptura en torno a 9 s; primer raider observado a 13,0423 s | Entender el ataque antes de ser perseguido |
| Etapas 1–4 | Un perseguidor simultáneo; intervalo 17 s tras la entrada | Presión moderada al escapar |
| Etapas 5–6 | Sin nuevas patrullas de persecución | Vacío, cometa y servicio C9 con contraste de ritmo |
| Etapas 7–8 / 9–10 | Un scout cada 18 s / hasta dos, intervalo 14 s | Preparar la identificación hostil de Atlas |
| Entrada restaurada | Margen de 7 s en etapas posteriores a 1.1 | Mismo inicio legible al cargar un checkpoint ya emitido |
| Roles | Raider busca; scout observa; interceptor flanquea | Reconocer intención y responder |
| Avisos | 0,72 / 0,88 / 0,76 s según rol, más emisión de ataque | Disparo anticipado, sin seguir al jugador después de fijar el objetivo |
| Gaia | CH-02 con 3 HP, CH-01 con 2; máximo de dos patrullas | Introducir una amenaza diferenciada sin saturar |

No se cambia chronos-voyage-v2, duración/objetivos de sus diez etapas, semillas N-7 ni formatos de guardado. Las nuevas tácticas tienen identificador propio classic-pursuit-v1. El cruce directo de final de territorio se aplica **a Chronos → Gaia**; el resto de las transiciones territoriales conserva su flujo previo. No se afirma haber rediseñado los diez territorios en esta entrega.

## Integración y archivos

[Relación exacta del primer commit funcional](evidence/chronos-pursuit-gaia/functional-612a-files.json) y [relación completa del lote](evidence/chronos-pursuit-gaia/changed-files.json). Las capturas y registros son archivos de evidencia, no assets runtime.

| Rutas | Cambio y conexión efectiva |
| --- | --- |
| src/game/combat/classic-pursuit.js | Controlador puro con aceleración limitada, target fijado, carga, fire único, recuperación, límite de ataques y salida. No posee RAF ni desplaza Y dos veces |
| src/game/presentation/voyage-transitions.js | Presentación derivada de etapa/tiempo, transiciones de ambiente y objeto ilustrado periférico; sin reloj independiente |
| src/game/animation/ch02-animator.js; animation-map.js | Atlas/animador CH-02, estados reales, interrupción por daño y eventos únicos |
| src/game/progression/legacy-content-entry.js | Exporta los módulos anteriores al bundle de contenido existente |
| src/game/00-bootstrap-config.js; 01-runtime-assets.js | Registro/carga del atlas nuevo; reutiliza Image/prewarm existentes |
| src/game/03-ui-game-flow.js | Programación de patrullas clásicas; conservación de objetos al cruzar; gracia de reentrada; llegada a Gaia; precarga |
| src/game/04-entities-collision-damage.js | Retiene el efecto CH-02 durante 0,56 s para completar su destrucción de 0,54 s |
| src/game/05-corridor-update.js | Integra las tácticas y proyectiles dirigidos; mantiene la rama N-7; evita acceso a item.n7 inexistente |
| src/game/06-world-rendering.js | Cruces ilustrados y capas Gaia bajo el HUD medido, con fallback anterior mientras carga |
| src/game/07-player-item-rendering.js | Dibuja el atlas/estado CH-02 correspondiente y evita tapar su destrucción con otra explosión genérica |
| src/game/08-loop-input-bootstrap.js | Conecta el botón real de llegada con el arranque de Gaia; conserva los otros flujos |
| ASSET_MANIFEST.json; ASSET_PRODUCTION_150.json | Recurso real con peso/hash, tres secuencias CH-02 existentes pasan a IN_REVIEW; IDs estables |
| sw.js y copias web/iOS | Precarga CH-02 y nueva generación de caché; no resucita la nave retirada |
| package.json; tests/ | Incorpora 27 tests puros nuevos, integración y regresión de reentrada; contratos de caché actualizados sin eliminar aserciones |
| game.js; content-runtime.js/.map y copias www/ios | Regenerados mediante npm run build desde las fuentes; sin parches exclusivos en bundles |
| scripts/chronos-voyage-browser-smoke.cjs | Partida natural, identidades en fronteras, disparos y pausa, llegada/entrada real en Gaia |
| scripts/gaia-interceptor-browser-smoke.cjs | Encuentro generado naturalmente con fixture declarado de desbloqueo/equipamiento; modo --combat sigue exigiendo kill |
| scripts/pursuit-resume-browser-smoke.cjs | Recupera un checkpoint auténtico y verifica la gracia de entrada y pausa sin acelerar el juego |
| art-source/enemies/ch02/; assets/ch02_interceptor_atlas_v1.webp | Producción/maestros/mapa/exportación/procedencia y arte utilizado dentro del juego |
| docs/production-tasks.json y documentos vigentes | Registro único actualizado, aceptación técnica/artística/física separadas e historial conservado |

## Arte producido y reutilizado

| Recurso | Maestro / runtime | Datos y estados | Integración |
| --- | --- | --- | --- |
| CH-02 Interceptor v1/v2 | Dos PNG RGBA 1254×1254; WebP 1024×1024 | 16 celdas 256×256, pivote 0,5/0,5, dibujo lógico 108; 252.886 bytes; alfa real | Segundo patrullero Gaia y luego uno de cada tres; animator y draw del legacy |
| Navegación/giro CH-02 | Celdas 0–3 | Propulsión y cambios de pose | Entrada, vuelo y flanqueo |
| Preparación/ataque | 4–7 | Despliegue, fogonazo, retroceso, recuperación; ataque 500 ms, fire en 160 ms una vez | Proyectil real vinculado al evento del animador |
| Impacto/daño | 8–11 | Impacto, placas rotas, motor averiado y humo; hurt 240 ms | HP real y cancelación de carga |
| Destrucción | 12–15 | Rotura estructural, explosión, fragmentación y residuos; 540 ms | Conectada al golpe letal, retención visual 560 ms; prueba natural pendiente |
| Capas de viaje y Gaia | Ilustraciones existentes flightSpace/flightKit y restos | Recorte del atlas y composición independientes; planeta crece, relés giran, elementos cruzan | Renderizador actual y único progreso jugado; no duplicación de una pintura con diferentes velocidades |

SHA-256 del atlas runtime: **0b1b84b7a14edbc315136339f6f423989d685c7ea4c6122a7a7b88939be78729**. [Maestros, prompts, exportación y derechos](../../art-source/enemies/ch02/PROVENANCE.md), [mapa de animación](../../art-source/enemies/ch02/ch02-atlas-v1.json), [validación Chromium de alfa](../../art-source/enemies/ch02/ch02-browser-validation.json). Es arte generado con image_gen disponible en la sesión, sin descarga de franquicias ni contratación externa. Los frames son diferentes; no se declara una animación esquelética perfecta. No hay música ni efectos de audio nuevos en este lote; se conserva el sistema contextual existente y su volumen/silencio.

Inventario runtime final: **84 recursos / 8.524.914 bytes**, estados de inventario READY58/IN_REVIEW26. Catálogo de producción: **156 IDs**, 38 IN_REVIEW, 116 PLANNED, 2 IMPLEMENTED_CODE. Ninguna de esas cifras certifica un nivel visualmente completo.

## Pruebas ejecutadas y atribución de SHA

La travesía de 7 min 37,5 s de pared se ejecutó en el paquete limpio **612a3f3**. Posteriormente se corrigió únicamente la inicialización de la gracia al cargar etapa en startLevel. No se presenta esa partida como repetida sobre el paquete posterior. [Parche exacto y comparación de hashes](evidence/chronos-pursuit-gaia/final-package/runtime-equivalence.json): **114 archivos empaquetados idénticos**; cambian game.js y cuatro archivos de procedencia/generación de preview. El build-info cambia además y se conserva separado. Los módulos de IA/arte/presentación, colisiones, Gaia y recursos son idénticos. La corrección se comprueba con una nueva regresión de integración y **Chromium 2/2 sobre el paquete final 33263c5**.

~~~bash
node scripts/certify-local.mjs /tmp/neon-pursuit-certificate-02
npm run build:preview
npm run test:preview
~~~

| Comando ejecutado por certify-local | Resultado final | Salida |
| --- | --- | --- |
| npm run build | Web/core/content/bridge/iOS generados | 0 |
| npm run test:engine | 60/60 | 0 |
| npm run test:architecture | 6/6 | 0 |
| npm run test:content | 329/329 | 0 |
| npm run test:static | 13/13 | 0 |
| npm test | 34/34 | 0 |
| node tests/run-v7-web-tests.mjs | 13/13 | 0 |
| node --test tests/campaign-adapter.test.mjs tests/neon-render-engine.test.mjs tests/sprite-animator.test.mjs | 14/14 | 0 |
| node --test tests/audio-lifecycle.test.mjs | 3/3 | 0 |
| node --test tests/visual-artpass.test.mjs | 12/12 | 0 |
| node scripts/audit-asset-inventory.mjs | 84 recursos, hashes/peso válidos | 0 |
| npm run build:preview; npm run test:preview | Paquete limpio 33263c5; 23/23 | 0 / 0 |
| node scripts/update-production-progress.mjs; --check | 316 tareas /156 assets; sincronizados | 0 / 0 |

Son **484 casos** en las suites de la certificación final, más 23 de preview; se declaran por suite, no como 507 escenarios jugados. La certificación final arrancó en1313a2b con únicamente evidencia documental no confirmada en el árbol; sus bundles son idénticos a los del commit documental33263c5 y sus hashes constan en results.json. Build de preview posterior: árbol limpio, dirty=false. La [certificación anterior sobre612a3f3](evidence/chronos-pursuit-gaia/certificate-01/results.json) también aprobó11/11, contenido328/328. No se suman ambos conjuntos como casos nuevos. npm ci no se repitió: no cambiaron dependencias ni lockfile.

Comandos Chromium reales — argumentos de cada proceso y hashes de arnés conservados en su JSON:

~~~bash
node scripts/chronos-voyage-browser-smoke.cjs --root preview-dist --output /tmp/neon-pursuit-natural-01 --expected-commit 612a3f34b99cc1e5197ebf066432a43fb848667f --timeout 1200000
node scripts/pursuit-resume-browser-smoke.cjs --root preview-dist --checkpoint /tmp/neon-pursuit-natural-01/results.json --output /tmp/neon-pursuit-resume-browser-02 --expected-commit 33263c5219240b5fb119f23b430f9c6698191e0c
node scripts/rebrand-browser-smoke.cjs --root preview-dist --previous /tmp/neon-before-pursuit-preview --output /tmp/neon-pursuit-upgrade-02 --timeout 180000
node scripts/gaia-interceptor-browser-smoke.cjs --root preview-dist --output /tmp/neon-pursuit-gaia-focused-final --expected-commit 33263c5219240b5fb119f23b430f9c6698191e0c --timeout 180000
node scripts/content-browser-smoke.cjs --root preview-dist --output /tmp/neon-pursuit-n7-final --profile 390x844 --mode n7
~~~

| Ejecución | Evidencia y resultado | Límite |
| --- | --- | --- |
| [Natural Chronos](evidence/chronos-pursuit-gaia/natural-01/results.json) | **4/4, exit0**; 457.500 ms total;360s de ruta,10etapas,36/36fragmentos; pieza→C9→Gemelo→llegada persistida→Gaia;24capturas;0erroresJS/recursos;RAFmáximo1 | Piloto automático por controles reales, no prueba humana; ningún desbloqueo, vida, tiempo u objeto inyectado |
| [Fronteras y persecución](evidence/chronos-pursuit-gaia/natural-01/results.json) | Primer raider13,0423s; estados entrada/seguimiento/carga/disparo/retirada;7disparos raider y15scout detectados;8cruces registrados y6entidades conservadas;pausa congela objetivo fijado/proyectiles | C9 limpia su campo a propósito. Un piloto perfecto conservó100%casco; no demuestra balance humano |
| [Restauración final](evidence/chronos-pursuit-gaia/resume-browser-02/results.json) | **2/2, exit0**; sin perseguidor a6,6023s; aparece naturalmente a7,0783s; pausa600ms sin avance | Fixture de checkpoint auténtico de la partida anterior; no combate acelerado |
| [Actualización/offline final](evidence/chronos-pursuit-gaia/upgrade-02/results.json) | **5/5, exit0**,42.679ms; generacionesSW actualizadas, bytes exactos de guardados/equipamiento conservados; offline reanuda1.3 y dibuja nave modular;RAF1 | Usa fixtures previos declarados; localhost, no Safari físico |
| [Gaia final breve](evidence/chronos-pursuit-gaia/gaia-focused-final/results.json) | **4/4, exit0**,81.976ms; segunda patrulla CH02 real,16celdas fuente distintas,flanqueo,carga,proyectil,pausa y cambio aGemelo sin recarga | Sólo desbloqueo2 y propiedad Pulse/Twin sembrados; NO certifica kill ni misión Gaia completa |
| [N-7 final](evidence/chronos-pursuit-gaia/n7-final/results.json) | **1 sesión/6 pasos, exit0**,52.077ms; selector,controles,pausa,reinicio,recurso/RAF | Smoke de regresión, no cien partidas |
| [Entrada exacta del Site](evidence/chronos-pursuit-gaia/site-local/results.json) | **2/2, exit0**,Chromium390×844: portada→clásicoactual→Chronos;sin hook de diagnóstico | Distribución local idéntica al Site;SW bloqueado |
| [HTTP remoto](evidence/chronos-pursuit-gaia/site-http/results.json) | **4/4, exit0**,HTTP200 en portada/build-info/bundle/atlas;SHA actual y hashes iguales | Prueba de publicación remota, no partida remota completa ni offline remoto |

## Incidencias, correcciones y pruebas que no pasan

1. **Continuidad rota en cruces.** La lógica vaciaba arrays de objetos/disparos al completar cada etapa. Se conserva su identidad y física; C9 mantiene una excepción deliberada de seguridad. Integración + observación nativa de fronteras comprueban la conservación.
2. **Acceso a metadatos N-7 desde patrulla clásica.** La nueva persecución no tiene item.n7. Se exige su existencia antes de leer pattern; las ramas clásica/N-7 se prueban por separado.
3. **Gracia perdida al recargar.** El checkpoint guardaba los eventos de entrada ya emitidos y correctamente no los repetía; startLevel esperaba ese evento para iniciar su timer. Se inicializa también desde la etapa restaurada. Nueva regresión30/30 del archivo unified-flight y Chromium final2/2; ningún evento de ataque/ruptura se repite por la corrección.
4. **Falso RAF duplicado del arnés Gaia01.** waitForFunction usaba su propio RAF y el observador contaba ambos. Se usa polling100 manteniendo la aserciónmáximo1. No se modificó el ciclo del juego para ocultar el fallo.
5. **Gaia02/03, piloto prioriza el combate y pierde suministros.** Se conservaron salidas1:39/45con76%casco y34/45con100%casco. No fueron muertes por casco. Se corrigió el texto diagnóstico del arnés; no se cambió la economía del juego para convertirlas en verde.
6. **Gaia04, destrucción natural no lograda.** Gemelo se seleccionó por el botón real, batería3→3; HP3→2→1,12celdas dibujadas,45/45fragmentos y100%casco. Atlas sustituyó la patrulla antes del kill. Root limitó esa serie y solicitó detenerla: **salida130/SIGINT**,2casos aprobados/1criteriofallido. [Resumen de intentos](evidence/chronos-pursuit-gaia/gaia-attempts-summary.json), raw previo y recibo de interrupción conservados. El modo --combat continúa exigiendo destrucción y no se desactiva ninguna aserción. El smoke breve posterior tiene alcance diferente explícito.
7. **Ventana de tiro CH02 pendiente de valoración.** Tras atacar, se retira haciax66/654 y puede abandonar la línea vertical alcanzable desde el borde inferior. Los impactos3→2→1 demuestran vulnerabilidad; falta una partida que cierre el combate usando maniobra vertical/anticipación y recuperación de suministros. No se afirma que toda retirada sea un bug ni que el balance esté aceptado.
8. **Invocación resume-browser01.** El SHA esperado se transcribió incorrectamente; la comprobación detuvo la prueba antes de abrir Chromium, salida1. Se repitió con el SHA leído de build-info y pasó2/2. Ambos registros se conservan.
9. **Transporte remoto inicial.** Node fetch terminó TypeError:fetch failed antes de obtener respuesta. Se preserva [el intento](evidence/chronos-pursuit-gaia/site-remote-01/results.json); con urllib y el transporte configurado, las cuatro solicitudes remotas pasan. No se atribuye ese fallo al juego.
10. **Inspección del alfa.** Un visor de WebP mostró RGB de píxeles totalmente transparentes como bandas rojas. Composición Chromium:722.725píxeles con alfa0 reproducen el fondo y0incorrectos. No era una franja visible dentro del juego ni requirió un parche gráfico.

No ejecutadas/certificadas: Safari físico, iPhone físico, build/firmado iOS en Xcode, pruebas humanas de dificultad, benchmark de60FPS/memoria real, partida Gaia/Atlas completa con la nueva patrulla ni destrucción natural CH02. Los anteriores combates Atlas del lote previo conservan su SHA histórico; no se reutilizan como certificación de éste.

## Capturas auténticas y comparación

Son imágenes del ejecutable en Chromium. La hoja de contacto del arte no sustituye ninguna captura.

| Momento | Captura real |
| --- | --- |
| Reactor atacado | [Chronos](evidence/chronos-pursuit-gaia/natural-01/02-reactor-attack.png) |
| Enemigo fija el ataque | [Objetivo anunciado](evidence/chronos-pursuit-gaia/natural-01/03-pursuer-locks-announced-target.png) |
| Proyectil durante la huida | [Disparo real](evidence/chronos-pursuit-gaia/natural-01/04-pursuer-live-projectile.png) |
| Cruce1.1→1.2 | [Restos y continuidad](evidence/chronos-pursuit-gaia/natural-01/05-stage-02-wreckage-crossing.png) |
| Pieza/C9/Gemelo | [Pieza recuperada](evidence/chronos-pursuit-gaia/natural-01/10-emitter-recovered.png) · [Instalación](evidence/chronos-pursuit-gaia/natural-01/16-c9-emitter-installed.png) |
| Espacio y aproximación | [Vacío](evidence/chronos-pursuit-gaia/natural-01/12-stage-05-comet-crossing.png) · [Gaia](evidence/chronos-pursuit-gaia/natural-01/18-stage-08-destination-reveal.png) |
| Llegada y continuación | [Llegada persistida](evidence/chronos-pursuit-gaia/natural-01/22-gaia-persistent-arrival.png) · [Cruce directo](evidence/chronos-pursuit-gaia/natural-01/23-chronos-to-gaia-direct-handoff.png) |
| CH02 en Gaia final | [Carga](evidence/chronos-pursuit-gaia/gaia-focused-final/03-ch02-target-lock.png) · [Ataque real](evidence/chronos-pursuit-gaia/gaia-focused-final/04-ch02-real-attack-projectile.png) |
| Daño CH02 observado | [HP y arte dañados, intento04 no aprobado](evidence/chronos-pursuit-gaia/gaia-04/06-ch02-player-inflicted-damage.png) |

Comparación conservando la versión anterior:

| Antes, versión13/14 | Después, este lote | Qué comparar |
| --- | --- | --- |
| [Cruce anterior](evidence/voyage-polish/natural-01/03-stage-02-wreckage-crossing.png) | [Cruce612a](evidence/chronos-pursuit-gaia/natural-01/05-stage-02-wreckage-crossing.png) | Composición del cruce; la continuidad de objetos se acredita en JSON, no por una imagen sola |
| [Gaia anterior](evidence/voyage-polish/natural-01/21-gaia-next-territory-twin-flight.png) | [Gaia33263](evidence/chronos-pursuit-gaia/gaia-focused-final/04-ch02-real-attack-projectile.png) | Espacio/planeta/relés independientes y nuevo interceptor; instantes distintos, sin atribuir un benchmark visual |

## Rendimiento y límites de medición

- CH02 añade252.886bytes comprimidos; estimación de RGBA decodificado **4MiB**, sin incluir GPU, copias temporales ni cachés del navegador.
- La carga nueva es perezosa/precargada al entrar Gaia; no se cargan cien escenarios ni se incorpora un timer/RAF nuevo. El dibujo utiliza el recorte del atlas compartido.
- Navegación/certificación mide tiempos de procesos; no mide satisfacción del jugador ni tiempo puro de descarga. La travesía registró360s de simulación y457,5s de pared total con pausa, recarga y capturas. No convertir esa diferencia en un datoFPS.
- Las escenas se inspeccionaron a390×844 DPR1. N-7 y la actualización mantienen sus perfiles documentados. No se vuelve a certificar toda la galería de diez mundos ni todos los tamaños con este lote.
- Reducción de efectos evita los adornos adicionales del cruce, conservando la geografía. Los tests comprueban pausa determinista, recortes bajoHUD y fallback; no hay benchmark de dispositivo.

## Paquete, GitHub y publicación

[ZIP verificable del paquete final](evidence/chronos-pursuit-gaia/final-package/neon-cronium-chronos-gaia-pursuit-33263c5.zip) · [recibo de empaquetado](evidence/chronos-pursuit-gaia/final-package/package.json) · [build-info](evidence/chronos-pursuit-gaia/final-package/build-info.json).

- Tamaño: **8.777.106 bytes**,120entradas; entradas index.html y juego/index.html. Descomprimir y servir la raíz por HTTP; no abrir mediante file://.
- ZIP SHA-256: **ba580b5335fc201e0f3cab264101ea3b22bfd9b1082f23eedec1449a5de53703**.
- Revisión del paquete: **07236e09448ce9e791ea0b8ca29e4b84eea7fd23ad76deb858bedec61f1f3d01**,dirty=false.
- Se conserva también el [ZIP612a realmente utilizado por la partida natural](evidence/chronos-pursuit-gaia/natural-tested-package/package.json), con su nombre/SHA propios; no se renombra como si fuera el final.
- Commits publicados: [612a3f3, integración](https://github.com/adonay1994sm-gif/Ne-n-catcher/commit/612a3f34b99cc1e5197ebf066432a43fb848667f); [1313a2b, gracia de reentrada/QA](https://github.com/adonay1994sm-gif/Ne-n-catcher/commit/1313a2bee65d2ebb48cd3772a68a9ed2f8695919); [33263c5, evidencias/registro y paquete limpio](https://github.com/adonay1994sm-gif/Ne-n-catcher/commit/33263c5219240b5fb119f23b430f9c6698191e0c).
- Actions de integración [39102869812](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39102869812): completed/success. Actions del paquete final [39103902742](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39103902742): **completed/success**, todas sus fases y empaquetado. [Recibo de jobs/pasos](evidence/chronos-pursuit-gaia/github-final-complete.json).
- Web: **[NEON CRONIUM, versión privada15]((web privada antigua, retirada))**, despliegue succeeded18/10/2026 06:27:02UTC. [Procedencia nativa](evidence/chronos-pursuit-gaia/site-publication.json): fuente Site **0fdde843ec0b171d9022ed501a8b22fa0f2873b0**, paquete33263c5 en /clasico-actual/. No se cambia la audiencia: propietario, ningún visitante externo añadido.
- [Conservación Site](evidence/chronos-pursuit-gaia/site-preservation.json): remoto previo5f06e63 conservado; **148 archivos fuera del alcance idénticos byteporbyte**. Sólo se actualiza clasico-actual, su bloque de procedencia, generación del launcher y una sección README. Se conservan la entrada histórica /juego/, /vuelo-espacial/, orbital-engine y demás aportaciones ajenas; no se certifican como trabajo de esta entrega.
- Acceso remoto HTTP200 confirma SHA33263c5,bundle **edce8aa6a57e0448598618feb42cfb95f0965adf6c833825eaa162ee482d0543** y atlas CH02. La URL no se reutiliza como prueba de código nuevo sin comprobar esos hashes.
- No se toca main del juego, PR3, Netlifyproducción ni distribución móvil. El repositorio separado del Site utiliza su rama configurada main; no es la rama main del juego.

## Organigrama y continuación

P3-PURSUIT-01 y P1-GAIA-02, junto a las tres secuencias del catálogo CH02, permanecen **IN_REVIEW**. La parte técnica de viaje/reentrada está aprobada con la atribución de SHA indicada; la destrucción natural de CH02 y el balance humano siguen abiertos. No se promueve a DONE por escribir este informe o por generar un WebP. No se declara completo visualmente ningún territorio nuevo.

Siguiente trabajo exacto: completar un encuentro CH02 natural con movimiento vertical, disparos y recuperación de CRONIUM, registrar su destrucción y comprobar que la recompensa se concede una sola vez; evaluar si la retirada deja ventanas razonables para un jugador. Después producir/integrar CH03 y el ritmo propio de Gaia, conservando el cierre Atlas. No empezar cien etapas ni extender el estilo a otros mundos antes de revisar este incremento.

Aceptación artística/dificultad final del propietario y prueba física iPhone siguen pendientes. No se reabre el correo público de soporte, aplazado expresamente. El estado comercial continúa siendo **apto para pruebas privadas, no preparado para lanzamiento**.
