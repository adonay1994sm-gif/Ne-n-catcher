# DIAGNÓSTICO

El propietario considera Chronos muy avanzado y pide pulir su integración antes de ampliar la historia: espera excesiva en C9, nube de humo sobre la nave, proyectil izquierdo desviado, enemigos que abandonan el combate, Atlas poco interesante y demasiado armamento disponible antes de superar un jefe. También pide disparo automático apagado y configurable exclusivamente desde Ajustes.

El diagnóstico confirmó cuatro causas concretas. C9 aparecía a los 162 s de recorrido y no abría el taller hasta los 214 s; las guías diagonales de los emisores y los rayos dirigidos instantáneamente hacia Atlas no coincidían con los proyectiles verticales del campo; la nave modular heredaba una capa de humo de la presentación anterior; y el taller concedía Gemelo y Lanza antes de una victoria fronteriza. Las patrullas necesitaban frenar, conservar una posición de combate y volver a atacar, manteniendo avisos y una retirada acotada.

Este lote modifica esas integraciones sobre el clásico existente. Conserva las diez etapas Chronos → Gaia, los otros territorios, N-7, el equipamiento previamente adquirido y el Motor V1 desactivado. La certificación automatizada del SHA funcional está aprobada, incluida GitHub Actions. Las pruebas naturales de combate y las comprobaciones finales de publicación se detallan separadamente; no se deducen de los tests de lógica.

# INFORME DE PRODUCCIÓN — NEON CRONIUM

- **Fecha:** 18/10/2026, UTC. No se atribuyen horas de trabajo no registradas. Los JSON conservan los tiempos reales de cada proceso.
- **Rama:** `continuity-assets-audit-20261013`.
- **SHA inicial:** `c4d528cd75bb7b40a21b693540179c0470b524ed`, local y remoto comprobados antes de modificar.
- **SHA funcional probado y publicado:** `8d651b51453c143d395d3feb8c0d5629066a72c9`.
- **SHA de corrección del observador QA:** `d37a354`; únicamente amplía el recurso observado por la prueba de actualización/offline. No cambia los bytes del juego empaquetado.
- **SHA de cierre documental:** El commit que incorpora este informe se identifica mediante `git log -1 --format=%H -- docs/production-reports/ARCADE_POLISH_BOSS_PROGRESSION_2026-10-18.md`; el recibo `evidence/arcade-polish/closure-receipt.json` conserva su SHA exacto después de publicarlo. QA: d37a354, 52af749 y 33e423c; no cambian el juego empaquetado 8d.
- **Bloques trabajados:** pulido de Chronos/C9, presentación del daño/disparo, IA de patrullas, combate manual Atlas y progresión del arsenal.
- **Niveles modificados:** clásico 1, etapas 1.1–1.10; clásico 2, Gaia/Guardian Atlas. No se declaran completos diez territorios ni cien etapas.
- **Mecánicas nuevas/rediseñadas:** atraque breve, patrullas que mantienen combate, desplazamiento protegido de Atlas, proyectiles físicos compartidos con el campo y recompensa de Gemelo ligada a vencer a Atlas.
- **Assets creados e integrados:** un atlas VFX original de 16 estados; maestro, exportación, registro de procedencia y validación de transparencia conservados.
- **Animaciones:** cuatro poses de Pulso, cuatro de Gemelo, cuatro de Lanza y cuatro de impacto; reproducción mediante la edad real del proyectil/efecto y el ciclo existente. Atlas utiliza las poses de blindaje existentes durante su movimiento protegido.
- **Enemigos:** raider, scout e interceptor con política clásica v2; Atlas revisado con dos fases. CH-03 y otros jefes no se presentan como terminados.
- **Eventos ambientales/narrativa:** se conserva el incidente Chronos y el viaje continuo. Se actualizan las comunicaciones del taller, la autorización Atlas y la recompensa; las cinemáticas Gaia → Vulkar quedan pendientes.
- **Audio:** sistema existente conservado; no hay nuevo catálogo musical ni grabaciones en este lote.
- **Pruebas aprobadas:** 11/11 fases locales; 551 casos automatizados por suites, más 23/23 de preview; actualización/offline real 5/5. Actions del SHA funcional: `completed/success`.
- **Pruebas fallidas o interrumpidas:** primer observador offline falló por no reconocer el atlas nuevo y se corrigió sin cambiar el juego. Tres procesos naturales iniciales fueron detenidos por el coordinador debido a carga de CPU, salida 130; no se certifican como partidas aprobadas.
- **Errores corregidos:** espera de C9, humo heredado, guías diagonales de disparo, rayos dirigidos hacia Atlas, patrullas que escapaban del intercambio, AUTO activo por defecto, desbloqueos gratuitos y preservación/recuperación del premio ante interrupciones.
- **Errores abiertos y límites:** Atlas manual 03 aprobado 4/4: 87,3145 s de encuentro simulado, 26 activaciones, 113 proyectiles enemigos, 2 fases y casco 54; recompensa única y recarga verificadas (evidence/arcade-polish/atlas-manual-03/verified-summary.json). C9 dirigida 02 aprobada 4/4: casco 36 sin humo, Pulso vertical animado y taller a los 183,2 s. Se utilizó un fixture declarado de guardado de entrada en 1.6; no fue una campaña natural completa. Gaia engagement 02 aprobado 4/4: 10,846 s de combate sostenido y 4 ataques; no prueba la muerte del interceptor. Valoración humana de dificultad y estética, Safari/iPhone físico y rendimiento de dispositivo pendientes.
- **Estado de Netlify/publicación:** Site privado versión 17 publicado y verificado: (web privada antigua, retirada) fuente Site 6d5c560ddc80daee30dcff0c30cd1f5b3f5eb9b4, runtime 8d651b5, HTTP 4/4 y 148 archivos externos preservados. No hubo despliegue Netlify. No se modifica producción Netlify ni distribución comercial.
- **Estado del motor:** `USE_ENGINE_V1 = false`; renderizador legacy y un único propietario de RAF conservados.
- **Tareas completadas/en revisión:** seis tareas nuevas registradas como `IN_REVIEW`, separando técnica, arte y dispositivo; ninguna se cierra por existir este informe.
- **Siguiente prioridad:** perfilar la lentitud del campo durante la recogida y revisar jugando C9/IA/Atlas; después cerrar CH-03 y las escenas Gaia → Vulkar, con el próximo jefe real antes de autorizar Lanza.

