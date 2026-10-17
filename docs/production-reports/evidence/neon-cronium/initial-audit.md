# Auditoría breve — marca NEON CRONIUM

Solo lectura del repositorio; no se modificaron archivos. Se excluyeron informes/evidencias históricos, node_modules, .git y copias generadas www / iOS public / preview-dist. Hay ediciones concurrentes de marca: varias pantallas ya muestran el nombre nuevo; esta lista identifica contratos y restos a revisar, no una fotografía final certificada.

## Nombres de archivos encontrados

- `ART_DIRECTION_NEON_CATCHER.md`: único documento rector activo cuyo nombre contiene CATCHER. Recomiendo nuevo nombre `ART_DIRECTION_NEON_CRONIUM.md` y actualizar los enlaces activos; mantener recuperable el documento previo y no reescribir enlaces de informes históricos a commits anteriores.
- `render/neon-render-engine.mjs` y `tests/neon-render-engine.test.mjs`: solo contienen NEON, también válido en la marca nueva. No necesitan renombrado artístico. Son contratos del motor reservado; conservarlos evita cambios innecesarios en imports, `scripts/build-web.mjs` y `scripts/certify-local.mjs`.
- `Neon_Catcher_V6_8_0_Netlify_Directo.zip`: paquete histórico, no recurso activo. Conservar su nombre y bytes como evidencia recuperable; futuros paquetes pueden usar NEON_CRONIUM.
- No aparecieron otros nombres de archivo activos con Neon/Catcher fuera de esos cuatro. La ruta del workflow `.github/workflows/n7-integrated-preview.yml` no contiene la marca antigua y puede conservarse.

## Imágenes y marca visible confirmadas

- Inspección visual: `assets/icon-512.png` y `art-source/native/app-icon-master.png` solo tienen un monograma N. Son compatibles con la marca nueva; el icono web de192 y el icono iOS no requieren sustitución por el nombre.
- **Sí contienen NEON CATCHER incrustado:** `art-source/native/launch-screen-master.png` (1254²) y el splash iOS2732² inspeccionado. Las tres exportaciones `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732{,-1,-2}.png` son idénticas (SHA256 `b88c694a6ba6e9e593cfabacc495b3e796f61dd81ca7fa8d60cef485ef923a2b`). Cambiar HTML/Info.plist deja esa marca antigua visible durante el arranque nativo.
- Rehacer el maestro de lanzamiento conservando copia recuperable y exportar con `node scripts/export-native-art.mjs`; el script genera las tres splash RGB y el icono. Las pruebas exigen icono1024² y splash2732². No confundir la generación de imágenes con una compilación o prueba iOS física.
- `index.html` utiliza monograma N por CSS/HTML, sin texto de marca incrustado en una imagen. `manifest.webmanifest`, `preview/launcher.html`, `engine-preview.html`, privacidad y términos ya se estaban actualizando al inspeccionarlos.
- Pendientes de marca visibles en fuentes de pipeline al inspeccionar: `scripts/build-preview.mjs` genera nombre de manifiesto y título NEON CATCHER aunque cambie el launcher; `capacitor.config.ts` appName e `Info.plist` CFBundleDisplayName deben coincidir con la nueva marca. También descripción de package y README/guías activas, campos project de catálogo y cabeceras generadas de `scripts/update-production-progress.mjs`.
- Los campos origin/procedencia de assets y prompts antiguos son historia de producción; no cambiarlos como si se hubieran generado bajo la marca nueva.

## Identificadores que conviene preservar

- `com.adonay.neoncatcher` en Capacitor/Xcode: identidad de aplicación y contenedor de datos. Cambiar el nombre visible no exige cambiar este ID. Lo protegen `tests/run-tests.mjs`, `run-static-tests.mjs` y `visual-artpass.test.mjs`.
- Guardados: `neonCatcher.chronosVoyage.v2`, `neonCatcher.flightEquipment.v1`, `neonCatcher.shipFleet.v1`, `neonCatcher.journeyDemo.v1`, `neonCatcher.atlasAutoFire.v1`, sus respaldos y claves clásicas/N7 existentes; también `neon-journey-demo-autofire-v1`. No hacer reemplazo global que deje el progreso inaccesible.
- Aislamiento de preview: `neon-preview-v1:`, `neon-preview-launcher-v1:`, IDs de manifiesto/edition y `window.NeonPreview`. Mantener origen/scope/ID de PWA y prefijos permite conservar instalación y pruebas de aislamiento. `NeonCore`, `NeonCampaign`, `NeonNativeAds`, `NeonRenderEngine` y `NEON_RENDER_VERSION` son APIs técnicas, no textos de producto.
- `design/campaign-space-v1.json` id `neon-catcher-space-campaign`: identificador estable de contenido. Mantenerlo o diseñar migración explícita; no renombrarlo solo para limpiar una búsqueda de texto.
- `USE_ENGINE_V1 = false`, una RAF, IDs de rutas/etapas y semillas/versiones: invariantes ajenos al rebranding.
- Repo `adonay1994sm-gif/Ne-n-catcher`, rama autorizada y URL actual del sitio: no renombrarlos ni sustituirlos por URLs inventadas. Un título nuevo puede convivir con esos identificadores técnicos.
- Caché `neon-catcher-pre-release-7-2-0-chronos-voyage-1`: nombre técnico no visible. Puede conservarse; si se renueva por esta entrega, actualizar contrato exacto en `run-tests` y `run-static-tests` y expresión en `run-v7-web-tests`, sin reemplazar los nombres de cachés ajenas/históricas usados por fixtures de aislamiento.
- CI: se puede cambiar el nombre visible del workflow y el nombre de **futuros** artefactos `NEON-CATCHER-N7-ARTPASS-NETLIFY-DROP`. Mantener archivo, triggers, rama, permisos, pasos y concurrency `neon-n7-artpass-${{ github.ref }}`; los artefactos y ejecuciones anteriores siguen siendo evidencia histórica. Verificar el nombre nuevo en la descarga del nuevo run.
- `package.json` name `neon-catcher` es metadato técnico privado; cambiarlo es opcional y requiere coherencia con las dos entradas de package-lock. Descripción sí es presentación de producto.
