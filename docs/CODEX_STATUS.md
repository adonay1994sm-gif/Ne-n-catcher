## Vigente — mandato rector 10×10 y primera unidad de viaje, 17/10/2026

Referencia creativa actual: [PRODUCT_VISION.md](PRODUCT_VISION.md). El incremento **WIP** `398d1ca479de9aefe6bacc6f36900c3111ffa7d4` y la corrección funcional `ce71b299cb0eea8cbb908dd4886319e4e859580e` están en la rama autorizada. Puede jugarse `?campaign=journey`: salida de Chronos, pieza recogida en vuelo, parada C9, instalación visible y útil, tránsito, guardián CH-01 y llegada guardada. Se conservan clásica/N-7 y sus datos. Nuevo arte real: módulo Chronos transparente 640×640, 101 668 bytes; inventario 70 recursos sin inconsistencias. Motor V1 sigue false, un RAF, main/PR #3 intactas.

Certificación final 11/11 fases (contenido 44/44), preview 15/15, partida Chromium natural 5/5 y regresión de zona útil sin solapes. Prueba adicional de integración/manual 4/4. P1 queda **IN_REVIEW** por aceptación artística y prueba física, no capítulo terminado ni 100 etapas. No hay URL Netlify nueva. Informe/capturas/errores/órdenes exactas: [P0–P1 Chronos-Gaia](production-reports/P0_P1_CHRONOS_GAIA_2026-10-17.md). Todo el contenido anterior de este archivo se conserva como historial.

---

## Estado vigente: base visual de diez niveles — 2026-10-17 UTC

Rama autorizada `continuity-assets-audit-20261013`. El código visual publicado llega a `80540884b15c8936dbcea9f5131a142077b85a6e`; los commits anteriores del lote constan en [INFORME_FINAL_10_NIVELES.md](visual-rebirth/INFORME_FINAL_10_NIVELES.md). Se generaron nueve fondos originales para los niveles clásicos 2–10 y un atlas de cuatro fases para la onda Chronos del nivel 1. Los maestros, WebP, inventario, fuentes, bundles, service worker, galería antes/después y pruebas están en GitHub. Hay **10/10 escenarios con ilustración, 0/10 niveles visualmente completos**: faltan enemigos propios, animación modular, parallax independiente, VFX por mundo y QA física.

La certificación local final pasó 11/11 fases; preview limpia de `8054088` pasó 15/15 y Chromium de ambos modos 2/2. Inventario: 69 recursos, 4 936 486 bytes, cero inconsistencias. Paquete experimental [neon-catcher-visual-preview-8054088.zip](visual-rebirth/evidence/neon-catcher-visual-preview-8054088.zip), SHA-256 `c2dd3fde85b8a2ff59216e00b0d9ee2eeaa25765139b8f21a520b0410f15fb37`, selector en raíz. **No existe una URL Netlify nueva verificada**; la Drop del 16/10 era temporal y corresponde a código anterior. Safari/iPhone físico sigue sin prueba. Un defecto intermitente de glifos del HUD en capturas Chromium del nivel 10 queda abierto; DOM y controles funcionales pasaron. `USE_ENGINE_V1` continúa `false`. Main y PR #3 permanecen intactas. Para seguir: investigar ese pintado, probar iPhone, integrar CH-01 en Gaia clásica y empezar capas/animaciones; ver el informe completo y `CODEX_NEXT_ORDERS.md`.

---

## Integración CH-01 y preview comprobada — 2026-10-16 UTC

La rama autorizada publicó `9d28569fe13ecb1d7e6cd53693dc10ae580db9e4`: el atlas CH-01 de 24 fotogramas ya sustituye al meteorito de los tiradores N-7, con disparo ligado al fotograma, daño y destrucción. El inventario runtime pasa de 58 a 59 archivos sin inconsistencias. La certificación posterior pasó 11/11 fases; Chromium sobre la preview limpia de ese SHA aprobó 2/2 casos, incluida la ruta 37 completa, y offline aprobó 4/4. ZIP experimental y SHA-256 en `production-reports/evidence/block-03/preview-package-9d28569.json`. Chromium controlado capturó ataque, impacto y destrucción del Canvas real (4/4); la actualización controlada de ambos SW pasó 3/3 y conservó cachés ajenas; falta combatirlo naturalmente, Gaia clásica, Netlify autenticado y Safari/iPhone físico. Informe técnico vigente: `PRODUCTION_LATEST_REPORT.md`.

