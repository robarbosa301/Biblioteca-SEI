"""Verifica as três novas folhas, downloads e editor em um navegador real."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from urllib.parse import urlencode
from zipfile import ZipFile
from io import BytesIO
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    for grade, group, segment in [(1, 2, 'ensino-medio'), (2, 2, 'ensino-medio'), (3, 3, 'convenio')]:
        page.goto(base + '/index.html#' + urlencode({'etapa': group, 'turma': f'{grade}º ano'}))
        card = page.locator('.portal-card').filter(has_text='Espanhol')
        assert card.count() == 1
        card.locator('img').evaluate('(img) => img.decode()')
        assert card.locator('img').get_attribute('src') == 'assets/portal/covers/subject-espanhol.webp'
        card.click()
        image = page.locator('#content .original-page')
        image.evaluate('(img) => img.decode()')
        assert image.get_attribute('src').startswith(f'assets/{segment}/{grade}-ano/espanhol.png')
        for kind, label in [('word', 'Questões'), ('word-conteudo', 'Conteúdo')]:
            with page.expect_download() as download:
                page.get_by_role('button', name='↓ Word — ' + label, exact=True).click()
            path = download.value.path()
            with ZipFile(path) as z:
                header = z.read('word/header1.xml')
                assert 'série'.encode() in header
                assert b'SEIDynamicPage' in header and b'sei-identificacao' in header
        page.get_by_role('button', name='✎ Montar folha no site', exact=True).click()
        page.wait_for_selector('#pages .identificacao')
        page.locator('#pages .identificacao').fill('Aula 1')
        page.evaluate('''() => seiMontar.insertBlocks(seiMontar.htmlToBlocks(
            Array.from({length:120}, (_,i)=>`<p>Pregunta ${i+1}. Lee y responde en español.</p>`).join('')))
        ''')
        page.wait_for_function('document.querySelectorAll("#pages .page").length >= 2')
        assert page.locator('#pages .identificacao').input_value() == 'Aula 1'
        numbers = page.locator('#pages .auto-page-number').all_text_contents()
        assert numbers == [str(i+1).zfill(2) for i in range(len(numbers))]
        assert page.locator('#pages .column-divider').count() == len(numbers)
        for width in [390, 1024, 1440]:
            page.set_viewport_size({'width': width, 'height': 1000})
            page.wait_for_timeout(300)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path=f'/workspace/inspect/espanhol-editor-{grade}.png')
        print(f'{grade}ª série: navegação, imagem, dois Word, edição, páginas e telas OK', flush=True)
    assert not errors, errors
    browser.close()
server.shutdown()
