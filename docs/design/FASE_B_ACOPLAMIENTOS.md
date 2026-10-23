# Fase B · Qué está atado al viaje 1 (mapa para lanzar otras fichas)

Inventario del 21/10/2026 (lectura de `src/game/0*.js`). Líneas aproximadas.

## Pasos propuestos para lanzar S1-V2

1. **Viaje activo:** variable `classicVoyageFicha` (por defecto S1-V1) y
   `NeonCampaign.createVoyage(ficha, …)`; `startLevel` la usa en vez de
   `createChronosVoyage` (03 ~1453–1464).
2. **Guardado por ficha:** `loadClassicVoyage`/`saveClassicVoyageCheckpoint`
   con `ficha.saveKey` y número de tramos de la ficha (03 ~334–385).
3. **Textos:** origen → destino, «n/N» y «Tramo x.y» desde la ficha
   (03 ~198, 267, 399–413, 571–574, 1138).
4. **Fin:** Atlas solo en la ficha que lo pida (`ficha.boss === 'atlas'`);
   sin jefe, `canFinish` completa el viaje (03 ~854, 892, 1643–1723; 05 ~426).
5. **Solo S1-V1:** historia del capítulo, tutorial, inicio de Chronos,
   onda del nivel 1 y lluvia de cometas fija `["1.5","1.9"]` (03 ~156, 650–690,
   1462–1464; 06 ~224–638, 792, 852).
6. **Fondo:** `drawChronosFlightBackground` dibuja todo viaje con piezas de
   Chronos; con otra ficha basta respetar `visible:false` de estación y ataque.

## Inventario por tema

- **Creación:** variables globales únicas `classicFlight`, `classicFlightView`,
  `classicChapterStory`, `classicVoyageRecord` (01 ~87–118); `startLevel` decide
  con `currentLevel===0` (03 ~1453–1486); `prepareLevel` precarga Chronos (03 ~1357).
- **Guardado:** `normalizeClassicVoyageRecord` fija `unlockedStage>10` y
  `stageNumber!==10` (03 ~337); clave única `CHRONOS_VOYAGE_KEY` (03 ~348–385, 162).
- **Fin:** `isAtlasMission()` = `currentLevel===0` (03 ~854); premio
  «guardian-atlas» y textos de Gaia (03 ~1687–1723; 08 ~370).
- **Otros:** patrulla inicial `stageNumber===1 ? 4 : 7` (03 ~623, 1471);
  «CARGANDO CHRONOS» (05 ~241).
