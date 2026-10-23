# INFORME DE PRODUCCIÓN — NEON CRONIUM · preview Netlify

Fecha: 2026-10-16 UTC
Rama: `continuity-assets-audit-20261013`
SHA de la compilación publicada: `5a2f91647f582ad117b18df58da3d1a77b6c08e0`
Bloque trabajado: 03, prueba remota aislada.
Estado: URL temporal verificada; despliegue duradero pendiente.

## A. Resumen ejecutivo

Se publicó la compilación experimental de ambas campañas mediante **Netlify Drop**, en un sitio independiente de producción y de la PR #3. URL comprobada: `https://idyllic-custard-c8c391.netlify.app/`. Netlify la protege con una contraseña compartida directamente con el propietario; el sitio **caduca aproximadamente una hora después de su creación (~15:45 UTC)** si no se reclama. No constituye el branch deploy duradero solicitado.

## B. Trabajo ejecutado

Se compiló `preview-dist/` desde un árbol limpio. `build-info.json` declara el SHA anterior, rama autorizada, `dirty:false`, `engineV1:false`, anuncios y pagos reales desactivados. Se subió un ZIP con `index.html` en raíz y selector de modos. Se amplió `scripts/content-browser-smoke.cjs` para autenticar una preview remota protegida usando `NEON_BROWSER_PASSWORD` y `NEON_BROWSER_PROXY`, sin guardar el valor de la contraseña en el resultado. La verificación de imágenes ignora sprites cuya carga se difiere intencionalmente; el primer intento fallaba en la campaña clásica por exigir el atlas CH-01 que solo usa N-7.

## C. Archivos modificados

- `scripts/content-browser-smoke.cjs`: acceso a Drop protegido y corrección del chequeo de imágenes diferidas.
- `docs/production-tasks.json` y documentos generados `PRODUCTION_MASTER_CHECKLIST.md` / `PRODUCTION_PROGRESS.md`: B03-18 pasa de BLOCKED a IN_REVIEW por caducidad del sitio.
- `docs/CODEX_STATUS.md`, `docs/PRODUCTION_LATEST_REPORT.md`, `docs/CODEX_NEXT_ORDERS.md`, `docs/NETLIFY_PRUEBA_N7.md`: estado y continuación actualizados.
- `docs/production-reports/evidence/netlify-drop-20261016/`: ZIP, procedencia, HTTP, JSON y capturas de Chromium; se conserva también la primera ejecución fallida.

## D. Assets

No se generaron assets nuevos. El recurso CH-01 existente (`juego/assets/ch01_atlas_v1.webp`, 484 814 bytes) se sirvió con HTTP 200 y coincidió byte a byte con el paquete. El ZIP de la preview contiene 95 entradas y ocupa 1 825 988 bytes; SHA-256 `1498a0679d957ebb54bc345faa6f0ddaa4bcba5c54027bfd6ed559445ee821d3`.

## E. Integración

La URL raíz muestra el selector. La tarjeta clásica abre `/juego/` y la N-7 abre `/juego/?campaign=n7`. En Chromium móvil ambos modos iniciaron partida; funcionaron movimiento táctil, disparo, pausa, reanudación, reinicio y regreso al menú. El modo N-7 mantuvo el avance del director. El juego mantiene un único RAF pendiente en estas pruebas.

## F. Pruebas y evidencias

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| `git status`, SHA local y `git ls-remote` | Rama limpia al comenzar; local/remoto `5a2f916` | consola de intervención |
| `npm run build:preview && npm run test:preview` | exit 0; 15/15 | `preview-dist/build-info.json` y ZIP archivado |
| Netlify Drop y autenticación | Sitio creado; contraseña aceptada (302), selector y dos entradas HTTP 200 | `evidence/netlify-drop-20261016/deployment.json` |
| Contenido remoto | `build-info` SHA correcto; 4/6 recursos probados idénticos por bytes. Netlify reescribe enlaces de ambos HTML; scripts y atlas coinciden | `evidence/netlify-drop-20261016/http-content.json` |
| Chromium remoto, primer intento | exit 1; clásico falló por expectativa incorrecta sobre imagen diferida; N-7 pasó; 0 errores JS/HTTP | `evidence/netlify-drop-20261016/browser-remote/results.json` |
| Chromium remoto, repetición corregida, 390×844 | **exit 0; 2/2** modos, sin excepciones ni peticiones fallidas | `evidence/netlify-drop-20261016/browser-remote-02/results.json` y PNG |
| `node --check scripts/content-browser-smoke.cjs`, ledger `--check`, `git diff --check` | exit 0 | consola de cierre |

Los 2/2 casos remotos verifican jugabilidad básica en Chromium emulado. No son una prueba física de iPhone ni una certificación de FPS/memoria. Las otras orientaciones ya tienen pruebas locales previas; no se repitieron en esta URL.

## G. Problemas detectados

El branch deploy esperado continúa devolviendo 404; no hay token ni ID de sitio Netlify configurados, y el conector de GitHub no puede leer los secretos del repositorio (403). El sitio Drop no reclamado caduca. La primera ejecución de Chromium remoto falló por un chequeo obsoleto de imágenes diferidas. Netlify reescribe enlaces HTML, por lo que los hashes de esos dos HTML publicados difieren de `build-info.json`; los archivos JavaScript y el atlas comparados sí coinciden. No se observó error de juego por esas reescrituras.

## H. Correcciones

Se corrigió el verificador de imágenes para exigir carga solo a sprites con URL asignada. La repetición remota aprobó ambos modos. No hubo cambio en la lógica del juego ni en el paquete ya publicado por esta corrección de QA.

## I. GitHub

Rama exclusiva: `continuity-assets-audit-20261013`. SHA inicial del paquete `5a2f91647f582ad117b18df58da3d1a77b6c08e0`. El commit de este informe, test y evidencias debe consultarse con `git log -1` o `git ls-remote origin refs/heads/continuity-assets-audit-20261013`; el documento no puede contener su propio SHA. No se modificó `main` ni PR #3 ni se hizo force push.

## J. Netlify

URL verificada: `https://idyllic-custard-c8c391.netlify.app/`. Build servido: `5a2f91647f582ad117b18df58da3d1a77b6c08e0`. Es un sitio experimental creado con Netlify Drop, protegido por contraseña y temporal. La URL de PR #3 corresponde a otra rama. No se tocó el sitio Netlify de producción.

## K. Estado general

Checklist: 267 tareas, 22 DONE, 20 IN_REVIEW, 217 PENDING, 2 IN_PROGRESS, 6 BLOCKED. B03-18 queda IN_REVIEW hasta disponer de una URL duradera bajo la cuenta del propietario. Campaña clásica y N-7 son jugables en la prueba; los diez jefes, gran parte del arte, audio, narrativa completa y Safari físico siguen pendientes.

## L. Siguiente bloque

1. Para mantener la preview, publicar el ZIP archivado en un **sitio de prueba propio** de Netlify o habilitar solo `continuity-assets-audit-20261013` con `NEON_PREVIEW_DEPLOY=1`; registrar URL y SHA servidos.
2. Probar esa URL en Safari de iPhone y registrar modelo/iOS, controles, guardados y errores.
3. Retomar el Bloque 04 procedural y el lote CH-01 sin activar Engine V1.

## M. Riesgos

La URL Drop deja de servir al expirar. El HTML reescrito por Netlify reduce la utilidad de una comparación estricta por bytes para esos dos archivos. No hay datos reales de FPS, memoria o Safari físico. La versión sigue siendo experimental y no equivale a un juego final de 100 niveles.
