# NEON CRONIUM · Roadmap

Actualizado: 23/10/2026. Reúne todo lo acordado hasta hoy. El detalle de
cada tarea está en el tablero del proyecto; el diseño, en
`docs/superpowers/specs/2026-10-22-campana-galaxia-design.md` y
`docs/design/BIBLIA_GALAXIA.md`.

**Objetivo:** publicar en **Android e iPhone**. Steam queda aparcado.

## Hecho

- **Repositorio limpio:**
  - `main` es la rama principal y contiene el juego actual;
  - PRs viejos cerrados;
  - fuera los documentos antiguos y el motor V1;
  - sin firmas de IA.
- **Diseño de la campaña aprobado:**
  - 10 sectores de 10 tramos, con subjefe y jefe;
  - morir, revivir y baliza; rutas de frontera;
  - pausa-holograma, taller, árbol y arsenal.
- **Biblia de la galaxia aprobada:** 10 sistemas, 10 facciones, enemigos,
  subjefes y jefes.
- **Fase 2, base técnica:** ficha del sector 1, turnos de ataque, IA de 6
  perfiles, guardado de sectores y bot que mide la dificultad y el ritmo.
- **Arte del sector 1 entregado:** CH-04, CH-05, CH-06, CH-03, Atlas en
  furia y sus escoltas, proyectiles, armas en 4 niveles y la baliza.
- **Móvil en horizontal:** aviso «Gira el móvil» y pausa; la app de iPhone
  ya está bloqueada en vertical.

## Por hacer

### 0. Terminar la limpieza
- Scripts de prueba en navegador: hecho. Se retiraron los 34 que buscaban
  pantallas antiguas; quedan `capture-intro.cjs` y `capture-levels.cjs`.
- **Propietario:**
  - en Netlify, `neon-preview-deploy` debe publicar `main`;
  - borrar las ramas antiguas en GitHub;
  - renombrar el repositorio `Ne-n-catcher` (luego se actualizan los enlaces).

### 1. Sector 1 jugable (fase 3), el corazón de la diversión
1. Vuelo continuo de 10 tramos, sin cortes entre ellos.
2. Enemigos nuevos con su IA:
   - Rastreador por detrás, Sembrador con minas, Égida con escudo;
   - CH-02 Alfa como élite.
3. Intensidad:
   - hordas;
   - meteoritos dirigidos, sin zona segura marcada;
   - ataques por la retaguardia;
   - abanicos abiertos.
4. Subjefe CH-03 en el tramo 5 y Atlas con furia y escoltas en el tramo 10.
5. Morir y volver a empezar:
   - sector entero, o desde el tramo 6 con la baliza;
   - revivir con anuncio al 25 %, una vez por intento.
6. Paradas de C9 para reparar, diálogos en calma y radio en combate.
7. Calibrar el bot con una partida real y ajustar la dificultad.
8. Pendientes de la fase 2: faro de C9, cobro de la baliza, tabla de
   perfiles y Escolta que proteja al aliado cercano.

### 2. La nave (fase 4)
- Pausa-holograma con Taller · Árbol · Arsenal · Mapa · Ajustes.
- Taller de reparación con piezas de facción.
- Árbol de mejoras: munición de 20 a ~100, recarga de 2 a ~1,2 s y nodos clave.
- Arsenal: 4 niveles por arma, sobrecarga y evoluciones (el arte ya está).

### 3. Viajar por la galaxia (fase 5)
- Mapa de la galaxia, fronteras con ruta segura y ruta caliente, y rejugar
  sectores.

### 4. Sectores 2 a 10 (fase 6)
- Uno por uno, con la plantilla del sector 1.
- Arte: los encargos del sector 2 y los dosieres de los sectores 3 a 10.

### 5. Acabado (fase 7)
- Relieve del sistema de botones en todas las pantallas.
- Concepto de las 10 naves del hangar.

### 6. Publicación móvil
- **Android:**
  - crear el proyecto con Capacitor y bloquearlo en vertical;
  - probarlo en un móvil real.
- **iPhone:** subirlo a TestFlight y probarlo en un móvil real.
- **Anuncios:** IDs reales de AdMob y aviso de consentimiento (solo con
  orden del propietario).
- **Tiendas:**
  - privacidad, términos y nombre (bundle id decidido: `com.neoncronium`);
  - ficha de tienda, iconos y capturas.
- Hay datos legales sin rellenar (`[COMPLETAR]`).

## Decisiones abiertas (en el tablero)
- Sensibilidad 135: ¿también para quien ya tenía ajustes guardados?
- Jerarquía de transmisiones, chispas del daño, sonidos de interfaz y
  tipografía.

## Aparcado
- **Steam:**
  - controles de teclado y mando;
  - qué sustituye a «revivir con anuncio».