## 1. Experiencia y decisiones de diseño

Los requisitos confirmados son el atraque más rápido, ausencia del humo superpuesto, disparos rectos y legibles, rivales que sostengan un intercambio, AUTO apagado y optativo en Ajustes, y progresión de potencia mediante jefes. Se mantiene la precisión de control, la recuperación de CRONIUM y el viaje visible.

La decisión de trabajo para «empezar con un disparo y conseguir el segundo» es **un cañón central Pulso → dos proyectiles Gemelo**, conservando las tres cargas recargables compartidas que ya tenía el juego. No se reduce la batería a una sola carga. Gemelo sigue sumando daño ×2 mediante dos impactos de daño 1; Lanza conserva su daño ×3 para propietarios antiguos. El taller explica la diferencia entre preparar una pieza y disponer del permiso para activarla.

Una partida nueva recupera el emisor y puede prepararlo en C9, pero continúa con Pulso. La victoria real sobre Guardian Atlas desbloquea Gemelo y lo registra una sola vez. El jugador decide cuándo equiparlo; la recompensa no cambia de arma automáticamente. Lanza no se concede gratuitamente a una partida nueva porque el siguiente jefe que deba otorgarla todavía no está implementado. No se atribuyen victorias a un jugador antiguo por el mero hecho de conservar un arma.

Las nuevas cinemáticas/historia Gaia → Vulkar no se incorporan en este lote: el propietario indicó que podían esperar mientras se pulían estas integraciones. El siguiente nivel no se considera completo por estos cambios.

## 2. Cambios integrados

### C9: llegar, mejorar y salir

Antes, la estación permanecía visible durante unos 52 s antes de abrir el taller, incluida una espera frente a ella una vez alcanzaba su escala de llegada. Ahora la aproximación visible dura **2,4 s** y el taller se abre a **183,2 s de recorrido**, cuando se alcanza el atraque. El avance se pausa durante el servicio.

Al continuar, la nave se desacopla y la estación abandona la composición en un máximo de **2,4 s**. Se conserva la etapa **1.6** como tramo de salida hasta su frontera ya existente; no se salta a 1.7 mediante un teletransporte ni se modifica la cuota de CRONIUM. Permanecen la duración total de 360 s, los offsets, los identificadores de eventos y el formato de checkpoint v2. Una recarga distingue el servicio ya resuelto y no vuelve a abrirlo ni concede dos veces la pieza.

C9 dirigida 02 aprobada 4/4: casco 36 sin humo, Pulso vertical animado y taller a los 183,2 s. Se utilizó un fixture declarado de guardado de entrada en 1.6; no fue una campaña natural completa. Gaia engagement 02 aprobado 4/4: 10,846 s de combate sostenido y 4 ataques; no prueba la muerte del interceptor.

### Nave y disparos

La nave modular deja de dibujar la antigua nube de humo superpuesta. Conserva su reacción existente de impacto/daño; la rama de presentación de respaldo no se elimina y el recurso histórico sigue recuperable. No se cambian las hitboxes para acomodar el dibujo.

Se eliminan los rayos diagonales que simulaban convergencia entre las alas y el centro. Los destellos pequeños aparecen en los puntos reales de emisión. Pulso y Gemelo utilizan proyectiles físicos verticales; las dos trayectorias de Gemelo permanecen centradas y paralelas. El atlas nuevo comparte pivote y orientación con las coordenadas físicas, en vez de estirar un recorte asimétrico anterior.

En Atlas, el disparo básico deja de convertirse en un rayo instantáneo dirigido hacia el jefe. El proyectil viaja, puede fallar y comprueba la colisión contra el objetivo al llegar. Un impacto contra blindaje consume el disparo pero no concede daño; la vulnerabilidad se evalúa en ese momento. La habilidad temporal de fáser recogida en el campo conserva su contrato propio y no equivale a activar AUTO.

