# Vulkar: descenso ígneo · nivel clásico 3

- **Maestro original:** `art-source/visual-rebirth/levels/03/vulkar-descent-master.png`, PNG RGB 852×1846, 2 455 546 bytes. Generado para NEON CATCHER el 17/10/2026 mediante la herramienta de generación de imágenes; sin material de terceros incorporado.
- **Exportación de ejecución:** `assets/vulkar_descent_background_v1.webp`, WebP opaco 852×1846, 240 122 bytes, 82 % calidad. El maestro se conserva separado.
- **Composición:** planeta basáltico fracturado, atmósfera de ceniza, refinería orbital y estructuras quemadas laterales. El centro inferior mantiene espacio para la nave y las amenazas.
- **Pivote:** 0.5, 0.5. Una imagen compuesta con deriva lenta; polvo y rocas del sistema existente forman capas de juego. La imagen no contiene fotogramas de animación.
- **Integración:** `SPRITES.vulkarBackground`, carga diferida y dibujo exclusivo de `currentLevel === 2` en la campaña clásica. El fondo anterior permanece como respaldo si la imagen no se carga. Se conservaron colisiones, guardados y bucle legacy.
- **Estado:** IN_REVIEW. Captura real y comparación en `GALERIA_10_NIVELES.md`. Falta descomponer profundidad, producir Lava Core/Plasma Mine animados, revisar amenazas sobre fondo cálido y probar en iPhone físico.
