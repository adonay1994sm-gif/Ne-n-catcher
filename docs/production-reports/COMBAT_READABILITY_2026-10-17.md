# DIAGNÓSTICO

El punto de partida fue `a787c8dcfa70064a65c07865ec1a119e29c4825d`, coincidente con la rama remota y con el cierre anterior del HUD. No había modificaciones locales ajenas que preservar. Se conservaron las mejoras posteriores al mandato histórico, la campaña clásica, N-7, el prototipo archivado, los guardados y el renderizador legacy.

Los defectos concretos eran: gemelo abierto y con daño individual reducido; Atlas señalaba explícitamente su corredor seguro; el nivel 3 utilizaba una caldera como escenario; orbes demasiado grandes; escudo poco reconocible; transiciones reducidas y poco legibles. Se implementó este lote sobre las fuentes actuales, sin ampliar capítulos ni activar el motor reservado.

# INFORME DE PRODUCCIÓN — NEON CRONIUM

Fecha: 17 de octubre de 2026. Publicación comprobada: 19:31:54 UTC.

Rama: `continuity-assets-audit-20261013`.

SHA inicial: `a787c8dcfa70064a65c07865ec1a119e29c4825d`.

SHA funcional probado: `be8e613cc65f9f3b75ca545c9d411c0afe6334c1`.

SHA del paquete final limpio: `d93b1352c9a036ccec0fc6337b02e41acd8a7832` (`dirty:false`). Los commits documentales posteriores no cambian este paquete; el cierre publicado se registra en [closure.json](evidence/combat-readability/closure.json).

Bloques trabajados: combate, presentación y QA de P1; Bloques 03–05. Niveles 2 y 3 de forma directa; armas/orbes/escudo y transiciones son compartidos por la clásica. No se reconstruyeron cien etapas.

Tareas verificadas técnicamente: seis incrementos, todos `IN_REVIEW` hasta aceptación artística del propietario y pruebas físicas. Ningún nivel se declara visualmente completo.

Pruebas aprobadas: 11/11 fases locales; contenido179, motor40, arquitectura6, estáticas13, regresión33, web13, adaptador experimental14, audio3, arte12, inventario80; preview23. Chromium: HUD26, integración8 grupos válidos y suplemento3, partida Gaia/Atlas4, N-7 una sesión con6 pasos, caché3.

Pruebas fallidas conservadas: primera certificación, una aserción histórica; primer test de preview con SHA anterior; última aserción del primer harness de presentación, que exigía ausencia de desplazamiento. Los tres motivos y sus verificaciones posteriores figuran abajo. No quedan fallos de ejecución de producto identificados por estas pruebas.

Assets nuevos integrados: tres exportaciones runtime, dos ilustraciones orbitales y un atlas de cuatro estados del campo de fuerza. Catálogo155, inventario runtime80; esto no representa155 recursos terminados.

Estado Netlify: sin nuevo despliegue y sin cambios de producción. La entrega usa el sitio privado ya existente de Sites, versión8, `succeeded`.

Estado del motor: `USE_ENGINE_V1 = false`, propietario único del RAF legacy. No se eliminaron ni migraron los módulos experimentales.

Estado general: entrega de correcciones técnicamente verificada y publicada para revisión. Aceptación estética, Safari/iPhone y rendimiento sostenido pendientes.

Próxima prioridad: revisar esta versión jugando en el dispositivo del propietario; después abordar el siguiente escenario espacial y ampliar encuentros/armas en lotes pequeños, manteniendo la progresión y sin generalizar arte pendiente de aceptación.

Tiempo: no se atribuyen horas de producción no medidas. Los JSON contienen fechas, duración de cada ejecución y reloj de simulación; no deben confundirse entre sí.

## Experiencia disponible y decisiones de diseño

