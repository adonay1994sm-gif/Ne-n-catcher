# Controles con dos contactos — Chromium real

El script `scripts/two-touch-browser-smoke.cjs` utiliza contactos CDP simultáneos sobre los controles reales. La única instrumentación del juego es una función de lectura. No inserta entidades, no modifica munición, reloj, casco, guardados ni progreso y no solicita otro RAF.

## Comparación inicial

- `touch-baseline-01/`: primera ejecución, conservada con `harness-used.cjs`. El helper de liberación CDP estaba equivocado; leer su `HARNESS_LIMITATION.md`. No atribuir los fallos de liberación al juego.
- `touch-baseline-02/`: helper corregido, paquete `d93b1352c9a036ccec0fc6337b02e41acd8a7832`, `dirty=false`, revisión `3ab2e4eb9b54164b0f63eb7d7d2148cc39680f0d6cf3411f39b508f0e1d0ae53`. Salida **1**, 4/7 grupos aprobados y 3/7 fallidos bajo el contrato solicitado. Paquete intacto. El segundo contacto produjo `pointerdown` con `isPrimary=false`, pero cero disparos inmediatos; mantener el botón tampoco disparó ni consumió cargas. Cero errores JavaScript, consola o peticiones fallidas.

El modo `--baseline` conserva los fallos y devuelve salida 1. No transforma la versión anterior en una aprobación. Cada resultado incluye argumentos exactos, SHA, estado del árbol, hashes del paquete, observaciones y capturas auténticas.

## Alcance

Se prueban ambos órdenes de contacto, movimiento relativo mientras se dispara, propiedad independiente al soltar, batería y cadencia, cancelación, pausa/reanudación, reinicio, clic y teclado. Las etapas se abren mediante el selector normal después de activar la casilla de QA de la preview.

El perfil opcional `--fallback-fixture` oculta la API `PointerEvent` y suprime los eventos Pointer nativos para probar los TouchEvents CDP. Es una simulación explícita de capacidad dentro de Chromium; **no es Safari ni una prueba física de iPhone**. El perfil nativo no altera capacidades del navegador.

## Compilación integrada

- `touch-after-01/`: **13/14** grupos aprobados, salida **1**; el único fallo provenía de leer el movimiento antes de su entrega por el compositor. La evidencia y el harness exacto se conservan con explicación propia.
- `touch-after-02/`: interrumpida, salida **130**, por una diferencia de mayúsculas entre el nombre CDP y el evento DOM en el helper de espera. Es un fallo del harness; no establece un fallo del juego.
- `touch-after-03/`: **14/14** grupos aprobados, salida **0**, 146.488 ms. Perfil Chromium CDP nativo **7/7** y fixture de capacidad TouchEvent **7/7**. Paquete `413eb95efe4005e230f95654d0ef7fa7ef7e60e5` más cambios locales, revisión `49be88f85e21008b7b08549378af6a52f2bee6f224da324720d2cf309d0fbd93`, `dirty=true`. Los cuatro archivos runtime y la portada mantuvieron sus hashes durante toda la ejecución. Cero peticiones de `ship_frame_*.webp`, errores JavaScript, consola o peticiones fallidas.

La última ejecución verifica también comenzar a mantener DISPARAR **con la batería vacía**: registra la intención, conserva cero cargas y dispara una sola vez al completarse la recarga jugada. El botón permanece habilitado para recibir el contacto y comunica el estado no disponible mediante `aria-disabled`. No hereda contactos tras pausa ni reinicio.

Las capturas `native-pointer-touch-launcher.png`, `native-pointer-touch-pilot-and-fire.png` y `native-pointer-touch-held-recharge.png` muestran la compilación real. `harness-used.cjs`, `run.log` y `results.json` conservan la fuente y los resultados exactos. No se modificaron las fuentes ni el paquete para corregir el harness.
