# Revisión del README público

Fecha: 19/10/2026. **No se ha cambiado nada de lo que se señala aquí**; son
recomendaciones para que decidas.

Dato importante: el repositorio `adonay1994sm-gif/neon-cronium` es
**público** en GitHub (comprobado el 19/10/2026). Cualquiera puede leer el
README y todo el historial.

## Qué quitaría o cambiaría

| Línea | Contenido | Por qué | Propuesta |
|---|---|---|---|
| 5 | Enlace "Web privada de pruebas" a `(web privada antigua, retirada)` | Se llama "privada" pero queda expuesta a cualquiera; además el subdominio incluye un identificador de cuenta de un servicio de terceros. | Quitar el enlace del README. Si hace falta, guardarlo en una nota fuera del repositorio. |
| 3 y 7 | "Rama de integración `continuity-assets-audit-20261013`", "Motor V1 desactivado; sin publicación comercial", referencias a campañas/guardados internos | Información interna de desarrollo; no daña, pero confunde a un visitante y no aporta a un jugador. | Mover a `CLAUDE.md`/`AGENTS.md` o a `docs/`. |
| 5 | Enlaces a `docs/CODEX_STATUS.md` y otros documentos internos | Muestran estado y órdenes internas del proyecto. | Sustituir por un enlace a `docs/` o retirarlos del README. |
| 13 | Enlace a `docs/agents/NETLIFY_TEST_SETUP.md` | Describe la preview de Netlify de pruebas (`neon-preview-deploy.netlify.app`) y sus protecciones. | Mantenerlo solo si el repositorio pasa a privado. |
| 74–76 | Sección "Publicidad" | Correcta y sin datos sensibles (solo dice que hay IDs de prueba). | Se puede mantener. |

## Qué **no** aparece (bien)

- Ni correos, ni teléfonos, ni claves, ni tokens, ni IDs reales de AdMob.
- Los IDs de anuncio del código son los públicos de prueba de Google.

## Fuera del README (solo para tener en cuenta)

`AGENTS.md` y varios documentos de `docs/` mencionan la URL de la preview de
Netlify y nombres de proyectos de prueba. Si el repositorio sigue siendo
público, conviene valorar lo mismo para ellos. Ver
`docs/propuestas/REPO_PRIVADO.md`.
