# DIAGNÓSTICO

18/10/2026. Rama `continuity-assets-audit-20261013`. SHA inicial y remoto comprobado: `50bc9caafccedd7469e932ba26e533065e688120`. Runtime previo publicado: `f634a4635c4faacd33d19390706e0a97d1198662`; no se retrocedió ni descartó avance. El propietario pidió especialistas, skills útiles y mejoras integradas del primer nivel.

Defectos reproducidos: Atlas tenía celdas fraccionarias y extremos cortados; CRONIUM combinaba recorte rectangular del bisel y un fragmento con negro opaco; las llamas se ensanchaban al montar el par; el misil transportaba su lanzador y no reproducía sus estados finales. Los efectos de combate dependían principalmente de tonos simples. La investigación de herramientas no justifica instalar otro motor o framework.

# INFORME DE PRODUCCIÓN — SPECIALIST POLISH

Estado: **IN_REVIEW; integración técnica y partida completa aprobadas; revisión artística/física pendiente**. SHA funcional publicado y paquete limpio: `99bf90b22a61cfd287393338fc55f65f3ba057a1`. El SHA de cierre documental se consulta en el commit que modifica este informe; no se inventa un hash autorreferente. Este documento sustituye las siguientes prioridades de acabado, conserva el [cierre anterior](CHAPTER_ONE_LIVING_JOURNEY_2026-10-18.md) como historial y no declara terminado el primer nivel.

## Experiencia y cambios

Seis especialistas de sesión, coordinados por un integrador: arte Atlas, arte CRONIUM, propulsión, audio, investigación de skills y QA. Once departamentos definidos en [equipo](../agents/SPECIALIST_TEAM.md), no once procesos permanentes. Dos skills locales validadas y utilizadas; fuentes OpenAI/Anthropic fijadas, Apache-2.0. Pixelmatch ISC sólo en tooling QA, sin dependencia runtime. No reentrenamiento ni ejecución fuera de la sesión.

Atlas v2: ocho poses2048×1024, celdas512 enteras, pivote común y margen; coraza realmente cerrada durante ataque. Apertura/cierre depende de coreExposure existente; el animador no emite ataques. El tamaño del artboard se compensa1,25× por el padding, sin cambiar hitbox, posición del núcleo o reglas. No se afirma animación esquelética: hay poses distintas compuestas.

CRONIUM v2: cuatro corrientes ilustradas de energía512×512, celdas256,8fps; sin bisel/fragmento opaco ni recorte rectangular. Mismo radio de recogida y escala visual clásica50%; halo compartido.

Propulsión: dos chorros con aspecto original y raíces en boquillas, tanto Aster como Bastion/mezclas, manteniendo nave40% y balanceo. Misil: sólo cuerpo en vuelo; lanzamiento4–7 se conserva como referencia de autoría, impacto8–11 y restos12–15 reproducidos en el sistema existente sin nuevo daño/recompensa.

Audio: banco original de8familias×2variantes,16stems y maestroPCM24; AAC241.003bytes. Phaser, misil, impactos metal/plasma, casco, destrucción, carga y colapsoAtlas. Un AudioContext, máximo8voces y presupuesto de ganancia, pausa/mute/volumen; fallback sólo cuando el banco no está listo. Corregido enlace del deslizadorFX con el nuevo bus. No se ha producido música nueva ni instrumentos grabados; se conserva la música anterior. Audición humana pendiente.

## Conservación e integración

Fuenteslegacy01/02/03/04/07/08, modularship, animador/mapas, entry de contenido, manifests, precarga/SW y bundles regenerados por pipeline. Recursos anteriores/maestros conservados. Clásico, N7/Journey, claves, recibos y economía permanecen. La corrección de composición del motor se aplica deliberadamente al renderer modular compartido, también en menús y campañas históricas; su escala/control/guardados no cambian y N7 se comprueba offline. No cambios en dificultad, física, progresión, HP o duración del viaje; no otros nueve niveles. USE_ENGINE_V1=false y único RAF. No main/PR3/forcepush/producción/tiendas/pagos.

## Pruebas y evidencias

