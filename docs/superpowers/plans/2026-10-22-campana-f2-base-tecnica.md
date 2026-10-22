# Campaña F2 · Base técnica — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir, sin cambiar todavía lo que ve el jugador, las piezas que
necesita el sector continuo: la ficha del sector 1, los turnos de ataque, los
perfiles de IA, el guardado de sectores con migración y un simulador con bot
que mide la dificultad.

**Architecture:** Módulos ES puros en `src/game/progression/` y
`src/game/combat/`, que se exportan por `legacy-content-entry.js` al global
`NeonCampaign` (`content-runtime.js`), como el resto del contenido. Ningún
módulo dibuja, guarda ni toca el DOM. El juego (`src/game/0x-*.js`) **no** se
conecta en esta fase; eso es la F3. El simulador es un script de Node que
carga el `game.js` real en JSDOM, como las pruebas de `tests/side-voyage-flow.test.mjs`.

**Tech Stack:** JavaScript ES modules, esbuild (`npm run build:content`),
`node:test`, JSDOM 29.

**Spec:** `docs/superpowers/specs/2026-10-22-campana-galaxia-design.md` (aprobado)
y `docs/design/BIBLIA_GALAXIA.md` (aprobada).

## Global Constraints

- Se edita `src/game/`, `tests/` y `scripts/`. `game.js`, `core-runtime.js`,
  `content-runtime.js` y `www/` se regeneran con `npm run build`, y van en el
  mismo commit que el cambio.
- Tras cada commit: `npm run build && npm test && npm run test:static`, más
  `npm run test:content` si se tocan módulos de contenido.
- `USE_ENGINE_V1 = false` y un único bucle `requestAnimationFrame`: ningún
  módulo nuevo crea temporizadores ni bucles propios.
- Módulos puros y deterministas: el azar entra como `random()` inyectado o
  como semilla, nunca con `Math.random` directo dentro del módulo.
- No tocar anuncios (`ads-config.js`, `native-admob.js`, `ad-bridge.js`), iOS
  ni Capacitor.
- No borrar los guardados antiguos (`neonCatcher.chronosVoyage.v2`,
  `neonCatcher.voyage.S*-V*.v1`): la migración los lee y no los escribe.
- Commits en español, cortos, un cambio por commit, con la atribución de la
  sesión.
- **Cifras del diseño:**
  - tramos de 45–60 s;
  - subjefe en el tramo 5 y jefe en el tramo 10;
  - parada de C9 al empezar el tramo 6;
  - revivir con anuncio con 25 % de casco, una vez por intento;
  - la baliza se paga una vez y vale hasta completar el sector;
  - al morir, tramo 1 (o tramo 6 con baliza);
  - «Continuar» vuelve al inicio del tramo en curso;
  - estrellas de 0 a 3 por sector;
  - meta del bot con la nave de serie: 30–40 % de sectores completados.

## Review Focus

1. **Guardado dañado o a medias** (JSON roto, campos fuera de rango, versión
   desconocida): se trata como «sin guardado». El juego no se rompe y no se
   pierde el progreso migrable. Prueba en la tarea 4.
2. **Enemigo que muere con un turno de ataque concedido:** el turno se libera
   y otro puede atacar ya. Prueba en la tarea 2.
3. **Pausa:** la IA y los turnos usan el reloj de juego (`now` que pasa el
   llamador), no la hora real. Con el mismo `now`, tras una pausa larga,
   nadie ataca de golpe. Prueba en la tarea 3.
4. **Migración con `localStorage` que falla al leer** (lanza excepción): se
   devuelve el guardado nuevo vacío, sin propagar el error. Prueba en la
   tarea 5.
5. **Simulador no determinista:** la misma semilla da exactamente el mismo
   resultado. Si no, el ajuste de dificultad no sirve. Prueba en la tarea 6.

---

### Task 1: Ficha del sector 1 (Gaia)

**Files:**
- Create: `src/game/progression/sectors/s1-gaia.js`
- Create: `src/game/progression/sectors/index.js`
- Test: `tests/sector-fichas.test.mjs`

