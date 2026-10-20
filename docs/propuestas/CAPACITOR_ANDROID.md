# PROPUESTA · Dependencia `@capacitor/android`

> Estado: **PROPUESTA**. No se ha quitado nada. Decide el propietario.

## Qué se ha comprobado (19/10/2026)

| Pregunta | Resultado |
|---|---|
| ¿Existe la carpeta `android/` (proyecto nativo)? | **No.** |
| ¿Algún script de `package.json` usa Android? | No. Solo hay `cap:add:ios` y `cap:sync`. |
| ¿Algún código del juego importa `@capacitor/android`? | No. |
| ¿Lo necesita AdMob (`@capacitor-community/admob`)? | No. Lo tiene solo como dependencia de desarrollo propia, no como requisito. |
| ¿Qué lo menciona? | `package.json` (dependencia), `package-lock.json`, `capacitor.config.ts` (`server.androidScheme: "https"`, opción que solo afecta a Android) y `scripts/repository-hygiene.mjs` (clasifica rutas `android/` si existieran). |
| Tamaño instalado | ≈ 0,7 MB en `node_modules`. No entra en la app iOS ni en la web. |

**Conclusión:** hoy no se usa. Es un resto de cuando se pensó también en
Android. No afecta a la app de iOS.

## Opciones

1. **Dejarlo (recomendado mientras no haya decisión sobre Android).**
   No molesta y evita tocar el `package-lock.json` justo antes de publicar.
2. **Quitarlo** con `npm uninstall @capacitor/android` (actualiza
   `package.json` y `package-lock.json`).
   - Ventajas: menos dependencias que auditar; deja claro que solo hay iOS.
   - Riesgos: la prueba estática "dependencias exactas y reproducibles" no lo
     exige, pero hay que repetir `npm ci`, build y todas las pruebas. Si un
     día se quiere Android, habrá que volver a instalarlo con la misma
     versión que `@capacitor/core` (hoy 8.5.0).
   - `server.androidScheme` en `capacitor.config.ts` puede quedarse: no hace
     nada en iOS.

## Pasos si se aprueba quitarlo

1. `npm uninstall @capacitor/android`
2. `npm ci && npm run build && npm test && npm run test:static && npm run test:content`
3. En un Mac: `npm run cap:sync` y compilar en Xcode para confirmar que iOS
   no cambia.
