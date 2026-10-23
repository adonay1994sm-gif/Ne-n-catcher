# DIAGNÓSTICO

El propietario cambia la marca del juego a **NEON CRONIUM**. Se verificaron árbol limpio, rama autorizada y remoto en `c285bdb71a5f8b23608b5d127f5d97508a982f5f`, conservando las diez etapas Chronos–Gaia publicadas anteriormente. El nombre anterior aparecía en HTML, generador de preview, instalación PWA, paquete npm, configuración iOS, logs, workflow y una imagen nativa. Esta última necesitó editar el arte; cambiar sólo los textos habría dejado un arranque con la marca retirada.

# INFORME DE PRODUCCIÓN — NEON CRONIUM

Fecha: 17/10/2026, UTC.

Rama: `continuity-assets-audit-20261013`.

SHA inicial: `c285bdb71a5f8b23608b5d127f5d97508a982f5f`.

SHA funcional publicado: `e096a3bc638762445e20ba8a8eb7d3635e169db8`.

SHA del paquete limpio probado/publicado: `207a94edf01eb26f5f4210429cf51a4497b1b6d7`.

SHA de cierre documental: el commit publicado y su comprobación remota se registran después del push en [closure.json](evidence/neon-cronium/closure.json). El recibo posterior no cambia el paquete.

Entrega: rebranding del producto activo, su distribución y splash iOS; sin nuevas mecánicas.

Estado: marca integrada y verificada técnicamente; revisión del rótulo nativo y prueba física de dispositivo pendientes. Web privada versión **11**, despliegue `succeeded`.

## 1. Qué cambia para el jugador

La portada, menú del juego, títulos, descripciones y etiquetas accesibles muestran NEON CRONIUM. La instalación PWA y el nombre mostrado de iOS usan la misma marca. El monograma N y la nave modular siguen siendo coherentes con el nuevo nombre. Las diez etapas de viaje, controles, armamento, guardados, campañas y dificultades conservan su comportamiento anterior.

La web privada actualizada es (web privada antigua, retirada) Conserva su dirección para mantener el origen del navegador, instalación y partidas; el título del sitio ya es **NEON CRONIUM — Laboratorio de pruebas**. La versión antigua no se presenta como una compilación nueva.

## 2. Archivos e integración

| Sistema | Archivos y cambio efectivo |
| --- | --- |
| Pantallas | `index.html`, `preview/launcher.html`, `privacy.html`, `terms.html`, `engine-preview.html`: título, marca, descripción y accesibilidad. |
| Instalación web | `manifest.webmanifest`: nombre/short_name nuevos; id, start_url, scope e iconos compatibles. |
| Generación | `scripts/build-preview.mjs`: título y manifiestos de preview nuevos, evitando que el pipeline restaure la marca antigua. Logs de `build-game`, `build-core`, `build-content`, `build-native-bridge`, `build-web`, `netlify-preview-gate`; encabezados de `update-production-progress`. |
| Paquete | `package.json`, `package-lock.json`: `neon-cronium`, descripción actualizada; dependencias/versiones intactas. Se incluye `tests/product-brand.test.mjs` en contenido. |
| iOS | `capacitor.config.ts`, `ios/App/App/capacitor.config.json`, `ios/App/App/Info.plist`: nombre mostrado nuevo. Splash conectado a los tres slots existentes; sin cambios de firmado. |
| Caché | `sw.js`: nueva generación `neon-cronium-pre-release-7-2-0-brand-1`; contratos actualizados en `tests/run-tests.mjs`, `run-static-tests.mjs`, `run-v7-web-tests.mjs`. Las aserciones de recursos permanecen. |
| Runtime y diagnóstico | `src/game/08-loop-input-bootstrap.js` y `ad-bridge.js`: sólo prefijo de marca del log. Se regeneraron `game.js` y copias web/iOS, sin parches exclusivos. |
| CI | `.github/workflows/n7-integrated-preview.yml`: nombre NEON CRONIUM y artefacto `NEON-CRONIUM-N7-ARTPASS-NETLIFY-DROP`; triggers, permisos y pruebas conservados. |
| Guías/catálogos | `ART_DIRECTION_NEON_CRONIUM.md` renombrado a `ART_DIRECTION_NEON_CRONIUM.md`, enlaces de `PRODUCT_VISION`/`docs/art/CH01_PROVENANCE.md` reparados. README, AGENTS, visión, catálogo/manifest de assets y mapa de producción identifican la marca actual. |
| QA/seguimiento | `tests/product-brand.test.mjs`, `scripts/rebrand-browser-smoke.cjs`, ledger `P1-BRAND-01`, checklist/progreso generados y cierres vigentes enlazados. |

