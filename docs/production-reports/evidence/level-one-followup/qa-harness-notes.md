# QA de seguimiento · fuentes listas y congeladas

2026-10-18. Propietario: agente `render_combat_followup`. No se inició Chromium, compilación, commit ni publicación. Fuentes listas para ejecutarse cuando root congele todos los propietarios y produzca un paquete limpio con SHA completo.

## Archivos

- `scripts/chapter-one-browser-smoke.cjs`: piloto natural adaptado.
- `scripts/current-level-visual-smoke.cjs`: nuevo harness controlado de doce comprobaciones (seis por viewport).

## Piloto natural

Mantiene contexto fresco, reloj real, entrada manual, movimiento mediante input, adquisición física de chatarra y pieza, sin inyectar HP, progreso, recompensas o entidades.

- Apertura: comprueba `in-world` por su comportamiento real (sin bloqueo ni fondo cinematográfico), nave108.16 y estaciónChronos dibujada. `--skip-intro` se conserva como argumento compatible pero registra que ya no necesita acción.
- C9: abre el botónHUD por primera vez cuando ya recuperó el emisor y ganó≥24 chatarra. Comprueba pausa, foco, tiempo/items/armas/casco/refuerzo idénticos después de250ms; compra24 medianteUI, compra repetida deshabilitada y reanudación sin salto>0.5s. Ya no espera paradaorbital ni `waitingFor:service`.
- Atlasv6: observación de velocidad y anticipación limitada de tiro contra núcleo móvil; exposición3.8s, tresmisiles reales. No escribe posición de boss o jugador: todo movimiento natural sigue mouse/CDP.
- Registra serie temporal de boss/enemigos cada2s, sonidos reales`playedByCue`, filas2/3 del atlas de explosión y captura del impacto.
- Exige audio real enemigoPhaser y pesadoAtlas, movimiento lateral>50logicalpx, blast/restos dibujados, victoria y persistencia únicas. Si el piloto falla, registrar su error; no transformarlo en una partida sembrada.

Comando:

`node scripts/chapter-one-browser-smoke.cjs --root PAQUETE_LIMPIO --output EVIDENCIA_NUEVA --expected-commit SHA40 --timeout 900000`

## Escenas controladas

`node scripts/current-level-visual-smoke.cjs --root PAQUETE_LIMPIO --output EVIDENCIA_NUEVA --expected-commit SHA40`

390×844 y320×568, seiscomprobaciones porperfil:

1. Apertura realChronos, sinlámina cinematográfica y controles44px separados.
2. C9HUD desde fixture declarado etapa3, casco62/reserva12,48chatarra y1misil; pausa/foco/Tab/Escape, comprarefuerzo30 yrecargadosmisiles12. Cada mejora tiene fondoilustrado CSSvisible. La fixture no se presenta como dinero ganado.
3. Atlas96HPv6 moviéndose mediante modelo real y sonidos reales basic/heavy en `combatSfx`.
4. CLOSED/OPENING/EXPOSED, controles separados y guardián sinrecortar/superponerHUD. Los contornos se calculan leyendo alpha>8 de losframes realmente decodificados del atlas; no se usa una caja inventada ni se confunde artboardpadding con píxelesvisibles.
5. Misil real de18daño: emisión noinstantánea, vuelo y avance de update/collision hasta contacto, expansión y restos. Esta escena explícita alinea al jugador y limpia proyectiles enemigos; no es balance natural.
6. Resolución mediante hits aceptados por modelo, epílogoIria legible y reinicio una vez del único RAF legacy.

Se detiene expresamente el RAF legacy para las escenasAtlas controladas y se reinicia al final; no hay segundo RAF. Se conservan hashes del paquete y del script usado. APIdeQA se inserta sólo en respuestaHTTP temporal. Las imágenes son del renderer real con fixtures, no ilustraciones sustitutivas.

## Comprobaciones ejecutadas

`node --check scripts/chapter-one-browser-smoke.cjs`

`node --check scripts/current-level-visual-smoke.cjs`

`git diff --check -- scripts/chapter-one-browser-smoke.cjs scripts/current-level-visual-smoke.cjs`

Las tres terminaron código0. Navegador pendiente de autorización de ejecución tras congelar fuentes. Los scripts antiguos `chapter-one-visual-smoke.cjs`/`specialist-game-smoke.cjs` siguen conservados como historial, pero esperan introcinemática/nave83.2/paradaorbital y no corresponden al contrato de este lote.

