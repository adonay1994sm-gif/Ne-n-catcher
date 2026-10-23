# NEON ENGINE — diagnóstico inicial del motor 2.5D

Fecha: 2026-10-17 UTC. Rama de trabajo: `continuity-assets-audit-20261013`.

## Fuentes comprobadas

Se contrastaron los archivos de la rama remota con la copia de continuidad del 13/10. Los hashes Git de `src/engine/EngineCore.js`, `Renderer.js`, `ParticleSystem.js`, `CampaignAdapter.js` y `tests/engine-lifecycle.test.mjs` coincidieron exactamente entre ambas fuentes antes de editar. Sobre esa base se ejecutó `node --test tests/engine-lifecycle.test.mjs`: **40/40, exit 0**.

El repositorio también conserva `js/engine/` y `render/neon-render-engine.mjs` (versión 0.1.0). Estos son módulos de renderizado adicionales, con interfaces y responsabilidades parcialmente repetidas. `engine-preview.html` utiliza la ruta `engine/demo.mjs`, distinta de la ruta moderna `src/engine/`.

La marca visible vigente según `AGENTS.md` es **NEON CRONIUM**; la URL del repositorio y las claves históricas siguen identificando NEON CATCHER. Este bloque no cambia marca, rutas de guardado ni bundle ID.

## Diagnóstico y decisiones

| Componente | Hallazgo | Decisión |
| --- | --- | --- |
| `src/engine/EngineCore.js` | RAF único experimental, generación para invalidar callbacks, pausa, visibilidad y manejo de errores; 40 tests de ciclo de vida en conjunto | **CONSERVAR** y ampliar por contratos opt-in |
| `src/engine/Renderer.js` | Escala lógica/física Retina, mapeo táctil y sacudida; no ofrecía entrada explícita para HUD inmune a transformaciones del mundo | **REFACTORIZAR MÍNIMAMENTE** con `withScreenSpace` |
| `src/engine/ParticleSystem.js` | Pool fijo de 320; reutilización sin nuevas partículas por frame | **CONSERVAR**, sin ampliar capacidad sin mediciones |
| `src/engine/CampaignAdapter.js` | Máquina de estados y rollback; `USE_ENGINE_V1=false` | **CONSERVAR**, no activar |
| `js/engine/*` | Implementación previa de renderizado y ciclo, no idéntica a `src/engine/*` | **HISTÓRICO/EXPERIMENTAL**, no borrar todavía |
| `render/neon-render-engine.mjs` | Segundo renderizador experimental con estrellas y partículas propios | **EXPERIMENTAL**, evitar una tercera ruta |
| Escenas/cámara | No había en `src/engine/` una cámara de mundo y compositor de capas con contrato probado | **IMPLEMENTAR** módulos acotados, sin modificar legacy |
| Assets/cinemáticas/HUD final | Existen recursos e integración legacy, pero no hay certificación del motor V1 en partida real ni iPhone físico | **PENDIENTE** para bloques siguientes |

## Alcance del primer incremento

Se incorporan `Camera2D` y `SceneCompositor` como módulos auxiliares de `src/engine`, utilizables dentro del `drawScene` de `EngineCore`. No crean RAF, no generan imágenes, no modifican reglas de juego ni toman posesión del Canvas legacy. La cámara admite coordenadas lógicas, zoom, seguimiento y parallax. El compositor dibuja imágenes y celdas de atlas existentes, ordena por profundidad, evita dibujar sprites fuera de pantalla, conserva estado de Canvas y omite recursos no cargados sin inventar geometría.

`Renderer.withScreenSpace()` restablece temporalmente la transformación lógica, opacidad y modo de composición para dibujar HUD sin heredar sacudidas/zoom del mundo, restaurando el contexto incluso si hay un error.

## Riesgos y límites

- Los tests de este bloque utilizan Canvas simulado y módulos exactos de la rama. **No certifican calidad visual ni iPhone**.
- La escena real Chronos → Gaia, los recursos artísticos y las pruebas físicas todavía deben integrarse con el motor experimental.
- El sistema de `cover` está pensado para placas de fondo, no sustituye la separación real de capas de ilustración.
- El modo normal mantiene el renderer legacy. No hay autorización para cambiar el flag, producción, `main` ni PR #3.
- El contenido de otros agentes puede avanzar durante este trabajo; antes de publicar debe comprobarse el HEAD remoto y conservar todos sus commits.