1. **Gemelo centrado.** Dos pulsos paralelos nacen a±10px del eje, con1 de daño cada uno: ×2 por carga si impactan ambos. Se eliminaron la apertura lateral y la reducción a0,7 de daño. Los emisores ilustrados siguen anclados a las alas; un destello de convergencia conecta sus bocas con la salida central. No se cambió el contorno de colisión de la nave.
2. **Tres armas legibles.** Pulso×1, gemelo×2 y nueva lanza×3. La lanza tiene velocidad1280, cadencia0,48s y atraviesa hasta dos objetivos distintos; cada objetivo recibe daño una sola vez. Su aspecto reutiliza los seis fotogramas ilustrados del phaser, con proporción y velocidad propias. No se presenta como un atlas nuevo.
3. **Progresión de la pieza.** Tras recuperar e instalar el emisor, C9 ofrece «CALIBRAR LANZA ×3». Es una decisión de trabajo reversible: adaptación gratuita de la misma pieza, sin moneda nueva ni transacciones reales. El botón de arma muestra el multiplicador y permite alternar los modos desbloqueados. C9 explica el daño por carga.
4. **Batería coherente.** Las tres armas comparten3 cargas y recuperan una cada3,6 segundos jugados, también en Atlas. Cambiar de arma no rellena la batería, reinicia el tiempo ni evita la cadencia. El phaser temporal sigue siendo una habilidad separada.
5. **Atlas más exigente.** Conserva36 de integridad, animación y resolución narrativa. La primera fase lanza5 proyectiles; la segunda alterna cortinas dobles y fuego cruzado. Se revisaron velocidad, avisos, recuperación y separación entre cortinas para permitir maniobras con la silueta real. La carga se ve en sus armas; no se pinta «RUTA LIBRE», una franja resuelta ni la posición futura del jugador. Los corredores internos del modelo sirven a la transitabilidad, no a la interfaz ni al piloto de QA.
6. **Orbes a mitad de tamaño.** Escala visual0,5 incluyendo aura y sombra en la clásica. Radio de captura, tractor, cuota, recompensas y representación de N-7 se mantienen. Un disparo no recoge automáticamente los orbes: se recuperan pilotando o mediante el tractor.
7. **Escudo integrado.** Campo ilustrado transparente que envuelve casco y alas: activación200ms, mezcla estable/pulso de1,2s e impacto180ms. La absorción conserva el daño y la recompensa únicos existentes. Sus estados dependen del reloj jugado y se congelan en pausa.
8. **Vulkar desde el espacio.** Fondo orbital y planeta transparente independientes, con deriva a distinta profundidad, rotación suave y restos ilustrados. El avance de recogida aproxima el planeta; `elapsed` gobierna el movimiento y se detiene en pausa. Se actualizó la descripción a órbita exterior. La ilustración antigua queda en disco e historial. Lava/erupciones de superficie animadas y una animación completa del resto de mundos siguen pendientes.
9. **Transiciones legibles.** Las diez misiones muestran ilustraciones reales en un área de170–220px, nombres de24–30px y controles de al menos44px. El panel desplaza en pantallas pequeñas, sin empequeñecer toda la UI. Victoria muestra el arte de la escena actual. El HUD compacto anterior mantiene82px de franja superior en390×844.

## Integración y conservación

Se modificaron los módulos `00`, `01`, `03`, `04`, `05`, `06` y `07` de `src/game/`, los modelos `combat/classic-weapons.js` y `combat/guardian-atlas.js`, el mapa de animación, `index.html`, `styles.css`, `sw.js`, manifests, pruebas y herramientas de navegador. El build regeneró `game.js`, `content-runtime.js` y sus copias web/iOS; no existen parches exclusivos de los bundles.

La nueva lanza amplía de forma aditiva el perfil `neonCronium.flightEquipment.v1`: `lanceCalibrated:true` solo se guarda al calibrar. Los perfiles v1 anteriores conservan forma y comportamiento. Una selección de lanza sin calibración o sin gemelo se respalda como inválida, sin conceder armas. Las claves de campaña y N-7 permanecen separadas; los tests comprueban sus valores después de recargar.

No se alteraron main, PR#3, el guardado de niveles ni la geometría física para ajustar el dibujo. No hubo force push, anuncios reales, pagos ni publicación móvil. La rama interna del repositorio independiente de Sites no es main del repositorio del juego.

Relación completa de archivos del lote: [files-changed.json](evidence/combat-readability/files-changed.json). Maestros y variantes anteriores permanecen recuperables.

## Assets y animaciones

| Recurso | Maestro / ficha | Runtime | Tamaño | Memoria RGBA estimada |
| --- | --- | --- | --- | --- |
| Espacio y refinería orbital de Vulkar | `art-source/combat-readability/vulkar/background-master.png`, `metadata.json` | `assets/vulkar_orbit_background_v1.webp` |768×1152 RGB;84274B |3538944B |
| Planeta Vulkar independiente | `art-source/combat-readability/vulkar/planet-master.png`, `metadata.json` | `assets/vulkar_orbit_planet_v1.webp` |640×640 RGBA;147122B |1638400B |
| Campo de fuerza | `art-source/combat-readability/shield/force_shield_generated_master.png`, `force_shield_atlas_master.png`, fichaJSON | `assets/force_shield_atlas_v1.webp` |1536×384 RGBA;4 celdas384²;319358B |2359296B |

