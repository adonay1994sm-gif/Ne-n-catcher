---
name: capturas-juego
description: Captura imágenes y vídeo del juego real de NEON CRONIUM en Chromium a 390×844 (tamaño iPhone) para revisar arte, HUD o cinemáticas. Úsala antes de opinar sobre algo visual, para dar evidencia a director-arte o critico-juego, o cuando el propietario pida ver cómo queda el inicio.
---

# Capturas del juego

Skill propia del proyecto. Usa el Playwright que ya está instalado en el
entorno (no añade dependencias ni descarga navegadores). Las capturas no se
versionan: se guardan fuera del repositorio o en `docs/**/evidence/`, que
está en `.gitignore`.

## Captura rápida del inicio (script `scripts/capture-intro.cjs`)

1. Genera el paquete web: `npm run build` (crea `www/`).
2. Lanza la captura:

   ```bash
   node scripts/capture-intro.cjs --times 1,5,9
   node scripts/capture-intro.cjs --times 1,3,5,7,9,11,13 --video
   node scripts/capture-intro.cjs --times 9,9.5,10 --output docs/design/evidence/intro-ruptura-01
   ```

3. Mira cada imagen con la herramienta Read (son PNG de 780×1688, 390×844 a
   escala 2). Para una cinemática, mira varios fotogramas seguidos, no uno.

Qué hace: sirve `www/` con un servidor estático local, abre Chromium sin
ventana a 390×844 (táctil, escala 2, service worker bloqueado, perfil nuevo
en memoria), pulsa `#play` y `#launch`, y guarda una captura en cada
segundo pedido, contado desde la pulsación de `#launch`.

| Opción | Por defecto | Para qué |
|---|---|---|
| `--times 1,5,9` | `1,5,9` | Segundos desde `#launch`. Admite decimales. |
| `--video` | apagado | Graba `intro.webm` de toda la sesión (menú incluido). |
| `--output DIR` | `<tmp>/neon-capturas/intro-<fecha>` | Carpeta de salida. Se niega a reutilizar una carpeta que ya tenga `results.json`. |
| `--root DIR` | `www` | Paquete a servir (por ejemplo una copia de otra rama). |

Salida: `intro-<s>s.png`, `intro.webm` (si se pide) y `results.json` con
tiempos reales de cada captura, versión de Chromium, errores de página,
errores de consola y peticiones fallidas. Sale con código 1 si hubo errores
de página o fallo de navegación.

Límites (dilos siempre al informar):

- Es Chromium sin ventana; **no certifica Safari ni iPhone físico**.
- Los tiempos son de reloj de pared; el reloj interno del juego puede
  desviarse unas décimas. Para fotogramas exactos de una pose hace falta un
  gancho controlado como el de `scripts/visual-rebirth-capture.cjs`.
- Siempre arranca con perfil nuevo (primera partida). No usa ni modifica tus
  guardados.

## Capturas más completas (scripts existentes)

Estos scripts ya existen y prueban más cosas, pero necesitan el paquete de
preview (`npm run build:preview` → `preview-dist/`) y a veces un commit
esperado limpio. Lee sus argumentos (`parseArgs` al principio) antes de usarlos:

- `scripts/visual-rebirth-capture.cjs --levels 1,2 --output DIR`: un fotograma
  por nivel y la onda de choque congelada en 4 fases.
- `scripts/current-level-visual-smoke.cjs`, `scripts/chapter-one-visual-smoke.cjs`,
  `scripts/hud-redesign-smoke.cjs`: escenas controladas, HUD y geometría de
  botones (44 px, solapes, desbordamiento) con `--root`, `--output` y
  `--expected-commit`.
- `scripts/combat-readability-smoke.cjs`: legibilidad en combate.

## Alternativa: Playwright CLI

La skill `playwright-cli` (Microsoft, Apache-2.0) sirve para explorar a mano
(pulsar, mirar, capturar paso a paso). Aquí **no está instalada** la orden
`playwright-cli`; instalarla (`npm install -g @playwright/cli`) descarga
paquetes y necesita permiso del propietario. Mientras tanto, usa este script.
