# DIAGNÓSTICO — remates del primer nivel

18/10/2026 · Rama `continuity-assets-audit-20261013` · SHA inicial preservado `34ae40f0717243c445ffdb967f835bddb8509751` · Motor V1 desactivado.

El propietario pide continuar los siete remates antes de expandir niveles. Se confirma una carencia concreta: el misil dependía de `onclick`, separado del sistema de propiedad de contactos del Phaser. El smoke anterior cubría pilotaje + Phaser; no certificaba pilotaje + misil. El tutorial anterior eran tres mensajes por tiempo. La tienda no tenía ramas ni armas comprables; los restos y satélites estaban excluidos del botín.

# INFORME DE PRODUCCIÓN — FORJA_LEVEL_ONE_REMATES

## Incremento integrado

1. **Arsenal:** Abanico (tres pulsos, alcance corto) y Aguja (pulso estrecho que perfora tres objetivos). Se compran explícitamente después de preparar el emisor. Comprar no equipa. Gemelo conserva su desbloqueo al vencer a Atlas y Lanza histórica permanece recuperable.
2. **Forja C9:** nombre de trabajo y nuevo diseño con Mira, navegación por Arsenal/Evolución/Suministros, tarjetas ilustradas, ramas y estados instalado/bloqueado/disponible. Continúa siendo el taller de a bordo; no se devuelve una estación a la órbita.
3. **Tutorial v2:** observa movimiento, disparo y recuperación reales. Enseña el misil sólo ante una oportunidad; nunca obliga a gastar munición. Enseña C9 tras recuperar el módulo. No pausa el viaje ni aparece durante Atlas. Sus lecciones se guardan dentro de Ajustes; pueden repetirse desde Ajustes o la Forja.
4. **Atlas v7:** cinco rutinas adicionales, variantes escalonadas, flanqueo y retirada. Objetivo fijado al preparar el ataque; proyectiles físicos sin seguimiento mágico. Mantiene 96 HP, coraza cerrada, núcleo expuesto 3,8 s y máximo diez proyectiles por ataque. La versión cambia porque cambia el contenido reproducible.
5. **Mandos/HUD:** consola con materiales, marcos e iconografía coherentes, misil táctil independiente del piloto, emisión en pointerdown/touchstart, una unidad por contacto, clic accesible y limpieza por cancelación/pausa/segundo plano. Tecla M sin repetición automática. Se conservan dos contactos, movimiento relativo y un único RAF.
6. **Rangos con efecto:** Abanico II concentra la apertura y extiende el alcance; Aguja II perfora cuatro objetivos y reduce su intervalo a 0,46 s. Blindaje I→II amplía capacidad 45→65 y refrigeración I→II reduce recuperación 1,5→1 segundo. No alteran proyectiles ya emitidos ni regalan munición. Interpretación de trabajo del término «basares»: Phaser/armas; las dos carcasas de nave conservan sus características actuales.
7. **Chatarra:** fragmentos de nave y satélites destruidos producen 6/18 unidades físicas, acreditadas al recoger, con ID estable por expedición/etapa y recibo único. Contacto, meteoros y proyectiles no dan botín. Límite 32 recogibles y excepción para Atlas, que conserva 600.

## Decisiones y compatibilidad

Requisitos confirmados: continuar el primer nivel, más opciones y progresión real, tutorial integrado, Atlas más capaz, corregir misiles multitoque, chatarra de restos y botones mejor diseñados. Son decisiones reversibles de este lote el nombre Forja, las dos armas, sus rangos y sus precios. No se atribuyen al propietario como parámetros previamente aprobados.

Precios de trabajo: Abanico70, Aguja95, AbanicoII120, AgujaII140, blindajeII90 y refrigeraciónII110. Los precios anteriores24/30/45 y reposición6 por misil conservan su contrato. El ledger admite ampliaciones de catálogo sin reinterpretar recibos antiguos; futuros cambios de precio deben conservar `receiptPrices` históricos. Una compra sigue guardando coste, derecho y recibo en la misma operación atómica. La proyección al equipamiento se puede reintentar sin cobrar de nuevo.

No hay otra clave de campaña ni migración de motor. Las campañas históricas, guardados, maestros e informes se conservan. No main, PR3, force push, producción original, App Store, TestFlight ni gasto externo.

## Arte y archivos

Maestro nuevo: `art-source/forja-c9/generated-master.png`, generado con la herramienta de imágenes disponible; no procede de Canva ni de una biblioteca comprada. Exportación reproducible `art-source/forja-c9/export-atlas.py`, metadatos y atlas RGBA `assets/forja_modules_atlas_v1.webp` (1024×1024,261010bytes). Cuatro módulos ilustrados de Abanico/Aguja/blindaje/refrigeración integrados en las tarjetas. Son ilustraciones estáticas de hardware; no se presentan como nuevos fotogramas de disparo. Los proyectiles reutilizan las animaciones ilustradas existentes con composición distinta y física propia.

