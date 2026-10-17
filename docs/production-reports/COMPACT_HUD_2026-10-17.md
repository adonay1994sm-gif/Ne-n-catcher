# DIAGNÓSTICO

La captura del propietario mostraba dos bloques superpuestos al escenario: cuatro tarjetas de estadísticas y una tarjeta de misión que repetía la cuota de CRONIUM, incluía el selector de arma y reservaba texto permanente. En Chromium, el extremo inferior de esos bloques llegaba a **180 px en 390×844** y a **176 px en 320×568**. La adaptación del movimiento imponía además un mínimo superior fijo de182 px, incluso si la interfaz podía ocupar menos. Reducir solamente el aspecto de las tarjetas no recuperaba ese espacio de pilotaje.

Se retoma la rama autorizada sin sustituir el juego, el arte o las campañas. La petición actual es integrar el HUD para ver y jugar mejor. El ajuste se limita al viaje clásico unificado; los modos históricos conservan su presentación.

# INFORME DE PRODUCCIÓN — NEON CATCHER / HUD COMPACTO

- **Fecha:** 17/10/2026 UTC.
- **Rama:** continuity-assets-audit-20261013.
- **SHA inicial observado:**96f75672a63940e58158806f367b06a74cbac20d.
- **SHA funcional probado y publicado:**pendiente de cierre por integración.
- **SHA de cierre documental:**pendiente de cierre por integración.
- **Paquete y publicación:**pendientes de cierre; el sitio previo no acredita esta revisión.
- **Alcance:**presentación, límites de movimiento derivados del HUD y regresión de su ciclo de visibilidad. No se declaran niveles visualmente completos.
- **Aceptación técnica:**PASSED para este incremento HUD; límite de harness temporal documentado en E.1. **Artística:**pendiente del propietario. **Física:**Safari/iPhone pendientes.

## A. Qué cambia al jugar

Las estadísticas comparten una franja superior de46 px; desaparecen sus fondos de tarjeta individuales. Nivel, puntos, CRONIUM, casco y pausa siguen disponibles. El casco conserva porcentaje y barra; la cuota deja de repetirse en una segunda tarjeta. Se aclaran las etiquetas NIVEL y CRONIUM.

El destino y la misión pasan a una línea breve, con una barra de progreso de2 px. El selector de arma queda abajo a la izquierda, separado del botón de disparo. Los avisos breves sustituyen temporalmente una parte de la línea de ruta, sin tapar el disparo ni las comunicaciones críticas; en horizontal corto permanecen en su panel lateral. No interceptan toques. Su nombre, indicación de alternancia, etiqueta accesible y estado seleccionado siguen sincronizados con el arma real. No se cambian sus reglas, cargas ni recarga.

Las transmisiones ocupan temporalmente una franja de34 px y se retiran al agotarse su tiempo jugado. El espacio se reserva también cuando está transparente para que una comunicación no desplace repentinamente la nave. No se convierte en un bloque permanente de contadores. La pausa conserva el tiempo restante del mensaje.

Los límites de vuelo se calculan a partir de los rectángulos reales del HUD, comunicaciones, interfaz de Atlas y controles inferiores. Desaparece el mínimo superior fijo anterior. Se ignoran los paneles laterales que quedan fuera del Canvas. Se conserva el margen de la ilustración completa de la nave y la geometría de colisión.

## B. Fuentes e integración

