# DIAGNÓSTICO

Se continuó desde `39f7b06e726d71eacff1316de85ee325a46c8f70`, igual al remoto al comenzar, sin descartar avances. La entrada todavía exponía archivos de QA y otras variantes; el arma clásica seguía limitada a tres cargas; C9 no disponía de pagos con chatarra; los avisos de ataque resolvían demasiado el combate y los cometas del vacío eran lentos. La IA anterior y el arte ilustrado del viaje se conservaron como base. El recorrido Chronos→Gaia sigue durando360s, con diez etapas y checkpoint v2. No se sustituyó por una demo corta.

# INFORME DE PRODUCCIÓN — NEON CRONIUM

Fecha: 18/10/2026, UTC.

Rama: `continuity-assets-audit-20261013`.

SHA inicial: `39f7b06e726d71eacff1316de85ee325a46c8f70`.

SHA funcional probado y publicado: **`b2a89f694215bddba3a5ba2f6d1a68a03c70cccd`**.

Cierre documental base: **`8f0fae8404e818b109dd05352f1073d7aab726e3`**. La adenda de la partida desde cero se conserva en el commit posterior de este mismo informe; el historial del archivo identifica su SHA. Ninguno de esos commits documentales reconstruye ni despliega otro runtime.

Bloques trabajados: entrada canónica; combate/IA; cargador; chatarra/C9; cometas; arte; rendimiento; QA y publicación privada.

Niveles modificados: viaje clásico1 (etapas1.5/1.9 y presentación/C9), Gaia/Atlas; infraestructura compartida de renderizado y controles preservada. No se produjeron otros ocho mundos ni cien etapas nuevas.

Mecánicas: veinte cargas recargables; recogibles de chatarra; tres compras persistentes; persecución y flanqueo; Atlas v4; tres ráfagas de cometas por tramo.

Assets creados/integrados: dos atlas WebP nuevos,32 celdas reales en total. No son32 assets independientes ni completan el catálogo.

Motor: **USE_ENGINE_V1=false**, renderizador legacy y propietario único de RAF conservados.

Netlify: sin nuevo despliegue; se publicó el **Site privado18**, con acceso exclusivo del propietario y sin modificar producción Netlify.

Web comprobada: https://neon-catcher-pruebas.chictide18.chatgpt.site

Estado: ocho tareas nuevas técnicamente verificadas, **IN_REVIEW** por aceptación artística y dispositivo pendientes. No se declara terminado el juego, el capítulo entero ni diez escenarios visualmente completos.

Tiempo: no se atribuyen horas de producción no cronometradas. Cada ejecución conserva inicio, fin y duración medidos en su JSON.

## Experiencia entregada

La portada y el menú muestran NEON CRONIUM y una sola entrada principal. Se retiraron del flujo visible las variantes, archivos de QA, desbloqueos de pruebas, númeroV7 y textos experimentales. Las campañas, variantes, recursos históricos y sus guardados permanecen recuperables; no se borraron sus implementaciones.

La nave sale con20 disparos. Cada gatillo consume una carga, también con Gemelo; el arma recupera una carga por cada2 segundos jugados. No hay contador de munición ni cuenta atrás en el HUD, tampoco en su etiqueta accesible. La refrigeración comprada reduce el intervalo a1,5s sin regalar cargas. AUTO sigue apagado inicialmente y sólo se activa desde Ajustes. Pilotar y mantener el disparo con dos dedos están comprobados.

Los enemigos mantienen el combate20–24s, flanquean y apuntan con adelanto limitado calculado a partir de posiciones ya observadas. La bala sigue su trayectoria balística; no persigue el dedo ni lee entradas futuras. Se retiraron la línea de apuntado y el aviso HUD/sonoro de carga del clásico. La preparación mecánica del arma continúa en sus fotogramas. Atlas tiene36HP, dos fases, reposicionamiento y tres rutinas en la segunda fase; no muestra un carril seguro resuelto.

En «El gran vacío» y1.9 aparecen diez cometas en ráfagas3/4/3, con velocidad inicial700–950px lógicos/s, curvas balísticas y entradas laterales, superiores e inferiores. Hay tres avisos de lluvia, dos segundos antes, sin guía del corredor. La geometría de la nave no cambió: se añadió barrido de colisión para evitar que un cometa o proyectil rápido atraviese su silueta entre fotogramas. No se añadió otro RAF.

## Chatarra y C9

Matar genera un objeto recuperable; **no suma dinero automáticamente**. Valores actuales: asaltante6, Scout9, Interceptor15, Atlas180. El objeto normal deriva y atrae suavemente en proximidad; el de Atlas usa recuperación magnética visible antes del cierre. Su recogida confirma un recibo durable único. Recargar un checkpoint no duplica ese recibo.

