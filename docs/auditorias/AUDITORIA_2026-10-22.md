# Auditoría visual y de comportamiento — 22/10/2026

Rama: `claude/preparar-publicacion-rtfl9q` (HEAD `fcaa37f`).

Tres revisores independientes:

| Área | Revisor | Nota | Veredicto |
|---|---|---|---|
| Visual | `director-arte` | 5,5/10 | No está a la altura |
| Lógica | `auditor-codigo` | 7/10 | Apto con arreglos |
| Juego | `critico-juego` | 5/10 | No está a la altura |

Límites: Chromium headless a 390×844 (algo a 320×568), modo `?dev=1`.
Sin iPhone físico, sin sonido, sin medir 60 fps. El revisor de juego usó un
bot automático, no una persona.

## Prioridades

1. **Decisión del propietario: escalada y munición (J01, J02).** 0 de 166
   enemigos se retiran, todos llegan a intensidad 3, y 0,5 cargas/s no
   bastan para derribarlos. Choca con la orden de que los enemigos no
   eliminados sigan atacando con más intensidad: proponer tope, no quitarla.
2. **Separar fondo y juego (V01, V02, J03).** Planetas fuera del carril y
   oscurecidos; borde de contraste en amenazas y proyectiles.
3. **Reintento y reanudación de viajes ya completados (L01, L02).**
4. **Efectos con fuerza (V03, V12).**
5. **Mapa, comunicaciones y tokens (V05, V07, V08–V10, L03).**

## Visual (V)

| id | grav. | pantalla | qué falla | arreglo propuesto |
|---|---|---|---|---|
| V01 | alta | Vuelo S2 | Lava y minas cruzan sobre un planeta del mismo color, en el carril. Incumple DESIGN §9.4. | Planeta al 25 % superior o al borde, −40–50 % brillo/saturación; borde claro de 2 px o sombra en amenazas. |
| V02 | alta | Vuelo S1 y Atlas | Gaia grande y blanca en el centro; exploradores y Atlas pierden silueta; disparos rojos perdidos en las nubes. | Igual que V01; oscurecer fondo un 30 % en jefe. |
| V03 | alta | Efectos | Explosiones = chispas cian diminutas; daño al 35 % = 1–3 px. | Atlas de explosión cálida de 8 fotogramas; humo/chispas bajo 50 % de casco en `drawCh01Frame`. |
| V04 | alta | Fondo de vuelo | Mismo fondo en S1 y S2, sin capas; Vulkar sin su paleta; inicio de tramo vacío. | Fondo por mundo (ART_DIRECTION) y dos capas de polvo con parallax. |
| V05 | media | Mapa de sector | Tarjetas tapan nombres; pestañas sobre Chronos; emoji 🔒 (DESIGN §8); etiquetas de 8 px. `03-ui-game-flow.js:1414` | Recolocar nombres, pestañas fuera del mapa, SVG en vez de emoji, ≥9 px. |
| V06 | media | Inicio de Chronos | Subtítulos de 8 px sin velo; rótulo del jefe ilegible; título en Trebuchet. §9.5 | Velo `#061521e8`; banda oscura para el rótulo; hablante ≥10 px. |
| V07 | media | Comunicaciones | «Mantén el rumbo hacia Gaia» también en Vulkar (`03-ui-game-flow.js:776`); la franja tapa la entrada de amenazas. | Frase por sector; mensaje más estrecho; no generar enemigos bajo `presentationTop` con mensaje. |
| V08 | media | Exploradores | Núcleo cian y casco blanco como la nave propia (§9.1); formaciones superpuestas. | Núcleos ámbar/rojo (`#ff754f`/`#ffb25c`); separación ≥1,1× ancho. |
| V09 | media | Derrota | «Ver anuncio y reparar» con violeta antiguo (`styles.css:30`, `:583`), reservado a Cronos Prime (§9.3). | `.reward` en ámbar o secundario con glifo. |
| V10 | media | Sistema de diseño | 591 hex, 51 `font-size`, 45 radios, 61 sombras; solo 67 `var(--ui-*)`; HUD real ≠ DESIGN; textos de 7–8 px. | Escala cerrada como variables; alinear DESIGN.md y HUD. |
| V11 | baja | Ajustes | «NORM» cortado; foco blanco al abrir. | Ancho ≥120 px; foco solo con `:focus-visible`. |
| V12 | baja | Atlas | La carga usa el mismo destello rojo que el daño propio (`08-loop-input-bootstrap.js:38-40`). | Aviso localizado (anillo ámbar en Atlas). |
| V13 | baja | Cronos Prime | Pierde brazos, arcos y anillo frente a `docs/art/referencia_cronos_prime_fase1.png`. | Encargar piezas (DESIGN §13). |
| V14 | baja | Viaje completado | Estrellas sin animar; ilustración de S1-V2 = S1-V1. | Estrellas una a una; ilustración por viaje. |
| V15 | baja | Hangar | Anillo de foco naranja de Chromium; línea de 1 px en el borde del vuelo. | `outline:none` en contenedores `tabindex=-1`. |
| V16 | baja | Objetos | CRONIUM de ~10 px; chatarra parecida a restos. | CRONIUM +30 % con halo; chatarra con brillo frío. |
| V17 | baja | 320×568 | HUD corta «S2-…». | Cifra a 13 px bajo 360 px, o solo «V3». |
| V18 | baja | Menú y forja | Ajustes duplicado; forja dice «Volver al viaje» desde el menú; línea del árbol cruza tarjetas. | Un acceso; texto «Volver»; línea detrás. |

Funciona: CH-01, Atlas y planetas bien recortados; explosión de la estación;
pausa, derrota y fin de viaje coherentes; mandos de 44 px o más.

