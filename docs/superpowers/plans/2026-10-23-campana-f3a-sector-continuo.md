# Campaña F3a · Sector 1 continuo jugable — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que JUGAR lleve al sector 1 como un único viaje de 10 tramos. El
sector empieza con el inicio de Chronos y el tutorial, hace la parada de C9 en
el tramo 6 y acaba con Atlas en el 10. Además aplica las reglas nuevas de
morir: revivir al 25 % una vez por intento y, si vuelves a caer, empezar desde
el tramo 1.

**Architecture:** El sector se juega por el camino de los «viajes
secundarios» (`classicSideVoyage`), que ya sabe jugar cualquier ficha con
`createVoyageRoute`.
- La ficha `S1_GAIA` gana tres marcas:
  - `intro: true` (inicio de Chronos, historia y tutorial);
  - los eventos del inicio;
  - `boss: 'atlas'` (Atlas al final).
- Su progreso se guarda **solo** con `progression/sector-save.js`
  (`neonCronium.sectors.v1`), no con `saveSideVoyage`.
- S1-V1 y los viajes antiguos siguen en el código y en el panel de desarrollo,
  pero salen del menú.

**Tech Stack:** JavaScript (módulos concatenados en `game.js` + módulos ES en
`content-runtime.js` con esbuild), `node:test`, JSDOM.

**Spec:** `docs/superpowers/specs/2026-10-22-campana-galaxia-design.md` (§6.1,
§6.2, §6.4 «reparar», §7 F3 pasos 3.1, 3.6 y 3.7) y `docs/ROADMAP.md`
bloque 1.

## Alcance de este plan

La F3 es grande. Se divide en planes que se entregan por orden, y cada uno se
puede jugar:

| Plan | Pasos de la spec | Qué añade |
|---|---|---|
| **F3a (este)** | 3.1, 3.6 (sin baliza), 3.7 | El sector se juega de principio a fin con los enemigos actuales y el Atlas actual |
| F3b | 3.2, 3.3 | Rastreador, Sembrador, Égida y Alfa con su IA y turnos de ataque; hordas, meteoritos dirigidos, retaguardia y abanicos |
| F3c | 3.4, 3.5, 3.6 (baliza) | Subjefe CH-03 en el tramo 5, compra de la baliza al vencerlo y Atlas con 3 ataques, especial y furia |
| F3d | 3.8 | Panel grande en calma y radio corta en combate |
| F3e | 3.9 | Ajuste con el bot, copia de prueba, `/competencia` y prueba del propietario |

## Decisiones del propietario (23/10/2026)

- JUGAR abre el sector 1 y nada más. Los 10 viajes viejos (S1-V1 a S2-V5)
  solo se ven en el panel de desarrollo. El mapa de la galaxia llega en la F5.
- El tramo 1 empieza con la animación de Chronos y el tutorial que ya
  existen.

## Decisiones técnicas de este plan (reversibles)

- El botón MAPA (`#levels`) se oculta mientras no exista el mapa de la
  galaxia.
- «Continuar» vuelve al inicio del tramo guardado:
  - con el casco que tenías al entrar en él;
  - con el CRONIUM mínimo de ese tramo (`route.createCheckpoint(n)`).

  La puntuación y el combo empiezan de cero.
- Al morir, el guardado pasa de inmediato a «tramo 1». Así, cerrar la app en
  la pantalla de derrota no salta la regla. Si el jugador revive con el
  anuncio, se vuelve a escribir el punto donde estaba, con `reviveUsed: true`.
- Vencer a Atlas en el sector concede el Gemelo, como hoy en S1-V5.
- Tras completar el sector, el botón de la pantalla final dice «VOLVER AL
  MENÚ»: el sector 2 aún no existe.

## Global Constraints

- Se edita `src/game/`, `tests/`, `index.html` y `styles.css`. `game.js`,
  `core-runtime.js`, `content-runtime.js` y `www/` se regeneran con
  `npm run build` y van en el mismo commit.
- Tras cada commit: `npm run build && npm test && npm run test:static`, más
  `npm run test:content` si se toca `src/game/progression` o `combat`.
- Un único bucle `requestAnimationFrame`; ningún temporizador nuevo dentro de
  los módulos.
