# CRONIUM — reparación de contorno y nuevo atlas de energía

Lote artístico del 18/10/2026. Recurso original producido con `image_gen` para NEON CRONIUM. No se copiaron assets ni diseños de terceros. Los recursos históricos `cronium_fragment_v1.webp` y `core_frame_00..05.webp` se conservan intactos.

La revisión anterior detectó una franja negra opaca en el fragmento y esquinas visibles al recortar el centro del antiguo núcleo metálico. Este recurso representa directamente energía luminosa sin estructura sólida: no requiere eliminar por código una carcasa ni recortar su corona.

## Archivos

- `masters/cronium_energy_atlas_generated_v2.png`: maestro original RGBA de 1254×1254, conservado sin alterar.
- `masters/cronium_energy_atlas_normalized_v2.png`: maestro técnico RGBA de 512×512.
- `frames/cronium_energy_00..03.png`: cuatro fotogramas técnicos de 256×256.
- `../../assets/cronium_energy_atlas_v2.webp`: exportación de ejecución de 512×512, celdas de 256×256 en cuadrícula 2×2.
- `atlas.json`: dimensiones, pivote, estados reales, normalización y hashes.
- `qa/`: composiciones sobre negro, gris y blanco; escala nativa y resultados de pruebas estáticas.

## Integración propuesta

Leer siempre la **celda completa**. Origen por fotograma: `x = (frame % 2) * 256`, `y = floor(frame / 2) * 256`. Pivote local `(128,128)`, normalizado `(0.5,0.5)`. Todos los fotogramas tienen al menos **32 píxeles transparentes en los cuatro lados**. Nunca aplicar el recorte central del 46 % utilizado por el recurso anterior.

Cuatro estados reales: espiral ascendente, curva de plasma exterior, creciente envolvente y pulso agrupado con dos chispas. Sugerencia inicial reversible: 8 fps, bucle 0→1→2→3. Evaluar velocidad, escala y transición dentro de la partida; no se afirma que la animación esté integrada únicamente porque el atlas exista.

La corona ocupa aproximadamente 145–190 píxeles según pose. El tamaño de dibujo incluye el espacio transparente: al dibujar una celda de 40 px, el núcleo/corona visible mide aproximadamente 23–30 px. Mantener la geometría de recogida separada del margen del arte.

## Exportación y revisión

Ejecutar desde el repositorio:

```sh
node art-source/cronium-repair-v1/export-atlas.cjs
node art-source/cronium-repair-v1/verify-atlas.cjs
```

La exportación usa `sharp` para operaciones técnicas de atlas: eliminar alfa residual ≤2/255, alinear centros luminosos, reducir, añadir margen transparente y optimizar a WebP. No genera una ilustración mediante primitivas. Conserva el PNG original y registra los parámetros de cada celda. Decodificación de ejecución: **1 MiB RGBA** para todo el atlas.

Pruebas estáticas: seis comprobaciones aprobadas, cuatro fotogramas distintos, margen alfa exactamente cero, cero negro opaco, sin recortes de celda, tres fondos de control. Revisados visualmente los tres fondos: sin rectángulo oscuro ni costura rectangular. **No es una captura del juego ni una certificación de navegador/iPhone.** La integración y las pruebas del ejecutable corresponden al integrador; aceptación artística del propietario pendiente.
