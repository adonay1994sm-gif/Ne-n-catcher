# DIAGNÓSTICO — NEON CATCHER

La experiencia estaba dividida entre tres entradas: clásico, Journey y N-7. La demo del viaje fundía pinturas; el clásico retenía movimiento horizontal y tres disparos que se agotaban. El usuario pidió una sola experiencia, salida visible hacia espacio profundo, causa narrativa del desastre, más movilidad y mejoras integradas físicamente.

Se preservaron las tres variantes, sus claves y todo el historial. El clásico recibe la integración principal: un reloj de ruta gobierna paisaje, encuentros, hitos y llegada; reutiliza el animador CH-01 y patrones del director N-7, e incorpora rescate/taller sin obligar a elegir una demo separada. Las variantes antiguas quedan dentro de un archivo QA cerrado. Esto no transforma automáticamente las cien rutas N-7 en cien etapas canónicas terminadas.

# INFORME DE PRODUCCIÓN — VUELO UNIFICADO CHRONOS → GAIA

- **Fecha:** 17/10/2026 UTC.
- **Rama:** continuity-assets-audit-20261013.
- **SHA inicial:** 9c744da4957d776b80940fee2f323a3f4a3ad194.
- **SHA de la partida natural:** 375d0e9e013f5cfdcda5f039c3264d38e2c3f5dc.
- **SHA del paquete final publicado:** 2cea7af9dcec78d2e71305526bb33cc5f31752c6, árbol limpio al construir; mismo juego/arte y mejora de caché verificada.
- **Cierre documental:** esta entrega y sus evidencias se añaden después del SHA funcional; el commit documental se registra en CODEX_STATUS.md y el historial Git del informe.
- **Bloque:** P1-FLIGHT-01, integración clásica de la primera misión, armas y servicio.
- **Niveles modificados:** nuevo recorrido en La Onda de Choque; nuevas armas/movilidad disponibles en el clásico; Atlas adapta su advertencia a la posición vertical real. Los otros nueve escenarios conservan su arte anterior.
- **Estado:** aceptación técnica del incremento aprobada; arte y balance humano IN_REVIEW; Safari/iPhone físico PENDING. Ningún nivel se declara visualmente completo.
- **Tiempo:** se registraron duraciones de comandos y QA. No se atribuyen horas globales no medidas.

## A. Qué se puede jugar

CONTINUAR VIAJE abre la campaña principal. En la primera misión una nave desconocida se aproxima, carga su arma y golpea el reactor. Chronos pasa a su estado roto, se libera una onda ilustrada y el CRONIUM comienza a recuperarse. La estación cambia de posición y reduce su tamaño hasta quedar atrás; el fondo profundo permanece, Gaia crece por separado y se aproxima su baliza. No se funden dos pinturas para simular el viaje.

La misión requiere recuperar al menos 36 fragmentos y alcanzar el final del recorrido de 90 segundos jugados. Pausar detiene recorrido, proyectiles y recarga. Recuperar la cuota antes de llegar no termina la misión ni teletransporta la nave. La sesión natural recogió 41 fragmentos: los excedentes del suministro pueden recogerse durante el vuelo restante.

Tres cruces de cometa se anuncian antes de aparecer y recorren una diagonal durante varios segundos. Las patrullas CH-01 usan patrones lineal, zigzag, perseguidor y tirador; conservan aviso de ataque y animaciones reales de daño/destrucción. El suministro aleatorio intenso cesa al completar la cuota para no llenar el tránsito final de obstáculos sin función.

En el tránsito aparece un emisor recuperable. Al llegar se enlaza con C9: Mira explica la adaptación y el jugador pulsa INSTALAR. La pieza queda guardada y montada bajo alas/casco. CONTINUAR lleva a Gaia con el arma instalada. Un jugador que ya tenga progreso puede repetir La Onda de Choque desde NIVELES sin borrar su partida.

