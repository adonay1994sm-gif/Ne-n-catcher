# Mapa de sector · especificación (N3, 21/10/2026)

Decisión del propietario: entre viajes hay un **mapa de sector** con
planetas, rutas y bases; en las bases se habla con personajes. El vuelo
sigue siendo el arcade actual. Esta especificación cubre el sector 1; los
demás repiten el mismo esquema con sus datos.

## 1. Qué ve el jugador

```
 ┌──────────────── SECTOR 1 · HUIDA DE CHRONOS ────────────────┐
 │  ◉ Chronos (ruinas)                                          │
 │     ╲  S1-V1 Escapa de Chronos            [JUGAR]            │
 │      ◉ Baliza exterior                                       │
 │       ╲  S1-V2 … S1-V5  (en preparación, candado)            │
 │        ◉ Anillo de satélites → ◉ Órbita alta → ◉ Lado        │
 │          nocturno → ◉ GAIA NOVA (base · Iria)                │
 │  ◆ C9 (base móvil · Mira)                                    │
 └──────────────────────────────────────────────────────────────┘
```

- Lugares en **vertical** (lienzo 720×1280): el origen arriba y el
  destino abajo, como avanza el viaje. Gaia es el planeta grande del final.
- **Rutas** con líneas discontinuas: completada (cian continuo), abierta
  (cian que late) o bloqueada (gris con candado y «En preparación»).
- **Bases** con rombo: C9 (Mira) y Gaia Nova (Iria). Al tocarlas se abre una
  **conversación** (ver §4).
- Al tocar una ruta abierta se abre la **ficha del viaje** que ya existe
  (briefing con tramos) y desde ahí «Despegar».

## 2. Flujo

1. Menú → «RUTA» → **mapa del sector actual** («Jugar» sigue retomando el
   viaje en curso; así no se rompe el acceso rápido ni las pruebas).
2. Mapa → ruta → briefing de tramos → vuelo (sin cambios).
3. Al terminar un viaje → vuelta al mapa con la ruta marcada como hecha.
4. «Niveles» sigue existiendo mientras convivan los 10 niveles antiguos.

## 3. Datos y estado

- Módulo puro `src/game/progression/sector-map.js`:
  - `SECTOR_MAPS[1]`: lugares `{id, label, kind: 'ruin'|'waypoint'|'planet'|'base', x, y, actor?}`
    y rutas `{voyage, from, to, title}` en el orden de `CAMPANA_50_VIAJES.md`.
  - `sectorMapState(sector, {playable, completed})` → cada ruta en
    `done | open | locked`; solo se abre una ruta si su viaje tiene ficha
    jugable (`VOYAGES`) y la anterior está hecha.
- **Sin guardados nuevos**: lo completado se deduce del progreso existente
  (`neon-unlocked-v2` ≥ 2 ⇒ S1-V1 hecho). Las fichas S1-V2…V5 se abren
  solas cuando existan (Fase B).

## 4. Conversaciones en las bases

- Panel inferior con **retrato** (`assets/chapter1_portraits_v1.webp`: Lira,
  Mira, Iria), nombre, rol y frases cortas (≤ 90 caracteres) que avanzan al
  tocar; «Cerrar» siempre visible. Sin pausa del juego: solo en el mapa.
- Guion por base y por avance (qué viaje está hecho):
  - **Mira · C9** (siempre): taller, chatarra, el emisor gemelo.
  - **Iria · Gaia Nova**: antes de S1-V5, mensajes cortados («Identifíquese»);
    después, agradece el registro y señala Vulkar.
- Módulo puro `src/game/narrative/base-dialogues.js` con las líneas y
  `baseConversation(baseId, progress)`.

## 5. Arte

| Pieza | Estado |
|---|---|
| Chronos en ruinas, estación | Existe (`chronos_station_burst_atlas_v1`, catálogo «Estación espacial») |
| Gaia Nova | Existe (planeta de la ruta de Gaia) |
| Planetas de otros sectores | Existen (volcánico, glacial, violeta, tormentoso) |
| Retratos Lira, Mira, Iria | Existen (pequeños, 34 px; **pedir versión grande ~512 px**) |
| Iconos de base y candado | Se dibujan con CSS/SVG |
| Retratos de N-7, Atlas, Yara, Tessa… | **Faltan** |

## 6. Pruebas

- Unidad: estados de ruta, deducción del progreso, guion de bases.
- JSDOM: «Jugar» abre el mapa; ruta abierta abre el briefing; ruta
  bloqueada no despega; base abre conversación y «Cerrar» vuelve.
- Capturas 390×844 del mapa y de una conversación.
