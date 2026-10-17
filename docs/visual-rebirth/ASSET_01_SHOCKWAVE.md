# CRONIUM shockwave atlas · lote visual 01

- ID estable: `shared-temporal-shockwave` / `chronos-shockwave-atlas-v1`.
- Procedencia: imagen original generada el 2026-10-16 para NEON CATCHER con la herramienta de generación de imágenes disponible en la sesión. Prompt de producción: cuatro fases 2×2 de ruptura, expansión, frente de choque y dispersión cian/azul, sin texto y con transparencia. No se incorporaron recursos de otra franquicia.
- Maestro conservado: `art-source/visual-rebirth/levels/01/chronos-shockwave-atlas-master.png`, 1254×1254 RGBA, 2 332 582 bytes.
- Exportación: `assets/chronos_shockwave_atlas_v1.webp`, 1254×1254 RGBA, 622 232 bytes, WebP calidad 84; cuatro celdas de 627×627, no idénticas. Ahorro respecto al maestro: ~73 %.
- Pivote por celda: (0.5, 0.5). Duración total del evento: 620 ms; cuatro poses de ~155 ms. Secuencia no cíclica. La escala de pantalla se anima para representar expansión, pero **el aspecto de cada fase procede de un fotograma distinto**.
- Integración: loader diferido de la campaña clásica, precarga al abrir el nivel 1, `background()` usa el atlas en el evento del reactor a los 31 s. Fallback gráfico durante la descarga. Posición aproximada del reactor: 0.5W, 0.4H. Un draw call del atlas por fotograma activo.
- Estado: **IN_REVIEW**. Integrado, comprobado por tests y capturas controladas de Canvas; faltan QA natural a los 31 s en iPhone, revisión de contraste con amenazas y presupuesto de memoria físico.
- Memoria decodificada estimada del atlas: 1254×1254×4 = 6 290 064 bytes (~6.0 MiB), sin contar superficies del navegador. No se carga en la campaña N-7.

El maestro no se debe sustituir con una simple transformación de una imagen estática. Versionar un cambio artístico posterior con nuevo ID de exportación o registrar su hash y repetir la galería.