La relación completa está en [changed-files.json](evidence/neon-cronium/changed-files.json); el diff Git conserva detalle y detección de renombrado.

## 3. Compatibilidad y archivos históricos

El nombre visible es nuevo, pero se conservan deliberadamente `com.neoncronium`, claves `neonCronium.*`, claves clásicas `neon-*`, prefijo de preview `neon-preview-v1:`, IDs de contenido, globals públicos, URL del repositorio y origen del sitio. Son identidades técnicas persistentes, no rótulos para el jugador. Cambiarlos sin necesidad separaría instalaciones o partidas; no se diseñó una migración artificial para un cambio de nombre.

Los ZIP, informes, evidencias, derechos/procedencia y maestros históricos conservan sus nombres y hashes originales. Los **archivos activos y nuevos paquetes** usan NEON CRONIUM. Renombrar un ZIP histórico no lo convertiría en la versión actual. Los nombres genéricos (`game.js`, sprites, `App.xcodeproj`) tampoco requieren prefijos nuevos. Se conservan los archivos reservados del motor y `USE_ENGINE_V1 = false`.

## 4. Arte real actualizado

Se editó la imagen de arranque con `image_gen.imagegen`, sustituyendo el rótulo por NEON CRONIUM. El integrador revisó visualmente ortografía, N, composición y paleta. El monograma de los iconos sólo contiene N y ya es compatible; no se generó un icono innecesario.

| Recurso | Formato / dimensiones | Localización |
| --- | --- | --- |
| Maestro anterior recuperable | PNG RGB, 1254×1254 | `art-source/native/historical/launch-screen-master-before-cronium.png` |
| Maestro editado activo | PNG RGB, 1254×1254 | `art-source/native/launch-screen-master.png` |
| Tres exportaciones para slots iOS | PNG RGB, 2732×2732; 2.284.914 bytes cada una | `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png`, `-1.png`, `-2.png` |

Son tres slots de lanzamiento, **no tres fotogramas de animación**. Las exportaciones proceden del maestro mediante conversión RGB/escalado Lanczos. El maestro anterior mantiene hash `08f95bb1267cffa0b0d734ee86aa15636d40792141cfc26b46d21058384560e0`; el nuevo, `295c0e3be3446e7f9ae0160a95b291ab9c6a54a0acfe9c0d5cf66d979a51751f`; exports `843ccad6df0675616e86b77a58b97ca7363e61a296cd226a6a5c681b1a17a68a`.

[Procedencia e instrucción exacta](../../art-source/native/REBRAND_NEON_CRONIUM.md), [registro de dimensiones/hashes](evidence/neon-cronium/native-splash.json). No se incorpora material de terceros ni se atribuyen licencias nuevas. Catálogo:155 IDs; runtime web:82 recursos /7.956.026 bytes, sin añadir texturas al juego. Los recursos nativos no se cuentan como sprites runtime nuevos.

## 5. Pruebas locales y remotas

