"""Verifica os modelos Word após a preparação para publicação."""
from pathlib import Path
from zipfile import ZipFile
from lxml import etree as E

ROOT = Path(__file__).resolve().parents[1]
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'v': 'urn:schemas-microsoft-com:vml'}
count = 0
for kind in ['word', 'word-conteudo']:
    for segment in ['ensino-medio', 'convenio', 'pre-vestibular']:
        paths = list((ROOT / 'assets' / kind / segment).rglob('*.docx'))
        assert paths, (kind, segment)
        for path in paths:
            with ZipFile(path) as z:
                assert z.testzip() is None, path
                doc = E.fromstring(z.read('word/document.xml'))
                cols = doc.find('.//w:body/w:sectPr/w:cols', NS)
                assert cols.get(f'{{{NS["w"]}}}num') == '2', path
                assert cols.get(f'{{{NS["w"]}}}sep') == '0', path
                for name in ['word/header1.xml', 'word/header2.xml']:
                    root = E.fromstring(z.read(name))
                    fields = root.xpath('.//v:rect[@id="SEIDynamicPage"]//w:fldSimple/@w:instr | .//v:rect[@id="SEIDynamicPage"]//w:instrText/text()', namespaces=NS)
                    assert len(fields) == 1 and 'PAGE' in fields[0], (path, name)
                    assert root.xpath('.//v:rect[@id="SEIDynamicPage"]//w:rPr[w:rFonts[@w:ascii="Arial"]][w:b][w:sz[@w:val="34"]]', namespaces=NS), (path, name)
                    titles = root.xpath('.//w:sdt[w:sdtPr/w:tag[@w:val="sei-identificacao"]]', namespaces=NS)
                    assert len(titles) == (1 if name.endswith('header1.xml') else 0), (path, name)
                    assert not root.xpath('.//w:sdtPr/w:lock', namespaces=NS), path
                settings = E.fromstring(z.read('word/settings.xml'))
                assert settings.find('w:updateFields', NS).get(f'{{{NS["w"]}}}val') == 'true', path
            count += 1
assert count == 120, count
print(f'{count} modelos validados, nos três segmentos e nas duas versões.')
