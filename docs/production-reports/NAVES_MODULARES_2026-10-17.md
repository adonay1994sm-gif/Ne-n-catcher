# DIAGNÓSTICO — integración de nave y recuperación del clásico

El propietario rechazó la calidad de integración, la jugabilidad y el recorrido comprimido. La crítica es una petición de cambios artísticos y de experiencia; las pruebas anteriores no equivalían a aceptación. Se confirmó que la mejora C9 dibujaba dos paneles solares de chatarra encima de una nave completa. La demo de 64 segundos sustituía la aparición clásica por eventos abreviados y no representaba el ritmo solicitado. No hay diez niveles completos ni jefes finales certificados.

# INFORME DE PRODUCCIÓN — NAVES MODULARES

Fecha: 17/10/2026. Rama: continuity-assets-audit-20261013.
SHA inicial: 3b4dc03a425e8c285570a113cf6a97d5ab4d41a5.
SHA funcional publicado: 1bb8a76e7a48df23fd013005bed60d35b6978e03; pruebas adicionales publicadas: 0c056bf431aa65994c9716297c4e59a6ad6ca0ce.
SHA de cierre documental: commit contenedor de este informe; consultar git log -1 -- docs/production-reports/NAVES_MODULARES_2026-10-17.md.
Tiempo registrado: las duraciones de comandos y navegador están en los JSON; no se atribuyen horas de trabajo no medidas.

## Resultado jugable y alcance

- La entrada principal de la preview vuelve a ser la campaña clásica de diez niveles. Journey y N-7 permanecen recuperables; no se borraron ni se alteraron sus checkpoints para forzar una equivalencia.
- HANGAR permite elegir Astér o Bastión y combinar fuselaje, alas y propulsores: ocho combinaciones. La nave original sigue disponible. Cambios visuales solamente: no se inventaron diferencias de armas, velocidad, precio o resistencia.
- Las piezas tienen recortes y destinos de montaje explícitos. Alas articuladas en sus raíces, inclinación conjunta y llamas animadas desde las toberas, bajo el fuselaje. No son ocho fotogramas de animación: son ocho componentes ilustrados de dos familias.
- Se aplica la misma configuración al hangar, menú, briefing y partida. Se guarda solamente al pulsar APLICAR. Cancelar no cambia nada; fallo de almacenamiento conserva la selección anterior. Clave propia neonCronium.shipFleet.v1, con prefijo independiente en la preview.
- La mejora C9 de la demo deja de utilizar el panel solar: representa un propulsor compatible en recogida, estación y nave. Conserva el checkpoint anterior y la respuesta lateral existente. La demo sigue siendo un prototipo corto rechazado como referencia final de ritmo.
- La nave clásica ya no queda bajo DISPARAR o la transmisión: la línea de vuelo reserva una banda inferior según escala CSS y los mensajes pasan arriba. La silueta de colisión, los parámetros de movimiento, objetivos clásicos y generador versionado permanecen intactos.

## Arte real, procedencia y animación

Maestro original: art-source/player/modular-v1/modular-ships-master.png, PNG RGBA 1774×887, 865418 bytes. Exportación: assets/ship_modular_atlas_v1.webp, 263716 bytes, transparencia conservada; compresión WebP del maestro sin eliminarlo. Procedencia: generación integrada de imágenes para este proyecto, 17/10/2026, sin recursos de franquicias ni licencias compradas. Metadatos/hash: art-source/player/modular-v1/metadata.json.

Dos fuselajes, dos pares de alas, dos pares de motores y dos capas de llama. El generador de imágenes no respetó el artboard exacto solicitado; se revisaron recortes y anclajes explícitos, excluyendo partes vecinas. No se asumió una cuadrícula perfecta. El atlas ocupa aproximadamente 6294152 bytes RGBA decodificados (6 MiB); esto no es una medición de memoria total de Safari. El inventario runtime queda en 71 recursos / 5301870 bytes. No se borraron recursos existentes.

Siguen pendientes poses específicas de daño, destrucción modular, apertura de armas y variaciones de propulsión. Se reutilizan humo, impacto y explosiones legacy; esta entrega no certifica todo el sistema de animación ni el estilo final del juego.

## Archivos y sistemas

