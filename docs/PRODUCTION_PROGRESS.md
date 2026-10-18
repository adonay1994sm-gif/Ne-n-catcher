# NEON CRONIUM — Progreso verificable de producción

Fecha del registro: **2026-10-18**. Rama: **continuity-assets-audit-20261013**. Base: **f5b486ccfcdc56319417c33d7fa9282708ed6d64**.

Fuente editable: [production-tasks.json](production-tasks.json). Regenerar con **node scripts/update-production-progress.mjs**; comprobar sincronización con **node scripts/update-production-progress.mjs --check**. El script no compila, prueba ni publica el juego.

Estados: **PENDING**, **IN_PROGRESS**, **BLOCKED**, **IN_REVIEW**, **DONE**. DONE exige todos los criterios, SHA de implementación, pruebas ejecutadas y evidencia; la presencia de un archivo o dato no basta. Dependencias indican orden de producción, no certificación automática. SHA y pruebas vacíos significan que no existe cierre verificado en este registro.

## Mandato rector vigente — campaña espacial 10 × 10

Referencia: [PRODUCT_VISION.md](PRODUCT_VISION.md). Las tablas B03–B10 y el catálogo conservan evidencia histórica y backlog; las rutas N-7 no equivalen a las nuevas etapas. El registro anterior tenía 22/267 tareas cerradas: ese cociente no mide el nuevo juego. Los cambios de denominador quedan en production-tasks.json.

