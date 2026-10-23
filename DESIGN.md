---
version: alpha
name: NEON-CRONIUM-design
description: |
  Sistema visual de NEON CRONIUM, arcade espacial vertical en Canvas 2D (lienzo lógico 720×1280)
  con interfaz HTML encima. La escena pintada es la protagonista; la interfaz ocupa dos franjas
  estrechas (telemetría arriba, mandos de pulgar abajo) con una consola común "ORBIT / 01" de
  titanio, marfil, cian y ámbar. En el lienzo, el color dice qué es cada cosa: cian = CRONIUM y
  nave propia, ámbar/rojo = peligro, violeta = Cronos Prime. Todos los valores salen del código
  real (styles.css, index.html, src/game/06-world-rendering.js y 07-player-item-rendering.js);
  lo que no existe se marca "sin definir".

colors:
  # Consola ORBIT / 01 (styles.css, bloque ":root" de "ORBIT / 01")
  ui-ink: "#07131f"
  ui-deep: "#040c15"
  ui-surface: "#102432"
  ui-raised: "#193341"
  ui-paper: "#f2f0e6"
  ui-muted: "#afc4cc"
  ui-line: "#54717d"
  ui-cyan: "#a1eee8"
  ui-amber: "#edc68a"
  ui-red: "#ff9d93"
  on-cyan: "#092028"
  panel-from: "#152b38"
  panel-to: "#091923"
  hud-from: "#071827f2"
  hud-to: "#102738e6"
  comms-bg: "#061521e8"
  # Base heredada (":root" inicial de styles.css); sigue viva en pantallas antiguas
  bg: "#03050d"
  legacy-cyan: "#55f4ff"
  legacy-violet: "#7958ff"
  legacy-pink: "#ff4cc9"
  legacy-green: "#76ffc2"
  legacy-danger: "#ff6b8d"
  theme-color-html: "#07131d"
  manifest-background: "#050610"
  manifest-theme: "#080a19"
  # Identidad canónica (ART_DIRECTION_NEON_CRONIUM.md)
  cronium-cyan: "#5CF5FF"
  cronos-deep-blue: "#07182D"
  temporal-violet: "#A478F2"
  # Lienzo: semántica de juego (07-player-item-rendering.js)
  player-glow: "#50e8ff"
  player-damaged: "#ff6079"
  player-pulse: "#95f7ff"
  player-pulse-beam: "#63eaff"
  player-phaser: "#78ff9c"
  player-phaser-beam: "#6dff9a"
  threat-meteor-glow: "#ff754f"
  threat-debris-glow: "#ffb25c"
  threat-debris-hot: "#ff5b3d"
  threat-satellite-glow: "#ffc777"
  explosion-glow: "#ff8d36"
  explosion-core: "#ff9b42"
  impact-glow: "#ff9b36"
  hazard-border: "rgba(255,106,126,.48)"
  hazard-label: "#ff9eb1"
  atlas-border: "#e19b87"
  cronos-prime-glow: "#8f6bff"
  cronos-prime-light: "#c7b8ff"
  power-shield: "#5fffe8"
  power-tractor: "#ff71f6"
  power-slow: "#7ea9ff"
  power-double: "#ffe66c"
  power-repair: "#ff718f"
  power-phaser: "#8aff98"
  ally-ship: "sin definir"

