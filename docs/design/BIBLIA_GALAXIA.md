# NEON CRONIUM · Biblia de la galaxia (10 sistemas)

> Borrador v1 · 22/10/2026 · fase F1 del diseño
> `docs/superpowers/specs/2026-10-22-campana-galaxia-design.md`.
> **Pendiente de aprobación del propietario.**
>
> Amplía `BIBLIA_HISTORIA.md`: conserva su trama, personajes y jefes, y la
> reparte en 10 sistemas, cada uno con su facción. Lo nuevo lo propone
> Claude y se puede cambiar. Los encargos de arte salen de aquí; ver
> `docs/art/GUIA_GPT.md`.

## 1. Reglas del mundo

- **El CRONIUM** es un cristal que guarda tiempo comprimido. Alimenta
  reactores y permite predecir futuros posibles. Cada sistema lo usa según
  sus necesidades, y eso explica su tecnología.
- **La Cartógrafa** usa las predicciones del reactor de Chronos para decidir
  qué mundos «merecen» futuro. No conquista: **compra, endeuda o asusta** a
  cada facción para que haga su trabajo.
- **Su flota** (la Flota Cartógrafa) aparece en todos los sectores. En los
  primeros es una sombra que observa; al final es el enemigo principal.
- **Colores en el juego** (`DESIGN.md` §9):
  - el enemigo siempre brilla **cálido**: ámbar, naranja o rojo;
  - el color propio de cada facción va en el **casco**, nunca en el brillo
    que hace daño;
  - el cian es del jugador y del CRONIUM;
  - el violeta es de Cronos Prime.

## 2. Mapa de la ruta

| Sector | Sistema | Facción | Subjefe (tramo 5) | Jefe (tramo 10) |
|---|---|---|---|---|
| 1 | **Gaia** (Gaia Nova) | Guardia de Gaia | CH-03, satélite de defensa | Atlas |
| 2 | **Vulkar** (órbita) | Refinería Vorn | Nave de guerra C-17 | Titan Vulkar |
| 3 | **Brasa** (luna-forja) | Sindicato de Fundidores | Corazón de lava | El Crisol |
| 4 | **Cryon** | Enjambre de Escarcha | Dron de hielo acorazado | Matriz de escarcha |
| 5 | **Lethe** (océano helado) | Orden del Custodio | Custodio blanco | Leviatán |
| 6 | **Aether** (borde) | Contrabandistas de Rutas | Orbe de grieta | Fantasma crono |
| 7 | **Kairos** (grieta) | Los Ecos | Eco temporal (tu propia nave) | Guardián Chronos |
| 8 | **Hespera** (desguace) | Chatarreros de Hespera | Batería de torretas orbitales | Recolector colosal |
| 9 | **Titan Omega** | Flota de Extracción | Núcleo de minas gravitatorias | Cosechador Omega |
| 10 | **Tálasa** (regreso a Chronos) | Constructos del Reactor | Buque insignia de la Cartógrafa | Cronos Prime |

- **Sistemas nuevos frente a la biblia anterior:** Brasa, Lethe, Kairos,
  Hespera y Tálasa. Antes eran tramos de otros mundos; ahora tienen planeta y
  facción propios.
- **Fronteras:** entre cada par de sectores hay un tramo de frontera
  (spec 6.3) donde se cruzan las dos facciones.

## 3. Las facciones

Cada ficha sigue la cadena: planeta → cuerpo → recurso → tecnología → naves →
armas → combate → pieza.

### 3.1 Guardia de Gaia (sector 1)

- **Planeta:** Gaia Nova, un mundo-refugio blanco y nuboso, con colonias en
  órbita.
- **Cuerpo:** humanos; una sociedad del protocolo que obedece a la red de
  defensa.
- **Recurso:** titanio blanco y energía limpia de sus satélites.
- **Tecnología:** defensa automática; drones sin piloto con núcleo cian que
  arde en rojo al atacar.
