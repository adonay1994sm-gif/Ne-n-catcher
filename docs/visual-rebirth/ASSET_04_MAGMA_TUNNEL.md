# Rastro de la Serpiente · túnel magmático, nivel clásico 4

- **Maestro original:** `art-source/visual-rebirth/levels/04/vulkar-magma-tunnel-master.png`, PNG RGB 852×1846, 2 705 963 bytes. Generado para NEON CATCHER el 17/10/2026 con la herramienta de generación de imágenes; no incorpora recursos de terceros.
- **Recurso de ejecución:** `assets/vulkar_magma_tunnel_background_v1.webp`, WebP opaco 852×1846, 282 754 bytes, 82 % calidad.
- **Diseño:** grieta monumental de basalto, lava, rocas suspendidas, rieles y plataformas industriales dañadas. El pasillo central queda visualmente despejado para la futura Magma Serpent articulada.
- **Pivote:** 0.5, 0.5. Una imagen compuesta con deriva lenta y polvo del renderizador existente; no contiene fotogramas animados.
- **Integración:** carga diferida y dibujo exclusivo de la campaña clásica `currentLevel === 3`. Se retira para este nivel el trazado violeta procedural previo, incongruente con Vulkar. Si la imagen no carga, se mantiene el fondo base.
- **Estado:** IN_REVIEW. Ver `GALERIA_10_NIVELES.md` para captura real y comparación. Falta producir enemigo segmentado y animado, separar elementos de profundidad, revisar rendimiento y ejecutar prueba física iPhone.