typography:
  family-ui: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  family-canvas-title: "'Trebuchet MS', sans-serif"
  display-menu:
    fontSize: "clamp(27px, 7.3vw, 34px)"
    fontWeight: 800
    lineHeight: 1.07
    letterSpacing: -0.04em
  display-pause:
    fontSize: 34px
    lineHeight: 1.08
    letterSpacing: -0.035em
  heading-panel:
    fontSize: 30px
    lineHeight: 1.08
    letterSpacing: -0.035em
  heading-briefing:
    fontSize: "clamp(24px, 6.5vw, 30px)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: -0.02em
  eyebrow-panel:
    fontSize: 10px
    lineHeight: 1.5
    letterSpacing: 0.15em
    color: "{colors.ui-cyan}"
  body:
    fontSize: 13px
    lineHeight: 1.55
    color: "#c5d4d9"
  comms:
    fontSize: 12px
    lineHeight: 16px
  hud-label:
    fontSize: 10px
    fontWeight: 650
    lineHeight: 1
    letterSpacing: 0.06em
    color: "#afc6d0"
  hud-value:
    fontSize: 15px
    fontWeight: 750
    lineHeight: 1.05
    letterSpacing: -0.02em
    fontVariantNumeric: tabular-nums
    color: "#f5f3eb"
  button:
    fontSize: 12px
    fontWeight: 750
    letterSpacing: 0.035em
  button-hero:
    fontSize: 15px
    letterSpacing: 0.035em
  canvas-boss-title:
    font: "900 76px 'Trebuchet MS', sans-serif"
  canvas-boss-subtitle:
    font: "800 22px 'Trebuchet MS', sans-serif"

rounded:
  ui: 8px
  hud: "6px 6px 2px 2px"
  panel: "12px 12px 4px 12px"
  thumb-control: "10px 10px 3px 10px"
  hero-cta: "8px 8px 3px 8px"
  chip: 4px
  tag: 3px
  pill: 999px

spacing:
  safe-top: "max(8px, env(safe-area-inset-top))"
  safe-bottom: "max(14px, env(safe-area-inset-bottom))"
  safe-left: "max(12px, env(safe-area-inset-left))"
  safe-right: "max(12px, env(safe-area-inset-right))"
  overlay-padding: 16px
  panel-padding: "24px 20px"
  gap-tight: 5px
  gap-actions: 7px
  scale: "sin definir (no hay escala formal; valores observados 2–24 px)"

components:
  hud-strip:
    height: 48px
    grid: "36px minmax(0,.85fr) minmax(0,1.05fr) minmax(0,1.25fr) 44px"
    background: "linear-gradient(100deg, {colors.hud-from}, {colors.hud-to})"
    border: "1px solid #8da7b273"
    rounded: "{rounded.hud}"
  route-rail:
    height: 29px
    progressHeight: 2px
    progressColor: "{colors.ui-cyan}"
  comms-objective:
    minHeight: 34px
    maxHeight: 52px
    borderLeft: "2px solid {colors.ui-cyan}"
    background: "{colors.comms-bg}"
    avatar: 28px
  comms-objective-tutorial:
    borderLeft: "2px solid {colors.ui-amber}"
    background: "#242b29eb"
  fire-control:
    width: 108px
    height: 66px
    border: "1px solid #c4f8f2"
    rounded: "{rounded.thumb-control}"
  fire-control-empty:
    border: "1px solid {colors.ui-amber}"
  missile-control:
    width: 62px
    height: 66px
    border: "1px solid #d3b27e"
    textColor: "#ffe4b2"
    rounded: "{rounded.thumb-control}"
  weapon-switch:
    width: 100px
    minHeight: 48px
  c9-button:
    width: 60px
    minHeight: 48px
  pause-button:
    width: 44px
    height: 46px
  button-primary:
    minHeight: 46px
    backgroundColor: "{colors.ui-cyan}"
    textColor: "{colors.on-cyan}"
    border: "1px solid #c6faf4"
    rounded: "{rounded.ui}"
  button-secondary:
    minHeight: 46px
    backgroundColor: "#122734"
    textColor: "{colors.ui-paper}"
    border: "1px solid {colors.ui-line}"
    rounded: "{rounded.ui}"
  button-hero:
    minHeight: 70px
    backgroundColor: "{colors.ui-cyan}"
    rounded: "{rounded.hero-cta}"
  panel:
    background: "linear-gradient(145deg, {colors.panel-from}, {colors.panel-to} 65%)"
    border: "1px solid #6c8791"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-padding}"
  power-chip:
    padding: "5px 7px"
    rounded: "{rounded.chip}"
    background: "#071b29e8"
  hazard-warning:
    minWidth: 220px
    border: "1px solid {colors.hazard-border}"
    rounded: 16px
  boss-strip:
    height: 31px
    borderLeft: "2px solid {colors.ui-amber}"
    background: "#1a2631e6"
