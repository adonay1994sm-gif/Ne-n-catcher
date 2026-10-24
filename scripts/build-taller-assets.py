"""Empaqueta el arte del taller de Mira: el fondo de la Forja C9 y los iconos del árbol.

Lee los originales del baúl en art-source/ui/taller-mira/ y escribe en assets/
el fondo a 720×1280 y la hoja de 12 iconos en celdas de 128 (6×2). Crea o
actualiza su entrada en ASSET_MANIFEST.json (tamaño, sha256 y medidas).
Reproducible: mismas entradas, mismas salidas.
Uso: python3 scripts/build-taller-assets.py
"""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'art-source' / 'ui' / 'taller-mira'
OUT = ROOT / 'assets'
MANIFEST = ROOT / 'ASSET_MANIFEST.json'

ENTRIES = {
    'workshop_mira_bg_v1.webp': {
        'id': 'workshop-mira-bg-v1', 'master': 'art-source/ui/taller-mira/taller_mira_v1.webp', 'format': 'webp',
        'use': 'Forja C9: fondo del taller de Mira con la nave en su soporte de reparación.'},
    'skill_tree_icons_v1.webp': {
        'id': 'skill-tree-icons-v1', 'master': 'art-source/ui/taller-mira/arbol_iconos_v1.webp', 'format': 'webp-alpha',
        'use': 'Forja C9: 12 insignias del árbol en 6x2 celdas de 128 (munición, recarga, escudo, misiles, '
               'refrigeración, precisión; munición II, recarga II, refrigeración II, blindaje II, imán, sobrecarga).'},
}


def main():
    background = Image.open(SOURCE / 'taller_mira_v1.webp').convert('RGB').resize((720, 1280), Image.LANCZOS)
    background.save(OUT / 'workshop_mira_bg_v1.webp', 'WEBP', quality=85, method=6)
    icons = Image.open(SOURCE / 'arbol_iconos_v1.webp').convert('RGBA').resize((768, 256), Image.LANCZOS)
    icons.save(OUT / 'skill_tree_icons_v1.webp', 'WEBP', quality=90, alpha_quality=100, method=6)
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    by_path = {entry['path']: entry for entry in manifest['standalone']}
    for name, fields in ENTRIES.items():
        path = OUT / name
        data = path.read_bytes()
        entry = by_path.get(f'assets/{name}')
        if entry is None:
            entry = {'id': fields['id'], 'path': f'assets/{name}', 'master': fields['master'], 'dimensions': '',
                     'format': fields['format'], 'size': 0, 'sha256': '', 'activeRuntime': True, 'precache': True,
                     'status': 'IN_REVIEW', 'artisticAcceptance': 'PENDING_OWNER',
                     'origin': 'GPT image generation uploaded to the asset vault; resized to runtime size',
                     'version': 1, 'use': fields['use']}
            manifest['standalone'].append(entry)
            manifest['assetCount'] += 1
        with Image.open(path) as image:
            entry['dimensions'] = f'{image.width}x{image.height}'
        # Por diferencia: repetir el script no cuenta dos veces.
        manifest['runtimeBytes'] += len(data) - entry['size']
        entry['size'] = len(data)
        entry['sha256'] = hashlib.sha256(data).hexdigest()
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for name in ENTRIES:
        print(f'assets/{name}', (OUT / name).stat().st_size)


if __name__ == '__main__':
    main()
