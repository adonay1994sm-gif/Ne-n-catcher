> **Aclaración del propietario, 17/10/2026:** las siete nuevas referencias de destrucción de Chronos corresponden al acontecimiento inicial del **primero de diez niveles clásicos**. No constituyen siete etapas ni una orden para comprimir el juego. Se desarrolla esa secuencia conservando la campaña y su viaje. Incremento integrado y límites en [CHRONOS_DESTRUCTION_2026-10-17.md](production-reports/CHRONOS_DESTRUCTION_2026-10-17.md). Las decisiones históricas siguientes se conservan; no interpretar un estado de arte IN_REVIEW como aceptación del propietario.

---

Actualización de implementación17/10/2026: [vuelo unificado en el clásico](production-reports/UNIFIED_FLIGHT_2026-10-17.md). La última petición del propietario concentra el acceso en una campaña principal e integra viaje/armas/servicio sobre la base clásica. Las variantes antiguas quedan recuperables en QA; el plan10×10 sigue siendo objetivo y no contenido terminado. Se preservan las restricciones del motor y los guardados.

---

## Actualización vigente del propietario —17/10/2026

Se solicitan jefes vivos mediante arte y animaciones reales siguiendo las referencias aportadas, y cien etapas progresivas con argumento. Primer incremento: Guardian Atlas dentro del rescate CRONIUM del clásico; no otra demo abreviada. El [diseño editorial](design/CAMPAIGN_100_STAGES.md) es una propuesta de producción, no cien niveles disponibles. [Informe de integración](production-reports/GUARDIAN_ATLAS_2026-10-17.md). Se preservan campañas, guardados y límites técnicos; Motor V1 reservado/desactivado.

---

## Aplicación vigente tras revisión del propietario — 17/10/2026

El propietario rechaza la integración actual, el ritmo de la demo comprimida y las piezas superpuestas. Pide conservar el esquema del primer juego, construir una nave coherente por piezas y mejorar la experiencia natural de los diez niveles. Esta corrección precede a expansión de capítulos/etapas. La demo Chronos→Gaia queda recuperable como experimento, sin aceptación artística. El mandato de producto que sigue es el marco histórico vigente donde no contradiga esta corrección; no obliga a seguir multiplicando un prototipo rechazado. Informe verificable: docs/production-reports/NAVES_MODULARES_2026-10-17.md.

---

Historial conservado a continuación; las instrucciones incompatibles quedan sustituidas por este cierre.

# NEON CATCHER — Mandato rector de diseño y producción

Versión de dirección: **1.0 · 17 de octubre de 2026**. Referencia vigente de producto, dictada por el propietario. Repositorio: `adonay1994sm-gif/Ne-n-catcher`. Única rama autorizada de integración: `continuity-assets-audit-20261013`.

Este documento conserva los requisitos decisivos del mandato rector. Sustituye las directrices creativas anteriores incompatibles, incluida la prioridad de expandir primero las cien rutas cibernéticas o de cerrar diez imágenes independientes como producto. Los informes de Art Pass, Visual Rebirth e Immersive Rebirth se conservan como historial y evidencia; sus tareas verificadas no desaparecen. Esta visión no certifica código, arte ni dispositivos y no autoriza una decisión sobre el Motor V1.

## 1. Producto y jerarquía

**«Elijo una ruta, piloto y combato durante un viaje que puedo ver avanzar, descubro piezas, mejoro mi nave, visito estaciones y atravieso fronteras de civilizaciones».**

Una aventura arcade espacial accesible, con viajes guiados, combate satisfactorio, nave personalizable, estaciones y personajes. Fácil de empezar y atractiva por el viaje, las mejoras y los descubrimientos. No es un simulador, un mundo abierto, un administrador de inventario ni un juego inmóvil con fondos intercambiables. La calidad prevalece sobre una fecha; una compilación correcta no demuestra una experiencia terminada.

Orden de decisión: requisitos expresos del propietario → seguridad y conservación → experiencia arcade → coherencia artística y del mundo → implementación técnica. Un contrato de gameplay histórico puede evolucionar con diseño, compatibilidad y pruebas; una cifra histórica de tests no impone una mecánica mediocre.

## 2. Continuidad y autonomía