---

# NEON CRONIUM · DESIGN.md

Guía de diseño para cualquier persona o agente que toque HUD, menús,
pantallas, sprites, efectos o cinemáticas. Formato tomado como **plantilla**
de [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
(MIT): bloque YAML de tokens + explicación. No se copia la marca de nadie.

Fuentes de los valores: `styles.css` (sobre todo el bloque **ORBIT / 01**),
`index.html`, `manifest.webmanifest`, `src/game/06-world-rendering.js`,
`src/game/07-player-item-rendering.js`, `ART_DIRECTION_NEON_CRONIUM.md`,
`docs/design/GUION_INICIO_CHRONOS.md` y `docs/art/CATALOGO_ARTE.md`. Si el
código cambia, el código manda: actualiza este archivo en el mismo commit.

## 1. Visión general

- **La escena manda.** El fondo pintado, la nave y las amenazas son el
  espectáculo; la interfaz se queda en dos bandas estrechas: telemetría y
  ruta arriba, mandos de pulgar abajo. El centro queda libre.
- **Una sola consola.** Todas las pantallas de vuelo y modales usan la
  misma estética "ORBIT / 01": paneles de titanio azul oscuro, texto marfil,
  cian para lo propio y lo seguro, ámbar para atención, rojo suave para
  peligro.
- **El color tiene significado.** En el lienzo no se elige un color por
  gusto: cian = CRONIUM y nave propia; ámbar/rojo = lo que hace daño;
  violeta = Cronos Prime y lo temporal.
- **Estado del juego:** solo el capítulo 1 está jugable. Este sistema no es
  "aceptado" hasta que el propietario lo ve en su iPhone.

## 2. Color

### Consola de interfaz (ORBIT / 01)

| Token | Valor | Uso |
|---|---|---|
| `ui-deep` / `ui-ink` | `#040c15` / `#07131f` | Fondos de pantalla y overlays |
| `ui-surface` / `ui-raised` | `#102432` / `#193341` | Superficies y elementos elevados |
| `ui-paper` | `#f2f0e6` | Texto principal (marfil, nunca blanco puro en paneles) |
| `ui-muted` | `#afc4cc` | Texto secundario |
| `ui-line` | `#54717d` | Bordes de botones secundarios |
| `ui-cyan` | `#a1eee8` | Acción principal, progreso, foco de ruta, comunicaciones |
| `ui-amber` | `#edc68a` | Atención: guía de vuelo, jefe, arma vacía, chatarra |
| `ui-red` | `#ff9d93` | Acciones peligrosas (salir, etc.) |

Contraste medido (WCAG, calculado con los hex del CSS): marfil sobre
`ui-deep` 17,2:1; valor HUD `#f5f3eb` sobre `#071827` 16,2:1; etiqueta HUD
`#afc6d0` sobre `#071827` 10,1:1; texto `#092028` sobre botón cian 12,7:1;
cian/ámbar/rojo sobre panel `#091923`: 13,5 / 11,1 / 8,9:1. Todo supera 4,5:1
**sobre fondo sólido**; sobre arte espacial depende del velo (ver §9).

La paleta inicial (`--cyan #55f4ff`, `--violet #7958ff`, `--pink #ff4cc9`,
`--green #76ffc2`, `--danger #ff6b8d`, degradados y `backdrop-filter`) sigue
en reglas antiguas fuera de `body.flight-mode`. No se usa para pantallas nuevas.

### Lienzo: significado de cada color

| Papel | Valores reales | Dónde |
|---|---|---|
| **CRONIUM** (recoger) | Halo radial `rgba(220,255,255,.9)` → `rgba(76,241,255,.55)` → `rgba(28,139,255,.15)`; canónico `#5CF5FF` | `drawEnergy`, dirección de arte |
| **Nave propia CH-01** | Brillo `#50e8ff`; dañada `#ff6079` | `drawCh01Frame` |
| **Disparos propios** | Pulso `#95f7ff`/`#63eaff`; phaser `#78ff9c`/`#6dff9a` | `drawShots` |
| **Pasillo seguro** | Cian (texto de ayuda: "cruza por el pasillo cian") | Corredor de restos |
| **Amenazas** | Meteorito `#ff754f`; restos `#ffb25c` (calientes `#ff5b3d`); satélite `#ffc777` | `drawMeteor`, `drawDebris`, `drawSatellite` |
| **Disparos enemigos** | Fila 0 del atlas recoloreada a **rojo hostil** (antes era cian como los propios) | `hostileOrdnanceSource` |
| **Explosiones / impactos** | `#ff8d36`, núcleo `#ff9b42`, impacto `#ff9b36` | `drawExplosions`, `drawImpactEffects` |
| **Aviso de peligro (HUD)** | Borde `rgba(255,106,126,.48)`, rótulo `#ff9eb1`, triángulo `#ffe179`→`#ff4c6d` | `.hazard-warning` |
| **Jefe Atlas** | Borde `#e19b87`, vida `#ed6b65`→`#ffd8a2`, franja con `ui-amber` | `.atlas-encounter` |
| **Cronos Prime** | Brillo `#8f6bff`, luz `#c7b8ff`/`#d9ccff`, estela `rgba(215,190,255)`→`rgba(120,60,255,0)` | `drawCronosPrime` |
| **Mejoras** | Escudo `#5fffe8`, tractor `#ff71f6`, estabilizador `#7ea9ff`, sobrecarga `#ffe66c`, reparación `#ff718f`, phaser `#8aff98` | `drawPower`, `.power-chip` |
| **Aliados** (otras naves amigas) | **sin definir** | Solo existen como arte del convoy en el inicio |

Paletas por mundo (dirección de arte): Gaia Nova blanco titanio + grafito +
núcleos cian + avisos rojos; Vulkar basalto `#171820`, magma `#FF6A1A`, brasa
`#FFB13B`; Cryon cian hielo `#A6F3FF`, sombras `#203C63`; Aether violeta
`#9748DF`; Titan Omega ámbar industrial + señales rojas.

## 3. Tipografía

- **Familia de interfaz:** `Inter, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif`. No se carga ninguna fuente web (no hay
  `@font-face`): si Inter no está instalada, en iPhone se ve la fuente del
  sistema (sin comprobar en dispositivo). Algunos controles usan `system-ui`.
- **Lienzo:** rótulo de jefe `900 76px 'Trebuchet MS'` con aberración
  cromática (rojo `rgba(255,40,110,.7)` y cian `rgba(70,200,255,.7)`
  desplazados 4 px) y subtítulo `800 22px`; glifos de mejoras `900 18/27px Inter`.
- **Escala usada** (ver YAML): título de menú `clamp(27px,7.3vw,34px)`;
  título de panel 30 px; briefing `clamp(24px,6.5vw,30px)`; texto 13 px/1.55;
  comunicaciones 12 px/16 px; botones 12 px peso 750; etiqueta HUD 10 px;
  valor HUD 15 px con cifras tabulares.
- **Mínimos:** ningún texto del DOM por debajo de 10 px CSS, también a
  320 px (decisión del propietario 22/10/2026; antes 9 px). Números que
  cambian, siempre `tabular-nums`.
- Las etiquetas en mayúsculas con espaciado (`.06em`–`.15em`) son lenguaje
  de instrumento: solo en HUD, rótulos de panel y chips. El texto de
  historia y ayuda va en frase normal.

## 4. Composición y espaciado

- **Lienzo:** lógico 720×1280 (9:16). En vertical, `.game` mide
  `min(100vw, 56.25dvh)` × `100dvh`. En horizontal el lienzo queda centrado y
  la interfaz usa los lados.
- **Safe areas:** `viewport-fit=cover` y márgenes `safe-top max(8px)`,
  `safe-bottom max(14px)`, `safe-left/right max(12px)` sumados a
  `env(safe-area-inset-*)`. Ningún control fuera de ellas.
- **Franjas:** HUD 48 px arriba; carril de ruta 29 px debajo (+51 px);
  comunicaciones a +87 px; mandos abajo; mejoras a +139 px del borde inferior.
- **Escala de espaciado:** sin definir como sistema; se repiten 5, 7, 8,
  12, 16, 20 y 24 px. Paneles: relleno 24×20 px; overlays 16 px.
- **Puntos de corte reales:** `max-height:720px`, `max-width:350/360px`,
  `max-height:620px` en vertical, horizontal con `max-height:500px`,
  `min-width:640px` (hangar) y escritorio `min-width:700px` + puntero fino
  (marco de 520×920 máx.).

## 5. Profundidad

- Paneles: `inset 0 1px #e6f7ff22, 0 22px 60px #0009`. Botón principal:
  `inset 0 1px #ffffff80, 0 6px 18px #0005`. Mandos: `0 5px 18px #0008`.
- En vuelo (`flight-mode`) **no hay `backdrop-filter`**. Se separa con un paso de tono y borde fino, no con desenfoque.
- En el lienzo, el brillo (`shadowBlur`, modo `screen`) se reserva para lo
  que importa: CRONIUM, disparos, amenazas, jefe. Decoración sin halo.

## 6. Formas

- Radio base `--ui-radius: 8px`. Firma de la consola: **una esquina más
  cerrada** (paneles `12 12 4 12`, mandos `10 10 3 10`, botón héroe `8 8 3 8`,
  HUD `6 6 2 2`). Chips 4 px, etiquetas 3 px, píldoras 999 px solo en
  elementos antiguos fuera de `flight-mode`.

## 7. Componentes

**HUD superior** (`#hud`): rejilla `36px | .85fr | 1.05fr | 1.25fr | 44px`
(NIVEL, PUNTOS, CRONIUM, CASCO + reserva, pausa). Divisiones de 1 px
`#95bec52b`. Barra de casco 2 px. Animaciones: `hudPop` al ganar, `hudDamage`
al recibir daño.

**Carril de ruta** (`.flight-route`): origen → destino a la izquierda,
tramo a la derecha (11 px, 650), barra de progreso 2 px cian.

**Comunicaciones** (`#flightObjective`): borde izquierdo cian 2 px, cara del
personaje 28 px (atlas de 84×28: Lira, Mira, Iria), dos líneas máx. En la
guía de vuelo el borde pasa a ámbar.

**Mandos de pulgar** (fijos, no se mueven con el contexto):
DISPARAR 108×66 (derecha); MISIL 62×66 ámbar a su izquierda; cambio de arma
100×48 y C9 60×48 a la izquierda; pista "DESLIZA PARA MOVER" 44 px.
Pulsado: fondo más claro y borde marfil, sin escala. Arma vacía: borde ámbar.

**Paneles y modales**: un solo patrón (rótulo cian 10 px, título 30 px,
texto 13 px, botones a todo el ancho, mín. 48 px en paneles). Pausa 34 px de
título y botones de 50 px alineados a la izquierda.

**Botones**: principal cian con texto `#092028`; secundario `#122734`;
peligroso con texto `ui-red` y borde `#9b685f`. Foco visible:
`outline 3px solid ui-paper; offset 4px`.

**Menú de inicio**: arte `chronos_flight_space_v1.webp` con velo vertical
(`#040e1980` → `#06111b`), nave flotando arriba, historia y una acción
principal abajo (`CONTINUAR VIAJE`, 70 px).

**Aviso de peligro** (`.hazard-warning`): rojo, símbolo triangular,
pulso `.72s`; con efectos reducidos queda fijo pero visible.

**Jefe** (`.atlas-encounter` en combate): franja de 31 px bajo el HUD con
borde ámbar y barra de vida de 3 px. Mientras dura se ocultan la
transmisión grande y las mejoras.

## 8. Iconografía

- SVG en línea, `viewBox 0 0 24 24`, solo trazo (`fill:none`,
  `stroke:currentColor`, grosor 1,5–1,7, extremos redondeados). Tamaño
  19–22 px. Retícula de disparo propia (`viewBox 0 0 32 32`, trazo 1,65).
- Glifos Unicode para mejoras y menú: ◌ oleada, ◉ escudo, ⌁ tractor,
  ◷ estabilizador, ×2 sobrecarga, ϟ phaser, ▦ ruta, ⚙ ajustes.
- Misil: sprite (`.missile-symbol`, celda 18×24). Caras: atlas de 3 caras.
- Sin emojis. Biblioteca de iconos externa: sin definir (no se usa ninguna).

## 9. Legibilidad en juego

Orden de lectura (dirección de arte): 1) nave y colisión; 2) amenazas,
avisos y pasillos seguros; 3) objetos, mejoras y proyectiles; 4) entorno y
planetas; 5) decoración.

