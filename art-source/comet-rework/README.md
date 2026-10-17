# Cometa mineral helado — 17/10/2026

Recurso original para sustituir la apariencia de bola de magma del cometa del viaje espacial. La roca irregular tiene hielo y grietas blanco-cian; la cola contiene vapor fino, fragmentos y filamentos animados. El origen físico de los impactos sigue siendo el núcleo; la cola es decorativa.

## Ficheros

- `comet_generated_first.png`: primera generación RGBA, 2172×724, conservada como historial; descartada para runtime por halo demasiado ancho y falta de separación.
- `comet_generated_master.png`: segunda generación RGBA, 1536×1024, cuatro estados en dos filas; fuente seleccionada.
- `comet_frame_0.png` … `comet_frame_3.png`: cuatro estados maestros de 512×512, alineados por el núcleo.
- `comet_flight_atlas_master.png`: maestro normalizado RGBA de 2048×512; cuatro columnas y una fila.
- `assets/comet_flight_atlas_v2.webp`: runtime WebP lossless RGBA, 1536×384, cuatro celdas de 384×384; **151.882 bytes**, 2.359.296 bytes RGBA decodificados (2,25 MiB).
- `comet_flight_atlas_v2.json`: ficha técnica con coordenadas, hashes y comprobación de alfa.
- `generation-prompts.json`: prompts exactos y trazabilidad de las dos generaciones.
- `export.sh`: exportación reproducible usando ImageMagick; recorta, alinea, remuestrea y empaqueta arte ya generado. No dibuja un sustituto geométrico.
- `review_on_space.png`: **revisión del recurso sobre un color oscuro**, no una captura del juego.

## Orientación, animación y escala

El núcleo apunta a **+X** (derecha); la cola se extiende a **−X**. El pivote fijo es el centro del núcleo: **(384,256)** en la celda maestra de 512 y **(288,192)** en cada celda runtime de 384, equivalente a **(0,75; 0,50)**. Los cuatro estados poseen cambios reales de filamentos, fragmentos y emisión, no duplicados. Propuesta reversible: bucle de **8 FPS**, 0,5 s, gobernado por el reloj existente del juego. La pausa debe congelar la animación.

La fuente histórica tenía un desfase: el sprite apuntaba a +X y `drawMeteor` añadía π/2 a `item.rot`, aunque el cometa diagonal ya guardaba `atan2(vy,vx)`. Con este atlas debe usarse el ángulo de la velocidad de vuelo; para una caída vertical sin componente horizontal el ángulo es π/2. No emplear giro aleatorio independiente de la trayectoria en el nuevo vuelo.

El núcleo visible mide aproximadamente 60–65 px dentro de cada celda runtime de 384. Una celda dibujada a `item.r * 12` produce un núcleo de diámetro cercano a `2 * item.r` y una cola larga de unos siete radios. Es una sugerencia de presentación, **no una modificación de la hitbox**. Conservar radios, daño y geometría de colisión; no hacer dañina la cola ilustrada. Mantener el campo jugable legible y comprobar la escala en partida.

## Revisión y derechos

Se inspeccionaron la imagen anterior del repositorio, ambas generaciones y el runtime compuesto sobre espacio oscuro. Las cuatro celdas tienen esquinas de alfa cero, contenido diferente y núcleo en el pivote previsto; el 86,62 % de los píxeles runtime tiene alfa cero. El WebP se exporta sin pérdida.

Procedencia: generación original con la herramienta OpenAI `image_gen.imagegen` disponible en la sesión, sin referencias de franquicias ni recursos de terceros. Se conserva el maestro y no se afirma una revisión legal independiente.

**Estado al entregar este recurso:** producción y exportación verificadas; integración, pruebas de navegador y aceptación visual del propietario pendientes del responsable de integración. No se certifica iPhone físico. Los recursos anteriores permanecen intactos y recuperables.
