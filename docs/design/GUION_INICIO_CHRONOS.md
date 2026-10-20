# Guion plano a plano · Inicio de Chronos (v5)

Crítica del propietario a la v2 (20/10/2026): la ruptura parece un juguete,
el villano no tiene carácter, el ataque no impresiona, Chronos se ve siempre
del mismo tamaño y los fotogramas de cada escena no están construidos.

Reglas que se mantienen: la ruptura ocurre a los **9 s** del reloj de ruta y
la partida sigue sin cortes. **Los controles no se bloquean** (la historia del
capítulo usa la presentación "in-world"); la escena ocurre mientras se pilota. Todo se deriva de una pose
pura (`getChronosIntroPose`) y se dibuja con una **cámara** propia de la
escena (zoom, encuadre, temblor) que no afecta al juego.

## Principios

1. **Escala**: Chronos es colosal. Se empieza con la cámara pegada a la
   estación (no cabe en la pantalla) y se va revelando. Naves del convoy
   diminutas atracan en sus anillos como referencia de tamaño.
2. **El villano tiene intención**: no aparece deslizándose; rasga el
   espacio, despliega las alas de golpe, abre su "ojo" y **mira**. Antes de
   disparar **se alimenta**: absorbe la energía de la estación, que se va
   apagando sector a sector. Después del golpe mira a la nave y se va.
3. **El impacto pesa**: anticipación (silencio, oscuridad, carga) → golpe
   (destello corto, sacudida, cámara que empuja) → consecuencia (onda
   expansiva, explosiones en cadena por el anillo, trozos enormes que pasan
   junto a la cámara, incendios que quedan).

## Planos

| # | Tiempo | Plano | Qué se ve | Cámara | Sonido |
|---|---|---|---|---|---|
| 1 | 0,0–2,8 | **Escala** | Estación enorme girando; luces encendidas; 3 naves del convoy atracan. | Zoom 2,1 → 1,5, encuadre en la torre, deriva lenta. | Ambiente de la estación |
| 2 | 2,8–4,6 | **Presagio** | Las luces parpadean, el espacio se oscurece desde arriba, las estrellas se estiran hacia un punto; se abre una grieta violeta con descargas. | Zoom 1,5 → 1,15, sube hacia la grieta. | Anomalía de acceso |
| 3 | 4,6–6,4 | **Aparición** | Cronos Prime sale de la grieta desde el fondo (pequeño → grande), alas plegadas que se abren de golpe con un chasquido de energía; se abre el ojo; rótulo **CRONOS PRIME**. | Zoom 1,15 → 1,0, leve temblor al abrir las alas. | Carga |
| 4 | 6,4–8,6 | **Drenaje** | Hilos de energía salen del anillo y entran en su núcleo; la estación se apaga por sectores; la esfera del núcleo crece y late. | Fija, temblor creciente. | Alarma doble |
| 5 | 8,6–9,0 | **Disparo** | Haz grueso (halo + núcleo blanco) del ojo a la torre; descargas a lo largo. | Empuje 1,0 → 1,08. | — |
| 6 | 9,0–11,5 | **Ruptura** | Destello corto, onda expansiva (4 fases) mayor que la estación, explosiones en cadena por el anillo, 8 trozos que salen y crecen hacia la cámara, la torre se parte. | Sacudida fuerte y vuelta a 1,0. | Ruptura del reactor |
| 7 | 11,5–13,6 | **Desprecio** | Cronos Prime gira hacia la nave, el ojo se vuelve rojo un instante y se marcha en un salto (estela vertical + destello). | Fija. | — |
| 8 | 13,6–26 | **Huida** | Estación rota con incendios, oscurecida, alejándose; la partida ya es protagonista. | Alejamiento. | Ruta de emergencia |

## v5 (nota del propietario a la v4: 3/10)

Le gustó el plano de la estación; no le gustaron las láminas superpuestas, la
"sombra negra" (grieta), la aparición sin sentido ni los ataques. Entregó la
animación de Cronos Prime (carga, disparo, enfriamiento, giro) y una
explosión azul de 8 fotogramas. La v5:

1. Mantiene el plano de escala de la estación.
2. Cronos Prime **llega desde fuera**: una luz violeta lejana que se acerca
   girando (fotogramas de giro), frena en seco sobre la torre (onda) y se
   presenta con su rótulo.
3. Carga con sus fotogramas mientras Chronos se apaga sector a sector.
4. Dispara en vertical (fotograma de disparo + haz hasta la torre).
5. **Explosión azul** del propietario; tras ella la estación ya no está
   entera: solo la torre partida, lejana, y los restos.
6. Se enfría, se gira y se marcha por donde vino.

Retirados: láminas pintadas en el juego, grieta y Cronos Prime por piezas
(los originales siguen en `art-source/`).

## Cambios de la v4 (histórico)

- El impacto corta (dos fotogramas en blanco) a las **láminas pintadas** de la
  ruptura: 01–05 rápidas con empuje y sacudida, 06–10 más lentas y fundido al
  **fondo tras la ruptura**, que baja a media luz al pilotar y se retira a los
  14–18 s. La estación por piezas no vuelve a dibujarse: Chronos queda destruida.
- Cronos Prime sale de una **grieta vertical**, se hace más grande que la
  pantalla, abre las alas y se retira a un puesto de tiro en diagonal; el haz
  cruza media pantalla.
- Se bebe la estación **sector a sector** (8 sectores) con descargas.
- Al final se inclina hacia la nave con una **pupila roja** que la mira y
  sale por una grieta que se cierra de golpe.
- Si las láminas no han cargado, se usa la ruptura por piezas (onda y
  estallidos azules).

## Arte usado

- Estación por piezas, torre intacta/rota, fragmentos (`chronos_intro_*`).
- Cronos Prime por piezas (`cronos_prime_phase1_atlas_v1`).
- **Nuevo atlas de efectos** `cronos_prime_fx_atlas_v1`: esfera de energía y
  6 descargas (entrega del propietario, sin usar hasta ahora).
- Onda expansiva `chronos_shockwave_atlas_v1` y explosiones `explosion_frame_*`.

## Lo que no se puede resolver solo con código (pedir arte)

- Un Cronos Prime con más carácter necesita una **pieza de "ojo"** propia
  (iris/pupila) y una **pose de giro** (tres cuartos) para el plano 7.
- Explosiones grandes **azules** de estación (hoja de 8 fotogramas) para que
  la cadena del plano 6 no use la explosión naranja genérica.