El listado íntegro del cambio funcional es git diff --stat 3b4dc03a425e8c285570a113cf6a97d5ab4d41a5..0c056bf431aa65994c9716297c4e59a6ad6ca0ce. Fuentes principales:

- src/game/ship/modular-ship.js: configuraciones validadas, recortes, montajes y pose determinista sin reloj ni RAF propio.
- src/game/01-runtime-assets.js: selección con clave propia y loader del atlas.
- src/game/02-storage-audio.js: banda inferior y registro del overlay del hangar.
- src/game/03-ui-game-flow.js + styles.css: hangar adaptable, foco/teclado, aplicar/cancelar y representación C9.
- src/game/07-player-item-rendering.js: ensamblaje y reproducción compartidos; desaparecen los paneles de chatarra añadidos a la nave.
- src/game/08-loop-input-bootstrap.js: el mismo RAF legacy dibuja también el hangar.
- src/game/progression/legacy-content-entry.js: exportaciones del módulo de nave mediante el runtime ya existente.
- ASSET_MANIFEST.json, ASSET_PRODUCTION_150.json, sw.js: registro, referencias y precarga. Assets en IN_REVIEW, no finales.
- preview/launcher.html: campaña clásica como prueba principal; prototipo corto etiquetado como tal.
- game.js, content-runtime.js y copias web/iOS regeneradas con build. No parches exclusivos de bundles.
- tests/modular-ship.test.mjs, tests/ship-hangar.test.mjs y scripts/modular-ship-browser-smoke.cjs: montaje/guardado/UI y navegador real. Arneses de regresión/web ahora cargan el runtime de contenido real; mocks Canvas explícitos en lógica simulada.

## Pruebas, errores y correcciones

Evidencia final local: [certification-04](evidence/modular-ships/certification-04/results.json). Once comandos, todos código 0:

| Comando | Resultado |
| --- | --- |
| npm run build | Web/iOS y nueve módulos legacy sincronizados |
| npm run test:engine | 40/40 |
| npm run test:architecture | 6/6 |
| npm run test:content | 66/66; incluye 9 de piezas, 7 de hangar y 5 de fallback |
| npm run test:static | 13/13 |
| npm test | 33/33 |
| node tests/run-v7-web-tests.mjs | 13/13 |
| node --test tests/campaign-adapter.test.mjs tests/neon-render-engine.test.mjs tests/sprite-animator.test.mjs | 14/14 |
| node --test tests/audio-lifecycle.test.mjs | 3/3 |
| node --test tests/visual-artpass.test.mjs | 12/12 |
| node scripts/audit-asset-inventory.mjs | 0 inconsistencias |

npm run build:preview y npm run test:preview ejecutados: 15/15, código 0. Dependencias ya instaladas; no se ejecutó npm ci de nuevo ni se modificaron dependencias/lock.

Chromium real sobre preview-dist: [browser-03](evidence/modular-ships/browser-03/results.json), 21/21 grupos, 390×844, 320×568 y 844×390; 142657 ms. Presets, mezcla, aplicar/cancelar, recarga, nave antigua, movimiento natural, pausa/reanudación/reinicio/menú y guardados centinela. Cero excepciones/consola/HTTP, máximo un RAF, hash de colisión original conservado. Medidos cero cruces con DISPARAR/transmisión en los tres tamaños. Son sesiones breves de vuelo; no certifican nivel completo, equilibrio o FPS sostenidos. La partida natural Journey repetida: [5/5 grupos](evidence/modular-ships/journey-regression-01/results.json), código 0, 87789 ms, sin acelerar tiempo ni insertar enemigos. Service worker bloqueado en estas pruebas; no certifica offline ni Safari físico.

Registros de errores conservados: certification-01 falló en dos arneses porque no cargaban NeonCampaign; se cargó el runtime real antes del juego, sin eliminar aserciones. certification-02 falló en dos pruebas nuevas: exigían centrar también la transparencia asimétrica de las llamas y comparaban una copia literal del layout. El contrato corregido comprueba toberas/anclajes medidos, límites, ocho combinaciones y continuidad de montaje. browser-01 pasó sus 21 controles, pero su revisión visual detectó el solape heredado de botones/mensajes; browser-02 añade la aserción geométrica y comprueba la corrección. No se borraron los intentos fallidos.

