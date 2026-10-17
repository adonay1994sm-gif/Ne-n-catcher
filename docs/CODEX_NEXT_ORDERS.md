## Orden vigente — mandato rector espacial, 17/10/2026

1. Comprobar remoto y leer [PRODUCT_VISION.md](PRODUCT_VISION.md) y [P0–P1 Chronos-Gaia](production-reports/P0_P1_CHRONOS_GAIA_2026-10-17.md). No reconstruir lo ya integrado ni convertir rutas N-7 en etapas canónicas por numeración. Conservar clásica/N-7, maestros y evidencias.
2. Probar la demo `juego/index.html?campaign=journey` del paquete con build-info limpio. Revisión estética del propietario y decisión del motor siguen reservadas; no activar V1. No expandir masivamente antes de esas puertas.
3. Tareas independientes desbloqueadas: QA 320×568/horizontal, partida natural con auto desactivado, interrupciones/checkpoints en dispositivo, opciones de reducción de destellos/sacudidas y arte específico de estación/Mira. El bucle básico y la pieza están integrados; no duplicarlos.
4. Netlify: usar únicamente sitio experimental inequívoco y acceso autorizado; comprobar URL/SHA/entradas. Sin credenciales no declarar despliegue. iPhone físico y el bug histórico de glifos nivel 10 siguen pendientes.
5. Mantener `production-tasks.json` como fuente, aceptaciones técnica/artística/física separadas y relaciones históricas explícitas. Congelar fuentes al certificar. Commit/push normales y evidencia después de cada corte. Las órdenes anteriores siguientes son historial cuando contradigan esta visión.

---

# Orden vigente 17/10/2026 — producción visual clásica

1. Verificar rama `continuity-assets-audit-20261013`, SHA remoto, árbol de trabajo e informe [INFORME_FINAL_10_NIVELES.md](visual-rebirth/INFORME_FINAL_10_NIVELES.md). Código visual probado: `80540884b15c8936dbcea9f5131a142077b85a6e`; documentación posterior puede añadir un commit. No tocar main ni PR #3, no activar Engine V1.
2. Reproducir el fallo intermitente de glifos en capturas Chromium del HUD del nivel 10. El DOM conserva `DISPARAR`, `3/3` y ancho de botón; quitar `backdrop-filter` o usar renderizado por software no solucionó consistentemente el problema. Inspeccionar composición/pintado real en Safari iPhone antes de atribuir causa al producto. Evidencia en `visual-rebirth/evidence/gallery-10-*` y nota del informe.
3. Probar el ZIP experimental [neon-catcher-visual-preview-8054088.zip](visual-rebirth/evidence/neon-catcher-visual-preview-8054088.zip) en un sitio Netlify **aislado** mediante Drop o branch deploy autorizado; verificar URL, SHA `8054088`, selector y dos campañas. No presentar la vieja Drop como preview de este arte. Si se usa Netlify Drop, recordar que la URL puede caducar.
4. Continuar por lotes pequeños de arte **integrado**: primero capas/animaciones de Chronos/Gaia/Vulkar, CH-01 en Gaia clásica con comportamiento comprobado, después CH-02/CH-03 y Magma Serpent segmentada. Los fondos de niveles 2–10 son composiciones únicas en revisión, no cierres visuales; el nivel 1 conserva fondo anterior y onda nueva.
5. Tras cada lote: `npm run build`, `node scripts/certify-local.mjs <directorio-nuevo>`, `npm run build:preview && npm run test:preview`, Chromium sobre `preview-dist`, auditoría de inventario, actualizar organigrama/ledger/status, commit y push normales a la rama autorizada. No borrar evidencias históricas.

---

# Actualización 16/10/2026 — preview Netlify

La preview temporal `https://idyllic-custard-c8c391.netlify.app/` sirvió el build `5a2f916` y pasó Chromium remoto 2/2 en 390×844. Caduca aproximadamente a las 15:45 UTC del 16/10 si no se reclama. No interpretar el estado anterior de «sin URL» como vigente. Informe y ZIP: `docs/production-reports/NETLIFY_DROP_2026-10-16.md` y `docs/production-reports/evidence/netlify-drop-20261016/`. Próximo paso externo: publicar el ZIP en un sitio Netlify de prueba duradero bajo la cuenta del propietario o habilitar esta rama con `NEON_PREVIEW_DEPLOY=1`, verificar URL/SHA y probar Safari iPhone. No tocar main, PR #3, producción ni `USE_ENGINE_V1`.