Checklist actual: 22 DONE, 19 IN_REVIEW, 217 PENDING, 2 IN_PROGRESS y 7 BLOCKED de 267 tareas. No equivale a porcentaje del videojuego terminado. No existe URL N-7 desplegada; el ZIP es sólo una construcción local. `USE_ENGINE_V1 = false`.

---

## Producción anterior — 2026-10-16 UTC

Bloque 03: Chromium real sobre `preview-dist` aprobado **7/7, exit 0** en 390×844, 320×568 y 844×390, dos campañas. La séptima sesión terminó la ruta N-7 37 con enemigos, proyectiles móviles y guardado persistente tras recarga. Dos ejecuciones con service workers reales aprobaron **4/4 cada una, exit 0**: selector y ambas campañas offline. Evidencia JSON y capturas en `docs/production-reports/evidence/block-03/browser-preview-01/` y `offline-01/`, `offline-02/`. La prueba física de iPhone y el despliegue Netlify siguen pendientes. No hay URL N-7 verificada.

Commits publicados de esta producción: `e1a7aa8498b1c5f9f5558425a61b748f4ab1f869` (preview/audio/QA), `9c86abdd3cecc0e58bf92bb7e974abc9832cf3a0` (atlas CH-01), `dbb0fa470ca397c9054ac69f58dc7219ba7b48b4` (evidencias Chromium/offline y animador CH-01). El animador tiene 9/9 pruebas aprobadas, pero todavía no está unido a la campaña. El atlas tampoco se considera un asset integrado. Fuente de tareas: `production-tasks.json`; 14 DONE de 267, sin inferir porcentaje del juego terminado. Consultar `production-reports/BLOQUE_03_2026-10-16.md` para límites y siguientes pasos.

---

## Producción anterior — 2026-10-15 UTC

Base sincronizada por fast-forward: `f5b486ccfcdc56319417c33d7fa9282708ed6d64`. Rama exclusiva `continuity-assets-audit-20261013`.

Bloque 03 implementado en revisión: pausa con SVG, interfaz horizontal contenida, reanudación de efectos con música silenciada, selector PWA offline separado y comprobación del SHA real en la preview. Art Pass A conservado.

Pruebas nuevas: 11 fases de `scripts/certify-local.mjs` con exit 0 en `production-reports/evidence/block-03/certification-01/`; preview 15/15 exit 0. Regresión audio reproducida antes (2/3, exit 1) y corregida después (3/3, exit 0). Chromium del paquete modificado todavía pendiente en este punto. No declarar Bloque 03 certificado con estas pruebas solamente.

Control medible: `PRODUCTION_MASTER_CHECKLIST.md`, `PRODUCTION_PROGRESS.md` y fuente `production-tasks.json`. Netlify sin credenciales configuradas ni nuevo despliegue. Engine V1 false; main y PR #3 sin cambios. El arte CH-01 está en producción separada y no se considera integrado.

Este avance se conserva con el commit `fix(preview): prepare integrated offline trial and mobile lifecycle QA`. Continuar con Chromium sobre preview-dist y SW reales; después actualizar este estado con las evidencias completas.

---

# NEON CATCHER — Estado compartido Codex / KOO

## Actualización de preview remota — 16/10/2026

Se publicó una prueba **temporal** independiente mediante Netlify Drop: `https://idyllic-custard-c8c391.netlify.app/` (contraseña comunicada directamente al propietario). El sitio no reclamado caduca aproximadamente a las **15:45 UTC del 16/10/2026**. Sirve `build-info.json` del commit `5a2f91647f582ad117b18df58da3d1a77b6c08e0`, selector y ambas campañas. Chromium remoto móvil 390×844: **2/2, exit 0**, controles, disparo, pausa/reanudación, reinicio y menú; 0 errores JS/HTTP. La primera ejecución (exit 1) reveló una expectativa obsoleta del test para imágenes diferidas, corregida y repetida. Arte CH-01 y scripts cotejados byte a byte. No hay despliegue permanente ni prueba de iPhone físico. Informe y ZIP reutilizable: [NETLIFY_DROP_2026-10-16.md](production-reports/NETLIFY_DROP_2026-10-16.md). El estado a continuación conserva el cierre histórico de 14/10 y no describe la preview remota actual.

## Cierre de sesión Codex — 14/10/2026

