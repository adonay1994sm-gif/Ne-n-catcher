# NEON CRONIUM — observación de rendimiento de Gaia / Atlas

Fecha: 2026-10-18 (UTC). Revisión de código y evidencias existentes, sin ejecutar otro navegador, modificar fuentes, optimizar ni compilar.

## Resultado observado y alcance

La lentitud de la recogida de Gaia **persiste con un único navegador**. No debe atribuirse únicamente a la concurrencia ni darse por cerrada al aprobar el combate. En la partida natural03, el tramo de recogida registró **10,360929 RAF/s**, y Atlas **59,911080 RAF/s**. Es una diferencia de aproximadamente 5,78 veces en el mismo recorrido y paquete; la causa sigue sin confirmarse.

Paquete probado: `8d651b51453c143d395d3feb8c0d5629066a72c9`, build-info `dirty=false`, revisión `e3c5e4e510b6ef04ffd4b3738f86a9057730cddcf5fb33fb411bb69938f61a31`. Bundle original HTTP y archivo en disco coinciden: SHA-256 `b4a7fc21f0502dcdfeb01835e30faa1c8ef49debcf50d0f6c73578637a8e5d47`.

Chromium real headless, 390×844 CSS, DPR1, Canvas lógico 720×1558 antes y después de entrar en Atlas. Un único propietario RAF, máximo pendiente 1, sin errores JavaScript ni recursos fallidos. No se activó Motor V1. La ejecución03 fue coordinada como único navegador QA; no se registró un perfil global de CPU/GPU del host. Las cifras describen este entorno de escritorio, no un iPhone ni fluidez visual certificada del dispositivo.

## Mediciones ya disponibles

Se usa `(frames_final-frames_inicial)/(wall_final-wall_inicial)` a partir del observador del RAF existente. No son tiempos instrumentados de `render()` ni un perfil del rasterizador. Intervalos con muestras del mismo tramo; las capturas/pausa o la interacción del arnés pueden introducir variación. No se aceleró ni alteró el reloj: `frame()` mantiene el límite de delta 0,034s, por lo que una cadencia baja también ralentiza la simulación respecto al reloj de pared.

| Ejecución/tramo | Muestras | Pared entre extremos | Simulación entre extremos | RAF contados | RAF/s | Entidades: mín./media/mediana/máx. |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 01 recogida, concurrencia; abortada |103|138,810s|17,1173s|508|3,659679|1 /7,9903 /8 /12|
| 02 recogida, aislada |111|120,363s|44,2279s|1350|11,216071|1 /8,1892 /8 /13|
| 02 Atlas, sólo comienzo |3|2,517s|2,0665s|151|59,992054|0 /0 /0 /0|
| 03 recogida, aislada |110|120,356s|42,2256s|1247|10,360929|1 /8,1364 /8 /11|
| 03 Atlas |84|86,595s|86,1139s|5188|59,911080|0 /3,9524 /5 /12|

La ejecución01 terminó por SIGINT del coordinador (130), no por fallo de gameplay. La02 terminó por una aserción incorrecta del arnés al exigir `vx===0` en lugar del residuo trigonométrico5,63e-14; no fue un fallo de rendimiento ni del producto. La03 pasó 4/4: 45 fragmentos recuperados, jefe 24→0 HP con 26 disparos manuales Pulse, recompensa persistida y continuación a Vulkar. Eso demuestra viabilidad funcional, **no elimina el problema de rendimiento de la recogida**.

En03, la recogida baja desde unos 12–13 RAF/s hacia aproximadamente8–10 a medida que hay 7–11 entidades; sus intervalos de muestreo van de6,5094 a 31,1891RAF/s. Tras entrar Atlas, el primer intervalo superior a 55 RAF/s termina en wall 122429ms /elapsed 45,7363 /boss age 1,584 /0 entidades; los intervalos del combate oscilan entre 57,1705 y 60,4915RAF/s. Atlas llega a 12 proyectiles simultáneos y mantiene esa cadencia: **el total bruto de entidades no explica por sí solo la diferencia**. El arnés no registró un desglose continuo de tipos de objeto, rings, parts ni tiempos de cada función; no deben inventarse esos datos.

## Caminos concretos que cambian

