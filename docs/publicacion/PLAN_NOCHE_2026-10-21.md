# Plan de trabajo nocturno · 21/10/2026

Orden del propietario: «créate suficientes tareas para que no pares; intenta
fusionar tú los cambios». Assets de referencia:
https://neon-cronium-video-referencia.chictide18.chatgpt.site (catalog.json).

Reglas de cada tarea:

1. Trabajar en `claude/preparar-publicacion-rtfl9q` (traer antes la base con
   `git merge --ff-only origin/continuity-assets-audit-20261013`).
2. Commits pequeños en español; CI completa en local (`check.sh`: build, test,
   static, content, architecture, engine, run-v7-web-tests, visual-artpass,
   audio-lifecycle) y `test:preview` en la copia de trabajo.
3. PR a `continuity-assets-audit-20261013` y **fusionarlo** si todo está verde.
4. Sin tocar balance, economía, guardados, anuncios, iOS ni `main`.
5. Marcar la tarea aquí y en `PROGRESO.md`.

## Tareas

- [x] **N1 · Planetas animados por sector.** Integrar los 4 atlas de 7
      fotogramas (volcánico → Vulkar, glacial → Cryon, violeta → Aether,
      tormentoso → Titan Omega) en el cielo dibujado de cada sector, con
      fundido entre fotogramas y giro lento. Pruebas y capturas.
- [x] **N2 · Capturas por nivel.** Nuevo `scripts/capture-levels.cjs`
      (`node scripts/capture-levels.cjs --levels 4,6 --wait 3`); el antiguo
      `visual-rebirth-capture.cjs` depende de menús retirados.
- [ ] **N3 · Especificación del mapa de sector.** `docs/design/MAPA_SECTOR.md`:
      planetas, rutas, bases, misiones y diálogo con personajes; qué existe y
      qué falta. Con los planetas del catálogo.
- [ ] **N4 · Mapa de sector jugable (sector 1).** Pantalla entre viajes con
      Chronos, la baliza y Gaia, rutas S1-V1…S1-V5 y la base C9; solo S1-V1
      abre por ahora. Sin cambiar guardados existentes.
- [ ] **N5 · Diálogo con personajes en las bases.** Escena de conversación
      con retrato, nombre y frases cortas (Mira en C9, Iria en Gaia), usando
      los retratos que ya existen.
- [ ] **N6 · Fase B · fichas S1-V2…S1-V5.** Rutas nuevas con el motor por
      fichas (paisaje y encuentros propios); Atlas pasa a S1-V5 (opción B)
      solo cuando V2–V5 sean jugables.
