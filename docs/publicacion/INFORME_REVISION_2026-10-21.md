# Informe de revisión completa · 21/10/2026

Revisión hecha con tres revisores independientes (código, jugabilidad y
arte) sobre la base `continuity-assets-audit-20261013`, más los arreglos de
este mismo PR. Capturas en Chromium a 390×844 (no en iPhone físico).

## 1. Por qué parecen «dos juegos en uno»

Es cierto: hoy conviven **dos juegos con guardados separados**.

| | Campaña de viajes (la nueva) | Niveles clásicos (la antigua) |
|---|---|---|
| Qué es | S1-V1 (Chronos → Gaia) y S1-V2…S2-V5 por fichas | 10 niveles `LEVELS` con escenas dibujadas, estrellas y récords |
| Dónde se entra | Mapa en RUTA | Rejilla «Niveles clásicos» en RUTA |
| Guardado | `neonCronium.chronosVoyage.v2` y `neonCronium.voyage.<ID>.v1` | `neon-unlocked-v2`, `neon-stars-v2`, `neon-level-best-v2` |
| Historia | Chronos → Gaia → Vulkar (10 viajes) | Repite Gaia, Vulkar, Cryon… con otro tono |

**Dónde no enlazaban los viajes (y estado):**

1. Al terminar S1-V1, el botón lanzaba el **nivel clásico 2**, no S1-V2. **Arreglado:** ahora dice «SIGUIENTE VIAJE: S1-V2 →».
2. «Jugar» del menú llevaba a niveles clásicos tras S1-V1. **Arreglado:** sigue por el siguiente viaje abierto del mapa.
3. Terminar un viaje secundario no tiene pantalla de completado propia: vuelve al mapa con un aviso. *Pendiente.*
4. La barra de progreso, las estrellas y «x/10» del menú cuentan solo niveles clásicos. *Pendiente.*
5. El HUD dice «NIVEL 1» en todos los viajes. *Pendiente.*
6. **Historia contradictoria:** S1-V1 termina con Atlas vencido e Iria pidiendo disculpas, y S1-V2…V5 vuelven al «antes». Atlas se pelea dos veces (S1-V1 y S1-V5). Es la decisión N9 que tienes pendiente. Los niveles clásicos 3-4 (Vulkar) repiten el sector 2.
7. El Gemelo solo se gana en S1-V1; S1-V5 no da recompensa.

**Propuesta para que sea un solo juego** (pasos pequeños, sin borrar guardados):

1. ✅ Hecho: una sola «siguiente ruta» para Jugar y la pantalla de completado.
2. Pantalla de completado también para los viajes secundarios, con «SIGUIENTE VIAJE».
3. HUD y menú con el viaje (`S2-V3 · tramo 4/7`) y progreso por viajes, no por niveles.
4. Ocultar los niveles clásicos salvo en `?dev=1` o en un «Modo arcade» aparte (se conservan sus estrellas y récords).
5. Decidir N9: Atlas solo en S1-V5 (y el Gemelo allí), o reescribir S1-V2…V5.

## 2. Fallos encontrados

| Gravedad | Fallo | Estado |
|---|---|---|
| Crítico | Elegir un tramo en S1-V1 (p. ej. 1.9) y luego abrir S1-V2 rompía el arranque (S1-V2 tiene 7 tramos) | **Arreglado** con prueba |
| Importante | Volver al menú dejaba un viaje secundario «fantasma» activo | **Arreglado** con prueba |
| Importante | Completar un viaje secundario no cuenta partidas (`registerRun`) ni tiene pantalla de recompensa | Pendiente (paso 2) |
| Menor | «Siguiente nivel» con el guardado bloqueado repite el mismo nivel sin avisar | Pendiente |
| Menor | Si juegas un viaje secundario a mitad de S1-V1, la chatarra de S1-V1 empieza de nuevo | Pendiente |
| Menor | Código muerto: historia antigua del nivel 1 «IA N-7» (`LEVEL_ONE_STORY`) | Pendiente (avisado, no borrado) |

## 3. Animaciones

