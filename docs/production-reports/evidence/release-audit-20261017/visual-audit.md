# Auditoría independiente de presentación y UX — NEON CRONIUM

Fecha: 2026-10-17. Alcance inicial: lectura de instrucciones, informes y fuentes, más inspección directa con `view_image` de 19 capturas auténticas existentes. Después se ejecutó un diagnóstico Chromium de transiciones sobre el paquete inmutable, detallado al final: 19 capturas nuevas, ocho revisadas con `view_image`. No jugué una partida humana ni cambié el repositorio. Las capturas históricas abarcan paquetes distintos, identificados por carpeta; no sirven para atribuir a v11 toda la QA anterior.

## Dictamen

Existe una mejora visible y aprovechable: la nave modular tiene silueta consistente, el emisor gemelo aparece en sus montajes, los proyectiles gemelos salen centrados, el escudo envuelve realmente la nave y el HUD compacto deja mucho más campo libre. La destrucción de Chronos, el viaje con escala y Guardian Atlas son una base real. No sería honesto llamar al juego visualmente preparado para venta: la calidad de las ilustraciones supera claramente la integración y el cierre de los otros territorios; el viaje inicial no demuestra todavía una campaña terminada y la presentación conserva una capa de laboratorio.

## Ocho metas antes de publicación

### V1 — Mantener una puerta de calidad de transiciones, sin atribuir un defecto no reproducido

Observación histórica: `docs/production-reports/evidence/neon-cronium/browser-04/08-current-offline-continuation-playing.png` contiene el briefing y la cuadrícula de etapas como texto fantasma detrás de la partida. `chronos-voyage/browser-02/13-c9-before-installation.png` muestra la nave de gameplay superpuesta al pie del diálogo del taller. El diagnóstico posterior de launch/resume/restart online y offline sobre el mismo paquete v11 no reproduce persistencia a +0,5/+2/+5 s: todos los overlays ocultos tienen opacidad cero y las capturas inspeccionadas están limpias. La imagen v11 es compatible con una captura prematura durante la transición de 0,2 s. No se declara un defecto persistente ni un bloqueo confirmado. La salida específica de C9 no se volvió a ejecutar en este diagnóstico.

Criterio: capturas o vídeo a 0,5 y 2 segundos tras comenzar, reanudar, recargar offline y salir de C9; ninguna etiqueta/botón oculto visible o interactuable sobre el gameplay y ningún sprite de juego flotando sobre el modal. Repetir en 320×568, 390×844 y horizontal, con animaciones reducidas.

### V2 — Resolver el encuadre de llegada y la geografía de los diez territorios

`chronos-voyage/browser-02/19-stage-10-persistent-arrival.png` sitúa Gaia parcialmente detrás del HUD y del aviso. La llegada pierde protagonismo. Las escenas 4–6 de `combat-readability/compact-browser-01/390x844-level-04.png` a `...06.png` representan cañones/superficies planetarias, mientras que el último mandato de combate pide espacio orbital; son ilustraciones logradas pero requieren una decisión de geografía y conexión, no un cambio de color.

Criterio: origen, tránsito y destino de cada territorio definidos y visibles; la llegada de Gaia muestra su rasgo reconocible fuera de la franja del HUD en todos los tamaños, sin quitar controles; cada transición justifica y muestra si se entra en atmósfera o se permanece en órbita. La revisión del propietario debe confirmar la dirección espacial antes de rehacer lotes.

### V3 — Convertir las ilustraciones de los territorios 2 y 4–10 en escenarios vivos

Las capturas 4–10 muestran entornos diferenciados y ricos. La lectura de `src/game/06-world-rendering.js`, ramas de `background()`, confirma que se dibuja una imagen principal con un seno de deriva y gradiente. Gaia también usa una imagen principal. Ello no equivale al parallax independiente ya implementado en Chronos y Vulkar orbital. Las propias galerías documentan esta deuda.

