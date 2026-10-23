"""Empaqueta el arte de los enemigos nuevos de Gaia (plan F3b).

Lee los originales del baúl en art-source/enemies/gaia/ y escribe en assets/
las hojas del juego (celdas de 192 px; el Alfa en 4 celdas de 256) y los
proyectiles. Actualiza tamaño, sha256 y medidas en ASSET_MANIFEST.json.
Reproducible: mismas entradas, mismas salidas.
Uso: python3 scripts/build-gaia-enemy-assets.py
"""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
GAIA = ROOT / 'art-source' / 'enemies' / 'gaia'
OUT = ROOT / 'assets'
MANIFEST = ROOT / 'ASSET_MANIFEST.json'


def save(image, name):
    path = OUT / name
    image.save(path, 'WEBP', quality=90, alpha_quality=100, method=6)
    return path


def scaled(source, scale):
    image = Image.open(GAIA / source).convert('RGBA')
    return image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)


def alpha_sheet():
    # Mismo factor en las 4 piezas: la escala relativa entre estados se conserva.
    sheet = Image.new('RGBA', (1024, 256), (0, 0, 0, 0))
    for index in range(4):
        piece = Image.open(GAIA / f'ch02_alfa_pieza_{index + 1}_v1.webp').convert('RGBA')
        sheet.alpha_composite(piece.resize((256, 256), Image.LANCZOS), (index * 256, 0))
    return sheet


def main():
    written = [
        save(scaled('ch04_rastreador_v1.webp', .5), 'gaia_tracker_atlas_v1.webp'),
        save(scaled('ch05_sembrador_v1.webp', .5), 'gaia_sower_atlas_v1.webp'),
        save(scaled('ch06_egida_v1.webp', .5), 'gaia_aegis_atlas_v1.webp'),
        save(alpha_sheet(), 'gaia_alpha_atlas_v1.webp'),
        save(Image.open(GAIA / 'proyectiles_hostiles_v1.webp').convert('RGBA'), 'hostile_projectiles_v2.webp'),
    ]
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    by_path = {entry['path']: entry for entry in manifest['standalone']}
    for path in written:
        entry = by_path[f'assets/{path.name}']
        data = path.read_bytes()
        with Image.open(path) as image:
            entry['dimensions'] = f'{image.width}x{image.height}'
        # Por diferencia: repetir el script no cuenta dos veces.
        manifest['runtimeBytes'] += len(data) - entry['size']
        entry['size'] = len(data)
        entry['sha256'] = hashlib.sha256(data).hexdigest()
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for path in written:
        print(path.relative_to(ROOT), path.stat().st_size)


if __name__ == '__main__':
    main()