El atlas normalizado maestro del escudo mide2048×512; sus cuatro estados son distintos y comparten pivote. Runtime: pivote(192,192); planeta: pivote(0,5;0,5). El borde del escudo ocupa una parte de cada celda; su escala en juego considera esa extensión para rodear la nave.

Procedencia: generación con la herramienta de imágenes disponible, sin adquirir servicios ni licencias externas; prompts, exportación, hashes, alfa y observaciones en las fichas. Esto acredita procedencia registrada, no una opinión jurídica ni aceptación estética. Se reutilizan los identificadores `shared-shield` y `vulkar-planet`; solo se añade `vulkar-orbit-background-v1` como secuencia155. Las versiones previas figuran en `legacyVersions`.

`ASSET_MANIFEST.json` registra80 recursos/7737022B:58READY y22IN_REVIEW a nivel de inventario. El catálogo de producción contiene155 entradas:119PLANNED,33IN_REVIEW,2IMPLEMENTED_CODE y1READY. Estos estados no equivalen al cierre artístico de un nivel.

## Pruebas y evidencias

Las ejecuciones iniciales de navegador usaron un paquete de trabajo con HEAD histórico y cambios locales declarados. El código de juego, contenido y estilos coincide byte a byte con el paquete limpio final; véase [equivalencia final](evidence/combat-readability/package-d93b135/runtime-equivalence.json). Los parámetros de procedencia, workers y `build-info.json` corresponden después al commit limpio.

| Comando / alcance | Resultado | Evidencia |
| --- | --- | --- |
| `node scripts/certify-local.mjs …/certificate-02` |11/11 fases, salida0; contenido179/179; resto de cifras en cabecera |[JSON](evidence/combat-readability/certificate-02/results.json), logs por fase |
| `node --test tests/unified-flight-legacy.test.mjs tests/guardian-atlas-legacy.test.mjs` |28/28, salida0 después de actualizar el contrato de cinco proyectiles |[Log](evidence/combat-readability/integration-fix-01.txt) |
| `npm run build:preview` y `npm run test:preview` sobre d93b135 limpio |Build0;23/23, salida0;115 archivos declarados más build-info |[Build](evidence/combat-readability/package-d93b135/build-preview.txt), [tests](evidence/combat-readability/package-d93b135/preview-tests.txt) |
| `node scripts/compact-hud-browser-smoke.cjs --root preview-dist --output …/compact-browser-01` |26 grupos,5 tamaños, salida0;10 escenas abiertas y controles táctiles reales |[JSON](evidence/combat-readability/compact-browser-01/results.json) |
| `node scripts/combat-readability-smoke.cjs --root preview-dist --output …/browser-01` |8/9 grupos, salida1; última aserción exigía botón visible sin scroll |[JSON y harness exacto](evidence/combat-readability/browser-01/results.json) |
| Mismo script `--supplement-only`, salida `…/browser-supplement-02` |3/3, salida0; scroll táctil de briefing/C9, controles y escudo durante playing |[JSON](evidence/combat-readability/browser-supplement-02/results.json) |
| `node scripts/guardian-atlas-browser-smoke.cjs --root preview-dist --output …/atlas-natural-01 --timeout 600000 --weapon twin` |4/4, salida0; victoria y continuación naturales mediante puntero/controles |[JSON](evidence/combat-readability/atlas-natural-01/results.json) |
| `node scripts/content-browser-smoke.cjs --root preview-dist --output …/n7-01 --profile 390x844 --mode n7` |1 sesión,6 pasos, salida0 |[JSON](evidence/combat-readability/n7-01/results.json) |
| `node scripts/preview-sw-upgrade-smoke.cjs --root preview-dist --output /tmp/neon-combat-final-package/sw-upgrade-01` |3/3, salida0: actualización de dos workers, limpieza limitada a sus cachés y navegación offline |[JSON conservado](evidence/combat-readability/sw-upgrade-01/results.json) |
| `node scripts/update-production-progress.mjs --check` |Salida0 tras reconciliar el catálogo de155 recursos |Checklist y resumen generados desde el registro principal |

Las rutas abreviadas `…` en la tabla significan `docs/production-reports/evidence/combat-readability`. Los JSON guardan los argumentos exactos, hashes y estado del árbol. `npm ci` no se repitió: no cambiaron las dependencias ni el lockfile y las herramientas instaladas permitieron compilar y probar. No se ejecutaron Safari, dispositivo físico, Xcode, TestFlight ni certificación remota de GitHub Actions de este lote.

