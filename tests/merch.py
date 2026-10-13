"""Verify all coffee motifs retain their credited source and ship in the download."""
from pathlib import Path
import base64, json, zipfile, xml.etree.ElementTree as ET
root = Path(__file__).resolve().parents[1]
coffee = root / 'public/merch/coffee'
source = (coffee / 'sources/coffea-arabica.jpg').read_bytes()
provenance = json.loads((coffee / 'sources/provenance.json').read_text())
assert provenance['extmetadata']['LicenseShortName']['value'] == 'Public domain'
assert 'K%C3%B6hler' in provenance['url']
motifs = json.loads((coffee / 'motifs.json').read_text())
assert len(motifs) == 9
assert len({motif['file'] for motif in motifs}) == 9
for motif in motifs:
    assert motif['license'] == 'Public domain'
    svg = ET.fromstring((coffee / motif['file']).read_text())
    embedded = svg.find('.//{http://www.w3.org/2000/svg}image').attrib['href']
    assert base64.b64decode(embedded.split(',', 1)[1]) == source, 'Each crop uses the actual credited source scan'
assert (coffee / 'fonts/space-grotesk-latin.woff2').read_bytes() == (root / 'public/fonts/space-grotesk-latin.woff2').read_bytes()
assert (coffee / 'fonts/OFL.txt').read_bytes() == (root / 'public/fonts/SPACE-GROTESK-LICENSE').read_bytes()
for name in ['back.svg', 'front.svg']:
    svg = ET.fromstring((coffee / name).read_text())
    assert not svg.findall('.//{http://www.w3.org/2000/svg}text'), 'Typography has exact outlined glyphs, without substituted fonts'
    assert svg.findall('.//{http://www.w3.org/2000/svg}path')
with zipfile.ZipFile(root / 'public/merch/coffee-artwork.zip') as archive:
    assert archive.testzip() is None
    for file in coffee.rglob('*'):
        if file.is_file():
            assert archive.read('coffee-artwork/' + str(file.relative_to(coffee))) == file.read_bytes(), f'Archive contains current {file.name}'
assert (coffee / 'generate-merch-artwork.py').read_bytes() == (root / 'scripts/generate-merch-artwork.py').read_bytes()
print('Passed nine actual-source motifs, public-domain provenance, font/license copies, outlined typography and complete downloadable archive.')
