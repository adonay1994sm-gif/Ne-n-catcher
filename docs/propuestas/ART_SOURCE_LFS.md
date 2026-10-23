# PROPUESTA · Sacar `art-source/` a Git LFS o a almacenamiento externo

> Estado: **PROPUESTA**. No ejecutar sin decisión del propietario.

## Situación (19/10/2026)

- `art-source/`: **351 archivos, ≈ 179 MB** versionados (180 PNG, 40 WAV,
  51 JSON, más JPG/WebP y scripts de generación).
- Los más pesados: `audio/chapter1-score/chapter1_voyage_score_v1.wav`
  (12,7 MB), `chapter1_opening_score_v1.wav` (7,4 MB), másteres PNG de 3–4 MB.
- No se publican: ni la web (`www/`) ni iOS los incluyen.
- **Sí los leen pruebas**: `tests/run-tests.mjs`, `ch01-animation`,
  `ch02-animation`, `visual-artpass`, `gaia-pulse-v3`,
  `guardian-atlas-animation`, `arcade-pulse-rendering`, `combat-sfx`,
  `repository-hygiene` y `scripts/repository-hygiene.mjs` (comprueban
  procedencia y hashes de los másteres).

## Opciones

### A. Git LFS (recomendada si se quieren mantener en GitHub)
- **Ventajas:** los clones normales bajan solo punteros; el historial nuevo
  no crece con cada versión de un máster; mismas rutas, así que las pruebas
  siguen funcionando tras `git lfs pull`.
- **Riesgos:** cuota gratuita de LFS de GitHub limitada (almacenamiento y
  ancho de banda); CI y cada agente necesitan `git lfs` instalado; **el
  historial antiguo sigue pesando** salvo que se reescriba (ver
  `HISTORIAL_GIT.md`).
- **Pasos:** 1) `git lfs install`; 2) `git lfs track "art-source/**/*.png" "art-source/**/*.wav" "art-source/**/*.jpg" "art-source/**/*.jpeg" "art-source/**/*.webp"`;
  3) commit de `.gitattributes`; 4) `git add --renormalize art-source` y
  commit; 5) añadir `lfs: true` al checkout del workflow de `.github/`;
  6) ejecutar todas las suites.

### B. Almacenamiento externo (Drive, S3, etc.)
- **Ventajas:** el repositorio adelgaza de verdad para el día a día.
- **Riesgos:** las pruebas que leen `art-source/` fallarían o habría que
  marcarlas como opcionales; se pierde la trazabilidad directa
  máster ↔ commit; posible coste.
- **Pasos:** copiar con manifiesto de hashes, sustituir por un
  `art-source/MANIFEST.json`, adaptar pruebas a "si existe", documentar la
  descarga.

### C. No hacer nada
- Funciona. El coste es solo de tamaño de clon (≈ 700 MB de pack en total).