Fin de escritura de ambos scripts. Disponibles para root.

## Offline actualizado y congelado

Archivo adicional `scripts/chapter-one-offline-smoke.cjs`: conserva siete checks, N7 directo, claves históricas/protecciones y migración idempotente autenticada del esquema antiguo ya realizado por el paquete previo99.

- Los nueve recursos comprobados offline sustituyen introretirada por `c9_upgrade_icons_v1.webp`1024×1024; banco/MAPv2 AAC15.96s. Se verifican hash/bytes/decodificación y respuestaSWreal.
- Comprueba dentro de generaciónactual de cache: introretiradaausente, iconosC9yAACv2presentes. Cacheajeno/guardados/retirada de antiguasgeneraciones permanecen.
- El contexto frescooffline usa Chronosdestructionreal, no lámina, sinbloqueo/salto; abreC9desdeHUD con foco, noheal, vuelve a pilotar. No espera acoplamiento orbital.
- `node --check scripts/chapter-one-offline-smoke.cjs` y `git diff --check -- scripts/chapter-one-offline-smoke.cjs`: código0. No navegador.

Comando:

`node scripts/chapter-one-offline-smoke.cjs --root PAQUETE_LIMPIO --previous /tmp/neon-specialist-playtest-99bf90b --previous-commit 99bf90b22a61cfd287393338fc55f65f3ba057a1 --output EVIDENCIA_NUEVA --expected-commit SHA40 --timeout 120000`

## Chromium autorizado · paquete limpio da3f4b8

SHA funcional exacto: `da3f4b839744940fee1032a8b637d5c3266c862f`; raíz inmutable `/tmp/neon-level-one-playtest-da3f4b8`.

Intentos conservados:

- `visual-da3f4b8-01`: root ejecutó el fixture inicial; fallo preparando Atlas porque avanzó la ruta1.10 sin esquivar amenazas ambientales, casco0 a352.288s.
- `visual-da3f4b8-02`: supresión inicial de hazard/spawn, pero los callbacksstage-start/departure de la primera actualización restablecieron timers; mismo fallo de fixture.
- `visual-da3f4b8-03`: supresión en cada tick de preparación resolvió lo anterior; fallo de audio de fixture porque congeló el RAF antes de su primer`updateScore` y banco permaneciópausedtrue.
- `visual-da3f4b8-04`: se sincroniza `updateScore(0,false)` tal como haría el frame normal antes de detenerlo. **12/12 aprobadas, código0,10485ms,22capturas auténticas.** Script usadoSHA256`7747dead2425c9cdc6c947bfa662e0e8fe0f4d2ccae7b28db1fdce8fa179b6c7`. Ningún runtime/paquete modificado por corregir fixtures.

Comando exacto final:

`node scripts/current-level-visual-smoke.cjs --root /tmp/neon-level-one-playtest-da3f4b8 --output docs/production-reports/evidence/level-one-followup/visual-da3f4b8-04 --expected-commit da3f4b839744940fee1032a8b637d5c3266c862f`

Muestras audio de cada perfil: atlas-charge1,enemy-phaser1,enemy-heavy1. Posesclosed/opening/exposed deAtlas320×568: parte pintada superior124.60/122.88/130.28px contraHUDbottom117px, sinrecortehorizontal. Perfil390×844 también pasa. Se verifican poses muestreadas, no cada instante infinito del combate.

Inspeccioné en disco tres capturas320: Atlasexposed,misilblast yC9comprado. Atlas queda completo con margen sobreHUD; explosión tiene arte azul/naranja y fragmentos, no sólo un círculo. C9 muestra cuatrodiseños yscrollvertical; tras clicar reposición está desplazado hacia abajo y el encabezado queda fuera del recorte, pero acciones permanecen visibles. Esto no equivale a aceptación estética/dispositivo.

Chromium/contexto/servidor cerrados al completar. Root informado para ejecutar la partida natural. Fuentes del harness congeladas.

## Cierre integrado del integrador

La autorización de ejecución referida en las notas anteriores era coordinación entre agentes, no una aprobación pendiente del propietario. Navegador natural final4/4 (548.090ms), offline7/7 (39.294ms), QAvisual04 final12/12 y HTTP privado16/16; todos sobre paquete da3 limpio. Evidencias en las carpetas homónimas y cierre en `../../LEVEL_ONE_DYNAMIC_2026-10-18.md`. Los fallos anteriores permanecen sin reetiquetar y el paquete no se modificó al corregir fixtures.
