# Skills y agentes de código abierto evaluados · 20/10/2026

Petición del propietario: buscar en GitHub skills y agentes **de código
abierto** que ayuden a Claude a trabajar mejor y más rápido. Criterios:
licencia libre, contenido leído entero, sin descargas ni órdenes peligrosas,
útil para este proyecto (juego Canvas 2D, PWA + iOS, pruebas en Node).

## Incorporadas (activas en `.claude/skills/`, sin modificar)

Fuente: [obra/superpowers](https://github.com/obra/superpowers), licencia MIT,
commit `bb92a77741419a4ab5f06e711a283343f1ada0c3`. Huellas en
`.claude/skills/SOURCES.json`.

| Skill | Para qué la uso aquí |
|---|---|
| `systematic-debugging` | Encontrar la causa real de un fallo antes de tocar código (como el caso de las 35 pruebas rotas de la fase 1a). |
| `verification-before-completion` | No dar nada por terminado sin ejecutar build y pruebas y leer la salida. |
| `test-driven-development` | Escribir la prueba antes del cambio en lógica nueva (motor de viaje por fichas, Cronos Prime, bodega de chatarra). |
| `dispatching-parallel-agents` | Repartir tareas independientes entre agentes en paralelo (p. ej. arte, pruebas y código a la vez). |

## Ya existentes en el repositorio (`tools/third-party/skills/`)

Anthropic `frontend-design` y `webapp-testing`, OpenAI `skill-creator`,
wshobson `ui-design` (ver su `SOURCES.json`).

## Evaluadas y descartadas

| Fuente | Licencia | Por qué no |
|---|---|---|
| [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) (`game-developer`, `performance-engineer`, `debugger`, `code-reviewer`…) | MIT | Listas de comprobación genéricas (multijugador, shaders, bases de datos) que dependen de un "gestor de contexto" inexistente aquí. No aportan sobre lo que ya hacemos. |
| Skills de juegos en directorios (OpenGame, Three.js, Godot, "game-development") | Variada / sin comprobar | Generan juegos nuevos o usan otros motores; no encajan con un juego Canvas 2D existente. Repositorios sin verificar. |

## Próximo paso propuesto

Un agente propio del proyecto, `neon-playtester`, que lance el juego en
Chromium con tamaño de iPhone, juegue un tramo concreto y devuelva capturas,
errores y métricas (reutilizando `scripts/chapter-one-browser-smoke.cjs`).
Es lo que más tiempo ahorraría y ninguna skill pública lo cubre.
