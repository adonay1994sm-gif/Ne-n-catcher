# DIAGNÓSTICO

18/10/2026. Rama autorizada `continuity-assets-audit-20261013`; inicio `cbd41131e57bd5a82d3fdf5faf0388e356d20817`, árbol limpio y remoto equivalente. El propietario pide sustituir toda la interfaz y utilizar especialistas y skills públicas. La interfaz acumula tratamientos visuales distintos entre portada, vuelo, modales y Forja. El control de Escape no distingue Ajustes del vuelo pausado; los enlaces legales del launcher tienen sólo 28 px en el paquete anterior.

# INFORME DE PRODUCCIÓN

Lote ORBITAL_HUD: consola común de titanio, marfil, cian y ámbar; jerarquía compacta de instrumentos y controles; pantallas de inicio, ruta, briefing, ajustes, ayuda, pausa, resultados, hangar y Forja. No modifica arsenal, economía, IA, objetivos ni claves de guardado. Mantiene Motor V1 desactivado y el único ciclo de actualización.

## Responsables y skills

- Integración: root; HTML, launcher, foco, SW, pruebas, documentación y publicación.
- `hud_design_system`: propiedad exclusiva de `styles.css`.
- `hud_flow_markup`: propiedad exclusiva de `src/game/03-ui-game-flow.js`.
- `hud_qa_contract`: prueba de navegador `scripts/hud-redesign-smoke.cjs` y baseline.
- `public_hud_skills`: investigación/licencia/procedencia de skill pública, sin ejecutar código remoto.

Nueva guía pública [Anthropic frontend-design](../../tools/third-party/skills/anthropic-frontend-design/SKILL.md), commit `dbd4588f9e1033efb41dad4bef2f7947c8993d44`, Apache-2.0. Copia íntegra y licencia junto al archivo; URL y SHA-256 en `SOURCES.json`. Se aplican tokens deliberados, jerarquía, consistencia de acciones y revisión por capturas. Se reutilizan `interaction-design` y `accessibility-compliance` de wshobson, MIT, y las skills locales de producción/QA. Son guías de trabajo; no agentes reentrenados ni dependencias del juego.

## Decisiones de trabajo

El nombre de la línea visual, su paleta y geometría son propuestas reversibles sujetas a revisión del propietario. No se afirma aceptación artística por compilar. Foco y Escape se resuelven en el gestor existente de paneles; C9/hangar conservan sus contratos de input propios. Los controles permanecen separados y con objetivos de al menos 44 px. La caché cambia de generación para evitar mezclar HTML/CSS/JS nuevos con archivos antiguos.

## Verificación

En curso. No atribuir las pruebas del lote anterior a éste. Se registrarán comandos, salidas, SHA funcional limpio, capturas de 320×568/390×844/844×390, entradas multitoque y comprobación offline. Baseline QA conservado: fallo real de enlaces de 28 px. No hay certificación de Safari/iPhone físico ni medida de FPS/memoria de dispositivo.

## Estado y siguiente tarea

IN_PROGRESS. Congelar fuentes, construir, revisar capturas y resolver defectos antes de publicar. Al cierre mantener aceptación técnica, artística y física separadas. No main, PR3, motor V1, producción original, pagos ni servicios externos.

## Fallos encontrados y conservados

La certificación01 conserva dos fases fallidas: el nuevo listener de foco se registró sobre `document` al evaluar el módulo02 y los arneses de audio sin DOM lo rechazaron. Se registró sobre el `addEventListener` global ya utilizado por ese módulo; la consulta DOM sólo ocurre ante una tecla real. No se retiraron aserciones. Regresión enfocada de audio/foco/hangar/C9:52/52,salida0.

La revisión cruzada detectó además una apertura manual del hangar que evitaba `overlay(hangar)` y dejaba el diálogo inerte; ahora usa el gestor común. El foco inicial omite controles ocultos, importante al completar el último territorio o esconder una reparación. Se amplía la prueba visual al hangar y se conserva su edición como borrador cancelable. Certificación02 en ejecución sobre las fuentes corregidas.

La certificación02 conserva un único caso de contenido fallido (695/696): la ayuda omitía mencionar «veinte disparos», aunque la batería seguía intacta. Se restituye esa información útil al jugador sin cambiar la regla ni la aserción. Tras corregirla: producto/marca7/7, build:preview salida0 y preview25/25. El resto de las diez fases del certificado02 pasó. Las fuentes están congeladas para construir un snapshot limpio y comprobar UI real, Atlas, multitoque y offline.

## Primer snapshot limpio y revisión de geometría

Funcional42c1e4a01dd0e5f6f8e1b5b066fde33a4bf6c3a6: certificación03 **11/11 fases, salida0**, contenido696/696. Paquete separado `/tmp/neon-orbital-hud-42c1e4a/preview-dist`,dirtyfalse,MotorV1false. El primer smokeUI conserva un defecto real: enlaces legales de35–42px de ancho y rangos de36px de alto. Se amplían a44px sin tocar instrumentos, física ni economía.

El primer smokevisual pasa apertura y compras, pero su selector de arte también cuenta la nueva miniatura de Lanza dentro de una opción histórica oculta. Se conserva el contrato de arte de todas las ramas mediante un selector específico y se añade otra aserción para todas las armas visibles, manteniendo la opción histórica oculta sin ocupar geometría. No se retira la prueba ni se muestra Lanza sin poseerla.
