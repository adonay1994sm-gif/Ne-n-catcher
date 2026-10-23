# DIAGNÓSTICO — paquete experimental Atlas

El sitio privado anterior servía naves modulares y no contenía este jefe. GitHub y el despliegue son entregas distintas. Se conserva el mismo sitio, audiencia privada, campañas y claves; no se publica producción Netlify ni PR3.

# INFORME DE PRODUCCIÓN — PAQUETE ATLAS

Fecha:17/10/2026. Rama del juego: continuity-assets-audit-20261013.

- SHA funcional y paquete limpio: **11dfa7bf7d3e287dd979c8dfc1dbafd8c1388473**; conservación anterior 009e5299e1d0cad12fadde787060d658ae87bb3b. Ambos comprobados en el remoto.
- Revisión: `41e1a8ebe6541b0e750357ea15f1d809cdafe3f2393e8366c08ea66dc80b7f56`, dirty:false, EngineV1:false.
- ZIP: [neon-cronium-atlas-11dfa7b.zip](evidence/guardian-atlas/package-11dfa7b/neon-cronium-atlas-11dfa7b.zip),6411035 bytes. SHA-256: `704c218ec499d956773ae1fec12565108b32a3d9d76a2d0c7c98d27c5955b081`.
- CRC del ZIP y hashes de108 archivos verificados frente a build-info.json. El propio build-info se conserva dentro del ZIP. Hash juego: `25200ad0049a8bf269b825757efcf9cd37fb1b3a907e2ac58656fa28626887d2`, coincide con Chromium visual04.
- Fuente de distribución: `ab1ea23893946f756ecaefc045bb8fc229914ccb`. Es el repositorio separado de Sites; su rama no es main del videojuego. Copia de dist cotejada archivo por archivo antes de publicar.

## Publicación real

**(web privada antigua, retirada)**

Sites devolvió **succeeded** a 12:08:42 UTC. Mismo project_id `appgprj_6ad34f65ce74819195e871d7dd99fe21`, owner-private conservado; puede requerir login en ChatGPT. Version_id `appgprj_6ad34f65ce74819195e871d7dd99fe21~appgver_1bed27aa450881919787e4df8e18d3ab`, deployment_id `appgdep_6ad365395a248191a966d7e730cb5bd7`. [Respuesta nativa sin credenciales](evidence/guardian-atlas/package-11dfa7b/site-deployment.json).

El acceso Git de GitHub falló una vez por falta de credencial HTTP interactiva; se repitió con la credencial de entorno en memoria, sin escribirla en archivos o comandos. Push normal exitoso y SHA remoto 11dfa7b comprobado. La credencial del repositorio Sites también se manejó únicamente en memoria/stdin. No se modificó la audiencia ni se crearon sitios nuevos.

No se ha jugado remotamente desde un navegador autenticado ni desde iPhone. La confirmación de publicación no sustituye esas pruebas. Durante la publicación seguía corriendo Chromium natural03 local; no se declaraba aprobado antes de terminar.

## Cómo probar

1. Abrir la URL, marcar **Desbloquear los diez niveles clásicos para probar** y entrar en campaña clásica.
2. NIVELES → Perímetro Atlas → INICIAR EXPEDICIÓN.
3. Recuperar45 fragmentos. Esto inicia al guardián, conserva el objetivo original y añade dos fases con avisos, respuesta de daño y permiso de paso.
4. Alinear la nave con su núcleo para disparo automático; PULSO AUTO permite modo manual. Esquivar salva fijada y seguir la franja de paso en la doble cortina. Pausa y reinicio disponibles.
5. HANGAR conserva Astér/Bastión, mezclas de piezas y nave original. N-7 y Journey son variantes históricas, con guardados separados.

Para Netlify Drop sin credenciales, extraer el ZIP y subir el directorio cuya raíz contiene index.html y build-info.json. No subir una carpeta adicional que cambie las rutas. No se ha ejecutado otro despliegue Netlify.

## Alcance verificado y pendiente

Once fases locales aprobadas, contenido 105/105; ajustes finales de HUD con legacy 8/8, static 13/13, preview 16/16 y Chromium visual controlado10/10 en tres tamaños. [Informe funcional](GUARDIAN_ATLAS_2026-10-17.md). Los intentos naturales01(muerte) y02(timeout tras llegar a Atlas) se conservan. La partida completa03 seguía en curso al crear este acta.

Ocho poses ilustradas no equivalen a ocho ciclos de animación completos. Arte pendiente de aceptación; rendimiento headless bajo y Safari físico pendientes. Cien etapas están diseñadas editorialmente, no implementadas. El juego completo y los otros guardianes no se declaran terminados.

## Verificación posterior de la misma revisión

La sesión natural03 terminó **PASSED, código 0,3/3 grupos**, mismo hash25200ad…:45/45 CRONIUM, ambas fases, desactivación y victoria guardada; casco 32 %, misión 3 desbloqueada, guardado N-7 intacto. Regresión Chromium clásica/N-7 **2/2**, código 0; no es una nueva partida N-7 completa. [Evidencia natural](evidence/guardian-atlas/browser-natural-03/results.json), [regresión](evidence/guardian-atlas/legacy-n7-regression-01/results.json). No se modificó ni se volvió a desplegar otro código entre el paquete publicado y estas comprobaciones. El sitio sigue sirviendo 11dfa7b; commits posteriores cierran documentación/evidencias.
