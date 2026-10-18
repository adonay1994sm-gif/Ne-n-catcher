# Entrega especialista audio · v2 · 18/10/2026

**Fuentes congeladas.** Sólo se modificaron `src/game/audio/combat-sfx.js`,
`tests/combat-sfx.test.mjs`, `assets/combat_sfx_atlas_v2.{m4a,json}` y
`art-source/audio/combat-sfx-v2/`. No se compiló, no se abrió navegador, no se
modificaron fuentes legacy/manifiestos/service worker/bundles de otros agentes.

## Diagnóstico confirmado

`05-corridor-update.js:397–398`: el callback de proyectil real de
`advanceClassicPursuer`/`advanceClassicScout` sólo ejecuta `items.push(shot)`.
No emite sonido. `03-ui-game-flow.js:729` emplea `impact-plasma` para las
salvas de Atlas; una colisión no representa su emisor.

## Integración pendiente del propietario

1. En callback aceptado de la patrulla, después de push y sólo en clásico,
   `combatSound('enemy-phaser', shot.x)`. Los roles actuales son `raider`,
   `scout`, `interceptor`; ninguno representa cañón pesado todavía.
2. En evento Atlas `volley`, emitir **una** voz: `enemy-phaser` básico,
   `enemy-heavy` medio/super, usando `event.x` (no una voz por projectile).
   Los eventos del modelo ya son únicos; si se usa eventId, incluir sesión
   para que repetir el combate no silencie accidentalmente un número igual.
3. Fallback existente en `02-storage-audio.js`: añadir tonos provisionales de
   las dos familias sólo si banco no ready. Con banco listo, `play(false)` por
   mute/pausa/presupuesto **nunca** debe activar tone. Guardas previas actuales
   de `scoreSuspended`, `settings.fx<=0` y `state` deben mantenerse.
4. Manifiestos/load/precache: pasar al AAC+JSON v2 juntos. Mantener v1 y maestros
   históricos recuperables. El módulo rechaza duración v1 al cargar v2, evitando
   un desajuste cacheado que silencie los segmentos nuevos.
5. `tests/combat-sfx-legacy.test.mjs:42`: cambiar mockdecoded 13.68/656640 a
   15.96/766080; añadir regresión del callback/mute según integración.
6. QA navegador: `snapshot().playedByCue` es un mapa congelado nuevo de sonidos
   realmente iniciados. Comprobar `enemy-phaser` y `enemy-heavy` suben por tiros
   reales y que impactos no se confunden con esas emisiones. No es aceptación
   auditiva humana ni certificación Safari.

## Banco

20 interpretaciones originales = 8 familias previas×2 +2 nuevas×2.
Las 16 interpretaciones anteriores permanecen byte a byte idénticas, con los
mismos offsets. Nuevo contenido construido offline con ruido filtrado, capas
de transitorio/retroceso, barridos y resonancias propios; sin samples, DSP
externo copiado, licencias nuevas de assets, servicios de pago o motor audio.
Las herramientas NumPy/SciPy/FFmpeg instaladas sólo se usan para autoría.

- `enemy-phaser`: offsets13.68/14.08s, duración.28s, gain.19, prioridad2,
  cooldown.055s, polyphony3. Variación de tono offline2.5%.
- `enemy-heavy`: offsets14.48/15.22s, duración.62s, gain.28, prioridad5,
  cooldown.16s, polyphony2. Variación de tono offline2.2%.
- Maestro: 15.96s mono PCM24/48k; 2,298,284bytes.
- AAC: 277,049bytes; SHA256
  `81a09c0979225d81357cc45b9f45e833a8b751f8c424a95233bcb9ab0a249c27`.
- JSON: 3,049bytes; SHA256
  `ef92c62219e511fb53b054f4c5cbdfdfd281d70e5c574204df8823ce1c504a57`.
- Aumento comprimido AAC frentev1:36,046bytes.
- PCM Float32 autoría48k estimado3,064,320bytes. FFmpeg añade padding y mide
  duración15.978667s. Browser puede remuestrear y debe medirse aparte.
- Pico FFmpeg banco aislado−2.55255dBFS, cero muestras recortadas. No demuestra
  que la mezcla completa del juego nunca sature.
- Máximo8voces, presupuesto.95 y mismo contexto/gain/pausa/mute/dedup/budget.

Maestros, generador, mediciones, procedencia, README y escucha manual
`art-source/audio/combat-sfx-v2/audition.html` están conservados. El pequeño
auditorv1 histórico apunta al módulo runtime vivo y dejaría de funcionar con
la nueva duración; para reescucharv1 usar el WAVv1 o aislar su reproductor con
la versión histórica (no permitir un banco antiguo silenciosamente en v2).

## Verificación ejecutada

`python3 art-source/audio/combat-sfx-v2/render_bank.py`: exit0;20stems/15.96s,
exportación AAC y medición FFmpeg completas.

`node --test tests/combat-sfx.test.mjs`: **34/34 PASS**, exit0; registro
`art-source/audio/combat-sfx-v2/unit-tests.txt`. Cubre las dos emisiones,
variantes/dedup, cola inexistente antes/depuésdecarga, viejo banco rechazado,
mute/pausa/volumen/contextosuspendido, prioridad/budget y liberación.

`git diff --check -- src/game/audio/combat-sfx.js tests/combat-sfx.test.mjs`:
exit0. Hashes de entrega en
`/tmp/neon-combat-audio-followup-file-hashes.json`.

Integración legacy, build, navegador, escucha humana, mezcla y Safari físico
pendientes del integrador; no se declaran realizados por este especialista.