| ID / puerta | Entrega | Estado de trabajo | Técnica | Artística | Física |
| --- | --- | --- | --- | --- | --- |
| P0-01 / P0 | Preservar continuidad y fijar mandato rector canónico | DONE | PASSED | NOT_APPLICABLE | NOT_APPLICABLE |
| P1-01 / P1 | Demostrar salida, pieza, servicio, mejora y frontera en el ciclo legacy | IN_REVIEW | PASSED | CHANGES_REQUESTED | PENDING |
| P1-02 / P1 | Revisión estética del primer viaje antes de multiplicar contenido | IN_PROGRESS | NOT_APPLICABLE | CHANGES_REQUESTED | PENDING |
| P2-01 / P2 | Consolidar dos configuraciones viables y economía breve segura | PENDING | PENDING | PENDING | PENDING |
| PM-01 / M | Decisión técnica reservada sobre Motor V1 | BLOCKED | PENDING_OWNER | NOT_APPLICABLE | PENDING |
| P3-01 / P3 | Completar diez etapas conectadas del capítulo Chronos-Gaia | IN_REVIEW | TEN_STAGES_ATLAS_STORY_PASSED_CHROMIUM_OWNER_REVIEW_PENDING | PENDING | PENDING |
| P4-01 / P4 | Expandir la campaña espacial a diez capítulos de diez etapas | PENDING | PENDING | PENDING | PENDING |
| P5-01 / P5 | Certificar calidad móvil y preparar distribución autorizada | PENDING | PENDING | PENDING | PENDING |
| P1-SHIP-01 / P1 | Nave ensamblada, dos configuraciones y hangar dentro del clásico | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P1-ATLAS-01 / P1 | Guardian Atlas ilustrado y combate integrado a recuperación clásica Gaia | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P0-DESIGN-100 / P0 | Diseñar editorialmente cien etapas espaciales conectadas sin declararlas runtime | IN_REVIEW | PASSED_EDITORIAL_SCHEMA | PENDING_OWNER | NOT_APPLICABLE |
| P1-FLIGHT-01 / P1 | Integrar una entrada principal, salida real de Chronos, recarga y emisor recuperable en C9 | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P1-CHRONOS-02 / P1 | Desarrollar el acontecimiento ilustrado de destrucción de Chronos dentro del nivel 1 | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P1-HUD-01 / P1 | Integrar HUD compacto y recuperar espacio real de pilotaje clásico | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P1-COMBAT-02 / P1 | Concentrar gemelo y añadir lanza con daño ×1/×2/×3 y batería común | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P1-ATLAS-02 / P1 | Aumentar desafío de Atlas sin mostrar la solución de esquiva | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P1-ORBS-01 / P1 | Reducir orbes clásicos al50% visual conservando recogida | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P1-SHIELD-01 / P1 | Integrar campo de fuerza ilustrado con estados de activación y absorción | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P1-VULKAR-01 / P1 | Llevar nivel3 al espacio con planeta y restos orbitales independientes | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P1-TRANSITIONS-01 / P1 | Hacer legibles selector, briefing y victoria de los diez niveles | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P1-IDENTITY-02 / P1 | Fijar la nave modular como identidad única y retirar la ilustración anterior | IN_REVIEW | PASSED | ACCEPTED_MODULAR_BASE | PENDING |
| P1-INPUT-02 / P1 | Pilotar y disparar con dos contactos independientes y mantener para disparar | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P1-COMET-02 / P1 | Animar cometa mineral helado y alinear núcleo y estela con su trayectoria | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P1-CI-01 / P1 | Cerrar fallo de Actions por contrato de nave retirada y verificar la nave actual offline | DONE | PASSED | NOT_APPLICABLE_TO_CI_FIX | NOT_REQUIRED_FOR_CI_FIX; GAME_DEVICE_CERTIFICATION_REMAINS_PENDING |
| P3-TRANSIT-01 / P3 | Integrar diez etapas jugables del tránsito Chronos–Gaia con vacío, C9 y checkpoints | IN_REVIEW | PASSED_CHROMIUM_AND_REGRESSION | PENDING_OWNER | PENDING |
| P3-CH1-01 / P3 | Etapa 1.1 · Emergencia en Chronos | IN_REVIEW | PASSED_CHROMIUM_AND_REGRESSION | PENDING_OWNER | PENDING |
| P3-CH1-02 / P3 | Etapa 1.2 · Perímetro destruido | IN_REVIEW | PASSED_CHROMIUM_AND_REGRESSION | PENDING_OWNER | PENDING |
| P3-CH1-03 / P3 | Etapa 1.3 · Campo de restos | IN_REVIEW | PASSED_CHROMIUM_AND_REGRESSION | PENDING_OWNER | PENDING |
| P3-CH1-04 / P3 | Etapa 1.4 · Salida orbital | IN_REVIEW | PASSED_CHROMIUM_AND_REGRESSION | PENDING_OWNER | PENDING |
| P3-CH1-05 / P3 | Etapa 1.5 · El gran vacío | IN_REVIEW | PASSED_CHROMIUM_AND_REGRESSION | PENDING_OWNER | PENDING |
| P3-CH1-06 / P3 | Etapa 1.6 · Refugio C9 | IN_REVIEW | PASSED_CHROMIUM_AND_REGRESSION | PENDING_OWNER | PENDING |
| P3-CH1-07 / P3 | Etapa 1.7 · Estela de regreso | IN_REVIEW | PASSED_CHROMIUM_AND_REGRESSION | PENDING_OWNER | PENDING |
| P3-CH1-08 / P3 | Etapa 1.8 · Gaia en la distancia | IN_REVIEW | PASSED_CHROMIUM_AND_REGRESSION | PENDING_OWNER | PENDING |
| P3-CH1-09 / P3 | Etapa 1.9 · Señales de Atlas | IN_REVIEW | PASSED_CHROMIUM_AND_REGRESSION | PENDING_OWNER | PENDING |
| P3-CH1-10 / P3 | Etapa 1.10 · Llegada a Gaia | IN_REVIEW | PASSED_CHROMIUM_AND_REGRESSION | PENDING_OWNER | PENDING |
| P1-BRAND-01 / P1 | Nombre activo NEON CRONIUM en juego, distribución y splash | IN_REVIEW | PASSED_CHROMIUM_UPGRADE_OFFLINE | PENDING_OWNER_SPLASH | PENDING |
| P2-PRESENTATION-01 / P2 | Encuadrar Gaia fuera del HUD e integrar C9 ilustrada con estados reales | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P2-AUDIO-01 / P2 | Integrar cuatro partituras originales contextuales sin un segundo reloj | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P2-COMFORT-01 / P2 | Aplicar reducción de sacudidas y destellos también a Canvas | DONE | PASSED | NOT_APPLICABLE | PENDING |
| P2-SAVE-01 / P2 | Recuperar finalización interrumpida sin dividir desbloqueo y checkpoint | DONE | PASSED | NOT_APPLICABLE | PENDING |
| P2-PLAYTEST-01 / P2 | Preparar y ejecutar diez pruebas humanas de Chronos–Gaia | BLOCKED | PREPARED_NOT_EXECUTED | NOT_APPLICABLE | PENDING |
| P3-PURSUIT-01 / P3 | Conectar las etapas Chronos–Gaia con transiciones continuas y persecución posterior a la ruptura | IN_REVIEW | PASSED | PENDING_OWNER | PENDING |
| P1-GAIA-02 / P1 | Integrar CH-02 animado con ataque anunciado en una Gaia orbital multicapa | IN_REVIEW | PASSED_INTEGRATED_CHROMIUM | PENDING_OWNER | PENDING |
| P2-C9-FAST-01 / P2 | Abrir C9 al alcanzar el atraque y conservar salida, pausas y guardados | IN_REVIEW | PASSED_SCOPED_CHROMIUM_AND_AUTOMATION | PENDING_OWNER | PENDING |
| P1-SHIP-CLEAN-01 / P1 | Integrar propulsión y daño sin una imagen de humo pegada a la nave | IN_REVIEW | PASSED_SCOPED_CHROMIUM_AND_AUTOMATION | PENDING_OWNER | PENDING |
| P2-PULSE-VISUAL-01 / P2 | Alinear los proyectiles verticales reales con su nuevo arte e impactos | IN_REVIEW | PASSED_SCOPED_CHROMIUM_AND_AUTOMATION | PENDING_OWNER | PENDING |
| P2-ENEMY-COMBAT-01 / P2 | Mantener intención y respuesta de combate de los enemigos activos | IN_REVIEW | PASSED_SCOPED_CHROMIUM_AND_AUTOMATION | PENDING_OWNER | PENDING |
| P1-ATLAS-MANUAL-01 / P1 | Validar Atlas como reto manual con AUTO apagado y opt-in sólo en Ajustes | IN_REVIEW | PASSED_SCOPED_CHROMIUM_AND_AUTOMATION | PENDING_OWNER | PENDING |
| P2-ARSENAL-01 / P2 | Vincular Pulso→Atlas→Gemelo a victoria persistida y conservar armamento antiguo | IN_REVIEW | PASSED_SCOPED_CHROMIUM_AND_AUTOMATION | PENDING_OWNER | PENDING |
| P2-ENTRY-CANON-01 / P2 | Presentar una entrada definitiva con un único viaje principal | IN_REVIEW | VERIFIED_CHROMIUM | PENDING_OWNER | PENDING |
| P2-MAGAZINE-20-01 / P2 | Integrar cargador de veinte disparos y recarga progresiva sin contador HUD | IN_REVIEW | VERIFIED_CHROMIUM | PENDING_OWNER | PENDING |
| P2-SALVAGE-01 / P2 | Recuperar chatarra física y persistir denominaciones sin duplicaciones | IN_REVIEW | VERIFIED_CHROMIUM | PENDING_OWNER | PENDING |
| P2-C9-TRADE-01 / P2 | Comprar mejoras C9 con chatarra y efecto visible persistido | IN_REVIEW | VERIFIED_CHROMIUM | PENDING_OWNER | PENDING |
| P2-HOSTILE-PURSUIT-02 / P2 | Dar intención de interceptación a enemigos sin revelar el apuntado en el HUD | IN_REVIEW | VERIFIED_CHROMIUM | PENDING_OWNER | PENDING |
| P1-ATLAS-TACTICS-03 / P1 | Integrar Atlas de dos fases con patrones observados y 36 HP frente al cargador nuevo | IN_REVIEW | VERIFIED_CHROMIUM | PENDING_OWNER | PENDING |
| P3-COMET-SHOWER-01 / P3 | Convertir el gran vacío en cruces rápidos y lluvia de cometas transitables | IN_REVIEW | VERIFIED_CHROMIUM | PENDING_OWNER | PENDING |
| P2-HOSTILE-ART-01 / P2 | Integrar proyectiles hostiles animados y fichas físicas de chatarra originales | IN_REVIEW | VERIFIED_CHROMIUM | PENDING_OWNER | PENDING |
| P1-CH1-STORY-01 / P1 | Conectar sabotaje, registro, C9 y autorización Gaia mediante historia contextual | IN_REVIEW | CHROMIUM_INTEGRATED_PASSED_OWNER_DEVICE_REVIEW_PENDING | PENDING_OWNER | PENDING |
| P1-CH1-CINEMATIC-01 / P1 | Integrar planos ilustrados, retratos y misil animado del primer capítulo | IN_REVIEW | INTRO_PORTRAITS_MISSILE_LAUNCH_FLIGHT_INTEGRATED_IMPACT_POSES_PENDING | PENDING_OWNER | PENDING |
| P1-CH1-SHIP-01 / P1 | Reducir naves clásicas al 40 % e integrar reserva de casco sin temporizador | IN_REVIEW | CHROMIUM_INTEGRATED_PASSED_OWNER_DEVICE_REVIEW_PENDING | PENDING_OWNER | PENDING |
| P2-CH1-MISSILE-01 / P2 | Persistir tres misiles, refuerzo de casco y reposición pagada en C9 | IN_REVIEW | CHROMIUM_INTEGRATED_PASSED_OWNER_DEVICE_REVIEW_PENDING | PENDING_OWNER | PENDING |
| P1-CH1-ATLAS-01 / P1 | Cerrar el primer nivel con Atlas blindado, núcleo expuesto y verificación Iria | IN_REVIEW | CHROMIUM_INTEGRATED_PASSED_OWNER_DEVICE_REVIEW_PENDING | PENDING_OWNER | PENDING |
| P1-CH1-QA-01 / P1 | Verificar el bucle completo del primer capítulo en una compilación recuperable | IN_REVIEW | CHROMIUM_INTEGRATED_PASSED_OWNER_DEVICE_REVIEW_PENDING | PENDING_OWNER | PENDING |
| P1-CH1-AUDIO-01 / P1 | Integrar música original de apertura y viaje con controles de reproducción | IN_REVIEW | CHROMIUM_INTEGRATED_PASSED_OWNER_DEVICE_REVIEW_PENDING | PENDING_OWNER | PENDING |
| P4-ARSENAL-10-15-01 / P4 | Diseñar y producir un arsenal de 10–15 armas con identidad a lo largo de la campaña | PENDING | NOT_IMPLEMENTED | PENDING_OWNER | PENDING |
| P1-SPECIALIST-TEAM-01 / P1 | Equipo especializado y skills fijadas reutilizables | DONE | PROCEDURES_VALIDATED_AND_USED | NOT_APPLICABLE | NOT_APPLICABLE |
| P1-SPECIALIST-ATLAS-01 / P1 | Atlas sin contornos truncados y coraza coherente | IN_REVIEW | CURRENT_CHROMIUM_INTEGRATION_PASSED | PENDING_OWNER | PENDING |
| P1-SPECIALIST-ENERGY-01 / P1 | CRONIUM animado sin caja opaca ni bisel | IN_REVIEW | CURRENT_CHROMIUM_INTEGRATION_PASSED | PENDING_OWNER | PENDING |
| P1-SPECIALIST-PROPULSION-01 / P1 | Motores proporcionados y misil sin lanzador flotante | IN_REVIEW | CURRENT_CHROMIUM_INTEGRATION_PASSED | PENDING_OWNER | PENDING |
| P1-SPECIALIST-AUDIO-01 / P1 | Efectos originales conectados a combate y controles de audio | IN_REVIEW | CURRENT_CHROMIUM_INTEGRATION_PASSED | PENDING_OWNER | PENDING |
| P1-DYNAMIC-INTRO / P1 | Abrir sobre Chronos vivo y enseñar acciones breves | IN_REVIEW | CURRENT_CHROMIUM_INTEGRATION_OFFLINE_AND_CI_PASSED | PENDING_OWNER | PENDING |
| P1-DYNAMIC-IA / P1 | Maniobras procedurales y mayor presencia enemiga | IN_REVIEW | CURRENT_CHROMIUM_INTEGRATION_OFFLINE_AND_CI_PASSED | PENDING_OWNER | PENDING |
| P1-DYNAMIC-ATLAS / P1 | Atlas móvil y exigente con decisiones y ventanas | IN_REVIEW | CURRENT_CHROMIUM_INTEGRATION_OFFLINE_AND_CI_PASSED | PENDING_OWNER | PENDING |
| P1-DYNAMIC-MISSILE / P1 | Misil18 y explosión ilustrada visible al contacto | IN_REVIEW | CURRENT_CHROMIUM_INTEGRATION_OFFLINE_AND_CI_PASSED | PENDING_OWNER | PENDING |
| P1-DYNAMIC-C9 / P1 | Taller C9 ilustrado desde HUD sin estación orbital | IN_REVIEW | CURRENT_CHROMIUM_INTEGRATION_OFFLINE_AND_CI_PASSED | PENDING_OWNER | PENDING |
| P1-DYNAMIC-AUDIO / P1 | Emisiones enemigas con sonidos originales y pausa/mute | IN_REVIEW | CURRENT_CHROMIUM_INTEGRATION_OFFLINE_AND_CI_PASSED | PENDING_OWNER | PENDING |
| P1-DYNAMIC-FLIGHT / P1 | Nave30% mayor y cometas con trayectorias variadas transitables | IN_REVIEW | CURRENT_CHROMIUM_INTEGRATION_OFFLINE_AND_CI_PASSED | PENDING_OWNER | PENDING |
| P1-DYNAMIC-TOOLS / P1 | Skills útiles, higiene recuperable y Netlify QA preparado | DONE | PROCEDURE_SKILL_HYGIENE_AND_PREVIEW_GATE_PASSED | NOT_APPLICABLE | NOT_APPLICABLE |
| P1-NETLIFY-ISOLATED-01 / P1 | Permitir el sitio Netlify de pruebas identificado sin habilitar producción del juego | DONE | PUBLIC_PREVIEW_EXACT_COMMIT_VERIFIED | NOT_APPLICABLE | NOT_APPLICABLE |