- No tocar anuncios (`ads-config.js`, `native-admob.js`, `ad-bridge.js`), iOS
  ni Capacitor. El anuncio de revivir sigue entrando por `resumeReward()`;
  solo cambia su efecto.
- No hay jugadores actuales: no se migra nada. Las claves antiguas no se
  borran.
- Commits en español, cortos, un cambio por commit, **sin firma de IA** (ni
  `Co-Authored-By` ni enlaces de sesión).
- **Cifras de la spec:**
  - revivir con **25 %** de casco, **una vez por intento**;
  - al volver a caer, **tramo 1** (tramo 6 con baliza);
  - C9 atraca al empezar el **tramo 6** y deja el casco al **100 %**;
  - «Continuar» va al **inicio del tramo** en curso;
  - estrellas de **0 a 3** por sector.
- Clave de guardado del sector: `neonCronium.sectors.v1` (`SECTOR_SAVE_KEY`).
  La `saveKey` de la ficha (`neonCronium.sector.S1.v1`) **no** se escribe.

## Review Focus

1. **Cerrar la app en la pantalla de derrota:** «Continuar» no puede devolver
   al tramo donde moriste sin haber visto el anuncio. Prueba en la tarea 4.
2. **Revivir dos veces en el mismo intento:**
   - tras revivir y volver a morir, el botón del anuncio no aparece;
   - tras reiniciar el sector, vuelve a aparecer.

   Prueba en la tarea 4.
3. **Guardado del sector dañado** (JSON roto o con valores fuera de rango):
   JUGAR empieza un sector nuevo en el tramo 1 y no rompe el menú. Prueba en
   la tarea 2.
4. **Continuar desde el tramo 8 o más:** la historia del capítulo 1 dura
   360 s y el tramo 8 empieza después. El sector no puede lanzar una
   excepción al crear la historia. Prueba en la tarea 3.
5. **Atlas resuelto pero sin poder guardar el Gemelo:** el sector no se marca
   como completado, como hoy en S1-V5. Prueba en la tarea 5.

---

### Task 1: La ficha del sector 1 lleva el inicio de Chronos y a Atlas

**Files:**
- Modify: `src/game/progression/sectors/s1-gaia.js`
- Test: `tests/sector-fichas.test.mjs`

**Interfaces:**
- Produces: `S1_GAIA` gana estos campos:
  - `intro: true`;
  - `boss: 'atlas'`;
  - `cinematicDuration: 90` y `recoveryAt: 9` (los de S1-V1);
  - en `events`, los tipos `attack` (a 2,25 s), `rupture` (9 s),
    `twin-module-marker` (90 s) y `departure` (108 s), con los mismos campos
    que en `s1-v1-chronos-gaia.js` e ids con el prefijo `sector-1-`.

  El evento `gaia-beacon` se queda.

- [ ] **Step 1: Write the failing test** en `tests/sector-fichas.test.mjs`:
  - `the sector opens with the Chronos intro`:
    - `S1_GAIA.intro === true`;
    - `S1_GAIA.recoveryAt === 9`;
    - los `type` y `at` de `S1_GAIA.events` (sin `gaia-beacon`) son iguales a
      los de `S1_V1_CHRONOS_GAIA.events` (sin `gaia-beacon`).
  - `the sector ends with Atlas`: `S1_GAIA.boss === 'atlas'`.
  - `every sector event id is unique and uses the sector prefix`: todos los
    `id` empiezan por `sector-1-` y no se repiten.
- [ ] **Step 2:** `node --test tests/sector-fichas.test.mjs` → FAIL.
- [ ] **Step 3:** Añade los campos a `S1_GAIA`. Ninguna otra ficha cambia.
- [ ] **Step 4:** La prueba → PASS; `npm run test:content` → PASS.
- [ ] **Step 5:** Commit «Sector 1: inicio de Chronos y Atlas en la ficha».

### Task 2: JUGAR abre el sector 1 y su progreso se guarda por tramos

**Files:**
- Modify: `src/game/03-ui-game-flow.js`:
  - `startLevel`, `saveClassicVoyageCheckpoint` y `saveSideVoyage`;
  - `updateMenu`;
  - función nueva `startSector`.
