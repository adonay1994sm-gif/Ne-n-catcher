# NEON CATCHER — Guía de trabajo

## Referencia vigente

Leer [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md): mandato rector v1.0 del 17/10/2026. Prevalece sobre directrices creativas anteriores incompatibles. Objetivo: aventura arcade espacial canónica, **10 capítulos × 10 etapas**, con recorrido visible, combate, piezas y estaciones. Clásico y N-7 se conservan; N-7 no se convierte por numeración en la campaña nueva. Los informes anteriores son historial/evidencia, no órdenes para repetir tareas terminadas.

Antes de editar: verificar árbol/HEAD/remoto, últimos `CODEX_STATUS`, `CODEX_NEXT_ORDERS`, `PRODUCTION_LATEST_REPORT` y `production-tasks.json`; preservar aportaciones ajenas. Registrar diagnóstico breve y construir un incremento jugable. P1 es salida Chronos → tránsito → frontera con pieza recuperable, parada, mejora visible y partida completa; no producir cien etapas antes de revisar esta experiencia.

## Límites y conservación

- Integrar y publicar solamente en `continuity-assets-audit-20261013`. No modificar `main`, ni modificar/fusionar PR #3, ni force push, ni descartar trabajo válido.
- **`USE_ENGINE_V1 = false`**. No activar/migrar/reemplazar/fusionar motores sin orden técnica del propietario. Conservar módulos del motor experimental y un único propietario de RAF en la campaña; no otro motor paralelo.
- Preservar campañas y guardados existentes. Nueva campaña con claves/versiones propias y migraciones idempotentes con respaldo; sin equivalencias numéricas inventadas.
- No producción, App Store, TestFlight, pagos/anuncios reales, compras, nuevas APIs facturables o secretos en repositorio/evidencias. Preview aislada solo con acceso/destino de pruebas autorizados y revisión/URL verificadas.
- Desarrollo reversible, pruebas, assets, commits y push de la rama están autorizados sin aprobaciones rutinarias. Aceptación estética y decisión del motor corresponden al propietario; continuar tareas independientes mientras estén pendientes.

## Fuentes, arte e integración

- Modificar `src/game/00-...08-...`, módulos de `src/` y fuentes correspondientes; regenerar bundles con scripts existentes. No parches exclusivos en `game.js`, `core-runtime.js`, `content-runtime.js` o copias `www/` / `ios/App/App/public/`.
- Inspeccionar `package.json` y argumentos reales. `npm run build` compila core/content/puente y web/iOS; `npm run build:preview` crea paquete aislado. No crear otra arquitectura por comodidad.
- Arte real con maestro, procedencia, estados/animación, exportación optimizada, manifiesto/loader e integración comprobada. Primitivas secundarias son válidas; fixtures o una imagen girada no constituyen arte final. Hitboxes y claridad separadas del tamaño del arte.
- Una fuente de progreso de ruta gobierna paisaje, encuentros y HUD. Pausa/segundo plano detienen el recorrido. Mantener controles táctiles precisos, safe areas y carga/cache acotadas.

## Pruebas y entrega

Asignar propiedad de archivos entre agentes. **No compilar ni certificar mientras otro agente cambia esas fuentes**: congelar un snapshot o usar worktree controlado. Revisar e integrar cada contribución antes de darla por terminada.

Ejecutar suites pertinentes de build, motor, arquitectura, contenido, estáticas, regresión, preview e inventario; navegador real cuando disponible. Registrar comando/casos/salida/SHA/estado del árbol/evidencia. Probar partidas naturales además de escenas instrumentadas. No equiparar JSDOM/Chromium con iPhone físico ni build con despliegue.

`docs/production-tasks.json` es la fuente única de tareas; reconciliar historia mediante relaciones de sustitución, sin borrarla. Separar aceptación técnica, artística y física; DONE exige integración y pruebas pertinentes. Publicar hitos frecuentes y conservar WIP identificado antes del límite. Actualizar estado, siguientes órdenes e informe en `docs/production-reports/`; enlazar evidencia, capturas y SHA comprobables. No prometer ejecución fuera de una sesión activa.
