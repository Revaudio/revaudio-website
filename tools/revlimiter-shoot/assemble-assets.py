# Assemble walkthrough part rects from DOM anchors, render a verification
# overlay, and cut the mobile card thumbs from the hero shot.
from PIL import Image, ImageDraw
import json, os

OUT = os.path.join(os.path.dirname(__file__), 'out')

# Final part rects (percent of panel) — anchor unions padded to FRAME the
# control like the old hand-measured boxes did.
PARTS = {
    'ceiling':      {'x': 65.5, 'y': 16.5, 'w': 19.0, 'h': 29.5},   # THRESH knob + plate + readout
    'bands':        {'x': 2.3,  'y': 12.5, 'w': 17.5, 'h': 58.0},   # LOW/MID/HIGH plates + knobs
    'mb':           {'x': 22.0, 'y': 18.0, 'w': 6.6,  'h': 32.5},   # MB COMP toggle + label
    'saturation':   {'x': 1.0,  'y': 44.5, 'w': 39.5, 'h': 54.5},   # drive cluster (orphan)
    'modes':        {'x': 60.8, 'y': 51.5, 'w': 24.0, 'h': 30.3},   # CRUISE/SPORT/NOS
    'meters':       {'x': 83.8, 'y': 25.0, 'w': 14.9, 'h': 27.0},   # LUFS/GR + IN/OUT/CLIP + RESET
    'spectrum':     {'x': 19.6, 'y': 76.5, 'w': 70.0, 'h': 21.5},
    'clipper':      {'x': 86.0, 'y': 50.5, 'w': 12.6, 'h': 23.0},
    'output':       {'x': 87.9, 'y': 74.0, 'w': 10.5, 'h': 25.0},
    'oversampling': {'x': 77.2, 'y': 5.8,  'w': 6.7,  'h': 7.0},
    'gauge':        {'x': 36.0, 'y': 0.5,  'w': 30.0, 'h': 62.0},
    'ab':           {'x': 29.5, 'y': 6.0,  'w': 6.4,  'h': 11.5},
}
# parts that carry a mobile card thumb today (gauge/output don't; crossover = alt shot)
THUMBS = ['ceiling', 'bands', 'mb', 'saturation', 'modes', 'meters',
          'spectrum', 'clipper', 'oversampling', 'ab']

hero = Image.open(os.path.join(OUT, 'hero-2600.png'))
W, H = hero.size

# 1. verification overlay
ov = hero.copy()
d = ImageDraw.Draw(ov)
for slug, r in PARTS.items():
    box = (r['x'] / 100 * W, r['y'] / 100 * H,
           (r['x'] + r['w']) / 100 * W, (r['y'] + r['h']) / 100 * H)
    d.rectangle(box, outline=(212, 175, 55), width=4)
    d.text((box[0] + 8, box[1] + 6), slug, fill=(255, 220, 120))
ov.thumbnail((1800, 1800))
ov.save(os.path.join(OUT, 'overlay.png'))

# 2. thumbs
tdir = os.path.join(OUT, 'thumbs')
os.makedirs(tdir, exist_ok=True)
for slug in THUMBS:
    r = PARTS[slug]
    box = (round(r['x'] / 100 * W), round(r['y'] / 100 * H),
           round((r['x'] + r['w']) / 100 * W), round((r['y'] + r['h']) / 100 * H))
    hero.crop(box).save(os.path.join(tdir, f'revlimiter-part-{slug}.png'))

print(json.dumps({s: PARTS[s] for s in PARTS}), file=open(os.path.join(OUT, 'parts.json'), 'w'))
print('overlay + %d thumbs done, hero %dx%d' % (len(THUMBS), W, H))
