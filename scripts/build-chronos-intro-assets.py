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


def prime_atlas():
    size = 512
    names = ['cronos_prime_f1_nucleo_v1', 'cronos_prime_f1_ala_v1',
             'cronos_prime_f1_cuchilla_superior_v1', 'cronos_prime_f1_haz_v1']
    return sheet([fit(content(load(PRIME / f'{name}.webp')), size) for name in names], 2, size)


def main():
    station_atlas().save(OUT / 'chronos_intro_station_atlas_v1.webp', 'WEBP', quality=86, method=6)
    fragments_atlas().save(OUT / 'chronos_intro_fragments_atlas_v1.webp', 'WEBP', quality=86, method=6)
    prime_atlas().save(OUT / 'cronos_prime_phase1_atlas_v1.webp', 'WEBP', quality=86, method=6)


if __name__ == '__main__':
    main()
