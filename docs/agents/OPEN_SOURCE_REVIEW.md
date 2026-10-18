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
