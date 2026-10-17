# INFORME DE PRODUCCIÓN — NEON ENGINE, bloque inicial de cámara y composición

Fecha: 2026-10-17 UTC. Rama: `continuity-assets-audit-20261013`.

## 1. Diagnóstico

Leer [01_DIAGNOSTICO.md](01_DIAGNOSTICO.md). El Motor Base V1 está implementado pero desactivado. Los 40 tests históricos de ciclo de vida pasan; faltaba una interfaz propia de cámara y capas artísticas dentro de `src/engine/`. Existen implementaciones gráficas anteriores duplicadas que no se eliminan sin migración.

## 2. Trabajo implementado

- `src/engine/Camera2D.js`: posición, zoom acotado, transformaciones mundo/pantalla invertibles, parallax y seguimiento amortiguado independiente de la tasa de fotogramas.
- `src/engine/SceneCompositor.js`: capas artísticas ordenadas, modo sprite o cover, recorte de atlas, pivotes, escala, rotación, opacidad, culling conservador, omisión de recursos no disponibles y restauración de Canvas ante fallos.
- `src/engine/Renderer.js`: `withScreenSpace(callback)` para HUD en coordenadas lógicas, aislado de transformaciones de cámara/sacudida y opacidad heredada.
- `tests/engine-scene-compositor.test.mjs`: 20 pruebas nuevas de cámara, composición, atlas, capas, protección de estado, HUD y conexión con EngineCore sin segundo RAF.
- `package.json`: `test:engine` ejecuta tanto las 40 pruebas existentes como las 20 nuevas.

No se han cambiado `EngineCore.js`, `ParticleSystem.js`, `CampaignAdapter.js`, `src/game/`, guardados, bundles, recursos artísticos ni banderas de producción.

## 3. Pruebas ejecutadas en el entorno local

- Baseline `node --test tests/engine-lifecycle.test.mjs`: **40/40**, exit 0, con los hashes exactos de GitHub antes de editar.
- `npm run test:engine` con el cambio: **60/60**, exit 0 (40 existentes + 20 nuevas).
- `npm run test:architecture` sobre la copia histórica del 13/10: **6/6**, exit 0. **No es una ejecución de la suite completa sobre el HEAD remoto actual**.
- `node --check` de los nuevos módulos y pruebas: exit 0.

No se ha ejecutado `npm ci` ni una compilación completa de la rama actual porque este contenedor no puede acceder a GitHub/npm por red. Los resultados no deben extrapolarse a los demás paquetes del juego. CI, Chromium con assets actuales, Safari físico y WKWebView quedan pendientes.

## 4. Cómo utilizarlo en un laboratorio sin activar producción

```js
import { EngineCore } from '../../src/engine/EngineCore.js';
import { Camera2D } from '../../src/engine/Camera2D.js';
import { SceneCompositor } from '../../src/engine/SceneCompositor.js';

const camera = new Camera2D();
const compositor = new SceneCompositor({ camera, layers: [
  { id: 'deep-space', image: loadedBackground, mode: 'cover', z: 0, parallax: 0.05 },
  { id: 'station', image: loadedStation, z: 1, parallax: 0.3, width: 360, height: 360 },
  { id: 'player', image: loadedShip, z: 2, parallax: 1, width: 160, height: 160 }
] });

const engine = new EngineCore({ canvas, drawScene(ctx, renderer) {
  compositor.render(ctx, renderer);
  renderer.withScreenSpace(hudCtx => drawActualHud(hudCtx));
} });
```

Las variables `loadedBackground`, `loadedStation`, `loadedShip`, `canvas` y `drawActualHud` son dependencias del futuro laboratorio, **no funciones ya integradas en el juego**. No presentar este ejemplo como una demo jugable.

## 5. Puertas de aceptación

| Puerta | Estado |
| --- | --- |
| G0 Diagnóstico inicial | Documentado, integración general pendiente |
| G1 Ciclo de vida/RAF | 40/40 existentes; integración real pendiente |
| G2 Cámara y capas | Implementación aislada + 20 tests aprobados; QA visual pendiente |
| G3 Arte y animación | Pendiente |
| G4 Viaje Chronos → Gaia en Motor V1 | Pendiente |
| G5 Jugabilidad y guardados | Pendiente |
| G6 Rendimiento móvil | Pendiente |
| G7 Safari/iPhone físico | Pendiente |
| G8 Aceptación del propietario | Pendiente |

## 6. Próximo bloque exacto

Conectar `Camera2D` y `SceneCompositor` a un laboratorio que utilice los **assets reales de Chronos, Gaia y la nave modular actual**, sin modificar la campaña normal ni crear otro RAF. Ejecutar capturas comparativas y medir tiempos de frame. Solo después estudiar la migración controlada con CampaignAdapter.

**Motor V1: desactivado. `main`, PR #3 y producción: fuera de alcance.**