Mapa para revisión externa:

| Sistema | Fuente principal |
| --- | --- |
| Taller, compras, HUD y estados de partida | `src/game/03-ui-game-flow.js`, `styles.css`, `index.html` |
| Propiedad de dedos y misil | `src/game/08-loop-input-bootstrap.js` |
| Armas y rangos | `src/game/combat/classic-weapons.js`, `src/game/progression/classic-arsenal.js` |
| Economía y recibos | `src/game/progression/scrap-economy.js` |
| IA Atlas | `src/game/combat/guardian-atlas.js` |
| Tutorial | `src/game/narrative/flight-tutorial.js` |
| Botín de restos | `src/game/04-entities-collision-damage.js` y `spawnClassicScrap` en03 |
| Presentación de proyectiles | `src/game/07-player-item-rendering.js` |
| Exportación de código | `scripts/export-review-source.py` |

## Verificación y límites

El primer certificado conserva los fallos en `evidence/forja-remates/certification-01/`: contenido694/696, dos expectativas antiguas sobre caché y número de salvas. Estáticas/regresión/web se detuvieron en el nombre anterior de caché. Se actualizan los contratos sin retirar aserciones; la nueva caché también debe precargar el arte de la Forja. Una repetición intermedia de regresión detectó además el campo nuevo `flightTutorial:null`, que se añade explícitamente al contrato de ajustes corruptos.

La segunda certificación, paquete limpio, pruebas de navegador, publicación y huellas quedan registrados en este cierre. No atribuir los resultados anteriores a un SHA nuevo.

Memoria adicional estimada al decodificar el atlas nuevo: 4.194.304 bytes RGBA (4MiB). No se han medido FPS, latencia o memoria de un iPhone físico en este lote. La prueba controlada de tienda declara su dinero y checkpoints; no demuestra ingresos naturales ni balance humano.

## Organigrama y continuación

Las siete tareas del lote están en `docs/production-tasks.json` como `IN_REVIEW`, con aceptación técnica, artística y física separadas. El nivel1 no se declara `DONE` al ampliar estos sistemas. Los otros nueve niveles no se han producido con esta revisión.

Siguiente tarea exacta: el propietario prueba el paquete publicado en su teléfono: pilotaje+misil, progreso del tutorial, decisiones de la Forja y dificultad de Atlas. Ajustar precios/dificultad a partir de esa partida y mantener el trabajo recuperable. El código se entrega como ZIP con rutas/recursos/maestros y TXT de lectura; las evidencias binarias y ZIP históricos omitidos del export siguen en Git.

## Certificación local del incremento

`node scripts/certify-local.mjs docs/production-reports/evidence/forja-remates/certification-02`:11/11fases, salida0. Contenido696/696, motor60/60, arquitectura6/6, estáticas13/13, regresión34/34, web13/13, adaptadores14/14, audio3/3 y artpass12/12. Inventario100assets,12705086bytes, sin faltantes. `npm run build:preview` y `npm run test:preview`:salida0,25/25. Ejecuciones sobre las fuentes modificadas con HEAD inicial34ae40f y árbol sucio declarado; no confundir este recibo con el paquete limpio posterior.

## Paquete limpio, navegador y publicación comprobados

SHA funcional final: **39c2ca434ac9df38deccd235d011b76eb680fb58**, posterior al hito1c7c72e. Sólo añade claridad de arma/rango equipado y correcciones de los arneses de QA. El segundo build limpio se realiza en un worktree separado e inmutable para que las evidencias en escritura no contaminen su procedencia: `dirty=false`,135archivos,MotorV1false. La primera preparación de ese worktree declaró correctamente dirtytrue por un enlace node_modules; el guard rechazó el smoke. Se sustituyó por dependencias reales ignoradas y se reconstruyó sin ocultar cambios de fuentes.

