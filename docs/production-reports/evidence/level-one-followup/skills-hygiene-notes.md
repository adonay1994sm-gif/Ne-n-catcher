# Entrega skills / higiene / Netlify · 2026-10-18

Propietario: skills_hygiene_netlify. Fuentes congeladas al entregar; no otros edits activos de este agente.

## Cambios

- Skill NUEVA `.agents/skills/neon-interface-review/SKILL.md`, adapta interacción/C9/ayudas breves al DOM+Canvas actual, foco, pausa/2contactos, estadoscompra, transición200msreducible, controles44px.
- Dos skills GitHub reales wshobson/agents commit0874a27b17a22e2b7c2e2bcd725768e0803cad06: `plugins/ui-design/skills/interaction-design/SKILL.md`, `plugins/ui-design/skills/accessibility-compliance/SKILL.md`. LicenciaMITcopyright2024SethHobson. Fuentes leídas completas, más2referenciasaccesibilidad;5archivosíntegros bajo `tools/third-party/skills/wshobson-ui-design/`; SOURCES.jsonahora14hashes, sin deps/npm ni ejecutar snippetsReact.
- Aplicación: diagnosticado C9flightDock sin dialog/foco en HEADd4mientras hangar sí tiene. Requisitos concretos compartidos con hud_c9_design para adaptaciónreal; validación del juego queda en su entrega e integrador. NO afirmar WCAG/VoiceOvercertificados.
- `scripts/repository-hygiene.mjs`: inventario defaultREADONLY, gitsinoptionallocks, clasificación tamaños, duplicadosopcionales>=256KiB, outputs generadosaúntracked, sin seguir enlaces. No opciones delete/cleanup. --output NEWFILE exclusivo, impide metadatos.git directos/symlink.
- `tests/repository-hygiene.test.mjs`:6pruebascontemporalesgit, conservaciónbytes/estado, duplicadosretainhistory,rechazoflagsdestructivos/nooverwrite/.git+symlink, outputsduplicateslegítimos.
- `.gitignore`: sóloañadido `.netlify/` para estado/máquinalocal.
- `docs/agents/OPEN_SOURCE_REVIEW.md` extensión fuentes/adaptaciones/aplicación/medidaslimitadas.
- `docs/agents/NETLIFY_TEST_SETUP.md`: guía paquete estáticodestinoTESTaisladoybranchdeployexclusiva, no main/producción.

## Pruebas / evidencia local

- `node --test tests/repository-hygiene.test.mjs`:6/6 salida0 `/tmp/neon-hygiene-tests-20261018.txt`.
- `python3 tools/third-party/skills/openai-skill-creator/scripts/quick_validate.py .agents/skills/neon-interface-review`:salida0 `/tmp/neon-interface-skill-validation-20261018.txt`.
-14/14hashesfuentescoinciden.
- `node --test --test-name-pattern='opt-in|gate|contexts' tests/preview-build.test.mjs`:1/1 salida0 `/tmp/neon-netlify-gate-tests-20261018.txt`.
- `node scripts/repository-hygiene.mjs --duplicates --output /tmp/neon-repository-hygiene-final-20261018.json`:salida0. Este snapshot tiene HEADd4b08dcdirty por agentes; tracked3625bytes898820994(discosegún fuentesenmovimiento),17gruposbinariosidénticos. NOatribuirlo SHA limpiofuturo.
- Auditoríainicial antesfuentesrestantesbytes898802115(revisióndocumentoOSS), deellos579344206evidenciaproducción,119356650otradocumentación,168907994maestros. Conservar.
-28copias generadas TRACKED dentro www/ yios/App/App/public:6561594bytes. Rootautorizó/root hará `git rm --cached -- rutasexactas` sin borrardisco/fuentes/historial. Listadoexacto en JSON`trackedGeneratedOutputs.paths`. EsteagenteNOdesindexóesosarchivosporquepropiedadintegrador.
- `git diff --check` en3archivoseditadosexistentes+`node --check scripts/repository-hygiene.mjs`:salida0.

## Netlify

CLIpath=false;CLIlocal=false;NETLIFY_AUTH_TOKENpresent=false;NETLIFY_SITE_IDpresent=false;.netlify/state.json=false;configuserhabitual=false. No se leyeron/mostraron valoressecretos. Sin instalaciónCLI,login,deploymentniURLinventada.
Configactualya branchpreviewoptin NEON_PREVIEW_DEPLOY1; sólo CONTEXTbranch-deploy/local permitido. Una nuevawebTESTcon larama como productionbranchNOsirve:productionrechazadodeliberadamente. Guíaadvierte eso yofrece manualuploaddepreview-dist verificable al destinonuevoyaislado.
RootpuedemostrarenREADMEunrumboprincipal,conlinksSkill+Netlifyguide+hygienecommand. No heeditadoREADME/netlifytoml/package/manifests/bundles/fuentes. Añadirtesthygienea contento certifysuite es decisióndelroot.
