"""Compara a saída real em PDF dos modos colorido e preto e branco."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from subprocess import check_output
import re
from urllib.parse import urlencode
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path('/workspace/inspect/impressao')
OUT.mkdir(parents=True, exist_ok=True)
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1200, 'height': 1000})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    for name, group, year, subject in [('convenio', 3, '3º ano', 'Espanhol'),
            ('pre', 4, 'Pré-vestibular', 'Espanhol'), ('fundamental', 0, '1º ano', 'Matemática')]:
        page.emulate_media(media='screen')
        page.goto('about:blank')
        page.goto(base + '/index.html#' + urlencode({'etapa': group, 'turma': year, 'disciplina': subject}))
        page.evaluate('window.print = () => {}')
        page.get_by_role('button', name='Imprimir em preto e branco', exact=True).click()
        page.wait_for_function('document.body.classList.contains("sei-print-bw")')
        page.emulate_media(media='print')
        h = page.locator('#print-area .bw-header')
        assert h.locator('h2').inner_text() == subject
        assert h.evaluate('(el) => getComputedStyle(el).backgroundColor') == 'rgb(255, 255, 255)'
        assert 'grayscale(1)' in page.locator('#print-area .original-page').evaluate('(el) => getComputedStyle(el).filter')
        page.pdf(path=str(OUT / f'{name}-pb.pdf'), format='A4', print_background=True)
        page.emulate_media(media='screen')
        page.get_by_role('button', name='Imprimir em cores / PDF', exact=True).click()
        assert not page.locator('body').evaluate('(el) => el.classList.contains("sei-print-bw")')
        page.wait_for_function('!document.querySelector("#print-area .bw-sheet")')
        page.emulate_media(media='print')
        page.pdf(path=str(OUT / f'{name}-cor.pdf'), format='A4', print_background=True)
        for variant in ['pb','cor']:
            info = check_output(['pdfinfo', str(OUT / f'{name}-{variant}.pdf')]).decode()
            assert re.search(r'Pages:\s+1\n', info), (name, variant, info)
        print(name + ': PDF preto e branco e colorido em uma página OK', flush=True)
    page.emulate_media(media='screen')
    page.goto(base + '/montar.html#f=assets/convenio/3-ano/espanhol.png')
    page.wait_for_selector('#pages .identificacao')
    page.locator('#pages .identificacao').fill('Aula 12')
    page.evaluate('window.print = () => {}')
    page.evaluate('''() => seiMontar.insertBlocks(seiMontar.htmlToBlocks(
        Array.from({length:100}, (_,i)=>`<p>Questão ${i+1}: texto nítido e editável em preto e branco.</p>`).join('')))
    ''')
    page.wait_for_function('document.querySelectorAll("#pages .page").length >= 2')
    page.get_by_role('button', name='Imprimir em preto e branco', exact=True).click()
    page.wait_for_timeout(100)
    page.emulate_media(media='print')
    page.evaluate('dispatchEvent(new Event("beforeprint"))')
    assert page.locator('#pages .bw-header').count() >= 2
    assert page.locator('#pages .bw-identificacao').first.inner_text() == 'Aula 12'
    assert page.locator('#pages .frame').first.evaluate('(el) => getComputedStyle(el).display') == 'none'
    assert page.locator('#pages .bw-editor-footer').nth(1).inner_text().endswith('Página 2')
    page.pdf(path=str(OUT / 'editor-pb.pdf'), format='A4', print_background=True)
    page.emulate_media(media='screen')
    page.get_by_role('button', name='🖨 Imprimir em cores / PDF', exact=True).click()
    page.wait_for_timeout(100)
    assert not page.locator('body').evaluate('(el) => el.classList.contains("sei-print-bw")')
    assert not errors, errors
    browser.close()
server.shutdown()
print('Editor: título, páginas, fundos brancos e retorno ao colorido OK')
