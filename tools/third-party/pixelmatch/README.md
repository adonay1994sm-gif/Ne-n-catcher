# Pixelmatch — herramienta de QA visual

Se conserva sin cambios `index.js` de [mapbox/pixelmatch](https://github.com/mapbox/pixelmatch/tree/ab76f526ef951c0ec6284e314a700e161b1800e6), revisión `ab76f526ef951c0ec6284e314a700e161b1800e6`, versión declarada 8.0.0, licencia ISC adjunta.

Uso limitado a `scripts/specialist-visual-assets.mjs` y sus pruebas. No se incorpora al juego, al bundle ni a su ciclo de renderizado. La función importada no requiere dependencias; no se instala la CLI ni `pngjs`. `SOURCE.json` registra procedencia y hashes de los archivos conservados.

El script compara RGBA tras componer sobre negro, gris y blanco. Un RGB arbitrario con alfa cero resulta invisible; un píxel negro opaco sí altera la imagen. Los montajes son inspecciones de recursos, nunca capturas de una partida ni aceptación artística.
