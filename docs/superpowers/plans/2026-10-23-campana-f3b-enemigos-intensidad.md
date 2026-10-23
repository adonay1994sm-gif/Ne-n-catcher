# Campaña F3b · Enemigos de Gaia e intensidad — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el sector 1 sea intenso y justo:
- turnos de ataque en lugar de la escalada;
- abanicos abiertos;
- los cuatro enemigos nuevos de Gaia con su IA y su arte: Rastreador,
  Sembrador, Égida y Alfa;
- hordas;
- meteoritos dirigidos a la nave, sin pasillo marcado.

**Architecture:**
- **Módulos puros nuevos:**
  - `combat/gaia-enemies.js`: los cuatro enemigos; la dirección y la decisión
    de atacar salen de `enemy-ai.js`;
  - `combat/horde.js`: formación de las hordas;
  - `progression/aimed-meteors.js`: lluvia de meteoritos dirigidos.
- **Integración:** el juego (`03`, `05`, `07`) los avanza dentro del bucle
  de `items`, como a los perseguidores actuales.
- **Turnos de ataque:** los perseguidores actuales los respetan a través de un
  parámetro opcional `gate`. Sin ese parámetro, los viajes antiguos se
  comportan como hoy.

**Tech Stack:** JavaScript (módulos concatenados en `game.js` + módulos ES en
`content-runtime.js` con esbuild), `node:test`, JSDOM; Python con Pillow para
empaquetar el arte, como `scripts/build-chronos-intro-assets.py`.

**Spec:** `docs/superpowers/specs/2026-10-22-campana-galaxia-design.md` §6.9
y §6.10, y `docs/design/BIBLIA_GALAXIA.md` §3.1 (Guardia de Gaia).

## Decisiones técnicas de este plan (reversibles)

Las cifras son el punto de partida; las ajusta el bot en la F3e (spec §8).

| Qué | Decisión |
|---|---|
| Turnos de ataque | Solo en el sector. `attackers` por tramo en la ficha: 1 en los tramos 1–2, 2 en los 3–5 y el 10, 3 en los 6–9. El que más tiempo lleva vivo pide primero. La escalada J01 (`intensity`) queda en 0 cuando hay turnos. |
| Abanico abierto | 5 proyectiles separados 0,30 rad (±0,60 rad, unos ±34°) y cono 1,2. Para todos los perseguidores. |
| Rastreador (CH-04) | Emboscador, 2 de vida. **Básica** cada 2,4 s: aviso de 0,4 s y disparo hacia arriba, apuntado a la nave (380 px/s, 12 de daño). **Única** cada 9 s: **marca** a la nave durante 4 s; mientras dura, los perseguidores adelantan el tiro ×1,5. |
| Sembrador (CH-05) | Minador, 3 de vida. **Básica** cada 2,2 s: **mina** (se arma en 0,8 s, estalla si la nave está a menos de 70 px, 16 de daño; desaparece a los 7 s; se puede destruir de un disparo). **Única** cada 10 s: **bomba en cruz** que viaja al borde más cercano (300 px/s) y allí se abre en 3 rayos (320 px/s, 12 de daño). |
| Égida (CH-06) | Escolta, 3 de vida, no dispara. **Única** cada 8 s: **escudo** de 3 impactos sobre el aliado que protege, el más dañado. Sin aliados, se queda quieta. |
| Alfa (CH-02 élite) | Cazador, 12 de vida, se mantiene al menos 320 px por encima de la nave. **Básica** cada 1,6 s: 4 cañones paralelos (separados 28 px, 360 px/s, 12 de daño). **Única** cada 7 s: andanada en cruz de 8 disparos (240 px/s, 12 de daño). |
| Chatarra | Cada enemigo nuevo da la de su sustituto actual: Rastreador = interceptor, Sembrador = raider, Égida = scout y Alfa = interceptor. La economía no cambia. |
| Horda | `horde: {every, size}` en la ficha. Formación en V de CH-01 que cruza la pantalla en diagonal sin detenerse (260 px/s), 1 de vida, 12 de daño al chocar, sin disparos. Siempre deja hueco: dos unidades a menos de 60 px de altura están a 160 px o más en horizontal. |
| Meteoritos dirigidos | `comets: 'aimed'` en la ficha. Aviso de 0,8 s en el borde y luego un meteorito hacia donde estaba la nave al avisar (470 px/s, sin perseguir, 14 de daño). Separación mínima de 0,6 s. Mientras dura la lluvia, los turnos bajan a 1 (presión justa en lugar del alto el fuego J04). |
| Arte | Celdas de 192 px. Rastreador 768×384, Sembrador 768×576, Égida 768×384, Alfa 1024×256 (4 piezas de 256), proyectiles tal cual (768×512, celdas de 128). Disparo del Rastreador y de la cruz = «orbe»; cañones del Alfa = «misil». |
| Égida naranja | El baúl la entrega en naranja; la biblia dice que Gaia es marfil, grafito y núcleo rojo. Se integra tal cual con `artisticAcceptance: "PENDING_OWNER"` y se pregunta al propietario. |

