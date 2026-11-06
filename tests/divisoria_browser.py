"""Confere cores, folga das colunas e interrupção real da linha no navegador."""
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
cases = [('ensino-medio/1-ano/ingles.png','#D90E12'),
         ('fundamental-1/3-ano/matematica.png','#1075E8'),
         ('convenio/3-ano/lingua-portuguesa.png','#A20E10')]
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1200,'height':1400})
    for src, color in cases:
        import json
        color = json.loads((ROOT / 'assets/montar/molduras.json').read_text())['assets/'+src]['dividerColor']
        page.emulate_media(media='screen')
        page.goto('about:blank')
        page.goto(base+'/montar.html#f=assets/'+src)
        page.wait_for_selector('#pages .divider-mark')
        page.evaluate('''() => seiMontar.insertBlocks(seiMontar.htmlToBlocks(
          Array.from({length:100},(_,i)=>`<p>Questão ${i+1}: conferir divisão e leitura.</p>`).join('')))
        ''')
        page.wait_for_function('document.querySelectorAll("#pages .page").length>=2')
        for divider in page.locator('#pages .column-divider').all():
            assert divider.evaluate('(e)=>getComputedStyle(e).getPropertyValue("--divider-color").trim()') == color
            assert divider.locator('.divider-mark').inner_text() == 'Nº 1 EM APROVAÇÃO'
            assert divider.locator('.divider-cap').count() == 2
            assert divider.evaluate('''d=>{
              const mark=d.querySelector('.divider-mark'),m=mark.getBoundingClientRect(),r=d.getBoundingClientRect();
              const a=getComputedStyle(d,'::before'),b=getComputedStyle(d,'::after'),s=getComputedStyle(mark);
              const cols=d.parentElement.querySelectorAll('.col');
              return r.top+parseFloat(a.height)<=m.top+.5 && r.bottom-parseFloat(b.height)>=m.bottom-.5 &&
                a.backgroundColor===s.backgroundColor && s.color==='rgb(255, 255, 255)' &&
                m.left>=cols[0].getBoundingClientRect().right-.5 && m.right<=cols[1].getBoundingClientRect().left+.5;
            }''')
        page.screenshot(path='/workspace/inspect/divisoria-'+Path(src).stem+'.png')
        page.evaluate('window.print=()=>{}')
        page.locator('#bPrintBW').click()
        page.wait_for_timeout(100)
        page.emulate_media(media='print')
        assert page.locator('#pages .divider-mark').first.evaluate('(e)=>getComputedStyle(e).color') == 'rgb(17, 17, 17)'
        assert page.locator('#pages .column-divider').first.evaluate('(e)=>getComputedStyle(e,"::before").backgroundColor') == 'rgb(119, 119, 119)'
        print(src+': cor, cantos, extremidades, linha interrompida, espaço e impressão OK',flush=True)
    browser.close()
server.shutdown()
