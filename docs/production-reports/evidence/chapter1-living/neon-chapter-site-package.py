#!/usr/bin/env python3
"""Update the existing private Site package only when explicitly invoked."""
from pathlib import Path
import argparse
import datetime
import hashlib
import json
import re
import shutil

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--package', required=True, type=Path, help='Clean preview package directory containing build-info.json')
parser.add_argument('--expected-commit', required=True, help='Full tested application SHA')
args = parser.parse_args()
site = Path('/workspace/sites/neon-catcher-pruebas')
package = args.package.resolve(strict=True)
assert re.fullmatch(r'[0-9a-f]{40}', args.expected_commit), 'Expected a full application commit'
assert package != site and site not in package.parents, 'Source package must be outside the Site'
identity = json.loads((site / '.openai/hosting.json').read_text())
assert identity == {'project_id': 'appgprj_6ad34f65ce74819195e871d7dd99fe21', 'static': {'directory': 'dist'}}, 'Existing hosting configuration required'
info = json.loads((package / 'build-info.json').read_text())
assert info['commit'] == args.expected_commit and info['dirty'] is False, 'Require the expected clean package'
assert info['branch'] == 'continuity-assets-audit-20261013' and info['engineV1'] is False, 'Unexpected branch or engine'
assert re.fullmatch(r'[0-9a-f]{64}', info['revision']), 'Package revision missing'
required = [
    'juego/game.js', 'juego/content-runtime.js',
    'juego/assets/chapter1_intro_atlas_v1.webp',
    'juego/assets/chapter1_missile_atlas_v1.webp',
    'juego/assets/chapter1_portraits_v1.webp',
    'juego/assets/chapter1_opening_score_v1.m4a',
    'juego/assets/chapter1_voyage_score_v1.m4a',
]
for name in required:
    digest = hashlib.sha256((package / name).read_bytes()).hexdigest()
    assert digest == info['files'][name]['sha256'], f'Package inventory mismatch: {name}'
allowed = {'dist/index.html', 'dist/manifest.webmanifest', 'dist/build-info.json', 'dist/launcher-sw.js', 'README.md'}
def protected_hashes():
    return {
        str(p.relative_to(site)): hashlib.sha256(p.read_bytes()).hexdigest()
        for p in site.rglob('*')
        if p.is_file() and '.git' not in p.parts
        and not str(p.relative_to(site)).startswith('dist/clasico-actual/')
        and str(p.relative_to(site)) not in allowed
    }
before = protected_hashes()
assert len(before) == 146, f'Review protected inventory before mutation: {len(before)} files, expected 146'
Path('/tmp/neon-chapter-site-protected-before.json').write_text(json.dumps(before, indent=2) + '\n')
shutil.copytree(package, site / 'dist/clasico-actual', dirs_exist_ok=True)
(site / 'dist/index.html').write_text((package / 'index.html').read_text().replace('juego/', 'clasico-actual/juego/'))
manifest = json.loads((package / 'manifest.webmanifest').read_text())
for icon in manifest['icons']:
    icon['src'] = 'clasico-actual/' + icon['src']
(site / 'dist/manifest.webmanifest').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
# Preserve the established worker scopes and storage namespaces.
(site / 'dist/launcher-sw.js').write_text((package / 'launcher-sw.js').read_text().replace('juego/', 'clasico-actual/juego/'))
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
p = site / 'dist/build-info.json'
m = json.loads(p.read_text())
m['classicCurrent'] = {
    'entry': 'clasico-actual/juego/index.html', 'packageRoot': 'clasico-actual/',
    'buildInfo': info, 'updatedAt': now,
    'purpose': 'Capítulo Chronos–Gaia: historia, naves compactas, casco reforzado, misiles y Atlas v5',
}
p.write_text(json.dumps(m, ensure_ascii=False, indent=2) + '\n')
p = site / 'README.md'
section = '\n\n## Capítulo Chronos–Gaia · ' + info['commit'] + '\n\n'
text = p.read_text()
if section not in text:
    p.write_text(text + section + 'Paquete limpio de la rama autorizada; revisión ' + info['revision'] + '. Entrada única del viaje, cinemática y personajes de Chronos, naves al 40 % con colisiones ajustadas, refuerzo de casco consumido por daño, misiles físicos y Atlas v5 como cierre del primer nivel. Incluye tres atlas nuevos y dos pistas AAC en contenedores M4A. Se conservan físicamente los experimentos y campañas históricos, sin enlaces en la entrada principal. Aceptación artística y prueba física pendientes; no es producción Netlify.\n')
after = protected_hashes()
assert after == before, 'A protected file changed, appeared or disappeared; preserve and investigate'
result = {
    'applicationCommit': info['commit'], 'revision': info['revision'], 'dirty': info['dirty'],
    'protectedFiles': len(before), 'changedOutsideAllowedScope': [],
    'hostingUnchanged': before['.openai/hosting.json'] == after['.openai/hosting.json'],
    'gameSha256': info['files']['juego/game.js']['sha256'],
    'allowedRootChanges': sorted(allowed), 'package': str(package), 'preparedAt': now,
}
Path('/tmp/neon-chapter-site-preservation.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