- Modify: `src/game/08-loop-input-bootstrap.js`:
  - `$("play").onclick`;
  - `$("levels")`;
  - el panel de desarrollo.
- Test: `tests/sector-flow.test.mjs` (nuevo; copia el `harness()` de
  `tests/side-voyage-flow.test.mjs` y añade `startSector` y `sector:()=>…` al
  gancho `window.T`).

**Interfaces:**
- Consumes de `NeonCampaign`:
  - `getSectorFicha`;
  - `SECTOR_SAVE_KEY`;
  - `createSectorSave`, `normalizeSectorSave`, `startSectorRun`, `enterStage`;
  - `continuePoint`.
- Produces (en `03-ui-game-flow.js`):
  - `startSector(id: string) → boolean`: lanza el sector y devuelve false si
    la ficha no existe;
  - `isSectorRun() → boolean`: cierto si `classicSideVoyage?.ficha` es una
    ficha de `getSectorFicha`;
  - `loadSectorSave() → save` y `saveSector(save) → boolean`: un guardado
    ilegible o inválido se trata como `createSectorSave()`.

- [ ] **Step 1: Write the failing tests** en `tests/sector-flow.test.mjs`:
  - `play starts sector 1 at stage 1 on a fresh device`: clic en `#play` →
    `T.st().side === 'S1'`, `T.st().route === 'sector-1-gaia'` y tramo 1.
  - `entering a stage saves the sector run`: `startSector('S1')`,
    `T.toStage(3)` → `JSON.parse(localStorage['neonCronium.sectors.v1']).run`
    es `{sector:1, stageNumber:3, stageHull:<casco actual>, reviveUsed:false}`.
    No existe `localStorage['neonCronium.sector.S1.v1']`.
  - `continue returns to the start of the saved stage with its hull`: guarda
    a mano un `run` en el tramo 4 con `stageHull: 60`; clic en `#play` → tramo
    4, `T.hull() === 60` y `T.adv(1)` no cambia de tramo.
  - `a damaged sector save starts a new sector`: guarda `'{rota'` en la clave
    y luego `{version:1, unlocked:1, sectors:{}, run:{sector:1, stageNumber:99}}`.
    En los dos casos, clic en `#play` → tramo 1, sin excepción.
  - `C9 repairs the hull when docking at stage 6`: `startSector('S1')`,
    `T.hit(50)`, `T.toStage(6)`, luego avanza hasta que se resuelva el
    servicio → `T.hull() === 100`.
  - `the menu shows the sector and hides the old voyage map`:
    - `#levels` tiene la clase `hidden`;
    - `#playSector` contiene `SECTOR 1`;
    - con un `run` en el tramo 4, `#playSector` contiene `TRAMO 4/10`.
- [ ] **Step 2:** `npm run build && node --test tests/sector-flow.test.mjs` → FAIL.
- [ ] **Step 3:** Implementa `startSector`, `isSectorRun`, `loadSectorSave` y
  `saveSector`.
  - En `startLevel`, una ficha de sector toma el punto de entrada de
    `continuePoint(save)`. Si hay `run`:
    - `voyageCheckpoint = route.createCheckpoint(run.stageNumber, {goal})`;
    - el casco sale de `run.stageHull`.

    Si no hay `run`, `startSectorRun(save, 1)` y se guarda.
  - En `saveClassicVoyageCheckpoint`, una ficha de sector escribe
    `enterStage(save, checkpoint.stageNumber, hull)` en lugar de llamar a
    `saveSideVoyage`.
  - JUGAR llama a `startSector('S1')`.
  - `#levels` se oculta.
  - `updateMenu` rotula:
    - «JUGAR» + «SECTOR 1 · CHRONOS → GAIA»;
    - «CONTINUAR» + «SECTOR 1 · TRAMO n/10»;
    - «REPETIR» + «SECTOR 1 COMPLETADO».

    Los contadores pasan a sectores completados de 10 y estrellas de 30.
  - En el panel de desarrollo, una fila «S1 · Sector» con los botones 1–10
    (`classicVoyageRequestedStage`), como las de los viajes.
