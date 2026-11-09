"""Versão para impressão em preto e branco: a MESMA arte colorida, em cinza.

Nada é redesenhado: cada ponto vira cinza (pela claridade que o olho percebe) e os tons
escuros são clareados por igual, para gastar menos tinta. O branco continua branco.
Na 2ª folha, a área de Aluno(a) e Data ganha um quadro claro, para a caneta aparecer.
Uso: python scripts/clarear_pb.py entrada.jpg saida.jpg [1|2]
"""
import sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# 1.0 = cinza normal; quanto menor, mais claro (o preto vira 1 - FORCA de cinza)
FORCA = .75
FM = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
TEXTO = (45, 45, 45)
LINHA = (70, 70, 70)
QUADRO = (250, 250, 250)


def achar_linha(a, u):
    """Linha branca do 'Aluno(a): ____' na arte colorida da 2ª folha: (x0, x1) ou None."""
    branco = a.min(2) > 200
    y = int(round(46 * u))
    melhor = None
    for yy in range(y - int(3 * u), y + int(3 * u) + 1):
        d = np.diff(np.r_[0, branco[yy].astype(np.int8), 0])
        ini, fim = np.nonzero(d == 1)[0], np.nonzero(d == -1)[0]
        if not len(ini):
            continue
        k = np.argmax(fim - ini)
        if fim[k] - ini[k] > 90 * u and (melhor is None or fim[k] - ini[k] > melhor[1] - melhor[0]):
            melhor = (int(ini[k]), int(fim[k]))
    return melhor


def quadro_aluno(im, cor):
    """Quadro claro atrás de Aluno(a) e Data (2ª folha). Devolve a caixa da data em unidades de 1024."""
    u = im.width / 1024
    ln = achar_linha(np.array(cor).astype(int), u)
    if not ln:
        return None
    ax = ln[0] - 100 * u
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((ax - 14 * u, 13 * u, ln[1] + 6 * u, 103 * u), radius=10 * u, fill=QUADRO)
    f = ImageFont.truetype(FM, int(round(20 * u)))
    d.text((ax, 24 * u), 'Aluno(a):', font=f, fill=TEXTO)
    esp = max(1, int(round(1.6 * u)))
    d.line([(ln[0], 46 * u), (ln[1] - 4 * u, 46 * u)], fill=LINHA, width=esp)
    d.text((ax, 62 * u), 'Data:', font=f, fill=TEXTO)
    dx, yb = ax + 62 * u, 84 * u
    for w in (34, 34, 52):
        d.line([(dx, yb), (dx + w * u, yb)], fill=LINHA, width=esp)
        dx += w * u
        if w != 52:
            d.text((dx + 2 * u, 62 * u), '/', font=f, fill=TEXTO)
            dx += 14 * u
    return [round((ax + 60 * u) / u), 60, round(dx / u) + 2, 88]


def clarear(src, dst, pagina=1):
    cor = Image.open(src).convert('RGB')
    a = np.array(cor).astype(np.float32) / 255
    l = cv2.cvtColor(a, cv2.COLOR_RGB2Lab)[..., 0] / 100
    g = 1 - (1 - l) * FORCA
    im = Image.fromarray((g * 255).round().clip(0, 255).astype(np.uint8)).convert('RGB')
    caixa = quadro_aluno(im, cor) if pagina == 2 else None
    im.save(dst, quality=92, subsampling=0)
    return caixa


if __name__ == '__main__':
    print(clarear(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 1))
