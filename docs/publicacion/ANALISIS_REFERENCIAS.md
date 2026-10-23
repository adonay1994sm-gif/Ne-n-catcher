# Análisis de referencias antes de ordenar la raíz

Fecha: 19/10/2026. Se buscó cada archivo suelto de la raíz por su nombre en
`package.json`, `tests/`, `scripts/`, `sw.js`, `index.html`, `netlify.toml`,
`_headers`, `.github/`, `src/` y `preview/`. También se buscaron lecturas
genéricas de la raíz (`readdir(root)`, patrones como `TEST_REPORT`) y enlaces
desde la documentación.

## Archivos sueltos de la raíz

| Archivo | Lo usa código/pruebas/build | Enlaces desde docs | Decisión |
|---|---|---|---|
| `CHANGELOG.md` | No | README | Mover a `docs/` (vigente) |
| `APP_STORE_READINESS.md` | No | — | Mover a `docs/` (vigente) |
| `MONETIZATION_READINESS.md` | No | — | Mover a `docs/` (vigente) |
| `REMAINING_WORK.md` | No | — | Mover a `docs/` (vigente) |
| `REPOSITORY_AUDIT.md` | No | — | Mover a `docs/` (corte 7.2.0) |
| `CHANGELOG_PRE_RELEASE.md` | No | — | `docs/historico/` |
| `CHANGELOG_V7.md` | No | — | `docs/historico/` (V7.0.0) |
| `CORRECCIONES_V6_4_2.md`, `CORRECCIONES_V6_4_3.md` | No | README | `docs/historico/` |
| `MODULAR_REFACTOR_REPORT.md`, `MODULAR_SMOKE_REPORT.md` | No | README | `docs/historico/` (V6.5) |
| `OPTIMIZACION.md` | No | README | `docs/historico/` (V6.4.1) |
| `TEST_REPORT.md` | No | README | `docs/historico/` (V6.5) |
| `TEST_REPORT_PRE_RELEASE.md`, `TEST_REPORT_V7.md` | No | — | `docs/historico/` |
| `V6_6_TECHNICAL_REPORT.md` | No | — | `docs/historico/` |
| `DELIVERY_MANIFEST.txt` | No | — | `docs/historico/` (V6.5) |
| `Neon_Cronium_V6_8_0_Netlify_Directo.zip` | No | — | `docs/historico/` (entrega antigua) |
| `ART_DIRECTION_NEON_CRONIUM.md` | **Sí**: `tests/product-brand.test.mjs` | README | **No se mueve** |
| `ASSET_PRODUCTION_150.json` | **Sí**: `tests/run-tests.mjs`, `tests/campaign-space-design.test.mjs`, `tests/product-brand.test.mjs`, `scripts/export-review-source.py` | — | **No se mueve** |
| `ASSET_PRODUCTION_MAP.md` | **Sí**: `tests/run-tests.mjs` | — | **No se mueve** |
| `engine-preview.html` | **Sí**: `scripts/build-web.mjs`, `tests/product-brand.test.mjs` | — | **No se mueve** |
| `styles.css`, `analytics-manager.js` | **Sí**: `index.html`, build, `sw.js` | — | **No se mueve** |

Los archivos de la lista protegida (`ios/`, `capacitor.config.ts`,
`native-admob.js`, `ads-config.js`, `ad-bridge.js`, `privacy.html`,
`terms.html`, `manifest.webmanifest`, `sw.js`, `ASSET_MANIFEST.json`,
`assets/`, `game.js`, `content-runtime.js`, `core-runtime.js`, `index.html`,
`package*.json`, `netlify.toml`, `README.md`, `AGENTS.md`, `CLAUDE.md`) no se
tocan de sitio.

## ¿Qué carpeta de motor se usa de verdad?

| Carpeta | Quién la usa | ¿Entra en la app iOS? | ¿Se publica en la web? |
|---|---|---|---|
| `src/engine/` (6 archivos) | Solo pruebas: `npm run test:engine` y `tests/content-legacy-integration.test.mjs` (comprueba `USE_ENGINE_V1 = false`). | No | No |
| `js/engine/` (4 archivos) | `engine/demo.mjs` y `tests/campaign-adapter.test.mjs` (esta prueba no está en ningún script de npm). | No | **Sí**: `build-web.mjs` la copia a `www/js/engine/` |
| `engine/` (6 `.mjs`) | `engine-preview.html` (demo aislada). | No | **Sí**: `build-web.mjs` copia `engine-preview.html` y `engine/` a `www/` |

- **El juego real no usa ninguna de las tres.** `game.js` sale de
  `src/game/00…08`, `core-runtime.js` de `src/core/` y `content-runtime.js` de
  `src/game/progression/legacy-content-entry.js` (32 módulos, ninguno de motor).
- `src/engine/` y `js/engine/` tienen archivos con el mismo nombre
  (`CampaignAdapter`, `EngineCore`, `ParticleSystem`, `Renderer`) **pero con
  contenido distinto**: no son copias exactas.
- Hallazgo para publicación: la web pública (Netlify, carpeta `www/`) incluye
  la demo experimental `engine-preview.html`. No afecta a iOS. Ver
  `docs/propuestas/UNIFICAR_MOTORES.md`.
