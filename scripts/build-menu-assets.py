"""Empaqueta el arte de GPT de la pantalla principal (hangar, marcos de botón, flecha y engranaje).

Lee art-source/ui/menu-principal/ y escribe en assets/:
- menu_hangar_bg_v1.webp: el hangar con la plataforma vacía (1080x1920); el
  centro de la plataforma queda al 50 % del ancho y al 38 % del alto.
- menu_frame_v1.webp y menu_frame_pressed_v1.webp: marcos de botón sin los
  márgenes transparentes, para estirarlos con border-image.
- menu_hangar_button_v1.webp: la nave aparcada del botón del hangar.
- menu_arrow_v1.webp y menu_gear_v1.webp: recortados de la maqueta de botones
  (la casilla de la flecha con su forma octogonal y el engranaje de ajustes).
Crea o actualiza sus entradas en ASSET_MANIFEST.json.
Reproducible: mismas entradas, mismas salidas.
Uso: python3 scripts/build-menu-assets.py
"""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'art-source' / 'ui' / 'menu-principal'
OUT = ROOT / 'assets'
MANIFEST = ROOT / 'ASSET_MANIFEST.json'
MAQUETA = SOURCE / 'maqueta_botones_lista_v1.webp'
# Filas con marco (el resto del lienzo de GPT es transparente).
FRAME_ROWS = (20, 190)

ENTRIES = {
    'menu_hangar_bg_v1.webp': ('menu-hangar-bg-v1', 'menu_hangar_fondo_v1.webp', 'webp',
                               'Pantalla principal: hangar con la plataforma vacía; el juego pone encima la nave elegida.'),
    'menu_frame_v1.webp': ('menu-frame-v1', 'menu_marco_boton_v1.webp', 'webp-alpha',
                           'Pantalla principal: marco pintado de los botones (se estira con border-image).'),
    'menu_frame_pressed_v1.webp': ('menu-frame-pressed-v1', 'menu_marco_boton_pulsado_v1.webp', 'webp-alpha',
                                   'Pantalla principal: marco de botón pulsado.'),
    'menu_hangar_button_v1.webp': ('menu-hangar-button-v1', 'menu_boton_hangar_v1.webp', 'webp-alpha',
                                   'Pantalla principal: nave aparcada dentro del botón ENTRAR AL HANGAR.'),
    'menu_arrow_v1.webp': ('menu-arrow-v1', 'maqueta_botones_lista_v1.webp', 'webp-alpha',
                           'Pantalla principal: casilla octogonal con la flecha de los botones.'),
    'menu_gear_v1.webp': ('menu-gear-v1', 'maqueta_botones_lista_v1.webp', 'webp-alpha',
                          'Pantalla principal: engranaje pintado del botón de ajustes.'),
}


def octagon(image, cut):
    w, h = image.size
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).polygon([(cut, 0), (w - cut, 0), (w, cut), (w, h - cut), (w - cut, h),
                                  (cut, h), (0, h - cut), (0, cut)], fill=255)
    image.putalpha(Image.composite(image.getchannel('A'), Image.new('L', (w, h), 0), mask))
    return image


def build():
    Image.open(SOURCE / 'menu_hangar_fondo_v1.webp').convert('RGB').resize((1080, 1920), Image.LANCZOS) \
        .save(OUT / 'menu_hangar_bg_v1.webp', 'WEBP', quality=82, method=6)
    for source, name in (('menu_marco_boton_v1.webp', 'menu_frame_v1.webp'),
                         ('menu_marco_boton_pulsado_v1.webp', 'menu_frame_pressed_v1.webp')):
        frame = Image.open(SOURCE / source).convert('RGBA')
        frame.crop((0, FRAME_ROWS[0], frame.width, FRAME_ROWS[1])) \
            .save(OUT / name, 'WEBP', quality=90, alpha_quality=100, method=6)
    Image.open(SOURCE / 'menu_boton_hangar_v1.webp').convert('RGBA').resize((996, 210), Image.LANCZOS) \
        .save(OUT / 'menu_hangar_button_v1.webp', 'WEBP', quality=88, alpha_quality=100, method=6)
    maqueta = Image.open(MAQUETA).convert('RGBA')
    octagon(maqueta.crop((1302, 125, 1438, 243)), 24) \
        .save(OUT / 'menu_arrow_v1.webp', 'WEBP', quality=90, alpha_quality=100, method=6)
    gear = maqueta.crop((600, 683, 940, 995))
    gear = gear.crop(gear.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox())
    gear.resize((156, 150), Image.LANCZOS).save(OUT / 'menu_gear_v1.webp', 'WEBP', quality=90, alpha_quality=100, method=6)


def main():
    build()
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    by_path = {entry['path']: entry for entry in manifest['standalone']}
    for name, (asset_id, master, fmt, use) in ENTRIES.items():
        path = OUT / name
        data = path.read_bytes()
        entry = by_path.get(f'assets/{name}')
        if entry is None:
            entry = {'id': asset_id, 'path': f'assets/{name}', 'master': f'art-source/ui/menu-principal/{master}',
                     'dimensions': '', 'format': fmt, 'size': 0, 'sha256': '', 'activeRuntime': True, 'precache': True,
                     'status': 'IN_REVIEW', 'artisticAcceptance': 'PENDING_OWNER',
                     'origin': 'GPT a petición del propietario (encargos art-menu-capas y art-menu-marcos)',
                     'version': 1, 'use': use}
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
