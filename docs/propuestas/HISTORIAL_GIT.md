# PROPUESTA · Reescribir el historial de Git

> Estado: **PROPUESTA**. **No ejecutar** sin decisión expresa: es
> irreversible para quien ya tenga el repositorio clonado. `AGENTS.md` prohíbe
> force push salvo orden del propietario.

## Por qué se plantea

- El pack de Git ocupa **≈ 694 MB**. Aunque se saquen `art-source/` o los ZIP
  de evidencia (ver `ART_SOURCE_LFS.md`, `EVIDENCIAS.md`), **el historial
  conserva todas sus versiones** y el clon seguirá pesando igual.
- El repositorio es público: cualquier dato sensible que hubiera estado en
  algún commit sigue visible en el historial aunque se borre después.

## Qué se ha revisado aquí

- No se han encontrado claves ni IDs reales de AdMob en el código actual.
- **Sin comprobar** el historial completo: este entorno tiene un clon
  superficial (`--depth`). Antes de decidir, conviene un escaneo completo
  (por ejemplo, secret scanning de GitHub o `gitleaks` sobre un clon completo).

## Opciones

1. **No reescribir (recomendado salvo que aparezca un secreto).** Usar LFS y
   Releases para lo nuevo; aceptar el peso del historial.
2. **Reescribir con `git filter-repo`** para quitar `art-source/` antiguo,
   ZIP de evidencia y `Neon_Cronium_V6_8_0_Netlify_Directo.zip`.
   - Ventajas: clon mucho más ligero; elimina datos del historial.
   - Riesgos: cambian **todos** los SHA (los informes citan SHA concretos
     como evidencia: quedarían rotos); hay que hacer force push a todas las
     ramas, incluidas `main` y la de integración; PR abiertos (#3) se rompen;
     cada copia local debe re-clonarse; las copias antiguas en forks o
     cachés siguen existiendo.
3. **Empezar un repositorio nuevo limpio** para la versión de tienda y
   archivar el actual como histórico. Mismo resultado sin forzar a nadie.

## Pasos si se aprueba la opción 2
1. Copia de seguridad completa (`git clone --mirror`).
2. Escaneo de secretos sobre el espejo.
3. `git filter-repo --path art-source/ --path-glob '*.zip' --invert-paths`
   (ajustar lista) en el espejo.
4. Verificar build y pruebas en la rama de integración reescrita.
5. Coordinar ventana, cerrar/rehacer PR, force push y avisar a colaboradores.
6. Pedir a GitHub soporte limpiar referencias cacheadas si hubiera secretos.
