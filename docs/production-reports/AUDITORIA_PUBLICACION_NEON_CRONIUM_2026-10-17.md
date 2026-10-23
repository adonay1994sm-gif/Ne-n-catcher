# DIAGNÓSTICO — NEON CRONIUM

**Decisión recomendada: continuar pruebas privadas; todavía no aprobar lanzamiento comercial.** Hay una base jugable y avances técnicos aprovechables. La campaña, la variedad de encuentros y el acabado audiovisual requieren bastante más producción. Los tests respaldan contratos concretos de funcionamiento; la diversión, el equilibrio y la aceptación del público necesitan una evaluación independiente.

Fecha: 17/10/2026, UTC. Rama: `continuity-assets-audit-20261013`.

SHA inicial de auditoría: `97220c8bd7f81e7108b6950b1402809ba4d0c9a9`, árbol inicialmente limpio. Durante la revisión llegó el commit remoto `de10d46431210e2691df1fcdd2f2fc72fd27a9a4`, inspeccionado y conservado mediante fast-forward sin descartar el trabajo local. Paquete jugado por los scripts: versión privada 11, commit limpio `207a94edf01eb26f5f4210429cf51a4497b1b6d7`, revisión `ddba1cb90abc61252af4e29f3bee23296ba5ea81887b608d9971a516a1df2838`. El paquete de juego publicado continúa siendo el mismo. El avance remoto añade cámara/compositor/HUD opcionales al motor reservado, su documentación y veinte pruebas; no modifica `src/game/`, assets, guardados ni la bandera de activación.

También se conservó el cierre documental/CI externo `b3e985f743a491d1f79d4eb5ce1d409f200a168b`. La rama avanzó durante la entrega; se reconciliaron ambas secciones de estado mediante merge controlado, sin force push ni pérdida del trabajo del motor. [Registro de conservación](evidence/release-audit-20261017/integration.json).

Esta entrega es una auditoría y una propuesta de metas. No modifica jugabilidad, arte, guardados, motor, sitio publicado ni decisiones comerciales. Los umbrales propuestos no son requisitos ya aprobados por el propietario, ni estadísticas de mercado, ni exigencias de Apple.

## 1. Qué se revisó y qué se pudo comprobar

- Fuentes de las campañas, generador/director, viaje, combate, jefes, nave, renderizado, audio, guardado, UI, PWA, Capacitor y configuración pública de publicación; informes y registro único `docs/production-tasks.json`.
- Inspección visual independiente de 19 capturas existentes y ocho capturas nuevas del diagnóstico de transiciones. Se separan los paquetes históricos de la versión actual.
- Prueba Chromium nueva `node scripts/compact-hud-browser-smoke.cjs --root preview-dist --output /tmp/neon-cronium-release-audit/browser-01`: **26/26 comprobaciones, salida 0**, cinco tamaños (390×844, 320×568, 390×714, 844×390, 1024×768), apertura de los diez escenarios clásicos, movimiento relativo, disparo, pausa/reanudación, reinicio y retorno al menú. Duración 155.172 ms; hashes del paquete intactos. [Resultados](evidence/release-audit-20261017/browser-01/results.json), [comando/log](evidence/release-audit-20261017/browser-01-run.txt), [arnés conservado](evidence/release-audit-20261017/browser-01/used-harness.cjs).
- Diagnóstico adicional `node /tmp/release-overlay-check.cjs`: **salida 0, 19 muestras**, inicio/reanudación/reinicio online y offline, con checkpoint 1.3 sembrado explícitamente. A +0,5/+2/+5 s los overlays ocultos tenían opacidad 0 y no se observó texto fantasma en las imágenes inspeccionadas; cero errores JavaScript y 118 archivos intactos. [Resultados](evidence/release-audit-20261017/overlay-01/results.json), [arnés](evidence/release-audit-20261017/overlay-01/used-harness.cjs).
- Tras conservar el avance remoto de motor, `npm run test:engine`: **60/60, salida 0**, cuarenta casos existentes y veinte nuevos de cámara/composición/HUD; [registro nuevo](evidence/release-audit-20261017/engine-latest-head.txt). Son pruebas aisladas del motor opcional y no una migración, demo visual o mejora automáticamente integrada en los diez escenarios.
- Fuentes oficiales de tres comparables, Apple Review, privacidad, TestFlight y requisitos del SDK. [Registro de fuentes](evidence/release-audit-20261017/sources.json).

Límites: la apertura de diez escenas no completa sus misiones. No se han vuelto a terminar todas las rutas N-7 ni los diez territorios en partidas naturales durante esta auditoría. El diagnóstico de overlays usa un fixture, no progreso ganado. No se compraron ni jugaron los comparables; se contrastaron sus prestaciones publicadas. No hubo iPhone/Safari físico, Archive de Xcode, benchmark de memoria/temperatura/FPS sostenidos ni envío a TestFlight/App Store. La certificación anterior de 11 fases/223 casos de contenido/CI se conserva como evidencia anterior identificada, sin presentarla como una nueva ejecución en esta revisión.

