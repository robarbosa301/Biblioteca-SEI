"""Cria documentos nativos a partir da matriz de Espanhol aprovada do SEI."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from copy import deepcopy
from lxml import etree as E
from atualizar_modelos import ROOT, W, NS, box, el

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
    label = f'{grade}ª série · ' + ('Convênio' if grade == 3 else 'Ensino Médio')
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
            p.append(box('SEIDynamicPage', 938, 1374, 58, 55, '01', 34, '063B8C', '#FFFFFF', field=True))
            if name.endswith('header1.xml'):
                p.append(label_box('SEISpanishGrade', 504, 106, 280, 39, label, 24, '111111', '#FFFFFF'))
            else:
                p.append(label_box('SEISpanishGrade', 140, 65, 205, 28, label, 18, 'FFFFFF', '#100300'))
            p.append(label_box('SEISpanishFooter', 20, 1377, 125, 46, footer, 13, 'FFFFFF', '#100300'))
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
