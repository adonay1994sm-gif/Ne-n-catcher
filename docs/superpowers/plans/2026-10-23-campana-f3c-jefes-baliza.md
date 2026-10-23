# Campaña F3c · Subjefe CH-03, baliza y Atlas con furia — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el sector 1 tenga sus dos momentos grandes:
- el **satélite CH-03** como subjefe del tramo 5, con 3 ataques;
- **Atlas rehecho** en el tramo 10: 3 ataques habituales, el especial Fulminante y furia al 30 % con 4 escoltas y cambio de escenario;
- entre los dos, la **baliza**: se compra con chatarra al vencer al CH-03 y te deja volver al tramo 6 si mueres.

**Architecture:**
- **Módulos puros:**
  - `combat/ch03-satellite.js` (nuevo);
  - `combat/guardian-atlas.js` (se reescribe su repertorio, conservando la estructura de estados).
- **Economía:** el libro de chatarra (`progression/scrap-economy.js`) gana una compra consumible.
- **Integración:** el juego (`03`, `05`, `07`) integra los combates como hoy integra a Atlas. Mientras el CH-03 vive, la ruta no avanza.

**Tech Stack:** JavaScript (módulos concatenados en `game.js` + módulos ES en `content-runtime.js`), `node:test`, JSDOM, Python con Pillow para el arte.

**Spec:** `docs/superpowers/specs/2026-10-22-campana-galaxia-design.md` §6.2 (baliza) y §6.11 (subjefes y jefes), y `docs/design/BIBLIA_GALAXIA.md` §3.1 (CH-03 y Atlas).

## Decisiones

**Del propietario (23/10/2026):** la baliza se paga con **chatarra**.

**Técnicas (reversibles; el bot ajusta las cifras en la F3e):**

| Qué | Decisión |
|---|---|
| Precio de la baliza | 40 chatarra. Se ofrece en la parada de C9, solo si el CH-03 ha caído en este intento. Es una compra consumible: no va a la lista de mejoras y se puede volver a comprar tras completar el sector. |
| CH-03 · vida y presencia | 40 de vida. Entra por arriba y se queda en `y = 0,24·H`. Se le puede dañar siempre, menos al entrar y al caer. Sin furia. Aparece cuando el tramo 5 lleva 6 s; mientras vive, la ruta y las patrullas se paran. |
| CH-03 · Barrido láser | Aviso de 0,8 s. Un rayo que sale de él hacia abajo gira de un lado a otro (±1,0 rad, 0,55 rad/s). Grosor de 28 px y 14 de daño. El hueco está detrás del rayo. |
| CH-03 · Anillo de cañones | Aviso de 0,8 s. Dos anillos de 8 disparos (260 px/s), el segundo girado π/8 y lanzado 0,5 s después. |
| CH-03 · Rejilla de negación (la difícil) | 6 columnas y 4 pasos. En cada paso: aviso de 0,7 s y 0,5 s de láser encendido, 16 de daño. La columna segura se mueve una posición en cada paso. |
| CH-03 · Orden | Barrido, anillo, rejilla y después al azar con semilla, sin repetir el anterior. Hay 1,2 s de calma entre ataques. |
| Atlas · 3 ataques habituales | **Cañones gemelos** (`basic`, la ráfaga `duelBurst` actual), **abanico abierto** (`medium`: 7 disparos que cubren ±0,7 rad) y **despliegue de drones** (`superpower`: evento `drones` con 2 CH-01). |
| Atlas · Fulminante (especial) | Un rayo ancho (45 % de la pantalla) cae sobre la mitad donde está la nave tras 1,05 s de carga visible, y dura 1,2 s con 26 de daño. Sustituye al muro de orbes. |
| Atlas · Furia | Con la vida al 30 % o menos (la fase 2 deja de empezar al 50 %):<br>- evento `fury` (el juego pasa a la hoja de furia, oscurece el fondo y rompe el anillo superior);<br>- entran 4 escoltas;<br>- siempre encadena 2 ataques;<br>- el Fulminante sale cada 2–3 ataques. |
| Escoltas de Atlas | Hoja `camp-art-s1-atlas-escoltas`, 3 de vida. Rodean a Atlas en órbita (radio 1,6·r) y disparan hacia abajo con turno de ataque (los del tramo 10). Dan la chatarra de un `scout`. |

