# Encargos de arte para GPT · NEON CRONIUM

Actualizado: 2026-10-24. Lista pública que se mantiene al día desde el tablero del proyecto.
Versión para máquinas: https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/art/encargos-gpt.json

**Antes de nada lee la guía:** https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/art/GUIA_GPT.md (qué es el juego, modelos de referencia y reglas).

## Cómo trabajar

1. Haz los encargos por orden: prioridad 1 primero.
2. Sube cada resultado al baúl (https://neon-cronium-video-referencia.chictide18.chatgpt.site) en la carpeta `encargos/` con el nombre indicado en «Archivo».
3. Añádelo a `catalog.json` con el campo `"encargo"` igual al id del encargo.
4. Si pide varias imágenes, numéralas: `encargo-<id>-v1-1.png`, `-2.png`…
5. Respeta medidas, rejilla y fondo (transparente salvo que el prompt pida opaco): el juego recorta las celdas por tamaño exacto.
6. Revisa esta lista cada 10 minutos. Antes de empezar un encargo, mira `catalog.json` del baúl: si ya hay un archivo con su id en `"encargo"`, no lo repitas.

## Arte: marcos de botón vacíos de la pantalla principal (normal, pulsado y bloqueado)

- **Id:** `art-menu-marcos` · **Prioridad:** 1 · **Archivo:** `encargo-art-menu-marcos-v1.png`
- **Para qué:** Las maquetas de botones traen el texto pintado y no se pueden usar tal cual: el juego tiene que escribir JUGAR o CONTINUAR VIAJE, el tramo en el que vas, etc. El engranaje, el icono de la ruta y la casilla de la flecha se recortan de la maqueta (tienen transparencia). El propietario se lo pide a GPT.

```text
Antes de empezar lee https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/art/GUIA_GPT.md. Modelo de referencia (la maqueta de botones de la pantalla principal, con transparencia): https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/art-source/ui/menu-principal/maqueta_botones_lista_v1.webp

Necesito los marcos de esos botones VACÍOS para que el juego escriba los textos. Mismo estilo, misma luz y misma paleta que la maqueta (marco metálico oscuro, borde cian, luces naranjas en las esquinas y barra cian vertical a la izquierda). Fondo transparente real (canal alfa, no damero), bordes limpios y sin halo.

Imagen 1, MARCO NORMAL: 1328×200 px. Sin texto, sin imagen dentro, sin flecha y sin casilla de flecha. Interior azul noche con la textura sutil de la maqueta.
- Tiene que poder estirarse a lo ancho: todos los detalles (esquinas, luces, barra cian) en los 170 px de cada extremo; la franja central, lisa y repetible, sin detalles únicos.

Imagen 2, MARCO PULSADO: el mismo, píxel a píxel en la misma posición, con el borde cian más brillante y el interior algo más claro.

Imagen 3, MARCO BLOQUEADO: el mismo, apagado: sin brillo cian, luces de las esquinas apagadas, metal gris azulado.

Entrega: tres archivos numerados (-1 normal, -2 pulsado, -3 bloqueado) y en catalog.json "encargo": "art-menu-marcos".
```

## Arte · Portal dimensional de Cronos Prime (llegada y salida)

- **Id:** `camp-art-portal-cronos` · **Prioridad:** 1 · **Archivo:** `encargo-camp-art-portal-cronos-v1.png`
- **Para qué:** Propietario, 24/10: Cronos Prime llega y se va por un portal dimensional en lugar de con la estela magenta, que no encajaba con el fondo. Hoy el juego usa de forma provisional la esfera de energía achatada.

```text
Antes de empezar lee https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/art/GUIA_GPT.md y la biblia https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/design/BIBLIA_GALAXIA.md. Modelo de referencia de Cronos Prime: https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/art-source/cronos-prime/cronos_prime_f1_haz_v1.webp. Portal dimensional por el que Cronos Prime entra y sale de la escena del inicio de NEON CRONIUM. Hoja de 4 columnas × 3 filas, celdas de 512×512 px (2048×1536). Vista frontal, el portal centrado en cada celda, 420 px de diámetro cuando está abierto. Fila 1: apertura en 4 fotogramas (una grieta de luz que se abre en espiral). Fila 2: abierto, 4 fotogramas en bucle (el anillo gira y los arcos cambian). Fila 3: cierre en 4 fotogramas (se contrae y se apaga con un destello). Anillo de energía violeta temporal (#8F6BFF y #C7B8FF, con el núcleo de la luz casi blanco) y finos arcos eléctricos; el interior es un vacío negro azulado con estrellas deformadas por la lente. Tiene que integrarse con un espacio azul muy oscuro y un planeta azul: nada de magenta ni rosa saturado, nada de cian. Estilo: arte de juego sci-fi pintado y semirrealista, como Cronos Prime y Atlas de NEON CRONIUM, luz fría. Rejilla exacta de celdas iguales; el centro del portal en el mismo píxel de cada celda, misma escala, luz y perspectiva. Fondo transparente real con canal alfa (sin damero pintado ni negro), bordes limpios sin halo blanco, sin texto ni números ni líneas entre celdas. Comprueba sobre negro, blanco y damero.
```

## Arte · Nave 05 Arpón: colores nuevos

- **Id:** `camp-art-nave-arpon` · **Prioridad:** 2 · **Archivo:** `encargo-camp-art-nave-arpon-v1.png`
- **Para qué:** Concepto de flota aprobado por el propietario el 24/10 (https://claude.ai/artifact/6KmCsopxEWoBbrK76jKiKx). Exclusiva: Arpón (engancha a un enemigo). Última: Riel (cañón de riel).

```text
Antes de empezar lee https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/art/GUIA_GPT.md y la biblia https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/design/BIBLIA_GALAXIA.md. Recolorea la lámina de la nave Arpón de NEON CRONIUM: https://neon-cronium-hangar-galeria.chictide18.chatgpt.site/assets/05-arpon-poses-despiece.png. Mantén exactamente la silueta, las piezas, las cinco poses (neutral, alabeo izquierdo, alabeo derecho, aceleración y frenado) y el despiece, con la misma composición, posiciones y escala que la lámina original. Solo cambian los colores: casco #C9CED6, detalles y adornos #15181C, cabina, luces y llama de los propulsores #A6F3FF. Los brillos siempre fríos: nada de rojo, naranja ni ámbar (son de las amenazas) ni violeta (es del tiempo, de Cronos Prime). Su habilidad exclusiva es Arpón (engancha a un enemigo) y su última, Riel (cañón de riel): que la paleta lo sugiera, sin añadir piezas. Estilo: arte de juego sci-fi pintado y semirrealista, vista cenital estricta, blindaje con paneles y juntas visibles, luz fría de estudio desde arriba a la izquierda. Fondo transparente real con canal alfa (sin damero pintado ni negro), bordes limpios sin halo blanco, sin texto ni números ni líneas entre celdas. Comprueba sobre negro, blanco y damero.
```

## Arte · Nave 01 Astér: colores nuevos

- **Id:** `camp-art-nave-aster` · **Prioridad:** 2 · **Archivo:** `encargo-camp-art-nave-aster-v1.png`
- **Para qué:** Concepto de flota aprobado por el propietario el 24/10 (https://claude.ai/artifact/6KmCsopxEWoBbrK76jKiKx). Exclusiva: Salto de fase (esquiva lateral). Última: Lluvia de estrellas (24 dardos de luz).

```text
Antes de empezar lee https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/art/GUIA_GPT.md y la biblia https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/design/BIBLIA_GALAXIA.md. Recolorea la lámina de la nave Astér de NEON CRONIUM: https://neon-cronium-hangar-galeria.chictide18.chatgpt.site/assets/01-aster-poses-despiece.png. Mantén exactamente la silueta, las piezas, las cinco poses (neutral, alabeo izquierdo, alabeo derecho, aceleración y frenado) y el despiece, con la misma composición, posiciones y escala que la lámina original. Solo cambian los colores: casco #EDE6D6, detalles y adornos #3E5566, cabina, luces y llama de los propulsores #5CF5FF. Los brillos siempre fríos: nada de rojo, naranja ni ámbar (son de las amenazas) ni violeta (es del tiempo, de Cronos Prime). Su habilidad exclusiva es Salto de fase (esquiva lateral) y su última, Lluvia de estrellas (24 dardos de luz): que la paleta lo sugiera, sin añadir piezas. Estilo: arte de juego sci-fi pintado y semirrealista, vista cenital estricta, blindaje con paneles y juntas visibles, luz fría de estudio desde arriba a la izquierda. Fondo transparente real con canal alfa (sin damero pintado ni negro), bordes limpios sin halo blanco, sin texto ni números ni líneas entre celdas. Comprueba sobre negro, blanco y damero.
```

## Arte · Nave 02 Bastión: colores nuevos

- **Id:** `camp-art-nave-bastion` · **Prioridad:** 2 · **Archivo:** `encargo-camp-art-nave-bastion-v1.png`
- **Para qué:** Concepto de flota aprobado por el propietario el 24/10 (https://claude.ai/artifact/6KmCsopxEWoBbrK76jKiKx). Exclusiva: Muralla (escudo frontal). Última: Fortaleza (cúpula que devuelve disparos).

```text
Antes de empezar lee https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/art/GUIA_GPT.md y la biblia https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/design/BIBLIA_GALAXIA.md. Recolorea la lámina de la nave Bastión de NEON CRONIUM: https://neon-cronium-hangar-galeria.chictide18.chatgpt.site/assets/02-bastion-poses-despiece.png. Mantén exactamente la silueta, las piezas, las cinco poses (neutral, alabeo izquierdo, alabeo derecho, aceleración y frenado) y el despiece, con la misma composición, posiciones y escala que la lámina original. Solo cambian los colores: casco #3A3F47, detalles y adornos #B0834A, cabina, luces y llama de los propulsores #3EE6C8. Los brillos siempre fríos: nada de rojo, naranja ni ámbar (son de las amenazas) ni violeta (es del tiempo, de Cronos Prime). Su habilidad exclusiva es Muralla (escudo frontal) y su última, Fortaleza (cúpula que devuelve disparos): que la paleta lo sugiera, sin añadir piezas. Estilo: arte de juego sci-fi pintado y semirrealista, vista cenital estricta, blindaje con paneles y juntas visibles, luz fría de estudio desde arriba a la izquierda. Fondo transparente real con canal alfa (sin damero pintado ni negro), bordes limpios sin halo blanco, sin texto ni números ni líneas entre celdas. Comprueba sobre negro, blanco y damero.
```

## Arte · Nave 09 Eclipse: colores nuevos

- **Id:** `camp-art-nave-eclipse` · **Prioridad:** 2 · **Archivo:** `encargo-camp-art-nave-eclipse-v1.png`
- **Para qué:** Concepto de flota aprobado por el propietario el 24/10 (https://claude.ai/artifact/6KmCsopxEWoBbrK76jKiKx). Exclusiva: Sombra (invisible 2 s). Última: Eclipse total (detiene el tiempo 3 s).

```text
Antes de empezar lee https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/art/GUIA_GPT.md y la biblia https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/design/BIBLIA_GALAXIA.md. Recolorea la lámina de la nave Eclipse de NEON CRONIUM: https://neon-cronium-hangar-galeria.chictide18.chatgpt.site/assets/09-eclipse-poses-despiece.png. Mantén exactamente la silueta, las piezas, las cinco poses (neutral, alabeo izquierdo, alabeo derecho, aceleración y frenado) y el despiece, con la misma composición, posiciones y escala que la lámina original. Solo cambian los colores: casco #1A1E26, detalles y adornos #B9C2CC, cabina, luces y llama de los propulsores #9FD8FF. Los brillos siempre fríos: nada de rojo, naranja ni ámbar (son de las amenazas) ni violeta (es del tiempo, de Cronos Prime). Su habilidad exclusiva es Sombra (invisible 2 s) y su última, Eclipse total (detiene el tiempo 3 s): que la paleta lo sugiera, sin añadir piezas. Estilo: arte de juego sci-fi pintado y semirrealista, vista cenital estricta, blindaje con paneles y juntas visibles, luz fría de estudio desde arriba a la izquierda. Fondo transparente real con canal alfa (sin damero pintado ni negro), bordes limpios sin halo blanco, sin texto ni números ni líneas entre celdas. Comprueba sobre negro, blanco y damero.
```

## Arte · Nave 04 Mantarraya: colores nuevos

- **Id:** `camp-art-nave-mantarraya` · **Prioridad:** 2 · **Archivo:** `encargo-camp-art-nave-mantarraya-v1.png`
- **Para qué:** Concepto de flota aprobado por el propietario el 24/10 (https://claude.ai/artifact/6KmCsopxEWoBbrK76jKiKx). Exclusiva: Estela (daña lo que viene por detrás). Última: Marea (onda que barre la pantalla).

```text
Antes de empezar lee https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/art/GUIA_GPT.md y la biblia https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/design/BIBLIA_GALAXIA.md. Recolorea la lámina de la nave Mantarraya de NEON CRONIUM: https://neon-cronium-hangar-galeria.chictide18.chatgpt.site/assets/04-mantarraya-poses-despiece.png. Mantén exactamente la silueta, las piezas, las cinco poses (neutral, alabeo izquierdo, alabeo derecho, aceleración y frenado) y el despiece, con la misma composición, posiciones y escala que la lámina original. Solo cambian los colores: casco #1E4A66, detalles y adornos #2EC4B6, cabina, luces y llama de los propulsores #7FFFE0. Los brillos siempre fríos: nada de rojo, naranja ni ámbar (son de las amenazas) ni violeta (es del tiempo, de Cronos Prime). Su habilidad exclusiva es Estela (daña lo que viene por detrás) y su última, Marea (onda que barre la pantalla): que la paleta lo sugiera, sin añadir piezas. Estilo: arte de juego sci-fi pintado y semirrealista, vista cenital estricta, blindaje con paneles y juntas visibles, luz fría de estudio desde arriba a la izquierda. Fondo transparente real con canal alfa (sin damero pintado ni negro), bordes limpios sin halo blanco, sin texto ni números ni líneas entre celdas. Comprueba sobre negro, blanco y damero.
```

## Arte · Nave 08 Nómada: colores nuevos

- **Id:** `camp-art-nave-nomada` · **Prioridad:** 2 · **Archivo:** `encargo-camp-art-nave-nomada-v1.png`
- **Para qué:** Concepto de flota aprobado por el propietario el 24/10 (https://claude.ai/artifact/6KmCsopxEWoBbrK76jKiKx). Exclusiva: Imán (atrae CRONIUM y chatarra). Última: Forja móvil (reparación total).

```text
Antes de empezar lee https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/art/GUIA_GPT.md y la biblia https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/design/BIBLIA_GALAXIA.md. Recolorea la lámina de la nave Nómada de NEON CRONIUM: https://neon-cronium-hangar-galeria.chictide18.chatgpt.site/assets/08-nomada-poses-despiece.png. Mantén exactamente la silueta, las piezas, las cinco poses (neutral, alabeo izquierdo, alabeo derecho, aceleración y frenado) y el despiece, con la misma composición, posiciones y escala que la lámina original. Solo cambian los colores: casco #CDBB94, detalles y adornos #5B6670, cabina, luces y llama de los propulsores #5CF5FF. Los brillos siempre fríos: nada de rojo, naranja ni ámbar (son de las amenazas) ni violeta (es del tiempo, de Cronos Prime). Su habilidad exclusiva es Imán (atrae CRONIUM y chatarra) y su última, Forja móvil (reparación total): que la paleta lo sugiera, sin añadir piezas. Estilo: arte de juego sci-fi pintado y semirrealista, vista cenital estricta, blindaje con paneles y juntas visibles, luz fría de estudio desde arriba a la izquierda. Fondo transparente real con canal alfa (sin damero pintado ni negro), bordes limpios sin halo blanco, sin texto ni números ni líneas entre celdas. Comprueba sobre negro, blanco y damero.
```

## Arte · Nave 06 Orión: colores nuevos

- **Id:** `camp-art-nave-orion` · **Prioridad:** 2 · **Archivo:** `encargo-camp-art-nave-orion-v1.png`
- **Para qué:** Concepto de flota aprobado por el propietario el 24/10 (https://claude.ai/artifact/6KmCsopxEWoBbrK76jKiKx). Exclusiva: Alas (dos drones laterales). Última: Constelación (seis drones en estrella).

```text
Antes de empezar lee https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/art/GUIA_GPT.md y la biblia https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/design/BIBLIA_GALAXIA.md. Recolorea la lámina de la nave Orión de NEON CRONIUM: https://neon-cronium-hangar-galeria.chictide18.chatgpt.site/assets/06-orion-poses-despiece.png. Mantén exactamente la silueta, las piezas, las cinco poses (neutral, alabeo izquierdo, alabeo derecho, aceleración y frenado) y el despiece, con la misma composición, posiciones y escala que la lámina original. Solo cambian los colores: casco #24345C, detalles y adornos #D8C08A, cabina, luces y llama de los propulsores #E8FBFF. Los brillos siempre fríos: nada de rojo, naranja ni ámbar (son de las amenazas) ni violeta (es del tiempo, de Cronos Prime). Su habilidad exclusiva es Alas (dos drones laterales) y su última, Constelación (seis drones en estrella): que la paleta lo sugiera, sin añadir piezas. Estilo: arte de juego sci-fi pintado y semirrealista, vista cenital estricta, blindaje con paneles y juntas visibles, luz fría de estudio desde arriba a la izquierda. Fondo transparente real con canal alfa (sin damero pintado ni negro), bordes limpios sin halo blanco, sin texto ni números ni líneas entre celdas. Comprueba sobre negro, blanco y damero.
```

## Arte · Nave 07 Quimera: colores nuevos

- **Id:** `camp-art-nave-quimera` · **Prioridad:** 2 · **Archivo:** `encargo-camp-art-nave-quimera-v1.png`
- **Para qué:** Concepto de flota aprobado por el propietario el 24/10 (https://claude.ai/artifact/6KmCsopxEWoBbrK76jKiKx). Exclusiva: Señuelo (holograma). Última: Enjambre (doce mininaves).

```text
Antes de empezar lee https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/art/GUIA_GPT.md y la biblia https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/design/BIBLIA_GALAXIA.md. Recolorea la lámina de la nave Quimera de NEON CRONIUM: https://neon-cronium-hangar-galeria.chictide18.chatgpt.site/assets/07-quimera-poses-despiece.png. Mantén exactamente la silueta, las piezas, las cinco poses (neutral, alabeo izquierdo, alabeo derecho, aceleración y frenado) y el despiece, con la misma composición, posiciones y escala que la lámina original. Solo cambian los colores: casco #3C7F6F, detalles y adornos #22272B, cabina, luces y llama de los propulsores #76FFC2. Los brillos siempre fríos: nada de rojo, naranja ni ámbar (son de las amenazas) ni violeta (es del tiempo, de Cronos Prime). Su habilidad exclusiva es Señuelo (holograma) y su última, Enjambre (doce mininaves): que la paleta lo sugiera, sin añadir piezas. Estilo: arte de juego sci-fi pintado y semirrealista, vista cenital estricta, blindaje con paneles y juntas visibles, luz fría de estudio desde arriba a la izquierda. Fondo transparente real con canal alfa (sin damero pintado ni negro), bordes limpios sin halo blanco, sin texto ni números ni líneas entre celdas. Comprueba sobre negro, blanco y damero.
```

## Arte · Nave 10 Titán: colores nuevos

- **Id:** `camp-art-nave-titan` · **Prioridad:** 2 · **Archivo:** `encargo-camp-art-nave-titan-v1.png`
- **Para qué:** Concepto de flota aprobado por el propietario el 24/10 (https://claude.ai/artifact/6KmCsopxEWoBbrK76jKiKx). Exclusiva: Andanada (salva de misiles). Última: Supernova (onda que lo borra todo).

```text
Antes de empezar lee https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/art/GUIA_GPT.md y la biblia https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/design/BIBLIA_GALAXIA.md. Recolorea la lámina de la nave Titán de NEON CRONIUM: https://neon-cronium-hangar-galeria.chictide18.chatgpt.site/assets/10-titan-poses-despiece.png. Mantén exactamente la silueta, las piezas, las cinco poses (neutral, alabeo izquierdo, alabeo derecho, aceleración y frenado) y el despiece, con la misma composición, posiciones y escala que la lámina original. Solo cambian los colores: casco #4A6C8A, detalles y adornos #E9EEF2, cabina, luces y llama de los propulsores #00E5FF. Los brillos siempre fríos: nada de rojo, naranja ni ámbar (son de las amenazas) ni violeta (es del tiempo, de Cronos Prime). Su habilidad exclusiva es Andanada (salva de misiles) y su última, Supernova (onda que lo borra todo): que la paleta lo sugiera, sin añadir piezas. Estilo: arte de juego sci-fi pintado y semirrealista, vista cenital estricta, blindaje con paneles y juntas visibles, luz fría de estudio desde arriba a la izquierda. Fondo transparente real con canal alfa (sin damero pintado ni negro), bordes limpios sin halo blanco, sin texto ni números ni líneas entre celdas. Comprueba sobre negro, blanco y damero.
```

## Arte · Nave 03 Vértice: colores nuevos

- **Id:** `camp-art-nave-vertice` · **Prioridad:** 2 · **Archivo:** `encargo-camp-art-nave-vertice-v1.png`
- **Para qué:** Concepto de flota aprobado por el propietario el 24/10 (https://claude.ai/artifact/6KmCsopxEWoBbrK76jKiKx). Exclusiva: Lanza (disparo que atraviesa). Última: Prisma (rayo que se abre en 5 haces).

```text
Antes de empezar lee https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/art/GUIA_GPT.md y la biblia https://raw.githubusercontent.com/adonay1994sm-gif/neon-cronium/claude/preparar-publicacion-rtfl9q/docs/design/BIBLIA_GALAXIA.md. Recolorea la lámina de la nave Vértice de NEON CRONIUM: https://neon-cronium-hangar-galeria.chictide18.chatgpt.site/assets/03-vertice-poses-despiece.png. Mantén exactamente la silueta, las piezas, las cinco poses (neutral, alabeo izquierdo, alabeo derecho, aceleración y frenado) y el despiece, con la misma composición, posiciones y escala que la lámina original. Solo cambian los colores: casco #F4F6F8, detalles y adornos #1F4FB8, cabina, luces y llama de los propulsores #4DA3FF. Los brillos siempre fríos: nada de rojo, naranja ni ámbar (son de las amenazas) ni violeta (es del tiempo, de Cronos Prime). Su habilidad exclusiva es Lanza (disparo que atraviesa) y su última, Prisma (rayo que se abre en 5 haces): que la paleta lo sugiera, sin añadir piezas. Estilo: arte de juego sci-fi pintado y semirrealista, vista cenital estricta, blindaje con paneles y juntas visibles, luz fría de estudio desde arriba a la izquierda. Fondo transparente real con canal alfa (sin damero pintado ni negro), bordes limpios sin halo blanco, sin texto ni números ni líneas entre celdas. Comprueba sobre negro, blanco y damero.
```
