> **Referencia vigente:** [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md), mandato rector v1.0 del 17/10/2026. Ciencia ficción arcade estilizada, siluetas claras y tecnología con personalidad. Las paletas y prioridades útiles siguientes se conservan; el antiguo alcance de niveles/expansión es histórico. Incremento actual: [demo Chronos-Gaia](docs/production-reports/P0_P1_CHRONOS_GAIA_2026-10-17.md), pendiente de aceptación estética.

# NEON CATCHER — Dirección artística / Art Pass A

Fecha: 2026-10-13. Alcance prioritario: **Capítulo I (niveles 1–10)**. La arquitectura debe admitir 100 niveles en fases posteriores sin sustituir la campaña actual.

## Identidad canónica

- **Cronos / CRONIUM**: blanco luminoso, cian `#5CF5FF`, azul profundo `#07182D` y violeta temporal `#A478F2`.
- **Gaia Nova**: blindajes blanco titanio, metal grafito, núcleos cian, advertencias rojas.
- **Vulkar**: basalto `#171820`, magma `#FF6A1A`, brasa `#FFB13B`. Las grietas conservan continuidad entre frames.
- **Cryon**: blanco glaciar, cian hielo `#A6F3FF`, sombras `#203C63`.
- **Aether**: violeta `#9748DF`, azul eléctrico, refracción temporal limitada.
- **Titan Omega**: ámbar industrial, metal oscurecido y señales rojas.

## Prioridades de lectura (canvas lógico 720×1280)

1. Silueta, posición y colisión de la nave.
2. Amenazas, telegráficos y corredores seguros.
3. Objetos, pickups y proyectiles.
4. Entorno pintado, planetas y VFX narrativos.
5. Decoración y partículas ambientales.

El fondo nunca debe tapar la zona de colisión. Las capas luminosas requieren opacidad controlada. No colocar barras ni líneas artificiales encima del Centro Cronos como sustitutos de arte acabado.

## Producción y animación

1. Preservar arte canónico y registrar origen.
2. Crear frames del **mismo modelo**, con anclaje y escala fijos.
3. Guardar PNG maestro transparente y WebP runtime optimizado.
4. Declarar columnas, filas, FPS, pivote, estados y eventos.
5. Mantener hitbox independiente de la imagen.
6. Precargar con el loader existente y conectar estados a gameplay real.
7. Verificar capturas móviles, memoria, FPS, colisiones y continuidad.
8. Promover `IN_REVIEW` a `READY` solo después de integración comprobada.

## Art Pass A en esta rama

- Retiradas las barras geométricas flotantes en el escenario Cronos.
- Se deja visible el fondo pintado existente del Centro Chronos.
- La onda de choque utiliza la textura gráfica de escudo existente con un único borde atenuado; se eliminan radios y círculos repetidos.
- Se sincroniza `src/game/06-world-rendering.js` con `game.js` sin perder la capa de nebulosas ya existente.
- No se modifican colisiones, balance, progreso, publicidad ni controles.

## Estados reales

- **IMPLEMENTADO**: cambios de representación del Nivel 1 usando assets ya presentes en el repositorio.
- **ARTE PRODUCIDO FUERA DEL REPOSITORIO**: CH-01, diez vistas/poses y atlas WebP, más frames PNG individuales y previsualización. No es aún recurso jugable integrado porque el binario todavía no está en GitHub.
- **NO CERTIFICADO**: capturas visuales del HEAD actual, prueba física en iPhone, rendimiento, CH-01 en combate y bosses.

No declarar como cerrada la producción artística a partir de compilaciones o tests unitarios solamente.
