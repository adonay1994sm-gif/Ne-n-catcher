# DIAGNÓSTICO — revisión de cierre del nivel 1

**Fecha:** 18/10/2026  
**Rama:** `continuity-assets-audit-20261013`  
**SHA inicial preservado:** `70e518fd235320b171179ec023ff7cd6ca7dd737`  
**SHA funcional de los mandos:** `8f6c61b7675ac0d4941c3a087c27dd58e08e2e2a`  
**Motor V1:** desactivado

La estructura jugable del nivel 1 ya existe de extremo a extremo: Chronos, diez tramos conectados, recuperación de CRONIUM, enemigos, cometas, módulo C9, taller voluntario, aproximación a Gaia, combate por fases contra Atlas y resolución persistida. La revisión visual confirmó que el principal defecto abierto estaba en los mandos: cuatro controles separados ocupaban toda la franja inferior, se mezclaban combate, configuración y servicio, y el área relativa de pilotaje no tenía una señal visual.

También se confirmó un error de orden narrativo: C9 podía ocupar el HUD antes de recuperar su módulo. El selector de arma seguía visible con un único Phaser, aunque no podía realizar ninguna elección. Los objetivos táctiles superaban 44 px y el multitoque funcionaba, pero esa corrección técnica no hacía intuitiva la interfaz.

# INFORME DE PRODUCCIÓN — mandos y criterio de cierre

## Incremento integrado

- El primer contacto sobre el espacio muestra un control flotante local con dirección y desplazamiento. La nave conserva el movimiento relativo existente: apoyar el dedo no teletransporta la nave.
- Una ayuda discreta `DESLIZA PARA MOVER` aparece sólo para un perfil nuevo y desaparece al empezar a pilotar. Los perfiles que ya recuperaron C9 no reciben otra capa sobre el taller.
- Phaser y misil forman un grupo compacto para la mano derecha. El botón principal indica el arma equipada y mantiene la activación sostenida.
- El misil conserva tres unidades persistentes, su proyectil físico y la explosión ilustrada. Su objetivo táctil es 52×52 CSS px.
- El selector de arma queda oculto mientras sólo exista una opción. Aparece únicamente cuando el guardado posee varias armas reales.
- C9 queda oculto hasta recuperar el módulo, se separa del grupo de combate y continúa bloqueado durante Atlas. El taller, sus compras y el retorno al mismo vuelo no cambian.
- Pausa, cancelación, reinicio y segundo plano retiran el dueño de ambos contactos y el control flotante. No se crea otro RAF ni otro sistema de movimiento.
- Se mantuvieron veinte cargas internas sin contador visible, disparo manual predeterminado, guardados, economía, campañas históricas y `USE_ENGINE_V1=false`.

Archivos funcionales principales: `index.html`, `styles.css`, `src/game/00-bootstrap-config.js`, `src/game/03-ui-game-flow.js`, `src/game/08-loop-input-bootstrap.js` y `game.js`. Se actualizaron los contratos de `tests/onboard-c9.test.mjs`, `tests/unified-flight-legacy.test.mjs`, `scripts/two-touch-browser-smoke.cjs` y `scripts/current-level-visual-smoke.cjs` sin retirar las comprobaciones de multitoque, tamaño, economía o guardado.

## Revisión del nivel 1

| Área | Estado comprobado | Criterio pendiente |
| --- | --- | --- |
| Viaje Chronos → Gaia | Diez tramos, hitos y llegada integrados | Aceptación de ritmo por el propietario |
| Historia | Ruptura, Lira, Mira, Iria y prueba contra Atlas integradas | Revisión narrativa humana |
| Pilotaje | Movimiento relativo 2D, dos contactos y mando visual | Sensación en iPhone físico |
| Combate | Phaser, batería, misiles, enemigos y daño integrado | Balance humano prolongado |
| Atlas | Movimiento, tres familias de ataque, blindaje y núcleo expuesto | Dificultad final aprobada por el propietario |
| C9/economía | Recuperación, acceso HUD, compras atómicas y retorno | Claridad y precios tras partida humana |
| Arte/animación | Nave modular, Chronos, CRONIUM, C9, proyectiles y Atlas activos | Aceptación estética final |
| Audio | Música, impactos y emisiones enemigas conectados | Audición humana/dispositivo |
| Guardado/offline | Regresiones y paquete de preview conservados | Safari/iPhone físico |

**Decisión de producción:** nivel 1 en `IN_REVIEW`, técnicamente preparado para la última partida del propietario. No se marca `DONE` ni se usa todavía como plantilla cerrada para producir masivamente los niveles 2–10. El nivel 2 puede recibir diseño y preparación independiente; la implementación que copie controles, balance y lenguaje visual debe esperar la aceptación de esta revisión.

## Pruebas y evidencia

Paquete limpio de prueba: `preview-dist`, SHA funcional exacto `8f6c61b7675ac0d4941c3a087c27dd58e08e2e2a`, `dirty=false`, 134 archivos, revisión `5f6743fe9ef219627a84660534c664410fb35109c482e2eb67d68d223da73126`.

- `npm run build:preview`: código 0.
- `npm run test:engine`: 60/60.
- `npm run test:architecture`: 6/6.
- `npm run test:content`: 661/661 después de corregir el contrato obsoleto.
- `npm run test:static`: 13/13.
- `npm test`: 34/34.
- `npm run test:preview`: 25/25 en la primera pasada del lote; se repite en el cierre.
- `node scripts/audit-asset-inventory.mjs`: 99 recursos runtime, sin faltantes ni huellas incorrectas.
- `node scripts/two-touch-browser-smoke.cjs --root preview-dist --output docs/production-reports/evidence/level-one-controls/two-touch-8f6c61b-01`: 7/7 en Chromium táctil; pilotaje + disparo simultáneos, recarga, cancelación, pausa, reinicio y alternativas teclado/ratón.
- `node scripts/current-level-visual-smoke.cjs --root preview-dist --output docs/production-reports/evidence/level-one-controls/visual-8f6c61b-03 --expected-commit 8f6c61b7675ac0d4941c3a087c27dd58e08e2e2a`: 12/12 comprobaciones, 22 capturas reales en 390×844 y 320×568. Incluye apertura, C9, movimiento/ataque Atlas, tres estados de blindaje, misil físico, explosión/restos y desenlace de Iria.

La primera ejecución completa de contenido encontró 660/661 porque una aserción histórica todavía reservaba espacio para el selector de un arma. Se actualizó el contrato a la conducta solicitada, la suite afectada pasó 37/37 y la repetición completa pasó 661/661. No se restauró el control inútil para obtener un resultado verde.

Evidencia: [visual móvil y Atlas](evidence/level-one-controls/visual-8f6c61b-03/results.json) y [multitoque real](evidence/level-one-controls/two-touch-8f6c61b-01/results.json).

## Riesgos y siguiente tarea exacta

La emulación Chromium no sustituye Safari ni un iPhone físico, y un piloto automatizado no decide si el mando resulta cómodo. La siguiente tarea exacta es publicar este SHA en la preview aislada, verificar Actions y Netlify, y pedir al propietario una partida del nivel 1 centrada en movimiento, disparo sostenido, misil, C9 y Atlas. Si la sensación queda aprobada, se cierra P1 y se inicia el nivel 2 con esta gramática; si no, se corrige el control antes de multiplicarlo.
