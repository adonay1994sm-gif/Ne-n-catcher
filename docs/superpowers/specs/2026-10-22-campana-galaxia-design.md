# NEON CRONIUM · Campaña por la galaxia — diseño

> 22/10/2026. **Aprobado por el propietario** (D1A, D2A y «listo»). Diseño hecho con el propietario en dos rondas de opciones,
> en la página «Decisiones de campaña NEON CRONIUM» (artifact
> `8RoC21JKJMRxawzqbRAyp8`, colección `elecciones`). Lo marcado
> **(decisión de Claude)** no lo eligió el propietario y puede cambiarse.
> Este documento **sustituye** la estructura «10 sectores × 5 viajes» de
> `docs/design/CAMPANA_50_VIAJES.md` (20/10/2026). La historia de
> `docs/design/BIBLIA_HISTORIA.md` sigue siendo la base y se amplía.

## 1. Intención y porqué

El propietario jugó todos los viajes y el juego le resulta **aburrido,
rutinario y sin emoción**. Le gusta la dirección, pero tras el primer nivel
no hay motivos para seguir jugando.

Su público son jugadores acostumbrados a Call of Duty: el juego tiene que ser
**intenso, frenético y algo frustrante**, un reto que quieras superar. Y tiene
que ser una **aventura**: viajar por una galaxia hostil buscando cristales de
CRONIUM, descubrir la siguiente zona, conseguir piezas, mejorar la nave y
llegar al final de la historia. Lo resume como «mundo abierto pero lineal».

## 2. Objetivos

1. Cada tramo tiene tensión: el jugador se mueve, esquiva y combate todo el
   tiempo.
2. Cada sector se siente como el territorio de otra facción, con su propia
   lógica.
3. La nave progresa de forma visible y con decisiones.
4. Jefes y subjefes son momentos memorables.
5. El paso de un tramo a otro, y de un sector a otro, no tiene cortes bruscos.

## 3. No objetivos

- El concepto de las 10 naves del hangar (paletas, habilidad propia y
  habilidad última). Es un proyecto aparte que va después.
- Multijugador, tienda con dinero real o cambios en la configuración de
  anuncios.
- Hacer ahora los 10 sectores. Primero el sector 1 completo, como modelo.

## 4. Anti-objetivos (fracaso aunque funcione)

- Que sea **fácil o plano**: oleadas con guion que se aprenden de memoria.
- Que la frustración sea **injusta**: golpes que no se ven venir, ataques sin
  salida o el jugador sin munición contra enemigos imposibles.
- Que la historia **frene la acción** con textos largos en mitad del combate.
- Que el progreso **dependa de pagar o de anuncios** para poder avanzar.
- Un tramo con más de 6 s seguidos sin nada que hacer (auditoría J05).

## 5. Restricciones

- Reglas de `CLAUDE.md`:
  - se edita `src/game/`, nunca `game.js` ni `www/`;
  - un único bucle `requestAnimationFrame` y `USE_ENGINE_V1 = false`;
  - lienzo lógico de 720×1280;
  - no tocar iOS ni Capacitor.
- **Anuncios:**
  - solo IDs de prueba;
  - no se cambian `ads-config.js`, `native-admob.js` ni `ad-bridge.js` sin
    orden expresa;
  - la recompensa de revivir ya existe (`resumeReward`) y solo cambia su
    efecto.
- **Balance, economía y guardados:** este diseño es la orden expresa del
  propietario para cambiarlos. No hay jugadores actuales: no se migra nada
  (propietario, 23/10/2026).
- **Móvil:** debe ir fluido en un iPhone medio. Muchos enemigos en pantalla
  no pueden bajar de 60 fps.
- **Diseño visual:** rigen `DESIGN.md` y el sistema A de botones (chaflán,
  cara y luz). Cada necesidad de arte lleva su prompt para GPT en el tablero.

## 6. Decisiones del propietario

### 6.1 Estructura de la campaña

- **10 sectores × 10 tramos = 100 tramos.** Cada sector es **un único viaje
  continuo**.
  - **Subjefe** en el tramo 5.
  - **Jefe** del sector en el tramo 10.
- **Duración (D1A):** tramos de 45–60 s, unos 10 minutos por sector.
  - Sector 1: el contenido de S1-V1 a S1-V5 en 10 tramos; subjefe CH-03 y
    jefe Atlas.
  - Sector 2: los viajes de Gaia a Vulkar; subjefe C-17 y jefe Titan Vulkar.
  - Facciones, enemigos y jefes de los 10 sectores: `docs/design/BIBLIA_GALAXIA.md`.
- Ritmo de un sector:
  - tramos 1–4 presentan las amenazas de la facción;
  - tramo 5: subjefe, que adelanta la mecánica del sector;
  - tramos 6–9 complican esas mecánicas;
  - tramo 10: jefe.