| Archivo | Integración efectiva |
| --- | --- |
|styles.css|HUD clásico compartido, ruta fina, comunicaciones temporales, selector de arma inferior, áreas seguras y adaptación horizontal/pequeña. Las reglas se limitan a body.flight-mode.|
|src/game/02-storage-audio.js|Adaptador de rectángulos DOM→límites del Canvas; mide los controles nuevos y descarta paneles fuera del área de juego.|
|src/game/03-ui-game-flow.js|Contenedor flightHud, mensajes sin cuota duplicada, actualización del recorrido y atributos accesibles; unifica ocultación/restauración al iniciar, salir, morir, continuar, completar o entrar en Atlas.|
|tests/unified-flight-legacy.test.mjs|Fixtures de rectángulos y cinco contratos adicionales: recorrido continuo, mensajes/pausa, límites medidos y visibilidad/alternancia sin reponer munición.|
|scripts/compact-hud-powers-smoke.cjs|Fixture controlado: handler real de poderes, fichas activas, mensajes, pausa y medición de geometría. El modo layout-only aísla el ajuste CSS final y declara que no ejecuta la expiración.|
|scripts/compact-hud-browser-smoke.cjs|QA real de cinco tamaños, controles táctiles y diez escenas mediante navegación de UI. El modo --baseline registra la versión previa sin aplicar el presupuesto nuevo.|
|game.js, www/game.js, ios/App/App/public/game.js|Bundles regenerados desde fuentes.|
|www/styles.css, ios/App/App/public/styles.css|Copias de distribución sincronizadas desde la fuente CSS.|

Se reutilizan el renderer legacy, el reloj de ruta, el inventario de armas y sus guardados. **USE_ENGINE_V1=false**; no se añade propietario de RAF ni otra arquitectura. Main, PR#3 y producción Netlify no forman parte de este lote.

## C. Assets y reglas conservadas

**Assets gráficos nuevos:0.** Se reutilizan nave, escenarios, atlas y efectos. La flecha de alternancia es iconografía sencilla en SVG; no se presenta como un recurso artístico nuevo. No se modifica el manifiesto de arte por un cambio de distribución del HUD.

No cambian los diez niveles, cuotas de victoria, los90 s mínimos del primer viaje, enemigos, daño, velocidades, tres cargas, recarga, taller, recompensas ni claves de guardado. El espacio permitido para maniobrar cambia de forma deliberada para corresponder a la interfaz visible. La barra del primer trayecto se actualiza aunque no haya nueva recogida, cambio de fase ni recarga de arma; en los otros niveles indica CRONIUM recuperado y lo explica en su etiqueta accesible.

## D. Comparación medida de interfaz — revisión intermedia

Fuente previa:[baseline-01/results.json](evidence/compact-hud/baseline-01/results.json). Fuente posterior **intermedia**, no cierre final:[after-02/results.json](evidence/compact-hud/after-02/results.json). Debe sustituirse por after-03 al terminar las correcciones de tablet y continuación. Las capturas son del ejecutable real; no son conceptos. Chromium usa DPR1, áreas seguras por defecto0 y controles táctiles emulados.

La altura se mide desde la parte superior del viewport hasta el borde inferior de HUD+ruta estables. El porcentaje de área suma sus rectángulos; **no representa píxeles opacos reales ni incluye la comunicación temporal**. El presupuesto técnico es≤100 px, o≤90 px en320 px de ancho.

|Viewport|Altura anterior|Altura posterior|Área anterior|Área posterior|
| --- | ---: | ---: | ---: | ---: |
|390×844|180 px|82 px en after-02|17,39%|7,95% en after-02|
|320×568|176 px|82 px en after-02|25,06%|11,69% en after-02|
|390×714|180 px|82 px|20,46%|9,40%|
|844×390|171 px|100 px|15,00%|10,39%|
|1024×768|Defecto de cascada, HUD x=−252|82 px|No comparable|8,97%|
|1024×768|No medido en baseline|Defecto reproducido; pendiente repetición|No medido|Pendiente|

390×714 prueba una altura de contenido reducida; no dibuja la interfaz de Safari ni certifica su comportamiento. Los controles principales se comprueban con objetivos mínimos44×44 px. La línea compacta puede truncar texto largo: el nombre completo sigue en la selección/briefing y la valoración de legibilidad final corresponde al propietario.

## E. Pruebas, intentos y correcciones

Los registros guardan comando, SHA, árbol con cambios, hashes y duración. El baseline usa el paquete limpio73e117b anterior. La certificación de fuentes y los navegadores nuevos corresponden al árbol de trabajo indicado en sus propios JSON; no se atribuyen al SHA futuro antes de crear el commit.