**Interfaces:**
- Consumes: `createVoyageRoute(ficha)` de `progression/voyage-engine.js`
  (formato de ficha documentado en su cabecera), `VOYAGE_HAZARD_PROFILES` de
  `progression/voyage-hazards.js`.
- Produces:
  - `S1_GAIA`: ficha congelada con `id: 'S1'`, `sector: 1`,
    `saveKey: 'neonCronium.sector.S1.v1'`, `routeId: 'sector-1-gaia'`,
    `eventPrefix: 'sector-1'`, `chapter: 1`, `version: 's1-sector-v1'`,
    `stages` (10), `service: {stage: 6, …}` y `encounters` (10);
  - cada `encounter` añade `boss: null | {id: string, role: 'subjefe' | 'jefe'}`;
  - `SECTORS` (array congelado), `getSectorFicha(id: string) → ficha | null`.

- [ ] **Step 1: Write the failing test** `tests/sector-fichas.test.mjs`:
  - `the sector 1 route has ten stages of 45 to 60 seconds`: `createVoyageRoute(S1_GAIA)`
    tiene `stageCount === 10` y cada `stage.duration` cumple `>= 45 && <= 60`.
  - `the sub-boss fights in stage 5 and the boss in stage 10`:
    `encounters[4].boss` es `{id: 'ch03', role: 'subjefe'}`, `encounters[9].boss`
    es `{id: 'guardian-atlas', role: 'jefe'}` y los demás son `null`.
  - `C9 docks at the start of stage 6`: `S1_GAIA.service.stage === 6`.
  - `stages 1 to 4 bring in the new Gaia profiles before the sub-boss`: la
    unión de `encounters[0..3].patrol.roster` incluye `'tracker'`, `'sower'` y
    `'aegis'` (CH-04, CH-05, CH-06; biblia §3.1).
  - `getSectorFicha('S1') === S1_GAIA` y `getSectorFicha('S9') === null`.
- [ ] **Step 2:** `node --test tests/sector-fichas.test.mjs` → FAIL (módulo no existe).
- [ ] **Step 3:** Escribe la ficha.
  - Los nombres y objetivos de tramo salen del contenido de S1-V1 a S1-V5,
    condensado en 10 tramos (D1A).
  - Los `roster` usan los ids actuales (`raider`, `scout`, `interceptor`) más
    los nuevos (`tracker`, `sower`, `aegis`).
  - `saveKey` es nuevo: no reutilices ninguna clave antigua.
- [ ] **Step 4:** La prueba → PASS.
- [ ] **Step 5:** Commit «Ficha del sector 1 continuo: 10 tramos, subjefe en el 5 y jefe en el 10».

### Task 2: Turnos de ataque

**Files:**
- Create: `src/game/combat/attack-tokens.js`
- Test: `tests/attack-tokens.test.mjs`

**Interfaces:**
- Produces:
  - `createAttackTokens({max: number}) → tokens`;
  - `requestAttack(tokens, enemy: {id, bornAt}, now: number) → boolean`;
  - `releaseAttack(tokens, enemyId) → void`;
  - `forgetEnemy(tokens, enemyId) → void` (el enemigo murió o salió);
  - `attackHolders(tokens) → string[]`.
- Reglas:
  - nunca hay más de `max` atacando a la vez;
  - si piden más de los que caben en el mismo `now`, gana el de `bornAt` más
    antiguo (el que más ha sobrevivido; decisión del diseño 6.9);
  - pedirlo dos veces seguidas no da dos turnos.

- [ ] **Step 1: Write the failing test** `tests/attack-tokens.test.mjs`:
  - `never grants more than max tokens`: con `max: 2` y tres peticiones en el
    mismo `now`, `attackHolders().length === 2`.
  - `the longest-surviving enemy wins a contested token`: con `max: 1`, piden
    `{id:'a', bornAt: 5}` y luego `{id:'b', bornAt: 1}` en el mismo `now`; el
    que tiene el turno es `'b'`.
  - `a dead holder frees its token at once` (Review Focus 2): tras
    `forgetEnemy(tokens, 'b')`, `requestAttack` de otro devuelve `true` con el
    mismo `now`.
  - `asking twice does not take two tokens`: el mismo id dos veces deja
    `attackHolders().length === 1`.