## Global Constraints

- **Archivos:**
  - se edita `src/game/`, `tests/`, `scripts/`, `assets/`, `art-source/`,
    `ASSET_MANIFEST.json` y `sw.js`;
  - `game.js`, `core-runtime.js`, `content-runtime.js` y `www/` se
    regeneran con `npm run build` y van en el mismo commit.
- **Tras cada commit:** `npm run build && npm test && npm run test:static` y
  `npm run test:content`.
- **Bucle y azar:**
  - un único `requestAnimationFrame`;
  - los módulos nuevos son puros: reciben `now`/`dt` y una semilla, y nunca
    llaman a `Math.random`.
- **No tocar:** anuncios, iOS ni Capacitor.
- **Viajes antiguos:** siguen como hoy (sin `gate`), salvo el abanico
  abierto.
- **Commits:** en español, un cambio por commit, sin firma de IA.

## Review Focus

1. **Pausa:** los turnos, los avisos y los tiempos de recarga usan el reloj
   del juego (`elapsed`). Tras una pausa larga nadie dispara de golpe.
   Prueba en la tarea 1.
2. **Enemigo que sale de pantalla o muere con un turno:** el turno se libera
   en ese mismo fotograma. Prueba en la tarea 1.
3. **Escudo de la Égida sobre un aliado que muere, o Égida que muere:** el
   escudo desaparece y no queda dibujado ni bloqueando disparos. Prueba en
   la tarea 7.
4. **Mina armada cuando la nave revive o el tramo cambia:** al revivir se
   limpian las amenazas cercanas, minas incluidas, como hoy. Prueba en la
   tarea 7.
5. **Meteorito que se avisa y no llega a salir** (lluvia terminada, pausa o
   cambio de tramo): no queda un aviso colgado en pantalla. Prueba en la
   tarea 9.

---

### Task 1: Turnos de ataque en las patrullas

**Files:**
- Modify: `src/game/combat/classic-pursuit.js`, `src/game/05-corridor-update.js`
  y `src/game/03-ui-game-flow.js`.
- Test: `tests/classic-pursuit-tokens.test.mjs` (nuevo, en `test:content`) y
  `tests/sector-flow.test.mjs`.

**Interfaces:**
- Consumes: `createAttackTokens`, `requestAttack`, `releaseAttack` y
  `forgetEnemy` de `combat/attack-tokens.js`.
- Produces:
  - `advanceClassicPursuer(item, dt, player, spawnProjectile, gate = null)`,
    donde `gate = {tokens, now}`;
  - con `gate`, el perseguidor solo pasa a `charge` si `requestAttack` le da
    turno (`id: item.id`, `bornAt`: el `now` de su primer avance) y lo
    libera al volver a `reposition`, `retreat` o `destroyed`;
  - con `gate`, `enemy.intensity` vale siempre 0;
  - en el juego: `sectorAttackTokens` (o `null` fuera del sector), creado al
    empezar cada tramo con `max: rules.attackers ?? 2`.