La demostración comprimida P1 anterior queda recuperable y recibió cambios solicitados por el propietario. Prioridad actual: integración de nave y experiencia natural del clásico; no expansión del prototipo. La decisión del motor y la aceptación estética permanecen reservadas al propietario. El resto de las tareas sigue siendo recuperable.

## Método y alcance

**DONE / total de tareas del área. Igual peso por tarea; una tarea puede pertenecer a varias áreas. No es un porcentaje de producto terminado.** Cada porcentaje se refiere exclusivamente a criterios de esta checklist, no al porcentaje comercial, artístico o técnico del juego terminado. El denominador incluye trabajo futuro y queda visible; las áreas se solapan y no deben sumarse. Reorganizar el alcance cambia el denominador y debe documentarse.

El registro inicial no hereda DONE de declaraciones previas. Un 0% no significa ausencia de implementación: significa que ninguna tarea completa de este mandato ha sido cerrada todavía con todos sus criterios y evidencia en este registro. El código previo se detalla en el historial.

## Indicadores por área

| Área | Verificadas / total | PENDING | IN_PROGRESS | BLOCKED | IN_REVIEW |
| --- | --- | --- | --- | --- | --- |
| Motor | 2/10 (20.0%) | 7 | 0 | 1 | 0 |
| Jugabilidad | 8/91 (8.8%) | 36 | 0 | 1 | 46 |
| Campaña clásica | 5/57 (8.8%) | 4 | 1 | 0 | 47 |
| Campaña N-7 | 4/42 (9.5%) | 35 | 1 | 0 | 2 |
| Enemigos | 5/82 (6.1%) | 57 | 0 | 0 | 20 |
| Jefes | 0/20 (0.0%) | 13 | 0 | 0 | 7 |
| Assets | 3/205 (1.5%) | 124 | 3 | 1 | 74 |
| Animaciones | 5/158 (3.2%) | 109 | 1 | 0 | 43 |
| Narrativa | 0/24 (0.0%) | 17 | 0 | 0 | 7 |
| Audio | 1/19 (5.3%) | 12 | 0 | 1 | 5 |
| Interfaz | 5/41 (12.2%) | 9 | 1 | 0 | 26 |
| Rendimiento | 1/16 (6.3%) | 11 | 1 | 0 | 3 |
| QA | 24/114 (21.1%) | 20 | 3 | 5 | 62 |
| Preparación iOS | 0/21 (0.0%) | 14 | 0 | 6 | 1 |

