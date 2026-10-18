# Atlas v6: entrega congelada

Fecha: 2026-10-18. Base de asignación: d4b08dcb2f22268944aa73fc4b71bca5f3496c7e. Árbol compartido en curso; resultados de modelo, no certificado de un SHA final ni navegador.

## Archivos exclusivos modificados

- `src/game/combat/guardian-atlas.js`
- `tests/guardian-atlas.test.mjs`

Fuentes **CONGELADAS** al entregar. No build, certificados, navegador, manifests, pipeline, renderer, economía o guardados modificados por este especialista.

## Causa y cambio

v5 interpolaba posición sólo en CLOSED durante 0,7 s, después congelaba el cuerpo mientras cargaba, disparaba y exponía núcleo. Rutinas perpetuamente básica/media/potente. v6 conserva96HP, collider/core y contratos externos, mueve la posición física `boss.x/y` en todos los estados vivos de combate, con destino de flanqueo derivado de semilla y muestras limitadas del jugador. Los disparos de cada ráfaga se emiten desde el anclaje físico actual; dirección balística se fija al emitir, no persigue la nave después.

Nuevos datos locales serializables: `motionX/Y`, `motionVx/Vy`, `motionSide`, `motionDecision`, `nextMotionAt`, `attackDecision`, `attacksSinceSuperpower`. No nuevo propietario de reloj, RAF, almacenamiento o recompensa. Punto de control de jefe mantiene política previa de reinicio del encuentro; no cambia versión de guardado.

Observación cada0,22s; aceleración máxima200px/s²; velocidad horizontal108fase1/132fase2; vertical26; núcleo expuesto barre32fase1/38fase2px/s (con deceleración suave al entrar). Todas las posiciones respetan bordes de cuerpo y margen. Cambio de fase sigue movimiento; desactivación detiene movimiento definitivamente y entrega un único recibo como antes.

Los tres primeros ataques de cada fase introducen rutinas (fase1 básica/media/potente, fase2 media/básica/potente). Después: posición lateral o velocidad observada>=85 selecciona intercepción media; posición central alterna presión básica/media; reactor exige potente después de tres rutinas no potentes. El jugador puede aprender las rutinas sin que toda la batalla sea la misma secuencia. No retícula, línea futura ni corredor seguro almacenado.

Ritmo: reposo0,85s (antes1,05), exposición3,8s (antes4,2), proyectiles básicos/medios460fase1/520fase2 (antes380/420); potente conserva300/325 y22daño.96HP se mantienen. Apertura espera a que TODOS los proyectiles hayan rebasado la cola ampliada56px y margen0,12s. Daño al núcleo sólo EXPOSED; daño continuo no prolonga ventanas.

## Integración requerida

API existente se conserva. Renderer debe usar `boss.x/y` tanto para cuerpo como núcleo (ya lo hacía). Colisiones deben usar las mismas coordenadas. Eventos `volley` añaden `x/y` del anclaje actual; `warning` añade `decision` además de sus datos mecánicos antiguos. Son datos, no autorización para mostrar trayectorias futuras. Cada proyectil conserva `projectileId` estable y único. `GUARDIAN_ATLAS_RULES.version` ahora `guardian-atlas-v6`; no hay consumidores de los campos antiguos `patrolFromX/ToX` o `repositionSeconds`, retirados del modelo.

Root es propietario del aumento de nave30%, misil18, integración legacy, audio y browser. El modelo prueba escape con una envolvente deliberadamente conservadora ampliada30% frente a la anterior de40% para coordinar la petición nueva. Es simulación, no cambio de geometría por este agente.

## Pruebas reales ejecutadas

- `node --test tests/guardian-atlas.test.mjs`: intento inicial21/23, fallos preservados en `/tmp/neon-atlas-dynamic-initial.txt`: versión v5 obsoleta y contrato antiguo que exigía inmovilidad. Ambos sustituidos por versión actual y comprobación explícita de movilidad en todos los estados.
- Segundo intento25/26, `/tmp/neon-atlas-dynamic-second.txt`: la comprobación de reacción elegía el PRIMER hueco seguro enumerado a la izquierda, aunque hubiera uno cercano; al aumentar velocidad de tiros ese hueco lejano ya no era alcanzable. Se conserva comprobación completa de corredor y alcance, seleccionando el hueco genuinamente seguro MÁS CERCANO, no eliminando aserciones.
- Tercer intento26/26, `/tmp/neon-atlas-dynamic-third.txt`.
- Modelo+animación antes del cierre40/40, `/tmp/neon-atlas-dynamic-fourth.txt`.
- Cierre: `node --test tests/guardian-atlas.test.mjs tests/guardian-atlas-animation.test.mjs` **42/42, exit0**, registro `/tmp/neon-atlas-dynamic-final.txt`:28modelo+14animación. Comprueba100semillas, bordes280/320/390/720, aceleración/velocidad/sin saltos, estados físicos vivos, fase2 y shutdown, origen real de cada ráfaga, decisiones adaptativas, pausas, eventos únicos, proyectiles sin homing, escape de contorno completo y derrota manual con movimiento.
- `git diff --check -- src/game/combat/guardian-atlas.js tests/guardian-atlas.test.mjs`:exit0.

## Métricas del robot de modelo (no partida natural)

Con misil18 ya incorporado por root durante la integración: Pulso70,75s/casco78%, Gemelo52,52s/casco78%, Pulso+3misiles33,85s/casco100%. El robot observa proyectiles emitidos, reacciona cada0,16s y se mueve a720px/s; no predice azar futuro. Seguir al núcleo y disparar sin esquivar falla a23,60s con69HP restantes del jefe y casco<=0. Demuestra obligación de esquiva y viabilidad técnica; no certifica diversión o dificultad humana.

## Límites

Falta revisión del ejecutable, capturas/partida natural, mezcla/sonido de ataque integrado, legibilidad y separación HUD a320×568 y aceptación humana. Las comprobaciones de modelo no prueban rendimiento ni Safari físico. La movilidad no crea por sí sola animación mecánica nueva; esa producción pertenece al renderer/arte. No atribuir este lote a más HP o a una certificación final del nivel.
