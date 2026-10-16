> Estado vigente 2026-10-16: leer `PRODUCTION_MASTER_CHECKLIST.md`, la cabecera de `CODEX_STATUS.md` y `production-reports/BLOQUE_03_2026-10-16.md`. Chromium sobre preview-dist y SW offline reales ya pasaron; integrar y comprobar CH-01 en el combate, reconstruir y volver a probar la preview. Netlify aislado e iPhone físico siguen pendientes. Producción y PR #3 siguen protegidas. No reimportar Art Pass A: ya está integrado en f5b486c.

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