## B. Reglas confirmadas y decisiones de trabajo

Requisitos del propietario: entrada unificada, salida física de Chronos, relato del ataque y CRONIUM disperso, más libertad de movimiento, tres cargas iniciales recargables y mejoras visibles con varios disparos.

Decisiones reversibles de esta entrega:

| Sistema | Comportamiento implementado |
| --- | --- |
| Pilotaje | Arrastre táctil relativo XY, sin salto inicial; segundo dedo no roba el ancla. Ratón con alternativa horizontal por hover, arrastre XY y teclado con cuatro flechas. |
| Límites | Casco original conservado; límites derivados del HUD, controles y arena. No se estrechó la colisión para favorecer el arte. |
| Cargas | Tres al iniciar, recuperación de una cada 3,6 s de juego; cambiar de arma no rellena munición. |
| Pulso | Un proyectil central, daño 1 y cadencia mínima 0,24 s. Impacta después de viajar. |
| Gemelo | Dos cañones, dos proyectiles de daño 0,7 por una carga, separación lateral y cadencia 0,30 s. Mayor cobertura; no un mero cambio de color. |
| C9 | Recuperación e instalación explícitas, gratuitas. No se introduce una tienda/economía nueva en este incremento. |
| Atlas | Conserva su enlace de pulso ilimitado durante el encuentro. La salva se fija a la posición XY anunciada, sin retarget después de avisar. |
| Viaje | Primera misión: mínimo 90 s jugados, cuota y llegada conjuntas. No se aplica este reloj a las cien rutas históricas. |
| Persistencia | Clave nueva neonCatcher.flightEquipment.v1, separada de campañas y hangar; backup idempotente de datos corruptos. Si falla guardar la pieza, no desaparece del campo. |

No se guarda un fotograma exacto a mitad de combate. Se conserva la progresión clásica por misiones y el equipamiento ya persistido. N-7/Journey no se importan por equivalencia numérica.

## C. Producción artística e integración

| Recurso runtime | Dimensiones | Tamaño | Estados y destino |
| --- | --- | ---: | --- |
| assets/chronos_flight_atlas_v1.webp |1536×1024 RGBA|314136B|Chronos intacto/roto, Gaia, atacante en aproximación/carga/disparo; primera misión.|
| assets/chronos_flight_weapons_v1.webp |1536×512 RGBA|84948B|Reposo/carga/disparo; módulo rescatable, anclajes, menú, briefing, taller y nave en partida.|
| assets/chronos_flight_space_v1.webp |768×1152 RGB|109484B|Placa espacial profunda con desplazamiento acotado, independiente de los objetos principales.|

Total nuevo: **508568 bytes comprimidos**. Estimación RGBA decodificada: **12976128 bytes,12,4MiB**; no es una medición de toda la memoria de la aplicación. Los recursos nuevos se cargan bajo demanda; no se generan cien escenarios al arrancar.

Maestros, recortes, transparencia, pivotes, fuentes originales, hashes y pipeline reproducible: [art-source/unified-flight](../../art-source/unified-flight/metadata.json). Se detectó y corrigió una desaturación de exportación; el empaquetado final conserva sRGB y separa las poses del atacante sin bordes de la celda vecina. No son simples descripciones ni PNG vacíos. Se reutilizan CH-01, las cuatro poses de onda, ocho poses de cometa, VFX de Atlas y el atlas modular de nave.

Los anclajes de los cañones quedan bajo las capas de alas, motores y fuselaje; sus bocas coinciden con el origen de los proyectiles, incluyendo el desplazamiento vertical propio de la nave. Las poses cambian geometría/preparación/disparo; dibujar un fotograma no emite disparos. El taller muestra la configuración instalada, no un icono pegado sobre el casco.

## D. Archivos y sistemas

