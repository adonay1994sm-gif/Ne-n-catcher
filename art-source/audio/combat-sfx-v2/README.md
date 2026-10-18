# Foley de combate v2 · emisiones enemigas

Corrección de un defecto audible: los eventos de disparo de las patrullas no
llamaban al banco de sonidos y Atlas empleaba `impact-plasma` al emitir una
salva. Una colisión no describe el encendido de un cañón. Este banco añade dos
familias originales y conserva los dieciséis maestros/offsets del banco v1.

| Evento nuevo | Diseño audible | Evento que lo reproduce |
| --- | --- | --- |
| `enemy-phaser` | Contacto breve, dos bandas de plasma descendentes y resonancia del emisor; dos interpretaciones | Proyectil aceptado de patrulla, salva básica de Atlas |
| `enemy-heavy` | Contactor, golpe de retroceso grave y escape del cañón; dos interpretaciones | Salva media o poderosa de Atlas, una vez por salva |

Sonidos de abordo estilizados para arcade espacial; no una simulación de
propagación acústica en el vacío. Las variaciones de tono se construyen offline
(2,5 % y 2,2 %) y nunca varían la duración del evento en tiempo real. El paneo
de la posición de disparo permanece acotado a ±0,75. No se añaden muestras,
servicios de audio de pago, música, motores ni bibliotecas runtime.

## Artefactos y reproducción

- `render_bank.py`: autoría offline reproducible Python/NumPy/SciPy; exporta
  AAC mediante FFmpeg. Reutiliza el generador original v1 y añade las dos
  construcciones nuevas; no copia código DSP externo.
- `masters/*.wav`: veinte interpretaciones mono PCM24/48 kHz con hashes
  distintos; los dieciséis WAV anteriores siguen siendo idénticos byte a byte.
- `combat_sfx_atlas_v2.wav`: maestro de 15,96 s y separaciones de silencio de
  120 ms. Las nuevas emisiones empiezan a 13,68 s.
- `assets/combat_sfx_atlas_v2.m4a`: AAC128k de 277.049 bytes, frente a los
  241.003 bytes del banco anterior, conservado íntegro.
- `assets/combat_sfx_atlas_v2.json`: offsets y política de voces, comparados
  con el módulo runtime por la suite de contratos.
- `measurements.json`, `aac-decode-measurements.json`: pesos, hashes y
  decodificación real con FFmpeg; **no** certificación de Safari físico.
- `audition.html`: escucha manual bajo el servidor del repositorio; no produce
  sonido hasta que alguien pulsa un botón. La mezcla en partida debe revisarse
  por separado.

```sh
python3 art-source/audio/combat-sfx-v2/render_bank.py
node --test tests/combat-sfx.test.mjs
```

La regeneración depende de las versiones del encoder registradas en
`PROVENANCE.json`; volver a verificar hashes y navegador si se regenera.

## Integración y límites

`createCombatSfx` usa el contexto y bus del juego existente. Se mantienen ocho
voces máximas, presupuesto sumado de ganancia de 0,95 y prioridades/recuperación
de nodos. `enemy-phaser` tiene prioridad 2 y permite tres voces; `enemy-heavy`
tiene prioridad 5 y permite dos. Se emite una voz por salva, no por cada uno de
sus proyectiles. `snapshot().playedByCue` informa de voces realmente iniciadas
por familia; es una copia congelada para QA, no un segundo reloj.

Antes de que termine la carga puede usarse el fallback existente. Cuando el
banco está listo, `play(false)` significa también pausa, silencio, voz omitida
o presupuesto agotado: **no activar el fallback en ese caso**. Un disparo que
ocurrió durante carga, pausa o silencio nunca queda en cola ni se reproduce al
reanudar. El código de integración pertenece al propietario de los eventos y
no se ejecuta desde la animación de cada fotograma.

La duración se valida para rechazar un banco v1 cacheado bajo una referencia
v2: aceptarlo cortaría las nuevas emisiones. El service worker debe precargar
audio y metadatos v2 juntos y cambiar su revisión mediante el pipeline normal.
Las rutas y maestros v1 siguen siendo recuperables; no borrarlos.

## Pruebas y límites de la entrega del especialista

34/34 contratos del módulo aprobados: mapas/PCM retenidos, emisiones distintas,
identificadores únicos, alternancia, carga/errores/reintento, rechazo de banco
anterior, pausa/mute/volumen/contexto suspendido, colas inexistentes, prioridad,
presupuesto y liberación de nodos. La decodificación FFmpeg del banco aislado
registra un pico de −2,55 dBFS y cero muestras recortadas. No representa el pico
de la mezcla completa del juego. El buffer PCM de autoría ocupa 3.064.320 bytes
en Float32 mono/48 kHz; el decodificador puede añadir padding.

Integración por el agente principal, navegador con disparos reales, escucha
humana, mezcla artística y Safari/iPhone siguen pendientes al entregar estas
fuentes. No se atribuye al banco una aprobación subjetiva o física inexistente.

Los recursos son trabajo original para el propietario de NEON CRONIUM. No se
declara una nueva licencia pública del proyecto privado ni se incorpora audio
de terceros. Las herramientas instaladas de autoría no se distribuyen dentro
del juego; la investigación OSS anterior permanece en
`../combat-sfx-v1/research/` y no implica uso de esas bibliotecas.
