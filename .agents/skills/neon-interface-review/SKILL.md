---
name: neon-interface-review
description: Diseñar y revisar HUD, tutoriales breves y taller C9 de NEON CRONIUM con interacción clara, foco accesible, pausas fiables y animación discreta. Usar cuando cambien controles, paneles de compra o ayudas iniciales, junto al pipeline visual existente.
---

# Interfaz de vuelo y taller

Leer `AGENTS.md`, el último cierre y [producción](../neon-production/SKILL.md). Aplicar esta guía a los elementos DOM existentes sobre Canvas. La referencia fija de GitHub está en [revisión OSS](../../../docs/agents/OPEN_SOURCE_REVIEW.md). No instalar React, Framer Motion, Headless UI ni otro reloj para reproducir sus ejemplos.

## Mantener el vuelo comprensible

1. Usar botones nativos con nombre visible, foco reconocible y área táctil mínima de 44×44 CSS px como decisión del proyecto. WCAG 2.2 AA 2.5.8 usa 24×24 con excepciones; no atribuirle incorrectamente los 44 px.
2. Conservar posiciones estables, zonas seguras y dos contactos separados para pilotar/disparar. Un tutorial no captura el dedo de vuelo ni se superpone a la nave o a un peligro. Enseñar una acción breve tras otra y permitir repetirla en ayuda.
3. No depender sólo del color: arma, precio, disponibilidad y resultado de compra tienen texto o silueta reconocible. El dibujo ilustra el módulo, el DOM conserva cifras dinámicas.
4. Usar el progreso real de ruta para indicadores y mensajes de etapa. No crear un segundo contador que continúe en pausa o detrás del taller.

## Abrir y cerrar C9

1. Abrir desde un acceso HUD identificado; guardar el elemento que lo abrió y limpiar los contactos activos para impedir disparos o desplazamientos al cerrar.
2. Pausar mediante el estado existente antes de abrir. No avanzar ruta, daño, batería ni ataques mientras el taller está abierto. Reanudar sólo al cerrar explícitamente; segundo plano conserva la pausa.
3. Dar al panel `role="dialog"`, `aria-modal="true"` y título asociado; mover el foco al panel o a una acción segura. Contener Tab/Shift+Tab en sus controles visibles; Escape vuelve al vuelo con la misma ruta de cierre. Restaurar foco al botón C9 al cerrar.
4. Mostrar saldo, coste, mejora actual y efecto de la siguiente. No equipar, comprar o cobrar por el mero hecho de abrir el panel. Confirmación con `role="status"` y transacción idempotente del sistema actual; evitar anunciar el saldo en cada frame.
5. Mantener un cierre visible, una zona desplazable a 320×568 y controles accesibles al aumentar texto. Si falta espacio, desplazar el contenido del panel sin mover los controles del vuelo.

## Animar para comunicar

- Respuesta de pulsación de 100–150 ms; apertura de panel de aproximadamente 200 ms son decisiones iniciales revisables. La interacción está disponible durante la transición.
- Animar preferentemente `transform` y `opacity`, sin duplicar RAF ni bloquear entradas con temporizadores.
- Respetar la opción de efectos reducidos y `prefers-reduced-motion`; al reducir animación, mantener comprensión de compra y equipamiento mediante texto/estado.
- No convertir toda modificación visual del taller en un balance o cambio de colisiones. Preservar guardados, recibos y campañas antiguas.

## Comprobar la integración

Usar [QA visual](../neon-visual-qa/SKILL.md) con el paquete congelado. Verificar entrada, foco, Escape, retorno, scroll y compra real a 390×844 y 320×568; mantener pulsado el disparo antes de abrir y confirmar que queda liberado. Medir progreso antes/después de la pausa y reanudación, y comprobar que el efecto comprado se ve al volver al vuelo. Registrar teclado/Chromium aparte de VoiceOver y Safari físico, que exigen dispositivo real. Una skill no certifica accesibilidad completa por sí sola.

Adaptación de `interaction-design` y `accessibility-compliance` de Seth Hobson, MIT, commit `0874a27b17a22e2b7c2e2bcd725768e0803cad06`. Fuentes y licencia íntegras en `tools/third-party/skills/wshobson-ui-design/`. Se adoptan propósito del movimiento, navegación/foco y claridad de estados; los fragmentos React originales son referencia, no dependencia ejecutada.
