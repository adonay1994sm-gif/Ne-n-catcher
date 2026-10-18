# Revisión independiente de integración ·2026-10-18

Revisión READONLY de fuentes actuales sobre HEADd4b08dcb2f22268944aa73fc4b71bca5f3496c7e, árbol sucio por lote activo. No se editaron fuentes ni se ejecutaron suites/navegadores. Integrador certificaba por separado; esta inspección no sustituye sus resultados.

## Hallazgos confirmados

### P2 ·C9 no devuelve el foco después de una compra

- `src/game/03-ui-game-flow.js:106`: compra completada ejecuta`hud()`.
- `:1162` hud termina en`syncClassicFlightHud()`; `:431` deshabilita`classicC9` porque estado siguepaused.
- `:376–380`closeClassicDock restauraestado playing y llama`focus()`antesde resincronizarhabilitación. Un botón disabled no recibefoco; el siguienteRAFhabilita elbotón pero no recuperaelfoco.
- Caso real: abrirC9desdeHUD→comprarrefri/placas/misiles→cerrar. También seproduce al cambiar dearma enC9, que resincronizaHUDmientraspaused.
- Corrección mínima: `syncClassicFlightHud()` despuésde volverplaying yantesde focus. Regresión compra→cierre→activeElementC9 y reapertura real; pruebaexistentecompra→close→.clickC9 nocontrola estado del segundoopen.
- Comunicado alintegrador, confirmado; él corregirádespuésde terminarfuentescongeladascertificación03. Noapliquéelcambio.

### P2 ·C9 promete reparación que no ofrece

- `src/game/03-ui-game-flow.js:398–400`: elpaneldice«casco reparado»o «reparación de emergencia gratuita».
- `src/game/narrative/flight-tutorial.js:13`: ayuda promete«pausar, reparar y mejorar».
- Contrato realnuevo de`openClassicDock('hud')`conservahull sincurarloy nohaybotónreparar. Únicacuración sigueautomática en hito1.6, `03:327–335`.
- Corregirlasfrases aconfigurar/mejorar, oimplementaracciónreparar deliberadaenotrolote. Nopropongocuraralabrir: reabrirpanelnuncadebereponerrecursosgratuitosporaccidente.

## Áreas revisadas sin hallazgos graves confirmados

- PausaC9usaestadoexistente; update retornaantesdelprogreso/combate alnoestarplaying. Conservaitems/projectiles/batería, limpialosdoscontactos, nocreaRAF. Escape delpanelcortapropagación yescapegeneralderivaa close; noreabrepaused.
- CompatibilidadserviceWaitingv2: startLevelllamaresoluciónautomática deservicio; modelo resolveServiceidempotente, preservahito antiguoend1.6y checkpoint coherente. Noencontrébloqueopermanente porelsaveantiguo.
- Tutorial recibeadvance en dospuntosactuales pero rechazatiemporepetido ymarcaidantesdelcallback; nohaydobleemisión comprobableporestalectura.
- IAAtlasv6: movimientoactualiza núcleo realx/y, proyectilesusanorigendelaunidad enelmomento de disparo, decisionesleen observacioneslimitadas. Hitventanas, phasebreak yterminalrecompensa siguenmodeloexistente; no nuevoraf/propietariociclo.
- Cometv3: versionado,semina/trayectoriasdeterministas,validaciónintervalosexactosdelcorredor, integrate balísticaunavez, permisosdeestrechamientonocambiancolisiones a escondidas. Resumedelta limitado/respawn7s, ráfagasdistintas no seencimansi anterior siguefísicaenlentitud.
- Netlifytomlconservado. Gaterama/optin/contextorestringido; sin CLI/token/siteId/link y sin URLnuevaverificada. Noproducción.
- Limpieza28copiasgeneradasretiradassólodelíndice. Directorios siguenignorados ypipeline losregenera. Nomasters/assetssrc/evidenciaseliminados. Ramaautorizada yUSE_ENGINE_V1falseconservadas.

## Hashes de fuentes inspeccionadas

- `src/game/03-ui-game-flow.js` SHA256`f0a34defb7d22626d9b3c7620427950d914abf0a5b67df3cad990997d53f3062`
- `src/game/05-corridor-update.js` SHA256`81c98e3597869478ae9a2c1ea37c56c2af9e261b88817502e12a4b25d53cae72`
- `src/game/combat/guardian-atlas.js` SHA256`8dec9f2b090a0beafca2de966c0658c8406316fc23ac8c8441a64cdc7704ee6c`
- `src/game/progression/comet-shower.js` SHA256`e19ee990deb0181095037762f29a9dd6a78db03b503427fc7c9e6d2cd8e01ea1`