Antes de cambiar fuentes, verificar rama, árbol local, remoto, último informe y diferencias. El SHA `bfc6683085e3797a2b0c86957a299f8b7fba0d68` es referencia histórica del informe estratégico, no destino para volver atrás. No ejecutar `pull`, `reset`, `clean` o `checkout` que puedan descartar cambios: preservar, examinar y reconciliar primero. Conservar contribuciones posteriores y documentación de otros agentes.

Consultar los estados vigentes en `docs/CODEX_STATUS.md`, `docs/CODEX_NEXT_ORDERS.md`, `docs/PRODUCTION_LATEST_REPORT.md`, `docs/production-tasks.json`, la checklist/progreso general, los tres informes de `docs/visual-rebirth/`, `docs/immersive-rebirth/IMMERSIVE_LATEST_REPORT.md`, `ASSET_MANIFEST.json`, `ASSET_PRODUCTION_150.json` y `ART_DIRECTION_NEON_CATCHER.md`. Los enlaces vigentes deben resolver a evidencia y código actuales. Diez escenarios ilustrados, CH-01 animado, 69 recursos o cero niveles visualmente completos fueron datos del informe; verificar su estado actual, no convertirlos en objetivos fijos.

Conservar historial, maestros, pruebas útiles, controles, animador CH-01, guardados y build web/iOS. Reutilizar progresivamente los sistemas válidos sin abrir otro repositorio ni reescribir la arquitectura. Registrar diagnóstico breve y pasar a un incremento visible; la documentación demuestra y guía el trabajo, no lo sustituye.

Están autorizados el diseño reversible, código, refactorización razonada, recursos con herramientas disponibles, animación, integración, balance, economía, pruebas, correcciones, commits y push en la rama indicada, sin aprobaciones rutinarias. Las decisiones no cerradas se etiquetan como **decisiones de trabajo reversibles**, nunca como preferencias históricamente confirmadas. La aceptación estética y la decisión del motor quedan reservadas al propietario; mientras tanto se puede continuar QA, optimización y arte independiente.

### Límites permanentes

- No modificar `main`, ni modificar o fusionar PR #3; no hacer force push ni borrar trabajo válido.
- Mantener `USE_ENGINE_V1 = false`. No activar, migrar, reemplazar ni fusionar implementaciones del motor sin orden técnica específica; conservar EngineCore, Renderer, ParticleSystem y CampaignAdapter.
- Un único propietario de `requestAnimationFrame` para la campaña; módulos compatibles con el ciclo existente, sin otro motor paralelo.
- Preservar ambas campañas antiguas y sus guardados. Evitar cambios accidentales de N-7 al trabajar la campaña espacial.
- No publicar producción, App Store o TestFlight, ni habilitar publicidad/pagos reales. No contratar servicios, APIs facturables externas o licencias sin autorización económica explícita. Usar herramientas disponibles dentro de sus límites.
- No registrar secretos en código, informes, capturas o logs. No operaciones destructivas ni alteraciones de infraestructura de producción.
- Una preview aislada requiere acceso autorizado, destino de pruebas inequívoco y ausencia de cambios en producción. Verificar contenido, revisión y URL. Un código subido o una dirección antigua no prueban despliegue nuevo.

## 3. Canon de campaña: diez capítulos de diez etapas

La campaña principal objetivo es **10 × 10**, espacial y canónica. Cada etapa tiene identificadores estables de capítulo y etapa, origen, destino, tramo de ruta y versión de contenido. No equivale a la variante N-7 de cinco sectores y veinte rutas por sector; conservar esa variante y la campaña clásica como referencia y regresión. Reutilizar sistemas sin imponer los mapas urbanos a la aventura espacial. N-7 como IA acompañante es propuesta reversible; su argumento cibernético no se convierte automáticamente en canon.