1. **Amenaza = cálido.** Todo lo que hace daño brilla ámbar, naranja o rojo.
   Nunca azul o cian: los restos brillaban en azul y se confundían con la
   estación (corregido); los disparos enemigos eran cian como los propios
   (recoloreados a rojo).
2. **Lo bueno = frío.** CRONIUM y la nave propia en cian; el pasillo seguro
   en cian. Las mejoras usan su color propio, siempre con glifo además del
   color (no depender solo del color).
3. **Cronos Prime = violeta.** No reutilizar ese violeta para amenazas
   normales ni para mejoras.
4. **Fondo detrás, siempre.** El fondo nunca tapa la zona de colisión; tras
   la ruptura la estación se oscurece y se aleja. Las capas luminosas llevan
   opacidad controlada. Nada de barras o líneas encima del arte como
   sustituto de arte acabado.
5. **Texto sobre espacio:** siempre sobre velo propio (HUD `#071827f2`,
   comunicaciones `#061521e8`, avisos breves `#112b3bf5`) o con sombra de texto
   (`0 5px 18px #000` en rótulos). Texto suelto sobre estrellas: no.
6. **Toque:** todo control mide **44×44 px o más**, sin solapes entre mandos
   y dentro del viewport (se comprueba con capturas). Enlaces legales también
   44 px.
