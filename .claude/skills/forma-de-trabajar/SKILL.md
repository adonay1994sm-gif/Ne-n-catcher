---
name: forma-de-trabajar
description: Cómo piensa y qué busca el propietario de NEON CRONIUM, y cómo trabajar con él. Cárgala al empezar cualquier trabajo en este proyecto (código, arte, diseño, revisiones o respuestas) y antes de decidir prioridades. Se actualiza cada 3 días con lo aprendido.
---

# Forma de trabajar con el propietario de NEON CRONIUM

Destilado de sus mensajes desde el 19/10/2026. Si algo de aquí choca con un
mensaje nuevo suyo, manda el mensaje nuevo; anótalo en «Aprendizajes».

## 1. Qué persigue

- **Terminar el juego y publicarlo** en móvil (iPhone y Android). Steam queda
  para después (23/10). El juego **no está terminado**; nunca lo trates como
  listo para la tienda.
- **El concepto:** una aventura espacial en la que **viajas** por una galaxia.
  Ves acercarse planetas y conflictos. Es un mundo «abierto pero lineal», con
  una historia impactante.
- **Campaña:** 10 sectores × 10 tramos, cada sector continuo, con su facción e
  identidad, el subjefe en el tramo 5 y el jefe en el 10. Entre sectores hay
  una travesía propia.
- **Público tipo Call of Duty:** intenso, frenético y algo frustrante; un
  reto que quieras conseguir. Lo que más le molesta es que sea «aburrido,
  repetitivo, rutinario, sin emociones».
- **Profundidad y motivos para seguir jugando:**
  - un árbol de habilidades con decisiones;
  - un arsenal con niveles que se notan (N1 un disparo, N3 tres, N4 «última»
    con penalización);
  - el hangar como taller de reparación;
  - 10 naves con habilidad exclusiva y habilidad última (aprobado 24/10).
- **Un mundo con lógica:** las especies y facciones nacen de su planeta,
  biología y recursos.

## 2. Su listón de calidad

- **El arte pintado gana a lo hecho con código.** Lo que «parece hecho por
  comandos» (degradados, líneas, puntos o formas dibujadas en canvas) lo
  rechaza: rayos negros, estelas planas o pantallas sin relieve. Usa siempre
  el arte de GPT del baúl o del repositorio antes de dibujar nada a mano. Si
  falta, haz un encargo para GPT y usa algo pintado como provisional.
- **Si GPT le dio algo bueno, se usa tal cual o mejor**, nunca una versión
  plana. Rehacerlo peor le hace perder la paciencia.
- **Interfaz con relieve y aspecto profesional**, como las maquetas ORBIT / 01:
  marcos, placas, profundidad en los botones.
- **Animaciones con carácter**:
  - la intro y los jefes tienen que impactar;
  - nada de imágenes que se solapan, cortes visibles, piezas rígidas o
    colores que no casan con el fondo;
  - usa un portal dimensional en vez de estelas.
- **Combate justo pero exigente:** avisos visibles, sin zonas seguras
  marcadas en los meteoritos, enemigos poco predecibles, jefes con 3 ataques,
  un especial y furia.
- **Juega en el móvil (iPhone).** Mira siempre el resultado a 390×844 con
  capturas antes de decir que algo está bien.

## 3. Cómo decide

- **Él decide** lo grande. Quiere **conceptos para decidir**, con imágenes,
  opciones y una recomendación marcada que pueda seleccionar.
- Si algo es un concepto suyo, no lo programes de golpe: debatelo, busca
  referencias que funcionen y propón. «Lo que te digo es un concepto».
- Una vez decidido, quiere avance sin pausas: «Empieza», «Sigue tu
  recomendación», «Sí a todo».
- **Nunca aparques una petición suya sin decírselo.** Si algo va para
  después, avísale y anótalo en el tablero. Aparcar el hangar de las 10 naves
  sin preguntar le costó días y enfado (24/10).
- Si hay varias cosas abiertas, pregunta cuál va primero; si no, haz la que
  él acaba de pedir.

## 4. Tiempo y dinero

- Cada sesión le cuesta tiempo y dinero. No gastes en lo que no ha pedido.
  Ejemplos: revisiones duplicadas, arreglos de fallos que no existen,
  reestructuraciones por iniciativa propia.
- Si lo pide («dime qué has hecho»), da cuentas claras: hecho y funcionando,
  dónde se perdió tiempo, qué falta y depende de él.
- Reconoce los errores sin rodeos; no los maquilles.