- Nuevos modelos: src/game/progression/chronos-flight.js, src/game/combat/classic-weapons.js, src/game/ship/flight-controls.js. Sin RAF propio, guardado ni render paralelo.
- Fuentes legacy: 00 (misión),01 (estado/loader),02 (límites/resize),03 (ruta, HUD, taller y encuentro),04 (captura/colisión/disparo),05 (actualización),06 (capas del viaje),07 (montajes/proyectiles),08 (entrada y bootstrap).
- src/game/progression/legacy-content-entry.js exporta interfaces pequeñas; src/game/combat/guardian-atlas.js conserva la dirección anunciada con la Y real.
- index.html, preview/launcher.html y styles.css: entrada principal, archivo QA cerrado, interfaz de recorrido, instrucciones y taller responsive.
- ASSET_MANIFEST.json, ASSET_PRODUCTION_150.json, animation-map.js y sw.js:76 recursos reales/6747610B;153 registros editoriales conservando los150 históricos; nueva revisión de caché. Los registros nuevos siguen IN_REVIEW.
- package.json y pruebas: tres suites puras y nueve casos de integración. Se actualizan contratos antiguos de munición/control, sin borrar la cobertura de los guardados, del ciclo ni de la progresión.
- game.js, content-runtime.js y copias www/iOS regenerados mediante build. Los tres game.js runtime coinciden; la preview aplica además su transformación documentada de almacenamiento/anuncios y tiene una huella propia.

## E. Pruebas y evidencias

| Ejecución | Resultado final | Código |
| --- | --- | ---: |
| npm run build |Compilación correcta, tres copias sincronizadas|0|
| npm run test:engine |40/40|0|
| npm run test:architecture |6/6|0|
| npm run test:content |150/150, incluidas9 pruebas nuevas legacy|0|
| npm run test:static |13/13|0|
| npm test |33/33|0|
| node tests/run-v7-web-tests.mjs |13/13|0|
| Render/adaptadores experimentales |14/14, sin activarV1|0|
| Audio lifecycle |3/3|0|
| Visual artpass |12/12|0|
| node scripts/audit-asset-inventory.mjs |76 runtime, cero inconsistencias|0|
| npm run build:preview |Paquete limpio, SHA375d0e9|0|
| npm run test:preview |23/23 en paquete final, incluyendo6regresiones de caché|0|
| unified-flight-layout-smoke, layout05 |12/12 en390×844,320×568,844×390;12 capturas|0|
| unified-flight-browser-smoke, natural01 |5/5 grupos;14 capturas, primera misión completa, C9 y disparos en Gaia|0|

[Certificación02, comandos exactos/duraciones/SHA/estado Git y códigos](evidence/unified-flight/certification-02/results.json). [Preview y build limpio](evidence/unified-flight/package-375d0e9/preview-tests.txt). [Chromium tres tamaños](evidence/unified-flight/browser-layout-05/results.json). [Partida natural completa](evidence/unified-flight/browser-natural-01/results.json).

La partida natural no escribe salud, tiempo, enemigos, recogidas ni guardados: el piloto automatizado usa los controles reales y un hook de lectura. Duración total 194,701 s; primera misión 90,0046 s jugados,41 fragmentos, casco100%,18 disparos. Se verificó la recarga, la pausa, el rescate, la instalación, dos proyectiles por carga y la persistencia después de recargar la página. No equivale a una partida humana ni a aprobación artística. En todos los recorridos aprobados se registraron cero errores JS/consola/recursos y máximo un RAF pendiente.

Las pruebas JSDOM son controladas y separadas. La certificación inicial falló en fixtures antiguos y se conserva. No se ejecutó npm ci: dependencias/lockfile no cambiaron y se conservaron las herramientas de navegador instaladas en el entorno. No se ejecutaron Xcode, compilación nativa, Safari/iPhone físico, benchmark GPU ni juego remoto autenticado.

## F. Fallos encontrados y correcciones