- [ ] **Step 2:** `node --test tests/attack-tokens.test.mjs` → FAIL.
- [ ] **Step 3:** Implementa las 5 funciones en `attack-tokens.js`.
  - El orden por `bornAt` se resuelve en `requestAttack`: si está lleno y el
    que pide es más antiguo que el titular más joven que aún **no ha
    disparado**, se lo quita.
  - Guarda `firedAt` en `releaseAttack` para eso.
- [ ] **Step 4:** La prueba → PASS.
- [ ] **Step 5:** Commit «Turnos de ataque: tope por sector y prioridad para el enemigo que más sobrevive».

### Task 3: Perfiles de IA

**Files:**
- Create: `src/game/combat/enemy-ai.js`
- Test: `tests/enemy-ai.test.mjs`

**Interfaces:**
- Consumes: `requestAttack`, `releaseAttack` (tarea 2).
- Produces:
  - `ENEMY_AI_PROFILES`: objeto congelado con las claves `hunter`,
    `artillery`, `escort`, `opportunist`, `ambusher` y `miner` (Cazador,
    Artillero, Escolta, Oportunista, Emboscador y Minador; spec 6.9);
  - `decideEnemyIntent(enemy, ctx) → {targetX: number, targetY: number, attack: boolean, ability: null | 'basic' | 'unique'}`;
  - `enemy`: `{id, profile, x, y, hp, maxHp, bornAt, cooldowns: {basic, unique}}`;
  - `ctx`: `{now, player: {x, y, hull, ammo, maxAmmo, reloading: boolean}, allies: enemy[], tokens, bounds: {w: 720, h: 1280}}`.

- [ ] **Step 1: Write the failing test** `tests/enemy-ai.test.mjs`, un caso por perfil y por regla:
  - `hunter closes in on the player`: la distancia de `target` al jugador es
    menor que la del enemigo.
  - `artillery keeps its distance`: con el jugador a 150 px, `target` se
    aleja; a 600 px, se queda.
  - `escort stays beside the weakest ally`: `target` a menos de 90 px del
    aliado con menos `hp/maxHp`.
  - `opportunist only attacks when the player reloads or is below 35 hull`:
    `attack` es `false` con `reloading: false, hull: 80` y `true` con
    `reloading: true` (si hay turno libre).
  - `ambusher enters from below and aims upwards`: con `y > 1100`, `targetY`
    se acerca al jugador desde abajo.
  - `miner crosses the bottom third and drops mines`: `targetY >= 1280 * 2 / 3`
    y `ability === 'unique'` cuando `cooldowns.unique <= now`.
  - `no attack without a token`: con `tokens` lleno, `attack === false` para
    cualquier perfil.
  - `abilities respect their cooldowns`: con `cooldowns.basic > now`,
    `ability !== 'basic'`.
  - `a long pause does not trigger a burst` (Review Focus 3): la misma llamada
    con el mismo `now` devuelve lo mismo; la IA nunca lee la hora real.
- [ ] **Step 2:** `node --test tests/enemy-ai.test.mjs` → FAIL.
- [ ] **Step 3:**
  - Implementa `ENEMY_AI_PROFILES` (distancia preferida, umbral de
    oportunidad `hull < 35`, franja del Minador) y `decideEnemyIntent`.
  - Sin estado oculto: todo lo que la IA recuerda va en `enemy`.
- [ ] **Step 4:** La prueba → PASS.
- [ ] **Step 5:** Commit «IA de enemigos: seis perfiles que deciden según vida, distancia, recargas y aliados».

### Task 4: Guardado de sectores

**Files:**
- Create: `src/game/progression/sector-save.js`
- Test: `tests/sector-save.test.mjs`