### Partida real, límites y comparación

El piloto empezó con un **perfil gemelo instalado declarado**, no recuperó esa pieza de forma natural en esta sesión. Sí recogió los45 fragmentos de Gaia, evitó amenazas con inputs, disparó, pausó/reanudó, venció ambas fases y continuó mediante la UI a Vulkar. No insertó enemigos, cambió el reloj, asignó casco, saltó cuota ni concedió victoria. Su hook no expone `safeGap` ni las coordenadas ocultas del objetivo: estima esquivas con las balas observadas y el contorno completo.

Resultado:108,426s de simulación para completar Gaia, guardián presente unos58s;462486ms hasta completar la partida,488029ms de ejecución con la continuación y recarga. Se observaron96 proyectiles. Casco final66%; el daño registrado sucedió durante la recogida. Esto demuestra un recorrido ejecutable, no una evaluación humana de dificultad ni la derrota del jefe con todas las configuraciones.

Las pruebas controladas sí verifican daño exacto×1/×2/×3, batería, perforación sin duplicar daño, compatibilidad de perfiles, escala visual del orbe frente a su captura, absorción y pausa del escudo, dos capas orbitales y ausencia de la solución visual de Atlas. No sustituyen la partida natural ni certifican recogidas naturales de todos los poderes.

### Fallos y correcciones conservadas

- `certificate-01`:178/179 de contenido, una aserción esperaba la andanada antigua de3. Se cambió a5 y al índice central2, conservando comprobaciones de objetivo y trayectoria. `certificate-02` pasa179/179 y las otras10 fases.
- `preview-tests-01.txt`:22/23; el paquete de trabajo todavía identificaba a787c8d después de crear be8e613. Se reconstruyó desde d93b135 limpio;23/23 pasan. No se ocultó el fallo de procedencia.
- `browser-01`:8/9; el harness exigía que el botón de lanzamiento entrara sin desplazar un briefing ampliado. La UI sí desplazaba. El suplemento verifica swipe real, botón accesible y tamaño táctil en320×568 y844×390. No se redujo la ilustración para conseguir verde. El primer suplemento ya pasó3/3; el segundo refuerza el scroll real de C9 y la visibilidad del último botón.
- El generador de documentación rechazó una referencia histórica con un array donde esperaba una cadena. Se normalizó el registro y se conservaron las referencias restantes en `relatedEvidence`; `--check` pasa. El juego no dependía de ese campo.

## Galería auténtica

Todas estas imágenes son capturas del ejecutable en Chromium. Los masters de arte son recursos de producción separados.

| Revisión | Antes / después / evidencia |
| --- | --- |
| Nivel3, composición |[Antes: caldera](evidence/compact-hud/after-05/390x844-vulkar.png) · [Después: órbita](evidence/combat-readability/compact-browser-01/390x844-vulkar.png) |
| Campo de fuerza durante juego |[Escudo activo, sin ocultar interfaz ni pausar](evidence/combat-readability/browser-supplement-02/07-force-field-stable-live.png) |
| Atlas |[Aviso en las armas](evidence/combat-readability/atlas-natural-01/03-atlas-warning.png) · [Segunda fase](evidence/combat-readability/atlas-natural-01/04-atlas-phase-two.png) · [Victoria](evidence/combat-readability/atlas-natural-01/06-gaia-victory.png) |
| Transición a Vulkar |[Briefing real tras Atlas](evidence/combat-readability/atlas-natural-01/07-vulkar-briefing.png) · [Vuelo tras continuar](evidence/combat-readability/atlas-natural-01/08-vulkar-after-atlas.png) |
| Pantalla pequeña |[Briefing con controles accesibles](evidence/combat-readability/browser-supplement-02/02-briefing-vulkar-320x568-controls.png) · [C9 después de deslizar](evidence/combat-readability/browser-supplement-02/06-c9-320x568-controls.png) |
| Diez escenas |[Capturas de apertura y layout](evidence/combat-readability/compact-browser-01/results.json); esto no acredita diez niveles completos |

No se afirma haber capturado el frame exacto de impacto180ms del escudo: el estado y su reloj se comprobaron mediante instrumentación, y la captura publicada muestra su estado estable vivo.

## Rendimiento y recursos

Los tres recursos nuevos suman550754B comprimidos. Memoria adicional estimada si están decodificados juntos:7536640B, aproximadamente7,19MiB, sin incluir superficies de Canvas/GPU ni los recursos anteriores. Carga diferida y atlas compartidos; no se cargan cien escenarios nuevos.