| Capítulo | Base artística | Función y conexión del viaje |
| --- | --- | --- |
| 1 | La Onda de Choque | Evacuar Chronos y aproximarse al acceso de Gaia Nova. |
| 2 | Perímetro Atlas | Cruzar la red defensiva de Gaia y su ruta de salida. |
| 3 | Descenso Ígneo | Viajar a Vulkar y entrar en su región extractora. |
| 4 | Rastro de la Serpiente | Atravesar el territorio magmático y salir de Vulkar. |
| 5 | Blanco Absoluto | Aproximarse a Cryon y entrar en el dominio helado. |
| 6 | Fractura Leviatán | Cruzar su grieta industrial y la frontera exterior. |
| 7 | Ecos Imposibles | Entrar en Aether y descubrir las primeras anomalías. |
| 8 | Umbral Fantasma | Cruzar Aether profundo y su paso restringido. |
| 9 | Cementerio Gravitatorio | Transitar por Titan Omega y preparar el regreso. |
| 10 | Colapso Cronos | Regresar al reactor, superar la frontera final y resolver el incidente. |

Este mapa editorial requiere conexiones geográficas explícitas; no teletransportes inexplicables entre etapas. Titan Omega se usa provisionalmente como región industrial documentada: su relación con el antiguo gigante gaseoso naranja sigue pendiente de canon.

## 4. El recorrido gobierna la partida

Rutas prefijadas con maniobra dentro del área jugable: elegir una ruta conduce a jugarla, sin navegación libre. Cada recorrido tiene salida, tránsito, aproximación y llegada. El origen pierde presencia, los hitos se desplazan con profundidad y el destino gana escala; mantener dirección, iluminación y posición entre etapas con compresión arcade explícita.

Una única fuente de progreso gobierna encuentros, hitos del escenario, distancia HUD y cierre de etapa. Pausa y segundo plano lo detienen. Recargar restaura el último checkpoint coherente; no prometer recuperación exacta a mitad de combate. No usar un contador decorativo desligado del paisaje.

Cometas, restos y patrullas tienen procedencia y motivo. Incluir trayectorias laterales, aproximaciones y adelantamientos legibles; no hacer aparecer todo desde arriba. Cada etapa define origen/destino visuales, objetivo, acontecimiento distintivo, amenaza o decisión y desenlace. Ganar requiere misión y cierre de ruta, no siempre una cuota de núcleos.

Las semillas pueden variar encuentros; los hitos geográficos y narrativos son diseñados. Versionar generadores y reproducciones, y aislar o migrar reglas antiguas. Duración inicial propuesta: 2–4 minutos por etapa, ajustable tras jugar; no rellenar un trayecto vacío para cumplirla.

## 5. Control y combate arcade

Entrada principal **CONTINUAR VIAJE**, con reanudación breve. Introducir pilotaje/disparo, habilidad, pieza y taller/comercio de forma gradual, mediante acciones y ayudas cortas repetibles desde ajustes. Estaciones opcionales cuando proceda, sin trámites antes de cada partida. Pausa fiable, reinicio rápido y guardado por etapas. Sin rachas obligatorias, castigos por ausencia, esperas de energía ni recompensas que exijan conexión diaria.

Control táctil preciso y relativo: apoyar el dedo no teletransporta la nave. Inercia en animación y respuesta sin impedir esquivar un ataque anunciado. Disposición usable con pulgares. Decisión inicial reversible: disparo básico automático configurable, alternativa manual y hasta dos habilidades visibles; comprobar ambas modalidades antes de fijar el valor predeterminado. La munición limitada puede reservarse a armas especiales; el arma básica permite seguir jugando sin frustración económica.

Escudo direccional, impulso evasivo, tractor, pulso o señuelos son propuestas, no una lista de implementación inmediata. Cada habilidad implementada debe tener función táctica propia, coste/disponibilidad legibles, preparación, animación, efecto, sonido, recuperación y respuesta enemiga. Evitar habilidades equivalentes con distinto color.

Todo ataque debe anticiparse y permitir respuesta. Impacto, daño y destrucción requieren estados visuales. La muerte recompensa una sola vez; repetir frames no duplica disparos ni eventos. Combinar combate, esquiva, rescate y recuperación con descansos. Dificultad no significa saturación permanente ni daño inevitable.

## 6. Nave, piezas y economía ligera

Las piezas cambian una acción, aspecto o respuesta perceptible. Ranuras iniciales propuestas: arma principal, propulsión, defensa y utilidad; ampliarlas solo por una necesidad demostrada. Evitar ocho subsistemas obligatorios desde el inicio.

