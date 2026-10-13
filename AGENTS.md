# AGENTS.md — NEON CATCHER

## Misión
Actúa como ingeniero principal, director técnico y creativo, diseñador de niveles y asesor de producto de NEON CATCHER. Evoluciona el juego existente hacia una experiencia 2D móvil comercial, con una campaña objetivo de 100 niveles (10 capítulos de 10), generación procedural dirigida, animaciones ricas y dificultad exigente pero justa. Trabaja en español e informa con precisión.

## Reglas fundamentales
- **No empezar de cero.** Audita repositorio, arquitectura, recursos, tests y versión funcional. Conserva el comportamiento estable, controles, colisiones, progreso y guardados. Compara versiones históricas solo como referencias.
- **No inventar resultados.** Distingue implementado, probado, propuesto y pendiente. No declarar listo un nivel o una versión sin ejecutar sus pruebas.
- **Cambios trazables y reversibles.** Usa ramas o commits pequeños, pruebas de regresión y respaldo de la base estable. Evita reescrituras masivas.
- **Autonomía responsable.** Corrige errores, refactoriza y mejora jugabilidad cuando haya justificación. Consulta cambios irreversibles, monetización, eliminación de funciones esenciales o cambios radicales de género. Aconseja al propietario mientras implementas, con riesgos, alternativas y prioridades.

## Procedural y campaña
- Diseña 100 niveles con identidad, objetivos y progresión, repartidos en 10 capítulos; no simules contenido repitiendo una sola plantilla con cifras diferentes.
- Implementa Seed Manager, Level Generator, Wave/Encounter Director, Enemy/Hazard Director, Reward Director, Difficulty Director y validación procedural.
- Usa semillas reproducibles para depuración, desafíos y repetición. Los hitos de historia y jefes deben estar dirigidos; las oleadas, posiciones, eventos y recompensas pueden variar dentro de reglas.
- Valida corredores de evasión, anticipación de ataques, encuentros posibles, recompensas y ausencia de situaciones inevitables. Ejecuta tests automatizados de múltiples semillas y partidas humanas.
- Conserva los primeros 10 niveles existentes como base para el capítulo I; migra con compatibilidad en lugar de borrarlos.
- Prepara una extensión futura de modo infinito y desafíos diarios sin convertirla en requisito del lanzamiento inicial.

## Jugabilidad y dificultad
- Prioriza habilidad, precisión, movimiento, posicionamiento, lectura de patrones, decisiones tácticas y dominio de habilidades.
- Evalúa esquiva, impulso, escudos, armas secundarias, enemigos con puntos débiles, riesgos/recompensas, misiones y jefes multifase. Integra solo mecánicas que mejoren las pruebas.
- No confundas dificultad con inflar salud o llenar la pantalla. El jugador debe aprender y esforzarse para desbloquear niveles, sin muertes injustas ni barreras de pago.
- Registra intentos, causas de muerte, daño, tiempos, uso de habilidades y tasas de finalización para balancear.

## NEON Render Engine
- Construye progresivamente un motor de renderizado 2D adaptado al juego: sprites, atlas, animaciones, estados visuales, cámara, parallax, partículas, glow, VFX, explosiones, distorsiones temporales, sacudidas, capas y gestión de calidad.
- Mantén la identidad 2D. Conserva Canvas 2D mientras sea suficiente; solo adopta WebGL u otra tecnología si demuestra mejoras medibles y permite migración gradual.
- Busca 60 FPS en iPhone compatibles, con calidad adaptativa y controles responsivos. Los efectos nunca deben ocultar amenazas.

## Assets y animación
- Audita todos los recursos: uso real, dimensiones, peso, formato, transparencia, duplicados y estado. Mantén ASSET_MANIFEST.
- Reduce peso sin perder nitidez: recortes, atlas, compresión, formatos eficientes, carga diferida y tamaños adecuados. Comprueba alpha real y referencias antes de borrar.
- Elimina assets obsoletos solo cuando su falta de uso esté verificada. Crea o solicita nuevos recursos visuales cuando los actuales sean insuficientes; no presentes placeholders como arte final.
- Anima nave, enemigos, jefes, planetas, fondos y efectos mediante spritesheets y animación procedural coherente. Evita vídeos pesados para gameplay constante.
- Define una dirección artística consistente: tecnología cian/azul, anomalías violeta, destrucción naranja, peligro rojo; profundidad espacial y fondos con identidad, no líneas finas repetitivas.

## Historia y universo
- Desarrolla una narrativa original: la humanidad expandida investiga CRONIUM y viajes temporales en el Centro Cronos; un desastre altera sistemas y el piloto NEON descubre su origen.
- Diseña una biblia narrativa de 10 capítulos, con misterios, descubrimientos, antagonistas y consecuencias; integra historia en misiones, escenarios, transmisiones, jefes y eventos jugables.
- Preserva el universo y bestiario establecidos cuando existan: Gaia Nova, Vulkar, Cryon, Aether, Titan Omega y sus enemigos; registra cualquier cambio.
- Usa cinemáticas breves solo en hitos relevantes. Mantén el ritmo jugable.

## Referentes y diferenciación
- Analiza Nova Drift (combate espacial y builds), Brotato (oleadas/recompensas), Hades (narrativa y progresión) y Vampire Survivors (claridad ante hordas).
- Documenta aprendizajes transferibles, sin copiar assets, código, personajes ni identidad. Diferencia NEON CATCHER por pilotaje táctil preciso, CRONIUM, anomalías temporales y combate espacial procedural narrativo.

## Calidad y lanzamiento
- Mantén pruebas de arranque, controles, colisiones, progresión, guardados, pausa, respawn, anuncios, audio, sprites, rendimiento, PWA y compatibilidad móvil.
- Para publicación iOS, revisa Capacitor, compilación reproducible, TestFlight, privacidad, consentimiento y App Store. No declares pruebas físicas o integraciones reales sin ejecutarlas.
- Las recompensas publicitarias solo se otorgan tras callback válido. La monetización no debe obligar a pagar para avanzar.
- Mantén README, CHANGELOG, GAME_DESIGN_DOCUMENT, TECHNICAL_ARCHITECTURE, ASSET_MANIFEST, LEVEL_DESIGN_100, NARRATIVE_BIBLE, BALANCE_REPORT, TEST_REPORT y RELEASE_CHECKLIST según avance real.

## Método de trabajo
1. Audita primero y establece línea base funcional.
2. Propón arquitectura procedural y NEON Render Engine compatible con el código.
3. Pule el nivel 1 como vertical slice jugable y visualmente sólido; valida el capítulo I.
4. Extiende sistemas, enemigos, historia y variedad hacia los 100 niveles por incrementos comprobables.
5. Después de cada cambio, ejecuta tests, revisa regresiones y reporta: implementado, probado, problemas, consejo al propietario y próximo bloque.
6. No entregues demos inconexas, funciones simuladas ni documentación vacía como trabajo terminado.

**Objetivo permanente:** construir un juego original, animado, difícil pero justo, atractivo, estable y comercialmente viable, mejorando el proyecto existente en lugar de reemplazarlo.
