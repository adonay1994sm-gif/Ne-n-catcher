# Informe final · Preparación para la App Store

Fecha: 19/10/2026 · Rama: `claude/preparar-publicacion-rtfl9q`
Base: `continuity-assets-audit-20261013` (`bfa3325`). 23 commits pequeños,
uno por cambio. `main` no se ha tocado.

## ⚠️ El juego todavía no está terminado

Este trabajo prepara la **parte técnica y administrativa** de la publicación.
**No** significa que el juego esté listo para la tienda. Según el propio
proyecto (`docs/PRODUCT_VISION.md`, `AGENTS.md`):

- El objetivo es una campaña de **10 capítulos × 10 etapas**. Hoy solo el
  **capítulo 1** (Chronos → Gaia, 10 etapas, jefe Atlas) está jugable y aún
  en pulido; los otros nueve capítulos no están producidos.
- El arsenal objetivo de **10–15 armas** está pendiente; hoy hay pocas.
- Arte, música y mezcla final siguen pendientes de aceptación del propietario.
- No hay ninguna prueba en iPhone real ni sesiones de juego con personas.

Por eso este checklist es una **preparación anticipada**: sirve para que,
cuando el contenido esté terminado, publicar no se retrase por trámites.

## Resultado final de las pruebas

| Comando | Al empezar | Al terminar |
|---|---|---|
| `npm run build` | correcto | correcto |
| `npm test` | 34/34 | 34/34 |
| `npm run test:static` | 13/13 | 13/13 |
| `npm run test:content` | 696/696 | 696/696 |
| `npm run test:architecture` | 6/6 | 6/6 |
| `npm run test:engine` | 60/60 | 60/60 |
| `npm run test:preview` | 19/25 | 19/25 (los mismos 6 fallos: ver abajo) |

Las pruebas se ejecutaron tras **cada** commit. Son pruebas en Node/JSDOM y
un Chromium de escritorio; no sustituyen a un iPhone real ni a Xcode.

## Qué se hizo

**Fase 0.** `CLAUDE.md` (guía corta) y `docs/publicacion/ESTADO_INICIAL.md`.

**Fase 1 · Colisiones** (`src/game/04-entities-collision-damage.js`)
- El recuadro rápido de la nave ya no usa `-112, 112, -151, 98` escritos a
  mano: se calcula una vez desde `SHIP_COLLISION_OUTLINE`. Resultado idéntico
  (0 diferencias en 200.000 casos aleatorios × 3 tamaños de nave).
- `collisionCircles` reutiliza tres arrays fijos (círculo único, satélite,
  panel) en vez de crear arrays nuevos por objeto y fotograma. Valores
  idénticos (0 diferencias en 7.920 casos).
- Propuesta de radios: `docs/propuestas/COLISIONES.md`. Conclusión:
  `item.r` **no** es el radio visible (el sprite se dibuja 2,45–3,15 veces
  `r`, con bordes transparentes). Medido sobre los `.webp`, el área de choque
  es igual o algo **menor** que lo visible, **salvo en el meteorito pequeño**,
  donde es ≈ 7–9 % mayor (unos 3 px).

**Fase 2 · Robustez**
- `resizeCanvas()` solo reasigna `canvas.width/height` si cambian.
- `sw.js`: si `cache.addAll` falla, guarda archivo a archivo y omite solo los
  que fallen. Caché subida a `…-orbital-hud-2`. Comprobado con una caché
  simulada (1 archivo roto → se guardan los otros 100 y la instalación sigue).
- `_headers`: `Content-Security-Policy-Report-Only` (no bloquea nada).
  Comprobado en Chromium real: 0 avisos al cargar juego, privacidad y términos.
- Propuesta `@capacitor/android`: no se usa (no hay carpeta `android/`).

**Fase 3 · Orden**
- Análisis en `docs/publicacion/ANALISIS_REFERENCIAS.md`. **Ninguna carpeta
  de motor la usa el juego publicado**; `engine/` y `js/engine/` solo sirven
  a una demo que se publica en la web.
- 18 archivos movidos con `git mv` (5 vigentes a `docs/`, 13 antiguos a
  `docs/historico/`, incluido el ZIP V6.8.0). No se movieron los que usan las
  pruebas o el build (`ART_DIRECTION_NEON_CRONIUM.md`,
  `ASSET_PRODUCTION_150.json`, `ASSET_PRODUCTION_MAP.md`, `engine-preview.html`).
- `.gitignore` con los restos de exportación. README con mapa de carpetas.

**Fase 4 · Publicación**
- `docs/publicacion/CHECKLIST.md` (16 puntos con estado).
- Borradores `docs/propuestas/privacy.html` y `terms.html` con `[COMPLETAR]`.
- `docs/publicacion/REVISION_README.md`.

**Fase 5 · Propuestas** (sin ejecutar): `ART_SOURCE_LFS`, `EVIDENCIAS`,
`HISTORIAL_GIT`, `REPO_PRIVADO`, `NOMBRE_Y_BUNDLE_ID`, `UNIFICAR_MOTORES`,
`DIVIDIR_03_UI` en `docs/propuestas/`.

## Qué falló o quedó a medias

- **`npm run build:preview` y 6 pruebas de `test:preview`** fallan desde
  antes de empezar: la preview solo se genera en la rama autorizada
  (protección del proyecto). No se tocó.
- En la Fase 1a, la primera versión rompió 35 pruebas de `test:content`
  (cargan el módulo sin la silueta). Se corrigió antes de cerrar ese commit.
- Para la Fase 1c se tocaron 7 scripts de smoke de navegador
  (`scripts/*-smoke.cjs`) para que copien los círculos. **No se han
  ejecutado aquí** porque dependen del paquete de preview.
- Subir la caché obligó a cambiar el nombre esperado en 4 archivos de prueba.
- **`git push` devolvió 403**: la app de GitHub de Claude no tiene permiso de
  escritura por git en este repositorio. Ver la sección final.

## Qué queda por decidir (tú)

1. Radios de colisión del meteorito pequeño (`COLISIONES.md`).
2. Quitar o no `@capacitor/android` (`CAPACITOR_ANDROID.md`).
3. **Nombre y bundle ID** antes de crear la app en App Store Connect.
4. **Anuncios**: IDs reales, ATT sí/no (no hay texto ATT en `Info.plist`),
   consentimiento en AdMob.
5. Identidad, correo de soporte y textos legales finales (`[COMPLETAR]`).
6. Repositorio privado, README público (URL de la "web privada"), LFS,
   evidencias, historial, motores, dividir 03.
7. Dejar de publicar la demo del motor en la web de producción.

## Lo que necesita un Mac / iPhone

Build con Xcode 26 o posterior, equipo de firma (`DEVELOPMENT_TEAM` vacío),
revisar si hace falta `PrivacyInfo.xcprivacy`, TestFlight y una partida
completa en iPhone real con anuncios de prueba.
