# NEON CATCHER V6.6 — Informe técnico

## Objetivo
Convertir V6.5 en una base más mantenible y verificable sin cambiar balance, sectores, controles, hitbox, anuncios, guardado ni contenido visual.

## Cambios aplicados
- Versión técnica elevada a 6.6.0.
- Seis módulos ES reales bajo `src/core/`.
- `core-runtime.js` generado automáticamente y cargado antes de `game.js`.
- Estado central validado mediante `createGameState` y `setState`.
- Cálculo de daño aislado en `resolveDamage`.
- Geometría y creación del jugador aisladas.
- Servicio de almacenamiento seguro preparado para migraciones posteriores.
- Object pool integrado en partículas para reducir creación y descarte de objetos.
- Sincronización automática de `www` y `ios/App/App/public`.
- Comando único `npm run verify` ejecutable sin `node_modules` para la parte crítica.
- 13 pruebas estáticas y 6 pruebas de arquitectura.

## Compatibilidad preservada
- Diez sectores y objetivos.
- Balance de energía y habilidades.
- Combo máximo x12.
- Hitbox y tamaño visual actuales.
- Daño, escudo, destrucción y continuación.
- Rutas de assets y 56 recursos.
- PWA, Netlify y proyecto iOS Capacitor.
- Bundle ID y configuración publicitaria existente.

## Verificación realizada
`npm run verify` finalizó correctamente:
- 13/13 pruebas estáticas.
- 6/6 pruebas de arquitectura.
- `game.js` reconstruido desde nueve módulos.
- `core-runtime.js` reconstruido desde seis módulos ES.
- `www` e iOS sincronizados.

## Limitaciones honestas
- El runtime histórico principal continúa distribuido en nueve fragmentos concatenados para evitar una reescritura de alto riesgo. Los servicios nuevos sí son módulos ES reales.
- El puente nativo AdMob se conserva desde el bundle verificado incluido cuando esbuild no está instalado; con `npm ci`, el proyecto puede recompilarlo.
- No se ha compilado un IPA ni probado en TestFlight/iPhone físico en este entorno.
- La prueba headless de Chromium no se certificó por un bloqueo del proceso del navegador en el entorno; las comprobaciones de sintaxis, rutas, bundles y paquetes sí pasaron.

## Próxima fase recomendada
Probar esta versión en Netlify y después en TestFlight antes de introducir cambios visuales o de balance.
