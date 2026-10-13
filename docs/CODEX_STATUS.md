# NEON CATCHER — Estado compartido Codex / KOO

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
