# Fuentes abiertas y skills adoptadas

Revisión primaria del 18/10/2026 para el equipo especialista. Se consultaron archivos reales de GitHub y licencias de cada directorio; la licencia del repositorio no se extiende por suposición a assets o terceros. La búsqueda no equivale a instalar ni ejecutar todo lo encontrado.

## Incorporaciones de esta entrega

| Fuente y commit fijado | Licencia verificada | Uso concreto |
| --- | --- | --- |
| [OpenAI skill-creator](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.system/skill-creator/SKILL.md) · `49f948faa9258a0c61caceaf225e179651397431` | Apache-2.0 del directorio | Guía y scripts revisados para crear/validar las dos skills locales; estructura compacta, recursos reutilizables y metadatos |
| [Anthropic webapp-testing](https://github.com/anthropics/skills/blob/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/webapp-testing/SKILL.md) · `dbd4588f9e1033efb41dad4bef2f7947c8993d44` | Apache-2.0 del directorio; copyright 2026 Anthropic, PBC | Patrón adaptado de inspección, interacción, capturas y consola; no instalar otro stack ni ejecutar su helper de servidor |

Copias íntegras sin modificar, licencias y scripts de autoría en [tools/third-party/skills](../../tools/third-party/skills/). [SOURCES.json](../../tools/third-party/skills/SOURCES.json) registra URL, commit, ruta y SHA-256 de cada archivo. Estas fuentes son herramientas/documentación de desarrollo; no se conectan al motor ni al runtime del juego.

Los scripts OpenAI se leyeron antes de ejecutarse. Sus dependencias son Python 3 y PyYAML; se reutiliza PyYAML disponible, sin descarga ni instalación. `init_skill.py` genera la estructura local y `quick_validate.py` comprueba frontmatter/nombres; no valida calidad artística ni crea agentes activos. El helper Anthropic queda conservado, no ejecutado.

Validación de autoría ejecutada: `python3 tools/third-party/skills/openai-skill-creator/scripts/quick_validate.py .agents/skills/neon-production` y el equivalente para `.agents/skills/neon-visual-qa`, ambos con salida 0. Además se comprobaron los nueve hashes de fuentes, enlaces locales y metadatos YAML. Son comprobaciones de documentación/skills, no certificación del juego.

## Adaptaciones explícitas

- Mantener las decisiones ya autorizadas y la documentación vigente: no repetir cuestionarios de descubrimiento ni pedir aprobaciones técnicas rutinarias.
- Crear roles mediante las herramientas de colaboración disponibles. YAML contiene sólo metadatos de skill; no modifica modelos ni garantiza procesos permanentes o descubrimiento automático fuera de este repositorio.
- Conservar los scripts Node/Playwright/CDP del juego; no adoptar la obligación Python de `webapp-testing` ni añadir otro framework de pruebas.
- Revisar código externo antes de ejecutarlo, aunque la guía original sugiera tratar helpers como cajas negras.
- Esperar estado de juego, decodificación de imágenes y animación asentada; `networkidle` no certifica que Canvas/audio estén listos.
- Mantener evidencia en las rutas de producción del juego y snapshots con SHA. Separar fixture, partida natural y dispositivo físico; no confundir screenshot con certificación estética.

Las skills locales son instrucciones adaptadas a NEON CRONIUM, no una afirmación de haber ejecutado íntegramente las guías originales. No sustituyen las restricciones de rama, guardados, motor ni publicación.

## Código QA seleccionado

[Mapbox Pixelmatch](https://github.com/mapbox/pixelmatch/blob/ab76f526ef951c0ec6284e314a700e161b1800e6/index.js), commit `ab76f526ef951c0ec6284e314a700e161b1800e6`, licencia **ISC**, copyright 2025 Mapbox. Su módulo ESM compara buffers RGBA sin imports; el paquete npm añade `pngjs` para CLI, innecesario para RGBA de Canvas. Se reserva para diferencias visuales deterministas en tooling QA, sin dependencia del juego. Conservar licencia, hash y versión junto al módulo cuando el integrador incorpore su contribución.

Su adopción no implica calidad artística ni reparación automática: usar las mismas dimensiones, instante y opciones, conservar máscaras/umbrales y comprobar igualdad, cambios reales y transparencia. El agente de QA documenta por separado el archivo incorporado, pruebas ejecutadas y uso efectivo; este documento no certifica por anticipado esos resultados.

## Alternativas investigadas que no se instalan ahora

| Fuente primaria | Licencia y decisión |
| --- | --- |
| [OpenAI Playwright CLI skill](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright/SKILL.md) | Apache-2.0 por directorio. Su wrapper usa `npx --yes --package @playwright/cli` sin fijar versión; duplica el harness actual. No ejecutar wrapper ni instalar global `@latest`. |
| [Microsoft Playwright](https://github.com/microsoft/playwright/blob/b335271cdc2b57cac2be8ad37c5dd283ac6b8938/LICENSE) | Apache-2.0 raíz, sin inferir licencias de sus archivos `third_party`. La rama inspeccionada declara `1.65.0-next`; no migrar a nightly. Conservar el harness instalado. |
| [Free Texture Packer Core](https://github.com/odrick/free-tex-packer-core/blob/f918f61569e669df61825ec1040540f1d8470acb/README.md) | MIT, versión 0.3.9. Padding/extrude y export JSON útiles; no reconstruye piezas cortadas. Añade jimp, maxrects-packer, mustache, sharp y tinify. TinyPNG es externo y queda desactivado, no autorizado con gasto. No justificar esas dependencias para un único arreglo. |
| [Sharp](https://github.com/lovell/sharp/blob/adae0a027eb4e98ece22324bef5e27953abdf60a/LICENSE) | Apache-2.0 del código propio; binarios/libvips tienen obligaciones adicionales. Extracción/exportación válidas, pero herramientas locales existentes pueden resolver el lote sin añadir binarios. |

No se encontró `develop-web-game/SKILL.md` en el árbol actual de `openai/skills`; no se anuncia como instalada. Los catálogos enormes de skills no se incorporan por cantidad. Revisar licencia por recurso, dependencias, mantenimiento y una tarea concreta antes de cualquier nueva adopción.

## Incorporación verificada en este lote

Pixelmatch fijado está en `tools/third-party/pixelmatch/`, licencia ISC conservada y hash de origen. `tests/visual-polish-assets.test.mjs` y `scripts/specialist-visual-assets.mjs` lo ejecutan realmente: seis contratos Node y decodificación/composición Chromium de los12frames originales. Evidencia en `docs/production-reports/evidence/specialist-polish/asset-qa/results.json`. Comparar diferencias no concede aceptación estética. No se añadieron dependencias npm ni código runtime externo.

## Ampliación acotada: interfaz de vuelo y C9 ·18/10/2026

Se incorporan **dos guías adicionales** de [wshobson/agents](https://github.com/wshobson/agents/tree/0874a27b17a22e2b7c2e2bcd725768e0803cad06), commit `0874a27b17a22e2b7c2e2bcd725768e0803cad06`, licencia raíz **MIT**, copyright 2024 Seth Hobson. Se comprobó el árbol del directorio y no hay licencia local distinta en estas skills. Copias íntegras de las dos guías, dos referencias y licencia en `tools/third-party/skills/wshobson-ui-design/`; los cinco hashes se añaden al mismo `SOURCES.json`, que ahora registra 14 archivos.

| Guía | Aplicación concreta en este lote | Adaptación necesaria |
| --- | --- | --- |
| [interaction-design](https://github.com/wshobson/agents/blob/0874a27b17a22e2b7c2e2bcd725768e0803cad06/plugins/ui-design/skills/interaction-design/SKILL.md) | Respuesta inmediata del acceso C9, apertura breve, contexto de vuelo preservado y animación reducible | Usar DOM/CSS existentes y opción de efectos reducidos; no importar React/Framer Motion ni sus timers de ejemplo |
| [accessibility-compliance](https://github.com/wshobson/agents/blob/0874a27b17a22e2b7c2e2bcd725768e0803cad06/plugins/ui-design/skills/accessibility-compliance/SKILL.md) | Panel C9 con nombre, foco, Escape/retorno, tamaño táctil y estado accesible de compra | Reutilizar el contrato del hangar y el estado de pausa actual, sin Headless UI; distinguir 44px táctiles del proyecto de los 24px AA con excepciones de WCAG2.2 |

La adaptación ejecutable como instrucciones de repositorio es [.agents/skills/neon-interface-review/SKILL.md](../../.agents/skills/neon-interface-review/SKILL.md). No se han ejecutado snippets externos ni instalado dependencias. Se revisaron completas ambas guías, `references/details.md` y `references/aria-patterns.md` antes de adaptar sus patrones. No se copia literalmente su ejemplo que vuelve a anunciar cada cambio con `setTimeout`, ni se considera necesaria ARIA redundante sobre botones nativos.

**Aplicación observada, no sólo catálogo:** en HEAD documental `d4b08dcb2f22268944aa73fc4b71bca5f3496c7e`, `src/game/03-ui-game-flow.js` crea `flightDock` sin `role="dialog"`, `aria-modal` o contrato de foco; el hangar del mismo archivo sí dispone de foco y ciclo Tab. Esta discrepancia se identificó al revisar las fuentes y se trasladó al propietario de interfaz para que el nuevo C9 desde HUD incluya pausa, limpieza de contactos, foco/retorno y confirmación de compra. La skill define la comprobación; el informe del integrador registra si la implementación y pruebas posteriores la satisfacen. Su incorporación no se presenta como certificación WCAG ni VoiceOver físico.

La nueva skill pasa `quick_validate.py` con salida0 y los14hashes fijados coinciden. Investigación adicional: `vercel-labs/agent-skills` no presentó licencia identificada en la respuesta de metadatos consultada; no se incorpora. Las skills de Stitch dependen de un servicio externo innecesario para este lote; Godot/Unity de wshobson suponen otro motor y se descartan. Se mantiene una ampliación pequeña dirigida a un defecto actual.

## Higiene y distribución de pruebas

`node scripts/repository-hygiene.mjs` inventaría sin borrar ni modificar archivos, guardados o Git; `--duplicates` compara hashes de binarios grandes. `--output <archivo-nuevo>` crea explícitamente un informe sin sobrescribir uno existente. Las seis pruebas de `tests/repository-hygiene.test.mjs` verifican conservación de bytes/índice, duplicados, copias generadas, enlaces no seguidos y rechazo de opciones destructivas o escritura dentro de `.git`, incluso mediante un enlace simbólico. Git usa `--no-optional-locks` para evitar actualizar el índice durante la lectura.

La auditoría inicial sobre HEAD `d4b08dc` sucio por trabajo coordinado encontró3.625archivos tracked y898.802.115bytes de disco actuales. Incluye579.344.206bytes de evidencia de producción,119.356.650de otra documentación —con capturas/paquetes históricos— y168.907.994de maestros. Son materiales recuperables, no basura. Las17agrupaciones de binarios idénticos incluyen exportaciones maestras/runtime, evidencias de ejecuciones distintas y splashiOS; no son una autorización para borrarlas.

Defecto concreto:28copias generadas seguían indexadas en `www/` e `ios/App/App/public/` aunque ambos directorios ya estaban ignorados. El integrador puede retirar **sólo esas entradas del índice**, conservando disco, `assets/`, fuentes y su historial; el pipeline las reconstruye. No se propone reescribir Git para reducir el histórico ni mover cientos de evidencias rompiendo enlaces. La cifra de bytes es una medida de checkout sucio, no tamaño del paquete de juego.

Netlify conserva la puerta de rama/contexto y no está autenticado en este entorno. [Guía de sitio aislado](NETLIFY_TEST_SETUP.md). La prueba unitaria real `node --test --test-name-pattern='opt-in|gate|contexts' tests/preview-build.test.mjs` pasó1/1; no es evidencia de despliegue o URL accesible.
