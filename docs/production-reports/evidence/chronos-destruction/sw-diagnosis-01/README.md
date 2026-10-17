# Diagnóstico de actualización nativa de service workers — 17/10/2026

Paquete leído: `preview-dist`, commit `73e117bacc0b220e477c455c07e278a2326fb4dc`, `dirty=false`, revisión `8ef4444967c63e76828e1b131ad8ab8b30d53788ce501633fd2309b9a22e6aeb`. Chromium 154.0.8037.57. La copia temporal sustituye únicamente la revisión de ambos workers por 64 letras `f`; no modifica la fuente ni el paquete original.

Los intentos históricos `../sw-upgrade-01` y `../sw-upgrade-02` siguen fallidos: su límite de 30 segundos venció. No se han reescrito sus resultados.

| Ejecución diagnóstica | Promesa launcher.update | Promesa juego.update | Duración total | Resultado estricto |
| --- | --- | --- | --- | --- |
| Con inspección worker.evaluate | 58.8554 s | 0.1480 s | 69.897 s | passed; salida 0 |
| Sin inspección worker.evaluate | 58.8443 s | 0.2761 s | 70.105 s | passed; salida 0 |

En ambas ejecuciones, a 31 y 45 segundos el primer job seguía pendiente, no había `updatefound`, installing/waiting eran null y persistían los workers/cachés antiguos. Después se crearon versiones nuevas, ambos workers activaron, quedaron exactamente dos cachés propias de la revisión nueva y se borraron las propias antiguas. Se conservó `unrelated-app` y el texto `safe` de `/keep`. Con la red desactivada cargaron el juego y el selector; la entrada principal seguía visible y el archivo histórico cerrado. No hubo errores registrados. Los JSON contienen estados de Promise por registro, snapshots, eventos CDP, solicitudes y respuestas.

Eliminar la inspección inicial de `worker.evaluate` no eliminó la demora. La evidencia delimita una espera nativa próxima a un minuto antes de instalar la nueva versión; no identifica una causa interna concreta del navegador o una regla de especificación. No se ha modificado el service worker para ocultarla. El límite histórico de 30 segundos resulta insuficiente para estas dos ejecuciones; un margen de 90 segundos para la invocación update está justificado, conservando las comprobaciones de activación, revisión, cachés, contenido ajeno y uso offline.

## Comandos ejecutados

```sh
node scripts/chronos-sw-diagnosis.cjs --root preview-dist --output docs/production-reports/evidence/chronos-destruction/sw-diagnosis-01
node scripts/chronos-sw-diagnosis.cjs --root preview-dist --output docs/production-reports/evidence/chronos-destruction/sw-diagnosis-01/without-worker-evaluate --skip-worker-inspection
```

## Precisión del registro

En estos dos JSON el campo resumen `originalThirtySecondTimeoutExceeded` termina en `false` por una asignación sobrescrita al resolverse el job en el último snapshot. Es un defecto del resumen diagnóstico, no de los snapshots: `update-at-31000ms` y `update-at-45000ms` registran inequívocamente `status=running`. Se conservan ambos JSON sin alterarlos. El script se corrigió después para mantener `true` una vez observado el exceso; la corrección afecta solo a ese resumen, no a las aserciones ni al comportamiento probado. Los hashes del script en cada JSON identifican el código ejecutado en su momento.

Las ejecuciones demuestran actualización de una copia temporal en Chromium y uso offline local. No equivalen a actualización de una PWA en iPhone físico, Safari ni despliegue remoto. El propietario de integración ejecutará después el harness original con su límite ajustado y conservará su resultado independiente.