`node scripts/certify-local.mjs /tmp/neon-cronium-rebrand/certificate-01`: **11/11 fases, todos los códigos 0**. [Registro exacto](evidence/neon-cronium/certificate-01/results.json). Snapshot inicial `c285bdb` con WIP explícito; los hashes de bundles de esa certificación coinciden con la fuente funcional publicada y las copias finales raíz/www/iOS. Node local24.19.0; CI22.13.0. No se ejecutó otra instalación local `npm ci` porque no cambiaron dependencias; ambos workflows sí ejecutaron la instalación bloqueada.

| Comando / suite | Resultado |
| --- | --- |
| `npm run build` | salida0; bundles fuente/web/iOS sincronizados |
| `npm run test:engine` | 40/40 |
| `npm run test:architecture` | 6/6 |
| `npm run test:content` | 223/223, incluidas4 nuevas pruebas de marca/guardados |
| `npm run test:static` | 13/13 |
| `npm test` | 34/34 |
| `node tests/run-v7-web-tests.mjs` | 13/13 |
| Adaptador/render/animador reservado, sin activación | 14/14 |
| Ciclo de audio | 3/3 |
| Art Pass | 12/12 |
| `node scripts/audit-asset-inventory.mjs` | 82 recursos, cero errores/ausentes/hashes incoherentes |
| `npm run build:preview` final | salida0; SHA207a94e, `dirty:false` |
| `npm run test:preview` final | 23/23, salida0 |
| Chromium actualización/offline | 5/5 grupos, salida0 |

[Build final](evidence/neon-cronium/build-preview-final.txt), [preview23](evidence/neon-cronium/preview-final-tests.txt). Los recuentos son por suite y no se suman como partidas distintas. Tras esta certificación sólo cambió el arnés de QA y documentación; el juego publicado no cambió.

GitHub Actions terminó **completed/success**, con todos sus pasos y empaquetado, en [39069229533 — funcional e096a3b](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39069229533) y [39069397503 — paquete207a94e](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39069397503). [Resultados remotos](evidence/neon-cronium/github-package-run.json). No se declara una compilación nativa de Xcode ni certificación física por estos resultados.

## 6. Navegador real, errores encontrados y correcciones

Comando final: `node scripts/rebrand-browser-smoke.cjs --root preview-dist --previous /workspace/sites/web privada antigua/dist --output /tmp/neon-cronium-rebrand/browser-04 --timeout 120000`.

Se sirvió una copia temporal de la v10 y se instalaron sus workers nativos. Se sembró de forma explícita un fixture válido de guardado anterior: etapa1.3, casco74%, puntuación160,8fragmentos, emisor gemelo, hangar mixto y récord1739. Esto comprueba compatibilidad; **no es una nueva partida natural ganada desde1.1**.

Después se sustituyó sólo la copia temporal por el paquete nuevo, manteniendo el origen. Se actualizaron ambos workers reales, retiraron las generaciones antiguas y conservó una caché ajena. La marca/manifiestos nuevos aparecieron online y en páginas nuevas offline. Antes de iniciar, los bytes de guardado seguían idénticos; CONTINUAR reanudó1.3, mostró nave modular/gemelo/casco y permitió pausa/reanudación. No hubo hooks en fuentes, aceleración, entidades insertadas ni otro ciclo de juego.

Resultado final: **5/5,0 errores JavaScript/consola/peticiones del juego**,22.733ms y8 capturas. RAF máximo1; ambos paquetes de entrada permanecieron idénticos antes/después. El título cabe a390px: caja201px, sin desplazamiento horizontal ni solapamiento con la nave. [JSON final](evidence/neon-cronium/browser-04/results.json).

Los intentos fallidos no se eliminan:

1. [browser-01](evidence/neon-cronium/browser-01/results.json):4/5; la muestra de HUD se tomó durante el conteo visual159→160 del checkpoint. Se esperó el objetivo conocido160 antes de medir la pausa, conservando la igualdad exacta del HUD.
2. [browser-02](evidence/neon-cronium/browser-02/results.json) y [browser-03](evidence/neon-cronium/browser-03/results.json):4/5; el observador contó dos RAF. El diagnóstico conservó callbacks/stacks y demostró un `frame` del juego y un `next` de `Playwright waitForFunction`, no dos ciclos del juego. Se cambió el polling del arnés a evaluación/timer sin RAF; la aserción máxima1 permanece y pasa. No se tocó el runtime para forzar verde.

