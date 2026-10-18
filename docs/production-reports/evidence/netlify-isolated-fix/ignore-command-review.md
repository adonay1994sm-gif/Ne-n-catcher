# Revisión del paso ignore

Se consultó documentación oficial Netlify para contrastar si la puerta podía omitirse antes del build por falta de variables automáticas. No se encontró evidencia que justifique debilitar las comprobaciones.

- https://docs.netlify.com/build/configure-builds/ignore-builds/ : Node18 fijo, sin dependencias npm;0omite/1continúa.
- https://docs.netlify.com/build/configure-builds/environment-variables/ : NETLIFY,CONTEXT,BRANCH,SITE_NAME,URL automáticas; variables propias con alcanceBuilds para el proceso de compilación.
- https://answers.netlify.com/t/support-guide-how-to-use-the-ignore-command/37517 : las variables propias definidas en la UI pueden utilizarse en ignore.

El script actual usa sólo módulos nativos y URL, compatibles con Node18. La presencia en el log de resolved.environment únicamenteNODE_VERSION no prueba ausencia de la variableUI. El error antiguo no identifica qué condición falta; su frase ya no existe en el commit82c3311. No se confunde un push emitido con una entrega de webhook o publicación Netlify comprobada.
