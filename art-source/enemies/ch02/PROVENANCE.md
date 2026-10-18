# CH-02 Interceptor — producción del 18/10/2026

Estado: **IN_REVIEW**. Arte/animador comprobados en aislamiento y aparición, flanqueo, aviso, disparo, pausa y daño observados en el juego. Paquete final33263c5, web privada15; smoke Gaia4/4, actualización/offline5/5. La destrucción natural no se certificó: los intentos ampliados y el balance humano permanecen pendientes. Aceptación artística/física pendientes. Ver [informe de integración](../../../docs/production-reports/CHRONOS_PURSUIT_GAIA_2026-10-18.md). Los datos de producción siguientes conservan su procedencia.

## Diseño y archivos

Interceptor de Gaia con fuselaje de titanio, alas rojas, dos góndolas de propulsión y dos cañones desplegables. Frente hacia abajo; lectura hostil diferenciada de la nave modular y del CH-01 estrecho. Se inspeccionaron `assets/ch01_atlas_v1.webp`, su maestro y `assets/ship_modular_atlas_v1.webp` para coherencia; no se suministraron como referencia de generación.

- `ch02-master-v1.png`: generación original conservada, PNG RGBA 1254×1254.
- `ch02-master-v2.png`: corrección mediante image_gen, PNG RGBA 1254×1254.
- `ch02-atlas-v1.webp`: exportación de revisión, idéntica a `assets/ch02_interceptor_atlas_v1.webp`.
- `ch02-atlas-v1.json`: identificación, rectángulos fuente/runtime, pivote, orientación, animaciones, tiempos, eventos, dimensiones, hashes y límites.
- `ch02-contact-sheet-dark.jpg`: contacto de revisión, **no captura del juego**.
- `export-ch02.mjs`: exportación reproducible con ImageMagick; no dependencia del runtime.

Exportación runtime: 1024×1024, 16 celdas de 256×256, dibujo máximo de 224×224 con transparencia alrededor, pivote normalizado (0.5,0.5). 4 MiB de RGBA decodificado estimado, excluye GPU/caché. Calidad WebP86 y alfa100. Las filas generadas no estaban registradas a intervalos exactos: se conservan rectángulos fuente explícitos y se repaquetan sin inventar estados ni pintar nuevos objetos. No se duplicó una imagen como si fueran animaciones distintas. Cada celda tiene un hash RGBA propio y bordes alfa cero comprobados durante la exportación.

## Estados

| Celdas | Representación |
| --- | --- |
| 0–3 | Propulsión baja/alta, giro a izquierda y derecha |
| 4–7 | Despliegue y carga, emisión con fogonazos, retroceso, recuperación |
| 8–11 | Impacto localizado, blindaje roto, motor averiado y humo persistente |
| 12–15 | Fuselaje fracturado, explosión estructural, fragmentación, residuos y humo |

`createCh02Animator` consume el tiempo del ciclo existente. El evento `fire` se entrega una sola vez por ataque a los160ms, al entrar en la celda5 con emisión ilustrada. Un impacto puede interrumpir el ataque y devuelve `attackCanceled`; no existe reintento oculto. Destrucción entrega `coreBurst` y finalmente `removeVisual` una sola vez. La colisión y la recompensa pertenecen al juego, no al animador. Las poses pueden presentar pequeñas variaciones de registro propias de la generación; no se presenta esta secuencia como animación esquelética perfecta.

## Procedencia y derechos

Herramienta: **OpenAI image_gen**, disponible en la sesión. No se contrataron servicios, compraron licencias ni descargaron gráficos de terceros. El diseño original se generó para NEON CRONIUM; la segunda llamada editó exclusivamente la primera generación. No se afirma un dictamen legal sobre derechos ni se atribuye la autoría a una persona externa.

Salidas conservadas:

1. `/workspace/generated_images/exec-82980262-9067-4dce-adb2-589ed069ef5b.png`
2. `/workspace/generated_images/exec-70db54ea-4dff-402e-b4cb-2524f0dee78d.png`

### Prompt original

Create a production-ready game sprite atlas on a transparent background. EXACTLY sixteen square sprite cells arranged as a regular 4 columns by 4 rows grid in a SQUARE image. No typography, no labels, no borders, no grid lines. Each individual cell contains exactly one centered alien mechanical INTERCEPTOR fighter craft viewed vertically from directly above with its long pointed NOSE aimed DOWN toward the bottom edge of the image; engines above. Clear stylized realistic arcade science-fiction hard-surface detail, ivory titanium armor, dark red angular wing fins, graphite mechanisms, small cyan reactor and RED weapon emission, two distinct engine nacelles and two separate wing cannons, recognizably a fast dangerous fighter rather than a sphere/drone or a human player spacecraft. The SAME designed interceptor, same scale and centered pivot, full silhouette fits safely inside every cell with at least 10 percent transparent padding. No copied franchise designs. ROW ONE is four actual navigation poses: forward engines low, forward engines bright, bank left showing slight foreshortening with the nose still generally down, bank right. ROW TWO is a clearly chronological firing action with mechanical changes: frame1 cannons beginning to deploy and red warning charging; frame2 cannons fully deployed and an actual bright RED MUZZLE FLASH on the two bottom-pointing cannons (this is the one shot emission moment); frame3 recoil with smaller residual red energy and armor shifted backward; frame4 weapons fold back with red heat dissipating, no muzzle flash. ROW THREE is authentic sequential damage: one wing hit with localized white-orange sparks; opposite shoulder armor ruptures and a panel flies off; one engine damaged with smoke and broken armor; persistent dark burning damaged fuselage still recognizable. ROW FOUR is a progressive destruction sequence: cracking ship with bright energy escaping; first structural explosion splits wings outward; many scattered recognizable metal hull fragments with cyan core bursting; small fading debris and smoke only, almost no intact craft. IMPORTANT: Art and effects must never cross between cells. Different frames must contain genuine visible mechanical/silhouette changes. Every craft must face nose DOWN. Whole canvas fully TRANSPARENT outside artwork; no matte black, no checkerboard baked in. Original high quality game asset, crisp silhouettes at small mobile-game size, strong material contrast.

### Prompt de corrección

Correct this game sprite atlas for technical usability, retaining the EXACT SAME white titanium/dark red interceptor design and all sixteen state poses. Keep a square canvas and precisely 4 columns by 4 rows. CRITICAL FIX: SHRINK the art inside EVERY cell so the ship including ALL exhaust, smoke, sparks and destruction fragments occupies at most 70 percent of that cell's width AND height, with a completely TRANSPARENT safety moat of at least 15 percent on ALL FOUR sides of every cell. Absolutely NO art, shadows, smoke, faint alpha or particles can cross a cell boundary. Entirely transparent gutters between cells. Rows stay navigation, firing preparation/fire/recoil/recovery, sequential damage, progressive destruction. All ships nose DOWN. Do not crop ship noses or engines. Align center of fuselage pivot identically in all navigation and attack cells. Keep first two ships in the first row pointed straight down, third bank left, fourth bank right. Four attack poses must clearly differ: weapons deploy, two bright red downward cannon MUZZLE FLASHES, recoil, cool-down. Same precise regular grid, no labels, no borders. Retain excellent crisp game illustration style, original mechanical detail and silhouette. Do not add a background. Truly transparent alpha outside each isolated sprite.
