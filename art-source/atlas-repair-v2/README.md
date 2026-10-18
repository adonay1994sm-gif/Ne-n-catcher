# Guardian Atlas — revisión de contornos v2

Revisión original por `image_gen.imagegen` del maestro conservado `art-source/enemies/guardian-atlas/guardian-atlas-states-master.png`. No se sobrescriben v1 ni sus fuentes. El generador conservó 1774×887; el pack reproducible exporta 2048×1024, 4×2 celdas de 512×512 enteras y ocho poses distintas. No es vídeo ni una secuencia completa de ocho ciclos animados.

## Recursos

- `guardian-atlas-generated-edit-master.png`: edición generada intacta.
- `guardian-atlas-packed-master.png`: maestro RGBA alineado y empaquetado.
- `frames/*.png`: ocho celdas completas de 512×512.
- `../../assets/guardian_atlas_states_v2.webp`: exportación runtime; la ruta relativa correcta desde raíz es `assets/guardian_atlas_states_v2.webp`.
- `metadata.json`: rectángulos/pivotes/dimensiones/pesos/hashes/estado.
- `PROVENANCE.json`: generación y transformación verdaderas.
- `qa-contact-dark.jpg` / `qa-contact-light.jpg`: diagnósticos con etiquetas y marcas centrales, **no assets del juego ni capturas**.
- `alpha-qa.json`: 27 comprobaciones de píxeles y contorno.

## Contrato de integración

Pivote uniforme `(0.5,0.5)` = reactor/centro de coraza en cada celda. Índices: 0 entrada cerrada, 1 núcleo expuesto, 2 carga cerrada, 3 disparo cerrado, 4 impacto con daño, 5 fase 2 abierta, 6 fase 2 disparo cerrado, 7 desactivado. La pose 4 expone el núcleo porque corresponde a un impacto válido. En 2/3/6 las placas cubren el reactor: no superponer el parche antiguo del viejo atlas.

Margen mínimo medido en WebP: 32 px para todo alfa y para alfa visible ≥8; cifras exactas en QA. Todas las piezas y destellos terminan antes del límite, sin necesidad de inset para ocultar recortes. Se mantienen cuerpos completos; humo de daño y jets de disparo son compactos.

El nuevo padding reduce el cuerpo relativo a la celda. Para conservar presencia visual, usar aproximadamente 1,25× el tamaño de dibujo antiguo, **sin cambiar colisiones**. Hay que revisar capturas a tamaño de teléfono antes de fijar esa compensación.

La apertura sigue requiriendo animación modular de placas o transición controlada en el renderizador. Este lote aporta poses correctas, no afirma que esas piezas ya se muevan ni que esté integrado/probado en una partida.

## Reproducir

```bash
python3 art-source/atlas-repair-v2/pack-atlas.py
python3 art-source/atlas-repair-v2/audit-alpha.py
```

Pillow sólo empaqueta, alinea, remuestrea y optimiza la edición generada: no sustituye el arte con geometría. Aceptación artística del propietario, integración runtime y dispositivo físico pendientes.