### Patrullas con intención

La política `classic-pursuit-v2` utiliza entrada, frenada, seguimiento, carga, disparo, reposicionamiento y retirada. El rival reduce su avance al alcanzar una banda visible de combate, vuelve a adquirir una posición y realiza varios ataques anunciados. Scout, raider e interceptor conservan perfiles distintos de aviso, recuperación y flanqueo.

El objetivo queda fijado durante la preparación del ataque; el proyectil no persigue una esquiva posterior. El daño puede interrumpir una preparación sin duplicar el evento de disparo. La retirada ocurre por presupuesto de ataques o tiempo máximo, evitando enemigos perpetuos que bloqueen la ruta. El módulo decide la velocidad y la posición lateral; el actualizador existente sigue siendo el único que integra el desplazamiento vertical. No se añade un ciclo de motor.

### Guardian Atlas y AUTO

Atlas tiene **24 puntos de integridad**, dos fases y un desplazamiento protegido entre flancos. El blindaje cerrado se comunica tanto en el HUD como mediante una pose apropiada del atlas existente. Al anunciar y ejecutar el ataque mantiene su posición; el patrón se puede aprender y responder. Las ventanas de contraataque tienen en cuenta el paso de sus proyectiles y el tiempo de vuelo del Pulso. Los impactos visuales no detienen su reloj ni permiten bloquearlo indefinidamente recibiendo golpes.

AUTO está apagado cuando falta una preferencia explícita nueva. El antiguo valor predeterminado del guardado específico de Atlas no se interpreta como una elección del jugador. La opción aparece únicamente en **Ajustes** y se guarda allí; se retira el botón del encuentro. Si el almacenamiento rechaza el cambio, se restaura el valor anterior y se comunica el error. La modalidad automática utiliza la batería, cadencia y ciclo existentes, tanto en el campo clásico como en Atlas.

Atlas manual 03 aprobado 4/4: 87,3145 s de encuentro simulado, 26 activaciones, 113 proyectiles enemigos, 2 fases y casco 54; recompensa única y recarga verificadas (evidence/arcade-polish/atlas-manual-03/verified-summary.json).

## 3. Guardados, compatibilidad y recuperación

Se mantiene `neonCronium.flightEquipment.v1`, su versión 1 y los identificadores `pulse`, `twin`, `lance`. El normalizador acepta los perfiles antiguos legítimos y conserva sus armas y selección. Añade metadatos opcionales de preparación y recompensa real de jefe; no infiere progreso de la campaña a partir de poseer equipo.

La recompensa de Atlas se incorpora al **completion journal existente** junto con los objetivos de progreso del nivel. Primero se persiste la intención; después se aplican los destinos validados. Una interrupción permite recuperar el mismo resultado sin volver a ejecutar combate, repetir la recompensa ni cambiar de arma. El scope v1 del diario se conserva para poder recuperar intenciones históricas que todavía no contenían un destino de equipamiento. Se detectan conflictos cuando el registro cambió por otra operación, en vez de sobrescribirlos silenciosamente.

Se corrigió un caso adicional descubierto al integrar la recompensa: un equipamiento corrupto, aun respaldado, seguía impidiendo validar el estado previo del diario. Ahora sólo se establece una base válida y sin recompensa después de confirmar que los bytes exactos del registro corrupto tienen un respaldo durable. Si el respaldo o la escritura falla, la operación permanece bloqueada y reintentable; no se borra el trabajo anterior para obtener un resultado verde.

Las pruebas cubren equipo nuevo, Gemelo/Lanza antiguos, registros corruptos, campos opcionales, ausencia de mutación, preparación sin desbloqueo, premio idempotente, cambio de selección, fallos entre escrituras, recuperación del diario anterior y bloqueo por conflictos. Los guardados de N-7 y de otras campañas no se reinterpretan como etapas del viaje canónico.

## 4. Arte producido y uso real

| Recurso | Maestro y exportación | Estados y dimensiones | Integración |
| --- | --- | --- | --- |
| `combat.arcade-pulse.v2` | `art-source/vfx/arcade-combat-v2/arcade-pulse-master-v2.png`; `assets/arcade_pulse_atlas_v2.webp` | Maestro PNG RGBA 1254×1254; WebP 1024×1024; 16 celdas de 256×256; pivote 0,5/0,5; transparencia | Loader, manifiesto, catálogo, mapa de animación, precarga SW y renderizador actual de proyectiles/impactos |
| Pulso/Gemelo/Lanza | Filas 0/1/2 del mismo atlas | Cuatro poses diferentes por arma; 60/50/55 ms por pose respectivamente | La edad de cada proyectil gobierna el frame; Gemelo dibuja una bala por trayectoria |
| Impacto | Fila 3 | Cuatro fases de 35/55/75/95 ms; duración 260 ms | Reacción visual única de contacto, sin daño adicional por frame |

Peso runtime: **119.850 bytes**. SHA-256: `f76d93ddc2f23fde7f70f7bf6d423c5566d81721f049b2316b7a91c4c3604cb9`. Estimación de decodificación RGBA: **4.194.304 bytes (4 MiB)**; excluye GPU, cachés y copias temporales.