7. **Comodidad:** ajuste "Reducir sacudidas y destellos" (clase
   `.reduced-effects`) y `prefers-reduced-motion` quitan sacudidas y pulsos
   pero mantienen avisos y control. "Calidad visual" (bajo/normal/alto) solo
   cambia efectos, nunca dificultad ni colisiones.

## 10. Movimiento y animación

| Elemento | Valor real |
|---|---|
| Ganar puntos/CRONIUM (`hudPop`) | `.32s cubic-bezier(.2,.9,.25,1.35)`, escala 1→1,32→1 |
| Daño (`hudDamage`) | `.34s ease-out`, sacudida ±3 px |
| Overlays | opacidad `.2s`; transmisiones `.25s`; comunicaciones `.15s` |
| Nave del menú (`shipFloat`) | `6s ease-in-out infinite`, ±8 px |
| Aviso de peligro | `warningPulse .72s` alterno |
| Botón de lanzamiento | brillo `launchSweep 2.8s` |
| Progreso de campaña | ancho `.35s` |

- Interfaz: solo `transform` y `opacity`, con alternativa en
  `prefers-reduced-motion` y `.reduced-effects`.
- Lienzo: un único bucle `requestAnimationFrame`. Las poses salen de la
  simulación (no de otro reloj). Velocidades de atlas reales: CRONIUM 4
  fotogramas a 8 fps; disparos enemigos 12 fps (orbes de jefe 10 fps);
  misil 14 fps; pulsos propios ~12 fps (impacto 16 fps); explosión azul del
  inicio 8 fotogramas.

