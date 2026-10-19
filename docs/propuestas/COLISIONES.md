# PROPUESTA · Radios de colisión de meteoritos y restos

> Estado: **PROPUESTA**. No se ha cambiado ningún radio. Decide el propietario.

## La pregunta

`collisionCircles()` (`src/game/04-entities-collision-damage.js`) multiplica
el radio del objeto (`item.r`) antes de comprobar el choque con la nave:

| Objeto | Multiplicador actual |
|---|---|
| Meteorito grande (`meteorLarge`) | ×1,22 |
| Meteorito mediano (`meteorMedium`, `meteorMediumAlt`) | ×1,12 |
| Meteorito pequeño (`meteorSmall`, `meteorSmallAlt`) | ×1,04 (caso por defecto) |
| Restos (`debrisMetal`, `debrisHot0/1`) | ×1,08 |
| Panel (`debrisPanel`) | 3 círculos (0,62 / 0,66 / 0,62 × r) |

¿Es `item.r` el radio que se ve en pantalla? ¿El área de choque es más grande
que el dibujo?

## Respuesta corta

**`item.r` no es el radio visible.** El sprite se dibuja como un cuadrado de
lado `item.r × factor` (`07-player-item-rendering.js`: 2,95 grande, 2,70
mediano, 2,45 pequeño, 2,90 restos, 3,15 panel), y ese cuadrado tiene bordes
transparentes. Por eso el multiplicador sirve justamente para acercar el
círculo de choque a la roca que se ve.

Con las medidas reales, **el área de colisión no es mayor que lo que se ve,
salvo en el meteorito pequeño**, donde sobra un poco (≈ 8 %).

## Cómo se midió

Se abrieron los `.webp` de `assets/` con Python (Pillow) y se contaron los
píxeles con opacidad > 50 %. Luego se pasaron a "unidades de r" usando el
mismo factor de dibujo del juego. "Radio equivalente" = radio de un círculo
con la misma superficie visible. El brillo (`shadowBlur`) no se cuenta, así
que en pantalla los objetos parecen incluso algo más grandes.

| Sprite | Radio visible equivalente | 90 % de los píxeles dentro de | Choque actual | Diferencia |
|---|---|---|---|---|
| meteor_large | 1,26 r | 1,20 r | 1,22 r | choque ≈ 3 % **menor** que lo visible |
| meteor_medium | 1,20 r | 1,14 r | 1,12 r | ≈ 7 % menor |
| meteor_medium_alt | 1,11 r | 1,07 r | 1,12 r | prácticamente igual |
| meteor_small | 0,97 r | 0,96 r | 1,04 r | choque ≈ **7 % mayor** |
| meteor_small_alt | 0,95 r | 0,94 r | 1,04 r | choque ≈ **9 % mayor** |
| debris_metal | 1,13 r | 1,19 r | 1,08 r | ≈ 4 % menor |
| debris_hot_00 | 1,05 r | 1,15 r | 1,08 r | prácticamente igual |
| debris_hot_01 | 0,92 r | 1,18 r | 1,08 r | forma alargada; círculo intermedio |

En píxeles, un meteorito pequeño típico (r ≈ 34) tiene un círculo de choque
unos 3 px más ancho que la roca visible. Es poco, pero se puede notar en roces.

## Opciones

1. **No tocar nada (recomendado por ahora).** Los valores están cerca de lo
   visible y el resto de la colisión (silueta de la nave metida hacia dentro)
   ya compensa a favor del jugador.
2. **Ajustar solo el pequeño**: bajar `×1,04` a `×0,96` para los meteoritos
   pequeños. Cambia la dificultad un poquito a favor del jugador.
3. **Medir y guardar el radio visible en `ASSET_MANIFEST.json`** y usarlo
   directamente. Más trabajo, pero deja de depender de números a mano.

## Riesgos

- Cualquier cambio altera la dificultad y el corredor garantizado (que usa
  los mismos círculos en `threatBounds`). Habría que repetir las pruebas de
  corredor y una partida natural.
- Las pruebas `comet-presentation` y `classic-ship-collision-fit` fijan
  algunos valores; habría que actualizarlas a la vez.

## Pasos si se aprueba la opción 2

1. Cambiar el caso por defecto de `collisionCircles` solo para claves
   `meteorSmall*`.
2. Ejecutar `npm test`, `npm run test:content` y una partida completa.
3. Probar en iPhone real los roces con meteoritos pequeños.
