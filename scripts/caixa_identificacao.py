"""Caixa de identificação (ícone | PALAVRA | número) do cabeçalho das folhas SEI.

As coordenadas são as da moldura de 1024 px de largura (a mesma usada nos modelos Word
e no "Montar folha"). A palavra e o número são apagados da arte e passam a ser campos
editáveis, desenhados por cima com fonte parecida com a original.
"""
import numpy as np, cv2
from PIL import Image

# Layout único para todas as folhas (o mesmo do Fundamental, onde cabe "ATIVIDADES").
PALAVRA = (834, 264, 928, 302)    # x0, y0, x1, y1
SEPARADOR = (931.5, 264, 1.8, 39)  # x, y, largura, altura
NUMERO = (937, 257, 991, 309)
AREA = (833, 255, 979, 313)       # região apagada da arte (o ícone fica antes de x=833)


def cor_numero(img):
    a = np.array(img.convert('RGB')).astype(np.float32)
    x0, y0, x1, y1 = 905, 258, 990, 308
    sub = a[y0:y1, x0:x1]; L = sub.mean(2); S = sub.max(2) - sub.min(2)
    px = sub[(S > 80) & (L > 70)]
    if len(px) < 30:
        return 'E8E8E8'
    return '%02X%02X%02X' % tuple(int(v) for v in np.median(px, 0))


def apagar(img):
    """Devolve a arte sem a palavra, o separador e o número (fundo da caixa preservado)."""
    a = np.array(img.convert('RGB'))
    f = a.astype(np.float32); L = f.mean(2); S = f.max(2) - f.min(2)
    x0, y0, x1, y1 = AREA
    reg = np.zeros(L.shape, np.uint8); reg[y0:y1, x0:x1] = 1
    ink = (((L > 95) | ((S > 60) & (L > 55))) & (reg > 0)).astype(np.uint8)
    m = cv2.dilate(ink, np.ones((5, 5), np.uint8)) & reg
    out = cv2.inpaint(a, m * 255, 6, cv2.INPAINT_TELEA)
    # suaviza só a área apagada, para não ficar marca da letra antiga
    blur = cv2.GaussianBlur(out, (0, 0), 2.2)
    mm = cv2.GaussianBlur(cv2.dilate(m, np.ones((7, 7), np.uint8)).astype(np.float32), (0, 0), 2)[..., None]
    out = (out * (1 - mm) + blur * mm).astype(np.uint8)
    return Image.fromarray(out)