- [ ] **Step 1: Write the failing tests** en `classic-pursuit-tokens.test.mjs`:
  - `with one token only one pursuer charges at a time`: dos perseguidores en
    combate con `max: 1` → nunca hay dos en `charge` a la vez a lo largo de
    20 s simulados.
  - `the oldest pursuer attacks first`: el de menor `bornAt` carga primero.
  - `the token is released when the pursuer fires, retreats or dies`: tras
    `fire` → `reposition`, `attackHolders(tokens)` no lo contiene; igual con
    `hp = 0`.
  - `without a gate nothing changes`: misma semilla con y sin `gate: null` da
    los mismos proyectiles que hoy (compara con una copia del resultado
    actual guardada en la prueba).
  - `a long pause does not make everyone fire at once`: avanza con `now`
    congelado durante 600 fotogramas de `dt = 0` → ningún disparo nuevo.

  En `sector-flow.test.mjs`:
  - `sector stages hand out attack tokens from the ficha`: en el tramo 7,
    `T.ev('sectorAttackTokens.max') === 3`;
  - `a removed enemy frees its token in the same frame`.
- [ ] **Step 2:** `npm run build && node --test tests/classic-pursuit-tokens.test.mjs tests/sector-flow.test.mjs` → FAIL.
- [ ] **Step 3:** Implementa el `gate` en el perseguidor. En el juego:
  - `05-corridor-update.js` pasa `{tokens: sectorAttackTokens, now: elapsed}`
    solo si `sectorAttackTokens` existe;
  - antes del bucle de `items`, `forgetEnemy` de los poseedores que ya no
    están en `items`;
  - `03` crea los turnos en el evento `checkpoint` y en `startLevel` de una
    partida de sector, y añade `attackers` a cada `encounter` de
    `S1_GAIA`:
    - `encounter(..., {attackers})`;
    - valores de la tabla de decisiones.
- [ ] **Step 4:** → PASS; suites de los Global Constraints → PASS.
- [ ] **Step 5:** Commit «Turnos de ataque en las patrullas del sector».

### Task 2: Abanicos abiertos

**Files:**
- Modify: `src/game/combat/classic-pursuit.js` (`CLASSIC_PURSUIT_VOLLEY` y
  `launch`).
- Test: `tests/classic-pursuit-tokens.test.mjs`.

- [ ] **Step 1: Write the failing test** `an open fan fires five shots across about 68 degrees`:
  - fuerza `volley = 'spread'`;
  - 5 proyectiles;
  - ángulo entre el primero y el último ≥ 1,15 rad;
  - todos con `vy > 0`.
- [ ] **Step 2:** → FAIL (hoy son 3 con ±0,24 rad).
- [ ] **Step 3:** `CLASSIC_PURSUIT_VOLLEY = {maxProjectiles: 5, doubleGap: .2, spreadAngle: .30, spreadCount: 5, cone: 1.2}`.
  El abanico usa los desplazamientos `k * spreadAngle` con `k` de −2 a 2.
  Actualiza las pruebas antiguas que fijan 3 proyectiles (buscar
  `maxProjectiles` y `spreadAngle` en `tests/`) y cita la spec §6.10 en el
  commit.
- [ ] **Step 4:** → PASS; suites → PASS.
- [ ] **Step 5:** Commit «Abanicos abiertos: cinco disparos que cubren un ángulo mayor».

### Task 3: Arte de los enemigos nuevos en el juego

**Files:**
- Create: `scripts/build-gaia-enemy-assets.py`. Lee los originales de
  `art-source/enemies/gaia/` y escribe en `assets/` estos archivos:
  - `gaia_tracker_atlas_v1.webp`;
  - `gaia_sower_atlas_v1.webp`;
  - `gaia_aegis_atlas_v1.webp`;
  - `gaia_alpha_atlas_v1.webp`;
  - `hostile_projectiles_v2.webp`.
- Create: `art-source/enemies/gaia/` con los originales del baúl y un
  `PROVENANCE.json` (fecha, `origin`, sha256 y encargo).
- Modify:
  - `ASSET_MANIFEST.json`: 5 entradas; `status: "IN_REVIEW"` y
    `artisticAcceptance: "PENDING_OWNER"`;
  - `sw.js`: la precarga;
  - `src/game/01-runtime-assets.js`: `SPRITES.gaiaTracker`, `gaiaSower`,
    `gaiaAegis`, `gaiaAlpha` y `hostileProjectiles2`.
- Test: `npm run test:static`, que ya comprueba el manifiesto y la precarga.

- [ ] **Step 1:** Descarga del baúl los cinco originales (los `.webp` sin
  pérdida y las 4 piezas `.png` del Alfa) a `art-source/enemies/gaia/`.