- **10 sistemas, 10 facciones** (R7A con la nota «deberían ser 10
  sistemas»): cada sector ocurre en un sistema distinto, con su facción.
  - Las facciones se enfrentan entre sí en conflictos locales, y eso les da
    contexto: sabes por qué luchan.
  - La **flota de la Cartógrafa** (la antagonista de la biblia) aparece en
    todos los sectores, se aprovecha de esos conflictos y gana fuerza.
  - Hay que ampliar la biblia: los 5 sistemas actuales (Gaia, Vulkar, Cryon,
    Aether y Titan Omega) más 5 nuevos.
  - **(decisión de Claude)** Chronos y Gaia siguen siendo el sector 1, para
    no perder el inicio ya hecho.
- **Contenido ya hecho** (S1-V1 a S1-V5, S2-V1 a S2-V5, Atlas, el C-17, Titan
  Vulkar): se recoloca en la nueva estructura, no se pierde.
- **Repetir:** los sectores completados se pueden volver a jugar desde el
  mapa para conseguir piezas o probar la otra ruta, como en Sky Force
  **(decisión de Claude)**. Una pieza necesaria para avanzar siempre cae
  segura del jefe de su sector: nunca bloquea.
- **Estrellas:** se mantienen de 0 a 3, ahora por sector **(decisión de
  Claude)**.
- **Migración:** no hace falta; no hay jugadores actuales (propietario,
  23/10/2026).

### 6.2 Morir (R1B)

- Al morir puedes ver **un anuncio una vez por sector** y seguir en el mismo
  punto con **25 % de casco**. Hoy son 35 %.
- Si vuelves a caer, el sector **empieza desde el tramo 1**. Se conserva lo
  recogido: CRONIUM, chatarra y piezas.
- **Baliza del subjefe:**
  - al vencer al subjefe puedes pagar CRONIUM por una baliza;
  - si mueres después, el siguiente intento empieza en el tramo 6;
  - es una decisión: gastar en seguridad o guardar para mejoras.
- Las cifras del precio quedan para equilibrar con el bot.
- **(decisión de Claude)**
  - El anuncio de revivir se puede usar **una vez por intento** de sector.
  - La baliza se paga una vez y vale para **todos los intentos** hasta
    completar el sector.
  - Si cierras la app a mitad de sector, «Continuar» te lleva **al inicio del
    tramo** en el que estabas, con el casco que tenías al empezarlo, como hoy.
    Morir sí aplica la regla del sector entero.

### 6.3 Viaje entre sectores (R2A)

- Tras el jefe se abre el **mapa de la galaxia** con **2 rutas** hacia el
  siguiente sistema. Cada ruta es un **tramo de frontera** con combate, donde
  se cruzan la facción que dejas y la que llega:
  - **Ruta segura:** menos enemigos y menos botín.
  - **Ruta caliente:** más enemigos de las dos facciones, más CRONIUM y
    piezas raras.
- La nueva facción **se presenta disparándote**.

### 6.4 La pausa es la interfaz (3B)

- La pausa abre un **holograma de C9 sobre el vuelo congelado**, con pestañas
  Taller · Árbol · Arsenal · Mapa · Ajustes.
- Al reanudar sigues **exactamente donde estabas**.
- Lo que cambias en el árbol o el arsenal **entra al empezar el siguiente
  tramo**. Así no se puede mejorar a mitad de un jefe.
- **Reparar el casco (D2A):** solo en las paradas de C9 tras el subjefe y
  tras el jefe. Entre medias, solo con los objetos de reparación en vuelo.
- El menú principal queda para empezar o continuar la partida
  **(decisión de Claude)**.

### 6.5 Taller de reparación (4B)

- El hangar pasa a ser el **taller de Mira**: reparar, mejorar y montar.
- Cada facción suelta **piezas propias** (núcleos, placas, lentes…). Ciertas
  mejoras y armas las necesitan, y eso da un motivo para llegar a la
  siguiente zona.

### 6.6 Árbol de habilidades (5C)

- Las **cifras básicas mejoran en línea**:
  - munición: 20 → ~100;
  - recarga: 2,0 s → ~1,2 s por carga;
  - casco.
- **Cada pocos niveles hay un nodo clave exclusivo:** eliges 1 de 2, y se
  puede cambiar en el taller pagando.
- Las cifras son orientativas y se equilibran con el bot.
- Hoy ya existe un árbol pequeño en `progression/scrap-economy.js`: Blindaje
  I/II, Refrigeración I/II, Abanico y Aguja. Se amplía; no se tira.

### 6.7 Arsenal (6B)

