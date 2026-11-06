"""Atualiza os modelos publicados sem rasterizar o texto editável do Word.

Executado antes de publicar no Pages. As artes originais são preservadas.
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree as E
import json

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
    # O estilo de fim do parágrafo também formata o resultado dos campos PAGE.
    defaults = E.SubElement(pp, f'{{{W}}}rPr')
    defaults.append(el('rFonts', ascii='Arial', hAnsi='Arial', cs='Arial', eastAsia='Arial'))
    defaults.append(el('b'))
    defaults.append(el('color', val=color))
    defaults.append(el('sz', val=size))
    defaults.append(el('szCs', val=size))
    if field:
        for kind in ['begin', 'instruction', 'separate']:
            part = E.SubElement(p, f'{{{W}}}r')
            pr = E.SubElement(part, f'{{{W}}}rPr')
            pr.append(el('rFonts', ascii='Arial', hAnsi='Arial', cs='Arial'))
            pr.append(el('b'))
            pr.append(el('color', val=color))
            pr.append(el('sz', val=size))
            if kind == 'instruction':
                instruction = E.SubElement(part, f'{{{W}}}instrText')
                instruction.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
                instruction.text = ' PAGE \\# "00" \\* CHARFORMAT '
            else:
                part.append(el('fldChar', fldCharType=kind))
        parent = p
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
    if field:
        E.SubElement(p, f'{{{W}}}r').append(el('fldChar', fldCharType='end'))
    return run


def update(path):
    with ZipFile(path) as z:
        entries = {i.filename: z.read(i.filename) for i in z.infolist()}
    doc = E.fromstring(entries['word/document.xml'])
    for cols in doc.findall('.//w:sectPr/w:cols', NS):
        section = cols.getparent()
        numbering = section.find('w:pgNumType', NS)
        if numbering is None:
            numbering = el('pgNumType')
            section.insert(list(section).index(cols), numbering)
        numbering.set(f'{{{W}}}fmt', 'decimalZero')
        cols.set(f'{{{W}}}num', '2')
        cols.set(f'{{{W}}}sep', '1')
    entries['word/document.xml'] = E.tostring(doc, xml_declaration=True, encoding='UTF-8', standalone=True)
    # Both first-page and continuation headers carry the full-page background.
    for name in ['word/header1.xml', 'word/header2.xml']:
        header = E.fromstring(entries[name])
        for shape in header.xpath('.//v:rect[starts-with(@id, "SEIDynamic")]', namespaces=NS):
            run = shape.getparent().getparent()
            run.getparent().remove(run)
        p = header.find('w:p', NS)
        page_box = (949, 1397, 37, 32) if path.stem == 'espanhol' and 'pre-vestibular' not in path.parts else (943, 1391, 50, 35)
        page_color = '9B1015' if path.stem == 'espanhol' and 'pre-vestibular' not in path.parts else '063B8C'
        p.append(box('SEIDynamicPage', *page_box, '01', 34, page_color, '#FFFFFF', field=True))
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
    markers = 0
    geometry = json.loads((ROOT / 'assets/montar/molduras.json').read_text())
    for kind in ['word', 'word-conteudo']:
        for path in sorted((ROOT / 'assets' / kind).rglob('*.docx')):
            relative = path.relative_to(ROOT / 'assets' / kind).with_suffix('').as_posix()
            geo = next((v for v in geometry.values() if v['f'] == relative), None)
            if not geo:
                continue
            with ZipFile(path) as z:
                entries = {n: z.read(n) for n in z.namelist()}
            for name in ['word/header1.xml', 'word/header2.xml']:
                if name not in entries:
                    continue
                header = E.fromstring(entries[name])
                for old in header.xpath('.//v:rect[@id="SEICenterTag"]', namespaces=NS):
                    run = old.getparent().getparent()
                    run.getparent().remove(run)
                top = geo['cut'] + .25 * 1024 / 21 if name.endswith('header1.xml') else 112 + .45 * 1024 / 21
                bottom = 1448 - geo['bh'] - .35 * 1024 / 21
                marker = box('SEICenterTag', 503, (top + bottom) / 2 - 70, 18, 140,
                             'Nº 1 EM APROVAÇÃO', 14, '063B8C', '#FFFFFF')
                # Identificação decorativa fixa, sem criar outro campo de revisão.
                sdt = marker.find('.//w:sdt', NS)
                parent = sdt.getparent()
                for child in list(sdt.find('w:sdtContent', NS)):
                    parent.append(child)
                parent.remove(sdt)
                shape = marker.find('.//v:rect', NS)
                content = marker.find('.//w:txbxContent', NS)
                paragraph = content.find('w:p', NS)
                content.remove(paragraph)
                paragraph.find('w:pPr/w:spacing', NS).set(f'{{{W}}}line', '180')
                table = E.SubElement(content, f'{{{W}}}tbl')
                table_pr = E.SubElement(table, f'{{{W}}}tblPr')
                table_pr.append(el('tblW', w=199, type='dxa'))
                table_pr.append(el('tblLayout', type='fixed'))
                margins = E.SubElement(table_pr, f'{{{W}}}tblCellMar')
                for side in ['top','left','bottom','right']:
                    margins.append(el(side, w=0, type='dxa'))
                E.SubElement(table, f'{{{W}}}tblGrid').append(el('gridCol', w=199))
                row = E.SubElement(table, f'{{{W}}}tr')
                E.SubElement(row, f'{{{W}}}trPr').append(el('trHeight', val=1550, hRule='exact'))
                cell = E.SubElement(row, f'{{{W}}}tc')
                cell_pr = E.SubElement(cell, f'{{{W}}}tcPr')
                cell_pr.append(el('tcW', w=199, type='dxa'))
                cell_pr.append(el('textDirection', val='btLr'))
                cell_pr.append(el('vAlign', val='center'))
                cell.append(paragraph)
                tail = el('p')
                E.SubElement(tail, f'{{{W}}}pPr').append(el('spacing', before=0, after=0, line=1, lineRule='exact'))
                content.append(tail)
                shape.set('stroked', 't')
                shape.set('strokecolor', '#0B2A5B')
                shape.set('strokeweight', '0.5pt')
                header.find('w:p', NS).append(marker)
                entries[name] = E.tostring(header, xml_declaration=True, encoding='UTF-8', standalone=True)
            with ZipFile(path, 'w', ZIP_DEFLATED) as z:
                for name, data in entries.items():
                    z.writestr(name, data)
            markers += 1
    print(f'Divisória “Nº 1 EM APROVAÇÃO” aplicada em {markers} modelos.')


if __name__ == '__main__':
    main()
