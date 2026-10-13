"""Build editable merch SVGs from credited public-domain coffee specimens and OFL typography."""
from pathlib import Path
import base64, json, html
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

root = Path(__file__).resolve().parents[1]
coffee = root / 'public/merch/coffee'
(coffee / 'motifs').mkdir(exist_ok=True)
font = instantiateVariableFont(TTFont(root / 'public/fonts/space-grotesk-latin.woff2'), {'wght': 700}, inplace=False)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
units = font['head'].unitsPerEm

def text_paths(text, center, baseline, size, fill='#34224f', tracking=0):
    advances = [glyphs[cmap[ord(c)]].width * size / units + tracking for c in text]
    x = center - (sum(advances) - tracking) / 2
    result = []
    for c, advance in zip(text, advances):
        pen = SVGPathPen(glyphs)
        glyphs[cmap[ord(c)]].draw(pen)
        result.append(f'<path d="{pen.getCommands()}" transform="translate({x:.3f} {baseline}) scale({size/units:.6f} {-size/units:.6f})" fill="{fill}"/>')
        x += advance
    return ''.join(result)

image = base64.b64encode((coffee / 'sources/coffea-arabica.jpg').read_bytes()).decode()
# Coordinates use the displayed 1344 x 1853 plate; viewBox maps to the preserved full scan.
specimens = [
    ('blossom', [58, 1355, 245, 220], '65,1440 86,1406 99,1364 137,1381 166,1358 203,1380 242,1368 267,1400 301,1450 233,1490 204,1510 200,1575 176,1575 170,1510 123,1480 74,1483'),
    ('upright-leaf', [580, 65, 200, 405], '590,441 585,328 620,195 703,116 775,72 735,228 675,354 642,459'),
    ('fruit-branch', [810, 1310, 295, 250], '820,1443 857,1415 918,1423 940,1380 986,1310 1066,1316 1080,1403 1020,1461 1104,1548 1085,1560 986,1477 926,1503 839,1492'),
    ('bean-back', [1159, 1243, 70, 98], None),
    ('stamens', [80, 1195, 220, 144], None),
    ('bean-front', [1160, 1395, 70, 90], None),
    ('leaf', [75, 253, 541, 258], '77,278 209,261 430,259 539,378 613,476 526,507 301,482 172,417'),
    ('fruit-section', [513, 1460, 94, 94], 'ellipse'),
    ('seed-section', [675, 1335, 125, 117], 'ellipse'),
]
# Converts white paper to transparent and remaining ink to one plum channel.
filter_def = '<filter id="ink" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .204 0 0 0 0 .133 0 0 0 0 .310 -.213 -.715 -.072 0 1"/></filter>'
source = f'<image href="data:image/jpeg;base64,{image}" width="1344" height="1853" filter="url(#ink)"/>'
parts=[]
manifest=[]
for i, (name, box, polygon) in enumerate(specimens):
    x,y,w,h=box
    clip = f'<ellipse cx="{x+w/2}" cy="{y+h/2}" rx="{w/2}" ry="{h/2}"/>' if polygon == 'ellipse' else f'<polygon points="{polygon}"/>' if polygon else f'<rect x="{x}" y="{y}" width="{w}" height="{h}"/>'
    defs = f'<defs>{filter_def}<clipPath id="crop-{i}">{clip}</clipPath></defs>'
    body = f'<g clip-path="url(#crop-{i})">{source}</g>'
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" width="{w}" height="{h}"><title>{name.replace("-", " ")}</title><desc>Public-domain Coffea arabica plate, Köhler’s Medizinal-Pflanzen; scan restored by CarolSpears. See sources/provenance.json.</desc>{defs}{body}</svg>'
    (coffee / f'motifs/{name}.svg').write_text(svg)
    scale=min(205/w,205/h)
    left=50+(i%3)*250+(205-w*scale)/2
    top=30+(i//3)*250+(205-h*scale)/2
    parts.append(f'<g transform="translate({left:.3f} {top:.3f}) scale({scale:.6f}) translate({-x} {-y})">{defs}{body}</g>')
    manifest.append({'name':name, 'file':f'motifs/{name}.svg', 'source':'sources/coffea-arabica.jpg', 'license':'Public domain', 'crop':box, 'clipPolygon':polygon})

back = ''.join(parts) + '<rect x="255" y="340" width="290" height="55" fill="#f4f1eb"/>' + text_paths('20g / 250ml',400,382,42) + text_paths('DEVON LABS',400,795,23,tracking=3)
(coffee / 'back.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="825" viewBox="0 0 800 825"><title>20g / 250ml — public-domain coffee specimen grid</title>{back}</svg>')
# Original editable recreation of the DL silhouette; source code under MIT.
logo = '<path d="M12 0H90C135 0 162 22 174 51V8Q174 0 182 0H218Q226 0 226 8V112H286Q300 112 300 126V148Q300 160 286 160H207Q174 160 174 126C160 148 133 160 90 160H12Q0 160 0 148V12Q0 0 12 0ZM55 55V105H105V55Z" fill-rule="evenodd" fill="#34224f"/>'
front = '<g transform="translate(30 20)">'+logo+'</g>'+text_paths('DEVON LABS',180,220,25,tracking=2)
(coffee / 'front.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240"><title>Devon Labs original DL mark</title>{front}</svg>')
(coffee / 'motifs.json').write_text(json.dumps(manifest,indent=2)+'\n')

# Exact Space Grotesk outlined type plus original photograph for the After Hours back.
after = root / 'output/merch/after-hours-artwork'
after.mkdir(exist_ok=True)
photo = base64.b64encode((root / 'public/workshop/photos/12.webp').read_bytes()).decode()
svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1240" viewBox="0 0 800 1240"><title>After Hours — Space Grotesk back artwork</title>{text_paths("AFTER HOURS",400,90,82,"#f4f1eb")}<image x="40" y="140" width="720" height="1080" href="data:image/webp;base64,{photo}" opacity=".85"/></svg>'
(after / 'back.svg').write_text(svg)
print('Generated nine credited motif SVGs, coffee front/back artwork, and exact Space Grotesk After Hours type.')