## 5. Cómo hablarle

- Español sencillo. La acción o el resultado en la primera línea. Listas
  cortas. Sin preámbulos ni despedidas.
- Explica qué ha cambiado **para el jugador**, no solo en el código.
- Dale siempre un **enlace para probarlo** cuando cambia algo jugable o
  visual. Hoy es https://claude.ai/artifact/7HCk4RiGujkUSph4qd57Fg, que se
  actualiza al publicar el mismo archivo.
- Si no se pudo comprobar algo (iPhone real, sonido), dilo.

## 6. Cómo se trabaja en este proyecto

- **Tablero:** https://claude.ai/artifact/MgQvtqMaPSzRLsTMJgCUMy.
  - Cada cambio se marca allí.
  - Todo lo que se encuentra y no se termina se añade como tarea.
  - Las decisiones se añaden con su recomendación.
- **Arte con GPT:** él no copia prompts a mano. Cada necesidad visual va al
  tablero con su prompt (DESIGN.md §13). Después se regenera
  `docs/art/ENCARGOS_GPT.md`, que GPT revisa solo cada 10 minutos.
- **Baúl de assets:** https://neon-cronium-video-referencia.chictide18.chatgpt.site
  (`catalog.json`).
  - Revísalo al empezar cada trabajo.
  - Integra lo entregado **sin esperar a que lo pida**: le molestó encontrar
    el fondo del taller y los iconos sin usar (24/10).
- **Galería de naves de GPT:**
  https://neon-cronium-hangar-galeria.chictide18.chatgpt.site
- **Ramas:**
  - rama de trabajo `claude/preparar-publicacion-rtfl9q`, a `main` con PR;
  - sin force push;
  - el repositorio, limpio: lo que no se usa, fuera (preguntando si dudas).
- **Sin firma de IA** en archivos, commits ni PRs. El juego tiene que parecer
  hecho por una persona. Nada de nombres antiguos («NEON Catcher»).
- **Tras cada PR fusionado,** una revisión de `auditor-codigo`, y sus
  hallazgos al tablero. Una sola revisión por cambio.
- **Autonomía:**
  - puede dejarte trabajando de noche;
  - prográmate tareas para no parar y fusiona tú los PR si la CI está en
    verde.

## 7. Decisiones que ya tomó (no volver a preguntar)

- Bundle id `com.neoncronium`; repositorio `adonay1994sm-gif/neon-cronium`.
- JUGAR abre el sector 1. Los viajes antiguos solo existen en el panel de
  desarrollo (`?dev=1`).
- El tramo 1 empieza con la intro de Chronos y el tutorial.
- La baliza se paga con chatarra (40).
- Dificultad con tres modos más un hardcore en el que pierdes todo.
- Juego solo en vertical: el modo horizontal se bloquea.
- 10 naves (24/10):
  - las paletas y habilidades del concepto
    (https://claude.ai/artifact/6KmCsopxEWoBbrK76jKiKx);
  - Astér de serie y una nave nueva por sector;
  - la habilidad va con el fuselaje;
  - el hangar es una pestaña del taller de Mira.
- La intro de Chronos usa un portal dimensional (no estela) y el haz pintado
  de Cronos Prime (24/10).
- Pendientes de su decisión:
  - el color de la Égida;
  - la pose del Fulminante de Atlas.

## 8. Antes de dar algo por terminado

1. ¿Es lo que pidió, o lo que yo creí que pedía? Si dudo, pregunto.
2. ¿He usado el mejor arte disponible (baúl, `art-source/`, maquetas de GPT)?
3. ¿Lo he visto en capturas a tamaño móvil?
4. ¿Pasan `npm run build && npm test && npm run test:static && npm run test:content`?
5. ¿Está en el tablero, con lo pendiente anotado y el enlace de prueba al día?

## Aprendizajes

Se añaden cada 3 días (tarea programada) y cuando él corrige algo. Va una
línea por aprendizaje, con fecha, y lo más nuevo arriba. Si un aprendizaje
cambia una regla de arriba, se edita la regla y aquí se deja constancia.

- 24/10/2026: si señala que algo «se ve negro» o «hecho por comandos», busca
  primero el arte pintado que ya existe y no se usa.
- 24/10/2026: «Esto es una mierda, GPT te pasó algo fantástico». Cuando haya
  una maqueta de GPT, la pantalla del juego debe parecerse a ella.
- 22/10/2026: el combate le parecía aburrido. Pidió hordas, ataques por
  detrás, meteoritos dirigidos y jefes con furia.
