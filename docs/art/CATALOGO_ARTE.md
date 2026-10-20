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
| `talasa_planeta_rotacion_v1.webp` | **Tálasa**, nombre nuevo: el planeta que orbita Chronos (océano y tormentas azules) | Fondo del inicio de Chronos, se queda atrás al huir | RECIBIDO |

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
| `chronos_ruptura_01_v1.webp` … `_10_v1.webp` | 12, 3, 4, 5, 7, 6, 8, 9, 10, 11 | Secuencia de la ruptura, de los anillos que se rompen al destello final | RECIBIDO |

Uso previsto: fondo animado del inicio mientras ya se pilota (sin paradas),
con la cámara alejándose, el corte a la explosión oculto por el destello del
disparo y los elementos del juego por encima. Ver `docs/design/BIBLIA_HISTORIA.md`
§7. Pendiente de la estación por piezas que el propietario pedirá a ChatGPT.

## Pendiente de pedir (sugerencias de Claude)

| Qué | Para qué | Notas para ChatGPT |
|---|---|---|
| Estación 1 por piezas | Romper la estación de verdad en el juego | Ver la lista de 7 piezas acordada en el chat del 20/10 |
| Vista grande de cada planeta (≈2048 px) | La llegada, cuando el planeta llena la pantalla | Una sola imagen, misma cara que la vista 1 de su hoja, fondo transparente |
| Gaia en rotación (como las de esta entrega) | Que Gaia combine con los demás planetas | Mismo estilo y tamaño que estas hojas |
| Titan Omega en rotación | Destino del viaje 8 | Planeta naranja industrial, mismo estilo |
| CH-03 por piezas | Jefe intermedio del viaje 1 | Anillo exterior, núcleo rojo, 8 emisores sueltos |
