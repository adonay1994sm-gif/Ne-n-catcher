# Informe de pruebas — Neon Catcher V6.5 Corredor Garantizado

**Fecha:** 3 de agosto de 2026  
**Base exacta:** `Neon_Catcher_v6_4_4_Base_Estable_Verificada.zip`  
**Referencia de colisiones:** V6.3/V6.4.3  
**Estado:** aprobado como V6.5 técnica verificada; todavía no aprobado como release de App Store.

## Objetivo verificado

- Las antiguas vigas se muestran como formaciones de basura espacial.
- S6–S10 conservan aberturas de 262, 258, 254, 250 y 246 px.
- La nave ocupa 212 px lógicos de ancho; el sector más estrecho conserva 17 px geométricos por lado.
- Meteoritos, restos y satélites no nacen, derivan ni permanecen dentro del corredor mientras la formación se aproxima.
- Núcleos y habilidades sí pueden permanecer en el corredor y no se descuentan del suministro.

## Entorno de verificación

- Node.js 24.14.0 y npm 11.9.0.
- Chromium headless 143.
- Viewport móvil 430×932, DPR 2 y entrada táctil.
- Capacitor 8.5.0 y `@capacitor-community/admob` 8.0.0.

## Resultados automatizados

`npm test`: **24/24 pruebas aprobadas**.

1. Versión V6.5.0 alineada en UI, código, PWA, paquete y Netlify.
2. Dependencias exactas, lockfile V3 y override de seguridad fijado.
3. Sintaxis JavaScript y JSON válida.
4. Sin `latest`, TODO ni IDs publicitarios ficticios en la configuración propia.
5. Manifiesto exacto de 56 assets.
6. Assets usados documentados y precargados.
7. Service worker con código, legales y todos los assets.
8. Referencias HTML sin rutas rotas.
9. `www/` limpio y byte a byte igual a los archivos públicos fuente.
10. Proyecto iOS con bundle, versión, orientación y AdMob de prueba correctos.
11. Recursos iOS y web sincronizados.
12. Migración `neon-best-v1` → `neon-best-v2`, idempotente y sin bajar récord.
13. Diez sectores, objetivos, velocidades, spawns y claves sin cambios.
14. Silueta de colisión intacta; SHA-256 `997fed2f9a050e08eca8c68d0b43486bc2f67a3243519e4f425bfb928ebb4841`.
15. 10.000 formaciones S6–S10 con pasillo atravesable y piezas rotadas fuera del hueco.
16. 50.000 amenazas aleatorias filtradas sin una sola invasión residual; núcleos y escudo conservados.
17. Meteorito superpuesto a la nave retirado antes de causar daño.
18. Sector 10 con objetivo 165, suministro 207 y presupuesto de 5 habilidades.
19. Frame de daño 05 temporal y regreso a estado neutro.
20. Destrucción oculta la nave antes de game over.
21. Continuación única, casco 35 %, escudo 4 s y residuos eliminados.
22. Escudo de reaparición evita daño inmediato.
23. Simulador web concede recompensa solo tras su evento de confirmación.
24. AdMob nativo espera recompensa y cierre, y no duplica listeners.

## Simulación del corredor

- **10.000 formaciones:** 2.000 por cada sector S6–S10 con semilla reproducible.
- **50.000 amenazas:** meteoritos, paneles, restos y satélites con posiciones, radios y rotaciones aleatorias.
- Se usaron los mismos círculos físicos que alimentan la colisión real, incluidos satélites, paneles y meteoritos grandes.
- Las trayectorias ondulantes y caóticas se vuelven a comprobar después del movimiento lateral y antes de `hit()`.
- Resultado: cero rutas imposibles dentro del modelo simulado y cero cambios en la silueta de la nave.

## Navegador, visual y PWA

- Menú, Ayuda y partida S10 abiertos desde el paquete `www/`.
- Marca V6.5, aviso “FORMACIÓN DE RESTOS” y texto de ayuda correctos.
- Formación real renderizada con 13 piezas en la muestra S10, hueco de 246 px y nave centrada.
- Las piezas consideran la caja máxima al rotar y no invaden visualmente el pasillo.
- Canvas interno 720×1561 adaptado a 430×932 sin estiramiento.
- Cero errores de página, peticiones fallidas o respuestas HTTP 4xx/5xx.
- Recarga completamente offline aprobada: service worker controla la página, V6.5 aparece y la nave carga.

## Build, iOS y seguridad

- Instalación limpia desde el ZIP candidato con `npm ci`: aprobada.
- `npm run cap:sync`: aprobado; proyecto iOS contiene el juego local y el plugin AdMob 8.0.0.
- Ruta Swift Package verificada como `../../../node_modules/@capacitor-community/admob`; no apunta a carpetas externas.
- `npm audit --audit-level=moderate`: **0 vulnerabilidades**.
- Bundle ID conservado: `com.adonay.neoncatcher`.
- Versión iOS 6.5.0 y build 2.

## Fallos encontrados y corregidos durante la segunda pasada

- La primera sincronización de iOS heredó temporalmente una ruta hacia las dependencias de V6.4.4. Se sustituyó el enlace por una instalación propia, se resincronizó y se repitieron build y pruebas.
- La primera geometría visual protegía el tamaño sin rotar, pero una pieza a 45° podía sobresalir. Se cambió al radio máximo de la caja rotada y se añadieron 10.000 comprobaciones específicas.
- Al ampliar ese margen, una simulación detectó una formación con pocas piezas. Se corrigió el espaciado para mantener densidad visual sin invadir el hueco y se repitió toda la batería.

## Límites externos pendientes

- No se compiló un IPA porque este entorno no dispone de macOS/Xcode.
- No se probó todavía en iPhone físico ni TestFlight.
- No hay firma, perfiles, credenciales de App Store Connect ni IDs AdMob de producción.
- Privacidad, términos y soporte siguen necesitando identidad y contacto definitivos antes del lanzamiento.

Estos límites no bloquean V6.5 como mejora jugable verificada, pero sí impiden llamarla versión publicable en App Store.