Criterio: por territorio, al menos fondo lejano, arquitectura/planeta y elementos próximos realmente independientes cuando la escena lo necesite; una animación ambiental asociada a su identidad y una transformación ligada a un acontecimiento jugable. Vídeo continuo de 20–30 s demuestra movimiento relativo sin que el paisaje completo oscile como una lámina. Comparar a t0/t1/t2 y durante pausa. No duplicar la misma imagen como tres supuestas capas.

### V4 — Completar la representación enemiga y los encuentros territoriales

Guardian Atlas ya tiene cuerpo, estados y armamento propios; `combat-readability/atlas-natural-01/03-atlas-warning.png` y `04-atlas-phase-two.png` lo demuestran. La documentación actual de niveles 4–10 reconoce que Magma Serpent segmentada, Frost/Ice, Leviathan, Time Echo/Rift Orb, Phantom y enemigos industriales siguen pendientes. Los fondos no sustituyen esas entidades. La captura estática de fase 2 no permite valorar por sí sola la fluidez o dificultad del jefe.

Criterio: cada territorio cuenta con enemigos reconocibles en una partida natural y su encuentro de cierre real; para cada familia, vídeo de anticipación, ataque, impacto y resolución, diferenciados y legibles contra su fondo. La serpiente articula segmentos. Diez encuentros cerrados no se acreditan mediante registros de datos ni imágenes de referencia.

### V5 — Validar ritmo del vacío y variedad de objetivos con jugadores

`chronos-voyage/browser-02/10-stage-05-comet-crossing.png` sí comunica vacío espacial y no debe llenarse automáticamente de enemigos para corregirlo. La evidencia natural documenta 360 segundos mínimos, 36 fragmentos, 10 disparos y casco final 100 %. Esto acredita continuidad funcional, no que seis minutos tengan interés, que el combate sea difícil ni que los diez subtramos se sientan distintos.

Criterio: prueba ciega con al menos cinco jugadores sin explicarles el flujo; registrar tiempo hasta entender el objetivo, pausas sin decisión, causa de daños, abandono y capacidad de explicar qué cambió entre etapas. Es una propuesta de prueba, no un umbral universal. Ajustar duración/acontecimientos usando esos datos; conservar silencio y espacio con decisiones/hitos, no temporizadores vacíos. Cada objetivo necesita un cierre perceptible.

### V6 — Hacer que C9 sea una estación y una interacción del universo

`chronos-voyage/browser-02/14-c9-emitter-installed.png` muestra una comparación de nave útil y botones legibles. Sin embargo, la estación se representa con el satélite histórico y Mira aparece solo como nombre; la interfaz consiste todavía en una tarjeta genérica de instalación gratuita. El informe de trayecto reconoce que `satellite_old.webp` se reutiliza sin presentar una nueva estación producida.

Criterio: llegada y salida visualmente enlazadas; estación y anfitriona con diseño propio, una animación significativa y el módulo instalado en puntos coherentes. Compra/reparación/equipamiento tienen respuesta audiovisual y sus consecuencias se ven al volver a vuelo. Si el alcance de lanzamiento no incluye mercado, retirar promesas y mantener C9 como servicio narrativo breve y terminado.

### V7 — Pulir señales de combate, mejoras y accesibilidad sin volver a tapar la partida

Fortalezas verificadas en imágenes: `21-gaia-next-territory-twin-flight.png` muestra tiros centrales; `combat-readability/browser-supplement-02/07-force-field-stable-live.png` muestra un escudo envolvente. El HUD superior normal ocupa una franja compacta, mucho mejor que la captura original del usuario. En jefe, el panel crece con texto de fase y comunicación; debe comprobarse la lectura durante ataques y en la zona superior. El ×2 es daño agregado de dos pulsos, distinción que conviene enseñar en acción para no prometer daño ×2 por proyectil.

Criterio: un jugador identifica arma, recarga, escudo, vulnerabilidad y daño recibido sin pausar ni depender únicamente del color; pulsos/impactos/materiales diferenciados y ninguna amenaza entra oculta detrás del HUD. Dos configuraciones vencen el mismo encuentro. Vídeo de dos dedos real, pruebas de texto grande, reducción de destellos/sacudida y dispositivo físico. Las capturas actuales no certifican ninguna de estas últimas pruebas.

