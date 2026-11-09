"""Data opcional nos modelos Word: o professor digita na 1ª página e ela aparece nas outras.

Os dois campos (1ª página e cabeçalho das páginas seguintes) ficam ligados ao mesmo valor
guardado dentro do arquivo (customXml). O Word atualiza um quando o outro muda. Vazios,
deixam à mostra a linha "___/___/____" da arte, para o aluno escrever.
Usa só lxml: roda também na publicação (atualizar_modelos.py). Idempotente.
"""
from lxml import etree as E
from identificacao import W, V, NS, w, _pos

PR = 'http://schemas.openxmlformats.org/package/2006/relationships'
CT = 'http://schemas.openxmlformats.org/package/2006/content-types'
DS = 'http://schemas.openxmlformats.org/officeDocument/2006/customXml'
SEI = 'urn:sei-incentivo'
GUID = '{6F1C2B9E-5A3D-4C1F-9E2B-5E1000DA7A01}'
ITEM, PROPS = 'customXml/itemSEIdata.xml', 'customXml/itemPropsSEIdata.xml'
REL_CX = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml'
REL_PROPS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps'


def _xml(el):
    return E.tostring(el, xml_declaration=True, encoding='UTF-8', standalone=True)


def _guardar_valor(entries):
    if ITEM not in entries:
        entries[ITEM] = f'<?xml version="1.0" encoding="UTF-8" standalone="no"?><sei xmlns="{SEI}"><data></data></sei>'.encode()
    entries[PROPS] = (f'<?xml version="1.0" encoding="UTF-8" standalone="no"?><ds:datastoreItem ds:itemID="{GUID}" '
                      f'xmlns:ds="{DS}"><ds:schemaRefs/></ds:datastoreItem>').encode()
    entries['customXml/_rels/itemSEIdata.xml.rels'] = (
        f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="{PR}">'
        f'<Relationship Id="rId1" Type="{REL_PROPS}" Target="itemPropsSEIdata.xml"/></Relationships>').encode()
    rels_name = 'word/_rels/document.xml.rels'
    rels = E.fromstring(entries[rels_name])
    if not [r for r in rels if r.get('Target') == '../' + ITEM]:
        E.SubElement(rels, f'{{{PR}}}Relationship', Id='rIdSEIdata', Type=REL_CX, Target='../' + ITEM)
    entries[rels_name] = _xml(rels)
    ct = E.fromstring(entries['[Content_Types].xml'])
    if not ct.xpath(f'//*[local-name()="Override" and @PartName="/{PROPS}"]'):
        E.SubElement(ct, f'{{{CT}}}Override', PartName='/' + PROPS,
                     ContentType='application/vnd.openxmlformats-officedocument.customXmlProperties+xml')
    if not ct.xpath('//*[local-name()="Default" and @Extension="xml"]'):
        E.SubElement(ct, f'{{{CT}}}Default', Extension='xml', ContentType='application/xml')
    entries['[Content_Types].xml'] = _xml(ct)


def _rpr(cor, fundo):
    pr = w('rPr')
    pr.append(w('rFonts', ascii='Arial', hAnsi='Arial', cs='Arial', eastAsia='Arial'))
    pr.append(w('b'))
    pr.append(w('color', val=cor))
    pr.append(w('sz', val=18))
    pr.append(w('szCs', val=18))
    if fundo:
        pr.append(w('shd', val='clear', color='auto', fill=fundo))
    return pr


def _campo(ident, box, tag, cor, fundo):
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
    pp.append(w('jc', val='center'))
    pp.append(_rpr(cor, None))
    sdt = E.SubElement(p, f'{{{W}}}sdt')
    props = E.SubElement(sdt, f'{{{W}}}sdtPr')
    props.append(_rpr(cor, fundo))
    props.append(w('alias', val='Data (opcional): digite e ela aparece em todas as páginas'))
    props.append(w('tag', val=tag))
    props.append(w('dataBinding', prefixMappings=f"xmlns:ns0='{SEI}'", xpath='/ns0:sei[1]/ns0:data[1]', storeItemID=GUID))
    props.append(w('text'))
    body = E.SubElement(sdt, f'{{{W}}}sdtContent')
    r = E.SubElement(body, f'{{{W}}}r')
    r.append(_rpr(cor, fundo))
    t = E.SubElement(r, f'{{{W}}}t')
    t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    t.text = ''
    return run


def _colocar(raiz, ident, run, corpo):
    for shape in raiz.xpath(f'.//v:*[@id="{ident}"]', namespaces=NS):
        r = shape.getparent().getparent()
        r.getparent().remove(r)
    first = raiz.find(f'{{{W}}}body/{{{W}}}p') if corpo else raiz.find(f'{{{W}}}p')
    pos = 1 if first.find(f'{{{W}}}pPr') is not None else 0
    first.insert(pos, run)


def aplicar(entries, geo):
    """geo: entrada do molduras.json (precisa de d1, d2 e d2bg)."""
    if not geo.get('d1') or not geo.get('d2') or 'word/header2.xml' not in entries:
        return False
    _guardar_valor(entries)
    doc = E.fromstring(entries['word/document.xml'])
    _colocar(doc, 'SEIData1', _campo('SEIData1', geo['d1'], 'sei-data-1', '10121B', 'FFFFFF'), True)
    entries['word/document.xml'] = _xml(doc)
    hdr = E.fromstring(entries['word/header2.xml'])
    _colocar(hdr, 'SEIData2', _campo('SEIData2', geo['d2'], 'sei-data-2', 'FFFFFF', geo.get('d2bg', '#001234').lstrip('#').upper()), False)
    entries['word/header2.xml'] = _xml(hdr)
    return True