- **Naves:** blancas y angulosas, con alas en flecha (CH-01, CH-02).
- **Por qué te atacan:** la Cartógrafa falsificó tu firma. Para Gaia eres el
  saboteador de Chronos.
- **Combate:** enjambres disciplinados que flanquean en formación.

| Enemigo | Perfil | Movimiento | Básica | Única |
|---|---|---|---|---|
| CH-01 Explorador (existe) | Cazador | Rápido, en zigzag | Ráfaga corta | Se lanza en picado cuando el casco del jugador es bajo |
| CH-02 Interceptor (existe) | Artillero | Se queda arriba y se recoloca | Doble disparo | Andanada en abanico abierto |
| **CH-04 Rastreador** (nuevo) | Emboscador | Entra por abajo y te sigue la espalda | Disparo hacia arriba | Marca tu posición y avisa a los demás (su próximo disparo apunta mejor) |
| **CH-05 Sembrador** (nuevo) | Minador | Cruza por abajo de lado a lado | Suelta minas de proximidad | Bomba que estalla en cruz al tocar el borde de la pantalla |
| **CH-06 Égida** (nuevo) | Escolta | Se pega a un aliado | — | Escudo hexagonal que cubre al aliado hasta que lo rompes |

**Subjefe · CH-03, satélite de defensa** (anillo con cañones):
1. **Barrido láser:** rayo que gira lento; el hueco está detrás del rayo.
2. **Anillo de cañones:** 8 disparos en círculo que se abren.
3. **Rejilla de negación (la difícil):** cuadrícula de láseres que se
   enciende por partes; el hueco se mueve.

**Jefe · Atlas** (ya existe y se rehace):
- **3 ataques habituales:** cañones gemelos, despliegue de drones y abanico
  abierto.
- **Especial:** *Fulminante*, una carga del núcleo rojo que barre media
  pantalla.
- **Furia al 30 %:** se le rompe el anillo superior (cambio de escenario),
  entran **4 escoltas** y combina los ataques.

**Pieza:** *Placa de titanio blanco* (mejoras de casco).

### 3.2 Refinería Vorn (sector 2)

- **Planeta:** la órbita de Vulkar, un mundo de lava cubierto de refinerías
  flotantes.
- **Cuerpo:** humanos de corporación, con trajes térmicos; la dirige Tessa
  Vorn.
- **Recurso:** CRONIUM refinado y plasma.
- **Tecnología:** cargueros armados y seguridad privada.
- **Naves:** cascos de basalto gris oscuro con franjas ámbar de
  señalización y toberas enormes.
- **Por qué te atacan:** el C-17 descargó aquí el CRONIUM robado y tú eres un
  testigo.
- **Conflicto:** la refinería explota al Sindicato de Fundidores de Brasa
  (sector 3).
- **Combate:** convoyes escoltados y minas de plasma en las rutas.

| Enemigo | Perfil | Movimiento | Básica | Única |
|---|---|---|---|---|
| Mina de plasma (dosier Vulkar) | Minador | Flota en las rutas | Explota al acercarte | Se encadena con otras minas |
| **Escolta Vorn** (nuevo) | Escolta | Rodea los cargueros | Disparo lento | Campo de calor que desvía tus disparos |
| **Carguero armado** (nuevo) | Artillero | Lento, cruza la pantalla | Torretas laterales | Suelta contenedores que se rompen en metralla |
| **Lancha de seguridad** (nuevo) | Oportunista | Espera fuera de pantalla | Ráfaga | Entra cuando recargas |

- **Subjefe · C-17:** el carguero que se despliega como nave negra; es de la
  Flota Cartógrafa.
  1. Torretas.
  2. Andanada de misiles que se separan.
  3. **Despliegue:** se abre, cambia de forma y dispara el cañón central.
