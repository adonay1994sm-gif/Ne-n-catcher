## Ejecución autorizada del plan de publicación ·17/10/2026

El propietario acepta ejecutar las metas de la [auditoría de publicación](docs/production-reports/AUDITORIA_PUBLICACION_NEON_CRONIUM_2026-10-17.md). Cerrar incrementos integrados y comprobables antes de expandir: primero Chronos–Gaia/Atlas, presentación de C9, audio contextual, accesibilidad y persistencia ante interrupciones. Las metas de contenido, pruebas humanas, dispositivos y distribución no se consideran terminadas por aprobar el plan. Motor V1 reservado/desactivado; historial y límites siguientes vigentes.

---

## Nombre vigente — NEON CRONIUM, 17/10/2026

El propietario cambia el nombre del juego a **NEON CRONIUM**. Aplicarlo en pantallas, metadatos, guías activas y nuevos paquetes. Conservar por compatibilidad las claves de guardado, el bundle ID `com.adonay.neoncatcher`, IDs de campaña y URL del repositorio/sitio existentes; no representan la marca visible. Las evidencias, maestros previos y paquetes históricos conservan su procedencia y sus hashes. No renombrar un paquete antiguo como si fuera una nueva compilación. Leer el cierre de rebranding en docs/production-reports/REBRAND_NEON_CRONIUM_2026-10-17.md. Las diez etapas y las restricciones de motor/ramas siguen vigentes.

---

## Orden vigente — diez etapas Chronos → Gaia, 17/10/2026

El propietario reanuda el desarrollo y pide diez niveles para representar la transición espacial de Chronos a Gaia. Implementación de trabajo: etapas 1.1–1.10 del primer territorio clásico; no sustituir los otros nueve territorios ni confundirlas con diez mundos o cien rutas N-7. Priorizar salida física, espacio abierto, viaje continuo y aproximación; C9 es una parada enlazada y el guardado se realiza por entrada de etapa con clave v2 propia. La pausa anterior de funcionalidades queda levantada para este alcance. Conservar identidad modular, dos dedos, recursos y límites siguientes; Motor V1 sigue desactivado.

---

## Decisión vigente — nave única y dos dedos, 17/10/2026

El propietario fija la nave modular actual como identidad de esta versión. Retirar la ilustración antigua de portada, selector y juego; conservar archivos y guardados recuperables. Pilotaje y disparo deben funcionar simultáneamente con dos contactos independientes; mantener DISPARAR reutiliza el RAF existente y respeta batería/cadencia. Mejorar el cometa con arte y trayectoria coherentes. La aceptación de esta base no equivale a certificación física ni autoriza distribución comercial; MotorV1 continúa apagado.

---

## Última aclaración — destrucción de Chronos, 17/10/2026

Las siete ilustraciones entregadas por el propietario describen **un acontecimiento dentro del nivel clásico 1**, no siete niveles ni el viaje completo. Conservar los diez niveles. Integración actual: seis estados estructurales ilustrados, onda de 7,2 s y restos persistentes mediante el reloj de ruta; leer [cierre Chronos](docs/production-reports/CHRONOS_DESTRUCTION_2026-10-17.md). No sustituirlo por una presentación de fondos completos ni declarar cerrado el nivel. Arte y dispositivo pendientes; Motor V1 = false y las restricciones siguientes siguen vigentes.

---

## Orden vigente — referencias y Guardian Atlas,17/10/2026

El propietario ha autorizado diseñar la campaña espacial de cien etapas y producir arte a partir de sus referencias. Diseñar no equivale a implementar. Cerrar primero un combate natural del clásico: recuperar CRONIUM en Gaia→Atlas animado→permiso/recompensa. No sustituirlo por la demo corta. Leer docs/production-reports/GUARDIAN_ATLAS_2026-10-17.md y docs/design/CAMPAIGN_100_STAGES.md. Arte pendiente de aceptación; Motor V1 false. Las restricciones siguientes siguen vigentes; la antigua prohibición de diseñar cien etapas queda sustituida por esta orden.

---

## Prioridad posterior a revisión del propietario — 17/10/2026

Se rechazaron la integración visual y el ritmo comprimido. Priorizar el juego clásico, sus diez niveles, nave modular coherente y jugabilidad natural. La demo P1 anterior es recuperable, no una dirección artística aprobada. No expandir cien etapas antes de cerrar el flujo del clásico. Leer docs/production-reports/NAVES_MODULARES_2026-10-17.md. Los límites técnicos y de conservación siguientes continúan vigentes.

---

Historial conservado a continuación; las instrucciones incompatibles quedan sustituidas por este cierre.

# NEON CRONIUM — Guía de trabajo

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
