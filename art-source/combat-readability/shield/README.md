# Escudo envolvente — producción artística, 17/10/2026

Recurso original generado con `image_gen` para envolver la nave mediante un campo ovalado de fuerza. El interior contiene transparencia real; el borde ilustra paneles curvos, arcos eléctricos y un impacto frontal localizado. No incluye nave ni texto y no modifica colisiones.

## Archivos y estados

- `force_shield_generated_master.png`: salida original RGBA de 2172×724, conservada sin modificar.
- `force_shield_state_0.png` … `force_shield_state_3.png`: estados maestros normalizados de 512×512.
- `force_shield_atlas_master.png`: atlas maestro RGBA de 2048×512, cuatro celdas de 512; pivote `(256,256)`.
- `assets/force_shield_atlas_v1.webp` desde la raíz del proyecto: exportación runtime RGBA WebP lossless, 1536×384, cuatro celdas de 384; pivote `(192,192)`; 319.358 bytes y 2,25 MiB decodificados.
- `force_shield_atlas_v1.json`: ficha con coordenadas, procedencia, hashes y comprobaciones de transparencia.

Orden: **0 activación**, **1 campo estable**, **2 pulso del campo**, **3 impacto frontal**. Los cuatro fotogramas tienen contenido RGBA distinto. La activación abre el cierre superior; el impacto concentra una fractura energética arriba a la derecha. No reproducir todos los estados en bucle: 1–2 pertenecen al reposo activo, 0 al encendido y 3 a una colisión real.

## Integración propuesta

Usar el reloj existente: activación 0,20 s, ciclo estable/pulso de 1,20 s con interpolación y reacción al golpe de 0,18 s. Son parámetros reversibles de trabajo. No se incorpora un RAF ni se generan eventos de daño desde los fotogramas.

La celda incluye margen amplio. El borde estable visible ocupa aproximadamente 190×287 px dentro de cada cuadrado runtime de 384 px; ajustar el dibujo al casco real y mantener su pivote, sin adaptar la hitbox al recurso. El centro de las poses estable/pulso conserva alfa máximo 1/2 en una muestra de 72×112 px.

## Proceso y estado

La imagen se generó mediante herramienta gráfica, se inspeccionó el PNG y se prepararon celdas con recorte, escalado proporcional y empaquetado ImageMagick. La exportación lossless normaliza el RGB invisible para evitar residuos de color en herramientas de inspección. No se dibujó el escudo mediante código ni se copiaron fotogramas.

Producción del recurso verificada. **Integración en el juego y prueba Chromium: pendientes del responsable de integración. Aceptación artística del propietario e iPhone físico: pendientes.** Esta ficha no certifica que el recurso ya aparezca en gameplay.

Procedencia: generación original OpenAI `image_gen` solicitada para NEON CRONIUM, sin assets de terceros ni referencias de franquicias. Se conserva el maestro; no se afirma una revisión legal independiente.
