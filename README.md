# NEON CRONIUM

Aventura arcade espacial en desarrollo. Nombre vigente desde el 17/10/2026; anteriormente NEON CATCHER. Rama principal: `main`.

[Web de pruebas (Netlify)](https://neon-preview-deploy.netlify.app) · [Web privada anterior](https://neon-catcher-pruebas.chictide18.chatgpt.site) · [Estado vigente](docs/CODEX_STATUS.md) · [Visión de producto](docs/PRODUCT_VISION.md) · [Dirección artística](ART_DIRECTION_NEON_CRONIUM.md).

La ruta Chronos → Gaia contiene diez etapas conectadas con checkpoints, recuperación de CRONIUM, taller C9 desde el HUD y Atlas móvil como guardián de acceso. Las campañas y partidas anteriores se conservan. Los nombres técnicos de guardado/instalación y la URL histórica permanecen compatibles; las nuevas compilaciones y archivos de entrega se identifican como NEON CRONIUM. Los informes y ZIP previos conservan su nombre/procedencia histórica. Motor V1 desactivado; sin publicación comercial.

## Compilar y probar

`npm ci`, `npm run build:preview`, `npm run test:engine`, `npm run test:architecture`, `npm run test:content`, `npm run test:static`, `npm test`, `npm run test:preview`. El paquete aislado se crea en `preview-dist/`; las fuentes se regeneran hacia web/iOS con el pipeline existente.

[Preparar Netlify de pruebas](docs/agents/NETLIFY_TEST_SETUP.md) · [Skills y fuentes abiertas](docs/agents/OPEN_SOURCE_REVIEW.md) · [Equipo especialista](docs/agents/SPECIALIST_TEAM.md). `npm run audit:repository` inventaría el repositorio sin borrar archivos. Limpieza del 20/10/2026 (capturas antiguas y assets sin uso fuera): [informe](docs/publicacion/LIMPIEZA_2026-10-20.md). Las carpetas `www/` e `ios/App/App/public/` son salidas regeneradas por el build y se excluyen de Git.

## Mapa de carpetas

| Ruta | Qué contiene |
|---|---|
| `src/game/` | **Código del juego.** Módulos `00-…` a `08-…` (se unen en `game.js`) y subcarpetas de contenido (`progression/`, `combat/`, `ship/`, `audio/`…). Aquí se edita. |
| `src/core/` | Núcleo compartido (estado de partida, guardado, modelo del jugador, daño y pool de objetos). Genera `core-runtime.js`. |
| `src/engine/` | Motor experimental V1, desactivado (`USE_ENGINE_V1 = false`). Solo lo usan pruebas. |
| `src/native-admob-entry.js` | Puente de anuncios nativos. Genera `native-admob.js`. |
| `assets/` | Imágenes y sonidos que usa el juego (inventariados en `ASSET_MANIFEST.json`). |
| `art-source/` | Originales de arte de alta resolución (no se publican). |
| `ios/` | Proyecto Xcode de Capacitor. `ios/App/App/public/` lo regenera el build. |
| `scripts/` | Build (`build-*.mjs`), auditorías y pruebas de navegador (`*-smoke.cjs`). |
| `tests/` | Pruebas automáticas (`npm test`, `npm run test:static`, `npm run test:content`…). |
| `docs/` | Documentación. Diseño vigente en `docs/superpowers/specs/` y `docs/design/BIBLIA_GALAXIA.md`; tareas en el tablero del proyecto (ver `CLAUDE.md`). |
| `docs/publicacion/` | Preparación para la App Store: checklist, progreso e informes. |
| `docs/propuestas/` | Propuestas pendientes de decisión del propietario. |
| `docs/production-reports/` | Informes de producción. Sus capturas antiguas se retiraron el 20/10/2026 y siguen en el historial de git. |
| `engine/`, `js/engine/`, `engine-preview.html`, `render/` | Demo aislada del motor experimental (solo web). |
| `design/`, `preview/`, `tools/`, `.agents/` | Diseño de campaña, lanzador de preview, terceros revisados y skills de agentes. |
| `www/` | Paquete web generado por `npm run build` (no está en Git). |

Archivos generados que no se editan a mano: `game.js`, `core-runtime.js`,
`content-runtime.js`, `native-admob.js` y todo `www/`.

El texto siguiente documenta la base histórica, no certifica la versión actual.

---

## Base histórica V6.6 — Corredor Garantizado · Base modular

V6.6 parte de la V6.4.4 Base Estable y elimina las combinaciones imposibles entre formaciones orbitales y amenazas. Las antiguas vigas artificiales se muestran ahora como formaciones de basura espacial con un pasillo cian protegido. Mientras la formación se aproxima, meteoritos, restos y satélites no pueden aparecer, desplazarse ni permanecer dentro de esa ruta.

La silueta de colisión de la nave, los objetivos, las velocidades, la frecuencia base de objetos, los controles y las claves de progreso permanecen intactos. Esta versión está verificada como siguiente base técnica; todavía no es una release de App Store.

## Qué contiene

- Campaña completa de 10 sectores con briefing, progreso, récords y estrellas.
- Colisión inteligente heredada de V6.3.
- Corredor garantizado en S6–S10: abertura mínima de 246 px para una nave de 212 px lógicos, con 17 px geométricos de margen por lado en el sector más estrecho.
- Formaciones visuales de basura espacial generadas con los assets existentes y sin invadir el pasillo, incluso al rotar.
- Protección continua frente a amenazas que nacen o derivan hacia el corredor; núcleos y habilidades no se eliminan.
- Sprites, daño, explosión y reaparición de V6.4.x.
- Migración idempotente del récord `neon-best-v1` a `neon-best-v2`.
- Caché PWA V6.6 con todos los recursos de producción y actualización network-first del código.
- Dependencias fijadas y `package-lock.json` para instalaciones reproducibles.
- Paquete web limpio en `www/` y proyecto Capacitor iOS en `ios/`.
- AdMob nativo conectado en modo de prueba; la recompensa solo se concede tras el evento confirmado. La web usa un simulador de QA identificado y no solicita anuncios.
- Código principal separado en 9 módulos bajo `src/game/`; `game.js` se genera automáticamente para conservar compatibilidad total.

## Ejecutar la versión web

```bash
npm ci
npm run build
npm run test:static
npm test
npm run serve
```

Abre la dirección local mostrada por `serve`. Para revisar exactamente el paquete que copia Capacitor, usa `npm run serve:prod`.

En un despliegue conectado a Git, Netlify ejecuta `npm run build` y publica únicamente `www/`, según `netlify.toml`.

## Sincronizar iOS

```bash
npm ci
npm run cap:sync
```

La compilación y firma del IPA requieren macOS/Xcode o el flujo de Codemagic. El bundle ID permanece en `com.adonay.neoncatcher`.

## Publicidad

Los IDs incluidos son las unidades de demostración oficiales de Google. No generan ingresos. Antes de producción deben configurarse los IDs reales, el mensaje de consentimiento, la identidad/contacto del responsable y las declaraciones de privacidad de App Store.

## Documentación de control

- `docs/CHANGELOG.md`: cambios y funciones preservadas.
- `src/game/README.md`: mapa de responsabilidades y reglas de edición.
- `ASSET_MANIFEST.json`: inventario, dimensiones, pivotes, secuencias y uso de assets.
- Los informes de versiones anteriores (V6–V7, Codex) se retiraron el 23/10/2026 y siguen en el historial de git.