Chromium de escritorio/emulación no certifica Safari/iPhone instalado, revisión estética humana, tiempos de carga físicos ni FPS sostenidos. No se repitió el recorrido natural completo de seis minutos: las mecánicas de las diez etapas no se modificaron y sus suites de regresión sí se ejecutaron.

## 7. Capturas auténticas

| Imagen | Evidencia |
| --- | --- |
| Antes: portada v10 | [captura](evidence/neon-cronium/browser-04/01-previous-launcher.png) |
| Después: NEON CRONIUM online | [captura](evidence/neon-cronium/browser-04/03-current-online-launcher.png) |
| Menú actualizado | [captura](evidence/neon-cronium/browser-04/04-current-online-menu.png) |
| Portada actual offline | [captura](evidence/neon-cronium/browser-04/05-current-offline-launcher.png) |
| Checkpoint anterior conservado | [captura](evidence/neon-cronium/browser-04/07-current-offline-checkpoint-briefing.png) |
| Continuación1.3offline | [captura](evidence/neon-cronium/browser-04/08-current-offline-continuation-playing.png) |

El splash es un recurso nativo inspeccionado, no una captura fingida de iPhone. Las imágenes anteriores son ventanas reales de Chromium y sus fixtures están declarados.

## 8. Paquete y publicación

[ZIP NEON CRONIUM](evidence/neon-cronium/neon-cronium-web-preview-207a94e.zip): **8.173.585 bytes,118 archivos**, SHA-256 `39dd6e279214712dca0a48bfc9ad0df9dc1ea3adc331cc6c2cc141967e9ab569`. Revisión `ddba1cb90abc61252af4e29f3bee23296ba5ea81887b608d9971a516a1df2838`, SHA207a94e y `dirty:false`. [Procedencia](evidence/neon-cronium/package.json). Descomprimir/servir por HTTP/abrir index.html si se prueba localmente; también preparado para Drop de prueba, sin despliegue Netlify ejecutado.

**Sitio privado versión11**, `succeeded` a21:08:54UTC. Fuente del sitio `411df1de941f7c787d334e4f7fd3860963d3e0b7`; sus118 archivos coinciden por hash con el paquete Chromium probado. Lectura nativa posterior confirma título nuevo, versión11 y audiencia privada conservada:1usuario,0visitantes externos. [Metadatos sanitizados](evidence/neon-cronium/site-deployment.json). La publicación fue comprobada por el conector; el QA de gameplay/actualización fue local sobre ese mismo paquete, no una visita autenticada remota.

No se modificó producción Netlify, main, PR#3, AppStore, TestFlight, firmado, anuncios/pagos ni servicios externos. El sitio es el mismo destino privado de pruebas previamente autorizado.

## 9. Seguimiento y siguiente tarea

`P1-BRAND-01`: IN_REVIEW con técnica `PASSED_CHROMIUM_UPGRADE_OFFLINE`, arte del splash pendiente de propietario y prueba física pendiente. Los estados globales pasan a308 tareas:24DONE,69IN_REVIEW,5IN_PROGRESS,7BLOCKED,203PENDING;155assets de catálogo. No es un porcentaje comercial ni reinicia el progreso histórico.

Rebranding activo completado técnicamente. Revisar nombre/splash con el propietario y probar Safari/iPhone físico cuando esté disponible. Después continuar la revisión del ritmo, vacío espacial y encuadre de Gaia de la entrega anterior, preservando las diez etapas y sin expandir contenido masivo ni activar el Motor V1. No volver a renombrar claves técnicas o paquetes históricos para eliminar coincidencias de texto.
