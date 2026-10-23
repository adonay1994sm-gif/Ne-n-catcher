# CH-01 Scout Drone — producción de arte

Fecha de preparación: 2026-10-15 UTC. Generaciones originales: 2026-10-14 UTC.
Estado: **IN_REVIEW**. Recurso producido y validado como imagen; todavía no certificado como enemigo integrado.

## Inventario previo

Se revisaron `ART_DIRECTION_NEON_CRONIUM.md`, `ASSET_PRODUCTION_150.json`, `ASSET_PRODUCTION_MAP.md`, `assets/`, `art-source/` y los nombres CH-01/CH01/ch01/atlas/sprite en `/workspace`.

El informe Art Pass A mencionaba un atlas externo de diez poses, pero no apareció ningún binario CH-01 recuperable en este entorno. No se sustituyó ni borró ese trabajo: permanece como entrega externa pendiente de recuperación. Se utilizó el dossier canónico ya presente en `art-source/references/gaia_enemy_dossier_v1.jpeg`, inspeccionado visualmente antes de producir la nueva versión.

## Entrega real

Todos los archivos están provisionalmente en `art-source/enemies/ch01/`. No se añadieron archivos a `assets/` ni se modificaron el loader, el inventario global o el juego durante esta entrega artística.

| Archivo | Formato y dimensiones | Bytes | Finalidad |
| --- | --- | ---: | --- |
| `ch01-master-v1.png` | RGBA PNG, 1024 × 1536 | 2.601.589 | Primera generación, conservada como histórico. |
| `ch01-master-v2.png` | RGBA PNG, 1024 × 1536 | 2.464.992 | Maestro activo corregido. |
| `ch01-atlas-v1.webp` | RGBA WebP, 1024 × 1536 | 484.814 | Atlas optimizado para futura integración. |
| `ch01-contact-sheet-dark.jpg` | RGB JPEG, 768 × 1152 | 279.118 | Contacto de revisión sobre fondo azul oscuro; no es asset del juego. |
| `ch01-atlas-v1.json` | JSON | Véase archivo | Rectángulos, estados, tiempos, pivote, reglas y procedencia. |
| `ch01-validation.json` | JSON | Véase archivo | Resultado real del análisis de píxeles y metadatos. |

El atlas ocupa **6.291.456 bytes (6 MiB) al decodificarse en RGBA**, sin contar copias adicionales que pudiera crear el navegador. Los 484.814 bytes del WebP no equivalen al uso de memoria en Canvas. Debe cargarse una sola vez y compartirse entre los enemigos; no convertir cada frame en otra imagen decodificada.

## Modelo y animaciones

CH-01 tiene blindaje blanco titanio, estructura grafito, sensor cian y señales rojas. Mira hacia abajo y sus propulsores hacia arriba. El atlas contiene 4 columnas × 6 filas, con celdas de 256 × 256 y pivote normalizado `(0.5, 0.5)`. Tamaño inicial sugerido: 128 unidades lógicas; la hitbox sigue perteneciendo a la lógica del juego.

| Fila | Índices | Contenido real |
| --- | --- | --- |
| 0 | 0–3 | Aparición con despliegue progresivo de aletas. |
| 1 | 4–7 | Reposo con variaciones de propulsión y luz. |
| 2 | 8–11 | Giro izquierdo, neutral, giro derecho, neutral; cambia la pose del modelo. |
| 3 | 12–15 | Armas desplegadas, carga, disparo y recuperación. |
| 4 | 16–19 | Impacto, blindaje deteriorado, aleta dañada y estabilización. |
| 5 | 20–23 | Ruptura, núcleo expuesto, separación de restos y dispersión. |

El JSON declara aparición de 430 ms; reposo a 8 FPS; avance neutral a 10 FPS; ataque de 500 ms; impacto de 250 ms; destrucción de 490 ms. Son tiempos propuestos de integración, aún pendientes de equilibrio en el combate real. Las poses de giro se seleccionan mediante velocidad lateral: no deben alternarse continuamente cuando el enemigo avance recto.