- Cada arma tiene una identidad clara y **4 niveles que se notan**. Ejemplo
  del propietario, el láser:
  - N1: un disparo;
  - N3: tres disparos;
  - N4 (**sobrecarga**): mantienes pulsado para cargar y sueltas una ráfaga
    tipo ametralladora; después tiene un enfriamiento largo.
- **Evoluciones:** un arma a N4 más un nodo concreto del árbol da una versión
  mejorada. Ejemplo: láser N4 + «Disipadores» = enfriamiento a la mitad y
  ráfaga más larga.
- **(decisión de Claude)** Se empieza con 3–4 armas bien hechas sobre las 5
  que ya existen: Pulso, Gemelo, Lanza, Abanico y Aguja.
- **(decisión de Claude)**
  - Los niveles N1–N4 se **compran en el taller** con chatarra y piezas, y
    son permanentes.
  - Se lleva **un arma principal** a la vez, más los misiles, como hoy.

### 6.8 Facciones con lógica

Cada facción se construye en cadena: **planeta → cuerpo → recurso →
tecnología → forma de sus naves → armas → cómo combate → piezas que suelta**.
Se tiene que entender por qué una civilización construye esas naves y usa
esas armas.

Ejemplo de referencia, Vulkar:
- **Planeta y gente:** lava y forjas, con fundidores endeudados.
- **Naves:** gruesas y blindadas, con radiadores.
- **Arma:** mortero de escoria que estalla a mitad del recorrido en un aro de
  calor.
- **Forma de combatir:** avanzan en bloque y te empujan.
- **Pieza:** núcleo de horno.

### 6.9 Enemigos e IA (8A + R8B)

- Cada tipo de enemigo tiene:
  - **forma de moverse** reconocible;
  - **habilidad básica**;
  - **habilidad única**;
  - **perfil de IA**.
- **Perfiles:**
  - **Cazador:** persigue.
  - **Artillero:** mantiene la distancia.
  - **Escolta:** protege y escuda a sus aliados.
  - **Oportunista:** ataca cuando recargas o tienes poco casco.
  - **Emboscador:** entra por detrás.
  - **Minador:** acecha desde abajo y cruza dejando minas y bombas.
- Cada enemigo decide según su vida, la distancia, sus habilidades
  disponibles con sus tiempos de recarga, y los aliados cercanos.
- **Turnos de ataque** (como las fichas de Doom 2016): solo unos pocos atacan
  a la vez y el resto se recoloca, flanquea o protege. La pantalla está llena
  pero es justa.
- **(decisión de Claude)** Los turnos de ataque sustituyen la escalada actual
  (J01, intensidad máx. 2). Se mantiene la idea del propietario: un enemigo
  que sobrevive mucho tiempo gana prioridad para atacar, siempre dentro del
  tope de turnos.
- Cada villano **se diseña y se afina con el bot**: miles de partidas
  simuladas ajustan velocidad, distancia y frecuencia hasta la dificultad
  buscada. **No** se usa una IA que aprende sola (red neuronal).

### 6.10 Intensidad del combate (mensaje del propietario)

- **Hordas:** grupos que obligan a moverse y esquivar todo el rato.
- **Meteoritos dirigidos** hacia la nave, **sin marcar la zona segura**. Con
  peligro real, pero siempre se pueden esquivar.
  - Esto retira el pasillo marcado de J04 en las lluvias de cometas.
- **Ataques por la retaguardia** (Emboscador).
- **Abanicos más abiertos:** proyectiles mucho más separados que cubren un
  ángulo mayor.
- La munición sigue siendo limitada, pero mejora con el árbol (6.6).

### 6.11 Subjefes y jefes (9B)

- **Subjefe (tramo 5):**
  - tres habilidades: una básica, otra más potente y una tercera difícil de
    esquivar;
  - presenta la mecánica del sector;
  - **no tiene furia** y queda por debajo del jefe.
  - El del sector 1 aún no existe y es obligatorio.
- **Jefe (tramo 10):**
  - **3 ataques habituales** que va alternando;
  - **1 ataque especial** muy poderoso;
  - **furia al 30 % de vida:** ataca mucho más a menudo, combina patrones
    **y cambia el escenario** (rompe algo, cambia el fondo o entran
    escoltas).
  - El jefe del abanico abierto llega con **4 naves de escolta** y tiene un
    ataque especialmente poderoso.
- **Reglas:**
  - cada ataque se avisa con imagen y sonido;
  - cada fase cambia la pelea, no solo sube los números;
  - siempre hay una salida.

### 6.12 Transiciones y diálogos (10A + R10B)

- **Vuelo sin cortes:**
  - los tramos se marcan con un rótulo y el radar, y el fondo se funde poco a
    poco;
  - los enemigos avisan por el borde de por dónde llegan, también por
    detrás;
  - antes del jefe cambia la música, el fondo se oscurece y su silueta cruza
    la pantalla.