**Avances conservados; preview aislada implementada y probada estáticamente. Chromium del paquete web ordinario: 6/6 aprobados. Chromium de preview-dist y despliegue Netlify: pendientes.**

Base recuperada de KOO: `8bf9513e7dd8e18e542856356812e280b9ff480a`. Rama exclusiva: `continuity-assets-audit-20261013`. El Bloque 02 WIP `50814e88f19f6790b6417bb49a2ea79d240b37a0` está preservado en el historial remoto. El commit de esta intervención lleva el asunto `fix(preview): isolate trial package and preserve Chromium QA evidence`; consultar su SHA en Git. No se cambió código funcional de la campaña durante esta intervención.

### Terminado realmente

- Incorporados todos los cambios publicados por KOO mediante avance rápido, sin sobrescribir archivos.
- Selector experimental con ambas campañas y SHA visible; desbloqueo exclusivo del guardado de prueba.
- Preview con prefijo propio de almacenamiento, service worker/caché por scope y revisión, anuncios reales desactivados, manifiesto de procedencia `build-info.json` con hashes.
- Gate de Netlify restringido a la rama autorizada y contexto local/branch-deploy, además de `NEON_PREVIEW_DEPLOY=1`.
- Script Chromium rehecho con condiciones observables, registros parciales, errores, hashes y seis casos reales. No introduce un RAF de prueba que falsee la concurrencia.
- Informe y resultados: `docs/continuity-100/CIERRE_PREVIEW_20261014.md`.

### Pruebas ejecutadas

- `npm ci --cache /workspace/.cache/neon-npm --no-audit --no-fund`: **exit 0, 214 paquetes**. El primer intento falló por caché no escribible en `/home/agent/.npm`; su log se conserva.
- `node scripts/build-preview.mjs`: **exit 0**, 91 archivos del paquete documentados en build-info. Dos intentos iniciales del sandbox restringido fallaron con `spawnSync git EPERM`; la repetición con permisos adicionales terminó correctamente.
- `NODE_OPTIONS=--test-isolation=none npm run test:preview`: **11/11, exit 0**. Logs en `docs/continuity-100/evidence/netlify-20261014/`.
- Chromium 154.0.8037.57, `--root www`: **6/6, exit 0**, duración 206068 ms. Ambos modos en 390×844, 320×568 y 844×390; pausa/reanudación/reinicio/menú y controles, cero excepciones, máximo un RAF pendiente. Resultados/capturas en `docs/continuity-100/evidence/block-02/browser-www-20261014-01/`.
- Sintaxis y `git diff --check`: aprobados. Los 40 engine, 6 arquitectura, 23 contenido, 13 static, 33 general, 13 web y 14 adicionales siguen siendo los resultados publicados en `certification/run-01`; **no se repitió esa batería completa en esta intervención de preview**. No hubo cambios funcionales de campaña que pretendan quedar certificados con cifras nuevas.
- La última llamada a `npm run build:preview` quedó interrumpida antes de producir evidencia adicional; no se cuenta como otra aprobación.

### Netlify: limitación comprobada

La URL histórica de PR #3 responde HTTP 200 y pertenece a esa PR; no se modificó. La dirección candidata de branch deploy devolvió **404**. La API Netlify devolvió **401**, no hay token ni site ID configurados y no hay herramienta Netlify instalada/conectada. **No se creó ni verificó un despliegue nuevo; no hay URL N-7 publicada que pueda entregarse.** No fue posible inspeccionar repositorio/rama/variables/commit dentro de la cuenta Netlify. Las comprobaciones HTTP están guardadas en `evidence/netlify-20261014/http-probes.json`.

### Pendiente exacto

1. Ejecutar Chromium contra `preview-dist`, incluida navegación real del selector y guardados aislados. El pase 6/6 corresponde a `www`, no a esta variante.
2. Verificar el ciclo real del SW online/offline y cabeceras servidas: el smoke bloquea service workers; las pruebas actuales de SW son unitarias.
3. El manifiesto PWA heredado abre el modo clásico al instalarlo; ajustar su entrada al selector o documentar la limitación. Cabeceras TOML globales pueden prevalecer sobre `_headers`; no declarar cabeceras remotas verificadas.
4. Comprobar `build-info.commit/sourceTree` contra el checkout al reconstruir un paquete para distribuir; las pruebas actuales validan formato y hashes, no todos los valores de Git actuales.
5. Con acceso autenticado a Netlify, habilitar únicamente la rama de prueba y `NEON_PREVIEW_DEPLOY=1`, o subir contenido de `preview-dist` a un sitio de prueba mediante Drop. Verificar URL y SHA reales; no usar PR #3 ni producción.
6. Continuar jugabilidad/assets/jefes/narrativa/audio después del cierre técnico. No se generaron assets ni funciones nuevas de combate durante esta intervención. iPhone físico sigue pendiente.

