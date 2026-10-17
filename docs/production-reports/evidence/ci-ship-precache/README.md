# Evidencia Chromium — nave actual sin conexión

Prueba final: [offline-06/results.json](offline-06/results.json), **4 grupos aprobados, 0 fallidos, salida 0**, 19.152 ms. Chromium `154.0.8037.57` en Linux, viewport táctil emulado de 390 × 844, DPR 1.

Paquete probado: `f69d3651e9a180c8502d17aa523a27d9abed92e7`, `build-info.json` con `dirty=false`, revisión `db6313abea48cd98c196b1211b6976b32e56094ae1aa9f9147fbe2034c7626f2`. Los archivos del paquete mantienen exactamente sus hashes antes y después. El estado Git del momento de la prueba se conserva separadamente en el JSON: el nuevo harness y las evidencias todavía no estaban publicados; eso no modifica el paquete ya construido.

Comando ejecutado:

```sh
node scripts/ship-offline-browser-smoke.cjs --root preview-dist --output docs/production-reports/evidence/ci-ship-precache/offline-06
```

SHA-256 del script final, de `offline-06/used-harness.cjs` y del campo `harness.sha256` del JSON, comprobados iguales:

`6674ba8db8e68bf6b48583e0cf1552b4cfbe4adfd55f86e5669157094745f540`

## Qué acredita

- Instalación nativa de los dos service workers en un contexto inicialmente vacío. Las respuestas de caché del retrato modular, atlas modular y cometa actual tienen los mismos bytes y SHA-256 que el paquete en disco. El retrato se comprueba en ambas cachés; los otros dos recursos en la caché del juego.
- Las cachés no contienen `ship_frame_00…05.webp` ni el atlas anterior del cometa; ninguno de esos recursos se solicita durante el flujo normal.
- Páginas nuevas, caché HTTP desactivada por CDP y red realmente desactivada (`navigator.onLine=false`). No se interceptan peticiones ni se alteran fuentes del juego. El servidor recibe **cero solicitudes después de desactivar la red**.
- El retrato se decodifica sin conexión a 512 × 640. Cada nueva página de clásico y N-7 recibe las imágenes actuales con HTTP 200 y `response.fromServiceWorker()=true`.
- Se abren los selectores de 10 y 100 niveles y se inicia únicamente la primera etapa desbloqueada mediante los botones reales. No se modifican guardados, desbloqueos, entidades ni relojes.
- `CanvasRenderingContext2D.drawImage` observado con llamada original intacta demuestra que el atlas modular se dibuja en `#canvas`. Las capturas contienen la nave ensamblada, el escenario y HUD reales. Pausa y reanudación funcionan por UI; los valores del HUD permanecen iguales durante la pausa. El máximo de callbacks RAF pendientes del juego es 1 en ambas campañas.
- Cero excepciones JavaScript, errores de consola de la aplicación, peticiones fallidas de recursos o peticiones del arte retirado.

## Intentos previos conservados

Los cinco intentos preliminares terminaron con salida 1 por supuestos incorrectos o preparación del **harness**. Se conservan completos, con JSON y copia exacta del script utilizado. No se atribuyen a regresiones del juego ni se contabilizan como pruebas aprobadas.

| Intento | Resultado parcial | Causa y corrección del harness |
| --- | --- | --- |
| `offline-01` | 0/1 grupos | Chromium pidió automáticamente `/favicon.ico` y recibió 404. El launcher no declara ese archivo. El harness registraba esa consola incidental como fallo de recursos del juego. Ahora solo se clasifica aparte ese 404 cuando su URL de consola identifica exactamente `/favicon.ico`; cualquier otro error continúa fallando. |
| `offline-02` | 1/2 grupos | La nueva sesión CDP `Network.enable` dejó `navigator.onLine=true` en la página nueva. Se reaplica la emulación nativa offline después de habilitar la observación CDP. No se aceptó aquella ejecución como prueba sin conexión. |
| `offline-03` | 2/3 grupos | El harness exigía que el atributo HTML `disabled` del botón de disparo se actualizara al pausar. La pausa del juego usa su estado y el overlay; aquel atributo no es su contrato. La prueba comprueba el overlay real, HUD estable y reanudación, sin leer estado privado. |
| `offline-04` | 2/3 grupos | Una espera `waitForFunction` con polling RAF agregaba su propio callback y contaminaba el contador (máximo 2). Todas las esperas pasan a polling de 100 ms, conservando la aserción de máximo 1 para el ciclo real. |
| `offline-05` | 3/4 grupos | El harness esperaba que DISPARAR estuviera habilitado inmediatamente al aparecer en N-7, durante su entrada/warp inicial, y obtuvo `true !== false` en `isDisabled()`. Ahora espera por UI el fin de esa entrada y la activación natural del control antes de comprobarlo. No acelera ni modifica el reloj. |
| `offline-06` | **4/4 grupos** | Ejecución final aprobada con las preparaciones y observaciones anteriores; paquete intacto. |

El sondeo automático de favicon sigue visible en `incidentalBrowserRequests` y `httpRequests`, con URL local, respuesta 404 y mensaje originales. No se oculta un 404 de un recurso de la aplicación.

## Capturas auténticas y límites

- [Launcher sin conexión y retrato actual](offline-06/offline-launcher-portrait.png).
- [Clásico, nave modular en Chronos sin conexión](offline-06/offline-classic-playing.png).
- [Clásico pausado](offline-06/offline-classic-paused.png).
- [N-7 histórico con la misma nave sin conexión](offline-06/offline-n7-playing.png).
- [N-7 pausado](offline-06/offline-n7-paused.png).

Son capturas del ejecutable, no concept art. No certifican Safari, un iPhone físico, instalación iOS ni una partida completa de cada nivel. Los observadores de canvas y RAF solo llaman a las implementaciones originales y registran sus llamadas; no añaden un ciclo del juego. No hubo cambios de runtime, service worker, manifiesto o assets durante esta QA.