## 11. Efectos visuales (VFX)

- Brillos con `globalCompositeOperation = "screen"` y halos preparados una
  vez en un lienzo aparte (ejemplo: halo de CRONIUM de 96 px).
- Onda de choque del inicio: atlas `chronos_shockwave_atlas_v1` en 4 fases.
- Explosión de la estación: hoja azul de 8 fotogramas del propietario.
- Destello de pantalla: `rgba(215,230,255,flash)` en modo `screen`, corto.
- Cronos Prime: estela con degradado lineal, halo radial de carga, onda
  elíptica al frenar (`#d9ccff`, sombra `#8f6bff`, desenfoque 24).
- Calidad baja y efectos reducidos recortan efectos y sacudidas (alcance
  exacto por efecto: sin comprobar); la información de juego no cambia.

## 12. Cinemáticas y jefes

Aprendido en las versiones v2–v5 del inicio de Chronos (notas del
propietario: v4 3/10, v5 8/10 en iPhone):

1. **Planos, no animaciones sueltas.** Cada momento es un plano con
   tiempo, qué se ve, cámara y sonido (tabla en
   `docs/design/GUION_INICIO_CHRONOS.md`). La cámara de escena (zoom,
   encuadre, temblor) no afecta al juego. El inicio de Chronos es una
   **animación**: sin HUD ni nave y sin control hasta 14 s (o «Omitir»),
   con franjas de cine y el diálogo como subtítulo (orden del propietario,
   21/10/2026).