- [ ] **Step 2:** Añade las entradas al manifiesto con `size` y `sha256`
  de mentira y ejecuta `npm run test:static` → FAIL (faltan los archivos o
  no coinciden).
- [ ] **Step 3:** Escribe y ejecuta el script con las medidas de la tabla.
  Rellena `size`, `sha256` y `dimensions` reales, añade la precarga a `sw.js`
  y los `SPRITES`.
- [ ] **Step 4:** `npm run build && npm run test:static && npm test` → PASS.
  Mira las cinco hojas sobre fondo oscuro.
- [ ] **Step 5:** Commit «Arte de Rastreador, Sembrador, Égida, Alfa y proyectiles nuevos».

### Task 4: Módulo de los enemigos de Gaia — Rastreador

**Files:**
- Create: `src/game/combat/gaia-enemies.js`, exportado en
  `progression/legacy-content-entry.js`.
- Modify: `src/game/combat/enemy-ai.js`. La intención de la Escolta añade
  `guardId` (id del aliado protegido o `null`).
- Test: `tests/gaia-enemies.test.mjs` (nuevo, en `test:content`) y
  `tests/enemy-ai.test.mjs`.

**Interfaces:**
- Produces:
  - `GAIA_ENEMY_RULES`: tabla congelada con las cifras de la tabla de
    decisiones, por clase: `tracker`, `sower`, `aegis` y `alpha`;
  - `createGaiaEnemy({kind, x, y, seed, now}) → state`, con estos campos:
    - `kind`, `profile`, `hp`, `maxHp`;
    - `cooldowns: {basic, unique}`, en tiempo de juego absoluto;
    - `bornAt`, `telegraph`, `pending`, `heading`, `shieldTargetId`;
  - `advanceGaiaEnemy(item, dt, ctx, emit)`:
    - `item = {id, x, y, hp, maxHp, gaia: state}`;
    - `ctx = {now, player: {x, y, hull, reloading}, bounds: {w, h}, allies, tokens}`;
  - eventos de `emit`:
    - `{type: 'shot', x, y, vx, vy, damage, sprite}`;
    - `{type: 'mark', seconds}`;
    - `{type: 'mine', x, y}`;
    - `{type: 'cross-bomb', x, y, vx}`;
    - `{type: 'shield', targetId, hits}`.

  Mueve el cuerpo hacia la intención a `rules.speed` como máximo. Un ataque
  concedido avisa (`telegraph` de 0 a 1 en `warning` segundos) y después
  emite, pone la recarga y libera el turno.

- [ ] **Step 1: Write the failing tests:**
  - `the tracker enters from below and stays behind the ship`: nace en
    `y = h + 40`; tras 4 s está por debajo de la nave (`y > player.y`).
  - `the tracker warns before shooting upward at the ship`: el primer `shot`
    llega 0,4 s después de empezar el aviso, con `vy < 0`, y su recta pasa a
    menos de 30 px de la nave del momento del aviso.
  - `the tracker marks the ship every 9 seconds`: hay un `mark` con
    `seconds: 4`, y el siguiente llega 9 s después o más.
  - `it never attacks without a token`: con un turno ocupado por otro, no
    emite `shot` en 10 s.
  - `same seed, same events`: dos ejecuciones con la misma semilla dan la
    misma lista de eventos.
  - En `enemy-ai.test.mjs`: `the escort intent names the ally it guards`.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementa el módulo base y el Rastreador.
- [ ] **Step 4:** → PASS; `npm run test:content` → PASS.
- [ ] **Step 5:** Commit «Rastreador de Gaia: entra por detrás, dispara hacia arriba y marca la nave».

### Task 5: Sembrador, minas y bomba en cruz

**Files:**
- Modify: `src/game/combat/gaia-enemies.js`.
- Test: `tests/gaia-enemies.test.mjs`.

**Interfaces:**
- Produces:
  - `advanceMine(mine, dt, player) → null | 'explode' | 'expire'`, con
    `mine = {x, y, age, armed}`;
  - `advanceCrossBomb(bomb, dt, bounds) → null | rays[]`, donde cada `ray`
    es `{x, y, vx, vy, damage}`.

