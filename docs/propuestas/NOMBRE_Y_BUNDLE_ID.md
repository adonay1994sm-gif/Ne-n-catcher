# PROPUESTA · Decidir nombre y bundle ID antes de crear la app en App Store Connect

> Estado: **DECIDIDO** el 23/10/2026. El propietario eligió un ID con solo
> el nombre del juego: **`com.neoncronium`** (el `com.` lo exigen las
> tiendas; Android pide al menos dos partes). Aplicado en
> `capacitor.config.ts`, `project.pbxproj`, `ios/App/App/capacitor.config.json`
> y sus pruebas. Falta registrarlo en Apple Developer y Google Play.

## Situación (19/10/2026)

| Elemento | Valor actual | Dónde |
|---|---|---|
| Nombre visible | `NEON CRONIUM` | `Info.plist` (`CFBundleDisplayName`), `capacitor.config.ts` (`appName`), `manifest.webmanifest`, `index.html` |
| Bundle ID | antes, el nombre antiguo del juego; ahora `com.neoncronium` | `capacitor.config.ts`, `project.pbxproj`; fijado en `tests/run-static-tests.mjs` |
| Claves de guardado | `neonCronium.*` (cambiadas el 23/10/2026) | Sin jugadores todavía, no hace falta migrar |
| Disponibilidad del nombre en App Store | **sin comprobar** | — |

## Opciones

1. **Mantener el ID antiguo.**
   - Ventajas: cero cambios; nadie lo ve (el usuario solo ve el nombre).
   - Riesgos: identificador incoherente con la marca para siempre.
2. **Cambiar a algo como `com.[COMPLETAR].neoncronium` antes de la primera
   subida.**
   - Ventajas: coherente con la marca; ahora es gratis cambiarlo.
   - Riesgos: tocar `capacitor.config.ts`, `project.pbxproj` y la prueba
     estática 11; los guardados de la **app iOS** no se comparten entre bundle
     IDs distintos, pero hoy la app no está publicada, así que no hay
     jugadores que perder. En la web no afecta.
   - El dominio inverso debería ser uno que controles; `com.adonay` no es un
     dominio comprobado (sin comprobar).

## Además, antes de crear la app
- Comprobar en App Store Connect que "NEON CRONIUM" está libre (los nombres
  son únicos en la tienda) y tener uno alternativo.
- Revisar marcas registradas parecidas (sin comprobar).
- Decidir el SKU y el idioma principal.

## Pasos si se elige la opción 2
1. Decidir el ID exacto.
2. Cambiar `appId` en `capacitor.config.ts` y `PRODUCT_BUNDLE_IDENTIFIER` en
   `project.pbxproj` (2 apariciones).
3. Actualizar la aserción de `tests/run-static-tests.mjs`.
4. `npm run cap:sync`, compilar en Xcode y registrar el ID en el portal de
   Apple Developer.
