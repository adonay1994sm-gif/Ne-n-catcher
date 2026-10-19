# Checklist de publicación en la App Store

Fecha: 19/10/2026. Fuentes: `docs/APP_STORE_READINESS.md`,
`docs/MONETIZATION_READINESS.md`, `docs/REMAINING_WORK.md` (todos con corte
7.2.0) y una revisión del código actual de esta rama.

Leyenda: ✅ listo · 🟡 a medias · ⛔ bloqueado (falta algo externo o una
decisión) · ❓ sin comprobar.

| # | Requisito | Estado | Qué hay hoy | Qué falta |
|---|---|---|---|---|
| 1 | Política de privacidad | 🟡 | `privacy.html` existe y está enlazada desde el menú y precargada. Fecha 3/08/2026, habla de "V6.5" y dice que no es la versión final. | Texto final con responsable y contacto, publicidad AdMob y URL pública estable para App Store Connect. Borrador en `docs/propuestas/privacy.html`. |
| 2 | Términos de uso | 🟡 | `terms.html` existe (3/08/2026, "V6.5", no contractual). | Identidad, contacto, ley aplicable. Borrador en `docs/propuestas/terms.html`. |
| 3 | IDs de anuncios reales | ⛔ | Solo IDs de prueba de Google en `ads-config.js` y `GADApplicationIdentifier` de prueba en `Info.plist`. `testing: true`. | Cuenta AdMob, app y unidades reales; cambio coordinado de `ads-config.js` + `Info.plist`. No se toca sin orden. |
| 4 | Consentimiento (UMP / RGPD) | 🟡 | `native-admob-entry.js` pide `requestConsentInfo()` y muestra el formulario si hace falta. | Configurar el mensaje de consentimiento en la consola de AdMob y probarlo en un iPhone con región UE. |
| 5 | ATT (App Tracking Transparency) | ⛔ | **No** hay `NSUserTrackingUsageDescription` en `Info.plist` ni llamada a la petición ATT. | Decidir si se usarán anuncios personalizados (IDFA). Si sí: texto ATT + petición antes de cargar anuncios. Si no: declararlo así en las etiquetas de privacidad. |
| 6 | Etiquetas de privacidad (App Store Connect) | ⛔ | El juego no tiene servidor propio; guarda progreso en el dispositivo. `analytics-manager.js` no envía nada (sin proveedor). AdMob sí recoge identificadores y datos de uso/diagnóstico. | Rellenarlas en App Store Connect según la decisión de ATT/anuncios. |
| 7 | Manifiesto de privacidad (`PrivacyInfo.xcprivacy`) | ❓ | No existe en `ios/App/App/`. El SDK de Google trae el suyo. | Comprobar en Xcode (informe de privacidad del archivo) si la app necesita uno propio. |
| 8 | SKAdNetwork | 🟡 | `Info.plist` solo incluye `cstr6suwn9.skadnetwork` (Google). | Revisar la lista recomendada por Google para el lanzamiento con anuncios reales. |
| 9 | Clasificación por edad | ⛔ | Sin hacer. `privacy.html` dice que no es app infantil. | Cuestionario en App Store Connect (titular). |
| 10 | Capturas y metadatos | ⛔ | No hay capturas comerciales en el repositorio. | Capturas para los tamaños de iPhone exigidos, descripción, palabras clave, categoría. Requiere build final. |
| 11 | Soporte | ⛔ | El menú enlaza "Soporte" a `privacy.html#contacto`, que dice que el canal **no está definido**. | URL de soporte y correo de contacto reales. [COMPLETAR] |
| 12 | Nombre y bundle ID | 🟡 | Nombre visible `NEON CRONIUM` (`Info.plist`, `capacitor.config.ts`). Bundle ID `com.adonay.neoncatcher` (nombre antiguo). | Decidir antes de crear la app en App Store Connect: ver `docs/propuestas/NOMBRE_Y_BUNDLE_ID.md`. Disponibilidad del nombre en la tienda: sin comprobar. |
| 13 | Cuenta de Apple Developer | ❓ | Sin comprobar. `project.pbxproj` usa firma automática y **no tiene `DEVELOPMENT_TEAM`**. | Cuenta de pago activa y equipo asignado en Xcode. |
| 14 | Build con Xcode 26 o posterior | ❓ | No hay Mac en este entorno. El proyecto declara `LastUpgradeCheck = 0920` y `objectVersion = 60`; destino mínimo iOS 15.0; versión 7.2.0 (build 4). | Abrir y compilar con Xcode 26+ (SDK de iOS 26), aceptar la actualización de ajustes de proyecto si la propone y archivar. |
| 15 | TestFlight | ⛔ | Nunca subido (según readiness 7.2.0). | Archivo firmado, subida y prueba interna. |
| 16 | Prueba en iPhone real | ⛔ | Ninguna registrada. Las pruebas son JSDOM/Chromium. | Partida completa, anuncios de prueba, segundo plano/vuelta, audio, rendimiento (Instruments), safe areas. |

## Otros puntos encontrados en esta revisión

- La web pública (`www/`, Netlify) incluye la demo experimental
  `engine-preview.html` y las carpetas `engine/`, `js/engine/` y `render/`.
  No entra en iOS. Ver `docs/propuestas/UNIFICAR_MOTORES.md`.
- El repositorio es **público** en GitHub. Ver `docs/propuestas/REPO_PRIVADO.md`
  y `docs/publicacion/REVISION_README.md`.
- `ITSAppUsesNonExemptEncryption = false` ya está en `Info.plist` (evita la
  pregunta de cifrado en cada subida).
- Orientación solo vertical, barra de estado oculta, icono 1024×1024 y splash
  2732×2732: ✅ comprobados por `npm run test:static`.

## Resumen

El código está en buen estado técnico, pero **no está listo para enviar**:
faltan decisiones y datos del titular (identidad, contacto, anuncios, ATT,
clasificación) y todo lo que exige un Mac y un iPhone (build Xcode 26,
TestFlight, prueba física).