## Indicadores por bloque

| Bloque | Criterios cerrados / total | Estados |
| --- | --- | --- |
| 03 · Prueba integrada y cierre técnico | 20/32 (62.5%) | PENDING: 0 · IN_PROGRESS: 1 · BLOCKED: 1 · IN_REVIEW: 10 · DONE: 20 |
| 04 · Jugabilidad procedural | 3/64 (4.7%) | PENDING: 19 · IN_PROGRESS: 0 · BLOCKED: 1 · IN_REVIEW: 41 · DONE: 3 |
| 05 · Producción visual y 150 assets | 5/196 (2.6%) | PENDING: 120 · IN_PROGRESS: 3 · BLOCKED: 0 · IN_REVIEW: 68 · DONE: 5 |
| 06 · Diez jefes | 0/13 (0.0%) | PENDING: 10 · IN_PROGRESS: 0 · BLOCKED: 0 · IN_REVIEW: 3 · DONE: 0 |
| 07 · Narrativa completa | 0/15 (0.0%) | PENDING: 14 · IN_PROGRESS: 0 · BLOCKED: 0 · IN_REVIEW: 1 · DONE: 0 |
| 08 · Audio y experiencia sensorial | 0/15 (0.0%) | PENDING: 12 · IN_PROGRESS: 0 · BLOCKED: 1 · IN_REVIEW: 2 · DONE: 0 |
| 09 · Rendimiento y estabilidad | 0/16 (0.0%) | PENDING: 14 · IN_PROGRESS: 1 · BLOCKED: 1 · IN_REVIEW: 0 · DONE: 0 |
| 10 · Preparación para lanzamiento | 1/16 (6.3%) | PENDING: 11 · IN_PROGRESS: 0 · BLOCKED: 4 · IN_REVIEW: 0 · DONE: 1 |