- [ ] **Step 1: Write the failing tests:**
  - `the sower crosses the lower lane from edge to edge`: su `y` se queda
    cerca de `0,78 * h` y llega a los dos bordes en 12 s.
  - `the sower drops a mine every 2.2 seconds`: primer `mine` y luego cada
    2,2 s o más, siempre con turno.
  - `a mine arms after 0.8 s and only explodes near the ship`: nave a 60 px →
    no estalla antes de 0,8 s y sí después; nave a 100 px → nunca estalla;
    a los 7 s → `'expire'`.
  - `the cross bomb bursts into three rays at the edge`: lanzada hacia la
    izquierda, devuelve 3 rayos al tocar el borde: uno hacia dentro, uno
    hacia arriba y uno hacia abajo.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementa al Sembrador, `advanceMine` y `advanceCrossBomb`.
- [ ] **Step 4:** → PASS.
- [ ] **Step 5:** Commit «Sembrador de Gaia: minas de proximidad y bomba en cruz».

### Task 6: Égida y Alfa

**Files:**
- Modify: `src/game/combat/gaia-enemies.js`.
- Test: `tests/gaia-enemies.test.mjs`.

- [ ] **Step 1: Write the failing tests:**
  - `the aegis follows the weakest ally and shields it`: con dos aliados (uno
    al 50 %), se acerca a él y emite `{type:'shield', targetId: <ese>, hits: 3}`;
    el siguiente escudo llega 8 s después o más.
  - `the aegis never shoots and needs no token`: con los turnos ocupados,
    igualmente emite `shield` y nunca `shot`.
  - `the alpha keeps 320 px above the ship`: su `y` nunca supera
    `player.y - 320`.
  - `the alpha fires four parallel cannons`: 4 `shot` del mismo instante, con
    `vx === 0` y separados 28 px.
  - `the alpha cross volley has eight shots`: 8 `shot` en 8 direcciones
    distintas.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementa a la Égida y al Alfa.
- [ ] **Step 4:** → PASS.
- [ ] **Step 5:** Commit «Égida y Alfa de Gaia: escudo sobre el aliado y andanadas del élite».

### Task 7: Los enemigos de Gaia en el juego

**Files:**
- Modify:
  - `src/game/03-ui-game-flow.js`:
    - `spawnClassicFlightPatrol`: las clases nuevas crean un enemigo de
      Gaia; se retiran los sustitutos;
    - el daño a enemigos y el escudo;
    - la chatarra (`salvageRole` = sustituto);
  - `src/game/05-corridor-update.js`: avance, minas, bombas y marca;
  - `src/game/04-entities-collision-damage.js`: colisión de minas, rayos y
    disparos nuevos;
  - `src/game/07-player-item-rendering.js`: el dibujo, con las celdas de la
    tarea 3; el escudo, encima del aliado protegido.
- Test: `tests/sector-flow.test.mjs`.

**Interfaces:**
- Consumes: tareas 1, 3, 4, 5 y 6.
- Produces, en los objetos de `items`:
  - `gaiaEnemy: true`;
  - `gaiaMine: true`;
  - `gaiaBomb: true`;
  - `shieldHits: number` sobre el aliado protegido.

- [ ] **Step 1: Write the failing tests:**
  - `each Gaia roster entry spawns its own enemy`: en los tramos 2, 3, 4 y 7
    (con `startAt`), en 20 s aparece al menos un enemigo de la clase que abre
    su lista (tracker, sower, aegis y alpha).
  - `a shielded ally takes shots on its shield first`: con `shieldHits: 3`,
    tres impactos no le quitan vida y el cuarto sí.
  - `the shield disappears when its ally or its aegis dies`.
  - `mines near the ship are cleared when reviving`: con una mina armada a
    100 px y `T.resumeReward()` → no queda `gaiaMine` en la mitad inferior.
  - `new enemies drop the scrap of their stand-in`: derribar un tracker suma
    lo mismo que un interceptor.
  - `the tracker mark sharpens the pursuers' aim`: tras un `mark`,
    `player.marked` vale true durante 4 s.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Conecta y dibuja. Los avisos (`telegraph`) se dibujan con
  el brillo rojo de las celdas de ataque del arte.