La generación original se realizó con `image_gen`, herramienta disponible en la sesión. No se descargaron recursos de otra franquicia ni se contrataron servicios. Se conservan el prompt, el maestro, el exportador reproducible, hashes de celdas, hoja de contacto y validación de alfa en Chromium en [la procedencia](../../art-source/vfx/arcade-combat-v2/PROVENANCE.md). La hoja de contacto es una revisión del recurso, **no una captura del juego**. No se atribuye aprobación artística o dictamen jurídico por la mera generación.

Inventario comprobado: **85 recursos runtime, 8.644.764 bytes**, sin ausencias ni discrepancias de hash; dos recursos preservados. Catálogo: **157 IDs**, 39 IN_REVIEW/116 PLANNED/2 IMPLEMENTED_CODE. Estos números no representan niveles terminados.

## 5. Pruebas ejecutadas y evidencia

La [certificación 02](evidence/arcade-polish/certificate-02/results.json) comenzó el 18/10/2026 a las 07:35:23,093 UTC y terminó a las 07:38:18,777 UTC sobre el SHA `8d651b5`, con árbol limpio. Los tres destinos generados —raíz, web e iOS— tienen los mismos hashes de `game.js`, `core-runtime.js` y `content-runtime.js`. Se modificaron fuentes y se regeneraron bundles mediante el pipeline.

| Comando | Resultado | Salida |
| --- | --- | --- |
| `npm run build` | Core/content/puente/web/copias iOS generados | 0 |
| `npm run test:engine` | 60/60 | 0 |
| `npm run test:architecture` | 6/6 | 0 |
| `npm run test:content` | 396/396 | 0 |
| `npm run test:static` | 13/13 | 0 |
| `npm test` | 34/34 | 0 |
| `node tests/run-v7-web-tests.mjs` | 13/13 | 0 |
| `node --test tests/campaign-adapter.test.mjs tests/neon-render-engine.test.mjs tests/sprite-animator.test.mjs` | 14/14 | 0 |
| `node --test tests/audio-lifecycle.test.mjs` | 3/3 | 0 |
| `node --test tests/visual-artpass.test.mjs` | 12/12 | 0 |
| `node scripts/audit-asset-inventory.mjs` | 85 recursos runtime; hashes y tamaños válidos | 0 |
| `npm run build:preview` | Paquete limpio 8d651b5 | 0 |
| `npm run test:preview` | 23/23 | 0 |

Son **551 casos de suites más 23 de preview, 574 en total**, no 574 partidas ni 574 dispositivos. Las 11 fases incluyen build e inventario, por lo que no se cuentan como casos de gameplay. La certificación 01 anterior se conserva sin sumarla de nuevo al resultado final. No se eliminan pruebas para acomodar los nuevos contratos. `npm ci` no se repitió localmente en este lote; sí se ejecutó en el entorno limpio del workflow de GitHub Actions. No se presenta esa instalación de CI como una comprobación local.

### Chromium real

| Ejecución | Resultado confirmado | Límite |
| --- | --- | --- |
| [Actualización/offline 02](evidence/arcade-polish/upgrade-02/results.json) | 5/5, salida 0, 22.016 ms; SW anterior→actual; bytes exactos de guardados conservados; continuación offline en 1.3; nave modular y RAF máximo 1 | Fixtures previos declarados, localhost, 390 px; no es una partida natural ni Safari |
| Nuevo atlas offline | HTTP 200 desde SW, 119.850 bytes, SHA-256 exacto, navegador sin conexión | Prueba disponibilidad del recurso actual; no certifica por sí sola la estética de cada animación |
| Atlas manual 03 | Aprobado 4/4: 87,3145 s de encuentro simulado, 26 activaciones, 113 proyectiles enemigos, 2 fases y casco 54; recompensa única y recarga verificadas ([resumen](evidence/arcade-polish/atlas-manual-03/verified-summary.json)) | Piloto QA mediante controles reales; no es una prueba humana ni certifica la dificultad |
| C9 dirigida 02 / Gaia / N-7 | C9 aprobada 4/4: casco 36 sin humo, Pulso vertical animado y taller a los 183,2 s. Gaia engagement 02 aprobado 4/4: 10,846 s de combate sostenido y 4 ataques. N-7: una sesión y seis pasos aprobados | C9 usa un fixture declarado de guardado de entrada en 1.6; no es una campaña natural completa. Gaia no prueba la muerte del interceptor. N-7 es una prueba breve de regresión |

El arnés de actualización se ejecutó con:

~~~bash
node scripts/rebrand-browser-smoke.cjs --root preview-dist --previous /tmp/neon-before-polish-preview --output /tmp/neon-polish-upgrade-02 --timeout 180000
~~~

Su `git.head` es 8d651b5 y el árbol sólo contenía la modificación posterior del observador QA, luego conservada en d37a354. Los dos paquetes de entrada se hashearon antes/después y permanecieron intactos. No se cambia el SHA del paquete para atribuirle otra versión de aplicación.

### Fallos e intentos no aprobados

