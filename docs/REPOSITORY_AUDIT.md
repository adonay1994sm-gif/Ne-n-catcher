# REPOSITORY AUDIT — NEON CATCHER 7.2.0

Fecha de corte: 2026-08-28

## Base protegida

- Repositorio: `adonay1994sm-gif/Ne-n-catcher`.
- Rama estable protegida: `main`.
- Rama de trabajo: `pre-release-development`.
- Base funcional seleccionada: la pre-release modular 7.1, derivada de la base V6.4.4/V6.5 verificada y superior a los ZIP experimentales por cobertura de pruebas, PWA e iOS.
- No se sobrescribe ni fusiona `main` durante este trabajo.

## Arquitectura encontrada

- Juego Canvas 2D vertical de 720×1280 píxeles lógicos.
- `game.js` se genera de nueve módulos ordenados bajo `src/game/`.
- Servicios ES separados para estado, almacenamiento, daño, jugador, partículas y analítica bajo `src/core/`.
- Build web reproducible en `www/` y copia local para Capacitor en `ios/App/App/public/`.
- PWA con manifest y service worker; Netlify publica exclusivamente `www`.
- Capacitor 8.5, bundle `com.adonay.neoncatcher`, orientación vertical y AdMob comunitario fijado a versión exacta.

## Hallazgos y correcciones

| Prioridad | Hallazgo | Acción | Estado |
|---|---|---|---|
| P0 | Riesgo de desplegar una carpeta equivocada o caché antigua | `netlify.toml` publica `www`; caché versionada 7.2 | CORREGIDO |
| P0 | Recompensa publicitaria no debe depender de temporizador | El puente nativo espera callbacks válidos del SDK | CORREGIDO |
| P1 | Cometa visualmente inerte | Sustituido por ocho fotogramas gráficos integrados en niveles 4 y 10 | CORREGIDO |
| P1 | Nave sin recurso ofensivo inicial explícito | Tres disparos manuales, UI móvil y prueba de bloqueo del cuarto | CORREGIDO |
| P1 | Identidad de campaña inconsistente | Diez briefings y mundos canónicos consolidados | CORREGIDO |
| P1 | Crecimiento de efectos en sesiones | Límites y pool de partículas conservados y revalidados | CORREGIDO |
| P2 | Maquetas sin trazabilidad de producción | Siete dossiers preservados y catálogo exacto de 150 IDs | CORREGIDO |
| P2 | Assets finales de enemigos todavía ausentes | Pipeline, escalas y estados definidos; producción pendiente | ABIERTO |

## Assets

- Runtime actual: 58 archivos, todos declarados en `ASSET_MANIFEST.json` y precargados cuando corresponde.
- Producción futura: 150 IDs únicos. Estado real: 1 READY, 2 IMPLEMENTED_CODE, 9 IN_REVIEW y 138 PLANNED.
- No se presentan los dossiers completos como sprites listos: son referencias de identidad, no assets runtime.

## Riesgos abiertos

- Los enemigos específicos y bosses de las maquetas requieren aislamiento, alpha, fotogramas coherentes e integración individual.
- No existe todavía QA físico en iPhone, TestFlight ni validación de memoria con Instruments.
- AdMob usa identificadores de prueba; consentimiento, tracking y datos comerciales siguen bloqueados por cuentas/decisiones externas.
- Los diez niveles son funcionales e identificados, pero no todos poseen todavía fondos y enemigos finales exclusivos.

## Seguridad

- No se detectaron claves privadas, tokens, contraseñas o certificados dentro del proyecto auditado.
- Los identificadores publicitarios incluidos son los oficiales de prueba de Google, no credenciales privadas.