## Global Constraints

- Se edita `src/game/`, `tests/`, `scripts/`, `assets/`, `art-source/`, `ASSET_MANIFEST.json` y `sw.js`. Los generados van en el mismo commit.
- Tras cada commit: `npm run build && npm test && npm run test:static && npm run test:content`.
- **Módulos puros:**
  - reloj de juego y semilla;
  - nunca `Math.random` ni temporizadores;
  - un solo `requestAnimationFrame`.
- **Atlas fuera del sector:** el Atlas antiguo de S1-V5 (panel de desarrollo) usa el mismo módulo y queda con el repertorio nuevo. Es aceptable.
- **No tocar** anuncios, iOS ni Capacitor.
- **Commits:** en español, sin firma de IA.

## Review Focus

1. **Morir durante el CH-03:**
   - revivir sigue el combate con la vida que le quedaba;
   - reintentar empieza el sector desde el tramo 1 (sin baliza).

   Prueba en la tarea 3.
2. **Comprar la baliza sin chatarra suficiente, o dos veces:** no se cobra dos veces y el mensaje lo dice. Prueba en la tarea 4.
3. **Pausa durante el rayo o la rejilla:** el rayo no avanza y no hace daño en pausa (reloj de juego). Prueba en la tarea 1.
4. **Furia que llega con escoltas vivas de antes o tras revivir:** nunca hay más de 4 escoltas. Prueba en la tarea 6.
5. **Rayo Fulminante con la nave justo en el centro:** siempre existe la otra mitad libre, y el aviso dura al menos 1 s. Prueba en la tarea 5.

---

### Task 1: Módulo del satélite CH-03

**Files:**
- Create: `src/game/combat/ch03-satellite.js`, exportado en `legacy-content-entry.js`.
- Test: `tests/ch03-satellite.test.mjs`, en `test:content`.

**Interfaces:**
- Produces:
  - `CH03_RULES`;
  - `createCh03Satellite({width, height, seed}) → boss`, con:
    - `x`, `y`, `hp`, `maxHp`, `state` (`entry`, `idle`, `warning`, `attack`, `defeated`);
    - `attack` (`sweep`, `ring` o `grid`);
    - `beam: {angle, active} | null`;
    - `grid: {columns, safe, lit, active} | null`;
    - `resolved`.
  - `advanceCh03Satellite(boss, dt, emit)`, con estos eventos:
    - `{type:'warning', attack}`;
    - `{type:'projectile', x, y, vx, vy, damage}`;
    - `{type:'defeated'}`.
  - `ch03HitsShip(boss, ship: {x, y, r}) → damage | 0`: rayo o rejilla activos.
  - `hitCh03Satellite(boss, damage) → {accepted, hp}`.

- [ ] **Step 1: Write the failing tests:**
  - `it enters, then attacks in order: sweep, ring, grid`;
  - `every attack is announced at least 0.7 s before it can hurt`: entre `warning` y el primer daño posible (rayo activo, disparo o rejilla encendida) hay 0,7 s o más;
  - `the sweep beam turns and there is always room behind it`: el ángulo cambia en el tiempo; en cada instante, un punto al otro lado del rayo a la altura de la nave queda fuera de sus 28 px;
  - `the ring fires two rings of eight`: 16 disparos en dos tandas separadas 0,5 s, con 8 ángulos distintos cada una;
  - `the grid always leaves one safe column that moves`: en cada paso hay exactamente una columna segura, distinta de la del paso anterior y contigua a ella;
  - `zero delta changes nothing`: con `dt = 0` (pausa) no cambia el estado ni se emite nada;
  - `hits only count while it is not entering or defeated`, y al llegar a 0 → `defeated` una sola vez.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementa con las cifras de la tabla.
- [ ] **Step 4:** → PASS.
- [ ] **Step 5:** Commit «Satélite CH-03: barrido láser, anillo de cañones y rejilla de negación».

### Task 2: Arte de CH-03, Atlas en furia, escoltas y baliza