> Estado vigente 2026-10-16: leer `PRODUCTION_LATEST_REPORT.md`, `PRODUCTION_MASTER_CHECKLIST.md` y la cabecera de `CODEX_STATUS.md`. CH-01 se integró en N-7 en `9d28569`, con Chromium 2/2 y offline 4/4; el escenario visual controlado pasó 4/4; falta combate natural; la actualización controlada del SW pasó 3/3 y consolidar la URL Netlify temporal en un sitio duradero. El ZIP experimental de SHA limpio está en `production-reports/evidence/block-03/`. iPhone físico sigue pendiente. Producción y PR #3 siguen protegidas. No reimportar Art Pass A: ya está integrado en f5b486c.

> **Actualización de continuidad 14/10/2026:** antes de seguir con arte o combate, leer el cierre actual en CODEX_STATUS.md. El smoke de `www` pasó 6/6; falta `preview-dist`, SW real y despliegue autenticado. El propietario pidió terminar y conservar esta sesión. No volver a presentar como locales los commits WIP que ya están en GitHub. Comandos exactos en `continuity-100/CIERRE_PREVIEW_20261014.md`.

# ORDEN DE DIRECCIÓN — CONTINUIDAD AUTÓNOMA DE CODEX
**Fecha:** 2026-10-13  
**Repositorio:** `adonay1994sm-gif/Ne-n-catcher`  
**Única rama de integración autorizada:** `continuity-assets-audit-20261013`  
**Estado de partida:** Bloque 01 documentado en `docs/continuity-100/BLOQUE_01_RECUPERACION.md`.

## Mandato y autonomía
Codex es responsable de implementar, crear assets, integrar, probar, corregir, documentar y publicar **commits de código** en la rama autorizada. **No necesita aprobación por cada paso** ni para cambios reversibles dentro del alcance. Continuar por bloques coherentes y verificables, sin detenerse a pedir órdenes rutinarias. Registrar decisiones, evidencias y SHA en `docs/CODEX_STATUS.md`. No inventar pruebas ni activos.

**Restricciones absolutas:** no modificar `main`, no modificar/mergear PR #3, no activar `USE_ENGINE_V1` (mantener `false`), no desplegar ni publicar el juego, no alterar cuentas o infraestructura externa, no hacer operaciones destructivas. Conservar la campaña legacy de diez niveles y los guardados hasta validar la migración. No crear un segundo RAF. Mantener la guardia de despliegue.

## Diagnóstico recibido (confirmar al empezar)
El Bloque 01 documenta: corrección de restauración legacy en CampaignAdapter; 40/40 engine, 9/9 content, 6/6 architecture, 13/13 static, 33/33 global, 13/13 web, build aprobado, 0 inconsistencias de inventario. Hay icono/splash nativos nuevos y mapa de animaciones reconciliado con recursos existentes. Son **resultados publicados por Codex**, no pruebas repetidas por KOO.

## BLOQUE 02 — Director de encuentros determinista, ejecutable y aislado
1. **Diagnóstico inicial:** inspeccionar `src/game/progression/sectors.js`, `generator.js`, módulos legacy 00–08, `src/engine/`, scripts de build, guardados, pruebas y manifest. Registrar SHA inicial y posibles cambios externos.
2. **Contrato procedural versionado:** definir `generatorVersion`, semilla y estructura serializable de encuentros con tiempos de aparición, carriles, tipos, objetivos y parámetros físicos. Garantizar que nivel 37 y cualquier otro producen exactamente la misma secuencia para una versión dada; evitar `Math.random` y `Date.now` en decisiones de oleadas.
3. **Seguridad jugable:** incorporar geometría real de la nave, ancho de colisión, corredores atravesables y ventanas de reacción; probar miles de seeds/niveles y casos extremos. No aceptar oleadas imposibles, amenazas inevitables ni solapamientos sin salida.
4. **Patrones reales:** implementar movimientos lineal, zigzag, perseguidor y tirador en módulos aislados, con telegráficos, límites de velocidad y proyectiles acotados. Integrar un director de encuentros al **mismo** RAF legacy mediante una modalidad de prueba separada; no cambiar por defecto la campaña estable ni sus claves de guardado.
5. **Prueba vertical:** hacer jugable un nivel procedural de prueba con objetivos, oleadas, daño, reintentos y finalización. Incluir controles táctiles y HUD existentes. No considerar los 100 niveles implementados por tener solo datos.
6. **Tests:** determinismo (incluyendo serialización), progresión monótona, límites de entidades, corredores, patrones, estados, reintento, pausa/reanudación y no-regresión legacy. Añadir tests a `test:content` u otro comando documentado; ejecutar suites completas y build.
7. **Evidencias:** conservar logs en `docs/continuity-100/evidence/block-02/`, informe `BLOQUE_02_*.md`, actualizar `docs/CODEX_STATUS.md` y realizar commits descriptivos.

