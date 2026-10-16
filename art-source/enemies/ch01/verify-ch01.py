"""Asset-only validation. Requires Pillow in the artist's environment, never in game runtime."""
from pathlib import Path
from PIL import Image
from datetime import datetime, timezone
import hashlib
import json

ROOT = Path(__file__).resolve().parent
metadata = json.loads((ROOT / 'ch01-atlas-v1.json').read_text())
atlas = Image.open(ROOT / metadata['image'])
assert atlas.mode == 'RGBA', f'Expected RGBA, received {atlas.mode}'
assert atlas.size == (1024, 1536), f'Unexpected atlas dimensions: {atlas.size}'
assert len(metadata['frames']) == 24
frames = []
hashes = set()
for frame in metadata['frames']:
    rect = frame['rect']
    x, y, width, height = (rect[key] for key in ('x', 'y', 'width', 'height'))
    assert width == height == 256
    assert 0 <= x <= atlas.width - width and 0 <= y <= atlas.height - height
    cell = atlas.crop((x, y, x + width, y + height))
    digest = hashlib.sha256(cell.tobytes()).hexdigest()
    hashes.add(digest)
    alpha = cell.getchannel('A')
    visible = alpha.point(lambda value: 255 if value >= 8 else 0).getbbox()
    assert visible is not None, f'Empty frame {frame["index"]}'
    margin = min(visible[0], visible[1], 256 - visible[2], 256 - visible[3])
    assert margin >= 8, f'Visible content bleeds into gutter: {frame["index"]}'
    border_alpha = max(alpha.crop(box).getextrema()[1] for box in (
        (0, 0, 256, 4), (0, 252, 256, 256), (0, 0, 4, 256), (252, 0, 256, 256)))
    assert border_alpha <= 2, f'Opaque cell boundary: {frame["index"]}'
    frames.append({'index': frame['index'], 'sha256': digest, 'visibleBoundsAlpha8': visible,
                   'minimumVisibleGutterPx': margin, 'border4MaxAlpha255': border_alpha})
assert len(hashes) == 24, 'Repeated raster frame found'
for name, animation in metadata['animations'].items():
    assert len(animation['frames']) == len(animation['durationMs'])
    assert all(0 <= number < 24 for number in animation['frames'])
    assert all(duration > 0 for duration in animation['durationMs'])
    for event in animation.get('events', []):
        assert 0 <= event['frameOffset'] < len(animation['frames'])
result = {'schemaVersion': 1, 'checkedAtUtc': datetime.now(timezone.utc).isoformat(),
          'status': 'passed', 'exitCode': 0, 'scope': 'decoded asset dimensions, alpha gutters, distinct frames and animation metadata only; no game integration or device certification',
          'image': metadata['image'], 'bytes': (ROOT / metadata['image']).stat().st_size,
          'sha256': hashlib.sha256((ROOT / metadata['image']).read_bytes()).hexdigest(),
          'dimensions': list(atlas.size), 'decodedRgbaBytes': atlas.width * atlas.height * 4,
          'frameCount': len(frames), 'uniqueFrameCount': len(hashes), 'frames': frames}
(ROOT / 'ch01-validation.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({key: value for key, value in result.items() if key != 'frames'}, indent=2))