- **Diálogos:**
  - **En calma** (inicio de tramo, frontera, antes del jefe): la nave baja a
    velocidad de crucero y sale un **panel grande**, de alrededor del 40 % de
    la pantalla, con retrato y texto fácil de leer.
  - **En combate:** frases cortas por radio en una franja que no tapa la zona
    de juego.

### 6.13 Interfaz con relieve

El sistema A (chaflán, cara y luz) se lleva a **todas las pantallas**,
empezando por el holograma de la pausa.

## 7. Orden de entrega

Cada paso es una tarea del tablero (`camp-<fase>-<paso>`). Se hace en orden;
una fase no empieza hasta que la anterior está aprobada. Cada fase se juega
en la copia de prueba y pasa `/competencia` antes de la siguiente.

### F0 · Cerrar el diseño
0.1. Responder: duración del sector y dónde va lo ya hecho **(te toca decidir)**
0.2. Responder: cuándo se repara el casco **(te toca decidir)**
0.3. Aprobar el documento de diseño de la campaña **(te toca decidir)**

### F1 · Biblia del mundo (documento, sin código)
1.1. 10 sistemas: los 5 actuales + 5 nuevos y su orden en el mapa
1.2. 10 facciones con su cadena: planeta → cuerpo → recurso → tecnología → naves → armas → combate → piezas
1.3. Conflicto local de cada sistema y papel de la Cartógrafa
1.4. Enemigos por facción: movimiento, habilidad básica, habilidad única y perfil de IA
1.5. Subjefe y jefe de cada sector: 3 habilidades / 3 ataques + especial + furia
1.6. Prompts de arte para GPT por facción y lista pública regenerada
1.7. Aprobación de la biblia por el propietario **(te toca decidir)**

### F2 · Base técnica (el jugador aún no ve cambios)
2.1. Simulador sin pantalla (bot) para medir dificultad
2.2. Módulo de IA: perfiles y turnos de ataque
2.3. Estructura de sector continuo de 10 tramos (datos)
2.4. Guardado nuevo y migración con pruebas, sin perder progreso

### F3 · Sector 1 jugable completo (el modelo)
3.1. Vuelo continuo de 10 tramos con transiciones sin cortes
3.2. Enemigos de la facción del sector 1 con su IA
3.3. Intensidad: hordas, meteoritos dirigidos, ataques por detrás, abanicos abiertos
3.4. Subjefe del tramo 5 (CH-03)
3.5. Atlas rehecho: 3 ataques + especial + furia al 30 % que cambia el escenario
3.6. Morir: sector entero, revivir con anuncio al 25 % (una vez por intento) y baliza
3.7. Paradas de C9 para reparar
3.8. Diálogos: panel grande en calma, radio corta en combate
3.9. Ajuste con el bot, copia de prueba, /competencia y prueba del propietario

### F4 · La nave
4.1. Pausa-holograma con pestañas Taller · Árbol · Arsenal · Mapa · Ajustes
4.2. Taller de reparación y piezas de facción
4.3. Árbol ampliado: líneas (munición 20→100, recarga 2→1,2 s) + nodos clave
4.4. Arsenal: 4 niveles por arma, sobrecarga N4 y evoluciones (3–4 armas)
4.5. Reajuste de dificultad con el bot

### F5 · Viajar por la galaxia
5.1. Mapa de la galaxia
5.2. Frontera con 2 rutas: segura y caliente
5.3. Rejugar sectores completados

### F6 · Sectores 2 a 10
6.1. Sector 2 con la plantilla del sector 1 (C-17 subjefe, Titan Vulkar jefe)
6.2. Sectores 3 a 10, uno por uno con el mismo ciclo

### F7 · Acabado
7.1. Relieve del sistema A en todas las pantallas
7.2. Concepto de las 10 naves del hangar: paleta, habilidad propia y última

## 8. Lo que queda para quien lo construya

- Cifras de munición, recarga, daño, vida, precios y la baliza: se fijan con
  el bot y se presentan al propietario.
- **Meta del bot (decisión de Claude):**
  - un bot de habilidad media con la nave de serie completa el sector 1 en
    un 30–40 % de los intentos;
  - con las mejoras esperadas a esa altura, en un 60–70 %;
  - se reajusta cuando llegue el árbol (fase 3).
  - El bot de la auditoría no está en el repositorio: hay que construir un
    simulador sin pantalla.
- Duración de cada tramo y número de enemigos a la vez.
- Cuántos «turnos de ataque» hay a la vez por sector.
- Arquitectura del código: un módulo nuevo de IA y otro de sectores.
- El formato de guardado nuevo y su migración, con pruebas.
- Qué arte nuevo hace falta; cada pieza va con su prompt para GPT.
