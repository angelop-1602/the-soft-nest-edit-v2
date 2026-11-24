"""Optional: lossily recompress existing local WebP hero variants.

Run from repo root: py perf-fix/optimize-images.py
This program never uploads images and replaces a file only if smaller.
Requires: py -m pip install pillow
"""
from pathlib import Path
from PIL import Image
from tempfile import NamedTemporaryFile
import os

root = Path(__file__).resolve().parent.parent
assets = root / 'public/assets/editorial'
paths = [assets / 'living-room-480.webp', assets / 'living-room-1080.webp']
for path in paths:
    if not path.is_file():
        raise SystemExit(f'Missing source image: {path}')
for path in paths:
    size_before = path.stat().st_size
    with NamedTemporaryFile(prefix='softnest-', suffix='.webp', dir=path.parent, delete=False) as tmp:
        temp = Path(tmp.name)
    try:
        with Image.open(path) as source:
            source.save(temp, 'WEBP', quality=78, method=6)
        size_after = temp.stat().st_size
        if size_after < 0.95 * size_before:
            os.replace(temp, path)
            print(f'{path.name}: {size_before // 1024} KiB -> {size_after // 1024} KiB')
        else:
            print(f'{path.name}: keeping original ({size_before // 1024} KiB), no useful saving')
    finally:
        if temp.exists():
            temp.unlink()
print('Review image quality in browser before committing. Git can restore originals.')
