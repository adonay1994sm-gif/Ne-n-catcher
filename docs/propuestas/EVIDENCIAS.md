# PROPUESTA · Reducir `docs/production-reports/evidence/`

> Estado: **PROPUESTA**. No ejecutar sin decisión del propietario.
> `AGENTS.md` pide "sin purga masiva de evidencia": cualquier reducción
> debe conservar la posibilidad de recuperar todo.

## Situación (19/10/2026)

- **3.005 archivos versionados, ≈ 304 MB**: 1.499 PNG (≈ 20 MB),
  798 TXT, 458 JSON, 19 ZIP (**≈ 134 MB**, el grueso), 76 LOG.
- **118 copias de scripts de prueba** (`.cjs`/`.mjs`, ≈ 2,7 MB): 56 se llaman
  `qa-script-used.cjs` y 43 `used-harness.cjs`. Solo hay **94 contenidos
  distintos**: unas 24 son duplicados exactos.
- Las usan: `tests/repository-hygiene.test.mjs`,
  `scripts/repository-hygiene.mjs` y varios smokes que **escriben** nueva
  evidencia ahí.

## Opciones

1. **Deduplicar scripts (bajo riesgo).** Guardar cada script una vez en
   `evidence/_scripts/<sha256>.cjs` y dejar en cada carpeta un `.json` con el
   hash. Ahorro pequeño (≈ 0,5 MB), gana orden.
   - Riesgo: informes que enlazan la ruta antigua; hay que reescribir enlaces.
2. **Sacar los ZIP a una Release de GitHub o a LFS (mayor ahorro).**
   Los 19 ZIP son paquetes de compilaciones antiguas. Subirlos como adjuntos
   de una Release etiquetada y dejar en su lugar un `.json` con nombre,
   tamaño, SHA-256 y enlace.
   - Riesgo: dependencia de GitHub para recuperarlos; el historial sigue
     pesando sin reescritura.
3. **Política para el futuro:** los smokes nuevos guardan solo resumen JSON +
   capturas clave; scripts por hash, no copia completa.

## Pasos sugeridos (opción 2 + 3)
1. Inventario con `npm run audit:repository` (solo lectura).
2. Crear Release `evidencia-historica-2026-10`, subir ZIP, comprobar hashes.
3. `git mv` no sirve aquí: sustituir cada ZIP por su `.json` en un commit
   dedicado y revisable.
4. Ejecutar `tests/repository-hygiene.test.mjs` y ajustar si comprueba esos ZIP.