2. **Escala.** Lo colosal se cuenta con cámara pegada (zoom 2,1 → 1,0) y
   referencias pequeñas (naves del convoy). El villano llega de lejos
   (escala 0,07 → 1) en vez de aparecer de golpe sin motivo.
3. **Impacto en tres tiempos:** anticipación (silencio, oscuridad, carga) →
   golpe (destello corto, sacudida, empuje 1,0 → 1,08) → consecuencia
   (explosión, restos, la estación ya no vuelve entera).
4. **Un solo modelo por personaje.** Fotogramas del mismo modelo, misma
   escala y ancla; entre fotogramas, **fundido** del actual al siguiente
   (Cronos Prime) salvo golpes secos (el disparo entra en seco).
5. **Nada de láminas superpuestas.** Pintar ilustraciones enteras encima
   del juego se vio como un collage y se retiró. Tampoco piezas sueltas que
   no encajan (villano por piezas, grieta negra): retirados en v5.
6. **Resolución mínima de sprites: ~2× su tamaño lógico en pantalla.** El
   lienzo de 720 px se amplía ~1,83× en un iPhone de 1320 px de ancho, así
   que un sprite dibujado a 300 px lógicos ocupa ~550 px físicos y su
   original debe medir ~600 px. Caso real: las celdas de Cronos Prime miden
   400×400 (atlas 2400×1600, 6×4) y se dibujan a `W*.56` ≈ 403 px lógicos
   (≈ 740 px físicos): se amplían ~1,85×. Por eso se activó
   `imageSmoothingQuality = "high"`; para un jefe en primer plano conviene
   pedir celdas de ~800 px.
7. **Rótulo del jefe**: entra de golpe con aberración cromática; lo justo
   para presentarlo, sin tapar la zona de juego mucho tiempo.