Piezas recuperadas, recompensas y compras. Decisión inicial: piezas estructurales se guardan e instalan en estaciones; consumibles de emergencia pueden usarse en ruta. Mostrar ganancia, pérdida, compatibilidad y coste; recomendar con motivo sin equipar/vender automáticamente. Dos configuraciones viables deben superar el mismo encuentro de forma distinta; no obligar a comprar una pieza concreta. Personalización mediante módulos y capas ilustradas compartidas, sin exigir una nave nueva por combinación.

Mercado diegético, sin comercio entre jugadores ni dinero real. Comenzar con una estación, un comerciante reconocible, taller y catálogo corto. Personaje con retrato/sprite, animación pertinente, tono y mercancías coherentes. Economía mínima propuesta: créditos y piezas; materiales adicionales solo con necesidad real. Bodega pequeña y comprensible.

Separar energía táctica de combustible cuando cumplan funciones diferentes. Combustible orientado a preparación y estaciones, con asistencia/reintento/suministro de emergencia que eviten bloqueos permanentes, pagos reales o esperas. Compra, venta, reparación y equipamiento son transacciones coherentes: sin negativos, compras duplicadas, pérdida por interrupción ni recompensas repetidas al recargar.

## 7. Territorios, personajes y narrativa

Cada capítulo culmina en un encuentro fronterizo o de acceso propio. El guardián tiene responsabilidad territorial y comunica por qué detiene al jugador: identidad inválida, protocolos alterados o protección de recursos pueden explicar hostilidad. No repetir un comandante entre fronteras sin evolución. Diseñar entrada, advertencia, patrón, fases, ventanas de respuesta, resolución y consecuencia; retirarse, conceder acceso o quedar desactivado son desenlaces válidos. La fauna como Magma Serpent no necesita convertirse en funcionariado fronterizo.

Comerciantes, pilotos y operadores recurrentes mediante interacciones breves; historia unida a sucesos del gameplay y consultable después. No tapar peligros con textos largos. Paisaje con memoria, descubrimientos opcionales dentro del corredor, mejoras visibles e identidad audiovisual territorial son propuestas a probar antes de generalizar. Repetición con mejores resultados/estrategias, sin farmeo agotador. No multijugador, clanes, comercio real, mundo abierto, crafting masivo, pases de temporada ni doblaje completo en esta primera producción.

## 8. Arte vivo e interfaz útil

Ciencia ficción arcade estilizada: siluetas claras, color expresivo, materiales elaborados y tecnología con personalidad. La inmersión no requiere fotorrealismo ni una cabina llena de lecturas de simulación. Planeta, nave, pieza, estación, personaje, enemigo, jefe y acontecimiento importante tienen diseño propio.

**CONCEPTO → MAESTRO → ESTADOS → ANIMACIÓN → OPTIMIZACIÓN → REGISTRO → INTEGRACIÓN → PARTIDA → REVISIÓN.** Conservar masters y procedencia/derechos; registrar dimensiones, pivote, estados y animaciones. Spritesheets, piezas y esqueletos 2D son válidos. No exigir doce frames a un icono; sí cambios auténticos al desplegar armas, recibir daño o destruirse. Compartir atlas, cargar solo lo necesario y limitar/liberar cachés por capítulo; medir memoria decodificada además del peso WebP.

El código compone, interpola, ilumina y reproduce el arte; también sirve para retículas, indicadores y partículas secundarias. No presentar rayas como criaturas, círculos como estaciones terminadas o una sola imagen girada como todas las animaciones. Fixtures geométricos de pruebas no son arte final. Separar capas requiere recorte, transparencia y reconstrucción del fondo oculto; duplicar una imagen a velocidades distintas no basta. Sin herramienta de generación, registrar recurso bloqueado y avanzar en tareas independientes, sin inventar archivos.

Menú con CONTINUAR VIAJE dominante, destino/etapa visibles, mapa/nave/estación/ajustes secundarios. Las dos campañas técnicas conservadas no constituyen la presentación final del producto. HUD táctico con marcos e iconografía diseñados, luz controlada y animaciones con significado; sin lecturas ficticias. Viaje: destino, recorrido e integridad. Combate: arma, habilidades y amenazas. Estación: créditos, piezas y servicios. Posiciones estables y controles que no saltan de lugar.

