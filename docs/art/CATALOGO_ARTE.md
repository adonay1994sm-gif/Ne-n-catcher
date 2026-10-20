# Catálogo del arte entregado por el propietario

Lista única de las imágenes que el propietario genera (sobre todo con
ChatGPT) y entrega a Claude. Claude decide qué se aprovecha, cómo se llama y
para qué se usa. Las cifras de uso son decisiones reversibles.

## Cómo se guarda

- Originales en `art-source/<tema>/`, en **WebP**: sin pérdida si tienen
  transparencia, calidad 92 si son opacos (a simple vista iguales al PNG y
  4–8 veces más ligeros; el repositorio es público y ya pesa unos 700 MB).
- Cada carpeta tiene un `.json` con fecha, autor, huella SHA-256 y notas.
- Nombres en español, en minúsculas y con versión: `tema_que_es_v1.webp`.
- Estado: **RECIBIDO** (guardado, sin usar) → **INTEGRADO** (en el juego,
  con prueba) → **ACEPTADO** (el propietario lo ha visto en su iPhone).

## Entregas

### 20/10/2026 · Planetas en rotación — `art-source/planetas/`

| Archivo | Planeta | Uso previsto | Estado |
|---|---|---|---|
| `vulkar_planeta_rotacion_v1.webp` | **Vulkar** (lava) | Destino del viaje 2, origen del 3 | RECIBIDO |
| `cryon_planeta_rotacion_v1.webp` | **Cryon** (hielo) | Destino del viaje 4 | RECIBIDO |
| `aether_planeta_rotacion_v1.webp` | **Aether** (tormenta violeta) | Destino del viaje 6 | RECIBIDO |
| `talasa_planeta_rotacion_v1.webp` | **Tálasa**, nombre nuevo: el planeta que orbita Chronos (océano y tormentas azules) | Fondo del inicio de Chronos, se queda atrás al huir | INTEGRADO |

Cada hoja: 7 vistas de una rotación lenta, discos de unos 415 px, fondo
transparente real y bordes limpios. La última vista no enlaza con la primera,
así que el giro se hará de ida y vuelta o con fundidos.

**Limitación:** 415 px bastan para ver el planeta lejos o a media distancia.
Para la **llegada**, cuando el planeta ocupa media pantalla o más, hará falta
una vista grande de cada uno (ver «Pendiente»).

### 20/10/2026 · Inicio de Chronos — `art-source/chronos-inicio/`

| Archivo | Entrega nº | Qué es | Estado |
|---|---|---|---|
| `chronos_estacion_a_v1.webp` | 1 | Estación intacta (diseño elegido: coincide con la explosión) | RECIBIDO |
| `chronos_estacion_b_v1.webp` | 2 | Variante con cúpulas y luces rojas; no coincide con la explosión | RECIBIDO, sin uso |
| `chronos_ruptura_01_v1.webp` … `_10_v1.webp` | 12, 3, 4, 5, 7, 6, 8, 9, 10, 11 | Secuencia de la ruptura, de los anillos que se rompen al destello final | INTEGRADO |

Uso previsto: fondo animado del inicio mientras ya se pilota (sin paradas),
con la cámara alejándose, el corte a la explosión oculto por el destello del
disparo y los elementos del juego por encima. Ver `docs/design/BIBLIA_HISTORIA.md`
§7. Pendiente de la estación por piezas que el propietario pedirá a ChatGPT.

### 20/10/2026 · Estación por piezas (segunda entrega) — `art-source/chronos-inicio/`

| Archivo | Qué es | Uso previsto | Estado |
|---|---|---|---|
| `chronos_estacion_por_piezas_completa_v1.webp` | Estación completa con torre de cristal, transparente | Estación intacta del inicio | RECIBIDO |
| `chronos_pieza_rueda_v1.webp` | Anillo interior con 8 brazos, vista cenital | Gira; al romperse sale despedida girando | INTEGRADO |
| `chronos_pieza_anillo_exterior_v1.webp` | Anillo exterior, **en perspectiva** | Se estira ×1,243 en vertical para encajar; gira en sentido contrario y se separa | INTEGRADO |
| `chronos_fondo_tras_ruptura_v1.webp` | Fondo con Tálasa y relámpagos, sin estación | Fondo justo después de la ruptura | RECIBIDO |

Comprobado: rueda + anillo corregido encajan como una estación; la completa
queda bien sobre el fondo. Diferencias de estilo menores con las ilustraciones
de la ruptura (estas piezas son algo más oscuras); el destello del disparo
oculta el cambio.

### 20/10/2026 · Torre y fragmentos (tercera entrega) — `art-source/chronos-inicio/`

| Archivo | Qué es | Uso previsto | Estado |
|---|---|---|---|
| `chronos_pieza_torre_intacta_v1.webp` | Torre de cristal encendida sobre su base | Centro de la estación antes del disparo | INTEGRADO |
| `chronos_pieza_torre_rota_v1.webp` | Torre partida y apagada, con chispas | Cambio instantáneo al recibir el disparo (misma base y posición, comprobado) | INTEGRADO |
| `chronos_pieza_fragmento_01_v1.webp` … `_08_v1.webp` | 8 restos sueltos (tramos de anillo, módulos, brazos) | Salen despedidos girando hacia la nave | INTEGRADO |
| `chronos_pieza_rueda_inclinada_v1.webp` | Rueda vista en ángulo con brazos sueltos | Fase de ruptura: la rueda se inclina al separarse | INTEGRADO |
| `chronos_pieza_anillo_exterior_antenas_v1.webp` | Anillo exterior con antenas, en perspectiva | Alternativa más detallada al anillo exterior | RECIBIDO |

