# APP STORE READINESS — 7.2.0

| Requisito | Estado | Evidencia / pendiente |
|---|---|---|
| Bundle ID | READY | `com.adonay.neoncatcher` |
| Versión / build | READY | 7.2.0 / 4 en Xcode |
| Capacitor local | READY | `webDir: www`; juego incluido localmente |
| Orientación | READY | Solo vertical |
| Safe areas | READY | CSS usa `env(safe-area-inset-*)` |
| Icono y splash técnicos | READY | 1024×1024 y 2732×2732 validados |
| Guardados | READY | Compatibilidad y corrupción cubiertas por tests |
| Audio/haptics lifecycle | NEEDS WORK | Implementado; falta prueba física de background/foreground |
| Rendimiento | NEEDS WORK | Pools/límites implementados; falta Instruments en iPhone |
| Privacidad | NEEDS WORK | Páginas locales presentes; falta texto legal final y URL pública definitiva |
| Tracking/ATT | BLOCKED | Requiere decisión de tracking y configuración comercial |
| Ads producción | BLOCKED | Solo IDs de prueba; faltan cuenta/unidades/consentimiento |
| Clasificación | BLOCKED | Debe completarla el titular en App Store Connect |
| Soporte/términos | NEEDS WORK | Documentos base presentes; faltan datos comerciales finales |
| Capturas/metadatos | BLOCKED | Requiere build final y selección comercial |
| TestFlight | BLOCKED | Requiere firma, cuenta Apple y dispositivo/macOS |
| Estabilidad web | READY | 65 pruebas automatizadas aprobadas |

Conclusión: el código está preparado para continuar hacia un build iOS, pero **no debe declararse listo para App Store** hasta completar TestFlight, QA físico, privacidad, anuncios y metadatos.

