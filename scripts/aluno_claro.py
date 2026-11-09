"""Cabeçalho da 2ª página: Aluno(a) e Data numa faixa branca para escrever à caneta.

O fundo azul-escuro vira quase preto na impressão em preto e branco e a caneta some.
Funciona na arte do Montar folha (…-p2.jpg) e na imagem do cabeçalho dos modelos Word.
Uso: python scripts/aluno_claro.py arquivo.jpg [...]     (altera no lugar; ignora se já foi feito)
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FM = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
AZUL = (11, 42, 91)
LINHA = (60, 70, 90)


def achar_linha(a, u):
    """Linha branca do 'Aluno(a): ____' (y = 46 unidades): devolve (x0, x1) ou None."""
    branco = a.min(2) > 200
    y = int(round(46 * u))
    melhor = None
    for yy in range(y - int(3 * u), y + int(3 * u) + 1):
        r = branco[yy]
        d = np.diff(np.r_[0, r.astype(np.int8), 0])
        ini, fim = np.nonzero(d == 1)[0], np.nonzero(d == -1)[0]
        if not len(ini):
            continue
        k = np.argmax(fim - ini)
        if fim[k] - ini[k] > 90 * u and (melhor is None or fim[k] - ini[k] > melhor[1] - melhor[0]):
            melhor = (int(ini[k]), int(fim[k]))
    return melhor


def processar(caminho):
    im = Image.open(caminho).convert('RGB')
    a = np.array(im).astype(int)
    u = im.width / 1024
    # já tem a faixa? (linha 16 com um trecho branco comprido, onde antes era fundo escuro)
    r = (a[int(16 * u)].min(1) > 235).astype(np.int8)
    d0 = np.diff(np.r_[0, r, 0]); ini, fim = np.nonzero(d0 == 1)[0], np.nonzero(d0 == -1)[0]
    if len(ini) and (fim - ini).max() > 150 * u:
        return 'já tinha a faixa'
    ln = achar_linha(a, u)
    if not ln:
        return 'sem linha'
    ax = ln[0] - 100 * u
    x0, x1 = ax - 14 * u, ln[1] + 6 * u
    y0, y1 = 13 * u, 103 * u
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((x0, y0, x1, y1), radius=10 * u, fill='white')
    f = ImageFont.truetype(FM, int(round(20 * u)))
    d.text((ax, 24 * u), 'Aluno(a):', font=f, fill=AZUL)
    d.line([(ln[0], 46 * u), (ln[1] - 4 * u, 46 * u)], fill=LINHA, width=max(1, int(round(1.6 * u))))
    d.text((ax, 62 * u), 'Data:', font=f, fill=AZUL)
    # data com linhas finas, no lugar dos sublinhados
    dx = ax + 62 * u
    yb = 84 * u
    for w in (34, 34, 52):
        d.line([(dx, yb), (dx + w * u, yb)], fill=LINHA, width=max(1, int(round(1.6 * u))))
        dx += w * u
        if w != 52:
            d.text((dx + 2 * u, 62 * u), '/', font=f, fill=AZUL)
            dx += 14 * u
    q = {'quality': 95, 'subsampling': 0} if caminho.lower().endswith(('.jpg', '.jpeg')) else {}
    im.save(caminho, **q)
    return 'ok'


def processar_docx(caminho):
    """Aplica na imagem do cabeçalho das páginas 2+ (header2) de um modelo Word."""
    import os, re, tempfile, zipfile
    with zipfile.ZipFile(caminho) as z:
        itens = [(i, z.read(i.filename)) for i in z.infolist()]
    dados = dict((i.filename, b) for i, b in itens)
    rels = dados.get('word/_rels/header2.xml.rels', b'').decode('utf8')
    alvos = re.findall(r'Target="(media/[^"]+\.(?:jpe?g|png))"', rels)
    if not alvos:
        return 'sem imagem no cabeçalho 2'
    res = []
    for alvo in alvos:
        nome = 'word/' + alvo
        with tempfile.NamedTemporaryFile(suffix=os.path.splitext(alvo)[1], delete=False) as t:
            t.write(dados[nome])
        r = processar(t.name)
        res.append(r)
        if r == 'ok':
            dados[nome] = open(t.name, 'rb').read()
        os.unlink(t.name)
    if 'ok' in res:
        tmp = caminho + '.tmp'
        with zipfile.ZipFile(tmp, 'w') as z:
            for i, _ in itens:
                z.writestr(i, dados[i.filename], compress_type=i.compress_type)
        os.replace(tmp, caminho)
    return ', '.join(res)


if __name__ == '__main__':
    for c in sys.argv[1:]:
        print(c, processar_docx(c) if c.endswith('.docx') else processar(c))
