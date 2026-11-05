"""Confere controles, histórico, trechos formatados e persistência real."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(base + '/montar.html#f=assets/ensino-medio/1-ano/espanhol.png')
    page.wait_for_selector('#pages .page')
    page.evaluate("seiMontar.insertBlocks(seiMontar.htmlToBlocks('<p>Texto para formatar e testar.</p>'))")
    page.wait_for_selector('#pages .col [data-id]')
    bar = page.locator('#formatToolbar')
    bar.get_by_label('Fonte', exact=True).select_option('Times New Roman')
    bar.get_by_label('Tamanho', exact=True).select_option('16')
    bar.get_by_label('Entrelinhas', exact=True).select_option('1.5')
    bar.get_by_label('Após parágrafo', exact=True).select_option('12')
    bar.get_by_label('Alinhamento', exact=True).select_option('justify')
    bar.get_by_role('button', name='Negrito', exact=True).click()
    page.wait_for_function('seiMontar.blocks[0].html.includes("font-weight: bold")')
    html = page.evaluate('seiMontar.blocks[0].html')
    assert '16pt' in html and 'Times New Roman' in html and '1.5' in html and '12pt' in html and 'justify' in html, html
    bar.get_by_role('button', name='Desfazer', exact=True).click()
    assert 'font-weight: bold' not in page.evaluate('seiMontar.blocks[0].html')
    bar.get_by_role('button', name='Refazer', exact=True).click()
    assert 'font-weight: bold' in page.evaluate('seiMontar.blocks[0].html')
    bar.get_by_role('button', name='Lista numerada', exact=True).click()
    assert page.evaluate('seiMontar.blocks[0].html').startswith('<ol')
    bar.get_by_role('button', name='Desfazer', exact=True).click()
    page.locator('#sEdit').click()
    page.wait_for_selector('#dlg[open]')
    page.locator('#ed').evaluate('''ed => {
      const r=document.createRange();r.selectNodeContents(ed);const s=getSelection();s.removeAllRanges();s.addRange(r);
    }''')
    dialog_bar = page.locator('#dialogToolbar')
    dialog_bar.get_by_label('Tamanho', exact=True).select_option('18')
    dialog_bar.get_by_label('Entrelinhas', exact=True).select_option('2')
    page.locator('#dOk').click()
    page.wait_for_timeout(150)
    page.wait_for_timeout(150)
    page.wait_for_selector('#pages .col [data-id]')
    html = page.evaluate('seiMontar.blocks[0].html')
    assert '18pt' in html and 'line-height: 2' in html, html
    page.wait_for_timeout(400)
    page.reload()
    page.wait_for_selector('#pages .col [data-id]')
    html2 = page.evaluate('seiMontar.blocks[0].html')
    assert html == html2
    for width in [390,1024,1440]:
        page.set_viewport_size({'width':width,'height':1000})
        page.wait_for_timeout(300)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.locator('#pages .col [data-id]').first.click()
    page.screenshot(path='/workspace/inspect/formatacao-editor.png')
    assert not errors, errors
    browser.close()
server.shutdown()
print('Fonte, tamanho, entrelinhas, margens, listas, histórico, edição e persistência OK')