### V8 — Unificar portada, menú, navegación y entrega comercial

Las capturas v11 `03-current-online-launcher.png` y `04-current-online-menu.png` muestran dos entradas consecutivas con CONTINUAR VIAJE, guía para elegir niveles manualmente, acceso a archivos de pruebas y un emblema genérico N. Eso tiene sentido en la web de laboratorio, pero no como presentación final para quien compra el juego. La frase de sinopsis ya establece un conflicto entendible.

Criterio: una sola entrada directa al viaje con destino/checkpoint visibles, pruebas antiguas separadas de la navegación comercial y primera misión que enseña pilotaje/disparo sin manual previo. La portada, icono, estaciones, HUD y pantallas de resultado comparten identidad; la app final no contiene instrucciones de QA o compilaciones internas. Recorrido grabado desde instalación limpia hasta primera mejora y continuación, y desde un checkpoint interrumpido.

## Diagnóstico fresco de overlays

Comando: `node /tmp/release-overlay-check.cjs > /tmp/release-overlay-check.log 2>&1`, salida **0**. Evidencia: `/tmp/release-overlay-check/results.json` y 19 PNG. Primer arranque del arnés falló antes de abrir el juego por una ruta absoluta errónea al paquete Playwright; se corrigió a `require('playwright')`, que usa la dependencia ya instalada, sin instalación ni cambios de producto.

Chromium **154.0.8037.57**, 390×844, escala1, táctil. Paquete fuente limpio **207a94edf01eb26f5f4210429cf51a4497b1b6d7**, revisión **ddba1cb90abc61252af4e29f3bee23296ba5ea81887b608d9971a516a1df2838**. De **21:18:52.638 a 21:19:40.788 UTC**, 48,150 s de proceso. Sembrado explícito de checkpoint1.3, casco74%, gemelo y configuración modular, igual al caso de compatibilidad anterior; no es progreso ganado naturalmente.

Se recorrieron launcher→clásico→CONTINUAR→INICIAR y pausa/reanudación/reinicio, luego recarga y esos flujos sin conexión. Se capturó y leyó `computedStyle` a aproximadamente +0,5/+2/+5 s por flujo, más pausa estable: **19 muestras**, todos los overlays sin `.show` con **opacity0 y pointer-events:none**, sin transiciones de esos elementos en curso; ningún error JS. El conjunto de hashes de todos los archivos del paquete es idéntico antes/después. Se revisaron ocho capturas nuevas, incluidas launch online a0,5/2s y offline a0,5/5s, resume y restart: sin texto fantasma. Los overlays conservan `visibility:visible` y `display:grid/block` a opacidad0; eso por sí solo no produce un defecto visual.

`document.getAnimations()` sí muestra cuatro animaciones CSS de descendientes de menús ocultos aún corriendo. Es una observación para medir consumo si se optimiza después; no se ha probado que cause caída de FPS, un fallo visual o un segundo RAF. No justifica cambios de arquitectura.

El responsable de integración informó además una pasada fresca independiente `compact-HUD` **26/26**, cinco tamaños y diez escenas; sus capturas4/10 no reprodujeron los glifos ausentes. Es evidencia del responsable, no una prueba ejecutada por este auditor, y no borra la intermitencia histórica ni sustituye iPhone físico.

## Límites del dictamen

No valoré fluidez sostenida, latencia de tacto, sonido, memoria/FPS, dificultad humana, defectos de glifos intermitentes, App Store ni el sitio remoto. El diagnóstico local de overlays no comprueba C9, todos los dispositivos ni todas las condiciones de transición. Ninguna captura fija demuestra duración de animaciones o parallax; cuando afirmo composición monoplaca es por lectura del renderizador y del informe, no por inferirlo de una imagen. El overlay histórico no persistió en la prueba fresca; no es un bloqueo confirmado. No se deben eliminar fortalezas actuales ni activar Motor V1 para resolver estos objetivos.