Distancias con escala arcade coherente y explícita; progreso visual y HUD coinciden. Texto dinámico accesible, sin incrustarlo en imágenes. Safe areas, pulgares, texto legible, volumen/silencio, reducción de sacudidas/destellos y señales que no dependan solo del color. Investigar los glifos intermitentes registrados: reproducir la causa antes de atribuirla a blur/transparencia o aplicar un arreglo general.

## 9. Capítulo 1 y demostración P1

Chronos → Gaia es un viaje conectado. Los siguientes son **beats de diseño propuestos**, no etapas ya implementadas:

| Etapa | Beat inicial |
| --- | --- |
| 1.1 | Emergencia en Chronos: pilotaje y origen del incidente. |
| 1.2 | Perímetro destruido: esquiva e impactos con consecuencias. |
| 1.3 | Campo de restos: primera pieza identificable recuperable. |
| 1.4 | Salida orbital: Chronos pierde escala y abre el corredor. |
| 1.5 | Tránsito: cometas, una habilidad y espacio para respirar. |
| 1.6 | Estación: comerciante, reparación y mejora breve. |
| 1.7 | Propulsión nueva probada en un encuentro diseñado. |
| 1.8 | Gaia crece en el horizonte; tráfico y primeras señales Atlas. |
| 1.9 | Aproximación a patrulla, advertencia y preparación táctica. |
| 1.10 | Guardián propio de acceso, resolución y llegada persistida. |

La primera demostración es más corta: **salida → tránsito → frontera, con parada de servicio enlazada**. Debe mostrar el bucle esencial antes de producir diez etapas completas. El lugar y las duraciones de la estación pueden ajustarse por coherencia de mapa; no repetir esta fórmula obligatoriamente en todos los capítulos.

### Criterios de aceptación de P1

1. Se inicia una ruta y la nave se aleja visiblemente de Chronos; hitos/destino reflejan un progreso real único.
2. Pilotaje preciso, disparo configurable y enemigo animado con ataque anunciado, respuesta posible, daño/destrucción y recompensa única.
3. Se recupera una pieza identificable durante la partida y se llega a una parada enlazada; comerciante/taller comprensibles.
4. Instalar/mejorar esa pieza altera algo visible y funcional al continuar; no es solo un porcentaje oculto.
5. La frontera ofrece advertencia y resolución coherentes; llegada/checkpoint y recompensa persisten sin duplicación.
6. Pausa, segundo plano, reinicio y recarga funcionan; guardados nuevos aislados de clásico/N-7 y sin pérdida de progreso anterior.
7. Arte real animado dentro de gameplay, HUD legible, una partida natural completa y captura/vídeo real con comparación visual.
8. Build/regresiones relevantes, evidencia reproducible y revisión técnica; aceptación artística y física registradas separadamente.

Un recorrido de prueba aislado es válido para demostrar el bucle, sin declararlo juego terminado. Antes de expansión masiva, presentar P1 a revisión estética y resolver la puerta del motor con el propietario. No multiplicar cien veces un estilo no revisado; continuar QA, optimización o assets independientes mientras esas decisiones estén pendientes.

## 10. Arquitectura y guardados

Separar definición de ruta, encuentros, progreso, equipamiento, economía, presentación y guardado mediante interfaces pequeñas compatibles con los módulos existentes. Una fuente de progreso, un ciclo de actualización, sin framework paralelo. La presentación admite una futura decisión de motor sin duplicar hoy su implementación; necesidades que excedan el actual se documentan para esa revisión.

Modificar fuentes y regenerar `game.js` y copias web/iOS; nunca parches exclusivos de bundles. Guardado nuevo con clave/versionado propios. Migración idempotente con respaldo y tabla de equivalencias; si no existe equivalencia real, conservar ambos guardados y explicarlo. La misión N-7 37 no se convierte por coincidencia numérica en etapa 3.7.

## 11. Organigrama y puertas de calidad

