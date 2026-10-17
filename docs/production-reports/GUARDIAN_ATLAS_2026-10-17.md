# DIAGNÓSTICO — Guardian Atlas y campaña con sentido

Base local/remota inicial: `1be0d69c6474e0c8dea9c29342a1a61f4343f9fb`, rama exclusiva `continuity-assets-audit-20261013`. Árbol inicialmente limpio. Se conservan diez escenarios ilustrados, naves modulares, clásica y N-7. El propietario aportó referencias y pidió arte vivo, jefes con identidad y cien etapas progresivas. No había un combate Atlas real en la recuperación clásica de Gaia.

# INFORME DE PRODUCCIÓN — GUARDIAN ATLAS (WIP)

Fecha:17/10/2026. Estado de conservación: implementación integrada, QA natural pendiente. No es una certificación de cien niveles ni de dispositivo físico.

## Qué cambia en la partida

En Perímetro Atlas, recuperar45 fragmentos CRONIUM inicia el protocolo de contención del guardián. No se desbloquea la siguiente misión antes del combate. Entrada ilustrada, núcleo protegido/expuesto, salva fijada con aviso, ruptura de fase, doble cortina con corredor reservado para la nave completa, daño, desactivación y permiso de acceso. La recompensa se emite una vez y la victoria se persiste al terminar la animación de cierre. Atlas no es un meteorito dibujado ni un jefe pegado a la demo corta. La recuperación anterior se conserva.

El pulso básico ilimitado solo durante el encuentro puede ser automático o manual. Sus imágenes viajan hasta el núcleo antes de aplicar daño. Las demás misiones conservan su contrato de munición. Pausa detiene combate y disparos. Continuación recompensada conserva el jefe y da tiempo de reentrada; reiniciar rehace la misión. No se cambia la silueta de colisión.

## Arte producido realmente

- Maestro PNG 1774×887: `art-source/enemies/guardian-atlas/guardian-atlas-states-master.png`. Ocho poses distintas: llegada, núcleo abierto, preparación, fuego, daño, apertura de anillo, fuego fase2 y desactivación.
- Runtime `assets/guardian_atlas_states_v1.webp`, 801340 bytes.
- Maestro VFX PNG 2170×725: `art-source/enemies/guardian-atlas/atlas-combat-vfx-master.png`. Cuatro recursos diferentes; no se declaran cuatro fotogramas de una misma animación.
- Runtime `assets/atlas_combat_vfx_v1.webp`,1085×363, 135832 bytes. Proyectil rojo, pulso azul, impacto y retícula de aviso.
- Pivotes, recortes, procedencia y hashes: `art-source/enemies/guardian-atlas/metadata.json`. Generación real con herramienta integrada a partir de la referencia Gaia del propietario; no son prompts pendientes. Arte IN_REVIEW; aceptación del propietario pendiente.

Inventario:73 recursos,6239042 bytes, sin borrar recursos anteriores. Los dos atlas añaden7869572 bytes RGBA decodificados estimados (~7.5MiB); no es memoria medida de Safari. Carga perezosa al iniciar Gaia. Maestro sin gutters entre poses: revisar visualmente llamaradas y transiciones antes de aceptación final.

## Integración

Modelo puro `src/game/combat/guardian-atlas.js`, animador puro `src/game/animation/guardian-atlas-animator.js` y exportación por el runtime de contenido existente. Fuentes01/02/03/04/05/07/08 legacy, styles, loader, manifiestos, tres copias generadas web/iOS y SW actualizados mediante build. Un solo RAF legacy. `USE_ENGINE_V1=false`; módulos experimentales intactos. N-7 no inicia Atlas ni comparte su avance.

## Diseño de cien etapas

`design/campaign-space-v1.json` y `docs/design/CAMPAIGN_100_STAGES.md`: diez capítulos, cien etapas editoriales con lugares consecutivos, objetivos, amenaza, recuperación, historia, recompensa única, checkpoint y dificultad objetivo. Diez validaciones estructurales ejecutadas, no pruebas de gameplay implementado. Todas las etapas nuevas permanecen PENDING. El argumento/reparto son propuestas reversibles; Cronos Prime tiene cinco fases diseñadas, ninguna declarada combate implementado.

## Pruebas y fallos conservados