## Assets: catálogo frente a entrega

Catálogo: **IN_REVIEW: 53; PLANNED: 116; IMPLEMENTED_CODE: 2**; 171 identificadores. Cierre de los doce requisitos: **0/171 (0.0%)**. Un PNG/WebP, prompt o definición de animación no certifica integración visual.

## Evidencias históricas separadas

- **Motor, arquitectura, contenido, regresión, assets y build del Bloque02**, commit **50814e88f19f6790b6417bb49a2ea79d240b37a0**: [docs/continuity-100/evidence/block-02/certification/run-01/results.json](continuity-100/evidence/block-02/certification/run-01/results.json). Resultados anteriores; no certifican modificaciones posteriores ni iPhone.
- **Chromium www, seis casos cortos**, commit **5c5f062cd1109b95a189f002d955c0b9ec81d45e**: [docs/continuity-100/evidence/block-02/browser-www-20261014-01/results.json](continuity-100/evidence/block-02/browser-www-20261014-01/results.json). No es Chromium sobre preview-dist; SW bloqueado; no es combate completo.
- **Preview estática**, commit **5c5f062cd1109b95a189f002d955c0b9ec81d45e**: [docs/continuity-100/evidence/netlify-20261014/test-preview-01.txt](continuity-100/evidence/netlify-20261014/test-preview-01.txt). 11 pruebas anteriores; no certifican despliegue.
- **Workflow integrado informado por Dirección**, commit **f5b486ccfcdc56319417c33d7fa9282708ed6d64**: [enlace](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/38531391709). Estado remoto comprobado por integración mediante conector GitHub; conservar referencia y distinguirlo de Chromium/Safari.
- **Bloque03:regresión local sobre base f5b486c y cambios publicados en e1a7aa8**, commit **e1a7aa8498b1c5f9f5558425a61b748f4ab1f869**: [docs/production-reports/evidence/block-03/certification-01/results.json](production-reports/evidence/block-03/certification-01/results.json). 11fases exit0. Preview15/15 registrado aparte. Chromium global permanece en curso al actualizar esta checklist.
- **Referencia artística anterior de vulkar-planet**, commit **null**: [docs/visual-rebirth/evidence/gallery-03/results.json](visual-rebirth/evidence/gallery-03/results.json). Historial preservado. La variante orbital actual se verifica con el lote combat-readability.