**Interfaces:**
- Produces:
  - `SECTOR_SAVE_KEY = 'neonCronium.sectors.v1'`;
  - `createSectorSave() → {version: 1, unlocked: 1, sectors: {}, run: null}`;
  - `normalizeSectorSave(raw: unknown) → save | null`;
  - `startSectorRun(save, sector) → save` (con `run: {sector, stageNumber: 1, stageHull: 100, reviveUsed: false}`);
  - `enterStage(save, stageNumber, hull) → save`;
  - `buyBeacon(save, sector) → save` (marca `sectors[n].beacon = true`);
  - `useRevive(save) → {save, hull: 25} | null` (`null` si ya se usó en este
    intento);
  - `dieInSector(save) → save`: `run` vuelve a `stageNumber` 1, o 6 si hay
    baliza, con `stageHull: 100` y `reviveUsed: false`;
  - `continuePoint(save) → {sector, stageNumber, hull} | null` (el inicio del
    tramo en curso);
  - `completeSector(save, sector, stars) → save`: guarda el mejor de
    `stars` (0–3), `completed: true`, borra la baliza y sube `unlocked`.

- [ ] **Step 1: Write the failing test** `tests/sector-save.test.mjs`:
  - `revive gives 25 hull once per attempt`: el primer `useRevive` da
    `hull: 25`; el segundo, `null`; tras `dieInSector`, vuelve a dar 25.
  - `death restarts at stage 1, or 6 with the beacon`.
  - `the beacon lasts every attempt until the sector is completed`.
  - `continue resumes at the start of the current stage with its entry hull`.
  - `completing keeps the best stars and unlocks the next sector`.
  - `corrupt saves read as no save` (Review Focus 1): `normalizeSectorSave`
    devuelve `null` con `'{'`, `{version: 9}`, `stars: 7`, `stageNumber: 11`
    o `unlocked: 0`.
- [ ] **Step 2:** `node --test tests/sector-save.test.mjs` → FAIL.
- [ ] **Step 3:** Implementa las funciones puras: devuelven un objeto nuevo y
  nunca modifican el que reciben.
- [ ] **Step 4:** La prueba → PASS.
- [ ] **Step 5:** Commit «Guardado de sectores: revivir una vez por intento, baliza y continuar al inicio del tramo».

### Task 5: Migración desde los viajes antiguos

**Files:**
- Modify: `src/game/progression/sector-save.js`
- Test: `tests/sector-save-migration.test.mjs`

**Interfaces:**
- Consumes: `createSectorSave`, `completeSector` (tarea 4).
- Produces: `migrateLegacyVoyages(readJSON: (key) => unknown) → save`.
  - `readJSON` es el lector de `storage.getJSON` del juego.
  - Lee `neonCatcher.chronosVoyage.v2` y `neonCatcher.voyage.S1-V2.v1` …
    `neonCatcher.voyage.S2-V5.v1`.
- Reglas (spec, «Migración»):
  - S1-V5 completado → sector 1 completado y sector 2 desbloqueado;
  - S2-V5 completado → sector 2 completado y sector 3 desbloqueado;
  - estrellas del sector = la mejor de sus viajes;
  - un viaje a medias no deja `run`: ese sector empieza en el tramo 1.
  - No toca armas, mejoras, chatarra ni CRONIUM: siguen en sus claves.

- [ ] **Step 1: Write the failing test** `tests/sector-save-migration.test.mjs`:
  - `a player who beat Atlas has sector 1 done and sector 2 open`.
  - `sector stars are the best of its voyages`: S1-V2 con 1 estrella y S1-V5
    con 3 → `sectors[1].stars === 3`.
  - `a half-played voyage starts its sector at stage 1`: `run === null`.
  - `a new player gets an empty save`: igual que `createSectorSave()`.
  - `a reader that throws gives an empty save` (Review Focus 4): no propaga
    el error.
  - `legacy keys are only read`: el lector falso registra las claves leídas,
    y el módulo no recibe ningún escritor.
- [ ] **Step 2:** `node --test tests/sector-save-migration.test.mjs` → FAIL.
- [ ] **Step 3:** Implementa `migrateLegacyVoyages`.
- [ ] **Step 4:** La prueba → PASS.
- [ ] **Step 5:** Commit «Migración de los viajes antiguos al guardado de sectores sin perder progreso».