|Comando/sesión|Resultado real|Salida|
| --- | --- | ---: |
|node scripts/compact-hud-browser-smoke.cjs --root preview-dist --output docs/production-reports/evidence/compact-hud/baseline-01 --baseline|8/8 grupos, cuatro tamaños y ocho capturas; registro previo, no aceptación del nuevo presupuesto|0|
|node scripts/compact-hud-browser-smoke.cjs --root preview-dist --output docs/production-reports/evidence/compact-hud/after-01|Falló al llegar al perfil horizontal:106 px excedían el máximo100. Se conservan el fallo y las comprobaciones previas.|1|
|node scripts/compact-hud-browser-smoke.cjs --root preview-dist --output docs/production-reports/evidence/compact-hud/after-02|Falló una aserción del harness al comparar la altura de la nave con la ruta lateral fuera del Canvas. Los rectángulos no se solapaban; se corrigió el contrato según intersección horizontal real.|1|
|node docs/production-reports/evidence/compact-hud/tablet-01/reproduce.cjs|Defecto real1024×768:HUD a x=−252 px, pausa parcialmente fuera de pantalla; salida fallida conservada|1|
|node scripts/certify-local.mjs docs/production-reports/evidence/compact-hud/certification-01|Revisión intermedia:11/11 fases, ok:true. Del18:17:18.500 al18:18:30.691 UTC;72,191 s de pared. Debe repetirse tras las correcciones siguientes.|0|
|node scripts/certify-local.mjs docs/production-reports/evidence/compact-hud/certification-02|11/11 fases, contenido167/167; revisión intermedia con tablet/continuación corregidas|0|
|node scripts/compact-hud-browser-smoke.cjs --root preview-dist --output docs/production-reports/evidence/compact-hud/after-03|26/26 grupos; cinco tamaños y apertura real de diez escenas. Snapshot anterior al ajuste adicional de poderes.|0|
|node scripts/certify-local.mjs docs/production-reports/evidence/compact-hud/certification-03|11/11 fases; contenido168/168, incluido poder recogido/expirado, mediciones y aislamiento N-7|0|
|npm run build|Bundles web/iOS regenerados y huellas sincronizadas|0|
|npm run test:engine|40/40|0|
|npm run test:architecture|6/6|0|
|npm run test:content|168/168; incluye los cinco contratos nuevos|0|
|npm run test:static|13/13|0|
|npm test|33/33|0|
|node tests/run-v7-web-tests.mjs|13/13|0|
|Pruebas del renderer/adaptadores experimentales|14/14; no activan Motor V1|0|
|Pruebas de ciclo de audio|3/3|0|
|node --test tests/visual-artpass.test.mjs|12/12|0|
|node scripts/audit-asset-inventory.mjs|77 recursos,7186268 B, cero discrepancias|0|

La corrección posterior a after-01 reduce en6 px el desplazamiento de la ruta horizontal; se repite la misma prueba sin ampliar el límite. En la integración se detectó también que el nuevo selector separado necesitaba compartir la ocultación de la ruta al morir/completar y restaurarse al continuar. Se añadió un contenedor común y contratos para la continuación ordinaria y de Atlas. Los fixtures de Vulkar se desbloquean explícitamente dentro del harness para ejecutar realmente el nivel3; no se altera el desbloqueo del producto.

La revisión de1024×768 descubrió otra interacción CSS:la regla horizontal antigua mantenía width:520px y translateX(−50%) mientras la nueva regla cambiaba left a8px. El HUD terminaba en x=−252px. [Reproducción y rectángulos](evidence/compact-hud/tablet-01/results.json), [captura del defecto](evidence/compact-hud/tablet-01/tablet-before-fix.png). El primer intento de esa herramienta ni siquiera inició Chromium por una ruta relativa del helper incorrecta; [nota del harness](evidence/compact-hud/tablet-01/HARNESS_NOTE.md). No es evidencia de juego y no se oculta el intento. Se restablecen width:auto/transform:none en la base compacta y se amplía el navegador principal a este quinto perfil. Su repetición completa after-03 pasó; la nueva tablet ya queda dentro del viewport.

