> Integración18/10/2026: ambas exportaciones están en `assets/` y el bus musical del juego. ReproducciónAAC nativa con gesto verificada en ambos viewports Chromium del SHA`f634a46`, con pausa/volumen/fallback cubiertos por pruebas. [Informe y evidencia](../../../docs/production-reports/CHAPTER_ONE_LIVING_JOURNEY_2026-10-18.md). Audiciónhumana, mezcla final ySafari/iPhone siguen pendientes. Las recomendaciones originales de entrega siguientes se conservan como historial.

# Capítulo 1 · música original v1

Producción: 18/10/2026, por Codex para NEON CRONIUM. **IN_REVIEW**: archivos reales, composición y decodificación verificadas; aceptación musical del propietario, mezcla dentro del juego y certificación física pendientes. No se ha realizado una audición humana en esta sesión.

| Recurso | Función y arreglo | Duración | Exportación |
| --- | --- | --- | --- |
| `chapter1_opening_score_v1` · «Chronos: la ruptura» | Introducción en re menor/add9, tema de cinco notas, aproximación del atacante, percusión y metales sintéticos en la ruptura, ostinato de huida y resolución. 224 eventos, 96 BPM. | 28 s, sin bucle | AAC-LC estéreo, 44.100 Hz, 400.143 B |
| `chapter1_voyage_score_v1` · «El rastro entre las estrellas» | Desarrollo del tema de apertura: ocho armonías, dos variaciones, cuerdas pulsadas, bajo, teclas, campanas, percusión suave y espacio entre frases. 342 eventos, 80 BPM. | 48 s, bucle de 0 a 48 s | AAC-LC estéreo, 44.100 Hz, 683.409 B |

Los instrumentos se han renderizado offline: cuerda pulsada por Karplus–Strong, conjuntos aditivos con afinación ligeramente separada, pad filtrado, piano/tine FM, campanas inarmónicas, bajo y percusión modelada. La mezcla contiene reverberación por filtros peine y difusores, más eco estéreo moderado. No se presentan como instrumentos humanos grabados ni como una orquesta real. El motor del juego reproduce archivos de audio: no necesita reproducir estos sintetizadores durante la partida.

## Archivos y reproducción

- Maestros PCM WAV de 24 bits/44.100 Hz estéreo: 7.408.902 y 12.700.902 bytes. El MIDI conserva notas, programas orientativos y tempos; el sonido definitivo está descrito en el script, no en un banco General MIDI.
- `*.json`: eventos completos y puntos musicales. `inventory.json`: tamaños, SHA-256 y medidas de los maestros/exportaciones. `render-measurements.jsonl`: salida real del render.
- `runtime/*.m4a`: exportaciones listas para integrar. Se entregaron aquí primero para que el integrador las copie a `assets/` en un snapshot controlado.
- `check-audio-browser.cjs` y `browser-audio-results.json`: comprobación de los archivos mediante Chromium real.
- `opening-loudness.txt` y `voyage-loudness.txt`: medidas EBU R128 sobre los AAC exportados.

```sh
python3 art-source/audio/chapter1-score/render_score.py
node art-source/audio/chapter1-score/check-audio-browser.cjs
```

Dependencias de render usadas: Python 3, NumPy 2.3.5, SciPy 1.17.0 y FFmpeg 7.1.5. No hay peticiones de red, servicios musicales, herramientas facturables ni muestras externas. El render es determinista con semilla `20261018`; los hashes de referencia corresponden a esas versiones de las herramientas.

## Medidas y límites

Los dos maestros tienen **cero muestras recortadas**. Apertura: pico −3 dBFS, RMS −19,67 dBFS; AAC medido a −19,1 LUFS y pico verdadero −3,1 dBFS. Viaje: pico −7 dBFS, RMS −19,63 dBFS; AAC a −19,1 LUFS y pico verdadero −6,9 dBFS. La diferencia de pico mantiene el golpe de Chronos sin hacer que el tránsito suba bruscamente de volumen percibido.

El bucle se renderiza durante tres vueltas y se extrae la central: conserva las colas de la armonía anterior. El salto de muestra en la costura WAV mide 0,001469 (−56,66 dBFS), por debajo del percentil 99 de las diferencias normales entre muestras, 0,018172. Esta medida no sustituye escuchar el bucle. No se promete que `HTMLAudioElement.loop` sea idéntico en todos los Safari; la decodificación AAC real de Chromium conserva exactamente 28 y 48 segundos.

Chromium 154.0.8037.57: **4/4 comprobaciones aprobadas**, salida 0: decodificar ambas exportaciones, iniciar audio real con un clic y reproducir el viaje mediante un nodo con bucle 0–48. La señal fue no nula en el analizador. Esto no demuestra altavoces físicos, calidad estética, balance con efectos o integración dentro del ejecutable.

Memoria Float32 decodificada: apertura 9.878.400 B y viaje 16.934.400 B; ambas a la vez 26.812.800 B. La compresión AAC reduce la descarga a 1.083.552 B, no la memoria del audio decodificado.

## Integración recomendada

Reutilizar el contexto/bus musical existente; abrirlo o reanudarlo desde el gesto de iniciar la partida. Apertura de 0 a 28 s: la ruptura musical ocurre a **9,0 s**, alineable con el reloj de Chronos. Al reanudar una etapa posterior no repetir la introducción. Después, usar el viaje en bucle a volumen subordinado a los efectos; ambos cues tienen una sonoridad integrada similar.

Pausa y segundo plano detienen el transporte. Al restaurar un checkpoint, se puede reiniciar la frase del viaje sin afirmar guardado exacto de la posición musical. Ajustes y silencio controlan estos archivos junto con el resto de la música. Evitar reproducir simultáneamente la antigua melodía procedural. Una transición de 120–250 ms evita cortes secos; liberar la referencia al buffer de apertura cuando deja de usarse mantiene acotada la memoria. No cargar audio de otros capítulos al arrancar.

## Procedencia y licencias

Composición, arreglos, síntesis y script se crearon para este proyecto en esta sesión. **No se incorporan melodías, grabaciones, muestras, impulsos de reverberación o bancos de sonidos ajenos.** La documentación de este lote no cambia la licencia global del proyecto ni concede derechos de terceros. La titularidad/licencia editorial definitiva del proyecto sigue correspondiendo a su propietario.

Se inspeccionaron `/usr/share/sounds/sf2/TimGM6mb.sf2` y `/usr/share/doc/timgm6mb-soundfont/copyright`. Ese paquete declara GPL-2 y muestras de procedencia mixta PD/GPL, sin una excepción explícita de salida en el archivo consultado. **No se utilizó ni se redistribuye ese soundfont**, ni FluidSynth. Se eligió instrumentación sintetizada original para evitar introducir esa dependencia de procedencia. NumPy/SciPy/FFmpeg se usan como herramientas offline; sus bibliotecas o ejecutables no se añaden al juego.