1. **Observador offline 01:** el filtro de respuestas aún reconocía los recursos anteriores y no incluía `arcade_pulse_atlas_v2.webp`. La comprobación falló al buscar la respuesta, aunque el atlas estaba integrado. La corrección d37a354 amplía ese filtro, conserva la aserción y comprueba bytes/hash reales sin conexión. La repetición 02 pasa 5/5. Se conserva [el fallo 01](evidence/arcade-polish/upgrade-01/results.json).
2. **Chronos natural 01, Gaia engagement 01 y Atlas manual 01:** se iniciaron en paralelo con otras verificaciones y el coordinador los detuvo por contención de CPU, salida 130/SIGINT. Se conservan los resultados parciales, arneses usados, capturas y recibos `coordinator-stop.json`; no se contabilizan como victorias ni como regresiones de jugabilidad demostradas. Las observaciones parciales no sustituyen el objetivo final de cada prueba.
3. **Equipamiento corrupto ante premio:** corregido mediante respaldo durable y base validada antes de escribir la intención del diario; no se fuerza la escritura sobre datos sin respaldo.
4. **Pruebas no ejecutadas/certificadas:** Safari físico, iPhone físico, firmado/compilación Xcode, benchmarks de GPU/memoria y revisión humana de dificultad/estética. Las copias iOS generadas no equivalen a una certificación iOS.

## 6. Capturas y comparación

Imágenes auténticas ya conservadas del paquete en Chromium:

- [Reentrada offline en 1.3](evidence/arcade-polish/upgrade-02/08-current-offline-continuation-playing.png).
- [Briefing offline del checkpoint anterior](evidence/arcade-polish/upgrade-02/07-current-offline-checkpoint-briefing.png).
- [Ataque de Chronos, intento natural interrumpido](evidence/arcade-polish/chronos-natural-interrupted-01/02-reactor-attack.png).
- [Objetivo anunciado por perseguidor, intento interrumpido](evidence/arcade-polish/chronos-natural-interrupted-01/03-pursuer-locks-announced-target.png).
- [Nave antes del umbral de daño, intento Gaia interrumpido](evidence/arcade-polish/gaia-engagement-interrupted-01/02-ship-effects-at-least-67.png) y [después](evidence/arcade-polish/gaia-engagement-interrupted-01/03-ship-effects-below-67.png).

Los intentos interrumpidos se identifican como tales incluso cuando produjeron imágenes válidas. No se presentan como misiones completadas. Atlas manual 03 aprobado 4/4: 87,3145 s de encuentro simulado, 26 activaciones, 113 proyectiles enemigos, 2 fases y casco 54; recompensa única y recarga verificadas (evidence/arcade-polish/atlas-manual-03/verified-summary.json). C9 dirigida 02 aprobada 4/4: casco 36 sin humo, Pulso vertical animado y taller a los 183,2 s. Se utilizó un fixture declarado de guardado de entrada en 1.6; no fue una campaña natural completa. Gaia engagement 02 aprobado 4/4: 10,846 s de combate sostenido y 4 ataques; no prueba la muerte del interceptor.

Para comparación histórica, se conserva el [atraque anterior](evidence/chronos-pursuit-gaia/natural-01/16-c9-emitter-installed.png) y el [ataque anterior de Gaia](evidence/chronos-pursuit-gaia/gaia-focused-final/04-ch02-real-attack-projectile.png). Son instantes de otro SHA, no un benchmark pareado ni prueba de comportamiento nuevo.

## 7. Archivos modificados

El SHA funcional contiene 68 rutas modificadas o añadidas respecto al inicio. Se agrupan por su función; las copias generadas no son una segunda implementación.

| Grupo | Rutas y cambio |
| --- | --- |
| Política y seguimiento | `AGENTS.md`, `docs/PRODUCT_VISION.md`, `docs/production-tasks.json`, `docs/PRODUCTION_MASTER_CHECKLIST.md`, `docs/PRODUCTION_PROGRESS.md`: prioridad vigente y seis tareas con aceptación separada |
| Configuración, recursos y Ajustes | `src/game/00-bootstrap-config.js`, `01-runtime-assets.js`, `02-storage-audio.js`, `08-loop-input-bootstrap.js`, `index.html`, `styles.css`: atlas nuevo, AUTO apagado y opt-in persistente |
| Flujo/integración | `src/game/03-ui-game-flow.js`: C9, equipamiento, mensajes, contacto físico contra Atlas y recompensa con journal; `05-corridor-update.js`: actualización única, IA sin sobrescritura ambiental y AUTO opcional |
| Presentación | `src/game/06-world-rendering.js`: aproximación/salida C9; `07-player-item-rendering.js`: proyectiles/impactos nuevos, blindaje, destellos y retirada del humo heredado de la nave modular |
| Modelos reutilizables | `src/game/combat/classic-pursuit.js`, `guardian-atlas.js`; `src/game/progression/chronos-flight.js`, `classic-arsenal.js`, `completion-journal.js`, `legacy-content-entry.js`; `src/game/animation/animation-map.js` |
| Recursos registrados | `ASSET_MANIFEST.json`, `ASSET_PRODUCTION_150.json`, `assets/arcade_pulse_atlas_v2.webp`, `sw.js` |
| Maestros y verificación de arte | `art-source/vfx/arcade-combat-v2/PROVENANCE.md`, `arcade-pulse-atlas-v2.json`, `arcade-pulse-atlas-v2.webp`, `arcade-pulse-browser-validation.json`, `arcade-pulse-chromium-composited.png`, `arcade-pulse-contact-sheet-dark.jpg`, `arcade-pulse-master-v2.png`, `export-arcade-pulse.mjs`, `verify-arcade-pulse-browser.cjs` |
| Tests | `tests/arcade-pulse-rendering.test.mjs`, `chronos-voyage-rendering.test.mjs`, `chronos-voyage.test.mjs`, `classic-arsenal.test.mjs`, `classic-pursuit.test.mjs`, `completion-journal.test.mjs`, `guardian-atlas-animation.test.mjs`, `guardian-atlas-legacy.test.mjs`, `guardian-atlas.test.mjs`, `run-tests.mjs`, `unified-flight-legacy.test.mjs`; `package.json` incluye las suites nuevas |
| Arneses Chromium | `scripts/chronos-voyage-browser-smoke.cjs`, `gaia-interceptor-browser-smoke.cjs`, `guardian-atlas-browser-smoke.cjs`, `guardian-atlas-visual-smoke.cjs`, `pursuit-resume-browser-smoke.cjs`, `rebrand-browser-smoke.cjs`: nuevos contratos, AUTO en Ajustes y recompensas |
| Bundles generados | `game.js`, `content-runtime.js`, `content-runtime.js.map`; copias de esos tres y de `index.html`, `styles.css`, `sw.js` en `www/` e `ios/App/App/public/` |

