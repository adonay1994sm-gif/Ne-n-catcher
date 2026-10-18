# Error aportado por el propietario

Capturas del18/10/2026: proyecto `neonpreviewdeploy`, Production de rama `continuity-assets-audit-20261013`, commit8c5b44e. Log visible:

```text
[NEON CRONIUM] Se requiere NEON_PREVIEW_DEPLOY=1, rama continuity-assets-audit-20261013 y contexto branch-deploy/local
"build.command" failed
Command failed with exit code 1: node ./scripts/netlify-preview-gate.mjs --require-enabled && npm run build:preview && npm run test:static && npm run test:preview
```

El propietario confirma por escrito la variable1 en Production. El proceso se detiene en la puerta anterior al build. No se recibió ni se inventó un ID de despliegue o SiteID; el proyecto de pruebas se identifica por nombre y host que Netlify inyecta.
