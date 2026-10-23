# Estado inicial antes de preparar la publicación

Fecha: 19/10/2026 · Rama: `claude/preparar-publicacion-rtfl9q`
Punto de partida: `bfa33259e917ec9cf8b7e383b0340ac046c22e6a`
(mismo commit que `continuity-assets-audit-20261013` en ese momento).
Entorno: contenedor Linux en la nube, Node v22.22.0, npm 10.9.4.

## Resultado de los comandos pedidos

| Comando | Resultado |
|---|---|
| `npm ci` | Correcto (dependencias instaladas desde `package-lock.json`). |
| `npm run build` | Correcto. `game.js` se regenera desde los 9 módulos y no cambia nada versionado. |
| `npm test` | Correcto: **34 pruebas aprobadas**. |
| `npm run test:static` | Correcto: **13 pruebas aprobadas**. |

## Suites adicionales (solo para tener referencia)

| Comando | Resultado |
|---|---|
| `npm run test:content` | Correcto: 696/696. |
| `npm run test:architecture` | Correcto: 6/6. |
| `npm run test:engine` | Correcto: 60/60. |
| `npm run build:preview` | **Falla ya antes de empezar, a propósito**: el script solo permite generar la preview desde la rama `continuity-assets-audit-20261013` ("Preview branch not allowed"). Es una protección del proyecto; no se toca. |
| `npm run test:preview` | 19/25. Los 6 fallos son porque no existe `preview-dist/` (depende del paso anterior). Fallo previo, no se arregla. |

## Qué significa

El proyecto compila y sus pruebas principales pasan. Cualquier fallo que
aparezca más adelante en `npm test` o `npm run test:static` se podrá atribuir
al cambio que lo provoque. Los fallos de la preview ya existían y dependen de
la rama, no del código.

Estas pruebas se ejecutan en Node/JSDOM; **no** equivalen a probar en un iPhone
real ni a una compilación con Xcode.
