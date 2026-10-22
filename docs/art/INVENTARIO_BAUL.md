# Inventario del baúl · qué hay y para qué sirve en la campaña

Revisión del 22/10/2026: 48 grupos y 30 animaciones de
https://neon-cronium-video-referencia.chictide18.chatgpt.site/catalog.json,
todos descargados y vistos. Cada grupo se cruza con la biblia
(`docs/design/BIBLIA_GALAXIA.md`).

- **En el juego** = ya hay un archivo en `assets/` que el código carga.
- **Pendiente** = se integra en la fase indicada. Las medidas de todas las
  entregas nuevas coinciden con su encargo y todas traen canal alfa (las
  fichas e ilustraciones son opacas a propósito).

## 1. Encargos de la campaña nueva (entregados el 22/10)

| Grupo | Qué trae | Uso | Nota de revisión |
|---|---|---|---|
| `camp-art-s1-rastreador` | CH-04: 4 de vuelo y 4 de ataque | S1, Emboscador | Bien: misma familia que CH-01. |
| `camp-art-s1-sembrador` | CH-05, minas y bomba en cruz | S1, Minador | Bien. |
| `camp-art-s1-egida` | CH-06 y escudo ámbar en 4 fases | S1, Escolta | Bien; el escudo se lee como enemigo. |
| `camp-art-s1-ch03` | CH-03 en 8 estados | S1, subjefe | Coherente con `art-ch03` (por piezas). Lleva luces azul y violeta, no el anillo blanco del dosier. |
| `camp-art-s1-atlas-furia` | Furia, carga, Fulminante y derrota | S1, jefe | Muy bien: mismo modelo que Atlas. |
| `camp-art-s1-atlas-escoltas` | Escolta en vuelo y disparo | S1, 4 escoltas en furia | Bien. |
| `camp-art-proyectiles-hostiles` | Mortero, aro de calor, mina, bomba, misil y orbe | Todos los sectores | El orbe salió como roca de lava; sirve para Vulkar. |
| `camp-art-armas-niveles` | 4 armas × 4 niveles y sobrecarga | F4, arsenal | Muy bien: los niveles se distinguen a simple vista. |
| `camp-art-baliza` | Baliza en 4 fases | S1, baliza del subjefe | Bien. |

## 2. Encargos anteriores que se aprovechan

| Grupo | Qué trae | En el juego | Nuevo uso |
|---|---|---|---|
| `art-ch03` | CH-03 por piezas: cuerpo, anillo y núcleos | No | S1, subjefe (junto con el anterior) |
| `enc-ch02alfa` | CH-02 Alfa, dron élite por piezas | No | **S1, élite de los tramos 6–9** (antes era el jefe intermedio) |
| `rv2-v6-enemigos` | Caza negro de núcleo naranja | No | **Flota Cartógrafa: la «Sombra»** (casco negro); base del dosier de la flota |
| `aud-v03-efectos` | Explosión cálida en 8 fotogramas | No | Explosión de todos los enemigos (V03) |
| `a04` | Explosión de Atlas | Sí (`atlas_explosion_v1`) | — |
| `a05` | Chispas de golpe | Sí (`hull_impact_sparks_v1`) | — |
| `a06` | Estela de Cronos Prime | Sí (`cronos_prime_trail_v1`) | — |
| `art-cometa` / `cometa-ambar` | Cometa cálido | Sí | — |
| `rv2-v3-restos` | Restos de Chronos en 8 piezas | No | S1, tramos 1–3 (parallax, V3) y restos de Hespera (S8) |
| `s203` | C-17 en 8 fotogramas | Parcial (persecución) | S2, subjefe |
| `s202` | Titán de Vulkar por piezas (cuerpo, taladro, cápsulas, grietas) | No | S2, jefe; la forma de vehículo de la furia aún falta |
| `enc-torretas` | Batería de torretas de forja por piezas | No | **S2, defensas de la Refinería Vorn** (Artillero fijo) |
| `enc-nucleo` | Núcleo de lava y mina de plasma | Sí (`lava_core_mine_atlas_v1`) | S2 y S3, Minador |
| `enc-escoria` | Barcaza de escoria y trozos calientes | No | **S3, Barcaza** (transporte que suelta escoria) |
| `enc-dron-escoria` | Dron de escoria: vuelo, disparo y explosión | No | **S3, caza común** del Sindicato |
| `enc-crisol` / `enc-crisol-piezas` | Crisol (3 diseños) y diseño A por piezas | No | S3, jefe |
| `enc-hielo` | Cristal, mina y dron de hielo con núcleo rojo | No | **S4, versión de juego** (ataque cálido, como pide la regla) |
| `cryon-v1` | Las 4 entidades de Cryon con luz cian | No | S4 y S5 como referencia; en juego, mejor `enc-hielo` |
| `enc-matriz` | Matriz de escarcha por piezas | No | S4, jefe |
| `enc-leviatan` | Leviatán por piezas | No | S5, jefe |
| `art-ficha` | Fichas de los sectores 1 y 2 | Sí (`mission_sector1/2`) | — |
| `enc-fichas345` | Fichas de los sectores 3, 4 y 5 | No | Pantallas de sector 3–5 |
| `rv2-m5-briefing` | Chronos en ruinas y la nave saliendo | No | Menú y briefing |
| `art-retratos` | Mira, Iria, Lira, N-7 | Sí | — |
| `h03` | 4 retratos: Yara, Tessa y otros dos (un anciano con abrigo blanco y una mujer con luz violeta) | No | **S2–S3 Yara y Tessa; el anciano encaja con el doctor Oren (S5) y la mujer violeta con Ione Vale (S6)** |
| `art-iconos` / `sector-map-icons` | Iconos del mapa | Sí | Mapa de la galaxia (F5) |
| `planetas` | Volcánico, glacial, tormentoso y violeta | Sí | Volcánico: Vulkar y Brasa. Glacial: Cryon y Lethe. Violeta: Aether y Kairos. Tormentoso: Gaia |
| `cronos-*`, `estacion-espacial` | Cronos Prime por fases, energía y estación | Sí (vídeo, estela y efectos) | S10, jefe final, e inicio de Chronos |
| `scout-demo-v1` | Prueba antigua del dron explorador | No | Sustituido por CH-01; no se usa |

## 3. Lo que cambia por este inventario

1. **Biblia:**
   - CH-02 Alfa entra como élite del sector 1;
   - torretas de forja en el sector 2;
   - barcaza y dron de escoria en el sector 3;
   - la Sombra de la Flota Cartógrafa usa el caza negro de `rv2-v6-enemigos`.
2. **Encargo `camp-art-dosier-cartografa`:** debe partir de ese caza negro.
3. **Encargo `camp-art-retratos-grandes`:** Oren e Ione puede que ya existan
   en `h03`. Solo faltan Kael Orr y la Cartógrafa.
4. **Integración pendiente:**
   - sector 1 en la F3: CH-04, CH-05, CH-06, CH-03, Atlas furia, escoltas,
     CH-02 Alfa, baliza, explosión cálida, restos y briefing;
   - el resto, en el sector que le corresponde (F6).
