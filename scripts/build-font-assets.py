"""Copia las letras del juego a assets/: Orbitron (títulos y botones) y Exo 2 (textos y números).

Orbitron va completa y sin tocar (su licencia reserva el nombre si se modifica);
Exo 2 es el recorte latino que sirve Google Fonts. Licencias OFL y procedencia
en art-source/fonts/. Crea o actualiza sus entradas en ASSET_MANIFEST.json.
Reproducible: mismas entradas, mismas salidas.
Uso: python3 scripts/build-font-assets.py
"""
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'art-source' / 'fonts'
MANIFEST = ROOT / 'ASSET_MANIFEST.json'

ENTRIES = {
    'orbitron_wght_v1.ttf': {
        'id': 'font-orbitron-v1', 'master': 'art-source/fonts/Orbitron[wght].ttf', 'format': 'ttf',
        'use': 'Letra de títulos, botones y cifras grandes (decisión del propietario, 24/10).'},
    'exo2_latin_wght_v1.woff2': {
        'id': 'font-exo2-v1', 'master': 'art-source/fonts/exo2_latin_wght.woff2', 'format': 'woff2',
        'use': 'Letra de textos, diálogos y números pequeños (decisión del propietario, 24/10).'},
}


def main():
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    by_path = {entry['path']: entry for entry in manifest['standalone']}
    for name, fields in ENTRIES.items():
        out = ROOT / 'assets' / name
        shutil.copyfile(ROOT / fields['master'], out)
        data = out.read_bytes()
        entry = by_path.get(f'assets/{name}')
        if entry is None:
            entry = {'id': fields['id'], 'path': f'assets/{name}', 'master': fields['master'], 'dimensions': '',
                     'format': fields['format'], 'size': 0, 'sha256': '', 'activeRuntime': True, 'precache': True,
                     'status': 'IN_REVIEW', 'artisticAcceptance': 'ACCEPTED',
                     'origin': 'Google Fonts, licencia SIL Open Font License 1.1 (art-source/fonts/OFL-*.txt)',
                     'version': 1, 'use': fields['use']}
            manifest['standalone'].append(entry)
            manifest['assetCount'] += 1
        # Por diferencia: repetir el script no cuenta dos veces.
        manifest['runtimeBytes'] += len(data) - entry['size']
        entry['size'] = len(data)
        entry['sha256'] = hashlib.sha256(data).hexdigest()
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for name in ENTRIES:
        print(f'assets/{name}', (ROOT / 'assets' / name).stat().st_size)


if __name__ == '__main__':
    main()
