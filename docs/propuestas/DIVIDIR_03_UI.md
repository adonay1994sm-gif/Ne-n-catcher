# PROPUESTA · Dividir `src/game/03-ui-game-flow.js` (1.904 líneas)

> Estado: **PROPUESTA**. No ejecutar antes de publicar salvo decisión
> expresa: es un refactor sin beneficio visible para el jugador.

## Situación (19/10/2026)

- 1.904 líneas, **82 funciones**, con bloques claramente separables:

| Bloque | Funciones (ejemplos) | Líneas aprox. |
|---|---|---|
| Recuperación/chatarra y taller C9 | `loadClassicSalvage`, `buyClassicC9Upgrade`, `spawnClassicScrap`, `openClassicDock`, `updateClassicDock` | 38–535 |
| Vuelo clásico, HUD de vuelo y tutorial | `setupClassicFlight`, `syncClassicFlightHud`, `advanceClassicTutorial`, `advanceClassicFlight` | 179–760 |
| Armas y misiles | `fireClassicWeapon`, `fireClassicMissile`, `interceptClassicProjectile` | 749–828 |
| Guardián Atlas | `setupAtlasEncounter` … `resolveAtlasPulse` | 829–976 |
| Hangar y Journey (campañas archivadas) | `setupShipHangar`, `setupJourneyUI`, `journeyEvent` | 977–1238 |
| Menú, HUD general y flujo de nivel | `updateMenu`, `hud`, `startLevel`, `pauseGame`, `completeLevel`, `finishGame` | 1239–1904 |

## Restricciones técnicas que condicionan el cómo

- `scripts/game-bundle.mjs` **exige exactamente 9 módulos** `NN-nombre.js`
  y los concatena en un único ámbito; `tests/run-static-tests.mjs` y
  `tests/run-tests.mjs` fijan la lista de 9 nombres.
- Varias pruebas leen `03-ui-game-flow.js` por nombre y lo evalúan en
  sandbox junto a otros módulos: `combat-sfx-legacy`, `death-score-persistence`,
  `debris-salvage`, `ship-hangar`, `ship-render-fallback`, `visual-artpass`.

## Opciones

1. **Extraer lógica pura a `src/game/<área>/*.js`** (como ya se hizo con
   `progression/`, `combat/`…), que van a `content-runtime.js`, y dejar en
   03 solo el "pegamento" con el DOM. No toca el número de módulos.
   - Ventajas: más probable que mejore pruebas; sin cambiar el bundler.
   - Riesgo: medio; requiere pasar por `NeonCampaign` u objeto similar.
2. **Partir 03 en 03a/03b/…** cambiando el bundler y las listas de las pruebas.
   - Riesgo: alto para poca ganancia; rompe todas las pruebas que leen el
     archivo por nombre.
3. **No tocarlo hasta después del lanzamiento** (recomendado).

## Pasos si se aprueba la opción 1 (después del lanzamiento)
1. Empezar por Atlas (≈150 líneas, bien delimitado).
2. Mover funciones puras a `src/game/combat/atlas-ui.js` con pruebas propias.
3. Ajustar las pruebas sandbox que cargan 03.
4. Build, todas las suites y una partida natural completa por cada paso.
