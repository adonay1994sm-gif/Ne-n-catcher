# Skills y agentes de código abierto evaluados · 20/10/2026

Petición del propietario: buscar en GitHub skills y agentes **de código
abierto** que ayuden a Claude a trabajar mejor y más rápido. Criterios:
licencia libre, contenido leído entero, sin descargas ni órdenes peligrosas,
sin claves de API ni servicios de pago, útil para este proyecto (juego
Canvas 2D, PWA + iOS, pruebas en Node).

## Incorporadas (activas en `.claude/skills/`, sin modificar)

Huellas sha256, commit y ruta de origen de cada archivo en
`.claude/skills/SOURCES.json`. Cada skill lleva su `LICENSE`.

### obra/superpowers

[obra/superpowers](https://github.com/obra/superpowers) · MIT · commit
`bb92a77741419a4ab5f06e711a283343f1ada0c3` (v7.0.0) · unas 300 000
estrellas (página de GitHub, 20/10/2026).

| Skill | Para qué la uso aquí |
|---|---|
| `systematic-debugging` | Encontrar la causa real de un fallo antes de tocar código (como el caso de las 35 pruebas rotas de la fase 1a). |
| `verification-before-completion` | No dar nada por terminado sin ejecutar build y pruebas y leer la salida. |
| `test-driven-development` | Escribir la prueba antes del cambio en lógica nueva (motor de viaje por fichas, Cronos Prime, bodega de chatarra). |
| `dispatching-parallel-agents` | Repartir tareas independientes entre agentes en paralelo (p. ej. arte, pruebas y código a la vez). |
| `brainstorming` | Preguntar qué se quiere construir y por qué, y no programar nada hasta que el propietario apruebe la especificación (`docs/superpowers/specs/`). Solo `SKILL.md` y `builder-check-prompt.md`. |
| `writing-plans` | Convertir la especificación aprobada en un plan de tareas pequeñas con prueba primero (`docs/superpowers/plans/`). |
| `subagent-driven-development` | Ejecutar el plan con un subagente nuevo por tarea y un revisor después de cada una. Incluye sus scripts locales (`task-brief`, `review-package`, `sdd-workspace`: solo `git`, `awk` y archivos en `.superpowers/sdd/`, que se ignora solo). |
| `executing-plans` | Ejecutar el plan en la misma sesión, más barato, con una revisión final. Scripts `task-start` y `task-done` (locales). |
| `requesting-code-review` | Pedir una revisión con contexto preparado (plantilla `code-reviewer.md`). |
| `receiving-code-review` | Comprobar cada comentario de revisión contra el código antes de aplicarlo; sin "¡tienes razón!" automático. |

Partes de superpowers **no** incorporadas:

| Parte | Por qué no |
|---|---|
| Compañero visual de `brainstorming` (`visual-companion.md`, `scripts/server.cjs`…) | Arranca un servidor local y, salvo que se desactive la telemetría, carga un logotipo de `primeradiant.com` (petición externa). Se usa texto o capturas en su lugar. `SKILL.md` lo sigue mencionando porque no se modifica. |
| `finishing-a-development-branch` | Propone merge o push y borrar ramas; choca con las reglas de ramas de `CLAUDE.md` (sin push ni merge sin orden). |
| `using-git-worktrees`, `using-superpowers`, `writing-skills`, `diagnosing-superpowers` | Los worktrees ya los gestiona el entorno; el resto sirve para mantener el propio plugin, no este juego. |
| Hooks, `index.js` y manifiestos del plugin | No se instala el plugin, solo se copian skills revisadas. |

### ayghri/i-have-adhd (el plugin "no entierres la respuesta")

[ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) · MIT · commit
`1ecea1993b7fce257ffbd686c070948b5e07eda6` · unas 58 000 estrellas según la
página de GitHub (otras webs dan cifras menores; sin comprobar).

Es una skill de formato: la acción en la primera línea, pasos numerados,
listas de 5 como máximo, sin preámbulo ni despedida. Copiada sin modificar
en `.claude/skills/i-have-adhd/`; se activa a mano con `/i-have-adhd` y dura
hasta decir "stop adhd mode". No se copian sus hooks "siempre activo",
extensiones ni scripts de evaluación en Python. La regla resumida también
está en `CLAUDE.md` (sección **Idioma**).

Identificación: el vídeo no daba el nombre. Coincide con la descripción
(acción primero, pasos numerados, listas cortas) y su propia ficha dice que
evita que el agente "entierre la respuesta". Alternativa vista y no usada:
[t10ko/plainly](https://github.com/t10ko/plainly) (output style parecido).

## Integradas como reglas en `CLAUDE.md`

[forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)
· MIT (declarada en README y `plugin.json`; el repositorio no trae archivo
`LICENSE`) · commit `2c606141936f1eeef17fa3043a72095b4765b9c2` · unas
220 000 estrellas.

Es un único `CLAUDE.md` con cuatro reglas inspiradas en observaciones de
Andrej Karpathy. Se han resumido en español en la sección **Cuatro reglas
antes de programar** de `CLAUDE.md`, citando fuente y licencia, sin borrar
ninguna regla existente. No se copia la skill `karpathy-guidelines` porque
repetiría el mismo texto en cada sesión.

## Sustituida por agentes propios: Claude Octopus

[nyldn/claude-octopus](https://github.com/nyldn/claude-octopus) · MIT ·
commit revisado `ca27fae7914d9d3a06f9e1134f9f0498b7500e5d` · unas 4 300
estrellas.

Reparte una tarea entre Claude y hasta doce proveedores externos (Codex,
Copilot, Qwen, Ollama, Perplexity, OpenRouter, Grok…) y marca desacuerdos.
**No se instala**: necesita suscripciones o claves de API de otros
proveedores, un servidor MCP con `npm install`, hooks y scripts de shell
extensos. Va contra la regla de no gastos externos ni secretos.

En su lugar, la idea de "competencia que audita mientras trabajas" se
implementa solo con Claude:

| Archivo | Qué hace |
|---|---|
| `.claude/agents/auditor-codigo.md` | Revisa un diff de forma adversarial: estados, pausa, guardados, RAF, salidas generadas, pruebas que no prueban. Veredicto APTO / APTO CON ARREGLOS / NO APTO. |
| `.claude/agents/critico-juego.md` | Juzga legibilidad, control, dificultad, ritmo y sensación con capturas o fotogramas reales del navegador. Sin evidencia no aprueba. |
| `.claude/agents/director-arte.md` | Juzga impacto visual y cinemáticas frente a `ART_DIRECTION_NEON_CRONIUM.md`, dosieres y referencias de `docs/art/`. Muy exigente. |
| `.claude/commands/competencia.md` | `/competencia [rango o descripción]`: lanza los tres en paralelo con el mismo encargo y compara veredictos, desacuerdos, coincidencias y afirmaciones sin evidencia. |

Los tres son de solo lectura por instrucción (tienen `Bash` para `git diff`,
pruebas y capturas, pero no deben editar, hacer commit ni push). Ninguno
sustituye la aceptación del propietario ni la prueba en iPhone físico.

## Ya existentes en el repositorio (`tools/third-party/skills/`)

Anthropic `frontend-design` y `webapp-testing`, OpenAI `skill-creator`,
wshobson `ui-design` (ver su `SOURCES.json`).

## Evaluadas y descartadas antes

| Fuente | Licencia | Por qué no |
|---|---|---|
| [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) (`game-developer`, `performance-engineer`, `debugger`, `code-reviewer`…) | MIT | Listas de comprobación genéricas (multijugador, shaders, bases de datos) que dependen de un "gestor de contexto" inexistente aquí. No aportan sobre lo que ya hacemos. |
| Skills de juegos en directorios (OpenGame, Three.js, Godot, "game-development") | Variada / sin comprobar | Generan juegos nuevos o usan otros motores; no encajan con un juego Canvas 2D existente. Repositorios sin verificar. |

## Segunda ronda: diseño ("estamos estancados con el diseño")

Propuesta del propietario: Taste Skill, Awesome Design (DESIGN.md), una
guía de diseño propia y Playwright CLI. Mismos criterios. Repositorios
clonados en modo lectura y leídos antes de copiar nada.

### Incorporado

| Qué | Fuente · licencia · commit | Dónde | Por qué |
|---|---|---|---|
| `playwright-cli` | [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) · Apache-2.0 (comprobado: `LICENSE` y `package.json`; sin `NOTICE`) · `b1a5903c5b633b8c9f843ad7b629c2a78437040c` | `.claude/skills/playwright-cli/` (`SKILL.md`, 10 referencias, `LICENSE`) | Explorar el juego paso a paso (pulsar, capturar, vídeo, consola). |
| `industrial-brutalist-ui` | [Leonxlnx/taste-skill-classics](https://github.com/Leonxlnx/taste-skill-classics) · MIT · `5e08c9383dc4ad7fc0df70e1ac8cfa09ec356305` | `.claude/skills/industrial-brutalist-ui/` (`SKILL.md`, `LICENSE`) | Su modo "Tactical Telemetry & CRT" es lo más cercano a un HUD de juego. Solo se activa llamándola por su nombre (`disable-model-invocation`). Su acento rojo único y su veto a degradados chocan con la identidad neón: `DESIGN.md` manda. |
| `DESIGN.md` (raíz) | Propio; formato tomado como plantilla de [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) · MIT · `3b605329240ce735b510037cca322f1831fdd7f8` | `DESIGN.md` | Tokens y reglas reales del proyecto (styles.css, index.html, render del lienzo, dirección de arte, guion del inicio). No copia ninguna marca. |
| `capturas-juego` + `scripts/capture-intro.cjs` | Propio | `.claude/skills/capturas-juego/`, `scripts/` | Alternativa local a Playwright CLI con el Playwright ya instalado: sirve `www/`, abre 390×844, pulsa `#play` y `#launch`, captura en los segundos pedidos y graba webm opcional fuera del repo. |

Copias idénticas al original (comparadas con `cmp`); huellas sha256 y
commit de cada archivo en `.claude/skills/SOURCES.json`.

**Playwright CLI: avisos.** La orden `playwright-cli` no está instalada
aquí y el Playwright global (1.56.1) no trae `npx playwright cli`. No se
instala ni se toca `package.json`. Su `SKILL.md` preautoriza
`Bash(npx playwright:*)` cuando la skill está activa, lo que incluye
`npx playwright install` (descarga navegadores): no ejecutarlo sin orden
del propietario. Instalar el CLI (`npm install -g @playwright/cli`) también
necesita su permiso. No usar `attach --cdp`/`--extension` contra navegadores
personales.

**Prueba real del script de capturas (20/10/2026).** Tras `npm ci` y
`npm run build`: `node scripts/capture-intro.cjs --times 1,5,9,12 --video
--output <scratchpad>/capturas/intro-02` → `passed`; 4 PNG de 780×1688
(capturas a 1,00 / 5,00 / 9,00 / 12,00 s), `intro.webm` (WebM válido,
2,2 MB) y `results.json` sin errores de página, de consola ni peticiones
fallidas (Chromium 141.0.7390.37). Se ven la estación y Cronos Prime (5 s) y
la explosión azul (12 s). Sin `--output` guarda en
`<tmp>/neon-capturas/intro-<fecha>`; se niega a reutilizar una carpeta con
`results.json`. No certifica Safari ni iPhone físico.

### Descartado

| Qué | Licencia | Por qué no |
|---|---|---|
| Taste Skill v2 `design-taste-frontend` ([Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), commit `6010f91a9935f1c167dfc500fb1a475681892e6b`) | MIT (comprobado) | Hecha para webs y paneles de aplicación (landing pages, dashboards). Sus reglas prohíben brillos, degradados, monospace y etiquetas en mayúsculas espaciadas: chocan con un arcade neón. `assets.mjs` busca y descarga imágenes de colecciones externas (Openverse, Wikimedia, Met…); `inspect.mjs` lanza Chrome. Una página le cuesta 30–45 min y cientos de miles de tokens. Su idea útil (juzgar solo capturas, arreglar los peores problemas y volver a mirar) ya la sigue `director-arte` con `capturas-juego`. |
| Taste classics: `high-end-visual-design`, `minimalist-ui`, `gpt-taste`, `design-taste-frontend-v1`, `design-taste-frontend-v2-experimental` | MIT | Landing pages, React/Tailwind/GSAP; nada aplicable a un juego Canvas. |
| Taste classics: `stitch-design-taste` | MIT | Pensada para Google Stitch y prohíbe "neón y brillos". Solo se usó su estructura de `DESIGN.md` como inspiración. |
| [Leonxlnx/imagegen-skills](https://github.com/Leonxlnx/imagegen-skills) (`imagegen-frontend-web/mobile`, `brandkit`, `image-to-code`; commit `beb16b0d0f4dae9a6f5cb04ea41e97b93a54ab8e`) | MIT | Necesitan una herramienta de generación de imágenes (ChatGPT Images, Codex) y producen maquetas web o de app, no arte de juego. |
| Los `DESIGN.md` de marcas de awesome-design-md (PlayStation, Nintendo, SpaceX…) | MIT (archivo de repositorio) | Son análisis de marcas ajenas: solo se usa el formato. Además su guía sugiere `npx @google/design.md lint` (descarga un paquete): no se usa. |
| [VoltAgent/awesome-claude-design](https://github.com/VoltAgent/awesome-claude-design) (commit `8f746b5bbb69cc7544fa850c126a71f754091951`) | MIT | Solo un README con enlaces a getdesign.md y a Claude Design (servicio web). Nada que incorporar. |

## Próximo paso propuesto

Un agente propio del proyecto, `neon-playtester`, que lance el juego en
Chromium con tamaño de iPhone, juegue un tramo concreto y devuelva capturas,
errores y métricas (partiendo de `scripts/capture-levels.cjs`).
Daría a `critico-juego` y `director-arte` la evidencia que hoy tienen que
generar ellos mismos.
