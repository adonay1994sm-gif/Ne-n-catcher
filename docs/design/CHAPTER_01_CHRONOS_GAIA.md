# Capítulo 01 — El registro de Chronos

Fecha: 18/10/2026. Estado: **IN_REVIEW**. Guion, controlador, arte, audio y combate están integrados en el ciclo actual. [El cierre](../production-reports/CHAPTER_ONE_LIVING_JOURNEY_2026-10-18.md) distingue partida natural, escenas controladas, CI y aceptación artística/física. No declara terminado el capítulo ni los diez territorios.

## Dirección vigente y decisiones de trabajo

La nueva dirección enlaza la vida cotidiana de Chronos, una autorización falsificada, el sabotaje, la evacuación y una prueba que el jugador debe llevar a Gaia. El combate nace de que los asaltantes quieren recuperar ese registro; la defensa de Gaia, engañada por la misma firma, tampoco nos deja pasar. Atlas es un guardián que aplica un protocolo incorrecto. La comandante Iria tiene otra responsabilidad: verificar el registro, revocar el bloqueo y abrir la siguiente pista hacia Vulkar.

El arco general y la apertura de 26 segundos han sido aprobados para este incremento. Son decisiones de trabajo reversibles los nombres secundarios, la matrícula C-17, el texto exacto, los tiempos de cada transmisión y la duración del epílogo. La historia mantiene el misterio de quién ordenó el ataque; que un convoy partiera de Vulkar no convierte a todo ese mundo en enemigo.

El viaje de diez etapas continúa ocupando **360 segundos de avance efectivo**, más el tiempo que ya detienen las misiones y C9. La resolución de Atlas se enlaza al final de este trayecto mediante integración del padre; este documento no atribuye ese cambio al controlador narrativo por sí solo. Los demás territorios, el archivo histórico y sus guardados se conservan. No se activan Motor V1, otro RAF ni otra campaña.

## Personajes y motivaciones

| ID | Personaje | Función y motivo |
| --- | --- | --- |
| `lira` | Lira, control Chronos | Operadora científica. Empieza en un turno normal; da prioridad a evacuar y conservar el registro original del acceso. No explica toda la trama durante el combate. |
| `mira` | Mira, taller C9 | Mecánica del corredor. Ofrece refugio y reparación de emergencia; cobra por su trabajo y por las mejoras. Su conversación corresponde a un atraque real. |
| `atlas` | Guardian Atlas | Defensa autónoma de Gaia. La identificación falsificada relaciona al jugador con el convoy atacante; su bloqueo tiene una causa comprensible y termina al verificar el registro. |
| `iria` | Comandante Iria, Gaia | Mando territorial humano. Protege su frontera, examina la evidencia y autoriza el paso; no repite el papel de Atlas como segundo enemigo obligatorio. |
| `n7` | N-7, navegación | Asistente de la nave. Interpreta pistas, balizas y rumbo. Este papel no fusiona por numeración el argumento de la antigua campaña N-7 con el canon espacial. |

## Apertura jugable: 0–26 s

El tiempo siguiente es **`classicFlight.snapshot().elapsed`**, no el tiempo real del navegador ni otro contador. La ruta activa conserva ataque a los **2,25 s**, preparación visual del reactor desde **6,3 s**, ruptura a los **9 s**, onda de **9 a 16,2 s** y retirada del atacante hasta **21,6 s**. El antiguo efecto de 31 segundos pertenece al camino histórico sin vuelo clásico; no se reproduce encima de este incidente.

| Tiempo de ruta | Plano / `visualCue` | Transmisión de Lira | Integración y control |
| --- | --- | --- | --- |
| 0–3 | `chronos-routine` | «Turno tranquilo, piloto. Mantén libre el corredor.» | Chronos en funcionamiento. Presentación ilustrada; como máximo se bloquea el control inicial hasta los 9 s. |
| 3–6,3 | `convoy-clearance` | «Convoy C-17: acceso autorizado. Traigan el suministro.» | El convoy ya se aproxima en la ruta existente; la autorización procede de una firma aparentemente válida. |
| 6,3–9 | `sabotage-lock` | «Esa firma… ¡No están frenando!» | La maniobra contradice el permiso. La preparación gráfica corresponde al atacante y al reactor reales. |
| 9–13,2 | `reactor-breach` | «¡Han perforado el reactor! Todas las naves: evacuación.» | Una única destrucción. Se libera el pilotaje al llegar a la ruptura; el arte introductorio revela gradualmente la estación existente entre 9 y 11,4 s. |
| 13,2–19,2 | `log-transfer` | «Te envío el registro. Las claves del convoy fueron alteradas.» | El jugador ya pilota. Se comunica por qué debe sobrevivir y qué prueba transporta, sin otorgar una recompensa económica. |
| 19,2–26 | `perimeter-escape` | «Llévalo a Gaia. No permitas que recuperen el registro.» | El atacante se retira y empieza la recuperación del rastro. No se vuelve a detonar el reactor al terminar el plano. |

