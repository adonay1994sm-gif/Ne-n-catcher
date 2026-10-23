# Bloque 01 — recuperación y diagnóstico reproducido

Fecha: 13/10/2026. Rama: `continuity-assets-audit-20261013`.
Base comprobada tanto en GitHub como en el checkout: `67430b53a9121d27fbcd312628424f57ac88efa5`.

## A. Diagnóstico previo

Se preservaron tres borradores de la intervención anterior en `/workspace/scratch/neon-continuity/interrupted-documents`, con hashes y recibo. El commit anterior `79597e1f` sigue en la rama local `production-100-development`; no se perdió ni se publicó. La nueva orden reemplaza aquella congelación de campaña por autorización de desarrollo en esta rama, manteniendo Engine V1 desactivado, main y PR #3 sin cambios.

El checkout de la nueva revisión estaba limpio y coincidía con el remoto. Se instalaron 214 paquetes con `npm ci` (Node 24.19.0, npm 11.9.0). La inspección y pruebas precedieron a las correcciones.

Los resultados comunicados en el traspaso necesitaban rectificación:

| Comprobación de la revisión recibida | Resultado ejecutado |
| --- | --- |
| Contenido inicial | 6/6 aprobadas; verifican datos, no una campaña jugable de 100 niveles |
| Motor `src/engine` | 37/40; tres errores de restauración legacy |
| Arquitectura | 6/6 |
| Inventario | 58 recursos activos, dos conservados, cero inconsistencias |
| Pruebas adicionales del render y adaptador anterior | 14/14 |
| Build | Aprobado; conserva el bloque de nebulosas reconciliado |
| Static / suite global antes del build | Fallan por `styles.css` generado desactualizado |
| Static / suite global después del build | Fallan por imágenes nativas iOS ausentes |
| Regresión web | Falla porque su punto de instrumentación todavía esperaba el arranque RAF anterior |

El runner aislado del entorno inicialmente resume los archivos como una prueba cada uno. Se ejecutaron además las suites con `--test-isolation=none --test-reporter=tap` para obtener los conteos de escenarios reales. Los fallos originales se conservan en `evidence/block-01/`.

## B. Trabajo ejecutado

- `src/engine/CampaignAdapter.js`: se renombró el parámetro local de `stop({restoreLegacy: ...})` para que no oculte la función de restauración. Las tres pruebas que ya existían reproducen el defecto y ahora pasan. `USE_ENGINE_V1` permanece en `false`.
- `tests/run-tests.mjs` y `tests/run-v7-web-tests.mjs`: se actualizó el anclaje de instrumentación al arranque real `legacyFrameId = requestAnimationFrame(frame)`. Se conservan sus aserciones, escenarios y la asignación del ID.
- `www/styles.css` e `ios/App/App/public/styles.css`: sincronizados mediante el build existente, sin editar los bundles manualmente.
- `src/game/animation/animation-map.js`: inventario corregido. Idle usa 00/01/02/01; bank utiliza la pose 03 y su espejo; propulsión usa 04; impacto temporal usa 05. Se documentan capas reales de phaser, humo, explosión, escudo y energía. Se eliminan las referencias inválidas a 06/07, sin borrar recursos. Aparición y disparo propios de enemigos siguen declarados como arte pendiente.
- `tests/content-assets.test.mjs` y `package.json`: tres comprobaciones nuevas de referencias reales, estados y las cuatro imágenes del catálogo iOS, incorporadas a `test:content`.
- `scripts/export-native-art.mjs`: exportación offline reproducible con ImageMagick. No añade dependencias ni trabajo de procesamiento gráfico al build web.
- `netlify.toml` y `scripts/block-development-deploy.mjs`: contexto exclusivo de esta rama que omite el despliegue; si se fuerza la construcción mediante un mecanismo que omite `ignore`, el comando termina con error antes de producir/publicar una salida. El build local normal no cambia. Main y el contexto de la PR #3 no se modifican.

