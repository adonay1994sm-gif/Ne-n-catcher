# Probar NEON CRONIUM en Netlify aislado

## Sitio de pruebas del propietario: neon-preview-deploy

**Identidad vigente confirmada en la última captura del propietario: `neon-preview-deploy`, con guiones.** La corrección82c y su cierre9f94 habían quedado vinculados al nombre sin guiones `neonpreviewdeploy`; la ejecución82c que aparece en la captura falla al no coincidir esa identidad. Se corrige sólo el destino permitido y se añaden rechazos del nombre anterior y de identidades mezcladas.

El propietario ha conectado un proyecto nuevo, **`neon-preview-deploy`**, a `continuity-assets-audit-20261013`. Su captura del18/10/2026 confirma el fallo de `scripts/netlify-preview-gate.mjs --require-enabled`: Netlify llama **Production** al despliegue principal de este proyecto separado; la puerta anterior sólo admitía branch-deploy/local. El propietario confirma `NEON_PREVIEW_DEPLOY=1` en Production. El fallo ocurre antes de compilar el juego.

La corrección admite ese contexto exclusivamente si coinciden todos estos datos:

| Dato | Valor requerido |
| --- | --- |
| Rama | `continuity-assets-audit-20261013` |
| Opt-in | `NEON_PREVIEW_DEPLOY=1` en el contexto que se construye |
| Marca del proveedor | `NETLIFY=true` |
| Proyecto | `SITE_NAME=neon-preview-deploy` |
| URL principal del proyecto | HTTPS, host exacto `neon-preview-deploy.netlify.app`, sin credenciales ni puerto distinto del estándar |
| Contexto | `production` exclusivamente para ese proyecto; branch-deploy/local conservan su contrato anterior |

`NETLIFY`, `SITE_NAME` y `URL` los proporciona Netlify; **no son variables que haya que inventar o sobrescribir manualmente**. La URL anterior define la identidad permitida, no afirma que ya exista una publicación accesible. Verificar una publicación exige HTTP real y `build-info.json` del SHA esperado.

En este proyecto de pruebas la rama principal del proyecto puede ser la rama autorizada, sin fusionarla con `main` de GitHub. El sitio original `neoncatcheroriginal`, otros dominios/proyectos, `main` y las PR no quedan autorizados para producción por esta excepción. La prohibición de publicar el juego comercial o modificar su sitio principal sigue vigente.

## Configuración que debe conservarse en el proyecto nuevo

1. Repositorio `adonay1994sm-gif/Ne-n-catcher`; rama del proyecto de pruebas `continuity-assets-audit-20261013`.
2. Variable `NEON_PREVIEW_DEPLOY` con valor `1`, disponible para **Production de neon-preview-deploy**. Una variable limitada a Branch deploys no llega a ese contexto.
3. Usar la configuración de `netlify.toml`: Node22.13, puerta de seguridad, `npm run build:preview`, pruebas estáticas/preview y carpeta `preview-dist`. La captura del fallo confirma que Netlify ya selecciona ese comando desde el TOML; no hace falta sustituir la configuración global.
4. Tras recibir el commit corregido, el enlace Git puede arrancar el build. Si se reintenta desde el panel, elegir el **último commit de esta rama**, no repetir el SHA8c5b44e que contiene la puerta anterior.
5. Esperar publicación completa; abrir la URL que muestre Netlify, comprobar `build-info.json` con SHA/revisión/dirtyfalse/MotorV1false, recursos200, inicio, C9, disparo, pausa y guardado. Registrar el resultado real; un build local o GitHub Actions verde no certifica Netlify.

No tocar ajustes del proyecto original ni PR3/main para conseguir esta preview. Sin acceso autenticado al panel desde la sesión, los cambios de variables del proyecto pertenecen al propietario; GitHub, pruebas locales y HTTP público sí se pueden comprobar desde Codex.

## Alternativa: branch deploy

La configuración anterior sigue disponible: habilitar exclusivamente la rama autorizada en Branch deploys y definir `NEON_PREVIEW_DEPLOY=1` para ese contexto. No seleccionarla como producción de un destino desconocido para saltar la puerta. `--ignore` usa el convenio Netlify:0omite,1continúa; `--require-enabled`:0autoriza,1rechaza. Los errores ahora distinguen falta de opt-in, rama y contexto/identidad.

## Paquete manual y limpieza

El ZIP limpio da3 del informe [LEVEL_ONE_DYNAMIC](../production-reports/LEVEL_ONE_DYNAMIC_2026-10-18.md) sigue siendo una versión jugable verificada. Descomprimir el contenido para que `index.html`, `build-info.json`, `_headers` y `juego/` estén en la raíz que se sube al sitio de pruebas. Un nuevo build tiene su propio SHA y no debe atribuirse al paquete anterior.

Fuentes en `src/`, recursos en `assets/`, maestros en `art-source/` y evidencia en `docs/production-reports/`. Regenerar con el pipeline, no editar copias web/iOS. `preview-dist/`, `node_modules/` y `.netlify/` no se versionan; `npm run audit:repository` sólo inventaría. Se conservaron28copias generadas en disco e historial al retirarlas del índice. No purgar recursos, maestros, pruebas ni guardados.

## Historial y alcance comprobado

GitHub ya estaba conectado a Netlify: el sitio principal publica archivos coincidentes con `main` y la previewPR3 corresponde a `production-100-development`. La falta de acceso autenticado de Codex no significaba falta de conexión del propietario. La excepción nueva corrige el proyecto de pruebas identificado por sus capturas. [Informe de corrección](../production-reports/NETLIFY_ISOLATED_PREVIEW_FIX_2026-10-18.md) distingue pruebas de puerta, CI y publicación realmente observada.
