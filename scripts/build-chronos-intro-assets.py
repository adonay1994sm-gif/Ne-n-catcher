"""Empaqueta el arte del propietario para el inicio de Chronos.

Lee los originales de art-source/ (entregas del 20/10/2026) y escribe hojas
WebP optimizadas en assets/. Reproducible: mismas entradas, mismas salidas.
Uso: python3 scripts/build-chronos-intro-assets.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'art-source'
OUT = ROOT / 'assets'
INTRO = ART / 'chronos-inicio'
PRIME = ART / 'cronos-prime'


def content(image):
    """Recorta al contenido visible (alfa > 40)."""
    alpha = image.getchannel('A').point(lambda value: 255 if value > 40 else 0)
    return image.crop(alpha.getbbox())


def fit(image, size, anchor='center'):
    """Encaja la imagen en una celda cuadrada transparente sin deformarla."""
    cell = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    scale = min(size / image.width, size / image.height)
    resized = image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.LANCZOS)
    x = (size - resized.width) // 2
    y = size - resized.height if anchor == 'bottom' else (size - resized.height) // 2
    cell.alpha_composite(resized, (x, y))
    return cell


def sheet(cells, columns, size):
    rows = (len(cells) + columns - 1) // columns
    atlas = Image.new('RGBA', (columns * size, rows * size), (0, 0, 0, 0))
    for index, cell in enumerate(cells):
        atlas.alpha_composite(cell, ((index % columns) * size, (index // columns) * size))
    return atlas


def load(path):
    return Image.open(path).convert('RGBA')


def station_atlas():
    size = 640
    ring = content(load(INTRO / 'chronos_pieza_anillo_exterior_v1.webp'))
    # El anillo llegó en perspectiva: se guarda circular y el juego aplica la
    # misma inclinación a todas las piezas que giran.
    ring = ring.resize((ring.width, ring.width), Image.LANCZOS)
    wheel = content(load(INTRO / 'chronos_pieza_rueda_v1.webp'))
    tilted = content(load(INTRO / 'chronos_pieza_rueda_inclinada_v1.webp'))
    # Las dos torres comparten escala y base para que el cambio no salte.
    intact = load(INTRO / 'chronos_pieza_torre_intacta_v1.webp')
    broken = load(INTRO / 'chronos_pieza_torre_rota_v1.webp')
    tower_scale = (size - 8) / intact.height
    towers = []
    for tower in (intact, broken):
        resized = tower.resize((round(tower.width * tower_scale), round(tower.height * tower_scale)), Image.LANCZOS)
        cell = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        cell.alpha_composite(resized, ((size - resized.width) // 2, size - resized.height))
        towers.append(cell)
    planet_sheet = load(ART / 'planetas' / 'talasa_planeta_rotacion_v1.webp')
    planet = content(planet_sheet.crop((0, 0, planet_sheet.width // 4, planet_sheet.height // 2)))
    cells = [fit(ring, size), fit(wheel, size), fit(tilted, size), towers[0], towers[1], fit(planet, size)]
    return sheet(cells, 3, size)


def fragments_atlas():
    size = 256
    cells = [fit(content(load(INTRO / f'chronos_pieza_fragmento_{index:02d}_v1.webp')), size) for index in range(1, 9)]
    return sheet(cells, 4, size)


def prime_fx_atlas():
    """Esfera de energía y seis descargas de Cronos Prime (4×2 celdas de 384)."""
    size = 384
    sphere = content(load(PRIME / 'cronos_prime_nucleo_energia_v1.webp'))
    sheet_image = load(PRIME / 'cronos_prime_descargas_v1.webp')
    w, h = sheet_image.size
    bolts = [content(sheet_image.crop((c * w // 3, r * h // 2, (c + 1) * w // 3, (r + 1) * h // 2)))
             for r in range(2) for c in range(3)]
    return sheet([fit(sphere, size)] + [fit(bolt, size) for bolt in bolts], 4, size)


def core_center(cell):
    """Centro del núcleo brillante (píxeles casi blancos): ancla común de los
    fotogramas de Cronos Prime para que no bailen al animarse."""
    rgb = cell.convert('RGB').resize((cell.width // 2, cell.height // 2))
    alpha = cell.getchannel('A').resize(rgb.size)
    xs = ys = n = 0
    for (x, y), (r, g, b), a in zip(((x, y) for y in range(rgb.height) for x in range(rgb.width)), rgb.get_flattened_data(), alpha.get_flattened_data()):
        if a > 200 and r + g + b > 690:
            xs += x; ys += y; n += 1
    return (xs / n * 2, ys / n * 2) if n else (cell.width / 2, cell.height / 2)


def grid_cells(path, columns, rows):
    image = load(path)
    w, h = image.size
    return [image.crop((c * w // columns, r * h // rows, (c + 1) * w // columns, (r + 1) * h // rows))
            for r in range(rows) for c in range(columns)]


def anchored(cell, size, anchor, scale):
    """Copia la celda a una celda cuadrada con `anchor` en el centro."""
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    resized = cell.resize((round(cell.width * scale), round(cell.height * scale)), Image.LANCZOS)
    out.alpha_composite(resized, (round(size / 2 - anchor[0] * scale), round(size / 2 - anchor[1] * scale)))
    return out


# Vídeo de Gemini con croma verde (1280×720, 24 fps): reposo 1–72, despertar
# 73–112, carga 113–146, disparo 147–165, enfriamiento 166–190.
PRIME_VIDEO_FRAMES = (list(range(1, 57, 7)) + list(range(73, 113, 7)) +
                      [113, 117, 120, 124, 127, 131, 134, 138, 141, 145] +
                      list(range(147, 167, 2)) + list(range(166, 192, 5)))
PRIME_VIDEO_BOX = (635 - 320, 353 - 320, 635 + 320, 353 + 320)


CHROMA_GREEN = (23, 153, 48)


def chroma_key(frame):
    """Quita el verde de croma: alfa por la distancia al verde del fondo y
    color recuperado restando el fondo (sin halo verde en los brillos)."""
    import numpy as np
    rgb = np.asarray(frame.convert('RGB')).astype(np.float32)
    bg = np.array(CHROMA_GREEN, dtype=np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    key = g - np.maximum(r, b)
    alpha = 1 - np.clip((key - 8) / 85, 0, 1)
    a = np.maximum(alpha, 1e-3)[..., None]
    fg = (rgb - (1 - alpha)[..., None] * bg) / a
    # En el halo (alfa parcial) el verde se lleva hacia el violeta del brillo
    # y el halo se atenúa: sin bruma turquesa alrededor.
    partial = alpha < .98
    fg[..., 1] = np.where(partial, np.minimum(fg[..., 1], (fg[..., 0] + fg[..., 2]) / 2),
                          np.minimum(fg[..., 1], np.maximum(fg[..., 0], fg[..., 2])))
    alpha = np.where(partial, alpha ** 1.6, alpha)
    out = np.dstack([fg.clip(0, 255), alpha * 255]).astype('uint8')
    return Image.fromarray(out, 'RGBA')


def soft_edges(cell, margin=.12):
    """Desvanece el alfa cerca del borde de la celda: los destellos no se
    cortan en recto."""
    import numpy as np
    data = np.asarray(cell).astype(np.float32)
    n = data.shape[0]
    ramp = np.clip(np.minimum(np.arange(n), np.arange(n)[::-1]) / (n * margin), 0, 1)
    mask = np.minimum(ramp[None, :], ramp[:, None])
    data[..., 3] *= mask
    return Image.fromarray(data.astype('uint8'), 'RGBA')


def prime_video_atlas():
    """40 fotogramas de Cronos Prime sacados del vídeo, celdas de 512 (8×5)."""
    import subprocess, tempfile
    size = 512
    with tempfile.TemporaryDirectory() as folder:
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(PRIME / 'cronos_prime_f1_video_croma_v1.mp4'),
                        '-vf', 'fps=24', f'{folder}/f_%03d.png'], check=True)
        cells = []
        for index in PRIME_VIDEO_FRAMES:
            frame = chroma_key(Image.open(f'{folder}/f_{index:03d}.png')).crop(PRIME_VIDEO_BOX)
            cells.append(soft_edges(frame.resize((size, size), Image.LANCZOS)))
    return sheet(cells, 8, size)


def station_burst_atlas():
    """La estación estallando: 5 fotogramas con el anillo entero y 5 de
    ruptura y dispersión (celdas de 512, 5×2), alineados por el núcleo."""
    size = 512
    frames = grid_cells(INTRO / 'chronos_estacion_estallido_a_v1.webp', 3, 2)[:5] + \
        grid_cells(INTRO / 'chronos_estacion_estallido_b_v1.webp', 3, 2)[:5]
    return sheet([anchored(frame, size, core_center(frame), 1) for frame in frames], 5, size)


def main():
    station_atlas().save(OUT / 'chronos_intro_station_atlas_v1.webp', 'WEBP', quality=86, method=6)
    fragments_atlas().save(OUT / 'chronos_intro_fragments_atlas_v1.webp', 'WEBP', quality=86, method=6)
    prime_fx_atlas().save(OUT / 'cronos_prime_fx_atlas_v1.webp', 'WEBP', quality=86, method=6)
    prime_video_atlas().save(OUT / 'cronos_prime_video_atlas_v1.webp', 'WEBP', quality=90, method=6)
    station_burst_atlas().save(OUT / 'chronos_station_burst_atlas_v1.webp', 'WEBP', quality=88, method=6)



if __name__ == '__main__':
    main()