## 2. Estado real del juego

| Área | Existe y se puede aprovechar | Falta para la experiencia prometida |
| --- | --- | --- |
| Campaña | Diez territorios clásicos, diez etapas de transición dentro del primero y cien rutas experimentales N-7. | Cien etapas espaciales canónicas realmente integradas; N-7 tiene otra geografía y estructura. No sumar estos tres números como niveles finales. |
| Viaje | Chronos pierde escala, hay vacío, cometas, rastro, checkpoints, rescate, servicio C9 y aproximación a Gaia. | Validar ritmo con personas y extender continuidad geográfica al resto del recorrido. Nueve de diez cuotas del primer viaje siguen ligadas a recogida acumulada. |
| Combate | Tres armas tácticamente distintas, recarga, escudo ilustrado, CH-01 y Guardian Atlas con combate conectado. | Familias enemigas propias de cada mundo y el resto de guardianes con combate, animación, aprendizaje y resolución. |
| Nave/estación | Montaje modular, personalización de dos familias/tres slots, mejora de arma recuperable y C9 gratuita. | Distinguir cosmética de prestaciones: el montaje de nave actual es cosmético; las armas sí cambian reglas. No hay un mercado canónico completo. |
| Arte | Fondos propios, nave coherente, Chronos, Vulkar orbital y Atlas con mejoras reales. | La calidad del arte no es uniforme en integración: Gaia y territorios 4–10 dependen principalmente de una placa con deriva. La llegada a Gaia queda parcialmente detrás del HUD. |
| Historia | Incidente Chronos, búsqueda de CRONIUM, transmisiones y momentos contextuales ya enlazados. | Trama completa, consecuencias, guardianes territoriales y desenlace jugable. El diseño editorial de cien etapas no está importado como campaña runtime. |
| Audio | Volumen, silencio, lifecycle y tonos de efectos conectados a acciones. | Banda sonora y ambientación finales. La música actual se basa en tres osciladores sostenidos; no hay repertorio territorial/jefes equivalente a la visión. |
| Estabilidad | Guardados con claves independientes/validación/respaldo, dos dedos, un RAF, pausa y offline; suites y CI previas satisfactorias. | Validación humana, fallos parciales de escritura, dispositivos físicos, rendimiento sostenido y candidato nativo firmado. |
| Publicación | Proyecto Capacitor local, iconos, splash y configuración existentes. | Legales/contacto definitivos, decisión de anuncios/SDK, privacidad declarada, metadatos reales, beta autorizada y revisión de tienda. |

Confirmación importante del código: `src/game/03-ui-game-flow.js:366` restringe el jefe clásico a Gaia/Atlas. En N-7, `src/game/progression/generator.js` contiene datos de jefe, pero el director agenda oleadas/pickups y no conecta un combate a `plan.boss`; los nombres no acreditan diez jefes terminados. Ver [auditoría de contenido con referencias](evidence/release-audit-20261017/content-audit.md).

No se asigna un porcentaje comercial a la versión. Las cifras de tareas/archivos del registro miden sus criterios históricos y no la calidad del producto terminado.

## 3. Comparación por internet

Se usan declaraciones oficiales de desarrolladores/editoriales para comparar enfoque y prestaciones. No se deducen calidad táctil medida, retención, ventas o dificultad real de sus fichas.