La clave nueva `neonCatcher.classicSalvage.v1` es independiente de los guardados clásicos, N-7 y de los créditos de la demo histórica; la preview añade su namespace existente. El registro incluye saldo, obtenido, gastado, expedición, recibos y mejoras. Saldo y concesión se guardan juntos. Se prueban pagos repetidos, falta de fondos, interrupciones, datos corruptos y versiones futuras; los casos inseguros conservan los datos y bloquean compras.

| Compra | Coste de chatarra | Efecto |
| --- | ---: | --- |
| Preparar emisor recuperado |24| Anclajes físicos visibles; conserva Pulso hasta obtener la autorización de Atlas. |
| Célula de escudo |30| Campo de fuerza durante3s al entrar en etapa o salir de C9. |
| Refrigeración |45| Recarga por unidad2→1,5s; no cambia daño ni cadencia. |

La reparación de emergencia sigue gratuita para no bloquear la aventura. Las armas/montajes legítimos anteriores se conservan. Vencer Atlas sigue concediendo Gemelo como recompensa; preparar antes el emisor es una compra opcional, no una segunda tarifa obligatoria.

Conversiones solicitadas, sin dinero real: **100.000 chatarra=1 plata;100 plata=1 oro;10 oro=1 estelar**. Una estelar equivale a100.000.000 de chatarra. Los drops iniciales usan el token de chatarra; no se presenta un drop de180 como una moneda estelar. La escala final de recompensas aún necesita balance: implementar la conversión no prueba que alcanzar una estelar sea razonable en la campaña completa.

## Arte y procedencia

| Recurso | Maestro/registro | Runtime | Animación y peso |
| --- | --- | --- | --- |
| Pulsos Gaia v3 | `art-source/vfx/gaia-pulse-v3/` | `assets/gaia_pulse_atlas_v3.webp` |1024²,16 celdas256²; Pulso/Gemelo/Lanza12FPS; impacto16FPS sin bucle;256.162B. |
| Munición hostil y chatarra | `art-source/vfx/hostile-salvage-v1/` | `assets/hostile_ordnance_atlas_v1.webp` |1024²,12 poses de munición Scout/Interceptor/Atlas y4 denominaciones estáticas;237.838B. |

Pivote central(.5,.5), frente hacia arriba,16px transparentes por borde y32 celdas RGBA distintas entre ambos atlas. Se conservaron PNG originales, maestros empaquetados, fotogramas, hashes, exportadores, contactos y QA de decodificación. El runtime gira cada proyectil según su velocidad física y reproduce los fotogramas con tiempo jugado. Los contactos artísticos no se presentan como capturas del juego.