1. `src/game/08-loop-input-bootstrap.js:1`, `render()`, usa el mismo orden de fondo, objetos, nave, impactos y partículas. Durante la recogida hay `drawEnergy`, amenazas, patrullas y poderes; los proyectiles de Atlas pasan por `drawAtlasProjectile` y el jefe por `drawGuardianAtlas`.
2. `src/game/06-world-rendering.js:400`, `drawGaiaOrbitBackground()`, se mantiene activo tanto en recogida como en Atlas: imagen espacial escalada con alpha 0,46, 24 estrellas secundarias en calidad normal, planeta independiente, 2 relés y velo de lectura. `background()` retorna antes del fondo genérico cuando estas capas están listas. Por tanto, las 118 estrellas del fallback, las cintas genéricas y su desenfoque de primer plano **no son un extra demostrado exclusivo de la recogida**. La composición del planeta cambia con `collected/goal`; no se midió su coste, pero la ruta del código no se sustituye por un fondo barato al comenzar el jefe.
3. `src/game/07-player-item-rendering.js:381`, `drawEnergy()`, crea un gradiente radial por orbe y fotograma, usa `screen`, dos cambios de `shadowBlur`, relleno de halo, dos circunferencias, composición de imágenes del núcleo y fragmento, punto central y hasta 5 partículas de proximidad. El escalado visual 0,5 conserva la colisión; no vuelve gratis la composición. Estas operaciones desaparecen del campo al consumir el último fragmento.
4. `drawMeteor`, `drawCh01Frame`, `drawDebris`, `drawSatellite` y `drawPower` añaden sombras por objeto (aproximadamente12–28 unidades), rotación y sprites. `drawAtlasProjectile` en cambio compone un recorte ilustrado sin asignar una sombra por proyectil. El coste de sus tipos puede diferir aunque ambos campos tengan 12 entidades.
5. `src/game/03-ui-game-flow.js:477`, `beginAtlasEncounter()`, vacía `items`, `gates`, `shots` y proyectiles propios. `src/game/05-corridor-update.js` deja de generar el campo ordinario y no ejecuta `updateGateSystem` durante Atlas. Antes del jefe, el bucle también resuelve movimiento, IA, hitboxes, pasillo protegido, recogida y suministros por objeto. Puede existir coste de actualización además del de dibujo; no se separaron aún.
6. Cada captura de CRONIUM añade partículas (`burst` de 9, escaladas por calidad) y una onda estilo`capture`, dibujada con `shadowBlur` y hasta dos trazos. Los efectos tienen límites y vidas; falta el recuento observado para medir su contribución. El rastro del motor, el ensamblaje modular y las partículas pequeñas de daño existen en ambas fases. Con casco 66/54, la nave modular evita el antiguo humo grande en ambas; quitar humo no explica por sí solo la diferencia de estas muestras.
7. Como factor de medición a controlar, el piloto y su hook hacen trabajo distinto: `recoveryTarget()` evalúa candidatos, predicciones y polígonos de amenazas; `combatTarget()` sigue trayectorias de proyectiles. Las consultas de diagnóstico y escritura de JSON también consumen recursos. No se midió su coste por separado. No deben confundirse con tiempo de gameplay del producto.

## Comparación histórica con c4d528c

Se compararon las fuentes del paquete 8d con `c4d528cd75bb7b40a21b693540179c0470b524ed`, sin cambiar de rama. Las funciones `drawGaiaOrbitBackground`, `drawEnergy`, `drawMeteor`, `render` y `beginAtlasEncounter` son **idénticas byte a byte** en ambas revisiones. El cambio de 06 de este lote afecta al recorte/poses de C9, no al fondo Gaia. El nuevo atlas Pulse y los destellos se usan durante combate; en la recogida 03 hubo cero activaciones de arma hasta Atlas. La IA v2 sí cambia comportamiento y duración de patrullas. No se ejecutó una medición equivalente del baseline c4; por ello **no se puede declarar ni descartar una regresión temporal del lote** sólo con esta comparación.

## Hipótesis, no causas confirmadas

La primera hipótesis es coste de rasterización/composición de los orbes y las sombras de amenazas, acentuado por el renderizador de escritorio usado aquí. Su relación con el cambio brusco al limpiar el campo la convierte en buen objetivo de perfilado; todavía no demuestra qué función domina. La segunda es el conjunto de capturas/ondas, actualización de patrullas/colisiones y trabajo del arnés. El fondo compartido y el número total de objetos deben mantenerse como variables de control, no como explicación cerrada. No se tomó CPU profile (`--profile-cpu` estaba desactivado), trace de raster/GPU ni memoria decodificada; el perfil opcional existente además sólo cubre el menú, no esta fase.

## Dos rutas siguientes, en orden

1. **Perfilar una sola partida de Gaia antes y después de Atlas.** Mismo paquete, 390×844/DPR 1, misma calidad y configuración; registrar un trace CDP de CPU/raster y tiempos observacionales de `update`, `render`, `drawEnergy`, resto de objetos, efectos y `background`, sin añadir RAF ni cambiar tiempo/HP/spawns. Añadir recuentos por tipo y efectos; medir también el piloto/inspección/JSON o reducirlos en una variante observacional comparable. Capturar dos ventanas estables y compararlas. Repetir el baseline c4 con el mismo método si se pretende afirmar regresión. Entregable: perfil con contribuciones y frame-time, no otro promedio global.
2. **Sólo con ese perfil, aislar y corregir el coste dominante en una prueba controlada.** Si son los halos/sombras, comparar composición actual con halos precompuestos/caché acotada manteniendo aspecto, tamaño y radios; si domina update/colisiones o el arnés, actuar sobre esa ruta en vez de degradar el arte. Comparar A/B en fixture identificado como tal, luego repetir recogida natural y Atlas manual, HUD, pausa y guardados. No basta bajar calidad: `drawEnergy` mantiene el halo/sombras aunque la calidad reduzca estrellas y partículas. Confirmar además Safari/iPhone por separado cuando haya dispositivo.

## Evidencias

- `/tmp/neon-polish-atlas-manual-01/coordinator-stop.json` y resultados previos al corte.
- `/tmp/neon-polish-atlas-manual-02/results.json` y `failure-analysis.json`.
- `/tmp/neon-polish-atlas-manual-03/results.json`, SHA-256 `8558676863000952effc02f62754dbc421505a34b4bd3b2cddd16b8217c99c03`.
- `/tmp/neon-polish-atlas-manual-03/verified-summary.json`, SHA-256 `fe761b82846b91e4f3c44d8862c4344a5ca9d208f8f81a0d1f80b11e63ae31fc`.
- Arnés usado 03 SHA-256 `6f17475718d02024f510b095c4b46fadc20177a13564ae2d24783e745a0d14bc`.

Estado: **riesgo de rendimiento abierto, diagnóstico pendiente de perfilado**. Ninguna optimización ni nueva certificación de navegador realizada durante esta revisión.
