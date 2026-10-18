# Evidencia MAIN_SALVAGE_COMBAT ·18/10/2026

Runtime publicado `b2a89f694215bddba3a5ba2f6d1a68a03c70cccd`, revision `293f66b839af486afa5486715fc56b7e176bb9d03b5511495c4139e53ff93130`, árbol limpio al empaquetar.

- `certification-01`: once comandos completos, salida0; snapshot local previo al commit. Su SHA inicial es39f7b06 y registra el árbol sucio/fingerprints; el código probado coincide con el integrado. Los cambios posteriores del gate/metadata se verifican mediante los registros preview03 y el CI del runtime limpio.
- `*-01` de preview conservan el fallo del gate que exigía los modos antiguos. `preview-tests-02` conserva22/23 por ausencia de SHA en el launcher. `preview-*-03` registra el cierre23/23 sobreb2a89f6.
- `perf-before` corresponde al Site17/8d651b5; `perf-after` al runtime nuevo. Misma ventana12s, dispositivo lógico y control en reposo; no son pruebas físicas.
- `atlas-manual` es el intento fallido por selector del harness; `atlas-manual-02` contiene la partida natural corregida. `c9` y `comets` declaran sus checkpoints instrumentados. Gaia sólo declara el desbloqueo/equipamiento inicial; no cambia enemigos en ejecución.
- `offline` prueba actualización del SW desdeSite17 y decodifica ambos nuevos atlas sin conexión. `two-touch` usa contactos CDP reales, sin generar munición ni progreso desde el hook.
- `site-http`: seis respuestas reales autenticadas con hashes. `site-local`: dos comprobaciones Chromium de la distribución exacta del Site. No confundir HTTP remoto con Chromium remoto.
- Capturas de juego en carpetas Chromium; contactos artísticos exportados se conservan en art-source, sin presentarlos como gameplay. Encomets/07 C9 está abriendo su fade; para la apariencia estable del taller utilizar c9/02.
- No hay Safari/iPhone físico, build firmado ni producción Netlify.
