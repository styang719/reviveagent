# High-res tiles for the Flip360 map

`src/assets/tiles-hd/{z}/{x}/{y}.webp` are 512px (retina) map tiles for zoom 14–15 around Eagle Rock and
Highland Park. They are rendered from [OpenFreeMap](https://openfreemap.org) (Liberty style without point-of-interest and transit icons,
OpenStreetMap data, no API key) with MapLibre in headless Chromium, then cut into tiles. They are bundled because hosted
previews block images from other sites.

To re-render (needs network access to `tiles.openfreemap.org`):

```bash
npm i --no-save maplibre-gl@4.7.1
node scripts/hd-tiles/render.cjs liberty 14 2810 6534 6 7 /tmp/block-14.png
node scripts/hd-tiles/render.cjs liberty 15 5622 13071 7 9 /tmp/block-15.png
python3 scripts/hd-tiles/slice.py /tmp
```

`render.cjs` arguments: style, zoom, first tile x, first tile y, columns, rows, output PNG. The zoom-15 block
(where the listings are, plus room to pan) sets the area the map is held to (`AREA` in `src/flip360/area.ts`); change both together. The
zoom-14 block adds a margin so the view can zoom out to 13.5. Keep the total small: every tile is inlined
into the single-file preview, which has a 16 MB limit.