Muestra corta final de Chromium software:31 frames en1240,5ms,24,99FPS; heap JavaScript6,11→6,53MB. No es una prueba prolongada ni memoria total del proceso; no demuestra una fuga,60FPS o rendimiento de un iPhone. El tiempo de carga depende del entorno y está registrado por navegación/grupo en los JSON; no se ofrece una cifra general a partir de varias sesiones paralelas.

Se conserva un único RAF. Las pruebas de controles, reinicio, pausa y campañas observan ese propietario; el suplemento de FPS cuenta sus callbacks, no crea otro bucle de juego.

## Paquete y publicación

- Sitio privado: (web privada antigua, retirada) . Versión8, confirmación nativa `succeeded` a19:31:54, sin cambiar su audiencia.
- Fuente del sitio: `aefbbac7b8b5b2e647bc4fe98fa0b4cc6bb56293`.116 archivos estáticos comparados byte a byte con el paquete.
- Paquete del juego: `d93b1352c9a036ccec0fc6337b02e41acd8a7832`, revisión `3ab2e4eb9b54164b0f63eb7d7d2148cc39680f0d6cf3411f39b508f0e1d0ae53`, limpio.
- ZIP: [neon-cronium-preview-d93b135.zip](evidence/combat-readability/package-d93b135/neon-cronium-preview-d93b135.zip),7940222B,116 entradas.
- SHA-256 del ZIP: `3622b2718f35ebab2859eb54da8aaf314e72fe3e90b2d26d1ed6a2591bd8a82c`.
- [Metadatos](evidence/combat-readability/package-d93b135/package.json), [build-info](evidence/combat-readability/package-d93b135/build-info.json), [publicación](evidence/combat-readability/package-d93b135/site-deployment.json).

Uso: CONTINUAR VIAJE → NIVELES para repetir Gaia o Vulkar si están desbloqueados. C9 permite instalar el emisor rescatado y calibrar la lanza; el botón inferior izquierdo alterna armas. Para desbloquear todas las escenas solo para QA, abrir el desplegable de pruebas del selector inicial y marcar la opción correspondiente. El guardado de esta prueba está aislado del juego ordinario.

Alternativa local/Netlify manual: extraer el ZIP en una carpeta vacía y servir su raíz por HTTP; contiene selector, `juego/`, workers y configuración de preview. Puede subirse a un destino Netlify de pruebas nuevo e inequívoco, nunca al principal. No se realizó ese despliegue. Sites fue verificado por el resultado nativo terminal, no mediante una petición anónima ni una elusión de acceso privado.

## GitHub, organigrama y continuidad

Commits funcionales y de QA publicados en la rama autorizada:

- [be8e613](https://github.com/adonay1994sm-gif/neon-cronium/commit/be8e613cc65f9f3b75ca545c9d411c0afe6334c1): integración, arte, modelos y pruebas.
- [8364ecc](https://github.com/adonay1994sm-gif/neon-cronium/commit/8364ecc): evidencias y registro de seguimiento.
- [d93b135](https://github.com/adonay1994sm-gif/neon-cronium/commit/d93b1352c9a036ccec0fc6337b02e41acd8a7832): normalización del esquema histórico y paquete limpio.

El cierre documental posterior y su comprobación remota figuran en `closure.json`; no se reutiliza una URL antigua como prueba del commit nuevo. La versión8 está vinculada a la fuente y paquete indicados.

Registro principal: `docs/production-tasks.json`. Total292 tareas:23DONE,54IN_REVIEW,4IN_PROGRESS,204PENDING y7BLOCKED. Se añaden seis incrementos actuales `P1-COMBAT-02`, `P1-ATLAS-02`, `P1-ORBS-01`, `P1-SHIELD-01`, `P1-VULKAR-01` y `P1-TRANSITIONS-01`, todos técnicamente comprobados y pendientes de aceptación artística/física. No se transforma el23/292 en un porcentaje comercial ni se reinicia el historial.

Decisiones reservadas: aceptación estética del propietario e integración del MotorV1. Pendientes abiertos: glifos intermitentes ya documentados, rendimiento sostenido, Safari/iPhone físico, animaciones y enemigos finales de los otros mundos, revisión humana del balance de todas las armas. Esta entrega no demuestra que todos ellos estén resueltos.

Siguiente trabajo exacto: recoger la revisión jugada de la versión8; reproducir cualquier incidencia con sus controles y viewport, conservar capturas y corregirla. Después integrar el siguiente escenario orbital mediante capas reales, enemigo y encuentro propios, manteniendo el motor apagado y evitando producir masivamente etapas sin validar esta base.
