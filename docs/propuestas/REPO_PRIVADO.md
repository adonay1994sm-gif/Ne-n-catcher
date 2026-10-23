# PROPUESTA · Hacer privado el repositorio

> Estado: **PROPUESTA**. Lo decide y lo hace el propietario en GitHub
> (Settings → General → Danger Zone → Change visibility).

## Situación (19/10/2026)

`adonay1994sm-gif/neon-cronium` es **público**. Expone: todo el código y el
arte del juego que se va a vender/monetizar, los másteres de `art-source/`,
documentos internos (`AGENTS.md`, `docs/CODEX_*`), la URL de la "web privada
de pruebas" del README y la URL de la preview de Netlify.

## Ventajas de hacerlo privado
- Protege el arte, la música y el código antes del lanzamiento.
- Evita que se lean planes, estado interno y URLs de pruebas.
- Reduce el riesgo de clones del juego publicados por terceros.

## Riesgos / costes
- **Netlify** y cualquier otra integración conectada al repositorio deben
  seguir teniendo acceso (normalmente sí, mediante su app de GitHub; comprobar).
- **GitHub Actions** en repos privados consume minutos de la cuota del plan.
- **Git LFS** y almacenamiento cuentan contra la cuota de la cuenta.
- Lo ya publicado puede existir en clones o forks ajenos (hoy 0 forks).
- La política de privacidad y los términos necesitan una URL **pública**: si
  hoy se sirven desde este repositorio o desde Netlify, comprobar que siguen
  accesibles.

## Pasos
1. Revisar que Netlify y las apps conectadas tienen acceso a repos privados.
2. Cambiar la visibilidad en GitHub.
3. Comprobar que la web de Netlify sigue desplegando y que `privacy.html`
   y `terms.html` son accesibles sin sesión.
4. Ejecutar el workflow de `.github/workflows/` una vez.
