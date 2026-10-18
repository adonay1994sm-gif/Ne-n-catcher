# NEON CRONIUM — foley de combate original v1

Banco original de ocho familias, cada una con dos interpretaciones distintas:

| Evento | Construcción sonora | Integración prevista |
| --- | --- | --- |
| `phaser` | Descarga de condensador, barrido de ionización y gas | Emisión real del arma básica |
| `missile-launch` | Encendido, expulsión mecánica y aceleración de escape | Misil realmente debitado y emitido |
| `impact-metal` | Golpe corto, resonancias inarmónicas de chapa y grava | Blindaje, maquinaria o roca metálica |
| `impact-plasma` | Crepitación eléctrica y descarga descendente | Impacto energético |
| `hull-hit` | Resonancia de estructura próxima y presión grave | Daño real recibido por la nave |
| `enemy-break` | Rotura inicial, tres fracturas secundarias y restos | Destrucción real de enemigo |
| `atlas-charge` | Desbloqueo pesado de servos y energía inestable | Inicio real del ciclo mecánico de Atlas |
| `atlas-collapse` | Cuatro fallos internos y arcos residuales | Desactivación final de Atlas, una vez |

Los sonidos son estilización arcade de la percepción a bordo y comunicaciones
tácticas: no se presentan como propagación acústica literal por el vacío.
No hay samples, voces, soundfonts, grabaciones de terceros ni servicios de pago.
El banco no pretende ser una grabación de orquesta ni doblaje humano.

## Fuentes y reproducción

- `render_bank.py`: autoría offline reproducible. Python/NumPy/SciPy construyen
  capas de ruido filtrado, resonancias, envolventes y secuencias temporales.
- `masters/*.wav`: 16 maestros mono PCM24/48 kHz, todos con hash distinto.
- `combat_sfx_atlas_v1.wav`: atlas maestro con 120 ms de silencio entre cues.
- `assets/combat_sfx_atlas_v1.m4a`: AAC128k para ejecución, exportado con FFmpeg.
- `assets/combat_sfx_atlas_v1.json`: offsets, duración, prioridad, ganancia y
  límites de repetición. El módulo runtime contiene el mismo mapa y una prueba
  compara ambos para evitar que una edición desincronice el sonido.
- `measurements.json`: hashes, tamaño, picos/RMS PCM y memoria decodificada.
- `aac-decode-measurements.json`: decodificación **FFmpeg** real, picos, duración,
  RMS, ataque y centro espectral de los 16 segmentos. No certifica Safari.
- `audition.html`: escucha manual de cada segmento, siempre iniciada por botón.

Regeneración desde la raíz del repositorio:

```sh
python3 art-source/audio/combat-sfx-v1/render_bank.py
node --test tests/combat-sfx.test.mjs
```

La nueva exportación debe revisarse y pasar de nuevo las pruebas de navegador,
porque los hashes dependen también de la versión concreta del encoder FFmpeg.

## API de integración

```js
const combatSfx = NeonCampaign.createCombatSfx({context: audioCtx, output: existingFxOutput});
combatSfx?.load();                         // una carga, sin autoplay
combatSfx?.setVolume(settings.fx / 100);  // bus existente, volumen normalizado
combatSfx?.setEnabled(settings.fx > 0);
combatSfx?.setPaused(false);              // al reanudar una partida activa
combatSfx?.play('missile-launch', {eventId: 'missile-42', pan: -.25});
```

`play()` devuelve `false` también por silencio, pausa o control de voces:
**usar el tono antiguo como fallback sólo si `snapshot().ready === false`**,
no cuando un sonido es descartado deliberadamente. La comprobación general de
mute/pausa del juego debe seguir bloqueando también el fallback.

El módulo no crea AudioContext, timers, RAF, osciladores permanentes o un reloj
de música. Reutiliza el contexto y la salida aportados. Máximo ocho voces, suma
de ganancias máxima .95, límites por familia, alternancia de variantes y
deduplicación acotada de los últimos 256 identificadores. Un daño al casco o
Atlas desplaza sonidos de prioridad inferior; nunca al revés. Pausa, silencio,
volumen cero y `dispose()` detienen las voces; no se reproducen pendientes al
reanudar. El paneo se limita a ±.75 y es opcional si falta StereoPanner.

## Investigación de código abierto

Se consultaron README y licencias **primarias fijadas por SHA**, sin ejecutar
instaladores ni incorporar código:

- [jsfxr](https://github.com/chr15m/jsfxr/tree/b7b6aa27d62f8f356db267276bf54b451555c49d):
  **Unlicense**, no MIT. Generador de efectos arcade. Útil para bocetos rápidos,
  pero sus presets no sustituyen el diseño de materiales de este banco.
- [howler.js](https://github.com/goldfire/howler.js/tree/1d3053576a860e9854645493ad6c4a72c6cc6e45):
  MIT. Resuelve sprites de audio, caché y varias plataformas; añadirlo aquí
  duplicaría una capa de política que el proyecto ya posee. No instalado.
- [Tone.js](https://github.com/Tonejs/Tone.js/tree/de9df332ca7573b90a9aaca10c0729a3091dda0a):
  MIT. Marco musical con transporte y síntesis. La mejora inmediata es foley
  renderizado, no otro transporte musical en paralelo. No instalado.

Evidencias y hashes de licencia: `research/sources.json`. Se conserva la
investigación; no se declara que el juego utilice esas bibliotecas.

## Alcance de la verificación

Los tests de contrato comprueban carga, errores, deduplicación, prioridades,
segmentos, pausa, mute, recuperación y liberación de memoria. FFmpeg verifica
la exportación AAC. **Escucha humana, mezcla subjetiva, navegador integrado y
Safari/iPhone físico requieren sus evidencias propias.** Ni un espectro ni
28 tests equivalen a que una persona haya escuchado y aprobado estos sonidos.
Las dos músicas del capítulo anterior se conservan; este lote no las regenera.
