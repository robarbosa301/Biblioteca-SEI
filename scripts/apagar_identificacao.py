"""Uso único: tira a palavra e o número da caixa de identificação da arte da 1ª página
(modelos Word e molduras do Montar folha) e guarda a cor do número em molduras.json."""
import sys, io, json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree as E
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
from caixa_identificacao import apagar, cor_numero

ROOT = Path(__file__).resolve().parents[1]
geo = json.loads((ROOT / 'assets/montar/molduras.json').read_text())
por_f = {v['f']: v for v in geo.values()}
feitos = 0
for kind in ['word', 'word-conteudo']:
    for path in sorted((ROOT / 'assets' / kind).rglob('*.docx')):
        rel = path.relative_to(ROOT / 'assets' / kind).with_suffix('').as_posix()
        if path.stem == 'espanhol' or rel not in por_f:
            continue
        with ZipFile(path) as z:
            entries = {n: z.read(n) for n in z.namelist()}
        rels = E.fromstring(entries['word/_rels/header1.xml.rels'])
        alvo = [r.get('Target') for r in rels if r.get('Target', '').startswith('media/')][0]
        im = Image.open(io.BytesIO(entries['word/' + alvo])).convert('RGB')
        if 'idColor' not in por_f[rel]:
            por_f[rel]['idColor'] = cor_numero(im)
        out = io.BytesIO(); apagar(im).save(out, 'JPEG', quality=95, subsampling=0)
        entries['word/' + alvo] = out.getvalue()
        with ZipFile(path, 'w', ZIP_DEFLATED) as z:
            for n, d in entries.items():
                z.writestr(n, d)
        feitos += 1
for v in geo.values():
    if v['f'].endswith('espanhol'):
        continue
    p = ROOT / 'assets/montar' / (v['f'] + '-p1.jpg')
    im = Image.open(p).convert('RGB')
    v.setdefault('idColor', cor_numero(im))
    apagar(im).save(p, 'JPEG', quality=92)
(ROOT / 'assets/montar/molduras.json').write_text(json.dumps(geo, ensure_ascii=False, separators=(',', ':')))
print('modelos', feitos)
