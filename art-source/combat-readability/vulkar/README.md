# Vulkar desde la órbita — dos capas originales

Fecha: 2026-10-17. Mandato: combate y recuperación de CRONIUM **en el espacio**, con lectura clara y movimiento ambiental compatible con el renderer legacy.

## Entrega de arte

| Capa | Maestro | Exportación | Dimensiones runtime | Pivote |
| --- | --- | --- | --- | --- |
| Espacio y restos de refinería | `background-master.png` | `assets/vulkar_orbit_background_v1.webp` | 768 × 1152 | 0.5, 0.5 |
| Planeta Vulkar y pequeños módulos orbitales | `planet-master.png` | `assets/vulkar_orbit_planet_v1.webp` | 640 × 640 | 0.5, 0.5 |

El fondo **no contiene el planeta**. La segunda capa tiene transparencia real. No se duplicó un mismo fondo para fingir parallax. El centro del fondo permanece oscuro; los restos están principalmente en el borde izquierdo. El planeta debe mostrarse parcialmente fuera del borde derecho, manteniendo despejada la zona central de combate.

Ambas capas tienen un fotograma; no se presentan como spritesheets ni como una animación ya implementada. La aproximación, deriva y paralaje previstos deben utilizar el reloj del recorrido existente y detenerse con pausa/segundo plano. La animación de enemigos y VFX pertenece a recursos/sistemas distintos. No alterar hitboxes para acomodar estas ilustraciones.

## Procedencia y revisión

Generación original mediante la herramienta `image_gen.imagegen` disponible en la sesión; sin llamadas a servicios externos facturables ni recursos de franquicias identificadas. Maestros generados: `/workspace/generated_images/exec-99e5c7c0-5d3d-4541-a967-8c333ca9eafc.png` y `/workspace/generated_images/exec-cbe0e320-9695-4d50-8e27-2eb7287733e6.png`, copiados sin borrar los originales. Los prompts están en `generation-prompts.json`.

Revisados visualmente los dos maestros y las dos exportaciones. `planet-runtime-on-dark-qa.png` muestra la exportación WebP compuesta sobre un fondo oscuro para inspeccionar su alfa; es una **placa de revisión del asset**, no una captura del videojuego. No hay halos rectangulares en esa composición. Los valores RGB ocultos bajo alfa cero no representan píxeles visibles.

Estado de esta entrega: **arte generado y exportado; integración y QA del juego a cargo del responsable de integración**. La aceptación estética del propietario y la prueba física de dispositivo están pendientes. La procedencia de generación no equivale a un dictamen jurídico de exclusividad, registrabilidad o autorización universal de publicación; se conserva su trazabilidad para la revisión comercial posterior.

`metadata.json` registra hashes, bytes, dimensiones reales y presupuesto de memoria RGBA. Ejecutar `bash art-source/combat-readability/vulkar/export.sh` desde la raíz para reproducir las exportaciones técnicas con ImageMagick. No se ha ejecutado ningún build ni modificado fuentes, manifests, guardados o motores durante esta entrega de arte.