Se integró el recálculo de límites al continuar una derrota después de rotar la pantalla. El test simula una medición con HUD oculto y exige restaurar exactamente las separaciones del HUD y arma al continuar, también durante Atlas.

La revisión detectó además una anomalía inferior preexistente: recoger poderes mostraba nuevas fichas sin medir su altura. Se corrige comparando las clases active antes y después; únicamente las adiciones o retiradas actualizan los límites, preservando la cola de la nave. Los fotogramas de cuenta atrás y renovar el mismo poder no miden diseño. La prueba17 usa collectItem real, pausa/tiempo jugado, expiración y N-7 aislada. La prueba Chromium de poderes declara expresamente su activación controlada mediante el handler; no es una recogida natural.

Los contratos nuevos comprueban que alternar armas no duplica proyectiles ni repone cargas, y que un mensaje nuevo no modifica los límites de pilotaje. El navegador no escribe relojes, entidades, vida, munición ni progreso: utiliza el checkbox QA existente y navegación/clics/toques reales. Sus hooks solamente leen estado y observan RAF. No añade un ciclo de animación.

No se ejecutó una partida natural completa de90 s dentro de este smoke: apertura de diez escenas y pruebas breves de controles no equivalen a terminar las diez misiones. No se atribuyen estas pruebas a Safari, iPhone físico, compilación Xcode ni AppStore. N-7 conserva sus suites de regresión; cualquier sesión de navegador adicional se documentará por separado.

Evidencia:[fallo horizontal conservado](evidence/compact-hud/after-01/results.json), [certificación intermedia de fuentes](evidence/compact-hud/certification-01/results.json), [navegador intermedio](evidence/compact-hud/after-02/results.json), [defecto tablet](evidence/compact-hud/tablet-01/results.json).


## E.1. Último cierre de presentación y límites de la prueba de poderes

El toast anterior aparecía sobre DISPARAR, especialmente en320px. Se integra en la franja existente de ruta:24px, sin interceptar toques, y con alineación lateral en horizontal corto. No se oculta la comunicación crítica reservada debajo ni se altera la duración del mensaje.

- after-04 pasó26/26 antes de este último ajuste CSS. **after-05 pasó26/26** sobre la CSS final, cinco tamaños y diez escenas abiertas mediante UI.
- powers-02 pasó15/15 en tres perfiles: activación controlada mediante handler, pausa, cinco fichas, tres fotogramas sin nuevas lecturas geométricas y expiración normal. Su JS es idéntico al final; su CSS aún tenía el toast inferior.
- powers-01 falló por el poller RAF por defecto de Playwright. [Diagnóstico reproducido](evidence/compact-hud/powers-raf-diagnosis-01/results.json): mismo juego; `frame` pertenece a game.js y `next` a UtilityScript. Con polling100ms vuelve a máximo1. No se alteró el motor ni se relajó la aserción de un RAF.
- powers-03 falló porque el aviso de1650ms ya había caducado al volver de la captura. El PNG sí mostraba el aviso dentro de la ruta. La geometría se comprueba mientras el mensaje está activo; se registran ambos estados, sin extender su timer.
- powers-04 pasó cuatro grupos de geometría/avisos/pausa/medición en390px, pero agotó120s de pared esperando todos los poderes apagados:18,836s jugados y escudo0,88s todavía activo. La partida normal puede renovar poderes; ese contrato no aísla recogidas posteriores. **Se conserva como fallido, no se atribuye al producto ni se declara aprobado.** Su aislamiento o seguimiento de renovaciones queda pendiente en QA. Los otros cuatro poderes sí habían caducado.
- El seguimiento CSS final pasó **12/12, salida0, tres tamaños y nueve capturas** en [powers-layout-01](evidence/compact-hud/powers-layout-01/results.json) y utiliza `--layout-only`: conserva las aserciones completas del modo normal, ejecuta explícitamente los cuatro grupos de disposición en cada perfil y declara que no ejecuta la expiración. Mensaje visible antes/después en seis capturas de activación; cero errores JS/consola/HTTP y máximo1RAF. Su resultado definitivo se registra en powers-layout-01; no se presenta como la ejecución completa de powers-04.
- El test17 de integración simulada mantiene la expiración exacta con recogida real del handler, renovación, separación y aislamiento N-7. Certificación03:168/168 contenido. No se eliminaron tests ni se alteraron timers de juego para producir un resultado favorable.