1. Se perdió el retorno booleano al conectar fireManualShot: corregido para devolver el resultado real. Las pruebas ahora avanzan el tiempo de juego para esperar cooldown/recarga, en lugar de modificar internamente el modelo nuevo.
2. DOMRect incompleto en un fixture producía controlsTop no finito: se completó el rectángulo simulado. No se ocultó la validación del producto.
3. El primer Chromium detectó classicCometSequence/classicCometWarning sin declaración. Corregidas en57b468d y repetidos arranque, tres tamaños y partida natural. JSDOM no detectó ese fallo; se conserva como prueba de la necesidad del navegador real.
4. La prueba de reinicio exigía progreso exactamente0 después de un clic real; ya habían transcurrido milisegundos legítimos. La aserción exige ahora reinicio cercano a0 y menor que el recorrido anterior.
5. La prueba de visibilidad antigua contaba enlaces dentro de details cerrado; se corrigió la comprobación y se conserva el archivo QA.
6. Se corrigieron el origen de las armas y la retícula de Atlas para coincidir con montajes/posición anunciada. La bala conserva la Y fijada, no la nueva posición de la nave.
7. Una escritura fallida no consume la pieza. Datos corruptos se respaldan antes de sobrescribir; si el respaldo falla se bloquea la escritura y el recurso permanece recuperable.

Todos los intentos se conservan: certification01, targeted02, legacy-integration01–03 y browser-layout01–05. Los últimos registros aprobados identifican exactamente el artefacto probado. No se retiraron suites fallidas para obtener verde.

## G. Galería real del ejecutable

Las siguientes imágenes proceden de la partida natural, no son concept art:

- [Salida de Chronos](evidence/unified-flight/browser-natural-01/01-chronos-start.png).
- [Ataque al reactor](evidence/unified-flight/browser-natural-01/03-attacker-firing.png).
- [Chronos roto](evidence/unified-flight/browser-natural-01/04-chronos-ruptured.png).
- [Montaje real en C9](evidence/unified-flight/browser-natural-01/13-c9-twin-installed.png).
- [Disparo gemelo en Gaia](evidence/unified-flight/browser-natural-01/14-gaia-twin-flight.png).
- [05-chronos-receding.png](evidence/unified-flight/browser-natural-01/05-chronos-receding.png).
- [06-diagonal-comet.png](evidence/unified-flight/browser-natural-01/06-diagonal-comet.png).
- [07-deep-space.png](evidence/unified-flight/browser-natural-01/07-deep-space.png).
- [10-gaia-approach.png](evidence/unified-flight/browser-natural-01/10-gaia-approach.png).

Comparación: [galería anterior conservada](../visual-rebirth/GALERIA_10_NIVELES.md). Si una captura anterior no coincide en fase/posición, no se presenta como comparación idéntica píxel a píxel. La evidencia nueva permite seguir la estación en varias escalas dentro de la misma partida.

## H. Rendimiento y límites

RAF observado en la sesión natural: media 23,04/s, mediana por ventanas 9,85/s, mínimo 4,85/s y máximo 60,23/s. La salida/ruptura es más lenta en el Chromium por software del host; tránsito y aproximación rondaron 60/s. Son observaciones de este entorno y esta sesión, no resultados de iPhone ni una certificación de60FPS. No se midió heap ni memoria GPU. El peso comprimido nuevo es0,51MB y la memoria RGBA estimada12,4MiB; el resto de recursos añade su propio coste.

Prioridad de rendimiento pendiente: perfil de salida en dispositivo y de dibujo/resampling, carga y memoria; no bajar calidad artística ni activar otro motor a ciegas. El controlador mantiene delta no negativo y acotado, por lo que este host lento no acelera la simulación ni la recarga.

## I. GitHub, paquete y publicación

