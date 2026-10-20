# Decisiones de diseño · Viajes, jefes, C9 y dificultad

> Fecha: 20/10/2026. Debate técnico entre el propietario y Claude.
> Estado: **DECIDIDO** salvo lo marcado como pendiente. Aún no implementado.
> Sustituye las partes incompatibles de `CAPITULO_02_GAIA_VULKAR.md`
> (HALO, Pinza Roja, Magma Serpent) y del mapa de `CAMPAIGN_100_STAGES.md`.

## 1. Concepto del juego

El juego es **un viaje por el espacio**: ver cómo el lugar de origen se
aleja, cómo el destino se acerca y crece, y cómo el conflicto se ve venir
desde lejos antes de convertirse en combate. Nunca se aterriza.

- **Un capítulo = un viaje completo** de un lugar a otro.
- **Sin numeración visible**: cada viaje y cada tramo tienen un nombre con
  objetivo (p. ej. «Escapa de Chronos»). Por dentro se mantienen
  identificadores fijos para los guardados.
- Los nombres saldrán de la **historia escrita del propietario** (pendiente
  de recibir).

## 2. Estructura fija de cada viaje

**Salida → viaje → JEFE INTERMEDIO → llega C9 → viaje → llegada → JEFE FINAL
→ llega C9 → siguiente viaje.**

- El conflicto se ve primero como parte del paisaje (pequeño, a lo lejos) y
  pasa a ser el enemigo real en la misma posición y tamaño, sin saltos.

## 3. Taller C9 limitado y bodega de chatarra

- El taller **solo se abre cuando llega C9**: tras vencer al jefe intermedio y
  al jefe final. El botón de la consola queda apagado el resto del tiempo.
  (Hoy se puede abrir en cualquier momento salvo contra Atlas.)
- La chatarra recogida va a la **bodega** de la nave (contador visible).
  **C9 la recoge** al llegar y entonces se convierte en dinero para comprar.
- La chatarra ya ahorrada en partidas existentes cuenta como entregada.

## 4. Tres dificultades

| Dificultad | Si te destruyen |
|---|---|
| Fácil | Vuelves al inicio del tramo y conservas toda la bodega. |
| Normal | Vuelves al inicio del tramo y pierdes la bodega recogida en ese tramo. |
| Extrema | Lo pierdes todo (chatarra, armas, mejoras) y empiezas de cero en el primer viaje. |

- Se elige al empezar una partida nueva; se puede bajar, no subir.
- La Extrema muestra un aviso claro antes de empezar.
- Las partidas existentes pasan a Normal.

## 5. Mapa de viajes (borrador aceptado para la primera versión)

| Viaje | Recorrido | Jefe intermedio | Jefe final |
|---|---|---|---|
| 1 | Chronos → Gaia | **CH-03, satélite de defensa** (confirmado) | Atlas ✔ |
| 2 | Gaia → Vulkar | Personaje nuevo por diseñar (sustituye a Magma Serpent) | Titan Vulkar |
| 3 | Vulkar → luna minera | Por decidir | Por decidir |
| 4 | Luna minera → salida de Vulkar | Por decidir | Por decidir |
| 5 | Vulkar → Cryon | Por decidir | Dosier Cryon |
| 6 | Cryon → frontera exterior | Por decidir | Leviatán |
| 7 | Frontera → Aether | Por decidir | Dosier Aether |
| 8 | Aether → paso restringido | Por decidir | Dosier Aether |
| 9 | Paso → Titan Omega | Por decidir | Dosier Titan Omega |
| 10 | Titan Omega → Chronos | Por decidir | Cronos Prime |

- **Magma Serpent se descarta** para ahorrar tiempo de animación.
- **Enemigos normales del viaje 2**: drones CH-01/CH-02 y satélites CH-03 al
  salir de Gaia; Lava Core y Plasma Mine cerca de Vulkar.
- Segunda versión: objetivos secundarios, medallas, rejugar viajes, etc.

## 6. Jefe intermedio del viaje 1: la nave saboteadora

Existe en `art-source/unified-flight/` (`bomberApproach`, `bomberCharge`,
`bomberFire`): nave negra con luces magenta y cañón largo. Hoy solo aparece
pequeña al principio. Propuesta: es la nave jefe de la flota que destruye
Chronos y reaparece a mitad del viaje, antes de la llegada de C9.

## 7. Arreglo de la animación de inicio de Chronos (aceptado)

Problemas observados (grabación del 20/10, 390×844):

| Segundo | Problema |
|---|---|
| 0–8 | Estación quieta en el centro; parece una imagen fija. |
| 3–8 | Una sola nave atacante diminuta en una esquina; el ataque casi no se ve. |
| 9–12 | La explosión es una nube translúcida que tapa la pantalla; no se ve romperse la estación. |
| 12–28 | La estación rota se queda en el centro y se aleja muy despacio. |

Arreglo (siguiendo el concepto de 4 viñetas del propietario):

1. Estación con vida desde el primer segundo: giro lento y **tráfico civil**.
2. **Flota saboteadora** visible que entra en picado, con la nave jefe al frente.
3. **La estación se parte en trozos** (anillos que se separan) con la onda por
   detrás, sin tapar la pantalla.
4. Chronos se aleja más rápido; aparecen el **rastro de cristales de CRONIUM**
   y **Gaia al fondo** desde el principio.

## 8. Arte: método con ChatGPT

- Jefes y enemigos **por piezas** (cuerpo, anillos, cañones, núcleo…) en
  imágenes sueltas; la animación se hace en el código. Evita las hojas de
  fotogramas incoherentes.
- Planetas grandes (~2048 px) y capas aparte (nubes, luces) si es posible.
- Fondo transparente real; misma referencia y misma frase de estilo en cada
  petición. ChatGPT como herramienta principal; Gemini solo para ideas.
- Para cada elemento, Claude entregará una ficha con el texto para pegar en
  ChatGPT y la lista de piezas.

## 9. Técnica (resumen)

- **Motor de viaje por fichas de datos**: tramos, cuerpos del paisaje con su
  curva de aparición/crecimiento, eventos, peligros, enemigos y jefes por
  viaje. El capítulo 1 se migra sin cambios visibles (comprobado con pruebas).
- Carga del arte por viaje (no todo de golpe) y control de memoria en iPhone.

## 10. Actualización (20/10/2026)

- Jefe intermedio del viaje 1: **CH-03** (confirmado por el propietario).
- El propietario delegó la historia: el reparto completo de viajes, jefes y
  personajes está en **`BIBLIA_HISTORIA.md`**, que sustituye la tabla del
  punto 5 donde no coincidan.
- La nave saboteadora pasa a ser el **carguero C-17** del prólogo y jefe
  intermedio del viaje 2.
- Pendiente: diseñar el personaje que sustituye a Magma Serpent (jefe final
  del viaje 3).
