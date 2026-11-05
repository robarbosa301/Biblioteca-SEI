"""Renderiza as prévias das folhas e as molduras do editor a partir do Word."""
import subprocess
from pathlib import Path
from criar_espanhol import ROOT, create

for grade, segment in [(1, 'ensino-medio'), (2, 'ensino-medio'), (3, 'convenio')]:
    create(grade, segment)
    out = ROOT / f'.preview/{grade}'
    out.mkdir(parents=True, exist_ok=True)
    source = ROOT / f'assets/word/{segment}/{grade}-ano/espanhol.docx'
    command = ['soffice', '--headless', '-env:UserInstallation=file:///tmp/sei-render-espanhol', '--convert-to', 'pdf']
    subprocess.run(command + ['--outdir', str(out), str(source)], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(['pdftoppm', '-r', '130.048', '-f', '1', '-singlefile', '-x', '26', '-y', '36',
                    '-W', '1024', '-H', '1448', '-png', str(out / 'espanhol.pdf'),
                    str(ROOT / f'assets/{segment}/{grade}-ano/espanhol')], check=True)
    preview = ROOT / '.preview'
    subprocess.run(command + ['--outdir', str(preview), str(preview / f'espanhol-{grade}-molduras.docx')],
                   check=True, stdout=subprocess.DEVNULL)
    for page in [1, 2]:
        subprocess.run(['pdftoppm', '-f', str(page), '-singlefile', '-scale-to-x', '1024', '-scale-to-y', '-1',
                        '-jpeg', '-jpegopt', 'quality=95', str(preview / f'espanhol-{grade}-molduras.pdf'),
                        str(ROOT / f'assets/montar/{segment}/{grade}-ano/espanhol-p{page}')], check=True)
    print(f'{grade}ª série: prévia sem margens extras e molduras renderizadas.', flush=True)
