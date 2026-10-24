"""Empaqueta el haz pintado de Cronos Prime para el disparo del inicio de Chronos.

Lee art-source/cronos-prime/cronos_prime_f1_haz_v1.webp (haz vertical con
energía en espiral, origen arriba) y escribe assets/cronos_prime_beam_v1.webp a
su tamaño. Crea o actualiza su entrada en ASSET_MANIFEST.json.
Reproducible: mismas entradas, mismas salidas.
Uso: python3 scripts/build-cronos-beam-assets.py
"""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'art-source' / 'cronos-prime' / 'cronos_prime_f1_haz_v1.webp'
OUT = ROOT / 'assets' / 'cronos_prime_beam_v1.webp'
MANIFEST = ROOT / 'ASSET_MANIFEST.json'


def main():
    Image.open(SOURCE).convert('RGBA').save(OUT, 'WEBP', quality=90, alpha_quality=100, method=6)
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    path = f'assets/{OUT.name}'
    entry = next((item for item in manifest['standalone'] if item['path'] == path), None)
    if entry is None:
        entry = {'id': 'cronos-prime-beam-v1', 'path': path, 'master': 'art-source/cronos-prime/cronos_prime_f1_haz_v1.webp',
                 'dimensions': '', 'format': 'webp-alpha', 'size': 0, 'sha256': '', 'activeRuntime': True, 'precache': True,
                 'status': 'IN_REVIEW', 'artisticAcceptance': 'PENDING_OWNER',
                 'origin': 'arte del propietario (ChatGPT), ya en art-source/cronos-prime',
                 'version': 1, 'use': 'Inicio de Chronos: haz pintado del disparo de Cronos Prime y de las descargas que le llevan la energía.'}
        manifest['standalone'].append(entry)
        manifest['assetCount'] += 1
    data = OUT.read_bytes()
    with Image.open(OUT) as image:
        entry['dimensions'] = f'{image.width}x{image.height}'
    # Por diferencia: repetir el script no cuenta dos veces.
    manifest['runtimeBytes'] += len(data) - entry['size']
    entry['size'] = len(data)
    entry['sha256'] = hashlib.sha256(data).hexdigest()
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(path, len(data))


if __name__ == '__main__':
    main()
