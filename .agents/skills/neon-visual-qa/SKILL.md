---
name: neon-visual-qa
description: Revisar NEON CRONIUM dentro del navegador y sus atlas con evidencia reproducible. Usar al corregir contornos, transparencias, animación, propulsores, HUD o pantallas pequeñas, y antes de declarar integrada una mejora visual. Distinguir escenas instrumentadas de partidas naturales y pruebas físicas.
---

# QA visual del juego integrado

Leer `AGENTS.md`, el informe vigente y el contrato del cambio. Confirmar propietarios congelados o usar un snapshot inmutable. Mantener las reglas de [producción](../neon-production/SKILL.md).

## Inspeccionar antes de actuar

1. Registrar SHA, árbol limpio/sucio, directorio de compilación, revisión y hashes. Crear una carpeta de evidencia nueva; conservar intentos fallidos. No atribuir al HEAD actual una captura de otro paquete.
2. Revisar atlas por frame sobre negro, blanco y damero. Medir alpha en bordes, margen, tamaño, pivote y coordenadas enteras. Buscar piezas truncadas, halos, esquinas opacas, contaminación de celdas y saltos de escala. Padding evita sangrado; no reconstruye un dibujo ya cortado.
3. Abrir el paquete en Chromium con los scripts Node existentes. Inspeccionar DOM, consola y captura antes de interactuar. Usar selectores reales; esperar estado de juego, imágenes decodificadas y animación asentada. `networkidle` por sí solo no certifica Canvas, audio o una transición terminada.
4. Capturar la mejora dentro de una escena real del juego a 390×844 y 320×568, según el caso. Comprobar HUD/controles, márgenes seguros, legibilidad, superposición, escala, alpha y separación del fondo. Conservar controles de al menos 44 px y ausencia de solapamiento.
5. Verificar reposo, movimiento, emisión, impacto, daño y destrucción que correspondan al recurso; buscar cambios auténticos y ausencia de eventos duplicados. Revisar propulsores durante giro y menús, no sólo con nave centrada.
6. Ejecutar la regresión de dos contactos si cambian controles o geometría. Probar pausa/reanudación y el único RAF. Ejecutar partida natural cuando el cambio afecte encuentros, dificultad, ritmo o colisiones; una entidad insertada no demuestra viabilidad natural.
7. Comparar antes/después con SHA, encuadre y condiciones documentadas. Usar diff determinista sólo para regresiones específicas y no como calificación estética. Una animación en otro instante produce diferencias legítimas.

## Reutilizar el pipeline

Inspeccionar los argumentos actuales antes de invocar un script. Ejemplos de herramientas existentes:

- `node scripts/certify-local.mjs <directorio-nuevo>`: build y suites; registrar cada salida.
- `npm run build:preview` y `npm run test:preview`: paquete y contrato de preview.
- `node scripts/chapter-one-visual-smoke.cjs --root <paquete> --output <directorio-nuevo> --expected-commit <sha40>`: escenas controladas, no partida natural.
- `node scripts/chapter-one-browser-smoke.cjs --root <paquete> --output <directorio-nuevo> --expected-commit <sha40> --timeout 900000`: recorrido natural automatizado, cuando aplique.
- `node scripts/two-touch-browser-smoke.cjs --root <paquete> --output <directorio-nuevo>`: contactos reales CDP, sin certificar Safari físico.
- `node scripts/audit-asset-inventory.mjs`: inventario; no sustituye revisar el render.

No iniciar navegadores competidores durante una medición de rendimiento ni certificar fuentes que siguen cambiando. Cerrar navegador, contexto y servidor al terminar.

## Informar sin confundir pruebas

Etiquetar cada evidencia como `ATLAS`, `ESCENA_CONTROLADA`, `PARTIDA_NATURAL` o `DISPOSITIVO_FÍSICO`. Incluir errores JS, peticiones fallidas, duración, resolución, memoria/FPS sólo cuando se hayan medido y límites. Mantener aceptación artística del propietario y Safari/iPhone físico pendientes hasta su revisión real.

Adaptación explícita del patrón inspección → acción → captura de Anthropic `webapp-testing` (Apache-2.0): conservar Node/Playwright/CDP existentes en lugar de instalar Python; revisar helpers terceros antes de ejecutarlos y esperar estados gráficos reales en lugar de imponer `networkidle`. Fuente íntegra y licencia en [copia fijada](../../../tools/third-party/skills/anthropic-webapp-testing/SKILL.md); procedencia en [revisión OSS](../../../docs/agents/OPEN_SOURCE_REVIEW.md).
