# TEST REPORT PRE-RELEASE — 7.2.0

Fecha: 2026-08-28

## Resumen

| Suite | Resultado | Evidencia |
|---|---:|---|
| Regresión funcional | PASS · 33 | `npm test` |
| Build/estática/PWA/iOS | PASS · 13 | `npm run test:static` |
| Arquitectura | PASS · 6 | `npm run test:architecture` |
| Runtime Canvas prolongado | PASS · 13 | `node tests/run-v7-web-tests.mjs` |
| Total automatizado | **PASS · 65** | ejecución limpia tras `npm run build` |
| ZIP Netlify descomprimido | PASS · 13 | ejecutado desde un directorio temporal vacío |
| ZIP fuente descomprimido | PASS · 65 | reconstruido y probado desde un directorio temporal con las dependencias verificadas |

## Cobertura relevante

- Arranque, menú, campaña de diez niveles y presupuestos.
- Tres disparos por partida, consumo, cooldown y bloqueo del cuarto.
- Guardado anterior, migración idempotente y normalización de datos corruptos.
- Hitbox histórica sin cambios.
- 10.000 formaciones de niveles 6–10 con corredor atravesable.
- 50.000 amenazas aleatorias fuera del corredor protegido.
- Daño, destrucción, game over, continuación única, invulnerabilidad y limpieza de residuos.
- Onda temporal, partículas limitadas y simulación prolongada.
- PWA, referencias locales, 58 assets declarados y caché 7.2.
- Web e iOS sincronizados; bundle, versión, orientación e integración publicitaria de prueba.
- Catálogo de 150 IDs únicos y existencia del master/runtime del cometa.

## Incidencias de esta pasada

| Estado | Incidencia | Corrección | Reprueba |
|---|---|---|---|
| PASS | Metadatos todavía esperaban 7.1 | Tests, PWA, package e iOS alineados en 7.2 | PASS |
| PASS | No existía prueba de las tres municiones | Harness expone estado y valida tres éxitos + cuarto bloqueado | PASS |
| PASS | Cometa anterior seguía precargado | Ruta reemplazada por spritesheet 8-frame en juego, manifest y SW | PASS |

## Límites honestos

- NOT TESTED: dispositivo iPhone físico, memoria con Instruments, TestFlight, suspensión prolongada real y pérdida de red real.
- BLOCKED: anuncio AdMob de producción, consentimiento ATT y telemetría real por falta de cuentas/configuración comercial.
- La instalación `npm ci --offline` del ZIP limpio quedó BLOCKED porque el sandbox no tenía `yauzl` en caché y no permite alcanzar el registro npm; el mismo fuente descomprimido sí reconstruyó y pasó las 65 pruebas usando las dependencias exactas ya instaladas y validadas por el lockfile.
- La comprobación visual pública de Netlify se registra después de que el commit remoto termine de desplegar.
