# Registro de cambios

## V6.6 Modular — 4 de agosto de 2026

- Separado `game.js` en 9 módulos ordenados por responsabilidad.
- Añadido generador determinista de `game.js`; la primera reconstrucción fue byte a byte idéntica a V6.6.
- El build web regenera el bundle antes de publicar `www/`.
- Añadidas pruebas de integridad modular y batería estática sin dependencias del DOM.
- Sin cambios en balance, hitbox, sectores, assets, guardado, anuncios ni comportamiento jugable.

# Changelog

## V6.6 Corredor Garantizado — 3 de agosto de 2026

### Corregido

- Sustituidas las vigas metálicas artificiales de S6–S10 por formaciones de basura espacial creadas con los assets optimizados existentes.
- Reservado un pasillo continuo desde la parte superior del campo hasta la nave mientras cada formación se aproxima.
- Bloqueado el nacimiento de meteoritos, restos y satélites dentro del corredor.
- Retiradas antes de la colisión las amenazas que entren después por ondas, caos u otras trayectorias laterales.
- Conservada una abertura de 262, 258, 254, 250 y 246 px en S6–S10 frente a los 212 px de ancho lógico de la nave.
- Actualizados aviso, ayuda, briefing y textos para describir el comportamiento real.

### Verificación añadida

- 10.000 formaciones simuladas entre S6 y S10 con paso válido y piezas rotadas fuera del corredor.
- 50.000 amenazas aleatorias sometidas al filtro de corredor, sin invasiones residuales.
- Caso de regresión con un meteorito superpuesto a la nave: se retira antes de causar daño.
- Prueba visual móvil de menú, ayuda y formación real a 430×932, además de recarga PWA sin conexión.

### Preservado sin cambios

- Silueta y hash de colisión V6.3/V6.4.3.
- Objetivos, velocidades, frecuencia base, suministro, puntuación y combo x12.
- Controles, sensibilidad, progreso, estrellas, récords y claves locales.
- Daño, explosión, continuación, habilidades, anuncios de prueba y bundle ID `com.adonay.neoncatcher`.

## V6.4.4 Base Estable — 3 de agosto de 2026

### Corregido

- Alineados nombre visible, `package.json`, README, código y caché en V6.4.4.
- Sustituida la caché heredada V6.4.2 por `neon-catcher-v6-4-4-base-stable`.
- Añadido versionado de CSS/JavaScript y estrategia network-first para código.
- Precargados en la PWA los 56 assets de producción para evitar una mezcla parcial offline.
- Recuperada la migración idempotente de `neon-best-v1` sin reducir un récord V2 existente.
- Reiniciado el reloj de frame al volver de pausa publicitaria o continuación.
- Endurecida la continuación: una por partida, solo desde game over por casco, nave visible y neutra, casco mínimo 35 %, escudo 4 s y residuos eliminados.
- Integrados `ship_frame_05.webp` como reacción temporal al impacto y `smoke_frame_02.webp` en una secuencia anclada; ninguno puede quedar congelado tras reaparecer.
- Actualizada la ayuda del phaser y la política de privacidad para reflejar el código real.

### Infraestructura

- Dependencias fijadas y lockfile reproducible.
- Build web limpio en `www/`.
- Proyecto Capacitor iOS real con bundle ID `com.adonay.neoncatcher`.
- AdMob nativo conectado con IDs oficiales de prueba, flujo de consentimiento y recompensa confirmada por evento.
- Añadidos `ASSET_MANIFEST.json`, pruebas automatizadas y este changelog.

### Preservado sin cambios

- 10 sectores, objetivos, suministro, frecuencia y velocidad.
- Colisión inteligente, radios físicos y aperturas de barrera de V6.3/V6.4.3.
- Daño, puntuación, combo x12, habilidades y duraciones.
- Controles, sensibilidad, progreso, estrellas, récords y claves locales V2/V5.

### Fuera de esta base

- IDs publicitarios de producción, firma y credenciales de App Store/Codemagic.
- Identidad legal, correo/URL de soporte y política final de producción.
- Prueba en iPhone físico y validación de TestFlight.

## V6.6.0 — Architecture
- Núcleo ES real para estado, almacenamiento, jugador, daño y object pooling.
- Estado central integrado en el flujo existente.
- Pool de partículas integrado para reducir presión de memoria.
- Verificación automatizada con `npm run verify`.
- Paquetes web e iOS sincronizados durante la construcción.
- Sin cambios intencionados de jugabilidad o balance.