- Conservación WIP: b9569744d626331eb62029e7c77d0deba4a5f36e.
- Corrección de arranque/seguimiento:57b468dee4740a7aa84a845ac8b2c84b4a98d0c0.
- QA y paquete limpio:375d0e9e013f5cfdcda5f039c3264d38e2c3f5dc. Publicados mediante push normal a la rama autorizada, sin force push.
- No se modificaron main, PR3, producción Netlify ni firmado/publicación iOS. USE_ENGINE_V1=false y el RAF legacy sigue siendo el único propietario.
- ZIP: [neon-catcher-vuelo-unificado-375d0e9.zip](evidence/unified-flight/package-375d0e9/neon-catcher-vuelo-unificado-375d0e9.zip),6944223B,112 entradas; CRC y contenido byte a byte comprobados.
- SHA-256 ZIP:86f03c77af404696df9d897e126c8400944f8b7fb937f5abb44e6e663d0debed.
- Revisión:76f62007bd212e9a373f3b753740a4232a4aa2b376aff95f1df2468e02a8005d.
- Hash preview juego:6fcee2ee6478d97e9d54661847cf35c6ae28d633291fc91f08dd6e1c9da3f7fd, idéntico al de Chromium natural.
- Fuente del sitio de distribución:1b9640b0a693c323d7d18fd31ec1ee5e0bbcf53b; repositorio Sites separado. Se cotejaron sus112 archivos con preview-dist antes de subirlo.

**Prueba privada publicada:** https://neon-catcher-pruebas.chictide18.chatgpt.site . Sites confirmó succeeded el17/10/2026 a13:00:12 UTC. Se preservó la audiencia del propietario; puede requerir acceso a ChatGPT. [Respuesta nativa sin credenciales](evidence/unified-flight/package-375d0e9/site-deployment.json). No se afirma haber jugado remotamente desde Safari: la partida natural se ejecutó localmente con el paquete idéntico publicado.

Netlify no recibió un nuevo despliegue. La antigua deploy-preview3 sigue correspondiendo a la PR3 y no demuestra esta revisión. Alternativa Netlify Drop: extraer el ZIP y cargar la carpeta cuya raíz contiene index.html, build-info.json y juego/, sin añadir un directorio envolvente.

## J. Cómo revisar

1. Abrir la prueba privada y elegir CONTINUAR VIAJE. Si existe progreso anterior, NIVELES → La Onda de Choque → INICIAR EXPEDICIÓN.
2. Arrastrar la nave en dos ejes y observar ataque/ruptura, escala de Chronos y entrada en espacio profundo. DISPARAR muestra las tres cargas y su recarga.
3. Rescatar la pareja de emisores señalizada en el tránsito y recuperar CRONIUM. Alcanzar la baliza además de la cuota.
4. CONTINUAR abre C9. Pulsar INSTALAR EMISOR GEMELO y continuar a Gaia. ARMA permite alternar central/gemelo sin recargar gratuitamente.
5. HANGAR conserva naves y piezas. El archivo QA del selector conserva variantes antiguas y desbloqueos; no hace falta abrirlo para jugar el viaje principal.

## K. Organigrama y continuidad

Fuente única de tareas: production-tasks.json; checklist/progreso regenerados con update-production-progress. Se añadió P1-FLIGHT-01 sin reiniciar el backlog. Catálogo153, registro total282tareas con estados verificables; sus proporciones no son un porcentaje comercial de juego terminado. P1-FLIGHT-01 queda IN_REVIEW con técnica aprobada, arte PENDING_OWNER y físico PENDING.

No se declaran terminados cien niveles ni diez niveles visualmente completos. Primer tramo completo integrado y probado; arte definitivo por estados, otros enemigos/jefes, geografía de las demás misiones, economía, historia completa y audio final siguen pendientes. La decisión del MotorV1 permanece reservada al propietario.

## L. Siguiente bloque exacto