- Primera certificación local:11/11 comandos exit0, contenido 104/104, motor 40/40, arquitectura 6/6, static 13/13, regresión 33/33, web 13/13, render/adaptador 14/14, audio 3/3, artpass 12/12, inventario 0 inconsistencias. `evidence/guardian-atlas/certification-01/results.json`. Este corte precede al último arreglo de ralentización.
- Fixtures focalizadas:28/28 en el primer corte. Nueva regresión ralentización reprodujo fallo7/8 y pasa 8/8 después del arreglo. Registros before/after preservados en `evidence/guardian-atlas/focused/`.
- Preview 16/16, exit 0, incluye desbloqueo QA de niveles clásicos aislado del guardado normal y N-7.
- Chromium natural01 FALLÓ: el piloto murió recuperando20/45 fragmentos; aún no llegó a Atlas. Sin excepciones JS/HTTP ni RAF duplicado. No demuestra que la misión sea imposible ni que el jefe pase. `evidence/guardian-atlas/browser-natural-01/results.json` conserva muestras y captura. Se está corrigiendo el piloto y preparando otra ejecución completa sin inyectar tiempo, casco, recogidas ni enemigos.

Defectos corregidos: índice de array inválido cuando el último fragmento sustituye el campo de objetos; corredor medido con alas reales±109px; dos salvas mantienen el mismo corredor; el reloj del jefe y de sus proyectiles comparten ralentización; pulso aplica daño al llegar; HUD no reescribe texto idéntico cada frame. Próxima certificación debe incluir todas estas correcciones.

## Estado externo y continuación

Este commit de conservación no implica que el sitio privado ya sirva Atlas. La última versión privada sigue siendo la modular anterior hasta una publicación confirmada. No hay nuevo Netlify; producción y PR3 intactas. Repetir certificación final, partida natural completa y capturas pequeñas/horizontales, revisar arte, empaquetar y actualizar el sitio privado existente con SHA comprobable. iPhone/Safari físico pendiente. No abrir producción masiva mientras esta integración no cierre.

## Segundo cierre técnico antes de la partida larga

Commit de conservación publicado: `009e5299e1d0cad12fadde787060d658ae87bb3b`. El SHA remoto se comprobó antes del push; no había avances ajenos posteriores. No se tocaron main ni PR3.

`certification-02/results.json`: once fases código0, contenido **105/105**, motor40/40, arquitectura6/6, static13/13, regresión33/33, web13/13, adaptadores14/14, audio3/3, visual12/12, inventario sin inconsistencias. Incluye ralentización y arena adaptativa. Los cambios posteriores abrevian la etiqueta CRONIUM y ajustan espaciado del HUD pequeño; no cambian combate ni colisiones. Se verifican aparte por regresión focalizada, static, preview y Chromium visual.

Chromium natural02: recuperó **45/45**, casco76%, llegó a Atlas sin inyectar estado ni acelerar el reloj; terminó con **exit1 por timeout240s** del host, antes de completar al guardián. Sin errores JS/HTTP/consola ni RAF duplicado. No se etiqueta aprobado. Capturas y muestras en `browser-natural-02`.

Visual01 detectó margen insuficiente de la celda del sprite bajo el HUD: se mide ahora el panel real, se reservan extremos de los pivotes y se adapta la escala al espacio libre antes de la nave. Visual02 aprobó10escenas/3tamaños. La guardia de texto añadida en visual03 detectó SECTOR fuera de su caja a320px; CRONIUM A SALVO ya se abrevió a CRONIUM. Se reduce el espaciado solo en el combate a pantallas≤350px. Los resultados fallidos se conservan. Estas escenas son **CONTROLADAS**, preparan poses en la respuesta HTTP local y no prueban victoria natural. Horizontal es legible pero la franja vertical jugable deja al jefe pequeño; no equivale a aceptación estética de esa orientación.

Visual04 aprueba3/3perfiles y10/10capturas, incluidos textos del HUD. Cero errores JS/consola/HTTP, máximo un RAF; [capturas controladas](evidence/guardian-atlas/visual-04/results.json). Hash del bundle de preview: `25200ad0049a8bf269b825757efcf9cd37fb1b3a907e2ac58656fa28626887d2`. Después de abreviar CRONIUM y ajustar espaciado, regresión legacy8/8, static13/13 y preview16/16, todos código0. La siguiente partida natural larga se hará sobre un paquete limpio del commit funcional que contiene este cierre.
