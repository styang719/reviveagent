# Cuts the rendered blocks (block-14.png, block-15.png in the given folder) into 512px WebP tiles.
import os
import sys

from PIL import Image

BLOCKS = {14: (2810, 6534), 15: (5622, 13071)}  # first tile x, y of each block
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'assets', 'tiles-hd')

src = sys.argv[1] if len(sys.argv) > 1 else '.'
total = 0
for z, (x0, y0) in BLOCKS.items():
    im = Image.open(os.path.join(src, f'block-{z}.png')).convert('RGB')
    w, h = im.size
    for i in range(w // 512):
        for j in range(h // 512):
            d = os.path.join(ROOT, str(z), str(x0 + i))
            os.makedirs(d, exist_ok=True)
            f = os.path.join(d, f'{y0 + j}.webp')
            im.crop((i * 512, j * 512, i * 512 + 512, j * 512 + 512)).save(f, 'WEBP', quality=65, method=6)
            total += os.path.getsize(f)
print(f'{total / 1e6:.2f} MB')