| Referencia oficial | Enseñanza útil | Aplicación propuesta |
| --- | --- | --- |
| [Sky Force Reloaded](https://store.steampowered.com/app/667600/Sky_Force_Reloaded/?l=english) | Quince etapas, rescates, aeronaves y mejoras muestran un alcance de campaña con objetivos y progresión reconocibles. | Medir la profundidad de cada etapa y las diferencias de configuración; el número de mapas es sólo una parte del valor. |
| [Phoenix 2](https://firigames.com/phoenix2) y [FAQ de controles](https://firigames.com/phoenix2/support) | Armamento/habilidades especializados y control simultáneo documentado. | Afinar los dos pulgares y habilidades con función táctica clara, manteniendo amenazas legibles. |
| [Steredenn: Binary Stars](https://store.steampowered.com/app/347160/Steredenn_Binary_Stars/) | Naves diferenciadas, armas, sucesos espaciales y práctica de jefes. | Diseñar encuentros aprendibles y pocas opciones profundas antes de multiplicar sistemas. |

La [ficha actual de Phoenix 2](https://apps.apple.com/us/app/phoenix-2/id1134895689) incluye campaña narrativa; tener historia no nos hace únicos por sí solo. La oportunidad de NEON CRONIUM es que el viaje continuo, el rastro del accidente, las estaciones y la transformación de la nave se sientan conectados. Es una hipótesis de diferenciación que debe demostrarse con jugadores. No se propone copiar arte, cifras de armas, obligaciones diarias ni monetización de otros juegos.

## 4. Metas ordenadas y criterio de aceptación

Las referencias de seguimiento apuntan a tareas existentes: esta tabla no sustituye `production-tasks.json` ni crea porcentajes paralelos.

| Orden | Meta | Criterio propuesto para cerrarla | Referencias existentes |
| --- | --- | --- | --- |
| 1 · crítica | Fijar la edición comercial y el recorrido principal. | Mapa único de capítulos, etapas, orígenes/destinos, objetivos y guardianes. Todo contenido anunciado se termina en el paquete de lanzamiento. Si se mantiene 10×10, producir y verificar las cien etapas espaciales; conservar N-7 como archivo/opcional con explicación. | P0-DESIGN-100, P3-01, P4-01 |
| 2 · crítica | Convertir Chronos → Gaia en referencia de diversión. | Playtest propuesto con diez personas ajenas al desarrollo: ocho entienden pilotaje/disparo/objetivo durante el primer minuto y siete terminan la introducción sin instrucciones privadas. Registrar dónde esperan, se pierden, fallan o eligen continuar; corregir esos puntos antes de expandir. Muestra orientativa, no prueba estadística de mercado. | P1-02, P3-TRANSIT-01, P3-CH1-01…10 |
| 3 · crítica | Cerrar pilotaje y combate satisfactorio. | Dos dedos en ambos órdenes, manual/recarga sin pérdida de contactos, feedback de impacto/material y cifras de daño coherentes con lo que ocurre. Dos configuraciones viables superan el mismo encuentro con estrategias observables. Cero fallo crítico de control. | P1-INPUT-02, P1-COMBAT-02, P1-SHIELD-01 |
| 4 · alta | Dar identidad a los enemigos y progresión justa. | Cada mundo incorpora familias con silueta, desplazamiento y ataques propios; aviso, respuesta posible, impacto y destrucción reales. Se registran muertes/causas y se corrigen daño inevitable, amenazas ocultas y saltos injustificados de dificultad. | B04, B05, P4-01 |
| 5 · crítica | Implementar guardianes y final completos. | Cada frontera prometida tiene entrada, contexto, patrones, cambio de fase, ventanas de respuesta, resolución y premio único. Partida natural grabada de cada combate, reintento y recarga sin duplicación. Último capítulo con desenlace jugable y epílogo. | B06, P1-ATLAS-01/02, P4-01 |
| 6 · alta | Animar mundos y conectar geografía. | Profundidad independiente y acontecimiento ambiental propio por territorio; salida/tránsito/aproximación/llegada visibles. Acordar qué tramos son orbitales: las escenas superficiales 4–6 requieren resolver esa coherencia. Vídeo continuo y revisión de arte del propietario; Gaia reconocible fuera del HUD. | P1-VULKAR-01, B05, P4-01 |
| 7 · alta | Integrar la línea argumental de principio a fin. | Cada revelación está enlazada a un evento real y tiene consecuencia. Un jugador puede explicar qué pasó en Chronos, qué recupera y qué resuelve el final sin leer documentos externos. Transmisiones breves y consultables después. | B07, P3-01, P4-01 |
| 8 · alta | Hacer valiosa y comprensible la mejora de nave. | Separar cosmética de efectos tácticos en pantalla; pieza montada, efecto visible al volar y comparación de ganancias/costes. C9 con llegada/salida, personaje y una interacción acabada. Si el alcance conserva mercado: catálogo corto y transacciones coherentes; no añadir una tienda por obligación. | P1-SHIP-01, P2-01 |
| 9 · alta | Cerrar interfaz y accesibilidad comercial. | Una entrada principal directa a CONTINUAR, destino/checkpoint visibles, laboratorio fuera del recorrido normal. Texto/controles legibles en tamaños admitidos, señales que no dependan sólo del color y reducción de sacudidas/destellos que alcance el Canvas. | P1-HUD-01, P1-TRANSITIONS-01, P5-01 |
| 10 · alta | Producir audio final con propósito. | Ambientación/música de territorios y jefes, señales distinguibles de disparo/impacto/escudo/peligro, mezcla y procedencia revisadas. Mute/volumen y recuperación tras interrupciones probados en Safari/WKWebView. | B08 |
| 11 · crítica | Certificar estabilidad y rendimiento en dispositivos. | Archive de Xcode con SDK vigente, iPhone mínimo admitido y uno actual; sesiones de 30 minutos, carga, frametimes, memoria y temperatura medidos. Objetivo provisional 60 FPS donde sea viable; fijar un mínimo estable por dispositivo después de medir. Ningún bloqueo, pérdida de progreso o fallo crítico abierto. | B09, B10, P5-01 |
| 12 · crítica | Cerrar guardado, beta y requisitos de distribución. | Interrumpir/fallar cada escritura sensible y veinte ciclos de reintento/continuar: progreso coherente, ningún premio duplicado. Después beta autorizada, soporte/privacidad/edad/SDK/licencias/metadatos reales y capturas del juego terminado. Elegir conscientemente lanzamiento sin anuncios o integración final verificada. | P2-01, B10, P5-01 |

Las metas 2 y 3 son la prioridad de producción inmediata. Las de contenido se cierran por un capítulo completo y luego el siguiente. Las pruebas técnicas y de guardado acompañan cada lote; no se dejan para el último día. La decisión del Motor V1 sigue reservada al propietario: no es una autorización para activarlo ni un requisito automático para mejorar esta experiencia con el legacy.

## 5. Bloqueos de publicación concretos

1. **Contenido prometido incompleto:** el diseño canónico de cien etapas no está ejecutable como tal; falta la mayor parte de familias/guardianes y el final. Esto es un bloqueo de producto para esa edición anunciada.
2. **Legales provisionales:** `privacy.html:18–24` y `terms.html:21` reconocen información pendiente y base técnica antigua. Hay que identificar responsable/soporte, datos actuales, terceros y modelo real. La [guía oficial de Apple](https://developer.apple.com/app-store/review/guidelines/) exige completitud, pruebas en dispositivo y una política accesible y precisa; no garantiza que cumplir una checklist obtenga aprobación.
3. **Monetización sin decisión final:** `ads-config.js` activa demostración nativa; el paquete de pruebas desactiva anuncios reales. Publicar sin anuncios es una opción válida. Si se incluyen SDK publicitarios, auditar declaraciones y consentimiento/ATT según el uso efectivo, conforme a [Apple: privacidad y datos](https://developer.apple.com/app-store/user-privacy-and-data-use/). No activar pagos/anuncios durante esta auditoría.
4. **Candidato nativo no certificado:** no hay evidencia de Archive, instalación física y batería de pruebas de la edición final. [Apple establece desde el 28/04/2026 Xcode 26 o posterior y SDK iOS 26 o posterior](https://developer.apple.com/news/upcoming-requirements/?id=04282026a); revisar de nuevo al enviar. El deployment target iOS 15 existente no es por sí solo el problema.
5. **Beta y validación humana pendientes:** [TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/) permite distribuir y recoger feedback; la beta externa puede necesitar revisión. Su publicación sigue requiriendo la autorización reservada por el propietario. Mientras tanto se puede usar la web privada para playtest.

## 6. Hallazgos que no se deben convertir en fallos inventados

- El texto fantasma de una captura histórica de v11 era compatible con una captura durante el fade de 0,2 s. La prueba nueva de 19 muestras no lo reproduce como superposición persistente. No se declara corregido un defecto que no se cambió.
- La incidencia histórica de glifos de Chromium tampoco apareció en las nuevas capturas inspeccionadas de niveles 4 y 10. Eso no demuestra que su fallo intermitente esté resuelto en todos los dispositivos. Se conserva en revisión, con su evidencia previa.
- El vacío espacial no es automáticamente un error. Puede aportar escala/descanso; su duración y decisiones deben evaluarse con jugadores. El QA natural anterior de 360 s, diez disparos y casco final 100 % no mide diversión ni dificultad humana.
- Los ajustes de accesibilidad existen parcialmente (volumen, safe areas, ARIA, calidad). La carencia concreta es que la reducción no controla todas las sacudidas/destellos Canvas. La música también existe, aunque aún es provisional.
- Hay un único ciclo de juego en las comprobaciones conservadas. El Motor V1 continúa desactivado. Esta revisión no exige reemplazar una arquitectura que ya permite producir mejoras.

## 7. Orden de trabajo recomendado

**Próximo hito:** una sesión de evaluación del recorrido Chronos–Gaia y del encuentro Atlas con diez jugadores externos, grabación/observación con consentimiento y una lista corta de problemas repetidos. Preparar el guion de tareas y métricas antes de probar; no explicarles los controles a mitad de la prueba salvo que se registre ayuda.

Después: corregir ritmo, claridad y game feel de ese lote; cerrar sus recursos/sonidos/estación y volver a comprobarlo. Continuar por territorios completos, con su jefe/historia y criterios de aceptación. Antes de enviar: matriz física, recuperación, rendimiento, legales y beta. La aceptación estética final y el envío a tiendas siguen en manos del propietario.

No se fija una fecha ni porcentaje comercial a partir de archivos, documentación o tests. La decisión de lanzamiento debe apoyarse en la experiencia completa que realmente contiene el paquete, sus defectos abiertos y las evidencias de jugadores/dispositivos.
