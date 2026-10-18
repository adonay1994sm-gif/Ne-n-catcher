#!/usr/bin/env python3
"""Authenticated HTTP verification; accepts authorization only on hidden stdin."""
import argparse
import datetime
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import urllib.parse
import urllib.request

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--package', required=True, type=pathlib.Path, help='Exact clean package already published to the private Site')
parser.add_argument('--expected-commit', required=True, help='Full tested application SHA')
parser.add_argument('--output', type=pathlib.Path, default=pathlib.Path('/tmp/neon-chapter-site-http-01'))
args = parser.parse_args()
info = json.loads((args.package / 'build-info.json').read_text())
assert re.fullmatch(r'[0-9a-f]{40}', args.expected_commit), 'Full application commit required'
assert info['commit'] == args.expected_commit and info['dirty'] is False and info['engineV1'] is False, 'Require the expected clean package'
if sys.stdin.isatty():
    subprocess.run(['stty', '-echo'], check=True)
print('Ready for hidden Site HTTP authorization.', flush=True)
try:
    try:
        x = json.loads(sys.stdin.readline())
    except Exception:
        raise RuntimeError('Invalid authorization JSON; input was not logged') from None
finally:
    if sys.stdin.isatty():
        subprocess.run(['stty', 'echo'], check=True)
url = x['url'].rstrip('/')
assert urllib.parse.urlparse(url)._replace(path='', params='', query='', fragment='').geturl() == 'https://neon-catcher-pruebas.chictide18.chatgpt.site', 'Existing private Site URL required'
assert url == 'https://neon-catcher-pruebas.chictide18.chatgpt.site', 'Use the private Site root URL'
assert x.get('token'), 'Authorization required'
args.output.mkdir(parents=True, exist_ok=True)
result = {'status': 'running', 'checks': [], 'observedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'site': url, 'applicationCommit': info['commit'], 'revision': info['revision'], 'method': 'Real authenticated HTTP with configured environment transport', 'errors': []}
checks = [('/', 'launcher'), ('/manifest.webmanifest', 'manifest'), ('/clasico-actual/build-info.json', 'provenance')]
files = [
    'juego/game.js', 'juego/content-runtime.js',
    'juego/assets/gaia_pulse_atlas_v3.webp', 'juego/assets/hostile_ordnance_atlas_v1.webp',
    'juego/assets/chapter1_intro_atlas_v1.webp',
    'juego/assets/chapter1_missile_atlas_v1.webp',
    'juego/assets/chapter1_portraits_v1.webp',
    'juego/assets/chapter1_opening_score_v1.m4a',
    'juego/assets/chapter1_voyage_score_v1.m4a',
]
checks.extend(('/clasico-actual/' + name, name) for name in files)
try:
    for path, kind in checks:
        request = urllib.request.Request(url + path, headers={'OAI-Sites-Authorization': 'Bearer ' + x['token'], 'Cache-Control': 'no-cache'})
        with urllib.request.urlopen(request, timeout=45) as response:
            body = response.read()
            status = response.status
        assert status == 200, f'HTTP {status}: {path}'
        digest = hashlib.sha256(body).hexdigest()
        entry = {'path': path, 'status': status, 'bytes': len(body), 'sha256': digest, 'result': 'passed'}
        if kind == 'launcher':
            text = body.decode()
            assert 'clasico-actual/juego/index.html' in text and 'qaArchive' not in text and 'orbitallink' not in text and info['commit'] in text, 'Unexpected launcher or stale application commit'
        elif kind == 'manifest':
            assert json.loads(body)['name'] == 'NEON CRONIUM', 'Unexpected manifest identity'
        elif kind == 'provenance':
            deployed = json.loads(body)
            assert deployed['commit'] == info['commit'] and deployed['revision'] == info['revision'] and deployed['dirty'] is False and deployed['engineV1'] is False, 'Deployed provenance does not match the clean local package'
            entry.update({'commit': deployed['commit'], 'revision': deployed['revision'], 'dirty': deployed['dirty']})
        else:
            expected = hashlib.sha256((args.package / kind).read_bytes()).hexdigest()
            assert expected == info['files'][kind]['sha256'], f'Local package inventory mismatch: {kind}'
            assert digest == expected, f'Deployed asset differs: {path}'
            if kind.endswith('.webp'):
                assert body[:4] == b'RIFF' and body[8:12] == b'WEBP', f'Invalid WebP response: {path}'
            if kind.endswith('.m4a'):
                assert body[4:8] == b'ftyp' and b'mp4a' in body, f'Invalid AAC/M4A response: {path}'
        result['checks'].append(entry)
    result.update({'status': 'passed', 'exitCode': 0})
except Exception as error:
    result.update({'status': 'failed', 'exitCode': 1, 'failure': str(error).replace(x['token'], '[redacted]')})
(args.output / 'results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
sys.exit(result['exitCode'])
