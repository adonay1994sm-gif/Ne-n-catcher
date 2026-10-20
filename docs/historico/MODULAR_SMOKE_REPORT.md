# Prueba funcional y lógica — Refactor modular V6.5

**Fecha:** 4 de agosto de 2026  
**Viewport:** 430 × 932 CSS px, DPR 2, entrada táctil  
**Canvas interno:** 720 × 1561 px

## Prueba funcional en Chromium

Se cargaron el HTML, CSS, los cuatro scripts públicos y los 56 assets reales en Chromium. El entorno bloqueaba la navegación a servidores locales, por lo que los recursos se suministraron directamente al navegador manteniendo el mismo DOM y el mismo código ejecutable.

Resultados:

- Menú principal visible y versión V6.5 correcta.
- Briefing del Sector 1 abierto correctamente.
- Inicio de expedición correcto.
- HUD visible con Sector 1, objetivo 0/30 y casco 100 %.
- Entrada táctil procesada.
- Pausa y reanudación correctas.
- 56 assets cargados.
- Cero errores de JavaScript o Canvas.

La captura de control interna mostró la nave, núcleos, planeta, fondo y HUD renderizados con sus assets reales.

## Prueba lógica instrumentada

Se ejecutó el mismo bundle generado con los puntos de prueba de la batería original:

- Migración V1 → V2 idempotente: aprobada.
- Objetivos, velocidades y frecuencia de aparición: sin cambios.
- SHA-256 de la silueta de colisión: `997fed2f9a050e08eca8c68d0b43486bc2f67a3243519e4f425bfb928ebb4841`.
- 10.000 formaciones S6–S10: aprobadas.
- 50.000 amenazas aleatorias: 23.219 invasiones iniciales detectadas y retiradas; cero invasiones residuales.
- Amenaza dentro del corredor retirada antes de causar daño: aprobada.
- Sector 10: suministro 207 y presupuesto de 5 habilidades.
- Reacción de daño y salida del frame 05: aprobada.
- Secuencia de destrucción y ocultación de nave: aprobada.
- Continuación única, casco 35 %, limpieza de residuos y escudo: aprobada.
- Protección inmediata tras reaparición: aprobada.
- Recompensa web únicamente tras evento confirmado: aprobada.

## Límite externo

No se compiló un IPA ni se ejecutó en un iPhone físico. Esas pruebas siguen requiriendo macOS/Xcode o Codemagic y TestFlight.
