# Equipo especialista de NEON CRONIUM

Referencia operativa del 18/10/2026. Aplicar [AGENTS.md](../../AGENTS.md) y el mandato del propietario. El objetivo inmediato es corregir e integrar el acabado del primer nivel antes de extenderlo.

El director técnico es el agente integrador de la sesión. Los once departamentos siguientes son **roles de trabajo**, no once agentes permanentemente activos. El integrador activa hasta seis subagentes simultáneos mediante colaboración, según dependencias y límite real de la sesión. Las skills y su YAML conservan instrucciones y metadatos; no crean procesos, no reentrenan modelos y no mantienen ejecución fuera de la sesión.

## Responsabilidades y entregas

Las rutas indican competencia, no permiso para escribirlas sin asignación. Cada tarea debe nombrar a una persona/agente propietario exclusivo por archivo. Cuando dos departamentos necesitan el mismo archivo, el integrador asigna un solo escritor o hace un traspaso explícito.

| Departamento | Rutas de referencia | Entregable verificable | Comprobación requerida |
| --- | --- | --- | --- |
| Renderizado compatible | `src/game/06-world-rendering.js`, `07-player-item-rendering.js`, `01-runtime-assets.js` | Arte compuesto y animado con coordenadas, escala, pivote y caché documentados | Recortes/alpha en Canvas, regresión visual, memoria estimada o medida; V1 apagado y RAF único |
| Jugabilidad y pilotaje | `src/game/ship/flight-controls.js`, `combat/classic-weapons.js`, `combat/hull-reinforcement.js` | Respuesta precisa, armas y casco con contratos explícitos | Colisiones, dos dedos, pausa, disparos/eventos únicos, partida natural |
| Arte y animación | `art-source/`, `assets/`, `src/game/animation/` | Maestros recuperables, estados distintos, atlas optimizado, dimensiones/pivotes y procedencia | Frames/contornos en varios fondos, animación real y captura integrada; revisión artística separada |
| Mundos y niveles | `src/game/progression/chronos-flight.js`, `comet-shower.js`, `level-designs.js`, `src/game/presentation/` | Viaje continuo con origen, tránsito, llegada, acontecimiento y objetivo | Reloj único, checkpoints, continuidad, pausa y tramos transitables; nunca aterrizar |
| IA de enemigos | `src/game/combat/classic-pursuit.js`, `guardian-atlas.js`, `src/game/progression/encounter-director.js` | Patrones físicos aprendibles, intención de combate y ventanas del jefe | Ataques y recompensas únicos, reacción posible, dificultad en partida natural |
| Narrativa | `src/game/narrative/`, `docs/design/` | Personajes con motivos distintos, diálogos contextuales y escenas ligadas al juego | Disparo único de eventos, checkpoint/reentrada, mensajes que no oculten amenazas |
| Pruebas y QA | `tests/`, `scripts/*smoke*`, `scripts/browser-qa-helpers.cjs` | Reproducción del defecto, regresión y capturas/logs con SHA | Antes/después auténticos, consola/red, escenas controladas y partidas naturales claramente separadas |
| iOS y preparación de publicación | `ios/`, `capacitor.config.*`, scripts de build/bridge | Revisión de compatibilidad, safe areas, interrupciones y paquete reproducible | Web/iOS generados por pipeline; Safari/iPhone físico pendiente hasta ejecución; sin firmado ni distribución |
| Web y distribución de pruebas | `scripts/build-preview.mjs`, `sw.js`, sitio privado separado | Preview aislada identificada por SHA, caché actualizable y paquete verificable | Online/offline, actualización SW, conservación de partidas, HTTP/hash y destino autorizado |
| Audio: música y efectos | `src/game/audio/`, `art-source/audio/`, `assets/*score*`, `assets/*sfx*` | Música/FX originales o licenciados, fuentes y exportaciones; eventos de arma, motor, impacto y materiales | Escucha real, volumen/mute, pausa/contexto Safari, polifonía, clipping, compresión y memoria; no afirmar escucha física |
| Interfaz y experiencia de usuario | `src/game/03-ui-game-flow.js`, `styles.css`, `index.html` | Menú de viaje único, HUD discreto, C9 y controles comprensibles | Legibilidad 390×844/320×568, controles ≥44 px, foco, safe areas, dos dedos y ausencia de superposición |

`src/game/02-storage-audio.js`, `04-entities-collision-damage.js`, `05-corridor-update.js` y `08-loop-input-bootstrap.js` son puntos de integración compartidos. Reservarlos al integrador o a un único escritor designado. Lo mismo aplica a manifiestos, service worker, `package.json`, bundles y documentación de seguimiento. No editar copias web/iOS generadas de forma independiente.

## Contrato de asignación

Cada mensaje de tarea debe incluir: defecto y objetivo, SHA de referencia, archivos exclusivos, archivos prohibidos, entradas/dependencias, entregable, pruebas necesarias y límites. Pedir a cada especialista:

1. Revisar el código o recurso real y comunicar la causa antes de generalizar.
2. Entregar un cambio pequeño integrado, con maestro/licencia cuando aplique.
3. Registrar comandos exactos, resultados y evidencias, distinguiendo lo que no ejecutó.
4. Avisar al integrador si necesita tocar una ruta de otro propietario.
5. Declarar sus archivos **congelados** al terminar; no seguir editándolos durante build/QA.

El integrador revisa cada contribución, resuelve conflictos, congela fuentes o usa un snapshot, regenera el pipeline y ejecuta suites. Sólo después hace commit y push normal a la rama autorizada y comprueba Actions. Una corrección posterior invalida las pruebas afectadas; repetirlas sobre el nuevo estado.

## Skills y herramientas adoptadas

- [neon-production](../../.agents/skills/neon-production/SKILL.md): coordinación, asignación y cierre de incrementos.
- [neon-visual-qa](../../.agents/skills/neon-visual-qa/SKILL.md): contornos, Canvas, capturas y evidencia.
- [Revisión de fuentes abiertas](OPEN_SOURCE_REVIEW.md): licencias, fuentes fijadas, adaptaciones y descartes. Añadir una herramienta sólo cuando resuelva una tarea comprobable.

Usar generación de imágenes, composición y herramientas locales de audio cuando estén disponibles; comprobar capacidades reales antes de atribuir un resultado a Canva u otro servicio. No usar servicios o APIs de pago nuevos. Mantener licencias y fuentes; no presentar síntesis como grabación de instrumentos reales ni una lámina conceptual como captura del juego.

## Estado y puertas de calidad

Mantener `docs/production-tasks.json` como único registro de tareas. Estados: PENDING, IN_PROGRESS, BLOCKED, IN_REVIEW y DONE; separar verificación técnica, aceptación artística y prueba física. Las tareas de este lote pueden aprobar técnicamente sin certificar el aspecto final o un iPhone físico.

Conservar motor V1 desactivado, arquitectura, campañas, guardados y recursos históricos. No modificar `main`, PR #3, producción, App Store o TestFlight. El propietario revisa la estética; el equipo continúa QA, optimización o recursos independientes sin pedir permisos rutinarios.