- [Certificación local02](evidence/specialist-polish/certification-02/results.json): once fases, todas salida0: `npm run build`, `test:engine`60, `test:architecture`6, `test:content`617, `test:static`13, `npm test`34, `node tests/run-v7-web-tests.mjs`13, adaptador reservado14, audio existente3, visual12 y auditoría inventario96. El registro identifica HEAD50bc9ca con árbol sucio; bundles/exports iguales se guardaron en99bf90b. No se atribuye retrospectivamente un árbol limpio a ese intento.
- `npm run build:preview` y `npm run test:preview`: paquete99bf90b limpio,23/23. [Logs](evidence/specialist-polish/build-preview.txt).
- [Chromium integrado02](evidence/specialist-polish/game-02/results.json):12/12,390×844 y320×568,46capturas reales controladas,17.326ms total, sin erroresJS/consola/peticiones. Misil desde UI, banco AAC real, pausa/mute sin fallback beep, banco máximo observado3voces, celdas enteras y hashes intactos. Las escenas aceleran o insertan elementos para revisar estados: no son partidas naturales.
- [Actualización real F→99 y offline04](evidence/specialist-polish/offline-04/results.json):7/7,37.856ms; nueve recursos decodificados/consultados offline por el SW nativo, cachés anteriores retiradas, monedero histórico con respaldo y migración idempotente, progreso/módulos conservados, N7 y arranque fresco. El fixture tiene cero dinero/compras; no se presenta como economía ganada.
- [GitHub Actions39126299949](https://github.com/adonay1994sm-gif/Ne-n-catcher/actions/runs/39126299949): **completed/success** sobre99bf90b exacto, Node22.13.0. La ejecución local usa Node24.19.0; ambas quedan identificadas.
- `python3 tools/third-party/skills/openai-skill-creator/scripts/quick_validate.py .agents/skills/neon-production` y equivalente `neon-visual-qa`:2/2 válidas; nueve hashes upstream comprobados. [Evidencia](evidence/specialist-polish/skill-validation.json).
- `node --test tests/visual-polish-assets.test.mjs`:6/6; `node scripts/specialist-visual-assets.mjs --root . --output /tmp/neon-specialist-assets-20261018-01`: Chromium real, cuatro poses de energía/ocho deAtlas, composición negro/gris/blanco y diffs Pixelmatch. Es QA de atlas, no juego. [Resultados](evidence/specialist-polish/asset-qa/results.json).

Errores conservados y corregidos: certificación01 falló en caché antigua/fixtureCRONIUM viejo; se cambiaron contratos manteniendo aserciones y añadiendo comprobaciones de recursos nuevos. Offline01 exigía elSHA49 anterior a la webF; se añadió `--previous-commit` exacto y validación de paquete previo limpio. Offline02/03 esperaban que el monedero histórico siguiera sin migrar antes de la actualización; F ya lo migra. Se verifica el respaldo y la normalización reales en F, luego sus bytes al reemplazar sólo cachés, y después la idempotencia en99. No cambió el monedero del juego. La primera captura controlada de energía quedó encima deChronos; sólo se movió el fixture y se repitió todo en02. Intentos previos conservados, sin atribuir sus fallos al producto.

[Partida natural99bf90b](evidence/specialist-polish/natural-99bf90b/results.json): **4/4**,469.492ms (7min49,492s), Chromium con entradas CDP. Recorre apertura/tramos1.1–1.10, dos contactos simultáneos, recogida de36orbes y chatarra física, compraC9, Atlas96HP, epílogoIria y reload. Sin inyección de vida/dinero/progreso, sin acelerar el reloj ni resolver el jefe por fixture.166disparos manuales aceptados,3misiles,18enemigos/drops/recibos y un impacto sufrido. Atlas88,5328s de modelo, 100casco+8refuerzo al terminar.729chatarra ganada−24gastada=705saldo; recompensa600 deAtlas una sola vez. Gaia2 y Gemelo desbloqueados; guardado/recibos sobreviven reload. Un RAF,0JS/consola/peticiones fallidas. Son entradas automatizadas expertas, no evaluación de diversión o dificultad humana. Capturas naturales15conservadas aparte de las46controladas por ejecución.

## Rendimiento y límites

Recursos nuevos: Atlas656.550bytes/8MiBRGBA; CRONIUM72.176bytes/1MiBRGBA; AAC241.003bytes/2.626.560bytesPCMFloat32 estimados a48kHz; JSON de cues registrado aparte. Catálogo168 entradas e inventario96 archivos: incluyen históricos/metadata y no son porcentajes de producción. No estimar memoria total con sólo el peso WebP. Quedan revisión humana de estética/mezcla/balance y Safari/iPhone físico.

## Siguiente tarea exacta

Finalizar QA y publicar este lote revisable; después revisar con el propietario contornos, propulsión y sonidos. Mantener abiertas animación mecánica continua, daño ilustrado modular, presentación C9 pequeña y escenarios exteriores independientes de los otros territorios. No multiplicar un estilo aún pendiente de aceptación por cien etapas.

## Galería y paquete privado comprobado

[Galería antes/después](evidence/specialist-polish/GALERIA.md) y [visorHTML](evidence/specialist-polish/index.html). Incluye Atlas antesf634a46/después99bf90b a390×844, CRONIUM, propulsión y misil. Capturas del render real instrumentado, no conceptos. Las imágenes aisladas de atlas se etiquetan aparte. Las escenas antes/después no están sincronizadas píxel a píxel.

[Web privada21]((web privada antigua, retirada)), fuenteSite `187261541dd7cb9d56132a68d956fe6e08bc2ea9`; despliegue `appgdep_6ad4b8e8ba1481918e0abe714c0a2b1b` succeeded. Runtime99bf90b, revisión `3f9e88e523149b2d4e7a230ee532547d0f9b0bb2ee54f6b20a93b9980acd2e98`. [HTTP16/16](evidence/specialist-polish/site-http/results.json) verifica bytes remotos, no sólo accesibilidad. Acceso ownerprivado conservado, sin visitantes externos;146archivos protegidos fuera del paquete intactos. No se cambió producción Netlify ni se creó otra campaña/website público.

ZIP `/workspace/artifacts/NEON-CRONIUM-PULIDO-99bf90b.zip`:12.306.478bytes,132entradas, SHA256 `a2dfdc385de5acfffee883370ad5201acda057e98f5cff14fc4454f802084ad9`, comprobado sin errores de archivo. Abrir la web privada y pulsar CONTINUAR VIAJE; para una prueba aislada Netlify Drop, descomprimir y usar únicamente un sitio nuevo de pruebas (no producción), dejando `index.html`, `build-info.json` y `juego/` en la raíz. No se ha desplegado enNetlify. Ver [recibo de paquete](evidence/specialist-polish/package.json).

## Organigrama y límites de cierre

Registro único `docs/production-tasks.json`:355tareas históricas y actuales; catálogo168 e inventario96, nunca un porcentaje comercial. Lote: `P1-SPECIALIST-TEAM-01` DONE por skills validadas y seis especialistas efectivamente coordinados; Atlas, energía, propulsión/misil y audio IN_REVIEW con verificación técnica aprobada, aceptación artística y dispositivo separadas. No se declaran terminados los otros nueve niveles.

Abiertos: contraste blanco deAtlas sobreGaia, proximidad de transmisión en320×568, apertura todavía mediante composición de poses, daño modular ilustrado, montaje fijo de lanzamiento4–7 pendiente (no vuelve a viajar pegado al misil), C9con mucho scroll y territorios4–6 todavía por adaptar al exterior. Las mejoras corrigen defectos medidos, no certifican un juego de calidadAAA. La música anterior es original sintetizada; no existe nueva grabación orquestal.

Audio real decodificado enChromium:2.413.152bytes a44,1kHz, máximo observado3voces,0osciladores de fallback durante el ensayo de banco listo; presupuesto8voces. Las mediciones AAC previas son del banco aislado (pico−2,55dBFS/0clipping), no de toda la mezcla del juego. No se cronometró carga hasta primer frame ni latencia hardware. Sin FPS/memoria total certificados ni iPhone físico. Las duraciones anteriores son ejecuciones medidas; no se atribuyen horas totales no registradas.

## Archivos y cierre

[Lista completa de archivos y cambios del hito funcional](evidence/specialist-polish/files-changed-runtime.txt). Maestros nuevos bajo `art-source/atlas-repair-v2/`, `art-source/cronium-repair-v1/` y `art-source/audio/combat-sfx-v1/`; exportaciones en `assets/`. Nuevos módulos deaudio/skills/QA y cambioslegacy01/02/03/04/07/08, modularship, animador/mapa, entry, manifests, SW y bundles. No edición exclusiva de copias compiladas. Los dos scriptsQA se ajustaron después del hito sólo para identificar la versión previa y encuadrar el fixture; sus copias/hashes exactos se conservan en las evidencias, sin cambiar el paquete99.

SHA inicial50bc9caafccedd7469e932ba26e533065e688120; SHA funcional99bf90b22a61cfd287393338fc55f65f3ba057a1. SHA de cierre documental: resolver el commit que registra este informe con `git log -1 --format=%H -- docs/production-reports/SPECIALIST_POLISH_2026-10-18.md`; el hash de un commit que contiene su propio informe no se inventa. La cabeceraGitHub identifica ese commit. La web/ZIP siguen vinculados alSHAfuncional exacto, aunque después se publiquen metadatos y evidencia. CI del cierre documental se comprueba tras su push y se enlaza en la entrega al propietario.
