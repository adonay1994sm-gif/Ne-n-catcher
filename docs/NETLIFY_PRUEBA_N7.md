# NEON CATCHER — Cómo probar Clásico + N-7 desde Netlify (rama aislada)

## Preview temporal comprobada el 16/10/2026

Se subió el paquete `5a2f916` mediante Netlify Drop a `https://idyllic-custard-c8c391.netlify.app/`. La contraseña se comunicó directamente al propietario y no se almacena en el repositorio público. Esta URL **expira aproximadamente a las 15:45 UTC del 16/10/2026** si no se reclama. El informe técnico y el ZIP listo para volver a subir se encuentran en [NETLIFY_DROP_2026-10-16.md](production-reports/NETLIFY_DROP_2026-10-16.md). Para pruebas duraderas, usar una cuenta y un sitio experimental propio; esta publicación no activó el branch deploy ni la web de producción.

Rama permitida: `continuity-assets-audit-20261013`. El modo clásico no se cambia, el modo N-7 es optativo y `USE_ENGINE_V1` se mantiene en `false`.

## Generación local, sin desplegar

`npm ci && npm run build:preview && npm run test:preview`

Resultado: `preview-dist/index.html` (selector de modos) y `preview-dist/juego/` (versión web completa, sin tocar `www/` ni la copia iOS).

## Usar tu sitio de Netlify con el repositorio conectado

1. Abre el sitio `neoncatcheroriginal` en Netlify y confirma que apunta al repositorio correcto.
2. En **Project configuration → Developer settings → Continuous deployment → Branches and deploy contexts**, habilita los despliegues de la rama **`continuity-assets-audit-20261013`**.
3. En **Environment variables**, crea la variable `NEON_PREVIEW_DEPLOY` con el valor **`1`**, preferiblemente limitada al contexto/branch de pruebas si Netlify lo permite.
4. Desencadena el despliegue **de esa rama**, no de `main` ni de la PR #3. Configuración de la rama: `npm run build:preview`, carpeta publicada `preview-dist`.
5. Abre la **URL de branch deploy que muestre Netlify**. La página inicial ofrece `N-7: 100 rutas` y `Campaña clásica: 10 niveles`.

Por seguridad, **sin `NEON_PREVIEW_DEPLOY=1` la rama seguirá bloqueada para despliegues automáticos**. `deploy-preview-3--neoncatcheroriginal.netlify.app` corresponde a la PR #3 y **no cambia** por estos commits.

## Alternativa manual

Desde un equipo con Node 22+ ejecuta `npm ci && npm run build:preview`, comprime **el contenido de** `preview-dist` (con `index.html` en la raíz del ZIP) y súbelo a Netlify Drop. Las vistas previas publicadas por Netlify pueden ser accesibles desde Internet.

## QA con iPhone

- Verifica que se abre el selector y que ambas tarjetas funcionan.
- Clásico: carga menú, sector 1, movimiento táctil, disparo, pausa, reinicio y regreso al menú.
- N-7: carga el modo de 100 rutas, selecciona RUTA 1, supera una oleada y prueba pausa/reanudación y menú.
- Opcional: activa «Desbloquear las 100 rutas solo para pruebas» para probar otra ruta.
- Conserva capturas, errores y modelo/iOS. **No es certificación automática ni una publicación comercial.**

## Seguridad y restricciones

Ningún paso modifica `main`, actualiza la PR #3, activa Engine V1 o integra anuncios/pagos nuevos. Los 10 jefes, el arte final y la historia N-7 permanecen pendientes; nunca presentar esto como juego terminado.