- [ ] **Step 4:** Las pruebas nuevas → PASS. `npm test`,
  `node --test tests/side-voyage-flow.test.mjs` y `npm run test:static`
  → PASS. Si una prueba antigua comprueba que JUGAR abre S1-V1 o el mapa,
  se actualiza a la decisión del propietario y se cita esa decisión en el
  commit.
- [ ] **Step 5:** Commit «JUGAR abre el sector 1 continuo y guarda el tramo en curso».

### Task 3: El sector empieza con el inicio de Chronos y el tutorial

**Files:**
- Modify: `src/game/03-ui-game-flow.js`:
  - `startLevel`, donde se crean `classicChapterStory` y `classicTutorial`;
  - la línea con `view.elapsed<(classicSideVoyage?0:9)`.
- Modify: `src/game/06-world-rendering.js`, en la comprobación
  `view.routeId !== "chronos-to-gaia"` de la pose del inicio.
- Test: `tests/sector-flow.test.mjs`

**Interfaces:**
- Consumes: `S1_GAIA.intro` y `S1_GAIA.recoveryAt` (tarea 1),
  `NeonCampaign.CHRONOS_CHAPTER_ROUTE_SECONDS`.
- Produces: helper `fichaHasIntro() → boolean`. Es cierto en S1-V1 (el camino
  principal) y en una ficha con `intro: true`.

- [ ] **Step 1: Write the failing tests:**
  - `a fresh sector plays the Chronos opening and the tutorial`:
    `startSector('S1')`, `T.adv(3)` → la historia y el tutorial existen
    (exponer `story:()=>Boolean(classicChapterStory)` y
    `tutorial:()=>Boolean(classicTutorial)` en el gancho), y `T.draw()` pinta
    la pose del inicio (la misma comprobación que use la prueba actual del
    inicio de S1-V1; búscala en `tests/run-tests.mjs`).
  - `no patrol spawns before recoveryAt`: en los primeros 8 s no aparece
    ningún enemigo de patrulla.
  - `continuing at stage 8 does not throw and has no chapter story`: `run` en
    el tramo 8 → clic en `#play` sin excepción y `story()` es false.
  - `old side voyages still skip the intro`: `startSideVoyage('S1-V2')` →
    `story()` y `tutorial()` son false.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Cambia `!classicSideVoyage` por `fichaHasIntro()` donde se
  crean la historia y el tutorial. La historia solo se crea si
  `routeElapsed < CHRONOS_CHAPTER_ROUTE_SECONDS`.
  - La espera de 9 s pasa a usar `classicSideVoyage?.ficha.recoveryAt ?? 9`.
  - La pose del inicio se acepta en la ruta `chronos-to-gaia` o en la de una
    ficha con `intro`.
  - El resto (diálogos fuera de sitio por los tiempos nuevos) se arregla en
    la F3d. No se toca aquí.
- [ ] **Step 4:** → PASS. `npm test` y `node scripts/capture-intro.cjs --times 1,5,9`
  tras `npm run build`; compara las capturas del sector con las de S1-V1 en
  los mismos segundos (en el panel de desarrollo, «S1 · Sector» tramo 1).
- [ ] **Step 5:** Commit «El sector 1 empieza con el inicio de Chronos y el tutorial».

### Task 4: Morir en el sector: revivir al 25 % una vez y volver al tramo 1

**Files:**
- Modify: `src/game/03-ui-game-flow.js`:
  - `finishGame`;
  - `resumeReward`;
  - el texto de `#retry`.
- Test: `tests/sector-flow.test.mjs`

**Interfaces:**
- Consumes: `useRevive(save) → {save, hull} | null` y `dieInSector(save)` de
  `NeonCampaign`.
- Produces: `sectorRevive: {save, hull} | null` en el estado del juego.
  `finishGame` lo prepara y `resumeReward` lo consume.