El propietario pidió Canva para los pulsos: se generó un [concepto real en Canva](https://www.canva.com/M/MAHYWJAlpCA?utm_source=OC-AaBlKrqBJJNF&utm_campaign=agent_connector_create_image_asset_opened). Canva sólo devolvió una miniatura descargable; la descarga del original dio403 y quitar el fondo exigía plan de pago. No se contrató nada. El maestro de producción transparente se generó con imagegen tomando ese concepto como referencia, sin ampliar la miniatura y fingir que era un maestro. La procedencia y limitación están registradas. El atlas hostil es original de imagegen. No se afirma exclusividad de derechos ni se usaron assets de otra franquicia.

Se actualizaron inventario, catálogo, mapa de animación, loader y precargaSW. Inventario actual: **87 recursos runtime/9.138.764B**; catálogo159 entradas, todavía con arte pendiente. Cada atlas nuevo ocupa4MiB RGBA decodificados; incremento conjunto8MiB si ambos están cargados. Eso no es una medición de memoria total de la aplicación.

## Archivos y sistemas

- `src/game/combat/classic-weapons.js`:20 cargas, recarga configurable y setter sin recarga gratuita.
- `classic-pursuit.js`, `guardian-atlas.js`:IA v3 y Atlas v4; tiempos y proyectiles físicos.
- `src/game/progression/scrap-economy.js`:libro monetario local versionado e idempotente.
- `comet-shower.js`:generador separado/versionado de ráfagas, límites y trayectorias; conserva las semillas y checkpoint anteriores.
- `legacy-content-entry.js`:exportaciones al bundle compatible, sin motor paralelo.
- `01-runtime-assets.js` y `03-ui-game-flow.js`:loaders, C9/pagos, recibos, monedas, efectos de compras, ocultación del contador y eventos del viaje.
- `04-entities-collision-damage.js` y `05-corridor-update.js`:daño/loot, barridos, integración única de cometas, recogibles y liberación.
- `07-player-item-rendering.js` y `08-loop-input-bootstrap.js`:nuevos atlas, pivotes, tokens, montaje preparado y CRONIUM ilustrado sin blur por objeto.
- `index.html`, `styles.css`, `preview/launcher.html`, `scripts/build-preview.mjs`:entrada única, HUD y embalaje; SHA oculto en metadata, no texto de portada.
- `privacy.html`, `terms.html`:legales desplazables y ancla de contacto; sin inventar correo de soporte.
- `ASSET_MANIFEST.json`, `ASSET_PRODUCTION_150.json`, `src/game/animation/animation-map.js`, `sw.js`:registro, duraciones y offline.
- `game.js`, `content-runtime.js`, mapa y copias web/iOS:regenerados por pipeline; no parches exclusivos de bundle.
- Scripts y tests de economía, combate, entrada, render, cometas, C9, dos dedos, actualización/offline y regresión.

La [lista de archivos del incremento](evidence/main-salvage-combat/modified-files.txt) se conserva junto a la evidencia. El diff de los commits contiene el detalle íntegro. En el Site separado cambiaron su entrada, manifest,SW, procedencia y paquete `clasico-actual`; **146 archivos ajenos a ese alcance conservaron sus hashes**.

## Pruebas ejecutadas

| Comando | Resultado final | Evidencia |
| --- | --- | --- |
| `npm run build` |0|certification-01/build.txt|
| `npm run test:engine` |60/60,0|engine.txt|
| `npm run test:architecture` |6/6,0|architecture.txt|
| `npm run test:content` |463/463,0|content-integration-assets.txt|
| `npm run test:static` |13/13,0|static.txt|
| `npm test` |34/34,0|regression.txt|
| `node tests/run-v7-web-tests.mjs` |13/13,0|web.txt|
| Adaptador/render/animador reservados |14/14,0|experimental-render-adapter.txt|
| `node --test tests/audio-lifecycle.test.mjs` |3/3,0|audio-lifecycle.txt|
| `node --test tests/visual-artpass.test.mjs` |12/12,0|visual-artpass.txt|
| `node scripts/audit-asset-inventory.mjs` |0|inventory.txt|
| `npm run build:preview` |0, SHA exacto limpio|neon-salvage-preview-build-03.txt|
| `npm run test:preview` |23/23,0|neon-salvage-preview-tests-03.txt|

Total de suites: **618 casos**, más23 de preview=**641**. No se suman de nuevo los97 modelos focales,43 de integración focal o9 de render que también forman parte de la suite. La certificación local registra el snapshot de trabajo previo al commit y sus fingerprints; el empaquetado limpio y CI posteriores comprueban el runtime publicado. No se atribuye a ese snapshot un árbol limpio que no tenía.

`npm ci` no se repitió localmente porque las dependencias no cambiaron; **GitHub Actions sí ejecutó `npm ci --no-fund`**, compilación, suites, preview y empaquetado completos. [CI del runtime:39112642373, success](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39112642373).

| Chromium real | Casos finales | Alcance |
| --- | --- | --- |
| Gaia/CH-02 |4/4|Destruido con5 gatillos reales; drop físico15 observado, no recogido en esta prueba.|
| Atlas manual |4/4|45 fragmentos,42 gatillos, dos fases,36HP,38%casco;180 chatarra recogidos una vez; Vulkar/reload y N-7 preservados.|
| C9 dirigida |4/4|Fixture declarado24chatarra; pago único24→0, pieza preparada, salida/reload y tres poses nuevas del pulso.|
| Offline/actualización |5/5|Guardados conservados; ambos atlas nuevos porSW, hash/tamaño/decodificación, disparo Gemelo real offline.|
| Dos dedos |7/7|36 aserciones: ambos órdenes de contactos, agotamiento20+recarga, cancelación, pausa, reinicio y teclado/ratón.|
| Cometas dirigida |2/2|39,2164s desdecheckpoint1.5:10cometas,3ráfagas,4máximo activos,1.134dibujos,4celdas y entradas inferiores; pausa congela ruta/TTL/posición.|
| Rendimiento nuevo |2/2|Ventana12s y controles en reposo; comparación con2casos de baseline aparte.|
| Site distribución local |2/2|Portada única y arranque real deChronos desde el árbol exacto publicado.|
| Site HTTP remoto |6/6|Portada, manifest,build-info,bundle y ambos atlas con hashes idénticos.|

Son31 casos Chromium del juego (incluidos3 de la adenda natural), más2 de la distribución local y6 HTTP. Exportación de arte: otros4/4+4/4 de decodificación/celdas. No equivalen a pruebas humanas ni físicas. Los scripts de navegador y sus comandos exactos, SHA, estado del árbol, limitaciones y capturas constan en cada `results.json`.

Partida adicional desde cero hacia C9: **3/3, primer intento**, descrita en la adenda al cierre. Los fixtures C9/cometas y una victoria enGaia no se presentan como demostración del recorrido natural completo Chronos→C9.

## Incidencias y correcciones

1. El build de preview todavía exigía enlaces deN-7 aunque la portada nueva debía quitarlos. Se reprodujo localmente y falló el paso «Build isolated test site» del [CI inicial39112545869](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39112545869). Se cambió el gate para exigir exclusivamente la entrada canónica, sin eliminar la verificación. Commit707be5e.
2. El test de procedencia falló22/23 al retirar el SHA visible. Se conservó el contrato introduciendo una etiqueta `meta` con SHA; no se volvió a llenar la portada de texto técnico. Commitb2a89f6; cierre23/23 yCIverde.
3. Contratos antiguos de caché y cargador se actualizaron al cambio real. Un test nuevo de arte leyó el campo de metadata equivocado; se corrigió a `maximumSixteenPixelGutterAlpha` y se repitió. Registros fallidos conservados.
4. El primer intento de Atlas no llegó a jugar porque el harness buscaba `.card`. Se corrigió a `#classiclink`, preservando la aserción y el paquete. `atlas-manual` conserva el fallo; `atlas-manual-02` la partida válida. Un fixture lento de balas también se corrigió para tener en cuenta la cola física de la nave, sin alterar el juego.
5. El primer decoder de arte buscó el Chrome dePlaywright ausente; se usó `/usr/bin/chromium` y se guardó el error. El bloqueo de exportación deCanva está descrito arriba.
6. El primer push con header genérico no autenticó; el push normal con askpass efímero y el token ya autorizado funcionó. Sin forcepush, sin secretos almacenados en informes.

Fallos finales de suites, paquete publicado y comprobaciones completadas: **0**. Se conservan los intentos fallidos y se distinguen de los resultados finales.

## Capturas auténticas y comparación

- [Antes:Gaia runtime8d651b5](evidence/main-salvage-combat/perf-before/01-gaia-natural-patrol-start.png).
- [Después:Gaia y ataque CH-02](evidence/main-salvage-combat/gaia/05-ch02-real-attack-projectile.png).
- [C9 estable y compra](evidence/main-salvage-combat/c9/02-c9-arrival-opens-workshop-without-a-wait.png).
- [Atlas fase2](evidence/main-salvage-combat/atlas-manual-02/04-atlas-phase-two.png).
- [Victoria real](evidence/main-salvage-combat/atlas-manual-02/06-gaia-victory.png).
- [Portada única del Site](evidence/main-salvage-combat/site-local/01-current-site-launcher.png).
- [Cometas:galería dirigida](evidence/main-salvage-combat/comets/results.json).

Antes/después corresponde a dos revisiones ejecutadas, no al mismo combate o semilla en idéntico instante. Usar las capturas estables deC9 para revisar su taller: la última captura decometas recoge el inicio del fade de apertura.

## Rendimiento y límites

Mismo entorno Chromium390×844/DPR1, controles en reposo y ventana de12s:

| Métrica |Site17/8d651b5|Nuevo/b2a89f6|
| --- | ---: | ---: |
|Callbacks RAF/s|11,56|59,17|
|p95 entre frames|116,7ms|16,8ms|
|Tiempo simulado/tiempo real|0,393|0,994|
|Heap JS usado|6,19MB|6,46MB|

Se retiraron gradientes y blur calculados cada frame para cada orbe del clásico, empleando iluminación de sus sprites; también el halo externo del dron clásico. Las colisiones/radio de recogida y la escala visual a50% se conservan. N-7 retiene su presentación. El nuevo campo tiene más entidades al final y la nave inmóvil pierde casco por la IA: esta comparación mide fluidez, no equivalencia de dificultad. HeapJS excluye imágenes decodificadas y GPU. No se certifica60FPS en iPhone ni se ha medido carga en conexión móvil real. B09-01 continúa abierto para perfilado prolongado/dispositivos.

## Paquete, publicación y GitHub

ZIP: `NEON-CRONIUM-SALVAGE-b2a89f6.zip`,9.424.965B,123entradas.

SHA-256: `c0a8c2637e8f4ef2f579cf529c4fd9378ebadd1a73f9e68bda22bcbbe766fb8e`.

Revisión: `293f66b839af486afa5486715fc56b7e176bb9d03b5511495c4139e53ff93130`.

El ZIP local está en `/workspace/artifacts/`; el workflow incluye un artefacto descargable equivalente construido porCI con su propia procedencia. Para NetlifyDrop, extraer el ZIP y subir su contenido con `index.html` en raíz a un **sitio nuevo de pruebas**, nunca al principal. No se hizo ese despliegue.

Site privado18: fuente `37c1ce5722f34c57c60779a975d6348f911e4955`; deployment `appgdep_6ad48842adfc819198aa3b1d3cdfcaf0`, **succeeded**. Archivo de despliegue construido del árbol fuente exacto después de su push. Propietario único, sin usuarios externos nuevos. HTTP comprobó que sirve el runtimeb2a89f6 y los hashes de ambos atlas. El repositorio del Site es distinto del juego.

Commits funcionales publicados:

- [2e958f6:integración principal](https://github.com/adonay1994sm-gif/Ne-n-catcher/commit/2e958f618fa2fcc7682a3a6ee3ca0deabd08159d).
- [1be09c4:sincronización iOS y QAoffline](https://github.com/adonay1994sm-gif/Ne-n-catcher/commit/1be09c4ee8a017eacc1b9b1e0790e499538092a1).
- [707be5e:gate canónico](https://github.com/adonay1994sm-gif/Ne-n-catcher/commit/707be5e3d5a587281b2616863fd4bd1fee91af59).
- [b2a89f6:procedencia invisible y runtime certificado](https://github.com/adonay1994sm-gif/Ne-n-catcher/commit/b2a89f694215bddba3a5ba2f6d1a68a03c70cccd).

No se modificaron main del juego, PR#3, firmado, MotorV1 ni producción Netlify.

## Seguimiento y siguiente tarea

Fuente única: `docs/production-tasks.json`,333tareas contando159 del catálogo. Resumen:26DONE,94IN_REVIEW,6IN_PROGRESS,8BLOCKED,199PENDING. Este cociente histórico no mide la terminación comercial. Las ocho tareas MAIN_SALVAGE_COMBAT tienen técnica verificada y revisión artística/física pendiente. El catálogo se amplió con dos entradas trazables, sin declarar listos159assets.

Prioridad exacta: revisar jugando en el dispositivo del propietario la presión del primer viaje, la claridad del pulso y la economía hastaC9; contrastar la partida natural adicional de la adenda. Después consolidar dos configuraciones y afinarGuardianAtlas, antes de expandir Gaia→Vulkar y generalizar a los diez territorios. Falta certificar Safari/iPhone, equilibrar la economía de final de campaña y completar personajes, enemigos/arte/narrativa de los demás territorios. La decisión del motor y la aceptación estética siguen reservadas al propietario. Si un futuro jefe usa hazards wave/final, excluir explícitamente sus proyectiles de offsets ambientales; Atlas actual usa fast y no está afectado.


## Adenda: economía natural Chronos → C9

Se ejecutó `node scripts/salvage-journey-browser-smoke.cjs --root preview-dist --output /tmp/neon-salvage-browser-01/salvage-journey --expected-commit b2a89f694215bddba3a5ba2f6d1a68a03c70cccd`, con el paquete inmutable y sin otro navegador simultáneo. **3/3, salida0**, primer y único intento,189,894s reales.

Contexto vacío:0chatarra, un nivel desbloqueado, Pulso y sin emisor. El piloto realizó40 gatillos mediante controles normales, destruyó ocho enemigos, observó ocho drops y recogió48chatarra, con ocho recibos únicos. Los24 necesarios ya estaban ganados a81,65s. Recuperó el emisor del escenario, atravesó el vacío y llegó aC9. Allí pagó24 una vez, quedó saldo24, conservó Pulso y obtuvo `twinPrepared`; al desacoplar quedó persistido `service-complete` en la etapa1.6. La lectura final de simulación es185,7966s y la de ruta185,7166s. No hubo daño, muerte, reinicio, moneda inyectada, alteración del reloj ni errores JS/consola/recursos/RAF. El hook sólo observa.

[Evidencia completa](evidence/main-salvage-combat/salvage-journey/results.json), con ocho capturas y copia exacta del harness. Esta prueba confirma el enlace real combate→recogida→pieza→compra→continuación. Termina al salir deC9; no certifica por sí sola las diez etapas completas ni equilibrio humano. Atlas y continuación aVulkar tienen sus pruebas separadas.
