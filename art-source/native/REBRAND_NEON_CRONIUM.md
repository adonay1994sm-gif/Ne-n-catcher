# NEON CRONIUM — actualización del splash nativo

Fecha: 17/10/2026. Estado técnico del recurso: integrado en los tres PNG existentes del catálogo de lanzamiento iOS; revisión artística del propietario y prueba física pendientes.

El rótulo incrustado del splash se ha cambiado al nombre «NEON CRONIUM» mediante edición de imagen con `image_gen.imagegen`. Se revisaron visualmente la ortografía y la conservación de la composición: monograma N, marco cian, iluminación violeta/azul y fondo espacial. El icono de aplicación mantiene el monograma N y no se ha modificado.

## Archivos y trazabilidad

| Recurso | Dimensiones y formato | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `historical/launch-screen-master-before-cronium.png` | 1254 × 1254, PNG RGB; copia recuperable del maestro previo | 1429675 | `08f95bb1267cffa0b0d734ee86aa15636d40792141cfc26b46d21058384560e0` |
| `launch-screen-master.png` | 1254 × 1254, PNG RGB; resultado completo de la edición generada | 1454971 | `295c0e3be3446e7f9ae0160a95b291ab9c6a54a0acfe9c0d5cf66d979a51751f` |
| `../../ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png` | 2732 × 2732, PNG RGB | 2284914 | `843ccad6df0675616e86b77a58b97ca7363e61a296cd226a6a5c681b1a17a68a` |
| `../../ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png` | 2732 × 2732, PNG RGB; copia idéntica para el slot existente | 2284914 | `843ccad6df0675616e86b77a58b97ca7363e61a296cd226a6a5c681b1a17a68a` |
| `../../ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png` | 2732 × 2732, PNG RGB; copia idéntica para el slot existente | 2284914 | `843ccad6df0675616e86b77a58b97ca7363e61a296cd226a6a5c681b1a17a68a` |

Las rutas de la tabla son relativas a este documento. La exportación emplea únicamente conversión RGB y escalado Lanczos con Pillow desde el maestro generado; Pillow no ha dibujado ni sustituido el texto. El resultado original de la herramienta fue `exec-e68d1bc5-4dc4-45a0-9f74-0024f320dcf8.png`; su contenido completo se conserva en el maestro activo.

Procedencia: edición del recurso que ya pertenecía al repositorio; no se incorpora material de terceros. La herramienta genera una revisión de la imagen, por lo que la conservación de composición es una comprobación visual, no una afirmación de igualdad de todos los píxeles ajenos al texto. No se atribuyen derechos adicionales ni se declara autorización comercial nueva.

## Instrucción exacta de edición

> Edit the provided square game splash screen. Change ONLY the existing white uppercase spaced title below the N emblem to exactly NEON CRONIUM. Preserve the same slim futuristic letter style, white color, tracking, baseline, centered placement and approximate title width. Keep the original composition, dark navy outer-space background, tiny cyan stars, blue/violet glow, cyan rounded-square outline and white N monogram exactly as shown; do not redesign, add objects or alter their positions. The title must read NEON CRONIUM with correct spelling and nothing else. Keep the square framing and opaque dark background. This is a surgical typographic rebrand of the supplied original asset, not a new illustration.

## Verificación y límites

Se comprobaron dimensiones, modo RGB, lectura PNG y hashes de los cuatro archivos activos. Los tres PNG de iOS comparten contenido y hash. La copia histórica conserva exactamente el maestro anterior. No se modificaron identificadores, claves de guardado, lógica, manifiestos ni configuración de firmado. No se ejecutó una compilación de Xcode ni una prueba física de iPhone durante este cambio de arte.
