"""Campo editável de identificação (ex.: REVISÃO | 01, AULA | 03) nos modelos Word.

Os campos ficam no corpo da 1ª página (não no cabeçalho), para o professor clicar e
escrever direto. As fontes parecidas com a da arte vão embutidas no arquivo, então a
aparência é a mesma em qualquer computador. Usa só lxml: roda também na publicação.
"""
from pathlib import Path
import uuid
from lxml import etree as E

ROOT = Path(__file__).resolve().parents[1]
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
V = 'urn:schemas-microsoft-com:vml'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
PR = 'http://schemas.openxmlformats.org/package/2006/relationships'
CT = 'http://schemas.openxmlformats.org/package/2006/content-types'
NS = {'w': W, 'v': V}

# Mesmo layout de scripts/caixa_identificacao.py (moldura de 1024 px).
PALAVRA = (834, 264, 928, 302)
SEPARADOR = (931.5, 264, 1.8, 39)
NUMERO = (937, 257, 991, 309)
FONTES = [  # (nome no Word, arquivo, negrito?)
    ('Barlow Condensed SemiBold', 'BarlowCondensed-SemiBold.ttf', False),
    ('Poppins', 'Poppins-Bold.ttf', True),
    ('Inter SemiBold', 'Inter-SemiBold.ttf', False),  # data das páginas 2+
]
PALAVRA_PT, NUMERO_PT = 12.5, 22


def w(tag, **attrs):
    node = E.Element(f'{{{W}}}{tag}')
    for k, v in attrs.items():
        node.set(f'{{{W}}}{k}', str(v))
    return node


def _pos(x, y, width, height):
    scale = 200 / 1024 * 72 / 25.4
    left = 5 * 72 / 25.4 + x * scale
    top = ((297 - 297 * 200 / 210) / 2) * 72 / 25.4 + y * scale
    return (f'position:absolute;margin-left:{left:.3f}pt;margin-top:{top:.3f}pt;'
            f'width:{width * scale:.3f}pt;height:{height * scale:.3f}pt;'
            'mso-position-horizontal-relative:page;mso-position-vertical-relative:page;'
            'z-index:251662000'), height * scale


def _rpr(font, size, color, bold=False, caps=False):
    pr = w('rPr')
    pr.append(w('rFonts', ascii=font, hAnsi=font, cs=font, eastAsia=font))
    if bold:
        pr.append(w('b'))
    if caps:
        pr.append(w('caps'))
    pr.append(w('color', val=color))
    pr.append(w('sz', val=int(size * 2)))
    pr.append(w('szCs', val=int(size * 2)))
    return pr


def _campo(ident, box, texto, alias, tag, font, size, color, bold, caps, jc):
    x0, y0, x1, y1 = box
    style, h = _pos(x0, y0, x1 - x0, y1 - y0)
    run = w('r')
    pict = E.SubElement(run, f'{{{W}}}pict')
    shape = E.SubElement(pict, f'{{{V}}}rect', id=ident, filled='f', stroked='f')
    shape.set('style', style)
    tb = E.SubElement(shape, f'{{{V}}}textbox', inset='0,0,0,0')
    tb.set('style', 'mso-fit-shape-to-text:f')
    content = E.SubElement(tb, f'{{{W}}}txbxContent')
    p = E.SubElement(content, f'{{{W}}}p')
    pp = E.SubElement(p, f'{{{W}}}pPr')
    pp.append(w('spacing', before=0, after=0, line=round(h * 20), lineRule='exact'))
    pp.append(w('jc', val=jc))
    pp.append(_rpr(font, size, color, bold, caps))
    sdt = E.SubElement(p, f'{{{W}}}sdt')
    props = E.SubElement(sdt, f'{{{W}}}sdtPr')
    props.append(_rpr(font, size, color, bold, caps))
    props.append(w('alias', val=alias))
    props.append(w('tag', val=tag))
    props.append(w('text'))
    body = E.SubElement(sdt, f'{{{W}}}sdtContent')
    r = E.SubElement(body, f'{{{W}}}r')
    r.append(_rpr(font, size, color, bold, caps))
    E.SubElement(r, f'{{{W}}}t').text = texto
    return run


def _separador(color):
    x, y, width, height = SEPARADOR
    style, _ = _pos(x, y, width, height)
    run = w('r')
    pict = E.SubElement(run, f'{{{W}}}pict')
    shape = E.SubElement(pict, f'{{{V}}}rect', id='SEIIdentSep', fillcolor='#' + color, stroked='f')
    shape.set('style', style)
    return run