### Task 6: Simulador con bot

**Files:**
- Create: `scripts/sim-voyage.mjs`
- Create: `tests/sim/bot.mjs` (bot y arnés reutilizable)
- Test: `tests/sim-voyage.test.mjs`

**Interfaces:**
- Consumes: el `game.js` construido. Toma el arnés JSDOM de
  `tests/side-voyage-flow.test.mjs`: cópialo en `tests/sim/bot.mjs` sin
  cambiar esa prueba.
- Produces:
  - `runVoyage({voyage: 'S1-V1', seed: number, maxSeconds: number, invulnerable?: boolean}) → {voyage, seed, result: 'complete' | 'defeat' | 'timeout', stageReached, seconds, hull, deaths, shots, hits}`;
  - CLI `node scripts/sim-voyage.mjs --voyage S1-V1 --runs 20 --seed 1`: escribe
    JSON con la tasa de completado, el tramo medio alcanzado y la media de
    muertes.
  - Hasta la F3, juega los viajes actuales. En la F3 se añade `--sector S1`.
- **Bot:**
  - esquiva el proyectil o peligro más cercano que vaya a cruzar su
    posición en 0,6 s;
  - si no hay peligro, se coloca bajo el enemigo más cercano y dispara
    cuando tiene munición;
  - recoge el CRONIUM que esté a menos de 200 px.
  - El azar del juego sale de la semilla, con `Math.random` sustituido en el
    arnés.

- [ ] **Step 1: Write the failing test** `tests/sim-voyage.test.mjs`:
  - `the same seed gives the same run` (Review Focus 5): dos
    `runVoyage({voyage: 'S1-V1', seed: 7, maxSeconds: 40})` dan resultados
    idénticos (`deepEqual`).
  - `the bot survives the first stage with invulnerability`:
    `runVoyage({voyage: 'S1-V1', seed: 1, maxSeconds: 60, invulnerable: true}).stageReached >= 2`.
  - `the report has every field`: el objeto devuelto tiene las 10 claves de
    la interfaz.
- [ ] **Step 2:** `npm run build && node --test tests/sim-voyage.test.mjs` → FAIL.
- [ ] **Step 3:** Implementa el arnés, el bot y la CLI.
- [ ] **Step 4:** La prueba → PASS.
- [ ] **Step 5:** Ejecuta `node scripts/sim-voyage.mjs --voyage S1-V1 --runs 20 --seed 1`
  y guarda la salida en `docs/playtests/sim-linea-base-2026-10-22.json`: es la
  línea base contra la que se ajusta la F3.
- [ ] **Step 6:** Commit «Simulador con bot: partidas deterministas por semilla y línea base de S1-V1».

### Task 7: Exportar y registrar

**Files:**
- Modify: `src/game/progression/legacy-content-entry.js`
- Modify: `package.json` (script `test:content`)

**Interfaces:**
- Produces en `NeonCampaign`:
  - `SECTORS`, `getSectorFicha`;
  - `createAttackTokens`, `requestAttack`, `releaseAttack`, `forgetEnemy`,
    `attackHolders`;
  - `ENEMY_AI_PROFILES`, `decideEnemyIntent`;
  - `SECTOR_SAVE_KEY` y todas las funciones de la tarea 4;
  - `migrateLegacyVoyages`.

- [ ] **Step 1:** Añade las exportaciones y las 5 pruebas nuevas
  (`sector-fichas`, `attack-tokens`, `enemy-ai`, `sector-save`,
  `sector-save-migration`) al final de `test:content`. `sim-voyage` va
  aparte, porque es lento: script nuevo `"test:sim": "node --test tests/sim-voyage.test.mjs"`.
- [ ] **Step 2:** `npm run build && npm test && npm run test:static && npm run test:content && npm run test:architecture` → todo verde.
  `content-runtime.js` regenerado define `NeonCampaign.decideEnemyIntent`
  (`grep -c decideEnemyIntent content-runtime.js` ≥ 1).
- [ ] **Step 3:** Commit «Campaña F2: módulos de sector, IA y guardado disponibles en NeonCampaign».
