"""Teste real de paginação, persistência e larguras dos aparelhos (Playwright)."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
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
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    for src in ['pre-vestibular/fisica', 'ensino-medio/1-ano/matematica',
                'ensino-medio/2-ano/biologia', 'convenio/3-ano/arte']:
        page.goto('about:blank')
        page.goto(base + '/montar.html#f=assets/' + src + '.jpeg')
        # Algumas folhas publicadas usam .png em vez de .jpeg.
        if page.locator('#pages .page').count() == 0:
            page.wait_for_function('window.seiMontar !== undefined')
            if page.locator('#pages .page').count() == 0:
                import json
                molduras = json.loads((ROOT / 'assets/montar/molduras.json').read_text())
                key = next(k for k, v in molduras.items() if v['f'] == src)
                page.goto('about:blank')
                page.goto(base + '/montar.html#f=' + key)
        page.wait_for_selector('#pages .identificacao')
        page.locator('#pages .identificacao').fill('Aula 1')
        page.evaluate('''() => seiMontar.insertBlocks(seiMontar.htmlToBlocks(
            Array.from({length:180}, (_,i)=>`<p>Item ${i+1}: Uma questão para verificar a sequência de leitura e a paginação automática.</p>`).join('')))
        ''')
        page.wait_for_function('document.querySelectorAll("#pages .page").length >= 3')
        numbers = page.locator('#pages .auto-page-number').all_text_contents()
        assert numbers == [str(i+1).zfill(2) for i in range(len(numbers))], numbers
        assert page.locator('#pages .column-divider').count() == len(numbers)
        text = page.locator('#pages .col').all_text_contents()
        import re
        sequence = [int(n) for n in re.findall(r'Item (\d+):', ''.join(text))]
        assert sequence == list(range(1, 181)), sequence
        page.wait_for_timeout(500)
        page.reload()
        page.wait_for_selector('#pages .identificacao')
        assert page.locator('#pages .identificacao').input_value() == 'Aula 1'
        page.wait_for_function('document.querySelectorAll("#pages .page").length >= 3')
        assert page.locator('#pages .auto-page-number').all_text_contents() == numbers
        for width in [1440, 1024, 390]:
            page.set_viewport_size({'width': width, 'height': 900})
            page.wait_for_timeout(350)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (src, width)
        page.set_viewport_size({'width': 1440, 'height': 900})
        page.wait_for_timeout(350)
        page.screenshot(path='/workspace/inspect/editor.png')
        print(src, len(numbers), 'páginas: sequência, título, persistência e telas OK')
    page.goto(base + '/index.html')
    page.wait_for_selector('.portal-home')
    for width in [1440, 1024, 390]:
        page.set_viewport_size({'width': width, 'height': 900})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
    page.set_viewport_size({'width': 1440, 'height': 900})
    page.screenshot(path='/workspace/inspect/desktop.png', full_page=True)
    page.get_by_role('button', name='Ensino Médio — 1ª e 2ª série', exact=True).click()
    page.wait_for_selector('.portal-card')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert not errors, errors
    browser.close()
server.shutdown()
print('Editor e navegação sem erros JavaScript.')