def aplicar_documento(doc, cor, palavra='Revisão', numero='01'):
    """Coloca (ou recoloca) os campos no 1º parágrafo do corpo."""
    for shape in doc.xpath('.//v:*[starts-with(@id,"SEIIdent")]', namespaces=NS):
        run = shape.getparent().getparent()
        run.getparent().remove(run)
    first = doc.find(f'{{{W}}}body/{{{W}}}p')
    if first is None:
        first = E.Element(f'{{{W}}}p')
        doc.find(f'{{{W}}}body').insert(0, first)
    pos = 1 if first.find(f'{{{W}}}pPr') is not None else 0
    runs = [
        _separador(cor),
        _campo('SEIIdentPalavra', PALAVRA, palavra, 'Tipo da folha: Aula, Revisão, Atividade…',
               'sei-tipo', FONTES[0][0], PALAVRA_PT, 'FFFFFF', False, True, 'center'),
        _campo('SEIIdentNumero', NUMERO, numero, 'Número da folha', 'sei-numero',
               FONTES[1][0], NUMERO_PT, cor, True, False, 'center'),
    ]
    for r in reversed(runs):
        first.insert(pos, r)


def _ofuscar(data, guid):
    key = guid.replace('-', '').replace('{', '').replace('}', '')
    kb = [int(key[i:i + 2], 16) for i in range(0, 32, 2)][::-1]
    data = bytearray(data)
    for i in range(32):
        data[i] ^= kb[i % 16]
    return bytes(data)


def embutir_fontes(entries):
    """Embute as fontes no .docx (idempotente)."""
    ft_name = 'word/fontTable.xml'
    ft = E.fromstring(entries[ft_name])
    rel_name = 'word/_rels/fontTable.xml.rels'
    # Relationships sempre com namespace padrão (com prefixo o LibreOffice ignora as fontes)
    rels = E.Element(f'{{{PR}}}Relationships', nsmap={None: PR})
    if rel_name in entries:
        for r in E.fromstring(entries[rel_name]):
            rels.append(E.Element(f'{{{PR}}}Relationship', dict(r.attrib)))
    ct = E.fromstring(entries['[Content_Types].xml'])
    if not ct.xpath('//*[local-name()="Default" and @Extension="odttf"]'):
        E.SubElement(ct, f'{{{CT}}}Default', Extension='odttf',
                     ContentType='application/vnd.openxmlformats-officedocument.obfuscatedFont')
    for i, (nome, arquivo, bold) in enumerate(FONTES):
        for f in ft.findall(f'{{{W}}}font'):
            if f.get(f'{{{W}}}name') == nome:
                ft.remove(f)
        rid = f'rIdSEIFonte{i + 1}'
        for r in rels.findall(f'{{{PR}}}Relationship'):
            if r.get('Id') == rid:
                rels.remove(r)
        guid = '{' + str(uuid.uuid5(uuid.NAMESPACE_URL, 'sei-' + nome)).upper() + '}'
        target = 'fonts/' + arquivo.replace('.ttf', '.odttf')
        entries['word/' + target] = _ofuscar((ROOT / 'assets/fonts' / arquivo).read_bytes(), guid)
        E.SubElement(rels, f'{{{PR}}}Relationship', Id=rid, Target=target,
                     Type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/font')
        font = E.SubElement(ft, f'{{{W}}}font')
        font.set(f'{{{W}}}name', nome)
        font.append(w('charset', val='00'))
        font.append(w('family', val='swiss'))
        font.append(w('pitch', val='variable'))
        emb = E.SubElement(font, f'{{{W}}}' + ('embedBold' if bold else 'embedRegular'))
        emb.set(f'{{{R}}}id', rid)
        emb.set(f'{{{W}}}fontKey', guid)
    entries[ft_name] = E.tostring(ft, xml_declaration=True, encoding='UTF-8', standalone=True)
    entries[rel_name] = E.tostring(rels, xml_declaration=True, encoding='UTF-8', standalone=True)
    entries['[Content_Types].xml'] = E.tostring(ct, xml_declaration=True, encoding='UTF-8', standalone=True)
    st = E.fromstring(entries['word/settings.xml'])
    if st.find(f'{{{W}}}embedTrueTypeFonts') is None:
        antes = ['writeProtection', 'view', 'zoom', 'removePersonalInformation', 'removeDateAndTime',
                 'doNotDisplayPageBoundaries', 'displayBackgroundShape', 'printPostScriptOverText',
                 'printFractionalCharacterWidth', 'printFormsData']
        idx = 0
        for k, ch in enumerate(st):
            if E.QName(ch).localname in antes:
                idx = k + 1
        st.insert(idx, w('embedTrueTypeFonts'))
    entries['word/settings.xml'] = E.tostring(st, xml_declaration=True, encoding='UTF-8', standalone=True)