- **Jefe · Titan Vulkar:** coloso de basalto y magma.
  - **3 ataques habituales:** puño de magma, lluvia de escoria y barrido de
    calor.
  - **Especial:** erupción de pantalla completa con huecos.
  - **Furia:** el fondo de lava sube y estrecha la zona de juego.
- **Pieza:** *Bobina de plasma* (cadencia y recarga).

### 3.3 Sindicato de Fundidores (sector 3)

- **Planeta:** Brasa, una luna-forja de Vulkar llena de hornos y cintas de
  escoria.
- **Cuerpo:** fundidores con la piel endurecida por el calor. Trabajan en
  turnos de horno y viven endeudados; habla por ellos Yara Kest.
- **Recurso:** escoria y metal fundido.
- **Tecnología:** de fundición, pesada e improvisada, con radiadores.
- **Naves:** gruesas, lentas y blindadas, con placas soldadas; brillan en
  naranja al calentarse.
- **Por qué te atacan:** trabajan para la Cartógrafa por sus deudas. Si
  ganas, se descubre que el rastro va a Cryon.
- **Combate:** avanzan en bloque, cierran el paso y empujan.

| Enemigo | Perfil | Movimiento | Básica | Única |
|---|---|---|---|---|
| **Fundidor** (nuevo) | Artillero | Lento, en fila | Disparo de escoria | **Mortero que estalla a mitad del recorrido y suelta un aro de calor que se expande** (idea del propietario) |
| **Ariete** (nuevo) | Cazador | Embiste en línea recta | Choque | Deja un rastro de metal fundido que quema |
| **Grúa** (nuevo) | Escolta | Va con los fundidores | — | Recoge la escoria y repara a un aliado |
| Núcleo de lava (dosier Vulkar) | Minador | Cae despacio | Explota | Se parte en tres al morir |

- **Subjefe · Corazón de lava:**
  1. Pulsos de lava.
  2. Géiser bajo la nave.
  3. **Lluvia de gotas en espiral.**
- **Jefe · El Crisol:** un horno-fortaleza que camina sobre la luna.
  - **3 ataques habituales:** vertido de metal, escoria en abanico y grúas
    que lanzan placas.
  - **Especial:** abre la boca del horno y hace una ola de calor de pantalla
    completa con huecos.
  - **Furia:** se derrumba una cinta y cambia el suelo.
- **Pieza:** *Núcleo de horno* (daño continuo).

### 3.4 Enjambre de Escarcha (sector 4)

- **Planeta:** Cryon, un mundo de hielo con una colonia entera desaparecida.
- **Cuerpo:** máquinas sin piloto. Son los drones de mantenimiento de la
  colonia, que siguen su último protocolo: **aislar y congelar**.
- **Recurso:** frío y cristal.
- **Tecnología:** cristal que amplifica la luz y fábricas que se reparan
  solas.
- **Naves:** facetas de cristal azul hielo con núcleo ámbar al atacar (hay
  sprites en el baúl).
- **Por qué te atacan:** cumplen la cuarentena; para ellos todo lo que
  llega viene contaminado.
- **Combate:** ralentizan y encierran.

| Enemigo | Perfil | Movimiento | Básica | Única |
|---|---|---|---|---|
| Dron de hielo (baúl) | Cazador | Planea en grupo | Esquirlas | Te ralentiza con cada golpe |
| Cristal de escarcha (baúl) | Artillero | Gira quieto | Rayo | Refleja tus disparos |
| Mina criogénica (baúl) | Minador | Flota | Explota | Congela la zona un instante |
| **Tejedor** (nuevo) | Escolta | Entre dos aliados | — | Une a dos aliados con un muro de hielo |

- **Subjefe · Dron de hielo acorazado:**
  1. Esquirlas.
  2. Embestida.
  3. **Cárcel de hielo** (encierra y deja un hueco que se mueve).
- **Jefe · Matriz de escarcha:**
  - **3 ataques habituales:** rayos, prismas y nevada.
  - **Especial:** congelación total con un solo pasillo.
  - **Furia:** el hielo cubre los bordes.
