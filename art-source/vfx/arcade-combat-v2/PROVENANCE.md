# Combate arcade — Pulso/Gemelo/Lanza/impacto v2

Fecha: 18/10/2026. Estado: **IN_REVIEW**. Arte generado y exportado para integración; no se presenta como captura de gameplay, aceptación artística ni certificación física.

## Archivos y uso

- `arcade-pulse-master-v2.png`: maestro original PNG RGBA, 1254×1254.
- `arcade-pulse-atlas-v2.webp`: copia de revisión idéntica a `assets/arcade_pulse_atlas_v2.webp`.
- `arcade-pulse-atlas-v2.json`: origen, hashes, rectángulos fuente y runtime, pivote, dimensiones, memoria estimada y reproducción.
- `export-arcade-pulse.mjs`: exportación reproducible con ImageMagick.
- `arcade-pulse-contact-sheet-dark.jpg`: contacto de revisión sobre fondo opaco; no imagen del juego.
- `verify-arcade-pulse-browser.cjs`, `arcade-pulse-browser-validation.json`, `arcade-pulse-chromium-composited.png`: verificación de decodificación/transparencia en Chromium; no prueba de combate.

Atlas optimizado: 1024×1024, cuatro filas y cuatro columnas; celdas de 256×256. Cada efecto posee un pivote normalizado(0.5,0.5) y apunta hacia arriba. Los cañones y los impactos no pertenecen a este maestro. La fila Gemelo contiene **una sola bala** de dos filamentos entrelazados por celda: la integración decide sus dos puntos de salida.

| Fila | Celdas | Uso | Duraciones propuestas |
| --- | --- | --- | --- |
| 0 | 0–3 | Pulso cian: núcleo, expansión, contracción y recuperación | 60ms por pose; ciclo240ms |
| 1 | 4–7 | Gemelo azul-blanco compacto, filamentos cambiantes | 50ms por pose; ciclo200ms |
| 2 | 8–11 | Lanza blanca-violeta, estrecha y penetrante | 55ms por pose; ciclo220ms |
| 3 | 12–15 | Contacto, astillas luminosas, fragmentación y disipación | 35/55/75/95ms; una vez260ms |

Los16 estados son visualmente distintos. El exportador registra hashes RGBA de cada celda **decodificada del WebP**, verifica alfa cero en sus bordes y conserva el maestro intacto. Se usa un recorte con registro horizontal sobre el núcleo brillante para que los proyectiles mantengan su eje. Los efectos se reempaquetan con transparencia; no se pintaron figuras mediante código ni se duplicaron poses. No se confunde la memoria WebP comprimida con los4MiB estimados del atlas RGBA, que excluyen GPU, Canvas y cachés.

La integración debe usar el reloj y la posición reales del proyectil. Ningún fotograma de impacto debe aplicar daño adicional. La orientación vertical ascendente es la orientación natural del dibujo; rotar90° produce un disparo lateral incorrecto. La corrección de anclajes y colisiones corresponde al código del juego y se verifica por separado.

## Procedencia y derechos

Generado mediante **OpenAI image_gen**, herramienta disponible en la sesión, a partir de una descripción original. Salida conservada: `/workspace/generated_images/exec-f53f3c9a-3a21-49ee-8eaf-3a7539a3607d.png`. Se inspeccionaron `assets/chronos_flight_weapons_v1.webp` y `assets/atlas_combat_vfx_v1.webp` para mantener coherencia; no se enviaron como imágenes de referencia a la generación. No se descargó stock, compraron licencias ni contrataron servicios externos. No se afirma un dictamen legal de derechos.

### Prompt de generación

A production-ready animated sci-fi arcade weapon VFX sprite atlas. SQUARE canvas. EXACTLY sixteen sprites in a precise evenly spaced regular FOUR COLUMNS by FOUR ROWS grid. Absolutely transparent alpha background, no black or checkerboard matte, no text, no grid lines or labels. Each sprite fully isolated with a WIDE transparent safety moat: its ENTIRE luminous glow and sparks must occupy at most 60 percent of its cell width and 65 percent of cell height. Effects NEVER cross a cell. Symmetrical artwork centered exactly at the midpoint of each cell, same fixed center through all four frames of a row. Keep all sprites readable at small mobile game size. Original illustrated high quality arcade effects, finely painted white-hot energy cores, beautiful restrained controlled colored neon bloom, tapered plasma wisps and sparks with crisp readable silhouettes. NO hardware, no guns, no spaceships, no planets, no UI. ALL PROJECTILES point straight UP, their bright leading tip above their center and their tapered trailing tail below, centered x within the cell. ROW ONE four distinct animated poses of a CYAN BLUE PULSE projectile: a narrow elegant upward pointed plasma dart, white-hot head and cyan tapered short trail, frame progression compact core, luminous peak, contracted twist, trail recovering. ROW TWO four distinct poses of a COMPACT BLUE-WHITE TWIN-WEAPON projectile: one SINGLE narrow bullet centered in each cell with two close intertwined blue-white energy strands around a compact central core, shorter than row one, energy pattern visibly changing between four frames. Do NOT draw two separate bullets side by side. ROW THREE four distinct poses of an elongated VIOLET WHITE PIERCING LANCE projectile: single very narrow straight vertical spear of white-hot energy and a purple filament corona, pointed UP and tapered below, four genuinely evolving energy patterns while preserving its fixed center and slender silhouette. ROW FOUR four sequential SMALL ENERGY HIT effects centered exactly in cell middle: frame1 initial compact blue-white contact flash, frame2 modest cyan and white splinters expanding, frame3 scattered fading cyan-violet energetic shards, frame4 tiny residual sparks disappearing. This is a short projectile contact impact, NOT a giant fireball or explosive cloud. All four row-four sprites must stay compact. Four frames in EVERY row represent genuine evolving forms, not duplicates, never move the effect pivot or vary the main projectile size more than a few percent. Professional original 2D game art on true transparency, clean technical atlas spacing.

## Límites de revisión

La variación del brillo entre poses es intencionada; la aceptación de su intensidad y escala en móvil queda pendiente. La generación puede producir pequeñas diferencias de registro y partículas. No existe aquí prueba de enemigo derrotado, cadencia, efectos sonoros ni controles: los certifica el responsable de integración dentro del ejecutable.
