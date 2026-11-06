"""Cria documentos nativos a partir da matriz de Espanhol aprovada do SEI."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from copy import deepcopy
from lxml import etree as E
from atualizar_modelos import ROOT, W, NS, box, el


def standard_footer(header, entries, name, grade, segment):
    """Reutiliza a faixa original de Português, incluindo contatos e selo."""
    drawing_ns = {'w': W, 'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
                  'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
                  'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture'}
    backdrop = label_box('SEISpanishFooterBackdrop', 0, 1374, 1024, 14, '', 2, '2C0606', '#2C0606')
    rect = backdrop.find('.//{urn:schemas-microsoft-com:vml}rect')
    rect.set('style', rect.get('style'))
    header.find('w:p', NS).append(backdrop)
    drawing = deepcopy(header.find('.//w:drawing', drawing_ns))
    anchor = drawing.find('wp:anchor', drawing_ns)
    anchor.set('relativeHeight', '1000')
    anchor.set('behindDoc', '0')
    anchor.find('wp:positionV/wp:posOffset', drawing_ns).text = str(round(254571 + 1388 * 7200000 / 1024))
    cy = str(round(60 * 7200000 / 1024))
    anchor.find('wp:extent', drawing_ns).set('cy', cy)
    anchor.find('.//a:xfrm/a:ext', drawing_ns).set('cy', cy)
    anchor.find('wp:docPr', drawing_ns).set('id', str(500 + grade))
    blip = anchor.find('.//a:blip', drawing_ns)
    blip.set('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed', 'rIdSEIFooter')
    fill = blip.getparent()
    for crop in fill.findall('a:srcRect', drawing_ns):
        fill.remove(crop)
    crop = E.Element('{'+drawing_ns['a']+'}srcRect', t='96094', b='0', l='0', r='0')
    fill.insert(1, crop)
    run = el('r'); run.append(drawing)
    header.find('w:p', NS).append(run)
    relpath = 'word/_rels/' + name.split('/')[-1] + '.rels'
    rels = E.fromstring(entries[relpath])
    E.SubElement(rels, '{http://schemas.openxmlformats.org/package/2006/relationships}Relationship',
                 Id='rIdSEIFooter', Type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
                 Target='media/sei-footer.png')
    entries[relpath] = E.tostring(rels, xml_declaration=True, encoding='UTF-8', standalone=True)
    entries['word/media/sei-footer.png'] = (ROOT / f'assets/{segment}/{grade}-ano/lingua-portuguesa.png').read_bytes()
    x = 280 if grade == 3 else 248
    h = label_box('SEISpanishFooterSubject', x, 1392, 423-x, 32, 'Espanhol', 22, 'DE6862', '#100300')
    header.find('w:p', NS).append(h)

LESSONS = {
    1: [
        ('Saludos', 'Escribe dos saludos y una despedida que puedas usar en clase.'),
        ('Presentación', 'Completa: Me llamo ____. Tengo ____ años. Soy de ____.'),
        ('Pronombres', 'Sustituye por un pronombre: María y yo / Pedro / Ana y Lucía.'),
        ('Ser y estar', 'Completa: Yo ____ estudiante. Hoy ____ en la biblioteca.'),
        ('Artículos', 'Completa con el, la, los o las: ____ libro; ____ mesas; ____ alumnos.'),
        ('Presente', 'Conjuga estudiar: yo ____, tú ____, nosotros ____.'),
        ('La escuela', 'Escribe en español: caderno, professor e janela.'),
        ('Gustos', 'Completa: Me ____ la música. Me ____ los libros. Explica la diferencia.'),
        ('Lectura', '«Ana estudia por la mañana y juega por la tarde». ¿Cuándo estudia Ana?'),
        ('Producción escrita', 'Escribe tres frases para presentarte y contar qué te gusta hacer.')],
    2: [
        ('Pretérito perfecto simple', 'Completa: Ayer yo ____ (visitar) a mi abuela y ____ (comer) con ella.'),
        ('Imperfecto', 'Completa: Cuando era niño, yo ____ (jugar) en el parque todos los días.'),
        ('Contraste de pasados', 'Explica la diferencia: «Ayer estudié» / «Antes estudiaba por la noche».'),
        ('Planes', 'Escribe dos planes para mañana con la estructura ir a + infinitivo.'),
        ('Comparativos', 'Completa: Este libro es ____ interesante ____ aquel. Usa una comparación de superioridad.'),
        ('Pronombres de objeto', 'Reescribe sin repetir «el libro»: Compro el libro y leo el libro.'),
        ('Consejos', 'Escribe dos consejos para estudiar mejor usando deber + infinitivo.'),
        ('Conectores', 'Une con porque o pero: Quiero salir. Tengo que estudiar.'),
        ('Lectura', '«Antes viajábamos en autobús; el año pasado compramos una bicicleta». Identifica los dos tiempos verbales.'),
        ('Producción escrita', 'Cuenta en cuatro frases un día especial de tu vida. Usa verbos en pasado.')],
    3: [
        ('Comprensión global', '«Compartir noticias sin comprobarlas puede difundir rumores». ¿Cuál es la advertencia del texto?'),
        ('Intención comunicativa', '«Cuida el agua: cada gota cuenta». ¿Busca informar, convencer o narrar? Justifica.'),
        ('Inferencia', '«La biblioteca estaba cerrada, así que estudiamos en casa». ¿Por qué cambiaron de lugar?'),
        ('Conectores', 'En «Aunque llueva, iremos», ¿qué relación expresa aunque?'),
        ('Falsos amigos', 'Traduce al portugués: «Estoy embarazada» y «Me da vergüenza hablar».'),
        ('Referencia', '«Lucía compró una novela y la leyó». ¿A qué se refiere la?'),
        ('Subjuntivo', 'Completa: Es importante que nosotros ____ (cuidar) el medioambiente.'),
        ('Condicional', 'Completa: Si tuviera más tiempo, ____ (leer) todos los días.'),
        ('Diversidad lingüística', '¿Qué significa que una lengua tenga variedades regionales? Da un ejemplo del español.'),
        ('Argumentación', 'Escribe cuatro frases defendiendo el uso responsable de las redes sociales.')]
}


def label_box(name, x, y, width, height, text, size, color, fill):
    run = box(name, x, y, width, height, text, size, color, fill)
    sdt = run.find('.//w:sdt', NS)
    parent = sdt.getparent()
    for child in list(sdt.find('w:sdtContent', NS)):
        parent.append(child)
    parent.remove(sdt)
    return run


def create(grade, segment):
    folder = f'{segment}/{grade}-ano'
    label = 'Convênio — 3ª série' if grade == 3 else f'{grade}ª série · Ensino Médio'
    footer = f'{grade}ª série · ' + ('Convênio' if grade == 3 else 'Médio')
    for kind in ['word', 'word-conteudo']:
        source = ROOT / f'assets/{kind}/pre-vestibular/espanhol.docx'
        with ZipFile(source) as z:
            entries = {n: z.read(n) for n in z.namelist()}
        for name in ['word/header1.xml', 'word/header2.xml']:
            header = E.fromstring(entries[name])
            p = header.find('w:p', NS)
            page_box = header.xpath('.//v:rect[@id="SEIDynamicPage"]', namespaces={**NS, 'v':'urn:schemas-microsoft-com:vml'})[0]
            old_run = page_box.getparent().getparent()
            old_run.getparent().remove(old_run)
            if name.endswith('header1.xml'):
                p.append(label_box('SEISpanishGrade', 504, 106, 280, 39, label, 24, '111111', '#FFFFFF'))
            else:
                p.append(label_box('SEISpanishGrade', 140, 65, 205, 28, label, 18, 'FFFFFF', '#100300'))
            standard_footer(header, entries, name, grade, segment)
            p.append(box('SEIDynamicPage', 949, 1397, 37, 32, '01', 34, '9B1015', '#FFFFFF', field=True))
            entries[name] = E.tostring(header, xml_declaration=True, encoding='UTF-8', standalone=True)
        doc = E.fromstring(entries['word/document.xml'])
        if kind == 'word':
            titles = doc.xpath('//w:t[text()="Título da questão"]', namespaces=NS)
            prompts = doc.xpath('//w:t[starts-with(text(), "Clique aqui e cole a questão")]', namespaces=NS)
            assert len(titles) == len(prompts) == 10
            for (title, prompt), (a, b) in zip(zip(titles, prompts), LESSONS[grade]):
                title.text = a
                prompt.text = b
            for color in doc.xpath('//w:color[@w:val="8A8A8A"]', namespaces=NS):
                color.set(f'{{{W}}}val', '111111')
            # As caixas de resposta substituem a imagem opcional do modelo em branco.
            for drawing in doc.findall('.//w:drawing', NS):
                p = drawing.getparent().getparent()
                if p.tag != f'{{{W}}}p':
                    continue
                p.clear()
                pp = E.SubElement(p, f'{{{W}}}pPr')
                pp.append(el('spacing', before=120, after=180, line=500, lineRule='exact'))
                borders = E.SubElement(pp, f'{{{W}}}pBdr')
                borders.append(el('bottom', val='single', sz=4, color='D4A36D'))
                E.SubElement(E.SubElement(p, f'{{{W}}}r'), f'{{{W}}}t').text = ' '
        entries['word/document.xml'] = E.tostring(doc, xml_declaration=True, encoding='UTF-8', standalone=True)
        path = ROOT / f'assets/{kind}/{folder}/espanhol.docx'
        path.parent.mkdir(parents=True, exist_ok=True)
        write(path, entries)
        if kind == 'word-conteudo':
            for name in ['word/header1.xml', 'word/header2.xml']:
                header = E.fromstring(entries[name])
                for text in header.findall('.//w:t', NS):
                    if text.text and text.text.startswith('Digite '):
                        text.text = ''
                entries[name] = E.tostring(header, xml_declaration=True, encoding='UTF-8', standalone=True)
            # Duas páginas vazias para renderizar as molduras do editor no navegador.
            body = doc.find('w:body', NS)
            sect = deepcopy(body.find('w:sectPr', NS))
            body.clear()
            body.append(el('p'))
            p = E.SubElement(body, f'{{{W}}}p')
            br = E.SubElement(E.SubElement(p, f'{{{W}}}r'), f'{{{W}}}br')
            br.set(f'{{{W}}}type', 'page')
            body.append(el('p'))
            body.append(sect)
            entries['word/document.xml'] = E.tostring(doc, xml_declaration=True, encoding='UTF-8', standalone=True)
            write(ROOT / f'.preview/espanhol-{grade}-molduras.docx', entries)


def write(path, entries):
    path.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(path, 'w', ZIP_DEFLATED) as z:
        for name, value in entries.items():
            z.writestr(name, value)


if __name__ == '__main__':
    for grade, segment in [(1, 'ensino-medio'), (2, 'ensino-medio'), (3, 'convenio')]:
        create(grade, segment)
    print('Seis modelos de Espanhol criados e três molduras preparadas.')