**Files:**
- Create:
  - `scripts/build-s1-boss-assets.py`;
  - `art-source/enemies/s1-jefes/`: los originales del baúl y un `PROVENANCE.json`.
- Modify: `ASSET_MANIFEST.json`, `sw.js` y `01-runtime-assets.js` (`SPRITES.ch03`, `atlasFury`, `atlasEscorts` y `sectorBeacon`).

**Interfaces:**
- Produces, en `assets/`:
  - `ch03_satellite_atlas_v1.webp`: 4×2 celdas de 384, partiendo de 800;
  - `atlas_fury_atlas_v1.webp`: 4×1 de 384;
  - `atlas_escorts_atlas_v1.webp`: 4×2 de 192, partiendo de 256;
  - `sector_beacon_atlas_v1.webp`: 4×1 de 192, partiendo de 256.

- [ ] **Step 1:** Entradas del manifiesto con `size` y `sha256` de mentira → `npm run test:static` FAIL.
- [ ] **Step 2:** Ejecuta el script; rellena `size`, `sha256` y `dimensions` por diferencia, como en `build-gaia-enemy-assets.py`; añade la precarga y los sprites.
- [ ] **Step 3:** `npm run build && npm run test:static && npm test` → PASS. Mira las hojas sobre fondo oscuro.
- [ ] **Step 4:** Commit «Arte de CH-03, Atlas en furia, sus escoltas y la baliza».

### Task 3: CH-03 en el tramo 5

**Files:**
- Modify:
  - `03-ui-game-flow.js`:
    - `ch03Boss`;
    - la aparición;
    - la ruta parada (`advanceClassicFlight`);
    - las patrullas paradas;
    - el daño a la nave;
    - la chatarra al caer, con `bossSalvage` y su propio `rewardForEnemy('ch03')`;
  - `scrap-economy.js`: `SCRAP_REWARDS.ch03 = 120`;
  - `05` (avance);
  - `07` (dibujo);
  - la barra de vida en `#atlasEncounter`, con el rótulo «SATÉLITE CH-03».
- Test: `tests/sector-flow.test.mjs`.

- [ ] **Step 1: Write the failing tests:**
  - `CH-03 appears 6 s into stage 5 and holds the route`: tras 8 s en el tramo 5 existe `ch03Boss`; 20 s después sigue en el tramo 5.
  - `patrols stop while CH-03 fights`: no aparecen patrullas nuevas.
  - `beating CH-03 resumes the route and drops scrap`: `hitCh03Satellite` hasta 0 → la ruta avanza al tramo 6 y aparece un `salvagePickup`.
  - `its beam and grid hurt the ship`.
  - `dying during CH-03 and reviving keeps its damage; retrying restarts the sector at stage 1`.
  - `CH-03 only fights in the sector`: en S1-V2 no aparece.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementa:
  - sus disparos son `classicScoutProjectile` de la hoja de proyectiles;
  - el rayo y la rejilla se dibujan con el arte (celdas 2, 4 y 5) más una línea brillante;
  - al caer, celdas 6 y 7 y explosión.
- [ ] **Step 4:** → PASS; suites → PASS; captura en Chromium del tramo 5 con el combate.
- [ ] **Step 5:** Commit «CH-03 defiende el tramo 5 del sector 1».

### Task 4: La baliza

**Files:**
- Modify:
  - `scrap-economy.js`: `SCRAP_CONSUMABLES = {'sector-beacon': {price: 40}}` y `buyConsumable({transactionId, sku})`. Cobra y guarda el recibo; no añade a `upgrades`.
  - `03-ui-game-flow.js`: en la parada de C9 del tramo 6, si el CH-03 cayó en este intento y el sector no tiene baliza, panel «Baliza de reaparición · 40 chatarra» con COMPRAR y SEGUIR. El juego queda en pausa mientras está abierto.
  - `index.html` y `styles.css`: el panel, con el estilo de botones de `DESIGN.md`.
  - El menú y el panel de derrota indican «con baliza».
- Test: `tests/scrap-economy.test.mjs` y `tests/sector-flow.test.mjs`.

