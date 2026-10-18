# DIAGNÓSTICO

18/10/2026 · rama `continuity-assets-audit-20261013` · SHA inicial local/remoto limpio `8c5b44e6ea19f3ef29c0838703966fcae9027eaa`. Capturas del propietario: proyecto nuevo `neonpreviewdeploy`, contextoProduction, rama autorizada y build del SHA8c5b44e; log termina en la puerta `--require-enabled`, exit1, antes de compilar. El propietario confirma opt-in1 en Production del proyecto nuevo.

Causa confirmada: la puerta sólo admitía local/branch-deploy, sin distinguir producción del sitio principal de la etiqueta técnica Production de un proyecto de pruebas separado. La conexión GitHub–Netlify ya existe; la falta de acceso autenticado de Codex no implica una cuenta desconectada. main, PR3 y el sitio original se preservan.

# INFORME DE PRODUCCIÓN — NETLIFY_ISOLATED_PREVIEW_FIX

## Cambio acotado

Se admite Production únicamente con NETLIFYtrue, SITE_NAMEexacto neonpreviewdeploy, URLHTTPS del host exacto neonpreviewdeploy.netlify.app, rama autorizada y NEON_PREVIEW_DEPLOY1. Se rechazan hosts distintos, credenciales/puertos no estándar, identidades ausentes, main, PRs y producción del sitio original. Los modos locales y branch-deploy mantienen sus contratos y el convenio --ignore0omite/1construye. Los errores señalan qué condición falta.

Fuentes: `scripts/netlify-preview-gate.mjs`; contratos: `tests/preview-build.test.mjs`; comentario TOML y guía/AGENTS actualizados. El log confirma que Netlify ya usa el comando de rama desde el TOML; no se cambia la carpeta ni la configuración general. No cambia código de juego, arte, audio, economía, guardados, controles o MotorV1false.

## Verificación y publicación

[Resultados locales](evidence/netlify-isolated-fix/local-checks.json): buildpreview0, dos pruebas de puerta con ambos modos y24variantes negativas, preview24/24, estáticas13/13 y arquitectura6/6. Sintaxis y diffcheck0. Snapshot de integración sucio sobre8c; no se atribuye un SHA limpio a ese build. Ninguna fuente de gameplay cambió. La CI del commit publicado volvió a comprobar el pipeline completo y terminó correctamente: [39134274955](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39134274955).

[Error transcrito de las capturas](evidence/netlify-isolated-fix/reported-error.md). La excepción sólo autoriza el destino del propietario; no elimina la prueba ni debilita el rechazo genérico. Los tests limpian las variables Netlify heredadas para que ejecutarlos dentro del proyecto aislado no contamine los casos de rechazo.

Commit funcional publicado **82c3311c147fb71da4ff93348a105bbf148c2828**, CI completa/success. La nueva tarea permanece IN_REVIEW: puerta/pipeline verificados, publicación Netlify no verificada; aceptación artística/física no aplicables a esta puerta.

## Continuación

El propietario solicita un intento directo desde Codex. Se emite un segundo push normal con este cierre para producir un evento Git nuevo, conservando el código de puerta ya probado. [Solicitud de reintento](evidence/netlify-isolated-fix/retry-request.json). Después se comprueba la CI del nuevo SHA y se observa HTTP/build-info del sitio de pruebas. Si Netlify no se puede observar desde GitHub o HTTP, registrar esa limitación y pedir sólo el error concreto del panel; no inventar una URL accesible ni desplegar al sitio principal. La web privada22 y el paquete limpio da3 siguen disponibles mientras tanto.

## Acceso comprobado y límite del intento directo

[Estado previo al reintento](evidence/netlify-isolated-fix/remote-state-before-retry.json): GitHub82c correcto y CI success; la dirección esperada y build-info del sitio de pruebas devuelven404. Esto no permite distinguir build detenido, integración no activada o dirección real distinta.

[Acceso Netlify](evidence/netlify-isolated-fix/permission-check.json): API401 sin autenticación. No hay credencialNetlify, SiteID ni CLI configurados; búsqueda de pluginNetlify sin conexión disponible. Los permisos nominales de GitHub dicenadmin, pero [la consulta de webhooks devuelve403](evidence/netlify-isolated-fix/webhook-access.json): esa operación no está autorizada por la conexión actual. No se intentó eludirla ni usar credencialesGitHub en Netlify.

La documentación oficial no justifica modificar de nuevo ignore/require: [revisión](evidence/netlify-isolated-fix/ignore-command-review.md). No se toca la seguridad por una causa hipotética. El nuevo push es una solicitud por el enlace Git existente, no una afirmación de webhook entregado o build publicado. Para gestionar el panel/API directamente hace falta una conexión Netlify autenticada, con la credencial en el entorno seguro, nunca incrustada en código o informes. La web privada22 y el paquete da3 continúan recuperables.
