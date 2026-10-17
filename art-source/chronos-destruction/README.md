# Chronos: destrucción de la estación

Seis estados ilustrados del acontecimiento de destrucción del **nivel clásico 1 de 10**. No representan seis niveles, ni una campaña terminada.

`generated-master.png` conserva la generación original con transparencia. `packed-master.png` normaliza cámara/pivote y deja margen entre celdas. El recurso de ejecución es `assets/chronos_destruction_atlas_v1.webp`: 1536 × 1024, seis celdas de 512 × 512, pivote común (256, 256). Cada celda contiene una modificación estructural auténtica de la estación.

Orden: precrítico → brecha → separación del anillo → liberación → dispersión → restos. Reproducir una sola vez mediante el reloj existente del acontecimiento, manteniendo el último estado. No iniciar otro RAF, no reproducir en bucle y no confundir los seis estados con una animación fluida de docenas de fotogramas.

El planeta, el fondo espacial, la onda expansiva y los restos próximos se componen por separado en el renderizador. La textura no contiene fondos, planeta, texto ni HUD. El tamaño del sprite no define ninguna colisión.

## Reproducir la exportación

Desde la raíz del repositorio, con ImageMagick 7:

```sh
node art-source/chronos-destruction/pack-atlas.mjs
```

El script solo recorta, aplica una escala uniforme a los seis estados, posiciona sus anclajes y exporta. Conserva el maestro original y elimina exclusivamente sus temporales propios. Dimensiones, hashes, rectángulos, pivotes y procedencia están en `metadata.json`.

## Verificación y límites

`qa-results.json` registra seis hashes de píxeles distintos, alpha RGBA, esquinas transparentes y un margen mínimo de 34 píxeles. Se revisaron el recurso y su composición sobre azul casi negro. `qa-dark-background.jpg` es una **composición de QA del atlas**, no una captura del juego. Algunas herramientas muestran el RGB residual bajo transparencia; la composición aplica el alpha real.

Estado: **IN_REVIEW**. Integración, carga en navegador, sincronización, duración, reducción de destellos, capturas reales y aceptación del propietario corresponden al cierre de integración. No hay certificación física de iPhone.

## Procedencia y dirección

Generado realmente con `image_gen.imagegen` el 17/10/2026 a partir de la última referencia de destrucción de Chronos entregada por el propietario. Se inspeccionó el atlas previo `art-source/unified-flight/atlas-packed-master.png` para conservar la identidad de la estación.

La solicitud de generación especificó una estación orbital de doble anillo, cerámica blanca y metal oscuro, cuatro brazos científicos, reactor cristalino cian, descargas violetas, misma cámara y seis modificaciones progresivas de su estructura. Solicitó transparencia y excluyó planeta, estrellas, fondos, textos, bordes e interfaz. El archivo generado original se conserva íntegro; no se descargaron recursos externos.

La procedencia no equivale a una validación jurídica independiente de las referencias del propietario. La aceptación artística continúa pendiente.

## Cierre de integración

Conectado al primer nivel clásico en73e117b. El reloj de ruta selecciona los seis estados y las cuatro poses del frente energético durante7,2s; el último estado se conserva mientras la estación se aleja. Chromium comprobó las seis celdas realmente dibujadas, pausa y respaldo ante404. Evidencia: `docs/production-reports/evidence/chronos-destruction/browser-event-02/results.json`. La aceptación artística y Safari/iPhone físico siguen pendientes.