- **Pieza:** *Lente de escarcha* (alcance y perforación).

### 3.5 Orden del Custodio (sector 5)

- **Planeta:** Lethe, un océano helado inmóvil, con el archivo de Cryon
  hundido bajo el hielo.
- **Cuerpo:** humanos de una orden de archiveros, pálidos y silenciosos; los
  dirige el doctor Oren.
- **Recurso:** memoria, en los archivos de CRONIUM.
- **Tecnología:** silencio: campos que apagan sistemas.
- **Naves:** blancas, lisas y sin juntas, como cerámica; sus luces se
  vuelven rojas solo al disparar.
- **Por qué te atacan:** ocultan que la Cartógrafa borró Cryon de sus mapas.
- **Combate:** te quitan herramientas.

| Enemigo | Perfil | Movimiento | Básica | Única |
|---|---|---|---|---|
| **Silente** (nuevo) | Oportunista | Aparece y desaparece | Disparo | Pulso que **bloquea tu arma 2 s** |
| **Archivero** (nuevo) | Escolta | Lento | — | Guarda una copia de un aliado y lo «reescribe» si muere (una vez) |
| **Vigía** (nuevo) | Artillero | Fijo en el borde | Haz largo | Ilumina tu nave: los demás aciertan más |
| **Ancla de hielo** (nuevo) | Emboscador | Sube desde abajo | Arpón | Te frena |

- **Subjefe · Custodio blanco:**
  1. Haces cruzados.
  2. Silencio (bloquea los misiles).
  3. **Espejo:** copia tu último disparo contra ti.
- **Jefe · Leviatán:** la criatura que protegía a los supervivientes (hay
  sprites en el baúl).
  - **3 ataques habituales:** coletazo, ola y canto que te empuja.
  - **Especial:** inmersión y salto bajo la nave.
  - **Furia:** el hielo se rompe y el escenario pasa a ser agua abierta.
- **Pieza:** *Cristal de memoria* (nodos clave).

### 3.6 Contrabandistas de Rutas (sector 6)

- **Planeta:** Aether, un borde violáceo de nebulosas, con rutas que cambian
  de sitio.
- **Cuerpo:** pilotos humanos y de otras especies que viven del
  contrabando; uno de ellos es Kael Orr.
- **Recurso:** rutas secretas.
- **Tecnología:** saltos cortos de fase.
- **Naves:** rápidas, remendadas y de colores mezclados; dejan estelas
  ámbar al saltar.
- **Por qué te atacan:** la Cartógrafa paga por tu cabeza. Ione Vale
  aparece aquí.
- **Combate:** aparecen donde no los esperas.

| Enemigo | Perfil | Movimiento | Básica | Única |
|---|---|---|---|---|
| **Saltador** (nuevo) | Emboscador | Desaparece y reaparece detrás de ti | Ráfaga | Salto de fase con aviso de 0,6 s |
| Orbe de grieta (dosier Aether) | Minador | Flota | Pulso | Se divide en dos |
| **Corsario** (nuevo) | Oportunista | Ronda por los lados | Arpón | Roba chatarra si te alcanza |
| **Remolque** (nuevo) | Escolta | Tira de aliados | — | Teletransporta a un aliado herido |

- **Subjefe · Orbe de grieta:**
  1. Pulsos.
  2. División.
  3. **Grietas** que cruzan la pantalla.
- **Jefe · Fantasma crono:**
  - **3 ataques habituales:** guadañas, ecos y salto.
  - **Especial:** duplica la pantalla con el lado falso marcado en ámbar.
  - **Furia:** la nebulosa se vuelve del revés.
- **Pieza:** *Brújula de fase* (movimiento).

### 3.7 Los Ecos (sector 7)

- **Planeta:** Kairos, una grieta temporal en el Aether profundo, sin suelo
  ni estrellas fijas.
- **Cuerpo:** no son una especie. Son **ecos de naves de otros futuros**,
  copias de quienes pasaron por aquí.
