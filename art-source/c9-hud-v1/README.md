# C9 · Componentes del taller de a bordo

Ilustración original generada con `image_gen` el 18/10/2026 para NEON CRONIUM. No contiene arte de otra franquicia ni recursos de una biblioteca externa.

- `c9-upgrades-generated-master.png`: generación original RGBA de 1254 × 1254, conservada íntegra.
- `frames/`: cuatro recortes, escalado uniforme y relleno transparente a 512 × 512.
- `c9-upgrades-packed-master.png`: maestro normalizado 1024 × 1024.
- `../../assets/c9_upgrade_icons_v1.webp`: exportación optimizada de cuatro celdas; posiciones CSS 0/0, 100%/0, 0/100%, 100%/100%.
- `metadata.json`: rectángulos fuente, tamaños, hashes y procedencia.
- `export-atlas.cjs`: recorta y empaqueta con ImageMagick; no dibuja piezas por código. Volver a ejecutar con `node art-source/c9-hud-v1/export-atlas.cjs`.
- `verify-atlas.cjs`: verifica alpha y márgenes por celda de la exportación real.

Diseños: emisor Phaser doble; placas de refuerzo de casco sin burbuja de escudo; cargador de tres misiles físicos; radiador con circuito de cobre y dos depósitos de refrigerante. No son nuevos objetos jugables: ilustran las cuatro compras existentes, con sus precios y recibos conservados por el integrador.

Las ilustraciones son estados de inventario estáticos. No se presentan como animación de montaje, articulación o prueba de integración por el mero hecho de existir. La revisión del taller integrado y de las pantallas pequeñas pertenece a la entrega del integrador.

Presupuesto: WebP de 165 564 bytes; RGBA decodificado estimado en 4 MiB. Cada celda deja al menos 48 píxeles totalmente transparentes. El uso CSS no necesita un nuevo bucle de animación ni un renderizador separado.