`USE_ENGINE_V1 = false`; main y PR #3 sin cambios, sin force push, sin despliegue de producción.

---

## Actualización Codex — conservación urgente WIP, 13/10/2026

**BLOQUE 02: CONSERVADO COMO WIP. NO CERTIFICADO EN CHROMIUM NI IPHONE.**

La Dirección ordenó detener las ampliaciones y publicar inmediatamente el trabajo, aunque faltase cerrar Chromium. El commit de conservación lleva el asunto `WIP(block-02): preserve procedural campaign and resume fix pending Chromium QA`. Su SHA se obtiene con `git log -1 --format=%H --grep='WIP(block-02)'`; el informe de publicación lo comunica tras verificar el remoto.

- Única rama: `continuity-assets-audit-20261013`.
- SHA inicial local: `e104f0c9af10d47cfb497af9962d849fb9c0b7b2`.
- SHA remoto de KOO incorporado por avance rápido: `bf33e2bedd8d8a8312d1692d9f849666f3919999`.
- Los 246 archivos del paquete de continuidad coincidían exactamente con el árbol local: cero ausentes y cero diferencias. No se sobrescribió ningún cambio remoto.
- Se conservaron ambos documentos de KOO; su estado anterior está también en `docs/continuity-100/evidence/block-02/certification/koo-status-before.md`.
- Respaldo previo local: `/workspace/scratch/neon-block02-recovery/pre-recovery-tree.tar.gz`, más parche y comparación. El trabajo útil del Bloque 02 queda incluido en el commit WIP; no depende de ese respaldo para reconstruirse.

### Terminado e implementado

- Modalidad optativa `?campaign=n7`: 100 rutas, cinco sectores, director de encuentros determinista `n7-waves-v2`, patrones lineal/zigzag/perseguidor/tirador, suministro y corredor reservado.
- Integración en el mismo bucle legacy y claves de progreso separadas. La entrada normal conserva diez niveles.
- Build de `content-runtime.js` y copias web/iOS; sincronización de `game.js` desde sus fuentes.
- Corrección de delta negativo en el callback RAF: `Math.max(0, Math.min(0.034, ...))`.
- Indicador propio y visible de oleadas; etiquetas RUTA en el modo N-7.
- Pruebas de 100 rutas, 3.200 combinaciones nivel/semilla y regresión que ejecuta los callbacks RAF antes y después de reanudar.
- Runner reproducible `scripts/certify-local.mjs`, con logs, códigos de salida, tiempos y hashes de artefactos.

### Pruebas ejecutadas sobre este trabajo

Evidencia completa: `docs/continuity-100/evidence/block-02/certification/run-01/results.json`. Todas las fases siguientes terminaron con **Exit Code 0**:

| Comando | Resultado |
| --- | --- |
| `npm run build` | Aprobado; bundles web/iOS sincronizados |
| `npm run test:engine` | 40/40 |
| `npm run test:architecture` | 6/6 |
| `npm run test:content` | 23/23, incluye integración, referencias de assets y 3.200 combinaciones |
| `npm run test:static` | 13/13 |
| `npm test` | 33/33 |
| `node tests/run-v7-web-tests.mjs` | 13/13 |
| `node --test tests/campaign-adapter.test.mjs tests/neon-render-engine.test.mjs tests/sprite-animator.test.mjs` | 14/14 |
| `node scripts/audit-asset-inventory.mjs` | 58 activos, dos conservados, cero inconsistencias |

El runner usa `NODE_OPTIONS=--test-isolation=none` para registrar escenarios individuales. Los conteos se solapan y no deben sumarse. El build no es un despliegue.

### Chromium: diagnóstico y cierre pendientes

El fallo histórico observó que el reloj del director no avanzaba tras pulsar Reanudar. Se reprodujo con el callback real un defecto de robustez: un RAF con timestamp anterior al `performance.now()` de reanudación produce delta negativo, el director lanza `RangeError: Finite nonnegative delta required` y no se programa el siguiente RAF.