Las correcciones QA posteriores afectan a tres scripts: d37a354 modifica únicamente `scripts/rebrand-browser-smoke.cjs`; 52af749 ajusta la tolerancia numérica en `scripts/guardian-atlas-browser-smoke.cjs`; 33e423c añade `scripts/c9-polish-browser-smoke.cjs`, con 306 líneas, fuera de las 68 rutas del commit funcional. No cambian el juego empaquetado 8d. El SHA de cierre se conserva en el [recibo documental](evidence/arcade-polish/closure-receipt.json). No se sobreescriben informes históricos ni se renombra un paquete anterior como si contuviera este cambio.

## 8. GitHub, paquete y web de pruebas

La integración funcional está publicada en [8d651b5](https://github.com/adonay1994sm-gif/neon-cronium/commit/8d651b51453c143d395d3feb8c0d5629066a72c9). [GitHub Actions 39108203642](https://github.com/adonay1994sm-gif/neon-cronium/actions/runs/39108203642) terminó **completed/success**, no sólo build. [Recibo](evidence/arcade-polish/neon-polish-github-functional-complete.json). La corrección del observador está publicada como [d37a354](https://github.com/adonay1994sm-gif/neon-cronium/commit/d37a354). El SHA de cierre se conserva en el [recibo documental](evidence/arcade-polish/closure-receipt.json). QA: d37a354, 52af749 y 33e423c; no cambian el juego empaquetado 8d.

[Paquete ZIP 8d651b5](evidence/arcade-polish/package-8d651b5/neon-cronium-arcade-polish-8d651b5.zip) · [recibo completo](evidence/arcade-polish/package-8d651b5/package.json) · [build-info](evidence/arcade-polish/package-8d651b5/build-info.json).

- **8.906.746 bytes, 121 entradas**.
- ZIP SHA-256: `e20d78a5becb077f6768c8ab90aa52cff12ce9bff04835b6bedcf4a81330fcc8`.
- Revisión: `e3c5e4e510b6ef04ffd4b3738f86a9057730cddcf5fb33fb411bb69938f61a31`.
- Commit: 8d651b5; `dirty=false`.
- Entradas: `index.html` y `juego/index.html`. Extraer en una carpeta vacía y servir la raíz por HTTP; CONTINUAR VIAJE abre el clásico. No abrir mediante `file://`. Se mantiene el prefijo de los guardados de prueba.

Site privado versión 17 publicado y verificado: (web privada antigua, retirada) fuente Site 6d5c560ddc80daee30dcff0c30cd1f5b3f5eb9b4, runtime 8d651b5, HTTP 4/4 y 148 archivos externos preservados. No hubo despliegue Netlify.

Antes de esta publicación, la URL `(web privada antigua, retirada)` correspondía a la **versión privada 16**, paquete histórico d39ed44. La versión actual sirve el paquete 8d651b5 en `/clasico-actual/`. Se comprobó que **148 archivos externos al alcance permanecen idénticos**; la publicación se acredita además con las respuestas HTTP y los hashes indicados en el cierre. El recibo [de conservación](evidence/arcade-polish/neon-polish-site-preservation.json) permite revisar la diferencia. La producción Netlify no cambia. La rama `main` del repositorio separado de Sites no es `main` del juego.

## 9. Rendimiento y límites

El atlas nuevo añade 119.850 bytes comprimidos y unos 4 MiB RGBA estimados. El total runtime auditado pasa a 8.644.764 bytes. Se usa un atlas compartido, el loader existente y la edad del efecto; no se añade un RAF, timer de combate ni carga masiva de cien escenarios.

La certificación limpia duró 175.684 ms de pared; la actualización/offline 02, 22.016 ms. Estos tiempos describen procesos, no son FPS ni tiempo puro de descarga de un iPhone. Las ejecuciones naturales iniciales sufrieron contención de CPU en el entorno compartido y fueron detenidas; no se convierten esos tiempos en una regresión de dispositivo ni en un dato de rendimiento favorable.

Quedan por medir memoria efectiva, consumo, FPS y sensación de control en dispositivos reales, incluidos Safari/iPhone. La inspección de transparencia/registro del atlas y el humo eliminado no equivalen a aprobación estética. Se conserva reducción de efectos y no se cambian las colisiones para acomodar el arte.

## 10. Organigrama y siguiente trabajo exacto

Fuente única: `docs/production-tasks.json`; checklist y progreso derivados mediante el script existente. El seguimiento registra 323 tareas, incluidas 157 de assets. Las tareas históricas y sus evidencias se conservan; no se reinicia el producto a cero ni se reutiliza una proporción histórica como porcentaje comercial.

| Tarea | Estado del lote | Cierre requerido |
| --- | --- | --- |
| `P2-C9-FAST-01` | IN_REVIEW | Atraque/salida, servicio único y recarga comprobados en navegador; valoración humana |
| `P1-SHIP-CLEAN-01` | IN_REVIEW | Daño visible sin humo superpuesto; revisión de las naves modulares y dispositivo |
| `P2-PULSE-VISUAL-01` | IN_REVIEW | Registro/animaciones/impactos reales y revisión de escala/brillo |
| `P2-ENEMY-COMBAT-01` | IN_REVIEW | Combate natural, ataques repetidos y ventanas de respuesta sin bloqueo de ruta |
| `P1-ATLAS-MANUAL-01` | IN_REVIEW | Partida manual completa con Pulso y segunda configuración; dificultad revisada |
| `P2-ARSENAL-01` | IN_REVIEW | Victoria→premio→equipamiento→recarga con compatibilidad e interrupciones |

El SHA de cierre se conserva en el [recibo documental](evidence/arcade-polish/closure-receipt.json). QA: d37a354, 52af749 y 33e423c; no cambian el juego empaquetado 8d.

La victoria manual de Atlas con Pulso, el premio único y su persistencia al continuar ya están comprobados; C9 tiene una prueba dirigida con fixture declarado. La siguiente tarea exacta es **perfilar la lentitud durante la recogida de Gaia, registrar su causa y comparar una corrección controlada**. Después se completa el recorrido natural hasta C9 y se revisan con el propietario la velocidad de atraque, la claridad de los proyectiles y la dificultad de la patrulla. Se mantienen separados los fixtures de equipamiento antiguo; después se continúa con Gaia/CH-03 y su enlace narrativo con Vulkar.

No se declara terminado el primer nivel por estar pulido, no se promueven los otros nueve por aprobar estas suites y no se promete calidad «AAA» sin revisión. El estado sigue siendo **versión privada jugable en desarrollo**, con arte/dificultad y dispositivo por validar. El Motor V1 permanece reservado al propietario. El correo de soporte queda aplazado conforme a su indicación anterior.


## Cierre de las comprobaciones posteriores

- Atlas manual 03: 4/4, salida 0, 220952 ms; entrada en Gaia, 45 fragmentos y 24 HP → 0; 26 activaciones manuales de Pulso sin poderes ni AUTO; casco 54. Encuentro de 87,3145 s simulados. Mantener cifras de simulación y pared separadas. Ocho capturas reales. Recompensa Gemelo sin equipar automáticamente, sin Lanza; persistencia tras continuar a Vulkar y recargar.
- C9 dirigida 02: 4/4, salida 0, 13652 ms; fixture declarado de guardado de entrada en 1.6 con casco 36, sin alterar la salud durante la ejecución. Se registraron 162 dibujos de nave modular sin humo, 3 poses de Pulso y un error central máximo de 0,000059 px. Taller a los 183,2 s de ruta y 1,2 s dentro de la etapa; reloj y batería congelados, servicio único, curación a 100, salida en 2,4 s y guardado de 1.6 con recarga correctos.
- Gaia engagement 02: 4/4, salida 0, 87518 ms; CH02 aparece a los 12,1982 s y permanece 10,846 s combatiendo, con 4 ataques y reposicionamiento; se retira por presupuesto a los 13,906 s de vida. No utiliza disparo manual en esta modalidad: no prueba daño/muerte del interceptor. Casco final 32, sin humo grande.
- Atlas visual: 3/3 perfiles, 390×844, 320×568 y 844×390; salida 0, 10 capturas de poses forzadas con arte real y HUD, controles y límites verificados. Esta inspección de layout no sustituye la partida natural.
- N-7: una sesión y seis pasos aprobados, salida 0; entrada, movimiento y disparo, pausa, reanudación, reinicio, menú y RAF.
- Site local idéntico al publicado: 2/2, salida 0; entrada CONTINUAR → clásico actual e inicio de Chronos sin hooks ni fixtures. HTTP remoto 4/4, salida 0, con hashes reales del build, bundle y VFX.

### Fallos conservados y correcciones de QA

La primera ejecución global de contenido falló mientras se adaptaban ocho contratos obsoletos (servicio con paso inmediato a 1.7, IA v1 y rayos instantáneos con sus tiempos); la nueva suite conserva y amplía esas comprobaciones para el comportamiento actual. Regresión 01 esperaba el objeto de ajustes sin autoFire; se añadió la comprobación de su valor predeterminado false y su activación explícita, y la prueba pasó. Atlas 02 se detuvo por comparar `920*cos(-π/2)` con cero exacto: vx = 5,63e−14; se conserva la aserción vertical con tolerancia 1e−9. C9 01 usaba `isVisible()` sobre un overlay que se oculta por opacidad y pointer-events; 02 verifica ausencia de .show, opacidad 0 y falta de interacción. Offline 01 omitía el recurso nuevo de su observador; 02 conserva las comprobaciones de hash, HTTP y SW y pasa. Ninguno se ocultó ni se borraron aserciones para obtener verde. Los tres naturales 01 cancelados por concurrencia quedan como interrumpidos, salida 130, nunca aprobados. La fase de recogida también resulta lenta en ejecución aislada: no se atribuye todo a concurrencia.

### Rendimiento: riesgo abierto B09-01

[Observación y próximos pasos](evidence/arcade-polish/neon-polish-performance-observations.md): 10,36–11,22 RAF/s durante la recogida de Gaia en ejecución aislada sobre este host con renderizado por software, frente a 59,91 en Atlas. Son conteos del callback en este entorno, no FPS certificados de iPhone ni p95/p99 de GPU. Hay que perfilar CPU y rasterizado por función y tipo, identificar el coste dominante y comparar A/B antes de optimizar. Halos, sombras y procesamiento de objetos son hipótesis; no hay causa confirmada. Las funciones de fondo, orbes y meteoritos comparadas son iguales al baseline c4, lo que no demuestra ausencia de un problema previo. Nuevo atlas: 119850 bytes transferidos y 4194304 bytes RGBA estimados al decodificar. No se ha medido memoria física.

### Galería de ejecución

Las siguientes son capturas del juego, no concept art. La galería conserva contextos distintos; no se presenta como comparación idéntica de tiempo/configuración.

| Referencia | Evidencia | Alcance |
|---|---|---|
| C9 anterior | [Captura histórica](evidence/chronos-pursuit-gaia/natural-01/15-c9-before-installation.png) | Viaje natural de la revisión anterior; no certifica el código actual. |
| C9 actual | [Emisor preparado](evidence/arcade-polish/c9-02/03-c9-component-prepared-pulse-still-equipped.png) | Fixture declarada de entrada en 1.6; Pulso sigue seleccionado. |
| Salida actual | [C9 abandona el campo](evidence/arcade-polish/c9-02/04-c9-departed-back-in-the-flight-corridor.png) | Partida actual con checkpoint de servicio persistido. |
| Daño actual | [Casco 32 sin nube](evidence/arcade-polish/gaia-engagement-02/06-ship-effects-below-67.png) | Daño natural de Gaia. |
| Atlas actual | [Ataque anunciado](evidence/arcade-polish/atlas-manual-03/03-atlas-warning.png) · [segunda fase](evidence/arcade-polish/atlas-manual-03/04-atlas-phase-two.png) | Combate natural manual. |
| Victoria | [Atlas abre el paso](evidence/arcade-polish/atlas-manual-03/06-gaia-victory.png) | Resultado real y premio persistido. |

La captura C9 de nave dañada se tomó durante el fundido CSS de salida de pausa y conserva parte del panel transitorio; no se presenta como un HUD permanente ni como una captura limpia de aceptación. La captura Gaia al 32% permite revisar la nave sin ese fundido.

### Publicación comprobada

Site privado 17: (web privada antigua, retirada) . Fuente 6d5c560ddc80daee30dcff0c30cd1f5b3f5eb9b4, despliegue `appgdep_6ad478b29e20819186eea37406549a32`, estado succeeded, 18/10/2026 07:44:04 UTC. Una persona autorizada (propietario), cero visitantes externos; audiencia sin cambios. Únicamente se actualizan clásico actual, metadatos, generación del launcher y README; 148 archivos protegidos coinciden por hash. Bundle remoto b4a7fc21f0502dcdfeb01835e30faa1c8ef49debcf50d0f6c73578637a8e5d47; atlas f76d93ddc2f23fde7f70f7bf6d423c5566d81721f049b2316b7a91c4c3604cb9. El juego publicado corresponde a 8d651b5; los commits posteriores añaden QA/documentación, no otra compilación oculta. Las diferencias entre bundle normal y preview son las transformaciones oficiales de aislamiento de guardado, reparación simulada y SW; [equivalencia](evidence/arcade-polish/runtime-equivalence.json).

[Actions funcional aprobado](https://github.com/adonay1994sm-gif/neon-cronium/actions/runs/39108203642) y [Actions QA aprobado](https://github.com/adonay1994sm-gif/neon-cronium/actions/runs/39108699491). Producción Netlify, main, PR3, Motor V1, tiendas y pagos sin cambios.