| Puerta | Entrega | Criterio para cerrar |
| --- | --- | --- |
| P0 | Continuidad, rector, canon/decisiones y checklist reconciliada | Contradicciones resueltas y decisiones registradas; no una enciclopedia. |
| P1 | Demo salida/tránsito/frontera, nave/HUD/enemigo y pieza/estación/equipamiento | Bucle completo jugable con arte real, partida natural y comparación visual. |
| P2 | Bucle arcade consolidado, dos configuraciones, economía/reparación, accesibilidad/reentrada | Repetirlo sin errores económicos ni de guardado. |
| Puerta M | Decisión del motor | Exclusivamente por orden técnica del propietario. |
| P3 | Capítulo 1 | Diez etapas conectadas, distintas y verificadas, frontera y recompensa. |
| P4 | Expansión Gaia/Vulkar, Cryon/Aether, Titan Omega/regreso | Territorios integrados por lotes tras P1/revisión y puerta de motor correspondiente. |
| P5 | Calidad de lanzamiento | Cien etapas coherentes terminadas, QA móvil/rendimiento/accesibilidad; distribución/monetización solo autorizadas. |

`docs/production-tasks.json` sigue siendo el registro único de tareas. Reconciliar el organigrama anterior mediante relaciones explícitas de sustitución, sin borrar evidencias ni convertir porcentajes históricos en porcentaje del nuevo producto. Estados: PENDING, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE. Separar campos de aceptación artística y prueba física. Implementación parcial o documentación no justifican DONE.

Asignar propietario de archivos a cada agente y un integrador. No compilar ni certificar fuentes que otros estén modificando: congelar snapshot o usar worktree controlado. Priorizar tareas empezadas y entregas completas, no cien diseños sin integración.

## 12. Verificación y cierre

Inspeccionar `package.json` y argumentos reales de scripts antes de usarlos. Suites históricas aplicables: `npm run build`, `test:engine`, `test:architecture`, `test:content`, `test:static`, `npm test`, `build:preview`, `test:preview`, `node scripts/audit-asset-inventory.mjs`, certificación local y navegador. Añadir cobertura pertinente de continuidad, pausa de ruta, capítulos, transitabilidad, eventos únicos, recompensas, transacciones, interrupciones y migración/guardado. Al cambiar reglas, actualizar contratos conservando regresiones y compatibilidad; no borrar aserciones para conseguir verde.

Registrar comando exacto, salida, casos, SHA, árbol limpio/sucio y evidencia. Separar lógica simulada, Chromium real, Safari, iPhone físico, build iOS y despliegue remoto. Un enemigo insertado artificialmente no prueba combate natural; galería 10/10 prueba apertura de escenas, no calidad estética. Una etapa se cierra cuando viaje, arte/animación, combate, objetivo, recompensa, interfaz y guardado funcionan juntos, con partida/captura real, regresión y revisión. QA física pendiente impide certificar dispositivo, pero no borra implementación técnica comprobada.

Después de cada hito y sesión: **DIAGNÓSTICO → INFORME DE PRODUCCIÓN**. Actualizar `docs/CODEX_STATUS.md`, `docs/CODEX_NEXT_ORDERS.md`, `docs/PRODUCTION_LATEST_REPORT.md`; los informes anteriores enlazan al cierre vigente conservando su historia. Informe detallado en `docs/production-reports/` con entrega y fecha:

- Fecha/rama/SHA inicial, funcional probado y cierre documental; objetivo y experiencia realmente jugable.
- Requisitos confirmados frente a decisiones propuestas; archivos, sistemas reutilizados/sustituidos/pendientes.
- Assets/master/exportación/estados/integración; pruebas fallidas, corregidas y no ejecutadas, logs y capturas.
- Tareas por estado y criterio de cierre; rendimiento medido, memoria estimada y limitaciones.
- Paquete/revisión/SHA-256/entradas/instrucciones y URL solamente comprobada; riesgos, decisiones reservadas y siguiente acción exacta.

No atribuir horas sin medir, porcentaje comercial, pruebas, capturas, commits, assets o despliegues sin evidencia. Hacer commits frecuentes y coherentes. Cerca del límite, dejar nuevas funciones, conservar, probar lo posible, publicar WIP explícito si procede y documentar. Si falla push, guardar parche/archivo completo recuperable e indicar qué sigue local. No prometer ejecución permanente/nocturna fuera de sesión activa.

**Criterio final: fácil de empezar, satisfactorio de controlar, reconocible como aventura espacial, coherente al avanzar y construido con arte que vive dentro del juego.**
