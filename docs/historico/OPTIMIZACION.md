# V6.4.1 — Optimización y correcciones

## Eliminado del paquete

- `solar_wreck_large` y cuatro variantes solares: estaban incluidos, pero el código no los usaba.
- Dos variantes casi duplicadas de restos calientes.
- `ship_idle.png` de 1 MB: duplicaba la nave animada. El fallback usa ahora el primer fotograma.
- Cuatro fotogramas redundantes del rayo tractor.
- Cinco variantes redundantes de impacto.
- Cinco nubes de humo redundantes.
- Todos los PNG grandes de juego: se sustituyeron por WebP reducidos al tamaño real de pantalla. Los iconos PWA permanecen en PNG.
- La nave antigua construida con CSS en el menú.

## Corregido

- Orden de la explosión: ya no vuelve de humo a fuego.
- Líneas residuales de las cuadrículas del phaser y explosiones.
- Humo: ya no cambia de forma en cada fotograma; una nube estable se mueve y desvanece.
- Satélite: se corrigió una doble traslación que podía dibujarlo fuera de su posición.
- Colisiones: radios específicos y varias zonas para paneles y satélites.
- Phaser: los obstáculos grandes requieren varios impactos.
- Objetos: aparecen gradualmente por debajo del HUD.
- Menú: ahora indica diez sectores, que son los realmente disponibles.

## Optimización

- Assets cargados bajo demanda.
- Service worker ligero: precarga solo la aplicación y el primer sector.
- Menos estrellas de fondo: 100 en lugar de 135.
- Resoluciones de sprites ajustadas al tamaño real de uso.
- Caché de Netlify preparada para iteración sin conservar versiones antiguas durante semanas.