| Gravedad | Problema | Estado |
|---|---|---|
| Alta | Figuras vectoriales antiguas (líneas, anillos, rayas) encima de los planetas pintados: dos estilos mezclados | **Arreglado** (niveles 3–9) |
| Alta | Atlas cae **sin explosión**: el sprite cambia en seco al «restaurado» | Pendiente: destello, sacudida y estallido al vencerlo |
| Media | El rótulo «CRONOS PRIME» pisaba el subtítulo de Lira | **Arreglado** (rótulo más arriba) |
| Media | La estela de Cronos Prime es una barra plana, y hay una línea fina que cruza el planeta | Pendiente |
| Media | El golpe a la nave es un aro rosa con puntos (estilo antiguo) | Pendiente: chispas de la hoja de impactos |
| Menor | Unas líneas violetas tenues siguen en el nivel 4; el aviso «viaje completado» tapa el título del mapa; corte seco del inicio al juego | Pendiente |

**Lo que funciona:** el inicio de Chronos (zoom, llegada de Cronos Prime, estallido), los sprites pintados de Atlas, Cronos Prime y los meteoritos, y los planetas pintados.

## 4. Dificultad: recálculo y tres modos

**Diagnóstico (crítico de juego):** la dificultad casi no crecía. El pico del
último tramo de S1-V1 era el techo de todos los viajes; S1-V4, S2-V1 y S2-V3
bajaban respecto al anterior; el tramo 1.3 es más duro que casi todo el
sector 2.

**Arreglo:** `src/game/progression/difficulty.js`.

- **Curva creciente:** cada viaje se calibra para que su presión media sea la de S1-V1 por una curva que **siempre sube**: +7 % por viaje hasta el 10 y luego +3 % (tope ×3 en el viaje 50). Los respiros dentro de cada viaje se conservan. S1-V1 en Normal **no cambia**, porque lo ajustaste tú.
- **Tres modos en Ajustes → Dificultad:**

| | Fácil | Normal | Hardcore |
|---|---|---|---|
| Presión (enemigos y peligros más seguidos) | ×0,72 | ×1 | ×1,18 |
| Tope de patrulla y de peligros | −1 | igual | +1 |
| Daño recibido | ×0,6 | ×1 | ×1,25 |
| Vida de Atlas | ×0,67 | ×1 | ×1,3 |
| Reparación a mitad de tramo | 4 s antes | igual | 6 s después |

- **Presión media resultante** (patrullas + peligros por segundo):

| Viaje | S1-V1 | S1-V2 | S1-V3 | S1-V4 | S1-V5 | S2-V1 | S2-V2 | S2-V3 | S2-V4 | S2-V5 |
|---|---|---|---|---|---|---|---|---|---|---|
| Fácil | 1,19 | 1,30 | 1,40 | 1,46 | 1,56 | 1,59 | 1,72 | 1,75 | 1,83 | 1,95 |
| Normal | 2,30 | 2,47 | 2,63 | 2,79 | 2,95 | 3,09 | 3,27 | 3,38 | 3,53 | 3,69 |
| Hardcore | 3,50 | 3,70 | 3,91 | 4,18 | 4,40 | 4,66 | 4,85 | 5,04 | 5,26 | 5,44 |

- **Reglas de justicia en todos los modos** (probadas):
  - Patrullas nunca más seguidas de 5 s, como mucho 4 a la vez.
  - Como mucho 6 peligros a la vez.
  - Velocidad como mucho ×1,3.
  - Siempre hay hueco para pasar y nunca se quitan los avisos.

**Recomendaciones que no he aplicado (tocan lo que ajustaste a mano):**

1. Suavizar el tramo 1.3: un asteroide grande vacía la reserva y quita 20 de casco de golpe.
2. Que los cometas no se confundan con el CRONIUM: estelas del mismo cian.
3. Que en Vulkar los disparos rojos y la lava no se pierdan sobre el planeta rojo.
4. Atlas de S1-V5 con más vida que el de S1-V1, si sigue en los dos.

## 5. Qué probar

1. Ajustes → Dificultad: juega el mismo tramo en Fácil y en Hardcore.
2. Termina S1-V1: el botón debe llevarte a S1-V2. Desde el menú, «Jugar» sigue la campaña.
3. Niveles 3, 4, 6 y 8 (con `?dev=1`): ya sin líneas ni anillos sobre los planetas.

## 6. Decisiones que necesito

1. **N9:** ¿Atlas solo en S1-V5 (y el Gemelo allí)?
2. **Niveles clásicos:** ¿ocultarlos de la campaña y dejarlos como «Modo arcade»?
3. ¿Aplico las recomendaciones del apartado 4 (tramo 1.3, cometas, Vulkar)?
4. ¿Sigo con la explosión de Atlas y el golpe a la nave?