- **Recurso:** tiempo.
- **Tecnología:** repetición, porque todo lo que hacen ya lo hicieron.
- **Naves:** siluetas translúcidas de naves conocidas (de Gaia, Vorn, etc.)
  con bordes ámbar temblorosos.
- **Por qué te atacan:** no te atacan a ti; repiten batallas pasadas. Lira
  aparece en un eco: el sabotaje estaba previsto.
- **Combate:** patrones que se repiten con retraso.

| Enemigo | Perfil | Movimiento | Básica | Única |
|---|---|---|---|---|
| **Eco de explorador** (nuevo) | Cazador | Copia el zigzag de CH-01 | Ráfaga | Su disparo se repite 1 s después |
| **Eco de fundidor** (nuevo) | Artillero | Lento | Mortero | Aro de calor doble |
| Fantasma (dosier Aether) | Oportunista | Atraviesa la pantalla | Corte | Solo es vulnerable mientras ataca |
| **Reloj** (nuevo) | Escolta | Quieto | — | Rebobina 3 s la vida de un aliado |

- **Subjefe · Eco temporal:** una copia de **tu propia nave** que usa tu arma
  equipada.
  1. Tu disparo.
  2. Tu misil.
  3. **Tu sobrecarga.**
- **Jefe · Guardián Chronos:**
  - **3 ataques habituales:** manecillas, péndulo y anillos de tiempo.
  - **Especial:** congela el tiempo y mueve los disparos sin que te muevas;
    hay que estar en el hueco antes.
  - **Furia:** el reloj se rompe y los ataques llegan desordenados.
- **Pieza:** *Engranaje temporal* (enfriamiento de armas).

### 3.8 Chatarreros de Hespera (sector 8)

- **Planeta:** Hespera, un cementerio de mundos desmontados por la Flota de
  Extracción: anillos de restos y planetas a medio comer.
- **Cuerpo:** humanos y máquinas fusionados; viven de lo que la flota deja
  atrás.
- **Recurso:** chatarra.
- **Tecnología:** reciclaje, con naves hechas de piezas de otras naves.
- **Naves:** asimétricas, de placas de colores distintos, con luces ámbar de
  soldadura.
- **Por qué te atacan:** tu nave vale mucho en piezas.
- **Combate:** te desmontan: te roban mejoras temporales y chatarra.

| Enemigo | Perfil | Movimiento | Básica | Única |
|---|---|---|---|---|
| **Gancho** (nuevo) | Cazador | Te persigue | Arpón | Te engancha y te arrastra |
| Torreta orbital (dosier Titan) | Artillero | Fija en restos | Ráfaga | Gira sola hacia ti |
| **Desguazador** (nuevo) | Minador | Cruza por abajo | Suelta restos | Imán que atrae tus disparos |
| **Remiendo** (nuevo) | Escolta | Junto a aliados | — | Les suelda placas (más vida) |

- **Subjefe · Batería de torretas orbitales:**
  1. Ráfagas alternas.
  2. Fuego cruzado.
  3. **Todas a la vez con un hueco que gira.**
- **Jefe · Recolector colosal:**
  - **3 ataques habituales:** garras, aspiradora de restos y lanzamiento de
    chatarra.
  - **Especial:** traga la mitad de la pantalla.
  - **Furia:** arranca un trozo de planeta y lo usa de escudo.
- **Pieza:** *Soldadura viva* (reparación).

### 3.9 Flota de Extracción (sector 9)

- **Planeta:** Titan Omega, la base industrial de la Cartógrafa, con
  astilleros y pozos de gravedad.
- **Cuerpo:** pilotos que cumplen órdenes y máquinas de la Cartógrafa.
- **Recurso:** mundos enteros, que extrae.
- **Tecnología:** gravedad.
- **Naves:** negras con líneas de mapa ámbar (como toda la Flota
  Cartógrafa), cosechadoras enormes.