- [ ] **Step 1: Write the failing tests:**
  - en la economía:
    - `a consumable charges once per transaction and is not an upgrade`;
    - `a consumable without funds fails with the missing amount`;
  - en el juego:
    - `after beating CH-03, C9 offers the beacon`;
    - `buying it saves the beacon and charges 40 scrap`;
    - `without enough scrap the button explains it and nothing is charged`;
    - `with the beacon, dying after stage 6 restarts at stage 6; completing the sector clears it` (ya lo hace `sector-save`; aquí se comprueba de punta a punta);
    - `the panel is not offered twice or when the beacon is already owned`.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementa.
- [ ] **Step 4:** → PASS; suites → PASS; captura del panel.
- [ ] **Step 5:** Commit «Baliza de reaparición en C9: 40 chatarra, vuelves al tramo 6».

### Task 5: Atlas rehecho (módulo)

**Files:**
- Modify: `src/game/combat/guardian-atlas.js` (versión `guardian-atlas-v9`).
- Test: `tests/guardian-atlas.test.mjs`. Actualiza las pruebas que fijan el cambio al 50 %, los patrones antiguos y el muro de orbes, citando la spec §6.11.

**Interfaces:**
- Produces, como eventos nuevos:
  - `{type:'drones', count: 2, x, y}`;
  - `{type:'fury', escorts: 4}`;
  - `{type:'beam', side: -1|1, x0, x1, seconds, damage}`, con aviso en `{type:'fulminant', side}`.
- Cambio de reglas: `phase` pasa a 2 cuando `hp <= 0.3·maxHp`.

- [ ] **Step 1: Write the failing tests:**
  - `Atlas teaches twin cannons, open fan and drones`: los 3 primeros ataques son `basic` (2 disparos gemelos), `medium` (7 disparos que cubren ≥ 1,3 rad) y `superpower` (un evento `drones` con `count: 2`).
  - `the Fulminante beam covers the ship's half and leaves the other free`: `x0..x1` incluye la `x` observada de la nave, cubre ≤ 50 % del ancho y hay ≥ 1 s entre el aviso y el rayo.
  - `fury starts at 30 % health, once, with four escorts`.
  - `in fury every attack chains two and the Fulminante comes every 2–3 attacks`.
  - `the armour still only opens after attacks`: la regla actual del núcleo se mantiene.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementa sobre la máquina de estados actual; el resto del archivo no cambia.
- [ ] **Step 4:** → PASS; `npm run test:content` → PASS.
- [ ] **Step 5:** Commit «Atlas: cañones gemelos, abanico abierto, drones, Fulminante en rayo y furia al 30 %».

### Task 6: Furia de Atlas en el juego

**Files:**
- Modify:
  - `03-ui-game-flow.js`:
    - eventos `drones`, `fury` y `beam`;
    - escoltas como `gaiaEnemy` de clase nueva `atlasEscort` en `gaia-enemies.js` (perfil `escort`, en órbita, con disparo propio);
    - el daño del rayo;
  - `07`: hoja de furia en la fase 2, rayo con la celda 2 de la hoja de furia y fondo oscurecido;
  - `gaia-enemies.js`: clase `atlasEscort`.
- Test: `tests/gaia-enemies.test.mjs` y `tests/sector-flow.test.mjs`.

- [ ] **Step 1: Write the failing tests:**
  - `atlas escorts circle Atlas and shoot down with a token`;
  - `fury spawns four escorts and never more`: dos eventos `fury` seguidos, o revivir → como mucho 4;
  - `drones spawn two CH-01`;
  - `the beam hurts only inside its half`;
  - `fury darkens the scene`: `atlasFuryScene` true y se dibuja la hoja de furia.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementa.
- [ ] **Step 4:** → PASS; suites → PASS; capturas del tramo 10 antes y después de la furia.
- [ ] **Step 5:** Commit «Atlas en furia: escoltas, drones, rayo Fulminante y escenario roto».

### Task 7: Cierre

- [ ] Tablero:
  - `camp-3-4` y `camp-3-5` hechos;
  - `camp-3-6` hecho (baliza);
  - los encargos de arte integrados, como hechos;
  - y regenerar la lista para GPT.
- [ ] Revisión final con `auditor-codigo`, arreglos, PR a `main` sin firma y nuevo enlace de prueba (artifact).
