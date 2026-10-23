---
name: neon-production
description: Coordinar producción e integración de NEON CRONIUM con especialistas, propiedad exclusiva de archivos y pruebas. Usar al implementar mejoras del juego, organizar agentes, incorporar herramientas o cerrar una entrega artística, jugable o auditiva en este repositorio.
---

# Producción especializada de NEON CRONIUM

Leer `AGENTS.md`, `CLAUDE.md` y el diseño vigente (`docs/superpowers/specs/`). Usar `docs/production-tasks.json` como seguimiento único. Consultar [equipo y contratos](../../../docs/agents/SPECIALIST_TEAM.md) para elegir los departamentos necesarios.

## Ejecutar un incremento completo

1. Comprobar rama, HEAD, cambios locales y remoto. Preservar avances posteriores; no descartar trabajo. Integrar sólo en `main`, con PR desde la rama de trabajo.
2. Elegir un defecto visible o audible y definir su reproducción, resultado esperado y criterio de cierre. Priorizar el nivel uno; no producir contenido masivo para compensar una integración defectuosa.
3. Asignar agentes mediante las herramientas de colaboración disponibles. Comunicar propósito, rutas exclusivas, dependencias, entregable y pruebas. Mantener como máximo seis subagentes activos y un integrador; usar menos cuando sea suficiente. El catálogo de departamentos no equivale a procesos activos.
4. Mantener un único escritor por archivo. Reservar fuentes compartidas, bundles, manifiestos, service worker y publicación al integrador salvo traspaso explícito. Enviar hallazgos de otras áreas a su propietario; no editar sus archivos.
5. Producir maestro, estados auténticos, exportación optimizada, procedencia, pivote y dimensiones. Integrar mediante las fuentes actuales, sin otro motor o propietario de RAF. Comprobar arte en partida y audio en acciones reales.
6. Solicitar a cada propietario una entrega acotada: archivos, cambios, comandos y resultados, evidencia, limitaciones y declaración de fin de escritura. Revisar el diff y los contratos antes de integrar.
7. Congelar todas las fuentes afectadas antes de compilar o certificar; usar un snapshot inmutable si continúa otro trabajo. Ejecutar pruebas pertinentes y [QA visual](../neon-visual-qa/SKILL.md). No reutilizar resultados de otro SHA.
8. Guardar un hito coherente y publicar mediante push normal en la rama autorizada. Comprobar GitHub Actions. Actualizar tareas e informe con aceptación técnica, artística y física separadas. Conservar errores y correcciones verificables.

## Aplicar límites del proyecto

- Mantener `USE_ENGINE_V1 = false`, el ciclo existente, guardados y campañas recuperables. No tocar `main`, PR #3, firmados, producción o monetización.
- No solicitar aprobaciones rutinarias ya autorizadas. Reservar al propietario la aceptación estética y la decisión del motor; continuar tareas independientes.
- Revisar licencia por archivo, versión y dependencias de terceros antes de ejecutar o incorporar. Fijar commit y conservar licencia/procedencia; consultar [revisión OSS](../../../docs/agents/OPEN_SOURCE_REVIEW.md). No usar APIs facturables ni servicios nuevos sin autorización económica.
- Especializar mediante instrucciones y herramientas. No afirmar reentrenamiento permanente, autonomía fuera de la sesión ni creación automática de agentes por un archivo YAML.

## Entregar evidencia útil

Registrar SHA y estado del árbol, experiencia realmente jugable, rutas modificadas, assets integrados, pruebas exactas y sus salidas, capturas o audio real y límites. Separar escena instrumentada, partida natural y dispositivo físico. No declarar finalizado un recurso por existir en disco.

Guía de autoría: OpenAI `skill-creator`, Apache-2.0, conservada sin modificar en [fuente fijada](../../../tools/third-party/skills/openai-skill-creator/SKILL.md). Las reglas de este repositorio y las instrucciones del propietario prevalecen.
