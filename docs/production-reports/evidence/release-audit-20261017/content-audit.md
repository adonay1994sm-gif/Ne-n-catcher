# Auditoría de contenido y experiencia — NEON CRONIUM

Lectura de fuentes e informes el 17/10/2026. HEAD observado `97220c8bd7f81e7108b6950b1402809ba4d0c9a9`, rama `continuity-assets-audit-20261013`, árbol limpio. No se modificó ni ejecutó el juego; las pruebas citadas son evidencias históricas identificadas, no pruebas nuevas. Dictamen: **prototipo integrado y publicable para playtest privado; no versión comercial final**. Hay sistemas aprovechables y progreso técnico real; sigue faltando la mayor parte del contenido con la calidad prometida.

## 1. CRÍTICO — resolver la definición exacta de la edición que se va a vender

**Existe:** diez territorios clásicos (`src/game/00-bootstrap-config.js:104`), cien rutas N-7 por cinco sectores y diez etapas nuevas dentro del territorio clásico 1 (`src/game/progression/chronos-flight.js:114`). **No existe aún:** una campaña canónica de cien etapas integradas. `docs/design/CAMPAIGN_100_STAGES.md:7` lo declara editorial; `:194` confirma que no añade import runtime. El puente N-7 usa su propio catálogo (`src/game/progression/legacy-content-entry.js:20`). No contar 10+100+10 como 120 niveles finales ni llamar a N-7 cien etapas espaciales.

**Meta medible:** decidir y escribir qué compra el jugador (10 territorios con X etapas, o las 100 canónicas); un solo recorrido principal y manifiesto verificable de capítulos/etapas con IDs, ruta, objetivo, cierre y estado. Todo lo anunciado debe poder terminarse en el paquete release. Si se mantiene cien etapas como promesa de lanzamiento, las restantes no se pueden sustituir por títulos de datos.

## 2. CRÍTICO — convertir el primer viaje en referencia de diversión, sin confundir subdivisión con variedad

**Existe:** Chronos→Gaia tiene 10 checkpoints, 360 s mínimos, rescate del emisor y parada real C9. Sus etapas duran 32–38 s y 9 de 10 comparten colección de cuota acumulativa (`chronos-flight.js:122`). Aparición de señales máximo dos, dos cometas diseñados y patrullas sólo desde 1.7 (`src/game/03-ui-game-flow.js:272`). Eso cumple viaje técnico; no prueba que diez etapas sean diez encuentros completos o que los seis minutos tengan buen ritmo. El robot de QA acabó con 100% de casco y 10 disparos (`docs/production-reports/CHRONOS_GAIA_10_STAGES_2026-10-17.md:147`); evidencia útil, no conclusión de dificultad humana.

**Meta medible propuesta:** 8–12 personas externas en móvil, sin instrucciones privadas; ≥80% entiende desplazarse/disparar/objetivo en 60 s, ≥70% completa la introducción sin ayuda, se mide tiempo sin acción/decisión y se corrigen los tramos que los jugadores consideran espera. Dos configuraciones superan el mismo encuentro con diferencias observables. No sumar etapas hasta que este lote sea divertido según observación y feedback concreto.

## 3. CRÍTICO — producir los guardianes reales y el final, no registros de nombres

**Existe:** un jefe clásico real identificado: Guardian Atlas, exclusivamente en clásico `currentLevel===1` (`src/game/03-ui-game-flow.js:366`); entrada/avisos/ataque/daño/resolución están conectados (`:405`, `:450`, `:462`). **N-7:** `generator.js:69` define 10 nombres y dos fases, pero `encounter-director.js:9` sólo agenda oleadas/pickups: `plan.boss` no entra en la simulación. Ganar N-7 sólo exige fin de oleadas y ausencia de amenazas (`03-ui-game-flow.js:1226`). CRONOS PRIME y los otros guardianes siguen planificados; el final clásico actual es una pantalla genérica (`:1258`).

**Meta medible:** cada frontera prometida debe tener partida natural grabada que muestre entrada, aviso legible, patrón con respuesta, daño, al menos una transición propia, resolución y premio único persistido. El último territorio debe incluir combate/resolución jugable y epílogo; recargar no duplica recompensas. Una lista de fases o un screenshot no cierra esta meta.

## 4. ALTA — enemigos de cada territorio y animación material

**Existe:** CH-01 tiene animador/combate; la mayor parte de enemigos de Vulkar, Cryon, Aether y Titan sólo aparece en los textos de misión. Los `threatPool` siguen `meteor/debris/satellite` (`00-bootstrap-config.js:122`–`:183`), y `chooseThreatSprite` produce meteoritos, satélite o chatarra (`04-entities-collision-damage.js:36`). Por ejemplo Magma Serpent no tiene cuerpo segmentado jugable. El inventario actual declara 155 entradas: 119 PLANNED, 34 IN_REVIEW, 2 IMPLEMENTED_CODE; estos estados no son una medición comercial ni necesariamente 155 archivos distintos.