En navegador N-7 se aprobó una sesión de seis pasos en390×844, [n7-01](evidence/compact-hud/n7-01/results.json). El único cambio CSS posterior está limitado a body.flight-mode y no aplica a N-7. Arquitectura6/6 y static13/13 se repitieron después del ajuste final; registros architecture-final.txt/static-final.txt, salida0.

## F. Capturas antes/después

|Escena/perfil|Antes|Después|
| --- | --- | --- |
|Vulkar390×844|[HUD anterior](evidence/compact-hud/baseline-01/390x844-vulkar.png)|[HUD compacto](evidence/compact-hud/after-05/390x844-vulkar.png)|
|Chronos390×844|[HUD anterior](evidence/compact-hud/baseline-01/390x844-chronos.png)|[HUD compacto](evidence/compact-hud/after-05/390x844-chronos.png)|
|Vulkar320×568|[Pantalla pequeña anterior](evidence/compact-hud/baseline-01/320x568-vulkar.png)|[Pantalla pequeña posterior](evidence/compact-hud/after-05/320x568-vulkar.png)|
|Vulkar390×714|[Altura reducida anterior](evidence/compact-hud/baseline-01/390x714-vulkar.png)|[Altura reducida posterior](evidence/compact-hud/after-05/390x714-vulkar.png)|
|Vulkar844×390|[Horizontal anterior](evidence/compact-hud/baseline-01/844x390-vulkar.png)|[Horizontal posterior](evidence/compact-hud/after-05/844x390-vulkar.png)|
|Maniobra real al límite superior|No se capturó ese movimiento en baseline|[Campo superior recuperado](evidence/compact-hud/after-05/390x844-upper-playfield.png)|

Los fotogramas se toman durante arranques separados, no en el mismo instante de la simulación. La galería posterior añade una captura por nivel desde su selector de QA; acredita apertura y disposición de la interfaz, no calidad artística completa ni victorias naturales.

## G. Rendimiento y limitaciones

No se añaden texturas ni memoria de atlas. El cambio reduce superficies de tarjetas y retira backdrop-filter de sus celdas clásicas. **No se ha medido una mejora de FPS** ni se atribuye causalmente el rendimiento a estos cambios. El smoke guarda duración de comandos y huellas de recursos, no un benchmark de GPU, heap, batería o fugas. Las duraciones finales se podrán leer en los JSON al terminar.

Siguen abiertos el rendimiento de la destrucción de Chronos y los glifos intermitentes documentados en capturas anteriores. No se considera resuelto ese defecto porque el DOM conserve sus etiquetas o porque una captura nueva muestre todos los textos. La aceptación en una pantalla física con notch y barras de navegador queda pendiente.

## H. Seguimiento, paquete y próxima tarea

El integrador debe completar SHA funcional, SHA documental, estado de pruebas y paquete antes de publicar este cierre como final. No se inventa URL ni se reutiliza la revisión anterior como prueba del nuevo HUD. El destino permitido es una preview privada aislada; producción permanece fuera de alcance.

Estado del lote:implementación y verificación local del HUD integradas; aceptación artística/física pendientes. Paquete y publicación se cierran en el siguiente paso. No se transforma en porcentaje de terminación comercial. El registro principal continúa siendo docs/production-tasks.json; este informe no crea otro organigrama.

Próxima prioridad:cerrar el smoke CSS de avisos, verificar paquete y publicar la misma revisión para que el propietario juegue con el HUD compacto. Después recoger su valoración de legibilidad/espacio y continuar las tareas visuales de Chronos sin expandir niveles ni activar Motor V1.