## BLOQUE 03 — Producción gráfica y animación
1. Auditar `ASSET_MANIFEST.json`, `art-source/`, `assets/`, `src/game/animation/animation-map.js`, sprite sheets, VFX, dimensiones, alfa y orientación real de cada fotograma.
2. **Crear realmente** los recursos que falten, con herramienta de imagen si está disponible o pipeline alternativo; no limitarse a prompts. Exportar archivos finales comprimidos, guardar fuentes/procedencia/licencias y actualizar manifiestos/preload. Crear poses distintas (no clones reescalados) de enemigos: spawn, idle, desplazamiento, disparo, impacto y destrucción.
3. Implementar reproductor de animaciones por estados, temporización y transiciones, conectado a eventos del combate; integrar presets de chispas, captura y polvo estelar respetando el pool de 320 partículas y los límites de memoria.
4. Tests de referencias, tamaño/decodificación, ausencia de placeholders, secuencias y transiciones. Evidencias visuales reales (capturas si el entorno lo permite). No afirmar QA visual o iOS sin ejecución.

## BLOQUES 04–08 — Continuidad hasta campaña completa
- **04:** 10 jefes únicos (niveles 10,20,...,100), ataques por fases, invulnerabilidad temporal bien señalizada, daño, derrota y recompensas.
- **05:** historia completa de N-7 con arcos por sector, diálogos contextuales, escenas y final, integrada sin bloquear controles.
- **06:** música y SFX originales con derechos claros, carga y mezcla compatibles con Safari/iOS.
- **07:** completar y equilibrar **100 niveles jugables**, objetivos variados, identidad de sector, guardados/versionado y migración segura.
- **08:** pulido visual, rendimiento, QA, accesibilidad, pruebas físicas iOS/Capacitor, correcciones y certificación integral.

No hay fecha de lanzamiento. No publicar antes de completar y certificar contenido, narrativa, audio y animaciones.

## Protocolo obligatorio por bloque
**Diagnosticar → Planificar → Implementar → Generar assets → Integrar → Probar → Corregir → Documentar → Commit → Continuar.**
Registrar pruebas con comandos y resultados verificables. Si no hay simulador/iPhone, dejarlo pendiente explícitamente. Si surge una decisión de producto con impacto irreversible, documentar alternativas y solicitar autorización solo para ese caso.

**Empieza por Bloque 02 sin esperar aprobación adicional.**
## Continuación de Immersive Rebirth — 17/10/2026

1. Leer [informe parcial de Entrega A](immersive-rebirth/reports/ENTREGA_A_2026-10-17.md), verificar el SHA remoto y conservar evidencias. CH-01 ya funciona en Gaia clásica; no duplicar su integración.
2. Probar una partida natural larga del nivel 2 con derribo y destrucción de CH-01; comprobar cadencia, precisión táctil, daño/recompensa y máximo de entidades. Ajustar sólo con evidencia reproducible.
3. Producir e integrar CH-02 Interceptor y CH-03 Defense Satellite con arte/ataques distinguibles; después dar profundidad y eventos reales a Chronos/Gaia. El Nivel 1 necesita certificación natural del accidente a los 31 s. Mantener Engine V1 desactivado.
4. Repetir certificación y Chromium tras cada lote; mantener `production-tasks.json`, organigrama, capturas y reportes. El bug intermitente de glifos HUD nivel 10 sigue abierto. Netlify requiere credenciales de sitio experimental; Safari/iPhone físico sigue pendiente.

---
