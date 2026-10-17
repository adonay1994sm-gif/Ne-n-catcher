## Publicación vigente — hangar y campaña clásica · 17/10/2026

URL confirmada: **https://neon-catcher-pruebas.chictide18.chatgpt.site**. El selector ofrece primero la campaña clásica y su nuevo HANGAR. Astér/Bastión, piezas combinables, selección persistente y nave anterior recuperable. Arte en revisión; jugabilidad completa pendiente.

Paquete limpio del juego: 2cfb5d4e750d805e0d928a05e02e1b93197d9fa8; código1bb8a76 y pruebas0c056bf. SHA-256 de juego: cd64ffaa94bff331b94eb00539a03254df1bacde6e690957b4f3a3b50987ed74. Revisión:c77b06b48514dc2035c67b6011229cf69bd8390d479d0c43109e6a3dff072ec4.

- project_id: appgprj_6ad34f65ce74819195e871d7dd99fe21 (conservar).
- version_id vigente: appgprj_6ad34f65ce74819195e871d7dd99fe21~appgver_84691499a4508191a136ab43e3069f96.
- deployment_id vigente: appgdep_6ad3576bcce48191942dbd7d86591eff, succeeded.
- Commit de distribución: c66c5926ca095166f48bc127a59a4248c00b6616.
- Audiencia owner-private conservada; puede requerir inicio de sesión en ChatGPT.
- [Acta del paquete](production-reports/PAQUETE_NAVES_MODULARES_2026-10-17.md); fuente del sitio sigue en /workspace/sites/neon-catcher-pruebas, manifest .openai/hosting.json, static.directory=dist.

Las identidades de versiones anteriores siguientes son históricas. Reutilizar este mismo proyecto y leer su acceso actual antes de una nueva actualización. No crear un sitio nuevo ni afirmar que el push a GitHub lo publica solo.

---

Historial conservado:

# NEON CATCHER — sitio privado de pruebas

URL publicada y confirmada por Sites el 17/10/2026:

**https://neon-catcher-pruebas.chictide18.chatgpt.site**

El propietario puede abrirla directamente, también desde el iPhone, sin entrar en Netlify. La audiencia es privada de su cuenta de ChatGPT; puede requerir iniciar sesión. El acceso principal abre la demostración Chronos → Gaia. Las entradas clásica y N-7 se conservan como regresión. El sitio es independiente de producción, del dominio Netlify y de PR #3.

## Revisión publicada

- Paquete limpio del juego: `24b591ca6814e21a8cfd75eb017ad869b18e1e66`.
- Código funcional: `ce71b299cb0eea8cbb908dd4886319e4e859580e`.
- `dirty:false`, `engineV1:false`, tres entradas resueltas.
- SHA-256 del ejecutable `juego/game.js`: `95d502d76f1f3bfa6cbe44877468c14bbfa55b23d903fe9b6b115745bcc9f696`, idéntico a la partida Chromium natural aprobada.
- Publicación Sites: `succeeded`, versión 1. El resultado nativo confirma la publicación; no se repitió una partida remota ni se certificó Safari/iPhone.

## Identidad que debe conservarse al actualizar

- `project_id`: `appgprj_6ad34f65ce74819195e871d7dd99fe21`.
- `version_id`: `appgprj_6ad34f65ce74819195e871d7dd99fe21~appgver_e793dbc74bd48191acf20e961e23f4a9`.
- `deployment_id`: `appgdep_6ad34fd946308191893159f22cfe55e4`.
- Commit fuente del alojamiento: `fbc711c97b16ab0d9392b59036edb22c222b4b17`.
- Checkout de distribución: `/workspace/sites/neon-catcher-pruebas`; manifest `.openai/hosting.json`, directorio estático `dist`.

El repositorio de distribución creado por Sites contiene únicamente el paquete estático y su manifest. Su rama de distribución es independiente de la rama main protegida del juego, que no se modificó. No se almacenan credenciales en estos archivos.

## Próximas actualizaciones

1. Continuar el juego en `continuity-assets-audit-20261013`, verificar y guardar un paquete de revisión identificable.
2. Leer este documento, el manifest de alojamiento y el estado actual del mismo Site; **no crear otro Site**. Conservar el `project_id`, slug y audiencia privada.
3. Sustituir `dist` por el nuevo paquete probado; conservar su `build-info.json`, recursos y rutas. Los guardados permanecen en el mismo origen y requieren compatibilidad/migración explícita si cambia su formato.
4. Obtener credencial efímera mediante Sites, pasarla solo por stdin, sincronizar la fuente exacta y empaquetar manifest+dist. Los helpers Sites no estaban instalados en este entorno; se usó Git autenticado en memoria y tar como alternativa, sin guardar tokens.
5. Guardar y desplegar la versión privada, comprobar el resultado y registrar revisión/URL. El enlace anterior puede seguir siendo el mismo. Un push al repositorio del juego **no** actualiza automáticamente este Site; la publicación debe ejecutarse en la sesión de desarrollo.

Los datos guardados en otros dominios no se importan automáticamente. Las partidas antiguas permanecen allí; no se borraron. Producción, main, PR #3 y Engine V1 conservan sus restricciones.