8. **Jefe en combate:** su identidad y vida van en la franja ámbar bajo el
   HUD, no en un panel grande; la transmisión grande y las mejoras se
   ocultan mientras dura.

## 13. Encargos de arte a ChatGPT

Basado en `docs/design/DECISIONES_VIAJES_2026-10-20.md` §8 y
`docs/art/CATALOGO_ARTE.md`:

- **Fondo transparente real** (canal alfa), no un damero pintado ni negro.
  Bordes limpios, sin halo blanco. Comprobar sobre negro, blanco y damero.
- **Hojas de fotogramas:** celdas **uniformes** (misma medida, rejilla
  exacta, p. ej. 6 columnas × 4 filas), un fotograma por celda, sin texto ni
  números, sin bordes entre celdas.
- **Ancla común:** el centro (o el punto de anclaje que se indique) del
  personaje en el mismo píxel de cada celda; misma escala, misma luz y misma
  perspectiva en todas. Si no se consigue, pedir **por piezas** (cuerpo,
  anillos, cañones, núcleo) y animar en el código.
- **Resolución:** cada celda ≥ 2× el tamaño lógico al que se dibujará (ver
  §12.6). Planetas grandes para la llegada ≈ 2048 px; planetas lejanos en
  hojas de rotación de ~415 px por disco bastan.
- **Misma referencia y misma frase de estilo** en cada petición; ChatGPT
  como herramienta principal, Gemini solo para ideas.
- **Entrega y registro:** originales en `art-source/<tema>/` en WebP (sin
  pérdida si hay transparencia, calidad 92 si son opacos), nombre en
  español con versión (`tema_que_es_v1.webp`), `.json` con fecha, autor y
  SHA-256, y fila en `docs/art/CATALOGO_ARTE.md` (RECIBIDO → INTEGRADO →
  ACEPTADO).
- Cada encargo lleva una **ficha**: texto para pegar en ChatGPT,
  lista de piezas, medidas de celda y ancla.

## 14. Sí y no

**Sí**
- Usar los tokens `--ui-*` en toda pantalla nueva.
- Dar a cada amenaza nueva un brillo cálido y a cada recogible uno frío.
- Revisar con capturas reales (`capturas-juego`) a 390×844 y 320×568.
- Mantener los mandos de pulgar en su sitio en todos los contextos.

**No**
- No usar cian o azul en algo que hace daño, ni rojo en algo que se recoge.
- No poner texto sobre el arte sin velo.
- No añadir `backdrop-filter`, nuevas fuentes web ni otra paleta sin
  decisión del propietario.
- No aplicar reglas de diseño web que prohíben brillos, degradados o
  etiquetas de instrumento (p. ej. las de Taste Skill v2): aquí son parte
  de la identidad neón.
- No dar por aceptado nada visual sin verlo en iPhone físico.

## 15. Cómo ampliar este documento

1. Cambia un componente cada vez y referencia tokens (`{colors.ui-cyan}`),
   no valores sueltos.
2. Si añades un color en `styles.css` o en el lienzo, añádelo aquí en el
   mismo commit, con su papel.
3. Variantes (`-pressed`, `-empty`, `-tutorial`) como entradas propias.
4. No se usa ningún linter externo de DESIGN.md (requeriría descargarlo).

## 16. Lagunas conocidas

- **Aliados:** sin color ni forma definidos para naves amigas en juego.
- **Escala de espaciado:** sin definir; solo valores observados.
- **Tipografía real en iPhone:** Inter declarada pero no cargada; sin
  comprobar qué fuente ve el jugador.
- **Estados hover:** sin definir (juego táctil).
- **Mundos 2–10:** paletas solo en la dirección de arte; sin tokens de
  interfaz por mundo.
- **Cronos Prime:** celdas de 400 px, por debajo de la regla de 2×.
- Nada de esto está aceptado por el propietario en iPhone físico.