- [ ] **Step 4:** → PASS; suites → PASS. Capturas en Chromium de los tramos
  3, 4 y 7 con el panel de desarrollo, fuera del repositorio, y mirarlas.
- [ ] **Step 5:** Commit «Rastreador, Sembrador, Égida y Alfa en el sector 1».

### Task 8: Hordas

**Files:**
- Create: `src/game/combat/horde.js`, exportado.
- Modify:
  - `03-ui-game-flow.js` (lanzar la horda según `rules.horde`) y `05` (mover
    las unidades);
  - la ficha `S1_GAIA`: `horde: {every: 14, size: 5}` en los tramos 3, 7
    y 9.
- Test: `tests/horde.test.mjs` (nuevo, en `test:content`) y
  `tests/sector-flow.test.mjs`.

**Interfaces:**
- Produces: `createHordeWave({size, width, seed}) → units`. Cada unidad es
  `{x, y, vx, vy, delay}`: formación en V que entra por arriba y cruza en
  diagonal a 260 px/s.

- [ ] **Step 1: Write the failing tests:**
  - `a horde wave is a V of the requested size`;
  - `a horde always leaves room to pass`: en todo instante simulado, dos
    unidades con |Δy| < 60 tienen |Δx| ≥ 160;
  - `horde units never stop`: `vy > 0` siempre;
  - en el juego, `horde stages launch a wave every 14 seconds`: en el tramo 3,
    30 s → 2 oleadas.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementa el módulo y la integración. Las unidades son
  CH-01 (`SPRITES.ch01`), sin disparos, con `salvageRole: 'raider'`.
- [ ] **Step 4:** → PASS; suites → PASS.
- [ ] **Step 5:** Commit «Hordas de CH-01 que cruzan en V y obligan a moverse».

### Task 9: Meteoritos dirigidos, sin pasillo marcado

**Files:**
- Create: `src/game/progression/aimed-meteors.js`, exportado.
- Modify:
  - `03-ui-game-flow.js`: en el sector, `comets: 'aimed'` crea la lluvia
    dirigida en vez de `createCometShower`, y mientras dura, `tokens.max = 1`;
  - `05` y `07`: avance y dibujo del aviso en el borde;
  - la ficha `S1_GAIA`: los tramos 4 y 8 pasan de `comets: true` a
    `comets: 'aimed'`.
- Test: `tests/aimed-meteors.test.mjs` (nuevo, en `test:content`) y
  `tests/sector-flow.test.mjs`.

**Interfaces:**
- Produces:
  - `AIMED_METEOR_RULES`;
  - `createAimedMeteorRain({seed, width, height, count})`;
  - `advanceAimedMeteorRain(state, dt, player, emit)`, que emite
    `{type: 'warning', id, x, y}` y, 0,8 s después,
    `{type: 'meteor', id, x, y, vx, vy, damage}`;
  - `state.done` cuando ha salido el último.

- [ ] **Step 1: Write the failing tests:**
  - `each meteor is aimed at where the ship was when it was announced`: la
    recta del meteorito pasa a menos de 25 px de esa posición.
  - `there is always time to dodge`: entre el aviso y que llegue a la altura
    de la nave pasan 1,2 s o más.
  - `meteors are at least 0.6 s apart`.
  - `no protected corridor is drawn`: en el sector no hay `classicCometShower`
    activo ni se dibuja el pasillo.
  - `a pending warning is dropped when the stage changes or the ship revives`:
    tras el cambio no queda ningún aviso en pantalla.
  - `the rain lowers attack tokens to one while it lasts`.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementa el módulo, la integración y el cambio de ficha.
- [ ] **Step 4:** → PASS; suites → PASS; `npm run test:sim` → PASS. Capturas
  del tramo 4.
- [ ] **Step 5:** Commit «Meteoritos dirigidos a la nave, con aviso y sin pasillo marcado».

### Task 10: Cierre

- [ ] **Step 1:** Tablero:
  - `camp-3-2` y `camp-3-3` hechos;
  - `f3a-sustitutos` hecho;
  - una tarea para cada hallazgo que no se cierre;
  - la pregunta de la Égida naranja, como decisión del propietario.
- [ ] **Step 2:** Revisión final de toda la rama con `auditor-codigo`, arreglos
  y PR a `main`, sin firma.
