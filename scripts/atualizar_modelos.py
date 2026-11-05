"""Atualiza os modelos publicados sem rasterizar o texto editável do Word.

Executado antes de publicar no Pages. As artes originais são preservadas.
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree as E

ROOT = Path(__file__).resolve().parents[1]
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
V = 'urn:schemas-microsoft-com:vml'
NS = {'w': W, 'v': V}


def el(name, **attrs):
    node = E.Element(f'{{{W}}}{name}')
    for key, value in attrs.items():
        node.set(f'{{{W}}}{key}', str(value))
    return node


def box(name, x, y, width, height, text, size, color, fill, field=False):
    """Caixa ancorada à página, nas coordenadas da moldura original (1024 px)."""
    scale = 200 / 1024 * 72 / 25.4
    left = 5 * 72 / 25.4 + x * scale
    top = ((297 - 297 * 200 / 210) / 2) * 72 / 25.4 + y * scale
    run = el('r')
    pict = E.SubElement(run, f'{{{W}}}pict')
    shape = E.SubElement(pict, f'{{{V}}}rect', id=name, fillcolor=fill, stroked='f')
    shape.set('style', f'position:absolute;margin-left:{left:.3f}pt;margin-top:{top:.3f}pt;'
              f'width:{width * scale:.3f}pt;height:{height * scale:.3f}pt;'
              'mso-position-horizontal-relative:page;mso-position-vertical-relative:page;'
              'mso-wrap-style:none;z-index:251659264')
    tb = E.SubElement(shape, f'{{{V}}}textbox', inset='0,0,0,0')
    content = E.SubElement(tb, f'{{{W}}}txbxContent')
    p = E.SubElement(content, f'{{{W}}}p')
    pp = E.SubElement(p, f'{{{W}}}pPr')
    pp.append(el('spacing', before=0, after=0, line=round(height * scale * 20), lineRule='exact'))
    pp.append(el('jc', val='center'))
    if field:
        parent = E.SubElement(p, f'{{{W}}}fldSimple')
        parent.set(f'{{{W}}}instr', ' PAGE \\# "00" ')
    else:
        sdt = E.SubElement(p, f'{{{W}}}sdt')
        props = E.SubElement(sdt, f'{{{W}}}sdtPr')
        props.append(el('alias', val='Identificação: Aula, Revisão ou Atividade'))
        props.append(el('tag', val='sei-identificacao'))
        props.append(el('text'))
        parent = E.SubElement(sdt, f'{{{W}}}sdtContent')
    r = E.SubElement(parent, f'{{{W}}}r')
    pr = E.SubElement(r, f'{{{W}}}rPr')
    pr.append(el('rFonts', ascii='Arial', hAnsi='Arial'))
    pr.append(el('b'))
    pr.append(el('color', val=color))
    pr.append(el('sz', val=size))
    E.SubElement(r, f'{{{W}}}t').text = text
    return run


def update(path):
    with ZipFile(path) as z:
        entries = {i.filename: z.read(i.filename) for i in z.infolist()}
    doc = E.fromstring(entries['word/document.xml'])
    for cols in doc.findall('.//w:sectPr/w:cols', NS):
        cols.set(f'{{{W}}}num', '2')
        cols.set(f'{{{W}}}sep', '1')
    entries['word/document.xml'] = E.tostring(doc, xml_declaration=True, encoding='UTF-8', standalone=True)
    # Both first-page and continuation headers carry the full-page background.
    for name in ['word/header1.xml', 'word/header2.xml']:
        header = E.fromstring(entries[name])
        for shape in header.xpath('.//v:rect[starts-with(@id, "SEIDynamic")]', namespaces=NS):
            shape.getparent().remove(shape)
        p = header.find('w:p', NS)
        p.append(box('SEIDynamicPage', 943, 1391, 50, 35, '01', 34, '063B8C', '#FFFFFF', field=True))
        if name.endswith('header1.xml'):
            p.append(box('SEIDynamicTitle', 833, 260, 151, 49, 'Revisão 01', 18, 'FFFFFF', '#041629'))
        entries[name] = E.tostring(header, xml_declaration=True, encoding='UTF-8', standalone=True)
    settings = E.fromstring(entries['word/settings.xml'])
    flag = settings.find('w:updateFields', NS)
    if flag is None:
        flag = el('updateFields')
        settings.append(flag)
    flag.set(f'{{{W}}}val', 'true')
    entries['word/settings.xml'] = E.tostring(settings, xml_declaration=True, encoding='UTF-8', standalone=True)
    with ZipFile(path, 'w', ZIP_DEFLATED) as z:
        for name, data in entries.items():
            z.writestr(name, data)


def main():
    count = 0
    for kind in ['word', 'word-conteudo']:
        for segment in ['ensino-medio', 'convenio', 'pre-vestibular']:
            for path in sorted((ROOT / 'assets' / kind / segment).rglob('*.docx')):
                update(path)
                count += 1
    print(f'{count} modelos Word atualizados: página automática, título editável e divisória.')


if __name__ == '__main__':
    main()