1. Revisar con el propietario el viaje y las armas desde el sitio ya disponible; trabajar entretanto en QA, perfilado y recursos independientes.
2. Medir la salida en Safari/iPhone, safe areas, reentrada y memoria; optimizar la composición con evidencia. Sin acceso físico, dejar la matriz pendiente.
3. Extender continuidad espacial a Gaia y enlazar su patrulla, recuperación y Atlas mediante objetivos/hitos propios, conservando la semilla/versiones antiguas.
4. Diseñar un tercer armamento con función diferente y recurso ilustrado modular, sin multiplicar cien etapas antes de validar este bucle.
5. Construir progresivamente diez etapas reales del primer capítulo, jefes/territorios restantes y audio. El diseño editorial existente no sustituye su ejecución.

## M. Agentes e integración

Artista: generó/optimizó maestros y tres WebP, y conectó las capas del viaje. Agente de armas: modelo14/14, render del montaje y Chromium natural5/5. Agente de ruta: modelo13/13, manifiestos/animaciones/SW. Agente de controles: modelo9/9, límites/input y actualización de fixtures. Agente de UI: entrada única, estilos y Chromium layout12/12. Agente QA: nueve casos legacy. Root revisó arte, integró fuentes, corrigió defectos, compiló, certificó, guardó en GitHub y publicó el paquete privado. Cada propietario congeló sus archivos antes de las compilaciones de integración. Los resultados de agentes se comprobaron mediante las ejecuciones guardadas, no por su informe solamente.

## Diagnóstico adicional de regresión

N-7 real390×844,DPR3:1/1caso y6/6pasos aprobados, código0; mismo plan/semilla tras reiniciar, pausa/reanudar y un RAF. Un timestampcrudo anterior a resume quedó acotado a0sin retroceder el director. [Evidencia](evidence/unified-flight/n7-regression-02/results.json). Es un smoke, no una ruta N-7 completa.

La prueba real de actualización de workers sw-upgrade-01 falló al ver una caché anterior tras reload con un worker aúnactivating. Se conservó el fallo y se está diferenciando un estado transitorio de una respuesta antigua reabriendo la caché. No se atribuye una causa ni se declara aprobada hasta reproducirla. La publicación jugable y sus pruebas con recursos frescos no certifican este ciclo offline.

## Cierre de actualización y endurecimiento de caché

La segunda ejecución Chromium SW upgrade02 pasó3/3 tras esperar activación estable. Independientemente, seis pruebas deterministas nuevas reprodujeron una reapertura ante limpieza concurrente: una respuesta de un worker antiguo abría su caché por nombre después de terminar la red y la recreaba tras la limpieza del nuevo worker. Antes del arreglo3/6, después6/6 sin modificar las pruebas.

Se corrigió sw.js para obtener el objeto Cache antes de esperar la red y reutilizarlo tanto en escritura como en fallback. La activación espera limpieza antes de claim y la instalación espera precarga antes de skipWaiting. build-preview conserva el mismo objeto al adaptar el fallback de índice al scope; el launcher ya seguía ese patrón. No cambia ningún byte de la lógica de viaje/combate. La nueva suite queda incluida en test:preview. Chromium CacheStorage real confirmó el antes/después ante eliminación controlada: código anterior recrea exactamente la entrada retenida; código corregido4/4, código0. La actualización normal de Chromium espera las solicitudes previas y no reprodujo ese intercalado; se probó por separado3/3 con ambos workers activados, caché vieja ausente, caché ajena conservada y navegación offline. No se afirma que el caso controlado sea una carrera observada en una actualización normal.

### Dictamen final del QA offline

