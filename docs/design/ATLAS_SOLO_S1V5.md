# Atlas solo en S1-V5 (el Gemelo se gana allí)

Decisión del propietario (tablero, 21/10/2026): «Sí: Atlas solo en S1-V5, y el
Gemelo se gana allí». Coincide con la opción B de
`docs/design/CAMPANA_50_VIAJES.md` (S1-V1 termina en la baliza; Atlas se
combate en S1-V5).

## Problema

Hoy Atlas se combate en S1-V1 (Chronos → baliza exterior) y otra vez en S1-V5
(«Convence a Atlas»), y S1-V2…V4 cuentan que Gaia aún te cree culpable. La
historia tiene que quedar coherente.

## A. S1-V1 sin combate

- `isAtlasMission()` (`src/game/03-ui-game-flow.js`) solo es cierto en un
  viaje del mapa con `ficha.boss === 'atlas'`, es decir, S1-V5.
- S1-V1 se completa con el CRONIUM y la llegada real al final de la ruta
  (`canFinish`), sin Atlas ni epílogo.
- Las líneas de ruta de la historia del capítulo
  (`src/game/narrative/chronos-chapter.js`), como `atlas-border` y
  `forged-identity`, se quedan: Atlas avisa de lejos y anticipa S1-V5.
- Los beats de combate (`atlas-entry`, `atlas-phase-two`) y los de epílogo
  (`atlas-log-verified`, `iria-identification`, `vulkar-lead`) ya no se
  disparan en S1-V1.
- Se revisa todo lo que esperaba `aftermathReady` o `atlas-disabled` para
  completar S1-V1.
- El título de completado de S1-V1 ya no puede decir «Atlas ha abierto el
  paso». Se usa un texto de huida coherente con la ruta: «Has escapado de
  Chronos».
- El journal de completado de S1-V1 ya no lleva recompensa de equipo.

### Lo descubierto al revisar A

- En S1-V1 el título «Atlas ha abierto el paso» ya se sobrescribía con «El
  registro ha llegado a Gaia», y el mensaje final era de Iria: «El convoy
  utilizó tu identificación. El registro demuestra el sabotaje…». Eso
  contradice S1-V2…V4 (Gaia aún te cree culpable). Se sustituye por un
  mensaje de N-7 en la baliza: Gaia aún no nos cree; hay que llevar el
  registro hasta Atlas.
- Los beats de Atlas solo llegan a la historia del capítulo a través de
  `signalClassicChapter()`, que no hace nada sin `classicChapterStory`, y esa
  historia solo existe en S1-V1. Como Atlas ya no aparece en S1-V1, esos beats
  no se disparan nunca. **El módulo `chronos-chapter.js` no se cambia**: sigue
  aceptando las señales `atlas-*` y el epílogo para que los guardados antiguos
  de S1-V1 completado (cuyo registro guarda esas señales) se sigan leyendo. Si
  se quitaran, `normalizeClassicVoyageRecord` daría el guardado por corrupto.
- `completeLevel()` tenía tres ramas para S1-V1 con Atlas (espera a
  `aftermathReady`, salvaguarda del registro de equipo corrupto, equipo en el
  journal). Con A todas quedan muertas, así que se quitan de ahí y la
  salvaguarda pasa a `completeSideVoyage()`.
- `updateLevelStory()` completaba S1-V1 cuando `aftermathReady`; sin Atlas en
  S1-V1 esa condición nunca se cumple. Se quita.
- La línea de ruta `gaia-beacon` de S1-V1 («Tu identificación coincide con el
  convoy atacante. Atlas exige que detengas los motores.») se queda: es un
  aviso lejano y coherente con la huida.

## B. S1-V5 con el combate y el Gemelo

- El combate ya existe por `ficha.boss`.
- Al vencerlo, `completeSideVoyage` concede el arma con
  `NeonCampaign.awardClassicBossWeapon(classicEquipment, 'guardian-atlas')` y
  la guarda con `persistClassicEquipment`.
- Con la misma salvaguarda que usaba S1-V1 para un registro de equipo
  corrupto: copia de seguridad antes de escribir; si no se puede, no se
  escribe y se avisa.
- Idempotente: repetir S1-V5 no duplica nada, como ya garantiza
  `awardClassicBossWeapon`.
- La pantalla de completado de S1-V5 dice «Atlas ha abierto el paso» y avisa
  del cañón Gemelo la primera vez que se gana.
- Las líneas del epílogo de Iria («Usaron tu señal para atacar Chronos», «El
  convoy vino de Vulkar. Tienes paso libre.») se muestran al vencer en S1-V5.
  Se elige lo más sencillo: **el texto de completado**, porque al vencer a
  Atlas en un viaje del mapa la pantalla de completado sale en el acto y no
  hay tiempo de radio.
