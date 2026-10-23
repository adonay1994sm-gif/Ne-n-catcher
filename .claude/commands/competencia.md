---
description: Lanza en paralelo auditor-codigo, critico-juego y director-arte sobre el trabajo actual y compara sus veredictos señalando desacuerdos.
argument-hint: "[rango git o descripción del trabajo, opcional]"
---

Pon el trabajo actual delante de la "competencia": tres revisores
independientes que no ven tu razonamiento y que juzgan por separado.

Trabajo a revisar: $ARGUMENTS

## 1. Prepara el encargo (sin revisar tú)

1. Si no se indica nada arriba, usa los cambios sin commit (`git diff`) y,
   si no hay, los commits de la rama desde su base
   (`git merge-base origin/claude/preparar-publicacion-rtfl9q HEAD`).
2. Anota en una línea qué se pidió, el rango `BASE..HEAD`, el SHA de HEAD y
   los archivos tocados (`git diff --stat`). No adelantes conclusiones ni
   digas a los revisores qué no deben señalar.

## 2. Lanza los tres a la vez

En **un solo mensaje**, invoca con la herramienta de subagentes a
`auditor-codigo`, `critico-juego` y `director-arte`. A cada uno le das lo
mismo: la petición original, el rango, el SHA y la lista de archivos. Nada
del historial de la conversación.

- Si el cambio no toca nada visible (solo herramientas o documentación),
  lanza igualmente a los tres; quien no tenga nada que juzgar debe decirlo
  en una línea.
- No respondas tú por ninguno de ellos ni rellenes un informe que falte.

## 3. Compara y señala desacuerdos

Cuando vuelvan los tres, responde en español con este formato:

1. **Veredictos**: una línea por revisor con su veredicto literal.
2. **Desacuerdos**: cada punto donde dos revisores dicen cosas
   incompatibles (uno aprueba lo que otro suspende, o proponen arreglos
   que chocan). Para cada uno: quién dice qué, qué evidencia aporta cada
   uno y qué prueba concreta lo resolvería. Si no hay, escribe "ninguno".
3. **Coincidencias**: problemas que señalan dos o más revisores (son los
   más fiables).
4. **Sin evidencia**: afirmaciones de cualquier revisor que no apoyó con
   archivo:línea, captura o comando. Trátalas como dudas, no como hechos.
5. **Siguiente acción**: una sola, la más importante.

No resuelvas los desacuerdos por tu cuenta ni cambies código en este
comando: el propietario decide. Si un revisor no pudo comprobar algo
(por ejemplo, sin navegador), dilo claramente.
