# Paquete experimental verificable — Chronos → Gaia

Fecha: 17/10/2026 UTC. Rama: `continuity-assets-audit-20261013`.

- Código funcional probado: `ce71b299cb0eea8cbb908dd4886319e4e859580e`.
- Cierre documental y snapshot limpio utilizado: `24b591ca6814e21a8cfd75eb017ad869b18e1e66`.
- [ZIP autocontenido](evidence/journey-p1/neon-catcher-journey-24b591c.zip): **5 194 332 bytes**.
- SHA-256 ZIP: `3b3732900e789490521fdf9f4b766fe9ce0d485f2472b4a58418a6963396930c`.
- [build-info.json](evidence/journey-p1/clean-build-info.json): `dirty:false`, `engineV1:false`, revisión `013b653ef9db2c28d9bfa0e963a7effe74e1f4e7f75debafea0afe38046508d7`.
- SHA-256 de `juego/game.js`: `95d502d76f1f3bfa6cbe44877468c14bbfa55b23d903fe9b6b115745bcc9f696`, idéntico al de la [partida Chromium natural final](evidence/journey-p1/browser-04/results.json).
- [Build limpio](evidence/journey-p1/clean-build.txt) y [preview 15/15](evidence/journey-p1/clean-preview.txt), códigos 0. `unzip -t` no detectó errores.

El commit que añade esta acta y ZIP es posterior al snapshot de construcción; se consulta con `git log -1` y `git ls-remote origin refs/heads/continuity-assets-audit-20261013`. No cambia el código del ejecutable certificado ni pretende incluir su propio SHA dentro de un archivo que lo produciría.

## Entradas y partida

Descomprimir en una carpeta y servir por HTTP, por ejemplo `npx serve <carpeta-descomprimida>`. `index.html` es el selector; el acceso principal abre `juego/index.html?campaign=journey`. Las entradas históricas `juego/index.html` y `juego/index.html?campaign=n7` permanecen para regresión.

En la demo, pulsar **CONTINUAR VIAJE**. Apoyar el dedo y arrastrar horizontalmente sin salto inicial. El disparo básico es automático configurable; DISPARAR también funciona sin límite de tres pulsos. Escudo y tractor tienen disponibilidad visible. Recuperar la pieza marcada, entrar en C9, instalarla gratis y continuar; la nave gana respuesta y propulsión ámbar. Desactivar el CH-01 de acceso y alcanzar Gaia. El guardado retoma checkpoints de tramo/estación/llegada, sin prometer continuidad exacta en combate.

## Netlify

**No hay URL nueva publicada o comprobada.** No se encontraron token/siteID, CLI ni herramienta Netlify conectada. La operación externa pendiente es subir el contenido descomprimido, con `index.html` en raíz y `juego/` a su lado, a **un sitio Netlify de pruebas aislado** mediante Drop o un deploy autenticado equivalente. No usar el sitio de producción ni la vista previa histórica de PR #3.

Tras subir, abrir el `build-info.json` servido y comprobar SHA `24b591ca6814e21a8cfd75eb017ad869b18e1e66`, `dirty:false`, selector, enlace Journey, recursos y ambas entradas históricas. Registrar la URL real y jugar en Safari/iPhone; eso todavía está pendiente. No basta con que el ZIP esté en GitHub para declararlo desplegado.

La aceptación técnica corresponde a esta demo; la aceptación artística del propietario, prueba física, arte final de estación/Mira y expansión a cien etapas siguen abiertas. [Informe detallado](P0_P1_CHRONOS_GAIA_2026-10-17.md) y [visión rectora](../PRODUCT_VISION.md).