La nueva regresión falló antes del arreglo (Exit Code 1, `certification/raf-before-fix.txt`) y pasó dentro de las 23 pruebas después. El límite inferior del delta está aplicado y compilado. **Esto no certifica todavía que la ejecución Chromium completa haya quedado resuelta.**

El script de navegador captura excepciones, errores HTTP y espera avance observable en vez de una pausa fija de 100 ms. El agente intentó ejecutarlo, pero la llamada se interrumpió sin resultado verificable. No hay `browser/results.json` aprobado. La captura parcial `browser/390x844.png` pertenece a la ejecución histórica fallida.

Resultados de los agentes y diagnóstico: `docs/continuity-100/BLOQUE_02_WIP.md`.

### Pendiente / límites

- Completar Chromium en 390×844, 320×568 y 844×390; comprobar estado, reloj, errores, pausa/reanudación, reinicio y un solo RAF. Repetir satisfactoriamente antes de declarar cerrado el bloque.
- Jefes siguen siendo definiciones; arte de enemigos reutilizado, narrativa y audio incompletos. No hay nuevos assets gráficos en esta intervención.
- Corredor fijo y cadencia fija del generador: equilibrio pendiente. El campo `difficulty.spawnInterval` es metadata y aún no gobierna los tiempos reales; no declarar escalado de cadencia implementado.
- Pruebas físicas Safari/iPhone, WKWebView, FPS, memoria y GC: no realizadas.
- `USE_ENGINE_V1 = false`. Main, PR #3 y guardia de despliegue sin cambios. No despliegues públicos.

### Instrucciones exactas para la siguiente sesión

1. Leer este archivo, `docs/CODEX_NEXT_ORDERS.md` y `docs/continuity-100/BLOQUE_02_WIP.md`.
2. Comprobar `git status --short --branch`; conservar cualquier trabajo local antes de sincronizar. No ejecutar `reset` ni `clean`.
3. En la rama autorizada, recuperar el commit WIP y ejecutar:

```sh
git fetch origin continuity-assets-audit-20261013
git switch continuity-assets-audit-20261013
git pull --ff-only origin continuity-assets-audit-20261013
npm ci
npm run build
node scripts/content-browser-smoke.cjs
```

El script requiere `require('playwright')` resoluble (versión usada 1.62.1) y Chromium; `CHROMIUM_PATH` permite indicar el ejecutable. En este entorno `/usr/bin/chromium`. El servidor es local; solicitar únicamente acceso de red local del sandbox cuando sea necesario. Conservar cualquier salida fallida antes de repetir.

4. Investigar errores reales y guardar código de salida, `results.json` y capturas. No interpretar salida vacía o interrupción como éxito.
5. Tras correcciones funcionales, ejecutar `node scripts/certify-local.mjs docs/continuity-100/evidence/block-02/certification/run-02` (usar un directorio nuevo si existe). Registrar todo.
6. Solo al cerrar Bloque 02, actualizar estado y continuar Bloque 03 según la auditoría conservada. No activar Engine V1, modificar main/PR #3 ni desplegar.

---

## Registro histórico de coordinación KOO (conservado)

**Fecha de revisión KOO:** 2026-10-13
**Rama autorizada:** `continuity-assets-audit-20261013`
**Referencia de recuperación:** `docs/continuity-100/BLOQUE_01_RECUPERACION.md`

## Diagnóstico verificado mediante lectura del repositorio
- Se detectó un bloque posterior al commit `67430b53a9121d27fbcd312628424f57ac88efa5`, con correcciones de restauración legacy, actualización de pruebas, sincronización CSS, arte nativo y guardia de despliegue.
- Codex registró evidencias de **40/40 engine**, **9/9 content**, **6/6 architecture**, **13/13 static**, **33/33 global**, **13/13 web**, build aprobado e inventario con **0 inconsistencias**. Estas cifras se obtienen de archivos de evidencia subidos al repositorio; KOO no ha ejecutado localmente esas suites en esta revisión.
- Arte nativo nuevo: icono y splash iOS, con fuentes en `art-source/native/` y exportaciones en `ios/App/App/Assets.xcassets/`.
- `src/game/animation/animation-map.js` ahora referencia fotogramas existentes; animaciones específicas de aparición/disparo de enemigos siguen pendientes.
- El generador de 100 niveles y los diálogos N-7 continúan siendo estructuras aisladas, no una campaña integrada.
- Safari físico, WKWebView, FPS/GC y experiencia táctil siguen sin certificación.
- No consta un despliegue público autorizado. Conservar el bloqueo de despliegue.

