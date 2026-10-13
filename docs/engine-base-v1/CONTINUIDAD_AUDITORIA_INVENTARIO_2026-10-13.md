# NEON CATCHER — continuidad segura del inventario (13-10-2026)

## Aislamiento
Rama: `continuity-assets-audit-20261013`, creada desde `ca5f974f508b18b50d2faeafcdc5a5a00c1331fb`.
La rama `production-100-development` permanece sin cambios por esta intervención para permitir que Codex recupere y publique su trabajo local basado en `79597e1f699a3e730e317e2e2b6f179dccca480a`.
No modificar `main` ni fusionar PR #3.

## Trabajo nuevo
`scripts/audit-asset-inventory.mjs` es una comprobación de solo lectura, independiente de las suites existentes. Separa los 58 recursos de ejecución de dos archivos conservados. Declara hashes SHA-256 explícitos para `assets/.gitkeep` y `assets/comet_fire.webp`. Comprueba cantidad, bytes, rutas duplicadas, solapamientos, ausencias, archivos desconocidos y hashes.

Comandos previstos desde un checkout completo de esta rama:

```sh
node scripts/audit-asset-inventory.mjs --self-test
node scripts/audit-asset-inventory.mjs
```

El primer comando incluye seis escenarios deterministas: inventario válido, archivo activo ausente, archivo desconocido, ruta duplicada, tamaño erróneo y solapamiento. El segundo audita archivos reales y devuelve 1 ante incidencias.

**Estado de verificación:** el archivo se ha creado en GitHub. No se han ejecutado todavía estos comandos sobre un checkout completo de la rama. No se declara la suite global superada. Las suites `tests/run-static-tests.mjs` y `tests/run-tests.mjs` aún contienen el criterio antiguo de igualdad directa con 58 entradas; su corrección e integración están pendientes de prueba y revisión.

## Otros bloqueos conocidos
- Nebulosas: parche documentado por Codex, no aplicado; `game.js` difiere de la concatenación fuente en 21 líneas.
- Recursos iOS: icono y tres splash ausentes según auditoría local comunicada por Codex.
- Arte maestro: fuente del cometa corrupta y fuente de CRONIUM ausente según Codex.
- RAF legacy: parada propuesta pero no aplicada.
- Safari iPhone, memoria, GC y FPS sostenidos: sin certificar.

## Reconciliación con Codex
1. Recuperar `79597e1f` y cualquier commit posterior del entorno Codex antes de integrar esta rama.
2. Comparar diffs para evitar sobrescribir sus pruebas o documentos.
3. Ejecutar el auditor nuevo en checkout completo y comprobar sus resultados.
4. Integrar el criterio compartido en las dos suites solo después de verificarlo; no relajar aserciones ni eliminar archivos.
5. Mantener `main` y PR #3 protegidas hasta autorización expresa.

## Organigrama
```text
NEON CATCHER
├── [GITHUB / RAMA AISLADA] Auditor de inventario creado
├── [PENDIENTE] Ejecutar auditor y pruebas negativas
├── [PENDIENTE] Integrar auditor en suites globales
├── [LOCAL CODEX] Motor V1 y 27 pruebas según informe
├── [PENDIENTE] Recuperar commits locales Codex
├── [PROPUESTO] Restauración nebulosas
├── [PENDIENTE] Recursos iOS y arte maestro
├── [NO APLICADO] Parada RAF legacy
├── [PENDIENTE] Safari iPhone físico
└── [PROTEGIDOS] main, campaña y merge PR #3
```