Con esta entrega la estación queda completa por piezas: ya se puede romper
de verdad dentro del juego.

### 20/10/2026 · Cronos Prime, fase 1 — `art-source/cronos-prime/`

| Archivo | Qué es | Uso previsto | Estado |
|---|---|---|---|
| `cronos_prime_f1_nucleo_v1.webp` | Núcleo blindado con anillos y garras | Centro del jefe; late y se abre | INTEGRADO |
| `cronos_prime_f1_ala_v1.webp` | Ala de cuchillas con anillos de energía (izquierda) | Las dos alas (la derecha en espejo); se abren y giran | INTEGRADO |
| `cronos_prime_f1_cuchilla_superior_v1.webp` | Cuchilla superior (izquierda) | Las dos superiores (la derecha en espejo) | INTEGRADO |
| `cronos_prime_f1_haz_v1.webp` | Haz vertical con espirales | Columna de energía que parpadea | INTEGRADO |
| `cronos_prime_nucleo_energia_v1.webp` | Esfera de energía pura | Corazón brillante bajo el núcleo | RECIBIDO |
| `cronos_prime_descargas_v1.webp` | 6 descargas eléctricas | Efectos de Cronos Prime y de la ruptura de Chronos | RECIBIDO |

Montaje de comprobación: `docs/art/montaje_cronos_prime_fase1.png` (reproduce
la fase 1 del dosier). Primera entrega descartada (anillos y esfera blancos sin
alas). Uso: Cronos Prime despierta y destruye Chronos en el inicio; combate
final en el viaje 10.

### Integración en el juego (20/10/2026)

`scripts/build-chronos-intro-assets.py` empaqueta las piezas en `assets/`:
`chronos_intro_station_atlas_v1.webp` (anillo, rueda, rueda inclinada, torres
y Tálasa), `chronos_intro_fragments_atlas_v1.webp`,
`cronos_prime_phase1_atlas_v1.webp`. Las seis láminas de la ruptura que se
probaron de fondo se retiraron (el propietario las vio como un collage).
Sin usar todavía: estación completa, variante B, anillo con antenas, fondo
tras la ruptura, esfera de energía y descargas.

### 20/10/2026 · Vídeo de Cronos Prime y estallido de la estación

| Archivo | Qué es | Uso | Estado |
|---|---|---|---|
| `art-source/cronos-prime/cronos_prime_f1_video_croma_v1.mp4` | Vídeo de Gemini con croma verde, 1280×720, 24 fps: reposo, despertar, carga, disparo, enfriamiento | Se recorta el verde y se sacan 40 fotogramas de 512 (`cronos_prime_video_atlas_v1`); cuerpo ~480 px | INTEGRADO |
| `art-source/chronos-inicio/chronos_estacion_estallido_a/b/c_v1.webp` | La estación estallando (3 hojas de 5) | a + b → `chronos_station_burst_atlas_v1` (10 fotogramas); c sin usar | INTEGRADO |

## Sitio de assets del propietario

El propietario publica sus entregas en
https://neon-cronium-video-referencia.chictide18.chatgpt.site (catálogo en
`catalog.json`: animaciones, piezas y descargas). Revisado el 20/10/2026:

| Colección | Qué hay | Uso en el juego |
|---|---|---|
| Cronos Prime · fase 1 (animación, giro, ataque leve/medio/máximo, rotación completa ×3) | Hojas de celdas de 512 | El cuerpo ocupa **~350 px** dentro de cada celda (igual que la entrega anterior): no ganan nitidez. El ataque máximo tiene un haz más grande. |
| Cronos Prime · complementos | Ojo con iris (2048), vista de tres cuartos (2048) | Alta resolución, estáticos: primeros planos. |
| Cronos Prime · fases 2 y 3, núcleo y energía | Piezas a 2048 | Combate final (viaje 10). |
| Estación espacial | Piezas a 2048 y fondo vertical 1080×1920 | Pueden sustituir a las piezas actuales con más nitidez. |
| Explosión azul | 8 celdas de 512 | Ya integrada (misma explosión). |
| Planetas | 4 hojas de 7 vistas | Ya recibidas (Vulkar, Cryon, Aether, Tálasa). |
| Dron explorador (Gaia Nova) | 8 fotogramas, demo en revisión | Enemigo futuro. |

**Para ganar nitidez de verdad** en iPhone, cada fotograma debe tener el
cuerpo ocupando casi toda la celda y celdas de ≥ 768–1024 px (en pantalla se
dibuja a unos 700 px reales).

## Pendiente de pedir (sugerencias de Claude)

| Qué | Para qué | Notas para ChatGPT |
|---|---|---|
| Fondo tranquilo (sin relámpagos) | Antes del ataque | Mismo fondo que `chronos_fondo_tras_ruptura_v1` pero en calma |
| Vista grande de cada planeta (≈2048 px) | La llegada, cuando el planeta llena la pantalla | Una sola imagen, misma cara que la vista 1 de su hoja, fondo transparente |
| Gaia en rotación (como las de esta entrega) | Que Gaia combine con los demás planetas | Mismo estilo y tamaño que estas hojas |
| Titan Omega en rotación | Destino del viaje 8 | Planeta naranja industrial, mismo estilo |
| CH-03 por piezas | Jefe intermedio del viaje 1 | Anillo exterior, núcleo rojo, 8 emisores sueltos |