- **Visual39c2ca4:**14/14,30capturas,390×844y320×568. Compras por UI de724 desde960declarados, saldo236, derechos/rangos, selección explícita, reserva47/capacidad65/recarga1, proyectiles de ambas armas, Atlas móvil y desenlace. [Resultado](evidence/forja-remates/visual-39c2ca4-02/results.json).
- **Multitoque1c7c72e:**20/20, diez PointerEvent nativos y diez TouchEvent de fallback instrumentado. Misil+piloto ambos órdenes, consumo único, cancelación, recarga, pausa/reinicio y alternativas accesibles. El input de39c2ca4 no cambia respecto a ese paquete. [Resultado](evidence/forja-remates/two-touch-1c7c72e-02/results.json).
- **Actualización/offline1c7c72e:**7/7 desde da3f4b8. Guardados/migración, cachés por generación, diez recursos de capítulo decodificados incluido el atlasForja con SHA-256, taller recuperado sin curación repetida, nueva partida conC9oculto hasta recuperación yN7histórico. Arte, caché y modelos conservan sus bytes en39c2ca4. [Resultado](evidence/forja-remates/offline-1c7c72e-03/results.json).
- **Texto/equipamiento final:**onboard-C9 11/11; estáticas13/13 y regresión34/34 después del ajuste de rango, salida0.
- **CI39c2ca4:**[Actions39147083429](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39147083429) completed/success; el hito1c7 también pasó [Actions39146620970](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39146620970).
- **Netlify aislado:**build-info verificado en39c2ca4,dirtyfalse,MotorV1false, revisión`d36f06b8e75a7621ae7e66721b49d3ce8960b03c25564cdbe2bd1a10cc22ebc5`. [Recibo](evidence/forja-remates/public-build-info-39c2ca4.json). La entrega documental posterior conserva el mismo código funcional y se verifica por separado.

Se conservan los intentos fallidos: el visual1c7c72e-01 esperaba un selector oculto pese a conservar armas compradas por el fixture previo; se comprueba ahora la visibilidad según el equipamiento real. El multitoque01 leyó después de la recuperación real de batería pero exigía todavía cero tiros; la traza de frames del02 demuestra conservación exacta y ausencia de emisiones antes del vencimiento. Offline01 pedíaC9prematuro; la apertura se mueve al perfil que sí lo recuperó. Offline02 omitía el atlasForja del observador de respuestas, aunque se decodificó sin conexión; el03 registra y verifica explícitamente la respuesta de su serviceworker.

El primer piloto natural se interrumpió, sin declararlo victoria: priorizaba botín/combate sobre CRONIUM, y el nuevo botín prolongó su decisión en1.8. Su registro demuestra ruta288,27recuperados,casco100y273chatarra. El generador seguía reponiendo energía. La repetición sólo corrige la política de entrada del piloto (módulo→energía necesaria→botín), manteniendo objetivos, reloj, amenazas y aserciones del juego. [Intento e interrupción conservados](evidence/forja-remates/natural-1c7c72e-01/interruption.json). No se usa como prueba de finalización.

## Cierre de recorrido y paquete de prueba

Partida completa final **39c2ca4:4/4,437554ms**, sin progreso, dinero, salud ni daño al jefe inyectados. Diez tramos1.1–1.10,36CRONIUM, compra real de preparaciónC9, tres misiles físicos, Atlasv7 básico/medio/super, llegadaIria y recarga normal. Termina con95casco y saldo **744ganados−24gastados=720**, un único reciboAtlas600 y acceso real al nivel2. [Resultado y16capturas naturales](evidence/forja-remates/natural-39c2ca4-01/results.json). Es un piloto automatizado con información visible; no sustituye dificultad humana ni revisión estética/física.

Paquete jugable probado: `NEON_CRONIUM_PREVIEW_39c2ca4.zip`,13035612bytes,136entradas,CRCcorrecto, SHA-256 **1fa5248cc23eb16f0d2e43256f9759844e8d09573342cbf43ab45806dac7ccae**. Entrada`index.html`→`juego/index.html`; ejecutar mediante servidorHTTP. Revisión **d36f06b8e75a7621ae7e66721b49d3ce8960b03c25564cdbe2bd1a10cc22ebc5**, idéntica a la pública verificada, source39c2ca4,dirtyfalse,MotorV1false. [Recibo de paquete](evidence/forja-remates/preview-package-39c2ca4.json).

Export de análisis: `scripts/export-review-source.py` produce ZIP de blobs del commit de cierre, TXT con fuentes actuales y un manifiestoJSON externo con SHA de cierre documental, SHA-256 de archivos/ZIP y validaciónCRC. Incluye código, pruebas, recursos, maestros, proyecto nativo, guías y licencias. Omite Git, dependencias locales, archivos secretos, ZIPviejos y evidencia binaria histórica; cada omisión queda listada y sigue recuperable en Git. No es un paquete para producción. Las huellas de ese export y el SHA documental se entregan con el archivo, evitando insertar la huella de un commit dentro de sí mismo.

**Organigrama:** siete remates integrados y técnicamente comprobados, todos`IN_REVIEW`; arte/ergonomía en teléfono, dificultad/economía humanas y Safari/iPhone siguen pendientes. Nivel1 no se marca`DONE`; niveles2–10 no se declaran construidos con esta metodología. No se abre más funcionalidad en el cierre. Siguiente partida: probar la Forja, tutorial, misil simultáneo y Atlas; ajustar esos resultados antes de expandir.
