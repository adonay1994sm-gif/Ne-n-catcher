# PROPUESTA · Unificar las carpetas de motor

> Estado: **PROPUESTA**. `AGENTS.md`: no activar, migrar ni fusionar motores
> sin orden técnica del propietario. Esto solo ordena carpetas.

## Situación (19/10/2026) — detalle en `docs/publicacion/ANALISIS_REFERENCIAS.md`

| Carpeta | Uso real | ¿Juego publicado? |
|---|---|---|
| `src/engine/` (6) | `npm run test:engine` + 1 prueba de contenido | No |
| `js/engine/` (4) | `engine/demo.mjs`, `tests/campaign-adapter.test.mjs` (fuera de los scripts npm) | Se copia a la web |
| `engine/` (6) | `engine-preview.html` | Se copia a la web |
| `render/` (2) | demo y `tests/neon-render-engine.test.mjs`, `sprite-animator` | `neon-render-engine.mjs` se copia a la web |

- El juego (`game.js`, `core-runtime.js`, `content-runtime.js`) **no usa
  ninguna**.
- `src/engine/` y `js/engine/` comparten 4 nombres de archivo pero con
  **contenido distinto**: hay dos versiones del mismo motor.
- `scripts/build-web.mjs` publica la demo en la web de producción.

## Opciones

1. **Agrupar sin cambiar código:** `git mv` de `engine/`, `js/engine/`,
   `engine-preview.html` y `render/` a `experimental/` y ajustar
   `build-web.mjs`, `engine/demo.mjs` y las pruebas. Bajo riesgo.
2. **Una sola versión del motor:** decidir si manda `src/engine/` (la que
   tiene pruebas) y hacer que la demo la importe; archivar `js/engine/` en
   `docs/historico/`. Riesgo medio: la demo puede depender de diferencias.
3. **Dejar de publicar la demo en la web de producción**: quitar las 4
   líneas de `build-web.mjs` que copian `engine-preview.html`, `engine/`,
   `js/engine/` y `render/` a `www/`. Recomendado antes de lanzar. Hay que
   revisar `tests/product-brand.test.mjs`.

## Pasos sugeridos
Primero la opción 3 (afecta a lo que ven los usuarios), luego la 1. La 2
solo con orden técnica del propietario.
