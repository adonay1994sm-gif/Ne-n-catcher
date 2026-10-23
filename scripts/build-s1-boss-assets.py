"""Empaqueta el arte de los jefes del sector 1: CH-03, Atlas en furia, sus escoltas y la baliza (plan F3c).

Lee los originales del baúl en art-source/enemies/s1-jefes/ y escribe en assets/
las hojas del juego. Actualiza tamaño, sha256 y medidas en ASSET_MANIFEST.json.
Reproducible: mismas entradas, mismas salidas.
Uso: python3 scripts/build-s1-boss-assets.py
"""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'art-source' / 'enemies' / 's1-jefes'
OUT = ROOT / 'assets'
MANIFEST = ROOT / 'ASSET_MANIFEST.json'


def save(image, name):
    path = OUT / name
    image.save(path, 'WEBP', quality=90, alpha_quality=100, method=6)
    return path


def scaled(source, scale):
    image = Image.open(SOURCE / source).convert('RGBA')
    return image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)


def main():
    # Celdas del juego: CH-03 y Atlas en furia de 800 a 384; escoltas y baliza de 256 a 192.
    written = [
        save(scaled('ch03_satelite_v1.webp', 384 / 800), 'ch03_satellite_atlas_v1.webp'),
        save(scaled('atlas_furia_v1.webp', 384 / 800), 'atlas_fury_atlas_v1.webp'),
        save(scaled('atlas_escoltas_v1.webp', .75), 'atlas_escorts_atlas_v1.webp'),
        save(scaled('baliza_v1.webp', .75), 'sector_beacon_atlas_v1.webp'),
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
