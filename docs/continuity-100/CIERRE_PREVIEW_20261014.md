# Cierre de sesión — preview y Chromium, 14/10/2026

## A. Diagnóstico previo

Base KOO `8bf9513e7dd8e18e542856356812e280b9ff480a`, rama `continuity-assets-audit-20261013`. El WIP 50814e8 ya estaba remoto. Se recuperó mediante avance rápido el selector preparado por KOO. Su copia inicial compartía claves/caché con la edición normal y no acreditaba procedencia del paquete.

## B. Trabajo realizado

- `preview/launcher.html`: selector experimental, enlaces clásico/N-7, desbloqueo aislado, error de almacenamiento y SHA visible.
- `scripts/build-preview.mjs`: transformaciones limitadas a preview-dist, guardados prefijados, SW por ámbito/revisión, publicidad inactiva, cabeceras y build-info con hashes. No modifica www/iOS.
- `scripts/netlify-preview-gate.mjs`: exige flag, rama correcta y contexto permitido; producción/PR rechazadas.
- `tests/preview-build.test.mjs`: aislamiento de claves/caché, fallback offline, gate, archivos reales y procedencia. Once escenarios ejecutados y aprobados.
- `scripts/content-browser-smoke.cjs`: seis casos reales, polling temporal sin RAF extra, instrumentación de estados/timestamps, error HTTP/JS, imágenes reales, capturas y JSON con códigos de salida. Admite www, preview-dist y URL externa.
- `docs/CODEX_STATUS.md`, `CODEX_NEXT_ORDERS.md`: estado e instrucciones actualizados conservando el historial de KOO.

## C. Assets

No se crearon assets de juego nuevos. Se preservan los anteriores. Se produjeron seis capturas de pruebas Chromium, sin presentarlas como nuevas ilustraciones o certificación de iPhone.

## D. Pruebas y evidencia

Instalación reproducida: 214 paquetes, exit 0, después de utilizar una caché escribible. Build de preview aprobado (node scripts/build-preview.mjs), 91 archivos registrados. Suite preview **11/11 exit 0**. Los fallos previos del sandbox se conservan, no se ocultan.

Chromium **154.0.8037.57**, `www`: **6/6 exit 0**, 206068 ms, ambos modos en tres tamaños. Todos los casos comprueban controles táctiles/disparo, pausa, avance tras reanudar, reinicio reproducible y menú; máximo un RAF pendiente y cero excepciones. Cada caso inspeccionó 56 imágenes cargadas. Los dos iconos PWA no forman parte de ese conteo de sprites. Resultados y capturas: `evidence/block-02/browser-www-20261014-01/`.

Las 23 pruebas de contenido y demás suites del Bloque 02 son resultados previos preservados en `evidence/block-02/certification/run-01`. No se atribuyen a esta ejecución. La funcionalidad de campaña no cambió. No existe aún pase Chromium de preview-dist ni certificado físico Safari/iPhone.

## E. Errores y límites

Corregidos en código de preview: mezcla de almacenamiento/caché; falta de identificación de revisión; gate insuficientemente limitado; test de navegador con esperas fijas/polling RAF. Pruebas unitarias y de paquete pasan.

Pendientes: ciclo real de SW, cabeceras efectivas en Netlify (TOML puede prevalecer sobre _headers), entrada PWA instalada que sigue abriendo clásico, contraste directo de SHA de build-info con HEAD tras reconstruir. No se modificó el generador ni se implementaron jefes, nuevos sprites, relato completo o música.

Agente de QA aportó el script; root ejecutó y verificó JSON/capturas. Agente de preview implementó los cuatro archivos asignados; root construyó y ejecutó once escenarios (el agente había estimado doce: el conteo real es once). Agente de revisión inspeccionó aislamiento y señaló los límites de cabeceras/PWA/procedencia, conservados aquí. Un informe de agente no se tomó como sustituto de ejecución.

## F. GitHub

Única rama `continuity-assets-audit-20261013`; asunto del commit de cierre: `fix(preview): isolate trial package and preserve Chromium QA evidence`. SHA inicial exacto 8bf9513e7dd8e18e542856356812e280b9ff480a. SHA final se comunica tras publicar y comprobar remoto. Main/PR3 sin cambios. No force push. Engine V1 false.

## G. Netlify

HTTP200 en `https://deploy-preview-3--neoncatcheroriginal.netlify.app/`: vista histórica protegida, no actualizada. HTTP404 en la dirección candidata `https://continuity-assets-audit-20261013--neoncatcheroriginal.netlify.app/`: no se ofrece como enlace funcional. API de Netlify HTTP401; sin credenciales/site ID en el entorno. El endpoint de deployments de GitHub no fue accesible por esta vía (403); el conector de estados no mostró un despliegue de este SHA.

No se realizó un despliegue nuevo. No se verificaron variables ni configuración privada dentro de Netlify. Configuración de repositorio: publish preview-dist, comando gate + build:preview + test:static + test:preview. Su ejecución en la cuenta sigue pendiente. Se entrega paquete autocontenido para Drop con su build-info; es una compilación experimental local, no una URL publicada.

## H. Continuación exacta

Conservar cambios locales si existen, recuperar la rama sin reset/clean y leer CODEX_STATUS. Después:

```sh
git status --short --branch
git fetch origin continuity-assets-audit-20261013
git switch continuity-assets-audit-20261013
git pull --ff-only origin continuity-assets-audit-20261013
npm ci --cache /workspace/.cache/neon-npm
npm run build:preview
NODE_OPTIONS=--test-isolation=none npm run test:preview
node scripts/content-browser-smoke.cjs --root preview-dist --output docs/continuity-100/evidence/block-02/browser-preview-next
```

Usar un directorio de evidencia nuevo. Playwright debe ser resoluble y Chromium estar instalado; CHROMIUM_PATH configura ejecutable. En el entorno restringido algunas llamadas spawnSync fallan con EPERM: usar el permiso adicional de ejecución apropiado, no ocultar errores. No cambiar código válido para enmascarar el sandbox.

Tras correcciones funcionales ejecutar `node scripts/certify-local.mjs docs/continuity-100/evidence/block-02/certification/run-next` y guardar salida. No sobrescribir directorios anteriores. Probar SW activo/offline aparte (smoke usa serviceWorkers:block). Subir paquete solo a preview autorizada, registrar URL/SHA y comprobar los dos modos. Mantener pendiente certificación física de iPhone. Después continuar el bloque de jugabilidad/arte, sin confundir datos de jefes con combates.