- N-7:6/6 pasos reales aprobados.
- SW upgrade-fixed-03:3/3, código0,68,619s; espera asíncrona real, dos scopes, limpieza propia, caché ajena, juego y selector sin conexión.
- CacheStorage real con limpieza provocada: unlink-old-01 fallo esperado3/4; unlink-fixed-01 aprobó4/4,código0. La limpieza se dispara desde QA, no se llama activación real.
- El fixture de activación con respuesta retenida no llegó a reproducir ese orden: Chromium pospone la activación. Se conserva el intento y su timeout como límite del fixture, no como defecto del juego.
- Se detectó además que la versión instalada de waitForFunction aceptaba Promise como verdadero sin esperar false. Los dos scripts de SW ahora esperan page.evaluate desde Node con tiempos acotados. Las capturas/fixtures de juego usan predicados síncronos y no dependen de ese error. Se guardan los scripts exactos ejecutados antes de añadir límites diagnósticos finales.
- Certificación03 repetida tras el endurecimiento:11/11 fases, contenido150/150 y el resto sin regresiones; preview ampliado23/23, incluido el nuevo contrato de generación. El juego, arte, controles y estilos conservan los mismos bytes que la partida natural aprobada.

## ACTA FINAL DE PUBLICACIÓN — 17/10/2026 a 13:19:54 UTC

El paquete vigente es **2cea7af9dcec78d2e71305526bb33cc5f31752c6**, construido limpio después del endurecimiento de caché. Sustituye en el mismo sitio privado al primer paquete 375d0e9; este último se conserva como evidencia histórica de la partida natural.

- [ZIP final](evidence/unified-flight/package-2cea7af/neon-catcher-vuelo-unificado-2cea7af.zip):6944306B,112entradas,CRC y comparación byte a byte aprobados.
- SHA-256 ZIP:752e4245c56ebbc21d7a804794998bbdb318cb565493209126b87da897d37762.
- Revisión:1504618bcb9fe7d5a908e1f794098bdef8fdefc0078e2ca19862dc3ae8900068.
- 83 archivos de jugabilidad, arte y presentación comparados con el paquete de la partida natural: idénticos, incluido juegoSHA6fcee2ee6478d97e9d54661847cf35c6ae28d633291fc91f08dd6e1c9da3f7fd. El worker también coincide con la prueba CacheStorage real al sustituir únicamente su revisión de 64 caracteres. [Metadatos](evidence/unified-flight/package-2cea7af/package.json).
- Preview final23/23, código0. Certificación03: once fases aprobadas, incluido contenido150/150 y regresión33/33. No se repite una partida idéntica por cambiar solo caché/procedencia; los hashes y los casos específicos acotan esa validación.
- Sitio: **https://neon-catcher-pruebas.chictide18.chatgpt.site**. Publicación nativa **succeeded**, versión 5, audiencia privada del propietario conservada. Fuente de distribución c393a6be60c28ee026f6aef119e20693bbedf822. [Respuesta nativa](evidence/unified-flight/package-2cea7af/site-deployment.json). No se jugó remotamente en Safari ni se desplegó Netlify.
- Commit de endurecimiento45f890cdc21ab5f5b0ee6e39341e2f365d4ebd5d y cierre QA2cea7af9dcec78d2e71305526bb33cc5f31752c6, ambos publicados.

La prueba de actualización queda técnicamente aprobada en Chromium con su alcance declarado: actualización normal3/3, manipulación controlada de CacheStorage4/4 y modelos6/6. Se retira el bloqueo provisional de diagnóstico, manteniendo fallos, timeouts y scripts exactos. No se afirma que una actualización normal de Chromium reprodujera el intercalado provocado. Si un worker antiguo ya ejecuta código previo, el parche no cambia retroactivamente ese proceso; la nueva revisión consulta únicamente su propia caché.

Pendiente: aceptación estética/balance humano, rendimiento de salida en dispositivo, Safari/iPhone físico, defecto histórico de glifos del nivel10 no investigado en este lote, continuidad de las otras misiones, enemigos/jefes restantes, historia y audio final. **Cero niveles se declaran visualmente completos y cero certificaciones físicas nuevas.** Siguiente bloque: perfil de salida y continuidad de Gaia con el mismo bucle, sin activar MotorV1.