## Lógica (L) — todos reproducidos con el `game.js` real

| id | grav. | archivo:línea | qué falla | arreglo propuesto |
|---|---|---|---|---|
| L01 | media-alta | `03-ui-game-flow.js:1606` (`:886`, `:1903`) | Rejugar un viaje del mapa completado: «REINTENTAR TRAMO 2.3» lleva al tramo 1 con 0 CRONIUM; igual al salir y volver. | Separar «completado alguna vez» de «partida en curso». |
| L02 | media | `03-ui-game-flow.js:372`, `08-loop-input-bootstrap.js:335` | Rejugar S1-V1 deja «JUGAR» atascado en S1-V1. | S1-V1 solo si `getUnlocked()<2`; si no, `nextCampaignVoyage()`. |
| L03 | media-baja | `03-ui-game-flow.js:370-371` (`:1706`) | El punto de control de S1-V1 no guarda `missed`; 3 estrellas más fáciles. | Añadir `missed` (opcional, compatible). |
| L04 | baja | `08-loop-input-bootstrap.js:422-436`, `03-ui-game-flow.js:1715` | Anuncio con recompensa pendiente + Reintentar: el anuncio viejo revive gratis en la partida nueva. | `runToken` en `resumeReward`, o bloquear botones. |
| L05 | baja | `04-entities-collision-damage.js:536-556` | «Casco invencible» (`?dev=1`) pone 100 pero la nave explota. | Con `DEV.invulnerable`, saltar `destroyed`. |

Avisos (no borrar): código muerto `flightDockReturn==="voyage"`
(`03:430-439`, `:473`, `07:290`); pruebas sobre niveles clásicos que ya no
se abren (`tests/run-tests.mjs:540`, `:613`).

Sin fallos: un solo RAF, `USE_ENGINE_V1 = false`, `game.js` = `src/game`,
doble completado/derrota protegidos, `registerRun` una vez, pausa al ocultar
pestaña, entrada limpia, misiles sin doble cobro, Atlas solo en S1-V5,
tope de patrulla. `npm test` 34/34.

## Juego (J)

| id | grav. | situación | qué pasa | propuesta (decide el propietario) |
|---|---|---|---|---|
| J01 | alta | Todos, desde tramo 2–3 | 0/166 se retiran; intensidad 3 en 10/10 viajes (recarga ×0,46); vida máx. 88 s; 1,4–1,6 tiros/s en S2. `maxAttacks` sin uso. `classic-pursuit.js:190-197` | Intensidad máx. 2, o retirada tras ~20 s / `maxAttacks`, o solo sube el más antiguo. |
| J02 | alta | Todos | 20 cargas + 1/2 s; enemigos de 2–3 vida cada 6–9 s; meteoritos gastan disparos. `classic-weapons.js:12` | Una palanca: recarga 1,25 s, interceptor de 2 vida, o hueco ≥9 s con 2 vivos. |
| J03 | alta | S2 y S1-V5 | Enemigos quietos sobre Vulkar; proyectiles de 8–10 px se pierden en la lava; enemigos superpuestos. | Contorno en proyectiles; separar enemigos ≥120 px en X. |
| J04 | media | Lluvias de cometas | 700–950 px/s, aviso solo de texto, golpe a 0,47 s; los enemigos siguen disparando. `comet-shower.js:10-14` | Marcar pasillo seguro; alto el fuego durante la lluvia. |
| J05 | media | Todos los tramos | Cuota cumplida a 13–19 s; 11–17 s sin nada que recoger. `voyage-engine.js:225` | Pasar de tramo al cumplir cuota (mín. ~20 s) o rellenar. |
| J06 | baja | Pausa | Sin gracia al reanudar; «Reiniciar sector» en viajes del mapa. | 0,6–1 s de gracia; «Reiniciar viaje». |
| J07 | baja | Daño | Varios golpes en el mismo fotograma (−25/−30). | 0,3 s de invulnerabilidad tras golpe. |

Medidas (bot, ronda 2, sin invulnerabilidad):

| Viaje | Resultado | Enem. máx | Disp. máx | Tiros/s | Se van/nacen | Casco |
|---|---|---|---|---|---|---|
| S1-V1 | derrota 1.10 | 3 | 14 | 0,59 | 0/24 | 0 |
| S1-V2 | completado 2★ | 3 | 9 | 0,50 | 0/22 | 80 |
| S1-V3 | derrota 3.6 | 3 | 11 | 0,71 | 0/17 | 0 |
| S1-V4 | derrota 4.6 | 3 | 12 | 0,95 | 0/18 | 0 |
| S1-V5 | derrota 5.8 | 3 | 13 | 1,17 | 0/23 | 0 |
| S2-V1 | derrota 6.5 | 3 | 16 | 1,57 | 0/8 | 0 |
| S2-V2 | derrota 7.4 | 3 | 16 | 1,40 | 0/10 | 0 |
| S2-V3 | derrota 8.5 | 3 | 11 | 0,92 | 0/18 | 0 |
| S2-V4 | derrota 9.6 | 3 | 12 | 1,49 | 0/18 | 0 |
| S2-V5 | derrota 10.3 | 3 | 12 | 1,51 | 0/8 | 0 |

Funciona: la pausa congela de verdad; la derrota se lee bien; nunca más de 3
enemigos; fuera de los cometas los golpes se ven venir con ≥0,7 s; CRONIUM
no se confunde con amenazas.

## Sin comprobar

iPhone físico y Safari, sonido, fluidez, combate completo de Atlas y sus
fases, Cronos Prime jugable, aviso de peligro, partida humana larga sin
trucos, 320×568 en juego.
