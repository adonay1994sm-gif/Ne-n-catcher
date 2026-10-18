# Probar NEON CRONIUM en Netlify aislado

Estado comprobado18/10/2026: existe configuración de preview en `netlify.toml` y `scripts/netlify-preview-gate.mjs`. No se encontró CLI Netlify en PATH ni `node_modules/.bin`, token de autenticación o SiteID en el entorno, enlace `.netlify/state.json` ni configuración habitual de usuario. Sólo se comprobaron presencia/ausencia; no se copiaron credenciales. **No se ha conectado ni desplegado ningún sitio Netlify en este lote.**

La compilación de prueba usa la misma línea del juego, una entrada principal y guardado con prefijo `neon-preview-v1:`. El arte, código y campañas recuperables proceden del repositorio actual; un paquete debe indicar el SHA limpio realmente construido. Las copias `www/`/iOS son salidas generadas, no fuentes alternativas.

## Opción inmediata: paquete ya construido

1. Usar el ZIP y SHA-256 del último informe de producción, con SHA funcional y estado limpio. Si se genera otro, ejecutar en checkout congelado `npm run build:preview`, `npm run test:preview` y las regresiones aplicables. El contenido publicable está en `preview-dist/`, no en la raíz completa del repositorio.
2. Crear en Netlify **un sitio nuevo exclusivamente de pruebas**, con nombre distinto y destino identificable. No seleccionar el sitio principal ni reutilizar su SiteID. El ZIP debe descomprimirse para que `index.html`, `build-info.json`, `_headers` y la carpeta `juego/` estén en la raíz de la carpeta subida.
3. Subir esa carpeta al sitio de pruebas. No introducir el token en código o documentación. El sitio aislado sirve para QA; no certifica publicación comercial, AppStore o Safari físico.
4. Abrir la URL que Netlify devuelva realmente. Revisar `build-info.json`, SHA/revisión, recursos200, iniciar partida, abrir C9, probar disparo/pausa, recargar y verificar el guardado aislado. Registrar URL, ID de despliegue, SHA y fecha sólo después de comprobarlos.

No se indica una URL hipotética. El sitio privado existente conserva su identidad y no demuestra que Netlify sirva la misma revisión.

## Actualización automática desde Git: sólo branch-deploy

La configuración actual autoriza exclusivamente:

| Campo | Valor permitido |
| --- | --- |
| Repositorio | `adonay1994sm-gif/Ne-n-catcher` |
| Rama de pruebas | `continuity-assets-audit-20261013` |
| Contexto Netlify | `branch-deploy` |
| Opt-in del sitio de pruebas para esa rama | `NEON_PREVIEW_DEPLOY=1` |
| Directorio de publicación | `preview-dist` |
| Node | `22.13.0` |

Antes de conectar Git, confirmar que el SiteID pertenece al sitio de pruebas y configurar su despliegue de rama sin activar builds del sitio principal. No habilitar automáticamente `main`, PRs o todos los branches. No abrir un asistente que vaya a publicar inmediatamente otra rama antes de revisar esos ajustes.

El `command` de la rama ya exige la puerta, construye preview y ejecuta pruebas estáticas/preview. `--ignore` devuelve0para omitir y1para proceder, conforme al convenio de Netlify; `--require-enabled` devuelve0sólo cuando rama, contexto y opt-in coinciden. **No poner esta rama como rama de producción para sortear el bloqueo:** `CONTEXT=production` se rechaza deliberadamente incluso con el opt-in. Si la interfaz de Netlify sólo ofrece producción, usar la opción manual del sitio aislado o documentar que falta configurar branch-deploy; no debilitar la puerta.

Con permisos disponibles en una sesión futura, comprobar primero la identidad del sitio, audiencia y contexto. Después lanzar un branch-deploy, esperar finalización completa y comprobar contenido real en la URL devuelta. `netlify deploy --prod` y cualquier cambio del sitio principal quedan fuera de esta guía.

## Limpieza reproducible del repositorio

- Fuentes: `src/`; arte runtime: `assets/`; maestros: `art-source/`; instrucciones locales: `.agents/skills/`; tooling: `scripts/`; evidencia histórica: `docs/production-reports/` y `docs/visual-rebirth/`.
- Regenerar bundles raíz mediante `npm run build`; no editar copias de `www/` o iOS. `preview-dist/`, `node_modules/` y `.netlify/` son estado local y no deben versionarse.
- Ejecutar `node scripts/repository-hygiene.mjs --duplicates --output /tmp/neon-hygiene-nuevo.json` para obtener inventario sin borrados. El informe debe usar una ruta nueva.
- La limpieza autorizada de28copias generadas es retirar del índice sus rutas exactas con `git rm --cached -- <rutas-revisadas>`, preservando disco, fuentes e historial. El integrador registra su lista y verifica que `npm run build` vuelve a producirlas. No ejecutar `git clean`, borrados masivos, reset o reescritura histórica.
- Los paquetes y capturas anteriores son evidencia y pueden seguir siendo útiles aunque pesen. Archivos idénticos en distintos informes no son necesariamente descartables: sus enlaces prueban condiciones y fallos diferentes. Optimizar la producción futura con logs, capturas necesarias y ZIP fuera del árbol cuando exista respaldo; no fingir que el histórico desapareció.
