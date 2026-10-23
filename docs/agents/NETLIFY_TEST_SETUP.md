# Probar NEON CRONIUM en Netlify aislado

## Sitio de pruebas del propietario: neon-preview-deploy

**Identidad vigente confirmada en la última captura del propietario: `neon-preview-deploy`, con guiones.** La corrección82c y su cierre9f94 habían quedado vinculados al nombre sin guiones `neonpreviewdeploy`; la ejecución82c que aparece en la captura falla al no coincidir esa identidad. Se corrige sólo el destino permitido y se añaden rechazos del nombre anterior y de identidades mezcladas.

El propietario ha conectado un proyecto nuevo, **`neon-preview-deploy`**, a `continuity-assets-audit-20261013`. Netlify llama **Production** al despliegue principal de este proyecto separado. Una ejecución posterior confirmó que la variable creada en la interfaz no llegaba al build y la puerta informó `Falta NEON_PREVIEW_DEPLOY=1`. Como el indicador no es secreto, queda definido exclusivamente en el bloque de entorno de esta rama dentro de `netlify.toml`; la identidad real del proyecto continúa validándose antes de compilar.

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

1. Repositorio `adonay1994sm-gif/neon-cronium`; rama del proyecto de pruebas `continuity-assets-audit-20261013`.
2. Conservar `[context.continuity-assets-audit-20261013.environment]` con `NEON_PREVIEW_DEPLOY="1"`. No copiarlo a `build.environment` ni a otros contextos. La variable de la interfaz deja de ser necesaria para esta rama y puede permanecer sin efecto o retirarse más adelante desde el panel.
3. Usar la configuración de `netlify.toml`: Node22.13, puerta de seguridad, `npm run build:preview`, pruebas estáticas/preview y carpeta `preview-dist`. La captura del fallo confirma que Netlify ya selecciona ese comando desde el TOML; no hace falta sustituir la configuración global.
4. La publicación comprobada corresponde al commit `4b4d4aa8d0fbd6628ce60e0e27e89b63b19a3c20`; cualquier reintento posterior debe usar el último commit de esta rama.
5. Comprobar siempre `build-info.json` con SHA/revisión/dirtyfalse/MotorV1false y recursos200. La verificación del18/10/2026 abrió el viaje canónico, diez tramos, HUD, disparo y pausa en Chromium móvil sin errores HTTP o JavaScript.

No tocar ajustes del proyecto original ni PR3/main para conseguir esta preview. La sesión no dispone de acceso autenticado al panel, pero la publicación pública, su procedencia y GitHub Actions ya quedaron comprobados.

## Alternativa: branch deploy

La configuración anterior sigue disponible: habilitar exclusivamente la rama autorizada en Branch deploys y definir `NEON_PREVIEW_DEPLOY=1` para ese contexto. No seleccionarla como producción de un destino desconocido para saltar la puerta. `--ignore` usa el convenio Netlify:0omite,1continúa; `--require-enabled`:0autoriza,1rechaza. Los errores ahora distinguen falta de opt-in, rama y contexto/identidad.

## Paquete manual y limpieza

El ZIP limpio da3 del informe [LEVEL_ONE_DYNAMIC](../production-reports/LEVEL_ONE_DYNAMIC_2026-10-18.md) sigue siendo una versión jugable verificada. Descomprimir el contenido para que `index.html`, `build-info.json`, `_headers` y `juego/` estén en la raíz que se sube al sitio de pruebas. Un nuevo build tiene su propio SHA y no debe atribuirse al paquete anterior.

Fuentes en `src/`, recursos en `assets/`, maestros en `art-source/` y evidencia en `docs/production-reports/`. Regenerar con el pipeline, no editar copias web/iOS. `preview-dist/`, `node_modules/` y `.netlify/` no se versionan; `npm run audit:repository` sólo inventaría. Se conservaron28copias generadas en disco e historial al retirarlas del índice. No purgar recursos, maestros, pruebas ni guardados.

## Historial y alcance comprobado

GitHub ya estaba conectado a Netlify: el sitio principal publica archivos coincidentes con `main` y la previewPR3 corresponde a `production-100-development`. La falta de acceso autenticado de Codex no significaba falta de conexión del propietario. La excepción nueva corrige el proyecto de pruebas identificado por sus capturas. [Informe de corrección](../production-reports/NETLIFY_ISOLATED_PREVIEW_FIX_2026-10-18.md) distingue pruebas de puerta, CI y publicación realmente observada.
