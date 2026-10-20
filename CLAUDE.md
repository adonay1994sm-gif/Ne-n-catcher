# NEON CRONIUM — guía rápida para Claude

Juego arcade espacial en **Canvas 2D**, lienzo lógico **720×1280** (vertical).
Se distribuye como PWA (Netlify publica `www/`) y como app iOS con Capacitor.
Las instrucciones detalladas del propietario están en `AGENTS.md`; esta guía
solo resume lo imprescindible.

## Estado del juego

El juego **no está terminado**: solo el capítulo 1 de la campaña objetivo
(10 capítulos × 10 etapas) está jugable y en pulido. Preparar la publicación
no significa que esté listo para la tienda.

## Idioma

- Explica todo en **español** y con lenguaje sencillo.
- Mensajes de commit en español, cortos y claros: un cambio por commit.
- No entierres la respuesta: la acción o el resultado en la primera línea,
  pasos numerados y listas cortas (máx. 5). Sin preámbulos ni despedidas.
  Para aplicarlo a toda la sesión: `/i-have-adhd` (skill MIT de
  [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd)).

## Dónde se edita el código

- El juego vive en `src/game/` (módulos `00-…` a `08-…` y subcarpetas).
- `game.js`, `core-runtime.js`, `content-runtime.js`, `www/` e
  `ios/App/App/public/` son **salidas generadas**. No se editan a mano.
- `game.js` está versionado: si el build lo regenera, va en el mismo commit
  que el cambio en `src/game/`.
- Mapa de módulos: `src/game/README.md`.

## Comandos

```bash
npm ci                 # instalar dependencias exactas
npm run build          # regenera game.js, runtimes, www/ e iOS public
npm test               # pruebas de juego (JSDOM)
npm run test:static    # coherencia de paquete, manifiesto, SW, iOS
npm run test:content   # suites node:test de contenido
npm run test:architecture
npm run test:preview   # paquete de preview y service worker
```

Después de cada commit: `npm run build && npm test && npm run test:static`.
Si algo falla por el cambio, se deshace ese commit y se anota.

## Ramas

- Base de integración: `continuity-assets-audit-20261013`.
- Rama de trabajo de publicación: `claude/preparar-publicacion-rtfl9q`.
- **No tocar `main`**, ni el PR #3, ni hacer force push.

## Publicidad

- Solo **IDs de prueba** de Google AdMob (`ca-app-pub-3940256099942544…`).
- No poner IDs reales ni cambiar `ads-config.js`, `native-admob.js` o
  `ad-bridge.js` sin orden expresa del propietario.

## Reglas de trabajo

- Cambios pequeños y reversibles. No borrar archivos; mover con `git mv`.
- No cambiar balance, dificultad, economía ni guardados sin orden expresa.
- No tocar iOS/Capacitor (`ios/`, `capacitor.config.ts`) salvo indicación.
- `USE_ENGINE_V1 = false` y un único bucle `requestAnimationFrame`.
- No inventar datos legales, contactos ni IDs: escribir `[COMPLETAR]`
  o "sin comprobar".
- Progreso de la preparación de publicación: `docs/publicacion/PROGRESO.md`.

## Cuatro reglas antes de programar

Adaptadas de [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)
(MIT, commit `2c60614`). En tareas triviales, usa el sentido común.

1. **Piensa antes de programar.** Di qué estás suponiendo. Si hay varias
   lecturas posibles o algo no está claro, pregunta en vez de elegir a
   escondidas. Si hay una forma más sencilla, dilo.
2. **Mantenlo simple.** El mínimo código que resuelve lo pedido: nada de
   funciones extra, abstracciones de un solo uso ni opciones que nadie pidió.
   Si 200 líneas pueden ser 50, reescríbelo.
3. **Toca solo lo que te han pedido.** No "mejores" código, comentarios ni
   formato vecinos; respeta el estilo existente. Si ves código muerto ajeno,
   avísalo, no lo borres. Cada línea cambiada debe venir de la petición.
4. **Demuestra que funciona.** Convierte la tarea en un criterio comprobable
   (una prueba que falla y luego pasa, una captura, la salida de un comando)
   y no la des por terminada sin esa prueba.

## Skills y agentes del proyecto

- Flujo para trabajo nuevo: `brainstorming` → especificación aprobada →
  `writing-plans` → `subagent-driven-development` o `executing-plans`, con
  `test-driven-development`. Detalle y fuentes en
  `docs/agents/SKILLS_GITHUB_2026-10-20.md`.
- Al cerrar un trabajo, sigue las reglas de **Ramas** de esta guía (no se
  usa `finishing-a-development-branch`). El compañero visual de
  `brainstorming` no está instalado: usa texto o capturas.
- `/competencia`: lanza `auditor-codigo`, `critico-juego` y `director-arte`
  en paralelo y compara sus veredictos. El propietario decide.