- La vida de Atlas sigue escalando con la dificultad, como ya hace.
- El emisor del Gemelo (`twin-module-marker`, `recoveredTwin`) se sigue
  recogiendo en S1-V1. Lo que pasa a S1-V5 es la autorización del segundo
  cañón. Los textos de la Forja («vencer a Atlas autoriza el segundo cañón»,
  «El segundo cañón se desbloquea al vencer a Atlas», «Supera a Guardian
  Atlas») siguen siendo ciertos y no se cambian.

### Decisión: si el arma no se puede guardar

Si el registro de equipo no se puede escribir (corrupto sin copia de
seguridad, o la escritura falla), S1-V5 **no se marca como completado** y la
pantalla lo avisa. Así nunca queda un S1-V5 «hecho» sin su Gemelo; al repetir
el viaje se vuelve a intentar. Es la misma regla que tenía S1-V1: «sin arma
guardada no se desbloquea lo siguiente».

## C. Guardados antiguos

- Quien ya venció a Atlas en S1-V1 conserva el arma y su S1-V1 completado
  (nada borra `unlocked`, `bossRewards` ni el registro del viaje). Al vencer
  en S1-V5, `awardClassicBossWeapon` devuelve `granted: false`: no hay aviso
  de Gemelo nuevo ni nada duplicado.
- Guardado de S1-V1 a medio combate con Atlas: el combate nunca se guardaba;
  el registro está en la entrada del tramo 10. Al reanudar, se termina el
  tramo y S1-V1 se completa sin Atlas, sin Gemelo (se gana en S1-V5).
- Journal pendiente que lleva equipo (victoria antigua interrumpida): el
  journal se repara al arrancar, antes de cargar nada, y escribe el equipo
  que ya llevaba. Se conserva el Gemelo y no se duplica. El journal sigue
  aceptando equipo solo para esto.
- No cambian claves ni formatos de guardado.

## D. Pruebas

Con la sola línea A cambiada fallan 26 pruebas (sobre todo
`tests/guardian-atlas-legacy`, `completion-journal-legacy` y
`unified-flight-legacy`). Muchas usan S1-V1 solo como vehículo para probar las
mecánicas de Atlas (daño ×1/×2/×3, armadura, pausa, muerte y continuar, fuego
manual, cámara lenta, salvas).

- Esas pruebas se reescriben para llegar a Atlas en S1-V5 (viaje del mapa) y
  comprobar lo mismo.
- Las que prueban que S1-V1 exige Atlas se reescriben para probar lo
  contrario: S1-V1 se completa sin Atlas.
- La de la recompensa interrumpida en el journal se convierte en una prueba
  de la recompensa en S1-V5, idempotente y con la salvaguarda del registro
  corrupto.
- Se añaden pruebas nuevas para B y C.
- No se salta, desactiva ni borra ninguna prueba para ponerla en verde.

## Resultado (21/10/2026)

- **Fallo encontrado y corregido:** al vencer a Atlas en un viaje del mapa,
  `completeSideVoyage()` retira a Atlas dentro del propio evento y
  `updateAtlasEncounter()` leía `atlasBoss.state` justo después: S1-V5 se
  rompía con un error en el fotograma de la victoria.
- `classicChapterOutroStartedAt` (reloj del epílogo en S1-V1) quedó sin uso y
  se quitó.
- Pruebas reescritas (antes usaban S1-V1 para llegar a Atlas):
  `tests/guardian-atlas-legacy.test.mjs` (pausa, cuota final, victoria,
  muerte y continuar, cargador, daño ×1/×2/×3, armadura, fuego manual, disparo
  desviado, salir del combate, cámara lenta), `tests/unified-flight-legacy`
  (salva dirigida, HUD de combate, diez tramos y enlace con S1-V2) y
  `tests/completion-journal-legacy` (escritura interrumpida del journal).
- Pruebas nuevas: B (Gemelo una sola vez, epílogo de Iria, registro corrupto
  con y sin copia, escritura de equipo interrumpida, vida según dificultad) y
  C (journal antiguo con Gemelo, S1-V1 ya ganado con Atlas, guardado a mitad
  del combate antiguo).

## Pendiente

- La prueba de recorrido en Chromium (`chapter-one-browser-smoke.cjs`) se
  retiró el 23/10/2026. Hay que escribir una nueva para S1-V1 sin Atlas y
  otra para S1-V5. Necesita Playwright (sin
  instalar, requiere permiso del propietario).
- Revisar con capturas reales la pantalla de completado de S1-V1 y de S1-V5
  (texto largo de Iria + Gemelo + siguiente viaje).