El evento `fire` aparece al entrar en el segundo frame de ataque (160 ms desde el inicio); `coreBurst`, al entrar en el segundo frame de destrucción; `removeVisual`, al finalizarla. Son contratos de metadatos, no eventos implementados todavía en el director de encuentros. La muerte retira la hitbox inmediatamente y conserva el efecto visual hasta terminar. La destrucción no debe ser interrumpida por impacto, ataque o reposo.

## Producción y corrección

Se realizaron dos llamadas a la herramienta `image_gen`, ambas con fondo transparente:

1. Generación del atlas de 24 poses a partir del dossier Gaia, limitando la referencia al Scout Drone CH-01 de la primera fila.
2. Corrección del mismo atlas para acortar fogonazos y evitar que las estelas de disparo cruzasen hacia la fila de daño. El original se conserva íntegro en v1; el corregido se conserva como v2.

La primera generación tenía contenido visible que alcanzaba el borde inferior de celdas de ataque y el borde superior de celdas de daño. Por eso no se exportó como atlas activo. La corrección se verificó mediante inspección visual y alfa por celda.

La exportación no modifica la geometría del maestro: ImageMagick 7.1.1-43 convierte a WebP con calidad 84, método 6 y alfa de calidad 100. El contacto JPEG compone el atlas sobre `#07182D` para revisar sus bordes. El fondo gris visible en ciertas previsualizaciones de la imagen generada no es un fondo opaco del atlas; los archivos son RGBA.

Reproducción desde la raíz del repositorio:

```sh
node art-source/enemies/ch01/export-ch01.mjs
python3 art-source/enemies/ch01/verify-ch01.py
```

ImageMagick y Pillow son herramientas del entorno artístico; no se agregaron dependencias al producto. La generación por IA no se considera reproducible píxel a píxel: por eso se conservan ambos maestros y sus SHA-256 en los metadatos.

## Verificaciones ejecutadas

- Decodificación de PNG y WebP reales: correcta.
- Atlas 1024 × 1536 RGBA y 24 rectángulos dentro de límites: correcto.
- 24 frames con hashes de píxeles distintos: correcto.
- Margen visible mínimo por celda: al menos 8 px, medido sobre alfa ≥8/255; el resultado por frame queda en `ch01-validation.json`.
- Borde exterior de cuatro píxeles por celda: alfa máximo ≤2/255. Existe ruido de alfa casi transparente de la generación, pero no arte visible recortado en esos bordes.
- Frames, duraciones positivas y posiciones de eventos del JSON: correctos.
- Inspección del contacto sobre fondo oscuro mediante `view_image`: realizada; despliegue, giro, daño y destrucción muestran cambios visibles.
- `python3 art-source/enemies/ch01/verify-ch01.py`: salida 0. No es una prueba de combate, Safari ni iPhone.

## Procedencia y derechos

Recurso generado para NEON CRONIUM con la herramienta de imágenes disponible, usando como referencia un archivo ya existente del proyecto. No se descargaron imágenes de bancos de terceros ni se contrató un servicio nuevo. Se registran los identificadores de salida de la herramienta y las huellas de los archivos en el JSON.

La procedencia jurídica del dossier heredado no se ha auditado independientemente; esta entrega no equivale a una certificación legal de derechos. No se presentan el dossier o el resultado como obra manual de un artista humano.

## Integración pendiente

1. Registrar un único atlas en el inventario y loader existentes; decidir su ruta definitiva en `assets/` antes del build.
2. Conectar la selección de poses, la animación de ataque y sus eventos al enemigo real, manteniendo el único bucle legacy.
3. Conectar daño y muerte sin perder colisiones ni recompensas.
4. Verificar captura y secuencia completas dentro del juego a tamaños móviles, con fondos reales.
5. Medir carga, memoria y continuidad visual. La prueba física iPhone sigue pendiente.
6. Actualizar las tres entradas del catálogo global de manera coordinada; no convertirlas en `READY` solo por disponer de este atlas.

No se ha realizado commit ni build desde el agente de arte; el responsable de integración conserva esa responsabilidad.