## C. Assets producidos

Se utilizó la herramienta de generación de imágenes y el icono existente como referencia visual. Se produjeron dos imágenes originales de 1254×1254 RGB y se conservan en `art-source/native/`.

| Archivo generado/integrado | Dimensiones | Formato | Bytes finales |
| --- | --- | --- | ---: |
| `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` | 1024×1024 | PNG RGB opaco | 482.293 |
| `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png` | 2732×2732 | PNG RGB opaco | 2.008.876 |
| `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png` | 2732×2732 | PNG RGB opaco | 2.008.876 |
| `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png` | 2732×2732 | PNG RGB opaco | 2.008.876 |

El splash se reescala desde el original generado; no se presenta como detalle nativo de 2732 píxeles. Las tres variantes preservan la misma composición para el catálogo existente. Se cuantizaron colores y eliminaron metadatos para reducir peso. Son arte de marca producido, no archivos vacíos para superar pruebas. Se revisó la composición generada y se decodificaron los PNG. El recorte real del launch screen en Xcode/iPhone queda pendiente.

Los recursos de ejecución web, `.gitkeep` y el cometa histórico permanecen intactos. Las fuentes históricas del cometa y CRONIUM siguen requiriendo recuperación/reproducción artística en el bloque visual; los WebP de ejecución se conservan.

## D. Pruebas y evidencia

Tras las correcciones de recuperación:

- Motor: **40/40** (incluidas las tres fallidas originales).
- Contenido y assets: **9/9**, incluidas las seis iniciales.
- Arquitectura: **6/6**.
- Static: **13/13**.
- Suite general: **33/33**, incluyendo colisiones, 10.000 formaciones y 50.000 amenazas, guardados, daños y límites de efectos.
- Regresión web: **13/13**.
- Inventario: **cero inconsistencias**, 58 activos y dos conservados.
- Build: aprobado; `game.js` continúa generado desde nueve módulos.
- Guardia de despliegue: salida 1 deliberada, comprobada. Es un bloqueo de publicación, no un error ocultado de las suites.

Comandos de reproducción: `npm ci`, `npm run build`, `npm run test:engine`, `npm run test:content`, `npm run test:static`, `npm run test:architecture`, `npm test`, `node tests/run-v7-web-tests.mjs`, `node scripts/audit-asset-inventory.mjs`. Para ver cada escenario Node en este entorno, usar `NODE_OPTIONS=--test-isolation=none` en las dos suites del runner.

## E. Errores y límites

Corregidos: restauración legacy, anclajes de pruebas obsoletos, CSS generado desincronizado, cuatro gráficos nativos ausentes y referencias inexistentes de animación.

Pendientes: la nueva campaña sigue siendo datos; aún no hay oleadas ejecutables, corredores garantizados, diez combates completos de jefe, relato completo, nuevas poses de enemigos ni música final de los cinco sectores. El mapa de animaciones no equivale por sí solo a una máquina de estados integrada. Safari/iPhone, Capacitor/Xcode, memoria, GC y FPS sostenidos no están certificados. Estos límites no se sustituyen por las pruebas locales.

## F. GitHub

Todos los cambios de este bloque pertenecen a `continuity-assets-audit-20261013`. El SHA de su commit se obtiene del historial por el asunto `fix(qa): restore reproducible baseline and native artwork`. No se actualiza la PR #3 ni se realiza merge. La publicación de código está autorizada por la nueva orden; la publicación del juego está bloqueada por el contexto de Netlify de esta rama.

## G. Siguiente bloque

Convertir el generador puro en un director de encuentros determinista con versión, tiempos, geometría de nave, reserva de corredor y patrones ejecutables. Conectarlo de forma progresiva al mismo bucle legacy y probarlo en una modalidad de campaña separada, preservando guardados y regresión de los diez niveles existentes. Ningún módulo nuevo debe activar Engine V1 ni crear un segundo RAF de juego.
