"""Export committed source for review, without credentials or machine-local files.

Uses Git blobs from HEAD, never a mixture of live files. Historical binary
evidence and old delivery ZIPs stay in Git; a manifest lists every omission.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import zipfile


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', required=True, help='New ZIP outside the repository')
args = parser.parse_args()
output = Path(args.output).resolve()
if output.is_relative_to(ROOT):
    raise SystemExit('Use an output directory outside the repository')
output.parent.mkdir(parents=True, exist_ok=True)
text_output = output.with_suffix('.txt')
manifest_output = output.with_suffix('.json')
if any(p.exists() for p in [output, text_output, manifest_output]):
    raise SystemExit('An output already exists; choose a new name')
commit = git('rev-parse', 'HEAD').decode().strip()
branch = git('branch', '--show-current').decode().strip()
entries = git('ls-tree', '-r', '-z', 'HEAD').split(b'\0')
text_suffixes = {'.js', '.mjs', '.cjs', '.ts', '.css', '.html', '.json', '.py',
                 '.toml', '.yml', '.yaml', '.swift', '.m', '.h', '.sh', '.svg',
                 '.plist', '.storyboard', '.pbxproj', '.xcconfig', '.xml', '.md'}
code_roots = {'src', 'scripts', 'tests', 'engine', 'js', 'render', 'ios', '.github'}
manifest = {'commit': commit, 'branch': branch, 'source': 'immutable Git HEAD blobs',
            'kind': 'source review, not a deployment package', 'files': [], 'omitted': [],
            'preserves': ['current and archived campaign source', 'runtime assets',
                          'art masters', 'native project', 'tests', 'licenses', 'documentation text']}
intro = f'''NEON CRONIUM — CÓDIGO PARA REVISIÓN
Rama: {branch}
Commit: {commit}

La referencia de este lote es docs/production-reports/FORJA_LEVEL_ONE_REMATES_2026-10-18.md,
incluida también en este TXT. Describe lo implementado, decisiones y validación pendiente.
Este TXT concatena fuentes actuales, pruebas y herramientas; el ZIP conserva rutas y recursos.
Los bundles duplicados se omiten del TXT y se conservan en el ZIP.
No editar copias históricas de docs/evidence ni pegar parches exclusivamente en game.js.
Editar src/game y regenerar con npm run build:preview.
No activar USE_ENGINE_V1, cambiar claves de guardado ni integrar main/PR3.
Para proponer mejoras, citar archivo y función, defecto concreto, efecto en el jugador
y comprobación que demostraría la corrección. Distinguir revisión de código y partida real.

'''
chunks = [intro]
with zipfile.ZipFile(output, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for entry in entries:
        if not entry:
            continue
        metadata, raw_path = entry.split(b'\t', 1)
        mode, kind, object_id = metadata.decode().split()
        name = raw_path.decode()
        path = PurePosixPath(name)
        suffix = path.suffix.lower()
        if re.search(r'(^|/)(\.env(\..*)?|credentials\.json|id_rsa|id_ed25519)(/|$)', name):
            raise SystemExit('Sensitive path rejected; do not distribute this snapshot')
        reason = None
        if kind != 'blob' or mode == '120000':
            reason = 'non-regular source entry'
        elif suffix in {'.zip', '.gz', '.tar', '.ipa'}:
            reason = 'historical delivery archive retained in Git'
        elif name.startswith('docs/') and suffix not in text_suffixes | {'.txt', '.log'}:
            reason = 'historical binary evidence retained in Git'
        if reason:
            manifest['omitted'].append({'path': name, 'reason': reason})
            continue
        content = git('cat-file', 'blob', object_id)
        archive.writestr(name, content)
        manifest['files'].append({'path': name, 'bytes': len(content),
                                  'sha256': hashlib.sha256(content).hexdigest()})
        current_code = path.parts[0] in code_roots or len(path.parts) == 1 or name == \
            'docs/production-reports/FORJA_LEVEL_ONE_REMATES_2026-10-18.md'
        if current_code and suffix in text_suffixes and name not in {
                'game.js', 'content-runtime.js', 'core-runtime.js', 'native-admob.js',
                'package-lock.json', 'ASSET_PRODUCTION_150.json', 'ASSET_MANIFEST.json'}:
            try:
                text = content.decode('utf-8')
            except UnicodeDecodeError:
                continue
            chunks.append(f'\n\n===== ARCHIVO: {name} =====\n{text}')
    archive.writestr('LEER_PRIMERO_EXPORTACION.txt', intro + '\nReconstrucción: npm ci; npm run build:preview.\n'
                     'Abrir preview-dist con un servidor HTTP local. No hacer doble clic en index.html.\n'
                     'Node >=22.13.0. Los paquetes del navegador/Playwright pueden requerir instalación de QA adicional.\n'
                     'Las omisiones detalladas en EXPORT_MANIFEST.json siguen recuperables en Git.\n')
    archive.writestr('EXPORT_MANIFEST.json', json.dumps(manifest, ensure_ascii=False, indent=2))
text_output.write_text(''.join(chunks), encoding='utf-8')
with zipfile.ZipFile(output) as archive:
    bad = archive.testzip()
    if bad:
        raise SystemExit(f'CRC mismatch: {bad}')
    for item in manifest['files']:
        if hashlib.sha256(archive.read(item['path'])).hexdigest() != item['sha256']:
            raise SystemExit('Archive content hash mismatch')
manifest['archive'] = {'path': str(output), 'bytes': output.stat().st_size,
                       'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'crc': 'PASS'}
manifest['text'] = {'path': str(text_output), 'bytes': text_output.stat().st_size,
                    'sha256': hashlib.sha256(text_output.read_bytes()).hexdigest()}
manifest_output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'commit': commit, 'files': len(manifest['files']), 'omitted': len(manifest['omitted']),
                  'archive': manifest['archive'], 'text': manifest['text']}, ensure_ascii=False, indent=2))