## Orden operativa vigente
Leer `docs/CODEX_NEXT_ORDERS.md` antes del siguiente bloque. Ejecutar de forma autónoma dentro de la rama, con diagnóstico previo, pruebas posteriores, commits y evidencias. No solicitar autorización rutinaria; sí respetar límites de seguridad.

## Protocolo de actualización
Después de **cada bloque** reemplazar/actualizar este archivo con:
1. SHA de inicio y SHA final, fecha y alcance.
2. Diagnóstico previo y riesgos.
3. Archivos modificados y funcionalidades reales.
4. Assets creados con rutas, dimensiones, procedencia y licencias.
5. Pruebas ejecutadas con comandos, conteos, Exit Codes y rutas de logs.
6. Problemas corregidos, pendientes y pruebas físicas no realizadas.
7. Siguiente bloque autónomo y criterios de aceptación.

Mantener el historial técnico detallado en `docs/continuity-100/` y no borrar las evidencias anteriores.

---

## Actualización KOO — selector Clásico/N-7 y prueba Netlify (14/10/2026)

**Alcance:** solo infraestructura de preview; el motor y la campaña legacy no se han modificado. No se realizó despliegue desde ChatGPT.

**Archivos nuevos:** `preview/launcher.html`, `scripts/build-preview.mjs`, `scripts/netlify-preview-gate.mjs`, `tests/preview-build.test.mjs` y `docs/NETLIFY_PRUEBA_N7.md`. **Archivos ajustados:** `package.json`, `netlify.toml`, `.gitignore`.

**Flujo implementado:** `npm run build:preview` construye primero desde las fuentes originales y después produce `preview-dist/index.html` (selector) y `preview-dist/juego/` (compilación web completa). El directorio generado no se versiona; el modo N-7 sigue entrando mediante `?campaign=n7` y el clásico sin parámetro. Los guardados continúan separados. El sitio web ordinario sigue publicándose desde `www` fuera de esta rama.

**Protección Netlify:** esta rama continúa sin desplegarse salvo que el propietario configure explícitamente `NEON_PREVIEW_DEPLOY=1` y habilite la rama en Netlify. La build de prueba usa `preview-dist`; las vistas previas de la PR #3 no se modifican.

**Pruebas ejecutadas localmente sobre el empaquetado recuperado:** `node --test tests/preview-build.test.mjs` **4/4 aprobadas**, `node tests/run-static-tests.mjs` **13/13 aprobadas**, sintaxis JS y TOML válidos, ZIP manual de 90 entradas íntegro. **Limitación:** aquí no se pudo repetir `npm ci && npm run build:preview` contra el HEAD remoto, ni certificar la experiencia Chromium/Safari/iPhone; Netlify debe construir con dependencias completas y el usuario realizará las pruebas del dispositivo. No declarar el Bloque 02 certificado por esta actuación.

**Siguiente acción:** el propietario habilita la preview de esta rama en Netlify según `docs/NETLIFY_PRUEBA_N7.md`, comparte la URL real obtenida y aporta incidencias/capturas. Priorizar corregir defectos de navegador antes de comenzar nuevas fases visuales.
## Operación Immersive Rebirth — primer corte de Gaia, 17/10/2026 UTC

El commit funcional `58c6c6785a4186978449a7a9636ccecab465e780` está publicado en `continuity-assets-audit-20261013`. Gaia clásica ahora despliega CH-01 con atlas real, deriva, ataque señalado, reacción al daño, patrullas espaciadas y primer aviso contextual de Atlas. La certificación final pasó 11/11 fases, Chromium controlado Gaia 7/7 y smoke Chromium de ambas campañas 2/2; preview 15/15. [Informe completo](immersive-rebirth/reports/ENTREGA_A_2026-10-17.md) y [estado maestro](immersive-rebirth/IMMERSIVE_LATEST_REPORT.md). No se creó arte nuevo en este corte; se reutilizaron recursos originales existentes. Entrega A sigue **EN CURSO**: 0/10 niveles visualmente completos, CH-02/03, capas de Chronos/Gaia, audio propio, balance largo e iPhone pendientes. No hay URL Netlify nueva. `USE_ENGINE_V1=false`; main y PR #3 sin cambios. El problema intermitente de glifos HUD nivel 10 sigue abierto. La documentación y evidencia de este corte se publican en commit separado.

---
