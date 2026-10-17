# DIAGNÓSTICO — VUELO UNIFICADO

Fecha: 17/10/2026. Rama: `continuity-assets-audit-20261013`. SHA inicial: `9c744da4957d776b80940fee2f323a3f4a3ad194`.

El menú dividía la experiencia entre clásico, Journey y N-7. El viaje corto fundía fondos; el clásico conservaba movimiento horizontal y tres disparos no recargables. Se conservan las variantes y sus guardados; el clásico se convierte en entrada principal con sistemas reutilizados del director N-7 y rescate/taller dentro de su recorrido. No se asigna equivalencia numérica entre los guardados de las campañas.

## Incremento implementado, pendiente del cierre de QA

- Chronos → baliza de Gaia: ataque identificado, ruptura, recuperación y salida de órbita, tránsito y aproximación con una única posición de ruta. Mínimo 90 segundos jugados, cuota real de CRONIUM y llegada como condiciones conjuntas de victoria. El origen pierde escala/posición; no se funden dos pinturas.
- Tres cargas iniciales; una carga cada 3,6 segundos jugados. Pulso central físico y emisor gemelo rescatable, instalación gratuita explícita en C9, pieza persistida en clave nueva y anclajes ilustrados bajo las alas. Atlas mantiene su enlace de pulso ilimitado ya existente durante el encuentro.
- Movimiento relativo táctil XY, captura de un dedo y límites del casco calculados contra HUD/controles. Colisión estable conservada. Patrullas legibles y tres cruces diagonales de cometa, señalizados y duraderos.
- Una entrada principal. Journey y N-7 siguen recuperables en un archivo de QA cerrado. Esto no equivale a fusionar sus cien rutas en cien etapas canónicas terminadas.

## Recursos reales

Maestros, procedencia, pipeline y metadatos: `art-source/unified-flight/`. Runtime: `assets/chronos_flight_atlas_v1.webp` (1536×1024,314136B), `assets/chronos_flight_weapons_v1.webp` (1536×512,84948B), `assets/chronos_flight_space_v1.webp` (768×1152,109484B). Total508568B, memoria RGBA estimada12976128B. Atlas con6objetos/estados, arma con3poses auténticas. Inventario76archivos y6747610B, catálogo153registros manteniendo los150históricos. Aceptación artística y física pendientes.

## Primer diagnóstico posterior

Build correcto. Certificación inicial guardada en `evidence/unified-flight/certification-01/results.json`: motor, arquitectura, static, render/adaptadores, audio, arte e inventario correctos; contenido133/141, regresión y web fallaron. Ocho fallos proceden del DOMRect incompleto de un fixture antiguo; se investiga además el contrato de disparo actualizado. Detectado y corregido el retorno booleano perdido de `fireManualShot` en la nueva rama. Se conservan los resultados fallidos. Falta repetir las suites, completar pruebas naturales y publicar el paquete nuevo. No existe todavía un nuevo despliegue de esta revisión.

## Límites

Solo la primera misión tiene nuevo viaje geográfico. Los otros nueve escenarios y Atlas previos se conservan, no se declaran rehechos. Cien etapas completas, otros jefes, audio final, reentrada exacta a mitad de combate, balance humano y Safari/iPhone físico siguen pendientes. EngineV1 continúa desactivado y el RAF legacy conserva la propiedad del ciclo.

## Continuación exacta

Corregir fixtures sin reducir cobertura; ejecutar `test:content`, regresión, web y certificación en carpeta nueva. Probar el recorrido por controles reales hasta rescate→llegada→C9→instalación→Gaia. Revisar capturas de montaje, aviso de ataque, HUD y las tres resoluciones. Commit funcional, paquete limpio con SHA/hash, prueba privada y cierre documental.

Actualización del hito de conservación: rebuild03 y regresión33/33 aprobados; integración nueva9/9, Atlas legacy8/8 y web13/13. Chromium y repetición integral todavía pendientes.

## Cierre automatizado provisional

Certificación02: once fases aprobadas, contenido150/150, motor40/40, arquitectura6/6, static13/13, regresión33/33, web13/13, render/adaptadores14/14, audio3/3, artpass12/12 e inventario sin inconsistencias. Chromium layout05:12/12 en390×844,320×568,844×390; sin errores y un único RAF. El navegador02 descubrió dos variables de cometas no declaradas que JSDOM no detectó; corregidas en57b468d. Se conservan todos los intentos fallidos y aprobados. Partida natural pendiente antes de publicar la revisión privada.