## Bloqueos actuales del registro

- **B08-12 — Verificar Safari/iOS y restricciones de reproducción:** No hay evidencia de dispositivo iPhone/simulador apropiado disponible.
- **B09-15 — Certificar Safari/iPhone físico y WKWebView:** No hay evidencia de dispositivo iPhone/simulador apropiado disponible.
- **B10-05 — Configurar firmado autorizado:** Requiere credenciales o autorización específica del propietario.
- **B10-09 — Verificar icono y splash en aplicación nativa:** No hay evidencia de dispositivo iPhone/simulador apropiado disponible.
- **B10-11 — Preparar TestFlight; distribución requiere autorización:** Requiere credenciales o autorización específica del propietario.
- **B10-12 — Ejecutar pruebas físicas de candidato de lanzamiento:** No hay evidencia de dispositivo iPhone/simulador apropiado disponible.
- **PM-01 — Decisión técnica reservada sobre Motor V1:** Requiere orden técnica expresa del propietario; mantener USE_ENGINE_V1=false.
- **P2-PLAYTEST-01 — Preparar y ejecutar diez pruebas humanas de Chronos–Gaia:** Reclutamiento y acceso a jugadores/dispositivos pendientes; no se han realizado sesiones.

## Orden de continuidad

1. Cerrar preview-dist, navegación, combate, guardados, caché y procedencia.
2. Conservar paquete comprobado; resolver acceso externo Netlify sin detener tareas independientes.
3. Versionar y mejorar generación/equilibrio; producir e integrar CH-01 en un lote pequeño verificable.
4. Completar jefes, historia, audio, rendimiento y pruebas físicas según dependencias.

Consultar [PRODUCTION_MASTER_CHECKLIST.md](PRODUCTION_MASTER_CHECKLIST.md) para cada ID, criterio y evidencia. Este resumen se genera del mismo registro; no debe editarse manualmente.
