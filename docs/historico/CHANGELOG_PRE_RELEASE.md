# CHANGELOG PRE-RELEASE — 7.2.0

Fecha: 2026-08-28

## Jugabilidad

- Se añadió munición manual inicial de **3 disparos por partida**.
- Se añadió botón táctil `DISPARAR`, contador `3/3` y control equivalente con barra espaciadora.
- Cada disparo usa autoapuntado frontal limitado, retroceso visual, audio, haptic, impacto, puntuación y telemetría desacoplada.
- El cuarto disparo se bloquea; reiniciar un nivel restaura exactamente tres disparos y continuar restaura como mínimo uno.
- La hitbox de la nave y el balance de núcleos no se modificaron.

## Campaña 1–10

- Los diez niveles tienen ahora nombre, mundo, briefing, objetivo narrativo y familia de amenazas coherentes con Cronos, Gaia Nova, Vulkar, Cryon, Aether y Titan Omega.
- Nivel 4 pasa a `Rastro de la Serpiente` y usa el cometa vivo dentro del gameplay.
- Nivel 10 pasa a `Colapso Cronos` y combina amenazas durante el retorno al reactor.

## Arte y animación

- Nuevo master `art-source/comet_animation_master_v1.png`.
- Nuevo runtime `assets/comet_animation_sheet_v1.webp`: 8 fotogramas, hoja 4×2, celdas 256×256.
- El cometa cambia llama, humo, brasas y fisuras entre fotogramas reales; no depende únicamente de rotación o escala.
- La referencia estática anterior se preservó en `art-source/comet_static_reference_v1.webp`.
- Se incorporaron siete dossiers visuales del usuario como referencias canónicas bajo `art-source/references/`.
- Se creó un catálogo trazable de exactamente 150 piezas en `ASSET_PRODUCTION_150.json` y el mapa/escala en `ASSET_PRODUCTION_MAP.md`.

## Build y plataforma

- Versión web, PWA y iOS alineada en `7.2.0`; build iOS incrementado a `4`.
- Caché PWA renovada a `neon-catcher-pre-release-7-2-0`.
- `www/` e `ios/App/App/public/` se reconstruyen desde la misma fuente.
- Manifiesto runtime actualizado: 58 assets, 1.209.090 bytes.

## QA

- 65 comprobaciones automatizadas aprobadas.
- Incluye regresión de guardados, colisiones, continuación, partículas, PWA, build iOS, 10.000 corredores y 50.000 amenazas.