- **Por qué te atacan:** es la casa de la villana. Aquí se revela su «mapa
  de heridas».
- **Combate:** te atraen y te encierran con gravedad.

| Enemigo | Perfil | Movimiento | Básica | Única |
|---|---|---|---|---|
| Mina gravitatoria (dosier Titan) | Minador | Flota | Atrae | Se colapsa en un agujero breve |
| **Segador** (nuevo) | Cazador | En formación de tres | Ráfaga | Corte en línea entre los tres |
| **Faro** (nuevo) | Escolta | Atrás | — | Escudo de gravedad que curva tus disparos |
| **Ancla** (nuevo) | Emboscador | Entra por detrás | Garfio | Pozo que tira de ti hacia atrás |

- **Subjefe · Núcleo de minas gravitatorias:**
  1. Minas.
  2. Atracción.
  3. **Colapso en cadena.**
- **Jefe · Cosechador Omega:**
  - **3 ataques habituales:** brazos, haz de extracción y enjambre de
    segadores.
  - **Especial:** pozo de gravedad que dobla todos los disparos.
  - **Furia:** el astillero se derrumba y cambian los pasillos.
- **Pieza:** *Núcleo de gravedad* (misiles).

### 3.10 Constructos del Reactor (sector 10)

- **Planeta:** Tálasa, el planeta de Chronos. Regresas a la estación rota,
  donde empezó todo.
- **Cuerpo:** construcciones de luz que crea Cronos Prime, la IA del
  reactor, ya despierta.
- **Recurso:** CRONIUM puro.
- **Tecnología:** predicción: atacan donde vas a estar.
- **Naves:** geométricas y violetas (el violeta está reservado a Cronos
  Prime).
- **Por qué te atacan:** Cronos Prime cree que el futuro ya está decidido.
- **Combate:** ataques que anticipan tu movimiento.

| Enemigo | Perfil | Movimiento | Básica | Única |
|---|---|---|---|---|
| **Profecía** (nuevo) | Artillero | Quieta | Disparo | Apunta adonde irás, no adonde estás |
| **Prisma** (nuevo) | Escolta | Rodea | — | Divide tus disparos en dos más débiles |
| **Fragmento** (nuevo) | Cazador | Rebota | Choque | Se parte al morir |
| Flota Cartógrafa (todas) | Mixto | — | — | La última flota de la villana |

- **Subjefe · Buque insignia de la Cartógrafa:**
  1. Andanadas.
  2. Cazas.
  3. **El mapa:** dibuja líneas ámbar en la pantalla y luego las dispara.
- **Jefe · Cronos Prime:** ya hay arte de las 5 fases en el baúl.
  - **3 ataques habituales y especial:** según `DESIGN.md` §12.
  - **Furia:** el reactor se abre.
  - Final: «Una estrella no es un destino».
- **Pieza:** ninguna; el final.

## 4. La Flota Cartógrafa (transversal)

- Naves **negras** con líneas finas de mapa en **ámbar**. Siempre llevan el
  mismo símbolo: un compás roto.
- **Sectores 1–3:** un explorador que observa y huye.
- **Sectores 4–6:** escuadrillas que se unen a la facción local.
- **Sectores 7–9:** escuadras propias.
- **Sector 10:** toda la flota.
- **Enemigo base, Sombra:** un Oportunista que dispara y se va.

## 5. Lo que se reutiliza

- **Dosieres:** `art-source/references/*_enemy_dossier_v1.jpeg` (Gaia,
  Vulkar, Cryon, Aether, Titan Omega, Cronos Prime y criaturas raras).
- **Baúl:** sprites de Cryon (Frost Crystal, Ice Drone, Cryo Mine y
  Leviathan), Cronos Prime y planetas (volcánico, glacial, tormentoso y
  violeta).
- **Repositorio:** CH-01, CH-02, Atlas (estados y efectos), cometa ámbar y
  retratos.