Los seis planos tienen índices estables `0–5`. La ilustración inicial no sustituye el paisaje durante todo el juego: su `backgroundAlpha` empieza en 1, se reduce entre 9 y 11,4 s y después es 0. Las transmisiones pueden continuar acompañando el pilotaje hasta los 26 s. La integración debe mantener la lectura del corredor y los controles.

**SALTAR** sólo oculta la presentación y libera el control. No adelanta la ruta, no elimina la onda, no recoge CRONIUM, no cambia las semillas y no resuelve un objetivo. La primera amenaza jugable conserva su condición de aparición posterior a los 9 s. Se puede desactivar la apertura desde una preferencia o repetirla explícitamente al seleccionar la primera etapa; esa preferencia pertenece a los ajustes existentes, no a un servicio nuevo.

## Historia durante el trayecto

| Momento / señal real | Personaje | Contenido y consecuencia |
| --- | --- | --- |
| Ruta 38 s | Lira | Los asaltantes buscan borrar el registro. Da motivo a la persecución; no genera un enemigo por sí misma. |
| Ruta 76 s | N-7 | El CRONIUM permite reconstruir la trayectoria del convoy. Recoger orbes pertenece al objetivo real. |
| `module-recovered` | Mira | Reconoce el emisor recuperado y propone preparar sus anclajes en C9. Sólo se emite si el jugador ha recogido la pieza. |
| Ruta 112 s | N-7 | Confirma que Chronos queda atrás y conserva el registro. La estación debe perder presencia de forma continua. |
| Ruta 177 s | Mira | Abre el contacto del refugio C9 antes del atraque. No abre ni compra nada automáticamente. |
| `c9-arrival` | Mira | Ofrece refugio y reparación de emergencia. La pantalla de taller conserva precios, saldo y acciones reales. |
| `c9-departure` | Mira | Entrega el rumbo hacia Gaia después de salir del servicio. No se salta el resto de la etapa 1.6. |
| Ruta 256 s | N-7 | Gaia aparece como destino reconocible mientras crece su escala. |
| Ruta 292 s | Atlas | Identificación obligatoria en el corredor de CRONIUM. El aviso explica la frontera, sin revelar trayectorias de sus disparos. |
| Ruta 332 s | N-7 | Detecta que la firma de nuestra nave fue clonada. Anticipa el motivo del bloqueo. |
| `atlas-entry` | Atlas | «Tu firma coincide con el convoy atacante. Entrega el CRONIUM.» Empieza el encuentro real bajo su propia lógica. |
| `atlas-phase-two` | Atlas | Reconoce registros contradictorios, pero conserva el bloqueo. La transmisión breve no sustituye las señales mecánicas de sus ataques. |

Las llamadas señaladas se disparan desde hechos reales del juego, no desde un temporizador que presuponga que el jugador compró una pieza o venció. La lógica narrativa no crea compras, saldos, daño, activaciones de armas ni enemigos.

## Desenlace del trayecto y pista Vulkar

`atlas-disabled` sólo se comunica después de la resolución real de Atlas y de su entrada registrada en este controlador. Inicia un epílogo de ocho segundos; el padre proporciona los segundos transcurridos desde esa resolución usando su reloj de juego existente. La ruta permanece en 360 s. Pausar detiene también el epílogo.

| Segundos desde resolución | Personaje | Línea |
| --- | --- | --- |
| 0–2 | Atlas | «Registro verificado. Suspendiendo el bloqueo.» |
| 2–5 | Iria | «Comandante Iria. Usaron tu señal para atacar Chronos.» |
| 5–8 | Iria | «El convoy vino de Vulkar. Tienes paso libre.» |

A los ocho segundos `snapshot().aftermathReady` es verdadero. La integración puede entonces ofrecer continuar y completar el cierre mediante el guardado habitual. El controlador **no** llama a `completeLevel`, concede Gemelo, acredita chatarra ni abre Vulkar. Esas operaciones siguen perteneciendo al journal de victoria, a la economía y a la progresión del juego. El destino siguiente exige la conexión geográfica y editorial que determine la campaña; esta pista no justifica teletransportar la nave ni saltar contenido existente.

## Contrato de integración

Fuentes del incremento:

- `src/game/narrative/chronos-chapter.js`: catálogo inmutable, normalizador y controlador pequeño.
- `tests/chronos-chapter.test.mjs`: pruebas de tiempos, reentrada, señales únicas, omisión, preferencia y ausencia de efectos económicos.

API:

```js
const story = createChronosChapterStory({
  checkpoint: normalizedStoryRecord, // null en un perfil sin esta clave
  routeElapsed: flight.snapshot().elapsed,
  introEnabled: settings.showChapterIntro !== false,
  replayIntro: false
});

story.advance({
  elapsed: flight.snapshot().elapsed,
  playing: state === 'playing',
  // Sólo tras la resolución real: diferencia del reloj de juego existente.
  aftermathElapsed: atlasResolved ? playedElapsed - atlasResolvedAt : undefined
}, consumeStoryCue);

story.signal('module-recovered', consumeStoryCue); // recogida real
story.signal('c9-arrival', consumeStoryCue);       // servicio real
story.signal('c9-departure', consumeStoryCue);     // salida real
story.signal('atlas-entry', consumeStoryCue);     // encuentro real
story.signal('atlas-phase-two', consumeStoryCue); // cambio de fase real
story.signal('atlas-disabled', consumeStoryCue);  // resolución real
story.skipIntro();
```

`advance(view, emit)` recibe una instantánea, **no delta**. `emit` recibe únicamente transmisiones con `id`, `speakerId`, `speaker`, `text`, `duration`, `visualCue` y `audioCue`. Los IDs se marcan antes de ejecutar el callback para evitar repetición por callbacks reentrantes o fallidos. Las líneas ya caducadas se consideran cruzadas sin reproducir de golpe todas las radios antiguas.

El padre actualiza primero la instantánea de ruta y después notifica las señales del mismo momento. Los límites geográficos mínimos evitan emisiones arbitrarias antes de que puedan ocurrir: pieza desde 72 s, servicio desde 180 s y frontera desde 359 s, con una tolerancia de 0,05 s por el orden del frame. El controlador no considera esos límites una prueba de que el hecho ocurrió: la llamada sigue siendo responsabilidad de la integración.

`snapshot().opening` ofrece `active`, `controlsLocked`, `canSkip`, `shotIndex`, `visualCue`, `progress`, `shotProgress`, `backgroundAlpha` y `dialogue`. `snapshot().aftermath` ofrece la línea de la resolución y su tiempo. `carriesRecord` es una indicación narrativa derivada de la ruta, no un artículo de inventario ni un permiso económico.

## Guardado, repetición y conservación

Clave propia: **`neonCatcher.chronosChapterStory.v1`**, bajo el namespace habitual de la edición. No reutiliza ni reinterpreta claves de N-7, Journey, equipo o viaje. `checkpoint()` produce versión, versión de contenido, ID de ruta, tiempo de ruta, tiempo del epílogo, consumo de apertura y listas acotadas de señales/diálogos.

`normalizeChronosChapterCheckpoint(value)` valida sin mutar. Rechaza versiones ajenas, tiempos no finitos, IDs desconocidos, duplicados, señales incoherentes y líneas futuras no justificadas por haber omitido la apertura. La capa de guardado del padre debe conservar el dato inválido antes de reemplazarlo y no publicar una migración inventada.

Al restaurar una etapa, el padre pasa su tiempo geográfico real mediante `routeElapsed`. El controlador consume líneas ya cruzadas y descarta señales futuras respecto de esa entrada. No reproduce toda la introducción en un checkpoint avanzado. Una nueva instancia es necesaria si el viaje retrocede por reinicio; `advance` no rebobina silenciosamente. Repetir la apertura requiere `replayIntro: true`, `routeElapsed: 0` y seleccionar realmente la primera etapa desde la UI. Ninguna repetición concede recompensas.

## Arte, sonido y límites pendientes

`visualCue` y `speakerId` son conexiones de presentación, **no archivos artísticos ya certificados**. Los nuevos retratos Lira/Mira/Iria, planos introductorios, su registro de procedencia, loader, animación, render y caché se integran por el responsable correspondiente. Los maestros y fondos actuales siguen recuperables. No se presenta una hoja de contactos como captura del juego.

Los `audioCue` identifican ambiente de Chronos, radio, permiso, anomalía, reactor, transferencia, C9, balizas y mando Gaia. Este módulo no genera música ni contiene archivos de audio. Su reproducción debe respetar volumen, silencio, desbloqueo por gesto y Safari/iOS; un ID nombrado no equivale a una pista producida o integrada.

Prueba ejecutada de este incremento: **`node --test tests/chronos-chapter.test.mjs` — 17/17, salida 0**. Son pruebas puras sobre el controlador y los contratos de la ruta/destrucción existente; no certifican la partida, rendimiento, recursos de arte nuevos ni un dispositivo. Falta integrar en los módulos existentes, regenerar mediante el pipeline y comprobar apertura, salto, repetición, ruta completa, C9, Atlas, desenlace y guardado mediante UI y capturas auténticas. Aceptación artística y prueba física continúan pendientes.