**Meta medible:** antes de cerrar cada mundo, al menos dos familias reconocibles por silueta y movimiento, ataques anticipados y estados auténticos de impacto/destrucción; al menos una interacción propia del territorio. Probar tres jugadores identificando amenaza y respuesta sin nombre flotante. Registrar maestro, exportación y captura natural por asset.

## 5. ALTA — llevar la coherencia de viaje y profundidad a los nueve territorios restantes

**Existe:** paisaje independiente/geografía progresiva en Chronos; planeta + espacio + fragmentos separados en Vulkar 3 (`06-world-rendering.js:329`). El resto selecciona una ilustración de fondo por nivel (`:395`–`:403`), no una ruta continua equivalente. La tabla histórica sigue indicando cero niveles visualmente completos y sus limitaciones, con enlaces a cierres posteriores (`docs/visual-rebirth/ORGANIGRAMA_10_NIVELES.md:19`–`:32`).

**Meta medible:** cada territorio anunciado comparte continuidad de salida/tránsito/aproximación/llegada, arte de profundidad realmente separado y al menos un acontecimiento ambiental animado con causa. QA de partida en vertical y horizontal sin HUD recortando nave/amenazas; revisión estética explícita del propietario por lote. Las imágenes bonitas de dossier no cuentan como juego integrado.

## 6. ALTA — historia con consecuencias y cierre observable

**Existe:** incidente hostil, rastro de CRONIUM, Mira C9 y avisos Gaia conectados al viaje (`03-ui-game-flow.js:208`–`:238`), más Atlas contextual. La trama editorial y personajes de cien etapas no están en runtime (`docs/design/CAMPAIGN_100_STAGES.md:17`–`:23`, `:194`). El catálogo N-7 tiene avisos de jefes/críticos/racha, pero la única llamada encontrada en el runtime es sectorStart (`03-ui-game-flow.js:1142`); no confundir catálogo con eventos conectados. Final clásico: “Has estabilizado el Colapso Neon” / “La siguiente expansión podrá añadir más sectores” (`:1261`, `:1271`).

**Meta medible:** mapa de todos los hitos argumentales → eventos reales → consecuencias persistidas, introducción y desenlace jugables. Una partida completa sin leer documentos explica quién atacó, por qué viajamos y qué resolvemos. Mensajes breves no bloquean peligros; diario opcional permite recuperarlos. Al menos un tester externo puede relatar el conflicto y la resolución correctamente.

## 7. ALTA — mejoras tácticas y estación con alcance honesto

**Existe:** nave modular de 2 familias × 3 slots, ensamblaje animado, pero **cosmético** (`src/game/ship/modular-ship.js:1`–`:9`). Armas sí cambian reglas: pulso, gemelo, lanza (`combat/classic-weapons.js:9`). C9 es reparación gratuita al 100% al entrar (`03-ui-game-flow.js:130`) e instalación/calibración del único emisor recuperable (`:168`), no mercado ni catálogo de piezas/combustible. No hace falta añadir economía si empeora el arcade, pero no anunciarla como existente.

**Meta medible:** elegir entre personalización visual honesta o módulos con efectos tácticos claros. Si hay progresión táctica, dos builds viables, comparación de ganancias/pérdidas, aprendizaje gradual y pruebas de instalación/desinstalación/interrupción sin perder inventario o dinero. Si se mantiene C9 ligera, cerrar personaje/retrato/animación y efectos visibles de la mejora; no producir inventario masivo.

## 8. ALTA — audio y validación humana/física aún no equivalen a la certificación técnica

**Existe:** música actual son tres osciladores sostenidos (`02-storage-audio.js:201`–`:219`) y efectos genéricos por tono (`:240`), con volumen y lifecycle útiles. No hay música por territorio/jefe ni diseño de materiales equivalente a la visión. Los tests, Chromium natural, offline y CI prueban contratos concretos; el informe reconoce límites físicos y de FPS (`CHRONOS_GAIA_10_STAGES_2026-10-17.md:153`, `:159`).

**Meta medible:** identidad sonora por entorno y eventos, mezcla que priorice señales, mute/volumen y reanudación Safari sin bloqueo. Después una matriz de dispositivos reales, sesiones prolongadas, memoria/FPS/temperatura y controles a dos dedos. Gate propuesto: cero fallos críticos reproducibles, cero pérdida de saves, objetivos medidos de fluidez fijados por dispositivo, revisión humana de audio/claridad; no declarar “AAA” o “listo” por sumar tests.