- [ ] **Step 1: Write the failing tests:**
  - `dying in the sector saves a restart at stage 1`: tramo 3,
    `T.finishGame('hull')` → `run.stageNumber === 1`, `run.reviveUsed === false`
    y `#retry` dice «REINTENTAR SECTOR · TRAMO 1».
  - `the rewarded revive returns at 25 % to the same stage, once`:
    1. Tramo 3, muere y `T.resumeReward()` → `T.hull() === 25`, sigues en el
       tramo 3, y el guardado tiene `run.stageNumber === 3` y
       `reviveUsed === true`.
    2. Muere otra vez → `#reward` oculto y el guardado en el tramo 1.
  - `restarting the sector makes the revive available again`: tras lo
    anterior, `T.startLevel(0)` (reintentar) y morir → `#reward` visible.
  - `old side voyages keep their 35 % revive`: `startSideVoyage('S1-V2')`,
    muere y revive → `T.hull() === 35`.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** En una partida de sector:
  - `finishGame` prepara `sectorRevive = useRevive(saveAntes)`, guarda
    `dieInSector(saveAntes)` y oculta `#reward` si `sectorRevive` es null;
  - `resumeReward` aplica `hull = sectorRevive.hull` (no
    `Math.max(hull, 35)`), guarda `sectorRevive.save` y lo deja en null;
  - el reintento entra por `startLevel`, que ya lee `continuePoint`.

  Los viajes antiguos no cambian.
- [ ] **Step 4:** → PASS. `npm test` → PASS.
- [ ] **Step 5:** Commit «Sector 1: revivir al 25 % una vez por intento; al caer, tramo 1».

### Task 5: Completar el sector con Atlas

**Files:**
- Modify: `src/game/03-ui-game-flow.js`:
  - `isAtlasMission`;
  - `completeSideVoyage`;
  - el texto de `ui.nextLevel`.
- Modify: `src/game/08-loop-input-bootstrap.js`, en `ui.nextLevel.onclick`.
- Test: `tests/sector-flow.test.mjs`

**Interfaces:**
- Consumes: `completeSector(save, sector, stars)`, `runStars()` y
  `awardAtlasWeapon()`.

- [ ] **Step 1: Write the failing tests:**
  - `Atlas guards the end of stage 10`: `startSector('S1')`, `T.toStage(10)` y
    llegar a `canFinish` → existe el combate de Atlas (`atlasBoss`).
  - `beating Atlas completes the sector with its stars and the Gemelo`:
    `T.finish()` en el sector:
    - el guardado tiene `sectors[1].completed === true` y `run === null`;
    - `stars` está entre 1 y 3;
    - el equipo guardado incluye `twin`;
    - la pantalla final dice «SECTOR 1 COMPLETADO»;
    - el botón dice «VOLVER AL MENÚ».
  - `the sector is not marked complete if the Gemelo cannot be saved`: deja la
    clave del equipo con un valor inválido sin copia de seguridad →
    `sectors[1]` no existe o `completed === false`.
  - `replaying a completed sector starts at stage 1 and keeps its stars`: tras
    completarlo, clic en `#play` → tramo 1 y las estrellas guardadas no bajan.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:**
  - `isAtlasMission` también es cierto si `classicSideVoyage?.ficha.boss === 'atlas'`
    (la ficha ya lo trae; revisa que no dependa de otra cosa).
  - `completeSideVoyage` usa `completeSector` en una partida de sector, en vez
    de `saveSideVoyage`, con la misma regla del Gemelo.
  - «VOLVER AL MENÚ» llama a `goHome()`.
- [ ] **Step 4:** → PASS. Ejecuta las suites de la sección «Comandos» de
  `CLAUDE.md` y `npm run test:sim`.
- [ ] **Step 5:** Commit «Sector 1: Atlas cierra el sector, estrellas y Gemelo».

### Task 6: Comprobación jugando y tablero

**Files:** ninguno de código.

- [ ] **Step 1:** `npm run build` y `node scripts/capture-levels.cjs`, o el
  panel `?dev=1` con «S1 · Sector» en los tramos 1, 5, 6 y 10. Guarda las
  capturas en el directorio temporal y míralas: rótulo del tramo, C9 en el 6
  y Atlas en el 10.
- [ ] **Step 2:** Marca en el tablero `camp-3-1` y `camp-3-7` como hechos y
  `camp-3-6` como «en curso, falta la baliza (F3c)». Crea una tarea por cada
  hallazgo que no se haya cerrado.
- [ ] **Step 3:** PR a `main`, sin firma. Tras fusionar, revisión de
  `auditor-codigo` y sus hallazgos al tablero.
