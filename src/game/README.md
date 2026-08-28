# Arquitectura modular del juego

`game.js` es un archivo generado. No debe editarse directamente.

Los módulos conservan un único ámbito privado compartido y se concatenan en orden numérico. Esta estrategia separa responsabilidades sin introducir imports en tiempo de ejecución, solicitudes adicionales, cambios en el orden de inicialización ni incompatibilidades con PWA, Netlify o Capacitor.

## Orden de módulos

1. `00-bootstrap-config.js`: DOM, configuración, campaña y claves.
2. `01-runtime-assets.js`: estado global, silueta de colisión y sprites.
3. `02-storage-audio.js`: persistencia, utilidades, audio y ajustes.
4. `03-ui-game-flow.js`: menús, HUD, briefing, partida y resultados.
5. `04-entities-collision-damage.js`: spawns, colisiones, daño, habilidades y efectos.
6. `05-corridor-update.js`: formaciones, corredor garantizado y actualización lógica.
7. `06-world-rendering.js`: entorno, fondos y efectos del mundo.
8. `07-player-item-rendering.js`: nave, objetos, disparos, explosiones y HUD de combo.
9. `08-loop-input-bootstrap.js`: render final, bucle, controles, eventos e inicio.

## Comandos

```bash
npm run build:game
npm run build:web
npm test
```

`npm run build:game` regenera `game.js`. `npm run build:web` lo regenera antes de construir `www/`.