Hash de juego de la preview probado: cd64ffaa94bff331b94eb00539a03254df1bacde6e690957b4f3a3b50987ed74, 164040 bytes. Las capturas finales registraron base e2a31f285e1322303dc2811d8eb2ce592456eb16 y dirty:true antes del commit funcional. El paquete limpio posterior deberá conservar ese mismo hash, documentando su nuevo SHA de empaquetado.

Prueba de degradación adicional: [fallback-browser-01](evidence/modular-ships/fallback-browser-01/results.json), Chromium real 3/3, 20123 ms. Se bloqueó expresamente el atlas: nave original y aviso visibles, aplicación modular deshabilitada; elegir original funciona sin atlas; recargar con recurso permitido recupera la nave modular. Un fallo de red intencional documentado y cero errores inesperados. Cinco pruebas unitarias de las funciones reales cubren este caso. La revisión encontró y corrigió tanto el hangar vacío como el bloqueo indebido de la presentación legacy. [Regresión original/N-7](evidence/modular-ships/legacy-n7-regression-01/results.json) 2/2 en Chromium DPR3, realizada antes de ese último arreglo de degradación; el último render normal se volvió a verificar en browser-03.

## Capturas auténticas

- [Astér, hangar](evidence/modular-ships/browser-03/390x844-aster-hangar.png).
- [Bastión, hangar](evidence/modular-ships/browser-03/390x844-bastion-hangar.png).
- [Configuración mixta](evidence/modular-ships/browser-03/390x844-mixed-hangar.png).
- [Vuelo clásico corregido](evidence/modular-ships/browser-03/390x844-original-level-flight.png).
- [Antes: solape detectado en partida](evidence/modular-ships/browser-01/390x844-original-level-flight.png).
- [Pantalla pequeña](evidence/modular-ships/browser-03/320x568-original-level-flight.png) y [horizontal](evidence/modular-ships/browser-03/844x390-original-level-flight.png).

Son capturas del ejecutable, no conceptos ilustrados. La aceptación estética corresponde al propietario y continúa pendiente.

## GitHub, hosting y conservación

Commits publicados: e2a31f285e1322303dc2811d8eb2ce592456eb16 (ensamblaje y hangar), 1bb8a76e7a48df23fd013005bed60d35b6978e03 (degradación de carga), 0c056bf431aa65994c9716297c4e59a6ad6ca0ce (pruebas persistentes). Último corte probado 0c056bf431aa65994c9716297c4e59a6ad6ca0ce. Commit funcional, rama autorizada. Main y PR #3 sin operaciones. USE_ENGINE_V1 sigue false; no se alteró el motor experimental ni se añadió otro propietario RAF. El sitio privado existente es (web privada antigua, retirada) la revisión modular ha sido desplegada y confirmada por Sites como succeeded. Paquete limpio 2cfb5d4e750d805e0d928a05e02e1b93197d9fa8 y hash de juego idéntico al Chromium final. Ver [acta de paquete/publicación](PAQUETE_NAVES_MODULARES_2026-10-17.md) y PLAYTEST_SITE.md. Netlify producción y PR #3 no se despliegan.

## Estado y siguiente incremento

Técnica de este lote: PASSED. Arte: IN_REVIEW / aceptación pendiente. iPhone/Safari físico: PENDING. Cero niveles clásicos visualmente completos y ningún jefe final certificado por esta entrega. Las cien rutas N-7 son una variante conservada, no cien etapas terminadas. No se afirma calidad AAA, FPS constantes ni memoria estable prolongada.

Riesgos abiertos adicionales: el defecto histórico de glifos del HUD del nivel 10 no fue reproducido/cerrado en este lote; economía, combate y equilibrio no han cambiado por elegir otra nave. Si se selecciona propulsión Bastión antes de C9, no hay una tercera ilustración exclusiva de ese módulo.

Prioridad siguiente: recuperar el ritmo del clásico en un único nivel completo: rescate CRONIUM con consecuencias, cometas como acontecimientos con recorrido visible, enemigos y ataques anticipados, respuesta a impacto y desenlace integrado. Diseñar el papel de los jefes dentro del viaje; no añadir jefes o diez subniveles por inercia. Antes de multiplicar contenido, revisar esta nave en movimiento y producir daño/destrucción y puntos de arma compatibles. No introducir otra campaña ni otra economía durante esta corrección.
